import {
  PHASE9_ASSURANCE_NORMALIZATION_VERSION,
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceEvidenceGraphEdge,
  type AssuranceEvidenceGraphSnapshot,
  type AssuranceLedgerEntry,
} from "./phase9-assurance-ledger-contracts";
import {
  Phase9AssuranceIngestService,
  createDefaultPhase9AssuranceProducerRegistration,
  createPhase9AssuranceProducerEnvelope,
} from "./phase9-assurance-ingest-service";
import {
  evaluatePhase9GraphVerdict,
  type Phase9GraphVerdictRecord,
} from "./phase9-assurance-graph-verdict-engine";

export const PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION =
  "439.phase9.investigation-timeline-service.v1";
export const PHASE9_INVESTIGATION_TIMELINE_REPLAY_VERSION =
  "439.phase9.investigation-timeline-replay.v1";

export type InvestigationPurposeOfUse =
  | "assurance.audit"
  | "support.replay"
  | "governance.break_glass_review"
  | "assurance.export";

export type InvestigationCoverageState = "exact" | "stale" | "blocked";
export type InvestigationTimelineState = "exact" | "stale" | "blocked";
export type InvestigationCausalityState =
  | "complete"
  | "accepted_only"
  | "visibility_missing"
  | "audit_missing"
  | "blocked";
export type BreakGlassQueueState =
  | "pending_review"
  | "in_review"
  | "awaiting_follow_up"
  | "expired"
  | "closed";
export type BreakGlassReasonAdequacy = "sufficient" | "insufficient" | "contradicted";
export type BreakGlassFollowUpBurdenState =
  | "none"
  | "attestation_required"
  | "peer_review_required"
  | "governance_review_required";
export type BreakGlassState = "none" | "required" | "active" | "expired";
export type ReplayRestoreEligibilityState =
  | "eligible"
  | "diagnostic_only"
  | "read_only_recovery"
  | "blocked";
export type ReplayDeterminismState = "same_timeline" | "drifted" | "blocked";
export type AuditPayloadClass =
  | "metadata_only"
  | "awareness_only"
  | "masked_summary"
  | "bounded_detail";

export interface InvestigationScopeEnvelope {
  readonly investigationScopeEnvelopeId: string;
  readonly tenantId: string;
  readonly originAudienceSurface: string;
  readonly originRouteIntentRef: string;
  readonly originOpsReturnTokenRef: string;
  readonly purposeOfUse: InvestigationPurposeOfUse;
  readonly actingContextRef: string;
  readonly maskingPolicyRef: string;
  readonly disclosureCeilingRef: string;
  readonly visibilityCoverageRefs: readonly string[];
  readonly scopeEntityRefs: readonly string[];
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly investigationQuestionHash: string;
  readonly requiredBreakGlassReviewRef: string;
  readonly requiredSupportLineageBindingRef: string;
  readonly scopeHash: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

export interface AuditQuerySession {
  readonly auditQuerySessionId: string;
  readonly openedBy: string;
  readonly filtersRef: string;
  readonly investigationScopeEnvelopeRef: string;
  readonly purposeOfUse: InvestigationPurposeOfUse;
  readonly visibilityCoverageRefs: readonly string[];
  readonly actingContextRef: string;
  readonly breakGlassReviewRef: string;
  readonly coverageState: InvestigationCoverageState;
  readonly requiredEdgeCorrelationId: string;
  readonly requiredContinuityFrameRefs: readonly string[];
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly investigationQuestionHash: string;
  readonly missingJoinRefs: readonly string[];
  readonly causalityState: InvestigationCausalityState;
  readonly assuranceSurfaceRuntimeBindingRef: string;
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly timelineReconstructionRef: string;
  readonly supportReplaySessionRef?: string;
  readonly artifactPresentationContractRef?: string;
  readonly artifactTransferSettlementRef?: string;
  readonly artifactFallbackDispositionRef?: string;
  readonly outboundNavigationGrantPolicyRef?: string;
  readonly baseLedgerWatermarkRef: string;
  readonly reconstructionInputHash: string;
  readonly timelineHash: string;
  readonly graphHash: string;
  readonly stableCursor: string;
  readonly resultAuditRecordRefs: readonly string[];
  readonly privilegedReadAuditRecordRefs: readonly string[];
  readonly blockingRefs: readonly string[];
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface AccessEventIndex {
  readonly accessEventIndexId: string;
  readonly tenantId: string;
  readonly actorRef: string;
  readonly subjectRef: string;
  readonly entityType: string;
  readonly entityRef: string;
  readonly actionType: string;
  readonly eventTime: string;
  readonly purposeOfUse: InvestigationPurposeOfUse;
  readonly actingContextRef: string;
  readonly breakGlassState: BreakGlassState;
  readonly visibilityCoverageRef: string;
  readonly disclosureCeilingRef: string;
  readonly edgeCorrelationId: string;
  readonly continuityFrameRef: string;
  readonly auditRecordRef: string;
  readonly policyDecisionWitnessRef: string;
  readonly eventHash: string;
}

export interface BreakGlassReviewRecord {
  readonly breakGlassReviewRecordId: string;
  readonly eventRef: string;
  readonly investigationScopeEnvelopeRef: string;
  readonly timelineReconstructionRef: string;
  readonly reviewerRef: string;
  readonly reviewState: BreakGlassQueueState;
  readonly reasonAdequacy: BreakGlassReasonAdequacy;
  readonly visibilityWideningSummaryRef: string;
  readonly objectClassCoverageRefs: readonly string[];
  readonly expiryBoundaryRef: string;
  readonly expiresAt: string;
  readonly followUpBurdenState: BreakGlassFollowUpBurdenState;
  readonly queueState: BreakGlassQueueState;
  readonly followUpRequired: boolean;
  readonly decisionHash: string;
}

export interface SupportReplaySession {
  readonly supportReplaySessionId: string;
  readonly operatorRef: string;
  readonly targetJourneyRef: string;
  readonly auditQuerySessionRef: string;
  readonly investigationScopeEnvelopeRef: string;
  readonly timelineReconstructionRef: string;
  readonly timelineRefs: readonly string[];
  readonly timelineHash: string;
  readonly maskingPolicyRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly originOpsReturnTokenRef: string;
  readonly evidenceSetHash: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly edgeCorrelationId: string;
  readonly restoreSettlementRef: string;
  readonly latestSettlementRef: string;
  readonly restoreEligibilityState: ReplayRestoreEligibilityState;
  readonly replayDeterminismState: ReplayDeterminismState;
  readonly routeIntentBindingRef: string;
  readonly actionRecordRef: string;
  readonly actionSettlementRef: string;
  readonly uiEventCausalityFrameRef: string;
  readonly projectionVisibilityRef: string;
  readonly auditRecordRef: string;
  readonly transitionEnvelopeRef: string;
  readonly uiTelemetryDisclosureFenceRef: string;
  readonly causalityState: InvestigationCausalityState;
}

export interface DataSubjectTrace {
  readonly dataSubjectTraceId: string;
  readonly subjectRef: string;
  readonly investigationScopeEnvelopeRef: string;
  readonly timelineReconstructionRef: string;
  readonly relatedEventRefs: readonly string[];
  readonly edgeCorrelationRefs: readonly string[];
  readonly projectionVisibilityRefs: readonly string[];
  readonly crossSystemRefs: readonly string[];
  readonly maskingPolicyRef: string;
  readonly disclosureCeilingRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly traceWindow: {
    readonly windowStart: string;
    readonly windowEnd: string;
  };
  readonly traceMerkleRoot: string;
  readonly traceHash: string;
  readonly gapState: "none" | "gapped" | "blocked";
  readonly causalityGapRefs: readonly string[];
  readonly reconstructionState: InvestigationTimelineState;
}

export interface WormAuditRecord {
  readonly wormAuditRecordId: string;
  readonly tenantId: string;
  readonly actorRef: string;
  readonly subjectRef: string;
  readonly entityType: string;
  readonly entityRef: string;
  readonly actionType: string;
  readonly eventTime: string;
  readonly purposeOfUse: InvestigationPurposeOfUse;
  readonly actingContextRef: string;
  readonly breakGlassState: BreakGlassState;
  readonly visibilityCoverageRef: string;
  readonly disclosureCeilingRef: string;
  readonly edgeCorrelationId: string;
  readonly continuityFrameRef: string;
  readonly causalTokenRef: string;
  readonly auditRecordRef: string;
  readonly policyDecisionWitnessRef: string;
  readonly sourceSequenceRef: string;
  readonly assuranceLedgerEntryRef: string;
  readonly commandActionRef?: string;
  readonly commandSettlementRef?: string;
  readonly uiTransitionSettlementRef?: string;
  readonly projectionVisibilityRef?: string;
  readonly artifactRef?: string;
  readonly payloadClass: AuditPayloadClass;
  readonly eventHash: string;
}

export interface InvestigationTimelineRow {
  readonly timelineRowId: string;
  readonly eventTime: string;
  readonly sourceSequenceRef: string;
  readonly assuranceLedgerEntryId: string;
  readonly deterministicFallbackId: string;
  readonly sourceEventRef: string;
  readonly auditRecordRef: string;
  readonly entityRef: string;
  readonly actionType: string;
  readonly actorRef: string;
  readonly subjectRef: string;
  readonly edgeCorrelationId: string;
  readonly continuityFrameRef: string;
  readonly causalTokenRef: string;
  readonly commandActionRef?: string;
  readonly commandSettlementRef?: string;
  readonly uiTransitionSettlementRef?: string;
  readonly projectionVisibilityRef?: string;
  readonly artifactRef?: string;
  readonly ledgerHash: string;
  readonly auditHash: string;
  readonly rowHash: string;
}

export interface InvestigationTimelineReconstruction {
  readonly investigationTimelineReconstructionId: string;
  readonly investigationScopeEnvelopeRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly dataSubjectTraceRef: string;
  readonly baseLedgerWatermarkRef: string;
  readonly sourceEventRefs: readonly string[];
  readonly normalizationVersionRef: typeof PHASE9_ASSURANCE_NORMALIZATION_VERSION;
  readonly reconstructionInputHash: string;
  readonly timelineHash: string;
  readonly graphHash: string;
  readonly timelineState: InvestigationTimelineState;
  readonly rows: readonly InvestigationTimelineRow[];
  readonly missingJoinRefs: readonly string[];
  readonly blockingRefs: readonly string[];
  readonly generatedAt: string;
}

export interface InvestigationReadAuditRecord {
  readonly investigationReadAuditRecordId: string;
  readonly tenantId: string;
  readonly investigationScopeEnvelopeRef: string;
  readonly auditQuerySessionRef: string;
  readonly readBy: string;
  readonly readPurposeOfUse: InvestigationPurposeOfUse;
  readonly readTargetRef: string;
  readonly readTargetHash: string;
  readonly reasonRef: string;
  readonly recordedAt: string;
}

export interface InvestigationAuditQueryFilters {
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly entityRefs?: readonly string[];
  readonly subjectRefs?: readonly string[];
  readonly actorRefs?: readonly string[];
  readonly actionTypes?: readonly string[];
  readonly requiredEdgeCorrelationId?: string;
  readonly requiredContinuityFrameRefs?: readonly string[];
  readonly selectedAnchorRef?: string;
  readonly requiresBreakGlass?: boolean;
  readonly limit?: number;
}

export interface InvestigationSurfaceBindingRefs {
  readonly assuranceSurfaceRuntimeBindingRef: string;
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseRecoveryDispositionRef: string;
}

export interface InvestigationArtifactPolicy {
  readonly artifactPresentationContractRef?: string;
  readonly artifactTransferSettlementRef?: string;
  readonly artifactFallbackDispositionRef?: string;
  readonly outboundNavigationGrantPolicyRef?: string;
  readonly previewAllowed: boolean;
  readonly exportAllowed: boolean;
  readonly policyHash: string;
}

export interface IssueInvestigationScopeEnvelopeInput {
  readonly tenantId: string;
  readonly originAudienceSurface: string;
  readonly originRouteIntentRef: string;
  readonly originOpsReturnTokenRef: string;
  readonly purposeOfUse: InvestigationPurposeOfUse;
  readonly actingContextRef: string;
  readonly maskingPolicyRef: string;
  readonly disclosureCeilingRef: string;
  readonly visibilityCoverageRefs: readonly string[];
  readonly scopeEntityRefs: readonly string[];
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly investigationQuestion: string;
  readonly requiredBreakGlassReviewRef: string;
  readonly requiredSupportLineageBindingRef: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

export interface ExecuteInvestigationAuditQueryInput {
  readonly envelope?: InvestigationScopeEnvelope;
  readonly openedBy: string;
  readonly filtersRef: string;
  readonly filters: InvestigationAuditQueryFilters;
  readonly auditRecords: readonly WormAuditRecord[];
  readonly ledgerEntries: readonly AssuranceLedgerEntry[];
  readonly graphSnapshot?: AssuranceEvidenceGraphSnapshot;
  readonly graphEdges: readonly AssuranceEvidenceGraphEdge[];
  readonly graphVerdict?: Phase9GraphVerdictRecord;
  readonly breakGlassReview?: BreakGlassReviewRecord;
  readonly surfaceBindingRefs: InvestigationSurfaceBindingRefs;
  readonly artifactPolicy?: InvestigationArtifactPolicy;
  readonly generatedAt: string;
  readonly reasonRef: string;
}

export interface InvestigationAuditQueryResult {
  readonly schemaVersion: typeof PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION;
  readonly envelope: InvestigationScopeEnvelope;
  readonly auditQuerySession: AuditQuerySession;
  readonly timelineReconstruction: InvestigationTimelineReconstruction;
  readonly dataSubjectTrace: DataSubjectTrace;
  readonly returnedAuditRecords: readonly WormAuditRecord[];
  readonly accessEventIndex: readonly AccessEventIndex[];
  readonly privilegedReadAuditRecords: readonly InvestigationReadAuditRecord[];
  readonly resultHash: string;
}

export interface OpenSupportReplaySessionInput {
  readonly auditQueryResult: InvestigationAuditQueryResult;
  readonly operatorRef: string;
  readonly targetJourneyRef: string;
  readonly restoreSettlementRef: string;
  readonly latestSettlementRef: string;
  readonly routeIntentBindingRef: string;
  readonly actionRecordRef: string;
  readonly actionSettlementRef: string;
  readonly uiEventCausalityFrameRef: string;
  readonly transitionEnvelopeRef: string;
  readonly uiTelemetryDisclosureFenceRef: string;
}

export interface SupportReplaySafeEvent {
  readonly timelineRowId: string;
  readonly eventTime: string;
  readonly actionType: string;
  readonly entityRef: string;
  readonly edgeCorrelationId: string;
  readonly continuityFrameRef: string;
  readonly auditRecordRef: string;
  readonly rowHash: string;
}

export interface InvestigationExportPreview {
  readonly exportPreviewId: string;
  readonly auditQuerySessionRef: string;
  readonly timelineReconstructionRef: string;
  readonly previewState: "allowed" | "denied";
  readonly artifactPresentationContractRef?: string;
  readonly outboundNavigationGrantPolicyRef?: string;
  readonly denialRefs: readonly string[];
  readonly previewHash: string;
}

export interface Phase9InvestigationTimelineFixture {
  readonly schemaVersion: typeof PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly envelope: InvestigationScopeEnvelope;
  readonly expiredEnvelope: InvestigationScopeEnvelope;
  readonly ledgerEntries: readonly AssuranceLedgerEntry[];
  readonly auditRecords: readonly WormAuditRecord[];
  readonly graphSnapshot: AssuranceEvidenceGraphSnapshot;
  readonly graphEdges: readonly AssuranceEvidenceGraphEdge[];
  readonly graphVerdict: Phase9GraphVerdictRecord;
  readonly breakGlassReview: BreakGlassReviewRecord;
  readonly expiredBreakGlassReview: BreakGlassReviewRecord;
  readonly baselineResult: InvestigationAuditQueryResult;
  readonly missingGraphVerdictResult: InvestigationAuditQueryResult;
  readonly orphanGraphEdgeResult: InvestigationAuditQueryResult;
  readonly visibilityGapResult: InvestigationAuditQueryResult;
  readonly breakGlassAbsentResult: InvestigationAuditQueryResult;
  readonly breakGlassExpiredResult: InvestigationAuditQueryResult;
  readonly supportReplaySession: SupportReplaySession;
  readonly exportDeniedPreview: InvestigationExportPreview;
  readonly replayHash: string;
}

export class Phase9InvestigationTimelineServiceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9InvestigationTimelineServiceError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9InvestigationTimelineServiceError(code, message);
  }
}

function toMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  invariant(!Number.isNaN(parsed), "INVALID_TIMESTAMP", `Invalid timestamp ${timestamp}.`);
  return parsed;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
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

function investigationHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(omitUndefined(value), namespace);
}

