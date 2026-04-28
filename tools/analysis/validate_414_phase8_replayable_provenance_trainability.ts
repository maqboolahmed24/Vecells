import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_provenance/package.json",
  "packages/domains/assistive_provenance/project.json",
  "packages/domains/assistive_provenance/tsconfig.json",
  "packages/domains/assistive_provenance/src/index.ts",
  "services/command-api/migrations/414_phase8_replayable_provenance_and_trainability.sql",
  "docs/backend/414_phase8_replayable_provenance_and_trainability_spec.md",
  "docs/backend/414_phase8_provenance_and_trainability_topology.mmd",
  "data/contracts/414_replayable_provenance_and_trainability_contract.json",
  "data/analysis/414_algorithm_alignment_notes.md",
  "data/analysis/414_external_reference_notes.md",
  "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_REPLAYABLE_PROVENANCE_AND_TRAINABILITY.json",
  "tests/unit/414_prompt_snapshot_and_inference_log_binding.spec.ts",
  "tests/integration/414_feedback_eligibility_materialization_and_revocation.spec.ts",
  "tests/integration/414_replay_manifest_and_secure_export_guard.spec.ts",
  "tests/integration/414_test_helpers.ts",
  "tools/analysis/validate_414_phase8_replayable_provenance_trainability.ts",
] as const;

const REQUIRED_SERVICES = [
  "AssistivePromptPackageRegistry",
  "AssistivePromptSnapshotStore",
  "AssistiveInferenceLogService",
  "AssistiveProvenanceEnvelopeWriter",
  "AssistiveReplayManifestAssembler",
  "FeedbackEligibilityMaterializer",
  "TrainabilityRevocationService",
  "AssistiveProvenanceExportGuard",
] as const;

const REQUIRED_OBJECTS = [
  "AssistivePromptPackage",
  "AssistivePromptSnapshot",
  "AssistiveInferenceLog",
  "AssistiveProvenanceEnvelope",
  "AssistiveReplayManifest",
  "FeedbackEligibilityFlag",
  "TrainabilityRevocationRecord",
  "AssistiveProvenanceExportDecision",
  "AssistiveProvenanceAuditRecord",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/services/gp-it-futures-systems/im1-pairing-integration",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/assessment-criteria-assessed-section/",
  "https://digital.nhs.uk/services/clinical-safety",
] as const;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  for (const relativePath of REQUIRED_FILES) {
    invariant(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:414-phase8-replayable-provenance-trainability"] ===
      "pnpm exec tsx ./tools/analysis/validate_414_phase8_replayable_provenance_trainability.ts",
    "package.json missing validate:414-phase8-replayable-provenance-trainability script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_413_phase8_track_backend_build_override_record_feedback_chain_and_final_human_artifact_linkage/m.test(
      checklist,
    ),
    "Checklist task 413 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_414_phase8_track_backend_build_replayable_inference_logs_prompt_snapshot_storage_and_trainability_flags/m.test(
      checklist,
    ),
    "Checklist task 414 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGateAndGap();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("414 phase8 replayable provenance and trainability validated.");
}

function validateUpstreamGateAndGap(): void {
  for (const upstream of [
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/406_evaluation_runtime_contract.json",
    "data/contracts/407_transcript_runtime_contract.json",
    "data/contracts/408_documentation_composer_contract.json",
    "data/contracts/409_recommendation_orchestrator_contract.json",
    "data/contracts/410_capability_control_plane_contract.json",
    "data/contracts/413_feedback_chain_and_final_human_artifact_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `414 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track414 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_414",
  );
  invariant(track414, "403 registry missing par_414.");
  invariant(
    track414.readinessState === "deferred",
    "Static 403 registry is expected to still mark par_414 deferred.",
  );
  invariant(
    asArray(track414.blockingRefs, "track414.blockingRefs").includes(
      "WAIT403_414_REQUIRES_406_AND_413",
    ),
    "par_414 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>(
    "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_REPLAYABLE_PROVENANCE_AND_TRAINABILITY.json",
  );
  invariant(gap.taskId === "par_414", "414 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "403 readiness registry", "414 gap note");
  requireIncludes(
    String(gap.temporaryFallback),
    "data/contracts/406_evaluation_runtime_contract.json",
    "414 gap fallback",
  );
  requireIncludes(
    String(gap.temporaryFallback),
    "data/contracts/413_feedback_chain_and_final_human_artifact_contract.json",
    "414 gap fallback",
  );
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_414", "414 gap follow-up");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_provenance/package.json",
  );
  invariant(
    packageJson.name === "@vecells/domain-assistive-provenance",
    "Assistive provenance package name drifted.",
  );
  invariant(
    packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit",
    "Assistive provenance typecheck script missing.",
  );
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-provenance"'),
    "tsconfig.base.json missing @vecells/domain-assistive-provenance path.",
  );

  const source = readText("packages/domains/assistive_provenance/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveProvenancePlane",
    "stableAssistiveProvenanceHash",
    "prompt_snapshot_immutable",
    "prompt_snapshot_binds_release_or_watch_tuple",
    "inference_log_refs_hashes_only",
    "replay_critical_raw_content_protected_artifact",
    "provenance_envelope_one_per_artifact_revision",
    "feedback_eligibility_settlement_backed",
    "trainability_revocation_appends_not_mutates",
    "replay_manifest_pins_model_prompt_evidence_policy_runtime",
    "missing_provenance_fail_closed",
    "provenance_export_guard_blocks_raw_content",
    "no_routine_prompt_fragment_telemetry",
  ]) {
    invariant(source.includes(requiredSnippet), `Runtime source missing ${requiredSnippet}.`);
  }
}

