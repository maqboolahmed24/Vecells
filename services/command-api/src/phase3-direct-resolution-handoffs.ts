import {
  createCommandSettlementAuthorityService,
  createLeaseFenceCommandAuthorityService,
  createSubmissionBackboneCommandService,
  type SubmissionBackboneDependencies,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3DirectResolutionKernelService,
  createPhase3DirectResolutionKernelStore,
  type AdminResolutionStarterSnapshot,
  type BookingIntentSnapshot,
  type CallbackCaseSeedSnapshot,
  type ClinicianMessageSeedSnapshot,
  type CommitDirectResolutionSettlementInput,
  type DirectResolutionOutboxDispatchRecord,
  type DirectResolutionOutboxEntrySnapshot,
  type DirectResolutionSettlementSnapshot,
  type PatientStatusProjectionCode,
  type PatientStatusProjectionUpdateSnapshot,
  type Phase3DirectResolutionBundle,
  type Phase3DirectResolutionKernelRepositories,
  type Phase3DirectResolutionKernelService,
  type PharmacyIntentSnapshot,
  type SelfCareConsequenceStarterSnapshot,
  type TriageOutcomePresentationArtifactSnapshot,
  type TriageOutcomePresentationArtifactType,
} from "@vecells/domain-triage-workspace";
import {
  submissionBackboneMigrationPlanRefs,
  submissionBackbonePersistenceTables,
} from "./submission-backbone";
import {
  createPhase3ApprovalEscalationApplication,
  phase3ApprovalEscalationMigrationPlanRefs,
  phase3ApprovalEscalationPersistenceTables,
  type Phase3ApprovalEscalationApplication,
} from "./phase3-approval-escalation";
import {
  createPhase3EndpointDecisionEngineApplication,
  phase3EndpointDecisionMigrationPlanRefs,
  phase3EndpointDecisionPersistenceTables,
  type Phase3EndpointDecisionEngineApplication,
} from "./phase3-endpoint-decision-engine";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

const TRIAGE_DOMAIN = "triage_workspace";
const CALLBACK_DOMAIN = "callback_seed";
const MESSAGE_DOMAIN = "clinician_message_seed";
const ADMIN_DOMAIN = "admin_resolution_seed";
const BOOKING_DOMAIN = "booking_intent";
const PHARMACY_DOMAIN = "pharmacy_intent";

const CALLBACK_LEASE_AUTHORITY_REF = "lease_authority_callback_seed";
const MESSAGE_LEASE_AUTHORITY_REF = "lease_authority_clinician_message_seed";
const ADMIN_LEASE_AUTHORITY_REF = "lease_authority_admin_resolution_seed";
const BOOKING_LEASE_AUTHORITY_REF = "lease_authority_booking_intent";
const PHARMACY_LEASE_AUTHORITY_REF = "lease_authority_pharmacy_intent";
const TRIAGE_DESCRIPTOR = "TriageTask";

export const PHASE3_DIRECT_RESOLUTION_SERVICE_NAME =
  "Phase3DirectResolutionAndHandoffApplication";
export const PHASE3_DIRECT_RESOLUTION_SCHEMA_VERSION =
  "240.phase3.direct-resolution-and-handoffs.v1";
export const PHASE3_DIRECT_RESOLUTION_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/direct-resolution",
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

function nextDirectResolutionId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

type SupportedDirectResolutionEndpoint =
  | "admin_resolution"
  | "self_care_and_safety_net"
  | "clinician_message"
  | "clinician_callback"
  | "appointment_required"
  | "pharmacy_first_candidate";

export const phase3DirectResolutionRoutes = [
  {
    routeId: "workspace_task_direct_resolution_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/direct-resolution",
    contractFamily: "DirectResolutionBundleContract",
    purpose:
      "Expose the current direct-resolution settlement, typed downstream seed, summary-first outcome artifact, patient-status projection, and queued outbox effects for one task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_commit_direct_resolution",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:commit-direct-resolution",
    contractFamily: "DirectResolutionCommitCommandContract",
    purpose:
      "Commit one direct resolution or handoff seed only against the current live submitted DecisionEpoch and any required approved ApprovalCheckpoint.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_publish_outcome_artifact",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/direct-resolution/{settlementId}:publish-artifact",
    contractFamily: "TriageOutcomePresentationArtifactPublishCommandContract",
    purpose:
      "Publish or replay one summary-first TriageOutcomePresentationArtifact through the authoritative outbox seam without creating a detached confirmation path.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reconcile_stale_direct_resolution",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:reconcile-direct-resolution-supersession",
    contractFamily: "DirectResolutionSupersessionReconcileCommandContract",
    purpose:
      "Degrade stale direct-resolution artifacts and downstream seeds to governed recovery-only posture when the source DecisionEpoch is superseded.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_direct_resolution_worker_drain",
    method: "POST",
    path: "/internal/v1/workspace/direct-resolution:drain-worker",
    contractFamily: "DirectResolutionOutboxDrainCommandContract",
    purpose:
      "Drain pending patient-status, consequence publication, artifact publication, and lifecycle milestone effects from the replay-safe direct-resolution outbox.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
] as const;

export const phase3DirectResolutionPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...phase3EndpointDecisionPersistenceTables,
    ...phase3ApprovalEscalationPersistenceTables,
    ...submissionBackbonePersistenceTables,
    "phase3_callback_case_seeds",
    "phase3_clinician_message_seeds",
    "phase3_self_care_consequence_starters",
    "phase3_admin_resolution_starters",
    "phase3_booking_intents",
    "phase3_pharmacy_intents",
    "phase3_direct_resolution_settlements",
    "phase3_triage_outcome_presentation_artifacts",
    "phase3_patient_status_projection_updates",
    "phase3_direct_resolution_outbox_entries",
  ]),
] as const;

export const phase3DirectResolutionMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...phase3EndpointDecisionMigrationPlanRefs,
    ...phase3ApprovalEscalationMigrationPlanRefs,
    ...submissionBackboneMigrationPlanRefs,
    "services/command-api/migrations/116_phase3_direct_resolution_and_handoff_seeds.sql",
  ]),
] as const;

interface TaskLeaseContextSnapshot {
  taskId: string;
  requestId: string;
  queueKey: string;
  assignedTo: string | null;
  status: string;
  reviewVersion: number;
  version: number;
  lifecycleLeaseRef: string | null;
  leaseAuthorityRef: string | null;
  launchContextRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
}

export interface CommitDirectResolutionInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
}

export interface PublishConsequenceArtifactInput {
  taskId: string;
  settlementId: string;
  publishedAt: string;
}

export interface ReconcileDirectResolutionSupersessionInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
}

export interface DrainDirectResolutionOutboxInput {
  evaluatedAt: string;
}

export interface Phase3DirectResolutionApplication {
  readonly serviceName: typeof PHASE3_DIRECT_RESOLUTION_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_DIRECT_RESOLUTION_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_DIRECT_RESOLUTION_QUERY_SURFACES;
  readonly routes: typeof phase3DirectResolutionRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly endpointApplication: Phase3EndpointDecisionEngineApplication;
  readonly approvalApplication: Phase3ApprovalEscalationApplication;
  readonly repositories: Phase3DirectResolutionKernelRepositories;
  readonly service: Phase3DirectResolutionKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskDirectResolution(taskId: string): Promise<Phase3DirectResolutionBundle>;
  commitDirectResolution(input: CommitDirectResolutionInput): Promise<Phase3DirectResolutionBundle>;
  publishConsequenceArtifact(
    input: PublishConsequenceArtifactInput,
  ): Promise<TriageOutcomePresentationArtifactSnapshot>;
  reconcileSupersededConsequences(
    input: ReconcileDirectResolutionSupersessionInput,
  ): Promise<Phase3DirectResolutionBundle>;
  drainOutboxWorker(input: DrainDirectResolutionOutboxInput): Promise<{
    dispatched: readonly DirectResolutionOutboxDispatchRecord[];
    outboxEntries: readonly DirectResolutionOutboxEntrySnapshot[];
  }>;
  listOutboxEntries(): Promise<readonly DirectResolutionOutboxEntrySnapshot[]>;
}