function disclosureRank(ref: string): number {
  if (ref.includes("bounded")) {
    return 3;
  }
  if (ref.includes("summary")) {
    return 2;
  }
  if (ref.includes("awareness")) {
    return 1;
  }
  return 0;
}

function payloadRank(payloadClass: AuditPayloadClass): number {
  switch (payloadClass) {
    case "bounded_detail":
      return 3;
    case "masked_summary":
      return 2;
    case "awareness_only":
      return 1;
    case "metadata_only":
      return 0;
  }
}

function scopeContains(scope: ReadonlySet<string>, record: WormAuditRecord): boolean {
  return scope.has(record.entityRef) || scope.has(record.subjectRef) || scope.has(record.auditRecordRef);
}

function graphNodeRefs(snapshot?: AssuranceEvidenceGraphSnapshot): ReadonlySet<string> {
  if (!snapshot) {
    return new Set();
  }
  return new Set([
    ...snapshot.ledgerEntryRefs,
    ...snapshot.evidenceArtifactRefs,
    ...snapshot.controlObjectiveRefs,
    ...snapshot.controlEvidenceLinkRefs,
    ...snapshot.controlStatusSnapshotRefs,
    ...snapshot.controlRecordRefs,
    ...snapshot.evidenceGapRecordRefs,
    ...snapshot.continuityEvidenceRefs,
    ...snapshot.continuityEvidencePackSectionRefs,
    ...snapshot.incidentRefs,
    ...snapshot.exceptionRefs,
    ...snapshot.capaActionRefs,
    ...snapshot.retentionDecisionRefs,
    ...snapshot.archiveManifestRefs,
    ...snapshot.deletionCertificateRefs,
    ...snapshot.packRefs,
    ...snapshot.assurancePackActionRecordRefs,
    ...snapshot.assurancePackSettlementRefs,
    ...snapshot.recoveryEvidenceArtifactRefs,
  ]);
}

function baseLedgerWatermark(ledgerEntries: readonly AssuranceLedgerEntry[]): string {
  return ledgerEntries.at(-1)?.hash ?? "ledger-watermark:empty";
}

function isBreakGlassReviewValid(
  review: BreakGlassReviewRecord | undefined,
  envelope: InvestigationScopeEnvelope,
  timelineRef: string,
  generatedAt: string,
): boolean {
  return Boolean(
    review &&
      review.investigationScopeEnvelopeRef === envelope.investigationScopeEnvelopeId &&
      review.timelineReconstructionRef === timelineRef &&
      review.reasonAdequacy === "sufficient" &&
      review.queueState === "closed" &&
      toMs(review.expiresAt) > toMs(generatedAt),
  );
}

