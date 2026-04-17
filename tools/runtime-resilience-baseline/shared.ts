import fs from "node:fs";
import path from "node:path";
import {
  buildRecoveryEvidencePack,
  canonicalBackupScopes,
  canonicalEssentialFunctionMap,
  canonicalRecoveryTiers,
  compileOperationalReadinessSnapshot,
  createBackupSetManifest,
  createResilienceTupleHash,
  createRunbookBindingRecord,
  runRestoreRehearsal,
  selectResilienceBaselineScenario,
  type BackupScopeDefinition,
  type BackupSourceDigest,
  type BackupSetManifest,
  type OperationalReadinessSnapshot,
  type RecoveryEvidencePack,
  type ResilienceTupleMembers,
  type RestoreRun,
  type RunbookBindingRecord,
} from "../../packages/release-controls/src/resilience-baseline.ts";
import type { BuildProvenanceState } from "../../packages/release-controls/src/build-provenance.ts";
import { stableDigest } from "../../packages/release-controls/src/build-provenance.ts";
import { loadPublicationArtifacts } from "../runtime-publication/shared.ts";
import { loadRecord as loadReleaseWatchRecord } from "../runtime-release-watch/shared.ts";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

export interface CliArgs {
  [key: string]: string;
}

export interface ScenarioContext {
  scenarioId: string;
  environmentRing: string;
  expectedReadinessState: string;
  releaseRef: string;
  buildProvenanceState: BuildProvenanceState;
  tuple: ResilienceTupleMembers;
  resilienceTupleHash: string;
}

export interface BackupPayloadCatalogEntry {
  backupSetManifestId: string;
  datasetScopeRef: string;
  payloadRoot: string | null;
  relativePaths: readonly string[];
}

export interface RehearsalSummary {
  scenarioId: string;
  environmentRing: string;
  expectedReadinessState: string;
  actualReadinessState: string;
  manifestCount: number;
  restoreRunCount: number;
  evidencePackCount: number;
  blockerRefs: readonly string[];
  tupleHash: string;
}

const BACKUP_SOURCE_PATHS: Record<string, readonly string[]> = {
  "backup-scope://transactional-domain": [
    "data/analysis/store_and_retention_matrix.csv",
    "data/analysis/domain_store_manifest.json",
    "docs/architecture/85_data_plane_truth_layer_and_fhir_separation_rules.md",
  ],
  "backup-scope://fhir-representation": [
    "data/analysis/fhir_store_manifest.json",
    "data/analysis/fhir_representation_contract_manifest.json",
    "docs/architecture/85_data_plane_truth_layer_and_fhir_separation_rules.md",
  ],
  "backup-scope://projection-read-models": [
    "data/analysis/migration_readiness_matrix.csv",
    "data/analysis/runtime_topology_publication_matrix.csv",
    "docs/architecture/82_projection_rebuild_readiness_and_compatibility_rules.md",
  ],
  "backup-scope://object-artifacts": [
    "data/analysis/object_storage_class_manifest.json",
    "data/analysis/evidence_object_manifest.json",
    "docs/architecture/86_object_storage_and_retention_design.md",
  ],
  "backup-scope://event-spine": [
    "data/analysis/event_broker_topology_manifest.json",
    "data/analysis/canonical_event_contracts.json",
    "docs/architecture/87_event_spine_and_queueing_design.md",
  ],
  "backup-scope://worm-audit": [
    "data/analysis/build_provenance_manifest.json",
    "data/analysis/recovery_evidence_artifact_catalog.csv",
    "data/analysis/audit_record_schema.json",
  ],
};

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

function sanitizeEnvironmentRing(environmentRing: string): string {
  return environmentRing.replace(/[^a-z0-9]/gi, "_");
}

