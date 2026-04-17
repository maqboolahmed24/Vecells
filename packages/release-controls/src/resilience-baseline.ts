import { stableDigest, type BuildProvenanceState } from "./build-provenance";

export type BackupJobKind =
  | "transactional_snapshot"
  | "fhir_snapshot"
  | "object_manifest"
  | "event_log_export"
  | "projection_snapshot"
  | "worm_audit_export";

export type BackupManifestState = "current" | "stale" | "missing";
export type BackupImmutabilityState = "immutable" | "worm_ready" | "append_only";
export type RunbookBindingState = "current" | "stale" | "rehearsal_due";
export type RestoreRunStage =
  | "backup_verified"
  | "restore_started"
  | "data_restored"
  | "journey_validation_pending"
  | "journey_validated"
  | "blocked";
export type RestoreRunState =
  | "journey_validated"
  | "journey_validation_pending"
  | "data_restored"
  | "blocked";
export type RecoveryEvidencePackState = "current" | "stale" | "blocked" | "superseded";
export type OperationalReadinessState =
  | "exact_and_ready"
  | "stale_rehearsal_evidence"
  | "missing_backup_manifest"
  | "blocked_restore_proof"
  | "tuple_drift"
  | "assurance_or_freeze_blocked";
export type EssentialFunctionState = "mapped" | "rehearsal_due" | "recovery_only";
export type RecoveryTierCode = "tier_0" | "tier_1" | "tier_2" | "tier_3";
export type ValidationSeverity = "error" | "warning";

export interface ResilienceValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  memberRefs: readonly string[];
}

export interface EssentialFunctionRecoveryBinding {
  essentialFunctionMapId: string;
  functionCode: string;
  functionLabel: string;
  functionGroup: string;
  recoveryTierRef: string;
  requiredBackupScopeRefs: readonly string[];
  requiredJourneyProofRefs: readonly string[];
  currentRunbookBindingRefs: readonly string[];
  requiredAssuranceSliceRefs: readonly string[];
  degradedModeRefs: readonly string[];
  continuityControlRefs: readonly string[];
  functionState: EssentialFunctionState;
  currentOperationalReadinessSnapshotRef: string | null;
  sourceRefs: readonly string[];
}

export interface RecoveryTierRecord {
  recoveryTierId: string;
  functionCode: string;
  functionLabel: string;
  tierCode: RecoveryTierCode;
  rto: string;
  rpo: string;
  restorePriority: number;
  requiredBackupScopeRefs: readonly string[];
  requiredJourneyProofRefs: readonly string[];
  tierState: "active" | "constrained";
  sourceRefs: readonly string[];
}

export interface BackupScopeDefinition {
  datasetScopeRef: string;
  datasetLabel: string;
  storeRef: string;
  storeClass: string;
  backupJobKind: BackupJobKind;
  retentionPolicyRef: string;
  immutabilityState: BackupImmutabilityState;
  sourceRefs: readonly string[];
}

export interface BackupSourceDigest {
  sourceRef: string;
  relativePath: string;
  digest: string;
  sizeBytes: number;
}

export interface BackupSetManifest {
  backupSetManifestId: string;
  environmentRing: string;
  datasetScopeRef: string;
  datasetLabel: string;
  storeRef: string;
  storeClass: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  buildProvenanceRef: string;
  previewEnvironmentRef: string | null;
  backupJobRef: string;
  backupJobKind: BackupJobKind;
  essentialFunctionRefs: readonly string[];
  sourceDigestEntries: readonly BackupSourceDigest[];
  backupArtifactRef: string;
  backupArtifactDigest: string;
  retentionPolicyRef: string;
  immutabilityState: BackupImmutabilityState;
  restoreCompatibilityDigestRef: string;
  manifestTupleHash: string;
  manifestState: BackupManifestState;
  capturedAt: string;
  verifiedAt: string;
  blockerRefs: readonly string[];
  sourceRefs: readonly string[];
}

export interface RunbookBindingRecord {
  runbookBindingRecordId: string;
  functionCode: string;
  runbookRef: string;
  environmentRing: string;
  runtimePublicationBundleRef: string;
  releaseWatchTupleRef: string;
  buildProvenanceRef: string;
  resilienceTupleHash: string;
  bindingState: RunbookBindingState;
  ownerRef: string;
  lastRehearsedAt: string | null;
  freshnessDeadlineAt: string | null;
  blockerRefs: readonly string[];
  sourceRefs: readonly string[];
}

export interface RestoreRunStageRecord {
  stage: RestoreRunStage;
  state: "completed" | "pending" | "blocked";
  recordedAt: string;
  evidenceRefs: readonly string[];
  reason: string;
}

export interface RestoreRun {
  restoreRunId: string;
  environmentRing: string;
  functionCode: string;
  restoreTargetRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  buildProvenanceRef: string;
  backupSetManifestRefs: readonly string[];
  runbookBindingRefs: readonly string[];
  requiredJourneyProofRefs: readonly string[];
  expectedResilienceTupleHash: string;
  observedResilienceTupleHash: string;
  restoreState: RestoreRunState;
  stageRecords: readonly RestoreRunStageRecord[];
  initiatedAt: string;
  completedAt: string | null;
  blockerRefs: readonly string[];
  evidenceDigest: string;
  sourceRefs: readonly string[];
}

export interface RecoveryEvidencePack {
  recoveryEvidencePackId: string;
  environmentRing: string;
  functionCode: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  buildProvenanceRef: string;
  resilienceTupleHash: string;
  backupSetManifestRefs: readonly string[];
  runbookBindingRefs: readonly string[];
  restoreRunRef: string;
  syntheticJourneyProofRefs: readonly string[];
  evidenceArtifactRefs: readonly string[];
  packState: RecoveryEvidencePackState;
  generatedAt: string;
  validUntil: string;
  blockerRefs: readonly string[];
  sourceRefs: readonly string[];
}

export interface OperationalReadinessFunctionVerdict {
  functionCode: string;
  recoveryTierRef: string;
  runbookBindingState: RunbookBindingState;
  backupManifestState: BackupManifestState;
  restoreState: RestoreRunState;
  evidencePackState: RecoveryEvidencePackState;
  readinessState: OperationalReadinessState;
  blockerRefs: readonly string[];
}

export interface OperationalReadinessSnapshot {
  operationalReadinessSnapshotId: string;
  environmentRing: string;
  previewEnvironmentRef: string | null;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  buildProvenanceRef: string;
  buildProvenanceState: BuildProvenanceState;
  resilienceTupleHash: string;
  requiredAssuranceSliceRefs: readonly string[];
  activeFreezeRefs: readonly string[];
  essentialFunctionRefs: readonly string[];
  backupSetManifestRefs: readonly string[];
  runbookBindingRefs: readonly string[];
  latestRestoreRunRefs: readonly string[];
  latestRecoveryEvidencePackRefs: readonly string[];
  readinessState: OperationalReadinessState;
  blockerRefs: readonly string[];
  freshnessCeilingAt: string;
  compiledAt: string;
  functionVerdicts: readonly OperationalReadinessFunctionVerdict[];
  sourceRefs: readonly string[];
}

export interface ResilienceTupleMembers {
  environmentRing: string;
  previewEnvironmentRef: string | null;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  buildProvenanceRef: string;
  requiredAssuranceSliceRefs: readonly string[];
  activeFreezeRefs: readonly string[];
}

export interface BackupManifestGenerationInput {
  tuple: ResilienceTupleMembers;
  scope: BackupScopeDefinition;
  essentialFunctionRefs: readonly string[];
  sourceDigestEntries: readonly BackupSourceDigest[];
  capturedAt: string;
  manifestState?: BackupManifestState;
  blockerRefs?: readonly string[];
}

