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

function ensureNonNegativeInteger(value: number | null | undefined, field: string): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
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

export type AdviceAdminDependencyState =
  | "clear"
  | "repair_required"
  | "disputed"
  | "blocked_pending_identity"
  | "blocked_pending_consent"
  | "blocked_pending_external_confirmation";

export type AdviceAdminReopenState =
  | "stable"
  | "reopen_required"
  | "reopened"
  | "blocked_pending_review";

export type AdviceAdminDependencyBlockerKind =
  | "clinical_reentry"
  | "identity_repair"
  | "consent_renewal"
  | "reachability_repair"
  | "delivery_dispute"
  | "external_confirmation";

export type AdviceAdminTriggerType = "blocker" | "reopen" | "clinical_reentry";

const dependencyStates: readonly AdviceAdminDependencyState[] = [
  "clear",
  "repair_required",
  "disputed",
  "blocked_pending_identity",
  "blocked_pending_consent",
  "blocked_pending_external_confirmation",
];

const reopenStates: readonly AdviceAdminReopenState[] = [
  "stable",
  "reopen_required",
  "reopened",
  "blocked_pending_review",
];

export interface AdviceAdminTriggerRegistryEntry {
  triggerCodeRef: string;
  triggerType: AdviceAdminTriggerType;
  blockerKind: AdviceAdminDependencyBlockerKind;
  sourceDomain:
    | "triage_workspace"
    | "communications"
    | "identity_access"
    | "content_release"
    | "admin_resolution";
  sourceArtifactType: string;
  activationCondition: string;
  legalRepairPath: string;
  clinicianReentryRequired: boolean;
  precedenceWeight: number;
  staleWindowRef: string | null;
}

export interface AdviceAdminResolvedTrigger extends AdviceAdminTriggerRegistryEntry {
  sourceArtifactRef: string;
  repairPathRef: string | null;
}

const triggerRegistryEntries = [
  {
    triggerCodeRef: "boundary_review_blocked",
    triggerType: "reopen",
    blockerKind: "clinical_reentry",
    sourceDomain: "triage_workspace",
    sourceArtifactType: "SelfCareBoundaryDecision",
    activationCondition:
      "boundaryState = blocked OR decisionState = blocked_pending_review OR reopenState = blocked_pending_review",
    legalRepairPath: "same_shell_boundary_review_refresh",
    clinicianReentryRequired: true,
    precedenceWeight: 1000,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "boundary_reopened",
    triggerType: "reopen",
    blockerKind: "clinical_reentry",
    sourceDomain: "triage_workspace",
    sourceArtifactType: "SelfCareBoundaryDecision",
    activationCondition: "taskStatus = reopened OR reopenState = reopened",
    legalRepairPath: "same_shell_boundary_review_reopen",
    clinicianReentryRequired: true,
    precedenceWeight: 995,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "safety_preemption_requires_clinician_reentry",
    triggerType: "clinical_reentry",
    blockerKind: "clinical_reentry",
    sourceDomain: "triage_workspace",
    sourceArtifactType: "SafetyPreemptionRecord",
    activationCondition: "currentSafetyPreemptionRef is present",
    legalRepairPath: "same_shell_clinician_reentry",
    clinicianReentryRequired: true,
    precedenceWeight: 990,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "urgent_diversion_requires_clinician_reentry",
    triggerType: "clinical_reentry",
    blockerKind: "clinical_reentry",
    sourceDomain: "triage_workspace",
    sourceArtifactType: "UrgentDiversionSettlement",
    activationCondition: "currentUrgentDiversionSettlementRef is present",
    legalRepairPath: "same_shell_clinician_reentry",
    clinicianReentryRequired: true,
    precedenceWeight: 985,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "material_evidence_drift_requires_boundary_review",
    triggerType: "clinical_reentry",
    blockerKind: "clinical_reentry",
    sourceDomain: "triage_workspace",
    sourceArtifactType: "EvidenceSnapshot",
    activationCondition:
      "currentEvidenceSnapshotRef differs from the boundary or consequence evidence tuple",
    legalRepairPath: "same_shell_boundary_review_refresh",
    clinicianReentryRequired: true,
    precedenceWeight: 980,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "advice_render_invalidated_requires_reopen",
    triggerType: "reopen",
    blockerKind: "clinical_reentry",
    sourceDomain: "content_release",
    sourceArtifactType: "AdviceRenderSettlement",
    activationCondition:
      "AdviceRenderSettlement.renderState is invalidated or quarantined for the current bounded tuple",
    legalRepairPath: "same_shell_boundary_review_refresh",
    clinicianReentryRequired: false,
    precedenceWeight: 970,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "admin_resolution_continuity_frozen",
    triggerType: "reopen",
    blockerKind: "clinical_reentry",
    sourceDomain: "admin_resolution",
    sourceArtifactType: "AdminResolutionCase",
    activationCondition: "AdminResolutionCase continuity evaluation is frozen",
    legalRepairPath: "same_shell_admin_boundary_refresh",
    clinicianReentryRequired: false,
    precedenceWeight: 960,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "identity_repair_active",
    triggerType: "blocker",
    blockerKind: "identity_repair",
    sourceDomain: "identity_access",
    sourceArtifactType: "IdentityRepairCase",
    activationCondition:
      "identityRepairCaseRef is present or bounded admin work is waiting on identity verification",
    legalRepairPath: "identity_repair_recovery",
    clinicianReentryRequired: false,
    precedenceWeight: 900,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "consent_checkpoint_required",
    triggerType: "blocker",
    blockerKind: "consent_renewal",
    sourceDomain: "communications",
    sourceArtifactType: "ConsentCheckpoint",
    activationCondition: "consentCheckpointRef is present on the live patient composer tuple",
    legalRepairPath: "consent_checkpoint_repair",
    clinicianReentryRequired: false,
    precedenceWeight: 800,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "contact_route_repair_required",
    triggerType: "blocker",
    blockerKind: "reachability_repair",
    sourceDomain: "communications",
    sourceArtifactType: "ContactRouteRepairJourney",
    activationCondition:
      "active ContactRouteRepairJourney exists or reachability assessment proves the route is not currently healthy",
    legalRepairPath: "contact_route_repair",
    clinicianReentryRequired: false,
    precedenceWeight: 700,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "delivery_dispute_active",
    triggerType: "blocker",
    blockerKind: "delivery_dispute",
    sourceDomain: "communications",
    sourceArtifactType: "ConversationCommandSettlement",
    activationCondition:
      "deliveryDisputeState = disputed on the current patient conversation digest or settlement chain",
    legalRepairPath: "delivery_dispute_review",
    clinicianReentryRequired: false,
    precedenceWeight: 600,
    staleWindowRef: null,
  },
  {
    triggerCodeRef: "external_dependency_confirmation_required",
    triggerType: "blocker",
    blockerKind: "external_confirmation",
    sourceDomain: "admin_resolution",
    sourceArtifactType: "AdminResolutionCase",
    activationCondition:
      "AdminResolutionCase waiting state requires external, practice, or patient document dependency confirmation",
    legalRepairPath: "admin_external_dependency_follow_up",
    clinicianReentryRequired: false,
    precedenceWeight: 500,
    staleWindowRef: null,
  },
] as const satisfies readonly AdviceAdminTriggerRegistryEntry[];

