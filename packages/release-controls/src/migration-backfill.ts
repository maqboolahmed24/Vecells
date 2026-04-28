import { stableDigest } from "./build-provenance";
import {
  type ProjectionBackfillPlan,
  type ProjectionReadinessVerdict,
  type ProjectionRebuildRunResult,
  type ProjectionRebuildState,
  type ProjectionReplayEnvelope,
  type ProjectionRebuildTarget,
  type ProjectionWritableDisposition,
  ProjectionRebuildWorker,
  createProjectionRebuildSimulationHarness,
  evaluateProjectionReadinessVerdict,
  projectionBackfillPlanCatalog,
  projectionCompatibilityWindowCatalog,
  projectionVersionCatalog,
  projectionVersionSetCatalog,
} from "./projection-rebuild";
import {
  type ReleasePublicationParityRecordContract,
  type ReleasePublicationParityTuple,
  type RuntimePublicationAuthorityVerdict,
  type RuntimePublicationBundleContract,
  type RuntimePublicationBundleTuple,
  createRuntimePublicationSimulationHarness,
  evaluateRuntimePublicationAuthority,
} from "./runtime-publication";

export type SchemaMigrationChangeType =
  | "additive"
  | "backfill"
  | "contractive"
  | "rollforward_only";
export type MigrationRollbackMode = "binary_safe" | "flag_only" | "rollforward_only";
export type MigrationExecutionIntent = "dry_run" | "execute";
export type MigrationBindingState = "ready" | "stale" | "blocked" | "withdrawn";
export type MigrationCutoverState =
  | "staging"
  | "dual_read"
  | "cutover_ready"
  | "contract_pending"
  | "rollback_only"
  | "blocked";
export type MigrationPlanState = "draft" | "ready" | "blocked";
export type MigrationActionType =
  | "start_migration"
  | "pause_backfill"
  | "resume_backfill"
  | "complete_migration"
  | "abort_migration";
export type MigrationActionState = "planned" | "dry_run" | "running" | "completed" | "blocked";
export type MigrationExecutionAcceptedState = "accepted" | "rejected" | "deduplicated";
export type MigrationObservationState =
  | "open"
  | "satisfied"
  | "stale"
  | "rollback_required"
  | "superseded";
export type MigrationRoutePostureState =
  | "converged"
  | "constrained"
  | "rollback_required"
  | "freeze_conflict";
export type MigrationSettlementResult =
  | "applied"
  | "accepted_pending_observation"
  | "stale_recoverable"
  | "blocked_policy"
  | "rollback_required"
  | "failed";
export type MigrationCoverageState = "empty" | "partial" | "converged" | "stale" | "incompatible";
export type MigrationLagState = "within_budget" | "breached" | "rebuild_required" | "blocked";
export type MigrationContractCompatibilityState =
  | "exact"
  | "additive_compatible"
  | "stale"
  | "incompatible";
export type MigrationSurfaceState = "live" | "summary_only" | "recovery_only" | "blocked";
export type MigrationVerdictState = "ready" | "constrained" | "blocked";

export interface MigrationCompatibilityWindow {
  migrationWindowRef: string;
  windowState:
    | "expand_only"
    | "dual_read"
    | "cutover_ready"
    | "constrained"
    | "rollback_only"
    | "blocked";
  minimumObservationMinutes: number;
  minimumObservationSamples: number;
  opensAt: string;
  closesAt: string;
  sourceRefs: readonly string[];
}

export interface SchemaMigrationPlan {
  migrationPlanId: string;
  storeScope: string;
  changeType: SchemaMigrationChangeType;
  releaseApprovalFreezeRef: string;
  sourceSchemaVersionRefs: readonly string[];
  targetSchemaVersionRefs: readonly string[];
  compatibilityWindow: MigrationCompatibilityWindow;
  executionOrder: readonly ("expand" | "migrate" | "contract")[];
  affectedAudienceSurfaceRefs: readonly string[];
  affectedRouteFamilyRefs: readonly string[];
  routeContractDigestRefs: readonly string[];
  sourceProjectionContractVersionSetRefs: readonly string[];
  targetProjectionContractVersionSetRefs: readonly string[];
  sourceProjectionCompatibilityDigestRefs: readonly string[];
  targetProjectionCompatibilityDigestRefs: readonly string[];
  readPathCompatibilityWindowRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  preCutoverPublicationBundleRef: string;
  targetPublicationBundleRef: string;
  rollbackPublicationBundleRef: string;
  requiredRecoveryDispositionRefs: readonly string[];
  requiredContinuityControlRefs: readonly string[];
  environmentBaselineFingerprintRef: string;
  compatibilityEvidenceRef: string;
  contractRemovalGuardRef: string;
  migrationExecutionBindingRef: string;
  verificationRefs: readonly string[];
  rollbackMode: MigrationRollbackMode;
  planState: MigrationPlanState;
  sourceRefs: readonly string[];
}

export interface GovernedProjectionBackfillPlan extends ProjectionBackfillPlan {
  backfillPlanId: string;
  projectionFamilies: readonly string[];
  releaseApprovalFreezeRef: string;
  sourceEventWindow: {
    fromInclusive: number;
    toInclusive: number;
  };
  expectedLagBudget: number;
  rebuildStrategy: "checkpoint_resume" | "shadow_compare" | "replace";
  affectedAudienceSurfaceRefs: readonly string[];
  routeImpactRefs: readonly string[];
  routeContractDigestRefs: readonly string[];
  projectionContractVersionSetRefs: readonly string[];
  projectionCompatibilityDigestRefs: readonly string[];
  readPathCompatibilityWindowRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  requiredRecoveryDispositionRefs: readonly string[];
  stopResumeFenceRef: string;
  syntheticRecoveryCoverageRefs: readonly string[];
  projectionReadinessVerdictRefs: readonly string[];
  lagVisibilityEvidenceRef: string;
  cutoverReadinessState: "not_ready" | "ready" | "blocked";
  rollbackReadModelRef: string;
  migrationExecutionBindingRef: string;
  successEvidenceRef: string;
}

export interface MigrationExecutionBinding {
  migrationExecutionBindingId: string;
  migrationPlanRef: string;
  projectionBackfillPlanRef: string;
  verificationScenarioRef: string;
  environmentBaselineFingerprintRef: string;
  releaseApprovalFreezeRef: string;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  runtimePublicationBundleRef: string;
  audienceSurfaceRuntimeBindingRefs: readonly string[];
  routeContractDigestRefs: readonly string[];
  projectionContractVersionSetRefs: readonly string[];
  projectionCompatibilityDigestRefs: readonly string[];
  readPathCompatibilityWindowRef: string;
  readPathCompatibilityDigestRef: string;
  projectionReadinessVerdictRefs: readonly string[];
  projectionBackfillExecutionLedgerRef: string | null;
  migrationCutoverCheckpointRef: string | null;
  preCutoverPublicationBundleRef: string;
  targetPublicationBundleRef: string;
  rollbackPublicationBundleRef: string;
  requiredRecoveryDispositionRefs: readonly string[];
  requiredContinuityControlRefs: readonly string[];
  bindingTupleHash: string;
  provenanceState: "verified" | "drifted" | "quarantined" | "revoked";
  cutoverState: MigrationCutoverState;
  bindingState: MigrationBindingState;
  lastMigrationActionSettlementRef: string | null;
  validatedAt: string;
  environmentRef: string;
  seedSetRef: string;
  sourceRefs: readonly string[];
}

