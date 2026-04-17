import {
  createPhase3ConversationControlApplication,
  phase3ConversationControlMigrationPlanRefs,
  phase3ConversationControlPersistenceTables,
  type Phase3ConversationControlApplication,
} from "./phase3-conversation-control";
import {
  createPhase3CommunicationReachabilityRepairApplication,
  phase3CommunicationRepairMigrationPlanRefs,
  phase3CommunicationRepairPersistenceTables,
  type CommunicationRepairBindingBundle,
  type Phase3CommunicationRepairApplication,
  type Phase3CommunicationRepairTaskBundle,
} from "./phase3-communication-reachability-repair";
import {
  createPhase3ClinicianMessageDomainApplication,
  phase3ClinicianMessageMigrationPlanRefs,
  phase3ClinicianMessagePersistenceTables,
  type Phase3ClinicianMessageApplicationBundle,
  type Phase3ClinicianMessageDomainApplication,
} from "./phase3-clinician-message-domain";
import {
  createPhase3CallbackDomainApplication,
  phase3CallbackMigrationPlanRefs,
  phase3CallbackPersistenceTables,
  type Phase3CallbackApplicationBundle,
  type Phase3CallbackDomainApplication,
} from "./phase3-callback-domain";
import {
  createPhase3MoreInfoKernelApplication,
  phase3MoreInfoKernelMigrationPlanRefs,
  phase3MoreInfoKernelPersistenceTables,
  type Phase3MoreInfoKernelApplication,
} from "./phase3-more-info-kernel";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  type Phase3ConversationControlClusterBundle,
  createPhase3PatientConversationTupleService,
  type CommunicationDeliveryEvidenceState,
  type CommunicationTransportAckState,
  type ConversationAuthoritativeOutcomeState,
  type ConversationDeliveryRiskState,
  type LegacyConversationBackfillRowInput,
  type NormalizedConversationRowInput,
  type PatientCommunicationVisibilityProjectionSnapshot,
  type PatientConversationAudienceTier,
  type PatientConversationProjectionBundle,
  type PatientConversationTrustPosture,
} from "@vecells/domain-communications";

export const PHASE3_PATIENT_CONVERSATION_PROJECTION_SERVICE_NAME =
  "Phase3PatientConversationProjectionApplication";
export const PHASE3_PATIENT_CONVERSATION_PROJECTION_SCHEMA_VERSION =
  "247.phase3.patient-conversation-tuple.v1";
export const PHASE3_PATIENT_CONVERSATION_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/patient-conversation",
  "GET /v1/me/messages/{clusterId}/threading",
] as const;
export const PHASE3_PATIENT_CONVERSATION_PROJECTION_QUERY_SURFACES =
  PHASE3_PATIENT_CONVERSATION_QUERY_SURFACES;

export const phase3PatientConversationProjectionRoutes = [
  {
    routeId: "workspace_task_patient_conversation_projection_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/patient-conversation",
    contractFamily: "PatientConversationProjectionBundleContract",
    purpose:
      "Resolve the authoritative request-centered PatientConversationCluster, CommunicationEnvelope, ConversationSubthreadProjection, ConversationThreadProjection, PatientCommunicationVisibilityProjection, and PatientReceiptEnvelope family for one workspace task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "patient_portal_conversation_thread_projection_current",
    method: "GET",
    path: "/v1/me/messages/{clusterId}/threading",
    contractFamily: "PatientConversationThreadProjectionContract",
    purpose:
      "Hydrate the patient-facing conversation thread from the canonical 247 tuple instead of restitching callback, reminder, repair, or secure-message truth separately.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "internal_workspace_task_refresh_patient_conversation_projection",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:refresh-patient-conversation",
    contractFamily: "RefreshPatientConversationProjectionCommandContract",
    purpose:
      "Refresh the authoritative patient conversation tuple from callback, clinician-message, more-info, and reachability-repair truth, then publish the compatibility tuple that 246 consumes.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "internal_conversation_legacy_backfill",
    method: "POST",
    path: "/internal/v1/conversations/legacy-history:backfill",
    contractFamily: "BackfillPatientConversationLegacyHistoryCommandContract",
    purpose:
      "Backfill legacy callback or clinician-message history into placeholder or recovery posture before calm settled copy is allowed on the canonical patient thread.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3PatientConversationProjectionPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...phase3CallbackPersistenceTables,
    ...phase3ClinicianMessagePersistenceTables,
    ...phase3MoreInfoKernelPersistenceTables,
    ...phase3CommunicationRepairPersistenceTables,
    ...phase3ConversationControlPersistenceTables,
    "phase3_patient_communication_envelopes",
    "phase3_patient_conversation_subthreads",
    "phase3_patient_conversation_threads",
    "phase3_patient_conversation_clusters",
    "phase3_patient_communication_visibility_projections",
    "phase3_patient_receipt_envelopes",
    "phase3_patient_conversation_legacy_backfill_records",
  ]),
] as const;

export const phase3PatientConversationProjectionMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...phase3CallbackMigrationPlanRefs,
    ...phase3ClinicianMessageMigrationPlanRefs,
    ...phase3MoreInfoKernelMigrationPlanRefs,
    ...phase3CommunicationRepairMigrationPlanRefs,
    ...phase3ConversationControlMigrationPlanRefs,
    "services/command-api/migrations/123_phase3_patient_conversation_tuple_and_visibility.sql",
  ]),
] as const;

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

type AudienceQueryKey =
  `${string}::${PatientConversationAudienceTier}::${PatientConversationTrustPosture}`;

function audienceKey(
  clusterRef: string,
  audienceTier: PatientConversationAudienceTier,
  trustPosture: PatientConversationTrustPosture,
): AudienceQueryKey {
  return `${clusterRef}::${audienceTier}::${trustPosture}`;
}

function normalizeAudienceTier(
  audienceTier?: PatientConversationAudienceTier | null,
): PatientConversationAudienceTier {
  return audienceTier ?? "patient_authenticated";
}

function normalizeTrustPosture(
  trustPosture?: PatientConversationTrustPosture | null,
): PatientConversationTrustPosture {
  return trustPosture ?? "trusted";
}

function messageTransportAckState(
  state: string | null | undefined,
): CommunicationTransportAckState {
  switch (state) {
    case "provider_accepted":
      return "accepted";
    case "provider_rejected":
      return "rejected";
    case "dispatching":
      return "queued";
    case "drafted":
    case "approved":
    default:
      return "queued";
  }
}