export class AdviceAdminReopenTriggerRegistry {
  readonly entries = triggerRegistryEntries;

  private readonly entryByCode = new Map<string, AdviceAdminTriggerRegistryEntry>(
    triggerRegistryEntries.map((entry) => [entry.triggerCodeRef, entry] as const),
  );

  listEntries(): readonly AdviceAdminTriggerRegistryEntry[] {
    return this.entries;
  }

  resolveTrigger(input: {
    triggerCodeRef: AdviceAdminTriggerRegistryEntry["triggerCodeRef"];
    sourceArtifactRef: string;
    repairPathRef?: string | null;
  }): AdviceAdminResolvedTrigger {
    const entry = this.entryByCode.get(input.triggerCodeRef);
    invariant(entry, "UNKNOWN_ADVICE_ADMIN_TRIGGER_CODE", `Unknown trigger code ${input.triggerCodeRef}.`);
    return {
      ...entry,
      sourceArtifactRef: requireRef(input.sourceArtifactRef, "sourceArtifactRef"),
      repairPathRef: optionalRef(input.repairPathRef) ?? entry.legalRepairPath,
    };
  }
}

export interface AdviceAdminDependencySetSnapshot {
  adviceAdminDependencySetId: string;
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  lineageFenceEpoch: number;
  adminResolutionSubtypeRef: string | null;
  adviceRenderSettlementRef: string | null;
  adminResolutionCaseRef: string | null;
  reachabilityDependencyRef: string | null;
  contactRepairJourneyRef: string | null;
  reachabilityEpoch: number | null;
  deliveryDisputeRef: string | null;
  consentCheckpointRef: string | null;
  identityRepairCaseRef: string | null;
  identityBlockingVersionRef: string | null;
  externalDependencyRef: string | null;
  externalDependencyVersionRef: string | null;
  activeBlockerRefs: readonly string[];
  dominantBlockerRef: string | null;
  dominantRecoveryRouteRef: string | null;
  reasonCodeRefs: readonly string[];
  reopenTriggerRefs: readonly string[];
  clinicalReentryTriggerRefs: readonly string[];
  dependencyState: AdviceAdminDependencyState;
  reopenState: AdviceAdminReopenState;
  evaluationDigest: string;
  evaluationTriggerRef: string | null;
  evaluatedByRef: string;
  supersedesAdviceAdminDependencySetRef: string | null;
  evaluatedAt: string;
  version: number;
}

export interface AdviceAdminDependencyProjection {
  currentAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
  dependencyState: AdviceAdminDependencyState | null;
  reopenState: AdviceAdminReopenState | null;
  dominantReasonCodeRef: string | null;
  dominantBlockerRef: string | null;
  dominantRecoveryRouteRef: string | null;
  activeBlockerRefs: readonly string[];
  canContinueCurrentConsequence: boolean;
}

export interface AdviceAdminDependencyEvaluation {
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  lineageFenceEpoch: number;
  adminResolutionSubtypeRef: string | null;
  adviceRenderSettlementRef: string | null;
  adminResolutionCaseRef: string | null;
  reachabilityDependencyRef: string | null;
  contactRepairJourneyRef: string | null;
  reachabilityEpoch: number | null;
  deliveryDisputeRef: string | null;
  consentCheckpointRef: string | null;
  identityRepairCaseRef: string | null;
  identityBlockingVersionRef: string | null;
  externalDependencyRef: string | null;
  externalDependencyVersionRef: string | null;
  activeBlockerRefs: readonly string[];
  dominantBlockerRef: string | null;
  dominantRecoveryRouteRef: string | null;
  reasonCodeRefs: readonly string[];
  reopenTriggerRefs: readonly string[];
  clinicalReentryTriggerRefs: readonly string[];
  dependencyState: AdviceAdminDependencyState;
  reopenState: AdviceAdminReopenState;
  evaluationDigest: string;
  evaluationTriggerRef: string | null;
  evaluatedByRef: string;
  evaluatedAt: string;
}

