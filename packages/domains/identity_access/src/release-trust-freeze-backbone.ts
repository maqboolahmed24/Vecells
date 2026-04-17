import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
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

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSortedRefs(values: readonly string[]): string[] {
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

function nextReleaseTrustId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export type GovernanceReviewPackageState = "current" | "stale" | "superseded" | "blocked";
export type StandardsCompileGateState = "pass" | "review_required" | "blocked";
export type StandardsPromotionGateState = "pass" | "review_required" | "blocked";
export type StandardsWatchlistState = "current" | "stale" | "superseded" | "blocked";
export type ReleaseApprovalFreezeState = "active" | "superseded" | "expired";
export type ChannelReleaseState =
  | "monitoring"
  | "frozen"
  | "kill_switch_active"
  | "rollback_recommended"
  | "released";
export type RequiredAssuranceTrustState = "trusted" | "degraded" | "quarantined" | "unknown";
export type RequiredAssuranceCompletenessState = "complete" | "partial" | "blocked";
export type ProvenanceConsumptionState = "publishable" | "blocked" | "withdrawn";
export type ReleaseTrustSurfaceAuthorityState =
  | "live"
  | "diagnostic_only"
  | "recovery_only"
  | "blocked";
export type ReleaseTrustCalmTruthState = "allowed" | "suppressed";
export type ReleaseTrustMutationAuthorityState =
  | "enabled"
  | "governed_recovery"
  | "observe_only"
  | "blocked";
export type ReleaseWatchTupleState = "active" | "stale" | "superseded" | "missing";
export type WaveGuardrailState = "green" | "constrained" | "frozen" | "rollback_review_required";
export type RuntimePublicationState = "published" | "stale" | "withdrawn" | "missing";
export type ReleasePublicationParityState = "exact" | "drifted" | "stale" | "blocked" | "missing";
export type ReleaseTrustOperationalState =
  | "trusted"
  | "degraded"
  | "recovery_bound"
  | "quarantined";

export interface GovernanceReviewPackageRecord {
  governanceReviewPackageId: string;
  scopeTupleHash: string;
  baselineTupleHash: string;
  compiledPolicyBundleRef: string;
  releaseWatchTupleRef: string;
  watchTupleHash: string;
  compilationTupleHash: string;
  approvalTupleHash: string;
  standardsWatchlistHash: string;
  settlementLineageRef: string;
  reviewPackageHash: string;
  packageState: GovernanceReviewPackageState;
  assembledAt: string;
  version: number;
}

export interface PersistedGovernanceReviewPackageRow extends GovernanceReviewPackageRecord {
  aggregateType: "GovernanceReviewPackage";
  persistenceSchemaVersion: 1;
}

export interface StandardsDependencyWatchlistRecord {
  standardsDependencyWatchlistId: string;
  candidateBundleHash: string;
  liveBundleHash: string;
  environmentRef: string;
  tenantScopeRef: string;
  scopeTupleHash: string;
  reviewPackageHash: string;
  blockingFindingRefs: readonly string[];
  advisoryFindingRefs: readonly string[];
  compileGateState: StandardsCompileGateState;
  promotionGateState: StandardsPromotionGateState;
  watchlistState: StandardsWatchlistState;
  watchlistHash: string;
  generatedAt: string;
  version: number;
}

export interface PersistedStandardsDependencyWatchlistRow
  extends StandardsDependencyWatchlistRecord {
  aggregateType: "StandardsDependencyWatchlist";
  persistenceSchemaVersion: 1;
}

export interface ReleaseApprovalFreezeSnapshot {
  releaseApprovalFreezeId: string;
  releaseCandidateRef: string;
  governanceReviewPackageRef: string;
  standardsDependencyWatchlistRef: string;
  compiledPolicyBundleRef: string;
  baselineTupleHash: string;
  scopeTupleHash: string;
  compilationTupleHash: string;
  approvalTupleHash: string;
  reviewPackageHash: string;
  standardsWatchlistHash: string;
  artifactDigestSetHash: string;
  surfaceSchemaSetHash: string;
  bridgeCapabilitySetHash: string;
  migrationPlanHash: string;
  compatibilityEvidenceRef: string;
  approvedBy: string;
  approvedAt: string;
  freezeState: ReleaseApprovalFreezeState;
  version: number;
}

export interface PersistedReleaseApprovalFreezeRow extends ReleaseApprovalFreezeSnapshot {
  aggregateType: "ReleaseApprovalFreeze";
  persistenceSchemaVersion: 1;
}

export interface ChannelReleaseFreezeRecordSnapshot {
  channelFreezeId: string;
  channelFamily: string;
  manifestVersionRef: string;
  releaseApprovalFreezeRef: string;
  minimumBridgeCapabilitiesRef: string;
  channelState: ChannelReleaseState;
  effectiveAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedChannelReleaseFreezeRecordRow extends ChannelReleaseFreezeRecordSnapshot {
  aggregateType: "ChannelReleaseFreezeRecord";
  persistenceSchemaVersion: 1;
}

export interface RequiredAssuranceSliceSnapshot {
  sliceTrustId: string;
  sliceNamespace: string;
  trustState: RequiredAssuranceTrustState;
  completenessState: RequiredAssuranceCompletenessState;
  trustLowerBound: number;
  hardBlockState: boolean;
  blockingProducerRefs: readonly string[];
  blockingNamespaceRefs: readonly string[];
  evaluationModelRef: string;
  reviewDueAt: string;
  updatedAt: string;
}

export interface ReleaseTrustFreezeVerdictSnapshot {
  releaseTrustFreezeVerdictId: string;
  audienceSurface: string;
  routeFamilyRef: string;
  releaseApprovalFreezeRef: string;
  releaseWatchTupleRef: string;
  waveGuardrailSnapshotRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  requiredChannelFreezeRefs: readonly string[];
  requiredAssuranceSliceTrustRefs: readonly string[];
  provenanceConsumptionState: ProvenanceConsumptionState;
  surfaceAuthorityState: ReleaseTrustSurfaceAuthorityState;
  calmTruthState: ReleaseTrustCalmTruthState;
  mutationAuthorityState: ReleaseTrustMutationAuthorityState;
  governingRecoveryDispositionRef: string | null;
  blockerRefs: readonly string[];
  evaluatedAt: string;
  version: number;
}

export interface PersistedReleaseTrustFreezeVerdictRow extends ReleaseTrustFreezeVerdictSnapshot {
  aggregateType: "ReleaseTrustFreezeVerdict";
  persistenceSchemaVersion: 1;
}

export interface ReleaseApprovalFreezeDriftResult {
  freeze: ReleaseApprovalFreezeSnapshot;
  governanceReviewPackage: GovernanceReviewPackageRecord;
  standardsWatchlist: StandardsDependencyWatchlistRecord;
  blockers: readonly string[];
}

export interface EvaluateReleaseTrustFreezeVerdictInput {
  audienceSurface: string;
  routeFamilyRef: string;
  releaseApprovalFreeze: ReleaseApprovalFreezeSnapshot;
  governanceReviewPackage: GovernanceReviewPackageRecord;
  standardsWatchlist: StandardsDependencyWatchlistRecord;
  releaseWatchTupleRef: string;
  releaseWatchTupleState: ReleaseWatchTupleState;
  waveGuardrailSnapshotRef: string;
  waveGuardrailState: WaveGuardrailState;
  runtimePublicationBundleRef: string;
  runtimePublicationState: RuntimePublicationState;
  releasePublicationParityRef: string;
  releasePublicationParityState: ReleasePublicationParityState;
  requiredChannelFreezes: readonly ChannelReleaseFreezeRecordSnapshot[];
  requiredAssuranceSlices: readonly RequiredAssuranceSliceSnapshot[];
  provenanceConsumptionState: ProvenanceConsumptionState;
  governingRecoveryDispositionRef?: string | null;
  evaluatedAt: string;
}

export interface ReleaseTrustFreezeVerdictEvaluationResult {
  snapshot: ReleaseTrustFreezeVerdictSnapshot;
  blockers: readonly string[];
}

function normalizeGovernanceReviewPackageRecord(
  record: GovernanceReviewPackageRecord,
): GovernanceReviewPackageRecord {
  return {
    ...record,
    governanceReviewPackageId: requireRef(
      record.governanceReviewPackageId,
      "governanceReviewPackageId",
    ),
    scopeTupleHash: requireRef(record.scopeTupleHash, "scopeTupleHash"),
    baselineTupleHash: requireRef(record.baselineTupleHash, "baselineTupleHash"),
    compiledPolicyBundleRef: requireRef(record.compiledPolicyBundleRef, "compiledPolicyBundleRef"),
    releaseWatchTupleRef: requireRef(record.releaseWatchTupleRef, "releaseWatchTupleRef"),
    watchTupleHash: requireRef(record.watchTupleHash, "watchTupleHash"),
    compilationTupleHash: requireRef(record.compilationTupleHash, "compilationTupleHash"),
    approvalTupleHash: requireRef(record.approvalTupleHash, "approvalTupleHash"),
    standardsWatchlistHash: requireRef(record.standardsWatchlistHash, "standardsWatchlistHash"),
    settlementLineageRef: requireRef(record.settlementLineageRef, "settlementLineageRef"),
    reviewPackageHash: requireRef(record.reviewPackageHash, "reviewPackageHash"),
    assembledAt: ensureIsoTimestamp(record.assembledAt, "assembledAt"),
    version: ensurePositiveInteger(record.version, "version"),
  };
}

export function validateGovernanceReviewPackageRecord(
  record: GovernanceReviewPackageRecord,
): GovernanceReviewPackageRecord {
  return normalizeGovernanceReviewPackageRecord(record);
}

function normalizeStandardsDependencyWatchlistRecord(
  record: StandardsDependencyWatchlistRecord,
): StandardsDependencyWatchlistRecord {
  return {
    ...record,
    standardsDependencyWatchlistId: requireRef(
      record.standardsDependencyWatchlistId,
      "standardsDependencyWatchlistId",
    ),
    candidateBundleHash: requireRef(record.candidateBundleHash, "candidateBundleHash"),
    liveBundleHash: requireRef(record.liveBundleHash, "liveBundleHash"),
    environmentRef: requireRef(record.environmentRef, "environmentRef"),
    tenantScopeRef: requireRef(record.tenantScopeRef, "tenantScopeRef"),
    scopeTupleHash: requireRef(record.scopeTupleHash, "scopeTupleHash"),
    reviewPackageHash: requireRef(record.reviewPackageHash, "reviewPackageHash"),
    blockingFindingRefs: uniqueSortedRefs(record.blockingFindingRefs),
    advisoryFindingRefs: uniqueSortedRefs(record.advisoryFindingRefs),
    watchlistHash: requireRef(record.watchlistHash, "watchlistHash"),
    generatedAt: ensureIsoTimestamp(record.generatedAt, "generatedAt"),
    version: ensurePositiveInteger(record.version, "version"),
  };
}

export function validateStandardsDependencyWatchlistRecord(
  record: StandardsDependencyWatchlistRecord,
): StandardsDependencyWatchlistRecord {
  const normalized = normalizeStandardsDependencyWatchlistRecord(record);
  if (normalized.watchlistState === "current") {
    invariant(
      normalized.compileGateState !== "blocked" && normalized.promotionGateState !== "blocked",
      "CURRENT_WATCHLIST_CANNOT_BE_BLOCKED",
      "Current watchlists may not preserve blocked compile or promotion states.",
    );
  }
  return normalized;
}

export function validateReleaseApprovalFreeze(
  snapshot: ReleaseApprovalFreezeSnapshot,
): ReleaseApprovalFreezeSnapshot {
  return {
    ...snapshot,
    releaseApprovalFreezeId: requireRef(
      snapshot.releaseApprovalFreezeId,
      "releaseApprovalFreezeId",
    ),
    releaseCandidateRef: requireRef(snapshot.releaseCandidateRef, "releaseCandidateRef"),
    governanceReviewPackageRef: requireRef(
      snapshot.governanceReviewPackageRef,
      "governanceReviewPackageRef",
    ),
    standardsDependencyWatchlistRef: requireRef(
      snapshot.standardsDependencyWatchlistRef,
      "standardsDependencyWatchlistRef",
    ),
    compiledPolicyBundleRef: requireRef(
      snapshot.compiledPolicyBundleRef,
      "compiledPolicyBundleRef",
    ),
    baselineTupleHash: requireRef(snapshot.baselineTupleHash, "baselineTupleHash"),
    scopeTupleHash: requireRef(snapshot.scopeTupleHash, "scopeTupleHash"),
    compilationTupleHash: requireRef(snapshot.compilationTupleHash, "compilationTupleHash"),
    approvalTupleHash: requireRef(snapshot.approvalTupleHash, "approvalTupleHash"),
    reviewPackageHash: requireRef(snapshot.reviewPackageHash, "reviewPackageHash"),
    standardsWatchlistHash: requireRef(snapshot.standardsWatchlistHash, "standardsWatchlistHash"),
    artifactDigestSetHash: requireRef(snapshot.artifactDigestSetHash, "artifactDigestSetHash"),
    surfaceSchemaSetHash: requireRef(snapshot.surfaceSchemaSetHash, "surfaceSchemaSetHash"),
    bridgeCapabilitySetHash: requireRef(
      snapshot.bridgeCapabilitySetHash,
      "bridgeCapabilitySetHash",
    ),
    migrationPlanHash: requireRef(snapshot.migrationPlanHash, "migrationPlanHash"),
    compatibilityEvidenceRef: requireRef(
      snapshot.compatibilityEvidenceRef,
      "compatibilityEvidenceRef",
    ),
    approvedBy: requireRef(snapshot.approvedBy, "approvedBy"),
    approvedAt: ensureIsoTimestamp(snapshot.approvedAt, "approvedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export function validateChannelReleaseFreezeRecord(
  snapshot: ChannelReleaseFreezeRecordSnapshot,
): ChannelReleaseFreezeRecordSnapshot {
  const normalized = {
    ...snapshot,
    channelFreezeId: requireRef(snapshot.channelFreezeId, "channelFreezeId"),
    channelFamily: requireRef(snapshot.channelFamily, "channelFamily"),
    manifestVersionRef: requireRef(snapshot.manifestVersionRef, "manifestVersionRef"),
    releaseApprovalFreezeRef: requireRef(
      snapshot.releaseApprovalFreezeRef,
      "releaseApprovalFreezeRef",
    ),
    minimumBridgeCapabilitiesRef: requireRef(
      snapshot.minimumBridgeCapabilitiesRef,
      "minimumBridgeCapabilitiesRef",
    ),
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
  invariant(
    compareIso(normalized.updatedAt, normalized.effectiveAt) >= 0,
    "CHANNEL_FREEZE_UPDATED_BEFORE_EFFECTIVE",
    "updatedAt must be on or after effectiveAt.",
  );
  return normalized;
}

export function validateRequiredAssuranceSliceSnapshot(
  snapshot: RequiredAssuranceSliceSnapshot,
): RequiredAssuranceSliceSnapshot {
  return {
    ...snapshot,
    sliceTrustId: requireRef(snapshot.sliceTrustId, "sliceTrustId"),
    sliceNamespace: requireRef(snapshot.sliceNamespace, "sliceNamespace"),
    trustLowerBound: ensureUnitInterval(snapshot.trustLowerBound, "trustLowerBound"),
    blockingProducerRefs: uniqueSortedRefs(snapshot.blockingProducerRefs),
    blockingNamespaceRefs: uniqueSortedRefs(snapshot.blockingNamespaceRefs),
    evaluationModelRef: requireRef(snapshot.evaluationModelRef, "evaluationModelRef"),
    reviewDueAt: ensureIsoTimestamp(snapshot.reviewDueAt, "reviewDueAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
  };
}

export function validateReleaseApprovalFreezeDrift(
  freeze: ReleaseApprovalFreezeSnapshot,
  governanceReviewPackage: GovernanceReviewPackageRecord,
  standardsWatchlist: StandardsDependencyWatchlistRecord,
): ReleaseApprovalFreezeDriftResult {
  const normalizedFreeze = validateReleaseApprovalFreeze(freeze);
  const normalizedReview = validateGovernanceReviewPackageRecord(governanceReviewPackage);
  const normalizedWatchlist = validateStandardsDependencyWatchlistRecord(standardsWatchlist);
  const blockers: string[] = [];

  if (normalizedFreeze.freezeState !== "active") {
    blockers.push("DRIFT_RELEASE_FREEZE_NOT_ACTIVE");
  }
  if (normalizedReview.packageState !== "current") {
    blockers.push("DRIFT_GOVERNANCE_REVIEW_PACKAGE_NOT_CURRENT");
  }
  if (normalizedWatchlist.watchlistState !== "current") {
    blockers.push("DRIFT_STANDARDS_WATCHLIST_NOT_CURRENT");
  }
  if (normalizedWatchlist.compileGateState !== "pass") {
    blockers.push("DRIFT_STANDARDS_COMPILE_GATE");
  }
  if (normalizedWatchlist.promotionGateState !== "pass") {
    blockers.push("DRIFT_STANDARDS_PROMOTION_GATE");
  }
  if (normalizedFreeze.governanceReviewPackageRef !== normalizedReview.governanceReviewPackageId) {
    blockers.push("DRIFT_GOVERNANCE_REVIEW_PACKAGE_REF");
  }
  if (
    normalizedFreeze.standardsDependencyWatchlistRef !==
    normalizedWatchlist.standardsDependencyWatchlistId
  ) {
    blockers.push("DRIFT_STANDARDS_WATCHLIST_REF");
  }
  if (normalizedFreeze.scopeTupleHash !== normalizedReview.scopeTupleHash) {
    blockers.push("DRIFT_SCOPE_TUPLE_HASH");
  }
  if (normalizedFreeze.baselineTupleHash !== normalizedReview.baselineTupleHash) {
    blockers.push("DRIFT_BASELINE_TUPLE_HASH");
  }
  if (normalizedFreeze.compilationTupleHash !== normalizedReview.compilationTupleHash) {
    blockers.push("DRIFT_COMPILATION_TUPLE_HASH");
  }
  if (normalizedFreeze.approvalTupleHash !== normalizedReview.approvalTupleHash) {
    blockers.push("DRIFT_APPROVAL_TUPLE_HASH");
  }
  if (normalizedFreeze.reviewPackageHash !== normalizedReview.reviewPackageHash) {
    blockers.push("DRIFT_REVIEW_PACKAGE_HASH");
  }
  if (normalizedFreeze.standardsWatchlistHash !== normalizedWatchlist.watchlistHash) {
    blockers.push("DRIFT_STANDARDS_WATCHLIST_HASH");
  }
  if (normalizedWatchlist.scopeTupleHash !== normalizedReview.scopeTupleHash) {
    blockers.push("DRIFT_STANDARDS_SCOPE_TUPLE_HASH");
  }
  if (normalizedWatchlist.reviewPackageHash !== normalizedReview.reviewPackageHash) {
    blockers.push("DRIFT_STANDARDS_REVIEW_PACKAGE_HASH");
  }
  if (normalizedFreeze.compiledPolicyBundleRef !== normalizedReview.compiledPolicyBundleRef) {
    blockers.push("DRIFT_COMPILED_POLICY_BUNDLE_REF");
  }

  return {
    freeze: normalizedFreeze,
    governanceReviewPackage: normalizedReview,
    standardsWatchlist: normalizedWatchlist,
    blockers: uniqueSortedRefs(blockers),
  };
}

function mapMutationAuthority(
  state: ReleaseTrustSurfaceAuthorityState,
): ReleaseTrustMutationAuthorityState {
  if (state === "live") {
    return "enabled";
  }
  if (state === "diagnostic_only") {
    return "observe_only";
  }
  if (state === "recovery_only") {
    return "governed_recovery";
  }
  return "blocked";
}

export function mapReleaseTrustSurfaceAuthorityToOperationalState(
  state: ReleaseTrustSurfaceAuthorityState,
): ReleaseTrustOperationalState {
  if (state === "live") {
    return "trusted";
  }
  if (state === "diagnostic_only") {
    return "degraded";
  }
  if (state === "recovery_only") {
    return "recovery_bound";
  }
  return "quarantined";
}

export function evaluateReleaseTrustFreezeVerdict(
  input: EvaluateReleaseTrustFreezeVerdictInput,
): ReleaseTrustFreezeVerdictEvaluationResult {
  const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
  const drift = validateReleaseApprovalFreezeDrift(
    input.releaseApprovalFreeze,
    input.governanceReviewPackage,
    input.standardsWatchlist,
  );
  const requiredChannelFreezes = input.requiredChannelFreezes.map((record) =>
    validateChannelReleaseFreezeRecord(record),
  );
  const requiredAssuranceSlices = input.requiredAssuranceSlices.map((record) =>
    validateRequiredAssuranceSliceSnapshot(record),
  );
  const blockers = [...drift.blockers];

  if (!requireRef(input.audienceSurface, "audienceSurface")) {
    blockers.push("BLOCKER_AUDIENCE_SURFACE_MISSING");
  }
  if (!requireRef(input.routeFamilyRef, "routeFamilyRef")) {
    blockers.push("BLOCKER_ROUTE_FAMILY_MISSING");
  }
  if (requiredChannelFreezes.length === 0) {
    blockers.push("BLOCKER_REQUIRED_CHANNEL_FREEZE_MISSING");
  }
  if (requiredAssuranceSlices.length === 0) {
    blockers.push("BLOCKER_REQUIRED_ASSURANCE_SLICE_MISSING");
  }

  if (input.releaseWatchTupleState !== "active") {
    blockers.push("BLOCKER_RELEASE_WATCH_TUPLE_NOT_ACTIVE");
  }
  if (input.runtimePublicationState !== "published") {
    blockers.push("BLOCKER_RUNTIME_PUBLICATION_NOT_PUBLISHED");
  }
  if (input.releasePublicationParityState !== "exact") {
    blockers.push("BLOCKER_RELEASE_PARITY_NOT_EXACT");
  }
  if (input.provenanceConsumptionState !== "publishable") {
    blockers.push("BLOCKER_PROVENANCE_NOT_PUBLISHABLE");
  }

  const activeChannelFreeze = requiredChannelFreezes.find((record) =>
    ["frozen", "kill_switch_active", "rollback_recommended"].includes(record.channelState),
  );
  if (activeChannelFreeze) {
    blockers.push(`BLOCKER_CHANNEL_FREEZE_${activeChannelFreeze.channelState.toUpperCase()}`);
  }

  const degradedSlices = requiredAssuranceSlices.filter(
    (record) => record.trustState === "degraded" || record.completenessState === "partial",
  );
  const hardBlockedSlices = requiredAssuranceSlices.filter(
    (record) =>
      record.trustState === "quarantined" ||
      record.trustState === "unknown" ||
      record.completenessState === "blocked" ||
      record.hardBlockState,
  );
  degradedSlices.forEach((record) => {
    blockers.push(`BLOCKER_ASSURANCE_DEGRADED_${record.sliceNamespace.toUpperCase()}`);
  });
  hardBlockedSlices.forEach((record) => {
    blockers.push(`BLOCKER_ASSURANCE_HARD_${record.sliceNamespace.toUpperCase()}`);
  });

  let surfaceAuthorityState: ReleaseTrustSurfaceAuthorityState;
  const recoveryDispositionRef = optionalRef(input.governingRecoveryDispositionRef);

  if (
    requiredChannelFreezes.length === 0 ||
    requiredAssuranceSlices.length === 0 ||
    drift.blockers.length > 0 ||
    input.releaseWatchTupleState === "missing" ||
    input.runtimePublicationState === "missing" ||
    input.releasePublicationParityState === "missing"
  ) {
    surfaceAuthorityState = "blocked";
  } else if (
    hardBlockedSlices.length > 0 ||
    activeChannelFreeze !== undefined ||
    input.waveGuardrailState === "frozen" ||
    input.waveGuardrailState === "rollback_review_required" ||
    input.runtimePublicationState !== "published" ||
    input.releasePublicationParityState !== "exact" ||
    input.provenanceConsumptionState !== "publishable"
  ) {
    surfaceAuthorityState = recoveryDispositionRef ? "recovery_only" : "blocked";
  } else if (degradedSlices.length > 0 || input.waveGuardrailState === "constrained") {
    surfaceAuthorityState = "diagnostic_only";
  } else if (
    input.waveGuardrailState === "green" &&
    input.releaseWatchTupleState === "active" &&
    input.runtimePublicationState === "published" &&
    input.releasePublicationParityState === "exact" &&
    input.provenanceConsumptionState === "publishable"
  ) {
    surfaceAuthorityState = "live";
  } else {
    surfaceAuthorityState = "blocked";
  }

  if (surfaceAuthorityState !== "live" && input.waveGuardrailState === "green") {
    blockers.push("BLOCKER_CALM_OR_WRITABLE_POSTURE_SUPPRESSED");
  }

  const snapshot: ReleaseTrustFreezeVerdictSnapshot = {
    releaseTrustFreezeVerdictId: "",
    audienceSurface: requireRef(input.audienceSurface, "audienceSurface"),
    routeFamilyRef: requireRef(input.routeFamilyRef, "routeFamilyRef"),
    releaseApprovalFreezeRef: input.releaseApprovalFreeze.releaseApprovalFreezeId,
    releaseWatchTupleRef: requireRef(input.releaseWatchTupleRef, "releaseWatchTupleRef"),
    waveGuardrailSnapshotRef: requireRef(
      input.waveGuardrailSnapshotRef,
      "waveGuardrailSnapshotRef",
    ),
    runtimePublicationBundleRef: requireRef(
      input.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    releasePublicationParityRef: requireRef(
      input.releasePublicationParityRef,
      "releasePublicationParityRef",
    ),
    requiredChannelFreezeRefs: requiredChannelFreezes.map((record) => record.channelFreezeId),
    requiredAssuranceSliceTrustRefs: requiredAssuranceSlices.map((record) => record.sliceTrustId),
    provenanceConsumptionState: input.provenanceConsumptionState,
    surfaceAuthorityState,
    calmTruthState: surfaceAuthorityState === "live" ? "allowed" : "suppressed",
    mutationAuthorityState: mapMutationAuthority(surfaceAuthorityState),
    governingRecoveryDispositionRef: recoveryDispositionRef,
    blockerRefs: uniqueSortedRefs(blockers),
    evaluatedAt,
    version: 1,
  };

  return {
    snapshot,
    blockers: snapshot.blockerRefs,
  };
}

export function validateReleaseTrustFreezeVerdict(
  snapshot: ReleaseTrustFreezeVerdictSnapshot,
): ReleaseTrustFreezeVerdictSnapshot {
  const normalized = {
    ...snapshot,
    releaseTrustFreezeVerdictId: requireRef(
      snapshot.releaseTrustFreezeVerdictId,
      "releaseTrustFreezeVerdictId",
    ),
    audienceSurface: requireRef(snapshot.audienceSurface, "audienceSurface"),
    routeFamilyRef: requireRef(snapshot.routeFamilyRef, "routeFamilyRef"),
    releaseApprovalFreezeRef: requireRef(
      snapshot.releaseApprovalFreezeRef,
      "releaseApprovalFreezeRef",
    ),
    releaseWatchTupleRef: requireRef(snapshot.releaseWatchTupleRef, "releaseWatchTupleRef"),
    waveGuardrailSnapshotRef: requireRef(
      snapshot.waveGuardrailSnapshotRef,
      "waveGuardrailSnapshotRef",
    ),
    runtimePublicationBundleRef: requireRef(
      snapshot.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    releasePublicationParityRef: requireRef(
      snapshot.releasePublicationParityRef,
      "releasePublicationParityRef",
    ),
    requiredChannelFreezeRefs: uniqueSortedRefs(snapshot.requiredChannelFreezeRefs),
    requiredAssuranceSliceTrustRefs: uniqueSortedRefs(snapshot.requiredAssuranceSliceTrustRefs),
    governingRecoveryDispositionRef: optionalRef(snapshot.governingRecoveryDispositionRef),
    blockerRefs: uniqueSortedRefs(snapshot.blockerRefs),
    evaluatedAt: ensureIsoTimestamp(snapshot.evaluatedAt, "evaluatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };

  invariant(
    normalized.calmTruthState ===
      (normalized.surfaceAuthorityState === "live" ? "allowed" : "suppressed"),
    "CALM_TRUTH_STATE_ILLEGAL",
    "calmTruthState may only remain allowed while surfaceAuthorityState = live.",
  );
  invariant(
    normalized.mutationAuthorityState === mapMutationAuthority(normalized.surfaceAuthorityState),
    "MUTATION_AUTHORITY_STATE_ILLEGAL",
    "mutationAuthorityState must derive directly from surfaceAuthorityState.",
  );
  if (normalized.surfaceAuthorityState === "live") {
    invariant(
      normalized.provenanceConsumptionState === "publishable" &&
        normalized.blockerRefs.length === 0,
      "LIVE_VERDICT_REQUIRES_EMPTY_BLOCKERS",
      "live verdicts require publishable provenance and no blockerRefs.",
    );
  }
  if (normalized.surfaceAuthorityState === "recovery_only") {
    invariant(
      normalized.governingRecoveryDispositionRef !== null,
      "RECOVERY_ONLY_REQUIRES_RECOVERY_DISPOSITION",
      "recovery_only verdicts require governingRecoveryDispositionRef.",
    );
  }
  return normalized;
}

export function assertReleaseTrustFreezeVerdictPrecedence(
  publishedVerdict: ReleaseTrustFreezeVerdictSnapshot | null | undefined,
  derivationAttempted: boolean,
): void {
  if (publishedVerdict && derivationAttempted) {
    throw new RequestBackboneInvariantError(
      "VERDICT_PRECEDENCE_REQUIRED",
      "Raw release freeze, channel freeze, or trust fragments may not reopen authority once a published ReleaseTrustFreezeVerdict exists.",
    );
  }
}

export interface ReleaseTrustFreezeDependencies {
  saveGovernanceReviewPackage(
    row: PersistedGovernanceReviewPackageRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getGovernanceReviewPackage(
    governanceReviewPackageId: string,
  ): Promise<PersistedGovernanceReviewPackageRow | null>;
  listGovernanceReviewPackages(): Promise<PersistedGovernanceReviewPackageRow[]>;
  saveStandardsDependencyWatchlist(
    row: PersistedStandardsDependencyWatchlistRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getStandardsDependencyWatchlist(
    standardsDependencyWatchlistId: string,
  ): Promise<PersistedStandardsDependencyWatchlistRow | null>;
  listStandardsDependencyWatchlists(): Promise<PersistedStandardsDependencyWatchlistRow[]>;
  saveReleaseApprovalFreeze(
    row: PersistedReleaseApprovalFreezeRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReleaseApprovalFreeze(
    releaseApprovalFreezeId: string,
  ): Promise<PersistedReleaseApprovalFreezeRow | null>;
  listReleaseApprovalFreezes(): Promise<PersistedReleaseApprovalFreezeRow[]>;
  saveChannelReleaseFreezeRecord(
    row: PersistedChannelReleaseFreezeRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getChannelReleaseFreezeRecord(
    channelFreezeId: string,
  ): Promise<PersistedChannelReleaseFreezeRecordRow | null>;
  listChannelReleaseFreezeRecords(): Promise<PersistedChannelReleaseFreezeRecordRow[]>;
  saveReleaseTrustFreezeVerdict(
    row: PersistedReleaseTrustFreezeVerdictRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReleaseTrustFreezeVerdict(
    releaseTrustFreezeVerdictId: string,
  ): Promise<PersistedReleaseTrustFreezeVerdictRow | null>;
  listReleaseTrustFreezeVerdicts(): Promise<PersistedReleaseTrustFreezeVerdictRow[]>;
  getLatestReleaseTrustFreezeVerdict(
    audienceSurface: string,
    routeFamilyRef: string,
  ): Promise<PersistedReleaseTrustFreezeVerdictRow | null>;
}

export class InMemoryReleaseTrustFreezeStore implements ReleaseTrustFreezeDependencies {
  private readonly governancePackages = new Map<string, PersistedGovernanceReviewPackageRow>();
  private readonly standardsWatchlists = new Map<
    string,
    PersistedStandardsDependencyWatchlistRow
  >();
  private readonly releaseFreezes = new Map<string, PersistedReleaseApprovalFreezeRow>();
  private readonly channelFreezes = new Map<string, PersistedChannelReleaseFreezeRecordRow>();
  private readonly verdicts = new Map<string, PersistedReleaseTrustFreezeVerdictRow>();
  private readonly verdictHeads = new Map<string, string>();

  async saveGovernanceReviewPackage(
    row: PersistedGovernanceReviewPackageRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.governancePackages,
      row.governanceReviewPackageId,
      {
        ...validateGovernanceReviewPackageRecord(row),
        aggregateType: "GovernanceReviewPackage",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getGovernanceReviewPackage(
    governanceReviewPackageId: string,
  ): Promise<PersistedGovernanceReviewPackageRow | null> {
    return this.governancePackages.get(governanceReviewPackageId) ?? null;
  }

  async listGovernanceReviewPackages(): Promise<PersistedGovernanceReviewPackageRow[]> {
    return [...this.governancePackages.values()].sort((left, right) =>
      compareIso(left.assembledAt, right.assembledAt),
    );
  }

  async saveStandardsDependencyWatchlist(
    row: PersistedStandardsDependencyWatchlistRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.standardsWatchlists,
      row.standardsDependencyWatchlistId,
      {
        ...validateStandardsDependencyWatchlistRecord(row),
        aggregateType: "StandardsDependencyWatchlist",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getStandardsDependencyWatchlist(
    standardsDependencyWatchlistId: string,
  ): Promise<PersistedStandardsDependencyWatchlistRow | null> {
    return this.standardsWatchlists.get(standardsDependencyWatchlistId) ?? null;
  }

  async listStandardsDependencyWatchlists(): Promise<PersistedStandardsDependencyWatchlistRow[]> {
    return [...this.standardsWatchlists.values()].sort((left, right) =>
      compareIso(left.generatedAt, right.generatedAt),
    );
  }

  async saveReleaseApprovalFreeze(
    row: PersistedReleaseApprovalFreezeRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.releaseFreezes,
      row.releaseApprovalFreezeId,
      {
        ...validateReleaseApprovalFreeze(row),
        aggregateType: "ReleaseApprovalFreeze",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getReleaseApprovalFreeze(
    releaseApprovalFreezeId: string,
  ): Promise<PersistedReleaseApprovalFreezeRow | null> {
    return this.releaseFreezes.get(releaseApprovalFreezeId) ?? null;
  }

  async listReleaseApprovalFreezes(): Promise<PersistedReleaseApprovalFreezeRow[]> {
    return [...this.releaseFreezes.values()].sort((left, right) =>
      compareIso(left.approvedAt, right.approvedAt),
    );
  }

  async saveChannelReleaseFreezeRecord(
    row: PersistedChannelReleaseFreezeRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.channelFreezes,
      row.channelFreezeId,
      {
        ...validateChannelReleaseFreezeRecord(row),
        aggregateType: "ChannelReleaseFreezeRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getChannelReleaseFreezeRecord(
    channelFreezeId: string,
  ): Promise<PersistedChannelReleaseFreezeRecordRow | null> {
    return this.channelFreezes.get(channelFreezeId) ?? null;
  }

  async listChannelReleaseFreezeRecords(): Promise<PersistedChannelReleaseFreezeRecordRow[]> {
    return [...this.channelFreezes.values()].sort((left, right) =>
      compareIso(left.updatedAt, right.updatedAt),
    );
  }

  async saveReleaseTrustFreezeVerdict(
    row: PersistedReleaseTrustFreezeVerdictRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = {
      ...validateReleaseTrustFreezeVerdict(row),
      aggregateType: "ReleaseTrustFreezeVerdict" as const,
      persistenceSchemaVersion: 1 as const,
    };
    saveWithCas(this.verdicts, normalized.releaseTrustFreezeVerdictId, normalized, options);
    const key = `${normalized.audienceSurface}::${normalized.routeFamilyRef}`;
    const headId = this.verdictHeads.get(key);
    const current = headId ? this.verdicts.get(headId) : null;
    if (
      !current ||
      compareIso(current.evaluatedAt, normalized.evaluatedAt) <= 0 ||
      current.version <= normalized.version
    ) {
      this.verdictHeads.set(key, normalized.releaseTrustFreezeVerdictId);
    }
  }

  async getReleaseTrustFreezeVerdict(
    releaseTrustFreezeVerdictId: string,
  ): Promise<PersistedReleaseTrustFreezeVerdictRow | null> {
    return this.verdicts.get(releaseTrustFreezeVerdictId) ?? null;
  }

  async listReleaseTrustFreezeVerdicts(): Promise<PersistedReleaseTrustFreezeVerdictRow[]> {
    return [...this.verdicts.values()].sort((left, right) =>
      compareIso(left.evaluatedAt, right.evaluatedAt),
    );
  }

  async getLatestReleaseTrustFreezeVerdict(
    audienceSurface: string,
    routeFamilyRef: string,
  ): Promise<PersistedReleaseTrustFreezeVerdictRow | null> {
    const headId = this.verdictHeads.get(`${audienceSurface}::${routeFamilyRef}`);
    return headId ? (this.verdicts.get(headId) ?? null) : null;
  }
}

export function createReleaseTrustFreezeStore(): ReleaseTrustFreezeDependencies {
  return new InMemoryReleaseTrustFreezeStore();
}

export interface RecordGovernanceReviewPackageCommand
  extends Omit<GovernanceReviewPackageRecord, "governanceReviewPackageId" | "version"> {
  governanceReviewPackageId?: string;
}

export interface RecordStandardsDependencyWatchlistCommand
  extends Omit<StandardsDependencyWatchlistRecord, "standardsDependencyWatchlistId" | "version"> {
  standardsDependencyWatchlistId?: string;
}

export interface ApproveReleaseApprovalFreezeCommand
  extends Omit<ReleaseApprovalFreezeSnapshot, "releaseApprovalFreezeId" | "version"> {
  releaseApprovalFreezeId?: string;
}

export interface RecordChannelReleaseFreezeCommand
  extends Omit<ChannelReleaseFreezeRecordSnapshot, "channelFreezeId" | "version"> {
  channelFreezeId?: string;
}

export interface PublishReleaseTrustFreezeVerdictCommand {
  audienceSurface: string;
  routeFamilyRef: string;
  releaseApprovalFreezeRef: string;
  releaseWatchTupleRef: string;
  releaseWatchTupleState: ReleaseWatchTupleState;
  waveGuardrailSnapshotRef: string;
  waveGuardrailState: WaveGuardrailState;
  runtimePublicationBundleRef: string;
  runtimePublicationState: RuntimePublicationState;
  releasePublicationParityRef: string;
  releasePublicationParityState: ReleasePublicationParityState;
  requiredChannelFreezeRefs: readonly string[];
  requiredAssuranceSlices: readonly RequiredAssuranceSliceSnapshot[];
  provenanceConsumptionState: ProvenanceConsumptionState;
  governingRecoveryDispositionRef?: string | null;
  evaluatedAt: string;
}

export const releaseTrustFreezeParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_075_RELEASE_WATCH_TUPLE_PORT",
    description:
      "Live release-watch tuple and wave-action authority are not yet surfaced through a stable backend port for par_075.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_075_RUNTIME_PARITY_AND_PROVENANCE_PORT",
    description:
      "Runtime publication parity and signed provenance still arrive through simulator-backed inputs until the live delivery chain lands.",
  },
] as const;

export function createReleaseTrustFreezeAuthorityService(
  repositories: ReleaseTrustFreezeDependencies = createReleaseTrustFreezeStore(),
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
    "identity_access_release_trust_freeze",
  ),
) {
  return {
    async recordGovernanceReviewPackage(
      command: RecordGovernanceReviewPackageCommand,
    ): Promise<GovernanceReviewPackageRecord> {
      const snapshot = validateGovernanceReviewPackageRecord({
        ...command,
        governanceReviewPackageId:
          command.governanceReviewPackageId ??
          nextReleaseTrustId(idGenerator, "governance_review_package"),
        version: 1,
      });
      await repositories.saveGovernanceReviewPackage({
        ...snapshot,
        aggregateType: "GovernanceReviewPackage",
        persistenceSchemaVersion: 1,
      });
      return snapshot;
    },

    async recordStandardsDependencyWatchlist(
      command: RecordStandardsDependencyWatchlistCommand,
    ): Promise<StandardsDependencyWatchlistRecord> {
      const snapshot = validateStandardsDependencyWatchlistRecord({
        ...command,
        standardsDependencyWatchlistId:
          command.standardsDependencyWatchlistId ??
          nextReleaseTrustId(idGenerator, "standards_dependency_watchlist"),
        version: 1,
      });
      await repositories.saveStandardsDependencyWatchlist({
        ...snapshot,
        aggregateType: "StandardsDependencyWatchlist",
        persistenceSchemaVersion: 1,
      });
      return snapshot;
    },

    async approveReleaseFreeze(
      command: ApproveReleaseApprovalFreezeCommand,
    ): Promise<ReleaseApprovalFreezeSnapshot> {
      const reviewPackage = await repositories.getGovernanceReviewPackage(
        command.governanceReviewPackageRef,
      );
      invariant(
        reviewPackage,
        "GOVERNANCE_REVIEW_PACKAGE_MISSING",
        "ReleaseApprovalFreeze requires an existing GovernanceReviewPackage.",
      );
      const watchlist = await repositories.getStandardsDependencyWatchlist(
        command.standardsDependencyWatchlistRef,
      );
      invariant(
        watchlist,
        "STANDARDS_WATCHLIST_MISSING",
        "ReleaseApprovalFreeze requires an existing StandardsDependencyWatchlist.",
      );
      const snapshot = validateReleaseApprovalFreeze({
        ...command,
        releaseApprovalFreezeId:
          command.releaseApprovalFreezeId ??
          nextReleaseTrustId(idGenerator, "release_approval_freeze"),
        version: 1,
      });
      const drift = validateReleaseApprovalFreezeDrift(snapshot, reviewPackage, watchlist);
      invariant(
        drift.blockers.length === 0,
        "RELEASE_FREEZE_DRIFT_DETECTED",
        `ReleaseApprovalFreeze may not be approved while tuple drift exists: ${drift.blockers.join(", ")}.`,
      );
      await repositories.saveReleaseApprovalFreeze({
        ...snapshot,
        aggregateType: "ReleaseApprovalFreeze",
        persistenceSchemaVersion: 1,
      });
      return snapshot;
    },

    async recordChannelFreeze(
      command: RecordChannelReleaseFreezeCommand,
    ): Promise<ChannelReleaseFreezeRecordSnapshot> {
      const prior = command.channelFreezeId
        ? await repositories.getChannelReleaseFreezeRecord(command.channelFreezeId)
        : null;
      const snapshot = validateChannelReleaseFreezeRecord({
        ...command,
        channelFreezeId:
          command.channelFreezeId ??
          nextReleaseTrustId(idGenerator, "channel_release_freeze_record"),
        version: prior ? prior.version + 1 : 1,
      });
      await repositories.saveChannelReleaseFreezeRecord({
        ...snapshot,
        aggregateType: "ChannelReleaseFreezeRecord",
        persistenceSchemaVersion: 1,
      });
      return snapshot;
    },

    async publishReleaseTrustFreezeVerdict(
      command: PublishReleaseTrustFreezeVerdictCommand,
    ): Promise<ReleaseTrustFreezeVerdictEvaluationResult> {
      const freeze = await repositories.getReleaseApprovalFreeze(command.releaseApprovalFreezeRef);
      invariant(
        freeze,
        "RELEASE_APPROVAL_FREEZE_MISSING",
        "ReleaseTrustFreezeVerdict requires an existing ReleaseApprovalFreeze.",
      );
      const reviewPackage = await repositories.getGovernanceReviewPackage(
        freeze.governanceReviewPackageRef,
      );
      invariant(
        reviewPackage,
        "GOVERNANCE_REVIEW_PACKAGE_MISSING",
        "ReleaseTrustFreezeVerdict requires the linked GovernanceReviewPackage.",
      );
      const watchlist = await repositories.getStandardsDependencyWatchlist(
        freeze.standardsDependencyWatchlistRef,
      );
      invariant(
        watchlist,
        "STANDARDS_WATCHLIST_MISSING",
        "ReleaseTrustFreezeVerdict requires the linked StandardsDependencyWatchlist.",
      );
      const channelFreezes: ChannelReleaseFreezeRecordSnapshot[] = [];
      for (const ref of command.requiredChannelFreezeRefs) {
        const record = await repositories.getChannelReleaseFreezeRecord(ref);
        invariant(
          record,
          "CHANNEL_RELEASE_FREEZE_MISSING",
          `Missing required ChannelReleaseFreezeRecord ${ref}.`,
        );
        channelFreezes.push(record);
      }
      const publishedVerdict = await repositories.getLatestReleaseTrustFreezeVerdict(
        command.audienceSurface,
        command.routeFamilyRef,
      );
      assertReleaseTrustFreezeVerdictPrecedence(publishedVerdict, false);
      const evaluated = evaluateReleaseTrustFreezeVerdict({
        ...command,
        releaseApprovalFreeze: freeze,
        governanceReviewPackage: reviewPackage,
        standardsWatchlist: watchlist,
        requiredChannelFreezes: channelFreezes,
      });
      const snapshot = validateReleaseTrustFreezeVerdict({
        ...evaluated.snapshot,
        releaseTrustFreezeVerdictId: nextReleaseTrustId(
          idGenerator,
          "release_trust_freeze_verdict",
        ),
      });
      await repositories.saveReleaseTrustFreezeVerdict({
        ...snapshot,
        aggregateType: "ReleaseTrustFreezeVerdict",
        persistenceSchemaVersion: 1,
      });
      return {
        ...evaluated,
        snapshot,
      };
    },
  };
}
