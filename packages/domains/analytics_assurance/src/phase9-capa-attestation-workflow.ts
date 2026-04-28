import { hashAssurancePayload, orderedSetHash } from "./phase9-assurance-ledger-contracts";
import type {
  AssuranceControlRecord,
  AssurancePackActionRecord,
  AssurancePackActionType,
  AssurancePackFactoryResult,
  AssurancePackSettlement,
  AssurancePackSettlementResult,
  EvidenceGapRecord,
  ReproductionState,
} from "./phase9-assurance-pack-factory";
import { createPhase9AssurancePackFactoryFixture } from "./phase9-assurance-pack-factory";

export const PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION =
  "441.phase9.capa-attestation-workflow.v1";

export type EvidenceGapQueueStatus =
  | "open"
  | "in_progress"
  | "awaiting_evidence"
  | "awaiting_attestation"
  | "resolved"
  | "closed"
  | "superseded";

export type EvidenceGapQueueType =
  | EvidenceGapRecord["gapType"]
  | "missing_attestation"
  | "incident_capa_follow_up_required";

export type CAPAActionStatus =
  | "open"
  | "in_progress"
  | "awaiting_evidence"
  | "awaiting_attestation"
  | "completed"
  | "rejected"
  | "superseded"
  | "cancelled";

export type WorkflowMutationResult =
  | "created"
  | "updated"
  | "blocked"
  | "idempotent_replay";

export interface AssuranceWorkflowActorContext {
  readonly tenantId: string;
  readonly actorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly generatedAt: string;
}

export interface AssuranceWorkflowGraphVerdictRef {
  readonly verdictId: string;
  readonly state: "complete" | "partial" | "stale" | "blocked";
  readonly graphHash: string;
  readonly decisionHash: string;
  readonly reasonCodes: readonly string[];
  readonly trustBlockingRefs: readonly string[];
}

export interface EvidenceGapQueueRecord {
  readonly evidenceGapQueueRecordId: string;
  readonly evidenceGapRecordRef: string;
  readonly tenantId: string;
  readonly scopeRef: string;
  readonly controlRecordRef: string;
  readonly controlCode: string;
  readonly frameworkCode: string;
  readonly frameworkVersionRef: string;
  readonly sourcePackRef: string;
  readonly sourcePackVersionHash: string;
  readonly sourceControlRef: string;
  readonly gapType: EvidenceGapQueueType;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly dueAt: string;
  readonly remediationRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly originGraphEdgeRefs: readonly string[];
  readonly graphHash: string;
  readonly status: EvidenceGapQueueStatus;
  readonly ownerRef: string;
  readonly ownerRole: string;
  readonly sourceFrameworkRef: string;
  readonly deterministicReasonCode: string;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly versionHash: string;
  readonly auditRefs: readonly string[];
}

export interface EvidenceGapQueuePage {
  readonly rows: readonly EvidenceGapQueueRecord[];
  readonly nextCursor?: string;
}

export interface EvidenceGapQueueDto {
  readonly gapRef: string;
  readonly severity: EvidenceGapQueueRecord["severity"];
  readonly reason: string;
  readonly controlRef: string;
  readonly frameworkRef: string;
  readonly ownerRef: string;
  readonly dueAt: string;
  readonly graphState: string;
  readonly trustState: string;
  readonly capaState: CAPAActionStatus | "none";
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly auditRefs: readonly string[];
}

export interface CAPAAction {
  readonly capaActionId: string;
  readonly tenantId: string;
  readonly sourceRef: string;
  readonly rootCauseRef: string;
  readonly ownerRef: string;
  readonly approverRef?: string;
  readonly targetDate: string;
  readonly status: CAPAActionStatus;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly evidenceGapRefs: readonly string[];
  readonly incidentRefs: readonly string[];
  readonly controlRefs: readonly string[];
  readonly graphHash: string;
  readonly auditRefs: readonly string[];
  readonly attachmentArtifactRefs: readonly string[];
  readonly governedExceptionRef?: string;
  readonly supersedesCapaActionRef?: string;
  readonly versionHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly closedAt?: string;
}

export interface AssuranceWorkflowAuditRecord {
  readonly auditRecordId: string;
  readonly tenantId: string;
  readonly actorRef: string;
  readonly purposeOfUseRef: string;
  readonly mutationType: string;
  readonly targetRef: string;
  readonly result: string;
  readonly reasonRefs: readonly string[];
  readonly packVersionHash?: string;
  readonly graphHash: string;
  readonly commandHash: string;
  readonly recordedAt: string;
}

export interface CAPAWorkflowMutationResult {
  readonly result: WorkflowMutationResult;
  readonly capaAction: CAPAAction;
  readonly auditRecords: readonly AssuranceWorkflowAuditRecord[];
  readonly blockerRefs: readonly string[];
}

export interface PackWorkflowActionInput {
  readonly actor: AssuranceWorkflowActorContext;
  readonly packResult: AssurancePackFactoryResult;
  readonly actionType: AssurancePackActionType;
  readonly routeIntentRef: string;
  readonly scopeTokenRef: string;
  readonly idempotencyKey: string;
  readonly graphVerdict: AssuranceWorkflowGraphVerdictRef;
  readonly currentPackVersionHash?: string;
  readonly currentGraphHash?: string;
  readonly currentRedactionPolicyHash?: string;
  readonly artifactPresentationContractRef?: string;
  readonly artifactTransferSettlementRef?: string;
  readonly outboundNavigationGrantPolicyRef?: string;
  readonly openGapRecords?: readonly EvidenceGapQueueRecord[];
  readonly capaActions?: readonly CAPAAction[];
  readonly priorAttestationActorRef?: string;
  readonly packSuperseded?: boolean;
  readonly routePublicationState?: "live" | "stale" | "blocked";
}

export interface PackWorkflowActionResult {
  readonly result: AssurancePackSettlementResult;
  readonly actionRecord: AssurancePackActionRecord;
  readonly settlement: AssurancePackSettlement;
  readonly auditRecords: readonly AssuranceWorkflowAuditRecord[];
  readonly blockerRefs: readonly string[];
  readonly idempotencyDecision: "accepted" | "exact_replay" | "collision_review";
}

export interface DeriveEvidenceGapsInput {
  readonly tenantId: string;
  readonly scopeRef: string;
  readonly packResult: AssurancePackFactoryResult;
  readonly graphVerdict: AssuranceWorkflowGraphVerdictRef;
  readonly generatedAt: string;
  readonly controlRecords?: readonly AssuranceControlRecord[];
  readonly existingGaps?: readonly EvidenceGapQueueRecord[];
  readonly incidentRefs?: readonly string[];
}

