import {
  buildAssuranceLedgerEntry,
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceLedgerEntry,
} from "./phase9-assurance-ledger-contracts";
import {
  type ArtifactDependencyLink,
  type DispositionEligibilityAssessment,
  type RetentionDecision,
  type RetentionLifecycleBinding,
} from "./phase9-governance-control-contracts";
import {
  PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
  createPhase9RetentionLifecycleEngineFixture,
  type DispositionEligibilityAssessmentRecord,
  type RetentionClass,
  type RetentionLifecycleActorContext,
  type RetentionLifecycleAuditRecord,
} from "./phase9-retention-lifecycle-engine";

export const PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION =
  "443.phase9.disposition-execution-engine.v1";

export type DispositionJobActionType = "archive" | "delete";
export type DispositionJobResultState =
  | "queued"
  | "blocked"
  | "executing"
  | "partially_completed"
  | "completed"
  | "aborted";
export type DispositionCandidateOrigin =
  | "current_assessment"
  | "raw_storage_scan"
  | "bucket_prefix"
  | "object_store_manifest"
  | "operator_csv";
export type DispositionGraphVerdictState = "complete" | "partial" | "stale" | "blocked" | "missing";
export type DispositionVisibilityState = "eligible" | "masked" | "denied" | "cross_tenant";

export interface DispositionExecutionActorContext extends RetentionLifecycleActorContext {
  readonly idempotencyKey: string;
  readonly scopeTokenRef: string;
}

export interface DispositionCandidate {
  readonly candidateRef: string;
  readonly origin: DispositionCandidateOrigin;
  readonly tenantId: string;
  readonly artifactRef: string;
  readonly assessment: DispositionEligibilityAssessmentRecord;
  readonly retentionDecision: RetentionDecision;
  readonly retentionLifecycleBinding: RetentionLifecycleBinding;
  readonly retentionClass: RetentionClass;
  readonly currentAssessmentRefs: readonly string[];
  readonly expectedAssessmentHash: string;
  readonly currentGraphHash: string;
  readonly expectedGraphHash: string;
  readonly graphVerdictState: DispositionGraphVerdictState;
  readonly currentHoldStateHash: string;
  readonly expectedHoldStateHash: string;
  readonly visibilityState: DispositionVisibilityState;
  readonly artifactPresentationContractRef: string;
  readonly summaryProjectionRef: string;
  readonly dependencyLinks?: readonly ArtifactDependencyLink[];
}

export interface DispositionJob {
  readonly dispositionJobId: string;
  readonly actionType: DispositionJobActionType;
  readonly tenantId: string;
  readonly artifactRefs: readonly string[];
  readonly retentionDecisionRefs: readonly string[];
  readonly candidateAssessmentRefs: readonly string[];
  readonly expectedAssessmentHashes: readonly string[];
  readonly requestedByActorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly idempotencyKey: string;
  readonly scopeTokenRef: string;
  readonly currentGraphHash: string;
  readonly expectedGraphHash: string;
  readonly graphHash: string;
  readonly freezeRefs: readonly string[];
  readonly legalHoldRefs: readonly string[];
  readonly dependencyRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly blockerExplainerRefs: readonly string[];
  readonly resultState: DispositionJobResultState;
  readonly resultArtifactRef?: string;
  readonly acceptedAt: string;
  readonly updatedAt: string;
  readonly jobHash: string;
}

export interface DispositionBlockExplainer {
  readonly dispositionBlockExplainerId: string;
  readonly artifactRef: string;
  readonly assessmentRef: string;
  readonly blockingReasonRefs: readonly string[];
  readonly activeDependencyRefs: readonly string[];
  readonly activeFreezeRefs: readonly string[];
  readonly activeLegalHoldRefs: readonly string[];
  readonly summaryProjectionRef: string;
  readonly artifactPresentationContractRef: string;
  readonly generatedAt: string;
}

export interface DeletionCertificate {
  readonly deletionCertificateId: string;
  readonly artifactRef: string;
  readonly retentionDecisionRef: string;
  readonly dispositionJobRef: string;
  readonly assessmentRef: string;
  readonly hashAtDeletion: string;
  readonly deletedAt: string;
  readonly deletedBySystemVersion: typeof PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly freezeRefs: readonly string[];
  readonly legalHoldRefs: readonly string[];
  readonly dependencyExplainerRef?: string;
  readonly certificateHash: string;
}

export interface ArchiveManifest {
  readonly archiveManifestId: string;
  readonly artifactRefs: readonly string[];
  readonly retentionDecisionRefs: readonly string[];
  readonly candidateAssessmentRefs: readonly string[];
  readonly archiveLocationRef: string;
  readonly checksumBundleRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly freezeRefs: readonly string[];
  readonly legalHoldRefs: readonly string[];
  readonly manifestHash: string;
  readonly createdAt: string;
}

export interface ArtifactChecksumRecord {
  readonly artifactRef: string;
  readonly sourceChecksum: string;
  readonly archiveChecksum: string;
  readonly checksumBundleRef: string;
}

export interface ArtifactPresentationPolicy {
  readonly artifactPresentationContractRef: string;
  readonly summaryProjectionRef: string;
  readonly audienceRef: string;
  readonly redactionPolicyRef: string;
  readonly safeFieldRefs: readonly string[];
}

export interface DispositionExecutionAuditRecord {
  readonly dispositionExecutionAuditRecordId: string;
  readonly tenantId: string;
  readonly actorRef: string;
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly actionType: string;
  readonly targetRef: string;
  readonly result: DispositionJobResultState;
  readonly blockerRefs: readonly string[];
  readonly commandHash: string;
  readonly recordedAt: string;
}

export interface DispositionLifecycleEventRecord {
  readonly dispositionLifecycleEventRecordId: string;
  readonly lifecycleEventType: string;
  readonly dispositionJobRef: string;
  readonly artifactRef: string;
  readonly resultArtifactRef: string;
  readonly assuranceLedgerEntry: AssuranceLedgerEntry;
  readonly eventHash: string;
  readonly writtenAt: string;
}

export interface DispositionValidationResult {
  readonly valid: boolean;
  readonly blockerRefs: readonly string[];
  readonly explainers: readonly DispositionBlockExplainer[];
  readonly acceptedCandidates: readonly DispositionCandidate[];
}

export interface DispositionExecutionResult {
  readonly job: DispositionJob;
  readonly manifest?: ArchiveManifest;
  readonly deletionCertificates: readonly DeletionCertificate[];
  readonly certificateLifecycleBindings: readonly RetentionLifecycleBinding[];
  readonly blockExplainers: readonly DispositionBlockExplainer[];
  readonly lifecycleEvents: readonly DispositionLifecycleEventRecord[];
  readonly auditRecords: readonly DispositionExecutionAuditRecord[];
  readonly presentationPolicy: ArtifactPresentationPolicy;
}

export interface DispositionExecutionPage<T> {
  readonly rows: readonly T[];
  readonly nextCursor?: string;
}

export interface Phase9DispositionExecutionFixture {
  readonly schemaVersion: typeof PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION;
  readonly upstreamSchemaVersion: typeof PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly apiSurface: readonly string[];
  readonly archiveQueuedResult: DispositionExecutionResult;
  readonly archiveExecutionResult: DispositionExecutionResult;
  readonly archiveReplayExecutionResult: DispositionExecutionResult;
  readonly deleteQueuedResult: DispositionExecutionResult;
  readonly deleteExecutionResult: DispositionExecutionResult;
  readonly deleteReplayExecutionResult: DispositionExecutionResult;
  readonly rawScanBlockedResult: DispositionExecutionResult;
  readonly wormDeleteBlockedResult: DispositionExecutionResult;
  readonly replayCriticalDeleteBlockedResult: DispositionExecutionResult;
  readonly replayCriticalArchiveQueuedResult: DispositionExecutionResult;
  readonly staleAssessmentBlockedResult: DispositionExecutionResult;
  readonly staleGraphBlockedResult: DispositionExecutionResult;
  readonly staleHoldStateBlockedResult: DispositionExecutionResult;
  readonly dependencyPreservationExplainer: DispositionBlockExplainer;
  readonly legalHoldReleaseOldAssessmentBlockedResult: DispositionExecutionResult;
  readonly legalHoldReleaseSupersedingAssessmentResult: DispositionExecutionResult;
  readonly partialArchiveResult: DispositionExecutionResult;
  readonly partialRecoveryResult: DispositionExecutionResult;
  readonly duplicateQueueFirstResult: DispositionExecutionResult;
  readonly duplicateQueueSecondResult: DispositionExecutionResult;
  readonly tenantDeniedErrorCode: string;
  readonly purposeDeniedErrorCode: string;
  readonly blockExplainerResult: DispositionExecutionResult;
  readonly lifecycleWritebackResult: DispositionExecutionResult;
  readonly replayHash: string;
}

export class Phase9DispositionExecutionEngineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9DispositionExecutionEngineError";
    this.code = code;
  }
}