export interface EvaluateAdviceAdminDependencySetInput {
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  boundaryDecisionState: string;
  boundaryState: string;
  boundaryReopenState: string;
  boundaryEvidenceSnapshotRef: string | null;
  decisionEpochRef: string;
  decisionSupersessionRecordRef?: string | null;
  lineageFenceEpoch: number;
  adminResolutionSubtypeRef?: string | null;
  currentDecisionEpochRef?: string | null;
  currentLineageFenceEpoch?: number | null;
  currentEvidenceSnapshotRef?: string | null;
  currentSafetyPreemptionRef?: string | null;
  currentUrgentDiversionSettlementRef?: string | null;
  taskStatus?: string | null;
  adviceRenderSettlementRef?: string | null;
  currentAdviceRenderState?: string | null;
  currentAdviceRenderTrustState?: string | null;
  adminResolutionCaseRef?: string | null;
  currentAdminResolutionCaseState?: string | null;
  currentAdminResolutionWaitingState?: string | null;
  currentAdminResolutionDependencyShape?: string | null;
  currentAdminResolutionReasonRef?: string | null;
  currentAdminResolutionContinuityState?: string | null;
  currentAdminResolutionContinuityReasons?: readonly string[];
  reachabilityDependencyRef?: string | null;
  contactRepairJourneyRef?: string | null;
  reachabilityEpoch?: number | null;
  reachabilityAssessmentState?: string | null;
  reachabilityRouteAuthorityState?: string | null;
  reachabilityRecoveryRouteRef?: string | null;
  deliveryDisputeRef?: string | null;
  deliveryDisputeRecoveryRouteRef?: string | null;
  consentCheckpointRef?: string | null;
  consentRecoveryRouteRef?: string | null;
  identityRepairCaseRef?: string | null;
  identityBlockingVersionRef?: string | null;
  identityRecoveryRouteRef?: string | null;
  externalDependencyRef?: string | null;
  externalDependencyVersionRef?: string | null;
  externalRecoveryRouteRef?: string | null;
  reasonCodeRefs?: readonly string[];
  evaluationTriggerRef?: string | null;
  evaluatedByRef: string;
  evaluatedAt: string;
}

export interface Phase3AdviceAdminDependencyBundle {
  currentAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
  adviceAdminDependencySets: readonly AdviceAdminDependencySetSnapshot[];
  projection: AdviceAdminDependencyProjection;
}

export interface Phase3AdviceAdminDependencyRepositories {
  getAdviceAdminDependencySet(
    adviceAdminDependencySetId: string,
  ): Promise<AdviceAdminDependencySetSnapshot | null>;
  saveAdviceAdminDependencySet(
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdviceAdminDependencySetsForTask(
    taskId: string,
  ): Promise<readonly AdviceAdminDependencySetSnapshot[]>;
  getCurrentAdviceAdminDependencySetForTask(
    taskId: string,
  ): Promise<AdviceAdminDependencySetSnapshot | null>;
  withTaskBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

class InMemoryPhase3AdviceAdminDependencyKernelStore
  implements Phase3AdviceAdminDependencyRepositories
{
  private readonly sets = new Map<string, AdviceAdminDependencySetSnapshot>();
  private readonly setsByTask = new Map<string, string[]>();
  private readonly currentByTask = new Map<string, string>();
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

  async getAdviceAdminDependencySet(
    adviceAdminDependencySetId: string,
  ): Promise<AdviceAdminDependencySetSnapshot | null> {
    return this.sets.get(adviceAdminDependencySetId) ?? null;
  }

  async saveAdviceAdminDependencySet(
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const existing = this.sets.get(adviceAdminDependencySet.adviceAdminDependencySetId);
    if (
      existing &&
      existing.version === adviceAdminDependencySet.version &&
      existing.evaluationDigest === adviceAdminDependencySet.evaluationDigest
    ) {
      this.currentByTask.set(
        adviceAdminDependencySet.taskId,
        adviceAdminDependencySet.adviceAdminDependencySetId,
      );
      return;
    }

    saveWithCas(
      this.sets,
      adviceAdminDependencySet.adviceAdminDependencySetId,
      adviceAdminDependencySet,
      options,
    );
    const existingTaskRefs = this.setsByTask.get(adviceAdminDependencySet.taskId) ?? [];
    if (!existingTaskRefs.includes(adviceAdminDependencySet.adviceAdminDependencySetId)) {
      this.setsByTask.set(adviceAdminDependencySet.taskId, [
        ...existingTaskRefs,
        adviceAdminDependencySet.adviceAdminDependencySetId,
      ]);
    }
    this.currentByTask.set(
      adviceAdminDependencySet.taskId,
      adviceAdminDependencySet.adviceAdminDependencySetId,
    );
  }

  async listAdviceAdminDependencySetsForTask(
    taskId: string,
  ): Promise<readonly AdviceAdminDependencySetSnapshot[]> {
    return (this.setsByTask.get(taskId) ?? [])
      .map((id) => this.sets.get(id))
      .filter((entry): entry is AdviceAdminDependencySetSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.evaluatedAt, right.evaluatedAt));
  }

  async getCurrentAdviceAdminDependencySetForTask(
    taskId: string,
  ): Promise<AdviceAdminDependencySetSnapshot | null> {
    const current = this.currentByTask.get(taskId);
    return current ? (this.sets.get(current) ?? null) : null;
  }
}

export class AdviceAdminRecoveryRouteResolver {
  resolve(input: {
    blockers: readonly AdviceAdminResolvedTrigger[];
    reopenTriggers: readonly AdviceAdminResolvedTrigger[];
    clinicalReentryTriggers: readonly AdviceAdminResolvedTrigger[];
  }): {
    dominantBlockerRef: string | null;
    dominantRecoveryRouteRef: string | null;
    activeBlockerRefs: readonly string[];
    reasonCodeRefs: readonly string[];
  } {
    const ordered = [
      ...input.clinicalReentryTriggers,
      ...input.reopenTriggers,
      ...input.blockers,
    ].sort((left, right) => right.precedenceWeight - left.precedenceWeight);
    const dominant = ordered[0] ?? null;
    return {
      dominantBlockerRef: dominant?.sourceArtifactRef ?? null,
      dominantRecoveryRouteRef: dominant?.repairPathRef ?? null,
      activeBlockerRefs: uniqueSorted(ordered.map((entry) => entry.sourceArtifactRef)),
      reasonCodeRefs: uniqueSorted(ordered.map((entry) => entry.triggerCodeRef)),
    };
  }
}

export class AdviceAdminDependencyEvaluator {
  constructor(
    private readonly triggerRegistry = new AdviceAdminReopenTriggerRegistry(),
    private readonly recoveryRouteResolver = new AdviceAdminRecoveryRouteResolver(),
  ) {}

