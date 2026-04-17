import { createHash } from "node:crypto";

export type ReviewBundleParityState = "verified" | "stale" | "blocked" | "superseded";
export type ReviewBundlePublicationState = "ready" | "stale_recoverable" | "recovery_required";
export type ReviewSummaryVisibilityState = "authoritative" | "provisional" | "suppressed";
export type ReviewSuggestionSourceType = "rules" | "shadow_model";
export type ReviewSuggestionVisibilityState =
  | "visible"
  | "observe_only"
  | "silent_shadow"
  | "blocked";
export type ReviewSuggestionPriorityBand = "urgent" | "elevated" | "routine";
export type ReviewSuggestionComplexityBand = "low" | "moderate" | "high";
export type ReviewDeltaClass = "decisive" | "consequential" | "contextual" | "clerical";
export type ReviewDeltaAcknowledgementState =
  | "pending_review"
  | "acknowledged"
  | "recommit_required";
export type ReviewDeltaReturnToQuietEligibility = "blocked" | "on_ack" | "on_resolve";
export type ReviewAttachmentPreviewState = "available" | "preview_unavailable" | "summary_only";
export type ReviewTranscriptState = "present" | "missing" | "late_arriving";

export interface ReviewTextSection {
  headline: string;
  lines: readonly string[];
  sourceArtifactRefs: readonly string[];
  placeholderState?: "present" | "missing" | "preview_unavailable";
}

export interface ReviewStructuredAnswer {
  questionId: string;
  question: string;
  answer: string;
  sourceArtifactRefs: readonly string[];
}

export interface ReviewAttachmentPreview {
  attachmentRef: string;
  label: string;
  mediaType: string;
  byteLength: number;
  previewState: ReviewAttachmentPreviewState;
  sourceArtifactRef: string;
  previewArtifactRef: string | null;
}

export interface ReviewTimelineEntry {
  entryRef: string;
  channel: "portal" | "sms" | "email" | "phone" | "support";
  authoredBy: "patient" | "clinician" | "practice" | "support" | "system";
  sentAt: string;
  summary: string;
  authoritativeOutcomeState: string;
  deliveryRiskState: string | null;
  sourceArtifactRefs: readonly string[];
  expectationEnvelopeRef: string | null;
}

export interface ReviewSupersededJudgmentContext {
  contextRef: string;
  contextType:
    | "endpoint_assumption"
    | "approval_posture"
    | "ownership"
    | "duplicate_lineage"
    | "decision_epoch";
  priorRef: string;
  currentRef: string | null;
  reason: string;
}

export interface ReviewActionInvalidation {
  invalidationRef: string;
  invalidationType:
    | "endpoint_assumption_drift"
    | "approval_posture_changed"
    | "ownership_changed"
    | "duplicate_lineage_supersession"
    | "decision_epoch_supersession";
  priorRef: string | null;
  currentRef: string | null;
  reason: string;
}

export interface ReviewChangeMarker {
  changeRef: string;
  changeType:
    | "new_evidence"
    | "contradiction"
    | "endpoint_assumption"
    | "approval_posture"
    | "ownership"
    | "duplicate_lineage"
    | "attachment_preview"
    | "transcript_state";
  fieldRef: string;
  summary: string;
}

export interface DeterministicReviewSummary {
  templateVersion: string;
  rulesVersion: string;
  summaryLines: readonly string[];
  summaryText: string | null;
  provisionalText: string | null;
  summaryDigest: string;
  visibilityState: ReviewSummaryVisibilityState;
  suppressionReasonCodes: readonly string[];
}

export interface ReviewBundleProvenance {
  reviewVersion: number;
  evidenceSnapshotRef: string;
  captureBundleRef: string;
  evidenceSummaryParityRef: string;
  lineageFenceEpoch: number;
  decisionEpochRef: string | null;
  decisionSupersessionRef: string | null;
}