function dispositionInvariant(
  condition: unknown,
  code: string,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Phase9DispositionExecutionEngineError(code, message);
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

function dispositionHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(omitUndefined(value), namespace);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function withoutHashField<T extends Record<string, unknown>>(
  value: T,
  field: string,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([key, entry]) => key !== field && entry !== undefined),
  );
}

function scopeMatchesTenant(scopeRef: string, tenantId: string): boolean {
  return scopeRef.includes(tenantId);
}

function requireDispositionActor(actor: DispositionExecutionActorContext, action: string): void {
  dispositionInvariant(
    actor.roleRefs.includes("records_governance") ||
      actor.roleRefs.includes("disposition_executor"),
    "DISPOSITION_ACTOR_ROLE_DENIED",
    `${action} requires records_governance or disposition_executor role.`,
  );
  dispositionInvariant(
    actor.purposeOfUseRef.startsWith("records:disposition"),
    "DISPOSITION_PURPOSE_OF_USE_DENIED",
    `${action} requires a records:disposition purpose-of-use.`,
  );
  dispositionInvariant(
    actor.reasonRef.length > 0,
    "DISPOSITION_REASON_REQUIRED",
    `${action} requires a reason ref.`,
  );
  dispositionInvariant(
    actor.idempotencyKey.length > 0,
    "DISPOSITION_IDEMPOTENCY_KEY_REQUIRED",
    `${action} requires an idempotency key.`,
  );
  dispositionInvariant(
    actor.scopeTokenRef.length > 0,
    "DISPOSITION_SCOPE_TOKEN_REQUIRED",
    `${action} requires a scope token ref.`,
  );
  dispositionInvariant(
    scopeMatchesTenant(actor.scopeTokenRef, actor.tenantId),
    "DISPOSITION_TENANT_SCOPE_DENIED",
    `${action} scope token must match tenant.`,
  );
}

function executionAuditRecord(input: {
  readonly actor: DispositionExecutionActorContext;
  readonly actionType: string;
  readonly targetRef: string;
  readonly result: DispositionJobResultState;
  readonly blockerRefs: readonly string[];
}): DispositionExecutionAuditRecord {
  const commandHash = dispositionHash(
    {
      tenantId: input.actor.tenantId,
      actorRef: input.actor.actorRef,
      actionType: input.actionType,
      targetRef: input.targetRef,
      result: input.result,
      blockerRefs: sortedUnique(input.blockerRefs),
      idempotencyKey: input.actor.idempotencyKey,
      recordedAt: input.actor.generatedAt,
    },
    "phase9.443.disposition.audit.command",
  );
  return {
    dispositionExecutionAuditRecordId: `dear_443_${commandHash.slice(0, 16)}`,
    tenantId: input.actor.tenantId,
    actorRef: input.actor.actorRef,
    purposeOfUseRef: input.actor.purposeOfUseRef,
    reasonRef: input.actor.reasonRef,
    actionType: input.actionType,
    targetRef: input.targetRef,
    result: input.result,
    blockerRefs: sortedUnique(input.blockerRefs),
    commandHash,
    recordedAt: input.actor.generatedAt,
  };
}

function presentationPolicy(candidate: DispositionCandidate): ArtifactPresentationPolicy {
  return {
    artifactPresentationContractRef: candidate.artifactPresentationContractRef,
    summaryProjectionRef: candidate.summaryProjectionRef,
    audienceRef: "audience:records-governance",
    redactionPolicyRef: "redaction:summary-first-no-raw-archive-url",
    safeFieldRefs: [
      "artifactRef",
      "assessmentRef",
      "retentionDecisionRef",
      "graphHash",
      "blockerSummary",
      "certificateOrManifestHash",
    ],
  };
}

function defaultPresentationPolicy(): ArtifactPresentationPolicy {
  return {
    artifactPresentationContractRef: "artifact-presentation:443:summary-first",
    summaryProjectionRef: "summary:443:disposition",
    audienceRef: "audience:records-governance",
    redactionPolicyRef: "redaction:summary-first-no-raw-archive-url",
    safeFieldRefs: ["summary", "blockers", "hashes"],
  };
}

function holdStateHash(assessment: DispositionEligibilityAssessmentRecord): string {
  return dispositionHash(
    {
      activeFreezeRefs: assessment.activeFreezeRefs,
      activeLegalHoldRefs: assessment.activeLegalHoldRefs,
    },
    "phase9.443.hold-state",
  );
}

function buildJob(input: {
  readonly actor: DispositionExecutionActorContext;
  readonly actionType: DispositionJobActionType;
  readonly candidates: readonly DispositionCandidate[];
  readonly resultState: DispositionJobResultState;
  readonly blockerRefs: readonly string[];
  readonly blockerExplainerRefs: readonly string[];
  readonly resultArtifactRef?: string;
}): DispositionJob {
  const artifactRefs = sortedUnique(input.candidates.map((candidate) => candidate.artifactRef));
  const retentionDecisionRefs = sortedUnique(
    input.candidates.map((candidate) => candidate.retentionDecision.retentionDecisionId),
  );
  const candidateAssessmentRefs = sortedUnique(
    input.candidates.map(
      (candidate) =>
        candidate.assessment.dispositionEligibilityAssessment.dispositionEligibilityAssessmentId,
    ),
  );
  const expectedAssessmentHashes = sortedUnique(
    input.candidates.map((candidate) => candidate.expectedAssessmentHash),
  );
  const graphHashes = sortedUnique(
    input.candidates.map((candidate) => candidate.expectedGraphHash),
  );
  const freezeRefs = sortedUnique(
    input.candidates.flatMap((candidate) => candidate.assessment.activeFreezeRefs),
  );
  const legalHoldRefs = sortedUnique(
    input.candidates.flatMap((candidate) => candidate.assessment.activeLegalHoldRefs),
  );
  const dependencyRefs = sortedUnique(
    input.candidates.flatMap((candidate) => candidate.assessment.activeDependencyLinkRefs),
  );
  const jobIdHash = dispositionHash(
    {
      tenantId: input.actor.tenantId,
      actionType: input.actionType,
      candidateAssessmentRefs,
      expectedAssessmentHashes,
      idempotencyKey: input.actor.idempotencyKey,
      scopeTokenRef: input.actor.scopeTokenRef,
    },
    "phase9.443.disposition-job.id",
  );
  const base = {
    dispositionJobId: `dj_443_${jobIdHash.slice(0, 16)}`,
    actionType: input.actionType,
    tenantId: input.actor.tenantId,
    artifactRefs,
    retentionDecisionRefs,
    candidateAssessmentRefs,
    expectedAssessmentHashes,
    requestedByActorRef: input.actor.actorRef,
    roleRefs: sortedUnique(input.actor.roleRefs),
    purposeOfUseRef: input.actor.purposeOfUseRef,
    reasonRef: input.actor.reasonRef,
    idempotencyKey: input.actor.idempotencyKey,
    scopeTokenRef: input.actor.scopeTokenRef,
    currentGraphHash: graphHashes[0] ?? "graph:missing",
    expectedGraphHash: graphHashes[0] ?? "graph:missing",
    graphHash: graphHashes[0] ?? "graph:missing",
    freezeRefs,
    legalHoldRefs,
    dependencyRefs,
    blockerRefs: sortedUnique(input.blockerRefs),
    blockerExplainerRefs: sortedUnique(input.blockerExplainerRefs),
    resultState: input.resultState,
    resultArtifactRef: input.resultArtifactRef,
    acceptedAt: input.actor.generatedAt,
    updatedAt: input.actor.generatedAt,
  };
  return {
    ...base,
    jobHash: dispositionHash(base, "phase9.443.disposition-job"),
  };
}

function isImmutableDeletionExcluded(candidate: DispositionCandidate): boolean {
  const lowerClass = candidate.retentionLifecycleBinding.artifactClassRef.toLowerCase();
  const lowerMode =
    `${candidate.retentionLifecycleBinding.immutabilityMode} ${candidate.retentionClass.immutabilityMode}`.toLowerCase();
  return (
    ["worm", "hash_chained"].includes(candidate.retentionLifecycleBinding.graphCriticality) ||
    lowerMode.includes("worm") ||
    lowerMode.includes("hash_chained") ||
    lowerClass.includes("audit") ||
    lowerClass.includes("assurance-ledger") ||
    lowerClass.includes("assurance_ledger") ||
    lowerClass.includes("deletion_certificate") ||
    lowerClass.includes("archive_manifest") ||
    lowerClass.includes("legal_hold") ||
    lowerClass.includes("freeze")
  );
}

