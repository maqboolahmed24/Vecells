import {
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceEvidenceGraphEdge,
} from "./phase9-assurance-ledger-contracts";
import {
  createPhase9GovernanceControlFixture,
  dispositionBlockReasonValues,
  resolveTransitiveArtifactDependencies,
  validateRetentionClassificationBoundAtCreation,
  type ArtifactDependencyLink,
  type ArtifactDependencyStrength,
  type DispositionEligibilityAssessment,
  type DispositionEligibilityState,
  type EffectiveDisposition,
  type LegalHoldOriginType,
  type LegalHoldRecord,
  type LegalHoldScopeManifest,
  type LegalHoldScopeType,
  type RetentionDecision,
  type RetentionGraphCriticality,
  type RetentionLifecycleBinding,
} from "./phase9-governance-control-contracts";
import { createPhase9AssurancePackFactoryFixture } from "./phase9-assurance-pack-factory";
import { createPhase9CapaAttestationWorkflowFixture } from "./phase9-capa-attestation-workflow";

export const PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION =
  "442.phase9.retention-lifecycle-engine.v1";

export type RetentionDispositionResult =
  | "eligible"
  | "archive_only"
  | "blocked"
  | "needs_review"
  | "not_due";

export type RetentionLifecycleMutationResult =
  | "bound"
  | "created"
  | "superseded"
  | "released"
  | "blocked"
  | "quarantined";

export type DispositionActionType = "archive" | "delete";
export type DispositionCandidateSource =
  | "explicit_lifecycle_binding"
  | "current_disposition_assessment"
  | "raw_storage_scan"
  | "operator_csv";

export interface RetentionLifecycleActorContext {
  readonly tenantId: string;
  readonly actorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly generatedAt: string;
}

export interface RetentionClass {
  readonly retentionClassId: string;
  readonly recordType: string;
  readonly basisRef: string;
  readonly minimumRetention: string;
  readonly reviewPoint: string;
  readonly disposalMode: string;
  readonly immutabilityMode: string;
  readonly dependencyCheckPolicyRef: string;
  readonly sourcePolicyRef: string;
  readonly freezeEscalationPolicyRef: string;
  readonly legalHoldEscalationPolicyRef: string;
  readonly derivativeRetentionPolicyRef: string;
  readonly classState: "active" | "superseded" | "retired";
  readonly policyTupleHash: string;
}

export interface RetentionLifecycleAuditRecord {
  readonly retentionLifecycleAuditRecordId: string;
  readonly tenantId: string;
  readonly actorRef: string;
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly actionType: string;
  readonly targetRef: string;
  readonly result: RetentionLifecycleMutationResult | RetentionDispositionResult;
  readonly blockerRefs: readonly string[];
  readonly graphHash: string;
  readonly commandHash: string;
  readonly recordedAt: string;
}

export interface LifecycleBindingResult {
  readonly result: RetentionLifecycleMutationResult;
  readonly binding?: RetentionLifecycleBinding;
  readonly initialDecision?: RetentionDecision;
  readonly auditRecords: readonly RetentionLifecycleAuditRecord[];
  readonly blockerRefs: readonly string[];
}

export interface LegalHoldMutationResult {
  readonly result: RetentionLifecycleMutationResult;
  readonly legalHold: LegalHoldRecord;
  readonly scopeManifest: LegalHoldScopeManifest;
  readonly auditRecords: readonly RetentionLifecycleAuditRecord[];
  readonly blockerRefs: readonly string[];
}

export interface DependencyLinkMutationResult {
  readonly result: RetentionLifecycleMutationResult;
  readonly dependencyLink: ArtifactDependencyLink;
  readonly auditRecords: readonly RetentionLifecycleAuditRecord[];
  readonly blockerRefs: readonly string[];
}

export interface DispositionEligibilityAssessmentRecord {
  readonly dispositionEligibilityAssessment: DispositionEligibilityAssessment;
  readonly result: RetentionDispositionResult;
  readonly artifactRef: string;
  readonly requestedAction: DispositionActionType;
  readonly candidateSource: DispositionCandidateSource;
  readonly blockerRefs: readonly string[];
  readonly dependencyArtifactRefs: readonly string[];
  readonly activeDependencyLinkRefs: readonly string[];
  readonly activeFreezeRefs: readonly string[];
  readonly activeLegalHoldRefs: readonly string[];
  readonly policyRefs: readonly string[];
  readonly graphRefs: readonly string[];
  readonly assessorActionRef: string;
  readonly nextReviewDate: string;
  readonly decisionHash: string;
  readonly auditRecords: readonly RetentionLifecycleAuditRecord[];
}

export interface RetentionLifecycleEvidenceRecord {
  readonly lifecycleEvidenceRecordId: string;
  readonly artifactRef: string;
  readonly bindingRef: string;
  readonly decisionRef: string;
  readonly assessmentRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly lifecycleEvidenceHash: string;
  readonly emittedAt: string;
}

export interface RetentionLifecyclePage<T> {
  readonly rows: readonly T[];
  readonly nextCursor?: string;
}

export interface RetentionLifecycleEngineFixture {
  readonly schemaVersion: typeof PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly retentionClasses: readonly RetentionClass[];
  readonly artifactCreationResult: LifecycleBindingResult;
  readonly missingRetentionClassResult: LifecycleBindingResult;
  readonly baselineDecision: RetentionDecision;
  readonly deterministicDecisionReplay: RetentionDecision;
  readonly notDueAssessment: DispositionEligibilityAssessmentRecord;
  readonly legalHoldResult: LegalHoldMutationResult;
  readonly legalHoldBlockedAssessment: DispositionEligibilityAssessmentRecord;
  readonly releasedLegalHoldResult: LegalHoldMutationResult;
  readonly reassessmentAfterRelease: DispositionEligibilityAssessmentRecord;
  readonly transitiveDependencyAssessment: DispositionEligibilityAssessmentRecord;
  readonly dependencyCycleAssessment: DispositionEligibilityAssessmentRecord;
  readonly wormHashChainedAssessment: DispositionEligibilityAssessmentRecord;
  readonly replayCriticalAssessment: DispositionEligibilityAssessmentRecord;
  readonly assurancePackDependencyAssessment: DispositionEligibilityAssessmentRecord;
  readonly missingGraphVerdictAssessment: DispositionEligibilityAssessmentRecord;
  readonly crossTenantDependencyErrorCode: string;
  readonly supersededRetentionClass: RetentionClass;
  readonly replacementRetentionClass: RetentionClass;
  readonly oldDecisionAfterSupersession: RetentionDecision;
  readonly newDecisionAfterSupersession: RetentionDecision;
  readonly rawStorageScanAssessment: DispositionEligibilityAssessmentRecord;
  readonly lifecycleEvidenceRecord: RetentionLifecycleEvidenceRecord;
  readonly replayHash: string;
}

export class Phase9RetentionLifecycleEngineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9RetentionLifecycleEngineError";
    this.code = code;
  }
}

function lifecycleInvariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9RetentionLifecycleEngineError(code, message);
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

function lifecycleHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(omitUndefined(value), namespace);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function addIsoDuration(start: string, duration: string): string {
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/.exec(duration);
  lifecycleInvariant(match, "RETENTION_DURATION_UNSUPPORTED", `Unsupported ISO duration ${duration}.`);
  const date = new Date(start);
  lifecycleInvariant(!Number.isNaN(date.getTime()), "RETENTION_TIMESTAMP_INVALID", `Invalid timestamp ${start}.`);
  const years = Number(match[1] ?? 0);
  const months = Number(match[2] ?? 0);
  const days = Number(match[3] ?? 0);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  date.setUTCMonth(date.getUTCMonth() + months);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function retentionClassHash(input: Omit<RetentionClass, "policyTupleHash">): string {
  return lifecycleHash(input, "phase9.442.retention-class.policy-tuple");
}

function retentionDecisionHash(input: Omit<RetentionDecision, "decisionHash">): string {
  return lifecycleHash(input, "phase9.442.retention-decision");
}

function assessmentHash(input: Omit<DispositionEligibilityAssessment, "assessmentHash">): string {
  return lifecycleHash(input, "phase9.442.disposition-assessment");
}

function auditRecord(input: {
  readonly actor: RetentionLifecycleActorContext;
  readonly actionType: string;
  readonly targetRef: string;
  readonly result: RetentionLifecycleMutationResult | RetentionDispositionResult;
  readonly blockerRefs: readonly string[];
  readonly graphHash: string;
}): RetentionLifecycleAuditRecord {
  const commandHash = lifecycleHash(
    {
      tenantId: input.actor.tenantId,
      actorRef: input.actor.actorRef,
      purposeOfUseRef: input.actor.purposeOfUseRef,
      reasonRef: input.actor.reasonRef,
      actionType: input.actionType,
      targetRef: input.targetRef,
      result: input.result,
      blockerRefs: input.blockerRefs,
      graphHash: input.graphHash,
      recordedAt: input.actor.generatedAt,
    },
    "phase9.442.lifecycle-audit.command",
  );
  return {
    retentionLifecycleAuditRecordId: `rlar_442_${commandHash.slice(0, 16)}`,
    tenantId: input.actor.tenantId,
    actorRef: input.actor.actorRef,
    purposeOfUseRef: input.actor.purposeOfUseRef,
    reasonRef: input.actor.reasonRef,
    actionType: input.actionType,
    targetRef: input.targetRef,
    result: input.result,
    blockerRefs: sortedUnique(input.blockerRefs),
    graphHash: input.graphHash,
    commandHash,
    recordedAt: input.actor.generatedAt,
  };
}

function requireRecordsGovernanceActor(actor: RetentionLifecycleActorContext, action: string): void {
  lifecycleInvariant(
    actor.roleRefs.includes("records_governance") || actor.roleRefs.includes("legal_hold_manager"),
    "RETENTION_ACTOR_ROLE_DENIED",
    `${action} requires records_governance or legal_hold_manager role.`,
  );
  lifecycleInvariant(
    actor.purposeOfUseRef.startsWith("records:"),
    "RETENTION_PURPOSE_OF_USE_DENIED",
    `${action} requires a records purpose-of-use.`,
  );
  lifecycleInvariant(actor.reasonRef.length > 0, "RETENTION_REASON_REQUIRED", `${action} requires a reason ref.`);
}

function scopeMatchesTenant(scopeRef: string, tenantId: string): boolean {
  return scopeRef.includes(tenantId);
}

function governanceBlockReasons(blockers: readonly string[]): readonly (typeof dispositionBlockReasonValues)[number][] {
  const mapped = new Set<(typeof dispositionBlockReasonValues)[number]>();
  for (const blocker of blockers) {
    if (blocker.startsWith("freeze:")) mapped.add("active_retention_freeze");
    else if (blocker.startsWith("legal-hold:")) mapped.add("active_legal_hold");
    else if (blocker.startsWith("dependency:cycle")) mapped.add("dependency_cycle");
    else if (blocker.startsWith("dependency:")) mapped.add("active_dependency");
    else if (blocker.startsWith("graph:missing")) mapped.add("graph_missing");
    else if (blocker.startsWith("graph:")) mapped.add("graph_incomplete");
    else if (blocker.startsWith("criticality:worm") || blocker.startsWith("criticality:hash")) mapped.add("worm_or_hash_chained");
    else if (blocker.startsWith("criticality:replay")) mapped.add("replay_critical_dependency");
    else if (blocker.startsWith("source:raw-storage") || blocker.startsWith("source:operator-csv")) mapped.add("missing_explicit_assessment");
    else if (blocker.startsWith("tenant:")) mapped.add("cross_tenant_reference");
  }
  return [...mapped].sort();
}

function effectiveEligibilityState(result: RetentionDispositionResult): DispositionEligibilityState {
  if (result === "eligible") {
    return "delete_allowed";
  }
  if (result === "archive_only") {
    return "archive_only";
  }
  return "blocked";
}

export class Phase9RetentionLifecycleEngine {
  createRetentionClass(input: Omit<RetentionClass, "policyTupleHash">): RetentionClass {
    return {
      ...input,
      policyTupleHash: retentionClassHash(input),
    };
  }

  supersedeRetentionClass(input: {
    readonly currentClass: RetentionClass;
    readonly replacement: Omit<RetentionClass, "policyTupleHash">;
  }): { readonly supersededClass: RetentionClass; readonly replacementClass: RetentionClass } {
    return {
      supersededClass: {
        ...input.currentClass,
        classState: "superseded",
        policyTupleHash: retentionClassHash({ ...input.currentClass, classState: "superseded" }),
      },
      replacementClass: this.createRetentionClass(input.replacement),
    };
  }

  bindLifecycleForArtifact(input: {
    readonly actor: RetentionLifecycleActorContext;
    readonly artifactRef: string;
    readonly artifactVersionRef: string;
    readonly artifactClassRef: string;
    readonly retentionClass?: RetentionClass;
    readonly graphCriticality: RetentionGraphCriticality;
    readonly activeFreezeRefs?: readonly string[];
    readonly activeLegalHoldRefs?: readonly string[];
  }): LifecycleBindingResult {
    requireRecordsGovernanceActor(input.actor, "bindLifecycleForArtifact");
    if (!input.retentionClass || input.retentionClass.classState !== "active") {
      const blockerRefs = ["retention:class-missing-or-inactive"];
      const audit = auditRecord({
        actor: input.actor,
        actionType: "retention.bind_lifecycle",
        targetRef: input.artifactRef,
        result: "quarantined",
        blockerRefs,
        graphHash: "graph:unbound",
      });
      return { result: "quarantined", auditRecords: [audit], blockerRefs };
    }
    const classificationHash = lifecycleHash(
      {
        artifactRef: input.artifactRef,
        artifactVersionRef: input.artifactVersionRef,
        artifactClassRef: input.artifactClassRef,
        retentionClassRef: input.retentionClass.retentionClassId,
        graphCriticality: input.graphCriticality,
        createdAt: input.actor.generatedAt,
      },
      "phase9.442.retention-binding.classification",
    );
    const binding: RetentionLifecycleBinding = {
      retentionLifecycleBindingId: `rlb_442_${classificationHash.slice(0, 16)}`,
      artifactRef: input.artifactRef,
      artifactVersionRef: input.artifactVersionRef,
      artifactClassRef: input.artifactClassRef,
      retentionClassRef: input.retentionClass.retentionClassId,
      disposalMode: input.retentionClass.disposalMode,
      immutabilityMode: input.retentionClass.immutabilityMode,
      dependencyCheckPolicyRef: input.retentionClass.dependencyCheckPolicyRef,
      minimumRetentionOverrideRef: "override:none",
      activeFreezeRefs: sortedUnique(input.activeFreezeRefs ?? []),
      activeLegalHoldRefs: sortedUnique(input.activeLegalHoldRefs ?? []),
      graphCriticality: input.graphCriticality,
      lifecycleState: "active",
      classificationHash,
      createdAt: input.actor.generatedAt,
    };
    const validation = validateRetentionClassificationBoundAtCreation(binding);
    if (!validation.valid) {
      const audit = auditRecord({
        actor: input.actor,
        actionType: "retention.bind_lifecycle",
        targetRef: input.artifactRef,
        result: "blocked",
        blockerRefs: validation.errors,
        graphHash: "graph:classification",
      });
      return { result: "blocked", auditRecords: [audit], blockerRefs: validation.errors };
    }
    const initialDecision = this.deriveRetentionDecision({
      binding,
      retentionClass: input.retentionClass,
      graphSnapshotRef: "graph-snapshot:pending",
      graphVerdictRef: "graph-verdict:pending",
      graphHash: "graph:pending",
      graphEdgeRefs: [],
      decisionDate: input.actor.generatedAt,
      effectiveDisposition: "preserve",
    });
    const audit = auditRecord({
      actor: input.actor,
      actionType: "retention.bind_lifecycle",
      targetRef: input.artifactRef,
      result: "bound",
      blockerRefs: [],
      graphHash: initialDecision.decisionHash,
    });
    return { result: "bound", binding, initialDecision, auditRecords: [audit], blockerRefs: [] };
  }

  getLifecycleBinding(input: {
    readonly artifactRef: string;
    readonly bindings: readonly RetentionLifecycleBinding[];
  }): RetentionLifecycleBinding {
    const binding = input.bindings.find(
      (candidate) => candidate.artifactRef === input.artifactRef && candidate.lifecycleState === "active",
    );
    lifecycleInvariant(binding, "RETENTION_LIFECYCLE_BINDING_NOT_FOUND", "Active lifecycle binding not found.");
    return binding;
  }

  deriveRetentionDecision(input: {
    readonly binding: RetentionLifecycleBinding;
    readonly retentionClass: RetentionClass;
    readonly graphSnapshotRef: string;
    readonly graphVerdictRef: string;
    readonly graphHash: string;
    readonly graphEdgeRefs: readonly string[];
    readonly decisionDate: string;
    readonly dispositionEligibilityAssessmentRef?: string;
    readonly effectiveDisposition?: EffectiveDisposition;
    readonly supersedesDecisionRef?: string;
  }): RetentionDecision {
    const archiveAfter = addIsoDuration(input.binding.createdAt, input.retentionClass.reviewPoint);
    const deleteAfter = addIsoDuration(input.binding.createdAt, input.retentionClass.minimumRetention);
    const base: Omit<RetentionDecision, "decisionHash"> = {
      retentionDecisionId: `rd_442_${lifecycleHash(
        {
          artifactRef: input.binding.artifactRef,
          retentionClassRef: input.retentionClass.retentionClassId,
          decisionDate: input.decisionDate,
          dispositionEligibilityAssessmentRef: input.dispositionEligibilityAssessmentRef ?? "",
        },
        "phase9.442.retention-decision.id",
      ).slice(0, 16)}`,
      artifactRef: input.binding.artifactRef,
      retentionLifecycleBindingRef: input.binding.retentionLifecycleBindingId,
      retentionClassRef: input.retentionClass.retentionClassId,
      decisionDate: input.decisionDate,
      deleteAfter,
      archiveAfter,
      activeFreezeRefs: input.binding.activeFreezeRefs,
      activeLegalHoldRefs: input.binding.activeLegalHoldRefs,
      assuranceEvidenceGraphSnapshotRef: input.graphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: input.graphVerdictRef,
      graphEdgeRefs: sortedUnique(input.graphEdgeRefs),
      dispositionEligibilityAssessmentRef: input.dispositionEligibilityAssessmentRef,
      effectiveDisposition: input.effectiveDisposition ?? "preserve",
      supersedesDecisionRef: input.supersedesDecisionRef,
    };
    return { ...base, decisionHash: retentionDecisionHash(base) };
  }

  placeLegalHold(input: {
    readonly actor: RetentionLifecycleActorContext;
    readonly scopeType: LegalHoldScopeType;
    readonly scopeRef: string;
    readonly scopeEntityRefs: readonly string[];
    readonly artifactRefs: readonly string[];
    readonly dependencyLinkRefs: readonly string[];
    readonly reasonCode: string;
    readonly originType: LegalHoldOriginType;
    readonly reviewDate: string;
    readonly existingFreezeRef?: string;
  }): LegalHoldMutationResult {
    requireRecordsGovernanceActor(input.actor, "placeLegalHold");
    lifecycleInvariant(
      scopeMatchesTenant(input.scopeRef, input.actor.tenantId),
      "LEGAL_HOLD_SCOPE_TENANT_MISMATCH",
      "Legal hold scope must remain in tenant.",
    );
    const scopeHash = lifecycleHash(
      {
        scopeRef: input.scopeRef,
        scopeType: input.scopeType,
        scopeEntityRefs: sortedUnique(input.scopeEntityRefs),
        artifactRefs: sortedUnique(input.artifactRefs),
        dependencyLinkRefs: sortedUnique(input.dependencyLinkRefs),
        reasonCode: input.reasonCode,
        placedAt: input.actor.generatedAt,
      },
      "phase9.442.legal-hold.scope",
    );
    const holdId = `lhr_442_${scopeHash.slice(0, 16)}`;
    const freezeRef = input.existingFreezeRef ?? `freeze_442_${scopeHash.slice(0, 12)}`;
    const manifest: LegalHoldScopeManifest = {
      legalHoldScopeManifestId: `lhsm_442_${scopeHash.slice(0, 16)}`,
      legalHoldRecordRef: holdId,
      scopeType: input.scopeType,
      scopeEntityRefs: sortedUnique(input.scopeEntityRefs),
      artifactRefs: sortedUnique(input.artifactRefs),
      freezeRefs: [freezeRef],
      dependencyLinkRefs: sortedUnique(input.dependencyLinkRefs),
      scopeHash,
      capturedAt: input.actor.generatedAt,
    };
    const holdBase = {
      legalHoldRecordId: holdId,
      scopeRef: input.scopeRef,
      scopeManifestRef: manifest.legalHoldScopeManifestId,
      scopeHash,
      reasonCode: input.reasonCode,
      originType: input.originType,
      placedBy: input.actor.actorRef,
      placedAt: input.actor.generatedAt,
      reviewDate: input.reviewDate,
      holdState: "active" as const,
      freezeRef,
    };
    const legalHold: LegalHoldRecord = {
      ...holdBase,
      holdHash: lifecycleHash(holdBase, "phase9.442.legal-hold.record"),
    };
    const audit = auditRecord({
      actor: input.actor,
      actionType: "retention.place_legal_hold",
      targetRef: legalHold.legalHoldRecordId,
      result: "created",
      blockerRefs: [],
      graphHash: legalHold.holdHash,
    });
    return { result: "created", legalHold, scopeManifest: manifest, auditRecords: [audit], blockerRefs: [] };
  }

  releaseLegalHold(input: {
    readonly actor: RetentionLifecycleActorContext;
    readonly legalHold: LegalHoldRecord;
    readonly scopeManifest: LegalHoldScopeManifest;
    readonly releaseReason: string;
  }): LegalHoldMutationResult {
    requireRecordsGovernanceActor(input.actor, "releaseLegalHold");
    const releasedBase = {
      ...input.legalHold,
      legalHoldRecordId: `${input.legalHold.legalHoldRecordId}_released`,
      holdState: "released" as const,
      supersedesHoldRef: input.legalHold.legalHoldRecordId,
      releasedAt: input.actor.generatedAt,
      releaseReason: input.releaseReason,
    };
    const legalHold: LegalHoldRecord = {
      ...releasedBase,
      holdHash: lifecycleHash(releasedBase, "phase9.442.legal-hold.release"),
    };
    const scopeManifest: LegalHoldScopeManifest = {
      ...input.scopeManifest,
      legalHoldScopeManifestId: `${input.scopeManifest.legalHoldScopeManifestId}_released`,
      legalHoldRecordRef: legalHold.legalHoldRecordId,
      capturedAt: input.actor.generatedAt,
    };
    const audit = auditRecord({
      actor: input.actor,
      actionType: "retention.release_legal_hold",
      targetRef: legalHold.legalHoldRecordId,
      result: "released",
      blockerRefs: [input.legalHold.legalHoldRecordId],
      graphHash: legalHold.holdHash,
    });
    return { result: "released", legalHold, scopeManifest, auditRecords: [audit], blockerRefs: [] };
  }

  createDependencyLink(input: {
    readonly actor: RetentionLifecycleActorContext;
    readonly artifactRef: string;
    readonly dependentArtifactRef: string;
    readonly governingScopeRef: string;
    readonly dependencyType: string;
    readonly dependencyStrength: ArtifactDependencyStrength;
    readonly sourceGraphEdgeRef: string;
    readonly activeState?: string;
  }): DependencyLinkMutationResult {
    requireRecordsGovernanceActor(input.actor, "createDependencyLink");
    lifecycleInvariant(
      scopeMatchesTenant(input.governingScopeRef, input.actor.tenantId),
      "CROSS_TENANT_DEPENDENCY_DENIED",
      "Dependency link governing scope must match tenant.",
    );
    const linkHash = lifecycleHash(
      {
        artifactRef: input.artifactRef,
        dependentArtifactRef: input.dependentArtifactRef,
        governingScopeRef: input.governingScopeRef,
        dependencyType: input.dependencyType,
        dependencyStrength: input.dependencyStrength,
        sourceGraphEdgeRef: input.sourceGraphEdgeRef,
      },
      "phase9.442.artifact-dependency.link",
    );
    const dependencyLink: ArtifactDependencyLink = {
      dependencyLinkId: `adl_442_${linkHash.slice(0, 16)}`,
      artifactRef: input.artifactRef,
      dependentArtifactRef: input.dependentArtifactRef,
      governingScopeRef: input.governingScopeRef,
      dependencyType: input.dependencyType,
      dependencyStrength: input.dependencyStrength,
      activeState: input.activeState ?? "active",
      sourceGraphEdgeRef: input.sourceGraphEdgeRef,
      linkHash,
    };
    const audit = auditRecord({
      actor: input.actor,
      actionType: "retention.create_dependency_link",
      targetRef: dependencyLink.dependencyLinkId,
      result: "created",
      blockerRefs: [],
      graphHash: dependencyLink.linkHash,
    });
    return { result: "created", dependencyLink, auditRecords: [audit], blockerRefs: [] };
  }

  deriveDependencyLinksFromGraph(input: {
    readonly actor: RetentionLifecycleActorContext;
    readonly graphEdges: readonly AssuranceEvidenceGraphEdge[];
    readonly governingScopeRef: string;
  }): readonly ArtifactDependencyLink[] {
    return input.graphEdges
      .filter((edge) =>
        [
          "artifact_satisfies_control",
          "continuity_section_supports_pack",
          "gap_drives_capa",
          "retention_preserves_artifact",
          "export_materializes_artifact",
        ].includes(edge.edgeType),
      )
      .map((edge) =>
        this.createDependencyLink({
          actor: input.actor,
          artifactRef: edge.fromRef,
          dependentArtifactRef: edge.toRef,
          governingScopeRef: input.governingScopeRef,
          dependencyType: edge.edgeType,
          dependencyStrength: edge.edgeType === "artifact_satisfies_control" ? "disposal_blocking" : "replay_required",
          sourceGraphEdgeRef: edge.assuranceEvidenceGraphEdgeId,
        }).dependencyLink,
      )
      .sort((left, right) => left.dependencyLinkId.localeCompare(right.dependencyLinkId));
  }

  runDispositionEligibilityAssessment(input: {
    readonly actor: RetentionLifecycleActorContext;
    readonly binding: RetentionLifecycleBinding;
    readonly retentionClass: RetentionClass;
    readonly decision: RetentionDecision;
    readonly requestedAction: DispositionActionType;
    readonly candidateSource: DispositionCandidateSource;
    readonly dependencyLinks: readonly ArtifactDependencyLink[];
    readonly legalHolds: readonly LegalHoldRecord[];
    readonly legalHoldScopeManifests: readonly LegalHoldScopeManifest[];
    readonly graphSnapshotRef?: string;
    readonly graphVerdictRef?: string;
    readonly graphVerdictState?: "complete" | "partial" | "stale" | "blocked";
    readonly graphHash?: string;
    readonly assessedAt: string;
  }): DispositionEligibilityAssessmentRecord {
    requireRecordsGovernanceActor(input.actor, "runDispositionEligibilityAssessment");
    const blockers = new Set<string>();
    if (input.candidateSource === "raw_storage_scan") {
      blockers.add("source:raw-storage-scan-denied");
    }
    if (input.candidateSource === "operator_csv") {
      blockers.add("source:operator-csv-denied");
    }
    const graphSnapshotRef = input.graphSnapshotRef ?? input.decision.assuranceEvidenceGraphSnapshotRef;
    const graphVerdictRef = input.graphVerdictRef ?? input.decision.assuranceGraphCompletenessVerdictRef;
    const graphHash = input.graphHash ?? input.binding.classificationHash;
    if (!graphSnapshotRef || !graphVerdictRef || !graphHash) {
      blockers.add("graph:missing");
    }
    if (!input.graphVerdictState) {
      blockers.add("graph:missing-verdict-state");
    } else if (input.graphVerdictState !== "complete") {
      blockers.add(`graph:verdict-${input.graphVerdictState}`);
    }
    if (input.binding.lifecycleState !== "active") {
      blockers.add(`lifecycle:${input.binding.lifecycleState}`);
    }
    if (input.retentionClass.classState !== "active") {
      blockers.add(`policy:retention-class-${input.retentionClass.classState}`);
    }
    for (const link of input.dependencyLinks) {
      if (!scopeMatchesTenant(link.governingScopeRef, input.actor.tenantId)) {
        blockers.add(`tenant:cross-scope-dependency:${link.dependencyLinkId}`);
      }
    }
    const closure = resolveTransitiveArtifactDependencies(input.binding.artifactRef, input.dependencyLinks);
    if (closure.cycleDetected) {
      blockers.add("dependency:cycle");
    }
    const dependencyTypeByRef = new Map(input.dependencyLinks.map((link) => [link.dependencyLinkId, link.dependencyType]));
    for (const linkRef of closure.activeDependencyLinkRefs) {
      const dependencyType = dependencyTypeByRef.get(linkRef) ?? "unknown";
      blockers.add(`dependency:active:${dependencyType}:${linkRef}`);
    }
    const activeFreezeRefs = sortedUnique([...input.binding.activeFreezeRefs, ...input.decision.activeFreezeRefs]);
    for (const freezeRef of activeFreezeRefs) {
      blockers.add(`freeze:active:${freezeRef}`);
    }
    const manifestByHoldRef = new Map(input.legalHoldScopeManifests.map((manifest) => [manifest.legalHoldRecordRef, manifest] as const));
    const activeLegalHoldRefs = new Set([...input.binding.activeLegalHoldRefs, ...input.decision.activeLegalHoldRefs]);
    const dependencyArtifactRefs = new Set(closure.dependencyArtifactRefs);
    for (const hold of input.legalHolds) {
      if (hold.holdState !== "active") {
        continue;
      }
      const manifest = manifestByHoldRef.get(hold.legalHoldRecordId);
      if (
        !manifest ||
        manifest.artifactRefs.includes(input.binding.artifactRef) ||
        manifest.artifactRefs.some((artifactRef) => dependencyArtifactRefs.has(artifactRef))
      ) {
        activeLegalHoldRefs.add(hold.legalHoldRecordId);
        blockers.add(`legal-hold:active:${hold.legalHoldRecordId}`);
      }
    }
    const nowMs = Date.parse(input.assessedAt);
    const deleteAfterMs = input.decision.deleteAfter ? Date.parse(input.decision.deleteAfter) : Number.POSITIVE_INFINITY;
    const archiveAfterMs = input.decision.archiveAfter ? Date.parse(input.decision.archiveAfter) : Number.POSITIVE_INFINITY;
    if (input.requestedAction === "delete" && nowMs < deleteAfterMs) {
      blockers.add(`retention:not_due:${input.decision.deleteAfter ?? "delete-after-missing"}`);
    }
    if (input.requestedAction === "archive" && nowMs < archiveAfterMs) {
      blockers.add(`retention:archive-not-due:${input.decision.archiveAfter ?? "archive-after-missing"}`);
    }
    if (input.requestedAction === "delete") {
      if (input.binding.graphCriticality === "worm") {
        blockers.add("criticality:worm-never-delete");
      }
      if (input.binding.graphCriticality === "hash_chained") {
        blockers.add("criticality:hash-chained-never-delete");
      }
      if (input.binding.graphCriticality === "replay_critical" && closure.activeDependencyLinkRefs.length > 0) {
        blockers.add("criticality:replay-critical-active-dependency");
      }
      if (input.binding.disposalMode === "archive_only" || input.retentionClass.disposalMode === "archive_only") {
        blockers.add("policy:archive-only");
      }
    }

    let result: RetentionDispositionResult;
    const blockerList = sortedUnique([...blockers]);
    const hasOnlyRetentionTimingBlockers =
      blockerList.length > 0 && blockerList.every((blocker) => blocker.startsWith("retention:"));
    if (blockerList.some((blocker) => blocker.startsWith("graph:") || blocker.startsWith("tenant:") || blocker.startsWith("source:"))) {
      result = "blocked";
    } else if (hasOnlyRetentionTimingBlockers) {
      result = "not_due";
    } else if (blockerList.length > 0) {
      result = "blocked";
    } else if (
      input.requestedAction === "archive" ||
      input.binding.graphCriticality === "replay_critical" ||
      input.binding.disposalMode === "archive_only"
    ) {
      result = "archive_only";
    } else {
      result = "eligible";
    }
    const assessmentBase: Omit<DispositionEligibilityAssessment, "assessmentHash"> = {
      dispositionEligibilityAssessmentId: `dea_442_${lifecycleHash(
        {
          artifactRef: input.binding.artifactRef,
          decisionRef: input.decision.retentionDecisionId,
          requestedAction: input.requestedAction,
          candidateSource: input.candidateSource,
          assessedAt: input.assessedAt,
        },
        "phase9.442.disposition-assessment.id",
      ).slice(0, 16)}`,
      artifactRef: input.binding.artifactRef,
      retentionLifecycleBindingRef: input.binding.retentionLifecycleBindingId,
      retentionDecisionRef: input.decision.retentionDecisionId,
      activeFreezeRefs,
      activeLegalHoldRefs: sortedUnique([...activeLegalHoldRefs]),
      activeDependencyLinkRefs: closure.activeDependencyLinkRefs,
      assuranceEvidenceGraphSnapshotRef: graphSnapshotRef ?? "",
      assuranceGraphCompletenessVerdictRef: graphVerdictRef ?? "",
      graphHash: graphHash ?? "",
      eligibilityState: effectiveEligibilityState(result),
      blockingReasonRefs: governanceBlockReasons(blockerList),
      assessedAt: input.assessedAt,
    };
    const assessment: DispositionEligibilityAssessment = {
      ...assessmentBase,
      assessmentHash: assessmentHash(assessmentBase),
    };
    const audit = auditRecord({
      actor: input.actor,
      actionType: "retention.assess_disposition",
      targetRef: input.binding.artifactRef,
      result,
      blockerRefs: blockerList,
      graphHash: graphHash ?? "graph:missing",
    });
    return {
      dispositionEligibilityAssessment: assessment,
      result,
      artifactRef: input.binding.artifactRef,
      requestedAction: input.requestedAction,
      candidateSource: input.candidateSource,
      blockerRefs: blockerList,
      dependencyArtifactRefs: closure.dependencyArtifactRefs,
      activeDependencyLinkRefs: closure.activeDependencyLinkRefs,
      activeFreezeRefs,
      activeLegalHoldRefs: sortedUnique([...activeLegalHoldRefs]),
      policyRefs: sortedUnique([
        input.retentionClass.retentionClassId,
        input.retentionClass.sourcePolicyRef,
        input.retentionClass.dependencyCheckPolicyRef,
        input.retentionClass.legalHoldEscalationPolicyRef,
      ]),
      graphRefs: sortedUnique([graphSnapshotRef ?? "", graphVerdictRef ?? "", graphHash ?? ""]),
      assessorActionRef: audit.retentionLifecycleAuditRecordId,
      nextReviewDate:
        result === "not_due"
          ? input.requestedAction === "delete"
            ? input.decision.deleteAfter ?? input.retentionClass.reviewPoint
            : input.decision.archiveAfter ?? input.retentionClass.reviewPoint
          : addIsoDuration(input.assessedAt, input.retentionClass.reviewPoint),
      decisionHash: lifecycleHash(
        {
          assessment,
          result,
          blockerRefs: blockerList,
          dependencyRefs: closure.activeDependencyLinkRefs,
        },
        "phase9.442.disposition-assessment.decision",
      ),
      auditRecords: [audit],
    };
  }

  listBlockers(assessment: DispositionEligibilityAssessmentRecord): readonly string[] {
    return assessment.blockerRefs;
  }

  explainWhyArtifactCannotBeDisposed(assessment: DispositionEligibilityAssessmentRecord): readonly string[] {
    if (assessment.blockerRefs.length === 0) {
      return ["disposition:allowed-by-current-assessment"];
    }
    return assessment.blockerRefs.map((blocker) => `blocked:${blocker}`);
  }

  emitLifecycleEvidenceForAssuranceGraph(input: {
    readonly binding: RetentionLifecycleBinding;
    readonly decision: RetentionDecision;
    readonly assessment: DispositionEligibilityAssessmentRecord;
    readonly emittedAt: string;
  }): RetentionLifecycleEvidenceRecord {
    const lifecycleEvidenceHash = lifecycleHash(
      {
        bindingRef: input.binding.retentionLifecycleBindingId,
        decisionRef: input.decision.retentionDecisionId,
        assessmentRef: input.assessment.dispositionEligibilityAssessment.dispositionEligibilityAssessmentId,
        graphHash: input.assessment.dispositionEligibilityAssessment.graphHash,
        emittedAt: input.emittedAt,
      },
      "phase9.442.lifecycle-evidence",
    );
    return {
      lifecycleEvidenceRecordId: `rler_442_${lifecycleEvidenceHash.slice(0, 16)}`,
      artifactRef: input.binding.artifactRef,
      bindingRef: input.binding.retentionLifecycleBindingId,
      decisionRef: input.decision.retentionDecisionId,
      assessmentRef: input.assessment.dispositionEligibilityAssessment.dispositionEligibilityAssessmentId,
      assuranceEvidenceGraphSnapshotRef: input.assessment.dispositionEligibilityAssessment.assuranceEvidenceGraphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: input.assessment.dispositionEligibilityAssessment.assuranceGraphCompletenessVerdictRef,
      graphHash: input.assessment.dispositionEligibilityAssessment.graphHash,
      lifecycleEvidenceHash,
      emittedAt: input.emittedAt,
    };
  }

  listWithCursor<T>(rows: readonly T[], cursor?: string, limit = 25): RetentionLifecyclePage<T> {
    const offset = cursor?.startsWith("cursor:") ? Number(cursor.slice("cursor:".length)) : 0;
    const pageRows = rows.slice(offset, offset + limit);
    const nextOffset = offset + pageRows.length;
    return {
      rows: pageRows,
      nextCursor: nextOffset < rows.length ? `cursor:${nextOffset}` : undefined,
    };
  }
}

function activeClass(
  engine: Phase9RetentionLifecycleEngine,
  input: Omit<RetentionClass, "policyTupleHash" | "classState">,
): RetentionClass {
  return engine.createRetentionClass({ ...input, classState: "active" });
}

function requireBinding(result: LifecycleBindingResult): RetentionLifecycleBinding {
  lifecycleInvariant(result.binding, "FIXTURE_BINDING_MISSING", "Fixture expected a lifecycle binding.");
  return result.binding;
}

export function createPhase9RetentionLifecycleEngineFixture(): RetentionLifecycleEngineFixture {
  const generatedAt = "2026-04-27T12:00:00.000Z";
  const assessmentAt = "2026-04-27T12:30:00.000Z";
  const graphHash = lifecycleHash({ graph: "442" }, "phase9.442.fixture.graph");
  const graphSnapshotRef = "aegs_442_current";
  const graphVerdictRef = "agcv_442_complete";
  const engine = new Phase9RetentionLifecycleEngine();
  const actor: RetentionLifecycleActorContext = {
    tenantId: "tenant:demo-gp",
    actorRef: "actor:records-governance-442",
    roleRefs: ["records_governance", "legal_hold_manager"],
    purposeOfUseRef: "records:governance",
    reasonRef: "reason:442:lifecycle",
    generatedAt,
  };
  const ordinaryClass = activeClass(engine, {
    retentionClassId: "rc_442_request_snapshot",
    recordType: "request_snapshot",
    basisRef: "nhs-records-management-code",
    minimumRetention: "P30D",
    reviewPoint: "P14D",
    disposalMode: "delete_after_retention",
    immutabilityMode: "mutable_hash_preserved",
    dependencyCheckPolicyRef: "dependency-policy:transitive-assurance-graph",
    sourcePolicyRef: "policy:records-code-html-current",
    freezeEscalationPolicyRef: "policy:freeze-preservation-first",
    legalHoldEscalationPolicyRef: "policy:legal-hold-preservation-first",
    derivativeRetentionPolicyRef: "policy:derivative-artifacts-follow-source",
  });
  const longClass = activeClass(engine, {
    ...ordinaryClass,
    retentionClassId: "rc_442_request_snapshot_90d",
    minimumRetention: "P90D",
    reviewPoint: "P30D",
  });
  const archiveOnlyClass = activeClass(engine, {
    retentionClassId: "rc_442_assurance_pack_archive_only",
    recordType: "assurance_pack",
    basisRef: "nhs-records-management-code",
    minimumRetention: "P8Y",
    reviewPoint: "P1Y",
    disposalMode: "archive_only",
    immutabilityMode: "hash_preserved",
    dependencyCheckPolicyRef: "dependency-policy:assurance-pack",
    sourcePolicyRef: "policy:records-code-html-current",
    freezeEscalationPolicyRef: "policy:freeze-preservation-first",
    legalHoldEscalationPolicyRef: "policy:legal-hold-preservation-first",
    derivativeRetentionPolicyRef: "policy:derived-pack-artifacts",
  });
  const wormClass = activeClass(engine, {
    retentionClassId: "rc_442_audit_worm",
    recordType: "audit_entry",
    basisRef: "worm-audit-ledger",
    minimumRetention: "P8Y",
    reviewPoint: "P1Y",
    disposalMode: "archive_only",
    immutabilityMode: "worm_hash_chained",
    dependencyCheckPolicyRef: "dependency-policy:worm-never-delete",
    sourcePolicyRef: "policy:worm-audit-ledger",
    freezeEscalationPolicyRef: "policy:freeze-preservation-first",
    legalHoldEscalationPolicyRef: "policy:legal-hold-preservation-first",
    derivativeRetentionPolicyRef: "policy:immutable-derivatives",
  });
  const replayClass = activeClass(engine, {
    retentionClassId: "rc_442_replay_critical_model_trace",
    recordType: "model_trace",
    basisRef: "replay-critical-assistive-evidence",
    minimumRetention: "P8Y",
    reviewPoint: "P1Y",
    disposalMode: "archive_then_review",
    immutabilityMode: "replay_critical_hash_preserved",
    dependencyCheckPolicyRef: "dependency-policy:replay-critical",
    sourcePolicyRef: "policy:assistive-replay-evidence",
    freezeEscalationPolicyRef: "policy:freeze-preservation-first",
    legalHoldEscalationPolicyRef: "policy:legal-hold-preservation-first",
    derivativeRetentionPolicyRef: "policy:replay-derivatives-follow-source",
  });
  const oldActor = { ...actor, generatedAt: "2026-01-01T00:00:00.000Z" };
  const artifactCreationResult = engine.bindLifecycleForArtifact({
    actor: oldActor,
    artifactRef: "artifact:request-snapshot:442",
    artifactVersionRef: "artifact-version:request-snapshot:442:v1",
    artifactClassRef: "class:request_snapshot",
    retentionClass: ordinaryClass,
    graphCriticality: "ordinary",
  });
  const binding = requireBinding(artifactCreationResult);
  const missingRetentionClassResult = engine.bindLifecycleForArtifact({
    actor,
    artifactRef: "artifact:orphan:442",
    artifactVersionRef: "artifact-version:orphan:442:v1",
    artifactClassRef: "class:request_snapshot",
    graphCriticality: "ordinary",
  });
  const baselineDecision = engine.deriveRetentionDecision({
    binding,
    retentionClass: ordinaryClass,
    graphSnapshotRef,
    graphVerdictRef,
    graphHash,
    graphEdgeRefs: ["age_442_request"],
    decisionDate: assessmentAt,
    effectiveDisposition: "delete_pending",
  });
  const deterministicDecisionReplay = engine.deriveRetentionDecision({
    binding,
    retentionClass: ordinaryClass,
    graphSnapshotRef,
    graphVerdictRef,
    graphHash,
    graphEdgeRefs: ["age_442_request"],
    decisionDate: assessmentAt,
    effectiveDisposition: "delete_pending",
  });
  const notDueBinding = requireBinding(
    engine.bindLifecycleForArtifact({
      actor: { ...actor, generatedAt: "2026-04-01T00:00:00.000Z" },
      artifactRef: "artifact:not-due:442",
      artifactVersionRef: "artifact-version:not-due:442:v1",
      artifactClassRef: "class:request_snapshot",
      retentionClass: longClass,
      graphCriticality: "ordinary",
    }),
  );
  const notDueDecision = engine.deriveRetentionDecision({
    binding: notDueBinding,
    retentionClass: longClass,
    graphSnapshotRef,
    graphVerdictRef,
    graphHash,
    graphEdgeRefs: ["age_442_not_due"],
    decisionDate: assessmentAt,
    effectiveDisposition: "preserve",
  });
  const notDueAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding: notDueBinding,
    retentionClass: longClass,
    decision: notDueDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [],
    legalHolds: [],
    legalHoldScopeManifests: [],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const legalHoldResult = engine.placeLegalHold({
    actor,
    scopeType: "artifact",
    scopeRef: "scope:tenant:demo-gp:artifact:442",
    scopeEntityRefs: ["request:442"],
    artifactRefs: [binding.artifactRef],
    dependencyLinkRefs: [],
    reasonCode: "governance_review",
    originType: "governance",
    reviewDate: "2026-05-27",
  });
  const legalHoldBlockedAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding,
    retentionClass: ordinaryClass,
    decision: baselineDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [],
    legalHolds: [legalHoldResult.legalHold],
    legalHoldScopeManifests: [legalHoldResult.scopeManifest],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const releasedLegalHoldResult = engine.releaseLegalHold({
    actor,
    legalHold: legalHoldResult.legalHold,
    scopeManifest: legalHoldResult.scopeManifest,
    releaseReason: "governance_review_complete",
  });
  const reassessmentAfterRelease = engine.runDispositionEligibilityAssessment({
    actor,
    binding,
    retentionClass: ordinaryClass,
    decision: baselineDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [],
    legalHolds: [releasedLegalHoldResult.legalHold],
    legalHoldScopeManifests: [releasedLegalHoldResult.scopeManifest],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const packFixture = createPhase9AssurancePackFactoryFixture();
  const capaFixture = createPhase9CapaAttestationWorkflowFixture();
  const packDependency = engine.createDependencyLink({
    actor,
    artifactRef: binding.artifactRef,
    dependentArtifactRef: packFixture.baselineResult.pack.generatedArtifactRef,
    governingScopeRef: "scope:tenant:demo-gp:pack:442",
    dependencyType: "assurance_pack_input",
    dependencyStrength: "disposal_blocking",
    sourceGraphEdgeRef: "age_442_request_pack",
  }).dependencyLink;
  const capaDependency = engine.createDependencyLink({
    actor,
    artifactRef: packFixture.baselineResult.pack.generatedArtifactRef,
    dependentArtifactRef: capaFixture.capaCompletedResult.capaAction.capaActionId,
    governingScopeRef: "scope:tenant:demo-gp:capa:442",
    dependencyType: "capa_attestation_input",
    dependencyStrength: "legal_preservation_required",
    sourceGraphEdgeRef: "age_442_pack_capa",
  }).dependencyLink;
  const transitiveDependencyAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding,
    retentionClass: ordinaryClass,
    decision: baselineDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [packDependency, capaDependency],
    legalHolds: [],
    legalHoldScopeManifests: [],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const cycleA = engine.createDependencyLink({
    actor,
    artifactRef: "artifact:cycle-a:442",
    dependentArtifactRef: "artifact:cycle-b:442",
    governingScopeRef: "scope:tenant:demo-gp:cycle:442",
    dependencyType: "cycle_test",
    dependencyStrength: "disposal_blocking",
    sourceGraphEdgeRef: "age_442_cycle_a",
  }).dependencyLink;
  const cycleB = engine.createDependencyLink({
    actor,
    artifactRef: "artifact:cycle-b:442",
    dependentArtifactRef: "artifact:cycle-a:442",
    governingScopeRef: "scope:tenant:demo-gp:cycle:442",
    dependencyType: "cycle_test",
    dependencyStrength: "disposal_blocking",
    sourceGraphEdgeRef: "age_442_cycle_b",
  }).dependencyLink;
  const cycleBinding = { ...binding, artifactRef: "artifact:cycle-a:442" };
  const cycleDecision = { ...baselineDecision, artifactRef: cycleBinding.artifactRef };
  const dependencyCycleAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding: cycleBinding,
    retentionClass: ordinaryClass,
    decision: cycleDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [cycleA, cycleB],
    legalHolds: [],
    legalHoldScopeManifests: [],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const wormBinding = requireBinding(
    engine.bindLifecycleForArtifact({
      actor: oldActor,
      artifactRef: "artifact:audit-entry:442",
      artifactVersionRef: "artifact-version:audit-entry:442:v1",
      artifactClassRef: "class:audit_entry",
      retentionClass: wormClass,
      graphCriticality: "hash_chained",
    }),
  );
  const wormDecision = engine.deriveRetentionDecision({
    binding: wormBinding,
    retentionClass: wormClass,
    graphSnapshotRef,
    graphVerdictRef,
    graphHash,
    graphEdgeRefs: ["age_442_worm"],
    decisionDate: assessmentAt,
    effectiveDisposition: "archive_only",
  });
  const wormHashChainedAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding: wormBinding,
    retentionClass: wormClass,
    decision: wormDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [],
    legalHolds: [],
    legalHoldScopeManifests: [],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const replayBinding = requireBinding(
    engine.bindLifecycleForArtifact({
      actor: oldActor,
      artifactRef: "artifact:model-trace:442",
      artifactVersionRef: "artifact-version:model-trace:442:v1",
      artifactClassRef: "class:model_trace",
      retentionClass: replayClass,
      graphCriticality: "replay_critical",
    }),
  );
  const replayDecision = engine.deriveRetentionDecision({
    binding: replayBinding,
    retentionClass: replayClass,
    graphSnapshotRef,
    graphVerdictRef,
    graphHash,
    graphEdgeRefs: ["age_442_replay"],
    decisionDate: assessmentAt,
    effectiveDisposition: "archive_only",
  });
  const replayDependency = engine.createDependencyLink({
    actor,
    artifactRef: replayBinding.artifactRef,
    dependentArtifactRef: "artifact:evidence-capture-bundle:442",
    governingScopeRef: "scope:tenant:demo-gp:replay:442",
    dependencyType: "replay_proof_input",
    dependencyStrength: "replay_required",
    sourceGraphEdgeRef: "age_442_replay_bundle",
  }).dependencyLink;
  const replayCriticalAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding: replayBinding,
    retentionClass: replayClass,
    decision: replayDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [replayDependency],
    legalHolds: [],
    legalHoldScopeManifests: [],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const assurancePackDependencyAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding,
    retentionClass: ordinaryClass,
    decision: baselineDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [packDependency],
    legalHolds: [],
    legalHoldScopeManifests: [],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const missingGraphVerdictAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding,
    retentionClass: ordinaryClass,
    decision: baselineDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [],
    legalHolds: [],
    legalHoldScopeManifests: [],
    graphSnapshotRef,
    graphHash,
    assessedAt: assessmentAt,
  });
  let crossTenantDependencyErrorCode = "";
  try {
    engine.createDependencyLink({
      actor,
      artifactRef: binding.artifactRef,
      dependentArtifactRef: "artifact:other-tenant:442",
      governingScopeRef: "scope:tenant:other:442",
      dependencyType: "cross_tenant_test",
      dependencyStrength: "disposal_blocking",
      sourceGraphEdgeRef: "age_442_cross_tenant",
    });
  } catch (error) {
    crossTenantDependencyErrorCode = error instanceof Phase9RetentionLifecycleEngineError ? error.code : "UNKNOWN";
  }
  const { supersededClass: supersededRetentionClass, replacementClass: replacementRetentionClass } = engine.supersedeRetentionClass({
    currentClass: ordinaryClass,
    replacement: {
      ...ordinaryClass,
      retentionClassId: "rc_442_request_snapshot_v2",
      minimumRetention: "P60D",
      reviewPoint: "P30D",
      classState: "active",
    },
  });
  const oldDecisionAfterSupersession = baselineDecision;
  const newDecisionAfterSupersession = engine.deriveRetentionDecision({
    binding: { ...binding, retentionClassRef: replacementRetentionClass.retentionClassId },
    retentionClass: replacementRetentionClass,
    graphSnapshotRef,
    graphVerdictRef,
    graphHash,
    graphEdgeRefs: ["age_442_request"],
    decisionDate: "2026-04-28T12:30:00.000Z",
    effectiveDisposition: "preserve",
    supersedesDecisionRef: baselineDecision.retentionDecisionId,
  });
  const rawStorageScanAssessment = engine.runDispositionEligibilityAssessment({
    actor,
    binding,
    retentionClass: ordinaryClass,
    decision: baselineDecision,
    requestedAction: "delete",
    candidateSource: "raw_storage_scan",
    dependencyLinks: [],
    legalHolds: [],
    legalHoldScopeManifests: [],
    graphSnapshotRef,
    graphVerdictRef,
    graphVerdictState: "complete",
    graphHash,
    assessedAt: assessmentAt,
  });
  const lifecycleEvidenceRecord = engine.emitLifecycleEvidenceForAssuranceGraph({
    binding,
    decision: baselineDecision,
    assessment: reassessmentAfterRelease,
    emittedAt: assessmentAt,
  });
  const governanceFixture = createPhase9GovernanceControlFixture();
  return {
    schemaVersion: PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9E",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9C",
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-0-the-foundation-protocol.md",
      "data/contracts/434_phase9_governance_control_contracts.json",
      "data/contracts/435_phase9_assurance_ingest_service_contract.json",
      "data/contracts/436_phase9_graph_verdict_engine_contract.json",
      "data/contracts/440_phase9_assurance_pack_factory_contract.json",
      "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
    ],
    producedObjects: [
      "RetentionClass",
      "RetentionLifecycleBinding",
      "RetentionDecision",
      "ArtifactDependencyLink",
      "LegalHoldScopeManifest",
      "LegalHoldRecord",
      "DispositionEligibilityAssessment",
      "DispositionEligibilityAssessmentRecord",
      "RetentionLifecycleAuditRecord",
      "RetentionLifecycleEvidenceRecord",
    ],
    retentionClasses: [ordinaryClass, longClass, archiveOnlyClass, wormClass, replayClass],
    artifactCreationResult,
    missingRetentionClassResult,
    baselineDecision,
    deterministicDecisionReplay,
    notDueAssessment,
    legalHoldResult,
    legalHoldBlockedAssessment,
    releasedLegalHoldResult,
    reassessmentAfterRelease,
    transitiveDependencyAssessment,
    dependencyCycleAssessment,
    wormHashChainedAssessment,
    replayCriticalAssessment,
    assurancePackDependencyAssessment,
    missingGraphVerdictAssessment,
    crossTenantDependencyErrorCode,
    supersededRetentionClass,
    replacementRetentionClass,
    oldDecisionAfterSupersession,
    newDecisionAfterSupersession,
    rawStorageScanAssessment,
    lifecycleEvidenceRecord,
    replayHash: orderedSetHash(
      [
        governanceFixture.contractSetHash,
        binding.classificationHash,
        baselineDecision.decisionHash,
        reassessmentAfterRelease.decisionHash,
        lifecycleEvidenceRecord.lifecycleEvidenceHash,
      ],
      "phase9.442.fixture.replay",
    ),
  };
}