function messageDeliveryEvidenceState(
  state: string | null | undefined,
): CommunicationDeliveryEvidenceState {
  switch (state) {
    case "delivered":
      return "delivered";
    case "failed":
    case "expired":
      return "failed";
    case "disputed":
      return "disputed";
    default:
      return "pending";
  }
}

function callbackDeliveryEvidenceState(
  outcome: string | null | undefined,
): CommunicationDeliveryEvidenceState {
  switch (outcome) {
    case "answered":
      return "delivered";
    case "no_answer":
    case "provider_failure":
      return "failed";
    case "route_invalid":
      return "bounced";
    case "voicemail_left":
      return "delivered";
    default:
      return "pending";
  }
}

function riskFromCallbackWindow(
  riskState: string | null | undefined,
): ConversationDeliveryRiskState {
  switch (riskState) {
    case "at_risk":
      return "at_risk";
    case "missed_window":
    case "repair_required":
      return "likely_failed";
    default:
      return "on_track";
  }
}

function riskFromMessageState(state: string | null | undefined): ConversationDeliveryRiskState {
  switch (state) {
    case "at_risk":
      return "at_risk";
    case "likely_failed":
      return "likely_failed";
    case "disputed":
      return "disputed";
    default:
      return "on_track";
  }
}

function outcomeFromMessageVisibleState(
  state: string | null | undefined,
): ConversationAuthoritativeOutcomeState {
  switch (state) {
    case "awaiting_review":
      return "awaiting_review";
    case "reviewed":
    case "closed":
      return "reviewed";
    case "reply_blocked":
    case "delivery_repair_required":
      return "recovery_required";
    case "reply_needed":
    default:
      return "awaiting_reply";
  }
}

function replyCapabilityFromMessageVisibleState(
  state: string | null | undefined,
): NormalizedConversationRowInput["replyCapabilityState"] {
  switch (state) {
    case "delivery_repair_required":
      return "repair_required";
    case "reply_blocked":
      return "reply_blocked";
    case "reviewed":
    case "closed":
      return "read_only";
    case "awaiting_review":
      return "read_only";
    case "reply_needed":
    default:
      return "reply_allowed";
  }
}

function outcomeFromCallbackVisibleState(
  state: string | null | undefined,
): ConversationAuthoritativeOutcomeState {
  switch (state) {
    case "route_repair_required":
      return "recovery_required";
    case "escalated":
      return "awaiting_review";
    case "closed":
      return "settled";
    case "queued":
    case "scheduled":
    case "attempting_now":
    case "retry_planned":
    default:
      return "callback_scheduled";
  }
}

function replyCapabilityFromCallbackVisibleState(
  state: string | null | undefined,
): NormalizedConversationRowInput["replyCapabilityState"] {
  switch (state) {
    case "route_repair_required":
      return "repair_required";
    case "closed":
      return "read_only";
    default:
      return "reply_allowed";
  }
}

function moreInfoRisk(checkpointState: string | null | undefined): ConversationDeliveryRiskState {
  switch (checkpointState) {
    case "reminder_due":
    case "late_review":
      return "at_risk";
    case "blocked_repair":
    case "expired":
      return "likely_failed";
    default:
      return "on_track";
  }
}

function moreInfoOutcome(
  cycleState: string | null | undefined,
): ConversationAuthoritativeOutcomeState {
  switch (cycleState) {
    case "response_received":
      return "awaiting_review";
    case "review_resumed":
      return "reviewed";
    case "expired":
    case "superseded":
    case "cancelled":
      return "recovery_required";
    case "awaiting_late_review":
    case "awaiting_patient_reply":
    case "awaiting_delivery":
    default:
      return "awaiting_reply";
  }
}

function moreInfoReplyCapability(
  checkpointState: string | null | undefined,
): NormalizedConversationRowInput["replyCapabilityState"] {
  switch (checkpointState) {
    case "blocked_repair":
      return "repair_required";
    case "settled":
    case "superseded":
    case "expired":
      return "read_only";
    default:
      return "reply_allowed";
  }
}

function bundleRowSortAt(rows: readonly NormalizedConversationRowInput[]): string {
  return rows.reduce(
    (latest, row) => (row.sortAt > latest ? row.sortAt : latest),
    rows[0]?.sortAt ?? "1970-01-01T00:00:00.000Z",
  );
}

export interface QueryTaskPatientConversationProjectionInput {
  taskId: string;
  audienceTier?: PatientConversationAudienceTier | null;
  trustPosture?: PatientConversationTrustPosture | null;
}

export interface QueryClusterPatientConversationProjectionInput {
  clusterRef: string;
  audienceTier?: PatientConversationAudienceTier | null;
  trustPosture?: PatientConversationTrustPosture | null;
}

export interface RefreshTaskPatientConversationProjectionInput
  extends QueryTaskPatientConversationProjectionInput {
  publishToConversationControl?: boolean;
}

export interface BackfillLegacyConversationHistoryInput {
  rows: readonly LegacyConversationBackfillRowInput[];
  recordedAt: string;
}

export interface Phase3PatientConversationProjectionQueryResult
  extends PatientConversationProjectionBundle {
  controlCluster: Phase3ConversationControlClusterBundle | null;
  legacyBackfillApplied: boolean;
}

interface Phase3PatientConversationProjectionRepository {
  getBundle(
    clusterRef: string,
    audienceTier: PatientConversationAudienceTier,
    trustPosture: PatientConversationTrustPosture,
  ): Promise<Phase3PatientConversationProjectionQueryResult | null>;
  saveBundle(bundle: Phase3PatientConversationProjectionQueryResult): Promise<void>;
  getTaskIdByCluster(clusterRef: string): Promise<string | null>;
  listLegacyRowsForTask(taskId: string): Promise<readonly LegacyConversationBackfillRowInput[]>;
  saveLegacyRows(rows: readonly LegacyConversationBackfillRowInput[]): Promise<void>;
}

