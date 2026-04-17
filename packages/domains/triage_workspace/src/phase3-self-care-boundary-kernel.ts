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

export type SelfCareBoundaryDecisionState =
  | "self_care"
  | "admin_resolution"
  | "clinician_review_required"
  | "blocked_pending_review";
export type SelfCareClinicalMeaningState =
  | "informational_only"
  | "bounded_admin_only"
  | "clinician_reentry_required";
export type SelfCareOperationalFollowUpScope =
  | "none"
  | "self_serve_guidance"
  | "bounded_admin_resolution";
export type SelfCareAdminMutationAuthorityState =
  | "none"
  | "bounded_admin_only"
  | "frozen";
export type SelfCareReopenState =
  | "stable"
  | "reopen_required"
  | "reopened"
  | "blocked_pending_review";
export type SelfCareBoundaryState = "live" | "superseded" | "reopened" | "blocked";
export type AdviceEligibilityGrantState =
  | "live"
  | "superseded"
  | "expired"
  | "invalidated"
  | "blocked";
export type SelfCareBoundarySupersessionCauseClass =
  | "decision_supersession"
  | "evidence_drift"
  | "safety_drift"
  | "route_drift"
  | "publication_drift"
  | "trust_drift"
  | "reopen"
  | "manual_replace";
export type AdviceEligibilityGrantTransitionCauseClass =
  | "boundary_superseded"
  | "boundary_not_self_care"
  | "approval_pending"
  | "approval_rejected"
  | "evidence_drift"
  | "safety_drift"
  | "route_drift"
  | "session_drift"
  | "subject_drift"
  | "publication_drift"
  | "trust_drift"
  | "reopen"
  | "expired_ttl"
  | "manual_replace";

const boundaryDecisionStates: readonly SelfCareBoundaryDecisionState[] = [
  "self_care",
  "admin_resolution",
  "clinician_review_required",
  "blocked_pending_review",
];
const clinicalMeaningStates: readonly SelfCareClinicalMeaningState[] = [
  "informational_only",
  "bounded_admin_only",
  "clinician_reentry_required",
];
const followUpScopes: readonly SelfCareOperationalFollowUpScope[] = [
  "none",
  "self_serve_guidance",
  "bounded_admin_resolution",
];
const adminMutationAuthorityStates: readonly SelfCareAdminMutationAuthorityState[] = [
  "none",
  "bounded_admin_only",
  "frozen",
];
const reopenStates: readonly SelfCareReopenState[] = [
  "stable",
  "reopen_required",
  "reopened",
  "blocked_pending_review",
];
const boundaryStates: readonly SelfCareBoundaryState[] = [
  "live",
  "superseded",
  "reopened",
  "blocked",
];
const grantStates: readonly AdviceEligibilityGrantState[] = [
  "live",
  "superseded",
  "expired",
  "invalidated",
  "blocked",
];

export interface SelfCareBoundaryDecisionSnapshot {
  selfCareBoundaryDecisionId: string;
  taskId: string;
  requestRef: string;
  evidenceSnapshotRef: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  decisionState: SelfCareBoundaryDecisionState;
  clinicalMeaningState: SelfCareClinicalMeaningState;
  operationalFollowUpScope: SelfCareOperationalFollowUpScope;
  adminMutationAuthorityState: SelfCareAdminMutationAuthorityState;
  reasonCodeRefs: readonly string[];
  adminResolutionSubtypeRef: string | null;
  routeIntentBindingRef: string;
  selectedAnchorRef: string;
  lineageFenceEpoch: number;
  dependencySetRef: string | null;
  adviceRenderSettlementRef: string | null;
  adminResolutionCaseRef: string | null;
  selfCareExperienceProjectionRef: string | null;
  adminResolutionExperienceProjectionRef: string | null;
  reopenTriggerRefs: readonly string[];
  reopenState: SelfCareReopenState;
  boundaryState: SelfCareBoundaryState;
  boundaryTupleHash: string;
  compiledPolicyBundleRef: string;
  decidedAt: string;
  version: number;
}

export interface AdviceEligibilityGrantSnapshot {
  adviceEligibilityGrantId: string;
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  grantTupleHash: string;
  evidenceSnapshotRef: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  safetyState: string;
  routeFamily: string;
  audienceTier: string;
  channelRef: string;
  localeRef: string;
  compiledPolicyBundleRef: string;
  adviceBundleVersionRef: string;
  lineageFenceEpoch: number;
  routeIntentRef: string;
  subjectBindingVersionRef: string | null;
  sessionEpochRef: string | null;
  assuranceSliceTrustRefs: readonly string[];
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  reasonCodeRefs: readonly string[];
  issuedAt: string;
  expiresAt: string;
  grantState: AdviceEligibilityGrantState;
  version: number;
}

export interface SelfCareBoundarySupersessionRecordSnapshot {
  boundarySupersessionRecordId: string;
  taskId: string;
  requestRef: string;
  priorBoundaryDecisionRef: string;
  replacementBoundaryDecisionRef: string;
  priorDecisionEpochRef: string;
  replacementDecisionEpochRef: string;
  priorBoundaryTupleHash: string;
  replacementBoundaryTupleHash: string;
  causeClass: SelfCareBoundarySupersessionCauseClass;
  reasonCodeRefs: readonly string[];
  recordedAt: string;
  version: number;
}

export interface AdviceEligibilityGrantTransitionRecordSnapshot {
  adviceEligibilityGrantTransitionRecordId: string;
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  adviceEligibilityGrantRef: string;
  priorGrantState: AdviceEligibilityGrantState;
  nextGrantState: AdviceEligibilityGrantState;
  causeClass: AdviceEligibilityGrantTransitionCauseClass;
  reasonCodeRefs: readonly string[];
  replacementGrantRef: string | null;
  recordedAt: string;
  version: number;
}

export interface Phase3SelfCareBoundaryBundle {
  currentBoundaryDecision: SelfCareBoundaryDecisionSnapshot | null;
  currentAdviceEligibilityGrant: AdviceEligibilityGrantSnapshot | null;
  latestBoundarySupersessionRecord: SelfCareBoundarySupersessionRecordSnapshot | null;
  latestGrantTransitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot | null;
  boundaryDecisions: readonly SelfCareBoundaryDecisionSnapshot[];
  adviceEligibilityGrants: readonly AdviceEligibilityGrantSnapshot[];
}