export function phase9RetentionLifecycleEngineSummary(
  fixture: RetentionLifecycleEngineFixture = createPhase9RetentionLifecycleEngineFixture(),
): string {
  return [
    "# 442 Phase 9 Retention Lifecycle Engine",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Retention classes: ${fixture.retentionClasses.length}`,
    `Lifecycle binding: ${fixture.artifactCreationResult.binding?.retentionLifecycleBindingId ?? "missing"}`,
    `Baseline decision hash: ${fixture.baselineDecision.decisionHash}`,
    `Released-hold reassessment: ${fixture.reassessmentAfterRelease.result}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Lifecycle Contract",
    "",
    "- Lifecycle binding happens at artifact creation and refuses path-derived lifecycle classification.",
    "- Disposition eligibility is explicit, graph-pinned, tenant-scoped, and blocked for raw storage scans.",
    "- Legal holds, freezes, WORM/hash-chain criticality, replay-critical dependencies, assurance pack dependencies, investigation links, CAPA links, and graph verdict gaps fail closed.",
    "- Lifecycle evidence records can feed the assurance graph without archive or delete executors recomputing lifecycle law.",
    "",
  ].join("\n");
}

export function phase9RetentionLifecycleBlockingMatrixCsv(
  fixture: RetentionLifecycleEngineFixture = createPhase9RetentionLifecycleEngineFixture(),
): string {
  const rows = [
    ["case", "result", "eligibilityState", "blockers"],
    [
      "not_due",
      fixture.notDueAssessment.result,
      fixture.notDueAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.notDueAssessment.blockerRefs.join("|"),
    ],
    [
      "legal_hold",
      fixture.legalHoldBlockedAssessment.result,
      fixture.legalHoldBlockedAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.legalHoldBlockedAssessment.blockerRefs.join("|"),
    ],
    [
      "transitive_dependency",
      fixture.transitiveDependencyAssessment.result,
      fixture.transitiveDependencyAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.transitiveDependencyAssessment.blockerRefs.join("|"),
    ],
    [
      "dependency_cycle",
      fixture.dependencyCycleAssessment.result,
      fixture.dependencyCycleAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.dependencyCycleAssessment.blockerRefs.join("|"),
    ],
    [
      "worm_hash_chained",
      fixture.wormHashChainedAssessment.result,
      fixture.wormHashChainedAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.wormHashChainedAssessment.blockerRefs.join("|"),
    ],
    [
      "replay_critical",
      fixture.replayCriticalAssessment.result,
      fixture.replayCriticalAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.replayCriticalAssessment.blockerRefs.join("|"),
    ],
    [
      "assurance_pack_dependency",
      fixture.assurancePackDependencyAssessment.result,
      fixture.assurancePackDependencyAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.assurancePackDependencyAssessment.blockerRefs.join("|"),
    ],
    [
      "missing_graph_verdict",
      fixture.missingGraphVerdictAssessment.result,
      fixture.missingGraphVerdictAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.missingGraphVerdictAssessment.blockerRefs.join("|"),
    ],
    [
      "raw_storage_scan",
      fixture.rawStorageScanAssessment.result,
      fixture.rawStorageScanAssessment.dispositionEligibilityAssessment.eligibilityState,
      fixture.rawStorageScanAssessment.blockerRefs.join("|"),
    ],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