export interface Phase9CapaAttestationWorkflowFixture {
  readonly schemaVersion: typeof PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly baselinePackRef: string;
  readonly missingEvidenceGaps: readonly EvidenceGapQueueRecord[];
  readonly dedupedMissingEvidenceGaps: readonly EvidenceGapQueueRecord[];
  readonly capaCreateResult: CAPAWorkflowMutationResult;
  readonly capaInProgressResult: CAPAWorkflowMutationResult;
  readonly capaClosureBlockedResult: CAPAWorkflowMutationResult;
  readonly capaCompletedResult: CAPAWorkflowMutationResult;
  readonly overdueCapaRef: string;
  readonly attestSuccessResult: PackWorkflowActionResult;
  readonly signoffBlockedOpenGapResult: PackWorkflowActionResult;
  readonly signoffBlockedStaleHashResult: PackWorkflowActionResult;
  readonly publishBlockedGraphResult: PackWorkflowActionResult;
  readonly exportRedactionBlockedResult: PackWorkflowActionResult;
  readonly actorDeniedResult: PackWorkflowActionResult;
  readonly selfApprovalDeniedResult: PackWorkflowActionResult;
  readonly idempotentRetryFirstResult: PackWorkflowActionResult;
  readonly idempotentRetrySecondResult: PackWorkflowActionResult;
  readonly concurrentUpdateErrorCode: string;
  readonly queueDtos: readonly EvidenceGapQueueDto[];
  readonly replayHash: string;
}

export class Phase9CapaAttestationWorkflowError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9CapaAttestationWorkflowError";
    this.code = code;
  }
}

function workflowInvariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9CapaAttestationWorkflowError(code, message);
  }
}

function omitUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => omitUndefined(entry));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, omitUndefined(entry)]),
    );
  }
  return value;
}

function workflowHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(omitUndefined(value), namespace);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function severityRank(severity: EvidenceGapQueueRecord["severity"]): number {
  return severity === "critical" ? 0 : severity === "high" ? 1 : severity === "medium" ? 2 : 3;
}

function isTerminalCapaStatus(status: CAPAActionStatus): boolean {
  return status === "completed" || status === "rejected" || status === "superseded" || status === "cancelled";
}

function isClosedGap(status: EvidenceGapQueueStatus): boolean {
  return status === "resolved" || status === "closed" || status === "superseded";
}

function requiredRole(actionType: AssurancePackActionType): string {
  if (actionType === "attest") {
    return "assurance_attester";
  }
  if (actionType === "signoff") {
    return "assurance_signoff";
  }
  if (actionType === "publish_internal") {
    return "assurance_publisher";
  }
  if (actionType === "export_external") {
    return "assurance_exporter";
  }
  return "assurance_admin";
}

function settlementResultForAction(actionType: AssurancePackActionType): AssurancePackSettlementResult {
  if (actionType === "attest") {
    return "pending_attestation";
  }
  if (actionType === "signoff") {
    return "signed_off";
  }
  if (actionType === "publish_internal") {
    return "published_internal";
  }
  if (actionType === "export_external") {
    return "export_ready";
  }
  return "failed";
}

function actionVersionHash(action: Omit<CAPAAction, "versionHash">): string {
  return workflowHash(
    {
      tenantId: action.tenantId,
      sourceRef: action.sourceRef,
      ownerRef: action.ownerRef,
      approverRef: action.approverRef ?? "",
      targetDate: action.targetDate,
      status: action.status,
      evidenceGapRefs: action.evidenceGapRefs,
      incidentRefs: action.incidentRefs,
      controlRefs: action.controlRefs,
      graphHash: action.graphHash,
      attachmentArtifactRefs: action.attachmentArtifactRefs,
      governedExceptionRef: action.governedExceptionRef ?? "",
      supersedesCapaActionRef: action.supersedesCapaActionRef ?? "",
      updatedAt: action.updatedAt,
      closedAt: action.closedAt ?? "",
    },
    "phase9.441.capa-action.version",
  );
}

function auditRecord(input: {
  readonly tenantId: string;
  readonly actorRef: string;
  readonly purposeOfUseRef: string;
  readonly mutationType: string;
  readonly targetRef: string;
  readonly result: string;
  readonly reasonRefs: readonly string[];
  readonly packVersionHash?: string;
  readonly graphHash: string;
  readonly recordedAt: string;
}): AssuranceWorkflowAuditRecord {
  const commandHash = workflowHash(
    {
      actorRef: input.actorRef,
      mutationType: input.mutationType,
      targetRef: input.targetRef,
      result: input.result,
      reasonRefs: input.reasonRefs,
      graphHash: input.graphHash,
      packVersionHash: input.packVersionHash ?? "",
      recordedAt: input.recordedAt,
    },
    "phase9.441.audit.command",
  );
  return {
    auditRecordId: `awar_441_${commandHash.slice(0, 16)}`,
    tenantId: input.tenantId,
    actorRef: input.actorRef,
    purposeOfUseRef: input.purposeOfUseRef,
    mutationType: input.mutationType,
    targetRef: input.targetRef,
    result: input.result,
    reasonRefs: sortedUnique(input.reasonRefs),
    packVersionHash: input.packVersionHash,
    graphHash: input.graphHash,
    commandHash,
    recordedAt: input.recordedAt,
  };
}

function createQueueRecord(
  input: DeriveEvidenceGapsInput,
  gap: {
    readonly evidenceGapRecordRef: string;
    readonly controlRecordRef: string;
    readonly controlCode: string;
    readonly frameworkCode: string;
    readonly frameworkVersionRef: string;
    readonly gapType: EvidenceGapQueueType;
    readonly severity: EvidenceGapQueueRecord["severity"];
    readonly dueAt: string;
    readonly remediationRef: string;
    readonly originGraphEdgeRefs: readonly string[];
    readonly ownerRef: string;
    readonly ownerRole: string;
    readonly deterministicReasonCode: string;
  },
): EvidenceGapQueueRecord {
  const identityHash = workflowHash(
    {
      tenantId: input.tenantId,
      scopeRef: input.scopeRef,
      controlRecordRef: gap.controlRecordRef,
      gapType: gap.gapType,
      deterministicReasonCode: gap.deterministicReasonCode,
      graphHash: input.packResult.pack.graphHash,
      sourcePackRef: input.packResult.pack.assurancePackId,
    },
    "phase9.441.evidence-gap-queue.identity",
  );
  const versionHash = workflowHash(
    {
      identityHash,
      status: "open",
      lastSeenAt: input.generatedAt,
      sourcePackVersionHash: input.packResult.pack.packVersionHash,
      graphVerdictRef: input.graphVerdict.verdictId,
    },
    "phase9.441.evidence-gap-queue.version",
  );
  const auditRef = `audit:gap-derived:${identityHash.slice(0, 16)}`;
  return {
    evidenceGapQueueRecordId: `egq_441_${identityHash.slice(0, 16)}`,
    evidenceGapRecordRef: gap.evidenceGapRecordRef,
    tenantId: input.tenantId,
    scopeRef: input.scopeRef,
    controlRecordRef: gap.controlRecordRef,
    controlCode: gap.controlCode,
    frameworkCode: gap.frameworkCode,
    frameworkVersionRef: gap.frameworkVersionRef,
    sourcePackRef: input.packResult.pack.assurancePackId,
    sourcePackVersionHash: input.packResult.pack.packVersionHash,
    sourceControlRef: gap.controlRecordRef,
    gapType: gap.gapType,
    severity: gap.severity,
    dueAt: gap.dueAt,
    remediationRef: gap.remediationRef,
    assuranceEvidenceGraphSnapshotRef: input.packResult.pack.graphSnapshotRef,
    assuranceGraphCompletenessVerdictRef: input.graphVerdict.verdictId,
    originGraphEdgeRefs: sortedUnique(gap.originGraphEdgeRefs),
    graphHash: input.packResult.pack.graphHash,
    status: "open",
    ownerRef: gap.ownerRef,
    ownerRole: gap.ownerRole,
    sourceFrameworkRef: `${gap.frameworkCode}:${gap.frameworkVersionRef}`,
    deterministicReasonCode: gap.deterministicReasonCode,
    firstSeenAt: input.generatedAt,
    lastSeenAt: input.generatedAt,
    versionHash,
    auditRefs: [auditRef],
  };
}