export interface ClassifySelfCareBoundaryInput {
  taskId: string;
  requestRef: string;
  evidenceSnapshotRef: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef?: string | null;
  decisionState: SelfCareBoundaryDecisionState;
  clinicalMeaningState: SelfCareClinicalMeaningState;
  operationalFollowUpScope: SelfCareOperationalFollowUpScope;
  adminMutationAuthorityState: SelfCareAdminMutationAuthorityState;
  reasonCodeRefs?: readonly string[];
  adminResolutionSubtypeRef?: string | null;
  routeIntentBindingRef: string;
  selectedAnchorRef: string;
  lineageFenceEpoch: number;
  dependencySetRef?: string | null;
  adviceRenderSettlementRef?: string | null;
  adminResolutionCaseRef?: string | null;
  selfCareExperienceProjectionRef?: string | null;
  adminResolutionExperienceProjectionRef?: string | null;
  reopenTriggerRefs?: readonly string[];
  reopenState: SelfCareReopenState;
  boundaryState: Exclude<SelfCareBoundaryState, "superseded">;
  compiledPolicyBundleRef: string;
  decidedAt: string;
  supersessionCauseClass?: SelfCareBoundarySupersessionCauseClass;
}

export interface IssueAdviceEligibilityGrantInput {
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  evidenceSnapshotRef: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef?: string | null;
  safetyState: string;
  routeFamily: string;
  audienceTier: string;
  channelRef: string;
  localeRef: string;
  compiledPolicyBundleRef: string;
  adviceBundleVersionRef: string;
  lineageFenceEpoch: number;
  routeIntentRef: string;
  subjectBindingVersionRef?: string | null;
  sessionEpochRef?: string | null;
  assuranceSliceTrustRefs?: readonly string[];
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  reasonCodeRefs?: readonly string[];
  issuedAt: string;
  expiresAt: string;
  grantState: Extract<AdviceEligibilityGrantState, "live" | "blocked">;
  transitionCauseClass?: AdviceEligibilityGrantTransitionCauseClass;
}

export interface SupersedeSelfCareBoundaryInput {
  taskId: string;
  boundaryDecisionId: string;
  replacementBoundaryDecisionId: string;
  replacementDecisionEpochRef: string;
  replacementBoundaryTupleHash: string;
  causeClass: SelfCareBoundarySupersessionCauseClass;
  reasonCodeRefs?: readonly string[];
  recordedAt: string;
}

export interface TransitionAdviceEligibilityGrantInput {
  taskId: string;
  adviceEligibilityGrantId: string;
  nextGrantState: Extract<
    AdviceEligibilityGrantState,
    "superseded" | "invalidated" | "expired" | "blocked"
  >;
  causeClass: AdviceEligibilityGrantTransitionCauseClass;
  reasonCodeRefs?: readonly string[];
  replacementGrantRef?: string | null;
  recordedAt: string;
}