function orderTimelineRows(rows: readonly InvestigationTimelineRow[]): InvestigationTimelineRow[] {
  return [...rows].sort((left, right) => {
    const byTime = toMs(left.eventTime) - toMs(right.eventTime);
    if (byTime !== 0) {
      return byTime;
    }
    const bySequence = left.sourceSequenceRef.localeCompare(right.sourceSequenceRef);
    if (bySequence !== 0) {
      return bySequence;
    }
    const byLedger = left.assuranceLedgerEntryId.localeCompare(right.assuranceLedgerEntryId);
    if (byLedger !== 0) {
      return byLedger;
    }
    return left.deterministicFallbackId.localeCompare(right.deterministicFallbackId);
  });
}

function buildAccessIndex(records: readonly WormAuditRecord[]): readonly AccessEventIndex[] {
  return records
    .map((record) => ({
      accessEventIndexId: `aei_439_${investigationHash(record, "phase9.439.access-index.id").slice(0, 16)}`,
      tenantId: record.tenantId,
      actorRef: record.actorRef,
      subjectRef: record.subjectRef,
      entityType: record.entityType,
      entityRef: record.entityRef,
      actionType: record.actionType,
      eventTime: record.eventTime,
      purposeOfUse: record.purposeOfUse,
      actingContextRef: record.actingContextRef,
      breakGlassState: record.breakGlassState,
      visibilityCoverageRef: record.visibilityCoverageRef,
      disclosureCeilingRef: record.disclosureCeilingRef,
      edgeCorrelationId: record.edgeCorrelationId,
      continuityFrameRef: record.continuityFrameRef,
      auditRecordRef: record.auditRecordRef,
      policyDecisionWitnessRef: record.policyDecisionWitnessRef,
      eventHash: record.eventHash,
    }))
    .sort((left, right) => left.eventTime.localeCompare(right.eventTime) || left.accessEventIndexId.localeCompare(right.accessEventIndexId));
}

function filterAuditRecords(
  input: ExecuteInvestigationAuditQueryInput & { envelope: InvestigationScopeEnvelope },
): readonly WormAuditRecord[] {
  const envelopeScope = new Set(input.envelope.scopeEntityRefs);
  const filterRefs = [
    ...(input.filters.entityRefs ?? []),
    ...(input.filters.subjectRefs ?? []),
    input.filters.selectedAnchorRef ?? "",
  ].filter((value) => value.length > 0);
  const outsideScope = filterRefs.filter((ref) => !envelopeScope.has(ref) && ref !== input.envelope.selectedAnchorRef);
  invariant(
    outsideScope.length === 0,
    "AUDIT_QUERY_SCOPE_VIOLATION",
    `Audit query attempted to leave envelope scope: ${outsideScope.join(",")}`,
  );

  const windowStart = toMs(input.filters.windowStart);
  const windowEnd = toMs(input.filters.windowEnd);
  invariant(windowStart <= windowEnd, "INVALID_QUERY_WINDOW", "Audit query window start must be before end.");

  const entityFilters = new Set(input.filters.entityRefs ?? []);
  const subjectFilters = new Set(input.filters.subjectRefs ?? []);
  const actorFilters = new Set(input.filters.actorRefs ?? []);
  const actionFilters = new Set(input.filters.actionTypes ?? []);
  const continuityFilters = new Set(input.filters.requiredContinuityFrameRefs ?? []);
  const limit = Math.min(Math.max(input.filters.limit ?? 100, 1), 500);

  return input.auditRecords
    .filter((record) => {
      const eventTime = toMs(record.eventTime);
      return (
        record.tenantId === input.envelope.tenantId &&
        eventTime >= windowStart &&
        eventTime <= windowEnd &&
        scopeContains(envelopeScope, record) &&
        (entityFilters.size === 0 || entityFilters.has(record.entityRef)) &&
        (subjectFilters.size === 0 || subjectFilters.has(record.subjectRef)) &&
        (actorFilters.size === 0 || actorFilters.has(record.actorRef)) &&
        (actionFilters.size === 0 || actionFilters.has(record.actionType)) &&
        (!input.filters.requiredEdgeCorrelationId ||
          record.edgeCorrelationId === input.filters.requiredEdgeCorrelationId) &&
        (continuityFilters.size === 0 || continuityFilters.has(record.continuityFrameRef))
      );
    })
    .sort((left, right) => left.eventTime.localeCompare(right.eventTime) || left.eventHash.localeCompare(right.eventHash))
    .slice(0, limit);
}

function assertTenantIsolation(
  envelope: InvestigationScopeEnvelope,
  records: readonly WormAuditRecord[],
  ledgerEntries: readonly AssuranceLedgerEntry[],
  graphSnapshot?: AssuranceEvidenceGraphSnapshot,
): void {
  const wrongRecord = records.find((record) => record.tenantId !== envelope.tenantId);
  invariant(
    !wrongRecord,
    "CROSS_TENANT_INVESTIGATION_REFERENCE_DENIED",
    `Audit record ${wrongRecord?.wormAuditRecordId} does not match tenant scope.`,
  );
  const wrongEntry = ledgerEntries.find((entry) => entry.tenantId !== envelope.tenantId);
  invariant(
    !wrongEntry,
    "CROSS_TENANT_INVESTIGATION_REFERENCE_DENIED",
    `Ledger entry ${wrongEntry?.assuranceLedgerEntryId} does not match tenant scope.`,
  );
  invariant(
    !graphSnapshot || graphSnapshot.tenantScopeRef === envelope.tenantId,
    "CROSS_TENANT_INVESTIGATION_REFERENCE_DENIED",
    "Graph snapshot tenant scope does not match investigation envelope.",
  );
}

function deriveGraphBlockers(
  graphSnapshot: AssuranceEvidenceGraphSnapshot | undefined,
  graphEdges: readonly AssuranceEvidenceGraphEdge[],
  graphVerdict: Phase9GraphVerdictRecord | undefined,
): readonly string[] {
  const blockers: string[] = [];
  if (!graphSnapshot) {
    blockers.push("graph-snapshot:missing");
  }
  if (!graphVerdict) {
    blockers.push("graph-verdict:missing");
  } else if (graphVerdict.state === "blocked") {
    blockers.push(`graph-verdict:blocked:${graphVerdict.verdictId}`, ...graphVerdict.reasonCodes.map((reason) => `graph:${reason}`));
  } else if (graphVerdict.state === "partial" || graphVerdict.state === "stale") {
    blockers.push(`graph-verdict:${graphVerdict.state}:${graphVerdict.verdictId}`);
  }
  const nodeRefs = graphNodeRefs(graphSnapshot);
  for (const edge of graphEdges) {
    if (!nodeRefs.has(edge.fromRef) || !nodeRefs.has(edge.toRef)) {
      blockers.push(`graph:orphan-edge:${edge.assuranceEvidenceGraphEdgeId}`);
    }
    if (edge.scopeState !== "in_scope") {
      blockers.push(`graph:scope-conflict:${edge.assuranceEvidenceGraphEdgeId}`);
    }
    if (edge.supersessionState !== "live") {
      blockers.push(`graph:superseded-edge:${edge.assuranceEvidenceGraphEdgeId}`);
    }
  }
  return sortedUnique(blockers);
}

function deriveVisibilityBlockers(
  envelope: InvestigationScopeEnvelope,
  records: readonly WormAuditRecord[],
): readonly string[] {
  const blockers: string[] = [];
  if (envelope.visibilityCoverageRefs.length === 0) {
    blockers.push("visibility:coverage-missing");
  }
  for (const record of records) {
    if (!envelope.visibilityCoverageRefs.includes(record.visibilityCoverageRef)) {
      blockers.push(`visibility:coverage-gap:${record.auditRecordRef}`);
    }
    if (payloadRank(record.payloadClass) > disclosureRank(envelope.disclosureCeilingRef)) {
      blockers.push(`disclosure:ceiling-exceeded:${record.auditRecordRef}`);
    }
  }
  return sortedUnique(blockers);
}

function deriveCausalityState(
  records: readonly WormAuditRecord[],
  missingJoinRefs: readonly string[],
  blockers: readonly string[],
): InvestigationCausalityState {
  if (blockers.some((blocker) => blocker.includes("graph") || blocker.includes("visibility") || blocker.includes("timeline"))) {
    return "blocked";
  }
  if (missingJoinRefs.some((ref) => ref.includes("audit"))) {
    return "audit_missing";
  }
  if (records.some((record) => !record.projectionVisibilityRef)) {
    return "visibility_missing";
  }
  if (records.some((record) => record.actionType.includes("accepted") && !record.commandSettlementRef)) {
    return "accepted_only";
  }
  return "complete";
}

function coverageStateFromBlockers(
  graphVerdict: Phase9GraphVerdictRecord | undefined,
  blockers: readonly string[],
): InvestigationCoverageState {
  if (blockers.length > 0) {
    return "blocked";
  }
  if (graphVerdict?.state === "stale" || graphVerdict?.state === "partial") {
    return "stale";
  }
  return "exact";
}

function buildReadAuditRecords(
  envelope: InvestigationScopeEnvelope,
  sessionRef: string,
  openedBy: string,
  purposeOfUse: InvestigationPurposeOfUse,
  reasonRef: string,
  records: readonly WormAuditRecord[],
  generatedAt: string,
): readonly InvestigationReadAuditRecord[] {
  const targets = [
    {
      ref: envelope.investigationScopeEnvelopeId,
      hash: envelope.scopeHash,
    },
    ...records.map((record) => ({
      ref: record.auditRecordRef,
      hash: record.eventHash,
    })),
  ];
  return targets.map((target) => ({
    investigationReadAuditRecordId: `irar_439_${investigationHash(
      { sessionRef, target, openedBy, purposeOfUse, generatedAt },
      "phase9.439.read-audit.id",
    ).slice(0, 16)}`,
    tenantId: envelope.tenantId,
    investigationScopeEnvelopeRef: envelope.investigationScopeEnvelopeId,
    auditQuerySessionRef: sessionRef,
    readBy: openedBy,
    readPurposeOfUse: purposeOfUse,
    readTargetRef: target.ref,
    readTargetHash: target.hash,
    reasonRef,
    recordedAt: generatedAt,
  }));
}