function cloneAssessmentForAction(input: {
  readonly assessment: DispositionEligibilityAssessmentRecord;
  readonly requestedAction: "archive" | "delete";
  readonly result: DispositionEligibilityAssessmentRecord["result"];
  readonly eligibilityState: DispositionEligibilityAssessment["eligibilityState"];
  readonly blockerRefs: readonly string[];
  readonly blockingReasonRefs?: DispositionEligibilityAssessment["blockingReasonRefs"];
  readonly assessedAt?: string;
}): DispositionEligibilityAssessmentRecord {
  const assessedAt =
    input.assessedAt ?? input.assessment.dispositionEligibilityAssessment.assessedAt;
  const assessmentBase = {
    ...input.assessment.dispositionEligibilityAssessment,
    eligibilityState: input.eligibilityState,
    blockingReasonRefs: input.blockingReasonRefs ?? [],
    assessedAt,
  };
  const reassessed = {
    ...assessmentBase,
    assessmentHash: dispositionHash(
      withoutHashField(assessmentBase, "assessmentHash"),
      "phase9.442.disposition-assessment",
    ),
  };
  return {
    ...input.assessment,
    requestedAction: input.requestedAction,
    result: input.result,
    blockerRefs: sortedUnique(input.blockerRefs),
    dispositionEligibilityAssessment: reassessed,
    decisionHash: dispositionHash(
      {
        assessment: reassessed,
        result: input.result,
        blockerRefs: sortedUnique(input.blockerRefs),
        dependencyRefs: input.assessment.activeDependencyLinkRefs,
      },
      "phase9.442.disposition-assessment.decision",
    ),
  };
}

export class Phase9DispositionExecutionEngine {
  private readonly queuedByIdempotency = new Map<string, DispositionExecutionResult>();
  private readonly jobsById = new Map<string, DispositionJob>();
  private readonly manifestsById = new Map<string, ArchiveManifest>();
  private readonly certificatesById = new Map<string, DeletionCertificate>();
  private readonly explainersById = new Map<string, DispositionBlockExplainer>();
  private readonly lifecycleEventsById = new Map<string, DispositionLifecycleEventRecord>();

