import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_freeze/package.json",
  "packages/domains/assistive_freeze/project.json",
  "packages/domains/assistive_freeze/tsconfig.json",
  "packages/domains/assistive_freeze/README.md",
  "packages/domains/assistive_freeze/src/index.ts",
  "services/command-api/migrations/416_phase8_freeze_disposition_and_freshness_invalidations.sql",
  "docs/backend/416_phase8_freeze_disposition_and_freshness_invalidations_spec.md",
  "docs/backend/416_phase8_freeze_and_recovery_topology.mmd",
  "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
  "data/analysis/416_algorithm_alignment_notes.md",
  "data/analysis/416_external_reference_notes.md",
  "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_FREEZE_DISPOSITION_AND_FRESHNESS_INVALIDATIONS.json",
  "tests/unit/416_policy_and_publication_freshness.spec.ts",
  "tests/integration/416_freeze_record_and_in_place_recovery.spec.ts",
  "tests/integration/416_session_anchor_decision_and_insert_target_invalidation.spec.ts",
  "tests/integration/416_test_helpers.ts",
  "tools/analysis/validate_416_phase8_freeze_disposition_freshness.ts",
] as const;

const REQUIRED_SERVICES = [
  "AssistiveReleaseFreezeRecordService",
  "AssistiveFreezeDispositionResolver",
  "AssistivePolicyFreshnessValidator",
  "AssistivePublicationFreshnessValidator",
  "AssistiveSessionInvalidationService",
  "AssistiveRecoveryDispositionBinder",
  "AssistiveActionabilityFreezeGuard",
  "AssistiveSessionReclearanceService",
] as const;

const REQUIRED_OBJECTS = [
  "AssistiveReleaseFreezeRecord",
  "AssistiveFreezeDisposition",
  "AssistivePolicyFreshnessVerdict",
  "AssistivePublicationFreshnessVerdict",
  "AssistiveSessionInvalidationRecord",
  "AssistiveRecoveryDispositionBinding",
  "AssistiveActionabilityFreezeDecision",
  "AssistiveSessionReclearanceRecord",
  "AssistiveFreezeAuditRecord",
] as const;

const REQUIRED_MARKERS = [
  "release_freeze_record_current_truth",
  "freeze_disposition_exact_modes_only",
  "policy_freshness_tuple_match_required",
  "publication_freshness_tuple_match_required",
  "stale_session_invalidates_actionability",
  "insertion_lease_not_silently_resurrected",
  "same_shell_recovery_disposition_required",
  "actionability_freeze_guard_blocks_stale_controls",
  "provenance_preserved_when_policy_allows",
  "freeze_records_phi_safe_refs_only",
  "reclearance_requires_refresh_or_regeneration",
  "exact_blocker_detail_exposed",
] as const;

const REQUIRED_FREEZE_MODES = [
  "shadow_only",
  "read_only_provenance",
  "placeholder_only",
  "assistive_hidden",
] as const;

const REQUIRED_BLOCKED_ACTIONS = [
  "accept",
  "insert",
  "regenerate",
  "export",
  "completion_adjacent",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/assessment-criteria-assessed-section/",
  "https://digital.nhs.uk/services/clinical-safety/operational-clinical-safety-process/clinical-safety-management",
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
    packageJson.scripts?.["validate:416-phase8-freeze-disposition-freshness"] ===
      "pnpm exec tsx ./tools/analysis/validate_416_phase8_freeze_disposition_freshness.ts",
    "package.json missing validate:416-phase8-freeze-disposition-freshness script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_415_phase8_track_backend_build_drift_fairness_and_degraded_trust_monitoring_pipeline/m.test(
      checklist,
    ),
    "Checklist task 415 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_416_phase8_track_backend_build_assistive_freeze_disposition_and_policy_freshness_invalidations/m.test(
      checklist,
    ),
    "Checklist task 416 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGateAndGap();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("416 phase8 freeze disposition and freshness invalidations validated.");
}

