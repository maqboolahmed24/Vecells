import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_evaluation/package.json",
  "packages/domains/assistive_evaluation/project.json",
  "packages/domains/assistive_evaluation/tsconfig.json",
  "packages/domains/assistive_evaluation/src/index.ts",
  "services/command-api/migrations/406_phase8_assistive_evaluation_plane.sql",
  "docs/backend/406_phase8_evaluation_plane_spec.md",
  "docs/backend/406_phase8_replay_and_shadow_dataset_topology.mmd",
  "data/analysis/406_algorithm_alignment_notes.md",
  "data/analysis/406_external_reference_notes.md",
  "data/contracts/406_evaluation_runtime_contract.json",
  "tests/unit/406_evaluation_partition_and_label_logic.spec.ts",
  "tests/integration/406_replay_harness_determinism.spec.ts",
  "tests/integration/406_shadow_dataset_capture_and_export.spec.ts",
  "tools/analysis/validate_406_phase8_evaluation_runtime.ts",
] as const;

const REQUIRED_SERVICES = [
  "EvaluationDatasetPartitionService",
  "CaseReplayBundleService",
  "GroundTruthLabelService",
  "ReplayAdjudicationService",
  "ErrorTaxonomyService",
  "ReplayHarnessOrchestrator",
  "ShadowDatasetCaptureService",
  "EvaluationExportArtifactService",
  "AssistiveEvaluationSurfaceBindingResolver",
] as const;

const LAUNCH_PACKET_INTERFACES = [
  "EvaluationDatasetPartitionService",
  "CaseReplayBundleService",
  "GroundTruthLabelService",
  "ReplayAdjudicationService",
  "ReplayHarnessOrchestrator",
  "ShadowDatasetCaptureService",
  "EvaluationExportArtifactService",
] as const;

const REQUIRED_OBJECTS = [
  "DatasetPartitionManifest",
  "CaseReplayBundle",
  "GroundTruthLabel",
  "LabelAdjudicationRecord",
  "ErrorTaxonomyRecord",
  "ReplayRunRecord",
  "ShadowDatasetCaptureRecord",
  "EvaluationExportArtifact",
  "AssistiveEvaluationSurfaceBinding",
  "EvaluationAuditRecord",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://digital.nhs.uk/developer/assurance/process-for-apis-and-services",
  "https://digital.nhs.uk/developer/assurance",
  "https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards",
] as const;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  for (const relativePath of REQUIRED_FILES) {
    invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:406-phase8-evaluation-runtime"] ===
      "pnpm exec tsx ./tools/analysis/validate_406_phase8_evaluation_runtime.ts",
    "package.json missing validate:406-phase8-evaluation-runtime script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_404_phase8_track_gate_freeze_evaluation_corpus_shadow_mode_and_feedback_eligibility_contracts/m.test(
      checklist,
    ),
    "Checklist task 404 must be complete.",
  );
  invariant(
    /^- \[X\] par_405_phase8_track_gate_freeze_release_candidate_safety_case_and_regulatory_change_control_rules/m.test(
      checklist,
    ),
    "Checklist task 405 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_406_phase8_track_backend_build_evaluation_corpus_label_store_replay_harness_and_shadow_dataset/m.test(
      checklist,
    ),
    "Checklist task 406 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGate();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("406 phase8 evaluation runtime validated.");
}