export interface RestoreRehearsalInput {
  tuple: ResilienceTupleMembers;
  functionCode: string;
  restoreTargetRef: string;
  backupSetManifestRefs: readonly string[];
  runbookBindingRefs: readonly string[];
  requiredJourneyProofRefs: readonly string[];
  initiatedAt: string;
  completedAt?: string | null;
  journeyValidationState: "validated" | "pending";
  blockerRefs?: readonly string[];
  observedResilienceTupleHash?: string;
}

export interface RecoveryEvidencePackInput {
  tuple: ResilienceTupleMembers;
  functionCode: string;
  backupSetManifestRefs: readonly string[];
  runbookBindingRefs: readonly string[];
  restoreRunRef: string;
  syntheticJourneyProofRefs: readonly string[];
  generatedAt: string;
  validUntil: string;
  evidenceArtifactRefs?: readonly string[];
  blockerRefs?: readonly string[];
  forcedPackState?: RecoveryEvidencePackState;
}

export interface OperationalReadinessCompilationInput {
  tuple: ResilienceTupleMembers;
  buildProvenanceState: BuildProvenanceState;
  compiledAt: string;
  essentialFunctions: readonly EssentialFunctionRecoveryBinding[];
  recoveryTiers: readonly RecoveryTierRecord[];
  backupManifests: readonly BackupSetManifest[];
  runbookBindings: readonly RunbookBindingRecord[];
  restoreRuns: readonly RestoreRun[];
  evidencePacks: readonly RecoveryEvidencePack[];
}

export interface ResilienceBaselineValidationResult {
  valid: boolean;
  blockerRefs: readonly string[];
  issues: readonly ResilienceValidationIssue[];
}

export interface ResilienceBaselineScenario {
  scenarioId: string;
  environmentRing: string;
  expectedReadinessState: OperationalReadinessState;
  snapshot: OperationalReadinessSnapshot;
  manifests: readonly BackupSetManifest[];
  runbookBindings: readonly RunbookBindingRecord[];
  restoreRuns: readonly RestoreRun[];
  evidencePacks: readonly RecoveryEvidencePack[];
}

export interface ResilienceBaselineSimulationHarness {
  scenario: ResilienceBaselineScenario;
  essentialFunctions: readonly EssentialFunctionRecoveryBinding[];
  recoveryTiers: readonly RecoveryTierRecord[];
  backupScopes: readonly BackupScopeDefinition[];
  manifestValidation: ResilienceBaselineValidationResult;
  snapshotValidation: ResilienceBaselineValidationResult;
}

export const canonicalBackupScopes: readonly BackupScopeDefinition[] = [
  {
    datasetScopeRef: "backup-scope://transactional-domain",
    datasetLabel: "Transactional domain and settlement authority",
    storeRef: "store_domain_transaction",
    storeClass: "transactional_domain",
    backupJobKind: "transactional_snapshot",
    retentionPolicyRef: "ret_transactional_domain_backup",
    immutabilityState: "immutable",
    sourceRefs: [
      "data/analysis/store_and_retention_matrix.csv#store_domain_transaction",
      "docs/architecture/85_data_plane_truth_layer_and_fhir_separation_rules.md",
    ],
  },
  {
    datasetScopeRef: "backup-scope://fhir-representation",
    datasetLabel: "FHIR representation and exchange bundle materialization",
    storeRef: "store_fhir_representation",
    storeClass: "fhir_representation",
    backupJobKind: "fhir_snapshot",
    retentionPolicyRef: "ret_fhir_representation_backup",
    immutabilityState: "immutable",
    sourceRefs: [
      "data/analysis/fhir_store_manifest.json",
      "docs/architecture/85_data_plane_truth_layer_and_fhir_separation_rules.md",
    ],
  },
  {
    datasetScopeRef: "backup-scope://projection-read-models",
    datasetLabel: "Audience projection read models and route continuity state",
    storeRef: "store_projection_read_models",
    storeClass: "projection_read",
    backupJobKind: "projection_snapshot",
    retentionPolicyRef: "ret_projection_backup",
    immutabilityState: "append_only",
    sourceRefs: [
      "data/analysis/store_and_retention_matrix.csv#store_projection_read_models",
      "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
    ],
  },
  {
    datasetScopeRef: "backup-scope://object-artifacts",
    datasetLabel: "Governed object storage, evidence payloads, and presentation artifacts",
    storeRef: "store_artifact_objects",
    storeClass: "object_artifact",
    backupJobKind: "object_manifest",
    retentionPolicyRef: "ret_object_artifact_backup",
    immutabilityState: "worm_ready",
    sourceRefs: [
      "data/analysis/object_storage_class_manifest.json",
      "docs/architecture/86_object_storage_and_retention_design.md",
    ],
  },
  {
    datasetScopeRef: "backup-scope://event-spine",
    datasetLabel: "Canonical event spine, replay queues, and checkpoint durability",
    storeRef: "store_event_spine",
    storeClass: "event_log",
    backupJobKind: "event_log_export",
    retentionPolicyRef: "ret_event_spine_backup",
    immutabilityState: "immutable",
    sourceRefs: [
      "data/analysis/event_broker_topology_manifest.json",
      "docs/architecture/87_event_spine_and_queueing_design.md",
    ],
  },
  {
    datasetScopeRef: "backup-scope://worm-audit",
    datasetLabel: "WORM audit ledger, restore evidence, and provenance witnesses",
    storeRef: "sink_worm_audit_ledger",
    storeClass: "worm_audit",
    backupJobKind: "worm_audit_export",
    retentionPolicyRef: "ret_worm_audit_backup",
    immutabilityState: "worm_ready",
    sourceRefs: [
      "data/analysis/build_provenance_manifest.json",
      "data/analysis/recovery_evidence_artifact_catalog.csv",
    ],
  },
] as const;