  validateDispositionJobCandidates(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly actionType: DispositionJobActionType;
    readonly candidates: readonly DispositionCandidate[];
  }): DispositionValidationResult {
    requireDispositionActor(input.actor, "validateDispositionJobCandidates");
    const blockerRefs = new Set<string>();
    const acceptedCandidates: DispositionCandidate[] = [];
    const explainers: DispositionBlockExplainer[] = [];

    for (const candidate of input.candidates) {
      const assessment = candidate.assessment.dispositionEligibilityAssessment;
      const candidateBlockers = new Set<string>();
      if (
        candidate.tenantId !== input.actor.tenantId ||
        candidate.assessment.auditRecords.some((audit) => audit.tenantId !== input.actor.tenantId)
      ) {
        candidateBlockers.add(`tenant:crossing:${candidate.candidateRef}`);
      }
      if (candidate.origin !== "current_assessment") {
        candidateBlockers.add(`source:${candidate.origin}:denied`);
      }
      if (
        !candidate.currentAssessmentRefs.includes(assessment.dispositionEligibilityAssessmentId)
      ) {
        candidateBlockers.add(
          `assessment:stale-or-not-current:${assessment.dispositionEligibilityAssessmentId}`,
        );
      }
      if (candidate.expectedAssessmentHash !== assessment.assessmentHash) {
        candidateBlockers.add(
          `assessment:hash-mismatch:${assessment.dispositionEligibilityAssessmentId}`,
        );
      }
      if (
        candidate.currentGraphHash !== candidate.expectedGraphHash ||
        candidate.expectedGraphHash !== assessment.graphHash
      ) {
        candidateBlockers.add(`graph:stale:${assessment.graphHash}`);
      }
      if (candidate.graphVerdictState !== "complete") {
        candidateBlockers.add(`graph:verdict-${candidate.graphVerdictState}`);
      }
      if (candidate.currentHoldStateHash !== candidate.expectedHoldStateHash) {
        candidateBlockers.add(`hold-state:stale:${assessment.dispositionEligibilityAssessmentId}`);
      }
      if (candidate.visibilityState !== "eligible") {
        candidateBlockers.add(`visibility:${candidate.visibilityState}`);
      }
      if (!scopeMatchesTenant(input.actor.scopeTokenRef, candidate.tenantId)) {
        candidateBlockers.add(`tenant:scope-token-mismatch:${candidate.tenantId}`);
      }
      if (input.actionType === "delete" && assessment.eligibilityState === "archive_only") {
        candidateBlockers.add(
          `policy:archive-only-cannot-delete:${assessment.dispositionEligibilityAssessmentId}`,
        );
      }
      if (input.actionType === "delete" && assessment.eligibilityState !== "delete_allowed") {
        candidateBlockers.add(
          `assessment:not-delete-eligible:${assessment.dispositionEligibilityAssessmentId}`,
        );
      }
      if (
        input.actionType === "archive" &&
        !["archive_only", "delete_allowed"].includes(assessment.eligibilityState)
      ) {
        candidateBlockers.add(
          `assessment:not-archive-eligible:${assessment.dispositionEligibilityAssessmentId}`,
        );
      }
      if (["blocked", "needs_review", "not_due"].includes(candidate.assessment.result)) {
        candidateBlockers.add(
          `assessment:${candidate.assessment.result}:${assessment.dispositionEligibilityAssessmentId}`,
        );
      }
      for (const freezeRef of sortedUnique([
        ...candidate.assessment.activeFreezeRefs,
        ...assessment.activeFreezeRefs,
      ])) {
        candidateBlockers.add(`freeze:active:${freezeRef}`);
      }
      for (const holdRef of sortedUnique([
        ...candidate.assessment.activeLegalHoldRefs,
        ...assessment.activeLegalHoldRefs,
      ])) {
        candidateBlockers.add(`legal-hold:active:${holdRef}`);
      }
      if (input.actionType === "delete" && isImmutableDeletionExcluded(candidate)) {
        candidateBlockers.add(
          `immutable:delete-excluded:${candidate.retentionLifecycleBinding.artifactClassRef}`,
        );
      }
      if (
        input.actionType === "delete" &&
        candidate.retentionLifecycleBinding.graphCriticality === "replay_critical" &&
        candidate.assessment.activeDependencyLinkRefs.length > 0
      ) {
        candidateBlockers.add(`dependency:replay-critical-active:${candidate.artifactRef}`);
      }
      if (
        input.actionType === "delete" &&
        (candidate.retentionLifecycleBinding.disposalMode === "archive_only" ||
          candidate.retentionClass.disposalMode === "archive_only")
      ) {
        candidateBlockers.add(`policy:archive-only:${candidate.retentionClass.retentionClassId}`);
      }
      if (
        input.actionType === "delete" &&
        candidate.assessment.activeDependencyLinkRefs.length > 0
      ) {
        candidateBlockers.add(
          `dependency:active:${candidate.assessment.activeDependencyLinkRefs.join("|")}`,
        );
      }

      for (const blocker of candidateBlockers) {
        blockerRefs.add(blocker);
      }
      if (candidateBlockers.size > 0) {
        explainers.push(
          this.generateDispositionBlockExplainer({
            candidate,
            blockerRefs: sortedUnique([...candidateBlockers, ...candidate.assessment.blockerRefs]),
            generatedAt: input.actor.generatedAt,
            audienceRef: "audience:records-governance",
          }),
        );
      } else {
        acceptedCandidates.push(candidate);
      }
    }

    return {
      valid:
        blockerRefs.size === 0 &&
        acceptedCandidates.length === input.candidates.length &&
        input.candidates.length > 0,
      blockerRefs: sortedUnique([...blockerRefs]),
      explainers,
      acceptedCandidates,
    };
  }

  queueArchiveJob(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly candidates: readonly DispositionCandidate[];
  }): DispositionExecutionResult {
    return this.queueDispositionJob({ ...input, actionType: "archive" });
  }

  queueDeleteJob(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly candidates: readonly DispositionCandidate[];
  }): DispositionExecutionResult {
    return this.queueDispositionJob({ ...input, actionType: "delete" });
  }

  queueDispositionJob(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly actionType: DispositionJobActionType;
    readonly candidates: readonly DispositionCandidate[];
  }): DispositionExecutionResult {
    requireDispositionActor(input.actor, "queueDispositionJob");
    const semanticHash = dispositionHash(
      {
        actionType: input.actionType,
        candidateRefs: input.candidates.map((candidate) => candidate.candidateRef).sort(),
        assessmentHashes: input.candidates
          .map((candidate) => candidate.expectedAssessmentHash)
          .sort(),
      },
      "phase9.443.disposition-job.semantic",
    );
    const idempotencyRef = `${input.actor.tenantId}:${input.actor.idempotencyKey}:${semanticHash}`;
    const existing = this.queuedByIdempotency.get(idempotencyRef);
    if (existing) {
      return existing;
    }

    const validation = this.validateDispositionJobCandidates(input);
    const resultState: DispositionJobResultState = validation.valid ? "queued" : "blocked";
    const resultArtifactRef = validation.valid
      ? `pending:${input.actionType}:artifact`
      : validation.explainers[0]?.dispositionBlockExplainerId;
    const job = buildJob({
      actor: input.actor,
      actionType: input.actionType,
      candidates: input.candidates,
      resultState,
      blockerRefs: validation.blockerRefs,
      blockerExplainerRefs: validation.explainers.map(
        (explainer) => explainer.dispositionBlockExplainerId,
      ),
      resultArtifactRef,
    });
    for (const explainer of validation.explainers) {
      this.explainersById.set(explainer.dispositionBlockExplainerId, explainer);
    }
    this.jobsById.set(job.dispositionJobId, job);
    const result: DispositionExecutionResult = {
      job,
      deletionCertificates: [],
      certificateLifecycleBindings: [],
      blockExplainers: validation.explainers,
      lifecycleEvents: [],
      auditRecords: [
        executionAuditRecord({
          actor: input.actor,
          actionType: `disposition.queue_${input.actionType}`,
          targetRef: job.dispositionJobId,
          result: resultState,
          blockerRefs: validation.blockerRefs,
        }),
      ],
      presentationPolicy: input.candidates[0]
        ? presentationPolicy(input.candidates[0])
        : defaultPresentationPolicy(),
    };
    this.queuedByIdempotency.set(idempotencyRef, result);
    return result;
  }

  executeDispositionJobSafely(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly queuedResult: DispositionExecutionResult;
    readonly candidates: readonly DispositionCandidate[];
    readonly checksumRecords?: readonly ArtifactChecksumRecord[];
    readonly archiveLocationRef?: string;
    readonly allowPartial?: boolean;
    readonly certificateWriteSucceeded?: boolean;
  }): DispositionExecutionResult {
    requireDispositionActor(input.actor, "executeDispositionJobSafely");
    const job = input.queuedResult.job;
    if (job.resultState === "blocked" || job.resultState === "aborted") {
      return input.queuedResult;
    }
    dispositionInvariant(
      job.resultState === "queued",
      "DISPOSITION_JOB_NOT_EXECUTABLE",
      "Only queued jobs can execute.",
    );

    if (job.actionType === "archive") {
      return this.executeArchiveJob(input);
    }
    return this.executeDeleteJob(input);
  }

  abortOrBlockDispositionJob(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly queuedResult: DispositionExecutionResult;
    readonly blockerRefs: readonly string[];
    readonly resultState: "blocked" | "aborted";
  }): DispositionExecutionResult {
    requireDispositionActor(input.actor, "abortOrBlockDispositionJob");
    const job = {
      ...input.queuedResult.job,
      resultState: input.resultState,
      blockerRefs: sortedUnique([...input.queuedResult.job.blockerRefs, ...input.blockerRefs]),
      updatedAt: input.actor.generatedAt,
    };
    const updatedJob = {
      ...job,
      jobHash: dispositionHash(withoutHashField(job, "jobHash"), "phase9.443.disposition-job"),
    };
    this.jobsById.set(updatedJob.dispositionJobId, updatedJob);
    return {
      ...input.queuedResult,
      job: updatedJob,
      auditRecords: [
        ...input.queuedResult.auditRecords,
        executionAuditRecord({
          actor: input.actor,
          actionType: `disposition.${input.resultState}`,
          targetRef: updatedJob.dispositionJobId,
          result: input.resultState,
          blockerRefs: input.blockerRefs,
        }),
      ],
    };
  }

  retrieveArchiveManifest(manifestRef: string): ArchiveManifest | undefined {
    return this.manifestsById.get(manifestRef);
  }

  retrieveDeletionCertificate(certificateRef: string): DeletionCertificate | undefined {
    return this.certificatesById.get(certificateRef);
  }

  listDispositionBlockers(result: DispositionExecutionResult): readonly string[] {
    return sortedUnique([
      ...result.job.blockerRefs,
      ...result.blockExplainers.flatMap((explainer) => explainer.blockingReasonRefs),
    ]);
  }

  generateDispositionBlockExplainer(input: {
    readonly candidate: DispositionCandidate;
    readonly blockerRefs: readonly string[];
    readonly generatedAt: string;
    readonly audienceRef: string;
  }): DispositionBlockExplainer {
    const assessment = input.candidate.assessment.dispositionEligibilityAssessment;
    const safeBlockers = sortedUnique(input.blockerRefs).map((blocker) =>
      blocker.startsWith("artifact:")
        ? `redacted:${dispositionHash(blocker, "phase9.443.explainer.redaction").slice(0, 12)}`
        : blocker,
    );
    const explainerHash = dispositionHash(
      {
        artifactRef: input.candidate.artifactRef,
        assessmentRef: assessment.dispositionEligibilityAssessmentId,
        blockerRefs: safeBlockers,
        generatedAt: input.generatedAt,
        audienceRef: input.audienceRef,
      },
      "phase9.443.block-explainer",
    );
    const explainer: DispositionBlockExplainer = {
      dispositionBlockExplainerId: `dbe_443_${explainerHash.slice(0, 16)}`,
      artifactRef: input.candidate.artifactRef,
      assessmentRef: assessment.dispositionEligibilityAssessmentId,
      blockingReasonRefs: safeBlockers,
      activeDependencyRefs: sortedUnique(input.candidate.assessment.activeDependencyLinkRefs),
      activeFreezeRefs: sortedUnique(input.candidate.assessment.activeFreezeRefs),
      activeLegalHoldRefs: sortedUnique(input.candidate.assessment.activeLegalHoldRefs),
      summaryProjectionRef: `summary:redacted:${explainerHash.slice(0, 16)}`,
      artifactPresentationContractRef: input.candidate.artifactPresentationContractRef,
      generatedAt: input.generatedAt,
    };
    this.explainersById.set(explainer.dispositionBlockExplainerId, explainer);
    return explainer;
  }

  emitLifecycleEvidenceForAssuranceGraph(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly job: DispositionJob;
    readonly artifactRef: string;
    readonly resultArtifactRef: string;
    readonly lifecycleEventType: string;
    readonly previousHash?: string;
  }): DispositionLifecycleEventRecord {
    const eventHash = dispositionHash(
      {
        dispositionJobRef: input.job.dispositionJobId,
        artifactRef: input.artifactRef,
        resultArtifactRef: input.resultArtifactRef,
        lifecycleEventType: input.lifecycleEventType,
        graphHash: input.job.graphHash,
        writtenAt: input.actor.generatedAt,
      },
      "phase9.443.lifecycle-event",
    );
    const assuranceLedgerEntry = buildAssuranceLedgerEntry({
      assuranceLedgerEntryId: `ale_443_${eventHash.slice(0, 16)}`,
      sourceEventRef: `event:disposition:${input.job.dispositionJobId}`,
      entryType: "evidence_materialization",
      tenantId: input.job.tenantId,
      producerRef: PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
      namespaceRef: "analytics_assurance.records_lifecycle",
      schemaVersionRef: PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
      normalizationVersionRef: "normalization:443:lifecycle-writeback:v1",
      sourceSequenceRef: `seq:${input.job.dispositionJobId}:${input.artifactRef}`,
      sourceBoundedContextRef: "analytics_assurance",
      governingBoundedContextRef: "assurance_and_governance",
      requiredContextBoundaryRefs: ["phase9:assurance-ledger", "phase9:records-lifecycle"],
      edgeCorrelationId: input.job.dispositionJobId,
      auditRecordRef: input.job.jobHash,
      causalTokenRef: input.job.idempotencyKey,
      replayDecisionClass: "exact_replay",
      effectKeyRef: `${input.job.dispositionJobId}:${input.artifactRef}:${input.lifecycleEventType}`,
      controlRefs: ["control:retention-disposition:443", "control:assurance-ledger-writeback"],
      evidenceRefs: [input.resultArtifactRef, ...input.job.candidateAssessmentRefs],
      graphEdgeRefs: [input.job.graphHash],
      previousHash: input.previousHash ?? "0".repeat(64),
      createdAt: input.actor.generatedAt,
      canonicalPayload: {
        dispositionJobRef: input.job.dispositionJobId,
        artifactRef: input.artifactRef,
        resultArtifactRef: input.resultArtifactRef,
        lifecycleEventType: input.lifecycleEventType,
      },
      inputSetValues: [input.job.jobHash, input.resultArtifactRef, input.job.graphHash],
    });
    const record: DispositionLifecycleEventRecord = {
      dispositionLifecycleEventRecordId: `dler_443_${eventHash.slice(0, 16)}`,
      lifecycleEventType: input.lifecycleEventType,
      dispositionJobRef: input.job.dispositionJobId,
      artifactRef: input.artifactRef,
      resultArtifactRef: input.resultArtifactRef,
      assuranceLedgerEntry,
      eventHash,
      writtenAt: input.actor.generatedAt,
    };
    this.lifecycleEventsById.set(record.dispositionLifecycleEventRecordId, record);
    return record;
  }

  listWithCursor<T>(rows: readonly T[], cursor?: string, limit = 25): DispositionExecutionPage<T> {
    const offset = cursor?.startsWith("cursor:") ? Number(cursor.slice("cursor:".length)) : 0;
    const pageRows = rows.slice(offset, offset + limit);
    const nextOffset = offset + pageRows.length;
    return {
      rows: pageRows,
      nextCursor: nextOffset < rows.length ? `cursor:${nextOffset}` : undefined,
    };
  }

  private executeArchiveJob(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly queuedResult: DispositionExecutionResult;
    readonly candidates: readonly DispositionCandidate[];
    readonly checksumRecords?: readonly ArtifactChecksumRecord[];
    readonly archiveLocationRef?: string;
    readonly allowPartial?: boolean;
  }): DispositionExecutionResult {
    const job = input.queuedResult.job;
    const checksumByArtifact = new Map(
      (input.checksumRecords ?? []).map((record) => [record.artifactRef, record]),
    );
    const archiveBlockers = new Set<string>();
    const completedArtifactRefs: string[] = [];
    for (const candidate of input.candidates) {
      if (!candidate.artifactPresentationContractRef.startsWith("artifact-presentation:")) {
        archiveBlockers.add(`presentation:contract-missing:${candidate.artifactRef}`);
      }
      const checksum = checksumByArtifact.get(candidate.artifactRef);
      if (!checksum) {
        archiveBlockers.add(`checksum:missing:${candidate.artifactRef}`);
        continue;
      }
      if (checksum.sourceChecksum !== checksum.archiveChecksum) {
        archiveBlockers.add(`checksum:mismatch:${candidate.artifactRef}`);
        continue;
      }
      completedArtifactRefs.push(candidate.artifactRef);
    }
    if (
      input.archiveLocationRef?.startsWith("s3://") ||
      input.archiveLocationRef?.startsWith("gs://")
    ) {
      archiveBlockers.add("presentation:raw-archive-url-denied");
    }
    const partiallyCompleted =
      input.allowPartial === true && completedArtifactRefs.length > 0 && archiveBlockers.size > 0;
    if (archiveBlockers.size > 0 && !partiallyCompleted) {
      return this.abortOrBlockDispositionJob({
        actor: input.actor,
        queuedResult: input.queuedResult,
        blockerRefs: [...archiveBlockers],
        resultState: "blocked",
      });
    }

    const artifactRefs = partiallyCompleted
      ? sortedUnique(completedArtifactRefs)
      : job.artifactRefs;
    const checksumBundleRefs = sortedUnique(
      artifactRefs
        .map((artifactRef) => checksumByArtifact.get(artifactRef)?.checksumBundleRef ?? "")
        .filter((ref) => ref.length > 0),
    );
    const manifestBase = {
      archiveManifestId: "",
      artifactRefs,
      retentionDecisionRefs: job.retentionDecisionRefs,
      candidateAssessmentRefs: job.candidateAssessmentRefs,
      archiveLocationRef:
        input.archiveLocationRef ?? `archive-location:summary-only:${job.dispositionJobId}`,
      checksumBundleRef: orderedSetHash(checksumBundleRefs, "phase9.443.archive.checksum-bundle"),
      assuranceEvidenceGraphSnapshotRef:
        input.candidates[0]?.assessment.dispositionEligibilityAssessment
          .assuranceEvidenceGraphSnapshotRef ?? "graph-snapshot:missing",
      assuranceGraphCompletenessVerdictRef:
        input.candidates[0]?.assessment.dispositionEligibilityAssessment
          .assuranceGraphCompletenessVerdictRef ?? "graph-verdict:missing",
      graphHash: job.graphHash,
      freezeRefs: job.freezeRefs,
      legalHoldRefs: job.legalHoldRefs,
      createdAt: input.actor.generatedAt,
    };
    const manifestHash = dispositionHash(manifestBase, "phase9.443.archive-manifest");
    const manifest: ArchiveManifest = {
      ...manifestBase,
      archiveManifestId: `am_443_${manifestHash.slice(0, 16)}`,
      manifestHash,
    };
    this.manifestsById.set(manifest.archiveManifestId, manifest);
    const updatedJobBase = {
      ...job,
      resultState: partiallyCompleted ? "partially_completed" : "completed",
      resultArtifactRef: manifest.archiveManifestId,
      blockerRefs: partiallyCompleted
        ? sortedUnique([...job.blockerRefs, ...archiveBlockers])
        : job.blockerRefs,
      updatedAt: input.actor.generatedAt,
    } satisfies DispositionJob;
    const updatedJob = {
      ...updatedJobBase,
      jobHash: dispositionHash(
        withoutHashField(updatedJobBase, "jobHash"),
        "phase9.443.disposition-job",
      ),
    };
    this.jobsById.set(updatedJob.dispositionJobId, updatedJob);
    const lifecycleEvents = artifactRefs.map((artifactRef, index) =>
      this.emitLifecycleEvidenceForAssuranceGraph({
        actor: input.actor,
        job: updatedJob,
        artifactRef,
        resultArtifactRef: manifest.archiveManifestId,
        lifecycleEventType: "records_lifecycle.archive_manifest_written",
        previousHash: index === 0 ? undefined : "1".repeat(64),
      }),
    );
    return {
      ...input.queuedResult,
      job: updatedJob,
      manifest,
      lifecycleEvents,
      auditRecords: [
        ...input.queuedResult.auditRecords,
        executionAuditRecord({
          actor: input.actor,
          actionType: "disposition.execute_archive",
          targetRef: updatedJob.dispositionJobId,
          result: updatedJob.resultState,
          blockerRefs: [...archiveBlockers],
        }),
      ],
    };
  }

  private executeDeleteJob(input: {
    readonly actor: DispositionExecutionActorContext;
    readonly queuedResult: DispositionExecutionResult;
    readonly candidates: readonly DispositionCandidate[];
    readonly certificateWriteSucceeded?: boolean;
  }): DispositionExecutionResult {
    const job = input.queuedResult.job;
    if (input.certificateWriteSucceeded === false) {
      return this.abortOrBlockDispositionJob({
        actor: input.actor,
        queuedResult: input.queuedResult,
        blockerRefs: ["certificate:write-before-delete-required"],
        resultState: "blocked",
      });
    }
    const certificates: DeletionCertificate[] = [];
    const certificateLifecycleBindings: RetentionLifecycleBinding[] = [];
    const lifecycleEvents: DispositionLifecycleEventRecord[] = [];
    for (const candidate of input.candidates) {
      const assessment = candidate.assessment.dispositionEligibilityAssessment;
      const certificateBase = {
        deletionCertificateId: "",
        artifactRef: candidate.artifactRef,
        retentionDecisionRef: candidate.retentionDecision.retentionDecisionId,
        dispositionJobRef: job.dispositionJobId,
        assessmentRef: assessment.dispositionEligibilityAssessmentId,
        hashAtDeletion: candidate.retentionLifecycleBinding.classificationHash,
        deletedAt: input.actor.generatedAt,
        deletedBySystemVersion:
          PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION as typeof PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
        assuranceEvidenceGraphSnapshotRef: assessment.assuranceEvidenceGraphSnapshotRef,
        assuranceGraphCompletenessVerdictRef: assessment.assuranceGraphCompletenessVerdictRef,
        graphHash: assessment.graphHash,
        freezeRefs: assessment.activeFreezeRefs,
        legalHoldRefs: assessment.activeLegalHoldRefs,
        dependencyExplainerRef: input.queuedResult.blockExplainers[0]?.dispositionBlockExplainerId,
      };
      const certificateHash = dispositionHash(certificateBase, "phase9.443.deletion-certificate");
      const certificate: DeletionCertificate = {
        ...certificateBase,
        deletionCertificateId: `dc_443_${certificateHash.slice(0, 16)}`,
        certificateHash,
      };
      certificates.push(certificate);
      this.certificatesById.set(certificate.deletionCertificateId, certificate);
      certificateLifecycleBindings.push(this.createCertificateLifecycleBinding(certificate));
    }
    const updatedJobBase = {
      ...job,
      resultState: "completed",
      resultArtifactRef: certificates
        .map((certificate) => certificate.deletionCertificateId)
        .join("|"),
      updatedAt: input.actor.generatedAt,
    } satisfies DispositionJob;
    const updatedJob = {
      ...updatedJobBase,
      jobHash: dispositionHash(
        withoutHashField(updatedJobBase, "jobHash"),
        "phase9.443.disposition-job",
      ),
    };
    this.jobsById.set(updatedJob.dispositionJobId, updatedJob);
    certificates.forEach((certificate, index) => {
      lifecycleEvents.push(
        this.emitLifecycleEvidenceForAssuranceGraph({
          actor: input.actor,
          job: updatedJob,
          artifactRef: certificate.artifactRef,
          resultArtifactRef: certificate.deletionCertificateId,
          lifecycleEventType: "records_lifecycle.deletion_certificate_written",
          previousHash: index === 0 ? undefined : "2".repeat(64),
        }),
      );
    });
    return {
      ...input.queuedResult,
      job: updatedJob,
      deletionCertificates: certificates,
      certificateLifecycleBindings,
      lifecycleEvents,
      auditRecords: [
        ...input.queuedResult.auditRecords,
        executionAuditRecord({
          actor: input.actor,
          actionType: "disposition.execute_delete",
          targetRef: updatedJob.dispositionJobId,
          result: "completed",
          blockerRefs: [],
        }),
      ],
    };
  }

  private createCertificateLifecycleBinding(
    certificate: DeletionCertificate,
  ): RetentionLifecycleBinding {
    const classificationHash = dispositionHash(
      {
        certificateRef: certificate.deletionCertificateId,
        sourceArtifactRef: certificate.artifactRef,
        graphHash: certificate.graphHash,
        certificateHash: certificate.certificateHash,
      },
      "phase9.443.deletion-certificate.lifecycle-binding",
    );
    return {
      retentionLifecycleBindingId: `rlb_443_${classificationHash.slice(0, 16)}`,
      artifactRef: `artifact:${certificate.deletionCertificateId}`,
      artifactVersionRef: `artifact-version:${certificate.deletionCertificateId}:v1`,
      artifactClassRef: "class:deletion_certificate",
      retentionClassRef: "rc_443_deletion_certificate_immutable",
      disposalMode: "archive_only",
      immutabilityMode: "worm_hash_chained",
      dependencyCheckPolicyRef: "dependency-policy:deletion-certificate-never-delete",
      minimumRetentionOverrideRef: "override:never-delete",
      activeFreezeRefs: [],
      activeLegalHoldRefs: [],
      graphCriticality: "hash_chained",
      lifecycleState: "active",
      classificationHash,
      createdAt: certificate.deletedAt,
    };
  }
}