export class Phase9CapaAttestationWorkflowService {
  private readonly idempotencyResults = new Map<string, PackWorkflowActionResult>();
  private readonly idempotencyPayloadHashes = new Map<string, string>();

  deriveEvidenceGaps(input: DeriveEvidenceGapsInput): readonly EvidenceGapQueueRecord[] {
    workflowInvariant(
      input.packResult.pack.tenantId === input.tenantId,
      "CROSS_TENANT_PACK_GAP_DERIVATION_DENIED",
      "Pack tenant must match the evidence-gap queue tenant.",
    );
    const candidateRows: EvidenceGapQueueRecord[] = [];
    const controlByRef = new Map((input.controlRecords ?? []).map((control) => [control.controlRecordId, control]));
    for (const gap of input.packResult.evidenceGaps) {
      const control = controlByRef.get(gap.controlRecordId);
      candidateRows.push(
        createQueueRecord(input, {
          evidenceGapRecordRef: gap.evidenceGapRecordId,
          controlRecordRef: gap.controlRecordId,
          controlCode: control?.controlCode ?? gap.controlRecordId,
          frameworkCode: input.packResult.pack.frameworkCode,
          frameworkVersionRef: input.packResult.pack.frameworkVersion,
          gapType: gap.gapType,
          severity: gap.severity,
          dueAt: gap.dueAt,
          remediationRef: gap.remediationRef,
          originGraphEdgeRefs: gap.originGraphEdgeRefs,
          ownerRef: control?.ownerRef ?? input.packResult.standardsVersionMap.ownerRole,
          ownerRole: input.packResult.standardsVersionMap.ownerRole,
          deterministicReasonCode: gap.deterministicReasonCode,
        }),
      );
    }
    for (const control of input.controlRecords ?? []) {
      if (control.tenantId !== input.tenantId) {
        candidateRows.push(
          createQueueRecord(input, {
            evidenceGapRecordRef: `gap:tenant-scope:${control.controlRecordId}`,
            controlRecordRef: control.controlRecordId,
            controlCode: control.controlCode,
            frameworkCode: control.frameworkCode,
            frameworkVersionRef: control.frameworkVersionRef,
            gapType: "tenant_scope_mismatch",
            severity: "critical",
            dueAt: input.packResult.pack.periodEnd,
            remediationRef: "remediation:tenant-scope-repair",
            originGraphEdgeRefs: [],
            ownerRef: control.ownerRef,
            ownerRole: input.packResult.standardsVersionMap.ownerRole,
            deterministicReasonCode: `tenant_scope_mismatch:${control.controlRecordId}`,
          }),
        );
      }
      if (control.state === "missing" || control.evidenceCoverage <= 0) {
        candidateRows.push(
          createQueueRecord(input, {
            evidenceGapRecordRef: `gap:missing-evidence:${control.controlRecordId}`,
            controlRecordRef: control.controlRecordId,
            controlCode: control.controlCode,
            frameworkCode: control.frameworkCode,
            frameworkVersionRef: control.frameworkVersionRef,
            gapType: "missing_evidence",
            severity: "high",
            dueAt: input.packResult.pack.periodEnd,
            remediationRef: `remediation:missing-evidence:${control.controlCode}`,
            originGraphEdgeRefs: [],
            ownerRef: control.ownerRef,
            ownerRole: input.packResult.standardsVersionMap.ownerRole,
            deterministicReasonCode: `missing_evidence:${control.controlCode}:${control.graphHash}`,
          }),
        );
      }
    }
    if (input.graphVerdict.state !== "complete") {
      candidateRows.push(
        createQueueRecord(input, {
          evidenceGapRecordRef: `gap:blocked-graph:${input.graphVerdict.verdictId}`,
          controlRecordRef: "control:graph-verdict",
          controlCode: "graph:completeness",
          frameworkCode: input.packResult.pack.frameworkCode,
          frameworkVersionRef: input.packResult.pack.frameworkVersion,
          gapType: "blocked_graph",
          severity: "critical",
          dueAt: input.packResult.pack.periodEnd,
          remediationRef: "remediation:graph-verdict-repair",
          originGraphEdgeRefs: [],
          ownerRef: input.packResult.standardsVersionMap.ownerRole,
          ownerRole: input.packResult.standardsVersionMap.ownerRole,
          deterministicReasonCode: `blocked_graph:${input.graphVerdict.state}:${input.graphVerdict.decisionHash}`,
        }),
      );
    }
    for (const incidentRef of input.incidentRefs ?? []) {
      candidateRows.push(
        createQueueRecord(input, {
          evidenceGapRecordRef: `gap:incident-follow-up:${incidentRef}`,
          controlRecordRef: "control:incident-follow-up",
          controlCode: "incident:capa-follow-up",
          frameworkCode: input.packResult.pack.frameworkCode,
          frameworkVersionRef: input.packResult.pack.frameworkVersion,
          gapType: "incident_capa_follow_up_required",
          severity: "high",
          dueAt: input.packResult.pack.periodEnd,
          remediationRef: `remediation:incident-capa:${incidentRef}`,
          originGraphEdgeRefs: [],
          ownerRef: "incident_owner",
          ownerRole: "incident_owner",
          deterministicReasonCode: `incident_capa_follow_up_required:${incidentRef}`,
        }),
      );
    }
    const activeExistingIds = new Set(
      (input.existingGaps ?? [])
        .filter((gap) => !isClosedGap(gap.status))
        .map((gap) => gap.evidenceGapQueueRecordId),
    );
    const deduped = new Map<string, EvidenceGapQueueRecord>();
    for (const gap of [...(input.existingGaps ?? []), ...candidateRows]) {
      if (activeExistingIds.has(gap.evidenceGapQueueRecordId)) {
        deduped.set(gap.evidenceGapQueueRecordId, gap);
      } else if (!deduped.has(gap.evidenceGapQueueRecordId)) {
        deduped.set(gap.evidenceGapQueueRecordId, gap);
      }
    }
    return [...deduped.values()].sort(
      (left, right) =>
        severityRank(left.severity) - severityRank(right.severity) ||
        left.dueAt.localeCompare(right.dueAt) ||
        left.evidenceGapQueueRecordId.localeCompare(right.evidenceGapQueueRecordId),
    );
  }

