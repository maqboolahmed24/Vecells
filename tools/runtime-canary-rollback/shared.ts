import fs from "node:fs";
import path from "node:path";
import {
  CanaryRollbackHarnessCoordinator,
  createWaveActionContext,
  type CanaryRollbackRehearsal,
  type WaveActionContext,
  type WaveActionType,
} from "../../packages/release-controls/src/canary-rollback-harness.ts";
import { stableDigest, type BuildProvenanceState } from "../../packages/release-controls/src/build-provenance.ts";
import { loadPublicationArtifacts } from "../runtime-publication/shared.ts";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

export interface CliArgs {
  [key: string]: string;
}

interface ReleaseWatchCatalogRecord {
  scenarioId: string;
  environmentRing: string;
  releaseRef: string;
  tuple: {
    releaseWatchTupleId: string;
    runtimePublicationBundleRef: string;
    releasePublicationParityRef: string;
    waveObservationPolicyRef: string;
    waveControlFenceRef: string;
    releaseTrustFreezeVerdictRefs: string[];
    requiredAssuranceSliceRefs: string[];
    activeChannelFreezeRefs: string[];
    recoveryDispositionRefs: string[];
    watchTupleHash: string;
  };
  expected: {
    watchState: string;
    observationState: string;
  };
}

interface ReleaseWatchCatalog {
  records: ReleaseWatchCatalogRecord[];
}

interface ResilienceScenarioRow {
  scenarioId: string;
  environmentRing: string;
  actualReadinessState: string;
  snapshotId: string;
  tupleHash: string;
}

interface ResilienceScenarioDetail {
  scenarioId: string;
  runbookBindings: Array<{ runbookBindingRecordId: string }>;
  evidencePacks: Array<{ recoveryEvidencePackId: string }>;
  snapshot: { operationalReadinessSnapshotId: string };
}

interface ResilienceCatalog {
  scenarios: ResilienceScenarioRow[];
  scenarioDetails: ResilienceScenarioDetail[];
}

interface BuildProvenanceRecord {
  buildProvenanceRecordId: string;
  environmentRing: string;
  provenanceState: BuildProvenanceState;
  releaseRef: string;
}

interface BuildProvenanceManifest {
  buildProvenanceRecords: BuildProvenanceRecord[];
}

interface GatewaySurfaceRow {
  surfaceId: string;
  audienceSurfaceRef: string;
  routeFamilyRefs: string[];
}

interface GatewaySurfaceManifest {
  gateway_surfaces: GatewaySurfaceRow[];
}

export interface CanaryScenarioDefinition {
  scenarioId: string;
  title: string;
  description: string;
  environmentRing: string;
  actionType: WaveActionType;
  releaseWatchScenarioId: string;
  resilienceScenarioId: string;
  buildProvenancePreference?: BuildProvenanceState;
  affectedTenantCount: number;
  affectedOrganisationCount: number;
  stateOverrides: Partial<WaveActionContext>;
  supersededContextOverrides?: Partial<WaveActionContext>;
}

export interface CanaryScenarioSummary {
  scenarioId: string;
  title: string;
  description: string;
  environmentRing: string;
  actionType: WaveActionType;
  guardrailState: string;
  previewState: string;
  executionState: string;
  observationState: string;
  settlementState: string;
  cockpitState: string;
  watchState: string;
  readinessState: string;
  rollbackReadinessState: string;
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  rollbackTargetPublicationBundleRef: string | null;
  impactPreviewRef: string;
  settlementRef: string;
}

export interface CanaryScenarioOutput {
  definition: CanaryScenarioDefinition;
  context: WaveActionContext;
  rehearsal: CanaryRollbackRehearsal;
  summary: CanaryScenarioSummary;
}

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    if (!key) {
      continue;
    }
    args[key] = argv[index + 1] ?? "true";
  }
  return args;
}

export function readJson<TValue>(filePath: string): TValue {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TValue;
}

export function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function loadReleaseWatchCatalog(): ReleaseWatchCatalog {
  return readJson<ReleaseWatchCatalog>(
    path.join(ROOT, "data", "analysis", "release_watch_pipeline_catalog.json"),
  );
}

function loadResilienceCatalog(): ResilienceCatalog {
  return readJson<ResilienceCatalog>(
    path.join(ROOT, "data", "analysis", "resilience_baseline_catalog.json"),
  );
}

function loadBuildProvenanceManifest(): BuildProvenanceManifest {
  return readJson<BuildProvenanceManifest>(
    path.join(ROOT, "data", "analysis", "build_provenance_manifest.json"),
  );
}

