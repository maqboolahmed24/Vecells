import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function isRawExternalRef(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function includesAll(available: readonly string[], requested: readonly string[]): boolean {
  const availableSet = new Set(available);
  return requested.every((value) => availableSet.has(value));
}

function maybeAny(values: readonly string[], requested: string | null): boolean {
  if (values.length === 0 || values.includes("*")) {
    return true;
  }
  if (requested === null) {
    return false;
  }
  return values.includes(requested);
}

export type ClinicalContentApprovalState =
  | "approved"
  | "superseded"
  | "expired"
  | "revoked";
export type ContentReviewState = "current" | "review_due" | "expired" | "superseded";
export type AdviceRenderState =
  | "renderable"
  | "withheld"
  | "invalidated"
  | "superseded"
  | "quarantined";
export type AdviceRenderTrustState = "trusted" | "degraded" | "quarantined";
export type AdviceRenderPublicationState = "current" | "drifted" | "stale";
export type AdviceRenderReleaseTrustState =
  | "trusted"
  | "degraded"
  | "recovery_bound"
  | "quarantined";
export type AdviceRenderReleaseGateState = "open" | "frozen" | "quarantined";

const approvalStates: readonly ClinicalContentApprovalState[] = [
  "approved",
  "superseded",
  "expired",
  "revoked",
];
const reviewStates: readonly ContentReviewState[] = [
  "current",
  "review_due",
  "expired",
  "superseded",
];
const renderStates: readonly AdviceRenderState[] = [
  "renderable",
  "withheld",
  "invalidated",
  "superseded",
  "quarantined",
];
const trustStates: readonly AdviceRenderTrustState[] = [
  "trusted",
  "degraded",
  "quarantined",
];

export interface ClinicalContentApprovalRecordSnapshot {
  clinicalContentApprovalRecordId: string;
  pathwayRef: string;
  adviceBundleVersionRef: string;
  clinicalIntentRef: string;
  compiledPolicyBundleRef: string;
  approvalScopeHash: string;
  approvedAudienceTierRefs: readonly string[];
  approvedChannelRefs: readonly string[];
  approvedLocaleRefs: readonly string[];
  approvedReadingLevelRefs: readonly string[];
  approvedAccessibilityVariantRefs: readonly string[];
  approvalState: ClinicalContentApprovalState;
  reviewScheduleRef: string | null;
  approvedByRef: string;
  approvedAt: string;
  validFrom: string;
  validUntil: string | null;
  supersedesApprovalRecordRef: string | null;
  reasonCodeRefs: readonly string[];
  version: number;
}

export interface ContentReviewScheduleSnapshot {
  contentReviewScheduleId: string;
  pathwayRef: string;
  adviceBundleVersionRef: string;
  reviewCadenceRef: string;
  reviewState: ContentReviewState;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  hardExpiryAt: string | null;
  reviewOwnerRef: string;
  version: number;
}

export interface AdviceBundleVersionSnapshot {
  adviceBundleVersionId: string;
  pathwayRef: string;
  compiledPolicyBundleRef: string;
  clinicalIntentRef: string;
  audienceTierRefs: readonly string[];
  variantSetRef: string;
  safetyNetInstructionSetRef: string;
  supersedesAdviceBundleVersionRef: string | null;
  invalidationTriggerRefs: readonly string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  approvalRecordRef: string;
  version: number;
}

export interface AdviceVariantSetSnapshot {
  adviceVariantSetId: string;
  adviceBundleVersionRef: string;
  channelRef: string;
  localeRef: string;
  readingLevelRef: string | null;
  contentBlocksRef: string;
  fallbackTransformRef: string | null;
  previewChecksum: string;
  translationVersionRef: string;
  accessibilityVariantRefs: readonly string[];
  linkedArtifactContractRefs: readonly string[];
  version: number;
}

export interface AdviceRenderSettlementSnapshot {
  adviceRenderSettlementId: string;
  taskId: string;
  requestRef: string;
  adviceEligibilityGrantRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  adviceBundleVersionRef: string;
  adviceVariantSetRef: string;
  clinicalContentApprovalRecordRef: string;
  contentReviewScheduleRef: string;
  routeIntentBindingRef: string;
  commandActionRef: string;
  commandSettlementRef: string;
  releaseApprovalFreezeRef: string | null;
  channelReleaseFreezeRef: string | null;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  dependencySetRef: string | null;
  clinicalMeaningState: string;
  operationalFollowUpScope: string;
  reopenState: string;
  renderState: AdviceRenderState;
  trustState: AdviceRenderTrustState;
  reasonCodeRefs: readonly string[];
  patientTimelineRef: string | null;
  communicationTemplateRef: string | null;
  controlStatusSnapshotRef: string | null;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef: string;
  transitionEnvelopeRef: string;
  recoveryDispositionRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  recoveryRouteRef: string;
  renderedContentBlocksRef: string;
  variantFallbackPathRefs: readonly string[];
  linkedArtifactContractRefs: readonly string[];
  supersedesAdviceRenderSettlementRef: string | null;
  settledAt: string;
  renderRevision: number;
  version: number;
}

export interface Phase3AdviceRenderBundle {
  currentRenderSettlement: AdviceRenderSettlementSnapshot | null;
  renderSettlements: readonly AdviceRenderSettlementSnapshot[];
  adviceBundleVersions: readonly AdviceBundleVersionSnapshot[];
  adviceVariantSets: readonly AdviceVariantSetSnapshot[];
  clinicalContentApprovalRecords: readonly ClinicalContentApprovalRecordSnapshot[];
  contentReviewSchedules: readonly ContentReviewScheduleSnapshot[];
}

export interface RegisterClinicalContentApprovalRecordInput {
  clinicalContentApprovalRecordId?: string;
  pathwayRef: string;
  adviceBundleVersionRef: string;
  clinicalIntentRef: string;
  compiledPolicyBundleRef: string;
  approvedAudienceTierRefs: readonly string[];
  approvedChannelRefs: readonly string[];
  approvedLocaleRefs: readonly string[];
  approvedReadingLevelRefs?: readonly string[];
  approvedAccessibilityVariantRefs?: readonly string[];
  approvalState: ClinicalContentApprovalState;
  reviewScheduleRef?: string | null;
  approvedByRef: string;
  approvedAt: string;
  validFrom: string;
  validUntil?: string | null;
  supersedesApprovalRecordRef?: string | null;
  reasonCodeRefs?: readonly string[];
}

export interface RegisterContentReviewScheduleInput {
  contentReviewScheduleId?: string;
  pathwayRef: string;
  adviceBundleVersionRef: string;
  reviewCadenceRef: string;
  reviewState: ContentReviewState;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  hardExpiryAt?: string | null;
  reviewOwnerRef: string;
}

export interface RegisterAdviceBundleVersionInput {
  adviceBundleVersionId?: string;
  pathwayRef: string;
  compiledPolicyBundleRef: string;
  clinicalIntentRef: string;
  audienceTierRefs: readonly string[];
  variantSetRef: string;
  safetyNetInstructionSetRef: string;
  supersedesAdviceBundleVersionRef?: string | null;
  invalidationTriggerRefs?: readonly string[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  approvalRecordRef: string;
}

export interface RegisterAdviceVariantSetInput {
  adviceVariantSetId?: string;
  adviceBundleVersionRef: string;
  channelRef: string;
  localeRef: string;
  readingLevelRef?: string | null;
  contentBlocksRef: string;
  fallbackTransformRef?: string | null;
  previewChecksum: string;
  translationVersionRef: string;
  accessibilityVariantRefs?: readonly string[];
  linkedArtifactContractRefs?: readonly string[];
}

export interface EvaluateAdviceRenderCandidateInput {
  taskId: string;
  requestRef: string;
  pathwayRef: string;
  compiledPolicyBundleRef: string;
  adviceEligibilityGrantRef: string | null;
  effectiveAdviceGrantState: string | null;
  effectiveAdviceGrantReasonCodeRefs?: readonly string[];
  boundaryDecisionRef: string | null;
  boundaryTupleHash: string | null;
  decisionEpochRef: string | null;
  decisionSupersessionRecordRef?: string | null;
  routeIntentBindingRef: string | null;
  surfaceRouteContractRef: string | null;
  surfacePublicationRef: string | null;
  runtimePublicationBundleRef: string | null;
  dependencySetRef?: string | null;
  clinicalMeaningState: string | null;
  operationalFollowUpScope: string | null;
  reopenState: string | null;
  audienceTier: string | null;
  channelRef: string | null;
  localeRef: string | null;
  readingLevelRef?: string | null;
  accessibilityVariantRefs?: readonly string[];
  releaseApprovalFreezeRef?: string | null;
  channelReleaseFreezeRef?: string | null;
  publicationState?: AdviceRenderPublicationState;
  releaseTrustState?: AdviceRenderReleaseTrustState;
  releaseGateState?: AdviceRenderReleaseGateState;
  channelReleaseState?: AdviceRenderReleaseGateState;
  reasonCodeRefs?: readonly string[];
  artifactPresentationContractRef?: string | null;
  outboundNavigationGrantPolicyRef?: string | null;
  transitionEnvelopeRef?: string | null;
  recoveryDispositionRef?: string | null;
  visibilityTier?: string | null;
  summarySafetyTier?: string | null;
  placeholderContractRef?: string | null;
  recoveryRouteRef?: string | null;
  patientTimelineRef?: string | null;
  communicationTemplateRef?: string | null;
  controlStatusSnapshotRef?: string | null;
  settledAt: string;
}

export interface SettleAdviceRenderInput extends EvaluateAdviceRenderCandidateInput {
  commandActionRef: string;
  commandSettlementRef: string;
}

export interface TransitionAdviceRenderInput {
  taskId: string;
  adviceRenderSettlementId: string;
  nextRenderState: Exclude<AdviceRenderState, "renderable">;
  trustState?: AdviceRenderTrustState;
  reasonCodeRefs?: readonly string[];
  settledAt: string;
}

export interface AdviceRenderCandidateEvaluation {
  selectedAdviceBundleVersion: AdviceBundleVersionSnapshot | null;
  selectedAdviceVariantSet: AdviceVariantSetSnapshot | null;
  selectedApprovalRecord: ClinicalContentApprovalRecordSnapshot | null;
  selectedReviewSchedule: ContentReviewScheduleSnapshot | null;
  renderState: AdviceRenderState;
  trustState: AdviceRenderTrustState;
  reasonCodeRefs: readonly string[];
  variantFallbackPathRefs: readonly string[];
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef: string;
  transitionEnvelopeRef: string;
  recoveryDispositionRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  recoveryRouteRef: string;
  renderedContentBlocksRef: string;
  linkedArtifactContractRefs: readonly string[];
}

export interface Phase3AdviceRenderKernelRepositories {
  getClinicalContentApprovalRecord(
    clinicalContentApprovalRecordId: string,
  ): Promise<ClinicalContentApprovalRecordSnapshot | null>;
  saveClinicalContentApprovalRecord(
    approvalRecord: ClinicalContentApprovalRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listClinicalContentApprovalRecordsForBundle(
    adviceBundleVersionRef: string,
  ): Promise<readonly ClinicalContentApprovalRecordSnapshot[]>;

  getContentReviewSchedule(
    contentReviewScheduleId: string,
  ): Promise<ContentReviewScheduleSnapshot | null>;
  saveContentReviewSchedule(
    reviewSchedule: ContentReviewScheduleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listContentReviewSchedulesForBundle(
    adviceBundleVersionRef: string,
  ): Promise<readonly ContentReviewScheduleSnapshot[]>;
  getCurrentContentReviewScheduleForBundle(
    adviceBundleVersionRef: string,
  ): Promise<ContentReviewScheduleSnapshot | null>;

  getAdviceBundleVersion(adviceBundleVersionId: string): Promise<AdviceBundleVersionSnapshot | null>;
  saveAdviceBundleVersion(
    adviceBundleVersion: AdviceBundleVersionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdviceBundleVersionsForPathway(
    pathwayRef: string,
  ): Promise<readonly AdviceBundleVersionSnapshot[]>;

  getAdviceVariantSet(adviceVariantSetId: string): Promise<AdviceVariantSetSnapshot | null>;
  saveAdviceVariantSet(
    adviceVariantSet: AdviceVariantSetSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdviceVariantSetsForBundle(
    adviceBundleVersionRef: string,
  ): Promise<readonly AdviceVariantSetSnapshot[]>;

  getAdviceRenderSettlement(
    adviceRenderSettlementId: string,
  ): Promise<AdviceRenderSettlementSnapshot | null>;
  saveAdviceRenderSettlement(
    adviceRenderSettlement: AdviceRenderSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdviceRenderSettlementsForTask(
    taskId: string,
  ): Promise<readonly AdviceRenderSettlementSnapshot[]>;
  getCurrentAdviceRenderSettlementForTask(
    taskId: string,
  ): Promise<AdviceRenderSettlementSnapshot | null>;
}

class InMemoryPhase3AdviceRenderKernelStore
  implements Phase3AdviceRenderKernelRepositories
{
  private readonly approvals = new Map<string, ClinicalContentApprovalRecordSnapshot>();
  private readonly approvalsByBundle = new Map<string, string[]>();

  private readonly reviewSchedules = new Map<string, ContentReviewScheduleSnapshot>();
  private readonly reviewSchedulesByBundle = new Map<string, string[]>();
  private readonly currentReviewScheduleByBundle = new Map<string, string>();

  private readonly adviceBundles = new Map<string, AdviceBundleVersionSnapshot>();
  private readonly adviceBundlesByPathway = new Map<string, string[]>();

  private readonly adviceVariants = new Map<string, AdviceVariantSetSnapshot>();
  private readonly adviceVariantsByBundle = new Map<string, string[]>();

  private readonly settlements = new Map<string, AdviceRenderSettlementSnapshot>();
  private readonly settlementsByTask = new Map<string, string[]>();
  private readonly currentSettlementByTask = new Map<string, string>();

  async getClinicalContentApprovalRecord(
    clinicalContentApprovalRecordId: string,
  ): Promise<ClinicalContentApprovalRecordSnapshot | null> {
    return this.approvals.get(clinicalContentApprovalRecordId) ?? null;
  }

  async saveClinicalContentApprovalRecord(
    approvalRecord: ClinicalContentApprovalRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.approvals,
      approvalRecord.clinicalContentApprovalRecordId,
      approvalRecord,
      options,
    );
    const existing = this.approvalsByBundle.get(approvalRecord.adviceBundleVersionRef) ?? [];
    if (!existing.includes(approvalRecord.clinicalContentApprovalRecordId)) {
      this.approvalsByBundle.set(approvalRecord.adviceBundleVersionRef, [
        ...existing,
        approvalRecord.clinicalContentApprovalRecordId,
      ]);
    }
  }

  async listClinicalContentApprovalRecordsForBundle(
    adviceBundleVersionRef: string,
  ): Promise<readonly ClinicalContentApprovalRecordSnapshot[]> {
    return (this.approvalsByBundle.get(adviceBundleVersionRef) ?? [])
      .map((id) => this.approvals.get(id))
      .filter((entry): entry is ClinicalContentApprovalRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.approvedAt, right.approvedAt));
  }

  async getContentReviewSchedule(
    contentReviewScheduleId: string,
  ): Promise<ContentReviewScheduleSnapshot | null> {
    return this.reviewSchedules.get(contentReviewScheduleId) ?? null;
  }

  async saveContentReviewSchedule(
    reviewSchedule: ContentReviewScheduleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.reviewSchedules,
      reviewSchedule.contentReviewScheduleId,
      reviewSchedule,
      options,
    );
    const existing = this.reviewSchedulesByBundle.get(reviewSchedule.adviceBundleVersionRef) ?? [];
    if (!existing.includes(reviewSchedule.contentReviewScheduleId)) {
      this.reviewSchedulesByBundle.set(reviewSchedule.adviceBundleVersionRef, [
        ...existing,
        reviewSchedule.contentReviewScheduleId,
      ]);
    }
    if (reviewSchedule.reviewState !== "superseded") {
      this.currentReviewScheduleByBundle.set(
        reviewSchedule.adviceBundleVersionRef,
        reviewSchedule.contentReviewScheduleId,
      );
    } else if (
      this.currentReviewScheduleByBundle.get(reviewSchedule.adviceBundleVersionRef) ===
      reviewSchedule.contentReviewScheduleId
    ) {
      this.currentReviewScheduleByBundle.delete(reviewSchedule.adviceBundleVersionRef);
    }
  }

  async listContentReviewSchedulesForBundle(
    adviceBundleVersionRef: string,
  ): Promise<readonly ContentReviewScheduleSnapshot[]> {
    return (this.reviewSchedulesByBundle.get(adviceBundleVersionRef) ?? [])
      .map((id) => this.reviewSchedules.get(id))
      .filter((entry): entry is ContentReviewScheduleSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.lastReviewedAt, right.lastReviewedAt));
  }

  async getCurrentContentReviewScheduleForBundle(
    adviceBundleVersionRef: string,
  ): Promise<ContentReviewScheduleSnapshot | null> {
    const current = this.currentReviewScheduleByBundle.get(adviceBundleVersionRef);
    return current ? (this.reviewSchedules.get(current) ?? null) : null;
  }

  async getAdviceBundleVersion(
    adviceBundleVersionId: string,
  ): Promise<AdviceBundleVersionSnapshot | null> {
    return this.adviceBundles.get(adviceBundleVersionId) ?? null;
  }

  async saveAdviceBundleVersion(
    adviceBundleVersion: AdviceBundleVersionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.adviceBundles,
      adviceBundleVersion.adviceBundleVersionId,
      adviceBundleVersion,
      options,
    );
    const existing = this.adviceBundlesByPathway.get(adviceBundleVersion.pathwayRef) ?? [];
    if (!existing.includes(adviceBundleVersion.adviceBundleVersionId)) {
      this.adviceBundlesByPathway.set(adviceBundleVersion.pathwayRef, [
        ...existing,
        adviceBundleVersion.adviceBundleVersionId,
      ]);
    }
  }

  async listAdviceBundleVersionsForPathway(
    pathwayRef: string,
  ): Promise<readonly AdviceBundleVersionSnapshot[]> {
    return (this.adviceBundlesByPathway.get(pathwayRef) ?? [])
      .map((id) => this.adviceBundles.get(id))
      .filter((entry): entry is AdviceBundleVersionSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.effectiveFrom, right.effectiveFrom));
  }

  async getAdviceVariantSet(adviceVariantSetId: string): Promise<AdviceVariantSetSnapshot | null> {
    return this.adviceVariants.get(adviceVariantSetId) ?? null;
  }

  async saveAdviceVariantSet(
    adviceVariantSet: AdviceVariantSetSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.adviceVariants,
      adviceVariantSet.adviceVariantSetId,
      adviceVariantSet,
      options,
    );
    const existing = this.adviceVariantsByBundle.get(adviceVariantSet.adviceBundleVersionRef) ?? [];
    if (!existing.includes(adviceVariantSet.adviceVariantSetId)) {
      this.adviceVariantsByBundle.set(adviceVariantSet.adviceBundleVersionRef, [
        ...existing,
        adviceVariantSet.adviceVariantSetId,
      ]);
    }
  }

  async listAdviceVariantSetsForBundle(
    adviceBundleVersionRef: string,
  ): Promise<readonly AdviceVariantSetSnapshot[]> {
    return (this.adviceVariantsByBundle.get(adviceBundleVersionRef) ?? [])
      .map((id) => this.adviceVariants.get(id))
      .filter((entry): entry is AdviceVariantSetSnapshot => entry !== undefined)
      .sort((left, right) => left.adviceVariantSetId.localeCompare(right.adviceVariantSetId));
  }

  async getAdviceRenderSettlement(
    adviceRenderSettlementId: string,
  ): Promise<AdviceRenderSettlementSnapshot | null> {
    return this.settlements.get(adviceRenderSettlementId) ?? null;
  }

  async saveAdviceRenderSettlement(
    adviceRenderSettlement: AdviceRenderSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.settlements,
      adviceRenderSettlement.adviceRenderSettlementId,
      adviceRenderSettlement,
      options,
    );
    const existing = this.settlementsByTask.get(adviceRenderSettlement.taskId) ?? [];
    if (!existing.includes(adviceRenderSettlement.adviceRenderSettlementId)) {
      this.settlementsByTask.set(adviceRenderSettlement.taskId, [
        ...existing,
        adviceRenderSettlement.adviceRenderSettlementId,
      ]);
    }
    this.currentSettlementByTask.set(
      adviceRenderSettlement.taskId,
      adviceRenderSettlement.adviceRenderSettlementId,
    );
  }

  async listAdviceRenderSettlementsForTask(
    taskId: string,
  ): Promise<readonly AdviceRenderSettlementSnapshot[]> {
    return (this.settlementsByTask.get(taskId) ?? [])
      .map((id) => this.settlements.get(id))
      .filter((entry): entry is AdviceRenderSettlementSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.settledAt, right.settledAt));
  }

  async getCurrentAdviceRenderSettlementForTask(
    taskId: string,
  ): Promise<AdviceRenderSettlementSnapshot | null> {
    const current = this.currentSettlementByTask.get(taskId);
    return current ? (this.settlements.get(current) ?? null) : null;
  }
}