export interface MigrationImpactPreview {
  migrationImpactPreviewId: string;
  migrationExecutionBindingRef: string;
  releaseWatchTupleRef: string;
  readPathCompatibilityDigestRef: string;
  projectionCompatibilityDigestRefs: readonly string[];
  projectionBackfillExecutionLedgerRef: string | null;
  migrationCutoverCheckpointRef: string | null;
  affectedAudienceSurfaceRefs: readonly string[];
  affectedRouteFamilyRefs: readonly string[];
  expectedLiveRouteRefs: readonly string[];
  expectedSummaryOnlyRouteRefs: readonly string[];
  expectedRecoveryOnlyRouteRefs: readonly string[];
  expectedBlockedRouteRefs: readonly string[];
  requiredRecoveryDispositionRefs: readonly string[];
  requiredContinuityControlRefs: readonly string[];
  previewedAt: string;
  riskRefs: readonly string[];
  blockingReasonRefs: readonly string[];
}

export interface MigrationExecutionReceipt {
  migrationExecutionReceiptId: string;
  migrationActionRecordRef: string;
  migrationExecutionBindingRef: string;
  controlPlaneTxRef: string;
  executionFenceEpoch: string;
  acceptedBindingTupleHash: string;
  acceptedState: MigrationExecutionAcceptedState;
  acceptedAt: string;
  acceptedByRef: string;
}

export interface MigrationActionObservationWindow {
  migrationObservationWindowId: string;
  migrationActionRecordRef: string;
  migrationExecutionBindingRef: string;
  releaseWatchTupleRef: string;
  startsAt: string;
  closesAt: string;
  requiredProbeRefs: readonly string[];
  observedRuntimePublicationBundleRef: string;
  observedPublicationParityRef: string;
  observedReadPathCompatibilityWindowRef: string;
  observedReadPathCompatibilityDigestRef: string;
  observedProjectionCompatibilityDigestRefs: readonly string[];
  observedProjectionReadinessVerdictRefs: readonly string[];
  observedProjectionBackfillExecutionLedgerRef: string | null;
  observedMigrationCutoverCheckpointRef: string | null;
  observedAudienceSurfaceRuntimeBindingRefs: readonly string[];
  observedRecoveryDispositionRefs: readonly string[];
  routePostureState: MigrationRoutePostureState;
  observationState: MigrationObservationState;
  closedAt: string | null;
}

export interface MigrationActionRecord {
  migrationActionRecordId: string;
  routeIntentBindingRef: string;
  migrationExecutionBindingRef: string;
  releaseWatchTupleRef: string;
  releasePublicationParityRef: string;
  readPathCompatibilityDigestRef: string;
  projectionBackfillExecutionLedgerRef: string | null;
  migrationCutoverCheckpointRef: string | null;
  audienceSurfaceRuntimeBindingRefs: readonly string[];
  actionType: MigrationActionType;
  expectedBindingState: MigrationBindingState;
  expectedCutoverState: MigrationCutoverState;
  impactPreviewRef: string;
  environmentRef: string;
  storeScopeRef: string;
  backfillPlanRef: string;
  submittedBy: string;
  submittedAt: string;
  idempotencyKey: string;
  commandActionRecordRef: string;
  phase: "expand" | "migrate" | "contract";
  actionState: MigrationActionState;
  notes: readonly string[];
}

export interface MigrationActionSettlement {
  migrationActionSettlementId: string;
  migrationActionRecordRef: string;
  commandSettlementRecordRef: string;
  transitionEnvelopeRef: string;
  result: MigrationSettlementResult;
  executionReceiptRef: string;
  observationWindowRef: string;
  observedPublicationParityRef: string;
  observedReadPathCompatibilityDigestRef: string;
  observedProjectionBackfillExecutionLedgerRef: string | null;
  observedMigrationCutoverCheckpointRef: string | null;
  observedProjectionReadinessVerdictRefs: readonly string[];
  observationState: MigrationObservationState;
  releaseRecoveryDispositionRef: string | null;
  compatibilityEvidenceRef: string;
  supersededByMigrationActionRef: string | null;
  settledAt: string;
  verdictState: MigrationVerdictState;
  reason: string;
  blockerRefs: readonly string[];
}

export interface MigrationRouteReadinessVerdict {
  projectionReadinessVerdictId: string;
  backfillPlanRef: string;
  migrationExecutionBindingRef: string;
  projectionBackfillExecutionLedgerRef: string | null;
  audienceSurfaceRef: string;
  routeFamilyRef: string;
  projectionFamilyRefs: readonly string[];
  requiredRouteContractDigestRef: string;
  requiredProjectionContractVersionSetRef: string;
  requiredProjectionCompatibilityDigestRef: string;
  readModelVersionSetRef: string;
  coverageState: MigrationCoverageState;
  lagState: MigrationLagState;
  contractCompatibilityState: MigrationContractCompatibilityState;
  freshnessCeilingRef: string;
  allowedSurfaceState: MigrationSurfaceState;
  lastMigrationObservationWindowRef: string;
  lastVerifiedAt: string;
  verdictState: MigrationVerdictState;
  blockerRefs: readonly string[];
  reason: string;
  projectionVerdict: ProjectionReadinessVerdict;
}

export interface SchemaMigrationPlanValidationResult {
  valid: boolean;
  errors: readonly string[];
}

export interface ProjectionBackfillPlanValidationResult {
  valid: boolean;
  errors: readonly string[];
}

export interface MigrationExecutionOptions {
  actionType?: MigrationActionType;
  commandActionRecordRef?: string;
  idempotencyKey?: string;
  operatorRef: string;
  routeIntentBindingRef?: string;
  observedMinutes?: number;
  observedSamples?: number;
  comparisonMatches?: boolean;
  rollbackModeMatches?: boolean;
}

export interface MigrationExecutionContext {
  plan: SchemaMigrationPlan;
  backfillPlan: GovernedProjectionBackfillPlan;
  binding: MigrationExecutionBinding;
  bundle: RuntimePublicationBundleContract;
  currentBundle: RuntimePublicationBundleTuple;
  parityRecord: ReleasePublicationParityRecordContract;
  currentParity: ReleasePublicationParityTuple;
  projectionWorker: ProjectionRebuildWorker;
  eventStream: readonly ProjectionReplayEnvelope[];
  targets: readonly ProjectionRebuildTarget[];
  intent: MigrationExecutionIntent;
  options: MigrationExecutionOptions;
}

export interface MigrationExecutionRunResult {
  publicationVerdict: RuntimePublicationAuthorityVerdict;
  impactPreview: MigrationImpactPreview;
  actionRecords: readonly MigrationActionRecord[];
  executionReceipt: MigrationExecutionReceipt;
  observationWindow: MigrationActionObservationWindow;
  settlement: MigrationActionSettlement;
  routeReadinessVerdicts: readonly MigrationRouteReadinessVerdict[];
  backfillResult: ProjectionRebuildRunResult | null;
}

export interface MigrationBackfillSimulationHarness {
  bundle: RuntimePublicationBundleContract;
  currentBundle: RuntimePublicationBundleTuple;
  parityRecord: ReleasePublicationParityRecordContract;
  currentParity: ReleasePublicationParityTuple;
  plan: SchemaMigrationPlan;
  backfillPlan: GovernedProjectionBackfillPlan;
  binding: MigrationExecutionBinding;
  store: InMemoryMigrationControlStore;
  runner: MigrationBackfillRunner;
  projectionWorker: ProjectionRebuildWorker;
  eventStream: readonly ProjectionReplayEnvelope[];
}

