import { hashAssurancePayload, orderedSetHash } from "./phase9-assurance-ledger-contracts";

export const PHASE9_GOVERNANCE_CONTRACT_VERSION = "434.phase9.governance-control-contracts.v1";

export const REQUIRED_PHASE9_GOVERNANCE_CONTRACTS = [
  "RetentionLifecycleBinding",
  "RetentionClass",
  "RetentionDecision",
  "ArtifactDependencyLink",
  "LegalHoldScopeManifest",
  "LegalHoldRecord",
  "DispositionEligibilityAssessment",
  "DispositionBlockReason",
  "OperationalReadinessSnapshot",
  "RestoreRehearsalRecord",
  "FailoverRehearsalRecord",
  "ChaosActionDefinition",
  "RecoveryControlPosture",
  "RecoveryEvidenceWriteback",
  "ProjectionRebuildPlan",
  "RecoveryDependencyMap",
  "IncidentRecord",
  "NearMissReport",
  "ReportabilityAssessment",
  "SecurityEventTriageRecord",
  "IncidentTimelineEntry",
  "CAPASourceBinding",
  "JustCultureReport",
  "NotificationEscalationObligationRecord",
  "TenantPolicyPack",
  "TenantConfigurationVersion",
  "ImmutableConfigPublication",
  "DependencyInventoryRecord",
  "DependencyRiskRecord",
  "StandardsFrameworkVersionBinding",
  "PolicyOverrideRecord",
  "AdminActionSettlement",
] as const;

export type Phase9GovernanceContractName = (typeof REQUIRED_PHASE9_GOVERNANCE_CONTRACTS)[number];

export type RetentionGraphCriticality = "ordinary" | "replay_critical" | "worm" | "hash_chained";
export type LifecycleState = "active" | "superseded" | "retired";
export type RetentionClassState = "active" | "superseded" | "retired";
export type EffectiveDisposition =
  | "preserve"
  | "archive_only"
  | "archive_pending"
  | "delete_pending"
  | "deleted"
  | "blocked";
export type DispositionEligibilityState = "blocked" | "archive_only" | "delete_allowed";
export type ArtifactDependencyStrength =
  | "explanatory"
  | "replay_required"
  | "legal_preservation_required"
  | "disposal_blocking";
export type LegalHoldScopeType = "artifact" | "request" | "episode" | "incident" | "control_pack";
export type LegalHoldOriginType = "governance" | "legal" | "incident" | "regulatory" | "patient_dispute";
export type LegalHoldState = "pending_review" | "active" | "released" | "superseded";
export type GovernanceValidationResult = {
  readonly valid: boolean;
  readonly errors: readonly string[];
};

export const dispositionBlockReasonValues = [
  "active_retention_freeze",
  "active_legal_hold",
  "transitive_legal_hold",
  "active_dependency",
  "dependency_cycle",
  "graph_missing",
  "graph_incomplete",
  "worm_or_hash_chained",
  "replay_critical_dependency",
  "missing_explicit_assessment",
  "cross_tenant_reference",
] as const;

export const phase9GovernanceEnumValues = {
  graphCriticality: ["ordinary", "replay_critical", "worm", "hash_chained"],
  lifecycleState: ["active", "superseded", "retired"],
  retentionClassState: ["active", "superseded", "retired"],
  effectiveDisposition: ["preserve", "archive_only", "archive_pending", "delete_pending", "deleted", "blocked"],
  dependencyStrength: ["explanatory", "replay_required", "legal_preservation_required", "disposal_blocking"],
  legalHoldScopeType: ["artifact", "request", "episode", "incident", "control_pack"],
  legalHoldOriginType: ["governance", "legal", "incident", "regulatory", "patient_dispute"],
  legalHoldState: ["pending_review", "active", "released", "superseded"],
  eligibilityState: ["blocked", "archive_only", "delete_allowed"],
  dispositionBlockReason: dispositionBlockReasonValues,
  freshnessState: ["fresh", "stale", "expired", "missing"],
  readinessState: ["ready", "constrained", "blocked"],
  verdictCoverageState: ["exact", "stale", "blocked"],
  dependencyCoverageState: ["complete", "partial", "blocked"],
  journeyRecoveryCoverageState: ["exact", "partial", "missing"],
  backupManifestState: ["current", "stale", "missing"],
  evidencePackAdmissibilityState: ["exact", "stale", "blocked"],
  postureState: ["live_control", "diagnostic_only", "governed_recovery", "blocked"],
  restoreDependencyValidationState: ["pending", "complete", "blocked"],
  restoreJourneyValidationState: ["pending", "complete", "blocked"],
  restoreResultState: ["running", "data_restored", "journey_validation_pending", "succeeded", "failed", "superseded"],
  failoverValidationState: ["pending", "complete", "blocked"],
  failoverResultState: ["armed", "active", "validation_pending", "stood_down", "failed", "superseded"],
  chaosExperimentState: ["draft", "approved", "withdrawn"],
  recoveryEvidenceArtifactType: [
    "restore_report",
    "failover_report",
    "chaos_report",
    "recovery_pack_export",
    "dependency_restore_explainer",
    "journey_recovery_proof",
    "backup_manifest_report",
    "runbook_bundle",
    "readiness_snapshot_summary",
  ],
  recoveryEvidenceArtifactState: ["summary_only", "governed_preview", "external_handoff_ready", "recovery_only"],
  recoveryPlanState: ["planned", "running", "completed", "blocked", "superseded"],
  recoveryDependencyMapState: ["current", "stale", "blocked"],
  incidentSeverity: ["low", "medium", "high", "critical"],
  incidentStatus: ["open", "contained", "reporting_due", "review_due", "closed", "superseded"],
  reportabilityDecision: ["not_reportable", "reportable", "pending_facts", "submitted"],
  triageState: ["pending", "classified", "escalated", "contained", "superseded"],
  timelineEntryType: ["detected", "triaged", "contained", "reported", "reviewed", "capa_opened"],
  capaBindingState: ["open", "linked", "superseded", "closed"],
  justCultureOutcome: ["support_required", "training_required", "process_fix", "no_action", "escalated"],
  notificationObligationState: ["pending", "sent", "blocked", "superseded", "not_required"],
  tenantPolicyApprovalState: ["draft", "approved", "published", "superseded", "withdrawn"],
  tenantConfigState: ["draft", "compiled", "approved", "published", "superseded"],
  immutablePublicationState: ["published", "superseded", "withdrawn"],
  dependencySupportState: ["supported", "maintenance_only", "deprecated", "end_of_life", "emergency_blocked"],
  dependencyHealthState: ["healthy", "degraded", "blocked", "unknown"],
  dependencyRiskState: ["low", "medium", "high", "critical", "blocked"],
  standardsBindingState: ["current", "impact_review", "migration_required", "blocked", "superseded"],
  overrideState: ["proposed", "approved", "active", "expired", "rolled_back", "superseded"],
  adminSettlementResult: [
    "draft_saved",
    "compile_started",
    "compile_blocked",
    "approval_invalidated",
    "promoted_pending_wave",
    "wave_action_pending",
    "stale_recoverable",
    "denied_scope",
    "failed",
  ],
} as const;

type Phase9GovernanceEnumName = keyof typeof phase9GovernanceEnumValues;

export class Phase9GovernanceContractError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9GovernanceContractError";
    this.code = code;
  }
}