function decisionForAssessment(
  assessment: DispositionEligibilityAssessmentRecord,
  fallbackDecision: RetentionDecision,
): RetentionDecision {
  return {
    ...fallbackDecision,
    artifactRef: assessment.artifactRef,
    retentionDecisionId: assessment.dispositionEligibilityAssessment.retentionDecisionRef,
    dispositionEligibilityAssessmentRef:
      assessment.dispositionEligibilityAssessment.dispositionEligibilityAssessmentId,
    assuranceEvidenceGraphSnapshotRef:
      assessment.dispositionEligibilityAssessment.assuranceEvidenceGraphSnapshotRef,
    assuranceGraphCompletenessVerdictRef:
      assessment.dispositionEligibilityAssessment.assuranceGraphCompletenessVerdictRef,
    activeFreezeRefs: assessment.activeFreezeRefs,
    activeLegalHoldRefs: assessment.activeLegalHoldRefs,
    effectiveDisposition:
      assessment.result === "eligible"
        ? "delete_pending"
        : assessment.result === "archive_only"
          ? "archive_only"
          : "blocked",
    decisionHash: dispositionHash(
      {
        retentionDecisionId: assessment.dispositionEligibilityAssessment.retentionDecisionRef,
        artifactRef: assessment.artifactRef,
        assessmentRef:
          assessment.dispositionEligibilityAssessment.dispositionEligibilityAssessmentId,
        graphHash: assessment.dispositionEligibilityAssessment.graphHash,
      },
      "phase9.443.fixture.retention-decision",
    ),
  };
}

