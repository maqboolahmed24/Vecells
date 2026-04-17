import {
  CommandActionRecordDocument,
  createCommandSettlementAuthorityService,
  createLeaseFenceCommandAuthorityService,
  type CommandSettlementRecordDocument,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3EndpointDecisionKernelService,
  createPhase3EndpointDecisionKernelStore,
  type DecisionFenceWriteState,
  type DecisionPreviewInput,
  type EndpointDecisionBundle,
  type EndpointDecisionMutationResult,
  type Phase3EndpointCode,
  type Phase3EndpointDecisionKernelRepositories,
  type Phase3EndpointDecisionKernelService,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

const ENDPOINT_DECISION_DOMAIN = "triage_workspace";
const ENDPOINT_DECISION_DESCRIPTOR = "EndpointDecision";
export const PHASE3_ENDPOINT_DECISION_SERVICE_NAME = "Phase3EndpointDecisionEngineApplication";
export const PHASE3_ENDPOINT_DECISION_SCHEMA_VERSION = "238.phase3.endpoint-decision-engine.v1";
export const PHASE3_ENDPOINT_DECISION_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/:taskId/endpoint-decision",
] as const;

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(typeof value === "string" && value.trim().length > 0, `INVALID_${field.toUpperCase()}`, `${field} is required.`);
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
  invariant(!Number.isNaN(Date.parse(normalized)), `INVALID_${field.toUpperCase()}_TIMESTAMP`, `${field} must be a valid ISO-8601 timestamp.`);
  return normalized;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export const phase3EndpointDecisionRoutes = [
  {
    routeId: "workspace_task_endpoint_decision_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/endpoint-decision",
    contractFamily: "EndpointDecisionBundleContract",
    purpose:
      "Expose the current DecisionEpoch, EndpointDecision, EndpointDecisionBinding, approval requirement, boundary tuple, preview artifact, and latest DecisionSupersessionRecord for one task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_select_endpoint",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:select-endpoint",
    contractFamily: "EndpointDecisionSelectCommandContract",
    purpose:
      "Select one Phase 3 endpoint, mint the first live DecisionEpoch when needed, and persist the draft EndpointDecision through the canonical command chain.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_update_endpoint_payload",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:update-payload",
    contractFamily: "EndpointDecisionPayloadUpdateCommandContract",
    purpose:
      "Update endpoint payload under the current unsuperseded DecisionEpoch or rotate the epoch when material drift invalidates the current fence tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_preview_endpoint_outcome",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:preview",
    contractFamily: "EndpointDecisionPreviewCommandContract",
    purpose:
      "Generate one deterministic summary-first EndpointOutcomePreviewArtifact from the current decision, evidence tuple, duplicate posture, safety posture, and selected anchor.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_regenerate_endpoint_preview",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:regenerate-preview",
    contractFamily: "EndpointDecisionPreviewRegenerationCommandContract",
    purpose:
      "Regenerate preview output under the current tuple while degrading superseded previews to recovery-only provenance instead of leaving stale preview state writable.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_submit_endpoint_decision",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:submit",
    contractFamily: "EndpointDecisionSubmitCommandContract",
    purpose:
      "Commit a decision only when binding state remains live and approval burden is not required, otherwise persist an explicit blocked_approval_gate or blocked_policy settlement.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_invalidate_endpoint_decision",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:invalidate",
    contractFamily: "EndpointDecisionInvalidationCommandContract",
    purpose:
      "Append DecisionSupersessionRecord, freeze the stale preview path to recovery-only provenance, and mint a replacement live epoch when material drift invalidates current endpoint posture.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3EndpointDecisionPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    "phase3_decision_epochs",
    "phase3_endpoint_decisions",
    "phase3_endpoint_decision_bindings",
    "phase3_endpoint_decision_action_records",
    "phase3_endpoint_decision_settlements",
    "phase3_endpoint_outcome_preview_artifacts",
    "phase3_decision_supersession_records",
    "phase3_approval_requirement_assessments",
    "phase3_endpoint_boundary_tuples",
  ]),
] as const;