function validateUpstreamGateAndGap(): void {
  for (const upstream of [
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/410_capability_control_plane_contract.json",
    "data/contracts/411_trust_envelope_projection_contract.json",
    "data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json",
    "data/contracts/415_monitoring_and_trust_projection_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `416 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track416 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_416",
  );
  invariant(track416, "403 registry missing par_416.");
  invariant(
    track416.readinessState === "blocked",
    "Static 403 registry is expected to still mark par_416 blocked.",
  );
  invariant(
    asArray(track416.blockingRefs, "track416.blockingRefs").includes(
      "GAP403_416_REQUIRES_CONTROL_TRUST_AND_MONITORING",
    ),
    "par_416 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>(
    "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_FREEZE_DISPOSITION_AND_FRESHNESS_INVALIDATIONS.json",
  );
  invariant(gap.taskId === "par_416", "416 gap note task id drifted.");
  requireIncludes(
    String(gap.missingSurface),
    "GAP403_416_REQUIRES_CONTROL_TRUST_AND_MONITORING",
    "416 gap note",
  );
  for (const fallbackRef of [
    "data/contracts/410_capability_control_plane_contract.json",
    "data/contracts/411_trust_envelope_projection_contract.json",
    "data/contracts/415_monitoring_and_trust_projection_contract.json",
  ]) {
    requireIncludes(String(gap.temporaryFallback), fallbackRef, "416 gap fallback");
  }
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_416", "416 gap follow-up");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_freeze/package.json",
  );
  invariant(
    packageJson.name === "@vecells/domain-assistive-freeze",
    "Assistive freeze package name drifted.",
  );
  invariant(
    packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit",
    "Assistive freeze typecheck script missing.",
  );
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-freeze"'),
    "tsconfig.base.json missing @vecells/domain-assistive-freeze path.",
  );

  const source = readText("packages/domains/assistive_freeze/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const marker of REQUIRED_MARKERS) {
    invariant(source.includes(marker), `Runtime source missing invariant marker ${marker}.`);
  }
  for (const mode of REQUIRED_FREEZE_MODES) {
    requireIncludes(source, mode, "416 runtime source freeze modes");
  }
  for (const action of REQUIRED_BLOCKED_ACTIONS) {
    requireIncludes(source, action, "416 runtime source blocked actions");
  }
  for (const requiredSnippet of [
    "createAssistiveFreezePlane",
    "stableAssistiveFreezeHash",
    "fallbackModeForTrigger",
    "resolveFreezeMode",
    "staleActionsForTrigger",
    "policy_not_fresh",
    "publication_not_fresh",
    "trust_not_fresh",
    "releaseRecoveryDispositionRef",
    "preserveProvenanceFooter",
    "previous_patch_lease_cannot_be_reused",
  ]) {
    requireIncludes(source, requiredSnippet, "416 runtime source");
  }
}

function validateRuntimeContract(): void {
  const contract = readJson<{
    taskId?: string;
    schemaVersion?: string;
    services?: JsonRecord[];
    persistedObjects?: unknown[];
    freezeDispositionPolicy?: JsonRecord;
    freshnessPolicy?: JsonRecord;
    reclearancePolicy?: JsonRecord;
    laterConsumers?: unknown[];
    invariants?: JsonRecord[];
  }>("data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json");

  invariant(contract.taskId === "par_416", "416 runtime contract task id drifted.");
  invariant(
    contract.schemaVersion === "416.freeze-disposition-and-freshness-invalidations.v1",
    "416 runtime contract schema version drifted.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) =>
      String(service.serviceName),
    ),
    REQUIRED_SERVICES,
    "416 services",
  );
  requireExactSuperset(
    asStringArray(contract.persistedObjects, "contract.persistedObjects"),
    REQUIRED_OBJECTS,
    "416 persisted objects",
  );
  requireExactSuperset(
    asStringArray(contract.freezeDispositionPolicy?.allowedModes, "allowedModes"),
    REQUIRED_FREEZE_MODES,
    "416 allowed freeze modes",
  );
  requireExactSuperset(
    asStringArray(
      contract.freezeDispositionPolicy?.writeControlsSuppressed,
      "writeControlsSuppressed",
    ),
    ["accept", "insert", "export", "completion_adjacent"],
    "416 suppressed controls",
  );
  requireIncludes(
    JSON.stringify(contract.freshnessPolicy),
    "policyTupleMembers",
    "416 freshness policy",
  );
  requireIncludes(
    JSON.stringify(contract.freshnessPolicy),
    "publicationTupleMembers",
    "416 freshness policy",
  );
  requireIncludes(
    JSON.stringify(contract.reclearancePolicy),
    "oldPatchLeaseReuse",
    "416 reclearance policy",
  );
  requireExactSuperset(
    asStringArray(contract.laterConsumers, "contract.laterConsumers"),
    ["422", "423", "424", "429", "430"],
    "416 later consumers",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) =>
      String(entry.code),
    ),
    REQUIRED_MARKERS,
    "416 invariants",
  );
}