function buildApprovalScopeHash(input: {
  adviceBundleVersionRef: string;
  compiledPolicyBundleRef: string;
  approvedAudienceTierRefs: readonly string[];
  approvedChannelRefs: readonly string[];
  approvedLocaleRefs: readonly string[];
  approvedReadingLevelRefs: readonly string[];
  approvedAccessibilityVariantRefs: readonly string[];
}): string {
  return `approval_scope_${stableReviewDigest({
    adviceBundleVersionRef: input.adviceBundleVersionRef,
    compiledPolicyBundleRef: input.compiledPolicyBundleRef,
    approvedAudienceTierRefs: uniqueSorted(input.approvedAudienceTierRefs),
    approvedChannelRefs: uniqueSorted(input.approvedChannelRefs),
    approvedLocaleRefs: uniqueSorted(input.approvedLocaleRefs),
    approvedReadingLevelRefs: uniqueSorted(input.approvedReadingLevelRefs),
    approvedAccessibilityVariantRefs: uniqueSorted(input.approvedAccessibilityVariantRefs),
  })}`;
}

function evaluateApprovalState(
  approval: ClinicalContentApprovalRecordSnapshot,
  asOf: string,
): ClinicalContentApprovalState {
  if (approval.approvalState === "superseded" || approval.approvalState === "revoked") {
    return approval.approvalState;
  }
  if (approval.validUntil !== null && compareIso(approval.validUntil, asOf) <= 0) {
    return "expired";
  }
  return approval.approvalState;
}

