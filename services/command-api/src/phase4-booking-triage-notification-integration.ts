import { createHash } from "node:crypto";
import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import type {
  LineageCaseLinkSnapshot,
  RequestSnapshot,
} from "@vecells/domain-kernel";
import { makeFoundationEvent, type FoundationEventEnvelope } from "@vecells/event-contracts";
import {
  createLifecycleCoordinatorService,
  createLifecycleCoordinatorStore,
  createSubmissionBackboneCommandService,
  type GovernedReopenRecordDocument,
  type LifecycleCoordinatorDependencies,
  type LifecycleSignalDocument,
  type SubmissionBackboneDependencies,
} from "@vecells/domain-identity-access";
import type { Phase3DirectResolutionBundle } from "@vecells/domain-triage-workspace";
import {
  createPhase1ConfirmationDispatchService,
  createPhase1ConfirmationDispatchStore,
  type Phase1ConfirmationCommunicationEnvelopeSnapshot,
  type Phase1ConfirmationDispatchRepositories,
  type Phase1ConfirmationPatientPostureState,
  type Phase1ConfirmationPreferredChannel,
  type Phase1ConfirmationReachabilityAssessmentState,
  type Phase1ConfirmationReceiptBridgeSnapshot,
  type Phase1ConfirmationRouteAuthorityState,
  type Phase1ConfirmationDeliveryRiskState,
  type Phase1NotificationProviderMode,
} from "../../../packages/domains/communications/src/index";
import {
  createPhase3DirectResolutionApplication,
  type Phase3DirectResolutionApplication,
} from "./phase3-direct-resolution-handoffs";
import {
  createPhase3ReopenLaunchApplication,
  type Phase3ReopenLaunchApplication,
  type GovernedReopenResult,
} from "./phase3-reopen-launch-leases";
import {
  createPhase3TriageKernelApplication,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";
import {
  createPhase4BookingCaseApplication,
  type Phase4BookingCaseApplication,
} from "./phase4-booking-case";
import type {
  BookingCommitApplicationResult,
  Phase4BookingCommitApplication,
} from "./phase4-booking-commit";
import { createPhase4BookingCommitApplication } from "./phase4-booking-commit";

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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export const PHASE4_BOOKING_TRIAGE_NOTIFICATION_SERVICE_NAME =
  "Phase4BookingTriageNotificationIntegrationApplication";
export const PHASE4_BOOKING_TRIAGE_NOTIFICATION_SCHEMA_VERSION =
  "306.phase4.booking-triage-notification-integration.v1";
export const PHASE4_BOOKING_TRIAGE_NOTIFICATION_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}/triage-notification/current",
] as const;