export interface ReviewBundleSnapshot {
  reviewBundleId: string;
  taskId: string;
  requestId: string;
  publicationState: ReviewBundlePublicationState;
  summaryVisibilityState: ReviewSummaryVisibilityState;
  provenance: ReviewBundleProvenance;
  requestSummary: ReviewTextSection;
  structuredAnswers: readonly ReviewStructuredAnswer[];
  patientNarrative: ReviewTextSection;
  safetyScreening: ReviewTextSection & {
    matchedRuleIds: readonly string[];
  };
  telephony: ReviewTextSection & {
    callSessionRef: string | null;
  };
  transcript: ReviewTextSection & {
    transcriptState: ReviewTranscriptState;
  };
  attachments: readonly ReviewAttachmentPreview[];
  identitySummary: ReviewTextSection;
  contactPreferenceSummary: ReviewTextSection;
  priorPatientResponses: readonly ReviewTimelineEntry[];
  duplicateClusterStatus: ReviewTextSection & {
    duplicateClusterRef: string | null;
    decisionClass: string | null;
  };
  latestSlaState: ReviewTextSection & {
    slaState: string;
  };
  deterministicSummary: DeterministicReviewSummary;
  sourceArtifactRefs: readonly string[];
  deltaPacketRef: string;
  visibleSuggestionEnvelopeRefs: readonly string[];
  hiddenSuggestionEnvelopeRefs: readonly string[];
  gapArtifactRefs: readonly string[];
  bundleDigest: string;
  assembledAt: string;
}

export interface SuggestionEndpointCandidate {
  endpointRef: string;
  endpointCode: string;
  rationale: string;
  supportingEvidenceRefs: readonly string[];
}

export interface SuggestionEnvelopeSnapshot {
  suggestionEnvelopeId: string;
  taskId: string;
  reviewBundleRef: string;
  sourceType: ReviewSuggestionSourceType;
  suggestionVersion: string;
  priorityBand: ReviewSuggestionPriorityBand;
  complexityBand: ReviewSuggestionComplexityBand;
  candidateEndpoints: readonly SuggestionEndpointCandidate[];
  recommendedQuestionSetIds: readonly string[];
  rationaleBullets: readonly string[];
  confidenceDescriptor: string;
  visibilityState: ReviewSuggestionVisibilityState;
  reviewVersionRef: number;
  decisionEpochRef: string | null;
  policyBundleRef: string;
  lineageFenceEpoch: number;
  allowedSuggestionSetHash: string;
  authoritativeWorkflowInfluence: "advisory_only";
  staleAt: string | null;
  invalidatedAt: string | null;
}

export interface EvidenceDeltaPacketSnapshot {
  evidenceDeltaPacketId: string;
  taskId: string;
  baselineSnapshotRef: string;
  currentSnapshotRef: string;
  deltaClass: ReviewDeltaClass;
  changedFieldRefs: readonly string[];
  contradictionRefs: readonly string[];
  actionInvalidations: readonly ReviewActionInvalidation[];
  changes: readonly ReviewChangeMarker[];
  summaryDeltaRef: string;
  primaryChangedAnchorRef: string;
  supersededJudgmentContext: readonly ReviewSupersededJudgmentContext[];
  supersessionMarkerRefs: readonly string[];
  acknowledgementState: ReviewDeltaAcknowledgementState;
  returnToQuietEligibility: ReviewDeltaReturnToQuietEligibility;
  requiresExplicitReview: boolean;
  deltaDigest: string;
  generatedAt: string;
}