function evaluateReviewState(
  schedule: ContentReviewScheduleSnapshot,
  asOf: string,
): ContentReviewState {
  if (schedule.reviewState === "superseded") {
    return "superseded";
  }
  if (schedule.hardExpiryAt !== null && compareIso(schedule.hardExpiryAt, asOf) <= 0) {
    return "expired";
  }
  if (compareIso(schedule.nextReviewDueAt, asOf) <= 0) {
    return "review_due";
  }
  return schedule.reviewState;
}

function validateApprovalCoverage(
  approval: ClinicalContentApprovalRecordSnapshot,
  input: EvaluateAdviceRenderCandidateInput,
  reasonCodeRefs: Set<string>,
): boolean {
  const audienceTier = optionalRef(input.audienceTier);
  const channelRef = optionalRef(input.channelRef);
  const localeRef = optionalRef(input.localeRef);
  const readingLevelRef = optionalRef(input.readingLevelRef);
  const accessibilityVariantRefs = uniqueSorted(input.accessibilityVariantRefs ?? []);

  let valid = true;
  if (!maybeAny(approval.approvedAudienceTierRefs, audienceTier)) {
    reasonCodeRefs.add("approval_audience_tier_mismatch");
    valid = false;
  }
  if (!maybeAny(approval.approvedChannelRefs, channelRef)) {
    reasonCodeRefs.add("approval_channel_mismatch");
    valid = false;
  }
  if (!maybeAny(approval.approvedLocaleRefs, localeRef)) {
    reasonCodeRefs.add("approval_locale_mismatch");
    valid = false;
  }
  if (!maybeAny(approval.approvedReadingLevelRefs, readingLevelRef)) {
    reasonCodeRefs.add("approval_reading_level_mismatch");
    valid = false;
  }
  if (
    approval.approvedAccessibilityVariantRefs.length > 0 &&
    !includesAll(approval.approvedAccessibilityVariantRefs, accessibilityVariantRefs)
  ) {
    reasonCodeRefs.add("approval_accessibility_variant_mismatch");
    valid = false;
  }
  return valid;
}