export const phase4BookingTriageNotificationRoutes = [
  {
    routeId: "booking_case_triage_notification_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}/triage-notification/current",
    contractFamily: "BookingTriageNotificationIntegrationBundleContract",
    purpose:
      "Resolve the governed BookingIntent handoff acknowledgement, current lifecycle milestone, patient-facing booking status, latest queued notification, and deep-link re-entry tuple for one booking case.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_accept_booking_handoff",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:accept-booking-handoff",
    contractFamily: "AcceptBookingTriageHandoffCommandContract",
    purpose:
      "Accept one live Phase 3 BookingIntent handoff into a Phase 4 BookingCase, acknowledge the governing LineageCaseLink, publish the handoff_active lifecycle milestone, and queue one deduplicated booking entry notification.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_refresh_triage_notification",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:refresh-triage-notification",
    contractFamily: "RefreshBookingTriageNotificationCommandContract",
    purpose:
      "Refresh one booking case against current booking truth, reconcile invalidated handoffs back to governed triage reopen when required, and queue one deduplicated patient-safe status notification.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_dispatch_latest_notification",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:dispatch-latest-notification",
    contractFamily: "DispatchBookingStatusNotificationCommandContract",
    purpose:
      "Dispatch the latest queued booking status notification through the canonical confirmation communication envelope without widening booking truth authority.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4BookingTriageNotificationPersistenceTables = [
  "phase4_booking_triage_notification_integrations",
  "phase4_booking_patient_status_projections",
  "phase4_booking_status_notifications",
  "phase1_confirmation_communication_envelopes",
  "phase1_confirmation_transport_settlements",
  "phase1_confirmation_delivery_evidence",
  "phase1_confirmation_receipt_bridges",
  "lineage_case_links",
  "request_lineages",
  "requests",
  "episodes",
  "lifecycle_signals",
  "governed_reopen_records",
] as const;

export const phase4BookingTriageNotificationMigrationPlanRefs = [
  "services/command-api/migrations/089_phase1_confirmation_dispatch_and_observability.sql",
  "services/command-api/migrations/116_phase3_direct_resolution_and_handoff_seeds.sql",
  "services/command-api/migrations/117_phase3_reopen_and_next_task_launch_leases.sql",
  "services/command-api/migrations/131_phase4_booking_case_kernel.sql",
  "services/command-api/migrations/142_phase4_booking_triage_notification_integration.sql",
] as const;

export type BookingTriageNotificationStatusCode =
  | "booking_handoff_active"
  | "booking_confirmation_pending"
  | "booking_confirmed"
  | "booking_waitlisted"
  | "booking_reopened";

export type BookingNotificationClass =
  | "handoff_entry"
  | "confirmation_pending"
  | "confirmation_confirmed"
  | "reopened_to_triage"
  | "waitlist_update";

export type BookingNotificationOriginKey = "appointments" | "requests" | "secure_link";
export type BookingNotificationRouteKey = "workspace" | "confirm" | "manage" | "waitlist";

export interface BookingStatusNotificationRouteInput {
  preferredChannel: Phase1ConfirmationPreferredChannel;
  maskedDestination: string;
  contactPreferencesRef?: string | null;
  routeSnapshotSeedRef?: string | null;
  currentContactRouteSnapshotRef?: string | null;
  currentReachabilityAssessmentRef?: string | null;
  reachabilityDependencyRef?: string | null;
  routeAuthorityState?: Phase1ConfirmationRouteAuthorityState;
  reachabilityAssessmentState?: Phase1ConfirmationReachabilityAssessmentState;
  deliveryRiskState?: Phase1ConfirmationDeliveryRiskState;
}

export interface BookingPatientStatusProjectionSnapshot {
  patientStatusProjectionId: string;
  bookingCaseId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  statusCode: BookingTriageNotificationStatusCode;
  notificationClass: BookingNotificationClass;
  bookingCaseStatus: string;
  confirmationTruthState: string | null;
  patientVisibleLabel: string;
  patientVisibleSummary: string;
  deepLinkPath: string;
  deepLinkRouteKey: BookingNotificationRouteKey;
  deepLinkOriginKey: BookingNotificationOriginKey;
  returnRouteRef: string;
  templateVariantRef: string;
  statusDigest: string;
  latestLifecycleSignalRef: string | null;
  latestReopenRecordRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BookingStatusNotificationSnapshot {
  bookingStatusNotificationId: string;
  bookingCaseId: string;
  patientStatusProjectionRef: string;
  notificationClass: BookingNotificationClass;
  dedupeKey: string;
  templateVariantRef: string;
  deepLinkPath: string;
  deepLinkOriginKey: BookingNotificationOriginKey;
  communicationEnvelopeRef: string;
  receiptBridgeRef: string;
  queueState: string;
  patientPostureState: Phase1ConfirmationPatientPostureState;
  queuedAt: string;
  updatedAt: string;
  version: number;
}

export interface BookingTriageNotificationIntegrationSnapshot {
  integrationId: string;
  bookingCaseId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  episodeRef: string;
  bookingIntentId: string;
  lineageCaseLinkRef: string;
  bookingIntentState: string;
  lineageOwnershipState: string;
  requestWorkflowState: string;
  deepLinkOriginKey: BookingNotificationOriginKey;
  returnRouteRef: string;
  latestPatientStatusProjectionRef: string;
  latestNotificationRef: string | null;
  latestLifecycleSignalRef: string | null;
  latestReopenRecordRef: string | null;
  latestCommunicationEnvelopeRef: string | null;
  latestReceiptBridgeRef: string | null;
  lifecycleFenceRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

class BookingTriageNotificationIntegrationStore {
  private readonly integrations = new Map<string, BookingTriageNotificationIntegrationSnapshot>();
  private readonly integrationByBookingCase = new Map<string, string>();
  private readonly integrationByTask = new Map<string, string>();
  private readonly patientStatus = new Map<string, BookingPatientStatusProjectionSnapshot>();
  private readonly latestStatusByBookingCase = new Map<string, string>();
  private readonly notifications = new Map<string, BookingStatusNotificationSnapshot>();
  private readonly latestNotificationByBookingCase = new Map<string, string>();
  private readonly notificationByDedupe = new Map<string, string>();

  async getIntegrationByBookingCase(
    bookingCaseId: string,
  ): Promise<BookingTriageNotificationIntegrationSnapshot | null> {
    const id = this.integrationByBookingCase.get(bookingCaseId);
    return id ? structuredClone(this.integrations.get(id) ?? null) : null;
  }

  async getIntegrationByTask(taskId: string): Promise<BookingTriageNotificationIntegrationSnapshot | null> {
    const id = this.integrationByTask.get(taskId);
    return id ? structuredClone(this.integrations.get(id) ?? null) : null;
  }

  async saveIntegration(snapshot: BookingTriageNotificationIntegrationSnapshot): Promise<void> {
    this.integrations.set(snapshot.integrationId, structuredClone(snapshot));
    this.integrationByBookingCase.set(snapshot.bookingCaseId, snapshot.integrationId);
    this.integrationByTask.set(snapshot.taskId, snapshot.integrationId);
  }

  async getPatientStatusProjection(
    patientStatusProjectionId: string,
  ): Promise<BookingPatientStatusProjectionSnapshot | null> {
    return structuredClone(this.patientStatus.get(patientStatusProjectionId) ?? null);
  }

  async getLatestPatientStatusProjectionForBookingCase(
    bookingCaseId: string,
  ): Promise<BookingPatientStatusProjectionSnapshot | null> {
    const id = this.latestStatusByBookingCase.get(bookingCaseId);
    return id ? structuredClone(this.patientStatus.get(id) ?? null) : null;
  }

  async savePatientStatusProjection(snapshot: BookingPatientStatusProjectionSnapshot): Promise<void> {
    this.patientStatus.set(snapshot.patientStatusProjectionId, structuredClone(snapshot));
    this.latestStatusByBookingCase.set(snapshot.bookingCaseId, snapshot.patientStatusProjectionId);
  }

  async getNotification(
    bookingStatusNotificationId: string,
  ): Promise<BookingStatusNotificationSnapshot | null> {
    return structuredClone(this.notifications.get(bookingStatusNotificationId) ?? null);
  }

  async getLatestNotificationForBookingCase(
    bookingCaseId: string,
  ): Promise<BookingStatusNotificationSnapshot | null> {
    const id = this.latestNotificationByBookingCase.get(bookingCaseId);
    return id ? structuredClone(this.notifications.get(id) ?? null) : null;
  }

  async findNotificationByDedupeKey(
    dedupeKey: string,
  ): Promise<BookingStatusNotificationSnapshot | null> {
    const id = this.notificationByDedupe.get(dedupeKey);
    return id ? structuredClone(this.notifications.get(id) ?? null) : null;
  }

  async saveNotification(snapshot: BookingStatusNotificationSnapshot): Promise<void> {
    this.notifications.set(snapshot.bookingStatusNotificationId, structuredClone(snapshot));
    this.latestNotificationByBookingCase.set(snapshot.bookingCaseId, snapshot.bookingStatusNotificationId);
    this.notificationByDedupe.set(snapshot.dedupeKey, snapshot.bookingStatusNotificationId);
  }
}

export interface AcceptBookingTriageHandoffInput {
  taskId: string;
  bookingCaseId?: string | null;
  patientRef: string;
  tenantId: string;
  providerContext: {
    practiceRef: string;
    supplierHintRef?: string | null;
    careSetting: string;
  };
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  acceptedAt: string;
  entryOriginKey?: BookingNotificationOriginKey;
  returnRouteRef?: string | null;
  contactRoute?: BookingStatusNotificationRouteInput | null;
}

export interface RefreshBookingTriageNotificationInput {
  bookingCaseId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  refreshedAt: string;
  contactRoute?: BookingStatusNotificationRouteInput | null;
  entryOriginKey?: BookingNotificationOriginKey;
  returnRouteRef?: string | null;
}

export interface DispatchLatestBookingStatusNotificationInput {
  bookingCaseId: string;
  workerRunRef: string;
  transportSettlementKey: string;
  transportOutcome: "accepted" | "rejected" | "timed_out";
  providerMode: Phase1NotificationProviderMode;
  providerCorrelationRef?: string | null;
  recordedAt: string;
}

export interface QueryCurrentBookingTriageNotificationInput {
  bookingCaseId: string;
}

export interface BookingTriageNotificationApplicationResult {
  integration: BookingTriageNotificationIntegrationSnapshot;
  patientStatus: BookingPatientStatusProjectionSnapshot;
  notification: BookingStatusNotificationSnapshot | null;
  communicationEnvelope: Phase1ConfirmationCommunicationEnvelopeSnapshot | null;
  receiptBridge: Phase1ConfirmationReceiptBridgeSnapshot | null;
  bookingCase: Awaited<ReturnType<Phase4BookingCaseApplication["queryBookingCase"]>>;
  bookingCommit: BookingCommitApplicationResult | null;
  directResolutionBundle: Phase3DirectResolutionBundle | null;
  lineageCaseLink: LineageCaseLinkSnapshot | null;
  requestWorkflowState: string | null;
  lifecycleSignalRef: string | null;
  lifecycleFenceEpoch: number | null;
  reopenRecordRef: string | null;
  replayed: boolean;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface Phase4BookingTriageNotificationApplication {
  readonly serviceName: typeof PHASE4_BOOKING_TRIAGE_NOTIFICATION_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE4_BOOKING_TRIAGE_NOTIFICATION_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE4_BOOKING_TRIAGE_NOTIFICATION_QUERY_SURFACES;
  readonly routes: typeof phase4BookingTriageNotificationRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly bookingCaseApplication: Phase4BookingCaseApplication;
  readonly bookingCommitApplication: Phase4BookingCommitApplication;
  readonly reopenApplication: Phase3ReopenLaunchApplication;
  readonly communicationRepositories: Phase1ConfirmationDispatchRepositories;
  readonly communication: ReturnType<typeof createPhase1ConfirmationDispatchService>;
  readonly repositories: BookingTriageNotificationIntegrationStore;
  readonly migrationPlanRef: (typeof phase4BookingTriageNotificationMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof phase4BookingTriageNotificationMigrationPlanRefs;
  queryCurrentIntegration(
    input: QueryCurrentBookingTriageNotificationInput,
  ): Promise<BookingTriageNotificationApplicationResult | null>;
  acceptBookingHandoff(
    input: AcceptBookingTriageHandoffInput,
  ): Promise<BookingTriageNotificationApplicationResult>;
  refreshBookingTriageNotification(
    input: RefreshBookingTriageNotificationInput,
  ): Promise<BookingTriageNotificationApplicationResult>;
  dispatchLatestNotification(
    input: DispatchLatestBookingStatusNotificationInput,
  ): Promise<BookingTriageNotificationApplicationResult>;
}

function signalIdFor(statusCode: BookingTriageNotificationStatusCode, bookingCaseId: string): string {
  return `lifecycle_signal::306::${bookingCaseId}::${statusCode}`;
}

function deepLinkRouteFor(
  statusCode: BookingTriageNotificationStatusCode,
): BookingNotificationRouteKey {
  switch (statusCode) {
    case "booking_confirmation_pending":
      return "confirm";
    case "booking_confirmed":
      return "manage";
    case "booking_waitlisted":
      return "waitlist";
    case "booking_reopened":
      return "workspace";
    case "booking_handoff_active":
    default:
      return "workspace";
  }
}

function defaultReturnRouteFor(originKey: BookingNotificationOriginKey): string {
  switch (originKey) {
    case "secure_link":
      return "/recovery/secure-link";
    case "requests":
      return "/requests";
    case "appointments":
    default:
      return "/appointments";
  }
}

function buildDeepLink(input: {
  bookingCaseId: string;
  statusCode: BookingTriageNotificationStatusCode;
  originKey: BookingNotificationOriginKey;
  returnRouteRef: string;
}): string {
  const routeKey = deepLinkRouteFor(input.statusCode);
  const base =
    routeKey === "workspace"
      ? `/bookings/${input.bookingCaseId}`
      : `/bookings/${input.bookingCaseId}/${routeKey}`;
  const params = new URLSearchParams({
    origin: input.originKey,
    returnRoute: input.returnRouteRef,
  });
  return `${base}?${params.toString()}`;
}

function statusLabelAndSummary(
  statusCode: BookingTriageNotificationStatusCode,
): { label: string; summary: string; notificationClass: BookingNotificationClass; template: string } {
  switch (statusCode) {
    case "booking_confirmation_pending":
      return {
        label: "Confirmation pending",
        summary:
          "The booking request was accepted for processing, but confirmation is still pending. Re-enter the booking shell to review the latest truthful status.",
        notificationClass: "confirmation_pending",
        template: "PHASE4_BOOKING_CONFIRMATION_PENDING_NOTIFICATION_V1",
      };
    case "booking_confirmed":
      return {
        label: "Appointment confirmed",
        summary:
          "The appointment is now confirmed. Re-enter the booking shell to review the summary, manage the appointment, or open booking artifacts.",
        notificationClass: "confirmation_confirmed",
        template: "PHASE4_BOOKING_CONFIRMED_NOTIFICATION_V1",
      };
    case "booking_waitlisted":
      return {
        label: "Waitlist update",
        summary:
          "The booking branch is now on the waitlist. Re-enter the booking shell to keep the current preference summary and fallback posture visible.",
        notificationClass: "waitlist_update",
        template: "PHASE4_BOOKING_WAITLIST_NOTIFICATION_V1",
      };
    case "booking_reopened":
      return {
        label: "Booking needs review again",
        summary:
          "The prior booking path can no longer continue safely. Re-enter the booking shell to see the preserved summary while triage work is reopened.",
        notificationClass: "reopened_to_triage",
        template: "PHASE4_BOOKING_REOPENED_NOTIFICATION_V1",
      };
    case "booking_handoff_active":
    default:
      return {
        label: "Booking handoff accepted",
        summary:
          "The booking handoff is now live. Re-enter the booking shell to keep the original request context and current booking status together.",
        notificationClass: "handoff_entry",
        template: "PHASE4_BOOKING_HANDOFF_NOTIFICATION_V1",
      };
  }
}

function derivePatientStatusCode(input: {
  bookingCaseStatus: string;
  confirmationTruthState: string | null;
  hasReopenRecord: boolean;
  sourceDecisionSuperseded: boolean;
  lineageOwnershipState: string | null;
}): BookingTriageNotificationStatusCode {
  if (
    input.hasReopenRecord ||
    input.sourceDecisionSuperseded ||
    input.lineageOwnershipState === "returned" ||
    input.lineageOwnershipState === "superseded"
  ) {
    return "booking_reopened";
  }
  if (input.bookingCaseStatus === "waitlisted") {
    return "booking_waitlisted";
  }
  if (
    input.confirmationTruthState === "confirmed" ||
    input.bookingCaseStatus === "managed" ||
    input.bookingCaseStatus === "booked" ||
    input.bookingCaseStatus === "closed"
  ) {
    return "booking_confirmed";
  }
  if (
    input.confirmationTruthState === "booking_in_progress" ||
    input.confirmationTruthState === "confirmation_pending" ||
    input.confirmationTruthState === "reconciliation_required" ||
    input.bookingCaseStatus === "confirmation_pending" ||
    input.bookingCaseStatus === "supplier_reconciliation_pending" ||
    input.bookingCaseStatus === "commit_pending"
  ) {
    return "booking_confirmation_pending";
  }
  return "booking_handoff_active";
}

function createLifecycleHybridRepositories(
  controlPlaneRepositories: Phase3TriageKernelApplication["controlPlaneRepositories"],
) {
  const artifacts = createLifecycleCoordinatorStore();
  const submission = controlPlaneRepositories as unknown as SubmissionBackboneDependencies;

  const repositories: LifecycleCoordinatorDependencies = {
    getRequest: (requestId) => submission.getRequest(requestId),
    listRequests: () => submission.listRequests(),
    saveRequest: (request, options) => submission.saveRequest(request, options),
    getRequestLineage: (requestLineageId) => submission.getRequestLineage(requestLineageId),
    listRequestLineages: () => submission.listRequestLineages(),
    saveRequestLineage: (lineage, options) => submission.saveRequestLineage(lineage, options),
    getLineageCaseLink: (lineageCaseLinkId) => submission.getLineageCaseLink(lineageCaseLinkId),
    saveLineageCaseLink: (link, options) => submission.saveLineageCaseLink(link, options),
    findActiveLineageCaseLinksForRequestLineage: (requestLineageRef) =>
      submission.findActiveLineageCaseLinksForRequestLineage(requestLineageRef),
    listLineageCaseLinks: () => submission.listLineageCaseLinks(),
    getEpisode: (episodeId) => submission.getEpisode(episodeId),
    listEpisodes: () => submission.listEpisodes(),
    saveEpisode: (episode, options) => submission.saveEpisode(episode, options),
    getLineageFence: (fenceId) => artifacts.getLineageFence(fenceId),
    saveLineageFence: (fence, options) => artifacts.saveLineageFence(fence, options),
    getCurrentLineageFenceForEpisode: (episodeId) => artifacts.getCurrentLineageFenceForEpisode(episodeId),
    listLineageFences: () => artifacts.listLineageFences(),
    getLifecycleSignal: (signalId) => artifacts.getLifecycleSignal(signalId),
    listLifecycleSignals: () => artifacts.listLifecycleSignals(),
    listLifecycleSignalsForEpisode: (episodeId) => artifacts.listLifecycleSignalsForEpisode(episodeId),
    listLifecycleSignalsForRequest: (requestId) => artifacts.listLifecycleSignalsForRequest(requestId),
    saveLifecycleSignal: (signal, options) => artifacts.saveLifecycleSignal(signal, options),
    getRequestClosureRecord: (closureRecordId) => artifacts.getRequestClosureRecord(closureRecordId),
    listRequestClosureRecords: () => artifacts.listRequestClosureRecords(),
    listRequestClosureRecordsForRequest: (requestId) => artifacts.listRequestClosureRecordsForRequest(requestId),
    getLatestRequestClosureRecordForRequest: (requestId) =>
      artifacts.getLatestRequestClosureRecordForRequest(requestId),
    saveRequestClosureRecord: (record, options) => artifacts.saveRequestClosureRecord(record, options),
    listGovernedReopenRecords: () => artifacts.listGovernedReopenRecords(),
    listGovernedReopenRecordsForRequest: (requestId) =>
      artifacts.listGovernedReopenRecordsForRequest(requestId),
    saveGovernedReopenRecord: (record, options) => artifacts.saveGovernedReopenRecord(record, options),
    listLifecycleCoordinatorEvents: () => artifacts.listLifecycleCoordinatorEvents(),
    appendLifecycleCoordinatorEvents: (events) => artifacts.appendLifecycleCoordinatorEvents(events),
  };

  return { repositories, artifacts };
}

export function createPhase4BookingTriageNotificationApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  directResolutionApplication?: Phase3DirectResolutionApplication;
  bookingCaseApplication?: Phase4BookingCaseApplication;
  bookingCommitApplication?: Phase4BookingCommitApplication;
  reopenApplication?: Phase3ReopenLaunchApplication;
  communicationRepositories?: Phase1ConfirmationDispatchRepositories;
  repositories?: BookingTriageNotificationIntegrationStore;
  idGenerator?: BackboneIdGenerator;
}): Phase4BookingTriageNotificationApplication {
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_phase4_booking_triage_notification");
  const triageApplication =
    options?.triageApplication ?? createPhase3TriageKernelApplication({ idGenerator });
  const directResolutionApplication =
    options?.directResolutionApplication ??
    createPhase3DirectResolutionApplication({
      idGenerator,
      triageApplication,
    });
  const bookingCaseApplication =
    options?.bookingCaseApplication ??
    createPhase4BookingCaseApplication({
      idGenerator,
      directResolutionApplication,
    });
  const bookingCommitApplication =
    options?.bookingCommitApplication ??
    createPhase4BookingCommitApplication({
      idGenerator,
      bookingCaseApplication,
    });
  const reopenApplication =
    options?.reopenApplication ??
    createPhase3ReopenLaunchApplication({
      idGenerator,
      triageApplication,
      directResolutionApplication,
      endpointApplication: directResolutionApplication.endpointApplication,
      approvalApplication: directResolutionApplication.approvalApplication,
    });
  const communicationRepositories =
    options?.communicationRepositories ?? createPhase1ConfirmationDispatchStore();
  const communication = createPhase1ConfirmationDispatchService({
    repositories: communicationRepositories,
    idGenerator,
  });
  const repositories = options?.repositories ?? new BookingTriageNotificationIntegrationStore();
  const submissionRepositories =
    triageApplication.controlPlaneRepositories as unknown as SubmissionBackboneDependencies;
  const submissionCommands = createSubmissionBackboneCommandService(
    submissionRepositories,
    idGenerator,
  );
  const lifecycleHybrid = createLifecycleHybridRepositories(triageApplication.controlPlaneRepositories);
  const lifecycleAuthority = createLifecycleCoordinatorService(lifecycleHybrid.repositories, idGenerator);

  async function queryDirectResolution(taskId: string): Promise<Phase3DirectResolutionBundle | null> {
    return directResolutionApplication.queryTaskDirectResolution(taskId).catch(() => null);
  }

  async function queryBookingCommit(
    bookingCaseId: string,
  ): Promise<BookingCommitApplicationResult | null> {
    return bookingCommitApplication.queryCurrentBookingCommit({ bookingCaseId }).catch(() => null);
  }

  async function requireLineageCaseLink(lineageCaseLinkRef: string): Promise<LineageCaseLinkSnapshot> {
    const link = await submissionRepositories.getLineageCaseLink(lineageCaseLinkRef);
    invariant(
      link,
      "LINEAGE_CASE_LINK_NOT_FOUND",
      `LineageCaseLink ${lineageCaseLinkRef} was not found.`,
    );
    return link.toSnapshot() as LineageCaseLinkSnapshot;
  }

  async function requireRequest(requestId: string): Promise<RequestSnapshot> {
    const request = await triageApplication.controlPlaneRepositories.getRequest(requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${requestId} was not found.`);
    return request.toSnapshot() as RequestSnapshot;
  }

  async function ensureLifecyclePartition(episodeRef: string, issuedAt: string, initialEpoch: number) {
    const fence = await lifecycleAuthority.initializeLifecyclePartition({
      episodeId: episodeRef,
      issuedAt,
      initialEpoch,
    });
    return fence;
  }

  async function maybeAcknowledgeLineageCaseLink(input: {
    lineageCaseLinkRef: string;
    updatedAt: string;
    latestMilestoneRef: string;
  }): Promise<LineageCaseLinkSnapshot> {
    const current = await requireLineageCaseLink(input.lineageCaseLinkRef);
    if (current.ownershipState === "acknowledged" || current.ownershipState === "active") {
      return current;
    }
    if (current.ownershipState !== "proposed") {
      return current;
    }
    const transitioned = await submissionCommands.transitionLineageCaseLink({
      lineageCaseLinkId: input.lineageCaseLinkRef,
      nextState: "acknowledged",
      updatedAt: input.updatedAt,
      latestMilestoneRef: input.latestMilestoneRef,
      currentClosureBlockerRefs: [input.lineageCaseLinkRef],
      currentConfirmationGateRefs: [],
    });
    return transitioned.link.toSnapshot() as LineageCaseLinkSnapshot;
  }

  async function maybeReturnLineageCaseLink(input: {
    lineageCaseLinkRef: string;
    updatedAt: string;
    returnToTriageRef: string;
    latestMilestoneRef: string;
  }): Promise<LineageCaseLinkSnapshot> {
    const current = await requireLineageCaseLink(input.lineageCaseLinkRef);
    if (
      current.ownershipState === "returned" ||
      current.ownershipState === "closed" ||
      current.ownershipState === "superseded" ||
      current.ownershipState === "compensated"
    ) {
      return current;
    }
    try {
      const transitioned = await submissionCommands.transitionLineageCaseLink({
        lineageCaseLinkId: input.lineageCaseLinkRef,
        nextState: "returned",
        updatedAt: input.updatedAt,
        returnToTriageRef: input.returnToTriageRef,
        latestMilestoneRef: input.latestMilestoneRef,
        currentClosureBlockerRefs: [],
        currentConfirmationGateRefs: [],
      });
      return transitioned.link.toSnapshot() as LineageCaseLinkSnapshot;
    } catch (error) {
      const summaryMismatch =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === "REQUEST_LINEAGE_LINK_SUMMARY_MISMATCH";
      if (!summaryMismatch) {
        throw error;
      }

      const currentLink = await submissionRepositories.getLineageCaseLink(input.lineageCaseLinkRef);
      invariant(
        currentLink,
        "LINEAGE_CASE_LINK_NOT_FOUND",
        `LineageCaseLink ${input.lineageCaseLinkRef} was not found.`,
      );
      const repairedFacts = currentLink.refreshOperationalFacts({
        currentClosureBlockerRefs: [],
        currentConfirmationGateRefs: [],
        latestMilestoneRef: input.latestMilestoneRef,
        updatedAt: input.updatedAt,
      });
      const repaired =
        repairedFacts.ownershipState === "returned" ||
        repairedFacts.ownershipState === "closed" ||
        repairedFacts.ownershipState === "superseded" ||
        repairedFacts.ownershipState === "compensated"
          ? repairedFacts
          : repairedFacts.transition({
              nextState: "returned",
              updatedAt: input.updatedAt,
              returnToTriageRef: input.returnToTriageRef,
            });
      await submissionRepositories.saveLineageCaseLink(repaired, {
        expectedVersion: currentLink.version,
      });
      return repaired.toSnapshot() as LineageCaseLinkSnapshot;
    }
  }

  async function recordLifecycleMilestone(input: {
    bookingCaseId: string;
    episodeRef: string;
    requestId: string;
    requestLineageRef: string;
    lineageCaseLinkRef: string;
    statusCode: BookingTriageNotificationStatusCode;
    confirmationTruthState: string | null;
    recordedAt: string;
    reopenRecordRef?: string | null;
  }) {
    const currentFence = await ensureLifecyclePartition(
      input.episodeRef,
      input.recordedAt,
      1,
    );
    const signalSeed = signalIdFor(input.statusCode, input.bookingCaseId);
    switch (input.statusCode) {
      case "booking_confirmation_pending":
        return lifecycleAuthority.recordLifecycleSignal({
          signalId: signalSeed,
          episodeId: input.episodeRef,
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          sourceDomain: "booking",
          signalFamily: "confirmation",
          signalType: "booking.confirmation.pending",
          domainObjectRef: input.bookingCaseId,
          milestoneHint: "handoff_active",
          currentConfirmationGateRefs: [
            input.confirmationTruthState
              ? `confirmation_truth::${input.bookingCaseId}::${input.confirmationTruthState}`
              : `confirmation_truth::${input.bookingCaseId}::pending`,
          ],
          blockingConfirmationRefs: [
            input.confirmationTruthState
              ? `confirmation_truth::${input.bookingCaseId}::${input.confirmationTruthState}`
              : `confirmation_truth::${input.bookingCaseId}::pending`,
          ],
          blockingLineageCaseLinkRefs: [input.lineageCaseLinkRef],
          terminalOutcomeRef: null,
          presentedLineageEpoch: currentFence.currentEpoch,
          occurredAt: input.recordedAt,
          causalTokenRef: `causal::${signalSeed}`,
        });
      case "booking_confirmed":
        return lifecycleAuthority.recordLifecycleSignal({
          signalId: signalSeed,
          episodeId: input.episodeRef,
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          sourceDomain: "booking",
          signalFamily: "terminal_outcome",
          signalType: "booking.confirmed",
          domainObjectRef: input.bookingCaseId,
          milestoneHint: "outcome_recorded",
          currentConfirmationGateRefs: [],
          blockingConfirmationRefs: [],
          blockingLineageCaseLinkRefs: [],
          terminalOutcomeRef: `outcome://booking/confirmed/${input.bookingCaseId}`,
          presentedLineageEpoch: currentFence.currentEpoch,
          occurredAt: input.recordedAt,
          causalTokenRef: `causal::${signalSeed}`,
        });
      case "booking_reopened":
        return lifecycleAuthority.recordLifecycleSignal({
          signalId: signalSeed,
          episodeId: input.episodeRef,
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          sourceDomain: "recovery",
          signalFamily: "reopen",
          signalType: "booking.reopened.to_triage",
          domainObjectRef: input.bookingCaseId,
          milestoneHint: "triage_active",
          reopenTriggerFamily: "booking_dispute",
          reopenTargetState: "triage_active",
          presentedLineageEpoch: currentFence.currentEpoch,
          occurredAt: input.recordedAt,
          causalTokenRef: `causal::${signalSeed}`,
          returnCount: 1,
          uUnable: 0.55,
          deltaTiming: 0.4,
          sameShellRecoveryRouteRef: `/bookings/${input.bookingCaseId}`,
          terminalOutcomeRef: null,
        });
      case "booking_waitlisted":
        return lifecycleAuthority.recordLifecycleSignal({
          signalId: signalSeed,
          episodeId: input.episodeRef,
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          sourceDomain: "booking",
          signalFamily: "blocker",
          signalType: "booking.waitlisted",
          domainObjectRef: input.bookingCaseId,
          milestoneHint: "handoff_active",
          blockingFallbackCaseRefs: [`waitlist::${input.bookingCaseId}`],
          blockingLineageCaseLinkRefs: [input.lineageCaseLinkRef],
          terminalOutcomeRef: null,
          presentedLineageEpoch: currentFence.currentEpoch,
          occurredAt: input.recordedAt,
          causalTokenRef: `causal::${signalSeed}`,
        });
      case "booking_handoff_active":
      default:
        return lifecycleAuthority.recordLifecycleSignal({
          signalId: signalSeed,
          episodeId: input.episodeRef,
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          sourceDomain: "booking",
          signalFamily: "lineage_case",
          signalType: "booking.handoff.accepted",
          domainObjectRef: input.bookingCaseId,
          milestoneHint: "handoff_active",
          blockingLineageCaseLinkRefs: [input.lineageCaseLinkRef],
          terminalOutcomeRef: null,
          presentedLineageEpoch: currentFence.currentEpoch,
          occurredAt: input.recordedAt,
          causalTokenRef: `causal::${signalSeed}`,
        });
    }
  }

  async function maybeQueueNotification(input: {
    bookingCaseId: string;
    taskId: string;
    requestId: string;
    requestLineageRef: string;
    statusProjection: BookingPatientStatusProjectionSnapshot;
    contactRoute: BookingStatusNotificationRouteInput | null;
    queuedAt: string;
  }): Promise<BookingStatusNotificationSnapshot | null> {
    const dedupeKey = `booking_triage_notification::${input.requestId}::${input.statusProjection.statusDigest}`;
    const existing = await repositories.findNotificationByDedupeKey(dedupeKey);
    if (existing) {
      return existing;
    }

    const route = input.contactRoute;
    const queued = await communication.queueConfirmationCommunication({
      requestRef: input.requestId,
      requestLineageRef: input.requestLineageRef,
      triageTaskRef: input.taskId,
      receiptEnvelopeRef: `booking_status_receipt::${input.bookingCaseId}::${input.statusProjection.statusCode}`,
      outcomeArtifactRef: input.statusProjection.patientStatusProjectionId,
      contactPreferencesRef: route?.contactPreferencesRef ?? null,
      routeSnapshotSeedRef: route?.routeSnapshotSeedRef ?? null,
      currentContactRouteSnapshotRef: route?.currentContactRouteSnapshotRef ?? null,
      currentReachabilityAssessmentRef: route?.currentReachabilityAssessmentRef ?? null,
      reachabilityDependencyRef: route?.reachabilityDependencyRef ?? null,
      preferredChannel: route?.preferredChannel ?? "sms",
      maskedDestination: route?.maskedDestination ?? "Not provided",
      templateVariantRef: input.statusProjection.templateVariantRef,
      routeAuthorityState: route?.routeAuthorityState ?? "unknown",
      reachabilityAssessmentState: route?.reachabilityAssessmentState ?? "blocked",
      deliveryRiskState: route?.deliveryRiskState ?? "unknown",
      enqueueIdempotencyKey: dedupeKey,
      queuedAt: input.queuedAt,
    });
    const bridgeSnapshot = queued.receiptBridge.toSnapshot();
    const envelopeSnapshot = queued.envelope.toSnapshot();
    const notification: BookingStatusNotificationSnapshot = {
      bookingStatusNotificationId: nextId(idGenerator, "booking_status_notification"),
      bookingCaseId: input.bookingCaseId,
      patientStatusProjectionRef: input.statusProjection.patientStatusProjectionId,
      notificationClass: input.statusProjection.notificationClass,
      dedupeKey,
      templateVariantRef: input.statusProjection.templateVariantRef,
      deepLinkPath: input.statusProjection.deepLinkPath,
      deepLinkOriginKey: input.statusProjection.deepLinkOriginKey,
      communicationEnvelopeRef: envelopeSnapshot.communicationEnvelopeId,
      receiptBridgeRef: bridgeSnapshot.receiptBridgeId,
      queueState: envelopeSnapshot.queueState,
      patientPostureState: bridgeSnapshot.patientPostureState,
      queuedAt: input.queuedAt,
      updatedAt: input.queuedAt,
      version: 1,
    };
    await repositories.saveNotification(notification);
    return notification;
  }

  async function materializeStatusProjection(input: {
    bookingCaseId: string;
    taskId: string;
    requestId: string;
    requestLineageRef: string;
    lineageCaseLinkRef: string;
    bookingCaseStatus: string;
    confirmationTruthState: string | null;
    hasReopenRecord: boolean;
    sourceDecisionSuperseded: boolean;
    lineageOwnershipState: string | null;
    entryOriginKey: BookingNotificationOriginKey;
    returnRouteRef: string;
    recordedAt: string;
  }): Promise<BookingPatientStatusProjectionSnapshot> {
    const statusCode = derivePatientStatusCode({
      bookingCaseStatus: input.bookingCaseStatus,
      confirmationTruthState: input.confirmationTruthState,
      hasReopenRecord: input.hasReopenRecord,
      sourceDecisionSuperseded: input.sourceDecisionSuperseded,
      lineageOwnershipState: input.lineageOwnershipState,
    });
    const copy = statusLabelAndSummary(statusCode);
    const deepLinkPath = buildDeepLink({
      bookingCaseId: input.bookingCaseId,
      statusCode,
      originKey: input.entryOriginKey,
      returnRouteRef: input.returnRouteRef,
    });
    const statusDigest = sha256({
      bookingCaseId: input.bookingCaseId,
      statusCode,
      bookingCaseStatus: input.bookingCaseStatus,
      confirmationTruthState: input.confirmationTruthState,
      deepLinkPath,
      lineageOwnershipState: input.lineageOwnershipState,
    });
    const existing = await repositories.getLatestPatientStatusProjectionForBookingCase(input.bookingCaseId);
    if (existing && existing.statusDigest === statusDigest) {
      return {
        ...existing,
        updatedAt: input.recordedAt,
      };
    }
    return {
      patientStatusProjectionId: nextId(idGenerator, "booking_patient_status_projection"),
      bookingCaseId: input.bookingCaseId,
      taskId: input.taskId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      lineageCaseLinkRef: input.lineageCaseLinkRef,
      statusCode,
      notificationClass: copy.notificationClass,
      bookingCaseStatus: input.bookingCaseStatus,
      confirmationTruthState: input.confirmationTruthState,
      patientVisibleLabel: copy.label,
      patientVisibleSummary: copy.summary,
      deepLinkPath,
      deepLinkRouteKey: deepLinkRouteFor(statusCode),
      deepLinkOriginKey: input.entryOriginKey,
      returnRouteRef: input.returnRouteRef,
      templateVariantRef: copy.template,
      statusDigest,
      latestLifecycleSignalRef: null,
      latestReopenRecordRef: null,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  async function buildResult(
    integration: BookingTriageNotificationIntegrationSnapshot,
    replayed: boolean,
    emittedEvents: readonly FoundationEventEnvelope<object>[],
  ): Promise<BookingTriageNotificationApplicationResult> {
    const patientStatus = await repositories.getPatientStatusProjection(
      integration.latestPatientStatusProjectionRef,
    );
    invariant(
      patientStatus,
      "PATIENT_STATUS_PROJECTION_NOT_FOUND",
      `BookingPatientStatusProjection ${integration.latestPatientStatusProjectionRef} was not found.`,
    );
    const notification =
      integration.latestNotificationRef !== null
        ? await repositories.getNotification(integration.latestNotificationRef)
        : null;
    const communicationEnvelope =
      notification !== null
        ? (
            await communication.getCommunicationEnvelope(notification.communicationEnvelopeRef)
          )?.toSnapshot() ?? null
        : null;
    const receiptBridge =
      notification !== null
        ? (
            await communication.getReceiptBridgeForCommunicationEnvelope(
              notification.communicationEnvelopeRef,
            )
          )?.toSnapshot() ?? null
        : null;
    const bookingCase = await bookingCaseApplication.queryBookingCase(integration.bookingCaseId);
    const bookingCommit = await queryBookingCommit(integration.bookingCaseId);
    const directResolutionBundle = await queryDirectResolution(integration.taskId);
    const lineageCaseLink = await submissionRepositories
      .getLineageCaseLink(integration.lineageCaseLinkRef)
      .then((document) => (document?.toSnapshot() as LineageCaseLinkSnapshot | undefined) ?? null);
    const requestWorkflowState = await triageApplication.controlPlaneRepositories
      .getRequest(integration.requestId)
      .then((document) => ((document?.toSnapshot() as RequestSnapshot | undefined)?.workflowState ?? null));
    const lifecycleFenceEpoch =
      integration.lifecycleFenceRef !== null
        ? (
            await lifecycleHybrid.artifacts.getLineageFence(integration.lifecycleFenceRef)
          )?.currentEpoch ?? null
        : null;

    return {
      integration,
      patientStatus,
      notification,
      communicationEnvelope,
      receiptBridge,
      bookingCase,
      bookingCommit,
      directResolutionBundle,
      lineageCaseLink,
      requestWorkflowState,
      lifecycleSignalRef: integration.latestLifecycleSignalRef,
      lifecycleFenceEpoch,
      reopenRecordRef: integration.latestReopenRecordRef,
      replayed,
      emittedEvents,
    };
  }

  async function persistIntegrationSnapshot(input: {
    existing: BookingTriageNotificationIntegrationSnapshot | null;
    bookingCaseId: string;
    taskId: string;
    requestId: string;
    requestLineageRef: string;
    episodeRef: string;
    bookingIntentId: string;
    lineageCaseLinkRef: string;
    bookingIntentState: string;
    lineageOwnershipState: string;
    requestWorkflowState: string;
    deepLinkOriginKey: BookingNotificationOriginKey;
    returnRouteRef: string;
    latestPatientStatusProjectionRef: string;
    latestNotificationRef: string | null;
    latestLifecycleSignalRef: string | null;
    latestReopenRecordRef: string | null;
    latestCommunicationEnvelopeRef: string | null;
    latestReceiptBridgeRef: string | null;
    lifecycleFenceRef: string | null;
    recordedAt: string;
  }): Promise<BookingTriageNotificationIntegrationSnapshot> {
    const existing = input.existing;
    const snapshot: BookingTriageNotificationIntegrationSnapshot = {
      integrationId: existing?.integrationId ?? nextId(idGenerator, "booking_triage_notification_integration"),
      bookingCaseId: input.bookingCaseId,
      taskId: input.taskId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      bookingIntentId: input.bookingIntentId,
      lineageCaseLinkRef: input.lineageCaseLinkRef,
      bookingIntentState: input.bookingIntentState,
      lineageOwnershipState: input.lineageOwnershipState,
      requestWorkflowState: input.requestWorkflowState,
      deepLinkOriginKey: input.deepLinkOriginKey,
      returnRouteRef: input.returnRouteRef,
      latestPatientStatusProjectionRef: input.latestPatientStatusProjectionRef,
      latestNotificationRef: input.latestNotificationRef,
      latestLifecycleSignalRef: input.latestLifecycleSignalRef,
      latestReopenRecordRef: input.latestReopenRecordRef,
      latestCommunicationEnvelopeRef: input.latestCommunicationEnvelopeRef,
      latestReceiptBridgeRef: input.latestReceiptBridgeRef,
      lifecycleFenceRef: input.lifecycleFenceRef,
      createdAt: existing?.createdAt ?? input.recordedAt,
      updatedAt: input.recordedAt,
      version: (existing?.version ?? 0) + 1,
    };
    await repositories.saveIntegration(snapshot);
    return snapshot;
  }

  async function reconcileCurrentState(input: {
    existing: BookingTriageNotificationIntegrationSnapshot | null;
    bookingCaseId: string;
    actorRef: string;
    routeIntentBindingRef: string;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    recordedAt: string;
    contactRoute: BookingStatusNotificationRouteInput | null;
    entryOriginKey: BookingNotificationOriginKey;
    returnRouteRef: string;
  }): Promise<BookingTriageNotificationApplicationResult> {
    const bookingCase = await bookingCaseApplication.queryBookingCase(input.bookingCaseId);
    invariant(bookingCase, "BOOKING_CASE_NOT_FOUND", `BookingCase ${input.bookingCaseId} was not found.`);
    const lineagelinkBefore = await requireLineageCaseLink(bookingCase.bookingCase.lineageCaseLinkRef);
    const directResolutionBundle = await queryDirectResolution(bookingCase.bookingCase.originTriageTaskRef);
    const bookingCommit = await queryBookingCommit(input.bookingCaseId);
    const sourceDecisionSuperseded =
      bookingCase.bookingCase.sourceDecisionSupersessionRef !== null ||
      bookingCase.bookingIntent.decisionSupersessionRecordRef !== null ||
      optionalRef(directResolutionBundle?.bookingIntent?.decisionSupersessionRecordRef) !== null;

    let reopenResult: GovernedReopenResult | null = null;
    let lineagelink = lineagelinkBefore;
    if (
      sourceDecisionSuperseded &&
      lineagelink.ownershipState !== "returned" &&
      lineagelink.ownershipState !== "superseded"
    ) {
      reopenResult = await reopenApplication.reopenFromInvalidation({
        taskId: bookingCase.bookingCase.originTriageTaskRef,
        actorRef: input.actorRef,
        recordedAt: input.recordedAt,
        sourceDomain: "booking_handoff",
        reasonCode: "booking_handoff_superseded",
        supersededDecisionEpochRef:
          bookingCase.bookingCase.sourceDecisionEpochRef,
      });
      lineagelink = await maybeReturnLineageCaseLink({
        lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
        updatedAt: input.recordedAt,
        returnToTriageRef: reopenResult.reopenRecord.reopenRecordId,
        latestMilestoneRef: `milestone://booking/reopened/${bookingCase.bookingCase.bookingCaseId}`,
      });
    } else if (
      (bookingCommit?.confirmationTruthProjection.confirmationTruthState === "failed" ||
        bookingCommit?.confirmationTruthProjection.confirmationTruthState === "expired" ||
        bookingCommit?.confirmationTruthProjection.confirmationTruthState === "superseded" ||
        bookingCase.bookingCase.status === "booking_failed") &&
      lineagelink.ownershipState !== "returned" &&
      lineagelink.ownershipState !== "superseded"
    ) {
      reopenResult = await reopenApplication.reopenFromHandoff({
        taskId: bookingCase.bookingCase.originTriageTaskRef,
        actorRef: input.actorRef,
        recordedAt: input.recordedAt,
        reasonCode: "booking_handoff_unable_to_complete",
        sourceDomain: "booking_handoff",
      });
      lineagelink = await maybeReturnLineageCaseLink({
        lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
        updatedAt: input.recordedAt,
        returnToTriageRef: reopenResult.reopenRecord.reopenRecordId,
        latestMilestoneRef: `milestone://booking/reopened/${bookingCase.bookingCase.bookingCaseId}`,
      });
    }

    const requestBefore = await requireRequest(bookingCase.bookingCase.requestId);
    let patientStatus = await materializeStatusProjection({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      taskId: bookingCase.bookingCase.originTriageTaskRef,
      requestId: bookingCase.bookingCase.requestId,
      requestLineageRef: bookingCase.bookingCase.requestLineageRef,
      lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
      bookingCaseStatus: bookingCase.bookingCase.status,
      confirmationTruthState:
        bookingCommit?.confirmationTruthProjection.confirmationTruthState ??
        (bookingCase.bookingCase.status === "confirmation_pending"
          ? "confirmation_pending"
          : bookingCase.bookingCase.status === "managed" ||
              bookingCase.bookingCase.status === "booked"
            ? "confirmed"
            : null),
      hasReopenRecord: reopenResult !== null,
      sourceDecisionSuperseded,
      lineageOwnershipState: lineagelink.ownershipState,
      entryOriginKey: input.entryOriginKey,
      returnRouteRef: input.returnRouteRef,
      recordedAt: input.recordedAt,
    });

    const lifecycle = await recordLifecycleMilestone({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      episodeRef: bookingCase.bookingCase.episodeRef,
      requestId: bookingCase.bookingCase.requestId,
      requestLineageRef: bookingCase.bookingCase.requestLineageRef,
      lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
      statusCode: patientStatus.statusCode,
      confirmationTruthState: patientStatus.confirmationTruthState,
      recordedAt: input.recordedAt,
      reopenRecordRef: reopenResult?.reopenRecord.reopenRecordId ?? null,
    });
    patientStatus = {
      ...patientStatus,
      latestLifecycleSignalRef: lifecycle.signal.signalId,
      latestReopenRecordRef: reopenResult?.reopenRecord.reopenRecordId ?? null,
    };
    await repositories.savePatientStatusProjection(patientStatus);

    const notification = await maybeQueueNotification({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      taskId: bookingCase.bookingCase.originTriageTaskRef,
      requestId: bookingCase.bookingCase.requestId,
      requestLineageRef: bookingCase.bookingCase.requestLineageRef,
      statusProjection: patientStatus,
      contactRoute: input.contactRoute,
      queuedAt: input.recordedAt,
    });
    const requestAfter = await requireRequest(bookingCase.bookingCase.requestId);
    const integration = await persistIntegrationSnapshot({
      existing: input.existing,
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
      taskId: bookingCase.bookingCase.originTriageTaskRef,
      requestId: bookingCase.bookingCase.requestId,
      requestLineageRef: bookingCase.bookingCase.requestLineageRef,
      episodeRef: bookingCase.bookingCase.episodeRef,
      bookingIntentId: bookingCase.bookingIntent.intentId,
      lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
      bookingIntentState: bookingCase.bookingIntent.intentState,
      lineageOwnershipState: lineagelink.ownershipState,
      requestWorkflowState: requestAfter.workflowState,
      deepLinkOriginKey: input.entryOriginKey,
      returnRouteRef: input.returnRouteRef,
      latestPatientStatusProjectionRef: patientStatus.patientStatusProjectionId,
      latestNotificationRef: notification?.bookingStatusNotificationId ?? null,
      latestLifecycleSignalRef: lifecycle.signal.signalId,
      latestReopenRecordRef: reopenResult?.reopenRecord.reopenRecordId ?? null,
      latestCommunicationEnvelopeRef: notification?.communicationEnvelopeRef ?? null,
      latestReceiptBridgeRef: notification?.receiptBridgeRef ?? null,
      lifecycleFenceRef: lifecycle.currentFence.fenceId,
      recordedAt: input.recordedAt,
    });

    const events: FoundationEventEnvelope<object>[] = [
      makeFoundationEvent("booking.triage_notification.status_projected", {
        governingRef: integration.bookingCaseId,
        governingVersionRef: patientStatus.patientStatusProjectionId,
        previousState: input.existing?.latestPatientStatusProjectionRef ?? "none",
        nextState: patientStatus.statusCode,
        stateAxis: "booking_patient_status",
        requestWorkflowStateBefore: requestBefore.workflowState,
        requestWorkflowStateAfter: requestAfter.workflowState,
      }),
    ];
    if (notification) {
      events.push(
        makeFoundationEvent("booking.triage_notification.queued", {
          governingRef: integration.bookingCaseId,
          governingVersionRef: notification.bookingStatusNotificationId,
          previousState: "not_queued",
          nextState: notification.notificationClass,
          stateAxis: "booking_status_notification",
          communicationEnvelopeRef: notification.communicationEnvelopeRef,
        }),
      );
    }
    if (reopenResult) {
      events.push(
        makeFoundationEvent("booking.triage_notification.reopened", {
          governingRef: integration.bookingCaseId,
          governingVersionRef: reopenResult.reopenRecord.reopenRecordId,
          previousState: "handoff_active",
          nextState: "triage_reopened",
          stateAxis: "booking_handoff_recovery",
        }),
      );
    }

    return buildResult(integration, false, events);
  }

  return {
    serviceName: PHASE4_BOOKING_TRIAGE_NOTIFICATION_SERVICE_NAME,
    schemaVersion: PHASE4_BOOKING_TRIAGE_NOTIFICATION_SCHEMA_VERSION,
    querySurfaces: PHASE4_BOOKING_TRIAGE_NOTIFICATION_QUERY_SURFACES,
    routes: phase4BookingTriageNotificationRoutes,
    triageApplication,
    directResolutionApplication,
    bookingCaseApplication,
    bookingCommitApplication,
    reopenApplication,
    communicationRepositories,
    communication,
    repositories,
    migrationPlanRef: phase4BookingTriageNotificationMigrationPlanRefs.at(-1)!,
    migrationPlanRefs: phase4BookingTriageNotificationMigrationPlanRefs,

    async queryCurrentIntegration(input) {
      const existing = await repositories.getIntegrationByBookingCase(input.bookingCaseId);
      if (!existing) {
        return null;
      }
      return buildResult(existing, false, []);
    },

    async acceptBookingHandoff(input) {
      const taskId = requireRef(input.taskId, "taskId");
      const acceptedAt = ensureIsoTimestamp(input.acceptedAt, "acceptedAt");
      const existing = await repositories.getIntegrationByTask(taskId);
      if (existing) {
        return buildResult(existing, true, []);
      }

      const created = await bookingCaseApplication.createBookingCaseFromTaskHandoff({
        taskId,
        bookingCaseId: optionalRef(input.bookingCaseId) ?? undefined,
        patientRef: requireRef(input.patientRef, "patientRef"),
        tenantId: requireRef(input.tenantId, "tenantId"),
        providerContext: {
          practiceRef: requireRef(input.providerContext.practiceRef, "providerContext.practiceRef"),
          supplierHintRef: optionalRef(input.providerContext.supplierHintRef),
          careSetting: requireRef(input.providerContext.careSetting, "providerContext.careSetting"),
        },
        actorRef: requireRef(input.actorRef, "actorRef"),
        routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
        commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          input.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        createdAt: acceptedAt,
        surfaceRouteContractRef: "booking_triage_notification_surface_contract_v1",
        surfacePublicationRef: `booking_triage_notification_surface_publication::${taskId}`,
        runtimePublicationBundleRef: `booking_triage_notification_runtime_publication::${taskId}`,
      });
      await maybeAcknowledgeLineageCaseLink({
        lineageCaseLinkRef: created.bookingCase.lineageCaseLinkRef,
        updatedAt: acceptedAt,
        latestMilestoneRef: `milestone://booking/handoff_acknowledged/${created.bookingCase.bookingCaseId}`,
      });
      return reconcileCurrentState({
        existing: null,
        bookingCaseId: created.bookingCase.bookingCaseId,
        actorRef: input.actorRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: acceptedAt,
        contactRoute: input.contactRoute ?? null,
        entryOriginKey: input.entryOriginKey ?? "appointments",
        returnRouteRef:
          optionalRef(input.returnRouteRef) ??
          defaultReturnRouteFor(input.entryOriginKey ?? "appointments"),
      });
    },

    async refreshBookingTriageNotification(input) {
      const existing = await repositories.getIntegrationByBookingCase(input.bookingCaseId);
      return reconcileCurrentState({
        existing,
        bookingCaseId: requireRef(input.bookingCaseId, "bookingCaseId"),
        actorRef: requireRef(input.actorRef, "actorRef"),
        routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
        commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          input.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        recordedAt: ensureIsoTimestamp(input.refreshedAt, "refreshedAt"),
        contactRoute: input.contactRoute ?? null,
        entryOriginKey:
          input.entryOriginKey ??
          existing?.deepLinkOriginKey ??
          "appointments",
        returnRouteRef:
          optionalRef(input.returnRouteRef) ??
          existing?.returnRouteRef ??
          defaultReturnRouteFor(input.entryOriginKey ?? existing?.deepLinkOriginKey ?? "appointments"),
      });
    },

    async dispatchLatestNotification(input) {
      const existing = await repositories.getIntegrationByBookingCase(input.bookingCaseId);
      invariant(existing, "BOOKING_TRIAGE_NOTIFICATION_NOT_FOUND", "Integration snapshot is required.");
      const latest = await repositories.getLatestNotificationForBookingCase(input.bookingCaseId);
      invariant(latest, "BOOKING_STATUS_NOTIFICATION_NOT_FOUND", "Latest booking status notification is required.");
      await communication.dispatchQueuedConfirmation({
        communicationEnvelopeRef: latest.communicationEnvelopeRef,
        workerRunRef: requireRef(input.workerRunRef, "workerRunRef"),
        transportSettlementKey: requireRef(input.transportSettlementKey, "transportSettlementKey"),
        transportOutcome: input.transportOutcome,
        providerMode: input.providerMode,
        providerCorrelationRef: optionalRef(input.providerCorrelationRef) ?? undefined,
        recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      });
      return buildResult(existing, false, []);
    },
  };
}