function validateUpstreamGate(): void {
  for (const upstream of [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/404_feedback_eligibility_contracts.json",
    "data/contracts/404_shadow_mode_evidence_requirements.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/405_regulatory_change_control_rules.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, upstream)), `406 requires upstream artifact ${upstream}.`);
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track406 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find((track) => track.trackId === "par_406");
  invariant(track406, "403 registry missing par_406.");
  invariant(track406.readinessState === "ready", "par_406 must be ready in 403 registry.");
  invariant(asArray(track406.blockingRefs, "track406.blockingRefs").length === 0, "par_406 must have no blockers.");

  const packet406 = readJson<{
    trackId?: string;
    readyToLaunch?: boolean;
    launchState?: string;
    ownedInterfaces?: unknown[];
  }>("data/launchpacks/403_track_launch_packet_406.json");
  invariant(packet406.trackId === "par_406", "406 launch packet track id drifted.");
  invariant(packet406.readyToLaunch === true, "406 launch packet must be ready.");
  invariant(packet406.launchState === "open_now", "406 launch packet must be open_now.");
  requireExactSuperset(
    asStringArray(packet406.ownedInterfaces, "packet406.ownedInterfaces"),
    LAUNCH_PACKET_INTERFACES,
    "406 launch packet owned interfaces",
  );
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{
    name?: string;
    scripts?: Record<string, string>;
  }>("packages/domains/assistive_evaluation/package.json");
  invariant(packageJson.name === "@vecells/domain-assistive-evaluation", "Assistive evaluation package name drifted.");
  invariant(packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit", "Assistive evaluation package typecheck script missing.");

  const tsconfig = readText("tsconfig.base.json");
  invariant(
    tsconfig.includes('"@vecells/domain-assistive-evaluation"'),
    "tsconfig.base.json missing @vecells/domain-assistive-evaluation path.",
  );

  const source = readText("packages/domains/assistive_evaluation/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const requiredSnippet of [
    "assistiveEvaluationServiceNames",
    "createAssistiveEvaluationPlane",
    "stableEvaluationHash",
    "mutableCurrentTaskStateRef",
    "assistiveOutputVisibleToEndUsers",
    "raw_phi_export_forbidden",
    "telemetry_disclosure_fence_missing",
  ]) {
    invariant(source.includes(requiredSnippet), `Runtime source missing ${requiredSnippet}.`);
  }
}

function validateRuntimeContract(): void {
  const contract = readJson<{
    taskId?: string;
    schemaVersion?: string;
    services?: JsonRecord[];
    datasetPartitions?: JsonRecord[];
    persistedObjects?: unknown[];
    deterministicReplay?: JsonRecord;
    shadowCapture?: JsonRecord;
    exportPolicy?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/406_evaluation_runtime_contract.json");

  invariant(contract.taskId === "par_406", "406 runtime contract task id drifted.");
  invariant(contract.schemaVersion === "406.evaluation-runtime-contract.v1", "406 runtime contract schema version drifted.");
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) => String(service.serviceName)),
    REQUIRED_SERVICES,
    "406 services",
  );
  requireExactSet(
    asArray<JsonRecord>(contract.datasetPartitions, "contract.datasetPartitions").map((partition) => String(partition.partitionId)),
    ["gold", "shadow_live", "feedback"],
    "406 dataset partitions",
  );
  requireExactSuperset(asStringArray(contract.persistedObjects, "contract.persistedObjects"), REQUIRED_OBJECTS, "406 persisted objects");
  requireExactSuperset(
    asStringArray(contract.deterministicReplay?.pinnedInputs, "deterministicReplay.pinnedInputs"),
    [
      "evidenceSnapshotRefs",
      "evidenceCaptureBundleRefs",
      "evidenceDerivationPackageRefs",
      "featureSnapshotRefs",
      "promptTemplateVersionRef",
      "modelRegistryEntryRef",
      "outputSchemaVersionRef",
      "runtimeConfigHash",
    ],
    "406 deterministic replay pinned inputs",
  );
  requireIncludes(JSON.stringify(contract.shadowCapture), "invisibleToEndUsers", "406 shadow capture policy");
  requireIncludes(JSON.stringify(contract.exportPolicy), "summary_only", "406 export policy");
  requireIncludes(JSON.stringify(contract.exportPolicy), "raw PHI export", "406 export policy");
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) => String(entry.invariantId)),
    ["INV406_001", "INV406_002", "INV406_003", "INV406_004", "INV406_005", "INV406_006", "INV406_007"],
    "406 invariants",
  );
}

function validateMigration(): void {
  const migration = readText("services/command-api/migrations/406_phase8_assistive_evaluation_plane.sql");
  for (const table of [
    "assistive_evaluation_dataset_partition_manifest",
    "assistive_evaluation_case_replay_bundle",
    "assistive_evaluation_ground_truth_label",
    "assistive_evaluation_label_adjudication",
    "assistive_evaluation_error_taxonomy",
    "assistive_evaluation_replay_run",
    "assistive_evaluation_shadow_capture",
    "assistive_evaluation_export_artifact",
    "assistive_evaluation_surface_binding",
    "assistive_evaluation_audit_record",
  ]) {
    invariant(migration.includes(table), `Migration missing table ${table}.`);
  }
  for (const requiredSnippet of [
    "assistive_eval_gold_version_required",
    "assistive_eval_feedback_flag_required",
    "assistive_eval_high_errors_route_to_adjudication",
    "assistive_eval_shadow_invisible",
    "assistive_eval_phi_exports_blocked",
  ]) {
    invariant(migration.includes(requiredSnippet), `Migration missing constraint ${requiredSnippet}.`);
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/406_phase8_evaluation_plane_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(spec.includes(serviceName), `Backend spec missing ${serviceName}.`);
  }
  for (const requiredSnippet of ["gold", "shadow_live", "feedback", "summary_only", "observe_only", "failed closed"]) {
    invariant(spec.toLowerCase().includes(requiredSnippet.toLowerCase()), `Backend spec missing ${requiredSnippet}.`);
  }

  const topology = readText("docs/backend/406_phase8_replay_and_shadow_dataset_topology.mmd");
  for (const requiredSnippet of ["CaseReplayBundleService", "ReplayHarnessOrchestrator", "ShadowDatasetCaptureService", "EvaluationExportArtifactService"]) {
    invariant(topology.includes(requiredSnippet), `Topology missing ${requiredSnippet}.`);
  }

  const algorithm = readText("data/analysis/406_algorithm_alignment_notes.md");
  for (const requiredSnippet of ["Phase 8B", "404", "405", "gold", "shadow_live", "feedback", "deterministic"]) {
    invariant(algorithm.includes(requiredSnippet), `Algorithm notes missing ${requiredSnippet}.`);
  }

  const external = readText("data/analysis/406_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    invariant(external.includes(url), `External notes missing official reference ${url}.`);
  }
  for (const requiredSnippet of ["Borrowed Into 406", "Rejected Or Kept Out Of Scope", "IM1", "local AI technical assurance"]) {
    invariant(external.includes(requiredSnippet), `External notes missing ${requiredSnippet}.`);
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function asArray<T>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asStringArray(value: unknown, label: string): string[] {
  return asArray<unknown>(value, label).map((entry) => String(entry));
}

function requireExactSuperset(actual: readonly string[], required: readonly string[], label: string): void {
  for (const requiredEntry of required) {
    invariant(actual.includes(requiredEntry), `${label} missing ${requiredEntry}.`);
  }
}

function requireExactSet(actual: readonly string[], expected: readonly string[], label: string): void {
  requireExactSuperset(actual, expected, label);
  requireExactSuperset(expected, actual, label);
}

function requireIncludes(value: string, needle: string, label: string): void {
  invariant(value.includes(needle), `${label} missing ${needle}.`);
}