  listEvidenceGaps(input: {
    readonly tenantId: string;
    readonly gaps: readonly EvidenceGapQueueRecord[];
    readonly cursor?: string;
    readonly limit?: number;
  }): EvidenceGapQueuePage {
    const limit = input.limit ?? 25;
    const offset = input.cursor?.startsWith("cursor:") ? Number(input.cursor.slice("cursor:".length)) : 0;
    const rows = input.gaps
      .filter((gap) => gap.tenantId === input.tenantId)
      .sort(
        (left, right) =>
          severityRank(left.severity) - severityRank(right.severity) ||
          left.dueAt.localeCompare(right.dueAt) ||
          left.evidenceGapQueueRecordId.localeCompare(right.evidenceGapQueueRecordId),
      );
    const pageRows = rows.slice(offset, offset + limit);
    const nextOffset = offset + pageRows.length;
    return {
      rows: pageRows,
      nextCursor: nextOffset < rows.length ? `cursor:${nextOffset}` : undefined,
    };
  }

  getEvidenceGapDetail(input: {
    readonly tenantId: string;
    readonly gapRef: string;
    readonly gaps: readonly EvidenceGapQueueRecord[];
  }): EvidenceGapQueueRecord {
    const gap = input.gaps.find((candidate) => candidate.evidenceGapQueueRecordId === input.gapRef);
    workflowInvariant(gap, "EVIDENCE_GAP_NOT_FOUND", "Evidence gap was not found.");
    workflowInvariant(gap.tenantId === input.tenantId, "CROSS_TENANT_GAP_DETAIL_DENIED", "Tenant scope mismatch.");
    return gap;
  }

  toQueueDtos(input: {
    readonly gaps: readonly EvidenceGapQueueRecord[];
    readonly capaActions: readonly CAPAAction[];
    readonly graphState: string;
    readonly trustState: string;
  }): readonly EvidenceGapQueueDto[] {
    return input.gaps.map((gap) => {
      const linkedCapa = input.capaActions.find((capa) => capa.evidenceGapRefs.includes(gap.evidenceGapQueueRecordId));
      const blockerRefs = isClosedGap(gap.status) ? [] : [`gap:${gap.status}:${gap.evidenceGapQueueRecordId}`];
      return {
        gapRef: gap.evidenceGapQueueRecordId,
        severity: gap.severity,
        reason: gap.deterministicReasonCode,
        controlRef: gap.controlRecordRef,
        frameworkRef: gap.sourceFrameworkRef,
        ownerRef: gap.ownerRef,
        dueAt: gap.dueAt,
        graphState: input.graphState,
        trustState: input.trustState,
        capaState: linkedCapa?.status ?? "none",
        nextSafeAction: linkedCapa ? (isTerminalCapaStatus(linkedCapa.status) ? "attest" : "continue_capa") : "create_capa",
        blockerRefs,
        evidenceRefs: [gap.evidenceGapRecordRef],
        auditRefs: gap.auditRefs,
      };
    });
  }