function loadGatewaySurfaceManifest(): GatewaySurfaceManifest {
  return readJson<GatewaySurfaceManifest>(
    path.join(ROOT, "data", "analysis", "gateway_surface_manifest.json"),
  );
}

function loadReleaseWatchRecordByScenarioId(scenarioId: string): ReleaseWatchCatalogRecord {
  const row = loadReleaseWatchCatalog().records.find((candidate) => candidate.scenarioId === scenarioId);
  if (!row) {
    throw new Error(`No release watch record found for ${scenarioId}.`);
  }
  return row;
}

function loadResilienceScenarioById(scenarioId: string): {
  row: ResilienceScenarioRow;
  detail: ResilienceScenarioDetail;
} {
  const catalog = loadResilienceCatalog();
  const row = catalog.scenarios.find((candidate) => candidate.scenarioId === scenarioId);
  const detail = catalog.scenarioDetails.find((candidate) => candidate.scenarioId === scenarioId);
  if (!row || !detail) {
    throw new Error(`No resilience scenario found for ${scenarioId}.`);
  }
  return { row, detail };
}

function selectBuildProvenanceRecord(
  environmentRing: string,
  preference?: BuildProvenanceState,
): BuildProvenanceRecord {
  const rows = loadBuildProvenanceManifest().buildProvenanceRecords.filter(
    (candidate) => candidate.environmentRing === environmentRing,
  );
  if (rows.length === 0) {
    throw new Error(`No build provenance record found for ${environmentRing}.`);
  }
  if (preference) {
    const match = rows.find((candidate) => candidate.provenanceState === preference);
    if (match) {
      return match;
    }
  }
  return rows[0]!;
}

function deriveSurfaceScope(bundleGatewaySurfaceRefs: readonly string[]) {
  const rows = loadGatewaySurfaceManifest().gateway_surfaces.filter((candidate) =>
    bundleGatewaySurfaceRefs.includes(candidate.surfaceId),
  );
  return {
    affectedRouteFamilyRefs: uniqueSorted(rows.flatMap((row) => row.routeFamilyRefs)),
    affectedAudienceSurfaceRefs: uniqueSorted(rows.map((row) => row.audienceSurfaceRef)),
    affectedGatewaySurfaceRefs: uniqueSorted(rows.map((row) => row.surfaceId)),
  };
}

function localRollbackBundleRef(): string {
  return loadPublicationArtifacts("local").bundle.runtimePublicationBundleId;
}

