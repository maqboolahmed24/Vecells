import fs from "node:fs";
import path from "node:path";
import type {
  ReleaseWatchTupleMembers,
  ReleaseWatchRoutePostureState,
  ReleaseWatchRollbackReadinessState,
  WaveObservationPolicyMembers,
  WaveObservationProbeDefinition,
  WaveObservationProbeReading,
} from "../../packages/release-controls/src/release-watch-pipeline.ts";
import { ReleaseWatchPipelineCoordinator } from "../../packages/release-controls/src/release-watch-pipeline.ts";
import { stableDigest } from "../../packages/release-controls/src/build-provenance.ts";
import {
  evaluatePublicationArtifacts,
  loadPublicationArtifacts,
} from "../runtime-publication/shared.ts";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

export interface CliArgs {
  [key: string]: string;
}

export interface ReleaseWatchCatalogRecord {
  scenarioId: string;
  environmentRing: string;
  releaseRef: string;
  tuple: {
    releaseWatchTupleId: string;
    releaseRef: string;
    promotionIntentRef: string;
    approvalEvidenceBundleRef: string;
    baselineTupleHash: string;
    approvalTupleHash: string;
    releaseApprovalFreezeRef: string;
    runtimePublicationBundleRef: string;
    releasePublicationParityRef: string;
    waveRef: string;
    waveEligibilitySnapshotRef: string;
    waveGuardrailSnapshotRef: string;
    waveObservationPolicyRef: string;
    waveControlFenceRef: string;
    tenantScopeMode: string;
    tenantScopeRef: string;
    affectedTenantCount: number;
    affectedOrganisationCount: number;
    tenantScopeTupleHash: string;
    requiredAssuranceSliceRefs: string[];
    releaseTrustFreezeVerdictRefs: string[];
    requiredContinuityControlRefs: string[];
    continuityEvidenceDigestRefs: string[];
    activeChannelFreezeRefs: string[];
    recoveryDispositionRefs: string[];
    watchTupleHash: string;
    tupleState: string;
    supersededByReleaseWatchTupleRef: string | null;
    staleReasonRefs: string[];
    publishedAt: string;
    closedAt: string | null;
    source_refs: string[];
  };
  policy: {
    waveObservationPolicyId: string;
    releaseRef: string;
    waveRef: string;
    promotionIntentRef: string;
    releaseApprovalFreezeRef: string;
    waveEligibilitySnapshotRef: string;
    watchTupleHash: string;
    minimumDwellDuration: string;
    minimumObservationSamples: number;
    requiredProbeRefs: string[];
    requiredContinuityControlRefs: string[];
    requiredContinuityEvidenceDigestRefs: string[];
    requiredPublicationParityState: "exact";
    requiredRoutePostureState: ReleaseWatchRoutePostureState;
    requiredProvenanceState: "verified" | "quarantined" | "revoked" | "superseded" | "drifted";
    stabilizationCriteriaRef: string;
    rollbackTriggerRefs: string[];
    policyHash: string;
    policyState: string;
    supersededByWaveObservationPolicyRef: string | null;
    gapResolutionRefs: string[];
    operationalReadinessSnapshotRef: string | null;
    publishedAt: string;
    source_refs: string[];
  };
  currentTuple: ReleaseWatchTupleMembers;
  currentPolicy: WaveObservationPolicyMembers;
  probeReadings: WaveObservationProbeReading[];
  routePostureState: ReleaseWatchRoutePostureState;
  provenanceState: "verified" | "quarantined" | "revoked" | "superseded" | "drifted";
  currentContinuityEvidenceDigestRefs: string[];
  currentAssuranceSliceRefs: string[];
  trustFreezeLive: boolean;
  assuranceHardBlock: boolean;
  rollbackReadinessState: ReleaseWatchRollbackReadinessState;
  manualRollbackApproved: boolean;
  now: string;
  observedSamples: number;
  expected: {
    watchState: string;
    tupleState: string;
    policyState: string;
    observationState: string;
    allowedActions: string[];
    blockedActions: string[];
    triggeredTriggerRefs: string[];
  };
}