function renderTrustState(input: {
  publicationState: AdviceRenderPublicationState;
  releaseTrustState: AdviceRenderReleaseTrustState;
  releaseGateState: AdviceRenderReleaseGateState;
  channelReleaseState: AdviceRenderReleaseGateState;
}): AdviceRenderTrustState {
  if (
    input.publicationState === "stale" ||
    input.releaseTrustState === "quarantined" ||
    input.releaseGateState === "quarantined" ||
    input.channelReleaseState === "quarantined"
  ) {
    return "quarantined";
  }
  if (
    input.publicationState === "drifted" ||
    input.releaseTrustState === "degraded" ||
    input.releaseTrustState === "recovery_bound" ||
    input.releaseGateState === "frozen" ||
    input.channelReleaseState === "frozen"
  ) {
    return "degraded";
  }
  return "trusted";
}

export interface Phase3AdviceRenderKernelService {
  queryTaskBundle(taskId: string): Promise<Phase3AdviceRenderBundle>;
  registerClinicalContentApprovalRecord(
    input: RegisterClinicalContentApprovalRecordInput,
  ): Promise<ClinicalContentApprovalRecordSnapshot>;
  registerContentReviewSchedule(
    input: RegisterContentReviewScheduleInput,
  ): Promise<ContentReviewScheduleSnapshot>;
  registerAdviceBundleVersion(
    input: RegisterAdviceBundleVersionInput,
  ): Promise<AdviceBundleVersionSnapshot>;
  registerAdviceVariantSet(
    input: RegisterAdviceVariantSetInput,
  ): Promise<AdviceVariantSetSnapshot>;
  evaluateAdviceRenderCandidate(
    input: EvaluateAdviceRenderCandidateInput,
  ): Promise<AdviceRenderCandidateEvaluation>;
  settleAdviceRender(
    input: SettleAdviceRenderInput,
  ): Promise<{
    renderSettlement: AdviceRenderSettlementSnapshot;
    selectedAdviceBundleVersion: AdviceBundleVersionSnapshot | null;
    selectedAdviceVariantSet: AdviceVariantSetSnapshot | null;
    selectedApprovalRecord: ClinicalContentApprovalRecordSnapshot | null;
    selectedReviewSchedule: ContentReviewScheduleSnapshot | null;
    reusedExisting: boolean;
  }>;
  transitionAdviceRender(
    input: TransitionAdviceRenderInput,
  ): Promise<AdviceRenderSettlementSnapshot>;
}