function buildBaseContext(definition: CanaryScenarioDefinition): WaveActionContext {
  const watchRecord = loadReleaseWatchRecordByScenarioId(definition.releaseWatchScenarioId);
  const resilience = loadResilienceScenarioById(definition.resilienceScenarioId);
  const publicationArtifacts = loadPublicationArtifacts(definition.environmentRing);
  const buildRecord = selectBuildProvenanceRecord(
    definition.environmentRing,
    definition.buildProvenancePreference,
  );
  const scope = deriveSurfaceScope(publicationArtifacts.bundle.gatewaySurfaceRefs);

  const rollbackRunbookBindingRefs = resilience.detail.runbookBindings
    .map((row) => row.runbookBindingRecordId)
    .slice(0, 4);
  const rollbackReadinessEvidenceRefs = resilience.detail.evidencePacks
    .map((row) => row.recoveryEvidencePackId)
    .slice(0, 4);
  const targetPublicationBundleRef =
    definition.stateOverrides.targetPublicationBundleRef ??
    publicationArtifacts.bundle.runtimePublicationBundleId;
  const currentTupleHash =
    definition.stateOverrides.currentTupleHash ?? watchRecord.tuple.watchTupleHash;
  const targetTupleHash =
    definition.stateOverrides.targetTupleHash ??
    stableDigest({
      actionType: definition.actionType,
      scenarioId: definition.scenarioId,
      targetPublicationBundleRef,
      releaseWatchTupleRef: watchRecord.tuple.releaseWatchTupleId,
    });

  return createWaveActionContext({
    environmentRing: definition.environmentRing,
    releaseRef: watchRecord.releaseRef,
    actionType: definition.actionType,
    requestedBy:
      definition.stateOverrides.requestedBy ?? `ops://release-control/${definition.environmentRing}`,
    idempotencyKey: `wave-action::${definition.scenarioId.toLowerCase()}`,
    runtimePublicationBundleRef: publicationArtifacts.bundle.runtimePublicationBundleId,
    targetPublicationBundleRef,
    rollbackTargetPublicationBundleRef:
      definition.stateOverrides.rollbackTargetPublicationBundleRef ?? localRollbackBundleRef(),
    releasePublicationParityRef: publicationArtifacts.parity.publicationParityRecordId,
    releaseWatchTupleRef: watchRecord.tuple.releaseWatchTupleId,
    waveObservationPolicyRef: watchRecord.tuple.waveObservationPolicyRef,
    waveControlFenceRef: watchRecord.tuple.waveControlFenceRef,
    operationalReadinessSnapshotRef: resilience.detail.snapshot.operationalReadinessSnapshotId,
    buildProvenanceRef: buildRecord.buildProvenanceRecordId,
    activeChannelFreezeRefs: watchRecord.tuple.activeChannelFreezeRefs,
    recoveryDispositionRefs: watchRecord.tuple.recoveryDispositionRefs.slice(0, 8),
    rollbackRunbookBindingRefs,
    rollbackReadinessEvidenceRefs,
    affectedTenantCount: definition.affectedTenantCount,
    affectedOrganisationCount: definition.affectedOrganisationCount,
    affectedRouteFamilyRefs: scope.affectedRouteFamilyRefs,
    affectedAudienceSurfaceRefs: scope.affectedAudienceSurfaceRefs,
    affectedGatewaySurfaceRefs: scope.affectedGatewaySurfaceRefs,
    watchState: watchRecord.expected.watchState as WaveActionContext["watchState"],
    observationState: watchRecord.expected.observationState as WaveActionContext["observationState"],
    rollbackReadinessState:
      definition.stateOverrides.rollbackReadinessState ??
      (definition.actionType === "rollback" ? "ready" : "constrained"),
    readinessState: resilience.row.actualReadinessState as WaveActionContext["readinessState"],
    publicationState: publicationArtifacts.bundle.publicationState,
    parityState: publicationArtifacts.parity.parityState,
    routeExposureState: publicationArtifacts.parity.routeExposureState,
    buildProvenanceState: buildRecord.provenanceState,
    trustState: "live",
    continuityState: "healthy",
    tupleFreshnessState: "current",
    recoveryDispositionState: "normal",
    currentTupleHash,
    targetTupleHash,
    blockerRefs: [],
    warningRefs: [],
    sourceRefs: [
      "prompt/102.md",
      "prompt/shared_operating_contract_096_to_105.md",
      "data/analysis/runtime_publication_bundles.json",
      "data/analysis/release_publication_parity_records.json",
      "data/analysis/release_watch_pipeline_catalog.json",
      "data/analysis/resilience_baseline_catalog.json",
      "data/analysis/build_provenance_manifest.json",
    ],
    now: "2026-04-13T12:00:00.000Z",
    ...definition.stateOverrides,
  });
}