function reconstructTimeline(
  envelope: InvestigationScopeEnvelope,
  records: readonly WormAuditRecord[],
  ledgerEntries: readonly AssuranceLedgerEntry[],
  graphSnapshot: AssuranceEvidenceGraphSnapshot | undefined,
  graphVerdict: Phase9GraphVerdictRecord | undefined,
  generatedAt: string,
  inheritedBlockers: readonly string[],
): InvestigationTimelineReconstruction {
  const ledgerById = new Map(ledgerEntries.map((entry) => [entry.assuranceLedgerEntryId, entry]));
  const ledgerByAudit = new Map(ledgerEntries.map((entry) => [entry.auditRecordRef, entry]));
  const missingJoinRefs: string[] = [];
  const rows = records.map((record) => {
    const ledger = ledgerById.get(record.assuranceLedgerEntryRef) ?? ledgerByAudit.get(record.auditRecordRef);
    if (!ledger) {
      missingJoinRefs.push(`timeline:missing-ledger:${record.auditRecordRef}`);
    }
    const ledgerHash = ledger?.hash ?? investigationHash(record, "phase9.439.timeline.synthetic-ledger");
    const sourceSequenceRef = ledger?.sourceSequenceRef ?? record.sourceSequenceRef;
    const sourceEventRef = ledger?.sourceEventRef ?? record.auditRecordRef;
    const rowSeed = {
      record,
      ledgerRef: ledger?.assuranceLedgerEntryId ?? record.assuranceLedgerEntryRef,
      graphHash: graphSnapshot?.graphHash ?? "graph:missing",
    };
    const rowHash = investigationHash(rowSeed, "phase9.439.timeline.row");
    return {
      timelineRowId: `itr_439_${rowHash.slice(0, 16)}`,
      eventTime: record.eventTime,
      sourceSequenceRef,
      assuranceLedgerEntryId: ledger?.assuranceLedgerEntryId ?? record.assuranceLedgerEntryRef,
      deterministicFallbackId: record.eventHash,
      sourceEventRef,
      auditRecordRef: record.auditRecordRef,
      entityRef: record.entityRef,
      actionType: record.actionType,
      actorRef: record.actorRef,
      subjectRef: record.subjectRef,
      edgeCorrelationId: record.edgeCorrelationId,
      continuityFrameRef: record.continuityFrameRef,
      causalTokenRef: record.causalTokenRef,
      commandActionRef: record.commandActionRef ?? ledger?.commandActionRef,
      commandSettlementRef: record.commandSettlementRef ?? ledger?.commandSettlementRef,
      uiTransitionSettlementRef: record.uiTransitionSettlementRef ?? ledger?.uiTransitionSettlementRef,
      projectionVisibilityRef: record.projectionVisibilityRef ?? ledger?.projectionVisibilityRef,
      artifactRef: record.artifactRef,
      ledgerHash,
      auditHash: record.eventHash,
      rowHash,
    } satisfies InvestigationTimelineRow;
  });
  const orderedRows = orderTimelineRows(rows);
  const reconstructionInputHash = investigationHash(
    {
      envelopeScopeHash: envelope.scopeHash,
      records: orderedRows.map((row) => row.auditHash),
      ledger: orderedRows.map((row) => row.ledgerHash),
      graphHash: graphSnapshot?.graphHash ?? "graph:missing",
      verdictHash: graphVerdict?.verdictHash ?? "graph-verdict:missing",
    },
    "phase9.439.timeline.input",
  );
  const timelineHash = orderedSetHash(
    [
      ...orderedRows.map((row) => row.ledgerHash),
      ...orderedRows.map((row) => row.auditHash),
      graphSnapshot?.graphHash ?? "graph:missing",
    ],
    "phase9.439.timeline.hash",
  );
  const blockers = sortedUnique([
    ...inheritedBlockers,
    ...missingJoinRefs,
    ...(missingJoinRefs.length > 0 ? ["timeline:join-missing"] : []),
  ]);
  const state: InvestigationTimelineState =
    blockers.length > 0 ? "blocked" : graphVerdict?.state === "stale" || graphVerdict?.state === "partial" ? "stale" : "exact";
  const reconstructionId = `itrec_439_${investigationHash(
    { reconstructionInputHash, timelineHash },
    "phase9.439.timeline.reconstruction.id",
  ).slice(0, 16)}`;
  return {
    investigationTimelineReconstructionId: reconstructionId,
    investigationScopeEnvelopeRef: envelope.investigationScopeEnvelopeId,
    assuranceEvidenceGraphSnapshotRef: graphSnapshot?.assuranceEvidenceGraphSnapshotId ?? "graph-snapshot:missing",
    assuranceGraphCompletenessVerdictRef: graphVerdict?.verdictId ?? "graph-verdict:missing",
    dataSubjectTraceRef: `dst_439_${timelineHash.slice(0, 16)}`,
    baseLedgerWatermarkRef: baseLedgerWatermark(ledgerEntries),
    sourceEventRefs: sortedUnique(orderedRows.map((row) => row.sourceEventRef)),
    normalizationVersionRef: PHASE9_ASSURANCE_NORMALIZATION_VERSION,
    reconstructionInputHash,
    timelineHash,
    graphHash: graphSnapshot?.graphHash ?? graphVerdict?.graphHash ?? "graph:missing",
    timelineState: state,
    rows: orderedRows,
    missingJoinRefs: sortedUnique(missingJoinRefs),
    blockingRefs: blockers,
    generatedAt,
  };
}

function buildDataSubjectTrace(
  envelope: InvestigationScopeEnvelope,
  timeline: InvestigationTimelineReconstruction,
  records: readonly WormAuditRecord[],
  filters: InvestigationAuditQueryFilters,
): DataSubjectTrace {
  const subjectRef = filters.subjectRefs?.[0] ?? records[0]?.subjectRef ?? "subject:unknown";
  const traceMerkleRoot = orderedSetHash(
    timeline.rows.map((row) => row.rowHash),
    "phase9.439.data-subject-trace.merkle",
  );
  const causalityGapRefs = sortedUnique([
    ...timeline.missingJoinRefs,
    ...records.filter((record) => !record.projectionVisibilityRef).map((record) => `visibility:${record.auditRecordRef}`),
  ]);
  const traceHash = investigationHash(
    {
      subjectRef,
      envelope: envelope.scopeHash,
      timelineHash: timeline.timelineHash,
      traceMerkleRoot,
      causalityGapRefs,
    },
    "phase9.439.data-subject-trace.hash",
  );
  return {
    dataSubjectTraceId: `dst_439_${traceHash.slice(0, 16)}`,
    subjectRef,
    investigationScopeEnvelopeRef: envelope.investigationScopeEnvelopeId,
    timelineReconstructionRef: timeline.investigationTimelineReconstructionId,
    relatedEventRefs: sortedUnique(records.map((record) => record.auditRecordRef)),
    edgeCorrelationRefs: sortedUnique(records.map((record) => record.edgeCorrelationId)),
    projectionVisibilityRefs: sortedUnique(records.map((record) => record.projectionVisibilityRef ?? "")),
    crossSystemRefs: sortedUnique(records.flatMap((record) => [record.commandActionRef ?? "", record.commandSettlementRef ?? "", record.artifactRef ?? ""])),
    maskingPolicyRef: envelope.maskingPolicyRef,
    disclosureCeilingRef: envelope.disclosureCeilingRef,
    selectedAnchorRef: envelope.selectedAnchorRef,
    selectedAnchorTupleHashRef: envelope.selectedAnchorTupleHashRef,
    traceWindow: {
      windowStart: filters.windowStart,
      windowEnd: filters.windowEnd,
    },
    traceMerkleRoot,
    traceHash,
    gapState: timeline.timelineState === "blocked" ? "blocked" : causalityGapRefs.length > 0 ? "gapped" : "none",
    causalityGapRefs,
    reconstructionState: timeline.timelineState,
  };
}

