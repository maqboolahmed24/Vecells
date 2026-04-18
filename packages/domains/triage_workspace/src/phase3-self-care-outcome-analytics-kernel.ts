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

function requireText(value: string | null | undefined, field: string): string {
  return requireRef(value, field);
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

function includesAll(available: readonly string[], requested: readonly string[]): boolean {
  const availableSet = new Set(available);
  return requested.every((value) => availableSet.has(value));
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

function compareNullableReadingLevel(
  left: string | null,
  right: string | null,
  requested: string | null,
): number {
  const leftExact = left !== null && left === requested ? 1 : 0;
  const rightExact = right !== null && right === requested ? 1 : 0;
  if (leftExact !== rightExact) {
    return rightExact - leftExact;
  }
  const leftGeneric = left === null ? 1 : 0;
  const rightGeneric = right === null ? 1 : 0;
  return rightGeneric - leftGeneric;
}

export type PatientExpectationTemplateConsequenceClass =
  | "self_care"
  | "admin_resolution_waiting"
  | "admin_resolution_completion";

export type PatientExpectationTemplateExpectationClass =
  | "self_care_guidance"
  | "self_care_safety_net"
  | "admin_waiting"
  | "admin_completion"
  | "blocked_recovery";

export type PatientExpectationTemplateState = "active" | "superseded";
export type PatientExpectationTemplateDeliveryMode =
  | "full"
  | "summary_safe"
  | "placeholder_safe";

export type AdviceOutcomeAnalyticsEventClass =
  | "consequence_issued"
  | "patient_opened"
  | "patient_acknowledged"
  | "patient_recontacted"
  | "clinician_reentry_triggered"
  | "waiting_update_seen"
  | "completion_seen"
  | "rollback_reviewed";

export type AdviceOutcomeAnalyticsWatchWindowTiming =
  | "within_watch_window"
  | "outside_watch_window"
  | "no_watch_window";

export type AdviceFollowUpRollbackReviewState =
  | "none"
  | "pending"
  | "recommended"
  | "completed";

export type AdviceFollowUpWatchState =
  | "monitoring"
  | "review_required"
  | "rollback_recommended"
  | "closed";

const templateStates: readonly PatientExpectationTemplateState[] = [
  "active",
  "superseded",
];

const deliveryModes: readonly PatientExpectationTemplateDeliveryMode[] = [
  "full",
  "summary_safe",
  "placeholder_safe",
];

const eventClasses: readonly AdviceOutcomeAnalyticsEventClass[] = [
  "consequence_issued",
  "patient_opened",
  "patient_acknowledged",
  "patient_recontacted",
  "clinician_reentry_triggered",
  "waiting_update_seen",
  "completion_seen",
  "rollback_reviewed",
];

const consequenceClasses: readonly PatientExpectationTemplateConsequenceClass[] = [
  "self_care",
  "admin_resolution_waiting",
  "admin_resolution_completion",
];

const rollbackStates: readonly AdviceFollowUpRollbackReviewState[] = [
  "none",
  "pending",
  "recommended",
  "completed",
];

const watchStates: readonly AdviceFollowUpWatchState[] = [
  "monitoring",
  "review_required",
  "rollback_recommended",
  "closed",
];

export interface PatientExpectationTemplateSnapshot {
  patientExpectationTemplateId: string;
  patientExpectationTemplateRef: string;
  expectationClass: PatientExpectationTemplateExpectationClass;
  allowedConsequenceClasses: readonly PatientExpectationTemplateConsequenceClass[];
  advicePathwayRef: string | null;
  adminResolutionSubtypeRef: string | null;
  bindingRuleRef: string;
  activeVersionRef: string | null;
  supportedChannelRefs: readonly string[];
  supportedLocaleRefs: readonly string[];
  templateState: PatientExpectationTemplateState;
  lastPublishedAt: string | null;
  version: number;
}

export interface PatientExpectationTemplateVersionSnapshot {
  patientExpectationTemplateVersionId: string;
  patientExpectationTemplateRef: string;
  templateVersionNumber: number;
  versionDigest: string;
  templateState: PatientExpectationTemplateState;
  authoringProvenanceRef: string;
  approvalProvenanceRef: string | null;
  policyBundleRef: string;
  coverageChannelRefs: readonly string[];
  coverageLocaleRefs: readonly string[];
  coverageReadingLevelRefs: readonly string[];
  coverageAccessibilityVariantRefs: readonly string[];
  defaultVariantRef: string;
  summarySafeVariantRef: string;
  placeholderSafeVariantRef: string;
  supersedesPatientExpectationTemplateVersionRef: string | null;
  publishedAt: string;
  version: number;
}

export interface PatientExpectationTemplateVariantSnapshot {
  patientExpectationTemplateVariantId: string;
  patientExpectationTemplateVersionRef: string;
  patientExpectationTemplateRef: string;
  deliveryMode: PatientExpectationTemplateDeliveryMode;
  channelRef: string;
  localeRef: string;
  readingLevelRef: string | null;
  accessibilityVariantRefs: readonly string[];
  audienceTierRefs: readonly string[];
  releaseStateRefs: readonly string[];
  visibilityTier: string;
  summarySafetyTier: string;
  renderInputRef: string;
  headlineText: string;
  bodyText: string;
  nextStepText: string;
  safetyNetText: string;
  placeholderText: string;
  version: number;
}

export interface AdviceFollowUpWatchWindowSnapshot {
  adviceFollowUpWatchWindowId: string;
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  consequenceClass: PatientExpectationTemplateConsequenceClass;
  adminResolutionSubtypeRef: string | null;
  adviceBundleVersionRef: string;
  watchStartAt: string;
  watchUntil: string;
  recontactThresholdRef: string;
  escalationThresholdRef: string;
  rollbackReviewState: AdviceFollowUpRollbackReviewState;
  watchRevision: number;
  assuranceSliceTrustRefs: readonly string[];
  watchState: AdviceFollowUpWatchState;
  latestReviewOutcomeRef: string | null;
  linkedAnalyticsRefs: readonly string[];
  watchDigest: string;
  version: number;
}

export interface AdviceUsageAnalyticsRecordSnapshot {
  adviceUsageAnalyticsRecordId: string;
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  consequenceClass: PatientExpectationTemplateConsequenceClass;
  eventClass: AdviceOutcomeAnalyticsEventClass;
  adviceBundleVersionRef: string | null;
  adviceVariantSetRef: string | null;
  patientExpectationTemplateRef: string;
  patientExpectationTemplateVersionRef: string;
  patientExpectationTemplateVariantRef: string;
  adminResolutionSubtypeRef: string | null;
  adminResolutionCaseRef: string | null;
  completionArtifactRef: string | null;
  watchWindowRef: string | null;
  watchWindowTiming: AdviceOutcomeAnalyticsWatchWindowTiming;
  channelRef: string;
  localeRef: string;
  readingLevelRef: string | null;
  accessibilityVariantRefs: readonly string[];
  audienceTierRef: string;
  releaseState: string;
  visibilityTier: string;
  summarySafetyTier: string;
  observationalAuthorityState: "analytics_only";
  reasonCodeRefs: readonly string[];
  eventOccurredAt: string;
  recordedAt: string;
  analyticsDigest: string;
  version: number;
}

export interface ResolvedPatientExpectationTemplate {
  patientExpectationTemplateRef: string;
  patientExpectationTemplateVersionRef: string;
  patientExpectationTemplateVariantRef: string;
  consequenceClass: PatientExpectationTemplateConsequenceClass;
  deliveryMode: PatientExpectationTemplateDeliveryMode;
  channelRef: string;
  localeRef: string;
  readingLevelRef: string | null;
  accessibilityVariantRefs: readonly string[];
  visibilityTier: string;
  summarySafetyTier: string;
  renderInputRef: string;
  headlineText: string;
  bodyText: string;
  nextStepText: string;
  safetyNetText: string;
  placeholderText: string;
  reasonCodeRefs: readonly string[];
}

export interface AdviceOutcomeAnalyticsSummary {
  totalRecords: number;
  eventCounts: Readonly<Record<AdviceOutcomeAnalyticsEventClass, number>>;
  withinWatchWindowCount: number;
  outsideWatchWindowCount: number;
  noWatchWindowCount: number;
}

export interface PublishPatientExpectationTemplateVariantInput {
  deliveryMode: PatientExpectationTemplateDeliveryMode;
  channelRef: string;
  localeRef: string;
  readingLevelRef?: string | null;
  accessibilityVariantRefs?: readonly string[];
  audienceTierRefs: readonly string[];
  releaseStateRefs?: readonly string[];
  visibilityTier: string;
  summarySafetyTier: string;
  renderInputRef: string;
  headlineText: string;
  bodyText: string;
  nextStepText: string;
  safetyNetText?: string;
  placeholderText?: string;
}

export interface PublishPatientExpectationTemplateVersionInput {
  patientExpectationTemplateRef: string;
  expectationClass: PatientExpectationTemplateExpectationClass;
  allowedConsequenceClasses: readonly PatientExpectationTemplateConsequenceClass[];
  advicePathwayRef?: string | null;
  adminResolutionSubtypeRef?: string | null;
  bindingRuleRef: string;
  authoringProvenanceRef: string;
  approvalProvenanceRef?: string | null;
  policyBundleRef: string;
  variants: readonly PublishPatientExpectationTemplateVariantInput[];
  publishedAt: string;
}

export interface ResolvePatientExpectationTemplateInput {
  patientExpectationTemplateRef: string;
  consequenceClass: PatientExpectationTemplateConsequenceClass;
  channelRef: string;
  localeRef: string;
  readingLevelRef?: string | null;
  accessibilityVariantRefs?: readonly string[];
  audienceTierRef: string;
  desiredDeliveryMode: PatientExpectationTemplateDeliveryMode;
  releaseState: string;
}

export interface UpsertAdviceFollowUpWatchWindowInput {
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  consequenceClass: PatientExpectationTemplateConsequenceClass;
  adminResolutionSubtypeRef?: string | null;
  adviceBundleVersionRef: string;
  watchStartAt: string;
  watchUntil: string;
  recontactThresholdRef: string;
  escalationThresholdRef: string;
  rollbackReviewState: AdviceFollowUpRollbackReviewState;
  watchRevision: number;
  assuranceSliceTrustRefs: readonly string[];
  watchState: AdviceFollowUpWatchState;
  latestReviewOutcomeRef?: string | null;
}

export interface RecordOutcomeAnalyticsInput {
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  consequenceClass: PatientExpectationTemplateConsequenceClass;
  eventClass: AdviceOutcomeAnalyticsEventClass;
  adviceBundleVersionRef?: string | null;
  adviceVariantSetRef?: string | null;
  patientExpectationTemplateRef: string;
  patientExpectationTemplateVersionRef: string;
  patientExpectationTemplateVariantRef: string;
  adminResolutionSubtypeRef?: string | null;
  adminResolutionCaseRef?: string | null;
  completionArtifactRef?: string | null;
  channelRef: string;
  localeRef: string;
  readingLevelRef?: string | null;
  accessibilityVariantRefs?: readonly string[];
  audienceTierRef: string;
  releaseState: string;
  visibilityTier: string;
  summarySafetyTier: string;
  eventOccurredAt: string;
  recordedAt: string;
  watchWindow?: UpsertAdviceFollowUpWatchWindowInput | null;
  reasonCodeRefs?: readonly string[];
}

export interface Phase3SelfCareOutcomeAnalyticsBundle {
  patientExpectationTemplates: readonly PatientExpectationTemplateSnapshot[];
  patientExpectationTemplateVersions: readonly PatientExpectationTemplateVersionSnapshot[];
  patientExpectationTemplateVariants: readonly PatientExpectationTemplateVariantSnapshot[];
  adviceFollowUpWatchWindows: readonly AdviceFollowUpWatchWindowSnapshot[];
  adviceUsageAnalyticsRecords: readonly AdviceUsageAnalyticsRecordSnapshot[];
  analyticsSummary: AdviceOutcomeAnalyticsSummary;
}

export interface Phase3SelfCareOutcomeAnalyticsRepositories {
  getPatientExpectationTemplate(
    patientExpectationTemplateRef: string,
  ): Promise<PatientExpectationTemplateSnapshot | null>;
  savePatientExpectationTemplate(
    patientExpectationTemplate: PatientExpectationTemplateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listPatientExpectationTemplates(): Promise<readonly PatientExpectationTemplateSnapshot[]>;
  getPatientExpectationTemplateVersion(
    patientExpectationTemplateVersionId: string,
  ): Promise<PatientExpectationTemplateVersionSnapshot | null>;
  savePatientExpectationTemplateVersion(
    patientExpectationTemplateVersion: PatientExpectationTemplateVersionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listPatientExpectationTemplateVersionsForTemplate(
    patientExpectationTemplateRef: string,
  ): Promise<readonly PatientExpectationTemplateVersionSnapshot[]>;
  getCurrentPatientExpectationTemplateVersion(
    patientExpectationTemplateRef: string,
  ): Promise<PatientExpectationTemplateVersionSnapshot | null>;
  getPatientExpectationTemplateVariant(
    patientExpectationTemplateVariantId: string,
  ): Promise<PatientExpectationTemplateVariantSnapshot | null>;
  savePatientExpectationTemplateVariant(
    patientExpectationTemplateVariant: PatientExpectationTemplateVariantSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listPatientExpectationTemplateVariantsForVersion(
    patientExpectationTemplateVersionRef: string,
  ): Promise<readonly PatientExpectationTemplateVariantSnapshot[]>;
  getAdviceFollowUpWatchWindow(
    adviceFollowUpWatchWindowId: string,
  ): Promise<AdviceFollowUpWatchWindowSnapshot | null>;
  saveAdviceFollowUpWatchWindow(
    adviceFollowUpWatchWindow: AdviceFollowUpWatchWindowSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdviceFollowUpWatchWindowsForTask(
    taskId: string,
  ): Promise<readonly AdviceFollowUpWatchWindowSnapshot[]>;
  getAdviceFollowUpWatchWindowByDigest(
    watchDigest: string,
  ): Promise<AdviceFollowUpWatchWindowSnapshot | null>;
  getAdviceUsageAnalyticsRecord(
    adviceUsageAnalyticsRecordId: string,
  ): Promise<AdviceUsageAnalyticsRecordSnapshot | null>;
  saveAdviceUsageAnalyticsRecord(
    adviceUsageAnalyticsRecord: AdviceUsageAnalyticsRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdviceUsageAnalyticsRecordsForTask(
    taskId: string,
  ): Promise<readonly AdviceUsageAnalyticsRecordSnapshot[]>;
  getAdviceUsageAnalyticsRecordByDigest(
    analyticsDigest: string,
  ): Promise<AdviceUsageAnalyticsRecordSnapshot | null>;
  withTaskBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

class InMemoryPhase3SelfCareOutcomeAnalyticsKernelStore
  implements Phase3SelfCareOutcomeAnalyticsRepositories
{
  private readonly templates = new Map<string, PatientExpectationTemplateSnapshot>();
  private readonly versions = new Map<string, PatientExpectationTemplateVersionSnapshot>();
  private readonly versionsByTemplate = new Map<string, string[]>();
  private readonly currentVersionByTemplate = new Map<string, string>();
  private readonly variants = new Map<string, PatientExpectationTemplateVariantSnapshot>();
  private readonly variantsByVersion = new Map<string, string[]>();
  private readonly watchWindows = new Map<string, AdviceFollowUpWatchWindowSnapshot>();
  private readonly watchWindowsByTask = new Map<string, string[]>();
  private readonly watchWindowsByDigest = new Map<string, string>();
  private readonly analytics = new Map<string, AdviceUsageAnalyticsRecordSnapshot>();
  private readonly analyticsByTask = new Map<string, string[]>();
  private readonly analyticsByDigest = new Map<string, string>();
  private boundaryQueue: Promise<void> = Promise.resolve();

  async withTaskBoundary<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.boundaryQueue;
    let release: () => void = () => undefined;
    this.boundaryQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  async getPatientExpectationTemplate(
    patientExpectationTemplateRef: string,
  ): Promise<PatientExpectationTemplateSnapshot | null> {
    return this.templates.get(patientExpectationTemplateRef) ?? null;
  }

  async savePatientExpectationTemplate(
    patientExpectationTemplate: PatientExpectationTemplateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.templates,
      patientExpectationTemplate.patientExpectationTemplateRef,
      patientExpectationTemplate,
      options,
    );
  }

  async listPatientExpectationTemplates(): Promise<
    readonly PatientExpectationTemplateSnapshot[]
  > {
    return [...this.templates.values()].sort((left, right) =>
      left.patientExpectationTemplateRef.localeCompare(right.patientExpectationTemplateRef),
    );
  }

  async getPatientExpectationTemplateVersion(
    patientExpectationTemplateVersionId: string,
  ): Promise<PatientExpectationTemplateVersionSnapshot | null> {
    return this.versions.get(patientExpectationTemplateVersionId) ?? null;
  }

  async savePatientExpectationTemplateVersion(
    patientExpectationTemplateVersion: PatientExpectationTemplateVersionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.versions,
      patientExpectationTemplateVersion.patientExpectationTemplateVersionId,
      patientExpectationTemplateVersion,
      options,
    );
    const templateRef = patientExpectationTemplateVersion.patientExpectationTemplateRef;
    const existingRefs = this.versionsByTemplate.get(templateRef) ?? [];
    if (
      !existingRefs.includes(patientExpectationTemplateVersion.patientExpectationTemplateVersionId)
    ) {
      this.versionsByTemplate.set(templateRef, [
        ...existingRefs,
        patientExpectationTemplateVersion.patientExpectationTemplateVersionId,
      ]);
    }
    if (patientExpectationTemplateVersion.templateState === "active") {
      this.currentVersionByTemplate.set(
        templateRef,
        patientExpectationTemplateVersion.patientExpectationTemplateVersionId,
      );
    }
  }

  async listPatientExpectationTemplateVersionsForTemplate(
    patientExpectationTemplateRef: string,
  ): Promise<readonly PatientExpectationTemplateVersionSnapshot[]> {
    return (this.versionsByTemplate.get(patientExpectationTemplateRef) ?? [])
      .map((id) => this.versions.get(id))
      .filter((entry): entry is PatientExpectationTemplateVersionSnapshot => entry !== undefined)
      .sort((left, right) => left.templateVersionNumber - right.templateVersionNumber);
  }

  async getCurrentPatientExpectationTemplateVersion(
    patientExpectationTemplateRef: string,
  ): Promise<PatientExpectationTemplateVersionSnapshot | null> {
    const currentId = this.currentVersionByTemplate.get(patientExpectationTemplateRef);
    return currentId ? (this.versions.get(currentId) ?? null) : null;
  }

  async getPatientExpectationTemplateVariant(
    patientExpectationTemplateVariantId: string,
  ): Promise<PatientExpectationTemplateVariantSnapshot | null> {
    return this.variants.get(patientExpectationTemplateVariantId) ?? null;
  }

  async savePatientExpectationTemplateVariant(
    patientExpectationTemplateVariant: PatientExpectationTemplateVariantSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.variants,
      patientExpectationTemplateVariant.patientExpectationTemplateVariantId,
      patientExpectationTemplateVariant,
      options,
    );
    const versionRef = patientExpectationTemplateVariant.patientExpectationTemplateVersionRef;
    const existingRefs = this.variantsByVersion.get(versionRef) ?? [];
    if (
      !existingRefs.includes(patientExpectationTemplateVariant.patientExpectationTemplateVariantId)
    ) {
      this.variantsByVersion.set(versionRef, [
        ...existingRefs,
        patientExpectationTemplateVariant.patientExpectationTemplateVariantId,
      ]);
    }
  }

  async listPatientExpectationTemplateVariantsForVersion(
    patientExpectationTemplateVersionRef: string,
  ): Promise<readonly PatientExpectationTemplateVariantSnapshot[]> {
    return (this.variantsByVersion.get(patientExpectationTemplateVersionRef) ?? [])
      .map((id) => this.variants.get(id))
      .filter((entry): entry is PatientExpectationTemplateVariantSnapshot => entry !== undefined)
      .sort((left, right) => {
        const deliveryOrder =
          deliveryModes.indexOf(left.deliveryMode) - deliveryModes.indexOf(right.deliveryMode);
        if (deliveryOrder !== 0) {
          return deliveryOrder;
        }
        const channelOrder = left.channelRef.localeCompare(right.channelRef);
        if (channelOrder !== 0) {
          return channelOrder;
        }
        return left.localeRef.localeCompare(right.localeRef);
      });
  }

  async getAdviceFollowUpWatchWindow(
    adviceFollowUpWatchWindowId: string,
  ): Promise<AdviceFollowUpWatchWindowSnapshot | null> {
    return this.watchWindows.get(adviceFollowUpWatchWindowId) ?? null;
  }

  async saveAdviceFollowUpWatchWindow(
    adviceFollowUpWatchWindow: AdviceFollowUpWatchWindowSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.watchWindows,
      adviceFollowUpWatchWindow.adviceFollowUpWatchWindowId,
      adviceFollowUpWatchWindow,
      options,
    );
    const existingRefs = this.watchWindowsByTask.get(adviceFollowUpWatchWindow.taskId) ?? [];
    if (!existingRefs.includes(adviceFollowUpWatchWindow.adviceFollowUpWatchWindowId)) {
      this.watchWindowsByTask.set(adviceFollowUpWatchWindow.taskId, [
        ...existingRefs,
        adviceFollowUpWatchWindow.adviceFollowUpWatchWindowId,
      ]);
    }
    this.watchWindowsByDigest.set(
      adviceFollowUpWatchWindow.watchDigest,
      adviceFollowUpWatchWindow.adviceFollowUpWatchWindowId,
    );
  }

  async listAdviceFollowUpWatchWindowsForTask(
    taskId: string,
  ): Promise<readonly AdviceFollowUpWatchWindowSnapshot[]> {
    return (this.watchWindowsByTask.get(taskId) ?? [])
      .map((id) => this.watchWindows.get(id))
      .filter((entry): entry is AdviceFollowUpWatchWindowSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.watchStartAt, right.watchStartAt));
  }

  async getAdviceFollowUpWatchWindowByDigest(
    watchDigest: string,
  ): Promise<AdviceFollowUpWatchWindowSnapshot | null> {
    const watchId = this.watchWindowsByDigest.get(watchDigest);
    return watchId ? (this.watchWindows.get(watchId) ?? null) : null;
  }

  async getAdviceUsageAnalyticsRecord(
    adviceUsageAnalyticsRecordId: string,
  ): Promise<AdviceUsageAnalyticsRecordSnapshot | null> {
    return this.analytics.get(adviceUsageAnalyticsRecordId) ?? null;
  }

  async saveAdviceUsageAnalyticsRecord(
    adviceUsageAnalyticsRecord: AdviceUsageAnalyticsRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.analytics,
      adviceUsageAnalyticsRecord.adviceUsageAnalyticsRecordId,
      adviceUsageAnalyticsRecord,
      options,
    );
    const existingRefs = this.analyticsByTask.get(adviceUsageAnalyticsRecord.taskId) ?? [];
    if (!existingRefs.includes(adviceUsageAnalyticsRecord.adviceUsageAnalyticsRecordId)) {
      this.analyticsByTask.set(adviceUsageAnalyticsRecord.taskId, [
        ...existingRefs,
        adviceUsageAnalyticsRecord.adviceUsageAnalyticsRecordId,
      ]);
    }
    this.analyticsByDigest.set(
      adviceUsageAnalyticsRecord.analyticsDigest,
      adviceUsageAnalyticsRecord.adviceUsageAnalyticsRecordId,
    );
  }

  async listAdviceUsageAnalyticsRecordsForTask(
    taskId: string,
  ): Promise<readonly AdviceUsageAnalyticsRecordSnapshot[]> {
    return (this.analyticsByTask.get(taskId) ?? [])
      .map((id) => this.analytics.get(id))
      .filter((entry): entry is AdviceUsageAnalyticsRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async getAdviceUsageAnalyticsRecordByDigest(
    analyticsDigest: string,
  ): Promise<AdviceUsageAnalyticsRecordSnapshot | null> {
    const analyticsId = this.analyticsByDigest.get(analyticsDigest);
    return analyticsId ? (this.analytics.get(analyticsId) ?? null) : null;
  }
}

function summarizeAnalytics(
  analyticsRecords: readonly AdviceUsageAnalyticsRecordSnapshot[],
): AdviceOutcomeAnalyticsSummary {
  const eventCounts = Object.fromEntries(
    eventClasses.map((eventClass) => [eventClass, 0]),
  ) as Record<AdviceOutcomeAnalyticsEventClass, number>;
  let withinWatchWindowCount = 0;
  let outsideWatchWindowCount = 0;
  let noWatchWindowCount = 0;

  for (const record of analyticsRecords) {
    eventCounts[record.eventClass] += 1;
    if (record.watchWindowTiming === "within_watch_window") {
      withinWatchWindowCount += 1;
    } else if (record.watchWindowTiming === "outside_watch_window") {
      outsideWatchWindowCount += 1;
    } else {
      noWatchWindowCount += 1;
    }
  }

  return {
    totalRecords: analyticsRecords.length,
    eventCounts,
    withinWatchWindowCount,
    outsideWatchWindowCount,
    noWatchWindowCount,
  };
}

export class PatientExpectationTemplateResolver {
  resolve(input: {
    template: PatientExpectationTemplateSnapshot;
    templateVersion: PatientExpectationTemplateVersionSnapshot;
    variants: readonly PatientExpectationTemplateVariantSnapshot[];
    request: ResolvePatientExpectationTemplateInput;
  }): ResolvedPatientExpectationTemplate {
    invariant(
      input.template.allowedConsequenceClasses.includes(input.request.consequenceClass),
      "ILLEGAL_EXPECTATION_CONSEQUENCE_CLASS",
      `Template ${input.template.patientExpectationTemplateRef} does not allow consequence ${input.request.consequenceClass}.`,
    );

    const requestedAccessibility = uniqueSorted(input.request.accessibilityVariantRefs ?? []);
    const desiredMode = input.request.desiredDeliveryMode;
    const modeOrder = this.deliveryModeFallbacks(desiredMode);
    let selectedMode = desiredMode;
    let reasonCodeRefs: string[] = [];
    let selectedVariant = this.pickBestVariant(input.variants, input.request, desiredMode);
    if (!selectedVariant) {
      selectedMode = modeOrder.find((mode) => this.pickBestVariant(input.variants, input.request, mode)) ?? desiredMode;
      selectedVariant = this.pickBestVariant(input.variants, input.request, selectedMode);
      invariant(
        selectedVariant,
        "EXPECTATION_TEMPLATE_VARIANT_NOT_FOUND",
        `No expectation variant is available for template ${input.template.patientExpectationTemplateRef}.`,
      );
      if (selectedMode !== desiredMode) {
        reasonCodeRefs = uniqueSorted([
          ...reasonCodeRefs,
          `delivery_mode_downgraded_to_${selectedMode}`,
        ]);
      }
    }

    if (selectedVariant.localeRef !== input.request.localeRef) {
      reasonCodeRefs = uniqueSorted([...reasonCodeRefs, "locale_fallback_applied"]);
    }
    if (
      optionalRef(selectedVariant.readingLevelRef) !== optionalRef(input.request.readingLevelRef)
    ) {
      reasonCodeRefs = uniqueSorted([...reasonCodeRefs, "reading_level_fallback_applied"]);
    }
    if (!includesAll(selectedVariant.accessibilityVariantRefs, requestedAccessibility)) {
      reasonCodeRefs = uniqueSorted([
        ...reasonCodeRefs,
        "accessibility_variant_fallback_applied",
      ]);
    }
    if (!selectedVariant.releaseStateRefs.includes(input.request.releaseState)) {
      reasonCodeRefs = uniqueSorted([...reasonCodeRefs, "release_state_fallback_applied"]);
    }

    return {
      patientExpectationTemplateRef: input.template.patientExpectationTemplateRef,
      patientExpectationTemplateVersionRef:
        input.templateVersion.patientExpectationTemplateVersionId,
      patientExpectationTemplateVariantRef:
        selectedVariant.patientExpectationTemplateVariantId,
      consequenceClass: input.request.consequenceClass,
      deliveryMode: selectedVariant.deliveryMode,
      channelRef: selectedVariant.channelRef,
      localeRef: selectedVariant.localeRef,
      readingLevelRef: selectedVariant.readingLevelRef,
      accessibilityVariantRefs: selectedVariant.accessibilityVariantRefs,
      visibilityTier: selectedVariant.visibilityTier,
      summarySafetyTier: selectedVariant.summarySafetyTier,
      renderInputRef: selectedVariant.renderInputRef,
      headlineText: selectedVariant.headlineText,
      bodyText: selectedVariant.bodyText,
      nextStepText: selectedVariant.nextStepText,
      safetyNetText: selectedVariant.safetyNetText,
      placeholderText: selectedVariant.placeholderText,
      reasonCodeRefs,
    };
  }

  private deliveryModeFallbacks(
    desiredMode: PatientExpectationTemplateDeliveryMode,
  ): readonly PatientExpectationTemplateDeliveryMode[] {
    if (desiredMode === "full") {
      return ["full", "summary_safe", "placeholder_safe"];
    }
    if (desiredMode === "summary_safe") {
      return ["summary_safe", "placeholder_safe"];
    }
    return ["placeholder_safe"];
  }

  private pickBestVariant(
    variants: readonly PatientExpectationTemplateVariantSnapshot[],
    request: ResolvePatientExpectationTemplateInput,
    deliveryMode: PatientExpectationTemplateDeliveryMode,
  ): PatientExpectationTemplateVariantSnapshot | null {
    const requestedAccessibility = uniqueSorted(request.accessibilityVariantRefs ?? []);
    const requestedReadingLevel = optionalRef(request.readingLevelRef);
    const candidates = variants.filter(
      (variant) =>
        variant.deliveryMode === deliveryMode &&
        variant.channelRef === request.channelRef &&
        variant.audienceTierRefs.includes(request.audienceTierRef),
    );
    if (candidates.length === 0) {
      return null;
    }

    const sortedCandidates = [...candidates].sort((left, right) => {
      const leftLocaleScore = left.localeRef === request.localeRef ? 2 : left.localeRef === "en-GB" ? 1 : 0;
      const rightLocaleScore = right.localeRef === request.localeRef ? 2 : right.localeRef === "en-GB" ? 1 : 0;
      if (leftLocaleScore !== rightLocaleScore) {
        return rightLocaleScore - leftLocaleScore;
      }
      const readingOrder = compareNullableReadingLevel(
        left.readingLevelRef,
        right.readingLevelRef,
        requestedReadingLevel,
      );
      if (readingOrder !== 0) {
        return readingOrder;
      }
      const leftAccessibilityScore = includesAll(
        left.accessibilityVariantRefs,
        requestedAccessibility,
      )
        ? 1
        : 0;
      const rightAccessibilityScore = includesAll(
        right.accessibilityVariantRefs,
        requestedAccessibility,
      )
        ? 1
        : 0;
      if (leftAccessibilityScore !== rightAccessibilityScore) {
        return rightAccessibilityScore - leftAccessibilityScore;
      }
      const leftReleaseScore = left.releaseStateRefs.includes(request.releaseState) ? 1 : 0;
      const rightReleaseScore = right.releaseStateRefs.includes(request.releaseState) ? 1 : 0;
      if (leftReleaseScore !== rightReleaseScore) {
        return rightReleaseScore - leftReleaseScore;
      }
      return left.patientExpectationTemplateVariantId.localeCompare(
        right.patientExpectationTemplateVariantId,
      );
    });
    return sortedCandidates[0] ?? null;
  }
}

export class WatchWindowAnalyticsLinker {
  link(
    watchWindow: AdviceFollowUpWatchWindowSnapshot,
    analyticsRecordId: string,
  ): AdviceFollowUpWatchWindowSnapshot {
    const linkedAnalyticsRefs = uniqueSorted([
      ...watchWindow.linkedAnalyticsRefs,
      requireRef(analyticsRecordId, "analyticsRecordId"),
    ]);
    if (linkedAnalyticsRefs.length === watchWindow.linkedAnalyticsRefs.length) {
      return watchWindow;
    }
    return {
      ...watchWindow,
      linkedAnalyticsRefs,
      version: watchWindow.version + 1,
    };
  }
}

export class AdviceOutcomeAnalyticsIngestor {
  constructor(private readonly watchWindowLinker = new WatchWindowAnalyticsLinker()) {}

  computeWatchWindowTiming(
    eventOccurredAt: string,
    watchWindow: AdviceFollowUpWatchWindowSnapshot | null,
  ): AdviceOutcomeAnalyticsWatchWindowTiming {
    if (!watchWindow) {
      return "no_watch_window";
    }
    const eventAt = ensureIsoTimestamp(eventOccurredAt, "eventOccurredAt");
    if (
      compareIso(eventAt, watchWindow.watchStartAt) >= 0 &&
      compareIso(eventAt, watchWindow.watchUntil) <= 0
    ) {
      return "within_watch_window";
    }
    return "outside_watch_window";
  }

  link(
    watchWindow: AdviceFollowUpWatchWindowSnapshot | null,
    analyticsRecordId: string,
  ): AdviceFollowUpWatchWindowSnapshot | null {
    if (!watchWindow) {
      return null;
    }
    return this.watchWindowLinker.link(watchWindow, analyticsRecordId);
  }
}

export interface Phase3SelfCareOutcomeAnalyticsKernelService {
  readonly resolver: PatientExpectationTemplateResolver;
  readonly ingestor: AdviceOutcomeAnalyticsIngestor;
  queryTaskBundle(taskId: string): Promise<Phase3SelfCareOutcomeAnalyticsBundle>;
  fetchCurrentPatientExpectationTemplateVersion(
    patientExpectationTemplateRef: string,
  ): Promise<PatientExpectationTemplateVersionSnapshot | null>;
  publishPatientExpectationTemplateVersion(
    input: PublishPatientExpectationTemplateVersionInput,
  ): Promise<{
    template: PatientExpectationTemplateSnapshot;
    templateVersion: PatientExpectationTemplateVersionSnapshot;
    variants: readonly PatientExpectationTemplateVariantSnapshot[];
    supersededTemplateVersion: PatientExpectationTemplateVersionSnapshot | null;
  }>;
  resolvePatientExpectationTemplate(
    input: ResolvePatientExpectationTemplateInput,
  ): Promise<ResolvedPatientExpectationTemplate | null>;
  fetchAdviceFollowUpWatchAnalytics(taskId: string): Promise<{
    watchWindows: readonly AdviceFollowUpWatchWindowSnapshot[];
    analyticsRecords: readonly AdviceUsageAnalyticsRecordSnapshot[];
  }>;
  recordAdviceOutcomeAnalytics(
    input: RecordOutcomeAnalyticsInput,
  ): Promise<{
    analyticsRecord: AdviceUsageAnalyticsRecordSnapshot;
    watchWindow: AdviceFollowUpWatchWindowSnapshot | null;
  }>;
  recordAdminOutcomeAnalytics(
    input: RecordOutcomeAnalyticsInput,
  ): Promise<{
    analyticsRecord: AdviceUsageAnalyticsRecordSnapshot;
    watchWindow: AdviceFollowUpWatchWindowSnapshot | null;
  }>;
}

class Phase3SelfCareOutcomeAnalyticsKernelServiceImpl
  implements Phase3SelfCareOutcomeAnalyticsKernelService
{
  readonly resolver: PatientExpectationTemplateResolver;
  readonly ingestor: AdviceOutcomeAnalyticsIngestor;

  private readonly idGenerator: BackboneIdGenerator;

  constructor(
    private readonly repositories: Phase3SelfCareOutcomeAnalyticsRepositories,
    options?: {
      idGenerator?: BackboneIdGenerator;
      resolver?: PatientExpectationTemplateResolver;
      ingestor?: AdviceOutcomeAnalyticsIngestor;
    },
  ) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase3_self_care_outcome_analytics");
    this.resolver = options?.resolver ?? new PatientExpectationTemplateResolver();
    this.ingestor = options?.ingestor ?? new AdviceOutcomeAnalyticsIngestor();
  }

  async queryTaskBundle(taskId: string): Promise<Phase3SelfCareOutcomeAnalyticsBundle> {
    const [
      patientExpectationTemplates,
      adviceUsageAnalyticsRecords,
      adviceFollowUpWatchWindows,
    ] = await Promise.all([
      this.repositories.listPatientExpectationTemplates(),
      this.repositories.listAdviceUsageAnalyticsRecordsForTask(taskId),
      this.repositories.listAdviceFollowUpWatchWindowsForTask(taskId),
    ]);

    const versionIds = uniqueSorted(
      patientExpectationTemplates
        .map((template) => template.activeVersionRef)
        .filter((value): value is string => value !== null),
    );
    const patientExpectationTemplateVersions = (
      await Promise.all(
        versionIds.map((versionId) =>
          this.repositories.getPatientExpectationTemplateVersion(versionId),
        ),
      )
    ).filter(
      (entry): entry is PatientExpectationTemplateVersionSnapshot => entry !== null,
    );
    const variantIds = uniqueSorted(
      patientExpectationTemplateVersions.flatMap((version) => [
        version.defaultVariantRef,
        version.summarySafeVariantRef,
        version.placeholderSafeVariantRef,
      ]),
    );
    const patientExpectationTemplateVariants = (
      await Promise.all(
        variantIds.map((variantId) =>
          this.repositories.getPatientExpectationTemplateVariant(variantId),
        ),
      )
    ).filter(
      (entry): entry is PatientExpectationTemplateVariantSnapshot => entry !== null,
    );

    return {
      patientExpectationTemplates,
      patientExpectationTemplateVersions,
      patientExpectationTemplateVariants,
      adviceFollowUpWatchWindows,
      adviceUsageAnalyticsRecords,
      analyticsSummary: summarizeAnalytics(adviceUsageAnalyticsRecords),
    };
  }

  async fetchCurrentPatientExpectationTemplateVersion(
    patientExpectationTemplateRef: string,
  ): Promise<PatientExpectationTemplateVersionSnapshot | null> {
    return this.repositories.getCurrentPatientExpectationTemplateVersion(
      requireRef(patientExpectationTemplateRef, "patientExpectationTemplateRef"),
    );
  }

  async publishPatientExpectationTemplateVersion(
    input: PublishPatientExpectationTemplateVersionInput,
  ): Promise<{
    template: PatientExpectationTemplateSnapshot;
    templateVersion: PatientExpectationTemplateVersionSnapshot;
    variants: readonly PatientExpectationTemplateVariantSnapshot[];
    supersededTemplateVersion: PatientExpectationTemplateVersionSnapshot | null;
  }> {
    const patientExpectationTemplateRef = requireRef(
      input.patientExpectationTemplateRef,
      "patientExpectationTemplateRef",
    );
    invariant(
      input.allowedConsequenceClasses.length > 0,
      "EXPECTATION_TEMPLATE_ALLOWED_CONSEQUENCE_REQUIRED",
      "At least one allowed consequence class is required.",
    );
    invariant(
      input.variants.length > 0,
      "EXPECTATION_TEMPLATE_VARIANTS_REQUIRED",
      "At least one template variant is required.",
    );
    invariant(
      input.variants.some((variant) => variant.deliveryMode === "full"),
      "EXPECTATION_TEMPLATE_FULL_VARIANT_REQUIRED",
      "A full delivery variant is required.",
    );
    invariant(
      input.variants.some((variant) => variant.deliveryMode === "summary_safe"),
      "EXPECTATION_TEMPLATE_SUMMARY_VARIANT_REQUIRED",
      "A summary-safe delivery variant is required.",
    );
    invariant(
      input.variants.some((variant) => variant.deliveryMode === "placeholder_safe"),
      "EXPECTATION_TEMPLATE_PLACEHOLDER_VARIANT_REQUIRED",
      "A placeholder-safe delivery variant is required.",
    );

    return this.repositories.withTaskBoundary(async () => {
      const currentTemplate =
        await this.repositories.getPatientExpectationTemplate(patientExpectationTemplateRef);
      const currentVersion =
        await this.repositories.getCurrentPatientExpectationTemplateVersion(
          patientExpectationTemplateRef,
        );
      const publishedAt = ensureIsoTimestamp(input.publishedAt, "publishedAt");
      const normalizedVariants = input.variants.map((variant) => ({
        deliveryMode: variant.deliveryMode,
        channelRef: requireRef(variant.channelRef, "channelRef"),
        localeRef: requireRef(variant.localeRef, "localeRef"),
        readingLevelRef: optionalRef(variant.readingLevelRef),
        accessibilityVariantRefs: uniqueSorted(variant.accessibilityVariantRefs ?? []),
        audienceTierRefs: uniqueSorted(variant.audienceTierRefs),
        releaseStateRefs: uniqueSorted(variant.releaseStateRefs ?? ["current", "degraded", "quarantined"]),
        visibilityTier: requireRef(variant.visibilityTier, "visibilityTier"),
        summarySafetyTier: requireRef(variant.summarySafetyTier, "summarySafetyTier"),
        renderInputRef: requireRef(variant.renderInputRef, "renderInputRef"),
        headlineText: requireText(variant.headlineText, "headlineText"),
        bodyText: requireText(variant.bodyText, "bodyText"),
        nextStepText: requireText(variant.nextStepText, "nextStepText"),
        safetyNetText:
          optionalRef(variant.safetyNetText) ??
          requireText(variant.nextStepText, "nextStepText"),
        placeholderText:
          optionalRef(variant.placeholderText) ??
          "We are keeping the next-step summary available while the full detail stays protected.",
      }));
      const versionDigest = stableReviewDigest({
        patientExpectationTemplateRef,
        expectationClass: input.expectationClass,
        allowedConsequenceClasses: uniqueSorted(input.allowedConsequenceClasses),
        advicePathwayRef: optionalRef(input.advicePathwayRef),
        adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
        bindingRuleRef: requireRef(input.bindingRuleRef, "bindingRuleRef"),
        authoringProvenanceRef: requireRef(
          input.authoringProvenanceRef,
          "authoringProvenanceRef",
        ),
        approvalProvenanceRef: optionalRef(input.approvalProvenanceRef),
        policyBundleRef: requireRef(input.policyBundleRef, "policyBundleRef"),
        variants: normalizedVariants,
      });

      if (currentVersion?.versionDigest === versionDigest) {
        const variants = await this.repositories.listPatientExpectationTemplateVariantsForVersion(
          currentVersion.patientExpectationTemplateVersionId,
        );
        invariant(currentTemplate, "EXPECTATION_TEMPLATE_REGISTRY_MISSING", "Current template registry row is required.");
        return {
          template: currentTemplate,
          templateVersion: currentVersion,
          variants,
          supersededTemplateVersion: null,
        };
      }

      let supersededTemplateVersion: PatientExpectationTemplateVersionSnapshot | null = null;
      if (currentVersion) {
        supersededTemplateVersion = {
          ...currentVersion,
          templateState: "superseded",
          version: currentVersion.version + 1,
        };
        await this.repositories.savePatientExpectationTemplateVersion(supersededTemplateVersion, {
          expectedVersion: currentVersion.version,
        });
      }

      const templateVersionNumber =
        (currentVersion?.templateVersionNumber ?? 0) + 1;
      const patientExpectationTemplateVersionId = `patient_expectation_template_version_${stableReviewDigest({
        patientExpectationTemplateRef,
        templateVersionNumber,
        versionDigest,
      })}`;
      const createVariant = (
        variant: (typeof normalizedVariants)[number],
      ): PatientExpectationTemplateVariantSnapshot => ({
        patientExpectationTemplateVariantId: `patient_expectation_template_variant_${stableReviewDigest({
          patientExpectationTemplateVersionId,
          deliveryMode: variant.deliveryMode,
          channelRef: variant.channelRef,
          localeRef: variant.localeRef,
          readingLevelRef: variant.readingLevelRef,
          accessibilityVariantRefs: variant.accessibilityVariantRefs,
          audienceTierRefs: variant.audienceTierRefs,
          visibilityTier: variant.visibilityTier,
          summarySafetyTier: variant.summarySafetyTier,
        })}`,
        patientExpectationTemplateVersionRef: patientExpectationTemplateVersionId,
        patientExpectationTemplateRef,
        deliveryMode: variant.deliveryMode,
        channelRef: variant.channelRef,
        localeRef: variant.localeRef,
        readingLevelRef: variant.readingLevelRef,
        accessibilityVariantRefs: variant.accessibilityVariantRefs,
        audienceTierRefs: variant.audienceTierRefs,
        releaseStateRefs: variant.releaseStateRefs,
        visibilityTier: variant.visibilityTier,
        summarySafetyTier: variant.summarySafetyTier,
        renderInputRef: variant.renderInputRef,
        headlineText: variant.headlineText,
        bodyText: variant.bodyText,
        nextStepText: variant.nextStepText,
        safetyNetText: variant.safetyNetText,
        placeholderText: variant.placeholderText,
        version: 1,
      });

      const variants = normalizedVariants.map(createVariant);
      const fullVariant = variants.find((variant) => variant.deliveryMode === "full");
      const summaryVariant = variants.find(
        (variant) => variant.deliveryMode === "summary_safe",
      );
      const placeholderVariant = variants.find(
        (variant) => variant.deliveryMode === "placeholder_safe",
      );
      invariant(
        fullVariant && summaryVariant && placeholderVariant,
        "EXPECTATION_TEMPLATE_REQUIRED_VARIANTS_MISSING",
        "Full, summary-safe, and placeholder-safe variants are all required.",
      );

      const templateVersion: PatientExpectationTemplateVersionSnapshot = {
        patientExpectationTemplateVersionId,
        patientExpectationTemplateRef,
        templateVersionNumber,
        versionDigest,
        templateState: "active",
        authoringProvenanceRef: requireRef(
          input.authoringProvenanceRef,
          "authoringProvenanceRef",
        ),
        approvalProvenanceRef: optionalRef(input.approvalProvenanceRef),
        policyBundleRef: requireRef(input.policyBundleRef, "policyBundleRef"),
        coverageChannelRefs: uniqueSorted(variants.map((variant) => variant.channelRef)),
        coverageLocaleRefs: uniqueSorted(variants.map((variant) => variant.localeRef)),
        coverageReadingLevelRefs: uniqueSorted(
          variants
            .map((variant) => variant.readingLevelRef)
            .filter((value): value is string => value !== null),
        ),
        coverageAccessibilityVariantRefs: uniqueSorted(
          variants.flatMap((variant) => variant.accessibilityVariantRefs),
        ),
        defaultVariantRef: fullVariant.patientExpectationTemplateVariantId,
        summarySafeVariantRef: summaryVariant.patientExpectationTemplateVariantId,
        placeholderSafeVariantRef: placeholderVariant.patientExpectationTemplateVariantId,
        supersedesPatientExpectationTemplateVersionRef:
          currentVersion?.patientExpectationTemplateVersionId ?? null,
        publishedAt,
        version: 1,
      };

      const template: PatientExpectationTemplateSnapshot = {
        patientExpectationTemplateId:
          currentTemplate?.patientExpectationTemplateId ??
          nextId(this.idGenerator, "patient_expectation_template"),
        patientExpectationTemplateRef,
        expectationClass: input.expectationClass,
        allowedConsequenceClasses: uniqueSorted(
          input.allowedConsequenceClasses,
        ) as PatientExpectationTemplateConsequenceClass[],
        advicePathwayRef: optionalRef(input.advicePathwayRef),
        adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
        bindingRuleRef: requireRef(input.bindingRuleRef, "bindingRuleRef"),
        activeVersionRef: templateVersion.patientExpectationTemplateVersionId,
        supportedChannelRefs: templateVersion.coverageChannelRefs,
        supportedLocaleRefs: templateVersion.coverageLocaleRefs,
        templateState: "active",
        lastPublishedAt: publishedAt,
        version: (currentTemplate?.version ?? 0) + 1,
      };

      await this.repositories.savePatientExpectationTemplate(template, currentTemplate ? {
        expectedVersion: currentTemplate.version,
      } : undefined);
      await this.repositories.savePatientExpectationTemplateVersion(templateVersion);
      for (const variant of variants) {
        await this.repositories.savePatientExpectationTemplateVariant(variant);
      }

      return {
        template,
        templateVersion,
        variants,
        supersededTemplateVersion,
      };
    });
  }

  async resolvePatientExpectationTemplate(
    input: ResolvePatientExpectationTemplateInput,
  ): Promise<ResolvedPatientExpectationTemplate | null> {
    const patientExpectationTemplateRef = requireRef(
      input.patientExpectationTemplateRef,
      "patientExpectationTemplateRef",
    );
    const template =
      await this.repositories.getPatientExpectationTemplate(patientExpectationTemplateRef);
    if (!template || template.templateState !== "active") {
      return null;
    }
    const templateVersion =
      await this.repositories.getCurrentPatientExpectationTemplateVersion(
        patientExpectationTemplateRef,
      );
    if (!templateVersion || templateVersion.templateState !== "active") {
      return null;
    }
    const variants = await this.repositories.listPatientExpectationTemplateVariantsForVersion(
      templateVersion.patientExpectationTemplateVersionId,
    );
    return this.resolver.resolve({
      template,
      templateVersion,
      variants,
      request: {
        ...input,
        readingLevelRef: optionalRef(input.readingLevelRef),
        accessibilityVariantRefs: uniqueSorted(input.accessibilityVariantRefs ?? []),
        releaseState: requireRef(input.releaseState, "releaseState"),
      },
    });
  }

  async fetchAdviceFollowUpWatchAnalytics(taskId: string): Promise<{
    watchWindows: readonly AdviceFollowUpWatchWindowSnapshot[];
    analyticsRecords: readonly AdviceUsageAnalyticsRecordSnapshot[];
  }> {
    const [watchWindows, analyticsRecords] = await Promise.all([
      this.repositories.listAdviceFollowUpWatchWindowsForTask(taskId),
      this.repositories.listAdviceUsageAnalyticsRecordsForTask(taskId),
    ]);
    const watchWindowIds = new Set(
      watchWindows.map((watchWindow) => watchWindow.adviceFollowUpWatchWindowId),
    );
    return {
      watchWindows,
      analyticsRecords: analyticsRecords.filter(
        (record) =>
          record.watchWindowRef !== null && watchWindowIds.has(record.watchWindowRef),
      ),
    };
  }

  async recordAdviceOutcomeAnalytics(
    input: RecordOutcomeAnalyticsInput,
  ): Promise<{
    analyticsRecord: AdviceUsageAnalyticsRecordSnapshot;
    watchWindow: AdviceFollowUpWatchWindowSnapshot | null;
  }> {
    invariant(
      input.consequenceClass === "self_care",
      "ILLEGAL_SELF_CARE_ANALYTICS_CONSEQUENCE",
      "Advice outcome analytics are limited to self_care consequence.",
    );
    return this.recordOutcomeAnalytics(input);
  }

  async recordAdminOutcomeAnalytics(
    input: RecordOutcomeAnalyticsInput,
  ): Promise<{
    analyticsRecord: AdviceUsageAnalyticsRecordSnapshot;
    watchWindow: AdviceFollowUpWatchWindowSnapshot | null;
  }> {
    invariant(
      input.consequenceClass !== "self_care",
      "ILLEGAL_ADMIN_ANALYTICS_CONSEQUENCE",
      "Admin outcome analytics require an admin consequence class.",
    );
    return this.recordOutcomeAnalytics(input);
  }

  private async recordOutcomeAnalytics(
    input: RecordOutcomeAnalyticsInput,
  ): Promise<{
    analyticsRecord: AdviceUsageAnalyticsRecordSnapshot;
    watchWindow: AdviceFollowUpWatchWindowSnapshot | null;
  }> {
    invariant(
      consequenceClasses.includes(input.consequenceClass),
      "INVALID_CONSEQUENCE_CLASS",
      `Unsupported consequence class ${input.consequenceClass}.`,
    );
    invariant(
      eventClasses.includes(input.eventClass),
      "INVALID_ANALYTICS_EVENT_CLASS",
      `Unsupported analytics event class ${input.eventClass}.`,
    );

    return this.repositories.withTaskBoundary(async () => {
      const eventOccurredAt = ensureIsoTimestamp(input.eventOccurredAt, "eventOccurredAt");
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      let watchWindow: AdviceFollowUpWatchWindowSnapshot | null = null;
      if (input.watchWindow) {
        watchWindow = await this.upsertAdviceFollowUpWatchWindow(input.watchWindow);
      }

      const analyticsDigest = stableReviewDigest({
        taskId: requireRef(input.taskId, "taskId"),
        requestRef: requireRef(input.requestRef, "requestRef"),
        boundaryTupleHash: requireRef(input.boundaryTupleHash, "boundaryTupleHash"),
        decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
        consequenceClass: input.consequenceClass,
        eventClass: input.eventClass,
        adviceBundleVersionRef: optionalRef(input.adviceBundleVersionRef),
        adviceVariantSetRef: optionalRef(input.adviceVariantSetRef),
        patientExpectationTemplateVersionRef: requireRef(
          input.patientExpectationTemplateVersionRef,
          "patientExpectationTemplateVersionRef",
        ),
        patientExpectationTemplateVariantRef: requireRef(
          input.patientExpectationTemplateVariantRef,
          "patientExpectationTemplateVariantRef",
        ),
        adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
        adminResolutionCaseRef: optionalRef(input.adminResolutionCaseRef),
        completionArtifactRef: optionalRef(input.completionArtifactRef),
        watchWindowRef: watchWindow?.adviceFollowUpWatchWindowId ?? null,
        eventOccurredAt,
        reasonCodeRefs: uniqueSorted(input.reasonCodeRefs ?? []),
      });
      const existing =
        await this.repositories.getAdviceUsageAnalyticsRecordByDigest(analyticsDigest);
      if (existing) {
        const linkedWatchWindow = this.ingestor.link(
          watchWindow,
          existing.adviceUsageAnalyticsRecordId,
        );
        if (
          linkedWatchWindow &&
          linkedWatchWindow.version !== watchWindow?.version
        ) {
          await this.repositories.saveAdviceFollowUpWatchWindow(linkedWatchWindow, {
            expectedVersion: watchWindow?.version,
          });
          watchWindow = linkedWatchWindow;
        }
        return {
          analyticsRecord: existing,
          watchWindow,
        };
      }

      const analyticsRecordId = `advice_usage_analytics_record_${analyticsDigest}`;
      const analyticsRecord: AdviceUsageAnalyticsRecordSnapshot = {
        adviceUsageAnalyticsRecordId: analyticsRecordId,
        taskId: requireRef(input.taskId, "taskId"),
        requestRef: requireRef(input.requestRef, "requestRef"),
        boundaryDecisionRef: requireRef(input.boundaryDecisionRef, "boundaryDecisionRef"),
        boundaryTupleHash: requireRef(input.boundaryTupleHash, "boundaryTupleHash"),
        decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
        consequenceClass: input.consequenceClass,
        eventClass: input.eventClass,
        adviceBundleVersionRef: optionalRef(input.adviceBundleVersionRef),
        adviceVariantSetRef: optionalRef(input.adviceVariantSetRef),
        patientExpectationTemplateRef: requireRef(
          input.patientExpectationTemplateRef,
          "patientExpectationTemplateRef",
        ),
        patientExpectationTemplateVersionRef: requireRef(
          input.patientExpectationTemplateVersionRef,
          "patientExpectationTemplateVersionRef",
        ),
        patientExpectationTemplateVariantRef: requireRef(
          input.patientExpectationTemplateVariantRef,
          "patientExpectationTemplateVariantRef",
        ),
        adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
        adminResolutionCaseRef: optionalRef(input.adminResolutionCaseRef),
        completionArtifactRef: optionalRef(input.completionArtifactRef),
        watchWindowRef: watchWindow?.adviceFollowUpWatchWindowId ?? null,
        watchWindowTiming: this.ingestor.computeWatchWindowTiming(
          eventOccurredAt,
          watchWindow,
        ),
        channelRef: requireRef(input.channelRef, "channelRef"),
        localeRef: requireRef(input.localeRef, "localeRef"),
        readingLevelRef: optionalRef(input.readingLevelRef),
        accessibilityVariantRefs: uniqueSorted(input.accessibilityVariantRefs ?? []),
        audienceTierRef: requireRef(input.audienceTierRef, "audienceTierRef"),
        releaseState: requireRef(input.releaseState, "releaseState"),
        visibilityTier: requireRef(input.visibilityTier, "visibilityTier"),
        summarySafetyTier: requireRef(input.summarySafetyTier, "summarySafetyTier"),
        observationalAuthorityState: "analytics_only",
        reasonCodeRefs: uniqueSorted(input.reasonCodeRefs ?? []),
        eventOccurredAt,
        recordedAt,
        analyticsDigest,
        version: 1,
      };
      await this.repositories.saveAdviceUsageAnalyticsRecord(analyticsRecord);
      const linkedWatchWindow = this.ingestor.link(watchWindow, analyticsRecordId);
      if (linkedWatchWindow && linkedWatchWindow.version !== watchWindow?.version) {
        await this.repositories.saveAdviceFollowUpWatchWindow(linkedWatchWindow, {
          expectedVersion: watchWindow?.version,
        });
        watchWindow = linkedWatchWindow;
      }

      return {
        analyticsRecord,
        watchWindow,
      };
    });
  }

  private async upsertAdviceFollowUpWatchWindow(
    input: UpsertAdviceFollowUpWatchWindowInput,
  ): Promise<AdviceFollowUpWatchWindowSnapshot> {
    const watchStartAt = ensureIsoTimestamp(input.watchStartAt, "watchStartAt");
    const watchUntil = ensureIsoTimestamp(input.watchUntil, "watchUntil");
    invariant(
      compareIso(watchStartAt, watchUntil) < 0,
      "INVALID_WATCH_WINDOW_RANGE",
      "watchUntil must be later than watchStartAt.",
    );
    invariant(
      rollbackStates.includes(input.rollbackReviewState),
      "INVALID_ROLLBACK_REVIEW_STATE",
      `Unsupported rollback review state ${input.rollbackReviewState}.`,
    );
    invariant(
      watchStates.includes(input.watchState),
      "INVALID_WATCH_STATE",
      `Unsupported watch state ${input.watchState}.`,
    );

    const watchDigest = stableReviewDigest({
      taskId: requireRef(input.taskId, "taskId"),
      requestRef: requireRef(input.requestRef, "requestRef"),
      boundaryTupleHash: requireRef(input.boundaryTupleHash, "boundaryTupleHash"),
      decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
      consequenceClass: input.consequenceClass,
      adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
      adviceBundleVersionRef: requireRef(input.adviceBundleVersionRef, "adviceBundleVersionRef"),
      watchStartAt,
      watchUntil,
      watchRevision: ensurePositiveInteger(input.watchRevision, "watchRevision"),
      watchState: input.watchState,
      rollbackReviewState: input.rollbackReviewState,
    });
    const existing = await this.repositories.getAdviceFollowUpWatchWindowByDigest(watchDigest);
    if (existing) {
      return existing;
    }

    const adviceFollowUpWatchWindowId = `advice_follow_up_watch_window_${watchDigest}`;
    const snapshot: AdviceFollowUpWatchWindowSnapshot = {
      adviceFollowUpWatchWindowId,
      taskId: requireRef(input.taskId, "taskId"),
      requestRef: requireRef(input.requestRef, "requestRef"),
      boundaryDecisionRef: requireRef(input.boundaryDecisionRef, "boundaryDecisionRef"),
      boundaryTupleHash: requireRef(input.boundaryTupleHash, "boundaryTupleHash"),
      decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
      consequenceClass: input.consequenceClass,
      adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
      adviceBundleVersionRef: requireRef(input.adviceBundleVersionRef, "adviceBundleVersionRef"),
      watchStartAt,
      watchUntil,
      recontactThresholdRef: requireRef(input.recontactThresholdRef, "recontactThresholdRef"),
      escalationThresholdRef: requireRef(input.escalationThresholdRef, "escalationThresholdRef"),
      rollbackReviewState: input.rollbackReviewState,
      watchRevision: ensurePositiveInteger(input.watchRevision, "watchRevision"),
      assuranceSliceTrustRefs: uniqueSorted(input.assuranceSliceTrustRefs),
      watchState: input.watchState,
      latestReviewOutcomeRef: optionalRef(input.latestReviewOutcomeRef),
      linkedAnalyticsRefs: [],
      watchDigest,
      version: 1,
    };
    await this.repositories.saveAdviceFollowUpWatchWindow(snapshot);
    return snapshot;
  }
}

export function createPhase3SelfCareOutcomeAnalyticsKernelStore(): Phase3SelfCareOutcomeAnalyticsRepositories {
  return new InMemoryPhase3SelfCareOutcomeAnalyticsKernelStore();
}

export function createPhase3SelfCareOutcomeAnalyticsKernelService(
  repositories: Phase3SelfCareOutcomeAnalyticsRepositories = createPhase3SelfCareOutcomeAnalyticsKernelStore(),
  options?: {
    idGenerator?: BackboneIdGenerator;
    resolver?: PatientExpectationTemplateResolver;
    ingestor?: AdviceOutcomeAnalyticsIngestor;
  },
): Phase3SelfCareOutcomeAnalyticsKernelService {
  return new Phase3SelfCareOutcomeAnalyticsKernelServiceImpl(repositories, options);
}