class Phase3AdviceRenderKernelServiceImpl implements Phase3AdviceRenderKernelService {
  constructor(
    private readonly repositories: Phase3AdviceRenderKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryTaskBundle(taskId: string): Promise<Phase3AdviceRenderBundle> {
    const renderSettlements = await this.repositories.listAdviceRenderSettlementsForTask(taskId);
    const approvalIds = new Set<string>();
    const scheduleIds = new Set<string>();
    const bundleIds = new Set<string>();
    const variantIds = new Set<string>();

    renderSettlements.forEach((settlement) => {
      approvalIds.add(settlement.clinicalContentApprovalRecordRef);
      scheduleIds.add(settlement.contentReviewScheduleRef);
      bundleIds.add(settlement.adviceBundleVersionRef);
      variantIds.add(settlement.adviceVariantSetRef);
    });

    const clinicalContentApprovalRecords = await Promise.all(
      [...approvalIds].map((id) => this.repositories.getClinicalContentApprovalRecord(id)),
    );
    const contentReviewSchedules = await Promise.all(
      [...scheduleIds].map((id) => this.repositories.getContentReviewSchedule(id)),
    );
    const adviceBundleVersions = await Promise.all(
      [...bundleIds].map((id) => this.repositories.getAdviceBundleVersion(id)),
    );
    const adviceVariantSets = await Promise.all(
      [...variantIds].map((id) => this.repositories.getAdviceVariantSet(id)),
    );

    return {
      currentRenderSettlement: await this.repositories.getCurrentAdviceRenderSettlementForTask(taskId),
      renderSettlements,
      clinicalContentApprovalRecords: clinicalContentApprovalRecords.filter(
        (entry): entry is ClinicalContentApprovalRecordSnapshot => entry !== null,
      ),
      contentReviewSchedules: contentReviewSchedules.filter(
        (entry): entry is ContentReviewScheduleSnapshot => entry !== null,
      ),
      adviceBundleVersions: adviceBundleVersions.filter(
        (entry): entry is AdviceBundleVersionSnapshot => entry !== null,
      ),
      adviceVariantSets: adviceVariantSets.filter(
        (entry): entry is AdviceVariantSetSnapshot => entry !== null,
      ),
    };
  }

  async registerClinicalContentApprovalRecord(
    input: RegisterClinicalContentApprovalRecordInput,
  ): Promise<ClinicalContentApprovalRecordSnapshot> {
    invariant(
      approvalStates.includes(input.approvalState),
      "INVALID_CONTENT_APPROVAL_STATE",
      "Unsupported ClinicalContentApprovalRecord approvalState.",
    );
    const approvedAudienceTierRefs = uniqueSorted(input.approvedAudienceTierRefs);
    const approvedChannelRefs = uniqueSorted(input.approvedChannelRefs);
    const approvedLocaleRefs = uniqueSorted(input.approvedLocaleRefs);
    const approvedReadingLevelRefs = uniqueSorted(input.approvedReadingLevelRefs ?? []);
    const approvedAccessibilityVariantRefs = uniqueSorted(
      input.approvedAccessibilityVariantRefs ?? [],
    );
    const approvedAt = ensureIsoTimestamp(input.approvedAt, "approvedAt");
    const validFrom = ensureIsoTimestamp(input.validFrom, "validFrom");
    const validUntil = optionalRef(input.validUntil)
      ? ensureIsoTimestamp(input.validUntil!, "validUntil")
      : null;
    const approvalRecordId =
      input.clinicalContentApprovalRecordId ??
      `clinical_content_approval_${stableReviewDigest({
        adviceBundleVersionRef: input.adviceBundleVersionRef,
        compiledPolicyBundleRef: input.compiledPolicyBundleRef,
        approvedAudienceTierRefs,
        approvedChannelRefs,
        approvedLocaleRefs,
        approvedReadingLevelRefs,
        approvedAccessibilityVariantRefs,
        approvalState: input.approvalState,
      })}`;
    const existing = await this.repositories.getClinicalContentApprovalRecord(approvalRecordId);
    if (existing) {
      return existing;
    }
    const snapshot: ClinicalContentApprovalRecordSnapshot = {
      clinicalContentApprovalRecordId: approvalRecordId,
      pathwayRef: requireRef(input.pathwayRef, "pathwayRef"),
      adviceBundleVersionRef: requireRef(input.adviceBundleVersionRef, "adviceBundleVersionRef"),
      clinicalIntentRef: requireRef(input.clinicalIntentRef, "clinicalIntentRef"),
      compiledPolicyBundleRef: requireRef(input.compiledPolicyBundleRef, "compiledPolicyBundleRef"),
      approvalScopeHash: buildApprovalScopeHash({
        adviceBundleVersionRef: input.adviceBundleVersionRef,
        compiledPolicyBundleRef: input.compiledPolicyBundleRef,
        approvedAudienceTierRefs,
        approvedChannelRefs,
        approvedLocaleRefs,
        approvedReadingLevelRefs,
        approvedAccessibilityVariantRefs,
      }),
      approvedAudienceTierRefs,
      approvedChannelRefs,
      approvedLocaleRefs,
      approvedReadingLevelRefs,
      approvedAccessibilityVariantRefs,
      approvalState: input.approvalState,
      reviewScheduleRef: optionalRef(input.reviewScheduleRef),
      approvedByRef: requireRef(input.approvedByRef, "approvedByRef"),
      approvedAt,
      validFrom,
      validUntil,
      supersedesApprovalRecordRef: optionalRef(input.supersedesApprovalRecordRef),
      reasonCodeRefs: uniqueSorted(input.reasonCodeRefs ?? []),
      version: 1,
    };
    await this.repositories.saveClinicalContentApprovalRecord(snapshot);
    return snapshot;
  }

  async registerContentReviewSchedule(
    input: RegisterContentReviewScheduleInput,
  ): Promise<ContentReviewScheduleSnapshot> {
    invariant(
      reviewStates.includes(input.reviewState),
      "INVALID_CONTENT_REVIEW_STATE",
      "Unsupported ContentReviewSchedule reviewState.",
    );
    const contentReviewScheduleId =
      input.contentReviewScheduleId ??
      `content_review_schedule_${stableReviewDigest({
        adviceBundleVersionRef: input.adviceBundleVersionRef,
        reviewCadenceRef: input.reviewCadenceRef,
        reviewState: input.reviewState,
        nextReviewDueAt: input.nextReviewDueAt,
      })}`;
    const existing = await this.repositories.getContentReviewSchedule(contentReviewScheduleId);
    if (existing) {
      return existing;
    }
    const snapshot: ContentReviewScheduleSnapshot = {
      contentReviewScheduleId,
      pathwayRef: requireRef(input.pathwayRef, "pathwayRef"),
      adviceBundleVersionRef: requireRef(input.adviceBundleVersionRef, "adviceBundleVersionRef"),
      reviewCadenceRef: requireRef(input.reviewCadenceRef, "reviewCadenceRef"),
      reviewState: input.reviewState,
      lastReviewedAt: ensureIsoTimestamp(input.lastReviewedAt, "lastReviewedAt"),
      nextReviewDueAt: ensureIsoTimestamp(input.nextReviewDueAt, "nextReviewDueAt"),
      hardExpiryAt: optionalRef(input.hardExpiryAt)
        ? ensureIsoTimestamp(input.hardExpiryAt!, "hardExpiryAt")
        : null,
      reviewOwnerRef: requireRef(input.reviewOwnerRef, "reviewOwnerRef"),
      version: 1,
    };
    await this.repositories.saveContentReviewSchedule(snapshot);
    return snapshot;
  }

  async registerAdviceBundleVersion(
    input: RegisterAdviceBundleVersionInput,
  ): Promise<AdviceBundleVersionSnapshot> {
    const adviceBundleVersionId =
      input.adviceBundleVersionId ??
      `advice_bundle_version_${stableReviewDigest({
        pathwayRef: input.pathwayRef,
        compiledPolicyBundleRef: input.compiledPolicyBundleRef,
        clinicalIntentRef: input.clinicalIntentRef,
        audienceTierRefs: uniqueSorted(input.audienceTierRefs),
        variantSetRef: input.variantSetRef,
        effectiveFrom: input.effectiveFrom,
      })}`;
    const existing = await this.repositories.getAdviceBundleVersion(adviceBundleVersionId);
    if (existing) {
      return existing;
    }
    const snapshot: AdviceBundleVersionSnapshot = {
      adviceBundleVersionId,
      pathwayRef: requireRef(input.pathwayRef, "pathwayRef"),
      compiledPolicyBundleRef: requireRef(input.compiledPolicyBundleRef, "compiledPolicyBundleRef"),
      clinicalIntentRef: requireRef(input.clinicalIntentRef, "clinicalIntentRef"),
      audienceTierRefs: uniqueSorted(input.audienceTierRefs),
      variantSetRef: requireRef(input.variantSetRef, "variantSetRef"),
      safetyNetInstructionSetRef: requireRef(
        input.safetyNetInstructionSetRef,
        "safetyNetInstructionSetRef",
      ),
      supersedesAdviceBundleVersionRef: optionalRef(input.supersedesAdviceBundleVersionRef),
      invalidationTriggerRefs: uniqueSorted(input.invalidationTriggerRefs ?? []),
      effectiveFrom: ensureIsoTimestamp(input.effectiveFrom, "effectiveFrom"),
      effectiveTo: optionalRef(input.effectiveTo)
        ? ensureIsoTimestamp(input.effectiveTo!, "effectiveTo")
        : null,
      approvalRecordRef: requireRef(input.approvalRecordRef, "approvalRecordRef"),
      version: 1,
    };
    await this.repositories.saveAdviceBundleVersion(snapshot);
    return snapshot;
  }

  async registerAdviceVariantSet(
    input: RegisterAdviceVariantSetInput,
  ): Promise<AdviceVariantSetSnapshot> {
    const linkedArtifactContractRefs = uniqueSorted(input.linkedArtifactContractRefs ?? []);
    invariant(
      linkedArtifactContractRefs.every((value) => !isRawExternalRef(value)),
      "RAW_ARTIFACT_URL_FORBIDDEN",
      "AdviceVariantSet linkedArtifactContractRefs may not contain raw external URLs.",
    );
    const adviceVariantSetId =
      input.adviceVariantSetId ??
      `advice_variant_set_${stableReviewDigest({
        adviceBundleVersionRef: input.adviceBundleVersionRef,
        channelRef: input.channelRef,
        localeRef: input.localeRef,
        readingLevelRef: optionalRef(input.readingLevelRef),
        previewChecksum: input.previewChecksum,
        translationVersionRef: input.translationVersionRef,
      })}`;
    const existing = await this.repositories.getAdviceVariantSet(adviceVariantSetId);
    if (existing) {
      return existing;
    }
    const snapshot: AdviceVariantSetSnapshot = {
      adviceVariantSetId,
      adviceBundleVersionRef: requireRef(input.adviceBundleVersionRef, "adviceBundleVersionRef"),
      channelRef: requireRef(input.channelRef, "channelRef"),
      localeRef: requireRef(input.localeRef, "localeRef"),
      readingLevelRef: optionalRef(input.readingLevelRef),
      contentBlocksRef: requireRef(input.contentBlocksRef, "contentBlocksRef"),
      fallbackTransformRef: optionalRef(input.fallbackTransformRef),
      previewChecksum: requireRef(input.previewChecksum, "previewChecksum"),
      translationVersionRef: requireRef(input.translationVersionRef, "translationVersionRef"),
      accessibilityVariantRefs: uniqueSorted(input.accessibilityVariantRefs ?? []),
      linkedArtifactContractRefs,
      version: 1,
    };
    await this.repositories.saveAdviceVariantSet(snapshot);
    return snapshot;
  }

  async evaluateAdviceRenderCandidate(
    input: EvaluateAdviceRenderCandidateInput,
  ): Promise<AdviceRenderCandidateEvaluation> {
    const settledAt = ensureIsoTimestamp(input.settledAt, "settledAt");
    const reasonCodeRefs = new Set<string>(input.reasonCodeRefs ?? []);
    const pathwayRef = requireRef(input.pathwayRef, "pathwayRef");
    const publicationState = input.publicationState ?? "current";
    const releaseTrustState = input.releaseTrustState ?? "trusted";
    const releaseGateState = input.releaseGateState ?? "open";
    const channelReleaseState = input.channelReleaseState ?? "open";

    const trustState = renderTrustState({
      publicationState,
      releaseTrustState,
      releaseGateState,
      channelReleaseState,
    });

    if (publicationState === "drifted") {
      reasonCodeRefs.add("surface_publication_drift");
    }
    if (publicationState === "stale") {
      reasonCodeRefs.add("surface_publication_stale");
    }
    if (releaseTrustState === "degraded") {
      reasonCodeRefs.add("release_trust_degraded");
    }
    if (releaseTrustState === "recovery_bound") {
      reasonCodeRefs.add("release_trust_recovery_bound");
    }
    if (releaseTrustState === "quarantined") {
      reasonCodeRefs.add("release_trust_quarantined");
    }
    if (releaseGateState === "frozen") {
      reasonCodeRefs.add("release_approval_freeze_active");
    }
    if (releaseGateState === "quarantined") {
      reasonCodeRefs.add("release_approval_quarantined");
    }
    if (channelReleaseState === "frozen") {
      reasonCodeRefs.add("channel_release_freeze_active");
    }
    if (channelReleaseState === "quarantined") {
      reasonCodeRefs.add("channel_release_quarantined");
    }

    let selectedAdviceBundleVersion: AdviceBundleVersionSnapshot | null = null;
    let selectedAdviceVariantSet: AdviceVariantSetSnapshot | null = null;
    let selectedApprovalRecord: ClinicalContentApprovalRecordSnapshot | null = null;
    let selectedReviewSchedule: ContentReviewScheduleSnapshot | null = null;
    let variantFallbackPathRefs: string[] = [];

    const candidateBundles = (
      await this.repositories.listAdviceBundleVersionsForPathway(pathwayRef)
    ).filter((bundle) => {
      if (bundle.compiledPolicyBundleRef !== requireRef(input.compiledPolicyBundleRef, "compiledPolicyBundleRef")) {
        return false;
      }
      const audienceTier = optionalRef(input.audienceTier);
      if (audienceTier && !bundle.audienceTierRefs.includes(audienceTier)) {
        return false;
      }
      if (compareIso(bundle.effectiveFrom, settledAt) > 0) {
        return false;
      }
      if (bundle.effectiveTo !== null && compareIso(bundle.effectiveTo, settledAt) <= 0) {
        return false;
      }
      return true;
    });

    selectedAdviceBundleVersion = candidateBundles.at(-1) ?? null;
    if (!selectedAdviceBundleVersion) {
      reasonCodeRefs.add("advice_bundle_version_missing");
    } else {
      selectedApprovalRecord =
        (await this.repositories.getClinicalContentApprovalRecord(
          selectedAdviceBundleVersion.approvalRecordRef,
        )) ?? null;
      if (!selectedApprovalRecord) {
        reasonCodeRefs.add("content_approval_missing");
      } else {
        const approvalState = evaluateApprovalState(selectedApprovalRecord, settledAt);
        if (approvalState !== "approved") {
          reasonCodeRefs.add(`content_approval_${approvalState}`);
          selectedApprovalRecord = {
            ...selectedApprovalRecord,
            approvalState,
          };
        }
        if (!validateApprovalCoverage(selectedApprovalRecord, input, reasonCodeRefs)) {
          selectedApprovalRecord = {
            ...selectedApprovalRecord,
          };
        }
      }

      selectedReviewSchedule =
        (await this.repositories.getCurrentContentReviewScheduleForBundle(
          selectedAdviceBundleVersion.adviceBundleVersionId,
        )) ?? null;
      if (!selectedReviewSchedule) {
        reasonCodeRefs.add("content_review_schedule_missing");
      } else {
        const reviewState = evaluateReviewState(selectedReviewSchedule, settledAt);
        if (reviewState !== "current") {
          reasonCodeRefs.add(`content_review_${reviewState}`);
          selectedReviewSchedule = {
            ...selectedReviewSchedule,
            reviewState,
          };
        }
      }

      const variants = await this.repositories.listAdviceVariantSetsForBundle(
        selectedAdviceBundleVersion.adviceBundleVersionId,
      );
      const accessibilityVariantRefs = uniqueSorted(input.accessibilityVariantRefs ?? []);
      const exact = variants.find(
        (variant) =>
          variant.channelRef === optionalRef(input.channelRef) &&
          variant.localeRef === optionalRef(input.localeRef) &&
          optionalRef(input.readingLevelRef) === variant.readingLevelRef &&
          includesAll(variant.accessibilityVariantRefs, accessibilityVariantRefs),
      );
      if (exact) {
        selectedAdviceVariantSet = exact;
      } else {
        const localeFallback = variants.find(
          (variant) =>
            variant.channelRef === optionalRef(input.channelRef) &&
            variant.fallbackTransformRef !== null &&
            (optionalRef(input.readingLevelRef) === null ||
              optionalRef(input.readingLevelRef) === variant.readingLevelRef) &&
            includesAll(variant.accessibilityVariantRefs, accessibilityVariantRefs),
        );
        if (localeFallback) {
          selectedAdviceVariantSet = localeFallback;
          variantFallbackPathRefs = ["fallback_locale_transform"];
        } else {
          const readingFallback = variants.find(
            (variant) =>
              variant.channelRef === optionalRef(input.channelRef) &&
              variant.localeRef === optionalRef(input.localeRef) &&
              variant.readingLevelRef === null &&
              includesAll(variant.accessibilityVariantRefs, accessibilityVariantRefs),
          );
          if (readingFallback) {
            selectedAdviceVariantSet = readingFallback;
            variantFallbackPathRefs = ["fallback_reading_level_default"];
          }
        }
      }
      if (!selectedAdviceVariantSet) {
        reasonCodeRefs.add("advice_variant_missing");
      }
    }

    let renderState: AdviceRenderState = "renderable";
    if (optionalRef(input.boundaryDecisionRef) === null || optionalRef(input.boundaryTupleHash) === null) {
      renderState = "withheld";
      reasonCodeRefs.add("boundary_decision_missing");
    }
    if (optionalRef(input.routeIntentBindingRef) === null) {
      renderState = "withheld";
      reasonCodeRefs.add("route_intent_binding_missing");
    }
    if (input.effectiveAdviceGrantState !== "live") {
      if (
        input.effectiveAdviceGrantState === "invalidated" ||
        input.effectiveAdviceGrantState === "expired" ||
        input.effectiveAdviceGrantState === "superseded"
      ) {
        renderState = "invalidated";
      } else {
        renderState = "withheld";
      }
      for (const reason of input.effectiveAdviceGrantReasonCodeRefs ?? []) {
        reasonCodeRefs.add(reason);
      }
      if (input.effectiveAdviceGrantState === null) {
        reasonCodeRefs.add("advice_grant_missing");
      } else {
        reasonCodeRefs.add(`advice_grant_${input.effectiveAdviceGrantState}`);
      }
    }
    if (input.clinicalMeaningState !== "informational_only") {
      renderState = renderState === "renderable" ? "invalidated" : renderState;
      reasonCodeRefs.add("clinical_meaning_not_informational_only");
    }
    if (input.operationalFollowUpScope !== "self_serve_guidance") {
      renderState = renderState === "renderable" ? "invalidated" : renderState;
      reasonCodeRefs.add("operational_follow_up_scope_not_self_serve_guidance");
    }
    if (input.reopenState !== "stable") {
      renderState = renderState === "renderable" ? "invalidated" : renderState;
      reasonCodeRefs.add("boundary_reopen_not_stable");
    }
    if (selectedAdviceBundleVersion === null && renderState === "renderable") {
      renderState = "withheld";
    }
    if (
      selectedApprovalRecord !== null &&
      evaluateApprovalState(selectedApprovalRecord, settledAt) !== "approved" &&
      renderState === "renderable"
    ) {
      renderState = "withheld";
    }
    if (
      selectedReviewSchedule !== null &&
      evaluateReviewState(selectedReviewSchedule, settledAt) !== "current" &&
      renderState === "renderable"
    ) {
      renderState = "withheld";
    }
    if (selectedAdviceVariantSet === null && renderState === "renderable") {
      renderState = "withheld";
    }
    if (trustState === "quarantined") {
      renderState = "quarantined";
    } else if (trustState === "degraded" && renderState === "renderable") {
      renderState = "withheld";
    }

    const artifactPresentationContractRef =
      optionalRef(input.artifactPresentationContractRef) ??
      selectedAdviceVariantSet?.linkedArtifactContractRefs[0] ??
      "artifact_presentation_contract.self_care.summary_first";
    invariant(
      !isRawExternalRef(artifactPresentationContractRef),
      "RAW_ARTIFACT_URL_FORBIDDEN",
      "Advice render settlement may not emit a raw external artifact contract reference.",
    );
    const outboundNavigationGrantPolicyRef =
      optionalRef(input.outboundNavigationGrantPolicyRef) ??
      "outbound_navigation_grant_policy.self_care.summary_first";
    const transitionEnvelopeRef =
      optionalRef(input.transitionEnvelopeRef) ??
      `transition_envelope_${input.taskId}_${renderState}`;
    const recoveryDispositionRef =
      optionalRef(input.recoveryDispositionRef) ??
      `recovery_disposition_self_care_${renderState}`;
    const visibilityTier = optionalRef(input.visibilityTier) ?? "authenticated";
    const summarySafetyTier = optionalRef(input.summarySafetyTier) ?? "clinical_safe_summary";
    const placeholderContractRef =
      optionalRef(input.placeholderContractRef) ??
      "placeholder_contract.self_care.summary_placeholder";
    const recoveryRouteRef =
      optionalRef(input.recoveryRouteRef) ??
      "/portal/self-care/recovery";

    const renderedContentBlocksRef =
      selectedAdviceVariantSet?.contentBlocksRef ??
      "content_blocks_ref.self_care.placeholder";
    const linkedArtifactContractRefs =
      selectedAdviceVariantSet?.linkedArtifactContractRefs ?? [];

    return {
      selectedAdviceBundleVersion,
      selectedAdviceVariantSet,
      selectedApprovalRecord,
      selectedReviewSchedule,
      renderState,
      trustState,
      reasonCodeRefs: uniqueSorted([...reasonCodeRefs]),
      variantFallbackPathRefs,
      artifactPresentationContractRef,
      outboundNavigationGrantPolicyRef,
      transitionEnvelopeRef,
      recoveryDispositionRef,
      visibilityTier,
      summarySafetyTier,
      placeholderContractRef,
      recoveryRouteRef,
      renderedContentBlocksRef,
      linkedArtifactContractRefs,
    };
  }

  async settleAdviceRender(
    input: SettleAdviceRenderInput,
  ): Promise<{
    renderSettlement: AdviceRenderSettlementSnapshot;
    selectedAdviceBundleVersion: AdviceBundleVersionSnapshot | null;
    selectedAdviceVariantSet: AdviceVariantSetSnapshot | null;
    selectedApprovalRecord: ClinicalContentApprovalRecordSnapshot | null;
    selectedReviewSchedule: ContentReviewScheduleSnapshot | null;
    reusedExisting: boolean;
  }> {
    const evaluation = await this.evaluateAdviceRenderCandidate(input);
    const current = await this.repositories.getCurrentAdviceRenderSettlementForTask(input.taskId);
    if (
      current &&
      current.boundaryTupleHash === optionalRef(input.boundaryTupleHash) &&
      current.adviceEligibilityGrantRef === optionalRef(input.adviceEligibilityGrantRef) &&
      current.adviceBundleVersionRef ===
        (evaluation.selectedAdviceBundleVersion?.adviceBundleVersionId ?? current.adviceBundleVersionRef) &&
      current.adviceVariantSetRef ===
        (evaluation.selectedAdviceVariantSet?.adviceVariantSetId ?? current.adviceVariantSetRef) &&
      current.renderState === evaluation.renderState &&
      current.trustState === evaluation.trustState
    ) {
      return {
        renderSettlement: current,
        selectedAdviceBundleVersion: evaluation.selectedAdviceBundleVersion,
        selectedAdviceVariantSet: evaluation.selectedAdviceVariantSet,
        selectedApprovalRecord: evaluation.selectedApprovalRecord,
        selectedReviewSchedule: evaluation.selectedReviewSchedule,
        reusedExisting: true,
      };
    }

    const settledAt = ensureIsoTimestamp(input.settledAt, "settledAt");
    const renderRevision = current ? current.renderRevision + 1 : 1;
    const settlement: AdviceRenderSettlementSnapshot = {
      adviceRenderSettlementId: nextId(this.idGenerator, "phase3_advice_render_settlement"),
      taskId: requireRef(input.taskId, "taskId"),
      requestRef: requireRef(input.requestRef, "requestRef"),
      adviceEligibilityGrantRef: requireRef(input.adviceEligibilityGrantRef, "adviceEligibilityGrantRef"),
      boundaryDecisionRef: requireRef(input.boundaryDecisionRef, "boundaryDecisionRef"),
      boundaryTupleHash: requireRef(input.boundaryTupleHash, "boundaryTupleHash"),
      decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
      decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
      adviceBundleVersionRef:
        evaluation.selectedAdviceBundleVersion?.adviceBundleVersionId ??
        "advice_bundle_version.missing",
      adviceVariantSetRef:
        evaluation.selectedAdviceVariantSet?.adviceVariantSetId ?? "advice_variant_set.missing",
      clinicalContentApprovalRecordRef:
        evaluation.selectedApprovalRecord?.clinicalContentApprovalRecordId ??
        "clinical_content_approval_record.missing",
      contentReviewScheduleRef:
        evaluation.selectedReviewSchedule?.contentReviewScheduleId ??
        "content_review_schedule.missing",
      routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
      commandActionRef: requireRef(input.commandActionRef, "commandActionRef"),
      commandSettlementRef: requireRef(input.commandSettlementRef, "commandSettlementRef"),
      releaseApprovalFreezeRef: optionalRef(input.releaseApprovalFreezeRef),
      channelReleaseFreezeRef: optionalRef(input.channelReleaseFreezeRef),
      surfaceRouteContractRef: requireRef(input.surfaceRouteContractRef, "surfaceRouteContractRef"),
      surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
      runtimePublicationBundleRef: requireRef(
        input.runtimePublicationBundleRef,
        "runtimePublicationBundleRef",
      ),
      dependencySetRef: optionalRef(input.dependencySetRef),
      clinicalMeaningState: requireRef(input.clinicalMeaningState, "clinicalMeaningState"),
      operationalFollowUpScope: requireRef(
        input.operationalFollowUpScope,
        "operationalFollowUpScope",
      ),
      reopenState: requireRef(input.reopenState, "reopenState"),
      renderState: evaluation.renderState,
      trustState: evaluation.trustState,
      reasonCodeRefs: evaluation.reasonCodeRefs,
      patientTimelineRef: optionalRef(input.patientTimelineRef),
      communicationTemplateRef: optionalRef(input.communicationTemplateRef),
      controlStatusSnapshotRef: optionalRef(input.controlStatusSnapshotRef),
      artifactPresentationContractRef: evaluation.artifactPresentationContractRef,
      outboundNavigationGrantPolicyRef: evaluation.outboundNavigationGrantPolicyRef,
      transitionEnvelopeRef: evaluation.transitionEnvelopeRef,
      recoveryDispositionRef: evaluation.recoveryDispositionRef,
      visibilityTier: evaluation.visibilityTier,
      summarySafetyTier: evaluation.summarySafetyTier,
      placeholderContractRef: evaluation.placeholderContractRef,
      recoveryRouteRef: evaluation.recoveryRouteRef,
      renderedContentBlocksRef: evaluation.renderedContentBlocksRef,
      variantFallbackPathRefs: evaluation.variantFallbackPathRefs,
      linkedArtifactContractRefs: evaluation.linkedArtifactContractRefs,
      supersedesAdviceRenderSettlementRef: current?.adviceRenderSettlementId ?? null,
      settledAt,
      renderRevision,
      version: 1,
    };
    await this.repositories.saveAdviceRenderSettlement(settlement);
    return {
      renderSettlement: settlement,
      selectedAdviceBundleVersion: evaluation.selectedAdviceBundleVersion,
      selectedAdviceVariantSet: evaluation.selectedAdviceVariantSet,
      selectedApprovalRecord: evaluation.selectedApprovalRecord,
      selectedReviewSchedule: evaluation.selectedReviewSchedule,
      reusedExisting: false,
    };
  }

  async transitionAdviceRender(
    input: TransitionAdviceRenderInput,
  ): Promise<AdviceRenderSettlementSnapshot> {
    invariant(
      renderStates.includes(input.nextRenderState),
      "INVALID_ADVICE_RENDER_STATE",
      "Unsupported AdviceRenderSettlement renderState.",
    );
    const current = await this.repositories.getAdviceRenderSettlement(input.adviceRenderSettlementId);
    invariant(
      current,
      "ADVICE_RENDER_SETTLEMENT_NOT_FOUND",
      `AdviceRenderSettlement ${input.adviceRenderSettlementId} is required.`,
    );
    if (current.renderState === input.nextRenderState) {
      return current;
    }
    const settledAt = ensureIsoTimestamp(input.settledAt, "settledAt");
    const trustState =
      input.trustState ??
      (input.nextRenderState === "quarantined" ? "quarantined" : current.trustState);
    invariant(
      trustStates.includes(trustState),
      "INVALID_ADVICE_RENDER_TRUST_STATE",
      "Unsupported AdviceRenderSettlement trustState.",
    );
    const transitioned: AdviceRenderSettlementSnapshot = {
      ...current,
      adviceRenderSettlementId: nextId(this.idGenerator, "phase3_advice_render_settlement"),
      renderState: input.nextRenderState,
      trustState,
      reasonCodeRefs: uniqueSorted([
        ...current.reasonCodeRefs,
        ...(input.reasonCodeRefs ?? []),
      ]),
      supersedesAdviceRenderSettlementRef: current.adviceRenderSettlementId,
      settledAt,
      renderRevision: current.renderRevision + 1,
      version: 1,
    };
    await this.repositories.saveAdviceRenderSettlement(transitioned);
    return transitioned;
  }
}

export function createPhase3AdviceRenderKernelStore(): Phase3AdviceRenderKernelRepositories {
  return new InMemoryPhase3AdviceRenderKernelStore();
}

export function createPhase3AdviceRenderKernelService(
  repositories: Phase3AdviceRenderKernelRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3AdviceRenderKernelService {
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase3_advice_render_kernel");
  return new Phase3AdviceRenderKernelServiceImpl(repositories, idGenerator);
}