function bindingForAssessment(
  assessment: DispositionEligibilityAssessmentRecord,
  baseBinding: RetentionLifecycleBinding,
  override?: Partial<RetentionLifecycleBinding>,
): RetentionLifecycleBinding {
  return {
    ...baseBinding,
    artifactRef: assessment.artifactRef,
    artifactVersionRef: `artifact-version:${assessment.artifactRef}:v1`,
    retentionLifecycleBindingId:
      assessment.dispositionEligibilityAssessment.retentionLifecycleBindingRef,
    activeFreezeRefs: assessment.activeFreezeRefs,
    activeLegalHoldRefs: assessment.activeLegalHoldRefs,
    ...override,
  };
}

function candidateFromAssessment(input: {
  readonly candidateRef: string;
  readonly tenantId: string;
  readonly assessment: DispositionEligibilityAssessmentRecord;
  readonly retentionDecision: RetentionDecision;
  readonly retentionLifecycleBinding: RetentionLifecycleBinding;
  readonly retentionClass: RetentionClass;
  readonly origin?: DispositionCandidateOrigin;
  readonly currentAssessmentRefs?: readonly string[];
  readonly currentGraphHash?: string;
  readonly expectedGraphHash?: string;
  readonly graphVerdictState?: DispositionGraphVerdictState;
  readonly currentHoldStateHash?: string;
  readonly expectedHoldStateHash?: string;
  readonly visibilityState?: DispositionVisibilityState;
  readonly dependencyLinks?: readonly ArtifactDependencyLink[];
}): DispositionCandidate {
  const assessment = input.assessment.dispositionEligibilityAssessment;
  const expectedHoldState = holdStateHash(input.assessment);
  return {
    candidateRef: input.candidateRef,
    origin: input.origin ?? "current_assessment",
    tenantId: input.tenantId,
    artifactRef: input.assessment.artifactRef,
    assessment: input.assessment,
    retentionDecision: input.retentionDecision,
    retentionLifecycleBinding: input.retentionLifecycleBinding,
    retentionClass: input.retentionClass,
    currentAssessmentRefs: input.currentAssessmentRefs ?? [
      assessment.dispositionEligibilityAssessmentId,
    ],
    expectedAssessmentHash: assessment.assessmentHash,
    currentGraphHash: input.currentGraphHash ?? assessment.graphHash,
    expectedGraphHash: input.expectedGraphHash ?? assessment.graphHash,
    graphVerdictState: input.graphVerdictState ?? "complete",
    currentHoldStateHash: input.currentHoldStateHash ?? expectedHoldState,
    expectedHoldStateHash: input.expectedHoldStateHash ?? expectedHoldState,
    visibilityState: input.visibilityState ?? "eligible",
    artifactPresentationContractRef: `artifact-presentation:443:${input.candidateRef}`,
    summaryProjectionRef: `summary:443:${input.candidateRef}`,
    dependencyLinks: input.dependencyLinks,
  };
}