export const canonicalRecoveryTiers: readonly RecoveryTierRecord[] = [
  {
    recoveryTierId: "RTC_101_PATIENT_ENTRY",
    functionCode: "ef_patient_entry_recovery",
    functionLabel: "Patient entry, intake, and secure-link recovery",
    tierCode: "tier_1",
    rto: "PT30M",
    rpo: "PT5M",
    restorePriority: 1,
    requiredBackupScopeRefs: [
      "backup-scope://transactional-domain",
      "backup-scope://event-spine",
      "backup-scope://worm-audit",
    ],
    requiredJourneyProofRefs: [
      "journey://patient-entry/intake-resume",
      "journey://patient-entry/secure-link-recovery",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "docs/architecture/60_recovery_tier_and_essential_function_policy.md",
    ],
  },
  {
    recoveryTierId: "RTC_101_PATIENT_SELF_SERVICE",
    functionCode: "ef_patient_self_service_continuity",
    functionLabel: "Patient home, requests, messages, and appointments continuity",
    tierCode: "tier_1",
    rto: "PT30M",
    rpo: "PT5M",
    restorePriority: 1,
    requiredBackupScopeRefs: [
      "backup-scope://projection-read-models",
      "backup-scope://transactional-domain",
      "backup-scope://worm-audit",
    ],
    requiredJourneyProofRefs: [
      "journey://patient-self-service/home",
      "journey://patient-self-service/request-continuity",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "docs/architecture/60_recovery_tier_and_essential_function_policy.md",
    ],
  },
  {
    recoveryTierId: "RTC_101_WORKSPACE_SETTLEMENT",
    functionCode: "ef_workspace_settlement",
    functionLabel: "Workspace triage, clinician decision, and settlement",
    tierCode: "tier_1",
    rto: "PT45M",
    rpo: "PT10M",
    restorePriority: 2,
    requiredBackupScopeRefs: [
      "backup-scope://transactional-domain",
      "backup-scope://projection-read-models",
      "backup-scope://event-spine",
      "backup-scope://worm-audit",
    ],
    requiredJourneyProofRefs: [
      "journey://workspace/task-completion",
      "journey://workspace/lease-fence-replay",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "docs/architecture/60_recovery_tier_and_essential_function_policy.md",
    ],
  },
  {
    recoveryTierId: "RTC_101_BOOKING_CAPACITY",
    functionCode: "ef_booking_capacity_commit",
    functionLabel: "Booking confirmation, waitlist, and capacity commit",
    tierCode: "tier_2",
    rto: "PT60M",
    rpo: "PT15M",
    restorePriority: 3,
    requiredBackupScopeRefs: [
      "backup-scope://transactional-domain",
      "backup-scope://event-spine",
      "backup-scope://worm-audit",
    ],
    requiredJourneyProofRefs: [
      "journey://booking/confirmation",
      "journey://booking/waitlist-restore",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "docs/architecture/60_recovery_tier_and_essential_function_policy.md",
    ],
  },
  {
    recoveryTierId: "RTC_101_HUB_COORDINATION",
    functionCode: "ef_hub_coordination",
    functionLabel: "Hub queue and cross-organisation coordination",
    tierCode: "tier_2",
    rto: "PT60M",
    rpo: "PT15M",
    restorePriority: 4,
    requiredBackupScopeRefs: [
      "backup-scope://transactional-domain",
      "backup-scope://event-spine",
      "backup-scope://worm-audit",
    ],
    requiredJourneyProofRefs: [
      "journey://hub/queue-reopen",
      "journey://hub/cross-organisation-coordination",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "docs/architecture/60_recovery_tier_and_essential_function_policy.md",
    ],
  },
  {
    recoveryTierId: "RTC_101_PHARMACY_RECONCILIATION",
    functionCode: "ef_pharmacy_referral_reconciliation",
    functionLabel: "Pharmacy dispatch, consent, and outcome reconciliation",
    tierCode: "tier_2",
    rto: "PT60M",
    rpo: "PT20M",
    restorePriority: 5,
    requiredBackupScopeRefs: [
      "backup-scope://transactional-domain",
      "backup-scope://object-artifacts",
      "backup-scope://fhir-representation",
      "backup-scope://worm-audit",
    ],
    requiredJourneyProofRefs: [
      "journey://pharmacy/referral-dispatch",
      "journey://pharmacy/outcome-reconciliation",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "docs/architecture/60_recovery_tier_and_essential_function_policy.md",
    ],
  },
  {
    recoveryTierId: "RTC_101_COMMUNICATION_REACHABILITY",
    functionCode: "ef_communication_reachability",
    functionLabel: "Communication, callback, and reachability repair",
    tierCode: "tier_1",
    rto: "PT45M",
    rpo: "PT10M",
    restorePriority: 2,
    requiredBackupScopeRefs: [
      "backup-scope://transactional-domain",
      "backup-scope://object-artifacts",
      "backup-scope://event-spine",
      "backup-scope://worm-audit",
    ],
    requiredJourneyProofRefs: [
      "journey://communications/reachability-repair",
      "journey://communications/callback-resume",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "docs/architecture/60_recovery_tier_and_essential_function_policy.md",
    ],
  },
  {
    recoveryTierId: "RTC_101_RELEASE_GOVERNANCE",
    functionCode: "ef_release_governance",
    functionLabel: "Release governance, tuple parity, and live wave control",
    tierCode: "tier_0",
    rto: "PT20M",
    rpo: "PT0M",
    restorePriority: 0,
    requiredBackupScopeRefs: [
      "backup-scope://projection-read-models",
      "backup-scope://event-spine",
      "backup-scope://worm-audit",
    ],
    requiredJourneyProofRefs: [
      "journey://release/watch-tuple",
      "journey://release/rollback-readiness",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "docs/architecture/97_wave_observation_and_watch_tuple_pipeline.md",
    ],
  },
  {
    recoveryTierId: "RTC_101_PLATFORM_RECOVERY_CONTROL",
    functionCode: "ef_platform_recovery_control",
    functionLabel: "Operational readiness, restore authority, and recovery activation",
    tierCode: "tier_0",
    rto: "PT15M",
    rpo: "PT0M",
    restorePriority: 0,
    requiredBackupScopeRefs: canonicalBackupScopes.map((scope) => scope.datasetScopeRef),
    requiredJourneyProofRefs: [
      "journey://resilience/restore-baseline",
      "journey://resilience/readiness-compile",
    ],
    tierState: "active",
    sourceRefs: [
      "prompt/101.md",
      "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    ],
  },
] as const;

export const canonicalEssentialFunctionMap: readonly EssentialFunctionRecoveryBinding[] =
  canonicalRecoveryTiers.map((tier) => ({
    essentialFunctionMapId: `EFM_101_${tier.functionCode.toUpperCase()}`,
    functionCode: tier.functionCode,
    functionLabel: tier.functionLabel,
    functionGroup:
      tier.functionCode === "ef_release_governance" || tier.functionCode === "ef_platform_recovery_control"
        ? "governance"
        : tier.functionCode.includes("patient")
          ? "patient"
          : tier.functionCode.includes("workspace")
            ? "staff"
            : tier.functionCode.includes("booking")
              ? "booking"
              : tier.functionCode.includes("hub")
                ? "hub"
                : tier.functionCode.includes("pharmacy")
                  ? "pharmacy"
                  : "communication",
    recoveryTierRef: tier.recoveryTierId,
    requiredBackupScopeRefs: tier.requiredBackupScopeRefs,
    requiredJourneyProofRefs: tier.requiredJourneyProofRefs,
    currentRunbookBindingRefs: [`RBR_101_${tier.functionCode.toUpperCase()}`],
    requiredAssuranceSliceRefs: [
      "asr_runtime_topology_tuple",
      "asr_release_watch_tuple",
      "asr_restore_readiness",
    ],
    degradedModeRefs: [`DMD_101_${tier.functionCode.toUpperCase()}_RECOVERY_ONLY`],
    continuityControlRefs:
      tier.functionCode === "ef_release_governance"
        ? ["release_watch", "rollback_readiness"]
        : tier.functionCode === "ef_platform_recovery_control"
          ? ["restore_authority", "operational_readiness"]
          : [
              `${tier.functionCode.replace(/^ef_/, "")}_continuity`,
              `${tier.functionCode.replace(/^ef_/, "")}_degraded_mode`,
            ],
    functionState:
      tier.functionCode === "ef_release_governance" || tier.functionCode === "ef_platform_recovery_control"
        ? "recovery_only"
        : "mapped",
    currentOperationalReadinessSnapshotRef: null,
    sourceRefs: tier.sourceRefs,
  }));

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function createIssue(
  code: string,
  message: string,
  memberRefs: readonly string[] = [],
  severity: ValidationSeverity = "error",
): ResilienceValidationIssue {
  return { code, severity, message, memberRefs };
}

function addMinutes(isoTimestamp: string, minutes: number): string {
  const baseline = new Date(isoTimestamp).getTime();
  return new Date(baseline + minutes * 60_000).toISOString();
}

function isPast(isoTimestamp: string | null, now: string): boolean {
  if (!isoTimestamp) {
    return false;
  }
  return new Date(isoTimestamp).getTime() < new Date(now).getTime();
}

function findRecoveryTier(functionCode: string, tiers: readonly RecoveryTierRecord[]) {
  return tiers.find((tier) => tier.functionCode === functionCode) ?? null;
}

export function createResilienceTupleHash(tuple: ResilienceTupleMembers): string {
  return stableDigest({
    environmentRing: tuple.environmentRing,
    previewEnvironmentRef: tuple.previewEnvironmentRef,
    runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
    releasePublicationParityRef: tuple.releasePublicationParityRef,
    releaseWatchTupleRef: tuple.releaseWatchTupleRef,
    waveObservationPolicyRef: tuple.waveObservationPolicyRef,
    buildProvenanceRef: tuple.buildProvenanceRef,
    requiredAssuranceSliceRefs: uniqueSorted(tuple.requiredAssuranceSliceRefs),
    activeFreezeRefs: uniqueSorted(tuple.activeFreezeRefs),
  });
}

export function createBackupSetManifest(
  input: BackupManifestGenerationInput,
): BackupSetManifest {
  const tupleHash = createResilienceTupleHash(input.tuple);
  const sourceDigestEntries = [...input.sourceDigestEntries].sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  const backupArtifactDigest = stableDigest(sourceDigestEntries);
  return {
    backupSetManifestId: `BSM_101_${input.tuple.environmentRing.toUpperCase()}_${input.scope.storeRef.toUpperCase()}`,
    environmentRing: input.tuple.environmentRing,
    datasetScopeRef: input.scope.datasetScopeRef,
    datasetLabel: input.scope.datasetLabel,
    storeRef: input.scope.storeRef,
    storeClass: input.scope.storeClass,
    runtimePublicationBundleRef: input.tuple.runtimePublicationBundleRef,
    releasePublicationParityRef: input.tuple.releasePublicationParityRef,
    releaseWatchTupleRef: input.tuple.releaseWatchTupleRef,
    waveObservationPolicyRef: input.tuple.waveObservationPolicyRef,
    buildProvenanceRef: input.tuple.buildProvenanceRef,
    previewEnvironmentRef: input.tuple.previewEnvironmentRef,
    backupJobRef: `backup-job::${input.tuple.environmentRing}::${input.scope.storeRef}`,
    backupJobKind: input.scope.backupJobKind,
    essentialFunctionRefs: uniqueSorted(input.essentialFunctionRefs),
    sourceDigestEntries,
    backupArtifactRef: `backup-artifact::${input.tuple.environmentRing}::${input.scope.storeRef}`,
    backupArtifactDigest,
    retentionPolicyRef: input.scope.retentionPolicyRef,
    immutabilityState: input.scope.immutabilityState,
    restoreCompatibilityDigestRef: stableDigest({
      datasetScopeRef: input.scope.datasetScopeRef,
      runtimePublicationBundleRef: input.tuple.runtimePublicationBundleRef,
      buildProvenanceRef: input.tuple.buildProvenanceRef,
    }),
    manifestTupleHash: tupleHash,
    manifestState: input.manifestState ?? "current",
    capturedAt: input.capturedAt,
    verifiedAt: input.capturedAt,
    blockerRefs: uniqueSorted(input.blockerRefs ?? []),
    sourceRefs: input.scope.sourceRefs,
  };
}

export function validateBackupSetManifest(
  manifest: BackupSetManifest,
): ResilienceBaselineValidationResult {
  const issues: ResilienceValidationIssue[] = [];
  if (manifest.essentialFunctionRefs.length === 0) {
    issues.push(
      createIssue(
        "BACKUP_MANIFEST_MISSING_FUNCTIONS",
        "Backup manifests must name the essential functions they protect.",
        [manifest.backupSetManifestId],
      ),
    );
  }
  if (manifest.sourceDigestEntries.length === 0 && manifest.manifestState !== "missing") {
    issues.push(
      createIssue(
        "BACKUP_MANIFEST_EMPTY",
        "Current or stale backup manifests require source digest evidence.",
        [manifest.backupSetManifestId],
      ),
    );
  }
  if (manifest.manifestState === "missing" && manifest.blockerRefs.length === 0) {
    issues.push(
      createIssue(
        "BACKUP_MANIFEST_MISSING_BLOCKER",
        "Missing manifests must explain why they are absent.",
        [manifest.backupSetManifestId],
      ),
    );
  }
  return {
    valid: issues.length === 0,
    blockerRefs: uniqueSorted(
      issues.filter((issue) => issue.severity === "error").map((issue) => issue.code),
    ),
    issues,
  };
}

export function createRunbookBindingRecord(params: {
  tuple: ResilienceTupleMembers;
  functionCode: string;
  runbookRef: string;
  ownerRef: string;
  bindingState: RunbookBindingState;
  lastRehearsedAt: string | null;
  freshnessDeadlineAt: string | null;
  blockerRefs?: readonly string[];
  sourceRefs: readonly string[];
}): RunbookBindingRecord {
  return {
    runbookBindingRecordId: `RBR_101_${params.functionCode.toUpperCase()}`,
    functionCode: params.functionCode,
    runbookRef: params.runbookRef,
    environmentRing: params.tuple.environmentRing,
    runtimePublicationBundleRef: params.tuple.runtimePublicationBundleRef,
    releaseWatchTupleRef: params.tuple.releaseWatchTupleRef,
    buildProvenanceRef: params.tuple.buildProvenanceRef,
    resilienceTupleHash: createResilienceTupleHash(params.tuple),
    bindingState: params.bindingState,
    ownerRef: params.ownerRef,
    lastRehearsedAt: params.lastRehearsedAt,
    freshnessDeadlineAt: params.freshnessDeadlineAt,
    blockerRefs: uniqueSorted(params.blockerRefs ?? []),
    sourceRefs: params.sourceRefs,
  };
}

export function runRestoreRehearsal(input: RestoreRehearsalInput): RestoreRun {
  const expectedResilienceTupleHash = createResilienceTupleHash(input.tuple);
  const observedResilienceTupleHash =
    input.observedResilienceTupleHash ?? expectedResilienceTupleHash;
  const stageRecords: RestoreRunStageRecord[] = [
    {
      stage: "backup_verified",
      state: "completed",
      recordedAt: input.initiatedAt,
      evidenceRefs: [...input.backupSetManifestRefs],
      reason: "Backup manifests validated before restore staging.",
    },
    {
      stage: "restore_started",
      state: "completed",
      recordedAt: input.initiatedAt,
      evidenceRefs: [input.restoreTargetRef],
      reason: "Restore rehearsal target staged from the current backup set.",
    },
  ];

  let restoreState: RestoreRunState;
  const blockerRefs = uniqueSorted(input.blockerRefs ?? []);
  if (blockerRefs.length > 0 || observedResilienceTupleHash !== expectedResilienceTupleHash) {
    stageRecords.push({
      stage: "blocked",
      state: "blocked",
      recordedAt: input.completedAt ?? input.initiatedAt,
      evidenceRefs: blockerRefs,
      reason:
        blockerRefs.length > 0
          ? "Restore proof blocked by rehearsal or dataset failure."
          : "Restore proof drifted off the current resilience tuple.",
    });
    restoreState = "blocked";
  } else {
    stageRecords.push({
      stage: "data_restored",
      state: "completed",
      recordedAt: input.completedAt ?? addMinutes(input.initiatedAt, 5),
      evidenceRefs: [...input.backupSetManifestRefs],
      reason: "Data restored into the governed rehearsal target.",
    });
    if (input.journeyValidationState === "pending") {
      stageRecords.push({
        stage: "journey_validation_pending",
        state: "pending",
        recordedAt: input.completedAt ?? addMinutes(input.initiatedAt, 8),
        evidenceRefs: [...input.requiredJourneyProofRefs],
        reason: "Synthetic journey validation is queued but not yet settled.",
      });
      restoreState = "journey_validation_pending";
    } else {
      stageRecords.push({
        stage: "journey_validated",
        state: "completed",
        recordedAt: input.completedAt ?? addMinutes(input.initiatedAt, 10),
        evidenceRefs: [...input.requiredJourneyProofRefs],
        reason: "Synthetic journey validation completed on the restored dataset.",
      });
      restoreState = "journey_validated";
    }
  }

  return {
    restoreRunId: `RST_101_${input.functionCode.toUpperCase()}_${input.tuple.environmentRing.toUpperCase()}`,
    environmentRing: input.tuple.environmentRing,
    functionCode: input.functionCode,
    restoreTargetRef: input.restoreTargetRef,
    runtimePublicationBundleRef: input.tuple.runtimePublicationBundleRef,
    releasePublicationParityRef: input.tuple.releasePublicationParityRef,
    releaseWatchTupleRef: input.tuple.releaseWatchTupleRef,
    waveObservationPolicyRef: input.tuple.waveObservationPolicyRef,
    buildProvenanceRef: input.tuple.buildProvenanceRef,
    backupSetManifestRefs: uniqueSorted(input.backupSetManifestRefs),
    runbookBindingRefs: uniqueSorted(input.runbookBindingRefs),
    requiredJourneyProofRefs: uniqueSorted(input.requiredJourneyProofRefs),
    expectedResilienceTupleHash,
    observedResilienceTupleHash,
    restoreState,
    stageRecords,
    initiatedAt: input.initiatedAt,
    completedAt:
      restoreState === "journey_validation_pending" ? null : input.completedAt ?? addMinutes(input.initiatedAt, 10),
    blockerRefs: uniqueSorted(
      observedResilienceTupleHash !== expectedResilienceTupleHash
        ? [...blockerRefs, "RESILIENCE_TUPLE_DRIFT"]
        : blockerRefs,
    ),
    evidenceDigest: stableDigest(stageRecords),
    sourceRefs: ["prompt/101.md", "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract"],
  };
}

export function buildRecoveryEvidencePack(
  input: RecoveryEvidencePackInput,
  restoreRun: RestoreRun,
  runbookBindings: readonly RunbookBindingRecord[],
  manifests: readonly BackupSetManifest[],
): RecoveryEvidencePack {
  const resilienceTupleHash = createResilienceTupleHash(input.tuple);
  const relevantRunbooks = runbookBindings.filter((binding) =>
    input.runbookBindingRefs.includes(binding.runbookBindingRecordId),
  );
  const relevantManifests = manifests.filter((manifest) =>
    input.backupSetManifestRefs.includes(manifest.backupSetManifestId),
  );
  const now = input.generatedAt;
  const hasStaleRunbook = relevantRunbooks.some(
    (binding) =>
      binding.bindingState !== "current" || isPast(binding.freshnessDeadlineAt, now),
  );
  const hasStaleManifest = relevantManifests.some((manifest) => manifest.manifestState !== "current");
  const hasTupleDrift =
    restoreRun.observedResilienceTupleHash !== resilienceTupleHash ||
    relevantRunbooks.some((binding) => binding.resilienceTupleHash !== resilienceTupleHash) ||
    relevantManifests.some((manifest) => manifest.manifestTupleHash !== resilienceTupleHash);
  const blockerRefs = uniqueSorted(input.blockerRefs ?? []);

  const packState =
    input.forcedPackState ??
    (hasTupleDrift || restoreRun.restoreState === "blocked" || blockerRefs.length > 0
      ? "blocked"
      : hasStaleRunbook || hasStaleManifest || restoreRun.restoreState !== "journey_validated"
        ? "stale"
        : "current");

  return {
    recoveryEvidencePackId: `REP_101_${input.functionCode.toUpperCase()}_${input.tuple.environmentRing.toUpperCase()}`,
    environmentRing: input.tuple.environmentRing,
    functionCode: input.functionCode,
    runtimePublicationBundleRef: input.tuple.runtimePublicationBundleRef,
    releasePublicationParityRef: input.tuple.releasePublicationParityRef,
    releaseWatchTupleRef: input.tuple.releaseWatchTupleRef,
    waveObservationPolicyRef: input.tuple.waveObservationPolicyRef,
    buildProvenanceRef: input.tuple.buildProvenanceRef,
    resilienceTupleHash,
    backupSetManifestRefs: uniqueSorted(input.backupSetManifestRefs),
    runbookBindingRefs: uniqueSorted(input.runbookBindingRefs),
    restoreRunRef: restoreRun.restoreRunId,
    syntheticJourneyProofRefs: uniqueSorted(input.syntheticJourneyProofRefs),
    evidenceArtifactRefs: uniqueSorted(
      input.evidenceArtifactRefs ?? [`evidence-artifact::${input.functionCode}::${input.tuple.environmentRing}`],
    ),
    packState,
    generatedAt: input.generatedAt,
    validUntil: input.validUntil,
    blockerRefs: uniqueSorted(
      hasTupleDrift ? [...blockerRefs, "RESILIENCE_TUPLE_DRIFT"] : blockerRefs,
    ),
    sourceRefs: ["prompt/101.md", "blueprint/phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme"],
  };
}

function validateRestoreRun(restoreRun: RestoreRun): ResilienceBaselineValidationResult {
  const issues: ResilienceValidationIssue[] = [];
  if (restoreRun.backupSetManifestRefs.length === 0) {
    issues.push(
      createIssue(
        "RESTORE_RUN_MISSING_BACKUP_REFS",
        "Restore runs must bind to at least one backup set manifest.",
        [restoreRun.restoreRunId],
      ),
    );
  }
  if (restoreRun.restoreState === "blocked" && restoreRun.blockerRefs.length === 0) {
    issues.push(
      createIssue(
        "RESTORE_RUN_BLOCKED_WITHOUT_REASON",
        "Blocked restore runs must publish explicit blocker refs.",
        [restoreRun.restoreRunId],
      ),
    );
  }
  return {
    valid: issues.length === 0,
    blockerRefs: uniqueSorted(issues.map((issue) => issue.code)),
    issues,
  };
}

function deriveFunctionReadinessState(args: {
  functionCode: string;
  tier: RecoveryTierRecord | null;
  tupleHash: string;
  compiledAt: string;
  activeFreezeRefs: readonly string[];
  runbookBindings: readonly RunbookBindingRecord[];
  manifests: readonly BackupSetManifest[];
  restoreRun: RestoreRun | undefined;
  evidencePack: RecoveryEvidencePack | undefined;
}): OperationalReadinessFunctionVerdict {
  const blockers: string[] = [];
  const runbookState =
    args.runbookBindings.some((binding) => binding.bindingState === "stale")
      ? "stale"
      : args.runbookBindings.some((binding) => binding.bindingState === "rehearsal_due")
        ? "rehearsal_due"
        : "current";

  const manifestState =
    args.manifests.length === 0
      ? "missing"
      : args.manifests.some((manifest) => manifest.manifestState === "missing")
        ? "missing"
        : args.manifests.some((manifest) => manifest.manifestState === "stale")
          ? "stale"
          : "current";

  const restoreState = args.restoreRun?.restoreState ?? "blocked";
  const evidencePackState = args.evidencePack?.packState ?? "blocked";

  const hasTupleDrift =
    args.runbookBindings.some((binding) => binding.resilienceTupleHash !== args.tupleHash) ||
    args.manifests.some((manifest) => manifest.manifestTupleHash !== args.tupleHash) ||
    (args.restoreRun?.observedResilienceTupleHash ?? args.tupleHash) !== args.tupleHash ||
    (args.evidencePack?.resilienceTupleHash ?? args.tupleHash) !== args.tupleHash;

  if (hasTupleDrift) {
    blockers.push("RESILIENCE_TUPLE_DRIFT");
  }
  if (args.activeFreezeRefs.length > 0) {
    blockers.push("ASSURANCE_OR_FREEZE_BLOCKED");
  }
  if (manifestState === "missing") {
    blockers.push("MISSING_BACKUP_MANIFEST");
  }
  if (restoreState === "blocked" || evidencePackState === "blocked") {
    blockers.push("BLOCKED_RESTORE_PROOF");
  }
  if (
    runbookState !== "current" ||
    args.runbookBindings.some((binding) => isPast(binding.freshnessDeadlineAt, args.compiledAt)) ||
    (args.evidencePack ? isPast(args.evidencePack.validUntil, args.compiledAt) : true) ||
    restoreState === "journey_validation_pending" ||
    evidencePackState === "stale" ||
    manifestState === "stale"
  ) {
    blockers.push("STALE_REHEARSAL_EVIDENCE");
  }

  let readinessState: OperationalReadinessState = "exact_and_ready";
  if (blockers.includes("RESILIENCE_TUPLE_DRIFT")) {
    readinessState = "tuple_drift";
  } else if (blockers.includes("ASSURANCE_OR_FREEZE_BLOCKED")) {
    readinessState = "assurance_or_freeze_blocked";
  } else if (blockers.includes("MISSING_BACKUP_MANIFEST")) {
    readinessState = "missing_backup_manifest";
  } else if (blockers.includes("BLOCKED_RESTORE_PROOF")) {
    readinessState = "blocked_restore_proof";
  } else if (blockers.includes("STALE_REHEARSAL_EVIDENCE")) {
    readinessState = "stale_rehearsal_evidence";
  }

  return {
    functionCode: args.functionCode,
    recoveryTierRef: args.tier?.recoveryTierId ?? "UNKNOWN_RECOVERY_TIER",
    runbookBindingState: runbookState,
    backupManifestState: manifestState,
    restoreState,
    evidencePackState,
    readinessState,
    blockerRefs: uniqueSorted(blockers),
  };
}

export function compileOperationalReadinessSnapshot(
  input: OperationalReadinessCompilationInput,
): OperationalReadinessSnapshot {
  const tupleHash = createResilienceTupleHash(input.tuple);
  const functionVerdicts = input.essentialFunctions.map((binding) => {
    const manifests = input.backupManifests.filter((manifest) =>
      binding.requiredBackupScopeRefs.includes(manifest.datasetScopeRef),
    );
    const runbookBindings = input.runbookBindings.filter((runbook) =>
      binding.currentRunbookBindingRefs.includes(runbook.runbookBindingRecordId),
    );
    const restoreRun = input.restoreRuns.find((run) => run.functionCode === binding.functionCode);
    const evidencePack = input.evidencePacks.find((pack) => pack.functionCode === binding.functionCode);
    return deriveFunctionReadinessState({
      functionCode: binding.functionCode,
      tier: findRecoveryTier(binding.functionCode, input.recoveryTiers),
      tupleHash,
      compiledAt: input.compiledAt,
      activeFreezeRefs: input.tuple.activeFreezeRefs,
      runbookBindings,
      manifests,
      restoreRun,
      evidencePack,
    });
  });

  const severityOrder: readonly OperationalReadinessState[] = [
    "tuple_drift",
    "assurance_or_freeze_blocked",
    "missing_backup_manifest",
    "blocked_restore_proof",
    "stale_rehearsal_evidence",
    "exact_and_ready",
  ];

  const readinessState =
    functionVerdicts
      .map((verdict) => verdict.readinessState)
      .sort(
        (left, right) => severityOrder.indexOf(left) - severityOrder.indexOf(right),
      )[0] ?? "exact_and_ready";

  const blockerRefs = uniqueSorted(functionVerdicts.flatMap((verdict) => verdict.blockerRefs));
  const freshnessCeilingAt = input.evidencePacks
    .map((pack) => pack.validUntil)
    .sort((left, right) => left.localeCompare(right))[0] ?? input.compiledAt;

  return {
    operationalReadinessSnapshotId: `ORS_101_${input.tuple.environmentRing.toUpperCase()}_${readinessState.toUpperCase()}`,
    environmentRing: input.tuple.environmentRing,
    previewEnvironmentRef: input.tuple.previewEnvironmentRef,
    runtimePublicationBundleRef: input.tuple.runtimePublicationBundleRef,
    releasePublicationParityRef: input.tuple.releasePublicationParityRef,
    releaseWatchTupleRef: input.tuple.releaseWatchTupleRef,
    waveObservationPolicyRef: input.tuple.waveObservationPolicyRef,
    buildProvenanceRef: input.tuple.buildProvenanceRef,
    buildProvenanceState: input.buildProvenanceState,
    resilienceTupleHash: tupleHash,
    requiredAssuranceSliceRefs: uniqueSorted(input.tuple.requiredAssuranceSliceRefs),
    activeFreezeRefs: uniqueSorted(input.tuple.activeFreezeRefs),
    essentialFunctionRefs: input.essentialFunctions.map((binding) => binding.functionCode),
    backupSetManifestRefs: uniqueSorted(
      input.backupManifests.map((manifest) => manifest.backupSetManifestId),
    ),
    runbookBindingRefs: uniqueSorted(
      input.runbookBindings.map((binding) => binding.runbookBindingRecordId),
    ),
    latestRestoreRunRefs: uniqueSorted(input.restoreRuns.map((run) => run.restoreRunId)),
    latestRecoveryEvidencePackRefs: uniqueSorted(
      input.evidencePacks.map((pack) => pack.recoveryEvidencePackId),
    ),
    readinessState,
    blockerRefs,
    freshnessCeilingAt,
    compiledAt: input.compiledAt,
    functionVerdicts,
    sourceRefs: [
      "prompt/101.md",
      "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
      "blueprint/phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
    ],
  };
}

export function validateOperationalReadinessSnapshot(
  snapshot: OperationalReadinessSnapshot,
): ResilienceBaselineValidationResult {
  const issues: ResilienceValidationIssue[] = [];
  if (snapshot.functionVerdicts.length === 0) {
    issues.push(
      createIssue(
        "READINESS_SNAPSHOT_EMPTY",
        "Operational readiness snapshots must cover at least one essential function.",
        [snapshot.operationalReadinessSnapshotId],
      ),
    );
  }
  if (
    snapshot.readinessState === "exact_and_ready" &&
    (snapshot.blockerRefs.length > 0 || snapshot.activeFreezeRefs.length > 0)
  ) {
    issues.push(
      createIssue(
        "READINESS_SNAPSHOT_CONTRADICTORY",
        "Exact-and-ready snapshots cannot retain blockers or active freeze refs.",
        [snapshot.operationalReadinessSnapshotId],
      ),
    );
  }
  if (
    snapshot.readinessState !== "exact_and_ready" &&
    snapshot.functionVerdicts.every((verdict) => verdict.readinessState === "exact_and_ready")
  ) {
    issues.push(
      createIssue(
        "READINESS_SNAPSHOT_MISSING_DRIVER",
        "The top-level readiness state must be explained by at least one essential-function verdict.",
        [snapshot.operationalReadinessSnapshotId],
      ),
    );
  }
  return {
    valid: issues.length === 0,
    blockerRefs: uniqueSorted(issues.map((issue) => issue.code)),
    issues,
  };
}

function scenarioTuple(environmentRing: string, activeFreezeRefs: readonly string[] = []): ResilienceTupleMembers {
  const isLocal = environmentRing === "local";
  return {
    environmentRing,
    previewEnvironmentRef: isLocal ? null : `pev_${environmentRing.replace(/[^a-z0-9]/gi, "_")}`,
    runtimePublicationBundleRef: `rpb::${environmentRing}::authoritative`,
    releasePublicationParityRef: `rpp::${environmentRing}::authoritative`,
    releaseWatchTupleRef: isLocal
      ? "RWT_LOCAL_V1::local_satisfied"
      : `RWT_${environmentRing.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_V1::${environmentRing}_active`,
    waveObservationPolicyRef: isLocal
      ? "WOP_LOCAL_V1::local_satisfied"
      : `WOP_${environmentRing.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_V1::${environmentRing}_active`,
    buildProvenanceRef: `bpr::run_release_controls_${environmentRing.replace(/[^a-z0-9]/g, "_")}_verified`,
    requiredAssuranceSliceRefs: [
      "asr_runtime_topology_tuple",
      "asr_release_watch_tuple",
      "asr_restore_readiness",
    ],
    activeFreezeRefs,
  };
}

function buildSourceDigestEntries(scope: BackupScopeDefinition): BackupSourceDigest[] {
  return [
    {
      sourceRef: scope.sourceRefs[0] ?? scope.datasetScopeRef,
      relativePath: `${scope.storeRef}/primary.json`,
      digest: stableDigest(scope.storeRef),
      sizeBytes: 256,
    },
    {
      sourceRef: scope.sourceRefs[scope.sourceRefs.length - 1] ?? scope.datasetScopeRef,
      relativePath: `${scope.storeRef}/secondary.json`,
      digest: stableDigest(scope.datasetScopeRef),
      sizeBytes: 384,
    },
  ];
}

function buildReadyScenario(environmentRing: string): ResilienceBaselineScenario {
  const tuple = scenarioTuple(environmentRing);
  const manifests = canonicalBackupScopes.map((scope) =>
    createBackupSetManifest({
      tuple,
      scope,
      essentialFunctionRefs: canonicalEssentialFunctionMap
        .filter((binding) => binding.requiredBackupScopeRefs.includes(scope.datasetScopeRef))
        .map((binding) => binding.functionCode),
      sourceDigestEntries: buildSourceDigestEntries(scope),
      capturedAt: "2026-04-13T12:00:00.000Z",
    }),
  );

  const runbookBindings = canonicalEssentialFunctionMap.map((binding) =>
    createRunbookBindingRecord({
      tuple,
      functionCode: binding.functionCode,
      runbookRef: `runbook://${binding.functionCode}`,
      ownerRef: `owner://${binding.functionGroup}`,
      bindingState: "current",
      lastRehearsedAt: "2026-04-13T11:30:00.000Z",
      freshnessDeadlineAt: "2026-04-13T18:00:00.000Z",
      sourceRefs: ["prompt/101.md", "docs/architecture/15_operational_readiness_and_resilience_tooling.md"],
    }),
  );

  const restoreRuns = canonicalEssentialFunctionMap.map((binding) =>
    runRestoreRehearsal({
      tuple,
      functionCode: binding.functionCode,
      restoreTargetRef: `restore-target://${environmentRing}/${binding.functionCode}`,
      backupSetManifestRefs: manifests
        .filter((manifest) => binding.requiredBackupScopeRefs.includes(manifest.datasetScopeRef))
        .map((manifest) => manifest.backupSetManifestId),
      runbookBindingRefs: binding.currentRunbookBindingRefs,
      requiredJourneyProofRefs: binding.requiredJourneyProofRefs,
      initiatedAt: "2026-04-13T12:05:00.000Z",
      completedAt: "2026-04-13T12:15:00.000Z",
      journeyValidationState: "validated",
    }),
  );

  const evidencePacks = canonicalEssentialFunctionMap.map((binding) =>
    buildRecoveryEvidencePack(
      {
        tuple,
        functionCode: binding.functionCode,
        backupSetManifestRefs: manifests
          .filter((manifest) => binding.requiredBackupScopeRefs.includes(manifest.datasetScopeRef))
          .map((manifest) => manifest.backupSetManifestId),
        runbookBindingRefs: binding.currentRunbookBindingRefs,
        restoreRunRef: `RST_101_${binding.functionCode.toUpperCase()}_${environmentRing.toUpperCase()}`,
        syntheticJourneyProofRefs: binding.requiredJourneyProofRefs,
        generatedAt: "2026-04-13T12:20:00.000Z",
        validUntil: "2026-04-13T18:00:00.000Z",
      },
      restoreRuns.find((run) => run.functionCode === binding.functionCode)!,
      runbookBindings,
      manifests,
    ),
  );

  const snapshot = compileOperationalReadinessSnapshot({
    tuple,
    buildProvenanceState: "verified",
    compiledAt: "2026-04-13T12:25:00.000Z",
    essentialFunctions: canonicalEssentialFunctionMap,
    recoveryTiers: canonicalRecoveryTiers,
    backupManifests: manifests,
    runbookBindings,
    restoreRuns,
    evidencePacks,
  });

  return {
    scenarioId: `${environmentRing.toUpperCase()}_EXACT_READY`,
    environmentRing,
    expectedReadinessState: "exact_and_ready",
    snapshot,
    manifests,
    runbookBindings,
    restoreRuns,
    evidencePacks,
  };
}

function mutateScenario(
  base: ResilienceBaselineScenario,
  scenarioId: string,
  mutate: (args: {
    manifests: BackupSetManifest[];
    runbookBindings: RunbookBindingRecord[];
    restoreRuns: RestoreRun[];
    evidencePacks: RecoveryEvidencePack[];
  }) => void,
): ResilienceBaselineScenario {
  const manifests = base.manifests.map((manifest) => ({ ...manifest }));
  const runbookBindings = base.runbookBindings.map((binding) => ({ ...binding }));
  const restoreRuns = base.restoreRuns.map((run) => ({
    ...run,
    backupSetManifestRefs: [...run.backupSetManifestRefs],
    runbookBindingRefs: [...run.runbookBindingRefs],
    requiredJourneyProofRefs: [...run.requiredJourneyProofRefs],
    stageRecords: run.stageRecords.map((record) => ({ ...record, evidenceRefs: [...record.evidenceRefs] })),
    blockerRefs: [...run.blockerRefs],
  }));
  const evidencePacks = base.evidencePacks.map((pack) => ({
    ...pack,
    backupSetManifestRefs: [...pack.backupSetManifestRefs],
    runbookBindingRefs: [...pack.runbookBindingRefs],
    syntheticJourneyProofRefs: [...pack.syntheticJourneyProofRefs],
    evidenceArtifactRefs: [...pack.evidenceArtifactRefs],
    blockerRefs: [...pack.blockerRefs],
  }));

  mutate({ manifests, runbookBindings, restoreRuns, evidencePacks });

  const tuple = scenarioTuple(base.environmentRing);
  const snapshot = compileOperationalReadinessSnapshot({
    tuple,
    buildProvenanceState: "verified",
    compiledAt: "2026-04-13T12:25:00.000Z",
    essentialFunctions: canonicalEssentialFunctionMap,
    recoveryTiers: canonicalRecoveryTiers,
    backupManifests: manifests,
    runbookBindings,
    restoreRuns,
    evidencePacks,
  });

  return {
    scenarioId,
    environmentRing: base.environmentRing,
    expectedReadinessState: snapshot.readinessState,
    snapshot,
    manifests,
    runbookBindings,
    restoreRuns,
    evidencePacks,
  };
}

export function listResilienceBaselineScenarios(): readonly ResilienceBaselineScenario[] {
  const ready = buildReadyScenario("local");
  const stale = mutateScenario(ready, "LOCAL_STALE_REHEARSAL", ({ runbookBindings, evidencePacks }) => {
    runbookBindings[2] = {
      ...runbookBindings[2]!,
      bindingState: "stale",
      freshnessDeadlineAt: "2026-04-13T11:00:00.000Z",
      blockerRefs: ["RUNBOOK_REHEARSAL_STALE"],
    };
    evidencePacks[2] = {
      ...evidencePacks[2]!,
      packState: "stale",
      validUntil: "2026-04-13T11:00:00.000Z",
      blockerRefs: ["RESTORE_REHEARSAL_STALE"],
    };
  });
  const missing = mutateScenario(ready, "CI_PREVIEW_MISSING_BACKUP_MANIFEST", ({ manifests }) => {
    const manifest = manifests.find(
      (candidate) => candidate.datasetScopeRef === "backup-scope://projection-read-models",
    );
    if (manifest) {
      manifest.manifestState = "missing";
      manifest.sourceDigestEntries = [];
      manifest.blockerRefs = ["BACKUP_JOB_NOT_EXECUTED"];
    }
  });
  const blocked = mutateScenario(ready, "INTEGRATION_BLOCKED_RESTORE_PROOF", ({ restoreRuns, evidencePacks }) => {
    const restoreRun = restoreRuns.find((run) => run.functionCode === "ef_pharmacy_referral_reconciliation");
    if (restoreRun) {
      restoreRun.restoreState = "blocked";
      restoreRun.blockerRefs = ["OBJECT_RESTORE_VALIDATION_FAILED"];
      restoreRun.stageRecords = [
        ...restoreRun.stageRecords.filter((record) => record.stage !== "journey_validated"),
        {
          stage: "blocked",
          state: "blocked",
          recordedAt: "2026-04-13T12:15:00.000Z",
          evidenceRefs: ["OBJECT_RESTORE_VALIDATION_FAILED"],
          reason: "Restored object payloads failed deterministic validation.",
        },
      ];
    }
    const evidencePack = evidencePacks.find(
      (pack) => pack.functionCode === "ef_pharmacy_referral_reconciliation",
    );
    if (evidencePack) {
      evidencePack.packState = "blocked";
      evidencePack.blockerRefs = ["OBJECT_RESTORE_VALIDATION_FAILED"];
    }
  });
  const drift = mutateScenario(ready, "PREPROD_TUPLE_DRIFT", ({ manifests }) => {
    const manifest = manifests.find(
      (candidate) => candidate.datasetScopeRef === "backup-scope://event-spine",
    );
    if (manifest) {
      manifest.manifestTupleHash = "tuple::drifted";
      manifest.blockerRefs = ["RESILIENCE_TUPLE_DRIFT"];
    }
  });
  const freeze = (() => {
    const baseFreeze = buildReadyScenario("preprod");
    const tuple = scenarioTuple("preprod", ["freeze::wave_pause", "assurance::restore_block"]);
    const manifests = baseFreeze.manifests.map((manifest) => ({
      ...manifest,
      runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
      releasePublicationParityRef: tuple.releasePublicationParityRef,
      releaseWatchTupleRef: tuple.releaseWatchTupleRef,
      waveObservationPolicyRef: tuple.waveObservationPolicyRef,
      buildProvenanceRef: tuple.buildProvenanceRef,
      manifestTupleHash: createResilienceTupleHash(tuple),
    }));
    const runbookBindings = baseFreeze.runbookBindings.map((binding) => ({
      ...binding,
      runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
      releaseWatchTupleRef: tuple.releaseWatchTupleRef,
      buildProvenanceRef: tuple.buildProvenanceRef,
      resilienceTupleHash: createResilienceTupleHash(tuple),
    }));
    const restoreRuns = baseFreeze.restoreRuns.map((run) => ({
      ...run,
      runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
      releasePublicationParityRef: tuple.releasePublicationParityRef,
      releaseWatchTupleRef: tuple.releaseWatchTupleRef,
      waveObservationPolicyRef: tuple.waveObservationPolicyRef,
      buildProvenanceRef: tuple.buildProvenanceRef,
      expectedResilienceTupleHash: createResilienceTupleHash(tuple),
      observedResilienceTupleHash: createResilienceTupleHash(tuple),
    }));
    const evidencePacks = baseFreeze.evidencePacks.map((pack) => ({
      ...pack,
      runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
      releasePublicationParityRef: tuple.releasePublicationParityRef,
      releaseWatchTupleRef: tuple.releaseWatchTupleRef,
      waveObservationPolicyRef: tuple.waveObservationPolicyRef,
      buildProvenanceRef: tuple.buildProvenanceRef,
      resilienceTupleHash: createResilienceTupleHash(tuple),
    }));
    const snapshot = compileOperationalReadinessSnapshot({
      tuple,
      buildProvenanceState: "verified",
      compiledAt: "2026-04-13T12:25:00.000Z",
      essentialFunctions: canonicalEssentialFunctionMap,
      recoveryTiers: canonicalRecoveryTiers,
      backupManifests: manifests,
      runbookBindings,
      restoreRuns,
      evidencePacks,
    });
    return {
      scenarioId: "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
      environmentRing: "preprod",
      expectedReadinessState: snapshot.readinessState,
      snapshot,
      manifests,
      runbookBindings,
      restoreRuns,
      evidencePacks,
    } satisfies ResilienceBaselineScenario;
  })();

  return [ready, stale, missing, blocked, drift, freeze];
}

export function selectResilienceBaselineScenario(options?: {
  scenarioId?: string;
  expectedReadinessState?: OperationalReadinessState;
}): ResilienceBaselineScenario {
  const scenarios = listResilienceBaselineScenarios();
  if (options?.scenarioId) {
    const exact = scenarios.find((scenario) => scenario.scenarioId === options.scenarioId);
    if (exact) {
      return exact;
    }
    throw new Error(`RESILIENCE_BASELINE_SCENARIO_NOT_FOUND:${options.scenarioId}`);
  }
  if (options?.expectedReadinessState) {
    const exact = scenarios.find(
      (scenario) => scenario.expectedReadinessState === options.expectedReadinessState,
    );
    if (exact) {
      return exact;
    }
  }
  return scenarios[0]!;
}

export function createResilienceBaselineSimulationHarness(options?: {
  scenarioId?: string;
}): ResilienceBaselineSimulationHarness {
  const scenario = selectResilienceBaselineScenario({ scenarioId: options?.scenarioId });
  const manifestValidation = scenario.manifests
    .map((manifest) => validateBackupSetManifest(manifest))
    .reduce<ResilienceBaselineValidationResult>(
      (aggregate, current) => ({
        valid: aggregate.valid && current.valid,
        blockerRefs: uniqueSorted([...aggregate.blockerRefs, ...current.blockerRefs]),
        issues: [...aggregate.issues, ...current.issues],
      }),
      { valid: true, blockerRefs: [], issues: [] },
    );
  const restoreValidation = scenario.restoreRuns
    .map((restoreRun) => validateRestoreRun(restoreRun))
    .reduce<ResilienceBaselineValidationResult>(
      (aggregate, current) => ({
        valid: aggregate.valid && current.valid,
        blockerRefs: uniqueSorted([...aggregate.blockerRefs, ...current.blockerRefs]),
        issues: [...aggregate.issues, ...current.issues],
      }),
      { valid: true, blockerRefs: [], issues: [] },
    );
  const snapshotValidation = validateOperationalReadinessSnapshot(scenario.snapshot);
  return {
    scenario,
    essentialFunctions: canonicalEssentialFunctionMap,
    recoveryTiers: canonicalRecoveryTiers,
    backupScopes: canonicalBackupScopes,
    manifestValidation,
    snapshotValidation: {
      valid: restoreValidation.valid && snapshotValidation.valid,
      blockerRefs: uniqueSorted([
        ...restoreValidation.blockerRefs,
        ...snapshotValidation.blockerRefs,
      ]),
      issues: [...restoreValidation.issues, ...snapshotValidation.issues],
    },
  };
}