export class Phase9InvestigationTimelineService {
  issueInvestigationScopeEnvelope(input: IssueInvestigationScopeEnvelopeInput): InvestigationScopeEnvelope {
    invariant(
      ["assurance.audit", "support.replay", "governance.break_glass_review", "assurance.export"].includes(input.purposeOfUse),
      "INVALID_PURPOSE_OF_USE",
      `Unsupported purpose of use ${input.purposeOfUse}.`,
    );
    invariant(toMs(input.expiresAt) > toMs(input.issuedAt), "INVALID_SCOPE_EXPIRY", "Scope envelope expires before it is issued.");
    invariant(input.scopeEntityRefs.includes(input.selectedAnchorRef), "SELECTED_ANCHOR_OUT_OF_SCOPE", "Selected anchor must be in scope.");
    invariant(input.visibilityCoverageRefs.length > 0, "VISIBILITY_COVERAGE_REQUIRED", "Scope envelope requires visibility coverage.");
    const investigationQuestionHash = investigationHash(
      {
        tenantId: input.tenantId,
        question: input.investigationQuestion,
        purposeOfUse: input.purposeOfUse,
      },
      "phase9.439.investigation-question",
    );
    const scopeHash = investigationHash(
      {
        tenantId: input.tenantId,
        originAudienceSurface: input.originAudienceSurface,
        originRouteIntentRef: input.originRouteIntentRef,
        originOpsReturnTokenRef: input.originOpsReturnTokenRef,
        purposeOfUse: input.purposeOfUse,
        actingContextRef: input.actingContextRef,
        maskingPolicyRef: input.maskingPolicyRef,
        disclosureCeilingRef: input.disclosureCeilingRef,
        visibilityCoverageRefs: sortedUnique(input.visibilityCoverageRefs),
        scopeEntityRefs: sortedUnique(input.scopeEntityRefs),
        selectedAnchorRef: input.selectedAnchorRef,
        selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
        investigationQuestionHash,
        requiredBreakGlassReviewRef: input.requiredBreakGlassReviewRef,
        requiredSupportLineageBindingRef: input.requiredSupportLineageBindingRef,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
      },
      "phase9.439.scope.hash",
    );
    return {
      investigationScopeEnvelopeId: `ise_439_${scopeHash.slice(0, 16)}`,
      tenantId: input.tenantId,
      originAudienceSurface: input.originAudienceSurface,
      originRouteIntentRef: input.originRouteIntentRef,
      originOpsReturnTokenRef: input.originOpsReturnTokenRef,
      purposeOfUse: input.purposeOfUse,
      actingContextRef: input.actingContextRef,
      maskingPolicyRef: input.maskingPolicyRef,
      disclosureCeilingRef: input.disclosureCeilingRef,
      visibilityCoverageRefs: sortedUnique(input.visibilityCoverageRefs),
      scopeEntityRefs: sortedUnique(input.scopeEntityRefs),
      selectedAnchorRef: input.selectedAnchorRef,
      selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
      investigationQuestionHash,
      requiredBreakGlassReviewRef: input.requiredBreakGlassReviewRef,
      requiredSupportLineageBindingRef: input.requiredSupportLineageBindingRef,
      scopeHash,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
    };
  }

  executeScopedAuditQuery(input: ExecuteInvestigationAuditQueryInput): InvestigationAuditQueryResult {
    invariant(input.envelope, "INVESTIGATION_SCOPE_ENVELOPE_REQUIRED", "Audit query requires an InvestigationScopeEnvelope.");
    const envelope = input.envelope;
    invariant(toMs(envelope.expiresAt) > toMs(input.generatedAt), "INVESTIGATION_SCOPE_ENVELOPE_EXPIRED", "Investigation scope envelope has expired.");
    invariant(envelope.purposeOfUse === input.envelope.purposeOfUse, "INVALID_PURPOSE_OF_USE", "Envelope purpose of use is invalid.");
    assertTenantIsolation(envelope, input.auditRecords, input.ledgerEntries, input.graphSnapshot);

    const scopedRecords = filterAuditRecords({ ...input, envelope });
    const graphBlockers = deriveGraphBlockers(input.graphSnapshot, input.graphEdges, input.graphVerdict);
    const visibilityBlockers = deriveVisibilityBlockers(envelope, scopedRecords);
    const selectedAnchorBlockers =
      input.filters.selectedAnchorRef && input.filters.selectedAnchorRef !== envelope.selectedAnchorRef
        ? [`selected-anchor:mismatch:${input.filters.selectedAnchorRef}`]
        : [];
    const runtimeBlockers =
      input.surfaceBindingRefs.runtimePublicationBundleRef.includes("mismatch")
        ? [`runtime-publication:mismatch:${input.surfaceBindingRefs.runtimePublicationBundleRef}`]
        : [];

    const initialBlockers = sortedUnique([
      ...graphBlockers,
      ...visibilityBlockers,
      ...selectedAnchorBlockers,
      ...runtimeBlockers,
    ]);
    const provisionalTimeline = reconstructTimeline(
      envelope,
      scopedRecords,
      input.ledgerEntries,
      input.graphSnapshot,
      input.graphVerdict,
      input.generatedAt,
      initialBlockers,
    );

    const breakGlassRequired =
      input.filters.requiresBreakGlass === true ||
      envelope.requiredBreakGlassReviewRef !== "break-glass:not-required" ||
      scopedRecords.some((record) => record.breakGlassState === "required" || record.breakGlassState === "active");
    const breakGlassBlockers =
      breakGlassRequired && !isBreakGlassReviewValid(input.breakGlassReview, envelope, provisionalTimeline.investigationTimelineReconstructionId, input.generatedAt)
        ? [`break-glass:${input.breakGlassReview ? "expired-or-inadequate" : "required-absent"}`]
        : [];

    const timeline = breakGlassBlockers.length === 0
      ? provisionalTimeline
      : reconstructTimeline(
          envelope,
          scopedRecords,
          input.ledgerEntries,
          input.graphSnapshot,
          input.graphVerdict,
          input.generatedAt,
          [...initialBlockers, ...breakGlassBlockers],
        );
    const dataSubjectTrace = buildDataSubjectTrace(envelope, timeline, scopedRecords, input.filters);
    const blockers = sortedUnique([...timeline.blockingRefs, ...breakGlassBlockers]);
    const causalityState = deriveCausalityState(scopedRecords, timeline.missingJoinRefs, blockers);
    const coverageState = coverageStateFromBlockers(input.graphVerdict, blockers);
    const sessionId = `aqs_439_${investigationHash(
      {
        envelope: envelope.scopeHash,
        filtersRef: input.filtersRef,
        timelineHash: timeline.timelineHash,
        generatedAt: input.generatedAt,
      },
      "phase9.439.audit-query-session.id",
    ).slice(0, 16)}`;
    const readAudits = buildReadAuditRecords(
      envelope,
      sessionId,
      input.openedBy,
      envelope.purposeOfUse,
      input.reasonRef,
      scopedRecords,
      input.generatedAt,
    );
    const auditQuerySession: AuditQuerySession = {
      auditQuerySessionId: sessionId,
      openedBy: input.openedBy,
      filtersRef: input.filtersRef,
      investigationScopeEnvelopeRef: envelope.investigationScopeEnvelopeId,
      purposeOfUse: envelope.purposeOfUse,
      visibilityCoverageRefs: envelope.visibilityCoverageRefs,
      actingContextRef: envelope.actingContextRef,
      breakGlassReviewRef: input.breakGlassReview?.breakGlassReviewRecordId ?? envelope.requiredBreakGlassReviewRef,
      coverageState,
      requiredEdgeCorrelationId: input.filters.requiredEdgeCorrelationId ?? scopedRecords[0]?.edgeCorrelationId ?? "edge-correlation:unscoped",
      requiredContinuityFrameRefs: sortedUnique(input.filters.requiredContinuityFrameRefs ?? scopedRecords.map((record) => record.continuityFrameRef)),
      selectedAnchorRef: envelope.selectedAnchorRef,
      selectedAnchorTupleHashRef: envelope.selectedAnchorTupleHashRef,
      investigationQuestionHash: envelope.investigationQuestionHash,
      missingJoinRefs: timeline.missingJoinRefs,
      causalityState,
      assuranceSurfaceRuntimeBindingRef: input.surfaceBindingRefs.assuranceSurfaceRuntimeBindingRef,
      surfaceRouteContractRef: input.surfaceBindingRefs.surfaceRouteContractRef,
      surfacePublicationRef: input.surfaceBindingRefs.surfacePublicationRef,
      runtimePublicationBundleRef: input.surfaceBindingRefs.runtimePublicationBundleRef,
      releasePublicationParityRef: input.surfaceBindingRefs.releasePublicationParityRef,
      releaseRecoveryDispositionRef: input.surfaceBindingRefs.releaseRecoveryDispositionRef,
      assuranceEvidenceGraphSnapshotRef: timeline.assuranceEvidenceGraphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: timeline.assuranceGraphCompletenessVerdictRef,
      timelineReconstructionRef: timeline.investigationTimelineReconstructionId,
      artifactPresentationContractRef: input.artifactPolicy?.artifactPresentationContractRef,
      artifactTransferSettlementRef: input.artifactPolicy?.artifactTransferSettlementRef,
      artifactFallbackDispositionRef: input.artifactPolicy?.artifactFallbackDispositionRef,
      outboundNavigationGrantPolicyRef: input.artifactPolicy?.outboundNavigationGrantPolicyRef,
      baseLedgerWatermarkRef: timeline.baseLedgerWatermarkRef,
      reconstructionInputHash: timeline.reconstructionInputHash,
      timelineHash: timeline.timelineHash,
      graphHash: timeline.graphHash,
      stableCursor: investigationHash(
        { sessionId, last: scopedRecords.at(-1)?.eventHash ?? "empty" },
        "phase9.439.audit-query.cursor",
      ),
      resultAuditRecordRefs: scopedRecords.map((record) => record.auditRecordRef),
      privilegedReadAuditRecordRefs: readAudits.map((record) => record.investigationReadAuditRecordId),
      blockingRefs: blockers,
      createdAt: input.generatedAt,
      expiresAt: envelope.expiresAt,
    };
    const resultWithoutHash = {
      schemaVersion: PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
      envelope,
      auditQuerySession,
      timelineReconstruction: {
        ...timeline,
        dataSubjectTraceRef: dataSubjectTrace.dataSubjectTraceId,
      },
      dataSubjectTrace,
      returnedAuditRecords: scopedRecords,
      accessEventIndex: buildAccessIndex(scopedRecords),
      privilegedReadAuditRecords: readAudits,
    } satisfies Omit<InvestigationAuditQueryResult, "resultHash">;
    return {
      ...resultWithoutHash,
      resultHash: investigationHash(resultWithoutHash, "phase9.439.audit-query.result"),
    };
  }

