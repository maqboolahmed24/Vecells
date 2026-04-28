import {
  buildReviewProjectionRef,
  classifyReviewDeltaPacket,
  renderDeterministicReviewSummary,
  resolveReviewSummaryVisibility,
  stableReviewDigest,
  type DeterministicReviewSummary,
  type EvidenceDeltaPacketSnapshot,
  type ReviewActionInvalidation,
  type ReviewAttachmentPreview,
  type ReviewBundleParityState,
  type ReviewBundlePublicationState,
  type ReviewBundleSnapshot,
  type ReviewChangeMarker,
  type ReviewStructuredAnswer,
  type ReviewSuggestionComplexityBand,
  type ReviewSuggestionPriorityBand,
  type ReviewSuggestionVisibilityState,
  type ReviewSupersededJudgmentContext,
  type ReviewTextSection,
  type ReviewTimelineEntry,
  type SuggestionEnvelopeSnapshot,
  type SuggestionEndpointCandidate,
} from "@vecells/domain-kernel";
import {
  createPhase3TriageKernelApplication,
  type CreatePhase3KernelTaskInput,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export const PHASE3_REVIEW_BUNDLE_ASSEMBLER_SERVICE_NAME = "Phase3ReviewBundleAssemblerService";
export const PHASE3_REVIEW_BUNDLE_SCHEMA_VERSION = "235.phase3.review-bundle.v1";
export const PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID = "phase3_review_bundle_task_235_primary";
export const PHASE3_REVIEW_BUNDLE_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/:taskId/review-bundle",
  "GET /internal/v1/workspace/tasks/:taskId/review-bundle/suggestions",
] as const;
export const reviewBundleParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE3_REVIEW_BUNDLE_STACK",
] as const;

