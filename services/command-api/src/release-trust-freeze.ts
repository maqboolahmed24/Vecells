import {
  createAssuranceSliceTrustAuthorityService,
  createAssuranceSliceTrustStore,
  defaultAssuranceTrustEvaluationModelRef,
  type AssuranceSliceTrustDependencies,
} from "@vecells/domain-analytics-assurance";
import {
  createReleaseTrustFreezeAuthorityService,
  createReleaseTrustFreezeStore,
  releaseTrustFreezeParallelInterfaceGaps,
  type ChannelReleaseState,
  type ProvenanceConsumptionState,
  type ReleasePublicationParityState,
  type ReleaseTrustFreezeDependencies,
  type ReleaseTrustFreezeVerdictEvaluationResult,
  type ReleaseTrustSurfaceAuthorityState,
  type ReleaseWatchTupleState,
  type RuntimePublicationState,
  type WaveGuardrailState,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const releaseTrustFreezePersistenceTables = [
  "governance_review_packages",
  "standards_dependency_watchlists",
  "release_approval_freezes",
  "channel_release_freeze_records",
  "assurance_slice_trust_records",
  "release_trust_freeze_verdicts",
] as const;

export const releaseTrustFreezeMigrationPlanRefs = [
  "services/command-api/migrations/075_release_approval_freeze_channel_release_freeze_and_assurance_slice_trust_models.sql",
] as const;

export const releaseTrustFreezeWorkspaceScenarioIds = [
  "live_exact_parity_trusted_slices",
  "diagnostic_only_degraded_slice",
  "recovery_only_active_channel_freeze",
  "blocked_missing_inputs",
  "blocked_standards_watchlist_drift",
  "recovery_only_parity_or_provenance_drift",
] as const;

export interface ReleaseTrustFreezeRepositories {
  release: ReleaseTrustFreezeDependencies;
  assurance: AssuranceSliceTrustDependencies;
}

export interface ReleaseTrustFreezeSimulationResult {
  scenarioId: string;
  surfaceAuthorityState: ReleaseTrustSurfaceAuthorityState;
  blockers: readonly string[];
  releaseApprovalFreezeRef: string;
  governanceReviewPackageRef: string;
  standardsDependencyWatchlistRef: string;
  channelFreezeRefs: readonly string[];
  assuranceSliceTrustRefs: readonly string[];
  verdict: ReleaseTrustFreezeVerdictEvaluationResult["snapshot"];
}

interface ScenarioOptions {
  scenarioId: string;
  audienceSurface: string;
  routeFamilyRef: string;
  channelState?: ChannelReleaseState;
  watchTupleState?: ReleaseWatchTupleState;
  waveGuardrailState?: WaveGuardrailState;
  runtimePublicationState?: RuntimePublicationState;
  releasePublicationParityState?: ReleasePublicationParityState;
  provenanceConsumptionState?: ProvenanceConsumptionState;
  degradeSlice?: boolean;
  unknownSlice?: boolean;
  driftWatchlist?: boolean;
  recoveryDispositionRef?: string | null;
}

async function buildScenario(
  options: ScenarioOptions,
): Promise<ReleaseTrustFreezeSimulationResult> {
  const makeChecks = (prefix: string, count: number, failedIds: readonly number[] = []) =>
    Array.from({ length: count }, (_, index) => ({
      ruleId: `${prefix}_${options.scenarioId}_${index + 1}`,
      weight: 1,
      satisfied: !failedIds.includes(index + 1),
      mandatory: index === 0,
    }));

  const releaseRepositories = createReleaseTrustFreezeStore();
  const assuranceRepositories = createAssuranceSliceTrustStore();
  const releaseAuthority = createReleaseTrustFreezeAuthorityService(
    releaseRepositories,
    createDeterministicBackboneIdGenerator(`command_api_release_trust_${options.scenarioId}`),
  );
  const assuranceAuthority = createAssuranceSliceTrustAuthorityService(
    assuranceRepositories,
    createDeterministicBackboneIdGenerator(`command_api_assurance_trust_${options.scenarioId}`),
  );

  const review = await releaseAuthority.recordGovernanceReviewPackage({
    scopeTupleHash: `scope_hash_${options.scenarioId}`,
    baselineTupleHash: `baseline_hash_${options.scenarioId}`,
    compiledPolicyBundleRef: `compiled_policy_${options.scenarioId}`,
    releaseWatchTupleRef: `release_watch_tuple_${options.scenarioId}`,
    watchTupleHash: `watch_tuple_hash_${options.scenarioId}`,
    compilationTupleHash: `compilation_hash_${options.scenarioId}`,
    approvalTupleHash: `approval_hash_${options.scenarioId}`,
    standardsWatchlistHash: `watchlist_hash_${options.scenarioId}`,
    settlementLineageRef: `settlement_lineage_${options.scenarioId}`,
    reviewPackageHash: `review_hash_${options.scenarioId}`,
    packageState: "current",
    assembledAt: "2026-04-12T22:00:00Z",
  });
  const watchlist = await releaseAuthority.recordStandardsDependencyWatchlist({
    candidateBundleHash: `candidate_bundle_${options.scenarioId}`,
    liveBundleHash: `live_bundle_${options.scenarioId}`,
    environmentRef: "staging",
    tenantScopeRef: `tenant_scope_${options.scenarioId}`,
    scopeTupleHash: review.scopeTupleHash,
    reviewPackageHash: review.reviewPackageHash,
    blockingFindingRefs: [],
    advisoryFindingRefs: [],
    compileGateState: "pass",
    promotionGateState: "pass",
    watchlistState: "current",
    watchlistHash: review.standardsWatchlistHash,
    generatedAt: "2026-04-12T22:01:00Z",
  });
  const freeze = await releaseAuthority.approveReleaseFreeze({
    releaseCandidateRef: `release_candidate_${options.scenarioId}`,
    governanceReviewPackageRef: review.governanceReviewPackageId,
    standardsDependencyWatchlistRef: watchlist.standardsDependencyWatchlistId,
    compiledPolicyBundleRef: review.compiledPolicyBundleRef,
    baselineTupleHash: review.baselineTupleHash,
    scopeTupleHash: review.scopeTupleHash,
    compilationTupleHash: review.compilationTupleHash,
    approvalTupleHash: review.approvalTupleHash,
    reviewPackageHash: review.reviewPackageHash,
    standardsWatchlistHash: watchlist.watchlistHash,
    artifactDigestSetHash: `artifact_digest_${options.scenarioId}`,
    surfaceSchemaSetHash: `surface_schema_${options.scenarioId}`,
    bridgeCapabilitySetHash: `bridge_capability_${options.scenarioId}`,
    migrationPlanHash: `migration_plan_${options.scenarioId}`,
    compatibilityEvidenceRef: `compatibility_evidence_${options.scenarioId}`,
    approvedBy: `approver_${options.scenarioId}`,
    approvedAt: "2026-04-12T22:02:00Z",
    freezeState: "active",
  });
  const channel = await releaseAuthority.recordChannelFreeze({
    channelFamily: "browser_web",
    manifestVersionRef: `manifest_version_${options.scenarioId}`,
    releaseApprovalFreezeRef: freeze.releaseApprovalFreezeId,
    minimumBridgeCapabilitiesRef: `bridge_floor_${options.scenarioId}`,
    channelState: options.channelState ?? "monitoring",
    effectiveAt: "2026-04-12T22:03:00Z",
    updatedAt: "2026-04-12T22:03:00Z",
  });

  if (options.driftWatchlist) {
    await releaseRepositories.saveStandardsDependencyWatchlist({
      ...watchlist,
      watchlistState: "stale",
      advisoryFindingRefs: ["legacy_reference_reopened"],
      version: 2,
      generatedAt: "2026-04-12T22:06:00Z",
      aggregateType: "StandardsDependencyWatchlist",
      persistenceSchemaVersion: 1,
    });
  }

  const primarySlice = await assuranceAuthority.evaluateAndSave({
    sliceNamespace: `${options.audienceSurface}.authority`,
    producerScopeRef: `producer_${options.scenarioId}_primary`,
    reasonCode: options.degradeSlice ? "partial_evidence" : "healthy",
    evaluationModelRef: defaultAssuranceTrustEvaluationModelRef,
    evidenceRef: `evidence_${options.scenarioId}_primary`,
    effectiveAt: "2026-04-12T22:03:10Z",
    reviewDueAt: "2026-04-12T23:00:00Z",
    updatedAt: "2026-04-12T22:03:10Z",
    lagMs: 1_000,
    lagBudgetMs: 10_000,
    tauMs: 30_000,
    coverageChecks: options.degradeSlice
      ? makeChecks("coverage", 24, [24])
      : makeChecks("coverage", 24),
    lineageChecks: makeChecks("lineage", 24),
    replayChecks: makeChecks("replay", 24),
    consistencyChecks: makeChecks("consistency", 24),
    schemaCompatible: true,
    evaluationInputsAvailable: !options.unknownSlice,
    hashVerificationPassed: true,
    lineageVerificationPassed: true,
    redactionParityPassed: true,
    replayDeterminismPassed: true,
  });
  const secondarySlice = await assuranceAuthority.evaluateAndSave({
    sliceNamespace: `${options.audienceSurface}.continuity`,
    producerScopeRef: `producer_${options.scenarioId}_secondary`,
    reasonCode: "supporting_evidence",
    evaluationModelRef: defaultAssuranceTrustEvaluationModelRef,
    evidenceRef: `evidence_${options.scenarioId}_secondary`,
    effectiveAt: "2026-04-12T22:03:20Z",
    reviewDueAt: "2026-04-12T23:00:00Z",
    updatedAt: "2026-04-12T22:03:20Z",
    lagMs: 2_000,
    lagBudgetMs: 10_000,
    tauMs: 30_000,
    coverageChecks: makeChecks("coverage_support", 24),
    lineageChecks: makeChecks("lineage_support", 24),
    replayChecks: makeChecks("replay_support", 24),
    consistencyChecks: makeChecks("consistency_support", 24),
    schemaCompatible: true,
    evaluationInputsAvailable: true,
    hashVerificationPassed: true,
    lineageVerificationPassed: true,
    redactionParityPassed: true,
    replayDeterminismPassed: true,
  });

  const verdict = await releaseAuthority.publishReleaseTrustFreezeVerdict({
    audienceSurface: options.audienceSurface,
    routeFamilyRef: options.routeFamilyRef,
    releaseApprovalFreezeRef: freeze.releaseApprovalFreezeId,
    releaseWatchTupleRef: review.releaseWatchTupleRef,
    releaseWatchTupleState: options.watchTupleState ?? "active",
    waveGuardrailSnapshotRef: `guardrail_${options.scenarioId}`,
    waveGuardrailState: options.waveGuardrailState ?? "green",
    runtimePublicationBundleRef: `runtime_bundle_${options.scenarioId}`,
    runtimePublicationState: options.runtimePublicationState ?? "published",
    releasePublicationParityRef: `release_parity_${options.scenarioId}`,
    releasePublicationParityState: options.releasePublicationParityState ?? "exact",
    requiredChannelFreezeRefs: [channel.channelFreezeId],
    requiredAssuranceSlices: [primarySlice.snapshot, secondarySlice.snapshot],
    provenanceConsumptionState: options.provenanceConsumptionState ?? "publishable",
    governingRecoveryDispositionRef:
      options.recoveryDispositionRef ?? `recovery_${options.scenarioId}`,
    evaluatedAt: "2026-04-12T22:05:00Z",
  });

  return {
    scenarioId: options.scenarioId,
    surfaceAuthorityState: verdict.snapshot.surfaceAuthorityState,
    blockers: verdict.blockers,
    releaseApprovalFreezeRef: freeze.releaseApprovalFreezeId,
    governanceReviewPackageRef: review.governanceReviewPackageId,
    standardsDependencyWatchlistRef: watchlist.standardsDependencyWatchlistId,
    channelFreezeRefs: [channel.channelFreezeId],
    assuranceSliceTrustRefs: [
      primarySlice.snapshot.sliceTrustId,
      secondarySlice.snapshot.sliceTrustId,
    ],
    verdict: verdict.snapshot,
  };
}

export class ReleaseTrustFreezeSimulationHarness {
  async runAllScenarios(): Promise<ReleaseTrustFreezeSimulationResult[]> {
    return Promise.all([
      buildScenario({
        scenarioId: "live_exact_parity_trusted_slices",
        audienceSurface: "patient-web",
        routeFamilyRef: "rf_patient_home",
      }),
      buildScenario({
        scenarioId: "diagnostic_only_degraded_slice",
        audienceSurface: "ops-console",
        routeFamilyRef: "rf_ops_overview",
        degradeSlice: true,
      }),
      buildScenario({
        scenarioId: "recovery_only_active_channel_freeze",
        audienceSurface: "governance-console",
        routeFamilyRef: "rf_governance_release",
        channelState: "rollback_recommended",
      }),
      buildScenario({
        scenarioId: "blocked_missing_inputs",
        audienceSurface: "support-workspace",
        routeFamilyRef: "rf_support_queue",
        watchTupleState: "missing",
        unknownSlice: true,
        recoveryDispositionRef: null,
      }),
      buildScenario({
        scenarioId: "blocked_standards_watchlist_drift",
        audienceSurface: "clinical-workspace",
        routeFamilyRef: "rf_clinical_workspace",
        driftWatchlist: true,
        recoveryDispositionRef: null,
      }),
      buildScenario({
        scenarioId: "recovery_only_parity_or_provenance_drift",
        audienceSurface: "patient-web",
        routeFamilyRef: "rf_patient_messages",
        releasePublicationParityState: "drifted",
        provenanceConsumptionState: "blocked",
      }),
    ]);
  }

  async runScenarioById(
    scenarioId: (typeof releaseTrustFreezeWorkspaceScenarioIds)[number],
  ): Promise<ReleaseTrustFreezeSimulationResult> {
    const scenarios = await this.runAllScenarios();
    const match = scenarios.find((scenario) => scenario.scenarioId === scenarioId);
    if (!match) {
      throw new Error(`Unknown release trust freeze scenario ${scenarioId}.`);
    }
    return match;
  }
}

export function createReleaseTrustFreezeSimulationHarness(): ReleaseTrustFreezeSimulationHarness {
  return new ReleaseTrustFreezeSimulationHarness();
}

export interface ReleaseTrustFreezeApplication {
  readonly repositories: ReleaseTrustFreezeRepositories;
  readonly releaseAuthority: ReturnType<typeof createReleaseTrustFreezeAuthorityService>;
  readonly assuranceAuthority: ReturnType<typeof createAssuranceSliceTrustAuthorityService>;
  readonly simulation: ReleaseTrustFreezeSimulationHarness;
  readonly migrationPlanRef: (typeof releaseTrustFreezeMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof releaseTrustFreezeMigrationPlanRefs;
  readonly persistenceTables: typeof releaseTrustFreezePersistenceTables;
  readonly parallelInterfaceGaps: typeof releaseTrustFreezeParallelInterfaceGaps;
}

export function createReleaseTrustFreezeApplication(options?: {
  repositories?: ReleaseTrustFreezeRepositories;
  idGenerator?: BackboneIdGenerator;
}): ReleaseTrustFreezeApplication {
  const repositories = options?.repositories ?? {
    release: createReleaseTrustFreezeStore(),
    assurance: createAssuranceSliceTrustStore(),
  };
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_release_trust_application");
  const releaseAuthority = createReleaseTrustFreezeAuthorityService(
    repositories.release,
    createDeterministicBackboneIdGenerator(
      `${(idGenerator.nextId as unknown as (value: string) => string)("release_trust_authority")}`,
    ),
  );
  const assuranceAuthority = createAssuranceSliceTrustAuthorityService(
    repositories.assurance,
    createDeterministicBackboneIdGenerator(
      `${(idGenerator.nextId as unknown as (value: string) => string)("assurance_trust_authority")}`,
    ),
  );

  return {
    repositories,
    releaseAuthority,
    assuranceAuthority,
    simulation: createReleaseTrustFreezeSimulationHarness(),
    migrationPlanRef: releaseTrustFreezeMigrationPlanRefs[0],
    migrationPlanRefs: releaseTrustFreezeMigrationPlanRefs,
    persistenceTables: releaseTrustFreezePersistenceTables,
    parallelInterfaceGaps: releaseTrustFreezeParallelInterfaceGaps,
  };
}