  createBreakGlassReviewRecord(input: {
    readonly eventRef: string;
    readonly envelope: InvestigationScopeEnvelope;
    readonly timelineReconstructionRef: string;
    readonly reviewerRef: string;
    readonly reviewState: BreakGlassQueueState;
    readonly reasonAdequacy: BreakGlassReasonAdequacy;
    readonly visibilityWideningSummaryRef: string;
    readonly objectClassCoverageRefs: readonly string[];
    readonly expiryBoundaryRef: string;
    readonly expiresAt: string;
    readonly followUpBurdenState: BreakGlassFollowUpBurdenState;
    readonly queueState: BreakGlassQueueState;
    readonly followUpRequired: boolean;
  }): BreakGlassReviewRecord {
    const decisionHash = investigationHash(
      {
        eventRef: input.eventRef,
        envelope: input.envelope.scopeHash,
        timelineReconstructionRef: input.timelineReconstructionRef,
        reviewerRef: input.reviewerRef,
        reasonAdequacy: input.reasonAdequacy,
        visibilityWideningSummaryRef: input.visibilityWideningSummaryRef,
        objectClassCoverageRefs: sortedUnique(input.objectClassCoverageRefs),
        expiryBoundaryRef: input.expiryBoundaryRef,
        expiresAt: input.expiresAt,
        followUpBurdenState: input.followUpBurdenState,
        queueState: input.queueState,
        followUpRequired: input.followUpRequired,
      },
      "phase9.439.break-glass.decision",
    );
    return {
      breakGlassReviewRecordId: `bgr_439_${decisionHash.slice(0, 16)}`,
      eventRef: input.eventRef,
      investigationScopeEnvelopeRef: input.envelope.investigationScopeEnvelopeId,
      timelineReconstructionRef: input.timelineReconstructionRef,
      reviewerRef: input.reviewerRef,
      reviewState: input.reviewState,
      reasonAdequacy: input.reasonAdequacy,
      visibilityWideningSummaryRef: input.visibilityWideningSummaryRef,
      objectClassCoverageRefs: sortedUnique(input.objectClassCoverageRefs),
      expiryBoundaryRef: input.expiryBoundaryRef,
      expiresAt: input.expiresAt,
      followUpBurdenState: input.followUpBurdenState,
      queueState: input.queueState,
      followUpRequired: input.followUpRequired,
      decisionHash,
    };
  }

  openSupportReplaySession(input: OpenSupportReplaySessionInput): SupportReplaySession {
    const { auditQueryResult } = input;
    const session = auditQueryResult.auditQuerySession;
    const timeline = auditQueryResult.timelineReconstruction;
    invariant(
      session.timelineReconstructionRef === timeline.investigationTimelineReconstructionId,
      "SUPPORT_REPLAY_TIMELINE_MISMATCH",
      "Support replay must use the audit query timeline reconstruction.",
    );
    const replayDeterminismState: ReplayDeterminismState =
      session.timelineHash === timeline.timelineHash && session.coverageState !== "blocked" ? "same_timeline" : "blocked";
    const restoreEligibilityState: ReplayRestoreEligibilityState =
      session.coverageState === "exact" && session.causalityState === "complete" ? "eligible" : session.coverageState === "blocked" ? "blocked" : "diagnostic_only";
    const replayHash = investigationHash(
      {
        sessionRef: session.auditQuerySessionId,
        timelineHash: timeline.timelineHash,
        operatorRef: input.operatorRef,
        targetJourneyRef: input.targetJourneyRef,
      },
      "phase9.439.support-replay.session",
    );
    return {
      supportReplaySessionId: `srs_439_${replayHash.slice(0, 16)}`,
      operatorRef: input.operatorRef,
      targetJourneyRef: input.targetJourneyRef,
      auditQuerySessionRef: session.auditQuerySessionId,
      investigationScopeEnvelopeRef: auditQueryResult.envelope.investigationScopeEnvelopeId,
      timelineReconstructionRef: timeline.investigationTimelineReconstructionId,
      timelineRefs: timeline.rows.map((row) => row.timelineRowId),
      timelineHash: timeline.timelineHash,
      maskingPolicyRef: auditQueryResult.envelope.maskingPolicyRef,
      selectedAnchorRef: auditQueryResult.envelope.selectedAnchorRef,
      selectedAnchorTupleHashRef: auditQueryResult.envelope.selectedAnchorTupleHashRef,
      originOpsReturnTokenRef: auditQueryResult.envelope.originOpsReturnTokenRef,
      evidenceSetHash: orderedSetHash(timeline.rows.map((row) => row.rowHash), "phase9.439.support-replay.evidence-set"),
      assuranceEvidenceGraphSnapshotRef: timeline.assuranceEvidenceGraphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: timeline.assuranceGraphCompletenessVerdictRef,
      graphHash: timeline.graphHash,
      edgeCorrelationId: session.requiredEdgeCorrelationId,
      restoreSettlementRef: input.restoreSettlementRef,
      latestSettlementRef: input.latestSettlementRef,
      restoreEligibilityState,
      replayDeterminismState,
      routeIntentBindingRef: input.routeIntentBindingRef,
      actionRecordRef: input.actionRecordRef,
      actionSettlementRef: input.actionSettlementRef,
      uiEventCausalityFrameRef: input.uiEventCausalityFrameRef,
      projectionVisibilityRef: timeline.rows.find((row) => row.projectionVisibilityRef)?.projectionVisibilityRef ?? "projection-visibility:missing",
      auditRecordRef: session.resultAuditRecordRefs[0] ?? "audit-record:missing",
      transitionEnvelopeRef: input.transitionEnvelopeRef,
      uiTelemetryDisclosureFenceRef: input.uiTelemetryDisclosureFenceRef,
      causalityState: session.causalityState,
    };
  }

  readReplaySafeEvents(
    session: SupportReplaySession,
    timeline: InvestigationTimelineReconstruction,
  ): readonly SupportReplaySafeEvent[] {
    invariant(
      session.timelineReconstructionRef === timeline.investigationTimelineReconstructionId,
      "SUPPORT_REPLAY_TIMELINE_MISMATCH",
      "Replay-safe reads must use the shared timeline reconstruction.",
    );
    return timeline.rows.map((row) => ({
      timelineRowId: row.timelineRowId,
      eventTime: row.eventTime,
      actionType: row.actionType,
      entityRef: row.entityRef,
      edgeCorrelationId: row.edgeCorrelationId,
      continuityFrameRef: row.continuityFrameRef,
      auditRecordRef: row.auditRecordRef,
      rowHash: row.rowHash,
    }));
  }

  compareSupportReplayWithCurrentState(
    session: SupportReplaySession,
    currentTimelineHash: string,
  ): ReplayDeterminismState {
    if (session.replayDeterminismState === "blocked") {
      return "blocked";
    }
    return session.timelineHash === currentTimelineHash ? "same_timeline" : "drifted";
  }

  createExportPreview(
    queryResult: InvestigationAuditQueryResult,
    artifactPolicy?: InvestigationArtifactPolicy,
  ): InvestigationExportPreview {
    const denialRefs = sortedUnique([
      ...(queryResult.auditQuerySession.coverageState !== "exact" ? ["coverage:not-exact"] : []),
      ...(!artifactPolicy?.artifactPresentationContractRef ? ["artifact-presentation-contract:missing"] : []),
      ...(!artifactPolicy?.outboundNavigationGrantPolicyRef ? ["outbound-navigation-grant:missing"] : []),
      ...(artifactPolicy && !artifactPolicy.previewAllowed ? ["artifact-preview:denied"] : []),
    ]);
    const previewHash = investigationHash(
      {
        query: queryResult.resultHash,
        artifactPolicyHash: artifactPolicy?.policyHash ?? "artifact-policy:missing",
        denialRefs,
      },
      "phase9.439.export-preview",
    );
    return {
      exportPreviewId: `iep_439_${previewHash.slice(0, 16)}`,
      auditQuerySessionRef: queryResult.auditQuerySession.auditQuerySessionId,
      timelineReconstructionRef: queryResult.timelineReconstruction.investigationTimelineReconstructionId,
      previewState: denialRefs.length === 0 ? "allowed" : "denied",
      artifactPresentationContractRef: artifactPolicy?.artifactPresentationContractRef,
      outboundNavigationGrantPolicyRef: artifactPolicy?.outboundNavigationGrantPolicyRef,
      denialRefs,
      previewHash,
    };
  }
}

export function buildWormAuditRecordFromLedger(
  ledgerEntry: AssuranceLedgerEntry,
  overrides: Partial<WormAuditRecord> = {},
): WormAuditRecord {
  const seed = {
    ledgerHash: ledgerEntry.hash,
    actionType: overrides.actionType ?? ledgerEntry.entryType,
    actorRef: overrides.actorRef ?? "actor:ops-439",
    subjectRef: overrides.subjectRef ?? "subject:439-001",
    entityRef: overrides.entityRef ?? "request:439-001",
  };
  const eventHash = investigationHash(seed, "phase9.439.worm-audit-record");
  return {
    wormAuditRecordId: overrides.wormAuditRecordId ?? ledgerEntry.auditRecordRef,
    tenantId: overrides.tenantId ?? ledgerEntry.tenantId,
    actorRef: overrides.actorRef ?? "actor:ops-439",
    subjectRef: overrides.subjectRef ?? "subject:439-001",
    entityType: overrides.entityType ?? "request",
    entityRef: overrides.entityRef ?? "request:439-001",
    actionType: overrides.actionType ?? ledgerEntry.entryType,
    eventTime: overrides.eventTime ?? ledgerEntry.createdAt,
    purposeOfUse: overrides.purposeOfUse ?? "assurance.audit",
    actingContextRef: overrides.actingContextRef ?? "acting-context:ops-audit",
    breakGlassState: overrides.breakGlassState ?? "none",
    visibilityCoverageRef: overrides.visibilityCoverageRef ?? "visibility:ops-audit:bounded",
    disclosureCeilingRef: overrides.disclosureCeilingRef ?? "disclosure:bounded",
    edgeCorrelationId: overrides.edgeCorrelationId ?? ledgerEntry.edgeCorrelationId,
    continuityFrameRef: overrides.continuityFrameRef ?? ledgerEntry.continuityFrameRef ?? "continuity:439",
    causalTokenRef: overrides.causalTokenRef ?? ledgerEntry.causalTokenRef,
    auditRecordRef: overrides.auditRecordRef ?? ledgerEntry.auditRecordRef,
    policyDecisionWitnessRef: overrides.policyDecisionWitnessRef ?? "policy-witness:439",
    sourceSequenceRef: overrides.sourceSequenceRef ?? ledgerEntry.sourceSequenceRef,
    assuranceLedgerEntryRef: overrides.assuranceLedgerEntryRef ?? ledgerEntry.assuranceLedgerEntryId,
    commandActionRef: overrides.commandActionRef ?? ledgerEntry.commandActionRef,
    commandSettlementRef: overrides.commandSettlementRef ?? ledgerEntry.commandSettlementRef,
    uiTransitionSettlementRef: overrides.uiTransitionSettlementRef ?? ledgerEntry.uiTransitionSettlementRef,
    projectionVisibilityRef: overrides.projectionVisibilityRef ?? ledgerEntry.projectionVisibilityRef,
    artifactRef: overrides.artifactRef ?? ledgerEntry.evidenceRefs[0],
    payloadClass: overrides.payloadClass ?? "masked_summary",
    eventHash: overrides.eventHash ?? eventHash,
  };
}

