import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_monitoring/package.json",
  "packages/domains/assistive_monitoring/project.json",
  "packages/domains/assistive_monitoring/tsconfig.json",
  "packages/domains/assistive_monitoring/src/index.ts",
  "services/command-api/migrations/415_phase8_monitoring_and_trust_projection.sql",
  "docs/backend/415_phase8_monitoring_and_trust_projection_spec.md",
  "docs/backend/415_phase8_monitoring_topology.mmd",
  "data/contracts/415_monitoring_and_trust_projection_contract.json",
  "data/analysis/415_algorithm_alignment_notes.md",
  "data/analysis/415_external_reference_notes.md",
  "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_MONITORING_AND_TRUST_PROJECTION.json",
  "tests/unit/415_interval_threshold_and_trust_score.spec.ts",
  "tests/integration/415_drift_fairness_and_incident_link_pipeline.spec.ts",
  "tests/integration/415_watch_tuple_and_posture_projection.spec.ts",
  "tests/integration/415_test_helpers.ts",
  "tools/analysis/validate_415_phase8_monitoring_trust_projection.ts",
] as const;

const REQUIRED_SERVICES = [
  "ShadowComparisonRunService",
  "AssistiveDriftDetectionOrchestrator",
  "FairnessSliceMetricService",
  "ReleaseGuardThresholdService",
  "AssistiveIncidentLinkService",
  "AssistiveCapabilityWatchTupleRegistry",
  "AssistiveCapabilityTrustProjectionEngine",
  "AssistiveCurrentPostureResolver",
] as const;

const REQUIRED_OBJECTS = [
  "ShadowComparisonRun",
  "DriftSignal",
  "BiasSliceMetric",
  "ReleaseGuardThreshold",
  "AssistiveIncidentLink",
  "AssistiveCapabilityWatchTuple",
  "AssistiveCapabilityTrustProjection",
  "AssistiveCapabilityRolloutVerdict",
  "AssistiveCurrentPosture",
  "AssistiveMonitoringAuditRecord",
] as const;

const REQUIRED_MARKERS = [
  "watch_tuple_pins_model_prompt_policy_runtime",
  "watch_tuple_immutable",
  "interval_aware_thresholds",
  "drift_requires_effect_and_evidence",
  "fairness_small_slices_not_healthy",
  "trust_projection_monotonic_penalty",
  "current_posture_fail_closed",
  "kill_switch_current_state_not_history",
  "incident_links_downgrade_trust",
  "monitoring_phi_safe_refs_only",
  "route_cohort_posture_authoritative",
  "missing_visible_evidence_shadow_only",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
  "https://transform.england.nhs.uk/information-governance/guidance/artificial-intelligence/",
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/review-of-digital-clinical-safety-standards-dcb0129-and-dcb0160",
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
    packageJson.scripts?.["validate:415-phase8-monitoring-trust-projection"] ===
      "pnpm exec tsx ./tools/analysis/validate_415_phase8_monitoring_trust_projection.ts",
    "package.json missing validate:415-phase8-monitoring-trust-projection script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_414_phase8_track_backend_build_replayable_inference_logs_prompt_snapshot_storage_and_trainability_flags/m.test(
      checklist,
    ),
    "Checklist task 414 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_415_phase8_track_backend_build_drift_fairness_and_degraded_trust_monitoring_pipeline/m.test(
      checklist,
    ),
    "Checklist task 415 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGateAndGap();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("415 phase8 monitoring and trust projection validated.");
}