  evaluate(input: EvaluateAdviceAdminDependencySetInput): AdviceAdminDependencyEvaluation {
    const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
    const boundaryDecisionRef = requireRef(input.boundaryDecisionRef, "boundaryDecisionRef");
    const boundaryTupleHash = requireRef(input.boundaryTupleHash, "boundaryTupleHash");
    const decisionEpochRef = requireRef(input.decisionEpochRef, "decisionEpochRef");
    const requestRef = requireRef(input.requestRef, "requestRef");
    const taskId = requireRef(input.taskId, "taskId");
    const lineageFenceEpoch = ensureNonNegativeInteger(
      input.lineageFenceEpoch,
      "lineageFenceEpoch",
    );
    invariant(
      lineageFenceEpoch !== null,
      "INVALID_LINEAGE_FENCE_EPOCH",
      "lineageFenceEpoch is required.",
    );

    const blockers: AdviceAdminResolvedTrigger[] = [];
    const reopenTriggers: AdviceAdminResolvedTrigger[] = [];
    const clinicalReentryTriggers: AdviceAdminResolvedTrigger[] = [];
    const explicitReasons = new Set(input.reasonCodeRefs ?? []);

    const resolveTrigger = (
      triggerCodeRef: AdviceAdminTriggerRegistryEntry["triggerCodeRef"],
      sourceArtifactRef: string,
      repairPathRef?: string | null,
    ) => this.triggerRegistry.resolveTrigger({ triggerCodeRef, sourceArtifactRef, repairPathRef });

    const identityRepairCaseRef = optionalRef(input.identityRepairCaseRef);
    const consentCheckpointRef = optionalRef(input.consentCheckpointRef);
    const deliveryDisputeRef = optionalRef(input.deliveryDisputeRef);
    const contactRepairJourneyRef = optionalRef(input.contactRepairJourneyRef);
    const reachabilityDependencyRef = optionalRef(input.reachabilityDependencyRef);
    const externalDependencyRef = optionalRef(input.externalDependencyRef);
    const adminResolutionCaseRef = optionalRef(input.adminResolutionCaseRef);

    const identityRecoveryRouteRef =
      optionalRef(input.identityRecoveryRouteRef) ??
      `/workspace/tasks/${taskId}/identity-repair`;
    const consentRecoveryRouteRef =
      optionalRef(input.consentRecoveryRouteRef) ??
      `/workspace/tasks/${taskId}/communications/consent`;
    const reachabilityRecoveryRouteRef =
      optionalRef(input.reachabilityRecoveryRouteRef) ??
      `/workspace/tasks/${taskId}/communications/repair`;
    const deliveryDisputeRecoveryRouteRef =
      optionalRef(input.deliveryDisputeRecoveryRouteRef) ??
      `/workspace/tasks/${taskId}/communications/dispute`;
    const externalRecoveryRouteRef =
      optionalRef(input.externalRecoveryRouteRef) ??
      (adminResolutionCaseRef
        ? `/workspace/tasks/${taskId}/admin-resolution/${adminResolutionCaseRef}/waiting`
        : `/workspace/tasks/${taskId}/admin-resolution/waiting`);
    const boundaryRecoveryRouteRef = `/workspace/tasks/${taskId}/review/reopen`;

    const adminWaitingState = optionalRef(input.currentAdminResolutionWaitingState);
    if (identityRepairCaseRef !== null || adminWaitingState === "identity_verification") {
      blockers.push(
        resolveTrigger(
          "identity_repair_active",
          identityRepairCaseRef ??
            optionalRef(input.currentAdminResolutionReasonRef) ??
            adminResolutionCaseRef ??
            boundaryDecisionRef,
          identityRecoveryRouteRef,
        ),
      );
    }

    if (consentCheckpointRef !== null) {
      blockers.push(
        resolveTrigger(
          "consent_checkpoint_required",
          consentCheckpointRef,
          consentRecoveryRouteRef,
        ),
      );
    }

    const reachabilityAssessmentState = optionalRef(input.reachabilityAssessmentState);
    const reachabilityRouteAuthorityState = optionalRef(input.reachabilityRouteAuthorityState);
    if (
      contactRepairJourneyRef !== null ||
      (reachabilityDependencyRef !== null &&
        (reachabilityAssessmentState === "blocked" ||
          reachabilityAssessmentState === "at_risk" ||
          (reachabilityRouteAuthorityState !== null &&
            reachabilityRouteAuthorityState !== "current" &&
            reachabilityRouteAuthorityState !== "disputed")))
    ) {
      blockers.push(
        resolveTrigger(
          "contact_route_repair_required",
          contactRepairJourneyRef ?? reachabilityDependencyRef ?? boundaryDecisionRef,
          reachabilityRecoveryRouteRef,
        ),
      );
    }

    if (deliveryDisputeRef !== null) {
      blockers.push(
        resolveTrigger(
          "delivery_dispute_active",
          deliveryDisputeRef,
          deliveryDisputeRecoveryRouteRef,
        ),
      );
    }

    if (
      externalDependencyRef !== null ||
      adminWaitingState === "awaiting_external_dependency" ||
      adminWaitingState === "awaiting_practice_action" ||
      adminWaitingState === "patient_document_return"
    ) {
      blockers.push(
        resolveTrigger(
          "external_dependency_confirmation_required",
          externalDependencyRef ??
            optionalRef(input.currentAdminResolutionReasonRef) ??
            adminResolutionCaseRef ??
            boundaryDecisionRef,
          externalRecoveryRouteRef,
        ),
      );
    }

    const boundaryState = requireRef(input.boundaryState, "boundaryState");
    const boundaryDecisionState = requireRef(input.boundaryDecisionState, "boundaryDecisionState");
    const boundaryReopenState = requireRef(input.boundaryReopenState, "boundaryReopenState");
    if (
      boundaryState === "blocked" ||
      boundaryDecisionState === "blocked_pending_review" ||
      boundaryReopenState === "blocked_pending_review"
    ) {
      reopenTriggers.push(
        resolveTrigger("boundary_review_blocked", boundaryDecisionRef, boundaryRecoveryRouteRef),
      );
    }

    if (boundaryReopenState === "reopened" || optionalRef(input.taskStatus) === "reopened") {
      reopenTriggers.push(
        resolveTrigger("boundary_reopened", boundaryDecisionRef, boundaryRecoveryRouteRef),
      );
    }

    if (optionalRef(input.currentSafetyPreemptionRef) !== null) {
      clinicalReentryTriggers.push(
        resolveTrigger(
          "safety_preemption_requires_clinician_reentry",
          optionalRef(input.currentSafetyPreemptionRef) ?? boundaryDecisionRef,
          boundaryRecoveryRouteRef,
        ),
      );
    }

    if (optionalRef(input.currentUrgentDiversionSettlementRef) !== null) {
      clinicalReentryTriggers.push(
        resolveTrigger(
          "urgent_diversion_requires_clinician_reentry",
          optionalRef(input.currentUrgentDiversionSettlementRef) ?? boundaryDecisionRef,
          boundaryRecoveryRouteRef,
        ),
      );
    }

    const currentEvidenceSnapshotRef = optionalRef(input.currentEvidenceSnapshotRef);
    const boundaryEvidenceSnapshotRef = optionalRef(input.boundaryEvidenceSnapshotRef);
    if (
      currentEvidenceSnapshotRef !== null &&
      boundaryEvidenceSnapshotRef !== null &&
      currentEvidenceSnapshotRef !== boundaryEvidenceSnapshotRef
    ) {
      clinicalReentryTriggers.push(
        resolveTrigger(
          "material_evidence_drift_requires_boundary_review",
          currentEvidenceSnapshotRef,
          boundaryRecoveryRouteRef,
        ),
      );
    }

    const currentAdviceRenderState = optionalRef(input.currentAdviceRenderState);
    if (
      currentAdviceRenderState === "invalidated" ||
      currentAdviceRenderState === "quarantined"
    ) {
      reopenTriggers.push(
        resolveTrigger(
          "advice_render_invalidated_requires_reopen",
          optionalRef(input.adviceRenderSettlementRef) ?? boundaryDecisionRef,
          boundaryRecoveryRouteRef,
        ),
      );
    }

    if (
      optionalRef(input.currentAdminResolutionContinuityState) === "frozen" ||
      optionalRef(input.currentAdminResolutionCaseState) === "frozen"
    ) {
      reopenTriggers.push(
        resolveTrigger(
          "admin_resolution_continuity_frozen",
          adminResolutionCaseRef ?? boundaryDecisionRef,
          externalRecoveryRouteRef,
        ),
      );
    }

    if (
      optionalRef(input.currentDecisionEpochRef) !== null &&
      optionalRef(input.currentDecisionEpochRef) !== decisionEpochRef
    ) {
      reopenTriggers.push(
        resolveTrigger(
          "admin_resolution_continuity_frozen",
          optionalRef(input.currentDecisionEpochRef) ?? boundaryDecisionRef,
          boundaryRecoveryRouteRef,
        ),
      );
    }

    if (
      ensureNonNegativeInteger(input.currentLineageFenceEpoch, "currentLineageFenceEpoch") !== null &&
      input.currentLineageFenceEpoch !== lineageFenceEpoch
    ) {
      reopenTriggers.push(
        resolveTrigger(
          "admin_resolution_continuity_frozen",
          String(input.currentLineageFenceEpoch),
          boundaryRecoveryRouteRef,
        ),
      );
    }

    const resolved = this.recoveryRouteResolver.resolve({
      blockers,
      reopenTriggers,
      clinicalReentryTriggers,
    });

    const dependencyState = this.resolveDependencyState(blockers);
    const reopenState = this.resolveReopenState({
      boundaryState,
      boundaryReopenState,
      reopenTriggers,
      clinicalReentryTriggers,
      taskStatus: optionalRef(input.taskStatus),
    });

    for (const reason of resolved.reasonCodeRefs) {
      explicitReasons.add(reason);
    }
    for (const reason of input.currentAdminResolutionContinuityReasons ?? []) {
      explicitReasons.add(reason);
    }
    if (optionalRef(input.decisionSupersessionRecordRef) !== null) {
      explicitReasons.add("decision_supersession_record_present");
    }
    if (optionalRef(input.currentAdviceRenderTrustState) === "quarantined") {
      explicitReasons.add("advice_render_trust_quarantined");
    }

    const reasonCodeRefs = uniqueSorted([...explicitReasons]);
    const reopenTriggerRefs = uniqueSorted(reopenTriggers.map((entry) => entry.triggerCodeRef));
    const clinicalReentryTriggerRefs = uniqueSorted(
      clinicalReentryTriggers.map((entry) => entry.triggerCodeRef),
    );
    const evaluationDigest = stableReviewDigest({
      taskId,
      boundaryTupleHash,
      decisionEpochRef,
      lineageFenceEpoch,
      adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
      adviceRenderSettlementRef: optionalRef(input.adviceRenderSettlementRef),
      adminResolutionCaseRef,
      reachabilityDependencyRef,
      contactRepairJourneyRef,
      reachabilityEpoch: ensureNonNegativeInteger(input.reachabilityEpoch, "reachabilityEpoch"),
      deliveryDisputeRef,
      consentCheckpointRef,
      identityRepairCaseRef,
      identityBlockingVersionRef: optionalRef(input.identityBlockingVersionRef),
      externalDependencyRef,
      externalDependencyVersionRef: optionalRef(input.externalDependencyVersionRef),
      activeBlockerRefs: resolved.activeBlockerRefs,
      dominantBlockerRef: resolved.dominantBlockerRef,
      dominantRecoveryRouteRef: resolved.dominantRecoveryRouteRef,
      reasonCodeRefs,
      reopenTriggerRefs,
      clinicalReentryTriggerRefs,
      dependencyState,
      reopenState,
      currentAdviceRenderState,
      currentAdminResolutionCaseState: optionalRef(input.currentAdminResolutionCaseState),
      currentAdminResolutionWaitingState: adminWaitingState,
      currentEvidenceSnapshotRef,
      boundaryEvidenceSnapshotRef,
    });

    return {
      taskId,
      requestRef,
      boundaryDecisionRef,
      boundaryTupleHash,
      decisionEpochRef,
      decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
      lineageFenceEpoch,
      adminResolutionSubtypeRef: optionalRef(input.adminResolutionSubtypeRef),
      adviceRenderSettlementRef: optionalRef(input.adviceRenderSettlementRef),
      adminResolutionCaseRef,
      reachabilityDependencyRef,
      contactRepairJourneyRef,
      reachabilityEpoch: ensureNonNegativeInteger(input.reachabilityEpoch, "reachabilityEpoch"),
      deliveryDisputeRef,
      consentCheckpointRef,
      identityRepairCaseRef,
      identityBlockingVersionRef: optionalRef(input.identityBlockingVersionRef),
      externalDependencyRef,
      externalDependencyVersionRef: optionalRef(input.externalDependencyVersionRef),
      activeBlockerRefs: resolved.activeBlockerRefs,
      dominantBlockerRef: resolved.dominantBlockerRef,
      dominantRecoveryRouteRef: resolved.dominantRecoveryRouteRef,
      reasonCodeRefs,
      reopenTriggerRefs,
      clinicalReentryTriggerRefs,
      dependencyState,
      reopenState,
      evaluationDigest,
      evaluationTriggerRef: optionalRef(input.evaluationTriggerRef),
      evaluatedByRef: requireRef(input.evaluatedByRef, "evaluatedByRef"),
      evaluatedAt,
    };
  }