export const canaryScenarioDefinitions: readonly CanaryScenarioDefinition[] = [
  {
    scenarioId: "LOCAL_CANARY_START_HAPPY_PATH",
    title: "Happy-path canary start and dwell",
    description:
      "Starts a local rehearsal canary on the exact tuple and leaves the wave in accepted pending observation instead of claiming live convergence too early.",
    environmentRing: "local",
    actionType: "canary_start",
    releaseWatchScenarioId: "LOCAL_ACCEPTED",
    resilienceScenarioId: "LOCAL_EXACT_READY",
    buildProvenancePreference: "verified",
    affectedTenantCount: 1,
    affectedOrganisationCount: 1,
    stateOverrides: {
      rollbackReadinessState: "ready",
      trustState: "live",
      continuityState: "healthy",
      tupleFreshnessState: "current",
      recoveryDispositionState: "normal",
      publicationState: "published",
      parityState: "exact",
      routeExposureState: "publishable",
      buildProvenanceState: "verified",
      now: "2026-04-13T12:00:00.000Z",
    },
  },
  {
    scenarioId: "LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION",
    title: "Widen after satisfied observation",
    description:
      "Widens the same local wave only after the observation window and readiness tuple are both satisfied for the same release and rollback target.",
    environmentRing: "local",
    actionType: "widen",
    releaseWatchScenarioId: "LOCAL_SATISFIED",
    resilienceScenarioId: "LOCAL_EXACT_READY",
    buildProvenancePreference: "verified",
    affectedTenantCount: 2,
    affectedOrganisationCount: 1,
    stateOverrides: {
      rollbackReadinessState: "ready",
      trustState: "live",
      continuityState: "healthy",
      tupleFreshnessState: "current",
      recoveryDispositionState: "normal",
      publicationState: "published",
      parityState: "exact",
      routeExposureState: "publishable",
      buildProvenanceState: "verified",
      now: "2026-04-13T12:05:00.000Z",
    },
  },
  {
    scenarioId: "CI_PREVIEW_PAUSE_CONSTRAINED_GUARDRAIL",
    title: "Pause on constrained guardrail",
    description:
      "Pauses a preview-ring rollout when stale rehearsal proof and constrained continuity prevent a safe widen, without escalating directly into rollback or kill-switch.",
    environmentRing: "ci-preview",
    actionType: "pause",
    releaseWatchScenarioId: "CI_PREVIEW_STALE",
    resilienceScenarioId: "LOCAL_STALE_REHEARSAL",
    buildProvenancePreference: "verified",
    affectedTenantCount: 3,
    affectedOrganisationCount: 2,
    stateOverrides: {
      rollbackReadinessState: "constrained",
      trustState: "degraded",
      continuityState: "constrained",
      tupleFreshnessState: "current",
      recoveryDispositionState: "read_only",
      publicationState: "published",
      parityState: "exact",
      routeExposureState: "constrained",
      buildProvenanceState: "verified",
      readinessState: "stale_rehearsal_evidence",
      now: "2026-04-13T12:10:00.000Z",
    },
  },
  {
    scenarioId: "INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH",
    title: "Rollback on trigger breach",
    description:
      "Exercises explicit rollback when continuity and restore proof breach the watch window, proving the target tuple and rollback evidence are known before the action settles.",
    environmentRing: "integration",
    actionType: "rollback",
    releaseWatchScenarioId: "INTEGRATION_STALE",
    resilienceScenarioId: "INTEGRATION_BLOCKED_RESTORE_PROOF",
    affectedTenantCount: 4,
    affectedOrganisationCount: 2,
    stateOverrides: {
      watchState: "rollback_required",
      observationState: "expired",
      rollbackReadinessState: "ready",
      trustState: "degraded",
      continuityState: "breached",
      tupleFreshnessState: "drifted",
      recoveryDispositionState: "recovery_only",
      now: "2026-04-13T12:15:00.000Z",
    },
  },
  {
    scenarioId: "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE",
    title: "Kill-switch on trust or parity failure",
    description:
      "Triggers the rehearsal kill-switch when preprod trust, provenance, and parity posture degrade past safe pause or rollback-only behaviour.",
    environmentRing: "preprod",
    actionType: "kill_switch",
    releaseWatchScenarioId: "PREPROD_ROLLBACK_REQUIRED",
    resilienceScenarioId: "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
    affectedTenantCount: 5,
    affectedOrganisationCount: 3,
    stateOverrides: {
      rollbackReadinessState: "constrained",
      trustState: "quarantined",
      continuityState: "breached",
      tupleFreshnessState: "drifted",
      recoveryDispositionState: "kill_switch_active",
      now: "2026-04-13T12:20:00.000Z",
    },
  },
  {
    scenarioId: "LOCAL_ROLLFORWARD_AFTER_SUPERSEDED_TUPLE",
    title: "Rollforward after superseded tuple and fresh proof",
    description:
      "Shows that a prior rollforward preview is superseded before the fresh tuple with current readiness proof is allowed to settle satisfied.",
    environmentRing: "local",
    actionType: "rollforward",
    releaseWatchScenarioId: "LOCAL_SATISFIED",
    resilienceScenarioId: "LOCAL_EXACT_READY",
    buildProvenancePreference: "verified",
    affectedTenantCount: 2,
    affectedOrganisationCount: 1,
    stateOverrides: {
      rollbackReadinessState: "ready",
      trustState: "live",
      continuityState: "healthy",
      tupleFreshnessState: "current",
      recoveryDispositionState: "normal",
      publicationState: "published",
      parityState: "exact",
      routeExposureState: "publishable",
      buildProvenanceState: "verified",
      currentTupleHash: "tuple::local::rollforward-new",
      targetTupleHash: "tuple::local::rollforward-new",
      idempotencyKey: "wave-action::local-rollforward-new",
      now: "2026-04-13T12:25:00.000Z",
    },
    supersededContextOverrides: {
      tupleFreshnessState: "superseded",
      currentTupleHash: "tuple::local::rollforward-old",
      targetTupleHash: "tuple::local::rollforward-new",
      idempotencyKey: "wave-action::local-rollforward-old",
      now: "2026-04-13T12:24:00.000Z",
    },
  },
] as const;