function validateRuntimeContract(): void {
  const contract = readJson<{
    taskId?: string;
    schemaVersion?: string;
    services?: JsonRecord[];
    persistedObjects?: unknown[];
    promptSnapshotPolicy?: JsonRecord;
    inferenceLogPolicy?: JsonRecord;
    feedbackEligibilityPolicy?: JsonRecord;
    replayManifestPolicy?: JsonRecord;
    exportPolicy?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/414_replayable_provenance_and_trainability_contract.json");

  invariant(contract.taskId === "par_414", "414 runtime contract task id drifted.");
  invariant(
    contract.schemaVersion === "414.replayable-provenance-and-trainability.v1",
    "414 runtime contract schema version drifted.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) =>
      String(service.serviceName),
    ),
    REQUIRED_SERVICES,
    "414 services",
  );
  requireExactSuperset(
    asStringArray(contract.persistedObjects, "contract.persistedObjects"),
    REQUIRED_OBJECTS,
    "414 persisted objects",
  );
  requireIncludes(
    JSON.stringify(contract.promptSnapshotPolicy),
    "prompt_snapshot_immutable",
    "414 prompt snapshot policy",
  );
  requireIncludes(
    JSON.stringify(contract.inferenceLogPolicy),
    "refs and hashes only",
    "414 inference log policy",
  );
  requireIncludes(
    JSON.stringify(contract.feedbackEligibilityPolicy),
    "pending_settlement",
    "414 feedback eligibility policy",
  );
  requireIncludes(
    JSON.stringify(contract.replayManifestPolicy),
    "runtimeImageRef",
    "414 replay manifest policy",
  );
  requireIncludes(JSON.stringify(contract.exportPolicy), "rawContentDefault", "414 export policy");
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) =>
      String(entry.code),
    ),
    [
      "prompt_snapshot_immutable",
      "inference_log_refs_hashes_only",
      "provenance_envelope_one_per_artifact_revision",
      "feedback_eligibility_settlement_backed",
      "trainability_revocation_appends_not_mutates",
      "replay_manifest_pins_model_prompt_evidence_policy_runtime",
      "missing_provenance_fail_closed",
      "provenance_export_guard_blocks_raw_content",
    ],
    "414 invariants",
  );
}

function validateMigration(): void {
  const migration = readText(
    "services/command-api/migrations/414_phase8_replayable_provenance_and_trainability.sql",
  );
  for (const tableName of [
    "assistive_prompt_package",
    "assistive_prompt_snapshot",
    "assistive_inference_log",
    "assistive_provenance_envelope",
    "assistive_replay_manifest",
    "feedback_eligibility_flag",
    "trainability_revocation_record",
    "assistive_provenance_export_decision",
    "assistive_provenance_audit_record",
  ]) {
    requireIncludes(migration, tableName, "414 migration");
  }
  for (const requiredConstraint of [
    "assistive_prompt_snapshot_immutable_hash_required",
    "assistive_inference_log_refs_hashes_only",
    "assistive_provenance_one_per_artifact_revision",
    "assistive_replay_manifest_pins_runtime",
    "feedback_eligibility_settlement_backed",
    "feedback_eligibility_revoked_points_back",
    "trainability_revocation_reason_bounded",
    "assistive_provenance_export_guard_blocks_raw_content",
  ]) {
    requireIncludes(migration, requiredConstraint, "414 migration constraints");
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/414_phase8_replayable_provenance_and_trainability_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    requireIncludes(spec, serviceName, "414 backend spec");
  }
  for (const phrase of [
    "Prompt Packages And Snapshots",
    "refs and hashes",
    "FeedbackEligibilityFlag",
    "TrainabilityRevocationRecord",
    "Export Guard",
  ]) {
    requireIncludes(spec, phrase, "414 backend spec");
  }

  const topology = readText("docs/backend/414_phase8_provenance_and_trainability_topology.mmd");
  for (const node of [
    "AssistivePromptSnapshot",
    "AssistiveInferenceLog",
    "AssistiveProvenanceEnvelope",
    "AssistiveReplayManifest",
    "FeedbackEligibilityFlag",
    "TrainabilityRevocationRecord",
  ]) {
    requireIncludes(topology, node, "414 topology");
  }

  const algorithmNotes = readText("data/analysis/414_algorithm_alignment_notes.md");
  for (const phrase of [
    "blueprint/phase-8-the-assistive-layer.md",
    "Prompt packages",
    "FeedbackEligibilityFlag",
    "Revocation appends",
  ]) {
    requireIncludes(algorithmNotes, phrase, "414 algorithm notes");
  }

  const externalNotes = readText("data/analysis/414_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    requireIncludes(externalNotes, url, "414 external reference notes");
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function asArray<T>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asStringArray(value: unknown, label: string): string[] {
  return asArray<unknown>(value, label).map((entry) => String(entry));
}

function requireExactSuperset(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  for (const entry of expected) {
    invariant(actual.includes(entry), `${label} missing ${entry}.`);
  }
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