  private resolveDependencyState(
    blockers: readonly AdviceAdminResolvedTrigger[],
  ): AdviceAdminDependencyState {
    const has = (kind: AdviceAdminDependencyBlockerKind) =>
      blockers.some((entry) => entry.blockerKind === kind);
    if (has("identity_repair")) {
      return "blocked_pending_identity";
    }
    if (has("consent_renewal")) {
      return "blocked_pending_consent";
    }
    if (has("reachability_repair")) {
      return "repair_required";
    }
    if (has("delivery_dispute")) {
      return "disputed";
    }
    if (has("external_confirmation")) {
      return "blocked_pending_external_confirmation";
    }
    return "clear";
  }

  private resolveReopenState(input: {
    boundaryState: string;
    boundaryReopenState: string;
    reopenTriggers: readonly AdviceAdminResolvedTrigger[];
    clinicalReentryTriggers: readonly AdviceAdminResolvedTrigger[];
    taskStatus: string | null;
  }): AdviceAdminReopenState {
    if (
      input.boundaryState === "blocked" ||
      input.boundaryReopenState === "blocked_pending_review"
    ) {
      return "blocked_pending_review";
    }
    if (input.boundaryReopenState === "reopened" || input.taskStatus === "reopened") {
      return "reopened";
    }
    if (
      input.boundaryReopenState === "reopen_required" ||
      input.reopenTriggers.length > 0 ||
      input.clinicalReentryTriggers.length > 0
    ) {
      return "reopen_required";
    }
    return "stable";
  }
}

export class AdviceAdminDependencyProjectionAdapter {
  toProjection(
    snapshot: AdviceAdminDependencySetSnapshot | null,
  ): AdviceAdminDependencyProjection {
    return {
      currentAdviceAdminDependencySet: snapshot,
      dependencyState: snapshot?.dependencyState ?? null,
      reopenState: snapshot?.reopenState ?? null,
      dominantReasonCodeRef: snapshot?.reasonCodeRefs[0] ?? null,
      dominantBlockerRef: snapshot?.dominantBlockerRef ?? null,
      dominantRecoveryRouteRef: snapshot?.dominantRecoveryRouteRef ?? null,
      activeBlockerRefs: snapshot?.activeBlockerRefs ?? [],
      canContinueCurrentConsequence:
        snapshot !== null &&
        snapshot.dependencyState === "clear" &&
        snapshot.reopenState === "stable",
    };
  }