function ensureOutputDir(outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

function loadBuildProvenanceRecord(environmentRing: string): {
  buildProvenanceRecordId: string;
  provenanceState: BuildProvenanceState;
  releaseRef: string;
} {
  const manifest = readJson<{
    buildProvenanceRecords: Array<{
      buildProvenanceRecordId: string;
      environmentRing: string;
      provenanceState: BuildProvenanceState;
      releaseRef: string;
    }>;
  }>(path.join(ROOT, "data", "analysis", "build_provenance_manifest.json"));
  const exact = manifest.buildProvenanceRecords.find(
    (record) => record.environmentRing === environmentRing && record.provenanceState === "verified",
  );
  if (exact) {
    return exact;
  }
  const fallback = manifest.buildProvenanceRecords.find(
    (record) => record.environmentRing === environmentRing,
  );
  if (fallback) {
    return fallback;
  }
  throw new Error(`No build provenance record found for ${environmentRing}.`);
}

function resolveBackupSourcePaths(scope: BackupScopeDefinition): string[] {
  const relativePaths = BACKUP_SOURCE_PATHS[scope.datasetScopeRef] ?? [];
  return relativePaths.map((relativePath) => path.join(ROOT, relativePath));
}

function collectSourceDigests(scope: BackupScopeDefinition): BackupSourceDigest[] {
  return resolveBackupSourcePaths(scope)
    .filter((absolutePath) => fs.existsSync(absolutePath))
    .map((absolutePath) => {
      const relativePath = path.relative(ROOT, absolutePath);
      const content = fs.readFileSync(absolutePath);
      const stat = fs.statSync(absolutePath);
      return {
        sourceRef: relativePath,
        relativePath,
        digest: stableDigest(content.toString("utf8")),
        sizeBytes: stat.size,
      };
    });
}

function buildTuple(environmentRing: string, scenarioId?: string): ScenarioContext {
  const publicationArtifacts = loadPublicationArtifacts(environmentRing);
  const releaseWatchRecord = loadReleaseWatchRecord(environmentRing);
  const buildProvenanceRecord = loadBuildProvenanceRecord(environmentRing);
  const template = scenarioId
    ? selectResilienceBaselineScenario({ scenarioId })
    : selectResilienceBaselineScenario({ expectedReadinessState: "exact_and_ready" });

  const tuple: ResilienceTupleMembers = {
    environmentRing,
    previewEnvironmentRef:
      environmentRing === "local" ? null : `pev_${sanitizeEnvironmentRing(environmentRing)}`,
    runtimePublicationBundleRef: publicationArtifacts.bundle.runtimePublicationBundleId,
    releasePublicationParityRef: publicationArtifacts.parity.publicationParityRecordId,
    releaseWatchTupleRef: releaseWatchRecord.tuple.releaseWatchTupleId,
    waveObservationPolicyRef: releaseWatchRecord.policy.waveObservationPolicyId,
    buildProvenanceRef: buildProvenanceRecord.buildProvenanceRecordId,
    requiredAssuranceSliceRefs: releaseWatchRecord.currentTuple.requiredAssuranceSliceRefs,
    activeFreezeRefs: template.snapshot.activeFreezeRefs,
  };

  return {
    scenarioId: template.scenarioId,
    environmentRing,
    expectedReadinessState: template.expectedReadinessState,
    releaseRef: releaseWatchRecord.releaseRef,
    buildProvenanceState: buildProvenanceRecord.provenanceState,
    tuple,
    resilienceTupleHash: createResilienceTupleHash(tuple),
  };
}

export function buildRehearsalOutputs(environmentRing: string, scenarioId?: string): {
  context: ScenarioContext;
  manifests: BackupSetManifest[];
  runbookBindings: RunbookBindingRecord[];
  restoreRuns: RestoreRun[];
  evidencePacks: RecoveryEvidencePack[];
  snapshot: OperationalReadinessSnapshot;
} {
  const context = buildTuple(environmentRing, scenarioId);
  const template = selectResilienceBaselineScenario({ scenarioId: context.scenarioId });
  const templateManifestMap = new Map(
    template.manifests.map((manifest) => [manifest.datasetScopeRef, manifest]),
  );
  const templateRunbookMap = new Map(
    template.runbookBindings.map((binding) => [binding.functionCode, binding]),
  );
  const templateRestoreMap = new Map(
    template.restoreRuns.map((restoreRun) => [restoreRun.functionCode, restoreRun]),
  );
  const templateEvidenceMap = new Map(
    template.evidencePacks.map((pack) => [pack.functionCode, pack]),
  );

  const manifests = canonicalBackupScopes.map((scope) => {
    const templateManifest = templateManifestMap.get(scope.datasetScopeRef);
    const sourceDigests =
      templateManifest?.manifestState === "missing" ? [] : collectSourceDigests(scope);
    const manifest = createBackupSetManifest({
      tuple: context.tuple,
      scope,
      essentialFunctionRefs: canonicalEssentialFunctionMap
        .filter((binding) => binding.requiredBackupScopeRefs.includes(scope.datasetScopeRef))
        .map((binding) => binding.functionCode),
      sourceDigestEntries: sourceDigests,
      capturedAt: templateManifest?.capturedAt ?? "2026-04-13T12:00:00.000Z",
      manifestState: templateManifest?.manifestState ?? "current",
      blockerRefs: templateManifest?.blockerRefs ?? [],
    });
    if (
      templateManifest &&
      templateManifest.manifestTupleHash !== template.snapshot.resilienceTupleHash
    ) {
      manifest.manifestTupleHash = templateManifest.manifestTupleHash;
    }
    return manifest;
  });

  const runbookBindings = canonicalEssentialFunctionMap.map((binding) => {
    const templateBinding = templateRunbookMap.get(binding.functionCode);
    return createRunbookBindingRecord({
      tuple: context.tuple,
      functionCode: binding.functionCode,
      runbookRef: templateBinding?.runbookRef ?? `runbook://${binding.functionCode}`,
      ownerRef: templateBinding?.ownerRef ?? `owner://${binding.functionGroup}`,
      bindingState: templateBinding?.bindingState ?? "current",
      lastRehearsedAt: templateBinding?.lastRehearsedAt ?? "2026-04-13T11:30:00.000Z",
      freshnessDeadlineAt: templateBinding?.freshnessDeadlineAt ?? "2026-04-13T18:00:00.000Z",
      blockerRefs: templateBinding?.blockerRefs ?? [],
      sourceRefs: templateBinding?.sourceRefs ?? ["prompt/101.md"],
    });
  });

  const restoreRuns = canonicalEssentialFunctionMap.map((binding) => {
    const templateRestore = templateRestoreMap.get(binding.functionCode);
    const expectedTupleHash = createResilienceTupleHash(context.tuple);
    const observedTupleHash =
      templateRestore &&
      templateRestore.observedResilienceTupleHash !== templateRestore.expectedResilienceTupleHash
        ? templateRestore.observedResilienceTupleHash
        : expectedTupleHash;
    return runRestoreRehearsal({
      tuple: context.tuple,
      functionCode: binding.functionCode,
      restoreTargetRef:
        templateRestore?.restoreTargetRef ??
        `restore-target://${environmentRing}/${binding.functionCode}`,
      backupSetManifestRefs: manifests
        .filter((manifest) => binding.requiredBackupScopeRefs.includes(manifest.datasetScopeRef))
        .map((manifest) => manifest.backupSetManifestId),
      runbookBindingRefs: binding.currentRunbookBindingRefs,
      requiredJourneyProofRefs: binding.requiredJourneyProofRefs,
      initiatedAt: templateRestore?.initiatedAt ?? "2026-04-13T12:05:00.000Z",
      completedAt: templateRestore?.completedAt ?? "2026-04-13T12:15:00.000Z",
      journeyValidationState:
        templateRestore?.restoreState === "journey_validation_pending" ? "pending" : "validated",
      blockerRefs: templateRestore?.blockerRefs ?? [],
      observedResilienceTupleHash: observedTupleHash,
    });
  });

  const evidencePacks = canonicalEssentialFunctionMap.map((binding) => {
    const templateEvidence = templateEvidenceMap.get(binding.functionCode);
    return buildRecoveryEvidencePack(
      {
        tuple: context.tuple,
        functionCode: binding.functionCode,
        backupSetManifestRefs: manifests
          .filter((manifest) => binding.requiredBackupScopeRefs.includes(manifest.datasetScopeRef))
          .map((manifest) => manifest.backupSetManifestId),
        runbookBindingRefs: binding.currentRunbookBindingRefs,
        restoreRunRef: restoreRuns.find((restoreRun) => restoreRun.functionCode === binding.functionCode)!
          .restoreRunId,
        syntheticJourneyProofRefs: binding.requiredJourneyProofRefs,
        generatedAt: templateEvidence?.generatedAt ?? "2026-04-13T12:20:00.000Z",
        validUntil: templateEvidence?.validUntil ?? "2026-04-13T18:00:00.000Z",
        evidenceArtifactRefs: templateEvidence?.evidenceArtifactRefs,
        blockerRefs: templateEvidence?.blockerRefs,
        forcedPackState:
          templateEvidence?.packState && templateEvidence.packState !== "current"
            ? templateEvidence.packState
            : undefined,
      },
      restoreRuns.find((restoreRun) => restoreRun.functionCode === binding.functionCode)!,
      runbookBindings,
      manifests,
    );
  });

  const snapshot = compileOperationalReadinessSnapshot({
    tuple: context.tuple,
    buildProvenanceState: context.buildProvenanceState,
    compiledAt: "2026-04-13T12:25:00.000Z",
    essentialFunctions: canonicalEssentialFunctionMap,
    recoveryTiers: canonicalRecoveryTiers,
    backupManifests: manifests,
    runbookBindings,
    restoreRuns,
    evidencePacks,
  });

  return {
    context,
    manifests,
    runbookBindings,
    restoreRuns,
    evidencePacks,
    snapshot,
  };
}

function copyFileIntoRoot(sourcePath: string, rootOutputPath: string): string {
  const relativePath = path.relative(ROOT, sourcePath);
  const targetPath = path.join(rootOutputPath, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  return path.relative(rootOutputPath, targetPath);
}

export function materializeBackupPayloads(
  outputDir: string,
  manifests: readonly BackupSetManifest[],
): BackupPayloadCatalogEntry[] {
  ensureOutputDir(outputDir);
  return manifests.map((manifest) => {
    if (manifest.manifestState === "missing") {
      return {
        backupSetManifestId: manifest.backupSetManifestId,
        datasetScopeRef: manifest.datasetScopeRef,
        payloadRoot: null,
        relativePaths: [],
      };
    }

    const scope = canonicalBackupScopes.find(
      (candidate) => candidate.datasetScopeRef === manifest.datasetScopeRef,
    );
    if (!scope) {
      throw new Error(`Unknown backup scope ${manifest.datasetScopeRef}.`);
    }
    const payloadRoot = path.join(outputDir, "backup-payloads", manifest.backupSetManifestId);
    const relativePaths = resolveBackupSourcePaths(scope)
      .filter((sourcePath) => fs.existsSync(sourcePath))
      .map((sourcePath) => copyFileIntoRoot(sourcePath, payloadRoot));
    return {
      backupSetManifestId: manifest.backupSetManifestId,
      datasetScopeRef: manifest.datasetScopeRef,
      payloadRoot: path.relative(outputDir, payloadRoot),
      relativePaths,
    };
  });
}

export function materializeRestoreTargets(
  outputDir: string,
  restoreRuns: readonly RestoreRun[],
  payloadCatalog: readonly BackupPayloadCatalogEntry[],
): void {
  ensureOutputDir(outputDir);
  const catalogByManifestId = new Map(
    payloadCatalog.map((entry) => [entry.backupSetManifestId, entry]),
  );

  restoreRuns.forEach((restoreRun) => {
    const restoreRoot = path.join(outputDir, "restore-targets", restoreRun.functionCode);
    fs.mkdirSync(restoreRoot, { recursive: true });
    restoreRun.backupSetManifestRefs.forEach((manifestRef) => {
      const entry = catalogByManifestId.get(manifestRef);
      if (!entry?.payloadRoot) {
        return;
      }
      entry.relativePaths.forEach((relativePath) => {
        const sourcePath = path.join(outputDir, entry.payloadRoot!, relativePath);
        const targetPath = path.join(restoreRoot, relativePath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.copyFileSync(sourcePath, targetPath);
      });
    });
  });
}

export function writeScenarioFiles(
  outputDir: string,
  outputs: {
    context: ScenarioContext;
    manifests: readonly BackupSetManifest[];
    runbookBindings: readonly RunbookBindingRecord[];
    restoreRuns: readonly RestoreRun[];
    evidencePacks: readonly RecoveryEvidencePack[];
    snapshot: OperationalReadinessSnapshot;
    payloadCatalog?: readonly BackupPayloadCatalogEntry[];
    summary?: RehearsalSummary;
  },
): void {
  ensureOutputDir(outputDir);
  writeJson(path.join(outputDir, "scenario-context.json"), outputs.context);
  writeJson(path.join(outputDir, "backup-set-manifests.json"), outputs.manifests);
  writeJson(path.join(outputDir, "runbook-bindings.json"), outputs.runbookBindings);
  writeJson(path.join(outputDir, "restore-runs.json"), outputs.restoreRuns);
  writeJson(path.join(outputDir, "recovery-evidence-packs.json"), outputs.evidencePacks);
  writeJson(path.join(outputDir, "operational-readiness-snapshot.json"), outputs.snapshot);
  if (outputs.payloadCatalog) {
    writeJson(path.join(outputDir, "backup-payload-catalog.json"), outputs.payloadCatalog);
  }
  if (outputs.summary) {
    writeJson(path.join(outputDir, "rehearsal-summary.json"), outputs.summary);
  }
}

export function buildRehearsalSummary(
  context: ScenarioContext,
  snapshot: OperationalReadinessSnapshot,
  manifests: readonly BackupSetManifest[],
  restoreRuns: readonly RestoreRun[],
  evidencePacks: readonly RecoveryEvidencePack[],
): RehearsalSummary {
  return {
    scenarioId: context.scenarioId,
    environmentRing: context.environmentRing,
    expectedReadinessState: context.expectedReadinessState,
    actualReadinessState: snapshot.readinessState,
    manifestCount: manifests.length,
    restoreRunCount: restoreRuns.length,
    evidencePackCount: evidencePacks.length,
    blockerRefs: snapshot.blockerRefs,
    tupleHash: context.resilienceTupleHash,
  };
}