export interface Phase3SelfCareBoundaryKernelRepositories {
  getBoundaryDecision(
    boundaryDecisionId: string,
  ): Promise<SelfCareBoundaryDecisionSnapshot | null>;
  saveBoundaryDecision(
    boundaryDecision: SelfCareBoundaryDecisionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listBoundaryDecisionsForTask(
    taskId: string,
  ): Promise<readonly SelfCareBoundaryDecisionSnapshot[]>;
  getCurrentBoundaryDecisionForTask(
    taskId: string,
  ): Promise<SelfCareBoundaryDecisionSnapshot | null>;

  getAdviceEligibilityGrant(
    adviceEligibilityGrantId: string,
  ): Promise<AdviceEligibilityGrantSnapshot | null>;
  saveAdviceEligibilityGrant(
    adviceEligibilityGrant: AdviceEligibilityGrantSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdviceEligibilityGrantsForTask(
    taskId: string,
  ): Promise<readonly AdviceEligibilityGrantSnapshot[]>;
  getCurrentAdviceEligibilityGrantForTask(
    taskId: string,
  ): Promise<AdviceEligibilityGrantSnapshot | null>;
  listTasksWithAdviceEligibilityGrants(): Promise<readonly string[]>;

  getBoundarySupersessionRecord(
    boundarySupersessionRecordId: string,
  ): Promise<SelfCareBoundarySupersessionRecordSnapshot | null>;
  saveBoundarySupersessionRecord(
    boundarySupersessionRecord: SelfCareBoundarySupersessionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listBoundarySupersessionRecordsForTask(
    taskId: string,
  ): Promise<readonly SelfCareBoundarySupersessionRecordSnapshot[]>;

  getAdviceEligibilityGrantTransitionRecord(
    adviceEligibilityGrantTransitionRecordId: string,
  ): Promise<AdviceEligibilityGrantTransitionRecordSnapshot | null>;
  saveAdviceEligibilityGrantTransitionRecord(
    adviceEligibilityGrantTransitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdviceEligibilityGrantTransitionRecordsForTask(
    taskId: string,
  ): Promise<readonly AdviceEligibilityGrantTransitionRecordSnapshot[]>;
}

class InMemoryPhase3SelfCareBoundaryKernelStore
  implements Phase3SelfCareBoundaryKernelRepositories
{
  private readonly boundaryDecisions = new Map<string, SelfCareBoundaryDecisionSnapshot>();
  private readonly boundaryDecisionsByTask = new Map<string, string[]>();
  private readonly currentBoundaryDecisionByTask = new Map<string, string>();

  private readonly adviceEligibilityGrants = new Map<string, AdviceEligibilityGrantSnapshot>();
  private readonly adviceEligibilityGrantsByTask = new Map<string, string[]>();
  private readonly currentAdviceEligibilityGrantByTask = new Map<string, string>();

  private readonly boundarySupersessionRecords = new Map<
    string,
    SelfCareBoundarySupersessionRecordSnapshot
  >();
  private readonly boundarySupersessionRecordsByTask = new Map<string, string[]>();

  private readonly adviceEligibilityGrantTransitionRecords = new Map<
    string,
    AdviceEligibilityGrantTransitionRecordSnapshot
  >();
  private readonly adviceEligibilityGrantTransitionRecordsByTask = new Map<string, string[]>();

  async getBoundaryDecision(
    boundaryDecisionId: string,
  ): Promise<SelfCareBoundaryDecisionSnapshot | null> {
    return this.boundaryDecisions.get(boundaryDecisionId) ?? null;
  }

  async saveBoundaryDecision(
    boundaryDecision: SelfCareBoundaryDecisionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.boundaryDecisions,
      boundaryDecision.selfCareBoundaryDecisionId,
      boundaryDecision,
      options,
    );
    const existing = this.boundaryDecisionsByTask.get(boundaryDecision.taskId) ?? [];
    if (!existing.includes(boundaryDecision.selfCareBoundaryDecisionId)) {
      this.boundaryDecisionsByTask.set(boundaryDecision.taskId, [
        ...existing,
        boundaryDecision.selfCareBoundaryDecisionId,
      ]);
    }
    if (boundaryDecision.boundaryState !== "superseded") {
      this.currentBoundaryDecisionByTask.set(
        boundaryDecision.taskId,
        boundaryDecision.selfCareBoundaryDecisionId,
      );
    } else if (
      this.currentBoundaryDecisionByTask.get(boundaryDecision.taskId) ===
      boundaryDecision.selfCareBoundaryDecisionId
    ) {
      this.currentBoundaryDecisionByTask.delete(boundaryDecision.taskId);
    }
  }

  async listBoundaryDecisionsForTask(
    taskId: string,
  ): Promise<readonly SelfCareBoundaryDecisionSnapshot[]> {
    return (this.boundaryDecisionsByTask.get(taskId) ?? [])
      .map((id) => this.boundaryDecisions.get(id))
      .filter((entry): entry is SelfCareBoundaryDecisionSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.decidedAt, right.decidedAt));
  }

  async getCurrentBoundaryDecisionForTask(
    taskId: string,
  ): Promise<SelfCareBoundaryDecisionSnapshot | null> {
    const current = this.currentBoundaryDecisionByTask.get(taskId);
    return current ? (this.boundaryDecisions.get(current) ?? null) : null;
  }

  async getAdviceEligibilityGrant(
    adviceEligibilityGrantId: string,
  ): Promise<AdviceEligibilityGrantSnapshot | null> {
    return this.adviceEligibilityGrants.get(adviceEligibilityGrantId) ?? null;
  }

  async saveAdviceEligibilityGrant(
    adviceEligibilityGrant: AdviceEligibilityGrantSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.adviceEligibilityGrants,
      adviceEligibilityGrant.adviceEligibilityGrantId,
      adviceEligibilityGrant,
      options,
    );
    const existing = this.adviceEligibilityGrantsByTask.get(adviceEligibilityGrant.taskId) ?? [];
    if (!existing.includes(adviceEligibilityGrant.adviceEligibilityGrantId)) {
      this.adviceEligibilityGrantsByTask.set(adviceEligibilityGrant.taskId, [
        ...existing,
        adviceEligibilityGrant.adviceEligibilityGrantId,
      ]);
    }
    if (adviceEligibilityGrant.grantState === "live" || adviceEligibilityGrant.grantState === "blocked") {
      this.currentAdviceEligibilityGrantByTask.set(
        adviceEligibilityGrant.taskId,
        adviceEligibilityGrant.adviceEligibilityGrantId,
      );
    } else if (
      this.currentAdviceEligibilityGrantByTask.get(adviceEligibilityGrant.taskId) ===
      adviceEligibilityGrant.adviceEligibilityGrantId
    ) {
      this.currentAdviceEligibilityGrantByTask.delete(adviceEligibilityGrant.taskId);
    }
  }

  async listAdviceEligibilityGrantsForTask(
    taskId: string,
  ): Promise<readonly AdviceEligibilityGrantSnapshot[]> {
    return (this.adviceEligibilityGrantsByTask.get(taskId) ?? [])
      .map((id) => this.adviceEligibilityGrants.get(id))
      .filter((entry): entry is AdviceEligibilityGrantSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.issuedAt, right.issuedAt));
  }

  async getCurrentAdviceEligibilityGrantForTask(
    taskId: string,
  ): Promise<AdviceEligibilityGrantSnapshot | null> {
    const current = this.currentAdviceEligibilityGrantByTask.get(taskId);
    return current ? (this.adviceEligibilityGrants.get(current) ?? null) : null;
  }

  async listTasksWithAdviceEligibilityGrants(): Promise<readonly string[]> {
    return [...this.adviceEligibilityGrantsByTask.keys()].sort();
  }

  async getBoundarySupersessionRecord(
    boundarySupersessionRecordId: string,
  ): Promise<SelfCareBoundarySupersessionRecordSnapshot | null> {
    return this.boundarySupersessionRecords.get(boundarySupersessionRecordId) ?? null;
  }