  matchesCurrent(
    current: AdviceAdminDependencySetSnapshot,
    evaluation: AdviceAdminDependencyEvaluation,
  ): boolean {
    return (
      current.boundaryTupleHash === evaluation.boundaryTupleHash &&
      current.decisionEpochRef === evaluation.decisionEpochRef &&
      current.evaluationDigest === evaluation.evaluationDigest &&
      current.dependencyState === evaluation.dependencyState &&
      current.reopenState === evaluation.reopenState
    );
  }

  toSnapshot(input: {
    evaluation: AdviceAdminDependencyEvaluation;
    supersedesAdviceAdminDependencySetRef: string | null;
  }): AdviceAdminDependencySetSnapshot {
    const evaluation = input.evaluation;
    return {
      adviceAdminDependencySetId: `advice_admin_dependency_set_${stableReviewDigest({
        taskId: evaluation.taskId,
        boundaryTupleHash: evaluation.boundaryTupleHash,
        decisionEpochRef: evaluation.decisionEpochRef,
        evaluationDigest: evaluation.evaluationDigest,
      })}`,
      taskId: evaluation.taskId,
      requestRef: evaluation.requestRef,
      boundaryDecisionRef: evaluation.boundaryDecisionRef,
      boundaryTupleHash: evaluation.boundaryTupleHash,
      decisionEpochRef: evaluation.decisionEpochRef,
      decisionSupersessionRecordRef: evaluation.decisionSupersessionRecordRef,
      lineageFenceEpoch: evaluation.lineageFenceEpoch,
      adminResolutionSubtypeRef: evaluation.adminResolutionSubtypeRef,
      adviceRenderSettlementRef: evaluation.adviceRenderSettlementRef,
      adminResolutionCaseRef: evaluation.adminResolutionCaseRef,
      reachabilityDependencyRef: evaluation.reachabilityDependencyRef,
      contactRepairJourneyRef: evaluation.contactRepairJourneyRef,
      reachabilityEpoch: evaluation.reachabilityEpoch,
      deliveryDisputeRef: evaluation.deliveryDisputeRef,
      consentCheckpointRef: evaluation.consentCheckpointRef,
      identityRepairCaseRef: evaluation.identityRepairCaseRef,
      identityBlockingVersionRef: evaluation.identityBlockingVersionRef,
      externalDependencyRef: evaluation.externalDependencyRef,
      externalDependencyVersionRef: evaluation.externalDependencyVersionRef,
      activeBlockerRefs: evaluation.activeBlockerRefs,
      dominantBlockerRef: evaluation.dominantBlockerRef,
      dominantRecoveryRouteRef: evaluation.dominantRecoveryRouteRef,
      reasonCodeRefs: evaluation.reasonCodeRefs,
      reopenTriggerRefs: evaluation.reopenTriggerRefs,
      clinicalReentryTriggerRefs: evaluation.clinicalReentryTriggerRefs,
      dependencyState: evaluation.dependencyState,
      reopenState: evaluation.reopenState,
      evaluationDigest: evaluation.evaluationDigest,
      evaluationTriggerRef: evaluation.evaluationTriggerRef,
      evaluatedByRef: evaluation.evaluatedByRef,
      supersedesAdviceAdminDependencySetRef:
        optionalRef(input.supersedesAdviceAdminDependencySetRef),
      evaluatedAt: evaluation.evaluatedAt,
      version: 1,
    };
  }
}

export interface Phase3AdviceAdminDependencyKernelService {
  readonly triggerRegistry: AdviceAdminReopenTriggerRegistry;
  readonly recoveryRouteResolver: AdviceAdminRecoveryRouteResolver;
  readonly evaluator: AdviceAdminDependencyEvaluator;
  readonly projectionAdapter: AdviceAdminDependencyProjectionAdapter;
  queryTaskBundle(taskId: string): Promise<Phase3AdviceAdminDependencyBundle>;
  fetchCurrentAdviceAdminDependencySet(
    taskId: string,
  ): Promise<AdviceAdminDependencySetSnapshot | null>;
  evaluateAdviceAdminDependencySet(input: EvaluateAdviceAdminDependencySetInput): Promise<{
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot;
    supersededAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
    projection: AdviceAdminDependencyProjection;
    reusedExisting: boolean;
  }>;
  refreshAdviceAdminDependencySet(input: EvaluateAdviceAdminDependencySetInput): Promise<{
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot;
    supersededAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
    projection: AdviceAdminDependencyProjection;
    reusedExisting: boolean;
  }>;
  recalculateAdviceAdminReopenState(input: EvaluateAdviceAdminDependencySetInput): Promise<{
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot;
    supersededAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
    projection: AdviceAdminDependencyProjection;
    reusedExisting: boolean;
  }>;
}

class Phase3AdviceAdminDependencyKernelServiceImpl
  implements Phase3AdviceAdminDependencyKernelService
{
  readonly triggerRegistry: AdviceAdminReopenTriggerRegistry;
  readonly recoveryRouteResolver: AdviceAdminRecoveryRouteResolver;
  readonly evaluator: AdviceAdminDependencyEvaluator;
  readonly projectionAdapter: AdviceAdminDependencyProjectionAdapter;

  constructor(
    private readonly repositories: Phase3AdviceAdminDependencyRepositories,
    options?: { idGenerator?: BackboneIdGenerator },
  ) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase3_advice_admin_dependency");
    this.triggerRegistry = new AdviceAdminReopenTriggerRegistry();
    this.recoveryRouteResolver = new AdviceAdminRecoveryRouteResolver();
    this.evaluator = new AdviceAdminDependencyEvaluator(
      this.triggerRegistry,
      this.recoveryRouteResolver,
    );
    this.projectionAdapter = new AdviceAdminDependencyProjectionAdapter();
  }