class InMemoryPatientConversationProjectionRepository
  implements Phase3PatientConversationProjectionRepository
{
  private readonly bundles = new Map<
    AudienceQueryKey,
    Phase3PatientConversationProjectionQueryResult
  >();
  private readonly taskByCluster = new Map<string, string>();
  private readonly legacyRowsByTask = new Map<string, LegacyConversationBackfillRowInput[]>();

  async getBundle(
    clusterRef: string,
    audienceTier: PatientConversationAudienceTier,
    trustPosture: PatientConversationTrustPosture,
  ): Promise<Phase3PatientConversationProjectionQueryResult | null> {
    return this.bundles.get(audienceKey(clusterRef, audienceTier, trustPosture)) ?? null;
  }

  async saveBundle(bundle: Phase3PatientConversationProjectionQueryResult): Promise<void> {
    this.bundles.set(
      audienceKey(bundle.cluster.clusterRef, bundle.audienceTier, bundle.trustPosture),
      bundle,
    );
    this.taskByCluster.set(bundle.cluster.clusterRef, bundle.taskId);
  }

  async getTaskIdByCluster(clusterRef: string): Promise<string | null> {
    return this.taskByCluster.get(clusterRef) ?? null;
  }

  async listLegacyRowsForTask(
    taskId: string,
  ): Promise<readonly LegacyConversationBackfillRowInput[]> {
    return [...(this.legacyRowsByTask.get(taskId) ?? [])].sort((left, right) =>
      left.occurredAt.localeCompare(right.occurredAt),
    );
  }

  async saveLegacyRows(rows: readonly LegacyConversationBackfillRowInput[]): Promise<void> {
    for (const row of rows) {
      const taskId = requireRef(row.taskId, "taskId");
      const current = this.legacyRowsByTask.get(taskId) ?? [];
      const deduped = current.filter((entry) => entry.backfillRowId !== row.backfillRowId);
      deduped.push(row);
      this.legacyRowsByTask.set(
        taskId,
        deduped.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)),
      );
    }
  }
}

function createPhase3PatientConversationProjectionRepository(): Phase3PatientConversationProjectionRepository {
  return new InMemoryPatientConversationProjectionRepository();
}

interface TaskSourceContext {
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  episodeRef: string | null;
  selectedAnchorRef: string;
  patientShellConsistencyRef: string;
  routeIntentBindingRef: string;
  experienceContinuityEvidenceRef: string;
  latestCallbackStatusRef: string | null;
  latestSupportActionSettlementRef: string | null;
  reachabilityDependencyRef: string | null;
  reachabilityAssessmentRef: string | null;
  reachabilityEpoch: number;
  contactRepairJourneyRef: string | null;
  requiredReleaseApprovalFreezeRef: string | null;
  channelReleaseFreezeState: string;
  requiredAssuranceSliceTrustRefs: readonly string[];
  rows: readonly NormalizedConversationRowInput[];
  legacyBackfillState: "none" | "placeholder_required";
  continuityDriftReasonRefs: readonly string[];
}

export interface Phase3PatientConversationProjectionApplication {
  readonly serviceName: typeof PHASE3_PATIENT_CONVERSATION_PROJECTION_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_PATIENT_CONVERSATION_PROJECTION_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_PATIENT_CONVERSATION_QUERY_SURFACES;
  readonly routes: typeof phase3PatientConversationProjectionRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly callbackApplication: Pick<Phase3CallbackDomainApplication, "queryTaskCallbackDomain">;
  readonly clinicianMessageApplication: Pick<
    Phase3ClinicianMessageDomainApplication,
    "queryTaskClinicianMessageDomain"
  >;
  readonly moreInfoApplication: Pick<Phase3MoreInfoKernelApplication, "queryTaskMoreInfo">;
  readonly communicationRepairApplication: Pick<
    Phase3CommunicationRepairApplication,
    "queryTaskCommunicationRepair"
  >;
  readonly conversationControlApplication: Phase3ConversationControlApplication;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskPatientConversationProjection(
    input: QueryTaskPatientConversationProjectionInput,
  ): Promise<Phase3PatientConversationProjectionQueryResult | null>;
  queryClusterPatientConversationProjection(
    input: QueryClusterPatientConversationProjectionInput,
  ): Promise<Phase3PatientConversationProjectionQueryResult | null>;
  refreshTaskPatientConversationProjection(
    input: RefreshTaskPatientConversationProjectionInput,
  ): Promise<Phase3PatientConversationProjectionQueryResult | null>;
  backfillLegacyConversationHistory(
    input: BackfillLegacyConversationHistoryInput,
  ): Promise<{ storedRowCount: number; touchedTaskIds: readonly string[] }>;
}