function validateMigration(): void {
  const migration = readText(
    "services/command-api/migrations/416_phase8_freeze_disposition_and_freshness_invalidations.sql",
  );
  for (const tableName of [
    "assistive_release_freeze_record",
    "assistive_freeze_disposition",
    "assistive_policy_freshness_verdict",
    "assistive_publication_freshness_verdict",
    "assistive_session_invalidation_record",
    "assistive_recovery_disposition_binding",
    "assistive_actionability_freeze_decision",
    "assistive_session_reclearance_record",
    "assistive_freeze_audit_record",
  ]) {
    requireIncludes(migration, tableName, "416 migration");
  }
  for (const constraint of [
    "assistive_release_freeze_record_current_truth",
    "assistive_release_freeze_record_refs_only",
    "assistive_freeze_disposition_exact_modes_only",
    "assistive_freeze_disposition_blocks_stale_write_controls",
    "policy_freshness_tuple_match_required",
    "publication_freshness_tuple_match_required",
    "stale_session_invalidates_actionability",
    "invalidation_records_refs_only",
    "same_shell_recovery_disposition_required",
    "actionability_freeze_guard_blocks_stale_controls",
    "reclearance_requires_refresh_or_regeneration",
    "insertion_lease_not_silently_resurrected",
    "freeze_records_phi_safe_refs_only",
  ]) {
    requireIncludes(migration, constraint, "416 migration constraints");
  }
}

function validateDocsAndNotes(): void {
  const spec = readText(
    "docs/backend/416_phase8_freeze_disposition_and_freshness_invalidations_spec.md",
  );
  for (const serviceName of REQUIRED_SERVICES) {
    requireIncludes(spec, serviceName, "416 backend spec");
  }
  for (const phrase of [
    "Freeze Truth",
    "Freshness",
    "Recovery",
    "Reclearance",
    "PHI Boundary",
    "ReleaseRecoveryDisposition",
  ]) {
    requireIncludes(spec, phrase, "416 backend spec");
  }

  const topology = readText("docs/backend/416_phase8_freeze_and_recovery_topology.mmd");
  for (const node of [
    "415 Trust Projection",
    "AssistivePolicyFreshnessVerdict",
    "AssistivePublicationFreshnessVerdict",
    "AssistiveReleaseFreezeRecord",
    "AssistiveFreezeDisposition",
    "AssistiveSessionInvalidationRecord",
    "AssistiveRecoveryDispositionBinding",
    "AssistiveActionabilityFreezeDecision",
    "AssistiveSessionReclearanceRecord",
    "422/423/429/430 Consumers",
  ]) {
    requireIncludes(topology, node, "416 topology");
  }

  const algorithmNotes = readText("data/analysis/416_algorithm_alignment_notes.md");
  for (const phrase of [
    "blueprint/phase-8-the-assistive-layer.md",
    "validated outputs from `405`, `411`, `412`, and `415`",
    "AssistiveReleaseFreezeRecord",
    "AssistiveFreezeDisposition",
    "AssistiveActionabilityFreezeGuard",
    "explicit refresh, regeneration, or unfreeze",
    "PHI Boundary",
  ]) {
    requireIncludes(algorithmNotes, phrase, "416 algorithm notes");
  }

  const externalNotes = readText("data/analysis/416_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    requireIncludes(externalNotes, url, "416 external reference notes");
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