function fail(code: string, message: string): never {
  throw new Phase9GovernanceContractError(code, message);
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    fail(code, message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function withHash<T extends Record<string, unknown>>(value: T, hashField: string, namespace: string): T {
  return { ...value, [hashField]: hashAssurancePayload(value, namespace) };
}

export interface Phase9GovernanceFieldDefinition {
  readonly fieldName: string;
  readonly fieldType: string;
  readonly required: boolean;
  readonly enumRef?: Phase9GovernanceEnumName;
  readonly notes: string;
}

export interface Phase9GovernanceContractDefinition {
  readonly contractName: Phase9GovernanceContractName;
  readonly schemaVersion: typeof PHASE9_GOVERNANCE_CONTRACT_VERSION;
  readonly sourceAlgorithmRef: string;
  readonly sourceObjectAlias?: string;
  readonly fieldNames: readonly string[];
  readonly requiredFields: readonly string[];
  readonly optionalFields: readonly string[];
  readonly fields: readonly Phase9GovernanceFieldDefinition[];
  readonly enumValues: Record<string, readonly string[]>;
  readonly tenantScopeConstraints: readonly string[];
  readonly identityKeys: readonly string[];
  readonly idempotencyKeys: readonly string[];
  readonly versioningStrategy: readonly string[];
  readonly canonicalHashInputs: readonly string[];
  readonly piiPhiClassification: string;
  readonly retentionClassRef: string;
  readonly auditEventMapping: readonly string[];
  readonly migrationCompatibilityNotes: readonly string[];
  readonly validStateExamples: readonly string[];
  readonly invalidStateExamples: readonly string[];
}

function field(
  fieldName: string,
  fieldType: string,
  required = true,
  enumRef?: Phase9GovernanceEnumName,
): Phase9GovernanceFieldDefinition {
  const definition = {
    fieldName,
    fieldType,
    required,
    notes: enumRef
      ? `Enum pinned by phase9GovernanceEnumValues.${enumRef}.`
      : "Pinned by Phase 9E-9H governance-control source algorithms.",
  };
  return enumRef ? { ...definition, enumRef } : definition;
}

const phase9GovernanceFieldSpecs: Record<Phase9GovernanceContractName, readonly Phase9GovernanceFieldDefinition[]> = {
  RetentionLifecycleBinding: [
    field("retentionLifecycleBindingId", "string"),
    field("artifactRef", "string"),
    field("artifactVersionRef", "string"),
    field("artifactClassRef", "string"),
    field("retentionClassRef", "string"),
    field("disposalMode", "string"),
    field("immutabilityMode", "string"),
    field("dependencyCheckPolicyRef", "string"),
    field("minimumRetentionOverrideRef", "string", false),
    field("activeFreezeRefs", "readonly string[]"),
    field("activeLegalHoldRefs", "readonly string[]"),
    field("graphCriticality", "RetentionGraphCriticality", true, "graphCriticality"),
    field("lifecycleState", "LifecycleState", true, "lifecycleState"),
    field("classificationHash", "sha256-hex"),
    field("createdAt", "iso-timestamp"),
  ],
  RetentionClass: [
    field("retentionClassId", "string"),
    field("recordType", "string"),
    field("basisRef", "string"),
    field("minimumRetention", "duration"),
    field("reviewPoint", "duration"),
    field("disposalMode", "string"),
    field("immutabilityMode", "string"),
    field("dependencyCheckPolicyRef", "string"),
    field("sourcePolicyRef", "string"),
    field("freezeEscalationPolicyRef", "string"),
    field("legalHoldEscalationPolicyRef", "string"),
    field("derivativeRetentionPolicyRef", "string"),
    field("classState", "RetentionClassState", true, "retentionClassState"),
    field("policyTupleHash", "sha256-hex"),
  ],
  RetentionDecision: [
    field("retentionDecisionId", "string"),
    field("artifactRef", "string"),
    field("retentionLifecycleBindingRef", "string"),
    field("retentionClassRef", "string"),
    field("decisionDate", "iso-date"),
    field("deleteAfter", "iso-date", false),
    field("archiveAfter", "iso-date", false),
    field("activeFreezeRefs", "readonly string[]"),
    field("activeLegalHoldRefs", "readonly string[]"),
    field("assuranceEvidenceGraphSnapshotRef", "string"),
    field("assuranceGraphCompletenessVerdictRef", "string"),
    field("graphEdgeRefs", "readonly string[]"),
    field("dispositionEligibilityAssessmentRef", "string", false),
    field("effectiveDisposition", "EffectiveDisposition", true, "effectiveDisposition"),
    field("supersedesDecisionRef", "string", false),
    field("decisionHash", "sha256-hex"),
  ],
  ArtifactDependencyLink: [
    field("dependencyLinkId", "string"),
    field("artifactRef", "string"),
    field("dependentArtifactRef", "string"),
    field("governingScopeRef", "string"),
    field("dependencyType", "string"),
    field("dependencyStrength", "ArtifactDependencyStrength", true, "dependencyStrength"),
    field("activeState", "string"),
    field("sourceGraphEdgeRef", "string"),
    field("linkHash", "sha256-hex"),
  ],
  LegalHoldScopeManifest: [
    field("legalHoldScopeManifestId", "string"),
    field("legalHoldRecordRef", "string"),
    field("scopeType", "LegalHoldScopeType", true, "legalHoldScopeType"),
    field("scopeEntityRefs", "readonly string[]"),
    field("artifactRefs", "readonly string[]"),
    field("freezeRefs", "readonly string[]"),
    field("dependencyLinkRefs", "readonly string[]"),
    field("scopeHash", "sha256-hex"),
    field("capturedAt", "iso-timestamp"),
  ],
  LegalHoldRecord: [
    field("legalHoldRecordId", "string"),
    field("scopeRef", "string"),
    field("scopeManifestRef", "string"),
    field("scopeHash", "sha256-hex"),
    field("reasonCode", "string"),
    field("originType", "LegalHoldOriginType", true, "legalHoldOriginType"),
    field("placedBy", "string"),
    field("placedAt", "iso-timestamp"),
    field("reviewDate", "iso-date"),
    field("holdState", "LegalHoldState", true, "legalHoldState"),
    field("freezeRef", "string"),
    field("supersedesHoldRef", "string", false),
    field("releasedAt", "iso-timestamp", false),
    field("releaseReason", "string", false),
    field("holdHash", "sha256-hex"),
  ],
  DispositionEligibilityAssessment: [
    field("dispositionEligibilityAssessmentId", "string"),
    field("artifactRef", "string"),
    field("retentionLifecycleBindingRef", "string"),
    field("retentionDecisionRef", "string"),
    field("activeFreezeRefs", "readonly string[]"),
    field("activeLegalHoldRefs", "readonly string[]"),
    field("activeDependencyLinkRefs", "readonly string[]"),
    field("assuranceEvidenceGraphSnapshotRef", "string"),
    field("assuranceGraphCompletenessVerdictRef", "string"),
    field("graphHash", "sha256-hex"),
    field("eligibilityState", "DispositionEligibilityState", true, "eligibilityState"),
    field("blockingReasonRefs", "readonly DispositionBlockReason[]"),
    field("assessmentHash", "sha256-hex"),
    field("assessedAt", "iso-timestamp"),
  ],
  DispositionBlockReason: [
    field("reasonCode", "DispositionBlockReason", true, "dispositionBlockReason"),
    field("category", "string"),
    field("defaultDisposition", "DispositionEligibilityState", true, "eligibilityState"),
    field("failClosed", "boolean"),
    field("operatorExplainerRef", "string"),
  ],
  OperationalReadinessSnapshot: [
    field("operationalReadinessSnapshotId", "string"),
    field("releaseRef", "string"),
    field("verificationScenarioRef", "string"),
    field("releaseContractVerificationMatrixRef", "string"),
    field("releaseContractMatrixHash", "sha256-hex"),
    field("runtimePublicationBundleRef", "string"),
    field("releasePublicationParityRef", "string"),
    field("releaseWatchTupleRef", "string"),
    field("watchTupleHash", "sha256-hex"),
    field("waveObservationPolicyRef", "string"),
    field("requiredAssuranceSliceRefs", "readonly string[]"),
    field("releaseTrustFreezeVerdictRefs", "readonly string[]"),
    field("dashboardBundleRefs", "readonly string[]"),
    field("runbookBindingRefs", "readonly string[]"),
    field("syntheticCoverageRefs", "readonly string[]"),
    field("essentialFunctionRefs", "readonly string[]"),
    field("essentialFunctionHealthEnvelopeRefs", "readonly string[]"),
    field("recoveryTierRefs", "readonly string[]"),
    field("backupSetManifestRefs", "readonly string[]"),
    field("resilienceSurfaceRuntimeBindingRefs", "readonly string[]"),
    field("recoveryControlPostureRefs", "readonly string[]"),
    field("recoveryEvidencePackRefs", "readonly string[]"),
    field("latestRecoveryEvidencePackRef", "string"),
    field("latestRestoreRunRefs", "readonly string[]"),
    field("latestFailoverRunRefs", "readonly string[]"),
    field("latestChaosRunRefs", "readonly string[]"),
    field("latestJourneyRecoveryProofRefs", "readonly string[]"),
    field("latestResilienceActionSettlementRefs", "readonly string[]"),
    field("resilienceTupleHash", "sha256-hex"),
    field("ownerCoverageState", "string"),
    field("verdictCoverageState", "string", true, "verdictCoverageState"),
    field("freshnessState", "string", true, "freshnessState"),
    field("rehearsalFreshnessState", "string", true, "freshnessState"),
    field("readinessState", "string", true, "readinessState"),
    field("capturedAt", "iso-timestamp"),
  ],
  RestoreRehearsalRecord: [
    field("restoreRunId", "string"),
    field("releaseRef", "string"),
    field("verificationScenarioRef", "string"),
    field("releaseContractVerificationMatrixRef", "string"),
    field("releaseContractMatrixHash", "sha256-hex"),
    field("runtimePublicationBundleRef", "string"),
    field("releasePublicationParityRef", "string"),
    field("releaseWatchTupleRef", "string"),
    field("watchTupleHash", "sha256-hex"),
    field("essentialFunctionRefs", "readonly string[]"),
    field("recoveryTierRefs", "readonly string[]"),
    field("targetEnvironmentRef", "string"),
    field("backupSetManifestRefs", "readonly string[]"),
    field("operationalReadinessSnapshotRef", "string"),
    field("runbookBindingRefs", "readonly string[]"),
    field("recoveryControlPostureRef", "string"),
    field("dependencyOrderDigestRef", "string"),
    field("dependencyProofArtifactRefs", "readonly string[]"),
    field("journeyProofArtifactRefs", "readonly string[]"),
    field("syntheticRecoveryCoverageRefs", "readonly string[]"),
    field("restoreTupleHash", "sha256-hex"),
    field("resilienceTupleHash", "sha256-hex"),
    field("scopeTupleHash", "sha256-hex"),
    field("dependencyValidationState", "string", true, "restoreDependencyValidationState"),
    field("journeyValidationState", "string", true, "restoreJourneyValidationState"),
    field("initiatedAt", "iso-timestamp"),
    field("completedAt", "iso-timestamp", false),
    field("resultState", "string", true, "restoreResultState"),
    field("evidenceArtifactRefs", "readonly string[]"),
    field("recoveryEvidencePackRef", "string"),
    field("resilienceActionSettlementRef", "string"),
  ],
  FailoverRehearsalRecord: [
    field("failoverRunId", "string"),
    field("releaseRef", "string"),
    field("verificationScenarioRef", "string"),
    field("releaseContractVerificationMatrixRef", "string"),
    field("releaseContractMatrixHash", "sha256-hex"),
    field("runtimePublicationBundleRef", "string"),
    field("releasePublicationParityRef", "string"),
    field("releaseWatchTupleRef", "string"),
    field("watchTupleHash", "sha256-hex"),
    field("failoverScenarioRef", "string"),
    field("essentialFunctionRefs", "readonly string[]"),
    field("recoveryTierRefs", "readonly string[]"),
    field("operationalReadinessSnapshotRef", "string"),
    field("runbookBindingRefs", "readonly string[]"),
    field("recoveryControlPostureRef", "string"),
    field("failoverTupleHash", "sha256-hex"),
    field("resilienceTupleHash", "sha256-hex"),
    field("scopeTupleHash", "sha256-hex"),
    field("degradedModeRef", "string"),
    field("dependencyOrderDigestRef", "string"),
    field("journeyProofArtifactRefs", "readonly string[]"),
    field("syntheticRecoveryCoverageRefs", "readonly string[]"),
    field("validationState", "string", true, "failoverValidationState"),
    field("startedAt", "iso-timestamp"),
    field("completedAt", "iso-timestamp", false),
    field("resultState", "string", true, "failoverResultState"),
    field("evidenceArtifactRefs", "readonly string[]"),
    field("recoveryEvidencePackRef", "string"),
    field("resilienceActionSettlementRef", "string"),
  ],
  ChaosActionDefinition: [
    field("chaosExperimentId", "string"),
    field("blastRadiusRef", "string"),
    field("essentialFunctionRefs", "readonly string[]"),
    field("recoveryTierRefs", "readonly string[]"),
    field("hypothesisRef", "string"),
    field("guardrailRefs", "readonly string[]"),
    field("requiredSyntheticRecoveryCoverageRefs", "readonly string[]"),
    field("releasePublicationParityRef", "string"),
    field("releaseWatchTupleRef", "string"),
    field("approvalPolicyRef", "string"),
    field("approvedScopeTupleHash", "sha256-hex"),
    field("experimentHash", "sha256-hex"),
    field("experimentState", "string", true, "chaosExperimentState"),
  ],
  RecoveryControlPosture: [
    field("recoveryControlPostureId", "string"),
    field("scopeRef", "string"),
    field("verificationScenarioRef", "string"),
    field("releaseContractVerificationMatrixRef", "string"),
    field("releaseContractMatrixHash", "sha256-hex"),
    field("runtimePublicationBundleRef", "string"),
    field("releasePublicationParityRef", "string"),
    field("releaseWatchTupleRef", "string"),
    field("watchTupleHash", "sha256-hex"),
    field("publicationState", "string"),
    field("trustState", "string"),
    field("freezeState", "string"),
    field("releaseTrustFreezeVerdictRef", "string"),
    field("operationalReadinessSnapshotRef", "string"),
    field("requiredRunbookBindingRefs", "readonly string[]"),
    field("recoveryTierRefs", "readonly string[]"),
    field("requiredBackupSetManifestRefs", "readonly string[]"),
    field("requiredSyntheticRecoveryCoverageRefs", "readonly string[]"),
    field("latestRestoreRunRef", "string"),
    field("latestFailoverRunRef", "string"),
    field("latestChaosRunRef", "string"),
    field("currentRecoveryEvidencePackRef", "string"),
    field("latestRecoveryEvidencePackRef", "string"),
    field("latestResilienceActionSettlementRefs", "readonly string[]"),
    field("restoreValidationFreshnessState", "string", true, "freshnessState"),
    field("failoverValidationFreshnessState", "string", true, "freshnessState"),
    field("chaosValidationFreshnessState", "string", true, "freshnessState"),
    field("dependencyCoverageState", "string", true, "dependencyCoverageState"),
    field("journeyRecoveryCoverageState", "string", true, "journeyRecoveryCoverageState"),
    field("backupManifestState", "string", true, "backupManifestState"),
    field("evidencePackAdmissibilityState", "string", true, "evidencePackAdmissibilityState"),
    field("postureState", "string", true, "postureState"),
    field("allowedActionRefs", "readonly string[]"),
    field("blockerRefs", "readonly string[]"),
    field("authoritativeScopeTupleHash", "sha256-hex"),
    field("controlTupleHash", "sha256-hex"),
    field("releaseRecoveryDispositionRef", "string"),
    field("lastComputedAt", "iso-timestamp"),
  ],
  RecoveryEvidenceWriteback: [
    field("recoveryEvidenceArtifactId", "string"),
    field("artifactType", "string", true, "recoveryEvidenceArtifactType"),
    field("scopeRef", "string"),
    field("verificationScenarioRef", "string"),
    field("releaseContractVerificationMatrixRef", "string"),
    field("releaseContractMatrixHash", "sha256-hex"),
    field("runtimePublicationBundleRef", "string"),
    field("releasePublicationParityRef", "string"),
    field("releaseWatchTupleRef", "string"),
    field("watchTupleHash", "sha256-hex"),
    field("operationalReadinessSnapshotRef", "string"),
    field("recoveryControlPostureRef", "string"),
    field("runbookBindingRefs", "readonly string[]"),
    field("backupSetManifestRefs", "readonly string[]"),
    field("producingRunRef", "string"),
    field("recoveryEvidencePackRef", "string"),
    field("syntheticRecoveryCoverageRefs", "readonly string[]"),
    field("latestResilienceActionSettlementRefs", "readonly string[]"),
    field("summaryRef", "string"),
    field("assuranceEvidenceGraphSnapshotRef", "string"),
    field("assuranceGraphCompletenessVerdictRef", "string"),
    field("graphHash", "sha256-hex"),
    field("artifactPresentationContractRef", "string"),
    field("artifactSurfaceContextRef", "string"),
    field("artifactModeTruthProjectionRef", "string"),
    field("artifactTransferSettlementRef", "string"),
    field("artifactFallbackDispositionRef", "string"),
    field("outboundNavigationGrantPolicyRef", "string"),
    field("maskingPolicyRef", "string"),
    field("externalHandoffPolicyRef", "string"),
    field("selectedAnchorRef", "string"),
    field("returnIntentTokenRef", "string"),
    field("resilienceTupleHash", "sha256-hex"),
    field("artifactState", "string", true, "recoveryEvidenceArtifactState"),
  ],
  ProjectionRebuildPlan: [
    field("projectionRebuildPlanId", "string"),
    field("projectionFamilyRef", "string"),
    field("scopeRef", "string"),
    field("triggerRef", "string"),
    field("sourceSnapshotRef", "string"),
    field("targetSnapshotRef", "string"),
    field("assuranceEvidenceGraphSnapshotRef", "string"),
    field("assuranceGraphCompletenessVerdictRef", "string"),
    field("graphHash", "sha256-hex"),
    field("dependencyMapRef", "string"),
    field("rebuildTupleHash", "sha256-hex"),
    field("planState", "string", true, "recoveryPlanState"),
    field("createdAt", "iso-timestamp"),
  ],
  RecoveryDependencyMap: [
    field("recoveryDependencyMapId", "string"),
    field("scopeRef", "string"),
    field("essentialFunctionRefs", "readonly string[]"),
    field("dependencyOrderRef", "string"),
    field("dependencyLinkRefs", "readonly string[]"),
    field("backupSetManifestRefs", "readonly string[]"),
    field("restoreProofArtifactRefs", "readonly string[]"),
    field("graphHash", "sha256-hex"),
    field("mapState", "string", true, "recoveryDependencyMapState"),
    field("capturedAt", "iso-timestamp"),
  ],
  IncidentRecord: [
    field("incidentRecordId", "string"),
    field("incidentType", "string"),
    field("sourceRef", "string"),
    field("detectedAt", "iso-timestamp"),
    field("severity", "string", true, "incidentSeverity"),
    field("impactScope", "string"),
    field("status", "string", true, "incidentStatus"),
    field("reportabilityAssessmentRef", "string"),
    field("auditEvidenceRefs", "readonly string[]"),
    field("timelineEntryRefs", "readonly string[]"),
    field("capaSourceBindingRefs", "readonly string[]"),
  ],
  NearMissReport: [
    field("nearMissReportId", "string"),
    field("reportedBy", "string"),
    field("contextRef", "string"),
    field("summaryRef", "string"),
    field("investigationState", "string"),
    field("linkedIncidentRef", "string", false),
    field("auditEvidenceRefs", "readonly string[]"),
    field("timelineEntryRefs", "readonly string[]"),
  ],
  ReportabilityAssessment: [
    field("assessmentId", "string"),
    field("incidentRef", "string"),
    field("frameworkRef", "string"),
    field("decision", "string", true, "reportabilityDecision"),
    field("supportingFactsRef", "string"),
    field("reportedAt", "iso-timestamp", false),
    field("auditEvidenceRefs", "readonly string[]"),
    field("timelineEntryRefs", "readonly string[]"),
    field("capaSourceBindingRefs", "readonly string[]"),
  ],
  SecurityEventTriageRecord: [
    field("securityEventTriageRecordId", "string"),
    field("incidentRef", "string"),
    field("eventRef", "string"),
    field("triagedBy", "string"),
    field("triagedAt", "iso-timestamp"),
    field("severity", "string", true, "incidentSeverity"),
    field("triageState", "string", true, "triageState"),
    field("auditEvidenceRefs", "readonly string[]"),
  ],
  IncidentTimelineEntry: [
    field("incidentTimelineEntryId", "string"),
    field("incidentRef", "string"),
    field("entryType", "string", true, "timelineEntryType"),
    field("occurredAt", "iso-timestamp"),
    field("actorRef", "string"),
    field("summaryRef", "string"),
    field("auditEvidenceRefs", "readonly string[]"),
    field("entryHash", "sha256-hex"),
  ],
  CAPASourceBinding: [
    field("capaSourceBindingId", "string"),
    field("sourceType", "string"),
    field("sourceRef", "string"),
    field("incidentRef", "string"),
    field("nearMissReportRef", "string", false),
    field("reportabilityAssessmentRef", "string"),
    field("capaRef", "string"),
    field("auditEvidenceRefs", "readonly string[]"),
    field("bindingState", "string", true, "capaBindingState"),
    field("createdAt", "iso-timestamp"),
  ],
  JustCultureReport: [
    field("justCultureReportId", "string"),
    field("sourceRef", "string"),
    field("reportedBy", "string"),
    field("contextRef", "string"),
    field("summaryRef", "string"),
    field("outcomeState", "string", true, "justCultureOutcome"),
    field("supportingEvidenceRefs", "readonly string[]"),
    field("auditEvidenceRefs", "readonly string[]"),
    field("createdAt", "iso-timestamp"),
  ],
  NotificationEscalationObligationRecord: [
    field("notificationEscalationObligationRecordId", "string"),
    field("incidentRef", "string"),
    field("obligationType", "string"),
    field("frameworkRef", "string"),
    field("recipientScopeRef", "string"),
    field("dueAt", "iso-timestamp"),
    field("completedAt", "iso-timestamp", false),
    field("status", "string", true, "notificationObligationState"),
    field("auditEvidenceRefs", "readonly string[]"),
  ],
  TenantPolicyPack: [
    field("tenantPolicyPackId", "string"),
    field("tenantId", "string"),
    field("policyPackVersionRef", "string"),
    field("compiledPolicyBundleRef", "string"),
    field("domainPackRefs", "readonly string[]"),
    field("effectiveFrom", "iso-timestamp"),
    field("effectiveTo", "iso-timestamp", false),
    field("versionHash", "sha256-hex"),
    field("approvalState", "string", true, "tenantPolicyApprovalState"),
    field("publicationRef", "string"),
  ],
  TenantConfigurationVersion: [
    field("tenantConfigurationVersionId", "string"),
    field("tenantId", "string"),
    field("configVersionId", "string"),
    field("scope", "string"),
    field("hash", "sha256-hex"),
    field("parentVersionRef", "string", false),
    field("changedBy", "string"),
    field("changedAt", "iso-timestamp"),
    field("changeType", "string"),
    field("attestationRef", "string"),
    field("state", "string", true, "tenantConfigState"),
  ],
  ImmutableConfigPublication: [
    field("immutableConfigPublicationId", "string"),
    field("tenantId", "string"),
    field("configVersionRef", "string"),
    field("compiledPolicyBundleRef", "string"),
    field("configCompilationRecordRef", "string"),
    field("standardsDependencyWatchlistRef", "string"),
    field("compilationTupleHash", "sha256-hex"),
    field("standardsWatchlistHash", "sha256-hex"),
    field("versionHash", "sha256-hex"),
    field("publicationHash", "sha256-hex"),
    field("publishedBy", "string"),
    field("publishedAt", "iso-timestamp"),
    field("publicationState", "string", true, "immutablePublicationState"),
  ],
  DependencyInventoryRecord: [
    field("dependencyInventoryRecordId", "string"),
    field("tenantId", "string"),
    field("dependencyCode", "string"),
    field("sourceAuthority", "string"),
    field("currentVersion", "string"),
    field("ownerRef", "string"),
    field("scopeRef", "string"),
    field("supportState", "string", true, "dependencySupportState"),
    field("legacyRiskState", "string", true, "dependencyRiskState"),
    field("healthState", "string", true, "dependencyHealthState"),
    field("evidenceRefs", "readonly string[]"),
    field("replacementPathRef", "string"),
    field("recordedAt", "iso-timestamp"),
  ],
  DependencyRiskRecord: [
    field("dependencyRiskRecordId", "string"),
    field("dependencyInventoryRecordRef", "string"),
    field("ownerRef", "string"),
    field("scopeRef", "string"),
    field("versionRef", "string"),
    field("healthState", "string", true, "dependencyHealthState"),
    field("riskState", "string", true, "dependencyRiskState"),
    field("evidenceRefs", "readonly string[]"),
    field("remediationDueAt", "iso-timestamp"),
    field("watchlistRef", "string"),
    field("recordedAt", "iso-timestamp"),
  ],
  StandardsFrameworkVersionBinding: [
    field("standardsFrameworkVersionBindingId", "string"),
    field("tenantId", "string"),
    field("frameworkCode", "string"),
    field("currentVersionRef", "string"),
    field("newVersionRef", "string"),
    field("standardsDependencyWatchlistRef", "string"),
    field("candidateBundleHash", "sha256-hex"),
    field("ownerRef", "string"),
    field("impactAssessmentRef", "string"),
    field("bindingState", "string", true, "standardsBindingState"),
    field("boundAt", "iso-timestamp"),
  ],
  PolicyOverrideRecord: [
    field("policyOverrideRecordId", "string"),
    field("tenantId", "string"),
    field("policyRef", "string"),
    field("purposeRef", "string"),
    field("requestedByRole", "string"),
    field("governanceScopeTokenRef", "string"),
    field("idempotencyKey", "string"),
    field("auditEvidenceRef", "string"),
    field("expiresAt", "iso-timestamp"),
    field("rollbackPlanRef", "string"),
    field("supersedesOverrideRef", "string", false),
    field("overrideState", "string", true, "overrideState"),
    field("createdAt", "iso-timestamp"),
  ],
  AdminActionSettlement: [
    field("adminActionSettlementId", "string"),
    field("adminActionRecordRef", "string"),
    field("result", "string", true, "adminSettlementResult"),
    field("recoveryActionRef", "string"),
    field("recordedAt", "iso-timestamp"),
    field("idempotencyKey", "string"),
    field("scopeTupleHash", "sha256-hex"),
    field("auditEvidenceRefs", "readonly string[]"),
  ],
};

const phase9GovernanceSourceRefs: Record<Phase9GovernanceContractName, { source: string; alias?: string }> = {
  RetentionLifecycleBinding: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9E.RetentionLifecycleBinding",
  },
  RetentionClass: { source: "blueprint/phase-9-the-assurance-ledger.md#9E.RetentionClass" },
  RetentionDecision: { source: "blueprint/phase-9-the-assurance-ledger.md#9E.RetentionDecision" },
  ArtifactDependencyLink: { source: "blueprint/phase-9-the-assurance-ledger.md#9E.ArtifactDependencyLink" },
  LegalHoldScopeManifest: { source: "blueprint/phase-9-the-assurance-ledger.md#9E.LegalHoldScopeManifest" },
  LegalHoldRecord: { source: "blueprint/phase-9-the-assurance-ledger.md#9E.LegalHoldRecord" },
  DispositionEligibilityAssessment: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9E.DispositionEligibilityAssessment",
  },
  DispositionBlockReason: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9E.blocked-disposition",
    alias: "DispositionBlockExplainer.blockingReasonRefs[]",
  },
  OperationalReadinessSnapshot: {
    source: "blueprint/platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
  },
  RestoreRehearsalRecord: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9F.RestoreRun",
    alias: "RestoreRun",
  },
  FailoverRehearsalRecord: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9F.FailoverRun",
    alias: "FailoverRun",
  },
  ChaosActionDefinition: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9F.ChaosExperiment",
    alias: "ChaosExperiment",
  },
  RecoveryControlPosture: { source: "blueprint/phase-9-the-assurance-ledger.md#9F.RecoveryControlPosture" },
  RecoveryEvidenceWriteback: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9F.RecoveryEvidenceArtifact",
    alias: "RecoveryEvidenceArtifact",
  },
  ProjectionRebuildPlan: {
    source: "prompt/434.md#resilience-recovery-contract-freeze",
    alias: "Projection rebuild plan for assurance-linked recovery projections",
  },
  RecoveryDependencyMap: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9F.dependency-ordering",
    alias: "Recovery dependency map",
  },
  IncidentRecord: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9G.SecurityIncident",
    alias: "SecurityIncident",
  },
  NearMissReport: { source: "blueprint/phase-9-the-assurance-ledger.md#9G.NearMissReport" },
  ReportabilityAssessment: { source: "blueprint/phase-9-the-assurance-ledger.md#9G.ReportabilityAssessment" },
  SecurityEventTriageRecord: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9G.incident-algorithm",
    alias: "classify and triage severity",
  },
  IncidentTimelineEntry: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9G.incident-algorithm",
    alias: "preserve evidence and timeline",
  },
  CAPASourceBinding: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9G.PostIncidentReview",
    alias: "PostIncidentReview.capaRefs",
  },
  JustCultureReport: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9G.just-culture-reporting",
  },
  NotificationEscalationObligationRecord: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9G.reportable-incidents",
  },
  TenantPolicyPack: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9H.PolicyPackVersion",
    alias: "PolicyPackVersion + CompiledPolicyBundle",
  },
  TenantConfigurationVersion: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9H.ConfigVersion",
    alias: "ConfigVersion",
  },
  ImmutableConfigPublication: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9H.config-compilation-package",
  },
  DependencyInventoryRecord: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9H.DependencyRegistryEntry",
    alias: "DependencyRegistryEntry",
  },
  DependencyRiskRecord: {
    source: "blueprint/platform-admin-and-config-blueprint.md#DependencyLifecycleRecord",
    alias: "DependencyLifecycleRecord",
  },
  StandardsFrameworkVersionBinding: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9H.StandardsChangeNotice",
    alias: "StandardsChangeNotice",
  },
  PolicyOverrideRecord: {
    source: "blueprint/phase-9-the-assurance-ledger.md#9H.tenant-overrides",
  },
  AdminActionSettlement: {
    source: "blueprint/platform-admin-and-config-blueprint.md#AdminActionSettlement",
  },
};