  async saveBoundarySupersessionRecord(
    boundarySupersessionRecord: SelfCareBoundarySupersessionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.boundarySupersessionRecords,
      boundarySupersessionRecord.boundarySupersessionRecordId,
      boundarySupersessionRecord,
      options,
    );
    const existing =
      this.boundarySupersessionRecordsByTask.get(boundarySupersessionRecord.taskId) ?? [];
    if (!existing.includes(boundarySupersessionRecord.boundarySupersessionRecordId)) {
      this.boundarySupersessionRecordsByTask.set(boundarySupersessionRecord.taskId, [
        ...existing,
        boundarySupersessionRecord.boundarySupersessionRecordId,
      ]);
    }
  }

  async listBoundarySupersessionRecordsForTask(
    taskId: string,
  ): Promise<readonly SelfCareBoundarySupersessionRecordSnapshot[]> {
    return (this.boundarySupersessionRecordsByTask.get(taskId) ?? [])
      .map((id) => this.boundarySupersessionRecords.get(id))
      .filter((entry): entry is SelfCareBoundarySupersessionRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async getAdviceEligibilityGrantTransitionRecord(
    adviceEligibilityGrantTransitionRecordId: string,
  ): Promise<AdviceEligibilityGrantTransitionRecordSnapshot | null> {
    return (
      this.adviceEligibilityGrantTransitionRecords.get(adviceEligibilityGrantTransitionRecordId) ??
      null
    );
  }

  async saveAdviceEligibilityGrantTransitionRecord(
    adviceEligibilityGrantTransitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.adviceEligibilityGrantTransitionRecords,
      adviceEligibilityGrantTransitionRecord.adviceEligibilityGrantTransitionRecordId,
      adviceEligibilityGrantTransitionRecord,
      options,
    );
    const existing =
      this.adviceEligibilityGrantTransitionRecordsByTask.get(
        adviceEligibilityGrantTransitionRecord.taskId,
      ) ?? [];
    if (
      !existing.includes(adviceEligibilityGrantTransitionRecord.adviceEligibilityGrantTransitionRecordId)
    ) {
      this.adviceEligibilityGrantTransitionRecordsByTask.set(
        adviceEligibilityGrantTransitionRecord.taskId,
        [...existing, adviceEligibilityGrantTransitionRecord.adviceEligibilityGrantTransitionRecordId],
      );
    }
  }

  async listAdviceEligibilityGrantTransitionRecordsForTask(
    taskId: string,
  ): Promise<readonly AdviceEligibilityGrantTransitionRecordSnapshot[]> {
    return (this.adviceEligibilityGrantTransitionRecordsByTask.get(taskId) ?? [])
      .map((id) => this.adviceEligibilityGrantTransitionRecords.get(id))
      .filter(
        (entry): entry is AdviceEligibilityGrantTransitionRecordSnapshot => entry !== undefined,
      )
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }
}

function buildBoundaryTupleHash(input: {
  taskId: string;
  requestRef: string;
  evidenceSnapshotRef: string;
  decisionEpochRef: string;
  decisionState: SelfCareBoundaryDecisionState;
  clinicalMeaningState: SelfCareClinicalMeaningState;
  operationalFollowUpScope: SelfCareOperationalFollowUpScope;
  adminMutationAuthorityState: SelfCareAdminMutationAuthorityState;
  adminResolutionSubtypeRef: string | null;
  routeIntentBindingRef: string;
  selectedAnchorRef: string;
  lineageFenceEpoch: number;
  dependencySetRef: string | null;
  reopenState: SelfCareReopenState;
  boundaryState: Exclude<SelfCareBoundaryState, "superseded">;
  compiledPolicyBundleRef: string;
}): string {
  return `boundary_tuple_${stableReviewDigest({
    taskId: input.taskId,
    requestRef: input.requestRef,
    evidenceSnapshotRef: input.evidenceSnapshotRef,
    decisionEpochRef: input.decisionEpochRef,
    decisionState: input.decisionState,
    clinicalMeaningState: input.clinicalMeaningState,
    operationalFollowUpScope: input.operationalFollowUpScope,
    adminMutationAuthorityState: input.adminMutationAuthorityState,
    adminResolutionSubtypeRef: input.adminResolutionSubtypeRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    selectedAnchorRef: input.selectedAnchorRef,
    lineageFenceEpoch: input.lineageFenceEpoch,
    dependencySetRef: input.dependencySetRef,
    reopenState: input.reopenState,
    boundaryState: input.boundaryState,
    compiledPolicyBundleRef: input.compiledPolicyBundleRef,
  })}`;
}

function buildAdviceGrantTupleHash(input: {
  taskId: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  evidenceSnapshotRef: string;
  decisionEpochRef: string;
  safetyState: string;
  routeFamily: string;
  audienceTier: string;
  channelRef: string;
  localeRef: string;
  compiledPolicyBundleRef: string;
  adviceBundleVersionRef: string;
  lineageFenceEpoch: number;
  routeIntentRef: string;
  subjectBindingVersionRef: string | null;
  sessionEpochRef: string | null;
  assuranceSliceTrustRefs: readonly string[];
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  grantState: Extract<AdviceEligibilityGrantState, "live" | "blocked">;
}): string {
  return `advice_grant_${stableReviewDigest({
    taskId: input.taskId,
    boundaryDecisionRef: input.boundaryDecisionRef,
    boundaryTupleHash: input.boundaryTupleHash,
    evidenceSnapshotRef: input.evidenceSnapshotRef,
    decisionEpochRef: input.decisionEpochRef,
    safetyState: input.safetyState,
    routeFamily: input.routeFamily,
    audienceTier: input.audienceTier,
    channelRef: input.channelRef,
    localeRef: input.localeRef,
    compiledPolicyBundleRef: input.compiledPolicyBundleRef,
    adviceBundleVersionRef: input.adviceBundleVersionRef,
    lineageFenceEpoch: input.lineageFenceEpoch,
    routeIntentRef: input.routeIntentRef,
    subjectBindingVersionRef: input.subjectBindingVersionRef,
    sessionEpochRef: input.sessionEpochRef,
    assuranceSliceTrustRefs: uniqueSorted(input.assuranceSliceTrustRefs),
    surfaceRouteContractRef: input.surfaceRouteContractRef,
    surfacePublicationRef: input.surfacePublicationRef,
    runtimePublicationBundleRef: input.runtimePublicationBundleRef,
    grantState: input.grantState,
  })}`;
}