export const reviewBundleRoutes = [
  {
    routeId: "workspace_task_review_bundle_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/review-bundle",
    contractFamily: "ReviewBundleContract",
    purpose:
      "Assemble one authoritative ReviewBundle, deterministic summary, and EvidenceDeltaPacket for the current task without allowing the UI to compose summary truth locally.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_review_bundle_suggestions_current",
    method: "GET",
    path: "/internal/v1/workspace/tasks/{taskId}/review-bundle/suggestions",
    contractFamily: "SuggestionEnvelopeContract",
    purpose:
      "Hydrate the current task-scoped SuggestionEnvelope set from the pinned ReviewBundle while keeping shadow-model output dark and non-authoritative.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
] as const;

export const reviewBundleScenarioIds = [
  "verified_bundle_with_transcript",
  "stale_parity_suppresses_authoritative_summary",
  "duplicate_reversal_requires_rebuild",
  "decision_epoch_supersession_invalidates_preview_bundle",
  "transcript_absent_and_large_attachments_degrade_safely",
] as const;

type ReviewBundleScenarioId = (typeof reviewBundleScenarioIds)[number];

interface ReviewTelephonyFixture {
  callSessionRef: string | null;
  summaryLines: readonly string[];
}

interface ReviewTranscriptFixture {
  transcriptState: ReviewBundleSnapshot["transcript"]["transcriptState"];
  summaryLines: readonly string[];
  sourceArtifactRefs: readonly string[];
}

interface ReviewDuplicateFixture {
  duplicateClusterRef: string | null;
  decisionClass: string | null;
  summaryLines: readonly string[];
  sourceArtifactRefs: readonly string[];
  resolutionRef: string | null;
}

interface ReviewComparableState {
  snapshotRef: string;
  endpointAssumptionRef: string | null;
  approvalPostureRef: string | null;
  ownershipRef: string | null;
  duplicateResolutionRef: string | null;
  duplicateDecisionClass: string | null;
  transcriptState: ReviewBundleSnapshot["transcript"]["transcriptState"];
  attachmentPreviewStates: readonly string[];
  newEvidenceRefs: readonly string[];
  contradictionRefs: readonly string[];
}

interface ReviewBundleSourceRecord {
  taskId: string;
  requestId: string;
  requestSummary: ReviewTextSection;
  structuredAnswers: readonly ReviewStructuredAnswer[];
  patientNarrative: ReviewTextSection;
  safetyScreening: ReviewBundleSnapshot["safetyScreening"];
  telephony: ReviewTelephonyFixture;
  transcript: ReviewTranscriptFixture;
  attachments: readonly ReviewAttachmentPreview[];
  identitySummary: ReviewTextSection;
  contactPreferenceSummary: ReviewTextSection;
  priorPatientResponses: readonly ReviewTimelineEntry[];
  duplicateClusterStatus: ReviewDuplicateFixture;
  latestSlaState: ReviewBundleSnapshot["latestSlaState"];
  captureBundleRef: string;
  evidenceSnapshotRef: string;
  evidenceSummaryParityRef: string;
  parityState: ReviewBundleParityState;
  parityPolicyVersion: string;
  rulesVersion: string;
  policyBundleRef: string;
  baseline: ReviewComparableState;
  current: ReviewComparableState;
  candidateEndpoints: readonly SuggestionEndpointCandidate[];
  recommendedQuestionSetIds: readonly string[];
  rationaleBullets: readonly string[];
  priorityBand: ReviewSuggestionPriorityBand;
  complexityBand: ReviewSuggestionComplexityBand;
  confidenceDescriptor: string;
  shadowRationaleBullets: readonly string[];
  shadowConfidenceDescriptor: string;
  gapArtifactRefs: readonly string[];
}

interface ReviewBundleTaskView {
  reviewVersion: number;
  currentLineageFenceEpoch: number;
  currentDecisionEpochRef: string | null;
  latestDecisionSupersessionRef: string | null;
  reviewFreshnessState: "fresh" | "queued_updates" | "review_required";
}

export interface QueryTaskReviewBundleResult {
  taskId: string;
  bundle: ReviewBundleSnapshot;
  deltaPacket: EvidenceDeltaPacketSnapshot;
  visibleSuggestions: readonly SuggestionEnvelopeSnapshot[];
  shadowSuggestions: readonly SuggestionEnvelopeSnapshot[];
}

export interface QueryTaskReviewSuggestionResult {
  taskId: string;
  visibleSuggestions: readonly SuggestionEnvelopeSnapshot[];
  shadowSuggestions: readonly SuggestionEnvelopeSnapshot[];
}

export interface ReviewBundleScenarioResult {
  scenarioId: ReviewBundleScenarioId;
  publicationState: ReviewBundlePublicationState;
  summaryVisibilityState: DeterministicReviewSummary["visibilityState"];
  deltaClass: EvidenceDeltaPacketSnapshot["deltaClass"];
  invalidationTypes: readonly ReviewActionInvalidation["invalidationType"][];
  rulesVisibility: readonly ReviewSuggestionVisibilityState[];
  shadowVisibility: readonly ReviewSuggestionVisibilityState[];
}

export interface ReviewBundleAssemblerApplication {
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly querySurfaces: typeof PHASE3_REVIEW_BUNDLE_QUERY_SURFACES;
  readonly routes: typeof reviewBundleRoutes;
  readonly schemaVersion: typeof PHASE3_REVIEW_BUNDLE_SCHEMA_VERSION;
  readonly serviceName: typeof PHASE3_REVIEW_BUNDLE_ASSEMBLER_SERVICE_NAME;
  readonly parallelInterfaceGaps: typeof reviewBundleParallelInterfaceGaps;
  queryTaskReviewBundle(taskId: string): Promise<QueryTaskReviewBundleResult>;
  queryTaskReviewSuggestions(taskId: string): Promise<QueryTaskReviewSuggestionResult>;
  simulation: {
    applyParityState(taskId: string, parityState: ReviewBundleParityState): Promise<void>;
    applyDuplicateReversal(taskId: string): Promise<void>;
    applyDecisionEpochSupersession(taskId: string): Promise<void>;
    applyTranscriptAbsentLargeAttachment(taskId: string): Promise<void>;
    runScenarioById(scenarioId: ReviewBundleScenarioId): Promise<ReviewBundleScenarioResult>;
    runAllScenarios(): Promise<readonly ReviewBundleScenarioResult[]>;
  };
}

function collectTimelineSummary(entries: readonly ReviewTimelineEntry[]): readonly string[] {
  return entries.map(
    (entry) =>
      `${entry.channel}:${entry.authoredBy}:${entry.authoritativeOutcomeState}:${entry.summary}`,
  );
}

function collectAllSourceArtifactRefs(source: ReviewBundleSourceRecord): readonly string[] {
  return uniqueSorted([
    ...source.requestSummary.sourceArtifactRefs,
    ...source.structuredAnswers.flatMap((entry) => entry.sourceArtifactRefs),
    ...source.patientNarrative.sourceArtifactRefs,
    ...source.safetyScreening.sourceArtifactRefs,
    ...source.transcript.sourceArtifactRefs,
    ...source.attachments.flatMap((entry) =>
      [entry.sourceArtifactRef, entry.previewArtifactRef].filter((value): value is string => value !== null),
    ),
    ...source.identitySummary.sourceArtifactRefs,
    ...source.contactPreferenceSummary.sourceArtifactRefs,
    ...source.priorPatientResponses.flatMap((entry) =>
      [
        ...entry.sourceArtifactRefs,
        entry.expectationEnvelopeRef,
      ].filter((value): value is string => value !== null),
    ),
    ...source.duplicateClusterStatus.sourceArtifactRefs,
    ...source.latestSlaState.sourceArtifactRefs,
    source.captureBundleRef,
    source.evidenceSnapshotRef,
    source.evidenceSummaryParityRef,
  ]);
}

function validateRequiredEvidence(source: ReviewBundleSourceRecord): {
  missingRequiredEvidenceFamilies: readonly string[];
  missingRequiredProvenance: readonly string[];
} {
  const checks = [
    {
      key: "request_summary",
      hasContent: source.requestSummary.lines.length > 0,
      hasProvenance: source.requestSummary.sourceArtifactRefs.length > 0,
    },
    {
      key: "structured_answers",
      hasContent: source.structuredAnswers.length > 0,
      hasProvenance: source.structuredAnswers.every((entry) => entry.sourceArtifactRefs.length > 0),
    },
    {
      key: "attachments_digest",
      hasContent: source.attachments.length > 0,
      hasProvenance: source.attachments.every((entry) => entry.sourceArtifactRef.trim().length > 0),
    },
    {
      key: "safety_events",
      hasContent: source.safetyScreening.lines.length > 0,
      hasProvenance: source.safetyScreening.sourceArtifactRefs.length > 0,
    },
    {
      key: "contact_preferences",
      hasContent: source.contactPreferenceSummary.lines.length > 0,
      hasProvenance: source.contactPreferenceSummary.sourceArtifactRefs.length > 0,
    },
    {
      key: "identity_confidence",
      hasContent: source.identitySummary.lines.length > 0,
      hasProvenance: source.identitySummary.sourceArtifactRefs.length > 0,
    },
  ];

  return {
    missingRequiredEvidenceFamilies: checks
      .filter((entry) => !entry.hasContent)
      .map((entry) => entry.key),
    missingRequiredProvenance: checks
      .filter((entry) => entry.hasContent && !entry.hasProvenance)
      .map((entry) => entry.key),
  };
}

function buildActionInvalidations(
  source: ReviewBundleSourceRecord,
  assembledAt: string,
): ReviewActionInvalidation[] {
  const invalidations: ReviewActionInvalidation[] = [];
  const pushInvalidation = (
    invalidationType: ReviewActionInvalidation["invalidationType"],
    priorRef: string | null,
    currentRef: string | null,
    reason: string,
  ) => {
    invalidations.push({
      invalidationRef: buildReviewProjectionRef("review_invalidation", {
        taskId: source.taskId,
        invalidationType,
        priorRef,
        currentRef,
        assembledAt,
      }),
      invalidationType,
      priorRef,
      currentRef,
      reason,
    });
  };

  if (source.baseline.endpointAssumptionRef !== source.current.endpointAssumptionRef) {
    pushInvalidation(
      "endpoint_assumption_drift",
      source.baseline.endpointAssumptionRef,
      source.current.endpointAssumptionRef,
      "Endpoint assumptions changed since the last acknowledged snapshot.",
    );
  }
  if (source.baseline.approvalPostureRef !== source.current.approvalPostureRef) {
    pushInvalidation(
      "approval_posture_changed",
      source.baseline.approvalPostureRef,
      source.current.approvalPostureRef,
      "Approval posture changed since the last acknowledged snapshot.",
    );
  }
  if (source.baseline.ownershipRef !== source.current.ownershipRef) {
    pushInvalidation(
      "ownership_changed",
      source.baseline.ownershipRef,
      source.current.ownershipRef,
      "Ownership changed and the reviewer must recheck responsibility.",
    );
  }
  if (source.baseline.duplicateResolutionRef !== source.current.duplicateResolutionRef) {
    pushInvalidation(
      "duplicate_lineage_supersession",
      source.baseline.duplicateResolutionRef,
      source.current.duplicateResolutionRef,
      "Duplicate lineage truth changed and prior assumptions remain as superseded context.",
    );
  }
  if (source.current.duplicateDecisionClass !== source.baseline.duplicateDecisionClass) {
    pushInvalidation(
      "duplicate_lineage_supersession",
      source.baseline.duplicateDecisionClass,
      source.current.duplicateDecisionClass,
      "Duplicate decision class changed and prior attach or split posture must be rechecked.",
    );
  }

  return invalidations;
}

function buildChangeMarkers(
  source: ReviewBundleSourceRecord,
  invalidations: readonly ReviewActionInvalidation[],
): readonly ReviewChangeMarker[] {
  const changes: ReviewChangeMarker[] = [];
  const currentEvidenceSet = new Set(source.current.newEvidenceRefs);

  for (const evidenceRef of currentEvidenceSet) {
    changes.push({
      changeRef: buildReviewProjectionRef("review_change", {
        taskId: source.taskId,
        changeType: "new_evidence",
        evidenceRef,
      }),
      changeType: "new_evidence",
      fieldRef: evidenceRef,
      summary: `New evidence ${evidenceRef} arrived after the last acknowledged snapshot.`,
    });
  }

  for (const contradictionRef of source.current.contradictionRefs) {
    changes.push({
      changeRef: buildReviewProjectionRef("review_change", {
        taskId: source.taskId,
        changeType: "contradiction",
        contradictionRef,
      }),
      changeType: "contradiction",
      fieldRef: contradictionRef,
      summary: `Contradiction ${contradictionRef} requires explicit reviewer confirmation.`,
    });
  }

  for (const invalidation of invalidations) {
    const changeType =
      invalidation.invalidationType === "ownership_changed"
        ? "ownership"
        : invalidation.invalidationType === "approval_posture_changed"
          ? "approval_posture"
          : invalidation.invalidationType === "endpoint_assumption_drift"
            ? "endpoint_assumption"
            : invalidation.invalidationType === "decision_epoch_supersession"
              ? "endpoint_assumption"
              : "duplicate_lineage";
    changes.push({
      changeRef: buildReviewProjectionRef("review_change", {
        taskId: source.taskId,
        changeType,
        invalidationRef: invalidation.invalidationRef,
      }),
      changeType,
      fieldRef: invalidation.invalidationRef,
      summary: invalidation.reason,
    });
  }

  if (source.baseline.transcriptState !== source.current.transcriptState) {
    changes.push({
      changeRef: buildReviewProjectionRef("review_change", {
        taskId: source.taskId,
        changeType: "transcript_state",
        current: source.current.transcriptState,
      }),
      changeType: "transcript_state",
      fieldRef: "transcript_state",
      summary: `Transcript state changed to ${source.current.transcriptState}.`,
    });
  }

  if (
    stableReviewDigest(source.baseline.attachmentPreviewStates) !==
    stableReviewDigest(source.current.attachmentPreviewStates)
  ) {
    changes.push({
      changeRef: buildReviewProjectionRef("review_change", {
        taskId: source.taskId,
        changeType: "attachment_preview",
        current: source.current.attachmentPreviewStates,
      }),
      changeType: "attachment_preview",
      fieldRef: "attachment_preview_state",
      summary: "Attachment preview availability changed since the last acknowledged snapshot.",
    });
  }

  return changes;
}

function buildSupersededJudgmentContext(
  source: ReviewBundleSourceRecord,
  invalidations: readonly ReviewActionInvalidation[],
): readonly ReviewSupersededJudgmentContext[] {
  return invalidations.map<ReviewSupersededJudgmentContext>((entry) => ({
    contextRef: buildReviewProjectionRef("review_superseded_context", {
      taskId: source.taskId,
      invalidationRef: entry.invalidationRef,
    }),
    contextType:
      entry.invalidationType === "endpoint_assumption_drift"
        ? "endpoint_assumption"
        : entry.invalidationType === "approval_posture_changed"
          ? "approval_posture"
          : entry.invalidationType === "ownership_changed"
            ? "ownership"
            : entry.invalidationType === "decision_epoch_supersession"
              ? "decision_epoch"
              : "duplicate_lineage",
    priorRef: entry.priorRef ?? "none",
    currentRef: entry.currentRef,
    reason: entry.reason,
  }));
}

function buildDeltaPacket(
  source: ReviewBundleSourceRecord,
  taskSnapshot: ReviewBundleTaskView,
  assembledAt: string,
): EvidenceDeltaPacketSnapshot {
  const invalidations = buildActionInvalidations(source, assembledAt);
  if (taskSnapshot.latestDecisionSupersessionRef !== null) {
    invalidations.push({
      invalidationRef: buildReviewProjectionRef("review_invalidation", {
        taskId: source.taskId,
        invalidationType: "decision_epoch_supersession",
        currentDecisionEpochRef: taskSnapshot.currentDecisionEpochRef,
        latestDecisionSupersessionRef: taskSnapshot.latestDecisionSupersessionRef,
      }),
      invalidationType: "decision_epoch_supersession",
      priorRef: taskSnapshot.currentDecisionEpochRef,
      currentRef: taskSnapshot.latestDecisionSupersessionRef,
      reason: "DecisionEpoch supersession invalidates stale preview-coupled bundle outputs.",
    });
  }
  const changes = buildChangeMarkers(source, invalidations);
  const contradictionRefs = uniqueSorted(source.current.contradictionRefs);
  const changedFieldRefs = uniqueSorted([
    ...changes.map((entry) => entry.fieldRef),
    ...invalidations.map((entry) => entry.invalidationRef),
  ]);
  const deltaClass = classifyReviewDeltaPacket({
    contradictions: contradictionRefs,
    actionInvalidationTypes: invalidations.map((entry) => entry.invalidationType),
    changedFieldRefs,
    newEvidenceCount: source.current.newEvidenceRefs.length,
  });
  const supersededJudgmentContext = buildSupersededJudgmentContext(source, invalidations);
  const summaryDeltaRef = buildReviewProjectionRef("review_delta_summary", {
    taskId: source.taskId,
    deltaClass,
    changedFieldRefs,
    contradictionRefs,
  });

  const packet: EvidenceDeltaPacketSnapshot = {
    evidenceDeltaPacketId: buildReviewProjectionRef("evidence_delta_packet", {
      taskId: source.taskId,
      baseline: source.baseline.snapshotRef,
      current: source.current.snapshotRef,
      changedFieldRefs,
      contradictionRefs,
      invalidationRefs: invalidations.map((entry) => entry.invalidationRef),
    }),
    taskId: source.taskId,
    baselineSnapshotRef: source.baseline.snapshotRef,
    currentSnapshotRef: source.current.snapshotRef,
    deltaClass,
    changedFieldRefs,
    contradictionRefs,
    actionInvalidations: invalidations,
    changes,
    summaryDeltaRef,
    primaryChangedAnchorRef: changes[0]?.fieldRef ?? "review_delta_none",
    supersededJudgmentContext,
    supersessionMarkerRefs: invalidations.map((entry) => entry.invalidationRef),
    acknowledgementState:
      deltaClass === "decisive"
        ? "recommit_required"
        : deltaClass === "consequential"
          ? "pending_review"
          : "acknowledged",
    returnToQuietEligibility:
      deltaClass === "decisive"
        ? "blocked"
        : deltaClass === "consequential"
          ? "on_resolve"
          : "on_ack",
    requiresExplicitReview: deltaClass === "decisive" || deltaClass === "consequential",
    deltaDigest: stableReviewDigest({
      taskId: source.taskId,
      baseline: source.baseline.snapshotRef,
      current: source.current.snapshotRef,
      changedFieldRefs,
      contradictionRefs,
      invalidations,
    }),
    generatedAt: assembledAt,
  };

  return packet;
}

function buildSuggestionEnvelopes(input: {
  source: ReviewBundleSourceRecord;
  bundle: ReviewBundleSnapshot;
  publicationState: ReviewBundlePublicationState;
  assembledAt: string;
}): {
  visibleSuggestions: readonly SuggestionEnvelopeSnapshot[];
  shadowSuggestions: readonly SuggestionEnvelopeSnapshot[];
} {
  const decisionSuperseded = input.bundle.provenance.decisionSupersessionRef !== null;
  const rulesVisibility: ReviewSuggestionVisibilityState =
    input.publicationState === "recovery_required"
      ? "blocked"
      : input.publicationState === "stale_recoverable" ||
          input.source.parityState !== "verified" ||
          decisionSuperseded
        ? "observe_only"
        : "visible";

  const common = {
    taskId: input.source.taskId,
    reviewBundleRef: input.bundle.reviewBundleId,
    priorityBand: input.source.priorityBand,
    complexityBand: input.source.complexityBand,
    candidateEndpoints: input.source.candidateEndpoints,
    recommendedQuestionSetIds: input.source.recommendedQuestionSetIds,
    reviewVersionRef: input.bundle.provenance.reviewVersion,
    decisionEpochRef: input.bundle.provenance.decisionEpochRef,
    policyBundleRef: input.source.policyBundleRef,
    lineageFenceEpoch: input.bundle.provenance.lineageFenceEpoch,
    allowedSuggestionSetHash: stableReviewDigest(
      input.source.candidateEndpoints.map((entry) => entry.endpointCode).sort(),
    ),
    authoritativeWorkflowInfluence: "advisory_only" as const,
  };

  const visibleSuggestions: readonly SuggestionEnvelopeSnapshot[] = [
    {
      suggestionEnvelopeId: buildReviewProjectionRef("suggestion_envelope", {
        taskId: input.source.taskId,
        sourceType: "rules",
        evidenceSnapshotRef: input.bundle.provenance.evidenceSnapshotRef,
        decisionEpochRef: input.bundle.provenance.decisionEpochRef,
      }),
      ...common,
      sourceType: "rules",
      suggestionVersion: "rules_suggestion_235_v1",
      rationaleBullets: input.source.rationaleBullets,
      confidenceDescriptor: input.source.confidenceDescriptor,
      visibilityState: rulesVisibility,
      staleAt: rulesVisibility === "visible" ? null : input.assembledAt,
      invalidatedAt: decisionSuperseded ? input.assembledAt : null,
    },
  ];

  const shadowSuggestions: readonly SuggestionEnvelopeSnapshot[] = [
    {
      suggestionEnvelopeId: buildReviewProjectionRef("suggestion_envelope", {
        taskId: input.source.taskId,
        sourceType: "shadow_model",
        evidenceSnapshotRef: input.bundle.provenance.evidenceSnapshotRef,
        decisionEpochRef: input.bundle.provenance.decisionEpochRef,
      }),
      ...common,
      sourceType: "shadow_model",
      suggestionVersion: "shadow_suggestion_235_v1",
      rationaleBullets: input.source.shadowRationaleBullets,
      confidenceDescriptor: input.source.shadowConfidenceDescriptor,
      visibilityState: "silent_shadow",
      staleAt: input.assembledAt,
      invalidatedAt: decisionSuperseded ? input.assembledAt : null,
    },
  ];

  return { visibleSuggestions, shadowSuggestions };
}

function assembleReviewBundle(input: {
  taskSnapshot: ReviewBundleTaskView;
  source: ReviewBundleSourceRecord;
  assembledAt: string;
}): QueryTaskReviewBundleResult {
  const evidenceValidation = validateRequiredEvidence(input.source);
  invariant(
    evidenceValidation.missingRequiredEvidenceFamilies.length === 0,
    `ReviewBundle issuance blocked. Missing evidence families: ${evidenceValidation.missingRequiredEvidenceFamilies.join(", ")}`,
  );

  const summaryVisibility = resolveReviewSummaryVisibility({
    parityState: input.source.parityState,
    missingRequiredProvenance: evidenceValidation.missingRequiredProvenance.length > 0,
  });

  const publicationState: ReviewBundlePublicationState =
    evidenceValidation.missingRequiredProvenance.length > 0 ||
    summaryVisibility.visibilityState === "suppressed"
      ? "recovery_required"
      : input.source.parityState === "verified" &&
          input.taskSnapshot.latestDecisionSupersessionRef === null &&
          input.taskSnapshot.reviewFreshnessState === "fresh"
        ? "ready"
        : "stale_recoverable";

  const deltaPacket = buildDeltaPacket(input.source, input.taskSnapshot, input.assembledAt);
  const summary = renderDeterministicReviewSummary({
    templateVersion: "deterministic_review_summary_235_v1",
    rulesVersion: input.source.rulesVersion,
    requestSummary: input.source.requestSummary.lines,
    structuredAnswers: input.source.structuredAnswers,
    patientNarrative: input.source.patientNarrative.lines.join(" "),
    safetySummary: [
      input.source.safetyScreening.headline,
      ...input.source.safetyScreening.lines,
      ...input.source.safetyScreening.matchedRuleIds.map((entry) => `rule:${entry}`),
    ],
    telephonySummary: input.source.telephony.summaryLines,
    transcriptSummary: input.source.transcript.summaryLines.join(" "),
    attachmentLabels: input.source.attachments.map(
      (entry) => `${entry.label}:${entry.previewState}:${entry.byteLength}`,
    ),
    identitySummary: input.source.identitySummary.lines,
    contactSummary: input.source.contactPreferenceSummary.lines,
    priorResponseSummary: collectTimelineSummary(input.source.priorPatientResponses),
    duplicateSummary: input.source.duplicateClusterStatus.summaryLines,
    slaSummary: input.source.latestSlaState.lines,
    visibilityState: summaryVisibility.visibilityState,
    suppressionReasonCodes: summaryVisibility.suppressionReasonCodes,
  });

  const bundleWithoutSuggestions: Omit<
    ReviewBundleSnapshot,
    "reviewBundleId" | "bundleDigest" | "visibleSuggestionEnvelopeRefs" | "hiddenSuggestionEnvelopeRefs"
  > = {
    taskId: input.source.taskId,
    requestId: input.source.requestId,
    publicationState,
    summaryVisibilityState: summary.visibilityState,
    provenance: {
      reviewVersion: input.taskSnapshot.reviewVersion,
      evidenceSnapshotRef: input.source.evidenceSnapshotRef,
      captureBundleRef: input.source.captureBundleRef,
      evidenceSummaryParityRef: input.source.evidenceSummaryParityRef,
      lineageFenceEpoch: input.taskSnapshot.currentLineageFenceEpoch,
      decisionEpochRef: input.taskSnapshot.currentDecisionEpochRef,
      decisionSupersessionRef: input.taskSnapshot.latestDecisionSupersessionRef,
    },
    requestSummary: input.source.requestSummary,
    structuredAnswers: input.source.structuredAnswers,
    patientNarrative: input.source.patientNarrative,
    safetyScreening: input.source.safetyScreening,
    telephony: {
      headline: "Telephony metadata",
      lines: input.source.telephony.summaryLines,
      sourceArtifactRefs: input.source.telephony.callSessionRef
        ? [input.source.telephony.callSessionRef]
        : [],
      callSessionRef: input.source.telephony.callSessionRef,
    },
    transcript: {
      headline: "Transcript stub",
      lines: input.source.transcript.summaryLines,
      sourceArtifactRefs: input.source.transcript.sourceArtifactRefs,
      transcriptState: input.source.transcript.transcriptState,
      placeholderState:
        input.source.transcript.transcriptState === "missing" ? "missing" : undefined,
    },
    attachments: input.source.attachments,
    identitySummary: input.source.identitySummary,
    contactPreferenceSummary: input.source.contactPreferenceSummary,
    priorPatientResponses: input.source.priorPatientResponses,
    duplicateClusterStatus: {
      headline: "Duplicate cluster status",
      lines: input.source.duplicateClusterStatus.summaryLines,
      sourceArtifactRefs: input.source.duplicateClusterStatus.sourceArtifactRefs,
      duplicateClusterRef: input.source.duplicateClusterStatus.duplicateClusterRef,
      decisionClass: input.source.duplicateClusterStatus.decisionClass,
    },
    latestSlaState: input.source.latestSlaState,
    deterministicSummary: summary,
    sourceArtifactRefs: collectAllSourceArtifactRefs(input.source),
    deltaPacketRef: deltaPacket.evidenceDeltaPacketId,
    gapArtifactRefs: input.source.gapArtifactRefs,
    assembledAt: input.assembledAt,
  };

  const provisionalBundleId = buildReviewProjectionRef("review_bundle", {
    taskId: input.source.taskId,
    requestId: input.source.requestId,
    provenance: bundleWithoutSuggestions.provenance,
    summaryDigest: summary.summaryDigest,
    deltaDigest: deltaPacket.deltaDigest,
  });

  const suggestionSets = buildSuggestionEnvelopes({
    source: input.source,
    bundle: {
      ...bundleWithoutSuggestions,
      reviewBundleId: provisionalBundleId,
      bundleDigest: stableReviewDigest({
        provisionalBundleId,
        summaryDigest: summary.summaryDigest,
        deltaDigest: deltaPacket.deltaDigest,
      }),
      visibleSuggestionEnvelopeRefs: [],
      hiddenSuggestionEnvelopeRefs: [],
    },
    publicationState,
    assembledAt: input.assembledAt,
  });

  const bundleDigest = stableReviewDigest({
    taskId: input.source.taskId,
    requestId: input.source.requestId,
    publicationState,
    summaryDigest: summary.summaryDigest,
    deltaDigest: deltaPacket.deltaDigest,
    parityState: input.source.parityState,
    visibleSuggestions: suggestionSets.visibleSuggestions.map((entry) => entry.suggestionEnvelopeId),
    hiddenSuggestions: suggestionSets.shadowSuggestions.map((entry) => entry.suggestionEnvelopeId),
  });

  const bundle: ReviewBundleSnapshot = {
    reviewBundleId: provisionalBundleId,
    ...bundleWithoutSuggestions,
    visibleSuggestionEnvelopeRefs: suggestionSets.visibleSuggestions.map(
      (entry) => entry.suggestionEnvelopeId,
    ),
    hiddenSuggestionEnvelopeRefs: suggestionSets.shadowSuggestions.map(
      (entry) => entry.suggestionEnvelopeId,
    ),
    bundleDigest,
  };

  return {
    taskId: input.source.taskId,
    bundle,
    deltaPacket,
    visibleSuggestions: suggestionSets.visibleSuggestions,
    shadowSuggestions: suggestionSets.shadowSuggestions,
  };
}

function createBaseFixtureSource(): ReviewBundleSourceRecord {
  return {
    taskId: PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID,
    requestId: "request_235_review_primary",
    requestSummary: {
      headline: "Canonical request summary",
      lines: [
        "Persistent headache for three days after a normal weekend.",
        "Patient asks whether further review is needed before self-care advice.",
      ],
      sourceArtifactRefs: ["request_summary_projection_235_primary"],
    },
    structuredAnswers: [
      {
        questionId: "q_headache_duration",
        question: "Headache duration",
        answer: "Three days",
        sourceArtifactRefs: ["structured_answer_235_duration"],
      },
      {
        questionId: "q_headache_severity",
        question: "Headache severity",
        answer: "8 out of 10 overnight, 5 out of 10 by morning",
        sourceArtifactRefs: ["structured_answer_235_severity"],
      },
      {
        questionId: "q_headache_red_flags",
        question: "Red flag symptoms",
        answer: "No collapse, seizure, or unilateral weakness reported",
        sourceArtifactRefs: ["structured_answer_235_red_flags"],
      },
    ],
    patientNarrative: {
      headline: "Original patient narrative",
      lines: [
        "The pain is worse late at night and after looking at screens, but it improves with rest.",
      ],
      sourceArtifactRefs: ["patient_narrative_235_primary"],
    },
    safetyScreening: {
      headline: "Safety screen",
      lines: ["Residual risk remains routine; no urgent diversion rule matched."],
      matchedRuleIds: ["rule_headache_urgent_001", "rule_neuro_red_flags_004"],
      sourceArtifactRefs: ["workspace_safety_interrupt_projection_235_primary"],
    },
    telephony: {
      callSessionRef: "call_session_235_primary",
      summaryLines: [
        "Inbound continuation call verified against the active request lineage.",
        "Callback expectation envelope reports on_track for the current promised window.",
      ],
    },
    transcript: {
      transcriptState: "present",
      summaryLines: [
        "Caller confirmed the overnight pain spike but denied acute neurological change.",
      ],
      sourceArtifactRefs: ["transcript_stub_235_primary"],
    },
    attachments: [
      {
        attachmentRef: "attachment_235_pain_diary",
        label: "pain-diary.pdf",
        mediaType: "application/pdf",
        byteLength: 218443,
        previewState: "available",
        sourceArtifactRef: "attachment_digest_235_pain_diary",
        previewArtifactRef: "attachment_preview_235_pain_diary",
      },
      {
        attachmentRef: "attachment_235_bp_photo",
        label: "bp-reading.jpg",
        mediaType: "image/jpeg",
        byteLength: 68124,
        previewState: "summary_only",
        sourceArtifactRef: "attachment_digest_235_bp_photo",
        previewArtifactRef: null,
      },
    ],
    identitySummary: {
      headline: "Identity and match confidence",
      lines: [
        "Authenticated subject matches the request lineage.",
        "Identity confidence band is medium because the overnight callback path still depends on telephony continuation history.",
      ],
      sourceArtifactRefs: ["identity_confidence_digest_235_primary"],
    },
    contactPreferenceSummary: {
      headline: "Contact preference summary",
      lines: [
        "Portal reply allowed.",
        "SMS is preferred for callback coordination.",
        "Email is summary-only because delivery confidence is reduced.",
      ],
      sourceArtifactRefs: ["contact_preference_truth_235_primary"],
    },
    priorPatientResponses: [
      {
        entryRef: "timeline_entry_235_more_info",
        channel: "portal",
        authoredBy: "patient",
        sentAt: "2026-04-16T08:10:00.000Z",
        summary: "Patient replied to the more-info cycle with a pain diary and blood pressure reading.",
        authoritativeOutcomeState: "awaiting_review",
        deliveryRiskState: "on_track",
        sourceArtifactRefs: [
          "patient_conversation_preview_digest_235_primary",
          "thread_expectation_envelope_235_primary",
        ],
        expectationEnvelopeRef: "thread_expectation_envelope_235_primary",
      },
      {
        entryRef: "timeline_entry_235_callback",
        channel: "phone",
        authoredBy: "support",
        sentAt: "2026-04-16T08:45:00.000Z",
        summary: "Support callback promise remains active for same-day follow-up if triage needs clarification.",
        authoritativeOutcomeState: "callback_scheduled",
        deliveryRiskState: "on_track",
        sourceArtifactRefs: ["callback_expectation_envelope_235_primary"],
        expectationEnvelopeRef: "callback_expectation_envelope_235_primary",
      },
    ],
    duplicateClusterStatus: {
      duplicateClusterRef: "duplicate_cluster_235_primary",
      decisionClass: "same_request_attach",
      summaryLines: [
        "Duplicate review currently points to the same request lineage and remains safe for one joined review bundle.",
      ],
      sourceArtifactRefs: ["duplicate_review_snapshot_235_primary"],
      resolutionRef: "duplicate_resolution_decision_235_attach",
    },
    latestSlaState: {
      headline: "Latest SLA state",
      lines: ["SLA remains on track but will breach if review is deferred beyond 11:30Z."],
      sourceArtifactRefs: ["sla_digest_235_primary"],
      slaState: "at_risk",
    },
    captureBundleRef: "capture_bundle_235_primary",
    evidenceSnapshotRef: "evidence_snapshot_235_current",
    evidenceSummaryParityRef: "evidence_summary_parity_235_primary",
    parityState: "verified",
    parityPolicyVersion: "parity_policy_235_v1",
    rulesVersion: "review_rules_235_v1",
    policyBundleRef: "compiled_policy_bundle_235_v1",
    baseline: {
      snapshotRef: "evidence_snapshot_235_acknowledged",
      endpointAssumptionRef: "endpoint_primary_care_followup",
      approvalPostureRef: "approval_not_required",
      ownershipRef: "reviewer_235_primary",
      duplicateResolutionRef: "duplicate_resolution_decision_235_attach",
      duplicateDecisionClass: "same_request_attach",
      transcriptState: "missing",
      attachmentPreviewStates: [
        "attachment_235_pain_diary:summary_only",
        "attachment_235_bp_photo:summary_only",
      ],
      newEvidenceRefs: [],
      contradictionRefs: [],
    },
    current: {
      snapshotRef: "evidence_snapshot_235_current",
      endpointAssumptionRef: "endpoint_primary_care_followup",
      approvalPostureRef: "approval_not_required",
      ownershipRef: "reviewer_235_primary",
      duplicateResolutionRef: "duplicate_resolution_decision_235_attach",
      duplicateDecisionClass: "same_request_attach",
      transcriptState: "present",
      attachmentPreviewStates: [
        "attachment_235_pain_diary:available",
        "attachment_235_bp_photo:summary_only",
      ],
      newEvidenceRefs: ["patient_reply_artifact_235_primary", "transcript_stub_235_primary"],
      contradictionRefs: [],
    },
    candidateEndpoints: [
      {
        endpointRef: "endpoint_candidate_235_primary_care",
        endpointCode: "primary_care_followup",
        rationale: "Persistent pain without acute red flags remains reviewable in routine follow-up.",
        supportingEvidenceRefs: [
          "request_summary_projection_235_primary",
          "workspace_safety_interrupt_projection_235_primary",
        ],
      },
      {
        endpointRef: "endpoint_candidate_235_more_info",
        endpointCode: "more_info_recheck",
        rationale: "If the diary and transcript diverge, more-info can still clarify chronology.",
        supportingEvidenceRefs: [
          "patient_conversation_preview_digest_235_primary",
          "transcript_stub_235_primary",
        ],
      },
    ],
    recommendedQuestionSetIds: ["question_set_headache_trajectory_235"],
    rationaleBullets: [
      "No urgent rule matched on the current parity-verified snapshot.",
      "The new diary evidence changes chronology but does not create a decisive contradiction.",
      "Support callback remains available if chronology still feels unclear.",
    ],
    priorityBand: "elevated",
    complexityBand: "moderate",
    confidenceDescriptor: "rules_guidance_medium",
    shadowRationaleBullets: [
      "Hidden comparison seam keeps a lower-confidence self-care hypothesis for future audit only.",
    ],
    shadowConfidenceDescriptor: "shadow_hidden_low",
    gapArtifactRefs: ["PARALLEL_INTERFACE_GAP_PHASE3_REVIEW_BUNDLE_STACK"],
  };
}

class ReviewBundleAssemblerApplicationImpl implements ReviewBundleAssemblerApplication {
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly querySurfaces = PHASE3_REVIEW_BUNDLE_QUERY_SURFACES;
  readonly routes = reviewBundleRoutes;
  readonly schemaVersion = PHASE3_REVIEW_BUNDLE_SCHEMA_VERSION;
  readonly serviceName = PHASE3_REVIEW_BUNDLE_ASSEMBLER_SERVICE_NAME;
  readonly parallelInterfaceGaps = reviewBundleParallelInterfaceGaps;
  readonly simulation;

  private readonly sources = new Map<string, ReviewBundleSourceRecord>();

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
  }) {
    this.triageApplication = options?.triageApplication ?? createPhase3TriageKernelApplication();
    this.simulation = {
      applyParityState: async (taskId: string, parityState: ReviewBundleParityState) => {
        await this.seedFixture(taskId);
        const source = this.requireSource(taskId);
        source.parityState = parityState;
        source.evidenceSummaryParityRef = `evidence_summary_parity_235_${parityState}`;
        this.sources.set(taskId, source);
        await this.persistTaskReviewState(taskId, {
          reviewFreshnessState: parityState === "verified" ? "fresh" : "review_required",
          latestDecisionSupersessionRef: null,
          reviewVersionIncrement: 1,
        });
      },
      applyDuplicateReversal: async (taskId: string) => {
        await this.seedFixture(taskId);
        const source = this.requireSource(taskId);
        source.evidenceSnapshotRef = "evidence_snapshot_235_duplicate_reversal";
        source.current = {
          ...source.current,
          snapshotRef: "evidence_snapshot_235_duplicate_reversal",
          duplicateResolutionRef: "duplicate_resolution_decision_235_separate_request",
          duplicateDecisionClass: "separate_request",
          newEvidenceRefs: [...source.current.newEvidenceRefs, "duplicate_pair_evidence_235_reversal"],
          contradictionRefs: ["duplicate_conflict_235_reversal"],
        };
        source.duplicateClusterStatus = {
          ...source.duplicateClusterStatus,
          decisionClass: "separate_request",
          resolutionRef: "duplicate_resolution_decision_235_separate_request",
          summaryLines: [
            "Duplicate review now requires separate request handling and invalidates the prior joined assumption.",
          ],
          sourceArtifactRefs: ["duplicate_review_snapshot_235_reversal"],
        };
        source.rationaleBullets = [
          "Rules guidance is frozen to observe-only because duplicate lineage truth changed.",
          "Prior same-request attach assumptions remain visible as superseded context.",
        ];
        this.sources.set(taskId, source);
        await this.persistTaskReviewState(taskId, {
          reviewFreshnessState: "review_required",
          latestDecisionSupersessionRef: null,
          duplicateClusterRef: source.duplicateClusterStatus.duplicateClusterRef,
          reviewVersionIncrement: 1,
        });
      },
      applyDecisionEpochSupersession: async (taskId: string) => {
        await this.seedFixture(taskId);
        const source = this.requireSource(taskId);
        source.current = {
          ...source.current,
          endpointAssumptionRef: "endpoint_escalated_review",
          approvalPostureRef: "approval_required",
          newEvidenceRefs: [...source.current.newEvidenceRefs, "endpoint_preview_rebuild_235"],
        };
        source.latestSlaState = {
          ...source.latestSlaState,
          lines: ["SLA remains active but commit posture is frozen until the new decision epoch is reviewed."],
        };
        this.sources.set(taskId, source);
        await this.persistTaskReviewState(taskId, {
          reviewFreshnessState: "review_required",
          latestDecisionSupersessionRef: "decision_supersession_record_235_primary",
          reviewVersionIncrement: 1,
        });
      },
      applyTranscriptAbsentLargeAttachment: async (taskId: string) => {
        await this.seedFixture(taskId);
        const source = this.requireSource(taskId);
        source.transcript = {
          transcriptState: "missing",
          summaryLines: ["Transcript has not arrived yet; summary remains source-artifact first."],
          sourceArtifactRefs: ["transcript_placeholder_contract_235_missing"],
        };
        source.attachments = source.attachments.map((entry, index) =>
          index === 0
            ? {
                ...entry,
                byteLength: 5_842_118,
                previewState: "preview_unavailable",
                previewArtifactRef: null,
              }
            : entry,
        );
        source.current = {
          ...source.current,
          transcriptState: "missing",
          attachmentPreviewStates: source.attachments.map(
            (entry) => `${entry.attachmentRef}:${entry.previewState}`,
          ),
          newEvidenceRefs: ["late_attachment_manifest_235"],
        };
        source.parityState = "verified";
        this.sources.set(taskId, source);
        await this.persistTaskReviewState(taskId, {
          reviewFreshnessState: "fresh",
          latestDecisionSupersessionRef: null,
          reviewVersionIncrement: 1,
        });
      },
      runScenarioById: async (scenarioId: ReviewBundleScenarioId) => {
        const application = createReviewBundleAssemblerApplication();
        await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);
        switch (scenarioId) {
          case "verified_bundle_with_transcript":
            break;
          case "stale_parity_suppresses_authoritative_summary":
            await application.simulation.applyParityState(
              PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID,
              "stale",
            );
            break;
          case "duplicate_reversal_requires_rebuild":
            await application.simulation.applyDuplicateReversal(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);
            break;
          case "decision_epoch_supersession_invalidates_preview_bundle":
            await application.simulation.applyDecisionEpochSupersession(
              PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID,
            );
            break;
          case "transcript_absent_and_large_attachments_degrade_safely":
            await application.simulation.applyTranscriptAbsentLargeAttachment(
              PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID,
            );
            break;
        }

        const result = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);
        return {
          scenarioId,
          publicationState: result.bundle.publicationState,
          summaryVisibilityState: result.bundle.summaryVisibilityState,
          deltaClass: result.deltaPacket.deltaClass,
          invalidationTypes: result.deltaPacket.actionInvalidations.map(
            (entry) => entry.invalidationType,
          ),
          rulesVisibility: result.visibleSuggestions.map((entry) => entry.visibilityState),
          shadowVisibility: result.shadowSuggestions.map((entry) => entry.visibilityState),
        };
      },
      runAllScenarios: async () => {
        const results: ReviewBundleScenarioResult[] = [];
        for (const scenarioId of reviewBundleScenarioIds) {
          results.push(await this.simulation.runScenarioById(scenarioId));
        }
        return results;
      },
    };
  }

  async queryTaskReviewBundle(taskId: string): Promise<QueryTaskReviewBundleResult> {
    await this.seedFixture(taskId);
    const task = await this.requireTask(taskId);
    const source = this.requireSource(taskId);
    return assembleReviewBundle({
      taskSnapshot: task.toSnapshot(),
      source,
      assembledAt: "2026-04-16T12:00:00.000Z",
    });
  }

  async queryTaskReviewSuggestions(taskId: string): Promise<QueryTaskReviewSuggestionResult> {
    const result = await this.queryTaskReviewBundle(taskId);
    return {
      taskId,
      visibleSuggestions: result.visibleSuggestions,
      shadowSuggestions: result.shadowSuggestions,
    };
  }

  private async seedFixture(taskId: string): Promise<void> {
    if (this.sources.has(taskId)) {
      return;
    }

    const existingTask = await this.triageApplication.triageRepositories.getTask(taskId);
    if (!existingTask) {
      const taskInput: CreatePhase3KernelTaskInput = {
        taskId,
        requestId: "request_235_review_primary",
        queueKey: "repair",
        sourceQueueRankSnapshotRef: "queue_rank_snapshot_235_primary",
        returnAnchorRef: "queue_row_235_primary",
        returnAnchorTupleHash: "queue_row_235_primary_hash",
        selectedAnchorRef: "anchor_review_summary_235_primary",
        selectedAnchorTupleHash: "anchor_review_summary_235_primary_hash",
        workspaceTrustEnvelopeRef: "workspace_trust_envelope_235_primary",
        surfaceRouteContractRef: "route_contract_workspace_review_bundle_v1",
        surfacePublicationRef: "surface_publication_review_bundle_v1",
        runtimePublicationBundleRef: "runtime_publication_review_bundle_v1",
        taskCompletionSettlementEnvelopeRef: "task_completion_envelope_235_primary",
        createdAt: "2026-04-16T09:30:00.000Z",
        episodeId: "episode_235_review_primary",
        requestLineageRef: "request_lineage_235_review_primary",
      };
      await this.triageApplication.createTask(taskInput);
      await this.triageApplication.moveTaskToQueue({
        taskId,
        actorRef: "reviewer_235_primary",
        queuedAt: "2026-04-16T09:31:00.000Z",
      });
      await this.triageApplication.claimTask({
        taskId,
        actorRef: "reviewer_235_primary",
        claimedAt: "2026-04-16T09:32:00.000Z",
      });
      await this.triageApplication.enterReview({
        taskId,
        actorRef: "reviewer_235_primary",
        openedAt: "2026-04-16T09:33:00.000Z",
        staffWorkspaceConsistencyProjectionRef: "workspace_consistency_projection_235_primary",
        workspaceSliceTrustProjectionRef: "workspace_slice_trust_projection_235_primary",
        audienceSurfaceRuntimeBindingRef: "audience_surface_runtime_binding_235_primary",
        reviewActionLeaseRef: "review_action_lease_235_primary",
        selectedAnchorRef: "anchor_review_summary_235_primary",
        selectedAnchorTupleHashRef: "anchor_review_summary_235_primary_hash",
      });
    }

    this.sources.set(taskId, createBaseFixtureSource());
    await this.persistTaskReviewState(taskId, {
      reviewFreshnessState: "fresh",
      currentDecisionEpochRef: "decision_epoch_235_primary",
      currentEndpointDecisionRef: "endpoint_decision_235_primary",
      latestDecisionSupersessionRef: null,
      duplicateClusterRef: "duplicate_cluster_235_primary",
      reviewVersionIncrement: 0,
    });
  }

  private async persistTaskReviewState(
    taskId: string,
    updates: {
      reviewFreshnessState: "fresh" | "queued_updates" | "review_required";
      currentDecisionEpochRef?: string | null;
      currentEndpointDecisionRef?: string | null;
      latestDecisionSupersessionRef?: string | null;
      duplicateClusterRef?: string | null;
      reviewVersionIncrement: number;
    },
  ): Promise<void> {
    const task = await this.requireTask(taskId);
    const snapshot = task.toSnapshot();
    const nextTask = task.update({
      reviewFreshnessState: updates.reviewFreshnessState,
      currentDecisionEpochRef:
        updates.currentDecisionEpochRef !== undefined
          ? updates.currentDecisionEpochRef
          : snapshot.currentDecisionEpochRef,
      currentEndpointDecisionRef:
        updates.currentEndpointDecisionRef !== undefined
          ? updates.currentEndpointDecisionRef
          : snapshot.currentEndpointDecisionRef,
      latestDecisionSupersessionRef:
        updates.latestDecisionSupersessionRef !== undefined
          ? updates.latestDecisionSupersessionRef
          : snapshot.latestDecisionSupersessionRef,
      duplicateClusterRef:
        updates.duplicateClusterRef !== undefined
          ? updates.duplicateClusterRef
          : snapshot.duplicateClusterRef,
      reviewVersion: snapshot.reviewVersion + updates.reviewVersionIncrement,
      updatedAt: "2026-04-16T11:59:00.000Z",
    });
    await this.triageApplication.triageRepositories.saveTask(nextTask, {
      expectedVersion: task.version,
    });
  }

  private async requireTask(taskId: string) {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, `TriageTask ${taskId} is required.`);
    return task;
  }

  private requireSource(taskId: string): ReviewBundleSourceRecord {
    const source = this.sources.get(taskId);
    invariant(source, `Review source ${taskId} is required.`);
    return clone(source);
  }
}

export function createReviewBundleAssemblerApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
}): ReviewBundleAssemblerApplication {
  return new ReviewBundleAssemblerApplicationImpl(options);
}