function toSet(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function asNonEmpty(values: readonly string[] | undefined, error: string): string[] {
  if (!values || values.length === 0) {
    return [error];
  }
  return [];
}

function projectionVersionByRef(projectionVersionRef: string) {
  const projectionVersion = projectionVersionCatalog.find(
    (entry) => entry.projectionVersionRef === projectionVersionRef,
  );
  if (!projectionVersion) {
    throw new Error(`Unknown projection version ref: ${projectionVersionRef}`);
  }
  return projectionVersion;
}

function projectionVersionSetByRef(projectionVersionSetRef: string) {
  const projectionVersionSet = projectionVersionSetCatalog.find(
    (entry) => entry.projectionVersionSetRef === projectionVersionSetRef,
  );
  if (!projectionVersionSet) {
    throw new Error(`Unknown projection version set ref: ${projectionVersionSetRef}`);
  }
  return projectionVersionSet;
}

function compatibilityWindowByRef(readPathCompatibilityWindowRef: string) {
  const compatibilityWindow = projectionCompatibilityWindowCatalog.find(
    (entry) => entry.compatibilityWindowRef === readPathCompatibilityWindowRef,
  );
  if (!compatibilityWindow) {
    throw new Error(`Unknown compatibility window ref: ${readPathCompatibilityWindowRef}`);
  }
  return compatibilityWindow;
}

function plannedActionState(intent: MigrationExecutionIntent): MigrationActionState {
  return intent === "dry_run" ? "dry_run" : "completed";
}

function deriveVerdictState(
  allowedSurfaceState: MigrationSurfaceState,
  publicationVerdict: RuntimePublicationAuthorityVerdict,
): MigrationVerdictState {
  if (!publicationVerdict.publishable || allowedSurfaceState === "blocked") {
    return "blocked";
  }
  if (allowedSurfaceState === "live") {
    return "ready";
  }
  return "constrained";
}

function deriveWritablePosture(
  projectionVerdict: ProjectionReadinessVerdict,
  verdictState: MigrationVerdictState,
): ProjectionWritableDisposition {
  if (verdictState === "blocked") {
    return "blocked";
  }
  if (verdictState === "constrained") {
    return "guarded";
  }
  return projectionVerdict.writableDisposition;
}

function defaultConvergencePercent(backfillResult: ProjectionRebuildRunResult | null): number {
  if (!backfillResult || backfillResult.ledgers.length === 0) {
    return 0;
  }
  const completed = backfillResult.ledgers.filter((ledger) => ledger.rebuildState === "completed");
  return Math.round((completed.length / backfillResult.ledgers.length) * 100);
}

export function validateSchemaMigrationPlan(
  plan: SchemaMigrationPlan,
): SchemaMigrationPlanValidationResult {
  const errors = [
    ...asNonEmpty(plan.sourceSchemaVersionRefs, "sourceSchemaVersionRefs must not be empty"),
    ...asNonEmpty(plan.targetSchemaVersionRefs, "targetSchemaVersionRefs must not be empty"),
    ...asNonEmpty(
      plan.affectedAudienceSurfaceRefs,
      "affectedAudienceSurfaceRefs must not be empty",
    ),
    ...asNonEmpty(plan.affectedRouteFamilyRefs, "affectedRouteFamilyRefs must not be empty"),
    ...asNonEmpty(plan.routeContractDigestRefs, "routeContractDigestRefs must not be empty"),
    ...asNonEmpty(
      plan.targetProjectionContractVersionSetRefs,
      "targetProjectionContractVersionSetRefs must not be empty",
    ),
    ...asNonEmpty(
      plan.targetProjectionCompatibilityDigestRefs,
      "targetProjectionCompatibilityDigestRefs must not be empty",
    ),
    ...asNonEmpty(
      plan.requiredRecoveryDispositionRefs,
      "requiredRecoveryDispositionRefs must not be empty",
    ),
    ...asNonEmpty(
      plan.requiredContinuityControlRefs,
      "requiredContinuityControlRefs must not be empty",
    ),
    ...asNonEmpty(plan.verificationRefs, "verificationRefs must not be empty"),
  ];

  if (plan.executionOrder.join(">") !== "expand>migrate>contract") {
    errors.push("executionOrder must preserve expand>migrate>contract discipline");
  }
  if (plan.compatibilityWindow.minimumObservationMinutes < 1) {
    errors.push("compatibilityWindow.minimumObservationMinutes must be positive");
  }
  if (plan.compatibilityWindow.minimumObservationSamples < 1) {
    errors.push("compatibilityWindow.minimumObservationSamples must be positive");
  }
  if (plan.compatibilityWindow.opensAt >= plan.compatibilityWindow.closesAt) {
    errors.push("compatibilityWindow window must close after it opens");
  }
  if (plan.planState === "ready" && plan.rollbackMode === "rollforward_only") {
    errors.push(
      "planState ready requires a declared rollback posture that is not rollforward_only",
    );
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateGovernedProjectionBackfillPlan(
  plan: GovernedProjectionBackfillPlan,
): ProjectionBackfillPlanValidationResult {
  const errors = [
    ...asNonEmpty(plan.projectionFamilies, "projectionFamilies must not be empty"),
    ...asNonEmpty(
      plan.affectedAudienceSurfaceRefs,
      "affectedAudienceSurfaceRefs must not be empty",
    ),
    ...asNonEmpty(plan.routeImpactRefs, "routeImpactRefs must not be empty"),
    ...asNonEmpty(plan.routeContractDigestRefs, "routeContractDigestRefs must not be empty"),
    ...asNonEmpty(
      plan.projectionContractVersionSetRefs,
      "projectionContractVersionSetRefs must not be empty",
    ),
    ...asNonEmpty(
      plan.projectionCompatibilityDigestRefs,
      "projectionCompatibilityDigestRefs must not be empty",
    ),
    ...asNonEmpty(
      plan.requiredRecoveryDispositionRefs,
      "requiredRecoveryDispositionRefs must not be empty",
    ),
    ...asNonEmpty(
      plan.syntheticRecoveryCoverageRefs,
      "syntheticRecoveryCoverageRefs must not be empty",
    ),
  ];
  if (plan.sourceEventWindow.toInclusive < plan.sourceEventWindow.fromInclusive) {
    errors.push("sourceEventWindow must not close before it opens");
  }
  if (plan.expectedLagBudget < 0) {
    errors.push("expectedLagBudget must not be negative");
  }
  if (plan.cutoverReadinessState === "ready" && !plan.compareBeforeCutover) {
    errors.push("cutoverReadinessState ready requires compareBeforeCutover");
  }
  if (plan.projectionFamilies.length !== toSet(plan.projectionFamilies).length) {
    errors.push("projectionFamilies must be unique");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createMigrationImpactPreview(args: {
  plan: SchemaMigrationPlan;
  backfillPlan: GovernedProjectionBackfillPlan;
  binding: MigrationExecutionBinding;
  publicationVerdict: RuntimePublicationAuthorityVerdict;
  projectedVerdictState: MigrationVerdictState;
  previewedAt?: string;
}): MigrationImpactPreview {
  const previewedAt = args.previewedAt ?? args.binding.validatedAt;
  const riskRefs = [
    ...(args.publicationVerdict.publishable ? [] : args.publicationVerdict.refusalReasonRefs),
    ...(args.projectedVerdictState === "ready" ? [] : ["ROUTE_POSTURE_NOT_LIVE"]),
    ...(args.plan.rollbackMode === "flag_only" ? ["ROLLBACK_REQUIRES_FLAG_GUARD"] : []),
  ];
  const expectedLiveRouteRefs =
    args.publicationVerdict.publishable && args.projectedVerdictState === "ready"
      ? args.plan.affectedRouteFamilyRefs
      : [];
  const expectedSummaryOnlyRouteRefs =
    args.projectedVerdictState === "constrained" ? args.plan.affectedRouteFamilyRefs : [];
  const expectedBlockedRouteRefs =
    args.projectedVerdictState === "blocked" ? args.plan.affectedRouteFamilyRefs : [];
  return {
    migrationImpactPreviewId: `mip::${stableDigest({
      migrationExecutionBindingRef: args.binding.migrationExecutionBindingId,
      projectedVerdictState: args.projectedVerdictState,
      previewedAt,
    }).slice(0, 16)}`,
    migrationExecutionBindingRef: args.binding.migrationExecutionBindingId,
    releaseWatchTupleRef: args.binding.releaseWatchTupleRef,
    readPathCompatibilityDigestRef: args.binding.readPathCompatibilityDigestRef,
    projectionCompatibilityDigestRefs: args.binding.projectionCompatibilityDigestRefs,
    projectionBackfillExecutionLedgerRef: args.binding.projectionBackfillExecutionLedgerRef,
    migrationCutoverCheckpointRef: args.binding.migrationCutoverCheckpointRef,
    affectedAudienceSurfaceRefs: args.plan.affectedAudienceSurfaceRefs,
    affectedRouteFamilyRefs: args.plan.affectedRouteFamilyRefs,
    expectedLiveRouteRefs,
    expectedSummaryOnlyRouteRefs,
    expectedRecoveryOnlyRouteRefs: [],
    expectedBlockedRouteRefs,
    requiredRecoveryDispositionRefs: args.plan.requiredRecoveryDispositionRefs,
    requiredContinuityControlRefs: args.plan.requiredContinuityControlRefs,
    previewedAt,
    riskRefs,
    blockingReasonRefs: args.publicationVerdict.publishable
      ? []
      : args.publicationVerdict.refusalReasonRefs,
  };
}

export function evaluateMigrationRouteReadiness(args: {
  plan: SchemaMigrationPlan;
  backfillPlan: GovernedProjectionBackfillPlan;
  binding: MigrationExecutionBinding;
  publicationVerdict: RuntimePublicationAuthorityVerdict;
  projectionVerdict: ProjectionReadinessVerdict;
  observationWindow: Pick<
    MigrationActionObservationWindow,
    "migrationObservationWindowId" | "observationState"
  >;
  convergencePercent: number;
  comparisonMatches: boolean;
  rollbackModeMatches: boolean;
  observedMinutes: number;
  observedSamples: number;
}): MigrationRouteReadinessVerdict {
  const projectionVersionSet = projectionVersionSetByRef(
    args.backfillPlan.projectionContractVersionSetRefs[0] ??
      args.binding.projectionContractVersionSetRefs[0]!,
  );
  const routeFamilyRef =
    args.plan.affectedRouteFamilyRefs[0] ?? projectionVersionSet.routeFamilyRef;
  const coverageState: MigrationCoverageState = !args.publicationVerdict.publishable
    ? "incompatible"
    : args.convergencePercent <= 0
      ? "empty"
      : args.convergencePercent < 100
        ? "partial"
        : args.projectionVerdict.readinessState === "stale"
          ? "stale"
          : "converged";
  const lagState: MigrationLagState = !args.publicationVerdict.publishable
    ? "blocked"
    : args.projectionVerdict.checkpointLag > args.backfillPlan.expectedLagBudget
      ? "breached"
      : args.projectionVerdict.rebuildState !== "completed"
        ? "rebuild_required"
        : "within_budget";
  const contractCompatibilityState: MigrationContractCompatibilityState = !args.publicationVerdict
    .publishable
    ? "incompatible"
    : args.projectionVerdict.compatibilityState === "blocked"
      ? "incompatible"
      : args.publicationVerdict.parityState !== "exact"
        ? "stale"
        : args.projectionVerdict.compatibilityState === "dual_read"
          ? "additive_compatible"
          : "exact";

  const blockerRefs = [
    ...(!args.publicationVerdict.publishable ? args.publicationVerdict.refusalReasonRefs : []),
    ...(coverageState === "empty" ? ["BACKFILL_EMPTY"] : []),
    ...(lagState === "blocked" ? ["PUBLICATION_BINDING_BLOCKED"] : []),
    ...(lagState === "breached" ? ["BACKFILL_LAG_BREACHED"] : []),
    ...(args.comparisonMatches ? [] : ["DUAL_READ_COMPARISON_FAILED"]),
    ...(args.rollbackModeMatches ? [] : ["ROLLBACK_MODE_MISMATCH"]),
    ...(args.observedMinutes >= args.plan.compatibilityWindow.minimumObservationMinutes
      ? []
      : ["OBSERVATION_WINDOW_TOO_SHORT"]),
    ...(args.observedSamples >= args.plan.compatibilityWindow.minimumObservationSamples
      ? []
      : ["OBSERVATION_PROBE_COUNT_TOO_LOW"]),
  ];

  let allowedSurfaceState: MigrationSurfaceState = "summary_only";
  if (
    blockerRefs.some((entry) =>
      [
        "PUBLICATION_BINDING_BLOCKED",
        "DUAL_READ_COMPARISON_FAILED",
        "ROLLBACK_MODE_MISMATCH",
      ].includes(entry),
    ) ||
    contractCompatibilityState === "incompatible"
  ) {
    allowedSurfaceState = "blocked";
  } else if (
    coverageState === "converged" &&
    lagState === "within_budget" &&
    args.observationWindow.observationState === "satisfied" &&
    args.comparisonMatches &&
    args.rollbackModeMatches
  ) {
    allowedSurfaceState = "live";
  } else if (coverageState === "stale" || lagState === "breached") {
    allowedSurfaceState = "recovery_only";
  }

  const verdictState = deriveVerdictState(allowedSurfaceState, args.publicationVerdict);
  const writableDisposition = deriveWritablePosture(args.projectionVerdict, verdictState);
  const projectionVerdict: ProjectionReadinessVerdict = {
    ...args.projectionVerdict,
    writableDisposition,
  };
  const reason =
    verdictState === "ready"
      ? "Projection and migration evidence converged under the declared compatibility window."
      : verdictState === "blocked"
        ? "Execution failed closed because the migration tuple, rollback posture, or observation proof drifted."
        : "Execution remains constrained until observation, convergence, and compatibility evidence fully converge.";

  return {
    projectionReadinessVerdictId: `prv::${stableDigest({
      migrationExecutionBindingRef: args.binding.migrationExecutionBindingId,
      routeFamilyRef,
      verdictState,
      observationWindowRef: args.observationWindow.migrationObservationWindowId,
    }).slice(0, 16)}`,
    backfillPlanRef: args.backfillPlan.backfillPlanId,
    migrationExecutionBindingRef: args.binding.migrationExecutionBindingId,
    projectionBackfillExecutionLedgerRef: args.binding.projectionBackfillExecutionLedgerRef,
    audienceSurfaceRef: args.plan.affectedAudienceSurfaceRefs[0] ?? "surface::unknown",
    routeFamilyRef,
    projectionFamilyRefs: args.backfillPlan.projectionFamilies,
    requiredRouteContractDigestRef: args.plan.routeContractDigestRefs[0] ?? "route-digest::unknown",
    requiredProjectionContractVersionSetRef:
      args.backfillPlan.projectionContractVersionSetRefs[0] ??
      args.binding.projectionContractVersionSetRefs[0] ??
      "projection-version-set::unknown",
    requiredProjectionCompatibilityDigestRef:
      args.backfillPlan.projectionCompatibilityDigestRefs[0] ??
      args.binding.projectionCompatibilityDigestRefs[0] ??
      "projection-compatibility::unknown",
    readModelVersionSetRef: projectionVersionSet.projectionVersionSetRef,
    coverageState,
    lagState,
    contractCompatibilityState,
    freshnessCeilingRef: `freshness::lag<=${args.backfillPlan.expectedLagBudget}`,
    allowedSurfaceState,
    lastMigrationObservationWindowRef: args.observationWindow.migrationObservationWindowId,
    lastVerifiedAt: args.binding.validatedAt,
    verdictState,
    blockerRefs,
    reason,
    projectionVerdict,
  };
}

export class InMemoryMigrationControlStore {
  private readonly previews = new Map<string, MigrationImpactPreview>();
  private readonly actions = new Map<string, MigrationActionRecord>();
  private readonly receipts = new Map<string, MigrationExecutionReceipt>();
  private readonly observations = new Map<string, MigrationActionObservationWindow>();
  private readonly settlements = new Map<string, MigrationActionSettlement>();
  private readonly routeVerdicts = new Map<string, MigrationRouteReadinessVerdict>();

  saveImpactPreview(preview: MigrationImpactPreview): void {
    this.previews.set(preview.migrationImpactPreviewId, preview);
  }

  saveActionRecord(record: MigrationActionRecord): void {
    this.actions.set(record.migrationActionRecordId, record);
  }

  saveReceipt(receipt: MigrationExecutionReceipt): void {
    this.receipts.set(receipt.migrationExecutionReceiptId, receipt);
  }

  saveObservationWindow(window: MigrationActionObservationWindow): void {
    this.observations.set(window.migrationObservationWindowId, window);
  }

  saveSettlement(settlement: MigrationActionSettlement): void {
    this.settlements.set(settlement.migrationActionSettlementId, settlement);
  }

  saveRouteVerdict(verdict: MigrationRouteReadinessVerdict): void {
    this.routeVerdicts.set(verdict.projectionReadinessVerdictId, verdict);
  }

  listImpactPreviews(): readonly MigrationImpactPreview[] {
    return [...this.previews.values()];
  }

  listActionRecords(): readonly MigrationActionRecord[] {
    return [...this.actions.values()];
  }

  listReceipts(): readonly MigrationExecutionReceipt[] {
    return [...this.receipts.values()];
  }

  listObservationWindows(): readonly MigrationActionObservationWindow[] {
    return [...this.observations.values()];
  }

  listSettlements(): readonly MigrationActionSettlement[] {
    return [...this.settlements.values()];
  }

  listRouteVerdicts(): readonly MigrationRouteReadinessVerdict[] {
    return [...this.routeVerdicts.values()];
  }
}

export class MigrationBackfillRunner {
  constructor(private readonly store: InMemoryMigrationControlStore) {}

  preview(args: Omit<MigrationExecutionContext, "projectionWorker" | "eventStream" | "targets">) {
    const publicationVerdict = evaluateRuntimePublicationAuthority({
      bundle: args.bundle,
      currentBundle: args.currentBundle,
      parityRecord: args.parityRecord,
      currentParity: args.currentParity,
    });
    const projectedVerdictState: MigrationVerdictState = publicationVerdict.publishable
      ? args.plan.compatibilityWindow.windowState === "cutover_ready" &&
        args.binding.cutoverState === "cutover_ready"
        ? "ready"
        : "constrained"
      : "blocked";
    const impactPreview = createMigrationImpactPreview({
      plan: args.plan,
      backfillPlan: args.backfillPlan,
      binding: args.binding,
      publicationVerdict,
      projectedVerdictState,
    });
    this.store.saveImpactPreview(impactPreview);
    return { publicationVerdict, impactPreview };
  }

  async execute(context: MigrationExecutionContext): Promise<MigrationExecutionRunResult> {
    const planValidation = validateSchemaMigrationPlan(context.plan);
    if (!planValidation.valid) {
      throw new Error(planValidation.errors.join("; "));
    }
    const backfillValidation = validateGovernedProjectionBackfillPlan(context.backfillPlan);
    if (!backfillValidation.valid) {
      throw new Error(backfillValidation.errors.join("; "));
    }

    const { publicationVerdict, impactPreview } = this.preview({
      plan: context.plan,
      backfillPlan: context.backfillPlan,
      binding: context.binding,
      bundle: context.bundle,
      currentBundle: context.currentBundle,
      parityRecord: context.parityRecord,
      currentParity: context.currentParity,
      intent: context.intent,
      options: context.options,
    });

    const submittedAt = context.binding.validatedAt;
    const baseAction = {
      routeIntentBindingRef:
        context.options.routeIntentBindingRef ??
        `rib::${stableDigest(context.binding.migrationExecutionBindingId).slice(0, 12)}`,
      migrationExecutionBindingRef: context.binding.migrationExecutionBindingId,
      releaseWatchTupleRef: context.binding.releaseWatchTupleRef,
      releasePublicationParityRef: context.binding.releasePublicationParityRef,
      readPathCompatibilityDigestRef: context.binding.readPathCompatibilityDigestRef,
      projectionBackfillExecutionLedgerRef: context.binding.projectionBackfillExecutionLedgerRef,
      migrationCutoverCheckpointRef: context.binding.migrationCutoverCheckpointRef,
      audienceSurfaceRuntimeBindingRefs: context.binding.audienceSurfaceRuntimeBindingRefs,
      expectedBindingState: context.binding.bindingState,
      expectedCutoverState: context.binding.cutoverState,
      impactPreviewRef: impactPreview.migrationImpactPreviewId,
      environmentRef: context.binding.environmentRef,
      storeScopeRef: context.plan.storeScope,
      backfillPlanRef: context.backfillPlan.backfillPlanId,
      submittedBy: context.options.operatorRef,
      submittedAt,
      idempotencyKey:
        context.options.idempotencyKey ??
        `idk::${stableDigest({
          migrationExecutionBindingId: context.binding.migrationExecutionBindingId,
          intent: context.intent,
          submittedAt,
        }).slice(0, 16)}`,
      commandActionRecordRef:
        context.options.commandActionRecordRef ??
        `car::${stableDigest({
          migrationExecutionBindingId: context.binding.migrationExecutionBindingId,
          command: context.options.actionType ?? "start_migration",
        }).slice(0, 16)}`,
    } as const;

    const startRecord: MigrationActionRecord = {
      migrationActionRecordId: `mar::${stableDigest({ phase: "expand", ...baseAction }).slice(0, 16)}`,
      ...baseAction,
      actionType: context.options.actionType ?? "start_migration",
      phase: "expand",
      actionState: publicationVerdict.publishable ? plannedActionState(context.intent) : "blocked",
      notes: publicationVerdict.publishable
        ? ["expand-migrate-contract entrypoint acknowledged against the bound runtime tuple"]
        : ["runtime publication authority blocked execution before schema expansion"],
    };
    this.store.saveActionRecord(startRecord);

    const acceptedState: MigrationExecutionAcceptedState = publicationVerdict.publishable
      ? "accepted"
      : "rejected";
    const executionReceipt: MigrationExecutionReceipt = {
      migrationExecutionReceiptId: `mer::${stableDigest(startRecord.migrationActionRecordId).slice(0, 16)}`,
      migrationActionRecordRef: startRecord.migrationActionRecordId,
      migrationExecutionBindingRef: context.binding.migrationExecutionBindingId,
      controlPlaneTxRef: `tx::${stableDigest(startRecord.idempotencyKey).slice(0, 12)}`,
      executionFenceEpoch: `epoch::${stableDigest(context.binding.bindingTupleHash).slice(0, 12)}`,
      acceptedBindingTupleHash: context.binding.bindingTupleHash,
      acceptedState,
      acceptedAt: submittedAt,
      acceptedByRef: context.options.operatorRef,
    };
    this.store.saveReceipt(executionReceipt);

    let backfillResult: ProjectionRebuildRunResult | null = null;
    if (publicationVerdict.publishable) {
      backfillResult = await context.projectionWorker.run({
        rebuildJobId: `mrj::${stableDigest(context.binding.migrationExecutionBindingId).slice(0, 16)}`,
        eventStream: context.eventStream,
        rebuildMode: context.intent === "dry_run" ? "dry_run" : context.backfillPlan.rebuildMode,
        targets: context.targets,
      });
    }

    const ledgerRef = backfillResult?.ledgers[0]?.rebuildJobId ?? null;
    const projectionVersion = projectionVersionByRef(context.backfillPlan.projectionVersionRef);
    const projectionVersionSet = projectionVersionSetByRef(
      context.backfillPlan.projectionContractVersionSetRefs[0] ??
        context.binding.projectionContractVersionSetRefs[0]!,
    );
    const projectionVerdict =
      backfillResult?.readinessVerdicts[0] ??
      evaluateProjectionReadinessVerdict({
        projectionVersionRef: projectionVersion.projectionVersionRef,
        projectionVersionSetRef: projectionVersionSet.projectionVersionSetRef,
        compatibilityVerdict: {
          projectionFamilyRef: projectionVersion.projectionFamilyRef,
          projectionVersionRef: projectionVersion.projectionVersionRef,
          projectionVersionSetRef: projectionVersionSet.projectionVersionSetRef,
          compatibilityState: publicationVerdict.publishable ? "dual_read" : "blocked",
          writableDisposition: publicationVerdict.publishable ? "guarded" : "blocked",
          missingSchemaVersionRefs: publicationVerdict.publishable
            ? []
            : context.plan.targetSchemaVersionRefs,
          activeVersionRefs: [projectionVersionSet.liveVersionRef],
          evaluatedAt: context.binding.validatedAt,
          reason: publicationVerdict.publishable
            ? "Compatibility window remains guarded until migration observation completes."
            : "Publication authority drifted before projection compatibility could be trusted.",
        },
        checkpointLag: publicationVerdict.publishable
          ? 0
          : context.backfillPlan.expectedLagBudget + 1,
        checkpointToken: backfillResult?.ledgers[0]?.checkpointToken ?? null,
        rebuildState: publicationVerdict.publishable
          ? ((backfillResult?.ledgers[0]?.rebuildState as ProjectionRebuildState | undefined) ??
            (context.intent === "dry_run" ? "completed" : "running"))
          : "blocked",
      });

    const comparisonMatches = context.options.comparisonMatches ?? context.intent === "dry_run";
    const rollbackModeMatches = context.options.rollbackModeMatches ?? true;
    const observedMinutes = context.options.observedMinutes ?? 0;
    const observedSamples = context.options.observedSamples ?? 0;
    const convergencePercent = defaultConvergencePercent(backfillResult);

    const provisionalObservationState: MigrationObservationState = !publicationVerdict.publishable
      ? "stale"
      : observedMinutes >= context.plan.compatibilityWindow.minimumObservationMinutes &&
          observedSamples >= context.plan.compatibilityWindow.minimumObservationSamples &&
          comparisonMatches &&
          rollbackModeMatches &&
          convergencePercent >= 100
        ? "satisfied"
        : rollbackModeMatches
          ? "open"
          : "rollback_required";
    const observationWindow: MigrationActionObservationWindow = {
      migrationObservationWindowId: `mow::${stableDigest({
        migrationExecutionBindingId: context.binding.migrationExecutionBindingId,
        observedMinutes,
        observedSamples,
      }).slice(0, 16)}`,
      migrationActionRecordRef: startRecord.migrationActionRecordId,
      migrationExecutionBindingRef: context.binding.migrationExecutionBindingId,
      releaseWatchTupleRef: context.binding.releaseWatchTupleRef,
      startsAt: context.plan.compatibilityWindow.opensAt,
      closesAt: context.plan.compatibilityWindow.closesAt,
      requiredProbeRefs: [
        `probe::minutes>=${context.plan.compatibilityWindow.minimumObservationMinutes}`,
        `probe::samples>=${context.plan.compatibilityWindow.minimumObservationSamples}`,
      ],
      observedRuntimePublicationBundleRef: context.bundle.runtimePublicationBundleId,
      observedPublicationParityRef: context.parityRecord.publicationParityRecordId,
      observedReadPathCompatibilityWindowRef: context.plan.readPathCompatibilityWindowRef,
      observedReadPathCompatibilityDigestRef: context.binding.readPathCompatibilityDigestRef,
      observedProjectionCompatibilityDigestRefs: context.binding.projectionCompatibilityDigestRefs,
      observedProjectionReadinessVerdictRefs: [],
      observedProjectionBackfillExecutionLedgerRef: ledgerRef,
      observedMigrationCutoverCheckpointRef: backfillResult?.ledgers[0]?.checkpointToken ?? null,
      observedAudienceSurfaceRuntimeBindingRefs: context.binding.audienceSurfaceRuntimeBindingRefs,
      observedRecoveryDispositionRefs: context.plan.requiredRecoveryDispositionRefs,
      routePostureState: publicationVerdict.publishable
        ? provisionalObservationState === "satisfied"
          ? "converged"
          : provisionalObservationState === "rollback_required"
            ? "rollback_required"
            : "constrained"
        : "freeze_conflict",
      observationState: provisionalObservationState,
      closedAt: provisionalObservationState === "open" ? null : context.binding.validatedAt,
    };

    const routeReadinessVerdict = evaluateMigrationRouteReadiness({
      plan: context.plan,
      backfillPlan: context.backfillPlan,
      binding: {
        ...context.binding,
        projectionBackfillExecutionLedgerRef: ledgerRef,
        migrationCutoverCheckpointRef: backfillResult?.ledgers[0]?.checkpointToken ?? null,
      },
      publicationVerdict,
      projectionVerdict,
      observationWindow,
      convergencePercent,
      comparisonMatches,
      rollbackModeMatches,
      observedMinutes,
      observedSamples,
    });
    this.store.saveRouteVerdict(routeReadinessVerdict);

    const finalObservationWindow: MigrationActionObservationWindow = {
      ...observationWindow,
      observedProjectionReadinessVerdictRefs: [routeReadinessVerdict.projectionReadinessVerdictId],
    };
    this.store.saveObservationWindow(finalObservationWindow);

    const contractRecord: MigrationActionRecord = {
      migrationActionRecordId: `mar::${stableDigest({ phase: "contract", ...baseAction }).slice(0, 16)}`,
      ...baseAction,
      actionType:
        routeReadinessVerdict.verdictState === "ready" ? "complete_migration" : "abort_migration",
      phase: "contract",
      actionState:
        routeReadinessVerdict.verdictState === "ready"
          ? plannedActionState(context.intent)
          : "blocked",
      notes:
        routeReadinessVerdict.verdictState === "ready"
          ? ["contract phase is eligible because observation and convergence evidence satisfied"]
          : ["contract phase held because route readiness is not live"],
    };
    this.store.saveActionRecord(contractRecord);

    const settlementResult: MigrationSettlementResult = !publicationVerdict.publishable
      ? "blocked_policy"
      : routeReadinessVerdict.verdictState === "ready" && context.intent === "execute"
        ? "applied"
        : routeReadinessVerdict.verdictState === "blocked"
          ? routeReadinessVerdict.blockerRefs.includes("ROLLBACK_MODE_MISMATCH")
            ? "rollback_required"
            : "stale_recoverable"
          : "accepted_pending_observation";

    const settlement: MigrationActionSettlement = {
      migrationActionSettlementId: `mas::${stableDigest({
        actionRecordRef: contractRecord.migrationActionRecordId,
        result: settlementResult,
      }).slice(0, 16)}`,
      migrationActionRecordRef: contractRecord.migrationActionRecordId,
      commandSettlementRecordRef: `csr::${stableDigest(contractRecord.commandActionRecordRef).slice(0, 12)}`,
      transitionEnvelopeRef: `tenv::${stableDigest(contractRecord.migrationActionRecordId).slice(0, 12)}`,
      result: settlementResult,
      executionReceiptRef: executionReceipt.migrationExecutionReceiptId,
      observationWindowRef: finalObservationWindow.migrationObservationWindowId,
      observedPublicationParityRef: context.parityRecord.publicationParityRecordId,
      observedReadPathCompatibilityDigestRef: context.binding.readPathCompatibilityDigestRef,
      observedProjectionBackfillExecutionLedgerRef: ledgerRef,
      observedMigrationCutoverCheckpointRef: backfillResult?.ledgers[0]?.checkpointToken ?? null,
      observedProjectionReadinessVerdictRefs: [routeReadinessVerdict.projectionReadinessVerdictId],
      observationState: finalObservationWindow.observationState,
      releaseRecoveryDispositionRef:
        routeReadinessVerdict.verdictState === "ready"
          ? null
          : (context.plan.requiredRecoveryDispositionRefs[0] ?? null),
      compatibilityEvidenceRef: context.plan.compatibilityEvidenceRef,
      supersededByMigrationActionRef: null,
      settledAt: context.binding.validatedAt,
      verdictState: routeReadinessVerdict.verdictState,
      reason: routeReadinessVerdict.reason,
      blockerRefs: routeReadinessVerdict.blockerRefs,
    };
    this.store.saveSettlement(settlement);

    return {
      publicationVerdict,
      impactPreview,
      actionRecords: [startRecord, contractRecord],
      executionReceipt,
      observationWindow: finalObservationWindow,
      settlement,
      routeReadinessVerdicts: [routeReadinessVerdict],
      backfillResult,
    };
  }
}

export function createMigrationBackfillSimulationHarness(): MigrationBackfillSimulationHarness {
  const publicationHarness = createRuntimePublicationSimulationHarness();
  const projectionHarness = createProjectionRebuildSimulationHarness();
  const baseBackfillPlan = projectionBackfillPlanCatalog.find(
    (entry) => entry.backfillPlanRef === "PBP_082_PATIENT_REQUESTS_V2",
  );
  if (!baseBackfillPlan) {
    throw new Error("Missing patient requests dual-read backfill plan.");
  }
  const compatibilityWindow = compatibilityWindowByRef("PRCW_082_PATIENT_REQUESTS_DUAL_READ");
  const versionSet = projectionVersionSetByRef("PRCVS_082_PATIENT_REQUESTS_DUAL_READ");
  const routeContractDigestRefs = [stableDigest({ routeFamilyRef: versionSet.routeFamilyRef })];
  const projectionCompatibilityDigestRefs = [
    stableDigest({ versionSet: versionSet.projectionVersionSetRef }),
  ];
  const bindingTupleHash = stableDigest({
    bundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    parityRef: publicationHarness.parityRecord.publicationParityRecordId,
    versionSetRef: versionSet.projectionVersionSetRef,
    windowRef: compatibilityWindow.compatibilityWindowRef,
  });

  const plan: SchemaMigrationPlan = {
    migrationPlanId: "SMP_095_PATIENT_REQUESTS_ADDITIVE",
    storeScope: "domain_projection_patient_requests",
    changeType: "additive",
    releaseApprovalFreezeRef: publicationHarness.bundle.releaseApprovalFreezeRef,
    sourceSchemaVersionRefs: ["CESV_REQUEST_CREATED_V1", "CESV_REQUEST_SUBMITTED_V1"],
    targetSchemaVersionRefs: ["CESV_REQUEST_CREATED_V1", "CESV_REQUEST_SUBMITTED_V1"],
    compatibilityWindow: {
      migrationWindowRef: "MCW_095_PATIENT_REQUESTS_DUAL_READ",
      windowState: "dual_read",
      minimumObservationMinutes: 30,
      minimumObservationSamples: 3,
      opensAt: "2026-04-13T12:00:00Z",
      closesAt: "2026-04-13T13:30:00Z",
      sourceRefs: [
        "prompt/095.md",
        "blueprint/platform-runtime-and-release-blueprint.md#ReadPathCompatibilityWindow",
      ],
    },
    executionOrder: ["expand", "migrate", "contract"],
    affectedAudienceSurfaceRefs: ["surface::patient-home"],
    affectedRouteFamilyRefs: [versionSet.routeFamilyRef],
    routeContractDigestRefs,
    sourceProjectionContractVersionSetRefs: ["PRCVS_082_PATIENT_REQUESTS_V1"],
    targetProjectionContractVersionSetRefs: [versionSet.projectionVersionSetRef],
    sourceProjectionCompatibilityDigestRefs: [
      stableDigest({ versionSet: "PRCVS_082_PATIENT_REQUESTS_V1" }),
    ],
    targetProjectionCompatibilityDigestRefs: projectionCompatibilityDigestRefs,
    readPathCompatibilityWindowRef: compatibilityWindow.compatibilityWindowRef,
    runtimePublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    releasePublicationParityRef: publicationHarness.parityRecord.publicationParityRecordId,
    preCutoverPublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    targetPublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    rollbackPublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    requiredRecoveryDispositionRefs: ["recovery-disposition::patient-home"],
    requiredContinuityControlRefs: ["continuity-control::patient-home"],
    environmentBaselineFingerprintRef: "baseline::ci-preview",
    compatibilityEvidenceRef: "evidence::patient-requests-dual-read",
    contractRemovalGuardRef: "guard::patient-requests-summary-digest",
    migrationExecutionBindingRef: "MEB_095_PATIENT_REQUESTS_DUAL_READ",
    verificationRefs: ["verification::patient-requests-dual-read"],
    rollbackMode: "flag_only",
    planState: "ready",
    sourceRefs: [
      "prompt/095.md",
      "blueprint/platform-runtime-and-release-blueprint.md#SchemaMigrationPlan",
    ],
  };
  const backfillPlan: GovernedProjectionBackfillPlan = {
    ...baseBackfillPlan,
    backfillPlanId: "PBP_095_PATIENT_REQUESTS_DUAL_READ",
    projectionFamilies: ["PRCF_082_PATIENT_REQUESTS"],
    releaseApprovalFreezeRef: publicationHarness.bundle.releaseApprovalFreezeRef,
    sourceEventWindow: {
      fromInclusive: 1,
      toInclusive: projectionHarness.eventStream.length,
    },
    expectedLagBudget: 0,
    rebuildStrategy: "shadow_compare",
    affectedAudienceSurfaceRefs: ["surface::patient-home"],
    routeImpactRefs: [versionSet.routeFamilyRef],
    routeContractDigestRefs,
    projectionContractVersionSetRefs: [versionSet.projectionVersionSetRef],
    projectionCompatibilityDigestRefs,
    readPathCompatibilityWindowRef: compatibilityWindow.compatibilityWindowRef,
    runtimePublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    releasePublicationParityRef: publicationHarness.parityRecord.publicationParityRecordId,
    requiredRecoveryDispositionRefs: ["recovery-disposition::patient-home"],
    stopResumeFenceRef: "fence::patient-requests-dual-read",
    syntheticRecoveryCoverageRefs: ["coverage::patient-home::summary"],
    projectionReadinessVerdictRefs: [],
    lagVisibilityEvidenceRef: "evidence::lag::patient-home",
    cutoverReadinessState: "not_ready",
    rollbackReadModelRef: "read-model::patient-requests-v1",
    migrationExecutionBindingRef: plan.migrationExecutionBindingRef,
    successEvidenceRef: "evidence::patient-home::readiness",
  };
  const binding: MigrationExecutionBinding = {
    migrationExecutionBindingId: plan.migrationExecutionBindingRef,
    migrationPlanRef: plan.migrationPlanId,
    projectionBackfillPlanRef: backfillPlan.backfillPlanId,
    verificationScenarioRef: "scenario::ci-preview::patient-requests",
    environmentBaselineFingerprintRef: plan.environmentBaselineFingerprintRef,
    releaseApprovalFreezeRef: plan.releaseApprovalFreezeRef,
    releasePublicationParityRef: publicationHarness.parityRecord.publicationParityRecordId,
    releaseWatchTupleRef: publicationHarness.bundle.watchTupleHash,
    runtimePublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    audienceSurfaceRuntimeBindingRefs: publicationHarness.bundle.surfaceRuntimeBindingRefs,
    routeContractDigestRefs,
    projectionContractVersionSetRefs: [versionSet.projectionVersionSetRef],
    projectionCompatibilityDigestRefs,
    readPathCompatibilityWindowRef: compatibilityWindow.compatibilityWindowRef,
    readPathCompatibilityDigestRef: stableDigest({
      windowRef: compatibilityWindow.compatibilityWindowRef,
      routeContractDigestRefs,
      projectionCompatibilityDigestRefs,
    }),
    projectionReadinessVerdictRefs: [],
    projectionBackfillExecutionLedgerRef: null,
    migrationCutoverCheckpointRef: null,
    preCutoverPublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    targetPublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    rollbackPublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
    requiredRecoveryDispositionRefs: plan.requiredRecoveryDispositionRefs,
    requiredContinuityControlRefs: plan.requiredContinuityControlRefs,
    bindingTupleHash,
    provenanceState: "verified",
    cutoverState: "dual_read",
    bindingState: "ready",
    lastMigrationActionSettlementRef: null,
    validatedAt: "2026-04-13T12:00:00Z",
    environmentRef: "ci-preview",
    seedSetRef: "seed-pack::preview::patient-home",
    sourceRefs: [
      "prompt/095.md",
      "blueprint/platform-runtime-and-release-blueprint.md#MigrationExecutionBinding",
    ],
  };
  const store = new InMemoryMigrationControlStore();
  return {
    bundle: publicationHarness.bundle,
    currentBundle: {
      runtimeTopologyManifestRef: publicationHarness.bundle.runtimeTopologyManifestRef,
      workloadFamilyRefs: publicationHarness.bundle.workloadFamilyRefs,
      trustZoneBoundaryRefs: publicationHarness.bundle.trustZoneBoundaryRefs,
      gatewaySurfaceRefs: publicationHarness.bundle.gatewaySurfaceRefs,
      routeContractDigestRefs: publicationHarness.bundle.routeContractDigestRefs,
      frontendContractManifestRefs: publicationHarness.bundle.frontendContractManifestRefs,
      frontendContractDigestRefs: publicationHarness.bundle.frontendContractDigestRefs,
      designContractPublicationBundleRefs:
        publicationHarness.bundle.designContractPublicationBundleRefs,
      designContractDigestRefs: publicationHarness.bundle.designContractDigestRefs,
      designContractLintVerdictRefs: publicationHarness.bundle.designContractLintVerdictRefs,
      projectionContractFamilyRefs: publicationHarness.bundle.projectionContractFamilyRefs,
      projectionContractVersionRefs: publicationHarness.bundle.projectionContractVersionRefs,
      projectionContractVersionSetRefs: publicationHarness.bundle.projectionContractVersionSetRefs,
      projectionCompatibilityDigestRefs:
        publicationHarness.bundle.projectionCompatibilityDigestRefs,
      projectionQueryContractDigestRefs:
        publicationHarness.bundle.projectionQueryContractDigestRefs,
      mutationCommandContractDigestRefs:
        publicationHarness.bundle.mutationCommandContractDigestRefs,
      liveUpdateChannelDigestRefs: publicationHarness.bundle.liveUpdateChannelDigestRefs,
      clientCachePolicyDigestRefs: publicationHarness.bundle.clientCachePolicyDigestRefs,
      releaseContractVerificationMatrixRef:
        publicationHarness.bundle.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: publicationHarness.bundle.releaseContractMatrixHash,
      commandSettlementSchemaSetRef: publicationHarness.bundle.commandSettlementSchemaSetRef,
      transitionEnvelopeSchemaSetRef: publicationHarness.bundle.transitionEnvelopeSchemaSetRef,
      recoveryDispositionSetRef: publicationHarness.bundle.recoveryDispositionSetRef,
      routeFreezeDispositionRefs: publicationHarness.bundle.routeFreezeDispositionRefs,
      continuityEvidenceContractRefs: publicationHarness.bundle.continuityEvidenceContractRefs,
      surfacePublicationRefs: publicationHarness.bundle.surfacePublicationRefs,
      surfaceRuntimeBindingRefs: publicationHarness.bundle.surfaceRuntimeBindingRefs,
      buildProvenanceRef: publicationHarness.bundle.buildProvenanceRef,
      provenanceVerificationState: publicationHarness.bundle.provenanceVerificationState,
      provenanceConsumptionState: publicationHarness.bundle.provenanceConsumptionState,
    },
    parityRecord: publicationHarness.parityRecord,
    currentParity: {
      releaseContractVerificationMatrixRef:
        publicationHarness.parityRecord.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: publicationHarness.parityRecord.releaseContractMatrixHash,
      routeContractDigestRefs: publicationHarness.parityRecord.routeContractDigestRefs,
      frontendContractDigestRefs: publicationHarness.parityRecord.frontendContractDigestRefs,
      projectionCompatibilityDigestRefs:
        publicationHarness.parityRecord.projectionCompatibilityDigestRefs,
      surfacePublicationRefs: publicationHarness.parityRecord.surfacePublicationRefs,
      surfaceRuntimeBindingRefs: publicationHarness.parityRecord.surfaceRuntimeBindingRefs,
      activeChannelFreezeRefs: publicationHarness.parityRecord.activeChannelFreezeRefs,
      recoveryDispositionRefs: publicationHarness.parityRecord.recoveryDispositionRefs,
      continuityEvidenceDigestRefs: publicationHarness.parityRecord.continuityEvidenceDigestRefs,
      provenanceVerificationState: publicationHarness.parityRecord.provenanceVerificationState,
      provenanceConsumptionState: publicationHarness.parityRecord.provenanceConsumptionState,
      bundleTupleHash: publicationHarness.parityRecord.bundleTupleHash,
      matrixGroupStates: publicationHarness.parityRecord.matrixGroupStates,
      driftReasonIds: publicationHarness.parityRecord.driftReasonIds,
      bindingCeilingReasons: publicationHarness.parityRecord.bindingCeilingReasons,
    },
    plan,
    backfillPlan,
    binding,
    store,
    runner: new MigrationBackfillRunner(store),
    projectionWorker: projectionHarness.worker,
    eventStream: projectionHarness.eventStream,
  };
}

export async function runMigrationBackfillSimulation() {
  const harness = createMigrationBackfillSimulationHarness();
  const readyDryRun = await harness.runner.execute({
    plan: harness.plan,
    backfillPlan: harness.backfillPlan,
    binding: harness.binding,
    bundle: harness.bundle,
    currentBundle: harness.currentBundle,
    parityRecord: harness.parityRecord,
    currentParity: harness.currentParity,
    projectionWorker: harness.projectionWorker,
    eventStream: harness.eventStream,
    targets: [
      {
        projectionFamilyRef: harness.backfillPlan.projectionFamilyRef,
        projectionVersionRef: harness.backfillPlan.projectionVersionRef,
        projectionVersionSetRef: harness.backfillPlan.projectionContractVersionSetRefs[0]!,
      },
    ],
    intent: "dry_run",
    options: {
      operatorRef: "operator::simulation",
      observedMinutes: 45,
      observedSamples: 4,
      comparisonMatches: true,
      rollbackModeMatches: true,
    },
  });

  return {
    task_id: "par_095",
    summary: {
      preview_count: harness.store.listImpactPreviews().length,
      action_record_count: harness.store.listActionRecords().length,
      observation_window_count: harness.store.listObservationWindows().length,
      settlement_count: harness.store.listSettlements().length,
      verdict_count: harness.store.listRouteVerdicts().length,
    },
    readyDryRun,
  };
}