function enumValuesForFields(fields: readonly Phase9GovernanceFieldDefinition[]): Record<string, readonly string[]> {
  const values: Record<string, readonly string[]> = {};
  for (const spec of fields) {
    if (spec.enumRef) {
      values[spec.fieldName] = phase9GovernanceEnumValues[spec.enumRef];
    }
  }
  return values;
}

function identityKeyFor(contractName: Phase9GovernanceContractName): string {
  const fields = phase9GovernanceFieldSpecs[contractName];
  const idField = fields.find((spec) => spec.fieldName.endsWith("Id") || spec.fieldName === "reasonCode");
  invariant(idField, "GOVERNANCE_ID_FIELD_MISSING", `${contractName} is missing an identity field.`);
  return idField.fieldName;
}

function governanceContractDefinition(contractName: Phase9GovernanceContractName): Phase9GovernanceContractDefinition {
  const fields = phase9GovernanceFieldSpecs[contractName];
  const requiredFields = fields.filter((spec) => spec.required).map((spec) => spec.fieldName);
  const optionalFields = fields.filter((spec) => !spec.required).map((spec) => spec.fieldName);
  const source = phase9GovernanceSourceRefs[contractName];
  return {
    contractName,
    schemaVersion: PHASE9_GOVERNANCE_CONTRACT_VERSION,
    sourceAlgorithmRef: source.source,
    sourceObjectAlias: source.alias ?? "",
    fieldNames: fields.map((spec) => spec.fieldName),
    requiredFields,
    optionalFields,
    fields,
    enumValues: enumValuesForFields(fields),
    tenantScopeConstraints: [
      "Tenant-scoped records must carry tenantId, scopeRef, or governingScopeRef and must reject cross-tenant references unless an explicit governance scope token grants them.",
      "Retention, legal hold, disposition, resilience, incident, and tenant governance contracts must carry refs, hashes, or evidence graph pointers instead of inline PHI.",
      "Admin overrides, config publications, and dependency exceptions are time-bounded, auditable, and immutable after publication.",
    ],
    identityKeys: [identityKeyFor(contractName)],
    idempotencyKeys: [
      identityKeyFor(contractName),
      "tenantId|scopeRef|governingScopeRef",
      "versionHash|classificationHash|policyTupleHash|resilienceTupleHash",
    ],
    versioningStrategy: [
      `contract schema pinned to ${PHASE9_GOVERNANCE_CONTRACT_VERSION}`,
      "creation-time retention lifecycle classification is immutable and superseded by new bindings rather than mutated",
      "published tenant config, policy packs, standards bindings, and admin settlements are hash-addressed and append-only",
      "recovery, incident, and disposition evidence must carry assurance graph refs and cannot satisfy gates from detached local history",
    ],
    canonicalHashInputs: fields.map((spec) => spec.fieldName),
    piiPhiClassification:
      "Reference-only governance metadata. PHI-bearing summaries must be represented by governed artifact refs, masking-policy refs, and audit evidence refs.",
    retentionClassRef: "governance_control_worm_or_replay_critical",
    auditEventMapping: [
      `analytics_assurance.phase9.${contractName}.created`,
      `analytics_assurance.phase9.${contractName}.validated`,
      `analytics_assurance.phase9.${contractName}.superseded_or_blocked`,
    ],
    migrationCompatibilityNotes: [
      "Unsupported or missing source aliases fail closed during freeze validation.",
      "Downstream workflow builders must consume these frozen contracts rather than inferring lifecycle, recovery, incident, or config posture from storage paths or local dashboard state.",
      "Cross-layer joins are tuple-hash based; stale tuple matches are diagnostic history, not live authority.",
    ],
    validStateExamples: [`data/fixtures/434_phase9_governance_control_fixtures.json#/examples/${contractName}`],
    invalidStateExamples: [
      `invalid:${contractName}:missing-required-field`,
      `invalid:${contractName}:bad-enum-or-cross-tenant-reference`,
    ],
  };
}