export function listCanaryScenarioDefinitions(): readonly CanaryScenarioDefinition[] {
  return canaryScenarioDefinitions;
}

export function getCanaryScenarioDefinition(
  environmentRing: string,
  scenarioId?: string,
): CanaryScenarioDefinition {
  if (scenarioId) {
    const match = canaryScenarioDefinitions.find((candidate) => candidate.scenarioId === scenarioId);
    if (match) {
      return match;
    }
    throw new Error(`Unknown canary rehearsal scenario: ${scenarioId}`);
  }
  const match = canaryScenarioDefinitions.find(
    (candidate) => candidate.environmentRing === environmentRing,
  );
  if (match) {
    return match;
  }
  return canaryScenarioDefinitions[0]!;
}

export function buildCanaryScenario(
  definition: CanaryScenarioDefinition,
): CanaryScenarioOutput {
  const context = buildBaseContext(definition);
  const supersededContext =
    definition.supersededContextOverrides !== undefined
      ? createWaveActionContext({
          ...context,
          ...definition.supersededContextOverrides,
        })
      : undefined;
  const coordinator = new CanaryRollbackHarnessCoordinator();
  const rehearsal = coordinator.rehearse(context, {
    supersededContext,
  });
  const summary: CanaryScenarioSummary = {
    scenarioId: definition.scenarioId,
    title: definition.title,
    description: definition.description,
    environmentRing: definition.environmentRing,
    actionType: definition.actionType,
    guardrailState: rehearsal.guardrailSnapshot.guardrailState,
    previewState: rehearsal.impactPreview.previewState,
    executionState: rehearsal.executionReceipt.executionState,
    observationState: rehearsal.observationWindow.observationState,
    settlementState: rehearsal.settlement.settlementState,
    cockpitState: rehearsal.cockpit.cockpitState,
    watchState: context.watchState,
    readinessState: context.readinessState,
    rollbackReadinessState: context.rollbackReadinessState,
    blockerRefs: rehearsal.settlement.blockerRefs,
    warningRefs: rehearsal.settlement.warningRefs,
    rollbackTargetPublicationBundleRef: context.rollbackTargetPublicationBundleRef,
    impactPreviewRef: rehearsal.impactPreview.waveActionImpactPreviewId,
    settlementRef: rehearsal.settlement.waveActionSettlementId,
  };
  return {
    definition,
    context,
    rehearsal,
    summary,
  };
}

export function writeScenarioOutput(outputDir: string, output: CanaryScenarioOutput): void {
  fs.mkdirSync(outputDir, { recursive: true });
  writeJson(path.join(outputDir, "scenario-definition.json"), output.definition);
  writeJson(path.join(outputDir, "scenario-context.json"), output.context);
  writeJson(path.join(outputDir, "wave-guardrail-snapshot.json"), output.rehearsal.guardrailSnapshot);
  writeJson(path.join(outputDir, "wave-action-impact-preview.json"), output.rehearsal.impactPreview);
  if (output.rehearsal.supersededImpactPreview) {
    writeJson(
      path.join(outputDir, "superseded-wave-action-impact-preview.json"),
      output.rehearsal.supersededImpactPreview,
    );
  }
  writeJson(path.join(outputDir, "wave-action-record.json"), output.rehearsal.actionRecord);
  writeJson(
    path.join(outputDir, "wave-action-execution-receipt.json"),
    output.rehearsal.executionReceipt,
  );
  writeJson(
    path.join(outputDir, "wave-action-observation-window.json"),
    output.rehearsal.observationWindow,
  );
  writeJson(path.join(outputDir, "wave-action-settlement.json"), output.rehearsal.settlement);
  writeJson(
    path.join(outputDir, "release-watch-evidence-cockpit.json"),
    output.rehearsal.cockpit,
  );
  writeJson(path.join(outputDir, "wave-action-audit-trail.json"), output.rehearsal.auditTrail);
  writeJson(path.join(outputDir, "rehearsal-history.json"), output.rehearsal.history);
  writeJson(path.join(outputDir, "rehearsal-summary.json"), output.summary);
}

export function runCanaryScenarioRehearsal(
  environmentRing: string,
  outputDir: string,
  scenarioId?: string,
): CanaryScenarioOutput {
  const definition = getCanaryScenarioDefinition(environmentRing, scenarioId);
  const output = buildCanaryScenario(definition);
  writeScenarioOutput(outputDir, output);
  return output;
}