export const phase3EndpointDecisionMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    "services/command-api/migrations/114_phase3_endpoint_decision_engine.sql",
  ]),
] as const;

export interface EndpointDecisionFenceOverrides {
  selectedAnchorRef?: string;
  selectedAnchorTupleHashRef?: string;
  governingSnapshotRef?: string;
  evidenceSnapshotRef?: string;
  compiledPolicyBundleRef?: string;
  safetyDecisionEpochRef?: string;
  duplicateLineageRef?: string | null;
  surfaceRouteContractRef?: string;
  surfacePublicationRef?: string;
  runtimePublicationBundleRef?: string;
  releasePublicationParityRef?: string;
  workspaceSliceTrustProjectionRef?: string;
  continuityEvidenceRef?: string;
  releaseRecoveryDispositionRef?: string;
  writeState?: DecisionFenceWriteState;
}

export interface SelectEndpointDecisionCommandInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  chosenEndpoint: Phase3EndpointCode;
  reasoningText: string;
  payload: Readonly<Record<string, unknown>>;
  fenceOverrides?: EndpointDecisionFenceOverrides;
  manualReplace?: boolean;
}

export interface UpdateEndpointDecisionPayloadCommandInput
  extends SelectEndpointDecisionCommandInput {
  decisionId: string;
}

export interface PreviewEndpointDecisionCommandInput {
  taskId: string;
  decisionId: string;
  actorRef: string;
  recordedAt: string;
  fenceOverrides?: EndpointDecisionFenceOverrides;
}

export interface SubmitEndpointDecisionCommandInput
  extends PreviewEndpointDecisionCommandInput {}

export interface InvalidateEndpointDecisionCommandInput
  extends PreviewEndpointDecisionCommandInput {
  manualReplace?: boolean;
}