export const phase9GovernanceContractDefinitions = REQUIRED_PHASE9_GOVERNANCE_CONTRACTS.map(
  governanceContractDefinition,
) as readonly Phase9GovernanceContractDefinition[];

export function validateGovernanceContractDefinitionCoverage(
  definitions: readonly Phase9GovernanceContractDefinition[] = phase9GovernanceContractDefinitions,
): GovernanceValidationResult {
  const errors: string[] = [];
  const names = new Set(definitions.map((definition) => definition.contractName));
  for (const requiredName of REQUIRED_PHASE9_GOVERNANCE_CONTRACTS) {
    if (!names.has(requiredName)) {
      errors.push(`MISSING_GOVERNANCE_CONTRACT:${requiredName}`);
    }
  }
  if (names.size !== definitions.length) {
    errors.push("DUPLICATE_GOVERNANCE_CONTRACT_NAME");
  }
  const allFields = new Set(definitions.flatMap((definition) => definition.fieldNames));
  for (const requiredAxis of [
    "classificationHash",
    "dispositionEligibilityAssessmentRef",
    "assuranceEvidenceGraphSnapshotRef",
    "assuranceGraphCompletenessVerdictRef",
    "resilienceTupleHash",
    "timelineEntryRefs",
    "capaSourceBindingRefs",
    "versionHash",
    "publicationHash",
    "ownerRef",
    "scopeRef",
    "expiresAt",
  ]) {
    if (!allFields.has(requiredAxis)) {
      errors.push(`MISSING_GOVERNANCE_AXIS:${requiredAxis}`);
    }
  }
  for (const definition of definitions) {
    if (definition.requiredFields.length === 0) {
      errors.push(`CONTRACT_REQUIRED_FIELDS_EMPTY:${definition.contractName}`);
    }
    if (!definition.sourceAlgorithmRef || definition.versioningStrategy.length === 0) {
      errors.push(`CONTRACT_METADATA_INCOMPLETE:${definition.contractName}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateGovernanceContractObject(
  contractName: Phase9GovernanceContractName,
  value: unknown,
): GovernanceValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: [`GOVERNANCE_OBJECT_NOT_RECORD:${contractName}`] };
  }
  const definition = phase9GovernanceContractDefinitions.find((candidate) => candidate.contractName === contractName);
  invariant(definition, "GOVERNANCE_CONTRACT_DEFINITION_MISSING", `${contractName} definition is missing.`);
  const errors: string[] = [];
  for (const requiredField of definition.requiredFields) {
    const fieldValue = value[requiredField];
    if (
      fieldValue === undefined ||
      fieldValue === null ||
      (typeof fieldValue === "string" && fieldValue.trim().length === 0)
    ) {
      errors.push(`MISSING_REQUIRED_FIELD:${contractName}.${requiredField}`);
    }
  }
  for (const fieldSpec of definition.fields) {
    if (!fieldSpec.enumRef) {
      continue;
    }
    const fieldValue = value[fieldSpec.fieldName];
    if (fieldValue !== undefined && !phase9GovernanceEnumValues[fieldSpec.enumRef].includes(fieldValue as never)) {
      errors.push(`INVALID_ENUM:${contractName}.${fieldSpec.fieldName}:${String(fieldValue)}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidGovernanceContractObject(
  contractName: Phase9GovernanceContractName,
  value: unknown,
): void {
  const result = validateGovernanceContractObject(contractName, value);
  invariant(result.valid, "GOVERNANCE_CONTRACT_OBJECT_INVALID", result.errors.join("; "));
}

export interface RetentionLifecycleBinding {
  readonly retentionLifecycleBindingId: string;
  readonly artifactRef: string;
  readonly artifactVersionRef: string;
  readonly artifactClassRef: string;
  readonly retentionClassRef: string;
  readonly disposalMode: string;
  readonly immutabilityMode: string;
  readonly dependencyCheckPolicyRef: string;
  readonly minimumRetentionOverrideRef?: string;
  readonly activeFreezeRefs: readonly string[];
  readonly activeLegalHoldRefs: readonly string[];
  readonly graphCriticality: RetentionGraphCriticality;
  readonly lifecycleState: LifecycleState;
  readonly classificationHash: string;
  readonly createdAt: string;
}

export interface RetentionDecision {
  readonly retentionDecisionId: string;
  readonly artifactRef: string;
  readonly retentionLifecycleBindingRef: string;
  readonly retentionClassRef: string;
  readonly decisionDate: string;
  readonly deleteAfter?: string;
  readonly archiveAfter?: string;
  readonly activeFreezeRefs: readonly string[];
  readonly activeLegalHoldRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphEdgeRefs: readonly string[];
  readonly dispositionEligibilityAssessmentRef?: string;
  readonly effectiveDisposition: EffectiveDisposition;
  readonly supersedesDecisionRef?: string;
  readonly decisionHash: string;
}

export interface ArtifactDependencyLink {
  readonly dependencyLinkId: string;
  readonly artifactRef: string;
  readonly dependentArtifactRef: string;
  readonly governingScopeRef: string;
  readonly dependencyType: string;
  readonly dependencyStrength: ArtifactDependencyStrength;
  readonly activeState: string;
  readonly sourceGraphEdgeRef: string;
  readonly linkHash: string;
}

export interface LegalHoldScopeManifest {
  readonly legalHoldScopeManifestId: string;
  readonly legalHoldRecordRef: string;
  readonly scopeType: LegalHoldScopeType;
  readonly scopeEntityRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly freezeRefs: readonly string[];
  readonly dependencyLinkRefs: readonly string[];
  readonly scopeHash: string;
  readonly capturedAt: string;
}

export interface LegalHoldRecord {
  readonly legalHoldRecordId: string;
  readonly scopeRef: string;
  readonly scopeManifestRef: string;
  readonly scopeHash: string;
  readonly reasonCode: string;
  readonly originType: LegalHoldOriginType;
  readonly placedBy: string;
  readonly placedAt: string;
  readonly reviewDate: string;
  readonly holdState: LegalHoldState;
  readonly freezeRef: string;
  readonly supersedesHoldRef?: string;
  readonly releasedAt?: string;
  readonly releaseReason?: string;
  readonly holdHash: string;
}

export interface DispositionEligibilityAssessment {
  readonly dispositionEligibilityAssessmentId: string;
  readonly artifactRef: string;
  readonly retentionLifecycleBindingRef: string;
  readonly retentionDecisionRef: string;
  readonly activeFreezeRefs: readonly string[];
  readonly activeLegalHoldRefs: readonly string[];
  readonly activeDependencyLinkRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly eligibilityState: DispositionEligibilityState;
  readonly blockingReasonRefs: readonly (typeof dispositionBlockReasonValues)[number][];
  readonly assessmentHash: string;
  readonly assessedAt: string;
}

export interface DependencyClosureResult {
  readonly artifactRef: string;
  readonly dependencyArtifactRefs: readonly string[];
  readonly activeDependencyLinkRefs: readonly string[];
  readonly cycleDetected: boolean;
  readonly cyclePathRefs: readonly string[];
}

function isDispositionBlockingLink(link: ArtifactDependencyLink): boolean {
  return (
    link.activeState === "active" &&
    ["disposal_blocking", "legal_preservation_required", "replay_required"].includes(link.dependencyStrength)
  );
}

export function resolveTransitiveArtifactDependencies(
  artifactRef: string,
  links: readonly ArtifactDependencyLink[],
): DependencyClosureResult {
  const dependencies = new Set<string>();
  const activeLinks = new Set<string>();
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const cyclePathRefs: string[] = [];
  let cycleDetected = false;

  const visit = (current: string, path: readonly string[]): void => {
    if (visiting.has(current)) {
      cycleDetected = true;
      cyclePathRefs.push(...path, current);
      return;
    }
    if (visited.has(current)) {
      return;
    }
    visiting.add(current);
    for (const link of links.filter((candidate) => candidate.artifactRef === current && isDispositionBlockingLink(candidate))) {
      activeLinks.add(link.dependencyLinkId);
      dependencies.add(link.dependentArtifactRef);
      visit(link.dependentArtifactRef, [...path, current]);
    }
    visiting.delete(current);
    visited.add(current);
  };

  visit(artifactRef, []);
  return {
    artifactRef,
    dependencyArtifactRefs: uniqueStrings([...dependencies]),
    activeDependencyLinkRefs: uniqueStrings([...activeLinks]),
    cycleDetected,
    cyclePathRefs: uniqueStrings(cyclePathRefs),
  };
}

export function validateDependencyGraphForDisposition(
  artifactRef: string,
  links: readonly ArtifactDependencyLink[],
): GovernanceValidationResult {
  const closure = resolveTransitiveArtifactDependencies(artifactRef, links);
  const errors = closure.cycleDetected ? [`DEPENDENCY_CYCLE_FAIL_CLOSED:${artifactRef}`] : [];
  return { valid: errors.length === 0, errors };
}

export function validateRetentionClassificationBoundAtCreation(
  binding: RetentionLifecycleBinding,
): GovernanceValidationResult {
  const errors: string[] = [];
  for (const fieldName of [
    "artifactRef",
    "artifactVersionRef",
    "artifactClassRef",
    "retentionClassRef",
    "classificationHash",
    "createdAt",
  ] as const) {
    if (!isNonEmptyString(binding[fieldName])) {
      errors.push(`RETENTION_CREATION_FIELD_MISSING:${fieldName}`);
    }
  }
  if (/^(s3|gs|blob|file):/i.test(binding.artifactClassRef) || binding.artifactClassRef.includes("/")) {
    errors.push("RETENTION_CLASS_INFERRED_FROM_STORAGE_PATH");
  }
  return { valid: errors.length === 0, errors };
}

export function validateDispositionDecisionRequiresAssessment(decision: RetentionDecision): GovernanceValidationResult {
  const errors: string[] = [];
  if (
    ["archive_only", "archive_pending", "delete_pending", "deleted"].includes(decision.effectiveDisposition) &&
    !isNonEmptyString(decision.dispositionEligibilityAssessmentRef)
  ) {
    errors.push(`DISPOSITION_ASSESSMENT_REQUIRED:${decision.retentionDecisionId}`);
  }
  return { valid: errors.length === 0, errors };
}

export interface DispositionEvaluationInput {
  readonly binding: RetentionLifecycleBinding;
  readonly decision: RetentionDecision;
  readonly dependencyLinks: readonly ArtifactDependencyLink[];
  readonly legalHolds: readonly LegalHoldRecord[];
  readonly legalHoldScopeManifests: readonly LegalHoldScopeManifest[];
  readonly assuranceEvidenceGraphSnapshotRef?: string;
  readonly assuranceGraphCompletenessVerdictRef?: string;
  readonly graphHash?: string;
  readonly assessedAt: string;
}

export function evaluateDispositionEligibility(input: DispositionEvaluationInput): DispositionEligibilityAssessment {
  const graphSnapshotRef = input.assuranceEvidenceGraphSnapshotRef ?? input.decision.assuranceEvidenceGraphSnapshotRef;
  const graphVerdictRef =
    input.assuranceGraphCompletenessVerdictRef ?? input.decision.assuranceGraphCompletenessVerdictRef;
  const graphHash = input.graphHash ?? hashAssurancePayload(input.decision.graphEdgeRefs, "phase9.governance.graph");
  const closure = resolveTransitiveArtifactDependencies(input.binding.artifactRef, input.dependencyLinks);
  const dependencyArtifactRefs = new Set(closure.dependencyArtifactRefs);
  const manifestByHoldRef = new Map(
    input.legalHoldScopeManifests.map((manifest) => [manifest.legalHoldRecordRef, manifest] as const),
  );
  const activeLegalHoldRefs = new Set([...input.binding.activeLegalHoldRefs, ...input.decision.activeLegalHoldRefs]);

  for (const hold of input.legalHolds.filter((candidate) => candidate.holdState === "active")) {
    const manifest = manifestByHoldRef.get(hold.legalHoldRecordId);
    if (!manifest) {
      activeLegalHoldRefs.add(hold.legalHoldRecordId);
      continue;
    }
    const scopedArtifacts = new Set(manifest.artifactRefs);
    if (scopedArtifacts.has(input.binding.artifactRef)) {
      activeLegalHoldRefs.add(hold.legalHoldRecordId);
    }
    for (const dependencyArtifactRef of dependencyArtifactRefs) {
      if (scopedArtifacts.has(dependencyArtifactRef)) {
        activeLegalHoldRefs.add(hold.legalHoldRecordId);
      }
    }
  }

  const activeFreezeRefs = uniqueStrings([...input.binding.activeFreezeRefs, ...input.decision.activeFreezeRefs]);
  const blockingReasonRefs = new Set<(typeof dispositionBlockReasonValues)[number]>();
  if (activeFreezeRefs.length > 0) {
    blockingReasonRefs.add("active_retention_freeze");
  }
  if (activeLegalHoldRefs.size > 0) {
    blockingReasonRefs.add("active_legal_hold");
  }
  if (
    input.legalHolds.some((hold) => {
      const manifest = manifestByHoldRef.get(hold.legalHoldRecordId);
      return (
        hold.holdState === "active" &&
        manifest?.artifactRefs.some((artifactRef) => dependencyArtifactRefs.has(artifactRef))
      );
    })
  ) {
    blockingReasonRefs.add("transitive_legal_hold");
  }
  if (closure.activeDependencyLinkRefs.length > 0) {
    blockingReasonRefs.add("active_dependency");
  }
  if (closure.cycleDetected) {
    blockingReasonRefs.add("dependency_cycle");
  }
  if (!isNonEmptyString(graphSnapshotRef) || !isNonEmptyString(graphVerdictRef) || !isNonEmptyString(graphHash)) {
    blockingReasonRefs.add("graph_missing");
  }
  if (graphVerdictRef.includes("blocked") || graphVerdictRef.includes("incomplete")) {
    blockingReasonRefs.add("graph_incomplete");
  }
  if (input.binding.graphCriticality === "worm" || input.binding.graphCriticality === "hash_chained") {
    blockingReasonRefs.add("worm_or_hash_chained");
  }
  if (input.binding.graphCriticality === "replay_critical" && closure.activeDependencyLinkRefs.length > 0) {
    blockingReasonRefs.add("replay_critical_dependency");
  }

  const eligibilityState: DispositionEligibilityState =
    blockingReasonRefs.size > 0
      ? "blocked"
      : input.binding.graphCriticality === "replay_critical"
        ? "archive_only"
        : "delete_allowed";
  const base = {
    dispositionEligibilityAssessmentId: `dea_${hashAssurancePayload(
      {
        artifactRef: input.binding.artifactRef,
        retentionDecisionRef: input.decision.retentionDecisionId,
        assessedAt: input.assessedAt,
      },
      "phase9.governance.disposition.assessment.id",
    ).slice(0, 16)}`,
    artifactRef: input.binding.artifactRef,
    retentionLifecycleBindingRef: input.binding.retentionLifecycleBindingId,
    retentionDecisionRef: input.decision.retentionDecisionId,
    activeFreezeRefs,
    activeLegalHoldRefs: uniqueStrings([...activeLegalHoldRefs]),
    activeDependencyLinkRefs: closure.activeDependencyLinkRefs,
    assuranceEvidenceGraphSnapshotRef: graphSnapshotRef ?? "",
    assuranceGraphCompletenessVerdictRef: graphVerdictRef ?? "",
    graphHash: graphHash ?? "",
    eligibilityState,
    blockingReasonRefs: uniqueStrings([...blockingReasonRefs]) as (typeof dispositionBlockReasonValues)[number][],
    assessedAt: input.assessedAt,
  };
  return withHash(base, "assessmentHash", "phase9.governance.disposition.assessment") as unknown as DispositionEligibilityAssessment;
}

export function validateRecoveryEvidenceWriteback(value: unknown): GovernanceValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["RECOVERY_EVIDENCE_NOT_RECORD"] };
  }
  const errors: string[] = [];
  for (const fieldName of ["assuranceEvidenceGraphSnapshotRef", "assuranceGraphCompletenessVerdictRef", "graphHash"]) {
    if (!isNonEmptyString(value[fieldName])) {
      errors.push(`RECOVERY_EVIDENCE_GRAPH_REF_MISSING:${fieldName}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateIncidentReportabilityEvidence(
  incident: unknown,
  assessment: unknown,
  timelineEntries: readonly unknown[],
): GovernanceValidationResult {
  const errors: string[] = [];
  if (!isRecord(incident)) {
    errors.push("INCIDENT_NOT_RECORD");
  }
  if (!isRecord(assessment)) {
    errors.push("REPORTABILITY_ASSESSMENT_NOT_RECORD");
  }
  if (isRecord(incident) && stringArray(incident.auditEvidenceRefs).length === 0) {
    errors.push("INCIDENT_AUDIT_REFS_REQUIRED");
  }
  if (isRecord(incident) && stringArray(incident.timelineEntryRefs).length === 0) {
    errors.push("INCIDENT_TIMELINE_REFS_REQUIRED");
  }
  if (isRecord(incident) && stringArray(incident.capaSourceBindingRefs).length === 0) {
    errors.push("INCIDENT_CAPA_LINEAGE_REQUIRED");
  }
  if (isRecord(assessment) && stringArray(assessment.auditEvidenceRefs).length === 0) {
    errors.push("REPORTABILITY_AUDIT_REFS_REQUIRED");
  }
  if (timelineEntries.length === 0 || timelineEntries.some((entry) => !isRecord(entry) || !isNonEmptyString(entry.entryHash))) {
    errors.push("INCIDENT_TIMELINE_HASHED_ENTRIES_REQUIRED");
  }
  if (
    isRecord(incident) &&
    isRecord(assessment) &&
    isNonEmptyString(incident.incidentRecordId) &&
    assessment.incidentRef !== incident.incidentRecordId
  ) {
    errors.push("REPORTABILITY_INCIDENT_REF_MISMATCH");
  }
  return { valid: errors.length === 0, errors };
}

export function validateImmutableConfigCannotMutateInPlace(
  previousPublication: unknown,
  nextPublication: unknown,
): GovernanceValidationResult {
  if (!isRecord(previousPublication) || !isRecord(nextPublication)) {
    return { valid: false, errors: ["IMMUTABLE_CONFIG_PUBLICATION_NOT_RECORD"] };
  }
  const errors: string[] = [];
  if (
    previousPublication.immutableConfigPublicationId === nextPublication.immutableConfigPublicationId &&
    hashAssurancePayload(previousPublication, "phase9.governance.config.publication") !==
      hashAssurancePayload(nextPublication, "phase9.governance.config.publication")
  ) {
    errors.push(`IMMUTABLE_CONFIG_MUTATED_IN_PLACE:${String(previousPublication.immutableConfigPublicationId)}`);
  }
  if (
    previousPublication.versionHash === nextPublication.versionHash &&
    previousPublication.publicationHash !== nextPublication.publicationHash
  ) {
    errors.push(`IMMUTABLE_CONFIG_VERSION_HASH_REUSED:${String(previousPublication.versionHash)}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateTenantPolicyPublicationRequiresVersionHash(value: unknown): GovernanceValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["TENANT_POLICY_PUBLICATION_NOT_RECORD"] };
  }
  const errors: string[] = [];
  for (const fieldName of ["tenantId", "policyPackVersionRef", "compiledPolicyBundleRef", "versionHash"]) {
    if (!isNonEmptyString(value[fieldName])) {
      errors.push(`TENANT_POLICY_PUBLICATION_FIELD_MISSING:${fieldName}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateDependencyRiskRecord(value: unknown): GovernanceValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["DEPENDENCY_RISK_NOT_RECORD"] };
  }
  const errors: string[] = [];
  for (const fieldName of ["ownerRef", "scopeRef", "versionRef", "healthState"]) {
    if (!isNonEmptyString(value[fieldName])) {
      errors.push(`DEPENDENCY_RISK_FIELD_MISSING:${fieldName}`);
    }
  }
  if (stringArray(value.evidenceRefs).length === 0) {
    errors.push("DEPENDENCY_RISK_EVIDENCE_REFS_REQUIRED");
  }
  return { valid: errors.length === 0, errors };
}

export function validateGovernanceOverride(value: unknown): GovernanceValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["GOVERNANCE_OVERRIDE_NOT_RECORD"] };
  }
  const errors: string[] = [];
  for (const fieldName of [
    "purposeRef",
    "requestedByRole",
    "idempotencyKey",
    "auditEvidenceRef",
    "expiresAt",
    "rollbackPlanRef",
  ]) {
    if (!isNonEmptyString(value[fieldName])) {
      errors.push(`GOVERNANCE_OVERRIDE_FIELD_MISSING:${fieldName}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateGovernanceTenantIsolation(
  expectedTenantId: string,
  records: readonly { readonly sourceRef: string; readonly tenantId?: string; readonly referencedTenantIds?: readonly string[] }[],
): GovernanceValidationResult {
  const errors: string[] = [];
  for (const record of records) {
    if (record.tenantId && record.tenantId !== expectedTenantId) {
      errors.push(`CROSS_TENANT_RECORD:${record.sourceRef}:${record.tenantId}`);
    }
    for (const referencedTenantId of record.referencedTenantIds ?? []) {
      if (referencedTenantId !== expectedTenantId) {
        errors.push(`CROSS_TENANT_REFERENCE:${record.sourceRef}:${referencedTenantId}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export interface Phase9GovernanceControlFixture {
  readonly schemaVersion: typeof PHASE9_GOVERNANCE_CONTRACT_VERSION;
  readonly generatedAt: string;
  readonly contractNames: readonly Phase9GovernanceContractName[];
  readonly contractSetHash: string;
  readonly examples: Record<Phase9GovernanceContractName, Record<string, unknown>>;
  readonly dispositionClosure: DependencyClosureResult;
  readonly dispositionAssessment: DispositionEligibilityAssessment;
  readonly invariantCoverage: readonly string[];
  readonly downstreamReadiness: Record<string, string>;
}

function fixtureHash(suffix: string): string {
  return hashAssurancePayload({ fixture: "434", suffix }, "phase9.governance.fixture");
}

export function createPhase9GovernanceControlFixture(): Phase9GovernanceControlFixture {
  const generatedAt = "2026-04-27T09:00:00.000Z";
  const graphHash = fixtureHash("assurance-graph");
  const retentionClass = withHash(
    {
      retentionClassId: "rc_434_replay_critical_transcript",
      recordType: "transcript",
      basisRef: "nhs-records-management-code",
      minimumRetention: "P8Y",
      reviewPoint: "P7Y",
      disposalMode: "archive_then_review",
      immutabilityMode: "replay_critical_hash_preserved",
      dependencyCheckPolicyRef: "dependency-policy:transitive-assurance-graph",
      sourcePolicyRef: "policy:records-code-html-current",
      freezeEscalationPolicyRef: "policy:freeze-preservation-first",
      legalHoldEscalationPolicyRef: "policy:legal-hold-preservation-first",
      derivativeRetentionPolicyRef: "policy:derivative-artifacts-follow-source",
      classState: "active",
    },
    "policyTupleHash",
    "phase9.governance.retention.class",
  );
  const lifecycleBinding = withHash(
    {
      retentionLifecycleBindingId: "rlb_434_transcript_001",
      artifactRef: "artifact:transcript:001",
      artifactVersionRef: "artifact-version:transcript:001:v1",
      artifactClassRef: "class:transcript_replay_critical",
      retentionClassRef: retentionClass.retentionClassId,
      disposalMode: "archive_then_review",
      immutabilityMode: "replay_critical_hash_preserved",
      dependencyCheckPolicyRef: "dependency-policy:transitive-assurance-graph",
      minimumRetentionOverrideRef: "override:none",
      activeFreezeRefs: [],
      activeLegalHoldRefs: [],
      graphCriticality: "replay_critical",
      lifecycleState: "active",
      createdAt: generatedAt,
    },
    "classificationHash",
    "phase9.governance.retention.binding",
  ) as unknown as RetentionLifecycleBinding;
  const dependencyLinks = [
    withHash(
      {
        dependencyLinkId: "adl_434_transcript_to_pack",
        artifactRef: "artifact:transcript:001",
        dependentArtifactRef: "artifact:assurance-pack:001",
        governingScopeRef: "scope:tenant-a:episode-001",
        dependencyType: "assurance_pack_input",
        dependencyStrength: "disposal_blocking",
        activeState: "active",
        sourceGraphEdgeRef: "age_432_transcript_pack",
      },
      "linkHash",
      "phase9.governance.dependency.link",
    ),
    withHash(
      {
        dependencyLinkId: "adl_434_pack_to_snapshot",
        artifactRef: "artifact:assurance-pack:001",
        dependentArtifactRef: "artifact:evidence-snapshot:001",
        governingScopeRef: "scope:tenant-a:episode-001",
        dependencyType: "graph_replay_input",
        dependencyStrength: "legal_preservation_required",
        activeState: "active",
        sourceGraphEdgeRef: "age_432_pack_snapshot",
      },
      "linkHash",
      "phase9.governance.dependency.link",
    ),
  ] as unknown as ArtifactDependencyLink[];
  const legalHoldManifest = withHash(
    {
      legalHoldScopeManifestId: "lhsm_434_patient_dispute",
      legalHoldRecordRef: "lhr_434_patient_dispute",
      scopeType: "artifact",
      scopeEntityRefs: ["episode:001"],
      artifactRefs: ["artifact:evidence-snapshot:001"],
      freezeRefs: ["freeze_434_patient_dispute"],
      dependencyLinkRefs: ["adl_434_pack_to_snapshot"],
      capturedAt: generatedAt,
    },
    "scopeHash",
    "phase9.governance.legal-hold.scope",
  ) as unknown as LegalHoldScopeManifest;
  const legalHold = withHash(
    {
      legalHoldRecordId: "lhr_434_patient_dispute",
      scopeRef: "scope:tenant-a:episode-001",
      scopeManifestRef: legalHoldManifest.legalHoldScopeManifestId,
      scopeHash: legalHoldManifest.scopeHash,
      reasonCode: "patient_dispute",
      originType: "patient_dispute",
      placedBy: "governance-user:records-lead",
      placedAt: generatedAt,
      reviewDate: "2026-07-27",
      holdState: "active",
      freezeRef: "freeze_434_patient_dispute",
    },
    "holdHash",
    "phase9.governance.legal-hold.record",
  ) as unknown as LegalHoldRecord;
  const dispositionAssessmentId = `dea_${hashAssurancePayload(
    {
      artifactRef: lifecycleBinding.artifactRef,
      retentionDecisionRef: "rd_434_transcript_001",
      assessedAt: generatedAt,
    },
    "phase9.governance.disposition.assessment.id",
  ).slice(0, 16)}`;
  const retentionDecision = withHash(
    {
      retentionDecisionId: "rd_434_transcript_001",
      artifactRef: lifecycleBinding.artifactRef,
      retentionLifecycleBindingRef: lifecycleBinding.retentionLifecycleBindingId,
      retentionClassRef: lifecycleBinding.retentionClassRef,
      decisionDate: "2026-04-27",
      deleteAfter: "2034-04-27",
      archiveAfter: "2031-04-27",
      activeFreezeRefs: [],
      activeLegalHoldRefs: [],
      assuranceEvidenceGraphSnapshotRef: "aegs_432_current",
      assuranceGraphCompletenessVerdictRef: "agcv_432_complete",
      graphEdgeRefs: ["age_432_transcript_pack", "age_432_pack_snapshot"],
      dispositionEligibilityAssessmentRef: dispositionAssessmentId,
      effectiveDisposition: "blocked",
      supersedesDecisionRef: "rd:none",
    },
    "decisionHash",
    "phase9.governance.retention.decision",
  ) as unknown as RetentionDecision;
  const dispositionAssessment = evaluateDispositionEligibility({
    binding: lifecycleBinding,
    decision: retentionDecision,
    dependencyLinks,
    legalHolds: [legalHold],
    legalHoldScopeManifests: [legalHoldManifest],
    assuranceEvidenceGraphSnapshotRef: "aegs_432_current",
    assuranceGraphCompletenessVerdictRef: "agcv_432_complete",
    graphHash,
    assessedAt: generatedAt,
  });
  const readinessSnapshot = {
    operationalReadinessSnapshotId: "ors_434_release_001",
    releaseRef: "release:phase9:434",
    verificationScenarioRef: "verification:phase9:governance",
    releaseContractVerificationMatrixRef: "rcvm_431_phase8_exit",
    releaseContractMatrixHash: fixtureHash("release-contract-matrix"),
    runtimePublicationBundleRef: "rpb_434_current",
    releasePublicationParityRef: "rpp_434_current",
    releaseWatchTupleRef: "rwt_434_current",
    watchTupleHash: fixtureHash("watch-tuple"),
    waveObservationPolicyRef: "wop_434_current",
    requiredAssuranceSliceRefs: ["slice:assurance-ledger", "slice:retention-governance"],
    releaseTrustFreezeVerdictRefs: ["rtfv_434_live"],
    dashboardBundleRefs: ["dashboard:ops-readiness"],
    runbookBindingRefs: ["rbr_434_restore"],
    syntheticCoverageRefs: ["src_434_patient", "src_434_staff"],
    essentialFunctionRefs: ["essential:digital-intake", "essential:audit-search"],
    essentialFunctionHealthEnvelopeRefs: ["efhe_434_digital_intake"],
    recoveryTierRefs: ["rt_434_tier1"],
    backupSetManifestRefs: ["bsm_434_current"],
    resilienceSurfaceRuntimeBindingRefs: ["rsrb_434_resilience"],
    recoveryControlPostureRefs: ["rcp_434_current"],
    recoveryEvidencePackRefs: ["rep_434_current"],
    latestRecoveryEvidencePackRef: "rep_434_current",
    latestRestoreRunRefs: ["restore_434_clean_env"],
    latestFailoverRunRefs: ["failover_434_degraded"],
    latestChaosRunRefs: ["chaos_434_guardrail"],
    latestJourneyRecoveryProofRefs: ["jrp_434_patient"],
    latestResilienceActionSettlementRefs: ["ras_434_restore"],
    resilienceTupleHash: fixtureHash("resilience-tuple"),
    ownerCoverageState: "complete",
    verdictCoverageState: "exact",
    freshnessState: "fresh",
    rehearsalFreshnessState: "fresh",
    readinessState: "ready",
    capturedAt: generatedAt,
  };
  const commonResilience = {
    releaseRef: readinessSnapshot.releaseRef,
    verificationScenarioRef: readinessSnapshot.verificationScenarioRef,
    releaseContractVerificationMatrixRef: readinessSnapshot.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: readinessSnapshot.releaseContractMatrixHash,
    runtimePublicationBundleRef: readinessSnapshot.runtimePublicationBundleRef,
    releasePublicationParityRef: readinessSnapshot.releasePublicationParityRef,
    releaseWatchTupleRef: readinessSnapshot.releaseWatchTupleRef,
    watchTupleHash: readinessSnapshot.watchTupleHash,
    essentialFunctionRefs: readinessSnapshot.essentialFunctionRefs,
    recoveryTierRefs: readinessSnapshot.recoveryTierRefs,
    operationalReadinessSnapshotRef: readinessSnapshot.operationalReadinessSnapshotId,
    runbookBindingRefs: readinessSnapshot.runbookBindingRefs,
    recoveryControlPostureRef: "rcp_434_current",
    resilienceTupleHash: readinessSnapshot.resilienceTupleHash,
    scopeTupleHash: fixtureHash("scope-tuple"),
  };
  const recoveryControlPosture = {
    recoveryControlPostureId: "rcp_434_current",
    scopeRef: "scope:tenant-a:resilience",
    verificationScenarioRef: readinessSnapshot.verificationScenarioRef,
    releaseContractVerificationMatrixRef: readinessSnapshot.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: readinessSnapshot.releaseContractMatrixHash,
    runtimePublicationBundleRef: readinessSnapshot.runtimePublicationBundleRef,
    releasePublicationParityRef: readinessSnapshot.releasePublicationParityRef,
    releaseWatchTupleRef: readinessSnapshot.releaseWatchTupleRef,
    watchTupleHash: readinessSnapshot.watchTupleHash,
    publicationState: "current",
    trustState: "trusted",
    freezeState: "clear",
    releaseTrustFreezeVerdictRef: "rtfv_434_live",
    operationalReadinessSnapshotRef: readinessSnapshot.operationalReadinessSnapshotId,
    requiredRunbookBindingRefs: readinessSnapshot.runbookBindingRefs,
    recoveryTierRefs: readinessSnapshot.recoveryTierRefs,
    requiredBackupSetManifestRefs: readinessSnapshot.backupSetManifestRefs,
    requiredSyntheticRecoveryCoverageRefs: readinessSnapshot.syntheticCoverageRefs,
    latestRestoreRunRef: "restore_434_clean_env",
    latestFailoverRunRef: "failover_434_degraded",
    latestChaosRunRef: "chaos_434_guardrail",
    currentRecoveryEvidencePackRef: "rep_434_current",
    latestRecoveryEvidencePackRef: "rep_434_current",
    latestResilienceActionSettlementRefs: ["ras_434_restore"],
    restoreValidationFreshnessState: "fresh",
    failoverValidationFreshnessState: "fresh",
    chaosValidationFreshnessState: "fresh",
    dependencyCoverageState: "complete",
    journeyRecoveryCoverageState: "exact",
    backupManifestState: "current",
    evidencePackAdmissibilityState: "exact",
    postureState: "live_control",
    allowedActionRefs: ["restore_validate", "failover_stand_down"],
    blockerRefs: [],
    authoritativeScopeTupleHash: fixtureHash("scope-tuple"),
    controlTupleHash: fixtureHash("control-tuple"),
    releaseRecoveryDispositionRef: "rrd_434_live",
    lastComputedAt: generatedAt,
  };
  const recoveryEvidenceWriteback = {
    recoveryEvidenceArtifactId: "rea_434_restore_report",
    artifactType: "restore_report",
    scopeRef: recoveryControlPosture.scopeRef,
    verificationScenarioRef: readinessSnapshot.verificationScenarioRef,
    releaseContractVerificationMatrixRef: readinessSnapshot.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: readinessSnapshot.releaseContractMatrixHash,
    runtimePublicationBundleRef: readinessSnapshot.runtimePublicationBundleRef,
    releasePublicationParityRef: readinessSnapshot.releasePublicationParityRef,
    releaseWatchTupleRef: readinessSnapshot.releaseWatchTupleRef,
    watchTupleHash: readinessSnapshot.watchTupleHash,
    operationalReadinessSnapshotRef: readinessSnapshot.operationalReadinessSnapshotId,
    recoveryControlPostureRef: recoveryControlPosture.recoveryControlPostureId,
    runbookBindingRefs: readinessSnapshot.runbookBindingRefs,
    backupSetManifestRefs: readinessSnapshot.backupSetManifestRefs,
    producingRunRef: "restore_434_clean_env",
    recoveryEvidencePackRef: "rep_434_current",
    syntheticRecoveryCoverageRefs: readinessSnapshot.syntheticCoverageRefs,
    latestResilienceActionSettlementRefs: ["ras_434_restore"],
    summaryRef: "summary:restore-clean-env",
    assuranceEvidenceGraphSnapshotRef: "aegs_432_current",
    assuranceGraphCompletenessVerdictRef: "agcv_432_complete",
    graphHash,
    artifactPresentationContractRef: "apc_434_recovery",
    artifactSurfaceContextRef: "asc_434_resilience",
    artifactModeTruthProjectionRef: "amtp_434_recovery",
    artifactTransferSettlementRef: "ats_434_recovery",
    artifactFallbackDispositionRef: "afd_434_recovery",
    outboundNavigationGrantPolicyRef: "ongp_434_recovery",
    maskingPolicyRef: "mask_434_minimum_necessary",
    externalHandoffPolicyRef: "ehp_434_governed",
    selectedAnchorRef: "anchor:restore-report",
    returnIntentTokenRef: "return:resilience-board",
    resilienceTupleHash: readinessSnapshot.resilienceTupleHash,
    artifactState: "governed_preview",
  };
  const timelineEntry = withHash(
    {
      incidentTimelineEntryId: "ite_434_detected",
      incidentRef: "inc_434_demo",
      entryType: "detected",
      occurredAt: generatedAt,
      actorRef: "system:security-telemetry",
      summaryRef: "summary:incident-detected",
      auditEvidenceRefs: ["audit_434_incident_detected"],
    },
    "entryHash",
    "phase9.governance.incident.timeline",
  );
  const capaSourceBinding = {
    capaSourceBindingId: "csb_434_incident",
    sourceType: "incident",
    sourceRef: "inc_434_demo",
    incidentRef: "inc_434_demo",
    nearMissReportRef: "near:none",
    reportabilityAssessmentRef: "ra_434_demo",
    capaRef: "capa_434_security_training",
    auditEvidenceRefs: ["audit_434_capa"],
    bindingState: "linked",
    createdAt: generatedAt,
  };
  const incidentRecord = {
    incidentRecordId: "inc_434_demo",
    incidentType: "security_event",
    sourceRef: "security-event:demo",
    detectedAt: generatedAt,
    severity: "medium",
    impactScope: "tenant:a",
    status: "reporting_due",
    reportabilityAssessmentRef: "ra_434_demo",
    auditEvidenceRefs: ["audit_434_incident_detected"],
    timelineEntryRefs: [timelineEntry.incidentTimelineEntryId],
    capaSourceBindingRefs: [capaSourceBinding.capaSourceBindingId],
  };
  const reportabilityAssessment = {
    assessmentId: "ra_434_demo",
    incidentRef: incidentRecord.incidentRecordId,
    frameworkRef: "framework:dspt-reporting",
    decision: "reportable",
    supportingFactsRef: "facts:incident-demo",
    reportedAt: generatedAt,
    auditEvidenceRefs: ["audit_434_reportability"],
    timelineEntryRefs: [timelineEntry.incidentTimelineEntryId],
    capaSourceBindingRefs: [capaSourceBinding.capaSourceBindingId],
  };
  const tenantPolicyPack = {
    tenantPolicyPackId: "tpp_434_tenant_a",
    tenantId: "tenant:a",
    policyPackVersionRef: "ppv_434_governance",
    compiledPolicyBundleRef: "cpb_434_tenant_a",
    domainPackRefs: ["routing", "access", "visibility"],
    effectiveFrom: generatedAt,
    effectiveTo: "2027-04-27T09:00:00.000Z",
    versionHash: fixtureHash("tenant-policy-pack"),
    approvalState: "published",
    publicationRef: "icp_434_tenant_a",
  };
  const immutablePublication = {
    immutableConfigPublicationId: "icp_434_tenant_a",
    tenantId: "tenant:a",
    configVersionRef: "tcv_434_tenant_a",
    compiledPolicyBundleRef: "cpb_434_tenant_a",
    configCompilationRecordRef: "ccr_434_tenant_a",
    standardsDependencyWatchlistRef: "sdw_434_tenant_a",
    compilationTupleHash: fixtureHash("compilation-tuple"),
    standardsWatchlistHash: fixtureHash("standards-watchlist"),
    versionHash: fixtureHash("config-version"),
    publicationHash: fixtureHash("config-publication"),
    publishedBy: "governance-user:release-manager",
    publishedAt: generatedAt,
    publicationState: "published",
  };
  const dependencyRisk = {
    dependencyRiskRecordId: "drr_434_fhir_docs",
    dependencyInventoryRecordRef: "dir_434_fhir_docs",
    ownerRef: "team:platform-governance",
    scopeRef: "scope:tenant-a:integration",
    versionRef: "version:fhir-current",
    healthState: "degraded",
    riskState: "medium",
    evidenceRefs: ["evidence:standards-watchlist"],
    remediationDueAt: "2026-07-27T09:00:00.000Z",
    watchlistRef: "sdw_434_tenant_a",
    recordedAt: generatedAt,
  };
  const policyOverride = {
    policyOverrideRecordId: "por_434_visibility_exception",
    tenantId: "tenant:a",
    policyRef: "visibility:minimum-necessary",
    purposeRef: "purpose:incident-reporting",
    requestedByRole: "records_governance_lead",
    governanceScopeTokenRef: "gst_434_incident",
    idempotencyKey: "por_434_visibility_exception:v1",
    auditEvidenceRef: "audit_434_override",
    expiresAt: "2026-05-27T09:00:00.000Z",
    rollbackPlanRef: "rollback:visibility-exception",
    supersedesOverrideRef: "override:none",
    overrideState: "active",
    createdAt: generatedAt,
  };
  const examples: Record<Phase9GovernanceContractName, Record<string, unknown>> = {
    RetentionLifecycleBinding: lifecycleBinding as unknown as Record<string, unknown>,
    RetentionClass: retentionClass,
    RetentionDecision: retentionDecision as unknown as Record<string, unknown>,
    ArtifactDependencyLink: dependencyLinks[0] as unknown as Record<string, unknown>,
    LegalHoldScopeManifest: legalHoldManifest as unknown as Record<string, unknown>,
    LegalHoldRecord: legalHold as unknown as Record<string, unknown>,
    DispositionEligibilityAssessment: dispositionAssessment as unknown as Record<string, unknown>,
    DispositionBlockReason: {
      reasonCode: "transitive_legal_hold",
      category: "preservation",
      defaultDisposition: "blocked",
      failClosed: true,
      operatorExplainerRef: "explainer:transitive-legal-hold",
    },
    OperationalReadinessSnapshot: readinessSnapshot,
    RestoreRehearsalRecord: {
      restoreRunId: "restore_434_clean_env",
      ...commonResilience,
      targetEnvironmentRef: "env:clean-restore",
      backupSetManifestRefs: readinessSnapshot.backupSetManifestRefs,
      dependencyOrderDigestRef: "dependency-order:restore",
      dependencyProofArtifactRefs: ["artifact:dependency-proof"],
      journeyProofArtifactRefs: ["artifact:journey-proof"],
      syntheticRecoveryCoverageRefs: readinessSnapshot.syntheticCoverageRefs,
      restoreTupleHash: fixtureHash("restore-tuple"),
      dependencyValidationState: "complete",
      journeyValidationState: "complete",
      initiatedAt: "2026-04-27T08:00:00.000Z",
      completedAt: generatedAt,
      resultState: "succeeded",
      evidenceArtifactRefs: ["rea_434_restore_report"],
      recoveryEvidencePackRef: "rep_434_current",
      resilienceActionSettlementRef: "ras_434_restore",
    },
    FailoverRehearsalRecord: {
      failoverRunId: "failover_434_degraded",
      ...commonResilience,
      failoverScenarioRef: "fs_434_degraded_mode",
      failoverTupleHash: fixtureHash("failover-tuple"),
      degradedModeRef: "degraded:read-only-recovery",
      dependencyOrderDigestRef: "dependency-order:failover",
      journeyProofArtifactRefs: ["artifact:failover-journey-proof"],
      syntheticRecoveryCoverageRefs: readinessSnapshot.syntheticCoverageRefs,
      validationState: "complete",
      startedAt: "2026-04-27T08:30:00.000Z",
      completedAt: generatedAt,
      resultState: "stood_down",
      evidenceArtifactRefs: ["rea_434_failover_report"],
      recoveryEvidencePackRef: "rep_434_current",
      resilienceActionSettlementRef: "ras_434_failover",
    },
    ChaosActionDefinition: {
      chaosExperimentId: "chaos_434_guardrail",
      blastRadiusRef: "blast:tenant-a-low",
      essentialFunctionRefs: readinessSnapshot.essentialFunctionRefs,
      recoveryTierRefs: readinessSnapshot.recoveryTierRefs,
      hypothesisRef: "hypothesis:dependency-timeout-preserves-readiness",
      guardrailRefs: ["guardrail:halt-on-patient-impact"],
      requiredSyntheticRecoveryCoverageRefs: readinessSnapshot.syntheticCoverageRefs,
      releasePublicationParityRef: readinessSnapshot.releasePublicationParityRef,
      releaseWatchTupleRef: readinessSnapshot.releaseWatchTupleRef,
      approvalPolicyRef: "approval:chaos-two-person",
      approvedScopeTupleHash: fixtureHash("scope-tuple"),
      experimentHash: fixtureHash("chaos-experiment"),
      experimentState: "approved",
    },
    RecoveryControlPosture: recoveryControlPosture,
    RecoveryEvidenceWriteback: recoveryEvidenceWriteback,
    ProjectionRebuildPlan: {
      projectionRebuildPlanId: "prp_434_ops_projection",
      projectionFamilyRef: "projection:ops-overview",
      scopeRef: "scope:tenant-a:ops",
      triggerRef: "trigger:recovery-evidence-writeback",
      sourceSnapshotRef: "snapshot:before-restore",
      targetSnapshotRef: "snapshot:after-restore",
      assuranceEvidenceGraphSnapshotRef: "aegs_432_current",
      assuranceGraphCompletenessVerdictRef: "agcv_432_complete",
      graphHash,
      dependencyMapRef: "rdm_434_resilience",
      rebuildTupleHash: fixtureHash("projection-rebuild"),
      planState: "planned",
      createdAt: generatedAt,
    },
    RecoveryDependencyMap: {
      recoveryDependencyMapId: "rdm_434_resilience",
      scopeRef: "scope:tenant-a:resilience",
      essentialFunctionRefs: readinessSnapshot.essentialFunctionRefs,
      dependencyOrderRef: "dependency-order:restore",
      dependencyLinkRefs: dependencyLinks.map((link) => link.dependencyLinkId),
      backupSetManifestRefs: readinessSnapshot.backupSetManifestRefs,
      restoreProofArtifactRefs: ["artifact:dependency-proof"],
      graphHash,
      mapState: "current",
      capturedAt: generatedAt,
    },
    IncidentRecord: incidentRecord,
    NearMissReport: {
      nearMissReportId: "nmr_434_demo",
      reportedBy: "operator:demo",
      contextRef: "context:incident-desk",
      summaryRef: "summary:near-miss",
      investigationState: "linked",
      linkedIncidentRef: incidentRecord.incidentRecordId,
      auditEvidenceRefs: ["audit_434_near_miss"],
      timelineEntryRefs: [timelineEntry.incidentTimelineEntryId],
    },
    ReportabilityAssessment: reportabilityAssessment,
    SecurityEventTriageRecord: {
      securityEventTriageRecordId: "setr_434_demo",
      incidentRef: incidentRecord.incidentRecordId,
      eventRef: "security-event:demo",
      triagedBy: "operator:security",
      triagedAt: generatedAt,
      severity: "medium",
      triageState: "classified",
      auditEvidenceRefs: ["audit_434_triage"],
    },
    IncidentTimelineEntry: timelineEntry,
    CAPASourceBinding: capaSourceBinding,
    JustCultureReport: {
      justCultureReportId: "jcr_434_demo",
      sourceRef: incidentRecord.incidentRecordId,
      reportedBy: "operator:demo",
      contextRef: "context:incident-desk",
      summaryRef: "summary:just-culture",
      outcomeState: "process_fix",
      supportingEvidenceRefs: ["evidence:incident-review"],
      auditEvidenceRefs: ["audit_434_just_culture"],
      createdAt: generatedAt,
    },
    NotificationEscalationObligationRecord: {
      notificationEscalationObligationRecordId: "neor_434_dspt",
      incidentRef: incidentRecord.incidentRecordId,
      obligationType: "dspt-reporting",
      frameworkRef: "framework:dspt",
      recipientScopeRef: "recipient:ig-lead",
      dueAt: "2026-04-28T09:00:00.000Z",
      completedAt: generatedAt,
      status: "sent",
      auditEvidenceRefs: ["audit_434_notification"],
    },
    TenantPolicyPack: tenantPolicyPack,
    TenantConfigurationVersion: {
      tenantConfigurationVersionId: "tcv_434_tenant_a",
      tenantId: "tenant:a",
      configVersionId: "cv_434_tenant_a",
      scope: "tenant:a",
      hash: fixtureHash("config-version"),
      parentVersionRef: "cv_433_tenant_a",
      changedBy: "governance-user:config-lead",
      changedAt: generatedAt,
      changeType: "standards_watchlist_refresh",
      attestationRef: "attestation:config-compile",
      state: "published",
    },
    ImmutableConfigPublication: immutablePublication,
    DependencyInventoryRecord: {
      dependencyInventoryRecordId: "dir_434_fhir_docs",
      tenantId: "tenant:a",
      dependencyCode: "nhs-fhir-docs",
      sourceAuthority: "NHS England",
      currentVersion: "current",
      ownerRef: dependencyRisk.ownerRef,
      scopeRef: dependencyRisk.scopeRef,
      supportState: "maintenance_only",
      legacyRiskState: "medium",
      healthState: "degraded",
      evidenceRefs: dependencyRisk.evidenceRefs,
      replacementPathRef: "replacement:current-fhir-docs",
      recordedAt: generatedAt,
    },
    DependencyRiskRecord: dependencyRisk,
    StandardsFrameworkVersionBinding: {
      standardsFrameworkVersionBindingId: "sfvb_434_dtac",
      tenantId: "tenant:a",
      frameworkCode: "DTAC",
      currentVersionRef: "dtac:current",
      newVersionRef: "dtac:refreshed",
      standardsDependencyWatchlistRef: "sdw_434_tenant_a",
      candidateBundleHash: fixtureHash("candidate-bundle"),
      ownerRef: "team:clinical-safety",
      impactAssessmentRef: "impact:dtac-refresh",
      bindingState: "impact_review",
      boundAt: generatedAt,
    },
    PolicyOverrideRecord: policyOverride,
    AdminActionSettlement: {
      adminActionSettlementId: "aas_434_override",
      adminActionRecordRef: "aar_434_override",
      result: "promoted_pending_wave",
      recoveryActionRef: "recovery:watch-tuple-refresh",
      recordedAt: generatedAt,
      idempotencyKey: policyOverride.idempotencyKey,
      scopeTupleHash: fixtureHash("scope-tuple"),
      auditEvidenceRefs: ["audit_434_admin_settlement"],
    },
  };
  return {
    schemaVersion: PHASE9_GOVERNANCE_CONTRACT_VERSION,
    generatedAt,
    contractNames: [...REQUIRED_PHASE9_GOVERNANCE_CONTRACTS],
    contractSetHash: orderedSetHash(phase9GovernanceContractDefinitions, "phase9.governance.contract-set"),
    examples,
    dispositionClosure: resolveTransitiveArtifactDependencies(lifecycleBinding.artifactRef, dependencyLinks),
    dispositionAssessment,
    invariantCoverage: [
      "retention classification bound at artifact creation and not inferred from storage paths",
      "legal hold and retention freeze share one preservation-first control plane",
      "disposition requires explicit DispositionEligibilityAssessment",
      "graph-critical, WORM, replay-critical, hash-chained, and assurance-pack dependencies fail closed",
      "artifact dependencies are transitive and can block disposition",
      "restore, failover, and recovery evidence writes back into the assurance graph",
      "incident, near-miss, and reportability records preserve audit refs and CAPA lineage",
      "tenant config changes are immutable, versioned, published, and auditable",
      "dependency inventory and risk records carry owner, scope, version, health, and evidence refs",
      "governance overrides require purpose, role, idempotency, audit, expiry, and rollback or supersession",
    ],
    downstreamReadiness: {
      "435": "BAU and exit gates can consume immutable governance-control readiness, incident, retention, and dependency contracts.",
      "436": "governance shell routes can consume contract names and fixture shapes without inferring lifecycle from storage.",
      "437": "operations board can consume readiness, recovery posture, and recovery evidence graph writeback contracts.",
      "441": "CAPA and incident learning can consume incident lineage, reportability, and just-culture bindings.",
      "442": "records lifecycle and disposition workflows can consume retention, hold, dependency, and eligibility contracts.",
    },
  };
}

export function phase9GovernanceContractMatrixToCsv(
  definitions: readonly Phase9GovernanceContractDefinition[] = phase9GovernanceContractDefinitions,
): string {
  const rows = ["contractName,sourceAlgorithmRef,sourceObjectAlias,requiredFieldCount,enumFieldCount,identityKey"];
  for (const definition of definitions) {
    rows.push(
      [
        definition.contractName,
        definition.sourceAlgorithmRef,
        definition.sourceObjectAlias ?? "",
        String(definition.requiredFields.length),
        String(Object.keys(definition.enumValues).length),
        definition.identityKeys[0] ?? "",
      ]
        .map((value) => JSON.stringify(value))
        .join(","),
    );
  }
  return `${rows.join("\n")}\n`;
}

export function summarizePhase9GovernanceContractFreeze(
  fixture: Phase9GovernanceControlFixture = createPhase9GovernanceControlFixture(),
): string {
  return [
    "# Phase 9 Governance Control Contract Freeze",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Contract count: ${fixture.contractNames.length}`,
    `Contract set hash: ${fixture.contractSetHash}`,
    `Disposition assessment state: ${fixture.dispositionAssessment.eligibilityState}`,
    `Disposition blockers: ${fixture.dispositionAssessment.blockingReasonRefs.join(", ")}`,
    `Transitive dependency count: ${fixture.dispositionClosure.dependencyArtifactRefs.length}`,
    "",
    "## Frozen Families",
    "",
    "- Retention, legal hold, disposition, dependency, and disposition-block reasons.",
    "- Operational readiness, restore/failover rehearsal, chaos action, recovery posture, writeback, rebuild, and dependency map.",
    "- Incident, near-miss, triage, reportability, timeline, CAPA, just-culture, and notification obligations.",
    "- Tenant policy, tenant config, immutable publication, dependency hygiene, standards binding, overrides, and admin settlements.",
    "",
    "## Invariants",
    "",
    ...fixture.invariantCoverage.map((entry) => `- ${entry}`),
    "",
  ].join("\n");
}

export function phase9GovernanceAlgorithmAlignmentNotes(): string {
  return [
    "# Phase 9 Governance Algorithm Alignment Notes",
    "",
    "Retention lifecycle freezes the 9E algorithm by minting creation-time RetentionLifecycleBinding records, refusing path-derived class inference, and requiring explicit DispositionEligibilityAssessment records before archive or delete posture can materialize.",
    "",
    "Legal hold and retention freeze are modelled as one preservation-first plane. Active holds, freezes, dependency cycles, graph incompleteness, WORM, hash-chained, replay-critical, and assurance-pack dependencies fail closed.",
    "",
    "Resilience contracts freeze 9F by binding restore, failover, chaos, readiness, recovery posture, and recovery evidence writeback to the same release, watch tuple, readiness snapshot, graph snapshot, completeness verdict, and graph hash.",
    "",
    "Incident contracts freeze 9G by keeping incident, near-miss, reportability, timeline, CAPA, just-culture, notification, and audit refs in one lineage so reporting and learning cannot detach from evidence.",
    "",
    "Tenant governance contracts freeze 9H by making policy packs, config versions, immutable config publications, dependency inventory/risk, standards bindings, overrides, and admin settlements versioned, hashable, auditable, and tenant-scoped.",
    "",
  ].join("\n");
}