export interface ReleaseWatchCatalog {
  task_id: string;
  records: ReleaseWatchCatalogRecord[];
}

export interface ProbeCatalogPayload {
  task_id: string;
  probeCatalog: WaveObservationProbeDefinition[];
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    if (!key) continue;
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

export function loadCatalog(): ReleaseWatchCatalog {
  return readJson<ReleaseWatchCatalog>(
    path.join(ROOT, "data", "analysis", "release_watch_pipeline_catalog.json"),
  );
}

export function loadProbeCatalog(): ProbeCatalogPayload {
  return readJson<ProbeCatalogPayload>(
    path.join(ROOT, "data", "analysis", "wave_observation_probe_catalog.json"),
  );
}

export function loadRecord(environmentRing: string): ReleaseWatchCatalogRecord {
  const catalog = loadCatalog();
  const exact = catalog.records.find(
    (row) =>
      row.environmentRing === environmentRing &&
      (row.expected.watchState === "satisfied" || row.expected.watchState === "accepted"),
  );
  if (exact) {
    return exact;
  }
  const fallback = catalog.records.find((row) => row.environmentRing === environmentRing);
  if (fallback) {
    return fallback;
  }
  throw new Error(`No release watch record found for ${environmentRing}.`);
}

export function buildDigestSummary(payload: {
  watchState: string;
  tupleState: string;
  policyState: string;
  observationState: string;
  allowedActions: readonly string[];
  triggeredTriggerRefs: readonly string[];
}): string {
  return stableDigest({
    watchState: payload.watchState,
    tupleState: payload.tupleState,
    policyState: payload.policyState,
    observationState: payload.observationState,
    allowedActions: [...payload.allowedActions].sort(),
    triggeredTriggerRefs: [...payload.triggeredTriggerRefs].sort(),
  });
}

export function hydrateScenario(environmentRing: string) {
  const record = loadRecord(environmentRing);
  const publicationArtifacts = loadPublicationArtifacts(record.environmentRing);
  const publicationVerdict = evaluatePublicationArtifacts(publicationArtifacts);
  const probeCatalog = loadProbeCatalog().probeCatalog.filter((probe) =>
    record.currentPolicy.requiredProbeRefs.includes(probe.probeRef),
  );

  const coordinator = new ReleaseWatchPipelineCoordinator();
  const published = coordinator.publish({
    tuple: {
      ...record.tuple,
      runtimePublicationBundleRef: publicationArtifacts.bundle.runtimePublicationBundleId,
      releasePublicationParityRef: publicationArtifacts.parity.publicationParityRecordId,
      sourceRefs: record.tuple.source_refs,
    },
    policy: {
      ...record.policy,
      sourceRefs: record.policy.source_refs,
    },
  });

  const result = coordinator.evaluate({
    releaseRef: published.tuple.releaseRef,
    waveRef: published.tuple.waveRef,
    currentTuple: record.currentTuple,
    currentPolicy: record.currentPolicy,
    publicationVerdict,
    probeCatalog,
    probeReadings: record.probeReadings,
    routePostureState: record.routePostureState,
    provenanceState: record.provenanceState,
    currentContinuityEvidenceDigestRefs: record.currentContinuityEvidenceDigestRefs,
    currentAssuranceSliceRefs: record.currentAssuranceSliceRefs,
    trustFreezeLive: record.trustFreezeLive,
    assuranceHardBlock: record.assuranceHardBlock,
    rollbackReadinessState: record.rollbackReadinessState,
    manualRollbackApproved: record.manualRollbackApproved,
    now: record.now,
    observedSamples: record.observedSamples,
  });

  return {
    record,
    probeCatalog,
    publicationArtifacts,
    publicationVerdict,
    coordinator,
    published,
    result,
  };
}