  createCapaAction(input: {
    readonly actor: AssuranceWorkflowActorContext;
    readonly sourceRef: string;
    readonly rootCauseRef: string;
    readonly ownerRef: string;
    readonly targetDate: string;
    readonly evidenceGapRefs: readonly string[];
    readonly incidentRefs?: readonly string[];
    readonly controlRefs?: readonly string[];
    readonly assuranceEvidenceGraphSnapshotRef: string;
    readonly assuranceGraphCompletenessVerdictRef: string;
    readonly graphHash: string;
    readonly idempotencyKey: string;
  }): CAPAWorkflowMutationResult {
    workflowInvariant(input.actor.roleRefs.includes("capa_owner"), "CAPA_ACTOR_ROLE_DENIED", "CAPA creation requires capa_owner role.");
    const actionSeed = {
      tenantId: input.actor.tenantId,
      sourceRef: input.sourceRef,
      rootCauseRef: input.rootCauseRef,
      evidenceGapRefs: sortedUnique(input.evidenceGapRefs),
      idempotencyKey: input.idempotencyKey,
    };
    const actionHash = workflowHash(actionSeed, "phase9.441.capa-action.id");
    const baseAction = {
      capaActionId: `capa_441_${actionHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      sourceRef: input.sourceRef,
      rootCauseRef: input.rootCauseRef,
      ownerRef: input.ownerRef,
      targetDate: input.targetDate,
      status: "open" as const,
      assuranceEvidenceGraphSnapshotRef: input.assuranceEvidenceGraphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: input.assuranceGraphCompletenessVerdictRef,
      evidenceGapRefs: sortedUnique(input.evidenceGapRefs),
      incidentRefs: sortedUnique(input.incidentRefs ?? []),
      controlRefs: sortedUnique(input.controlRefs ?? []),
      graphHash: input.graphHash,
      auditRefs: [] as readonly string[],
      attachmentArtifactRefs: [] as readonly string[],
      createdAt: input.actor.generatedAt,
      updatedAt: input.actor.generatedAt,
    };
    const audit = auditRecord({
      tenantId: input.actor.tenantId,
      actorRef: input.actor.actorRef,
      purposeOfUseRef: input.actor.purposeOfUseRef,
      mutationType: "capa.create",
      targetRef: baseAction.capaActionId,
      result: "created",
      reasonRefs: input.evidenceGapRefs,
      graphHash: input.graphHash,
      recordedAt: input.actor.generatedAt,
    });
    const action: CAPAAction = {
      ...baseAction,
      auditRefs: [audit.auditRecordId],
      versionHash: actionVersionHash({ ...baseAction, auditRefs: [audit.auditRecordId] }),
    };
    return {
      result: "created",
      capaAction: action,
      auditRecords: [audit],
      blockerRefs: [],
    };
  }

  addEvidenceArtifactToCapa(input: {
    readonly actor: AssuranceWorkflowActorContext;
    readonly capaAction: CAPAAction;
    readonly artifactRef: string;
    readonly artifactPresentationContractRef?: string;
  }): CAPAWorkflowMutationResult {
    workflowInvariant(
      input.artifactPresentationContractRef,
      "CAPA_ARTIFACT_PRESENTATION_CONTRACT_REQUIRED",
      "CAPA attachments must use governed artifact contracts.",
    );
    const updatedBase = {
      ...input.capaAction,
      attachmentArtifactRefs: sortedUnique([...input.capaAction.attachmentArtifactRefs, input.artifactRef]),
      status: "awaiting_attestation" as const,
      updatedAt: input.actor.generatedAt,
    };
    const audit = auditRecord({
      tenantId: input.actor.tenantId,
      actorRef: input.actor.actorRef,
      purposeOfUseRef: input.actor.purposeOfUseRef,
      mutationType: "capa.add_evidence",
      targetRef: input.capaAction.capaActionId,
      result: "updated",
      reasonRefs: [input.artifactRef, input.artifactPresentationContractRef],
      graphHash: input.capaAction.graphHash,
      recordedAt: input.actor.generatedAt,
    });
    const capaAction: CAPAAction = {
      ...updatedBase,
      auditRefs: [...updatedBase.auditRefs, audit.auditRecordId],
      versionHash: actionVersionHash({ ...updatedBase, auditRefs: [...updatedBase.auditRefs, audit.auditRecordId] }),
    };
    return { result: "updated", capaAction, auditRecords: [audit], blockerRefs: [] };
  }

  transitionCapaStatus(input: {
    readonly actor: AssuranceWorkflowActorContext;
    readonly capaAction: CAPAAction;
    readonly nextStatus: CAPAActionStatus;
    readonly expectedVersionHash: string;
    readonly gapRecords: readonly EvidenceGapQueueRecord[];
    readonly governedExceptionRef?: string;
  }): CAPAWorkflowMutationResult {
    workflowInvariant(
      input.expectedVersionHash === input.capaAction.versionHash,
      "CAPA_CONCURRENCY_VERSION_MISMATCH",
      "CAPA status transition expected version hash does not match current action version.",
    );
    const blockerRefs: string[] = [];
    if (input.nextStatus === "completed") {
      const unresolvedGapRefs = input.capaAction.evidenceGapRefs.filter((gapRef) => {
        const gap = input.gapRecords.find((candidate) => candidate.evidenceGapQueueRecordId === gapRef);
        return !gap || !isClosedGap(gap.status);
      });
      blockerRefs.push(...unresolvedGapRefs.map((gapRef) => `gap:unresolved:${gapRef}`));
      if (input.actor.actorRef === input.capaAction.ownerRef) {
        blockerRefs.push("separation:self-approval-denied");
      }
      if (blockerRefs.length > 0 && !input.governedExceptionRef) {
        const audit = auditRecord({
          tenantId: input.actor.tenantId,
          actorRef: input.actor.actorRef,
          purposeOfUseRef: input.actor.purposeOfUseRef,
          mutationType: "capa.transition",
          targetRef: input.capaAction.capaActionId,
          result: "blocked",
          reasonRefs: blockerRefs,
          graphHash: input.capaAction.graphHash,
          recordedAt: input.actor.generatedAt,
        });
        return {
          result: "blocked",
          capaAction: input.capaAction,
          auditRecords: [audit],
          blockerRefs: sortedUnique(blockerRefs),
        };
      }
    }
    const nextBase = {
      ...input.capaAction,
      status: input.nextStatus,
      approverRef: input.nextStatus === "completed" ? input.actor.actorRef : input.capaAction.approverRef,
      governedExceptionRef: input.governedExceptionRef ?? input.capaAction.governedExceptionRef,
      updatedAt: input.actor.generatedAt,
      closedAt: input.nextStatus === "completed" ? input.actor.generatedAt : input.capaAction.closedAt,
    };
    const audit = auditRecord({
      tenantId: input.actor.tenantId,
      actorRef: input.actor.actorRef,
      purposeOfUseRef: input.actor.purposeOfUseRef,
      mutationType: "capa.transition",
      targetRef: input.capaAction.capaActionId,
      result: input.nextStatus,
      reasonRefs: [input.capaAction.versionHash],
      graphHash: input.capaAction.graphHash,
      recordedAt: input.actor.generatedAt,
    });
    const capaAction: CAPAAction = {
      ...nextBase,
      auditRefs: [...nextBase.auditRefs, audit.auditRecordId],
      versionHash: actionVersionHash({ ...nextBase, auditRefs: [...nextBase.auditRefs, audit.auditRecordId] }),
    };
    return { result: "updated", capaAction, auditRecords: [audit], blockerRefs: [] };
  }

  isCapaOverdue(capaAction: CAPAAction, at: string): boolean {
    return !isTerminalCapaStatus(capaAction.status) && Date.parse(capaAction.targetDate) < Date.parse(at);
  }

  performPackAction(input: PackWorkflowActionInput): PackWorkflowActionResult {
    const pack = input.packResult.pack;
    workflowInvariant(input.actor.tenantId === pack.tenantId, "CROSS_TENANT_PACK_ACTION_DENIED", "Actor tenant must match pack tenant.");
    const semanticHash = workflowHash(
      {
        tenantId: input.actor.tenantId,
        actorRef: input.actor.actorRef,
        actionType: input.actionType,
        packRef: pack.assurancePackId,
        packVersionHash: pack.packVersionHash,
        routeIntentRef: input.routeIntentRef,
        scopeTokenRef: input.scopeTokenRef,
        currentPackVersionHash: input.currentPackVersionHash ?? "",
        currentGraphHash: input.currentGraphHash ?? "",
        currentRedactionPolicyHash: input.currentRedactionPolicyHash ?? "",
      },
      "phase9.441.pack-action.semantic",
    );
    const idempotencyScope = `${input.actor.tenantId}:${input.idempotencyKey}`;
    const previousHash = this.idempotencyPayloadHashes.get(idempotencyScope);
    if (previousHash === semanticHash) {
      const previous = this.idempotencyResults.get(idempotencyScope);
      workflowInvariant(previous, "IDEMPOTENCY_RECORD_MISSING", "Idempotency payload exists without a stored result.");
      return { ...previous, idempotencyDecision: "exact_replay" };
    }

    const blockerRefs: string[] = [];
    if (previousHash && previousHash !== semanticHash) {
      blockerRefs.push("idempotency:collision-review-required");
    }
    if (!input.actor.roleRefs.includes(requiredRole(input.actionType))) {
      blockerRefs.push(`authz:role-required:${requiredRole(input.actionType)}`);
    }
    if (!input.actor.purposeOfUseRef.startsWith("assurance:")) {
      blockerRefs.push("purpose-of-use:assurance-required");
    }
    if (input.currentPackVersionHash && input.currentPackVersionHash !== pack.packVersionHash) {
      blockerRefs.push("pack:version-hash-changed");
    }
    if (input.currentGraphHash && input.currentGraphHash !== pack.graphHash) {
      blockerRefs.push("graph:hash-changed");
    }
    if (input.graphVerdict.state !== "complete") {
      blockerRefs.push(`graph:verdict-${input.graphVerdict.state}`);
    }
    if (input.graphVerdict.graphHash !== pack.graphHash) {
      blockerRefs.push("graph:verdict-pack-hash-mismatch");
    }
    if (input.currentRedactionPolicyHash && input.currentRedactionPolicyHash !== pack.redactionPolicyHash) {
      blockerRefs.push("redaction:policy-hash-mismatch");
    }
    if (input.packSuperseded) {
      blockerRefs.push("pack:superseded");
    }
    if (input.routePublicationState && input.routePublicationState !== "live") {
      blockerRefs.push(`publication:${input.routePublicationState}`);
    }
    if (input.actionType === "signoff" && input.priorAttestationActorRef === input.actor.actorRef) {
      blockerRefs.push("separation:self-approval-denied");
    }
    if (input.actionType === "export_external") {
      if (!input.artifactPresentationContractRef) {
        blockerRefs.push("artifact-presentation-contract:missing");
      }
      if (!input.artifactTransferSettlementRef) {
        blockerRefs.push("artifact-transfer-settlement:missing");
      }
      if (!input.outboundNavigationGrantPolicyRef) {
        blockerRefs.push("outbound-navigation-grant:missing");
      }
    }
    const openGapRefs = (input.openGapRecords ?? [])
      .filter((gap) => !isClosedGap(gap.status))
      .map((gap) => `gap:open:${gap.evidenceGapQueueRecordId}`);
    if (input.actionType !== "attest") {
      blockerRefs.push(...openGapRefs);
    }
    const incompleteCapaRefs = (input.capaActions ?? [])
      .filter((capa) => !isTerminalCapaStatus(capa.status))
      .map((capa) => `capa:incomplete:${capa.capaActionId}`);
    if (input.actionType === "signoff" || input.actionType === "publish_internal" || input.actionType === "export_external") {
      blockerRefs.push(...incompleteCapaRefs);
    }

    let result: AssurancePackSettlementResult = settlementResultForAction(input.actionType);
    if (blockerRefs.some((blocker) => blocker.startsWith("graph:"))) {
      result = "blocked_graph";
    } else if (blockerRefs.some((blocker) => blocker.startsWith("trust:"))) {
      result = "blocked_trust";
    } else if (
      blockerRefs.some(
        (blocker) =>
          blocker.startsWith("pack:") ||
          blocker.startsWith("gap:") ||
          blocker.startsWith("capa:") ||
          blocker.startsWith("publication:"),
      )
    ) {
      result = "stale_pack";
    } else if (
      blockerRefs.some(
        (blocker) =>
          blocker.startsWith("authz:") ||
          blocker.startsWith("purpose-of-use:") ||
          blocker.startsWith("redaction:") ||
          blocker.startsWith("artifact-") ||
          blocker.startsWith("outbound-") ||
          blocker.startsWith("separation:"),
      )
    ) {
      result = "denied_scope";
    } else if (blockerRefs.some((blocker) => blocker.startsWith("idempotency:"))) {
      result = "failed";
    }

    const actionHash = workflowHash(
      {
        semanticHash,
        idempotencyKey: input.idempotencyKey,
        result,
      },
      "phase9.441.pack-action.id",
    );
    const actionRecord: AssurancePackActionRecord = {
      assurancePackActionRecordId: `apar_441_${actionHash.slice(0, 16)}`,
      assurancePackRef: pack.assurancePackId,
      actionType: input.actionType,
      routeIntentRef: input.routeIntentRef,
      scopeTokenRef: input.scopeTokenRef,
      packVersionHash: pack.packVersionHash,
      evidenceSetHash: pack.evidenceSetHash,
      continuitySetHash: pack.continuitySetHash,
      graphHash: pack.graphHash,
      assuranceEvidenceGraphSnapshotRef: pack.graphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: pack.graphVerdictRef,
      queryPlanHash: pack.queryPlanHash,
      renderTemplateHash: pack.renderTemplateHash,
      redactionPolicyHash: pack.redactionPolicyHash,
      requiredTrustRefs: input.packResult.generator.requiredTrustRefs,
      assuranceSurfaceRuntimeBindingRef: "assurance-surface-runtime:assurance-center",
      surfaceRouteContractRef: "surface-route:assurance-center",
      surfacePublicationRef: "surface-publication:assurance-center",
      runtimePublicationBundleRef: "runtime-publication:assurance-center",
      releasePublicationParityRef: "release-publication:assurance-center",
      transitionEnvelopeRef: `transition-envelope:${actionHash.slice(0, 12)}`,
      releaseRecoveryDispositionRef: result === settlementResultForAction(input.actionType) ? "release-recovery:not-required" : `release-recovery:${result}`,
      idempotencyKey: input.idempotencyKey,
      actorRef: input.actor.actorRef,
      createdAt: input.actor.generatedAt,
      settledAt: input.actor.generatedAt,
    };
    const reproductionState: ReproductionState =
      result === "signed_off" || result === "published_internal" || result === "export_ready" || result === "pending_attestation"
        ? "exact"
        : result === "blocked_graph"
          ? "blocked"
          : pack.reproductionState;
    const settlementHash = workflowHash(
      {
        actionRecord,
        result,
        blockerRefs: sortedUnique(blockerRefs),
        serializedArtifactHash: pack.serializedArtifactHash,
        exportManifestHash: pack.exportManifestHash,
        reproductionHash: pack.reproductionHash,
      },
      "phase9.441.pack-settlement.id",
    );
    const settlement: AssurancePackSettlement = {
      assurancePackSettlementId: `aps_441_${settlementHash.slice(0, 16)}`,
      assurancePackActionRecordRef: actionRecord.assurancePackActionRecordId,
      commandActionRecordRef: `command-action:${actionRecord.assurancePackActionRecordId}`,
      commandSettlementRecordRef: `command-settlement:${settlementHash.slice(0, 12)}`,
      uiTransitionSettlementRecordRef: `ui-transition:${settlementHash.slice(0, 12)}`,
      uiTelemetryDisclosureFenceRef: "ui-disclosure-fence:assurance-pack-workflow",
      presentationArtifactRef: pack.generatedArtifactRef,
      assuranceEvidenceGraphSnapshotRef: pack.graphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: pack.graphVerdictRef,
      graphHash: pack.graphHash,
      result,
      serializedArtifactHash: pack.serializedArtifactHash,
      exportManifestHash: pack.exportManifestHash,
      reproductionHash: pack.reproductionHash,
      reproductionState,
      recoveryActionRef:
        result === settlementResultForAction(input.actionType) ? "recovery:not-required" : `recovery:${result}`,
      recordedAt: input.actor.generatedAt,
    };
    const audit = auditRecord({
      tenantId: input.actor.tenantId,
      actorRef: input.actor.actorRef,
      purposeOfUseRef: input.actor.purposeOfUseRef,
      mutationType: `pack.${input.actionType}`,
      targetRef: pack.assurancePackId,
      result,
      reasonRefs: blockerRefs.length > 0 ? blockerRefs : ["workflow:settled"],
      packVersionHash: pack.packVersionHash,
      graphHash: pack.graphHash,
      recordedAt: input.actor.generatedAt,
    });
    const output: PackWorkflowActionResult = {
      result,
      actionRecord,
      settlement,
      auditRecords: [audit],
      blockerRefs: sortedUnique(blockerRefs),
      idempotencyDecision: previousHash ? "collision_review" : "accepted",
    };
    if (!previousHash) {
      this.idempotencyPayloadHashes.set(idempotencyScope, semanticHash);
      this.idempotencyResults.set(idempotencyScope, output);
    }
    return output;
  }

  explainBlockReasons(result: PackWorkflowActionResult): readonly string[] {
    return result.blockerRefs.length > 0 ? result.blockerRefs : ["workflow:action-settled"];
  }
}

export function createPhase9CapaAttestationWorkflowFixture(): Phase9CapaAttestationWorkflowFixture {
  const generatedAt = "2026-04-27T11:00:00.000Z";
  const packFixture = createPhase9AssurancePackFactoryFixture();
  const service = new Phase9CapaAttestationWorkflowService();
  const packResult = packFixture.baselineResult;
  const graphVerdict: AssuranceWorkflowGraphVerdictRef = {
    verdictId: packResult.pack.graphVerdictRef,
    state: "complete",
    graphHash: packResult.pack.graphHash,
    decisionHash: packResult.pack.graphVerdictDecisionHash,
    reasonCodes: [],
    trustBlockingRefs: [],
  };
  const missingControl: AssuranceControlRecord = {
    controlRecordId: "acr_441_missing_evidence",
    frameworkCode: "DTAC",
    frameworkVersionRef: packResult.pack.frameworkVersion,
    controlCode: "dtac:control:technical-security",
    tenantId: packResult.pack.tenantId,
    state: "missing",
    evidenceCoverage: 0,
    ownerRef: "clinical_safety_owner",
    assuranceEvidenceGraphSnapshotRef: packResult.pack.graphSnapshotRef,
    assuranceGraphCompletenessVerdictRef: packResult.pack.graphVerdictRef,
    graphHash: packResult.pack.graphHash,
    requiresContinuityEvidence: false,
    requiredEvidenceRefs: ["evidence:441:technical-security"],
  };
  const missingEvidenceGaps = service.deriveEvidenceGaps({
    tenantId: packResult.pack.tenantId,
    scopeRef: packResult.pack.scopeRef,
    packResult,
    graphVerdict,
    generatedAt,
    controlRecords: [missingControl],
  });
  const dedupedMissingEvidenceGaps = service.deriveEvidenceGaps({
    tenantId: packResult.pack.tenantId,
    scopeRef: packResult.pack.scopeRef,
    packResult,
    graphVerdict,
    generatedAt,
    controlRecords: [missingControl],
    existingGaps: missingEvidenceGaps,
  });
  const ownerActor: AssuranceWorkflowActorContext = {
    tenantId: packResult.pack.tenantId,
    actorRef: "actor:capa-owner-441",
    roleRefs: ["capa_owner"],
    purposeOfUseRef: "assurance:capa",
    generatedAt,
  };
  const signoffActor: AssuranceWorkflowActorContext = {
    tenantId: packResult.pack.tenantId,
    actorRef: "actor:signoff-441",
    roleRefs: ["assurance_signoff"],
    purposeOfUseRef: "assurance:signoff",
    generatedAt,
  };
  const attesterActor: AssuranceWorkflowActorContext = {
    tenantId: packResult.pack.tenantId,
    actorRef: "actor:attester-441",
    roleRefs: ["assurance_attester"],
    purposeOfUseRef: "assurance:attest",
    generatedAt,
  };
  const publisherActor: AssuranceWorkflowActorContext = {
    tenantId: packResult.pack.tenantId,
    actorRef: "actor:publisher-441",
    roleRefs: ["assurance_publisher"],
    purposeOfUseRef: "assurance:publish",
    generatedAt,
  };
  const exportActor: AssuranceWorkflowActorContext = {
    tenantId: packResult.pack.tenantId,
    actorRef: "actor:exporter-441",
    roleRefs: ["assurance_exporter"],
    purposeOfUseRef: "assurance:export",
    generatedAt,
  };
  const capaCreateResult = service.createCapaAction({
    actor: ownerActor,
    sourceRef: packResult.pack.assurancePackId,
    rootCauseRef: "root-cause:missing-technical-security-evidence",
    ownerRef: ownerActor.actorRef,
    targetDate: "2026-04-29T17:00:00.000Z",
    evidenceGapRefs: [missingEvidenceGaps[0]!.evidenceGapQueueRecordId],
    incidentRefs: ["incident:441-follow-up"],
    controlRefs: [missingControl.controlRecordId],
    assuranceEvidenceGraphSnapshotRef: packResult.pack.graphSnapshotRef,
    assuranceGraphCompletenessVerdictRef: packResult.pack.graphVerdictRef,
    graphHash: packResult.pack.graphHash,
    idempotencyKey: "idem:441:capa-create",
  });
  const capaInProgressResult = service.transitionCapaStatus({
    actor: ownerActor,
    capaAction: capaCreateResult.capaAction,
    nextStatus: "in_progress",
    expectedVersionHash: capaCreateResult.capaAction.versionHash,
    gapRecords: missingEvidenceGaps,
  });
  const capaClosureBlockedResult = service.transitionCapaStatus({
    actor: signoffActor,
    capaAction: capaInProgressResult.capaAction,
    nextStatus: "completed",
    expectedVersionHash: capaInProgressResult.capaAction.versionHash,
    gapRecords: missingEvidenceGaps,
  });
  const resolvedGap: EvidenceGapQueueRecord = {
    ...missingEvidenceGaps[0]!,
    status: "resolved",
    versionHash: workflowHash({ gapRef: missingEvidenceGaps[0]!.evidenceGapQueueRecordId, status: "resolved" }, "phase9.441.gap.resolved"),
  };
  const capaWithEvidence = service.addEvidenceArtifactToCapa({
    actor: ownerActor,
    capaAction: capaInProgressResult.capaAction,
    artifactRef: "artifact:441:capa-evidence",
    artifactPresentationContractRef: "artifact-presentation:capa",
  });
  const capaCompletedResult = service.transitionCapaStatus({
    actor: signoffActor,
    capaAction: capaWithEvidence.capaAction,
    nextStatus: "completed",
    expectedVersionHash: capaWithEvidence.capaAction.versionHash,
    gapRecords: [resolvedGap],
  });
  let concurrentUpdateErrorCode = "";
  try {
    service.transitionCapaStatus({
      actor: signoffActor,
      capaAction: capaCompletedResult.capaAction,
      nextStatus: "superseded",
      expectedVersionHash: capaInProgressResult.capaAction.versionHash,
      gapRecords: [resolvedGap],
    });
  } catch (error) {
    concurrentUpdateErrorCode = error instanceof Phase9CapaAttestationWorkflowError ? error.code : "UNKNOWN";
  }
  const attestSuccessResult = service.performPackAction({
    actor: attesterActor,
    packResult,
    actionType: "attest",
    routeIntentRef: "route-intent:assurance-attest",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:441:attest-success",
    graphVerdict,
    currentPackVersionHash: packResult.pack.packVersionHash,
    currentGraphHash: packResult.pack.graphHash,
  });
  const signoffBlockedOpenGapResult = service.performPackAction({
    actor: signoffActor,
    packResult,
    actionType: "signoff",
    routeIntentRef: "route-intent:assurance-signoff",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:441:signoff-open-gap",
    graphVerdict,
    currentPackVersionHash: packResult.pack.packVersionHash,
    currentGraphHash: packResult.pack.graphHash,
    openGapRecords: missingEvidenceGaps,
  });
  const signoffBlockedStaleHashResult = service.performPackAction({
    actor: signoffActor,
    packResult,
    actionType: "signoff",
    routeIntentRef: "route-intent:assurance-signoff",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:441:signoff-stale",
    graphVerdict,
    currentPackVersionHash: "0".repeat(64),
    currentGraphHash: packResult.pack.graphHash,
  });
  const publishBlockedGraphResult = service.performPackAction({
    actor: publisherActor,
    packResult,
    actionType: "publish_internal",
    routeIntentRef: "route-intent:assurance-publish",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:441:publish-graph",
    graphVerdict: { ...graphVerdict, state: "stale", reasonCodes: ["STALE_EVIDENCE"] },
    currentPackVersionHash: packResult.pack.packVersionHash,
    currentGraphHash: packResult.pack.graphHash,
  });
  const exportRedactionBlockedResult = service.performPackAction({
    actor: exportActor,
    packResult,
    actionType: "export_external",
    routeIntentRef: "route-intent:assurance-export",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:441:export-redaction",
    graphVerdict,
    currentPackVersionHash: packResult.pack.packVersionHash,
    currentGraphHash: packResult.pack.graphHash,
    currentRedactionPolicyHash: "1".repeat(64),
    artifactPresentationContractRef: "artifact-presentation:dtac",
    artifactTransferSettlementRef: "artifact-transfer:dtac",
    outboundNavigationGrantPolicyRef: "outbound-navigation:dtac",
  });
  const actorDeniedResult = service.performPackAction({
    actor: { ...attesterActor, roleRefs: [], actorRef: "actor:unauthorized-441" },
    packResult,
    actionType: "attest",
    routeIntentRef: "route-intent:assurance-attest",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:441:actor-denied",
    graphVerdict,
  });
  const selfApprovalDeniedResult = service.performPackAction({
    actor: signoffActor,
    packResult,
    actionType: "signoff",
    routeIntentRef: "route-intent:assurance-signoff",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:441:self-approval",
    graphVerdict,
    priorAttestationActorRef: signoffActor.actorRef,
  });
  const retryService = new Phase9CapaAttestationWorkflowService();
  const idempotentRetryInput: PackWorkflowActionInput = {
    actor: attesterActor,
    packResult,
    actionType: "attest",
    routeIntentRef: "route-intent:assurance-attest",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:441:idempotent",
    graphVerdict,
    currentPackVersionHash: packResult.pack.packVersionHash,
    currentGraphHash: packResult.pack.graphHash,
  };
  const idempotentRetryFirstResult = retryService.performPackAction(idempotentRetryInput);
  const idempotentRetrySecondResult = retryService.performPackAction(idempotentRetryInput);
  const queueDtos = service.toQueueDtos({
    gaps: missingEvidenceGaps,
    capaActions: [capaCompletedResult.capaAction],
    graphState: graphVerdict.state,
    trustState: "trusted",
  });
  return {
    schemaVersion: PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9G",
      "blueprint/phase-0-the-foundation-protocol.md",
      "data/contracts/432_phase9_assurance_ledger_contracts.json",
      "data/contracts/436_phase9_graph_verdict_engine_contract.json",
      "data/contracts/440_phase9_assurance_pack_factory_contract.json",
    ],
    producedObjects: [
      "EvidenceGapQueueRecord",
      "CAPAAction",
      "AssurancePackActionRecord",
      "AssurancePackSettlement",
      "AssuranceWorkflowAuditRecord",
      "EvidenceGapQueueDto",
    ],
    baselinePackRef: packResult.pack.assurancePackId,
    missingEvidenceGaps,
    dedupedMissingEvidenceGaps,
    capaCreateResult,
    capaInProgressResult,
    capaClosureBlockedResult,
    capaCompletedResult,
    overdueCapaRef: service.isCapaOverdue(capaCreateResult.capaAction, "2026-05-01T09:00:00.000Z")
      ? capaCreateResult.capaAction.capaActionId
      : "overdue:not-derived",
    attestSuccessResult,
    signoffBlockedOpenGapResult,
    signoffBlockedStaleHashResult,
    publishBlockedGraphResult,
    exportRedactionBlockedResult,
    actorDeniedResult,
    selfApprovalDeniedResult,
    idempotentRetryFirstResult,
    idempotentRetrySecondResult,
    concurrentUpdateErrorCode,
    queueDtos,
    replayHash: orderedSetHash(
      [
        missingEvidenceGaps[0]!.versionHash,
        capaCompletedResult.capaAction.versionHash,
        attestSuccessResult.settlement.assurancePackSettlementId,
        idempotentRetrySecondResult.settlement.assurancePackSettlementId,
      ],
      "phase9.441.fixture.replay",
    ),
  };
}

export function phase9CapaAttestationWorkflowSummary(
  fixture: Phase9CapaAttestationWorkflowFixture = createPhase9CapaAttestationWorkflowFixture(),
): string {
  return [
    "# 441 Phase 9 CAPA And Attestation Workflow",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Baseline pack ref: ${fixture.baselinePackRef}`,
    `Derived gap count: ${fixture.missingEvidenceGaps.length}`,
    `CAPA completed hash: ${fixture.capaCompletedResult.capaAction.versionHash}`,
    `Attestation settlement: ${fixture.attestSuccessResult.settlement.assurancePackSettlementId}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Workflow Contract",
    "",
    "- Evidence gap rows are graph, pack, control, scope, and hash bound.",
    "- CAPA mutations require role, purpose-of-use, optimistic concurrency, and audit records.",
    "- Pack attestation, signoff, publish, export, and supersession are pinned to current pack hashes and graph verdict state.",
    "- Queue DTOs expose severity, reason, owner, due date, graph/trust state, CAPA state, next safe action, blockers, evidence refs, and audit refs.",
    "",
  ].join("\n");
}

export function phase9CapaAttestationWorkflowMatrixCsv(
  fixture: Phase9CapaAttestationWorkflowFixture = createPhase9CapaAttestationWorkflowFixture(),
): string {
  const rows = [
    ["case", "result", "blocker"],
    ["attest", fixture.attestSuccessResult.result, fixture.attestSuccessResult.blockerRefs.join("|")],
    ["signoff_open_gap", fixture.signoffBlockedOpenGapResult.result, fixture.signoffBlockedOpenGapResult.blockerRefs.join("|")],
    ["signoff_stale_hash", fixture.signoffBlockedStaleHashResult.result, fixture.signoffBlockedStaleHashResult.blockerRefs.join("|")],
    ["publish_graph_change", fixture.publishBlockedGraphResult.result, fixture.publishBlockedGraphResult.blockerRefs.join("|")],
    ["export_redaction", fixture.exportRedactionBlockedResult.result, fixture.exportRedactionBlockedResult.blockerRefs.join("|")],
    ["actor_denied", fixture.actorDeniedResult.result, fixture.actorDeniedResult.blockerRefs.join("|")],
    ["self_approval", fixture.selfApprovalDeniedResult.result, fixture.selfApprovalDeniedResult.blockerRefs.join("|")],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