class Phase3DirectResolutionApplicationImpl
  implements Phase3DirectResolutionApplication
{
  readonly serviceName = PHASE3_DIRECT_RESOLUTION_SERVICE_NAME;
  readonly schemaVersion = PHASE3_DIRECT_RESOLUTION_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_DIRECT_RESOLUTION_QUERY_SURFACES;
  readonly routes = phase3DirectResolutionRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly endpointApplication: Phase3EndpointDecisionEngineApplication;
  readonly approvalApplication: Phase3ApprovalEscalationApplication;
  readonly repositories: Phase3DirectResolutionKernelRepositories;
  readonly service: Phase3DirectResolutionKernelService;
  readonly persistenceTables = phase3DirectResolutionPersistenceTables;
  readonly migrationPlanRef = phase3DirectResolutionMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3DirectResolutionMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;
  private readonly leaseAuthority;
  private readonly settlementAuthority;
  private readonly submissionCommands;

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    endpointApplication?: Phase3EndpointDecisionEngineApplication;
    approvalApplication?: Phase3ApprovalEscalationApplication;
    repositories?: Phase3DirectResolutionKernelRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_direct_resolution");
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({ idGenerator: this.idGenerator });
    this.endpointApplication =
      options?.endpointApplication ??
      createPhase3EndpointDecisionEngineApplication({
        idGenerator: this.idGenerator,
        triageApplication: this.triageApplication,
      });
    this.approvalApplication =
      options?.approvalApplication ??
      createPhase3ApprovalEscalationApplication({
        idGenerator: this.idGenerator,
        triageApplication: this.triageApplication,
        endpointApplication: this.endpointApplication,
      });
    this.repositories =
      options?.repositories ?? createPhase3DirectResolutionKernelStore();
    this.service = createPhase3DirectResolutionKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
    this.leaseAuthority = createLeaseFenceCommandAuthorityService(
      this.triageApplication.controlPlaneRepositories,
      this.idGenerator,
    );
    this.settlementAuthority = createCommandSettlementAuthorityService(
      this.triageApplication.controlPlaneRepositories,
      this.idGenerator,
    );
    this.submissionCommands = createSubmissionBackboneCommandService(
      this.triageApplication.controlPlaneRepositories as unknown as SubmissionBackboneDependencies,
      this.idGenerator,
    );
  }

  async queryTaskDirectResolution(taskId: string): Promise<Phase3DirectResolutionBundle> {
    await this.reconcileStaleConsequencesIfNeeded(taskId, null);
    return this.service.queryTaskBundle(taskId);
  }

  async commitDirectResolution(
    input: CommitDirectResolutionInput,
  ): Promise<Phase3DirectResolutionBundle> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const task = await this.requireTask(input.taskId);
    const existing = await this.service.queryTaskBundle(task.taskId);
    await this.reconcileStaleConsequencesIfNeeded(input.taskId, recordedAt);
    const currentDecisionBundle = await this.requireCurrentDirectResolutionBundle(task.taskId);
    const endpointCode = currentDecisionBundle.decision.chosenEndpoint as SupportedDirectResolutionEndpoint;

    if (
      existing.settlement &&
      existing.settlement.decisionEpochRef === currentDecisionBundle.epoch.epochId &&
      existing.settlement.settlementState === "settled"
    ) {
      return existing;
    }

    await this.ensureLiveTaskMutationLease(input.taskId, input.actorRef, recordedAt);
    const request = await this.requireRequest(task.requestId, input.taskId);
    await this.ensureApprovalSatisfied(task.taskId, currentDecisionBundle.epoch.epochId);
    invariant(
      task.status === "in_review" ||
        task.status === "review_resumed" ||
        task.status === "endpoint_selected" ||
        task.status === "resolved_without_appointment" ||
        task.status === "handoff_pending" ||
        task.status === "closed",
      "TRIAGE_TASK_NOT_READY_FOR_DIRECT_RESOLUTION",
      `Task ${task.taskId} must be in review, endpoint_selected, or a replay-compatible terminal state.`,
    );

    const liveDecisionBundle = await this.requireCurrentDirectResolutionBundle(task.taskId);
    invariant(
      liveDecisionBundle.epoch.epochId === currentDecisionBundle.epoch.epochId,
      "STALE_DIRECT_RESOLUTION_EPOCH",
      "The source DecisionEpoch changed before direct resolution settlement completed.",
    );

    if (task.status !== "endpoint_selected") {
      await this.triageApplication.markEndpointSelected({
        taskId: task.taskId,
        actorRef: input.actorRef,
        recordedAt,
        currentDecisionEpochRef: liveDecisionBundle.epoch.epochId,
        currentEndpointDecisionRef: liveDecisionBundle.decision.decisionId,
      });
    }

    const activeTask = await this.requireTask(task.taskId);
    const command = await this.issueTaskCommand({
      task: activeTask,
      actorRef: input.actorRef,
      recordedAt,
      actionScope:
        endpointCode === "appointment_required" || endpointCode === "pharmacy_first_candidate"
          ? "create_handoff_seed"
          : "commit_direct_resolution",
      semanticPayload: {
        decisionEpochRef: liveDecisionBundle.epoch.epochId,
        decisionId: liveDecisionBundle.decision.decisionId,
        endpointCode,
      },
    });

    const commitInput = await this.composeCommitInput({
      task: activeTask,
      request,
      endpointCode,
      decisionBundle: liveDecisionBundle,
      command,
      recordedAt,
    });

    const committed = await this.service.commitDirectResolutionSettlement(commitInput);
    const settled = committed.settlement;
    invariant(settled, "DIRECT_RESOLUTION_SETTLEMENT_MISSING", "Committed settlement is required.");

    if (
      endpointCode === "appointment_required" ||
      endpointCode === "pharmacy_first_candidate"
    ) {
      if (activeTask.status !== "handoff_pending") {
        await this.triageApplication.markHandoffPending({
          taskId: task.taskId,
          actorRef: input.actorRef,
          recordedAt,
          currentDecisionEpochRef: liveDecisionBundle.epoch.epochId,
          consequenceHookRef: settled.settlementId,
        });
      }
    } else if (activeTask.status !== "resolved_without_appointment") {
      await this.triageApplication.markResolvedWithoutAppointment({
        taskId: task.taskId,
        actorRef: input.actorRef,
        recordedAt,
        currentDecisionEpochRef: liveDecisionBundle.epoch.epochId,
        consequenceHookRef: settled.settlementId,
      });
    }

    const postTransitionTask = await this.requireTask(task.taskId);
    if (postTransitionTask.status !== "closed") {
      await this.triageApplication.closeTask({
        taskId: task.taskId,
        actorRef: input.actorRef,
        recordedAt,
        lifecycleCoordinatorSignalRef: settled.lifecycleHookEffectRef,
      });
    }

    return this.service.queryTaskBundle(task.taskId);
  }

  async publishConsequenceArtifact(
    input: PublishConsequenceArtifactInput,
  ): Promise<TriageOutcomePresentationArtifactSnapshot> {
    const publishedAt = ensureIsoTimestamp(input.publishedAt, "publishedAt");
    const settlement = await this.repositories.getSettlement(input.settlementId);
    invariant(
      settlement && settlement.taskId === input.taskId,
      "DIRECT_RESOLUTION_SETTLEMENT_NOT_FOUND",
      `DirectResolutionSettlement ${input.settlementId} is required for ${input.taskId}.`,
    );
    await this.service.drainOutboxWorker({ evaluatedAt: publishedAt });
    const bundle = await this.service.queryTaskBundle(input.taskId);
    invariant(
      bundle.presentationArtifact !== null,
      "TRIAGE_OUTCOME_PRESENTATION_ARTIFACT_NOT_FOUND",
      `TriageOutcomePresentationArtifact is required for ${input.taskId}.`,
    );
    return bundle.presentationArtifact;
  }

  async reconcileSupersededConsequences(
    input: ReconcileDirectResolutionSupersessionInput,
  ): Promise<Phase3DirectResolutionBundle> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    await this.ensureLiveTaskMutationLease(input.taskId, input.actorRef, recordedAt);
    return this.reconcileStaleConsequencesIfNeeded(input.taskId, recordedAt);
  }

  async drainOutboxWorker(input: DrainDirectResolutionOutboxInput): Promise<{
    dispatched: readonly DirectResolutionOutboxDispatchRecord[];
    outboxEntries: readonly DirectResolutionOutboxEntrySnapshot[];
  }> {
    return this.service.drainOutboxWorker({ evaluatedAt: input.evaluatedAt });
  }

  async listOutboxEntries(): Promise<readonly DirectResolutionOutboxEntrySnapshot[]> {
    return this.service.listOutboxEntries();
  }

  private async composeCommitInput(input: {
    task: TaskLeaseContextSnapshot;
    request: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["requireRequest"]>>;
    endpointCode: SupportedDirectResolutionEndpoint;
    decisionBundle: Awaited<
      ReturnType<Phase3DirectResolutionApplicationImpl["requireCurrentDirectResolutionBundle"]>
    >;
    command: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["issueTaskCommand"]>>;
    recordedAt: string;
  }): Promise<CommitDirectResolutionSettlementInput> {
    const settlementId = nextDirectResolutionId(
      this.idGenerator,
      "phase3_direct_resolution_settlement",
    );
    const taskId = input.task.taskId;
    const decisionId = input.decisionBundle.decision.decisionId;
    const decisionEpochRef = input.decisionBundle.epoch.epochId;
    const requestId = input.task.requestId;
    const requestLineageRef = input.request.requestLineageRef;
    const episodeRef = input.request.episodeId;

    let callbackSeed: CallbackCaseSeedSnapshot | null = null;
    let clinicianMessageSeed: ClinicianMessageSeedSnapshot | null = null;
    let selfCareStarter: SelfCareConsequenceStarterSnapshot | null = null;
    let adminResolutionStarter: AdminResolutionStarterSnapshot | null = null;
    let bookingIntent: BookingIntentSnapshot | null = null;
    let pharmacyIntent: PharmacyIntentSnapshot | null = null;
    let settlementClass: DirectResolutionSettlementSnapshot["settlementClass"] = "direct_resolution";
    let triageTaskStatus: DirectResolutionSettlementSnapshot["triageTaskStatus"] =
      "resolved_without_appointment";
    let artifactType: TriageOutcomePresentationArtifactType = "direct_resolution_confirmation";
    let statusCode: PatientStatusProjectionCode = "self_care_issued";
    let headline = "Outcome recorded";
    let summaryLines: string[] = [];
    let patientFacingSummary = "";
    let lineageCaseLinkRef: string | null = null;
    let closureEvaluationEffectRef: string | null = null;

    if (input.endpointCode === "clinician_callback") {
      callbackSeed = await this.createCallbackSeed({
        task: input.task,
        requestId,
        requestLineageRef,
        episodeRef,
        decisionEpochRef,
        decisionId,
        command: input.command,
        recordedAt: input.recordedAt,
        callbackWindowRef:
          this.readPayloadString(input.decisionBundle.decision.payload, "callbackWindow") ??
          "standard_callback_window",
        callbackReasonSummary:
          this.readPayloadString(input.decisionBundle.decision.payload, "summary") ??
          "Clinician callback was selected for follow-up.",
      });
      artifactType = "clinician_callback_confirmation";
      statusCode = "callback_created";
      headline = "Callback queued";
      summaryLines = [
        "A callback case seed was created from the current triage decision.",
        "The callback domain now owns the next live contact step.",
      ];
      patientFacingSummary =
        "A clinician callback has been queued. The care team will contact you using the current callback plan.";
      lineageCaseLinkRef = callbackSeed.lineageCaseLinkRef;
    } else if (input.endpointCode === "clinician_message") {
      clinicianMessageSeed = await this.createClinicianMessageSeed({
        task: input.task,
        requestId,
        requestLineageRef,
        episodeRef,
        decisionEpochRef,
        decisionId,
        command: input.command,
        recordedAt: input.recordedAt,
        messageSubject:
          this.readPayloadString(input.decisionBundle.decision.payload, "messageSubject") ??
          "Clinician follow-up",
        messageBody:
          this.readPayloadString(input.decisionBundle.decision.payload, "messageBody") ??
          "A clinician message thread was created from the current triage decision.",
      });
      artifactType = "clinician_message_preview";
      statusCode = "clinician_message_created";
      headline = "Message prepared";
      summaryLines = [
        "A clinician-message seed was created from the current triage decision.",
        "Delivery and reply handling now continue in the messaging domain.",
      ];
      patientFacingSummary =
        "A clinician message has been prepared. The care team will use the current message path for follow-up.";
      lineageCaseLinkRef = clinicianMessageSeed.lineageCaseLinkRef;
    } else if (input.endpointCode === "admin_resolution") {
      adminResolutionStarter = await this.createAdminResolutionStarter({
        task: input.task,
        requestId,
        requestLineageRef,
        episodeRef,
        decisionEpochRef,
        decisionId,
        command: input.command,
        recordedAt: input.recordedAt,
        adminResolutionSubtypeRef:
          this.readPayloadString(input.decisionBundle.decision.payload, "adminResolutionSubtypeRef") ??
          "routed_admin_task",
        summaryText:
          this.readPayloadString(input.decisionBundle.decision.payload, "summary") ??
          "Administrative follow-up is required.",
      });
      artifactType = "direct_resolution_confirmation";
      statusCode = "admin_resolution_started";
      headline = "Administrative follow-up started";
      summaryLines = [
        "A bounded admin-resolution starter was created from the current triage decision.",
        "Completion remains governed by the downstream admin-resolution domain.",
      ];
      patientFacingSummary =
        "The care team has started the administrative follow-up needed for this request.";
      lineageCaseLinkRef = adminResolutionStarter.lineageCaseLinkRef;
    } else if (input.endpointCode === "self_care_and_safety_net") {
      selfCareStarter = this.createSelfCareStarter({
        taskId,
        requestId,
        requestLineageRef,
        decisionEpochRef,
        decisionId,
        command: input.command,
        recordedAt: input.recordedAt,
        boundaryTupleRef: input.decisionBundle.boundaryTuple?.boundaryTupleId ?? null,
        adviceSummary:
          this.readPayloadString(input.decisionBundle.decision.payload, "summary") ??
          "Self-care guidance is appropriate for the current decision.",
        safetyNetAdvice:
          this.readPayloadString(input.decisionBundle.decision.payload, "safetyNetAdvice") ??
          "Seek urgent review if symptoms worsen or new safety concerns appear.",
      });
      artifactType = "direct_resolution_confirmation";
      statusCode = "self_care_issued";
      headline = "Self-care guidance issued";
      summaryLines = [
        "The current decision settled as direct self-care guidance.",
        "Safety-net advice remains bound to the current decision epoch.",
      ];
      patientFacingSummary =
        "The care team issued self-care guidance for this request with clear safety-net advice.";
      closureEvaluationEffectRef = nextDirectResolutionId(
        this.idGenerator,
        "phase3_direct_resolution_outbox",
      );
    } else if (input.endpointCode === "appointment_required") {
      settlementClass = "handoff_seed";
      triageTaskStatus = "handoff_pending";
      artifactType = "booking_handoff_confirmation";
      statusCode = "booking_handoff_pending";
      headline = "Booking handoff created";
      summaryLines = [
        "A booking intent was created from the current triage decision.",
        "The proposed lineage link prevents detached booking launch from stale context.",
      ];
      patientFacingSummary =
        "The care team created the booking handoff needed to arrange the next appointment step.";
      bookingIntent = await this.createBookingIntent({
        task: input.task,
        requestId,
        requestLineageRef,
        episodeRef,
        decisionEpochRef,
        decisionId,
        command: input.command,
        recordedAt: input.recordedAt,
        priorityBand:
          this.readPayloadString(input.decisionBundle.decision.payload, "priorityBand") ??
          "routine",
        timeframe:
          this.readPayloadString(input.decisionBundle.decision.payload, "timeframe") ??
          "next_available",
        modality:
          this.readPayloadString(input.decisionBundle.decision.payload, "modality") ??
          "in_person",
        clinicianType:
          this.readPayloadString(input.decisionBundle.decision.payload, "clinicianType") ??
          "gp",
        continuityPreference:
          this.readPayloadString(input.decisionBundle.decision.payload, "continuityPreference") ??
          "best_available",
        accessNeeds:
          this.readPayloadString(input.decisionBundle.decision.payload, "accessNeeds") ??
          "none_declared",
        patientPreferenceSummary:
          this.readPayloadString(
            input.decisionBundle.decision.payload,
            "patientPreferenceSummary",
          ) ?? "Use the current triage booking preferences.",
      });
      lineageCaseLinkRef = bookingIntent.lineageCaseLinkRef;
    } else if (input.endpointCode === "pharmacy_first_candidate") {
      settlementClass = "handoff_seed";
      triageTaskStatus = "handoff_pending";
      artifactType = "pharmacy_handoff_confirmation";
      statusCode = "pharmacy_handoff_pending";
      headline = "Pharmacy handoff created";
      summaryLines = [
        "A pharmacy intent was created from the current triage decision.",
        "The proposed lineage link prevents stale or orphaned pharmacy launch.",
      ];
      patientFacingSummary =
        "The care team created the pharmacy handoff needed for the next step in this request.";
      pharmacyIntent = await this.createPharmacyIntent({
        task: input.task,
        requestId,
        requestLineageRef,
        episodeRef,
        decisionEpochRef,
        decisionId,
        command: input.command,
        recordedAt: input.recordedAt,
        suspectedPathway:
          this.readPayloadString(input.decisionBundle.decision.payload, "suspectedPathway") ??
          "pharmacy_first",
        eligibilityFacts: this.readPayloadStringArray(
          input.decisionBundle.decision.payload,
          "eligibilityFacts",
        ) ?? ["patient_meets_default_pathway"],
        exclusionFlags:
          this.readPayloadStringArray(input.decisionBundle.decision.payload, "exclusionFlags") ?? [],
        patientChoicePending:
          this.readPayloadBoolean(input.decisionBundle.decision.payload, "patientChoicePending") ??
          true,
      });
      lineageCaseLinkRef = pharmacyIntent.lineageCaseLinkRef;
    } else {
      invariant(false, "UNSUPPORTED_DIRECT_RESOLUTION_ENDPOINT", `Unsupported endpoint ${input.endpointCode}.`);
    }

    const presentationArtifact = this.createPresentationArtifact({
      task: input.task,
      requestId,
      decisionId,
      decisionEpochRef,
      artifactType,
      command: input.command,
      recordedAt: input.recordedAt,
      headline,
      summaryLines,
      patientFacingSummary,
      provenanceRefs: uniqueRefs([
        decisionEpochRef,
        decisionId,
        callbackSeed?.callbackSeedId ?? null,
        clinicianMessageSeed?.clinicianMessageSeedId ?? null,
        selfCareStarter?.selfCareStarterId ?? null,
        adminResolutionStarter?.adminResolutionStarterId ?? null,
        bookingIntent?.intentId ?? null,
        pharmacyIntent?.intentId ?? null,
      ]),
    });
    const lifecycleHookEffectRef = nextDirectResolutionId(
      this.idGenerator,
      "phase3_direct_resolution_outbox",
    );
    const patientStatusProjection = this.createPatientStatusProjection({
      taskId,
      requestId,
      requestLineageRef,
      decisionId,
      decisionEpochRef,
      endpointCode: input.endpointCode,
      statusCode,
      sourceSettlementRef: settlementId,
      recordedAt: input.recordedAt,
      headline,
      summaryLines,
      patientFacingSummary,
    });

    const settlement: DirectResolutionSettlementSnapshot = {
      settlementId,
      taskId,
      requestId,
      requestLineageRef,
      decisionEpochRef,
      decisionId,
      endpointCode: input.endpointCode,
      settlementClass,
      triageTaskStatus,
      callbackSeedRef: callbackSeed?.callbackSeedId ?? null,
      clinicianMessageSeedRef: clinicianMessageSeed?.clinicianMessageSeedId ?? null,
      selfCareStarterRef: selfCareStarter?.selfCareStarterId ?? null,
      adminResolutionStarterRef: adminResolutionStarter?.adminResolutionStarterId ?? null,
      bookingIntentRef: bookingIntent?.intentId ?? null,
      pharmacyIntentRef: pharmacyIntent?.intentId ?? null,
      lineageCaseLinkRef,
      presentationArtifactRef: presentationArtifact.presentationArtifactId,
      patientStatusProjectionRef: patientStatusProjection.projectionUpdateId,
      lifecycleHookEffectRef,
      closureEvaluationEffectRef,
      settlementState: "settled",
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      routeIntentBindingRef: input.command.routeIntentBindingRef,
      decisionSupersessionRecordRef: null,
      recordedAt: input.recordedAt,
      version: 1,
    };

    const outboxEntries = this.createOutboxEntries({
      taskId,
      requestId,
      requestLineageRef,
      decisionEpochRef,
      settlement,
      patientStatusProjectionRef: patientStatusProjection.projectionUpdateId,
      consequenceTargetRef:
        callbackSeed?.callbackSeedId ??
        clinicianMessageSeed?.clinicianMessageSeedId ??
        adminResolutionStarter?.adminResolutionStarterId ??
        selfCareStarter?.selfCareStarterId ??
        bookingIntent?.intentId ??
        pharmacyIntent?.intentId ??
        presentationArtifact.presentationArtifactId,
      presentationArtifactRef: presentationArtifact.presentationArtifactId,
      lifecycleEffectRef: lifecycleHookEffectRef,
      lifecycleEffectType:
        settlementClass === "handoff_seed" ? "lifecycle_handoff_active" : "lifecycle_outcome_recorded",
      closureEvaluationEffectRef,
      recordedAt: input.recordedAt,
    });

    return {
      settlement,
      callbackSeed,
      clinicianMessageSeed,
      selfCareStarter,
      adminResolutionStarter,
      bookingIntent,
      pharmacyIntent,
      presentationArtifact,
      patientStatusProjection,
      outboxEntries,
    };
  }

  private async createCallbackSeed(input: {
    task: TaskLeaseContextSnapshot;
    requestId: string;
    requestLineageRef: string;
    episodeRef: string;
    decisionEpochRef: string;
    decisionId: string;
    command: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["issueTaskCommand"]>>;
    recordedAt: string;
    callbackWindowRef: string;
    callbackReasonSummary: string;
  }): Promise<CallbackCaseSeedSnapshot> {
    const seedId = nextDirectResolutionId(this.idGenerator, "phase3_callback_case_seed");
    const link = await this.proposeLineageCaseLink({
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      requestRef: input.requestId,
      caseFamily: "callback",
      domainCaseRef: seedId,
      linkReason: "operational_follow_up",
      openedAt: input.recordedAt,
      originDecisionEpochRef: input.decisionEpochRef,
      originTriageTaskRef: input.task.taskId,
    });
    const lease = await this.acquireSeedLease({
      requestId: input.requestId,
      episodeId: input.episodeRef,
      requestLineageRef: input.requestLineageRef,
      domain: CALLBACK_DOMAIN,
      domainObjectRef: seedId,
      leaseAuthorityRef: CALLBACK_LEASE_AUTHORITY_REF,
      ownerActorRef: input.task.assignedTo ?? "system_callback_seed",
      ownerWorkerRef: "callback_seed_kernel",
      sameShellRecoveryRouteRef: this.seedRecoveryRoute(input.task.taskId, "callback"),
      operatorVisibleWorkRef: `callback_seed_${seedId}`,
      blockedActionScopeRefs: ["callback_seed"],
      acquiredAt: input.recordedAt,
    });
    return {
      callbackSeedId: seedId,
      taskId: input.task.taskId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      decisionEpochRef: input.decisionEpochRef,
      decisionId: input.decisionId,
      lineageCaseLinkRef: link.lineageCaseLinkId,
      lifecycleLeaseRef: lease.lease.toSnapshot().leaseId,
      leaseAuthorityRef: CALLBACK_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: lease.lease.toSnapshot().leaseTtlSeconds,
      ownershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      fencingToken: lease.lease.toSnapshot().fencingToken,
      currentLineageFenceEpoch: lease.lineageFence.currentEpoch,
      callbackWindowRef: input.callbackWindowRef,
      callbackReasonSummary: input.callbackReasonSummary,
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      seedState: "live",
      decisionSupersessionRecordRef: null,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  private async createClinicianMessageSeed(input: {
    task: TaskLeaseContextSnapshot;
    requestId: string;
    requestLineageRef: string;
    episodeRef: string;
    decisionEpochRef: string;
    decisionId: string;
    command: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["issueTaskCommand"]>>;
    recordedAt: string;
    messageSubject: string;
    messageBody: string;
  }): Promise<ClinicianMessageSeedSnapshot> {
    const seedId = nextDirectResolutionId(
      this.idGenerator,
      "phase3_clinician_message_seed",
    );
    const link = await this.proposeLineageCaseLink({
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      requestRef: input.requestId,
      caseFamily: "clinician_message",
      domainCaseRef: seedId,
      linkReason: "operational_follow_up",
      openedAt: input.recordedAt,
      originDecisionEpochRef: input.decisionEpochRef,
      originTriageTaskRef: input.task.taskId,
    });
    const lease = await this.acquireSeedLease({
      requestId: input.requestId,
      episodeId: input.episodeRef,
      requestLineageRef: input.requestLineageRef,
      domain: MESSAGE_DOMAIN,
      domainObjectRef: seedId,
      leaseAuthorityRef: MESSAGE_LEASE_AUTHORITY_REF,
      ownerActorRef: input.task.assignedTo ?? "system_message_seed",
      ownerWorkerRef: "clinician_message_seed_kernel",
      sameShellRecoveryRouteRef: this.seedRecoveryRoute(input.task.taskId, "message"),
      operatorVisibleWorkRef: `clinician_message_seed_${seedId}`,
      blockedActionScopeRefs: ["clinician_message_seed"],
      acquiredAt: input.recordedAt,
    });
    return {
      clinicianMessageSeedId: seedId,
      taskId: input.task.taskId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      decisionEpochRef: input.decisionEpochRef,
      decisionId: input.decisionId,
      lineageCaseLinkRef: link.lineageCaseLinkId,
      lifecycleLeaseRef: lease.lease.toSnapshot().leaseId,
      leaseAuthorityRef: MESSAGE_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: lease.lease.toSnapshot().leaseTtlSeconds,
      ownershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      fencingToken: lease.lease.toSnapshot().fencingToken,
      currentLineageFenceEpoch: lease.lineageFence.currentEpoch,
      messageSubject: input.messageSubject,
      messageBody: input.messageBody,
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      seedState: "live",
      decisionSupersessionRecordRef: null,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  private createSelfCareStarter(input: {
    taskId: string;
    requestId: string;
    requestLineageRef: string;
    decisionEpochRef: string;
    decisionId: string;
    command: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["issueTaskCommand"]>>;
    recordedAt: string;
    boundaryTupleRef: string | null;
    adviceSummary: string;
    safetyNetAdvice: string;
  }): SelfCareConsequenceStarterSnapshot {
    return {
      selfCareStarterId: nextDirectResolutionId(
        this.idGenerator,
        "phase3_self_care_consequence_starter",
      ),
      taskId: input.taskId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      decisionEpochRef: input.decisionEpochRef,
      decisionId: input.decisionId,
      boundaryTupleRef: input.boundaryTupleRef,
      adviceSummary: input.adviceSummary,
      safetyNetAdvice: input.safetyNetAdvice,
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      starterState: "live",
      decisionSupersessionRecordRef: null,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  private async createAdminResolutionStarter(input: {
    task: TaskLeaseContextSnapshot;
    requestId: string;
    requestLineageRef: string;
    episodeRef: string;
    decisionEpochRef: string;
    decisionId: string;
    command: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["issueTaskCommand"]>>;
    recordedAt: string;
    adminResolutionSubtypeRef: string;
    summaryText: string;
  }): Promise<AdminResolutionStarterSnapshot> {
    const starterId = nextDirectResolutionId(
      this.idGenerator,
      "phase3_admin_resolution_starter",
    );
    const link = await this.proposeLineageCaseLink({
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      requestRef: input.requestId,
      caseFamily: "admin_resolution",
      domainCaseRef: starterId,
      linkReason: "operational_follow_up",
      openedAt: input.recordedAt,
      originDecisionEpochRef: input.decisionEpochRef,
      originTriageTaskRef: input.task.taskId,
    });
    const lease = await this.acquireSeedLease({
      requestId: input.requestId,
      episodeId: input.episodeRef,
      requestLineageRef: input.requestLineageRef,
      domain: ADMIN_DOMAIN,
      domainObjectRef: starterId,
      leaseAuthorityRef: ADMIN_LEASE_AUTHORITY_REF,
      ownerActorRef: input.task.assignedTo ?? "system_admin_resolution_seed",
      ownerWorkerRef: "admin_resolution_seed_kernel",
      sameShellRecoveryRouteRef: this.seedRecoveryRoute(input.task.taskId, "admin"),
      operatorVisibleWorkRef: `admin_resolution_seed_${starterId}`,
      blockedActionScopeRefs: ["admin_resolution_seed"],
      acquiredAt: input.recordedAt,
    });
    return {
      adminResolutionStarterId: starterId,
      taskId: input.task.taskId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      decisionEpochRef: input.decisionEpochRef,
      decisionId: input.decisionId,
      lineageCaseLinkRef: link.lineageCaseLinkId,
      lifecycleLeaseRef: lease.lease.toSnapshot().leaseId,
      leaseAuthorityRef: ADMIN_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: lease.lease.toSnapshot().leaseTtlSeconds,
      ownershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      fencingToken: lease.lease.toSnapshot().fencingToken,
      currentLineageFenceEpoch: lease.lineageFence.currentEpoch,
      adminResolutionSubtypeRef: input.adminResolutionSubtypeRef,
      summaryText: input.summaryText,
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      starterState: "live",
      decisionSupersessionRecordRef: null,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  private async createBookingIntent(input: {
    task: TaskLeaseContextSnapshot;
    requestId: string;
    requestLineageRef: string;
    episodeRef: string;
    decisionEpochRef: string;
    decisionId: string;
    command: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["issueTaskCommand"]>>;
    recordedAt: string;
    priorityBand: string;
    timeframe: string;
    modality: string;
    clinicianType: string;
    continuityPreference: string;
    accessNeeds: string;
    patientPreferenceSummary: string;
  }): Promise<BookingIntentSnapshot> {
    const intentId = nextDirectResolutionId(this.idGenerator, "phase3_booking_intent");
    const link = await this.proposeLineageCaseLink({
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      requestRef: input.requestId,
      caseFamily: "booking",
      domainCaseRef: intentId,
      linkReason: "direct_handoff",
      openedAt: input.recordedAt,
      originDecisionEpochRef: input.decisionEpochRef,
      originTriageTaskRef: input.task.taskId,
    });
    const lease = await this.acquireSeedLease({
      requestId: input.requestId,
      episodeId: input.episodeRef,
      requestLineageRef: input.requestLineageRef,
      domain: BOOKING_DOMAIN,
      domainObjectRef: intentId,
      leaseAuthorityRef: BOOKING_LEASE_AUTHORITY_REF,
      ownerActorRef: input.task.assignedTo ?? "system_booking_seed",
      ownerWorkerRef: "booking_intent_kernel",
      sameShellRecoveryRouteRef: this.seedRecoveryRoute(input.task.taskId, "booking"),
      operatorVisibleWorkRef: `booking_intent_${intentId}`,
      blockedActionScopeRefs: ["booking_handoff_seed"],
      acquiredAt: input.recordedAt,
    });
    return {
      intentId,
      episodeRef: input.episodeRef,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      sourceTriageTaskRef: input.task.taskId,
      lineageCaseLinkRef: link.lineageCaseLinkId,
      priorityBand: input.priorityBand,
      timeframe: input.timeframe,
      modality: input.modality,
      clinicianType: input.clinicianType,
      continuityPreference: input.continuityPreference,
      accessNeeds: input.accessNeeds,
      patientPreferenceSummary: input.patientPreferenceSummary,
      createdFromDecisionId: input.decisionId,
      decisionEpochRef: input.decisionEpochRef,
      decisionSupersessionRecordRef: null,
      lifecycleLeaseRef: lease.lease.toSnapshot().leaseId,
      leaseAuthorityRef: BOOKING_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: lease.lease.toSnapshot().leaseTtlSeconds,
      ownershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      fencingToken: lease.lease.toSnapshot().fencingToken,
      currentLineageFenceEpoch: lease.lineageFence.currentEpoch,
      intentState: "seeded",
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  private async createPharmacyIntent(input: {
    task: TaskLeaseContextSnapshot;
    requestId: string;
    requestLineageRef: string;
    episodeRef: string;
    decisionEpochRef: string;
    decisionId: string;
    command: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["issueTaskCommand"]>>;
    recordedAt: string;
    suspectedPathway: string;
    eligibilityFacts: readonly string[];
    exclusionFlags: readonly string[];
    patientChoicePending: boolean;
  }): Promise<PharmacyIntentSnapshot> {
    const intentId = nextDirectResolutionId(this.idGenerator, "phase3_pharmacy_intent");
    const link = await this.proposeLineageCaseLink({
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      requestRef: input.requestId,
      caseFamily: "pharmacy",
      domainCaseRef: intentId,
      linkReason: "direct_handoff",
      openedAt: input.recordedAt,
      originDecisionEpochRef: input.decisionEpochRef,
      originTriageTaskRef: input.task.taskId,
    });
    const lease = await this.acquireSeedLease({
      requestId: input.requestId,
      episodeId: input.episodeRef,
      requestLineageRef: input.requestLineageRef,
      domain: PHARMACY_DOMAIN,
      domainObjectRef: intentId,
      leaseAuthorityRef: PHARMACY_LEASE_AUTHORITY_REF,
      ownerActorRef: input.task.assignedTo ?? "system_pharmacy_seed",
      ownerWorkerRef: "pharmacy_intent_kernel",
      sameShellRecoveryRouteRef: this.seedRecoveryRoute(input.task.taskId, "pharmacy"),
      operatorVisibleWorkRef: `pharmacy_intent_${intentId}`,
      blockedActionScopeRefs: ["pharmacy_handoff_seed"],
      acquiredAt: input.recordedAt,
    });
    return {
      intentId,
      episodeRef: input.episodeRef,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      sourceTriageTaskRef: input.task.taskId,
      lineageCaseLinkRef: link.lineageCaseLinkId,
      suspectedPathway: input.suspectedPathway,
      eligibilityFacts: input.eligibilityFacts,
      exclusionFlags: input.exclusionFlags,
      patientChoicePending: input.patientChoicePending,
      createdFromDecisionId: input.decisionId,
      decisionEpochRef: input.decisionEpochRef,
      decisionSupersessionRecordRef: null,
      lifecycleLeaseRef: lease.lease.toSnapshot().leaseId,
      leaseAuthorityRef: PHARMACY_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: lease.lease.toSnapshot().leaseTtlSeconds,
      ownershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      fencingToken: lease.lease.toSnapshot().fencingToken,
      currentLineageFenceEpoch: lease.lineageFence.currentEpoch,
      intentState: "seeded",
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  private createPresentationArtifact(input: {
    task: TaskLeaseContextSnapshot;
    requestId: string;
    decisionId: string;
    decisionEpochRef: string;
    artifactType: TriageOutcomePresentationArtifactType;
    command: Awaited<ReturnType<Phase3DirectResolutionApplicationImpl["issueTaskCommand"]>>;
    recordedAt: string;
    headline: string;
    summaryLines: readonly string[];
    patientFacingSummary: string;
    provenanceRefs: readonly string[];
  }): TriageOutcomePresentationArtifactSnapshot {
    return {
      presentationArtifactId: nextDirectResolutionId(
        this.idGenerator,
        "phase3_triage_outcome_presentation_artifact",
      ),
      taskId: input.task.taskId,
      requestId: input.requestId,
      decisionEpochRef: input.decisionEpochRef,
      endpointDecisionRef: input.decisionId,
      artifactType: input.artifactType,
      artifactPresentationContractRef: "artifact_presentation_contract_triage_outcome_v1",
      outboundNavigationGrantPolicyRef: "outbound_navigation_grant_policy_triage_outcome_v1",
      audienceSurfaceRuntimeBindingRef: "audience_surface_runtime_binding_staff_workspace_v1",
      surfaceRouteContractRef: "surface_route_contract_triage_workspace_v1",
      surfacePublicationRef: "surface_publication_triage_workspace_v1",
      runtimePublicationBundleRef: "runtime_publication_bundle_triage_workspace_v1",
      visibilityTier: "summary_first",
      summarySafetyTier: "patient_safe",
      placeholderContractRef: "placeholder_contract_triage_outcome_v1",
      artifactState: "summary_only",
      headline: input.headline,
      summaryLines: input.summaryLines,
      patientFacingSummary: input.patientFacingSummary,
      provenanceRefs: input.provenanceRefs,
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      decisionSupersessionRecordRef: null,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  private createPatientStatusProjection(input: {
    taskId: string;
    requestId: string;
    requestLineageRef: string;
    decisionId: string;
    decisionEpochRef: string;
    endpointCode: SupportedDirectResolutionEndpoint;
    statusCode: PatientStatusProjectionCode;
    sourceSettlementRef: string;
    recordedAt: string;
    headline: string;
    summaryLines: readonly string[];
    patientFacingSummary: string;
  }): PatientStatusProjectionUpdateSnapshot {
    return {
      projectionUpdateId: nextDirectResolutionId(
        this.idGenerator,
        "phase3_patient_status_projection_update",
      ),
      taskId: input.taskId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      decisionEpochRef: input.decisionEpochRef,
      decisionId: input.decisionId,
      endpointCode: input.endpointCode,
      statusCode: input.statusCode,
      headline: input.headline,
      summaryLines: [...input.summaryLines],
      patientFacingSummary: input.patientFacingSummary,
      visibilityState: "live",
      sourceSettlementRef: input.sourceSettlementRef,
      decisionSupersessionRecordRef: null,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      version: 1,
    };
  }

  private createOutboxEntries(input: {
    taskId: string;
    requestId: string;
    requestLineageRef: string;
    decisionEpochRef: string;
    settlement: DirectResolutionSettlementSnapshot;
    patientStatusProjectionRef: string;
    consequenceTargetRef: string;
    presentationArtifactRef: string;
    lifecycleEffectRef: string;
    lifecycleEffectType:
      | "lifecycle_outcome_recorded"
      | "lifecycle_handoff_active";
    closureEvaluationEffectRef: string | null;
    recordedAt: string;
  }): DirectResolutionOutboxEntrySnapshot[] {
    const base = {
      taskId: input.taskId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      settlementRef: input.settlement.settlementId,
      decisionEpochRef: input.decisionEpochRef,
      dispatchState: "pending" as const,
      reasonRef: null,
      createdAt: input.recordedAt,
      dispatchedAt: null,
      cancelledAt: null,
      version: 1,
    };
    const entries: DirectResolutionOutboxEntrySnapshot[] = [
      {
        outboxEntryId: nextDirectResolutionId(this.idGenerator, "phase3_direct_resolution_outbox"),
        ...base,
        effectType: "patient_status_projection",
        effectKey: `${input.taskId}::patient_status_projection::${input.patientStatusProjectionRef}`,
        targetRef: input.patientStatusProjectionRef,
      },
      {
        outboxEntryId: nextDirectResolutionId(this.idGenerator, "phase3_direct_resolution_outbox"),
        ...base,
        effectType: "consequence_publication",
        effectKey: `${input.taskId}::consequence_publication::${input.consequenceTargetRef}`,
        targetRef: input.consequenceTargetRef,
      },
      {
        outboxEntryId: nextDirectResolutionId(this.idGenerator, "phase3_direct_resolution_outbox"),
        ...base,
        effectType: "presentation_artifact_publication",
        effectKey: `${input.taskId}::presentation_artifact_publication::${input.presentationArtifactRef}`,
        targetRef: input.presentationArtifactRef,
      },
      {
        outboxEntryId: input.lifecycleEffectRef,
        ...base,
        effectType: input.lifecycleEffectType,
        effectKey: `${input.taskId}::${input.lifecycleEffectType}::${input.settlement.settlementId}`,
        targetRef: input.settlement.settlementId,
      },
    ];
    if (input.closureEvaluationEffectRef) {
      entries.push({
        outboxEntryId: input.closureEvaluationEffectRef,
        ...base,
        effectType: "lifecycle_closure_evaluation",
        effectKey: `${input.taskId}::lifecycle_closure_evaluation::${input.settlement.settlementId}`,
        targetRef: input.settlement.settlementId,
      });
    }
    return entries;
  }

  private async proposeLineageCaseLink(input: {
    requestLineageRef: string;
    episodeRef: string;
    requestRef: string;
    caseFamily: "callback" | "clinician_message" | "booking" | "pharmacy" | "admin_resolution";
    domainCaseRef: string;
    linkReason: "direct_handoff" | "operational_follow_up";
    openedAt: string;
    originDecisionEpochRef: string;
    originTriageTaskRef: string;
  }) {
    const proposed = await this.submissionCommands.proposeLineageCaseLink({
      requestLineageRef: input.requestLineageRef,
      episodeRef: input.episodeRef,
      requestRef: input.requestRef,
      caseFamily: input.caseFamily,
      domainCaseRef: input.domainCaseRef,
      linkReason: input.linkReason,
      openedAt: input.openedAt,
      originDecisionEpochRef: input.originDecisionEpochRef,
      originTriageTaskRef: input.originTriageTaskRef,
    });
    return proposed.link.toSnapshot();
  }

  private async acquireSeedLease(input: {
    requestId: string;
    episodeId: string;
    requestLineageRef: string;
    domain: string;
    domainObjectRef: string;
    leaseAuthorityRef: string;
    ownerActorRef: string;
    ownerWorkerRef: string;
    sameShellRecoveryRouteRef: string;
    operatorVisibleWorkRef: string;
    blockedActionScopeRefs: readonly string[];
    acquiredAt: string;
  }) {
    return this.leaseAuthority.acquireLease({
      requestId: input.requestId,
      episodeId: input.episodeId,
      requestLineageRef: input.requestLineageRef,
      domain: input.domain,
      domainObjectRef: input.domainObjectRef,
      leaseAuthorityRef: input.leaseAuthorityRef,
      ownerActorRef: input.ownerActorRef,
      ownerWorkerRef: input.ownerWorkerRef,
      governingObjectVersionRef: `${input.domainObjectRef}@v1`,
      leaseScopeComponents: ["downstream_seed"],
      leaseTtlSeconds: 1800,
      acquiredAt: input.acquiredAt,
      sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
      operatorVisibleWorkRef: input.operatorVisibleWorkRef,
      blockedActionScopeRefs: [...input.blockedActionScopeRefs],
    });
  }

  private async reconcileStaleConsequencesIfNeeded(
    taskId: string,
    recordedAt: string | null,
  ): Promise<Phase3DirectResolutionBundle> {
    const bundle = await this.service.queryTaskBundle(taskId);
    if (!bundle.settlement) {
      return bundle;
    }
    const decisionBundle = await this.endpointApplication.queryTaskEndpointDecision(taskId);
    if (
      !decisionBundle ||
      decisionBundle.epoch.epochId === bundle.settlement.decisionEpochRef ||
      !decisionBundle.latestSupersession ||
      decisionBundle.latestSupersession.priorDecisionEpochRef !== bundle.settlement.decisionEpochRef
    ) {
      return bundle;
    }
    await this.releaseActiveSeedLeases(bundle, recordedAt ?? decisionBundle.latestSupersession.recordedAt);
    return this.service.reconcileSupersededConsequences({
      taskId,
      priorDecisionEpochRef: bundle.settlement.decisionEpochRef,
      decisionSupersessionRecordRef:
        decisionBundle.latestSupersession.decisionSupersessionRecordId,
      reconciledAt: recordedAt ?? decisionBundle.latestSupersession.recordedAt,
    });
  }

  private async releaseActiveSeedLeases(
    bundle: Phase3DirectResolutionBundle,
    recordedAt: string,
  ): Promise<void> {
    const release = async (
      domain: string,
      domainObjectRef: string | null,
      leaseId: string | null | undefined,
      ownershipEpoch: number | null | undefined,
      fencingToken: string | null | undefined,
      recoveryRoute: string,
      blockedActionScopeRefs: readonly string[],
    ) => {
      if (!domainObjectRef || !leaseId || !ownershipEpoch || !fencingToken) {
        return;
      }
      try {
        await this.leaseAuthority.releaseLease({
          domain,
          domainObjectRef,
          leaseId,
          presentedOwnershipEpoch: ownershipEpoch,
          presentedFencingToken: fencingToken,
          releasedAt: recordedAt,
          sameShellRecoveryRouteRef: recoveryRoute,
          operatorVisibleWorkRef: `recovery_${domainObjectRef}`,
          blockedActionScopeRefs: [...blockedActionScopeRefs],
          closeBlockReason: "decision_epoch_superseded",
          detectedByRef: PHASE3_DIRECT_RESOLUTION_SERVICE_NAME,
        });
      } catch {
        // Best-effort release keeps supersession replay tolerant.
      }
    };

    await release(
      CALLBACK_DOMAIN,
      bundle.callbackSeed?.callbackSeedId ?? null,
      bundle.callbackSeed?.lifecycleLeaseRef,
      bundle.callbackSeed?.ownershipEpoch,
      bundle.callbackSeed?.fencingToken,
      this.seedRecoveryRoute(bundle.callbackSeed?.taskId ?? "task", "callback"),
      ["callback_seed"],
    );
    await release(
      MESSAGE_DOMAIN,
      bundle.clinicianMessageSeed?.clinicianMessageSeedId ?? null,
      bundle.clinicianMessageSeed?.lifecycleLeaseRef,
      bundle.clinicianMessageSeed?.ownershipEpoch,
      bundle.clinicianMessageSeed?.fencingToken,
      this.seedRecoveryRoute(bundle.clinicianMessageSeed?.taskId ?? "task", "message"),
      ["clinician_message_seed"],
    );
    await release(
      ADMIN_DOMAIN,
      bundle.adminResolutionStarter?.adminResolutionStarterId ?? null,
      bundle.adminResolutionStarter?.lifecycleLeaseRef,
      bundle.adminResolutionStarter?.ownershipEpoch,
      bundle.adminResolutionStarter?.fencingToken,
      this.seedRecoveryRoute(bundle.adminResolutionStarter?.taskId ?? "task", "admin"),
      ["admin_resolution_seed"],
    );
    await release(
      BOOKING_DOMAIN,
      bundle.bookingIntent?.intentId ?? null,
      bundle.bookingIntent?.lifecycleLeaseRef,
      bundle.bookingIntent?.ownershipEpoch,
      bundle.bookingIntent?.fencingToken,
      this.seedRecoveryRoute(bundle.bookingIntent?.sourceTriageTaskRef ?? "task", "booking"),
      ["booking_handoff_seed"],
    );
    await release(
      PHARMACY_DOMAIN,
      bundle.pharmacyIntent?.intentId ?? null,
      bundle.pharmacyIntent?.lifecycleLeaseRef,
      bundle.pharmacyIntent?.ownershipEpoch,
      bundle.pharmacyIntent?.fencingToken,
      this.seedRecoveryRoute(bundle.pharmacyIntent?.sourceTriageTaskRef ?? "task", "pharmacy"),
      ["pharmacy_handoff_seed"],
    );
  }

  private async requireTask(taskId: string): Promise<TaskLeaseContextSnapshot> {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    return task.toSnapshot() as TaskLeaseContextSnapshot;
  }

  private async requireRequest(requestId: string, taskId: string) {
    const request = await this.triageApplication.controlPlaneRepositories.getRequest(requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${requestId} is required for ${taskId}.`);
    return request.toSnapshot();
  }

  private async requireCurrentDirectResolutionBundle(taskId: string) {
    const bundle = await this.endpointApplication.queryTaskEndpointDecision(taskId);
    invariant(bundle, "DECISION_BUNDLE_NOT_FOUND", `Current endpoint decision bundle is required for ${taskId}.`);
    invariant(
      bundle.epoch.epochState === "live" || bundle.epoch.epochState === "committed",
      "CURRENT_DECISION_EPOCH_NOT_LIVE",
      `Task ${taskId} requires a live or committed DecisionEpoch.`,
    );
    invariant(
      bundle.decision.decisionState === "submitted" ||
        bundle.decision.decisionState === "awaiting_approval",
      "ENDPOINT_DECISION_NOT_SETTLABLE",
      `Task ${taskId} requires a submitted or approval-cleared endpoint decision before direct consequence can settle.`,
    );
    invariant(
      bundle.decision.chosenEndpoint !== "duty_clinician_escalation",
      "DIRECT_RESOLUTION_ENDPOINT_UNSUPPORTED",
      "Urgent escalation routes through the approval and urgent escalation kernel.",
    );
    return bundle;
  }

  private async ensureApprovalSatisfied(
    taskId: string,
    decisionEpochRef: string,
  ): Promise<void> {
    const decisionBundle = await this.requireCurrentDirectResolutionBundle(taskId);
    invariant(
      decisionBundle.epoch.epochId === decisionEpochRef,
      "DECISION_EPOCH_DRIFTED",
      `Task ${taskId} approval evaluation must target the live DecisionEpoch.`,
    );
    if (decisionBundle.approvalAssessment.requiredApprovalMode === "not_required") {
      return;
    }
    const approvalBundle = await this.approvalApplication.queryTaskApprovalEscalation(taskId);
    invariant(
      approvalBundle.checkpoint?.decisionEpochRef === decisionEpochRef &&
        approvalBundle.checkpoint.state === "approved",
      "APPROVAL_CHECKPOINT_NOT_APPROVED",
      `Task ${taskId} requires an approved checkpoint for the current DecisionEpoch before direct consequence can settle.`,
    );
  }

  private async ensureLiveTaskMutationLease(
    taskId: string,
    actorRef: string,
    recordedAt: string,
  ): Promise<void> {
    const task = await this.requireTask(taskId);
    const leaseRef = optionalRef(task.lifecycleLeaseRef);
    invariant(
      leaseRef !== null,
      "TRIAGE_TASK_REQUIRES_LIVE_LEASE",
      `Task ${taskId} requires an active lifecycle lease for direct consequence mutation.`,
    );
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${TRIAGE_DOMAIN}::${taskId}`,
    );
    invariant(authorityState, "LEASE_AUTHORITY_NOT_FOUND", `Lease authority state is missing for ${taskId}.`);
    const currentLease = authorityState.currentLeaseRef
      ? await this.triageApplication.controlPlaneRepositories.getRequestLifecycleLease(
          authorityState.currentLeaseRef,
        )
      : undefined;
    const currentLeaseSnapshot = currentLease?.toSnapshot();
    if (
      currentLeaseSnapshot &&
      currentLeaseSnapshot.leaseId === leaseRef &&
      currentLeaseSnapshot.state === "active" &&
      currentLeaseSnapshot.ownershipEpoch === task.ownershipEpoch &&
      currentLeaseSnapshot.fencingToken === task.fencingToken &&
      authorityState.currentLineageEpoch === task.currentLineageFenceEpoch &&
      !this.isLeaseExpired(
        currentLeaseSnapshot.heartbeatAt,
        currentLeaseSnapshot.leaseTtlSeconds,
        recordedAt,
      )
    ) {
      return;
    }
    invariant(
      currentLeaseSnapshot?.leaseId === leaseRef &&
        (currentLeaseSnapshot.state === "expired" ||
          this.isLeaseExpired(
            currentLeaseSnapshot.heartbeatAt,
            currentLeaseSnapshot.leaseTtlSeconds,
            recordedAt,
          )),
      "TRIAGE_TASK_REQUIRES_RECOVERY",
      `Task ${taskId} requires explicit same-shell recovery before direct consequence mutation.`,
    );
    await this.triageApplication.reacquireTaskLease({
      taskId,
      actorRef,
      reacquiredAt: recordedAt,
    });
  }

  private async issueTaskCommand(input: {
    task: TaskLeaseContextSnapshot;
    actorRef: string;
    recordedAt: string;
    actionScope: string;
    semanticPayload: Record<string, unknown>;
  }) {
    const governingObjectVersionRef = await this.currentTaskControlPlaneVersionRef(
      input.task.taskId,
      `${input.task.taskId}@v${input.task.version}`,
    );
    const action = await this.leaseAuthority.registerCommandAction({
      leaseId: requireRef(input.task.lifecycleLeaseRef, "lifecycleLeaseRef"),
      domain: TRIAGE_DOMAIN,
      domainObjectRef: input.task.taskId,
      governingObjectVersionRef,
      presentedOwnershipEpoch: input.task.ownershipEpoch,
      presentedFencingToken: input.task.fencingToken,
      presentedLineageFenceEpoch: input.task.currentLineageFenceEpoch,
      actionScope: input.actionScope,
      governingObjectRef: input.task.taskId,
      canonicalObjectDescriptorRef: TRIAGE_DESCRIPTOR,
      initiatingBoundedContextRef: TRIAGE_DOMAIN,
      governingBoundedContextRef: TRIAGE_DOMAIN,
      lineageScope: "request",
      routeIntentRef: `route_intent_${input.actionScope}_${input.task.taskId}`,
      routeContractDigestRef: `route_contract_digest_${input.actionScope}_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: input.task.launchContextRef,
      edgeCorrelationId: `edge_${input.actionScope}_${input.task.taskId}`,
      initiatingUiEventRef: `ui_event_${input.actionScope}_${input.task.taskId}`,
      initiatingUiEventCausalityFrameRef: `ui_frame_${input.actionScope}_${input.task.taskId}`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_triage_workspace_v1",
      sourceCommandId: `cmd_${input.actionScope}_${input.task.taskId}_${input.recordedAt}`,
      transportCorrelationId: `transport_${input.actionScope}_${input.task.taskId}`,
      semanticPayload: input.semanticPayload,
      idempotencyKey: `idempotency_${input.actionScope}_${input.task.taskId}_${input.recordedAt}`,
      idempotencyRecordRef: `idempotency_record_${input.actionScope}_${input.task.taskId}`,
      commandFollowingTokenRef: `command_follow_${input.actionScope}_${input.task.taskId}`,
      expectedEffectSetRefs: [`triage.${input.task.taskId}.${input.actionScope}`],
      causalToken: `causal_${input.actionScope}_${input.task.taskId}_${input.recordedAt}`,
      createdAt: input.recordedAt,
      sameShellRecoveryRouteRef: this.taskRecoveryRoute(input.task.taskId),
      operatorVisibleWorkRef: `work_${input.task.taskId}`,
      blockedActionScopeRefs: [input.actionScope],
      detectedByRef: input.actorRef,
    });
    const settlement = await this.settlementAuthority.recordSettlement({
      actionRecordRef: action.actionRecord.actionRecordId,
      replayDecisionClass: "distinct",
      result: "applied",
      processingAcceptanceState: "accepted_for_processing",
      externalObservationState: "projection_visible",
      authoritativeOutcomeState: "settled",
      authoritativeProofClass: "review_disposition",
      sameShellRecoveryRef: this.taskRecoveryRoute(input.task.taskId),
      projectionVersionRef: `${input.task.taskId}@projection_${input.recordedAt}`,
      uiTransitionSettlementRef: `ui_transition_${action.actionRecord.actionRecordId}`,
      projectionVisibilityRef: "staff_workspace",
      auditRecordRef: `audit_${action.actionRecord.actionRecordId}`,
      blockingRefs: [],
      quietEligibleAt: input.recordedAt,
      lastSafeAnchorRef: input.task.launchContextRef,
      allowedSummaryTier: "full",
      recordedAt: input.recordedAt,
    });
    return {
      routeIntentBindingRef: action.actionRecord.toSnapshot().routeIntentRef,
      commandActionRecordRef: action.actionRecord.actionRecordId,
      commandSettlementRecordRef: settlement.settlement.settlementId,
    };
  }

  private async currentTaskControlPlaneVersionRef(
    taskId: string,
    fallback: string,
  ): Promise<string> {
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${TRIAGE_DOMAIN}::${taskId}`,
    );
    return authorityState?.governingObjectVersionRef ?? fallback;
  }

  private taskRecoveryRoute(taskId: string): string {
    return `/workspace/tasks/${taskId}/recover`;
  }

  private seedRecoveryRoute(
    taskId: string,
    seedFamily: "callback" | "message" | "admin" | "booking" | "pharmacy",
  ): string {
    return `/workspace/tasks/${taskId}/${seedFamily}/recover`;
  }

  private isLeaseExpired(heartbeatAt: string, leaseTtlSeconds: number, at: string): boolean {
    return Date.parse(heartbeatAt) + leaseTtlSeconds * 1000 <= Date.parse(at);
  }

  private readPayloadString(
    payload: Readonly<Record<string, unknown>>,
    key: string,
  ): string | null {
    const value = payload[key];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  }

  private readPayloadStringArray(
    payload: Readonly<Record<string, unknown>>,
    key: string,
  ): string[] | null {
    const value = payload[key];
    if (!Array.isArray(value)) {
      return null;
    }
    const strings = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    return strings.length > 0 ? [...new Set(strings.map((entry) => entry.trim()))] : null;
  }

  private readPayloadBoolean(
    payload: Readonly<Record<string, unknown>>,
    key: string,
  ): boolean | null {
    const value = payload[key];
    return typeof value === "boolean" ? value : null;
  }
}

function uniqueRefs(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0))];
}

export function createPhase3DirectResolutionApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  endpointApplication?: Phase3EndpointDecisionEngineApplication;
  approvalApplication?: Phase3ApprovalEscalationApplication;
  repositories?: Phase3DirectResolutionKernelRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3DirectResolutionApplication {
  return new Phase3DirectResolutionApplicationImpl(options);
}