  private readonly idGenerator: BackboneIdGenerator;

  async queryTaskBundle(taskId: string): Promise<Phase3AdviceAdminDependencyBundle> {
    const currentAdviceAdminDependencySet =
      await this.repositories.getCurrentAdviceAdminDependencySetForTask(
        requireRef(taskId, "taskId"),
      );
    const adviceAdminDependencySets =
      await this.repositories.listAdviceAdminDependencySetsForTask(taskId);
    return {
      currentAdviceAdminDependencySet,
      adviceAdminDependencySets,
      projection: this.projectionAdapter.toProjection(currentAdviceAdminDependencySet),
    };
  }

  async fetchCurrentAdviceAdminDependencySet(
    taskId: string,
  ): Promise<AdviceAdminDependencySetSnapshot | null> {
    return this.repositories.getCurrentAdviceAdminDependencySetForTask(
      requireRef(taskId, "taskId"),
    );
  }

  async evaluateAdviceAdminDependencySet(
    input: EvaluateAdviceAdminDependencySetInput,
  ): Promise<{
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot;
    supersededAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
    projection: AdviceAdminDependencyProjection;
    reusedExisting: boolean;
  }> {
    return this.persistEvaluation(input);
  }

  async refreshAdviceAdminDependencySet(
    input: EvaluateAdviceAdminDependencySetInput,
  ): Promise<{
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot;
    supersededAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
    projection: AdviceAdminDependencyProjection;
    reusedExisting: boolean;
  }> {
    return this.persistEvaluation({
      ...input,
      evaluationTriggerRef:
        optionalRef(input.evaluationTriggerRef) ?? "refresh_advice_admin_dependency_set",
    });
  }