function validateUpstreamGateAndGap(): void {
  for (const upstream of [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/404_feedback_eligibility_contracts.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/406_evaluation_runtime_contract.json",
    "data/contracts/409_recommendation_orchestrator_contract.json",
    "data/contracts/410_capability_control_plane_contract.json",
    "data/contracts/411_trust_envelope_projection_contract.json",
    "data/contracts/414_replayable_provenance_and_trainability_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `415 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track415 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_415",
  );
  invariant(track415, "403 registry missing par_415.");
  invariant(
    track415.readinessState === "deferred",
    "Static 403 registry is expected to still mark par_415 deferred.",
  );
  invariant(
    asArray(track415.blockingRefs, "track415.blockingRefs").includes(
      "WAIT403_415_REQUIRES_SHADOW_METRICS",
    ),
    "par_415 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_MONITORING_AND_TRUST_PROJECTION.json");
  invariant(gap.taskId === "par_415", "415 gap note task id drifted.");
  requireIncludes(
    String(gap.missingSurface),
    "WAIT403_415_REQUIRES_SHADOW_METRICS",
    "415 gap note",
  );
  requireIncludes(
    String(gap.temporaryFallback),
    "data/contracts/406_evaluation_runtime_contract.json",
    "415 gap fallback",
  );
  requireIncludes(
    String(gap.temporaryFallback),
    "data/contracts/414_replayable_provenance_and_trainability_contract.json",
    "415 gap fallback",
  );
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_415", "415 gap follow-up");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_monitoring/package.json",
  );
  invariant(
    packageJson.name === "@vecells/domain-assistive-monitoring",
    "Assistive monitoring package name drifted.",
  );
  invariant(
    packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit",
    "Assistive monitoring typecheck script missing.",
  );
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-monitoring"'),
    "tsconfig.base.json missing @vecells/domain-assistive-monitoring path.",
  );

  const source = readText("packages/domains/assistive_monitoring/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const marker of REQUIRED_MARKERS) {
    invariant(source.includes(marker), `Runtime source missing invariant marker ${marker}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveMonitoringPlane",
    "stableAssistiveMonitoringHash",
    "wilsonInterval",
    "Math.exp(-totalPenalty)",
    "surfacePublicationState",
    "runtimePublicationState",
    "assistiveKillSwitchState",
    "thresholdBreachRefs",
    "incidentLinkRefs",
  ]) {
    requireIncludes(source, requiredSnippet, "415 runtime source");
  }
}

function validateRuntimeContract(): void {
  const contract = readJson<{
    taskId?: string;
    schemaVersion?: string;
    services?: JsonRecord[];
    persistedObjects?: unknown[];
    watchTuplePolicy?: JsonRecord;
    metricPolicy?: JsonRecord;
    trustProjectionPolicy?: JsonRecord;
    posturePolicy?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/415_monitoring_and_trust_projection_contract.json");

  invariant(contract.taskId === "par_415", "415 runtime contract task id drifted.");
  invariant(
    contract.schemaVersion === "415.monitoring-and-trust-projection.v1",
    "415 runtime contract schema version drifted.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) =>
      String(service.serviceName),
    ),
    REQUIRED_SERVICES,
    "415 services",
  );
  requireExactSuperset(
    asStringArray(contract.persistedObjects, "contract.persistedObjects"),
    REQUIRED_OBJECTS,
    "415 persisted objects",
  );
  requireIncludes(
    JSON.stringify(contract.watchTuplePolicy),
    "promptBundleHash",
    "415 watch tuple policy",
  );
  requireIncludes(JSON.stringify(contract.metricPolicy), "Wilson", "415 metric policy");
  requireIncludes(JSON.stringify(contract.metricPolicy), "effect-size floor", "415 metric policy");
  requireIncludes(JSON.stringify(contract.trustProjectionPolicy), "exp(-sum", "415 trust policy");
  requireIncludes(
    JSON.stringify(contract.trustProjectionPolicy),
    "shadow_only",
    "415 trust policy",
  );
  requireIncludes(JSON.stringify(contract.posturePolicy), "416", "415 posture policy");
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) =>
      String(entry.code),
    ),
    REQUIRED_MARKERS,
    "415 invariants",
  );
}

function validateMigration(): void {
  const migration = readText(
    "services/command-api/migrations/415_phase8_monitoring_and_trust_projection.sql",
  );
  for (const tableName of [
    "shadow_comparison_run",
    "release_guard_threshold",
    "drift_signal",
    "bias_slice_metric",
    "assistive_incident_link",
    "assistive_capability_watch_tuple",
    "assistive_capability_trust_projection",
    "assistive_capability_rollout_verdict",
    "assistive_current_posture",
    "assistive_monitoring_audit_record",
  ]) {
    requireIncludes(migration, tableName, "415 migration");
  }
  for (const constraint of [
    "shadow_comparison_refs_only",
    "release_guard_threshold_interval_policy_required",
    "drift_signal_effect_and_evidence_required",
    "bias_slice_metric_interval_required",
    "fairness_small_slices_not_healthy",
    "assistive_watch_tuple_immutable_hash_required",
    "trust_projection_monotonic_inputs_required",
    "trust_projection_hard_blockers_fail_closed",
    "current_posture_fail_closed_on_missing_evidence",
    "route_cohort_posture_authoritative",
    "monitoring_phi_safe_refs_only",
  ]) {
    requireIncludes(migration, constraint, "415 migration constraints");
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/415_phase8_monitoring_and_trust_projection_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    requireIncludes(spec, serviceName, "415 backend spec");
  }
  for (const phrase of [
    "Watch Tuple Identity",
    "Interval Thresholds",
    "Trust Projection",
    "Current Posture",
    "PHI",
  ]) {
    requireIncludes(spec, phrase, "415 backend spec");
  }

  const topology = readText("docs/backend/415_phase8_monitoring_topology.mmd");
  for (const node of [
    "AssistiveCapabilityWatchTuple",
    "ReleaseGuardThreshold",
    "ShadowComparisonRun",
    "DriftSignal",
    "BiasSliceMetric",
    "AssistiveIncidentLink",
    "AssistiveCapabilityTrustProjection",
    "AssistiveCurrentPosture",
  ]) {
    requireIncludes(topology, node, "415 topology");
  }

  const algorithmNotes = readText("data/analysis/415_algorithm_alignment_notes.md");
  for (const phrase of [
    "blueprint/phase-8-the-assistive-layer.md",
    "AssistiveCapabilityWatchTuple",
    "normalized penalty model",
    "shadow_only",
  ]) {
    requireIncludes(algorithmNotes, phrase, "415 algorithm notes");
  }

  const externalNotes = readText("data/analysis/415_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    requireIncludes(externalNotes, url, "415 external reference notes");
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