export interface Phase3EndpointDecisionEngineApplication {
  readonly serviceName: typeof PHASE3_ENDPOINT_DECISION_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_ENDPOINT_DECISION_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_ENDPOINT_DECISION_QUERY_SURFACES;
  readonly routes: typeof phase3EndpointDecisionRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly decisionRepositories: Phase3EndpointDecisionKernelRepositories;
  readonly decisionService: Phase3EndpointDecisionKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskEndpointDecision(taskId: string): Promise<EndpointDecisionBundle | null>;
  selectEndpoint(input: SelectEndpointDecisionCommandInput): Promise<EndpointDecisionMutationResult>;
  updateEndpointPayload(
    input: UpdateEndpointDecisionPayloadCommandInput,
  ): Promise<EndpointDecisionMutationResult>;
  previewEndpointOutcome(
    input: PreviewEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult>;
  regeneratePreview(
    input: PreviewEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult>;
  submitEndpointDecision(
    input: SubmitEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult>;
  invalidateStaleDecision(
    input: InvalidateEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult>;
}

interface TaskLeaseContextSnapshot {
  taskId: string;
  requestId: string;
  queueKey: string;
  assignedTo: string | null;
  reviewVersion: number;
  version: number;
  lifecycleLeaseRef: string | null;
  leaseAuthorityRef: string | null;
  launchContextRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  activeReviewSessionRef: string | null;
  duplicateResolutionDecisionRef: string | null;
  duplicateClusterRef: string | null;
  duplicateReviewSnapshotRef: string | null;
  ownershipState: string;
}

class Phase3EndpointDecisionEngineApplicationImpl
  implements Phase3EndpointDecisionEngineApplication
{
  readonly serviceName = PHASE3_ENDPOINT_DECISION_SERVICE_NAME;
  readonly schemaVersion = PHASE3_ENDPOINT_DECISION_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_ENDPOINT_DECISION_QUERY_SURFACES;
  readonly routes = phase3EndpointDecisionRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly decisionRepositories: Phase3EndpointDecisionKernelRepositories;
  readonly decisionService: Phase3EndpointDecisionKernelService;
  readonly persistenceTables = phase3EndpointDecisionPersistenceTables;
  readonly migrationPlanRef = phase3EndpointDecisionMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3EndpointDecisionMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;
  private readonly leaseAuthority;
  private readonly settlementAuthority;

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    decisionRepositories?: Phase3EndpointDecisionKernelRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_endpoint_decision_engine");
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({ idGenerator: this.idGenerator });
    this.decisionRepositories =
      options?.decisionRepositories ?? createPhase3EndpointDecisionKernelStore();
    this.decisionService = createPhase3EndpointDecisionKernelService(this.decisionRepositories, {
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
  }

  async queryTaskEndpointDecision(taskId: string): Promise<EndpointDecisionBundle | null> {
    return this.decisionService.queryTaskDecisionBundle(taskId);
  }

  async selectEndpoint(
    input: SelectEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult> {
    await this.ensureLiveMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const context = await this.buildMutationContext(
      input.taskId,
      input.actorRef,
      input.recordedAt,
      "select_endpoint",
      input.chosenEndpoint,
      input.payload,
      input.fenceOverrides,
    );
    return this.decisionService.selectEndpoint({
      taskId: context.task.taskId,
      requestId: context.task.requestId,
      chosenEndpoint: input.chosenEndpoint,
      reasoningText: input.reasoningText,
      payload: input.payload,
      fence: context.fence,
      previewInput: context.previewInput,
      command: context.command,
      manualReplace: input.manualReplace,
    });
  }

  async updateEndpointPayload(
    input: UpdateEndpointDecisionPayloadCommandInput,
  ): Promise<EndpointDecisionMutationResult> {
    await this.ensureLiveMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const context = await this.buildMutationContext(
      input.taskId,
      input.actorRef,
      input.recordedAt,
      "update_payload",
      input.chosenEndpoint,
      input.payload,
      input.fenceOverrides,
    );
    return this.decisionService.updateEndpointPayload({
      taskId: context.task.taskId,
      requestId: context.task.requestId,
      decisionId: input.decisionId,
      chosenEndpoint: input.chosenEndpoint,
      reasoningText: input.reasoningText,
      payload: input.payload,
      fence: context.fence,
      previewInput: context.previewInput,
      command: context.command,
      manualReplace: input.manualReplace,
    });
  }

  async previewEndpointOutcome(
    input: PreviewEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult> {
    await this.ensureLiveMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const context = await this.buildPreviewContext(
      input.taskId,
      input.decisionId,
      input.actorRef,
      input.recordedAt,
      "preview_outcome",
      input.fenceOverrides,
    );
    return this.decisionService.previewEndpointOutcome({
      taskId: context.task.taskId,
      requestId: context.task.requestId,
      decisionId: input.decisionId,
      fence: context.fence,
      previewInput: context.previewInput,
      command: context.command,
    });
  }

  async regeneratePreview(
    input: PreviewEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult> {
    await this.ensureLiveMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const context = await this.buildPreviewContext(
      input.taskId,
      input.decisionId,
      input.actorRef,
      input.recordedAt,
      "regenerate_preview",
      input.fenceOverrides,
    );
    return this.decisionService.regeneratePreview({
      taskId: context.task.taskId,
      requestId: context.task.requestId,
      decisionId: input.decisionId,
      fence: context.fence,
      previewInput: context.previewInput,
      command: context.command,
    });
  }

  async submitEndpointDecision(
    input: SubmitEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult> {
    await this.ensureLiveMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const context = await this.buildPreviewContext(
      input.taskId,
      input.decisionId,
      input.actorRef,
      input.recordedAt,
      "submit_endpoint",
      input.fenceOverrides,
    );
    const result = await this.decisionService.submitEndpointDecision({
      taskId: context.task.taskId,
      requestId: context.task.requestId,
      decisionId: input.decisionId,
      fence: context.fence,
      previewInput: context.previewInput,
      command: context.command,
    });

    if (result.settlement.result === "submitted") {
      await this.advanceTaskToEndpointSelected(context.task.taskId, input.actorRef, input.recordedAt, {
        currentDecisionEpochRef: result.epoch.epochId,
        currentEndpointDecisionRef: result.decision.decisionId,
      });
    }

    return result;
  }

  async invalidateStaleDecision(
    input: InvalidateEndpointDecisionCommandInput,
  ): Promise<EndpointDecisionMutationResult> {
    await this.ensureLiveMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const context = await this.buildPreviewContext(
      input.taskId,
      input.decisionId,
      input.actorRef,
      input.recordedAt,
      "regenerate_preview",
      input.fenceOverrides,
    );
    return this.decisionService.invalidateStaleDecision({
      taskId: context.task.taskId,
      requestId: context.task.requestId,
      decisionId: input.decisionId,
      fence: context.fence,
      previewInput: context.previewInput,
      command: context.command,
      manualReplace: input.manualReplace,
    });
  }

  private async buildMutationContext(
    taskId: string,
    actorRef: string,
    recordedAt: string,
    actionScope: string,
    chosenEndpoint: Phase3EndpointCode,
    payload: Readonly<Record<string, unknown>>,
    fenceOverrides?: EndpointDecisionFenceOverrides,
  ) {
    const base = await this.buildBaseContext(taskId, fenceOverrides);
    const command = await this.issueSettledCommand({
      task: base.task,
      actorRef,
      recordedAt,
      actionScope,
      semanticPayload: {
        endpoint: chosenEndpoint,
        payloadDigest: stableReviewDigest(payload),
      },
    });
    return {
      ...base,
      command,
    };
  }

  private async buildPreviewContext(
    taskId: string,
    decisionId: string,
    actorRef: string,
    recordedAt: string,
    actionScope: string,
    fenceOverrides?: EndpointDecisionFenceOverrides,
  ) {
    const base = await this.buildBaseContext(taskId, fenceOverrides);
    const command = await this.issueSettledCommand({
      task: base.task,
      actorRef,
      recordedAt,
      actionScope,
      semanticPayload: {
        decisionId,
        previewContextDigest: stableReviewDigest({
          decisionId,
          selectedAnchorTupleHashRef: base.fence.selectedAnchorTupleHashRef,
          writeState: base.fence.writeState,
        }),
      },
    });
    return {
      ...base,
      command,
    };
  }

  private async buildBaseContext(taskId: string, fenceOverrides?: EndpointDecisionFenceOverrides) {
    const task = await this.requireTask(taskId);
    const reviewSession = await this.requireReviewSession(task);
    const request = await this.requireRequest(task.taskId, task.requestId);
    const fence = this.buildFence(task, reviewSession, request, fenceOverrides);
    return {
      task,
      reviewSession,
      request,
      fence,
      previewInput: this.buildPreviewInput(task, request),
    };
  }

  private async requireTask(taskId: string) {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    const snapshot = task.toSnapshot();
    invariant(
      snapshot.ownershipState === "active" &&
        snapshot.lifecycleLeaseRef !== null &&
        snapshot.leaseAuthorityRef !== null,
      "TRIAGE_TASK_REQUIRES_LIVE_LEASE",
      `Task ${taskId} requires an active lifecycle lease for endpoint mutation.`,
    );
    return snapshot as TaskLeaseContextSnapshot;
  }

  private async requireReviewSession(task: { taskId: string; activeReviewSessionRef: string | null }) {
    const reviewSessionId = optionalRef(task.activeReviewSessionRef);
    invariant(
      reviewSessionId !== null,
      "ACTIVE_REVIEW_SESSION_REQUIRED",
      `Task ${task.taskId} requires an active review session for endpoint decision work.`,
    );
    const reviewSession = await this.triageApplication.triageRepositories.getReviewSession(reviewSessionId);
    invariant(reviewSession, "REVIEW_SESSION_NOT_FOUND", `ReviewSession ${reviewSessionId} is required.`);
    return reviewSession.toSnapshot();
  }

  private async requireRequest(taskId: string, requestId: string) {
    const request = await this.triageApplication.controlPlaneRepositories.getRequest(requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${requestId} is required for task ${taskId}.`);
    return request.toSnapshot();
  }

  private buildFence(
    task: ReturnType<typeof this.requireTask> extends Promise<infer T> ? T : never,
    reviewSession: ReturnType<typeof this.requireReviewSession> extends Promise<infer T> ? T : never,
    request: ReturnType<typeof this.requireRequest> extends Promise<infer T> ? T : never,
    overrides?: EndpointDecisionFenceOverrides,
  ) {
    const surfacePublicationRef =
      overrides?.surfacePublicationRef ?? reviewSession.surfacePublicationRef;
    const runtimePublicationBundleRef =
      overrides?.runtimePublicationBundleRef ?? reviewSession.runtimePublicationBundleRef;
    return {
      taskId: task.taskId,
      requestId: task.requestId,
      reviewSessionRef: reviewSession.reviewSessionId,
      reviewVersionRef: task.reviewVersion,
      selectedAnchorRef: overrides?.selectedAnchorRef ?? reviewSession.selectedAnchorRef,
      selectedAnchorTupleHashRef:
        overrides?.selectedAnchorTupleHashRef ?? reviewSession.selectedAnchorTupleHashRef,
      governingSnapshotRef:
        overrides?.governingSnapshotRef ??
        request.currentEvidenceSnapshotRef ??
        `governing_snapshot_${task.requestId}`,
      evidenceSnapshotRef:
        overrides?.evidenceSnapshotRef ??
        request.currentEvidenceSnapshotRef ??
        `evidence_snapshot_${task.requestId}`,
      compiledPolicyBundleRef:
        overrides?.compiledPolicyBundleRef ?? "phase3_endpoint_policy_bundle_238.v1",
      safetyDecisionEpochRef:
        overrides?.safetyDecisionEpochRef ??
        `${task.requestId}::safety_epoch::${request.safetyDecisionEpoch}`,
      duplicateLineageRef:
        overrides?.duplicateLineageRef !== undefined
          ? overrides.duplicateLineageRef
          : task.duplicateResolutionDecisionRef ??
            task.duplicateClusterRef ??
            task.duplicateReviewSnapshotRef ??
            null,
      lineageFenceEpoch: task.currentLineageFenceEpoch,
      ownershipEpochRef: task.ownershipEpoch,
      audienceSurfaceRuntimeBindingRef: reviewSession.audienceSurfaceRuntimeBindingRef,
      surfaceRouteContractRef:
        overrides?.surfaceRouteContractRef ?? reviewSession.surfaceRouteContractRef,
      surfacePublicationRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef:
        overrides?.releasePublicationParityRef ??
        `${surfacePublicationRef}::${runtimePublicationBundleRef}`,
      workspaceSliceTrustProjectionRef:
        overrides?.workspaceSliceTrustProjectionRef ??
        reviewSession.workspaceSliceTrustProjectionRef,
      continuityEvidenceRef:
        overrides?.continuityEvidenceRef ??
        `${task.taskId}::workspace_continuity_evidence::232`,
      releaseRecoveryDispositionRef:
        overrides?.releaseRecoveryDispositionRef ?? reviewSession.releaseRecoveryDispositionRef,
      writeState: overrides?.writeState ?? "live",
    } as const;
  }

  private buildPreviewInput(
    task: ReturnType<typeof this.requireTask> extends Promise<infer T> ? T : never,
    request: ReturnType<typeof this.requireRequest> extends Promise<infer T> ? T : never,
  ): DecisionPreviewInput {
    const sourceArtifactRefs = uniqueSorted(
      [
        request.originIngressRecordRef,
        request.normalizedSubmissionRef,
        request.currentEvidenceSnapshotRef,
        request.currentEvidenceAssimilationRef,
        request.currentMaterialDeltaAssessmentRef,
        request.currentEvidenceClassificationRef,
        request.currentSafetyDecisionRef,
        request.currentUrgentDiversionSettlementRef,
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    );
    return {
      requestSummaryLines: [
        `Request ${task.requestId}`,
        `Queue ${task.queueKey}`,
        `Review version ${task.reviewVersion}`,
      ],
      patientNarrative: [
        request.narrativeRef ? `Narrative ${request.narrativeRef}` : "Narrative pending",
      ],
      safetySummaryLines: [
        `Safety ${request.safetyState}`,
        `Workflow ${request.workflowState}`,
      ],
      contactSummaryLines: [
        request.contactPreferencesRef
          ? `Contact preferences ${request.contactPreferencesRef}`
          : "Contact preferences unresolved",
      ],
      duplicateSummaryLines: [
        task.duplicateClusterRef
          ? `Duplicate cluster ${task.duplicateClusterRef}`
          : "Duplicate cluster clear",
      ],
      identitySummaryLines: [
        request.patientRef ? `Patient ${request.patientRef}` : `Identity ${request.identityState}`,
      ],
      priorResponseSummaryLines: [
        request.currentEvidenceAssimilationRef
          ? `Latest assimilation ${request.currentEvidenceAssimilationRef}`
          : "No additional patient evidence assimilated",
      ],
      sourceArtifactRefs,
      reviewBundleDigestRef: buildReviewBundleDigest(task, request, sourceArtifactRefs),
      templateVersion: "238.endpoint-preview.v1",
      rulesVersion: "235.review-bundle-summary.v1",
    };
  }

  private async ensureLiveMutationLease(
    taskId: string,
    actorRef: string,
    recordedAt: string,
  ): Promise<void> {
    const task = await this.requireTask(taskId);
    const leaseRef = optionalRef(task.lifecycleLeaseRef);
    invariant(
      leaseRef !== null,
      "TRIAGE_TASK_REQUIRES_LIVE_LEASE",
      `Task ${taskId} requires an active lifecycle lease for endpoint mutation.`,
    );
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${ENDPOINT_DECISION_DOMAIN}::${taskId}`,
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
      !this.isLeaseExpired(currentLeaseSnapshot.heartbeatAt, currentLeaseSnapshot.leaseTtlSeconds, recordedAt)
    ) {
      return;
    }
    invariant(
      currentLeaseSnapshot?.leaseId === leaseRef &&
        (currentLeaseSnapshot.state === "expired" ||
          this.isLeaseExpired(currentLeaseSnapshot.heartbeatAt, currentLeaseSnapshot.leaseTtlSeconds, recordedAt)),
      "TRIAGE_TASK_REQUIRES_RECOVERY",
      `Task ${taskId} requires explicit same-shell recovery before endpoint mutation.`,
    );
    await this.triageApplication.reacquireTaskLease({
      taskId,
      actorRef,
      reacquiredAt: recordedAt,
    });
  }

  private isLeaseExpired(
    heartbeatAt: string,
    leaseTtlSeconds: number,
    at: string,
  ): boolean {
    return Date.parse(heartbeatAt) + leaseTtlSeconds * 1000 <= Date.parse(at);
  }

  private async currentControlPlaneVersionRef(
    taskId: string,
    fallback: string,
  ): Promise<string> {
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${ENDPOINT_DECISION_DOMAIN}::${taskId}`,
    );
    return authorityState?.governingObjectVersionRef ?? fallback;
  }

  private async issueSettledCommand(input: {
    task: TaskLeaseContextSnapshot;
    actorRef: string;
    recordedAt: string;
    actionScope: string;
    semanticPayload: Record<string, unknown>;
  }) {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const governingObjectVersionRef = await this.currentControlPlaneVersionRef(
      input.task.taskId,
      `${input.task.taskId}@v${input.task.version}`,
    );
    const acquiredAction = await this.leaseAuthority.registerCommandAction({
      leaseId: requireRef(input.task.lifecycleLeaseRef, "lifecycleLeaseRef"),
      domain: ENDPOINT_DECISION_DOMAIN,
      domainObjectRef: input.task.taskId,
      governingObjectVersionRef,
      presentedOwnershipEpoch: input.task.ownershipEpoch,
      presentedFencingToken: input.task.fencingToken,
      presentedLineageFenceEpoch: input.task.currentLineageFenceEpoch,
      actionScope: input.actionScope,
      governingObjectRef: input.task.taskId,
      canonicalObjectDescriptorRef: ENDPOINT_DECISION_DESCRIPTOR,
      initiatingBoundedContextRef: ENDPOINT_DECISION_DOMAIN,
      governingBoundedContextRef: ENDPOINT_DECISION_DOMAIN,
      lineageScope: "request",
      routeIntentRef: `route_intent_${input.actionScope}_${input.task.taskId}`,
      routeContractDigestRef: `route_contract_digest_${input.actionScope}_238_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: input.task.launchContextRef,
      edgeCorrelationId: `edge_${input.actionScope}_${input.task.taskId}`,
      initiatingUiEventRef: `ui_event_${input.actionScope}_${input.task.taskId}`,
      initiatingUiEventCausalityFrameRef: `ui_frame_${input.actionScope}_${input.task.taskId}`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_phase3_endpoint_decision_238.v1",
      sourceCommandId: `cmd_${input.actionScope}_${input.task.taskId}_${recordedAt}`,
      transportCorrelationId: `transport_${input.actionScope}_${input.task.taskId}`,
      semanticPayload: input.semanticPayload,
      idempotencyKey: `idempotency_${input.actionScope}_${input.task.taskId}_${recordedAt}`,
      idempotencyRecordRef: `idempotency_record_${input.actionScope}_${input.task.taskId}`,
      commandFollowingTokenRef: `command_follow_${input.actionScope}_${input.task.taskId}`,
      expectedEffectSetRefs: [`endpoint.${input.task.taskId}.${input.actionScope}`],
      causalToken: `causal_${input.actionScope}_${input.task.taskId}_${recordedAt}`,
      createdAt: recordedAt,
      sameShellRecoveryRouteRef: this.recoveryRouteRef(input.task.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(input.task.taskId),
      blockedActionScopeRefs: [input.actionScope],
      detectedByRef: input.actorRef,
    });
    const settlement = await this.settlementAuthority.recordSettlement({
      actionRecordRef: acquiredAction.actionRecord.actionRecordId,
      replayDecisionClass: "distinct",
      result: "applied",
      processingAcceptanceState: "accepted_for_processing",
      externalObservationState: "projection_visible",
      authoritativeOutcomeState: "settled",
      authoritativeProofClass: "review_disposition",
      sameShellRecoveryRef: this.recoveryRouteRef(input.task.taskId),
      projectionVersionRef: `${input.task.taskId}@projection_${recordedAt}`,
      uiTransitionSettlementRef: `ui_transition_${acquiredAction.actionRecord.actionRecordId}`,
      projectionVisibilityRef: "staff_workspace",
      auditRecordRef: `audit_${acquiredAction.actionRecord.actionRecordId}`,
      blockingRefs: [],
      quietEligibleAt: recordedAt,
      recordedAt,
    });
    return this.asDomainCommandContext(input.actorRef, acquiredAction.actionRecord, settlement.settlement);
  }

  private asDomainCommandContext(
    actorRef: string,
    actionRecord: CommandActionRecordDocument,
    settlementRecord: CommandSettlementRecordDocument,
  ) {
    const action = actionRecord.toSnapshot();
    const settlement = settlementRecord.toSnapshot();
    return {
      actorRef,
      routeIntentTupleHash: action.routeIntentTupleHash,
      routeIntentBindingRef: action.routeIntentRef,
      commandActionRecordRef: action.actionRecordId,
      commandSettlementRecordRef: settlement.settlementId,
      transitionEnvelopeRef: `transition_envelope_${action.actionRecordId}_${settlement.settlementId}`,
      releaseRecoveryDispositionRef:
        settlement.sameShellRecoveryRef ?? `recovery_disposition_${action.actionRecordId}`,
      causalToken: action.causalToken,
      recordedAt: settlement.recordedAt,
      recoveryRouteRef:
        settlement.sameShellRecoveryRef ?? this.recoveryRouteRef(action.governingObjectRef),
    };
  }

  private recoveryRouteRef(taskId: string): string {
    return `/workspace/tasks/${taskId}/recover`;
  }

  private operatorVisibleWorkRef(taskId: string): string {
    return `task_work_${taskId}`;
  }

  private async advanceTaskToEndpointSelected(
    taskId: string,
    actorRef: string,
    recordedAt: string,
    refs: {
      currentDecisionEpochRef: string;
      currentEndpointDecisionRef: string;
    },
  ): Promise<void> {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    const snapshot = task.toSnapshot();
    if (snapshot.status === "endpoint_selected") {
      return;
    }
    invariant(
      snapshot.status === "in_review" || snapshot.status === "review_resumed",
      "TRIAGE_TASK_STATUS_NOT_SUBMITTABLE",
      `Task ${taskId} cannot advance to endpoint_selected from ${snapshot.status}.`,
    );
    await this.triageApplication.markEndpointSelected({
      taskId,
      actorRef,
      recordedAt,
      currentDecisionEpochRef: refs.currentDecisionEpochRef,
      currentEndpointDecisionRef: refs.currentEndpointDecisionRef,
    });
  }
}

function buildReviewBundleDigest(
  task: {
    taskId: string;
    requestId: string;
    queueKey: string;
    reviewVersion: number;
    currentLineageFenceEpoch: number;
  },
  request: {
    currentEvidenceSnapshotRef: string | null;
    currentEvidenceAssimilationRef: string | null;
    currentMaterialDeltaAssessmentRef: string | null;
    currentEvidenceClassificationRef: string | null;
    currentSafetyDecisionRef: string | null;
    currentUrgentDiversionSettlementRef: string | null;
  },
  sourceArtifactRefs: readonly string[],
): string {
  return buildPreviewDigest({
    taskId: task.taskId,
    requestId: task.requestId,
    queueKey: task.queueKey,
    reviewVersion: task.reviewVersion,
    currentLineageFenceEpoch: task.currentLineageFenceEpoch,
    currentEvidenceSnapshotRef: request.currentEvidenceSnapshotRef,
    currentEvidenceAssimilationRef: request.currentEvidenceAssimilationRef,
    currentMaterialDeltaAssessmentRef: request.currentMaterialDeltaAssessmentRef,
    currentEvidenceClassificationRef: request.currentEvidenceClassificationRef,
    currentSafetyDecisionRef: request.currentSafetyDecisionRef,
    currentUrgentDiversionSettlementRef: request.currentUrgentDiversionSettlementRef,
    sourceArtifactRefs,
  });
}

function buildPreviewDigest(input: Record<string, unknown>): string {
  return `review_bundle_${stableReviewDigest(input)}`;
}

export function createPhase3EndpointDecisionEngineApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  decisionRepositories?: Phase3EndpointDecisionKernelRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3EndpointDecisionEngineApplication {
  return new Phase3EndpointDecisionEngineApplicationImpl(options);
}