  async recalculateAdviceAdminReopenState(
    input: EvaluateAdviceAdminDependencySetInput,
  ): Promise<{
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot;
    supersededAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
    projection: AdviceAdminDependencyProjection;
    reusedExisting: boolean;
  }> {
    return this.persistEvaluation({
      ...input,
      evaluationTriggerRef:
        optionalRef(input.evaluationTriggerRef) ?? "recalculate_advice_admin_reopen_state",
    });
  }

  private async persistEvaluation(
    input: EvaluateAdviceAdminDependencySetInput,
  ): Promise<{
    adviceAdminDependencySet: AdviceAdminDependencySetSnapshot;
    supersededAdviceAdminDependencySet: AdviceAdminDependencySetSnapshot | null;
    projection: AdviceAdminDependencyProjection;
    reusedExisting: boolean;
  }> {
    return this.repositories.withTaskBoundary(async () => {
      const evaluation = this.evaluator.evaluate(input);
      invariant(
        dependencyStates.includes(evaluation.dependencyState),
        "INVALID_ADVICE_ADMIN_DEPENDENCY_STATE",
        "Unsupported advice/admin dependencyState.",
      );
      invariant(
        reopenStates.includes(evaluation.reopenState),
        "INVALID_ADVICE_ADMIN_REOPEN_STATE",
        "Unsupported advice/admin reopenState.",
      );

      const current = await this.repositories.getCurrentAdviceAdminDependencySetForTask(
        evaluation.taskId,
      );
      if (current && this.projectionAdapter.matchesCurrent(current, evaluation)) {
        return {
          adviceAdminDependencySet: current,
          supersededAdviceAdminDependencySet: null,
          projection: this.projectionAdapter.toProjection(current),
          reusedExisting: true,
        };
      }

      const candidate = this.projectionAdapter.toSnapshot({
        evaluation,
        supersedesAdviceAdminDependencySetRef: current?.adviceAdminDependencySetId ?? null,
      });
      const existing = await this.repositories.getAdviceAdminDependencySet(
        candidate.adviceAdminDependencySetId,
      );
      if (existing && existing.evaluationDigest === candidate.evaluationDigest) {
        await this.repositories.saveAdviceAdminDependencySet(existing);
        return {
          adviceAdminDependencySet: existing,
          supersededAdviceAdminDependencySet: current ?? null,
          projection: this.projectionAdapter.toProjection(existing),
          reusedExisting: true,
        };
      }

      await this.repositories.saveAdviceAdminDependencySet(candidate);
      return {
        adviceAdminDependencySet: candidate,
        supersededAdviceAdminDependencySet: current ?? null,
        projection: this.projectionAdapter.toProjection(candidate),
        reusedExisting: false,
      };
    });
  }
}

export function createPhase3AdviceAdminDependencyKernelStore(): Phase3AdviceAdminDependencyRepositories {
  return new InMemoryPhase3AdviceAdminDependencyKernelStore();
}

export function createPhase3AdviceAdminDependencyKernelService(
  repositories: Phase3AdviceAdminDependencyRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3AdviceAdminDependencyKernelService {
  return new Phase3AdviceAdminDependencyKernelServiceImpl(repositories, options);
}
