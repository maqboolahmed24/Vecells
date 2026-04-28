import { createHash } from "node:crypto";
import type {
  ConversationAuthoritativeOutcomeState,
  ConversationContinuityValidationState,
  ConversationDeliveryRiskState,
  ConversationLocalAckState,
  ConversationPreviewVisibilityMode,
  ConversationTupleAvailabilityState,
  ConversationTupleCompatibilitySnapshot,
} from "./phase3-conversation-control-kernel";

export const PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME =
  "Phase3PatientConversationTupleService";
export const PHASE3_PATIENT_CONVERSATION_TUPLE_SCHEMA_VERSION =
  "247.phase3.patient-conversation-tuple.v1";
export const PATIENT_CONVERSATION_RECEIPT_GRAMMAR_VERSION =
  "247.patient-conversation-receipt-grammar.v1";

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
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function sortIsoAscending<T extends { sortAt: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) => left.sortAt.localeCompare(right.sortAt));
}

function compactRefs(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.map(optionalRef).filter((value): value is string => Boolean(value)))];
}

function truncateSummary(value: string, limit = 88): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit - 1).trimEnd()}...`;
}

function tuplePreviewMode(
  previewMode: PatientConversationPreviewMode,
): ConversationPreviewVisibilityMode {
  switch (previewMode) {
    case "authenticated_summary":
      return "full";
    case "public_safe_summary":
      return "public_safe_summary";
    case "step_up_required":
      return "step_up_required";
    case "suppressed_recovery_only":
      return "suppressed_recovery_only";
  }
  return "suppressed_recovery_only";
}

function severityRank(state: ConversationDeliveryRiskState): number {
  switch (state) {
    case "on_track":
      return 0;
    case "at_risk":
      return 1;
    case "likely_failed":
      return 2;
    case "disputed":
      return 3;
  }
}

function mostSevereDeliveryRisk(
  rows: readonly Pick<NormalizedConversationRowInput, "deliveryRiskState">[],
): ConversationDeliveryRiskState {
  return rows.reduce<ConversationDeliveryRiskState>((current, row) => {
    return severityRank(row.deliveryRiskState) > severityRank(current)
      ? row.deliveryRiskState
      : current;
  }, "on_track");
}

export type PatientConversationAudienceTier =
  | "patient_public"
  | "patient_authenticated"
  | "secure_link_recovery"
  | "embedded_authenticated";

export type PatientConversationTrustPosture = "trusted" | "step_up_required" | "repair_hold";
export type PatientConversationVisibilityTier =
  | "full"
  | "partial"
  | "placeholder_only"
  | "suppressed";
export type PatientConversationSummarySafetyTier =
  | "public_safe"
  | "patient_safe"
  | "phi_suppressed";
export type PatientConversationPreviewMode =
  | "public_safe_summary"
  | "authenticated_summary"
  | "step_up_required"
  | "suppressed_recovery_only";
export type PatientConversationReleaseState = "live" | "read_only" | "frozen";
export type CommunicationEnvelopeKind =
  | "clinician_message"
  | "patient_message_reply"
  | "callback_update"
  | "more_info_request"
  | "more_info_reply"
  | "reminder"
  | "repair_notice"
  | "callback_fallback"
  | "legacy_placeholder";
export type CommunicationAuthoredBy = "clinician" | "patient" | "practice" | "system" | "legacy";
export type CommunicationTransportAckState = "not_started" | "queued" | "accepted" | "rejected";
export type CommunicationDeliveryEvidenceState =
  | "not_applicable"
  | "pending"
  | "delivered"
  | "failed"
  | "bounced"
  | "disputed";
export type ConversationSubthreadType =
  | "secure_message"
  | "callback"
  | "more_info"
  | "reminder"
  | "repair_guidance"
  | "legacy_recovery";
export type ConversationReplyCapabilityState =
  | "reply_allowed"
  | "reply_blocked"
  | "read_only"
  | "repair_required";
export type PatientConversationSurfaceState =
  | "ready"
  | "placeholder"
  | "pending"
  | "recovery_only"
  | "read_only";
export type PatientReceiptKind =
  | "message"
  | "callback"
  | "reminder"
  | "more_info"
  | "repair"
  | "legacy_backfill";
export type LegacyBackfillState = "none" | "placeholder_required";

export interface NormalizedConversationRowInput {
  rowRef: string;
  sourceDomain:
    | "callback_case"
    | "clinician_message_thread"
    | "more_info_cycle"
    | "communication_repair"
    | "legacy_backfill";
  sourceRef: string;
  communicationKind: CommunicationEnvelopeKind;
  subthreadRef: string;
  subthreadType: ConversationSubthreadType;
  ownerRef: string | null;
  replyTargetRef: string | null;
  replyWindowRef: string | null;
  workflowMeaningRef: string;
  replyCapabilityState: ConversationReplyCapabilityState;
  authoredBy: CommunicationAuthoredBy;
  patientSafeSummary: string;
  publicSafeSummary: string;
  visibleSnippetRef?: string | null;
  sentAt: string;
  sortAt: string;
  expiresAt?: string | null;
  localAckState: ConversationLocalAckState;
  transportAckState: CommunicationTransportAckState;
  deliveryEvidenceState: CommunicationDeliveryEvidenceState;
  deliveryRiskState: ConversationDeliveryRiskState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  callbackVisibleState?:
    | "queued"
    | "scheduled"
    | "attempting_now"
    | "retry_planned"
    | "route_repair_required"
    | "escalated"
    | "closed"
    | null;
  callbackWindowRiskState?: "on_track" | "at_risk" | "missed_window" | "repair_required" | null;
  reminderPlanRef?: string | null;
  settlementRef?: string | null;
  receiptKind?: PatientReceiptKind | null;
  reasonRefs?: readonly string[];
  rowRevision?: number;
}

export interface LegacyConversationBackfillRowInput {
  backfillRowId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  episodeRef: string | null;
  sourceDomain: "callback_case" | "clinician_message_thread";
  sourceRef: string;
  occurredAt: string;
  patientSafeSummary: string;
  publicSafeSummary: string;
  deliveryRiskState: ConversationDeliveryRiskState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  repairRequired: boolean;
}

export interface PatientConversationProjectionMaterializeInput {
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  episodeRef: string | null;
  audienceTier: PatientConversationAudienceTier;
  trustPosture: PatientConversationTrustPosture;
  selectedAnchorRef: string;
  patientShellConsistencyRef: string;
  routeIntentBindingRef: string;
  experienceContinuityEvidenceRef: string;
  rows: readonly NormalizedConversationRowInput[];
  latestCallbackStatusRef?: string | null;
  latestSupportActionSettlementRef?: string | null;
  reachabilityDependencyRef?: string | null;
  reachabilityAssessmentRef?: string | null;
  reachabilityEpoch?: number;
  contactRepairJourneyRef?: string | null;
  requiredReleaseApprovalFreezeRef?: string | null;
  channelReleaseFreezeState?: string;
  requiredAssuranceSliceTrustRefs?: readonly string[];
  releaseStateHint?: PatientConversationReleaseState;
  legacyBackfillState?: LegacyBackfillState;
  continuityDriftReasonRefs?: readonly string[];
  computedAt: string;
}

export interface PatientCommunicationVisibilityProjectionSnapshot {
  projectionName: "PatientCommunicationVisibilityProjection";
  visibilityProjectionRef: string;
  clusterOrThreadRef: string;
  coverageProjectionRef: string;
  patientShellConsistencyRef: string;
  audienceTier: PatientConversationAudienceTier;
  releaseState: PatientConversationReleaseState;
  visibilityTier: PatientConversationVisibilityTier;
  summarySafetyTier: PatientConversationSummarySafetyTier;
  previewMode: PatientConversationPreviewMode;
  minimumNecessaryContractRef: string;
  previewVisibilityContractRef: string;
  visibleSnippetRefs: readonly string[];
  placeholderContractRef: string;
  hiddenContentReasonRefs: readonly string[];
  redactionPolicyRef: string;
  safeContinuationRef: string | null;
  latestReceiptEnvelopeRef: string | null;
  latestSettlementRef: string | null;
  experienceContinuityEvidenceRef: string;
  computedAt: string;
  createdByAuthority: typeof PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME;
}

export interface CommunicationEnvelopeSnapshot {
  projectionName: "CommunicationEnvelope";
  communicationEnvelopeRef: string;
  clusterRef: string;
  threadId: string;
  subthreadRef: string;
  subthreadType: ConversationSubthreadType;
  communicationKind: CommunicationEnvelopeKind;
  sourceDomain: NormalizedConversationRowInput["sourceDomain"];
  sourceRef: string;
  authoredBy: CommunicationAuthoredBy;
  visibleSummary: string;
  patientSafeSummary: string;
  publicSafeSummary: string;
  visibleSnippetRef: string | null;
  previewMode: PatientConversationPreviewMode;
  transportAckState: CommunicationTransportAckState;
  deliveryEvidenceState: CommunicationDeliveryEvidenceState;
  deliveryRiskState: ConversationDeliveryRiskState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  localAckState: ConversationLocalAckState;
  sentAt: string;
  sortAt: string;
  reasonRefs: readonly string[];
  computedAt: string;
  createdByAuthority: typeof PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME;
}

export interface ConversationSubthreadProjectionSnapshot {
  projectionName: "ConversationSubthreadProjection";
  subthreadProjectionRef: string;
  clusterRef: string;
  threadId: string;
  subthreadRef: string;
  subthreadType: ConversationSubthreadType;
  ownerRef: string | null;
  replyTargetRef: string | null;
  replyWindowRef: string | null;
  expiresAt: string | null;
  workflowMeaningRef: string;
  replyCapabilityState: ConversationReplyCapabilityState;
  communicationEnvelopeRefs: readonly string[];
  surfaceState: PatientConversationSurfaceState;
  reasonRefs: readonly string[];
  computedAt: string;
  createdByAuthority: typeof PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME;
}

export interface PatientReceiptEnvelopeSnapshot {
  projectionName: "PatientReceiptEnvelope";
  receiptEnvelopeRef: string;
  clusterRef: string;
  threadId: string;
  sourceEnvelopeRef: string;
  receiptKind: PatientReceiptKind;
  grammarVersionRef: typeof PATIENT_CONVERSATION_RECEIPT_GRAMMAR_VERSION;
  localAckState: ConversationLocalAckState;
  transportAckState: CommunicationTransportAckState;
  deliveryEvidenceState: CommunicationDeliveryEvidenceState;
  deliveryRiskState: ConversationDeliveryRiskState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  summaryRef: string;
  settledAt: string | null;
  reasonRefs: readonly string[];
  computedAt: string;
  createdByAuthority: typeof PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME;
}

export interface PatientConversationClusterSnapshot {
  projectionName: "PatientConversationCluster";
  clusterProjectionRef: string;
  clusterRef: string;
  threadId: string;
  patientSafeSubject: string;
  publicSafeSubject: string;
  subthreadProjectionRefs: readonly string[];
  communicationEnvelopeRefs: readonly string[];
  previewVisibilityContractRef: string;
  previewMode: PatientConversationPreviewMode;
  visibilityProjectionRef: string;
  latestReceiptEnvelopeRef: string | null;
  latestSettlementRef: string | null;
  latestCallbackStatusRef: string | null;
  dominantNextActionRef: string | null;
  tupleAvailabilityState: ConversationTupleAvailabilityState;
  continuityValidationState: ConversationContinuityValidationState;
  reasonRefs: readonly string[];
  computedAt: string;
  createdByAuthority: typeof PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME;
}

export interface ConversationThreadProjectionSnapshot {
  projectionName: "ConversationThreadProjection";
  threadProjectionRef: string;
  clusterRef: string;
  threadId: string;
  threadTupleHash: string;
  receiptGrammarVersionRef: typeof PATIENT_CONVERSATION_RECEIPT_GRAMMAR_VERSION;
  monotoneRevision: number;
  communicationEnvelopeRefs: readonly string[];
  orderedSubthreadRefs: readonly string[];
  latestDigestRef: string | null;
  latestReceiptEnvelopeRef: string | null;
  latestSettlementRef: string | null;
  latestCallbackStatusRef: string | null;
  activeComposerLeaseRef: string | null;
  visibilityProjectionRef: string;
  experienceContinuityEvidenceRef: string;
  selectedAnchorRef: string;
  surfaceState: PatientConversationSurfaceState;
  reasonRefs: readonly string[];
  computedAt: string;
  createdByAuthority: typeof PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME;
}

export interface PatientConversationProjectionBundle {
  schemaVersion: typeof PHASE3_PATIENT_CONVERSATION_TUPLE_SCHEMA_VERSION;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  audienceTier: PatientConversationAudienceTier;
  trustPosture: PatientConversationTrustPosture;
  visibilityProjection: PatientCommunicationVisibilityProjectionSnapshot;
  communicationEnvelopes: readonly CommunicationEnvelopeSnapshot[];
  subthreads: readonly ConversationSubthreadProjectionSnapshot[];
  receiptEnvelopes: readonly PatientReceiptEnvelopeSnapshot[];
  cluster: PatientConversationClusterSnapshot;
  thread: ConversationThreadProjectionSnapshot;
  tupleCompatibility: ConversationTupleCompatibilitySnapshot;
}

function resolvePreviewMode(input: {
  audienceTier: PatientConversationAudienceTier;
  trustPosture: PatientConversationTrustPosture;
  requiredAssuranceSliceTrustRefs: readonly string[];
  releaseStateHint: PatientConversationReleaseState;
}): PatientConversationPreviewMode {
  if (
    input.trustPosture === "repair_hold" ||
    input.releaseStateHint === "frozen" ||
    input.audienceTier === "secure_link_recovery"
  ) {
    return "suppressed_recovery_only";
  }
  if (
    input.trustPosture === "step_up_required" ||
    input.releaseStateHint === "read_only" ||
    input.requiredAssuranceSliceTrustRefs.length > 0
  ) {
    return "step_up_required";
  }
  if (input.audienceTier === "patient_public") {
    return "public_safe_summary";
  }
  return "authenticated_summary";
}

function visibilityTierForPreviewMode(
  previewMode: PatientConversationPreviewMode,
): PatientConversationVisibilityTier {
  switch (previewMode) {
    case "authenticated_summary":
      return "full";
    case "public_safe_summary":
      return "partial";
    case "step_up_required":
      return "placeholder_only";
    case "suppressed_recovery_only":
      return "suppressed";
  }
}

function summarySafetyTierForPreviewMode(
  previewMode: PatientConversationPreviewMode,
): PatientConversationSummarySafetyTier {
  switch (previewMode) {
    case "public_safe_summary":
      return "public_safe";
    case "authenticated_summary":
      return "patient_safe";
    case "step_up_required":
    case "suppressed_recovery_only":
      return "phi_suppressed";
  }
}

function releaseStateForPreviewMode(
  previewMode: PatientConversationPreviewMode,
): PatientConversationReleaseState {
  switch (previewMode) {
    case "authenticated_summary":
    case "public_safe_summary":
      return "live";
    case "step_up_required":
      return "read_only";
    case "suppressed_recovery_only":
      return "frozen";
  }
}

function surfaceStateForPreviewMode(
  previewMode: PatientConversationPreviewMode,
  continuity: ConversationContinuityValidationState,
): PatientConversationSurfaceState {
  if (continuity === "blocked") {
    return "recovery_only";
  }
  if (continuity === "stale") {
    return "pending";
  }
  switch (previewMode) {
    case "authenticated_summary":
    case "public_safe_summary":
      return continuity === "degraded" ? "placeholder" : "ready";
    case "step_up_required":
      return "read_only";
    case "suppressed_recovery_only":
      return "recovery_only";
  }
}

function continuityValidationState(input: {
  previewMode: PatientConversationPreviewMode;
  continuityDriftReasonRefs: readonly string[];
  legacyBackfillState: LegacyBackfillState;
  contactRepairJourneyRef: string | null;
  rows: readonly NormalizedConversationRowInput[];
}): ConversationContinuityValidationState {
  if (input.continuityDriftReasonRefs.length > 0) {
    return "stale";
  }
  if (input.previewMode === "suppressed_recovery_only") {
    return "blocked";
  }
  if (
    input.legacyBackfillState === "placeholder_required" ||
    input.contactRepairJourneyRef !== null ||
    input.rows.some((row) => row.deliveryRiskState !== "on_track")
  ) {
    return "degraded";
  }
  return "trusted";
}

function dominantNextActionRef(input: {
  previewMode: PatientConversationPreviewMode;
  continuityValidationState: ConversationContinuityValidationState;
  rows: readonly NormalizedConversationRowInput[];
  contactRepairJourneyRef: string | null;
}): string | null {
  if (input.previewMode === "suppressed_recovery_only") {
    return "recover_visibility";
  }
  if (input.continuityValidationState === "stale") {
    return "refresh_thread_tuple";
  }
  if (input.contactRepairJourneyRef !== null) {
    return "repair_contact_route";
  }
  const awaitingReply = input.rows.find(
    (row) => row.authoritativeOutcomeState === "awaiting_reply",
  );
  if (awaitingReply) {
    return "reply_needed";
  }
  const awaitingReview = input.rows.find(
    (row) => row.authoritativeOutcomeState === "awaiting_review",
  );
  if (awaitingReview) {
    return "await_review";
  }
  const callback = input.rows.find(
    (row) => row.callbackVisibleState && row.callbackVisibleState !== "closed",
  );
  if (callback) {
    return "await_callback";
  }
  return null;
}

function authoritativeOutcomeState(
  rows: readonly NormalizedConversationRowInput[],
): ConversationAuthoritativeOutcomeState {
  if (rows.some((row) => row.authoritativeOutcomeState === "recovery_required")) {
    return "recovery_required";
  }
  if (rows.some((row) => row.authoritativeOutcomeState === "awaiting_review")) {
    return "awaiting_review";
  }
  if (rows.some((row) => row.authoritativeOutcomeState === "awaiting_reply")) {
    return "awaiting_reply";
  }
  if (rows.some((row) => row.authoritativeOutcomeState === "callback_scheduled")) {
    return "callback_scheduled";
  }
  if (rows.some((row) => row.authoritativeOutcomeState === "reviewed")) {
    return "reviewed";
  }
  return "settled";
}

function replyCapabilityState(
  rows: readonly NormalizedConversationRowInput[],
): ConversationReplyCapabilityState {
  if (rows.some((row) => row.replyCapabilityState === "repair_required")) {
    return "repair_required";
  }
  if (rows.some((row) => row.replyCapabilityState === "reply_blocked")) {
    return "reply_blocked";
  }
  if (rows.some((row) => row.replyCapabilityState === "reply_allowed")) {
    return "reply_allowed";
  }
  return "read_only";
}

function summarizeReceipt(row: NormalizedConversationRowInput): string {
  if (row.authoritativeOutcomeState === "recovery_required") {
    return "Recovery is required before this communication can be treated as settled.";
  }
  if (row.authoritativeOutcomeState === "awaiting_review") {
    return "Received and queued for review.";
  }
  if (row.authoritativeOutcomeState === "awaiting_reply") {
    return "Visible and awaiting a patient response.";
  }
  if (row.authoritativeOutcomeState === "callback_scheduled") {
    return "Callback scheduling is current, but final outcome is still pending.";
  }
  if (row.authoritativeOutcomeState === "reviewed") {
    return "Reviewed under the current authoritative thread tuple.";
  }
  return "Settled under the current authoritative thread tuple.";
}

function receiptKindForRow(row: NormalizedConversationRowInput): PatientReceiptKind {
  if (row.receiptKind) {
    return row.receiptKind;
  }
  switch (row.communicationKind) {
    case "clinician_message":
    case "patient_message_reply":
      return "message";
    case "callback_update":
    case "callback_fallback":
      return "callback";
    case "more_info_request":
    case "more_info_reply":
      return "more_info";
    case "reminder":
      return "reminder";
    case "repair_notice":
      return "repair";
    case "legacy_placeholder":
      return "legacy_backfill";
  }
  return "legacy_backfill";
}

function transportStateForTuple(
  row: NormalizedConversationRowInput,
): ConversationTupleCompatibilitySnapshot["messageExpectationState"] {
  if (row.replyCapabilityState === "repair_required") {
    return "delivery_repair_required";
  }
  switch (row.authoritativeOutcomeState) {
    case "awaiting_reply":
      return "reply_needed";
    case "awaiting_review":
      return "awaiting_review";
    case "reviewed":
    case "settled":
      return "reviewed";
    case "recovery_required":
      return "reply_blocked";
    case "callback_scheduled":
      return "reply_needed";
  }
  return "reply_blocked";
}

function callbackVisibleState(
  rows: readonly NormalizedConversationRowInput[],
): ConversationTupleCompatibilitySnapshot["callbackVisibleState"] {
  for (const row of rows) {
    if (row.callbackVisibleState) {
      return row.callbackVisibleState;
    }
  }
  return null;
}

function callbackWindowRiskState(
  rows: readonly NormalizedConversationRowInput[],
): ConversationTupleCompatibilitySnapshot["callbackWindowRiskState"] {
  for (const row of rows) {
    if (row.callbackWindowRiskState) {
      return row.callbackWindowRiskState;
    }
  }
  return null;
}

function materializedSubject(
  rows: readonly NormalizedConversationRowInput[],
  safe: "patient" | "public",
): string {
  const nonPatient =
    rows.find((row) => row.authoredBy !== "patient") ??
    rows.find((row) => row.communicationKind !== "legacy_placeholder") ??
    rows[0];
  invariant(nonPatient, "CONVERSATION_ROW_REQUIRED", "A conversation row is required.");
  const summary = safe === "patient" ? nonPatient.patientSafeSummary : nonPatient.publicSafeSummary;
  return truncateSummary(summary);
}

export interface Phase3PatientConversationTupleService {
  materializeConversation(
    input: PatientConversationProjectionMaterializeInput,
  ): PatientConversationProjectionBundle;
}

class Phase3PatientConversationTupleServiceImpl implements Phase3PatientConversationTupleService {
  materializeConversation(
    input: PatientConversationProjectionMaterializeInput,
  ): PatientConversationProjectionBundle {
    const taskId = requireRef(input.taskId, "taskId");
    const requestId = requireRef(input.requestId, "requestId");
    const requestLineageRef = requireRef(input.requestLineageRef, "requestLineageRef");
    const computedAt = ensureIsoTimestamp(input.computedAt, "computedAt");
    const selectedAnchorRef = requireRef(input.selectedAnchorRef, "selectedAnchorRef");
    invariant(
      input.rows.length > 0,
      "CONVERSATION_ROWS_REQUIRED",
      "At least one conversation row is required.",
    );

    const sortedRows = sortIsoAscending(
      input.rows.map((row) => ({
        ...row,
        rowRef: requireRef(row.rowRef, "rowRef"),
        sourceRef: requireRef(row.sourceRef, "sourceRef"),
        subthreadRef: requireRef(row.subthreadRef, "subthreadRef"),
        workflowMeaningRef: requireRef(row.workflowMeaningRef, "workflowMeaningRef"),
        patientSafeSummary: requireRef(row.patientSafeSummary, "patientSafeSummary"),
        publicSafeSummary: requireRef(row.publicSafeSummary, "publicSafeSummary"),
        sentAt: ensureIsoTimestamp(row.sentAt, "sentAt"),
        sortAt: ensureIsoTimestamp(row.sortAt, "sortAt"),
        expiresAt: optionalRef(row.expiresAt),
        visibleSnippetRef: optionalRef(row.visibleSnippetRef),
        reminderPlanRef: optionalRef(row.reminderPlanRef),
        settlementRef: optionalRef(row.settlementRef),
        rowRevision: row.rowRevision ?? 1,
        reasonRefs: row.reasonRefs ?? [],
      })),
    );

    const clusterRef = `patient_conversation_cluster_${requestLineageRef}`;
    const threadId = `patient_conversation_thread_${requestLineageRef}`;
    const requiredAssuranceSliceTrustRefs = compactRefs(
      input.requiredAssuranceSliceTrustRefs ?? [],
    );
    const previewMode = resolvePreviewMode({
      audienceTier: input.audienceTier,
      trustPosture: input.trustPosture,
      requiredAssuranceSliceTrustRefs,
      releaseStateHint: input.releaseStateHint ?? "live",
    });
    const legacyBackfillState = input.legacyBackfillState ?? "none";
    const continuityDriftReasonRefs = [...(input.continuityDriftReasonRefs ?? [])];
    const continuityState = continuityValidationState({
      previewMode,
      continuityDriftReasonRefs,
      legacyBackfillState,
      contactRepairJourneyRef: optionalRef(input.contactRepairJourneyRef),
      rows: sortedRows,
    });
    const visibilityTier = visibilityTierForPreviewMode(previewMode);
    const summarySafetyTier = summarySafetyTierForPreviewMode(previewMode);
    const releaseState = releaseStateForPreviewMode(previewMode);
    const dominantActionRef = dominantNextActionRef({
      previewMode,
      continuityValidationState: continuityState,
      rows: sortedRows,
      contactRepairJourneyRef: optionalRef(input.contactRepairJourneyRef),
    });
    const latestRow = sortedRows.at(-1)!;
    const communicationEnvelopes = sortedRows.map<CommunicationEnvelopeSnapshot>((row) => ({
      projectionName: "CommunicationEnvelope",
      communicationEnvelopeRef: `communication_envelope_${row.rowRef}`,
      clusterRef,
      threadId,
      subthreadRef: row.subthreadRef,
      subthreadType: row.subthreadType,
      communicationKind: row.communicationKind,
      sourceDomain: row.sourceDomain,
      sourceRef: row.sourceRef,
      authoredBy: row.authoredBy,
      visibleSummary:
        previewMode === "authenticated_summary" ? row.patientSafeSummary : row.publicSafeSummary,
      patientSafeSummary: row.patientSafeSummary,
      publicSafeSummary: row.publicSafeSummary,
      visibleSnippetRef: row.visibleSnippetRef,
      previewMode,
      transportAckState: row.transportAckState,
      deliveryEvidenceState: row.deliveryEvidenceState,
      deliveryRiskState: row.deliveryRiskState,
      authoritativeOutcomeState: row.authoritativeOutcomeState,
      localAckState: row.localAckState,
      sentAt: row.sentAt,
      sortAt: row.sortAt,
      reasonRefs: row.reasonRefs ?? [],
      computedAt,
      createdByAuthority: PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME,
    }));

    const envelopesByRowRef = new Map(
      sortedRows.map((row, index) => [row.rowRef, communicationEnvelopes[index]]),
    );

    const groupedSubthreads = new Map<string, NormalizedConversationRowInput[]>();
    for (const row of sortedRows) {
      const current = groupedSubthreads.get(row.subthreadRef) ?? [];
      current.push(row);
      groupedSubthreads.set(row.subthreadRef, current);
    }
    const subthreads = [...groupedSubthreads.entries()]
      .map<ConversationSubthreadProjectionSnapshot>(([subthreadRef, rows]) => {
        const ordered = sortIsoAscending(rows);
        const first = ordered[0];
        const last = ordered.at(-1)!;
        invariant(first, "SUBTHREAD_ROWS_REQUIRED", "Subthread rows are required.");
        const subthreadContinuity =
          continuityState === "blocked" || continuityState === "stale"
            ? continuityState
            : continuityValidationState({
                previewMode,
                continuityDriftReasonRefs: [],
                legacyBackfillState,
                contactRepairJourneyRef: rows.some(
                  (row) => row.replyCapabilityState === "repair_required",
                )
                  ? "repair_active"
                  : null,
                rows,
              });
        return {
          projectionName: "ConversationSubthreadProjection",
          subthreadProjectionRef: `conversation_subthread_${clusterRef}_${subthreadRef}`,
          clusterRef,
          threadId,
          subthreadRef,
          subthreadType: first.subthreadType,
          ownerRef: optionalRef(first.ownerRef),
          replyTargetRef: optionalRef(first.replyTargetRef),
          replyWindowRef: optionalRef(first.replyWindowRef),
          expiresAt: optionalRef(last.expiresAt),
          workflowMeaningRef: first.workflowMeaningRef,
          replyCapabilityState: replyCapabilityState(ordered),
          communicationEnvelopeRefs: ordered.map(
            (row) => envelopesByRowRef.get(row.rowRef)!.communicationEnvelopeRef,
          ),
          surfaceState: surfaceStateForPreviewMode(previewMode, subthreadContinuity),
          reasonRefs: compactRefs(
            ordered
              .flatMap((row) => row.reasonRefs ?? [])
              .concat(subthreadContinuity === "stale" ? ["thread_tuple_drift"] : []),
          ),
          computedAt,
          createdByAuthority: PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME,
        };
      })
      .sort((left, right) => {
        const leftRow = communicationEnvelopes.find((envelope) =>
          left.communicationEnvelopeRefs.includes(envelope.communicationEnvelopeRef),
        )!;
        const rightRow = communicationEnvelopes.find((envelope) =>
          right.communicationEnvelopeRefs.includes(envelope.communicationEnvelopeRef),
        )!;
        return rightRow.sortAt.localeCompare(leftRow.sortAt);
      });

    const receiptEnvelopes = sortedRows.map<PatientReceiptEnvelopeSnapshot>((row) => ({
      projectionName: "PatientReceiptEnvelope",
      receiptEnvelopeRef: `patient_receipt_${row.rowRef}`,
      clusterRef,
      threadId,
      sourceEnvelopeRef: envelopesByRowRef.get(row.rowRef)!.communicationEnvelopeRef,
      receiptKind: receiptKindForRow(row),
      grammarVersionRef: PATIENT_CONVERSATION_RECEIPT_GRAMMAR_VERSION,
      localAckState: row.localAckState,
      transportAckState: row.transportAckState,
      deliveryEvidenceState: row.deliveryEvidenceState,
      deliveryRiskState: row.deliveryRiskState,
      authoritativeOutcomeState: row.authoritativeOutcomeState,
      summaryRef: summarizeReceipt(row),
      settledAt:
        row.authoritativeOutcomeState === "reviewed" || row.authoritativeOutcomeState === "settled"
          ? row.sortAt
          : null,
      reasonRefs: row.reasonRefs ?? [],
      computedAt,
      createdByAuthority: PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME,
    }));

    const latestReceiptEnvelopeRef = receiptEnvelopes.at(-1)?.receiptEnvelopeRef ?? null;
    const latestSettlementRef =
      sortedRows
        .map((row) => optionalRef(row.settlementRef))
        .filter((value): value is string => Boolean(value))
        .at(-1) ?? null;
    const latestCallbackStatusRef = optionalRef(input.latestCallbackStatusRef);
    const previewVisibilityContractRef = `preview_visibility_contract_${previewMode}`;
    const placeholderContractRef =
      legacyBackfillState === "placeholder_required"
        ? "placeholder_legacy_backfill_recovery"
        : `placeholder_${previewMode}`;
    const visibleSnippetRefs =
      previewMode === "authenticated_summary"
        ? compactRefs(sortedRows.map((row) => row.visibleSnippetRef))
        : [];
    const hiddenContentReasonRefs = compactRefs([
      ...(previewMode === "public_safe_summary" ? ["public_safe_summary_only"] : []),
      ...(previewMode === "step_up_required" ? ["step_up_required_for_thread"] : []),
      ...(previewMode === "suppressed_recovery_only" ? ["suppressed_recovery_only"] : []),
      ...continuityDriftReasonRefs,
    ]);
    const visibilityProjection: PatientCommunicationVisibilityProjectionSnapshot = {
      projectionName: "PatientCommunicationVisibilityProjection",
      visibilityProjectionRef: `patient_conversation_visibility_${clusterRef}_${input.audienceTier}`,
      clusterOrThreadRef: clusterRef,
      coverageProjectionRef: `coverage_${input.audienceTier}_${taskId}`,
      patientShellConsistencyRef: requireRef(
        input.patientShellConsistencyRef,
        "patientShellConsistencyRef",
      ),
      audienceTier: input.audienceTier,
      releaseState,
      visibilityTier,
      summarySafetyTier,
      previewMode,
      minimumNecessaryContractRef: `minimum_necessary_${summarySafetyTier}`,
      previewVisibilityContractRef,
      visibleSnippetRefs,
      placeholderContractRef,
      hiddenContentReasonRefs,
      redactionPolicyRef: `redaction_policy_${previewMode}`,
      safeContinuationRef:
        previewMode === "authenticated_summary" ? dominantActionRef : "continue_with_placeholder",
      latestReceiptEnvelopeRef,
      latestSettlementRef,
      experienceContinuityEvidenceRef: requireRef(
        input.experienceContinuityEvidenceRef,
        "experienceContinuityEvidenceRef",
      ),
      computedAt,
      createdByAuthority: PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME,
    };

    const patientSafeSubject = materializedSubject(sortedRows, "patient");
    const publicSafeSubject = materializedSubject(sortedRows, "public");
    const tupleAvailabilityState: ConversationTupleAvailabilityState =
      legacyBackfillState === "placeholder_required" ? "placeholder" : "authoritative";
    const cluster: PatientConversationClusterSnapshot = {
      projectionName: "PatientConversationCluster",
      clusterProjectionRef: `patient_conversation_cluster_projection_${clusterRef}`,
      clusterRef,
      threadId,
      patientSafeSubject,
      publicSafeSubject,
      subthreadProjectionRefs: subthreads.map((subthread) => subthread.subthreadProjectionRef),
      communicationEnvelopeRefs: communicationEnvelopes.map(
        (envelope) => envelope.communicationEnvelopeRef,
      ),
      previewVisibilityContractRef,
      previewMode,
      visibilityProjectionRef: visibilityProjection.visibilityProjectionRef,
      latestReceiptEnvelopeRef,
      latestSettlementRef,
      latestCallbackStatusRef,
      dominantNextActionRef: dominantActionRef,
      tupleAvailabilityState,
      continuityValidationState: continuityState,
      reasonRefs: hiddenContentReasonRefs,
      computedAt,
      createdByAuthority: PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME,
    };

    const monotoneRevision = Math.max(...sortedRows.map((row) => row.rowRevision ?? 1));
    const threadTupleHash = sha256Hex({
      clusterRef,
      requestLineageRef,
      previewMode,
      continuityState,
      rowRefs: sortedRows.map((row) => row.rowRef),
      receiptGrammarVersionRef: PATIENT_CONVERSATION_RECEIPT_GRAMMAR_VERSION,
      legacyBackfillState,
    });
    const thread: ConversationThreadProjectionSnapshot = {
      projectionName: "ConversationThreadProjection",
      threadProjectionRef: `patient_conversation_thread_projection_${threadId}`,
      clusterRef,
      threadId,
      threadTupleHash,
      receiptGrammarVersionRef: PATIENT_CONVERSATION_RECEIPT_GRAMMAR_VERSION,
      monotoneRevision,
      communicationEnvelopeRefs: communicationEnvelopes.map(
        (envelope) => envelope.communicationEnvelopeRef,
      ),
      orderedSubthreadRefs: subthreads.map((subthread) => subthread.subthreadProjectionRef),
      latestDigestRef: null,
      latestReceiptEnvelopeRef,
      latestSettlementRef,
      latestCallbackStatusRef,
      activeComposerLeaseRef: null,
      visibilityProjectionRef: visibilityProjection.visibilityProjectionRef,
      experienceContinuityEvidenceRef: requireRef(
        input.experienceContinuityEvidenceRef,
        "experienceContinuityEvidenceRef",
      ),
      selectedAnchorRef,
      surfaceState: surfaceStateForPreviewMode(previewMode, continuityState),
      reasonRefs: hiddenContentReasonRefs,
      computedAt,
      createdByAuthority: PHASE3_PATIENT_CONVERSATION_TUPLE_SERVICE_NAME,
    };

    const tupleCompatibility: ConversationTupleCompatibilitySnapshot = {
      tupleId: `conversation_tuple_${threadId}`,
      taskId,
      clusterRef,
      threadId,
      subthreadRef: subthreads[0]?.subthreadRef ?? latestRow.subthreadRef,
      selectedAnchorRef,
      typedSubthreadRefs: subthreads.map((subthread) => subthread.subthreadRef),
      latestCommunicationEnvelopeRef:
        communicationEnvelopes.at(-1)?.communicationEnvelopeRef ?? null,
      latestReminderPlanRef:
        sortedRows
          .map((row) => optionalRef(row.reminderPlanRef))
          .filter((value): value is string => Boolean(value))
          .at(-1) ?? null,
      latestReceiptEnvelopeRef,
      latestSettlementRef,
      latestCallbackStatusRef,
      latestSupportActionSettlementRef: optionalRef(input.latestSupportActionSettlementRef),
      patientShellConsistencyRef: requireRef(
        input.patientShellConsistencyRef,
        "patientShellConsistencyRef",
      ),
      visibilityProjectionRef: visibilityProjection.visibilityProjectionRef,
      visibilityTier,
      previewMode: tuplePreviewMode(previewMode),
      releaseState,
      routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
      requiredReleaseApprovalFreezeRef: optionalRef(input.requiredReleaseApprovalFreezeRef),
      channelReleaseFreezeState: input.channelReleaseFreezeState ?? "permitted",
      requiredAssuranceSliceTrustRefs,
      embeddedSessionRef:
        input.audienceTier === "embedded_authenticated" ? `embedded_session_${taskId}` : null,
      reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
      reachabilityAssessmentRef: optionalRef(input.reachabilityAssessmentRef),
      reachabilityEpoch: input.reachabilityEpoch ?? 0,
      contactRepairJourneyRef: optionalRef(input.contactRepairJourneyRef),
      messageExpectationState: transportStateForTuple(latestRow),
      callbackVisibleState: callbackVisibleState(sortedRows),
      callbackWindowRiskState: callbackWindowRiskState(sortedRows),
      unreadCount: sortedRows.filter(
        (row) => row.authoredBy !== "patient" && row.localAckState === "none",
      ).length,
      deliveryRiskState: mostSevereDeliveryRisk(sortedRows),
      authoritativeOutcomeState: authoritativeOutcomeState(sortedRows),
      dominantNextActionRef: dominantActionRef,
      placeholderContractRef,
      experienceContinuityEvidenceRef: requireRef(
        input.experienceContinuityEvidenceRef,
        "experienceContinuityEvidenceRef",
      ),
      continuityValidationState: continuityState,
      receiptGrammarVersionRef: PATIENT_CONVERSATION_RECEIPT_GRAMMAR_VERSION,
      threadTupleHash,
      monotoneRevision,
      tupleAvailabilityState,
      computedAt,
      version: 1,
    };

    return {
      schemaVersion: PHASE3_PATIENT_CONVERSATION_TUPLE_SCHEMA_VERSION,
      taskId,
      requestId,
      requestLineageRef,
      audienceTier: input.audienceTier,
      trustPosture: input.trustPosture,
      visibilityProjection,
      communicationEnvelopes,
      subthreads,
      receiptEnvelopes,
      cluster,
      thread,
      tupleCompatibility,
    };
  }
}

export function createPhase3PatientConversationTupleService(): Phase3PatientConversationTupleService {
  return new Phase3PatientConversationTupleServiceImpl();
}