export function createPhase9DispositionExecutionFixture(): Phase9DispositionExecutionFixture {
  const lifecycleFixture = createPhase9RetentionLifecycleEngineFixture();
  const generatedAt = "2026-04-27T13:00:00.000Z";
  const actor: DispositionExecutionActorContext = {
    tenantId: "tenant:demo-gp",
    actorRef: "actor:disposition-executor-443",
    roleRefs: ["disposition_executor", "records_governance"],
    purposeOfUseRef: "records:disposition:execute",
    reasonRef: "reason:443:assessed-disposition",
    generatedAt,
    idempotencyKey: "idem:443:base",
    scopeTokenRef: "scope-token:tenant:demo-gp:records-disposition",
  };
  const baseBinding = lifecycleFixture.artifactCreationResult.binding!;
  const ordinaryClass = lifecycleFixture.retentionClasses[0]!;
  const wormClass = lifecycleFixture.retentionClasses.find(
    (retentionClass) => retentionClass.retentionClassId === "rc_442_audit_worm",
  )!;
  const replayClass = lifecycleFixture.retentionClasses.find(
    (retentionClass) => retentionClass.retentionClassId === "rc_442_replay_critical_model_trace",
  )!;
  const eligibleAssessment = lifecycleFixture.reassessmentAfterRelease;
  const archiveEligibleAssessment = cloneAssessmentForAction({
    assessment: eligibleAssessment,
    requestedAction: "archive",
    result: "archive_only",
    eligibilityState: "archive_only",
    blockerRefs: [],
  });
  const replayArchiveAssessment = cloneAssessmentForAction({
    assessment: lifecycleFixture.replayCriticalAssessment,
    requestedAction: "archive",
    result: "archive_only",
    eligibilityState: "archive_only",
    blockerRefs: [],
  });

  const eligibleDecision = decisionForAssessment(
    eligibleAssessment,
    lifecycleFixture.baselineDecision,
  );
  const archiveDecision = decisionForAssessment(
    archiveEligibleAssessment,
    lifecycleFixture.baselineDecision,
  );
  const replayArchiveDecision = decisionForAssessment(
    replayArchiveAssessment,
    lifecycleFixture.baselineDecision,
  );
  const eligibleBinding = bindingForAssessment(eligibleAssessment, baseBinding);
  const archiveBinding = bindingForAssessment(archiveEligibleAssessment, baseBinding);
  const wormBinding = bindingForAssessment(
    lifecycleFixture.wormHashChainedAssessment,
    baseBinding,
    {
      artifactClassRef: "class:audit_entry",
      disposalMode: "archive_only",
      immutabilityMode: "worm_hash_chained",
      graphCriticality: "hash_chained",
    },
  );
  const replayBinding = bindingForAssessment(replayArchiveAssessment, baseBinding, {
    artifactClassRef: "class:model_trace",
    disposalMode: "archive_then_review",
    immutabilityMode: "replay_critical_hash_preserved",
    graphCriticality: "replay_critical",
  });

  const archiveCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:archive-current",
    tenantId: actor.tenantId,
    assessment: archiveEligibleAssessment,
    retentionDecision: archiveDecision,
    retentionLifecycleBinding: archiveBinding,
    retentionClass: ordinaryClass,
  });
  const deleteCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:delete-current",
    tenantId: actor.tenantId,
    assessment: eligibleAssessment,
    retentionDecision: eligibleDecision,
    retentionLifecycleBinding: eligibleBinding,
    retentionClass: ordinaryClass,
  });
  const rawStorageCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:raw-scan",
    tenantId: actor.tenantId,
    assessment: lifecycleFixture.rawStorageScanAssessment,
    retentionDecision: decisionForAssessment(
      lifecycleFixture.rawStorageScanAssessment,
      lifecycleFixture.baselineDecision,
    ),
    retentionLifecycleBinding: bindingForAssessment(
      lifecycleFixture.rawStorageScanAssessment,
      baseBinding,
    ),
    retentionClass: ordinaryClass,
    origin: "raw_storage_scan",
  });
  const wormCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:worm",
    tenantId: actor.tenantId,
    assessment: lifecycleFixture.wormHashChainedAssessment,
    retentionDecision: decisionForAssessment(
      lifecycleFixture.wormHashChainedAssessment,
      lifecycleFixture.baselineDecision,
    ),
    retentionLifecycleBinding: wormBinding,
    retentionClass: wormClass,
  });
  const replayCriticalDeleteCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:replay-delete",
    tenantId: actor.tenantId,
    assessment: lifecycleFixture.replayCriticalAssessment,
    retentionDecision: decisionForAssessment(
      lifecycleFixture.replayCriticalAssessment,
      lifecycleFixture.baselineDecision,
    ),
    retentionLifecycleBinding: replayBinding,
    retentionClass: replayClass,
  });
  const replayCriticalArchiveCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:replay-archive",
    tenantId: actor.tenantId,
    assessment: replayArchiveAssessment,
    retentionDecision: replayArchiveDecision,
    retentionLifecycleBinding: replayBinding,
    retentionClass: replayClass,
  });
  const staleAssessmentCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:stale-assessment",
    tenantId: actor.tenantId,
    assessment: eligibleAssessment,
    retentionDecision: eligibleDecision,
    retentionLifecycleBinding: eligibleBinding,
    retentionClass: ordinaryClass,
    currentAssessmentRefs: ["dea_442_superseding_not_this_one"],
  });
  const staleGraphCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:stale-graph",
    tenantId: actor.tenantId,
    assessment: eligibleAssessment,
    retentionDecision: eligibleDecision,
    retentionLifecycleBinding: eligibleBinding,
    retentionClass: ordinaryClass,
    currentGraphHash: "graph:stale:443",
    graphVerdictState: "stale",
  });
  const staleHoldCandidate = candidateFromAssessment({
    candidateRef: "candidate:443:stale-hold",
    tenantId: actor.tenantId,
    assessment: lifecycleFixture.legalHoldBlockedAssessment,
    retentionDecision: decisionForAssessment(
      lifecycleFixture.legalHoldBlockedAssessment,
      lifecycleFixture.baselineDecision,
    ),
    retentionLifecycleBinding: bindingForAssessment(
      lifecycleFixture.legalHoldBlockedAssessment,
      baseBinding,
    ),
    retentionClass: ordinaryClass,
    currentHoldStateHash: "hold-state:released-but-assessment-not-superseded",
  });

  const archiveEngine = new Phase9DispositionExecutionEngine();
  const archiveQueuedResult = archiveEngine.queueArchiveJob({
    actor: { ...actor, idempotencyKey: "idem:443:archive" },
    candidates: [archiveCandidate],
  });
  const archiveExecutionResult = archiveEngine.executeDispositionJobSafely({
    actor: { ...actor, idempotencyKey: "idem:443:archive" },
    queuedResult: archiveQueuedResult,
    candidates: [archiveCandidate],
    archiveLocationRef: `archive-location:summary-only:${archiveQueuedResult.job.dispositionJobId}`,
    checksumRecords: [
      {
        artifactRef: archiveCandidate.artifactRef,
        sourceChecksum: "sha256:443-archive-source",
        archiveChecksum: "sha256:443-archive-source",
        checksumBundleRef: "checksum-bundle:443:archive",
      },
    ],
  });
  const archiveReplayEngine = new Phase9DispositionExecutionEngine();
  const archiveReplayQueued = archiveReplayEngine.queueArchiveJob({
    actor: { ...actor, idempotencyKey: "idem:443:archive" },
    candidates: [archiveCandidate],
  });
  const archiveReplayExecutionResult = archiveReplayEngine.executeDispositionJobSafely({
    actor: { ...actor, idempotencyKey: "idem:443:archive" },
    queuedResult: archiveReplayQueued,
    candidates: [archiveCandidate],
    archiveLocationRef: `archive-location:summary-only:${archiveReplayQueued.job.dispositionJobId}`,
    checksumRecords: [
      {
        artifactRef: archiveCandidate.artifactRef,
        sourceChecksum: "sha256:443-archive-source",
        archiveChecksum: "sha256:443-archive-source",
        checksumBundleRef: "checksum-bundle:443:archive",
      },
    ],
  });

  const deleteEngine = new Phase9DispositionExecutionEngine();
  const deleteQueuedResult = deleteEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:delete" },
    candidates: [deleteCandidate],
  });
  const deleteExecutionResult = deleteEngine.executeDispositionJobSafely({
    actor: { ...actor, idempotencyKey: "idem:443:delete" },
    queuedResult: deleteQueuedResult,
    candidates: [deleteCandidate],
  });
  const deleteReplayEngine = new Phase9DispositionExecutionEngine();
  const deleteReplayQueued = deleteReplayEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:delete" },
    candidates: [deleteCandidate],
  });
  const deleteReplayExecutionResult = deleteReplayEngine.executeDispositionJobSafely({
    actor: { ...actor, idempotencyKey: "idem:443:delete" },
    queuedResult: deleteReplayQueued,
    candidates: [deleteCandidate],
  });

  const blockingEngine = new Phase9DispositionExecutionEngine();
  const rawScanBlockedResult = blockingEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:raw" },
    candidates: [rawStorageCandidate],
  });
  const wormDeleteBlockedResult = blockingEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:worm" },
    candidates: [wormCandidate],
  });
  const replayCriticalDeleteBlockedResult = blockingEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:replay-delete" },
    candidates: [replayCriticalDeleteCandidate],
  });
  const replayCriticalArchiveQueuedResult = blockingEngine.queueArchiveJob({
    actor: { ...actor, idempotencyKey: "idem:443:replay-archive" },
    candidates: [replayCriticalArchiveCandidate],
  });
  const staleAssessmentBlockedResult = blockingEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:stale-assessment" },
    candidates: [staleAssessmentCandidate],
  });
  const staleGraphBlockedResult = blockingEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:stale-graph" },
    candidates: [staleGraphCandidate],
  });
  const staleHoldStateBlockedResult = blockingEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:stale-hold" },
    candidates: [staleHoldCandidate],
  });
  const legalHoldReleaseOldAssessmentBlockedResult = blockingEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:old-hold-assessment" },
    candidates: [staleHoldCandidate],
  });
  const legalHoldReleaseSupersedingAssessmentResult = blockingEngine.queueDeleteJob({
    actor: { ...actor, idempotencyKey: "idem:443:superseding-hold-assessment" },
    candidates: [deleteCandidate],
  });

  const dependencyPreservationExplainer = blockingEngine.generateDispositionBlockExplainer({
    candidate: {
      ...replayCriticalDeleteCandidate,
      assessment: {
        ...replayCriticalDeleteCandidate.assessment,
        activeDependencyLinkRefs: [
          "dependency:assurance-pack:pack_440",
          "dependency:investigation:timeline_439",
          "dependency:capa:capa_441",
          "dependency:recovery-artifact:restore_438",
          "dependency:archive-manifest:am_443_prior",
          "dependency:deletion-certificate:dc_443_prior",
        ],
      },
    },
    blockerRefs: [
      "dependency:active:assurance-pack-investigation-capa-recovery-manifest-certificate",
    ],
    generatedAt,
    audienceRef: "audience:records-governance",
  });

  const partialCandidateB = {
    ...archiveCandidate,
    candidateRef: "candidate:443:archive-current-b",
    artifactRef: "artifact:request-snapshot:443:b",
    currentAssessmentRefs: ["dea_443_archive_b"],
    assessment: {
      ...archiveCandidate.assessment,
      artifactRef: "artifact:request-snapshot:443:b",
      dispositionEligibilityAssessment: {
        ...archiveCandidate.assessment.dispositionEligibilityAssessment,
        artifactRef: "artifact:request-snapshot:443:b",
        dispositionEligibilityAssessmentId: "dea_443_archive_b",
      },
    },
  };
  const partialEngine = new Phase9DispositionExecutionEngine();
  const partialQueued = partialEngine.queueArchiveJob({
    actor: { ...actor, idempotencyKey: "idem:443:partial-archive" },
    candidates: [archiveCandidate, partialCandidateB],
  });
  const partialArchiveResult = partialEngine.executeDispositionJobSafely({
    actor: { ...actor, idempotencyKey: "idem:443:partial-archive" },
    queuedResult: partialQueued,
    candidates: [archiveCandidate, partialCandidateB],
    allowPartial: true,
    archiveLocationRef: `archive-location:summary-only:${partialQueued.job.dispositionJobId}`,
    checksumRecords: [
      {
        artifactRef: archiveCandidate.artifactRef,
        sourceChecksum: "sha256:443-partial-a",
        archiveChecksum: "sha256:443-partial-a",
        checksumBundleRef: "checksum-bundle:443:partial-a",
      },
    ],
  });
  const partialRecoveryQueued = partialEngine.queueArchiveJob({
    actor: { ...actor, idempotencyKey: "idem:443:partial-recovery" },
    candidates: [partialCandidateB],
  });
  const partialRecoveryResult = partialEngine.executeDispositionJobSafely({
    actor: { ...actor, idempotencyKey: "idem:443:partial-recovery" },
    queuedResult: partialRecoveryQueued,
    candidates: [partialCandidateB],
    archiveLocationRef: `archive-location:summary-only:${partialRecoveryQueued.job.dispositionJobId}`,
    checksumRecords: [
      {
        artifactRef: partialCandidateB.artifactRef,
        sourceChecksum: "sha256:443-partial-b",
        archiveChecksum: "sha256:443-partial-b",
        checksumBundleRef: "checksum-bundle:443:partial-b",
      },
    ],
  });

  const duplicateEngine = new Phase9DispositionExecutionEngine();
  const duplicateActor = { ...actor, idempotencyKey: "idem:443:duplicate" };
  const duplicateQueueFirstResult = duplicateEngine.queueArchiveJob({
    actor: duplicateActor,
    candidates: [archiveCandidate],
  });
  const duplicateQueueSecondResult = duplicateEngine.queueArchiveJob({
    actor: duplicateActor,
    candidates: [archiveCandidate],
  });

  let tenantDeniedErrorCode = "";
  try {
    blockingEngine.queueDeleteJob({
      actor: {
        ...actor,
        idempotencyKey: "idem:443:tenant-denied",
        scopeTokenRef: "scope-token:tenant:other:records-disposition",
      },
      candidates: [deleteCandidate],
    });
  } catch (error) {
    tenantDeniedErrorCode =
      error instanceof Phase9DispositionExecutionEngineError ? error.code : "UNKNOWN";
  }
  let purposeDeniedErrorCode = "";
  try {
    blockingEngine.queueDeleteJob({
      actor: {
        ...actor,
        idempotencyKey: "idem:443:purpose-denied",
        purposeOfUseRef: "assurance:read",
      },
      candidates: [deleteCandidate],
    });
  } catch (error) {
    purposeDeniedErrorCode =
      error instanceof Phase9DispositionExecutionEngineError ? error.code : "UNKNOWN";
  }

  const blockExplainerResult = rawScanBlockedResult;
  const lifecycleWritebackResult = deleteExecutionResult;

  return {
    schemaVersion: PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
    upstreamSchemaVersion: PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9E",
      "blueprint/phase-9-the-assurance-ledger.md#9F",
      "data/contracts/442_phase9_retention_lifecycle_engine_contract.json",
      "data/contracts/436_phase9_graph_verdict_engine_contract.json",
      "data/contracts/440_phase9_assurance_pack_factory_contract.json",
      "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
    ],
    producedObjects: [
      "DispositionJob",
      "DispositionBlockExplainer",
      "DeletionCertificate",
      "ArchiveManifest",
      "DispositionExecutionAuditRecord",
      "DispositionLifecycleEventRecord",
      "ArtifactChecksumRecord",
      "ArtifactPresentationPolicy",
      "DispositionCandidate",
    ],
    apiSurface: [
      "queueArchiveJob",
      "queueDeleteJob",
      "validateDispositionJobCandidates",
      "queueDispositionJob",
      "executeDispositionJobSafely",
      "abortOrBlockDispositionJob",
      "retrieveArchiveManifest",
      "retrieveDeletionCertificate",
      "listDispositionBlockers",
      "generateDispositionBlockExplainer",
      "emitLifecycleEvidenceForAssuranceGraph",
      "listWithCursor",
    ],
    archiveQueuedResult,
    archiveExecutionResult,
    archiveReplayExecutionResult,
    deleteQueuedResult,
    deleteExecutionResult,
    deleteReplayExecutionResult,
    rawScanBlockedResult,
    wormDeleteBlockedResult,
    replayCriticalDeleteBlockedResult,
    replayCriticalArchiveQueuedResult,
    staleAssessmentBlockedResult,
    staleGraphBlockedResult,
    staleHoldStateBlockedResult,
    dependencyPreservationExplainer,
    legalHoldReleaseOldAssessmentBlockedResult,
    legalHoldReleaseSupersedingAssessmentResult,
    partialArchiveResult,
    partialRecoveryResult,
    duplicateQueueFirstResult,
    duplicateQueueSecondResult,
    tenantDeniedErrorCode,
    purposeDeniedErrorCode,
    blockExplainerResult,
    lifecycleWritebackResult,
    replayHash: orderedSetHash(
      [
        archiveExecutionResult.manifest?.manifestHash ?? "",
        archiveReplayExecutionResult.manifest?.manifestHash ?? "",
        deleteExecutionResult.deletionCertificates[0]?.certificateHash ?? "",
        deleteReplayExecutionResult.deletionCertificates[0]?.certificateHash ?? "",
        lifecycleWritebackResult.lifecycleEvents[0]?.assuranceLedgerEntry.hash ?? "",
      ],
      "phase9.443.fixture.replay",
    ),
  };
}