function canonicalize(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalize(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

export function stableReviewDigest(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex").slice(0, 24);
}

export function buildReviewProjectionRef(kind: string, value: unknown): string {
  return `${kind}_${stableReviewDigest({ kind, value })}`;
}

export function resolveReviewSummaryVisibility(input: {
  parityState: ReviewBundleParityState;
  missingRequiredProvenance?: boolean;
}): {
  visibilityState: ReviewSummaryVisibilityState;
  suppressionReasonCodes: readonly string[];
} {
  if (input.missingRequiredProvenance) {
    return {
      visibilityState: "suppressed",
      suppressionReasonCodes: ["REVIEW_235_REQUIRED_PROVENANCE_MISSING"],
    };
  }

  switch (input.parityState) {
    case "verified":
      return {
        visibilityState: "authoritative",
        suppressionReasonCodes: [],
      };
    case "stale":
      return {
        visibilityState: "provisional",
        suppressionReasonCodes: ["REVIEW_235_PARITY_STALE"],
      };
    case "blocked":
      return {
        visibilityState: "suppressed",
        suppressionReasonCodes: ["REVIEW_235_PARITY_BLOCKED"],
      };
    case "superseded":
      return {
        visibilityState: "suppressed",
        suppressionReasonCodes: ["REVIEW_235_PARITY_SUPERSEDED"],
      };
  }
}

function normalizeLine(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function renderDeterministicReviewSummary(input: {
  templateVersion: string;
  rulesVersion: string;
  requestSummary: readonly string[];
  structuredAnswers: readonly ReviewStructuredAnswer[];
  patientNarrative: string | null;
  safetySummary: readonly string[];
  telephonySummary: readonly string[];
  transcriptSummary: string | null;
  attachmentLabels: readonly string[];
  identitySummary: readonly string[];
  contactSummary: readonly string[];
  priorResponseSummary: readonly string[];
  duplicateSummary: readonly string[];
  slaSummary: readonly string[];
  visibilityState: ReviewSummaryVisibilityState;
  suppressionReasonCodes?: readonly string[];
}): DeterministicReviewSummary {
  const sections: string[] = [];
  const pushSection = (label: string, values: readonly string[]) => {
    const lines = values.map(normalizeLine).filter((entry): entry is string => entry !== null);
    if (lines.length === 0) {
      return;
    }
    sections.push(`${label}: ${lines.join(" | ")}`);
  };

  pushSection("Request", input.requestSummary);
  pushSection(
    "Answers",
    [...input.structuredAnswers]
      .sort((left, right) => left.questionId.localeCompare(right.questionId))
      .map((entry) => `${entry.question}=${entry.answer}`),
  );
  pushSection("Narrative", input.patientNarrative ? [input.patientNarrative] : []);
  pushSection("Safety", input.safetySummary);
  pushSection("Telephony", input.telephonySummary);
  pushSection("Transcript", input.transcriptSummary ? [input.transcriptSummary] : []);
  pushSection("Attachments", [...input.attachmentLabels].sort((left, right) => left.localeCompare(right)));
  pushSection("Identity", input.identitySummary);
  pushSection("Contact", input.contactSummary);
  pushSection("Prior responses", input.priorResponseSummary);
  pushSection("Duplicate", input.duplicateSummary);
  pushSection("SLA", input.slaSummary);

  const baseText = sections.join("\n");
  const summaryDigest = stableReviewDigest({
    templateVersion: input.templateVersion,
    rulesVersion: input.rulesVersion,
    sections,
  });

  return {
    templateVersion: input.templateVersion,
    rulesVersion: input.rulesVersion,
    summaryLines: sections,
    summaryText: input.visibilityState === "authoritative" ? baseText : null,
    provisionalText: input.visibilityState === "authoritative" ? null : baseText,
    summaryDigest,
    visibilityState: input.visibilityState,
    suppressionReasonCodes: [...(input.suppressionReasonCodes ?? [])],
  };
}

export function classifyReviewDeltaPacket(input: {
  contradictions: readonly string[];
  actionInvalidationTypes: readonly ReviewActionInvalidation["invalidationType"][];
  changedFieldRefs: readonly string[];
  newEvidenceCount: number;
}): ReviewDeltaClass {
  if (
    input.contradictions.length > 0 ||
    input.actionInvalidationTypes.some((entry) =>
      [
        "ownership_changed",
        "duplicate_lineage_supersession",
        "decision_epoch_supersession",
      ].includes(entry),
    )
  ) {
    return "decisive";
  }
  if (
    input.actionInvalidationTypes.some((entry) =>
      ["endpoint_assumption_drift", "approval_posture_changed"].includes(entry),
    )
  ) {
    return "consequential";
  }
  if (input.newEvidenceCount > 0 || input.changedFieldRefs.length > 0) {
    return "contextual";
  }
  return "clerical";
}