function validateBoundaryDecisionTuple(
  decision: Pick<
    SelfCareBoundaryDecisionSnapshot,
    | "decisionState"
    | "clinicalMeaningState"
    | "operationalFollowUpScope"
    | "adminMutationAuthorityState"
    | "reopenState"
    | "boundaryState"
  >,
): void {
  invariant(
    boundaryDecisionStates.includes(decision.decisionState),
    "INVALID_BOUNDARY_DECISION_STATE",
    "Unsupported self-care boundary decisionState.",
  );
  invariant(
    clinicalMeaningStates.includes(decision.clinicalMeaningState),
    "INVALID_CLINICAL_MEANING_STATE",
    "Unsupported self-care clinicalMeaningState.",
  );
  invariant(
    followUpScopes.includes(decision.operationalFollowUpScope),
    "INVALID_OPERATIONAL_FOLLOWUP_SCOPE",
    "Unsupported self-care operationalFollowUpScope.",
  );
  invariant(
    adminMutationAuthorityStates.includes(decision.adminMutationAuthorityState),
    "INVALID_ADMIN_MUTATION_AUTHORITY_STATE",
    "Unsupported self-care adminMutationAuthorityState.",
  );
  invariant(
    reopenStates.includes(decision.reopenState),
    "INVALID_SELF_CARE_REOPEN_STATE",
    "Unsupported self-care reopenState.",
  );
  invariant(
    boundaryStates.includes(decision.boundaryState),
    "INVALID_SELF_CARE_BOUNDARY_STATE",
    "Unsupported self-care boundaryState.",
  );

  if (decision.decisionState === "self_care") {
    invariant(
      decision.clinicalMeaningState === "informational_only" &&
        decision.operationalFollowUpScope === "self_serve_guidance" &&
        decision.adminMutationAuthorityState === "none",
      "ILLEGAL_SELF_CARE_BOUNDARY_TUPLE",
      "Self-care is legal only on the informational self-serve tuple.",
    );
  }

  if (decision.decisionState === "admin_resolution") {
    invariant(
      decision.clinicalMeaningState === "bounded_admin_only" &&
        decision.operationalFollowUpScope === "bounded_admin_resolution" &&
        decision.adminMutationAuthorityState === "bounded_admin_only",
      "ILLEGAL_ADMIN_RESOLUTION_BOUNDARY_TUPLE",
      "Admin-resolution is legal only on the bounded-admin tuple.",
    );
  }

  if (
    decision.decisionState === "clinician_review_required" ||
    decision.decisionState === "blocked_pending_review"
  ) {
    invariant(
      decision.clinicalMeaningState === "clinician_reentry_required" &&
        decision.operationalFollowUpScope === "none" &&
        decision.adminMutationAuthorityState === "frozen",
      "ILLEGAL_CLINICIAN_REVIEW_BOUNDARY_TUPLE",
      "Clinician review states must freeze admin mutation authority and operational follow-up.",
    );
  }
}