function defaultSurfaceBindingRefs(): InvestigationSurfaceBindingRefs {
  return {
    assuranceSurfaceRuntimeBindingRef: "surface-runtime-binding:ops-audit",
    surfaceRouteContractRef: "surface-route-contract:ops-audit",
    surfacePublicationRef: "surface-publication:ops-audit",
    runtimePublicationBundleRef: "runtime-publication:ops-audit",
    releasePublicationParityRef: "release-publication-parity:ops-audit",
    releaseRecoveryDispositionRef: "release-recovery:ops-audit",
  };
}

function createFixtureLedger() {
  const ingest = new Phase9AssuranceIngestService([createDefaultPhase9AssuranceProducerRegistration()]);
  const events = [
    createPhase9AssuranceProducerEnvelope({
      sourceSequenceRef: "seq:000001",
      sourceEventRef: "event:439:request-opened",
      edgeCorrelationId: "edge-correlation:439-request",
      continuityFrameRef: "continuity:439-request",
      routeIntentRef: "route-intent:ops-audit",
      commandActionRef: "command-action:request-opened",
      commandSettlementRef: "command-settlement:request-opened",
      uiTransitionSettlementRef: "ui-transition:request-visible",
      projectionVisibilityRef: "visibility:ops-audit:bounded",
      auditRecordRef: "audit:439:request-opened",
      causalTokenRef: "causal:439:request",
      createdAt: "2026-04-27T08:00:00.000Z",
      payload: { digest: "request-opened", inlinePhi: false },
    }),
    createPhase9AssuranceProducerEnvelope({
      sourceSequenceRef: "seq:000002",
      sourceEventRef: "event:439:task-accepted",
      edgeCorrelationId: "edge-correlation:439-request",
      continuityFrameRef: "continuity:439-request",
      routeIntentRef: "route-intent:ops-audit",
      commandActionRef: "command-action:task-accepted",
      commandSettlementRef: "command-settlement:task-accepted",
      uiTransitionSettlementRef: "ui-transition:task-accepted-visible",
      projectionVisibilityRef: "visibility:ops-audit:bounded",
      auditRecordRef: "audit:439:task-accepted",
      causalTokenRef: "causal:439:request",
      createdAt: "2026-04-27T08:04:00.000Z",
      payload: { digest: "task-accepted", inlinePhi: false },
    }),
    createPhase9AssuranceProducerEnvelope({
      sourceSequenceRef: "seq:000003",
      sourceEventRef: "event:439:ui-success-visible",
      edgeCorrelationId: "edge-correlation:439-request",
      continuityFrameRef: "continuity:439-request",
      routeIntentRef: "route-intent:ops-audit",
      commandActionRef: "command-action:task-visible",
      commandSettlementRef: "command-settlement:task-visible",
      uiTransitionSettlementRef: "ui-transition:success-visible",
      projectionVisibilityRef: "visibility:ops-audit:bounded",
      auditRecordRef: "audit:439:ui-success-visible",
      causalTokenRef: "causal:439:request",
      createdAt: "2026-04-27T08:06:00.000Z",
      payload: { digest: "ui-success-visible", inlinePhi: false },
    }),
    createPhase9AssuranceProducerEnvelope({
      sourceSequenceRef: "seq:000004",
      sourceEventRef: "event:439:artifact-preview",
      edgeCorrelationId: "edge-correlation:439-request",
      continuityFrameRef: "continuity:439-request",
      routeIntentRef: "route-intent:ops-audit",
      commandActionRef: "command-action:artifact-preview",
      commandSettlementRef: "command-settlement:artifact-preview",
      uiTransitionSettlementRef: "ui-transition:artifact-preview",
      projectionVisibilityRef: "visibility:ops-audit:bounded",
      auditRecordRef: "audit:439:artifact-preview",
      causalTokenRef: "causal:439:request",
      createdAt: "2026-04-27T08:08:00.000Z",
      payload: { digest: "artifact-preview", inlinePhi: false },
    }),
  ];
  const receipts = ingest.ingestBatch(events);
  const graph = ingest.materializeGraphSnapshot({
    tenantScopeRef: "tenant:demo-gp",
    generatedAt: "2026-04-27T08:15:00.000Z",
    controlObjectiveRefs: ["control:dtac:clinical-safety:evidence", "control:439:audit-timeline"],
    continuityEvidenceRefs: ["continuity:439-request"],
  });
  return {
    receipts,
    ledgerEntries: ingest.getState().ledgerEntries,
    graphSnapshot: graph.snapshot,
    graphEdges: graph.edges,
  };
}