export function phase9DispositionExecutionEngineSummary(
  fixture: Phase9DispositionExecutionFixture = createPhase9DispositionExecutionFixture(),
): string {
  return [
    "# 443 Phase 9 Disposition Execution Engine",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Upstream schema version: ${fixture.upstreamSchemaVersion}`,
    `Archive manifest hash: ${fixture.archiveExecutionResult.manifest?.manifestHash ?? "missing"}`,
    `Deletion certificate hash: ${fixture.deleteExecutionResult.deletionCertificates[0]?.certificateHash ?? "missing"}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Execution Contract",
    "",
    "- Archive and delete jobs are admitted only from current 442 disposition eligibility assessments.",
    "- Raw storage scans, bucket prefixes, object-store manifests, operator CSVs, stale assessments, stale graph or hold state, tenant crossing, and visibility ineligible candidates fail closed.",
    "- WORM, hash-chained, audit-ledger, assurance-ledger, archive manifest, deletion certificate, freeze, and legal-hold artifacts are immutable deletion exclusions.",
    "- Archive manifests and deletion certificates are hash-addressed and written before destructive work is acknowledged.",
    "- Lifecycle writeback emits assurance ledger entries for manifest and certificate outcomes.",
    "",
  ].join("\n");
}

export function phase9DispositionBlockingMatrixCsv(
  fixture: Phase9DispositionExecutionFixture = createPhase9DispositionExecutionFixture(),
): string {
  const rows = [
    ["case", "jobState", "blockers"],
    [
      "raw_storage_scan",
      fixture.rawScanBlockedResult.job.resultState,
      fixture.rawScanBlockedResult.job.blockerRefs.join("|"),
    ],
    [
      "worm_hash_chain",
      fixture.wormDeleteBlockedResult.job.resultState,
      fixture.wormDeleteBlockedResult.job.blockerRefs.join("|"),
    ],
    [
      "replay_critical_delete",
      fixture.replayCriticalDeleteBlockedResult.job.resultState,
      fixture.replayCriticalDeleteBlockedResult.job.blockerRefs.join("|"),
    ],
    [
      "stale_assessment",
      fixture.staleAssessmentBlockedResult.job.resultState,
      fixture.staleAssessmentBlockedResult.job.blockerRefs.join("|"),
    ],
    [
      "stale_graph",
      fixture.staleGraphBlockedResult.job.resultState,
      fixture.staleGraphBlockedResult.job.blockerRefs.join("|"),
    ],
    [
      "stale_hold_state",
      fixture.staleHoldStateBlockedResult.job.resultState,
      fixture.staleHoldStateBlockedResult.job.blockerRefs.join("|"),
    ],
    [
      "partial_recovery",
      fixture.partialRecoveryResult.job.resultState,
      fixture.partialRecoveryResult.job.blockerRefs.join("|"),
    ],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