function toBoundaryDecisionSnapshot(
  input: ClassifySelfCareBoundaryInput,
): SelfCareBoundaryDecisionSnapshot {
  validateBoundaryDecisionTuple({
    decisionState: input.decisionState,
    clinicalMeaningState: input.clinicalMeaningState,
    operationalFollowUpScope: input.operationalFollowUpScope,
    adminMutationAuthorityState: input.adminMutationAuthorityState,
    reopenState: input.reopenState,
    boundaryState: input.boundaryState,
  });
  const decidedAt = ensureIsoTimestamp(input.decidedAt, "decidedAt");
  return {
    selfCareBoundaryDecisionId: `self_care_boundary_${stableReviewDigest({
      taskId: input.taskId,
      decisionEpochRef: input.decisionEpochRef,
      routeIntentBindingRef: input.routeIntentBindingRef,
      selectedAnchorRef: input.selectedAnchorRef,
      decidedAt,
    })}`,
    taskId: requireRef(input.taskId, "taskId"),
    requestRef: requireRef(input.requestRef, "requestRef"),
    evidenceSnapshotRef: requireRef(input.evidenceSnapshotRef, "evidenceSnapshotRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    decisionState: input.decisionState,
    clinicalMeaningState: input.clinicalMeaningState,
    operationalFollowUpScope: input.operationalFollowUpScope,
    adminMutationAuthorityState: input.adminMutationAuthorityState,
    reasonCodeRefs: uniqueSorted(input.reasonCodeRefs ?? []),
    adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
    lineageFenceEpoch: ensurePositiveInteger(input.lineageFenceEpoch, "lineageFenceEpoch"),
    dependencySetRef: optionalRef(input.dependencySetRef),
    adviceRenderSettlementRef: optionalRef(input.adviceRenderSettlementRef),
    adminResolutionCaseRef: optionalRef(input.adminResolutionCaseRef),
    selfCareExperienceProjectionRef: optionalRef(input.selfCareExperienceProjectionRef),
    adminResolutionExperienceProjectionRef: optionalRef(
      input.adminResolutionExperienceProjectionRef,
    ),
    reopenTriggerRefs: uniqueSorted(input.reopenTriggerRefs ?? []),
    reopenState: input.reopenState,
    boundaryState: input.boundaryState,
    boundaryTupleHash: buildBoundaryTupleHash({
      taskId: input.taskId,
      requestRef: input.requestRef,
      evidenceSnapshotRef: input.evidenceSnapshotRef,
      decisionEpochRef: input.decisionEpochRef,
      decisionState: input.decisionState,
      clinicalMeaningState: input.clinicalMeaningState,
      operationalFollowUpScope: input.operationalFollowUpScope,
      adminMutationAuthorityState: input.adminMutationAuthorityState,
      adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
      routeIntentBindingRef: input.routeIntentBindingRef,
      selectedAnchorRef: input.selectedAnchorRef,
      lineageFenceEpoch: input.lineageFenceEpoch,
      dependencySetRef: optionalRef(input.dependencySetRef),
      reopenState: input.reopenState,
      boundaryState: input.boundaryState,
      compiledPolicyBundleRef: input.compiledPolicyBundleRef,
    }),
    compiledPolicyBundleRef: requireRef(input.compiledPolicyBundleRef, "compiledPolicyBundleRef"),
    decidedAt,
    version: 1,
  };
}

function toAdviceGrantSnapshot(
  boundary: SelfCareBoundaryDecisionSnapshot,
  input: IssueAdviceEligibilityGrantInput,
): AdviceEligibilityGrantSnapshot {
  const issuedAt = ensureIsoTimestamp(input.issuedAt, "issuedAt");
  const expiresAt = ensureIsoTimestamp(input.expiresAt, "expiresAt");
  invariant(
    compareIso(issuedAt, expiresAt) < 0,
    "INVALID_ADVICE_GRANT_EXPIRY",
    "AdviceEligibilityGrant expiresAt must be later than issuedAt.",
  );
  invariant(
    grantStates.includes(input.grantState),
    "INVALID_ADVICE_ELIGIBILITY_GRANT_STATE",
    "Unsupported AdviceEligibilityGrant grantState.",
  );
  const assuranceSliceTrustRefs = uniqueSorted(input.assuranceSliceTrustRefs ?? []);
  const grantTupleHash = buildAdviceGrantTupleHash({
    taskId: input.taskId,
    boundaryDecisionRef: boundary.selfCareBoundaryDecisionId,
    boundaryTupleHash: boundary.boundaryTupleHash,
    evidenceSnapshotRef: input.evidenceSnapshotRef,
    decisionEpochRef: input.decisionEpochRef,
    safetyState: input.safetyState,
    routeFamily: input.routeFamily,
    audienceTier: input.audienceTier,
    channelRef: input.channelRef,
    localeRef: input.localeRef,
    compiledPolicyBundleRef: input.compiledPolicyBundleRef,
    adviceBundleVersionRef: input.adviceBundleVersionRef,
    lineageFenceEpoch: input.lineageFenceEpoch,
    routeIntentRef: input.routeIntentRef,
    subjectBindingVersionRef: optionalRef(input.subjectBindingVersionRef),
    sessionEpochRef: optionalRef(input.sessionEpochRef),
    assuranceSliceTrustRefs,
    surfaceRouteContractRef: input.surfaceRouteContractRef,
    surfacePublicationRef: input.surfacePublicationRef,
    runtimePublicationBundleRef: input.runtimePublicationBundleRef,
    grantState: input.grantState,
  });
  return {
    adviceEligibilityGrantId: `advice_eligibility_grant_${stableReviewDigest({
      taskId: input.taskId,
      boundaryDecisionRef: boundary.selfCareBoundaryDecisionId,
      grantTupleHash,
      issuedAt,
    })}`,
    taskId: requireRef(input.taskId, "taskId"),
    requestRef: requireRef(input.requestRef, "requestRef"),
    boundaryDecisionRef: boundary.selfCareBoundaryDecisionId,
    boundaryTupleHash: boundary.boundaryTupleHash,
    grantTupleHash,
    evidenceSnapshotRef: requireRef(input.evidenceSnapshotRef, "evidenceSnapshotRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    safetyState: requireRef(input.safetyState, "safetyState"),
    routeFamily: requireRef(input.routeFamily, "routeFamily"),
    audienceTier: requireRef(input.audienceTier, "audienceTier"),
    channelRef: requireRef(input.channelRef, "channelRef"),
    localeRef: requireRef(input.localeRef, "localeRef"),
    compiledPolicyBundleRef: requireRef(input.compiledPolicyBundleRef, "compiledPolicyBundleRef"),
    adviceBundleVersionRef: requireRef(input.adviceBundleVersionRef, "adviceBundleVersionRef"),
    lineageFenceEpoch: ensurePositiveInteger(input.lineageFenceEpoch, "lineageFenceEpoch"),
    routeIntentRef: requireRef(input.routeIntentRef, "routeIntentRef"),
    subjectBindingVersionRef: optionalRef(input.subjectBindingVersionRef),
    sessionEpochRef: optionalRef(input.sessionEpochRef),
    assuranceSliceTrustRefs,
    surfaceRouteContractRef: requireRef(input.surfaceRouteContractRef, "surfaceRouteContractRef"),
    surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      input.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    reasonCodeRefs: uniqueSorted(input.reasonCodeRefs ?? []),
    issuedAt,
    expiresAt,
    grantState: input.grantState,
    version: 1,
  };
}

function supersededBoundarySnapshot(
  existing: SelfCareBoundaryDecisionSnapshot,
): SelfCareBoundaryDecisionSnapshot {
  return {
    ...existing,
    boundaryState: "superseded",
    version: existing.version + 1,
  };
}

function transitionedGrantSnapshot(
  existing: AdviceEligibilityGrantSnapshot,
  nextGrantState: Extract<
    AdviceEligibilityGrantState,
    "superseded" | "invalidated" | "expired" | "blocked"
  >,
  reasonCodeRefs: readonly string[],
): AdviceEligibilityGrantSnapshot {
  invariant(
    grantStates.includes(nextGrantState),
    "INVALID_ADVICE_GRANT_TRANSITION_STATE",
    "Unsupported AdviceEligibilityGrant transition state.",
  );
  return {
    ...existing,
    grantState: nextGrantState,
    reasonCodeRefs: uniqueSorted([...existing.reasonCodeRefs, ...reasonCodeRefs]),
    version: existing.version + 1,
  };
}

export interface Phase3SelfCareBoundaryKernelService {
  queryTaskBundle(taskId: string): Promise<Phase3SelfCareBoundaryBundle>;
  classifyBoundaryDecision(
    input: ClassifySelfCareBoundaryInput,
  ): Promise<{
    boundaryDecision: SelfCareBoundaryDecisionSnapshot;
    supersededBoundaryDecision: SelfCareBoundaryDecisionSnapshot | null;
    supersessionRecord: SelfCareBoundarySupersessionRecordSnapshot | null;
  }>;
  issueAdviceEligibilityGrant(
    input: IssueAdviceEligibilityGrantInput,
  ): Promise<{
    adviceEligibilityGrant: AdviceEligibilityGrantSnapshot;
    supersededGrant: AdviceEligibilityGrantSnapshot | null;
    transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot | null;
  }>;
  supersedeBoundaryDecision(
    input: SupersedeSelfCareBoundaryInput,
  ): Promise<SelfCareBoundarySupersessionRecordSnapshot>;
  transitionAdviceEligibilityGrant(
    input: TransitionAdviceEligibilityGrantInput,
  ): Promise<{
    adviceEligibilityGrant: AdviceEligibilityGrantSnapshot;
    transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot;
  }>;
  expireDueAdviceEligibilityGrants(asOf: string): Promise<
    readonly {
      adviceEligibilityGrant: AdviceEligibilityGrantSnapshot;
      transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot;
    }[]
  >;
}

class Phase3SelfCareBoundaryKernelServiceImpl
  implements Phase3SelfCareBoundaryKernelService
{
  constructor(
    private readonly repositories: Phase3SelfCareBoundaryKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryTaskBundle(taskId: string): Promise<Phase3SelfCareBoundaryBundle> {
    const [boundaryDecisions, adviceEligibilityGrants, supersessionRecords, transitionRecords] =
      await Promise.all([
        this.repositories.listBoundaryDecisionsForTask(taskId),
        this.repositories.listAdviceEligibilityGrantsForTask(taskId),
        this.repositories.listBoundarySupersessionRecordsForTask(taskId),
        this.repositories.listAdviceEligibilityGrantTransitionRecordsForTask(taskId),
      ]);
    return {
      currentBoundaryDecision: await this.repositories.getCurrentBoundaryDecisionForTask(taskId),
      currentAdviceEligibilityGrant:
        await this.repositories.getCurrentAdviceEligibilityGrantForTask(taskId),
      latestBoundarySupersessionRecord: supersessionRecords.at(-1) ?? null,
      latestGrantTransitionRecord: transitionRecords.at(-1) ?? null,
      boundaryDecisions,
      adviceEligibilityGrants,
    };
  }

  async classifyBoundaryDecision(
    input: ClassifySelfCareBoundaryInput,
  ): Promise<{
    boundaryDecision: SelfCareBoundaryDecisionSnapshot;
    supersededBoundaryDecision: SelfCareBoundaryDecisionSnapshot | null;
    supersessionRecord: SelfCareBoundarySupersessionRecordSnapshot | null;
  }> {
    const candidate = toBoundaryDecisionSnapshot(input);
    const current = await this.repositories.getCurrentBoundaryDecisionForTask(candidate.taskId);
    if (
      current &&
      current.boundaryTupleHash === candidate.boundaryTupleHash &&
      current.decisionEpochRef === candidate.decisionEpochRef &&
      current.boundaryState === candidate.boundaryState &&
      current.reopenState === candidate.reopenState
    ) {
      return {
        boundaryDecision: current,
        supersededBoundaryDecision: null,
        supersessionRecord: null,
      };
    }

    let supersededBoundaryDecision: SelfCareBoundaryDecisionSnapshot | null = null;
    let supersessionRecord: SelfCareBoundarySupersessionRecordSnapshot | null = null;

    if (current) {
      supersededBoundaryDecision = supersededBoundarySnapshot(current);
      await this.repositories.saveBoundaryDecision(supersededBoundaryDecision, {
        expectedVersion: current.version,
      });
      supersessionRecord = {
        boundarySupersessionRecordId: nextId(
          this.idGenerator,
          "phase3_self_care_boundary_supersession",
        ),
        taskId: candidate.taskId,
        requestRef: candidate.requestRef,
        priorBoundaryDecisionRef: current.selfCareBoundaryDecisionId,
        replacementBoundaryDecisionRef: candidate.selfCareBoundaryDecisionId,
        priorDecisionEpochRef: current.decisionEpochRef,
        replacementDecisionEpochRef: candidate.decisionEpochRef,
        priorBoundaryTupleHash: current.boundaryTupleHash,
        replacementBoundaryTupleHash: candidate.boundaryTupleHash,
        causeClass: input.supersessionCauseClass ?? "manual_replace",
        reasonCodeRefs: uniqueSorted(input.reasonCodeRefs ?? []),
        recordedAt: candidate.decidedAt,
        version: 1,
      };
      await this.repositories.saveBoundarySupersessionRecord(supersessionRecord);
    }

    await this.repositories.saveBoundaryDecision(candidate);
    return {
      boundaryDecision: candidate,
      supersededBoundaryDecision,
      supersessionRecord,
    };
  }

  async issueAdviceEligibilityGrant(
    input: IssueAdviceEligibilityGrantInput,
  ): Promise<{
    adviceEligibilityGrant: AdviceEligibilityGrantSnapshot;
    supersededGrant: AdviceEligibilityGrantSnapshot | null;
    transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot | null;
  }> {
    const boundary = await this.repositories.getBoundaryDecision(input.boundaryDecisionRef);
    invariant(
      boundary,
      "SELF_CARE_BOUNDARY_DECISION_NOT_FOUND",
      `SelfCareBoundaryDecision ${input.boundaryDecisionRef} is required.`,
    );
    const candidate = toAdviceGrantSnapshot(boundary, input);
    const current = await this.repositories.getCurrentAdviceEligibilityGrantForTask(candidate.taskId);
    if (
      current &&
      current.grantTupleHash === candidate.grantTupleHash &&
      current.boundaryDecisionRef === candidate.boundaryDecisionRef &&
      current.grantState === candidate.grantState
    ) {
      return {
        adviceEligibilityGrant: current,
        supersededGrant: null,
        transitionRecord: null,
      };
    }

    let supersededGrant: AdviceEligibilityGrantSnapshot | null = null;
    let transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot | null = null;
    if (current && (current.grantState === "live" || current.grantState === "blocked")) {
      supersededGrant = transitionedGrantSnapshot(current, "superseded", [
        "replacement_advice_grant_issued",
      ]);
      await this.repositories.saveAdviceEligibilityGrant(supersededGrant, {
        expectedVersion: current.version,
      });
      transitionRecord = {
        adviceEligibilityGrantTransitionRecordId: nextId(
          this.idGenerator,
          "phase3_advice_eligibility_grant_transition",
        ),
        taskId: candidate.taskId,
        requestRef: candidate.requestRef,
        boundaryDecisionRef: current.boundaryDecisionRef,
        adviceEligibilityGrantRef: current.adviceEligibilityGrantId,
        priorGrantState: current.grantState,
        nextGrantState: "superseded",
        causeClass: input.transitionCauseClass ?? "manual_replace",
        reasonCodeRefs: ["replacement_advice_grant_issued"],
        replacementGrantRef: candidate.adviceEligibilityGrantId,
        recordedAt: candidate.issuedAt,
        version: 1,
      };
      await this.repositories.saveAdviceEligibilityGrantTransitionRecord(transitionRecord);
    }

    await this.repositories.saveAdviceEligibilityGrant(candidate);
    return {
      adviceEligibilityGrant: candidate,
      supersededGrant,
      transitionRecord,
    };
  }

  async supersedeBoundaryDecision(
    input: SupersedeSelfCareBoundaryInput,
  ): Promise<SelfCareBoundarySupersessionRecordSnapshot> {
    const current = await this.repositories.getBoundaryDecision(input.boundaryDecisionId);
    invariant(
      current,
      "SELF_CARE_BOUNDARY_DECISION_NOT_FOUND",
      `SelfCareBoundaryDecision ${input.boundaryDecisionId} is required.`,
    );
    const superseded = supersededBoundarySnapshot(current);
    await this.repositories.saveBoundaryDecision(superseded, {
      expectedVersion: current.version,
    });
    const record: SelfCareBoundarySupersessionRecordSnapshot = {
      boundarySupersessionRecordId: nextId(
        this.idGenerator,
        "phase3_self_care_boundary_supersession",
      ),
      taskId: requireRef(input.taskId, "taskId"),
      requestRef: current.requestRef,
      priorBoundaryDecisionRef: current.selfCareBoundaryDecisionId,
      replacementBoundaryDecisionRef: requireRef(
        input.replacementBoundaryDecisionId,
        "replacementBoundaryDecisionId",
      ),
      priorDecisionEpochRef: current.decisionEpochRef,
      replacementDecisionEpochRef: requireRef(
        input.replacementDecisionEpochRef,
        "replacementDecisionEpochRef",
      ),
      priorBoundaryTupleHash: current.boundaryTupleHash,
      replacementBoundaryTupleHash: requireRef(
        input.replacementBoundaryTupleHash,
        "replacementBoundaryTupleHash",
      ),
      causeClass: input.causeClass,
      reasonCodeRefs: uniqueSorted(input.reasonCodeRefs ?? []),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: 1,
    };
    await this.repositories.saveBoundarySupersessionRecord(record);
    return record;
  }

  async transitionAdviceEligibilityGrant(
    input: TransitionAdviceEligibilityGrantInput,
  ): Promise<{
    adviceEligibilityGrant: AdviceEligibilityGrantSnapshot;
    transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot;
  }> {
    const current = await this.repositories.getAdviceEligibilityGrant(input.adviceEligibilityGrantId);
    invariant(
      current,
      "ADVICE_ELIGIBILITY_GRANT_NOT_FOUND",
      `AdviceEligibilityGrant ${input.adviceEligibilityGrantId} is required.`,
    );
    if (current.grantState === input.nextGrantState) {
      const existing =
        (await this.repositories
          .listAdviceEligibilityGrantTransitionRecordsForTask(input.taskId))
          .find(
            (entry) =>
              entry.adviceEligibilityGrantRef === current.adviceEligibilityGrantId &&
              entry.nextGrantState === input.nextGrantState &&
              entry.causeClass === input.causeClass,
          ) ?? null;
      invariant(
        existing,
        "ADVICE_GRANT_TRANSITION_RECORD_MISSING",
        "Advice grant already transitioned but no transition record was found.",
      );
      return {
        adviceEligibilityGrant: current,
        transitionRecord: existing,
      };
    }
    const updated = transitionedGrantSnapshot(current, input.nextGrantState, input.reasonCodeRefs ?? []);
    await this.repositories.saveAdviceEligibilityGrant(updated, {
      expectedVersion: current.version,
    });
    const transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot = {
      adviceEligibilityGrantTransitionRecordId: nextId(
        this.idGenerator,
        "phase3_advice_eligibility_grant_transition",
      ),
      taskId: requireRef(input.taskId, "taskId"),
      requestRef: current.requestRef,
      boundaryDecisionRef: current.boundaryDecisionRef,
      adviceEligibilityGrantRef: current.adviceEligibilityGrantId,
      priorGrantState: current.grantState,
      nextGrantState: input.nextGrantState,
      causeClass: input.causeClass,
      reasonCodeRefs: uniqueSorted(input.reasonCodeRefs ?? []),
      replacementGrantRef: optionalRef(input.replacementGrantRef),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: 1,
    };
    await this.repositories.saveAdviceEligibilityGrantTransitionRecord(transitionRecord);
    return {
      adviceEligibilityGrant: updated,
      transitionRecord,
    };
  }

  async expireDueAdviceEligibilityGrants(asOf: string): Promise<
    readonly {
      adviceEligibilityGrant: AdviceEligibilityGrantSnapshot;
      transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot;
    }[]
  > {
    const evaluatedAt = ensureIsoTimestamp(asOf, "asOf");
    const results: {
      adviceEligibilityGrant: AdviceEligibilityGrantSnapshot;
      transitionRecord: AdviceEligibilityGrantTransitionRecordSnapshot;
    }[] = [];
    for (const taskId of await this.repositories.listTasksWithAdviceEligibilityGrants()) {
      const grants = await this.repositories.listAdviceEligibilityGrantsForTask(taskId);
      for (const grant of grants) {
        if (grant.grantState !== "live") {
          continue;
        }
        if (compareIso(grant.expiresAt, evaluatedAt) > 0) {
          continue;
        }
        const transitioned = await this.transitionAdviceEligibilityGrant({
          taskId,
          adviceEligibilityGrantId: grant.adviceEligibilityGrantId,
          nextGrantState: "expired",
          causeClass: "expired_ttl",
          reasonCodeRefs: ["grant_ttl_elapsed"],
          recordedAt: evaluatedAt,
        });
        results.push(transitioned);
      }
    }
    return results;
  }
}

export function createPhase3SelfCareBoundaryKernelStore(): Phase3SelfCareBoundaryKernelRepositories {
  return new InMemoryPhase3SelfCareBoundaryKernelStore();
}

export function createPhase3SelfCareBoundaryKernelService(
  repositories: Phase3SelfCareBoundaryKernelRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3SelfCareBoundaryKernelService {
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase3_self_care_boundary_kernel");
  return new Phase3SelfCareBoundaryKernelServiceImpl(repositories, idGenerator);
}