class Phase3PatientConversationProjectionApplicationImpl
  implements Phase3PatientConversationProjectionApplication
{
  readonly serviceName = PHASE3_PATIENT_CONVERSATION_PROJECTION_SERVICE_NAME;
  readonly schemaVersion = PHASE3_PATIENT_CONVERSATION_PROJECTION_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_PATIENT_CONVERSATION_QUERY_SURFACES;
  readonly routes = phase3PatientConversationProjectionRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly callbackApplication: Pick<Phase3CallbackDomainApplication, "queryTaskCallbackDomain">;
  readonly clinicianMessageApplication: Pick<
    Phase3ClinicianMessageDomainApplication,
    "queryTaskClinicianMessageDomain"
  >;
  readonly moreInfoApplication: Pick<Phase3MoreInfoKernelApplication, "queryTaskMoreInfo">;
  readonly communicationRepairApplication: Pick<
    Phase3CommunicationRepairApplication,
    "queryTaskCommunicationRepair"
  >;
  readonly conversationControlApplication: Phase3ConversationControlApplication;
  readonly persistenceTables = phase3PatientConversationProjectionPersistenceTables;
  readonly migrationPlanRef = phase3PatientConversationProjectionMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3PatientConversationProjectionMigrationPlanRefs;

  private readonly repository: Phase3PatientConversationProjectionRepository;
  private readonly projectionService = createPhase3PatientConversationTupleService();

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    callbackApplication?: Pick<Phase3CallbackDomainApplication, "queryTaskCallbackDomain">;
    clinicianMessageApplication?: Pick<
      Phase3ClinicianMessageDomainApplication,
      "queryTaskClinicianMessageDomain"
    >;
    moreInfoApplication?: Pick<Phase3MoreInfoKernelApplication, "queryTaskMoreInfo">;
    communicationRepairApplication?: Pick<
      Phase3CommunicationRepairApplication,
      "queryTaskCommunicationRepair"
    >;
    conversationControlApplication?: Phase3ConversationControlApplication;
    repository?: Phase3PatientConversationProjectionRepository;
    idGenerator?: BackboneIdGenerator;
  }) {
    const idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_patient_conversation");
    this.triageApplication =
      options?.triageApplication ?? createPhase3TriageKernelApplication({ idGenerator });
    this.callbackApplication =
      options?.callbackApplication ??
      createPhase3CallbackDomainApplication({
        idGenerator,
        triageApplication: this.triageApplication,
      });
    this.clinicianMessageApplication =
      options?.clinicianMessageApplication ??
      createPhase3ClinicianMessageDomainApplication({
        idGenerator,
        triageApplication: this.triageApplication,
      });
    this.moreInfoApplication =
      options?.moreInfoApplication ??
      createPhase3MoreInfoKernelApplication({
        idGenerator,
        triageApplication: this.triageApplication,
      });
    this.communicationRepairApplication =
      options?.communicationRepairApplication ??
      createPhase3CommunicationReachabilityRepairApplication({
        idGenerator,
        triageApplication: this.triageApplication,
        callbackApplication: this.callbackApplication as Phase3CallbackDomainApplication,
        clinicianMessageApplication: this
          .clinicianMessageApplication as Phase3ClinicianMessageDomainApplication,
      });
    this.conversationControlApplication =
      options?.conversationControlApplication ??
      createPhase3ConversationControlApplication({
        idGenerator,
        triageApplication: this.triageApplication,
        communicationRepairApplication: this
          .communicationRepairApplication as Phase3CommunicationRepairApplication,
      });
    this.repository = options?.repository ?? createPhase3PatientConversationProjectionRepository();
  }

  async queryTaskPatientConversationProjection(
    input: QueryTaskPatientConversationProjectionInput,
  ): Promise<Phase3PatientConversationProjectionQueryResult | null> {
    return this.refreshTaskPatientConversationProjection({
      taskId: input.taskId,
      audienceTier: input.audienceTier,
      trustPosture: input.trustPosture,
      publishToConversationControl: true,
    });
  }

  async queryClusterPatientConversationProjection(
    input: QueryClusterPatientConversationProjectionInput,
  ): Promise<Phase3PatientConversationProjectionQueryResult | null> {
    const clusterRef = requireRef(input.clusterRef, "clusterRef");
    const audienceTier = normalizeAudienceTier(input.audienceTier);
    const trustPosture = normalizeTrustPosture(input.trustPosture);
    const cached = await this.repository.getBundle(clusterRef, audienceTier, trustPosture);
    if (cached) {
      return cached;
    }
    const taskId = await this.repository.getTaskIdByCluster(clusterRef);
    if (!taskId) {
      return null;
    }
    return this.refreshTaskPatientConversationProjection({
      taskId,
      audienceTier,
      trustPosture,
      publishToConversationControl:
        audienceTier === "patient_authenticated" && trustPosture === "trusted",
    });
  }

  async refreshTaskPatientConversationProjection(
    input: RefreshTaskPatientConversationProjectionInput,
  ): Promise<Phase3PatientConversationProjectionQueryResult | null> {
    const taskId = requireRef(input.taskId, "taskId");
    const audienceTier = normalizeAudienceTier(input.audienceTier);
    const trustPosture = normalizeTrustPosture(input.trustPosture);
    const context = await this.collectTaskSourceContext(taskId);
    if (!context) {
      return null;
    }
    const bundle = this.projectionService.materializeConversation({
      taskId: context.taskId,
      requestId: context.requestId,
      requestLineageRef: context.requestLineageRef,
      episodeRef: context.episodeRef,
      audienceTier,
      trustPosture,
      selectedAnchorRef: context.selectedAnchorRef,
      patientShellConsistencyRef: context.patientShellConsistencyRef,
      routeIntentBindingRef: context.routeIntentBindingRef,
      experienceContinuityEvidenceRef: context.experienceContinuityEvidenceRef,
      rows: context.rows,
      latestCallbackStatusRef: context.latestCallbackStatusRef,
      latestSupportActionSettlementRef: context.latestSupportActionSettlementRef,
      reachabilityDependencyRef: context.reachabilityDependencyRef,
      reachabilityAssessmentRef: context.reachabilityAssessmentRef,
      reachabilityEpoch: context.reachabilityEpoch,
      contactRepairJourneyRef: context.contactRepairJourneyRef,
      requiredReleaseApprovalFreezeRef: context.requiredReleaseApprovalFreezeRef,
      channelReleaseFreezeState: context.channelReleaseFreezeState,
      requiredAssuranceSliceTrustRefs: context.requiredAssuranceSliceTrustRefs,
      legacyBackfillState: context.legacyBackfillState,
      continuityDriftReasonRefs: context.continuityDriftReasonRefs,
      computedAt: new Date().toISOString(),
    });

    let controlCluster: Phase3ConversationControlClusterBundle | null = null;
    if (
      input.publishToConversationControl !== false &&
      audienceTier === "patient_authenticated" &&
      trustPosture === "trusted"
    ) {
      await this.conversationControlApplication.publishConversationTuple(bundle.tupleCompatibility);
      controlCluster = await this.conversationControlApplication.queryConversationCluster({
        clusterRef: bundle.cluster.clusterRef,
      });
    } else {
      controlCluster = await this.conversationControlApplication.queryConversationCluster({
        clusterRef: bundle.cluster.clusterRef,
      });
    }
    const hydrated = this.bindConversationControl(bundle, controlCluster);
    await this.repository.saveBundle(hydrated);
    return hydrated;
  }

  async backfillLegacyConversationHistory(
    input: BackfillLegacyConversationHistoryInput,
  ): Promise<{ storedRowCount: number; touchedTaskIds: readonly string[] }> {
    ensureIsoTimestamp(input.recordedAt, "recordedAt");
    invariant(
      input.rows.length > 0,
      "BACKFILL_ROWS_REQUIRED",
      "At least one legacy backfill row is required.",
    );
    const normalized = input.rows.map((row) => ({
      ...row,
      backfillRowId: requireRef(row.backfillRowId, "backfillRowId"),
      taskId: requireRef(row.taskId, "taskId"),
      requestId: requireRef(row.requestId, "requestId"),
      requestLineageRef: requireRef(row.requestLineageRef, "requestLineageRef"),
      sourceRef: requireRef(row.sourceRef, "sourceRef"),
      occurredAt: ensureIsoTimestamp(row.occurredAt, "occurredAt"),
      patientSafeSummary: requireRef(row.patientSafeSummary, "patientSafeSummary"),
      publicSafeSummary: requireRef(row.publicSafeSummary, "publicSafeSummary"),
    }));
    await this.repository.saveLegacyRows(normalized);
    return {
      storedRowCount: normalized.length,
      touchedTaskIds: [...new Set(normalized.map((row) => row.taskId))],
    };
  }

  private async collectTaskSourceContext(taskId: string): Promise<TaskSourceContext | null> {
    const taskDocument = await this.triageApplication.triageRepositories.getTask(taskId);
    if (!taskDocument) {
      return null;
    }
    const task = taskDocument.toSnapshot();
    const callbackBundle = await this.callbackApplication.queryTaskCallbackDomain(taskId);
    const messageBundle =
      await this.clinicianMessageApplication.queryTaskClinicianMessageDomain(taskId);
    const moreInfoBundle = await this.moreInfoApplication.queryTaskMoreInfo(taskId);
    const repairBundle =
      await this.communicationRepairApplication.queryTaskCommunicationRepair(taskId);
    const legacyRows = await this.repository.listLegacyRowsForTask(taskId);

    const requestId =
      callbackBundle?.callbackCase.requestId ??
      messageBundle?.messageThread.requestId ??
      moreInfoBundle?.cycle.requestId ??
      legacyRows[0]?.requestId ??
      task.requestId;
    const requestLineageRef =
      callbackBundle?.callbackCase.requestLineageRef ??
      messageBundle?.messageThread.requestLineageRef ??
      moreInfoBundle?.cycle.requestLineageRef ??
      legacyRows[0]?.requestLineageRef ??
      `request_lineage_${requestId}`;
    const episodeRef =
      callbackBundle?.callbackCase.episodeRef ??
      messageBundle?.messageThread.episodeRef ??
      repairBundle.callbackRepair?.binding.episodeRef ??
      repairBundle.messageRepair?.binding.episodeRef ??
      legacyRows[0]?.episodeRef ??
      null;

    const rows = [
      ...this.buildMessageRows(messageBundle),
      ...this.buildCallbackRows(callbackBundle),
      ...this.buildMoreInfoRows(moreInfoBundle),
      ...this.buildRepairRows(repairBundle),
      ...this.buildLegacyRows(legacyRows),
    ];
    if (rows.length === 0) {
      return null;
    }
    const continuityDriftReasonRefs = this.collectContinuityDriftReasonRefs({
      requestLineageRef,
      callbackBundle,
      messageBundle,
      moreInfoBundle,
      repairBundle,
      legacyRows,
    });
    const selectedAnchorRef =
      messageBundle?.latestReply?.messagePatientReplyId ??
      messageBundle?.currentDispatchEnvelope?.messageDispatchEnvelopeId ??
      callbackBundle?.currentExpectationEnvelope?.expectationEnvelopeId ??
      repairBundle.messageRepair?.binding.selectedAnchorRef ??
      repairBundle.callbackRepair?.binding.selectedAnchorRef ??
      moreInfoBundle?.checkpoint.checkpointId ??
      legacyRows.at(-1)?.backfillRowId ??
      task.launchContextRef;
    const routeIntentBindingRef =
      messageBundle?.currentDispatchEnvelope?.routeIntentBindingRef ??
      messageBundle?.currentExpectationEnvelope?.routeIntentBindingRef ??
      callbackBundle?.currentExpectationEnvelope?.routeIntentBindingRef ??
      repairBundle.messageRepair?.activeAuthorization?.sameShellRecoveryRef ??
      repairBundle.callbackRepair?.activeAuthorization?.sameShellRecoveryRef ??
      task.launchContextRef;
    const experienceContinuityEvidenceRef =
      messageBundle?.currentExpectationEnvelope?.continuityEvidenceRef ??
      callbackBundle?.currentExpectationEnvelope?.continuityEvidenceRef ??
      task.taskCompletionSettlementEnvelopeRef;
    const latestSupportActionSettlementRef =
      messageBundle?.currentDeliveryEvidenceBundle?.supportActionSettlementRef ??
      messageBundle?.currentExpectationEnvelope?.latestSupportActionSettlementRef ??
      null;
    const requiredReleaseApprovalFreezeRef =
      messageBundle?.currentExpectationEnvelope?.requiredReleaseApprovalFreezeRef ??
      callbackBundle?.currentExpectationEnvelope?.requiredReleaseApprovalFreezeRef ??
      null;
    const channelReleaseFreezeState =
      messageBundle?.currentExpectationEnvelope?.channelReleaseFreezeState ??
      callbackBundle?.currentExpectationEnvelope?.channelReleaseFreezeState ??
      "permitted";
    const requiredAssuranceSliceTrustRefs = [
      ...(messageBundle?.currentExpectationEnvelope?.requiredAssuranceSliceTrustRefs ?? []),
      ...(callbackBundle?.currentExpectationEnvelope?.requiredAssuranceSliceTrustRefs ?? []),
    ];
    const reachabilityBundle = repairBundle.messageRepair ?? repairBundle.callbackRepair ?? null;
    return {
      taskId,
      requestId,
      requestLineageRef,
      episodeRef,
      selectedAnchorRef,
      patientShellConsistencyRef: task.surfacePublicationRef,
      routeIntentBindingRef,
      experienceContinuityEvidenceRef,
      latestCallbackStatusRef:
        callbackBundle?.currentExpectationEnvelope?.expectationEnvelopeId ??
        callbackBundle?.currentResolutionGate?.callbackResolutionGateId ??
        callbackBundle?.callbackCase.callbackCaseId ??
        null,
      latestSupportActionSettlementRef,
      reachabilityDependencyRef: reachabilityBundle?.binding.reachabilityDependencyRef ?? null,
      reachabilityAssessmentRef:
        reachabilityBundle?.binding.currentReachabilityAssessmentRef ?? null,
      reachabilityEpoch: reachabilityBundle?.binding.currentReachabilityEpoch ?? 0,
      contactRepairJourneyRef: reachabilityBundle?.binding.activeRepairJourneyRef ?? null,
      requiredReleaseApprovalFreezeRef,
      channelReleaseFreezeState,
      requiredAssuranceSliceTrustRefs,
      rows: rows.sort((left, right) => left.sortAt.localeCompare(right.sortAt)),
      legacyBackfillState: legacyRows.length > 0 ? "placeholder_required" : "none",
      continuityDriftReasonRefs,
    };
  }

  private buildCallbackRows(
    bundle: Phase3CallbackApplicationBundle | null,
  ): readonly NormalizedConversationRowInput[] {
    if (!bundle) {
      return [];
    }
    const expectation = bundle.currentExpectationEnvelope;
    const callbackCase = bundle.callbackCase;
    const sentAt = expectation?.createdAt ?? callbackCase.updatedAt;
    const publicSafeSummary =
      callbackCase.patientVisibleExpectationState === "route_repair_required"
        ? "A callback update needs recovery."
        : "A callback update is available.";
    const patientSafeSummary =
      callbackCase.patientVisibleExpectationState === "scheduled"
        ? "A callback is scheduled inside the current expected window."
        : callbackCase.patientVisibleExpectationState === "attempting_now"
          ? "The care team is trying to call now."
          : callbackCase.patientVisibleExpectationState === "retry_planned"
            ? "A callback retry is planned."
            : callbackCase.patientVisibleExpectationState === "route_repair_required"
              ? "Callback contact needs route repair before the promise can continue."
              : callbackCase.patientVisibleExpectationState === "escalated"
                ? "Callback handling has been escalated for review."
                : "The current callback work is closed.";
    return [
      {
        rowRef: expectation?.expectationEnvelopeId ?? callbackCase.callbackCaseId,
        sourceDomain: "callback_case",
        sourceRef: callbackCase.callbackCaseId,
        communicationKind:
          callbackCase.patientVisibleExpectationState === "route_repair_required"
            ? "repair_notice"
            : "callback_update",
        subthreadRef: callbackCase.callbackCaseId,
        subthreadType: "callback",
        ownerRef: bundle.currentIntentLease?.ownedByActorRef ?? null,
        replyTargetRef: callbackCase.callbackCaseId,
        replyWindowRef: expectation?.expectedWindowRef ?? callbackCase.preferredWindowRef,
        workflowMeaningRef: "callback_expectation",
        replyCapabilityState: replyCapabilityFromCallbackVisibleState(
          callbackCase.patientVisibleExpectationState,
        ),
        authoredBy: "practice",
        patientSafeSummary,
        publicSafeSummary,
        visibleSnippetRef: expectation?.expectationEnvelopeId ?? null,
        sentAt,
        sortAt: sentAt,
        expiresAt: null,
        localAckState: "none",
        transportAckState: expectation ? "accepted" : "queued",
        deliveryEvidenceState: callbackDeliveryEvidenceState(
          bundle.latestOutcomeEvidenceBundle?.outcome ?? callbackCase.latestAttemptOutcome,
        ),
        deliveryRiskState: riskFromCallbackWindow(expectation?.windowRiskState),
        authoritativeOutcomeState: outcomeFromCallbackVisibleState(
          callbackCase.patientVisibleExpectationState,
        ),
        callbackVisibleState: callbackCase.patientVisibleExpectationState,
        callbackWindowRiskState: expectation?.windowRiskState ?? null,
        receiptKind: "callback",
        rowRevision: expectation?.monotoneRevision ?? callbackCase.version,
      },
    ];
  }

  private buildMessageRows(
    bundle: Phase3ClinicianMessageApplicationBundle | null,
  ): readonly NormalizedConversationRowInput[] {
    if (!bundle) {
      return [];
    }
    const rows: NormalizedConversationRowInput[] = [];
    const thread = bundle.messageThread;
    const expectation = bundle.currentExpectationEnvelope;
    const dispatch = bundle.currentDispatchEnvelope;
    const delivery = bundle.currentDeliveryEvidenceBundle;
    const threadSortAt = delivery?.recordedAt ?? dispatch?.createdAt ?? thread.updatedAt;
    rows.push({
      rowRef: dispatch?.messageDispatchEnvelopeId ?? thread.threadId,
      sourceDomain: "clinician_message_thread",
      sourceRef: thread.threadId,
      communicationKind:
        thread.patientVisibleExpectationState === "delivery_repair_required"
          ? "repair_notice"
          : "clinician_message",
      subthreadRef: thread.threadId,
      subthreadType: "secure_message",
      ownerRef: thread.authorActorRef,
      replyTargetRef: thread.threadId,
      replyWindowRef: expectation?.replyWindowRef ?? null,
      workflowMeaningRef: thread.threadPurposeRef,
      replyCapabilityState: replyCapabilityFromMessageVisibleState(
        thread.patientVisibleExpectationState,
      ),
      authoredBy: "clinician",
      patientSafeSummary: thread.messageSubject,
      publicSafeSummary: "A clinician message is available.",
      visibleSnippetRef: dispatch?.messageDispatchEnvelopeId ?? null,
      sentAt: dispatch?.createdAt ?? thread.createdAt,
      sortAt: threadSortAt,
      expiresAt: null,
      localAckState: "none",
      transportAckState: messageTransportAckState(dispatch?.transportState),
      deliveryEvidenceState: messageDeliveryEvidenceState(
        delivery?.deliveryState ?? dispatch?.deliveryEvidenceState,
      ),
      deliveryRiskState: riskFromMessageState(expectation?.deliveryRiskState),
      authoritativeOutcomeState: outcomeFromMessageVisibleState(
        thread.patientVisibleExpectationState,
      ),
      settlementRef: delivery?.supportActionSettlementRef ?? null,
      receiptKind: "message",
      rowRevision: expectation?.monotoneRevision ?? dispatch?.monotoneRevision ?? thread.version,
    });
    if (bundle.latestReply) {
      rows.push({
        rowRef: bundle.latestReply.messagePatientReplyId,
        sourceDomain: "clinician_message_thread",
        sourceRef: bundle.latestReply.messagePatientReplyId,
        communicationKind: "patient_message_reply",
        subthreadRef: thread.threadId,
        subthreadType: "secure_message",
        ownerRef: "patient",
        replyTargetRef: thread.threadId,
        replyWindowRef: expectation?.replyWindowRef ?? null,
        workflowMeaningRef: "patient_reply",
        replyCapabilityState: "read_only",
        authoredBy: "patient",
        patientSafeSummary: bundle.latestReply.replyText,
        publicSafeSummary: "A reply was sent.",
        visibleSnippetRef: bundle.latestReply.messagePatientReplyId,
        sentAt: bundle.latestReply.repliedAt,
        sortAt: bundle.latestReply.repliedAt,
        expiresAt: null,
        localAckState: "shown",
        transportAckState: "accepted",
        deliveryEvidenceState: "pending",
        deliveryRiskState: riskFromMessageState(expectation?.deliveryRiskState),
        authoritativeOutcomeState:
          bundle.latestReply.needsAssimilation || bundle.latestReply.reSafetyRequired
            ? "awaiting_review"
            : "reviewed",
        receiptKind: "message",
        rowRevision: bundle.latestReply.version,
      });
    }
    return rows;
  }

  private buildMoreInfoRows(
    bundle: Awaited<ReturnType<Phase3MoreInfoKernelApplication["queryTaskMoreInfo"]>>,
  ): readonly NormalizedConversationRowInput[] {
    if (!bundle) {
      return [];
    }
    const rows: NormalizedConversationRowInput[] = [];
    rows.push({
      rowRef: bundle.cycle.cycleId,
      sourceDomain: "more_info_cycle",
      sourceRef: bundle.cycle.cycleId,
      communicationKind: "more_info_request",
      subthreadRef: bundle.cycle.cycleId,
      subthreadType: "more_info",
      ownerRef: "system",
      replyTargetRef: bundle.cycle.cycleId,
      replyWindowRef: bundle.checkpoint.checkpointId,
      workflowMeaningRef: bundle.cycle.promptSetRef,
      replyCapabilityState: moreInfoReplyCapability(bundle.checkpoint.replyWindowState),
      authoredBy: "system",
      patientSafeSummary: "The care team needs more information before the request can continue.",
      publicSafeSummary: "More information is needed.",
      visibleSnippetRef: bundle.checkpoint.checkpointId,
      sentAt: bundle.cycle.createdAt,
      sortAt: bundle.cycle.updatedAt,
      expiresAt: bundle.cycle.expiresAt,
      localAckState: "none",
      transportAckState: bundle.cycle.state === "draft" ? "queued" : "accepted",
      deliveryEvidenceState: bundle.cycle.state === "awaiting_delivery" ? "pending" : "delivered",
      deliveryRiskState: moreInfoRisk(bundle.checkpoint.replyWindowState),
      authoritativeOutcomeState: moreInfoOutcome(bundle.cycle.state),
      reminderPlanRef: bundle.schedule.scheduleId,
      receiptKind: "more_info",
      rowRevision: bundle.checkpoint.checkpointRevision,
    });
    if (
      bundle.schedule.dispatchedReminderCount > 0 ||
      bundle.checkpoint.replyWindowState === "reminder_due"
    ) {
      rows.push({
        rowRef: `more_info_reminder_${bundle.schedule.scheduleId}`,
        sourceDomain: "more_info_cycle",
        sourceRef: bundle.schedule.scheduleId,
        communicationKind: "reminder",
        subthreadRef: `reminder_${bundle.cycle.cycleId}`,
        subthreadType: "reminder",
        ownerRef: "system",
        replyTargetRef: bundle.cycle.cycleId,
        replyWindowRef: bundle.checkpoint.checkpointId,
        workflowMeaningRef: "more_info_reminder",
        replyCapabilityState: moreInfoReplyCapability(bundle.checkpoint.replyWindowState),
        authoredBy: "system",
        patientSafeSummary: "Reminder sent for the requested more-info response.",
        publicSafeSummary: "A reminder update is available.",
        visibleSnippetRef: bundle.schedule.scheduleId,
        sentAt: bundle.schedule.lastReminderSentAt ?? bundle.schedule.createdAt,
        sortAt: bundle.schedule.lastReminderSentAt ?? bundle.schedule.updatedAt,
        expiresAt: bundle.cycle.expiresAt,
        localAckState: "none",
        transportAckState: "accepted",
        deliveryEvidenceState:
          bundle.schedule.dispatchedReminderCount > 0 ? "delivered" : "pending",
        deliveryRiskState: moreInfoRisk(bundle.checkpoint.replyWindowState),
        authoritativeOutcomeState: "awaiting_reply",
        reminderPlanRef: bundle.schedule.scheduleId,
        receiptKind: "reminder",
        rowRevision: bundle.schedule.version,
      });
    }
    if (bundle.cycle.responseReceivedAt) {
      rows.push({
        rowRef: `more_info_reply_${bundle.cycle.cycleId}`,
        sourceDomain: "more_info_cycle",
        sourceRef: bundle.cycle.cycleId,
        communicationKind: "more_info_reply",
        subthreadRef: bundle.cycle.cycleId,
        subthreadType: "more_info",
        ownerRef: "patient",
        replyTargetRef: bundle.cycle.cycleId,
        replyWindowRef: bundle.checkpoint.checkpointId,
        workflowMeaningRef: "more_info_patient_reply",
        replyCapabilityState: "read_only",
        authoredBy: "patient",
        patientSafeSummary: "You sent the requested more information.",
        publicSafeSummary: "A reply was sent.",
        visibleSnippetRef: null,
        sentAt: bundle.cycle.responseReceivedAt,
        sortAt: bundle.cycle.responseReceivedAt,
        expiresAt: bundle.cycle.expiresAt,
        localAckState: "shown",
        transportAckState: "accepted",
        deliveryEvidenceState: "pending",
        deliveryRiskState: "on_track",
        authoritativeOutcomeState:
          bundle.cycle.state === "review_resumed" ? "reviewed" : "awaiting_review",
        receiptKind: "more_info",
        rowRevision: bundle.cycle.version,
      });
    }
    if (
      bundle.schedule.callbackFallbackState === "seeded" ||
      bundle.cycle.callbackFallbackSeedRef
    ) {
      rows.push({
        rowRef: `callback_fallback_${bundle.cycle.cycleId}`,
        sourceDomain: "more_info_cycle",
        sourceRef: bundle.cycle.callbackFallbackSeedRef ?? bundle.cycle.cycleId,
        communicationKind: "callback_fallback",
        subthreadRef: `callback_fallback_${bundle.cycle.cycleId}`,
        subthreadType: "callback",
        ownerRef: "practice",
        replyTargetRef: bundle.cycle.callbackFallbackSeedRef ?? bundle.cycle.cycleId,
        replyWindowRef: bundle.checkpoint.checkpointId,
        workflowMeaningRef: "more_info_callback_fallback",
        replyCapabilityState: "reply_allowed",
        authoredBy: "practice",
        patientSafeSummary:
          "A callback fallback has been started because more-info reply continuation could not stay on the original route.",
        publicSafeSummary: "A callback fallback is active.",
        visibleSnippetRef: bundle.cycle.callbackFallbackSeedRef,
        sentAt: bundle.schedule.updatedAt,
        sortAt: bundle.schedule.updatedAt,
        expiresAt: bundle.cycle.expiresAt,
        localAckState: "none",
        transportAckState: "accepted",
        deliveryEvidenceState: "pending",
        deliveryRiskState: "at_risk",
        authoritativeOutcomeState: "callback_scheduled",
        callbackVisibleState: "queued",
        callbackWindowRiskState: "at_risk",
        receiptKind: "callback",
        rowRevision: bundle.schedule.version,
      });
    }
    return rows;
  }

  private buildRepairRows(
    bundle: Phase3CommunicationRepairTaskBundle,
  ): readonly NormalizedConversationRowInput[] {
    const rows: NormalizedConversationRowInput[] = [];
    const bindings = [bundle.callbackRepair, bundle.messageRepair].filter(
      (entry): entry is CommunicationRepairBindingBundle => Boolean(entry),
    );
    for (const repair of bindings) {
      const reason =
        repair.assessment.dominantReasonCode.replaceAll("_", " ") || "route repair required";
      rows.push({
        rowRef: repair.binding.bindingId,
        sourceDomain: "communication_repair",
        sourceRef: repair.binding.bindingId,
        communicationKind: "repair_notice",
        subthreadRef: `repair_${repair.binding.bindingId}`,
        subthreadType: "repair_guidance",
        ownerRef: "system",
        replyTargetRef: repair.binding.communicationObjectRef,
        replyWindowRef: repair.binding.activeVerificationCheckpointRef,
        workflowMeaningRef: repair.activeAuthorization?.authorizationKind ?? "contact_route_repair",
        replyCapabilityState: "repair_required",
        authoredBy: "system",
        patientSafeSummary: `Contact route repair is active because ${reason}.`,
        publicSafeSummary: "A communication recovery step is active.",
        visibleSnippetRef: repair.repairJourney?.repairJourneyId ?? repair.binding.bindingId,
        sentAt: repair.binding.updatedAt,
        sortAt: repair.binding.updatedAt,
        expiresAt: null,
        localAckState: "none",
        transportAckState: "accepted",
        deliveryEvidenceState: "not_applicable",
        deliveryRiskState: repair.assessment.deliveryRiskState as ConversationDeliveryRiskState,
        authoritativeOutcomeState: "recovery_required",
        receiptKind: "repair",
        rowRevision: repair.binding.version,
      });
    }
    return rows;
  }

  private buildLegacyRows(
    rows: readonly LegacyConversationBackfillRowInput[],
  ): readonly NormalizedConversationRowInput[] {
    return rows.map((row) => ({
      rowRef: row.backfillRowId,
      sourceDomain: "legacy_backfill",
      sourceRef: row.sourceRef,
      communicationKind: "legacy_placeholder",
      subthreadRef: `legacy_${row.sourceDomain}_${row.sourceRef}`,
      subthreadType: "legacy_recovery",
      ownerRef: null,
      replyTargetRef: null,
      replyWindowRef: null,
      workflowMeaningRef: "legacy_backfill_recovery",
      replyCapabilityState: row.repairRequired ? "repair_required" : "read_only",
      authoredBy: "legacy",
      patientSafeSummary: row.patientSafeSummary,
      publicSafeSummary: row.publicSafeSummary,
      visibleSnippetRef: null,
      sentAt: row.occurredAt,
      sortAt: row.occurredAt,
      expiresAt: null,
      localAckState: "none",
      transportAckState: "not_started",
      deliveryEvidenceState: "not_applicable",
      deliveryRiskState: row.deliveryRiskState,
      authoritativeOutcomeState: row.authoritativeOutcomeState,
      receiptKind: "legacy_backfill",
      rowRevision: 1,
    }));
  }

  private collectContinuityDriftReasonRefs(input: {
    requestLineageRef: string;
    callbackBundle: Phase3CallbackApplicationBundle | null;
    messageBundle: Phase3ClinicianMessageApplicationBundle | null;
    moreInfoBundle: Awaited<ReturnType<Phase3MoreInfoKernelApplication["queryTaskMoreInfo"]>>;
    repairBundle: Phase3CommunicationRepairTaskBundle;
    legacyRows: readonly LegacyConversationBackfillRowInput[];
  }): readonly string[] {
    const lineageRefs = [
      input.callbackBundle?.callbackCase.requestLineageRef,
      input.messageBundle?.messageThread.requestLineageRef,
      input.moreInfoBundle?.cycle.requestLineageRef,
      input.repairBundle.callbackRepair?.binding.requestLineageRef,
      input.repairBundle.messageRepair?.binding.requestLineageRef,
      ...input.legacyRows.map((row) => row.requestLineageRef),
    ].filter((value): value is string => Boolean(value));
    if (lineageRefs.some((lineage) => lineage !== input.requestLineageRef)) {
      return ["request_lineage_tuple_drift"];
    }
    return [];
  }

  private bindConversationControl(
    bundle: PatientConversationProjectionBundle,
    controlCluster: Phase3ConversationControlClusterBundle | null,
  ): Phase3PatientConversationProjectionQueryResult {
    if (!controlCluster) {
      return {
        ...bundle,
        controlCluster,
        legacyBackfillApplied: bundle.tupleCompatibility.tupleAvailabilityState === "placeholder",
      };
    }
    const visibilityProjection: PatientCommunicationVisibilityProjectionSnapshot = {
      ...bundle.visibilityProjection,
      latestSettlementRef:
        controlCluster.latestSettlement?.conversationSettlementId ??
        bundle.visibilityProjection.latestSettlementRef,
    };
    return {
      ...bundle,
      visibilityProjection,
      cluster: {
        ...bundle.cluster,
        latestSettlementRef:
          controlCluster.latestSettlement?.conversationSettlementId ??
          bundle.cluster.latestSettlementRef,
      },
      thread: {
        ...bundle.thread,
        latestDigestRef: controlCluster.digest.digestId,
        latestSettlementRef:
          controlCluster.latestSettlement?.conversationSettlementId ??
          bundle.thread.latestSettlementRef,
        activeComposerLeaseRef:
          controlCluster.activeComposerLease?.leaseId ?? bundle.thread.activeComposerLeaseRef,
      },
      controlCluster,
      legacyBackfillApplied: bundle.tupleCompatibility.tupleAvailabilityState === "placeholder",
    };
  }
}

export function createPhase3PatientConversationProjectionApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  callbackApplication?: Pick<Phase3CallbackDomainApplication, "queryTaskCallbackDomain">;
  clinicianMessageApplication?: Pick<
    Phase3ClinicianMessageDomainApplication,
    "queryTaskClinicianMessageDomain"
  >;
  moreInfoApplication?: Pick<Phase3MoreInfoKernelApplication, "queryTaskMoreInfo">;
  communicationRepairApplication?: Pick<
    Phase3CommunicationRepairApplication,
    "queryTaskCommunicationRepair"
  >;
  conversationControlApplication?: Phase3ConversationControlApplication;
  repository?: Phase3PatientConversationProjectionRepository;
  idGenerator?: BackboneIdGenerator;
}): Phase3PatientConversationProjectionApplication {
  return new Phase3PatientConversationProjectionApplicationImpl(options);
}