export function createPhase9InvestigationTimelineFixture(): Phase9InvestigationTimelineFixture {
  const generatedAt = "2026-04-27T08:20:00.000Z";
  const service = new Phase9InvestigationTimelineService();
  const { ledgerEntries, graphSnapshot, graphEdges } = createFixtureLedger();
  const graphVerdict = evaluatePhase9GraphVerdict({
    snapshot: graphSnapshot,
    edges: graphEdges,
    context: "audit_timeline",
    scopeRef: graphSnapshot.tenantScopeRef,
    generatedAt,
    graphWatermark: graphSnapshot.graphHash,
    requiredLedgerWatermark: graphSnapshot.graphHash,
    requiredNodeRefs: [
      ...graphSnapshot.ledgerEntryRefs,
      ...graphSnapshot.evidenceArtifactRefs,
      ...graphSnapshot.controlObjectiveRefs,
      "continuity:439-request",
    ],
  });
  const auditRecords = ledgerEntries.map((entry, index) =>
    buildWormAuditRecordFromLedger(entry, {
      entityRef: index === 0 ? "request:439-001" : index === 1 ? "task:439-001" : "request:439-001",
      entityType: index === 1 ? "task" : "request",
      actionType: ["request.opened", "server.accepted", "ui.success.visible", "artifact.previewed"][index] ?? "audit.observed",
      eventTime: ["2026-04-27T08:00:00.000Z", "2026-04-27T08:04:00.000Z", "2026-04-27T08:06:00.000Z", "2026-04-27T08:08:00.000Z"][index],
    }),
  );
  const envelope = service.issueInvestigationScopeEnvelope({
    tenantId: "tenant:demo-gp",
    originAudienceSurface: "ops/audit",
    originRouteIntentRef: "route-intent:ops-audit",
    originOpsReturnTokenRef: "return-token:ops-overview:439",
    purposeOfUse: "assurance.audit",
    actingContextRef: "acting-context:ops-audit",
    maskingPolicyRef: "masking:minimum-necessary",
    disclosureCeilingRef: "disclosure:bounded",
    visibilityCoverageRefs: ["visibility:ops-audit:bounded"],
    scopeEntityRefs: ["request:439-001", "task:439-001", "subject:439-001"],
    selectedAnchorRef: "request:439-001",
    selectedAnchorTupleHashRef: "selected-anchor-hash:439",
    investigationQuestion: "Why did the request success state become visible?",
    requiredBreakGlassReviewRef: "break-glass:not-required",
    requiredSupportLineageBindingRef: "support-lineage:439",
    issuedAt: "2026-04-27T08:10:00.000Z",
    expiresAt: "2026-04-27T09:10:00.000Z",
  });
  const expiredEnvelope = {
    ...envelope,
    investigationScopeEnvelopeId: "ise_439_expired",
    expiresAt: "2026-04-27T08:11:00.000Z",
  };
  const filters: InvestigationAuditQueryFilters = {
    windowStart: "2026-04-27T07:55:00.000Z",
    windowEnd: "2026-04-27T08:10:00.000Z",
    entityRefs: ["request:439-001"],
    subjectRefs: ["subject:439-001"],
    requiredEdgeCorrelationId: "edge-correlation:439-request",
    requiredContinuityFrameRefs: ["continuity:439-request"],
    selectedAnchorRef: "request:439-001",
    limit: 50,
  };
  const baselineResult = service.executeScopedAuditQuery({
    envelope,
    openedBy: "actor:ops-439",
    filtersRef: "filters:439:baseline",
    filters,
    auditRecords,
    ledgerEntries,
    graphSnapshot,
    graphEdges,
    graphVerdict,
    surfaceBindingRefs: defaultSurfaceBindingRefs(),
    artifactPolicy: {
      artifactPresentationContractRef: "artifact-presentation:ops-audit",
      artifactTransferSettlementRef: "artifact-transfer:ops-audit",
      artifactFallbackDispositionRef: "artifact-fallback:ops-audit",
      outboundNavigationGrantPolicyRef: "outbound-navigation:ops-audit",
      previewAllowed: true,
      exportAllowed: false,
      policyHash: "artifact-policy-hash:439",
    },
    generatedAt,
    reasonRef: "reason:439:baseline",
  });
  const breakGlassEnvelope = {
    ...envelope,
    investigationScopeEnvelopeId: "ise_439_break_glass",
    requiredBreakGlassReviewRef: "break-glass:required",
  };
  const breakGlassReview = service.createBreakGlassReviewRecord({
    eventRef: "audit:439:request-opened",
    envelope: breakGlassEnvelope,
    timelineReconstructionRef: baselineResult.timelineReconstruction.investigationTimelineReconstructionId,
    reviewerRef: "reviewer:governance-439",
    reviewState: "closed",
    reasonAdequacy: "sufficient",
    visibilityWideningSummaryRef: "visibility-widening:439",
    objectClassCoverageRefs: ["object-class:request", "object-class:task"],
    expiryBoundaryRef: "expiry:2026-04-27T09:10:00.000Z",
    expiresAt: "2026-04-27T09:10:00.000Z",
    followUpBurdenState: "peer_review_required",
    queueState: "closed",
    followUpRequired: true,
  });
  const expiredBreakGlassReview = {
    ...breakGlassReview,
    breakGlassReviewRecordId: "bgr_439_expired",
    expiresAt: "2026-04-27T08:15:00.000Z",
    queueState: "expired" as const,
  };
  const breakGlassRecords = auditRecords.map((record, index) =>
    index === 0 ? { ...record, breakGlassState: "required" as const } : record,
  );
  const breakGlassAbsentResult = service.executeScopedAuditQuery({
    envelope: breakGlassEnvelope,
    openedBy: "actor:ops-439",
    filtersRef: "filters:439:break-glass-missing",
    filters: { ...filters, requiresBreakGlass: true },
    auditRecords: breakGlassRecords,
    ledgerEntries,
    graphSnapshot,
    graphEdges,
    graphVerdict,
    surfaceBindingRefs: defaultSurfaceBindingRefs(),
    generatedAt,
    reasonRef: "reason:439:break-glass-missing",
  });
  const breakGlassExpiredResult = service.executeScopedAuditQuery({
    envelope: breakGlassEnvelope,
    openedBy: "actor:ops-439",
    filtersRef: "filters:439:break-glass-expired",
    filters: { ...filters, requiresBreakGlass: true },
    auditRecords: breakGlassRecords,
    ledgerEntries,
    graphSnapshot,
    graphEdges,
    graphVerdict,
    breakGlassReview: expiredBreakGlassReview,
    surfaceBindingRefs: defaultSurfaceBindingRefs(),
    generatedAt,
    reasonRef: "reason:439:break-glass-expired",
  });
  const missingGraphVerdictResult = service.executeScopedAuditQuery({
    envelope,
    openedBy: "actor:ops-439",
    filtersRef: "filters:439:missing-graph-verdict",
    filters,
    auditRecords,
    ledgerEntries,
    graphSnapshot,
    graphEdges,
    surfaceBindingRefs: defaultSurfaceBindingRefs(),
    generatedAt,
    reasonRef: "reason:439:missing-graph-verdict",
  });
  const orphanGraphEdge = {
    ...graphEdges[0]!,
    assuranceEvidenceGraphEdgeId: "aege_439_orphan",
    toRef: "missing:439:control",
  };
  const orphanGraphEdgeResult = service.executeScopedAuditQuery({
    envelope,
    openedBy: "actor:ops-439",
    filtersRef: "filters:439:orphan-edge",
    filters,
    auditRecords,
    ledgerEntries,
    graphSnapshot,
    graphEdges: [...graphEdges, orphanGraphEdge],
    graphVerdict,
    surfaceBindingRefs: defaultSurfaceBindingRefs(),
    generatedAt,
    reasonRef: "reason:439:orphan-edge",
  });
  const visibilityGapResult = service.executeScopedAuditQuery({
    envelope,
    openedBy: "actor:ops-439",
    filtersRef: "filters:439:visibility-gap",
    filters,
    auditRecords: auditRecords.map((record, index) =>
      index === 0 ? { ...record, visibilityCoverageRef: "visibility:other" } : record,
    ),
    ledgerEntries,
    graphSnapshot,
    graphEdges,
    graphVerdict,
    surfaceBindingRefs: defaultSurfaceBindingRefs(),
    generatedAt,
    reasonRef: "reason:439:visibility-gap",
  });
  const supportReplaySession = service.openSupportReplaySession({
    auditQueryResult: baselineResult,
    operatorRef: "operator:support-439",
    targetJourneyRef: "journey:request-439",
    restoreSettlementRef: "support-replay-restore:439",
    latestSettlementRef: "support-latest-settlement:439",
    routeIntentBindingRef: "route-intent-binding:439",
    actionRecordRef: "support-action:439",
    actionSettlementRef: "support-action-settlement:439",
    uiEventCausalityFrameRef: "ui-causality-frame:439",
    transitionEnvelopeRef: "transition-envelope:439",
    uiTelemetryDisclosureFenceRef: "ui-disclosure-fence:439",
  });
  const exportDeniedPreview = service.createExportPreview(baselineResult);
  const replayed = service.executeScopedAuditQuery({
    envelope,
    openedBy: "actor:ops-439",
    filtersRef: "filters:439:baseline",
    filters,
    auditRecords: [...auditRecords].reverse(),
    ledgerEntries: [...ledgerEntries].reverse(),
    graphSnapshot,
    graphEdges,
    graphVerdict,
    surfaceBindingRefs: defaultSurfaceBindingRefs(),
    artifactPolicy: {
      artifactPresentationContractRef: "artifact-presentation:ops-audit",
      artifactTransferSettlementRef: "artifact-transfer:ops-audit",
      artifactFallbackDispositionRef: "artifact-fallback:ops-audit",
      outboundNavigationGrantPolicyRef: "outbound-navigation:ops-audit",
      previewAllowed: true,
      exportAllowed: false,
      policyHash: "artifact-policy-hash:439",
    },
    generatedAt,
    reasonRef: "reason:439:baseline",
  });
  return {
    schemaVersion: PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9C",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-9-the-assurance-ledger.md#9E",
      "blueprint/phase-0-the-foundation-protocol.md#WORM-audit-ledger",
      "blueprint/phase-0-the-foundation-protocol.md#purpose-of-use",
      "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
      "blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant",
      "data/contracts/435_phase9_assurance_ingest_service_contract.json",
      "data/contracts/436_phase9_graph_verdict_engine_contract.json",
      "data/contracts/438_phase9_essential_function_metrics_contract.json",
    ],
    envelope,
    expiredEnvelope,
    ledgerEntries,
    auditRecords,
    graphSnapshot,
    graphEdges,
    graphVerdict,
    breakGlassReview,
    expiredBreakGlassReview,
    baselineResult,
    missingGraphVerdictResult,
    orphanGraphEdgeResult,
    visibilityGapResult,
    breakGlassAbsentResult,
    breakGlassExpiredResult,
    supportReplaySession,
    exportDeniedPreview,
    replayHash: orderedSetHash(
      [baselineResult.resultHash, replayed.resultHash, baselineResult.timelineReconstruction.timelineHash],
      "phase9.439.fixture.replay",
    ),
  };
}

export function phase9InvestigationTimelineSummary(
  fixture: Phase9InvestigationTimelineFixture = createPhase9InvestigationTimelineFixture(),
): string {
  return [
    "# 439 Phase 9 Investigation Timeline Service",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Scope envelope: ${fixture.envelope.investigationScopeEnvelopeId}`,
    `Timeline hash: ${fixture.baselineResult.timelineReconstruction.timelineHash}`,
    `Query coverage: ${fixture.baselineResult.auditQuerySession.coverageState}`,
    `Support replay session: ${fixture.supportReplaySession.supportReplaySessionId}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Governance Contract",
    "",
    "- InvestigationScopeEnvelope is mandatory before any audit query.",
    "- AuditQuerySession, SupportReplaySession, BreakGlassReviewRecord, and DataSubjectTrace share the same scope envelope and timeline reconstruction for one diagnostic question.",
    "- Timeline ordering is deterministic by event time, source sequence ref, assurance ledger entry id, and deterministic fallback id.",
    "- Break-glass reviews expire and never become permanent visibility grants.",
    "- Export/preview remains blocked without ArtifactPresentationContract and OutboundNavigationGrant policy refs.",
    "",
  ].join("\n");
}

export function phase9InvestigationTimelineSourceMatrixCsv(): string {
  const rows = [
    ["source", "role", "failureMode"],
    ["InvestigationScopeEnvelope", "single authority for audit query scope", "missing_or_expired_scope_blocks_query"],
    ["AssuranceLedgerEntry", "WORM-backed timeline input", "missing_join_blocks_authoritative_timeline"],
    ["WormAuditRecord", "immutable privileged access/event record", "missing_audit_causes_audit_missing"],
    ["AssuranceEvidenceGraphSnapshot", "graph authority for timeline/replay/export", "missing_snapshot_blocks"],
    ["AssuranceGraphCompletenessVerdict", "consumer-context completeness verdict", "blocked_or_missing_verdict_blocks"],
    ["BreakGlassReviewRecord", "expiring privileged access review", "absent_expired_or_inadequate_review_blocks"],
    ["ArtifactPresentationContract", "preview/export policy boundary", "missing_policy_denies_preview_export"],
    ["OutboundNavigationGrant", "return-safe external handoff boundary", "missing_grant_denies_external_handoff"],
  ];
  return `${rows.map((row) => row.map((cell) => (cell.includes(",") ? `"${cell}"` : cell)).join(",")).join("\n")}\n`;
}
