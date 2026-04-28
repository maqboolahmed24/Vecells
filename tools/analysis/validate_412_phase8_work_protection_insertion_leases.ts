import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_work_protection/package.json",
  "packages/domains/assistive_work_protection/project.json",
  "packages/domains/assistive_work_protection/tsconfig.json",
  "packages/domains/assistive_work_protection/src/index.ts",
  "services/command-api/migrations/412_phase8_work_protection_and_insertion_leases.sql",
  "docs/backend/412_phase8_work_protection_and_insertion_lease_spec.md",
  "docs/backend/412_phase8_session_and_patch_lease_topology.mmd",
  "data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json",
  "data/analysis/412_algorithm_alignment_notes.md",
  "data/analysis/412_external_reference_notes.md",
  "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_WORK_PROTECTION_AND_INSERTION_LEASES.json",
  "tests/unit/412_session_fence_and_slot_validation.spec.ts",
  "tests/integration/412_patch_lease_and_work_protection_buffering.spec.ts",
  "tests/integration/412_stale_anchor_publication_and_review_version_invalidation.spec.ts",
  "tools/analysis/validate_412_phase8_work_protection_insertion_leases.ts",
] as const;

const REQUIRED_SERVICES = [
  "AssistiveSessionService",
  "AssistiveSessionFenceValidator",
  "AssistiveDraftInsertionPointService",
  "AssistiveDraftPatchLeaseIssuer",
  "AssistiveDraftPatchLeaseValidator",
  "AssistiveWorkProtectionLeaseService",
  "AssistiveDeferredDeltaBuffer",
  "AssistiveQuietReturnTargetResolver",
] as const;

const REQUIRED_OBJECTS = [
  "AssistiveSession",
  "AssistiveDraftInsertionPoint",
  "AssistiveDraftPatchLease",
  "AssistiveWorkProtectionLease",
  "AssistiveDeferredDelta",
  "AssistiveQuietReturnTarget",
  "AssistiveWorkProtectionAuditRecord",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://www.digitalregulations.innovation.nhs.uk/regulations-and-guidance-for-developers/all-developers-guidance/using-the-digital-technology-assessment-criteria-dtac/",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
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
    packageJson.scripts?.["validate:412-phase8-work-protection-insertion-leases"] ===
      "pnpm exec tsx ./tools/analysis/validate_412_phase8_work_protection_insertion_leases.ts",
    "package.json missing validate:412-phase8-work-protection-insertion-leases script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_411_phase8_track_backend_build_assistive_surface_binding_and_trust_envelope_projection/m.test(
      checklist,
    ),
    "Checklist task 411 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_412_phase8_track_backend_build_assistive_work_protection_and_suggestion_draft_insertion_leases/m.test(
      checklist,
    ),
    "Checklist task 412 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGateAndGap();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("412 phase8 work protection and insertion leases validated.");
}

function validateUpstreamGateAndGap(): void {
  for (const upstream of [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/409_recommendation_orchestrator_contract.json",
    "data/contracts/410_capability_control_plane_contract.json",
    "data/contracts/411_trust_envelope_projection_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `412 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track412 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_412",
  );
  invariant(track412, "403 registry missing par_412.");
  invariant(
    track412.readinessState === "blocked",
    "Static 403 registry is expected to still mark par_412 blocked.",
  );
  invariant(
    asArray(track412.blockingRefs, "track412.blockingRefs").includes(
      "GAP403_412_REQUIRES_409_AND_411",
    ),
    "par_412 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_WORK_PROTECTION_AND_INSERTION_LEASES.json");
  invariant(gap.taskId === "par_412", "412 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "403 launch packet", "412 gap note");
  requireIncludes(
    String(gap.temporaryFallback),
    "data/contracts/411_trust_envelope_projection_contract.json",
    "412 gap fallback",
  );
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_412", "412 gap follow-up");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_work_protection/package.json",
  );
  invariant(
    packageJson.name === "@vecells/domain-assistive-work-protection",
    "Assistive work protection package name drifted.",
  );
  invariant(
    packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit",
    "Assistive work protection typecheck script missing.",
  );
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-work-protection"'),
    "tsconfig.base.json missing @vecells/domain-assistive-work-protection path.",
  );

  const source = readText("packages/domains/assistive_work_protection/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveWorkProtectionPlane",
    "stableAssistiveWorkProtectionHash",
    "session_fence_token_required",
    "selected_anchor_drift_regenerate_required",
    "review_version_drift_regenerate_required",
    "publication_drift_regenerate_required",
    "trust_envelope_actionability_required",
    "insertion_point_slot_hash_required",
    "draft_patch_lease_requires_live_insertion_point",
    "patch_lease_drift_invalidated",
    "work_protection_buffers_disruptive_delta",
    "same_shell_quiet_return_required",
    "browser_local_insert_legality_forbidden",
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
    sessionFencePolicy?: JsonRecord;
    insertionPolicy?: JsonRecord;
    workProtectionPolicy?: JsonRecord;
    clientContract?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json");

  invariant(contract.taskId === "par_412", "412 runtime contract task id drifted.");
  invariant(
    contract.schemaVersion === "412.assistive-work-protection-and-insertion-leases.v1",
    "412 runtime contract schema version drifted.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) =>
      String(service.serviceName),
    ),
    REQUIRED_SERVICES,
    "412 services",
  );
  requireExactSuperset(
    asStringArray(contract.persistedObjects, "contract.persistedObjects"),
    REQUIRED_OBJECTS,
    "412 persisted objects",
  );
  requireIncludes(
    JSON.stringify(contract.sessionFencePolicy),
    "ReviewActionLease",
    "412 session fence policy",
  );
  requireIncludes(
    JSON.stringify(contract.sessionFencePolicy),
    "trust_envelope_actionability_required",
    "412 session fence policy",
  );
  requireIncludes(
    JSON.stringify(contract.insertionPolicy),
    "slotHashRequired",
    "412 insertion policy",
  );
  requireIncludes(JSON.stringify(contract.insertionPolicy), "note_section", "412 insertion policy");
  requireIncludes(
    JSON.stringify(contract.workProtectionPolicy),
    "buffersDisruptiveDeltas",
    "412 work protection policy",
  );
  requireIncludes(
    JSON.stringify(contract.workProtectionPolicy),
    "quietReturnTargetRequired",
    "412 work protection policy",
  );
  requireIncludes(
    JSON.stringify(contract.clientContract),
    "browser_local_insert_legality_forbidden",
    "412 client contract",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) =>
      String(entry.invariantId),
    ),
    [
      "INV412_001",
      "INV412_002",
      "INV412_003",
      "INV412_004",
      "INV412_005",
      "INV412_006",
      "INV412_007",
      "INV412_008",
    ],
    "412 invariants",
  );
}

function validateMigration(): void {
  const migration = readText(
    "services/command-api/migrations/412_phase8_work_protection_and_insertion_leases.sql",
  );
  for (const table of [
    "assistive_session",
    "assistive_draft_insertion_point",
    "assistive_draft_patch_lease",
    "assistive_work_protection_lease",
    "assistive_deferred_delta",
    "assistive_quiet_return_target",
    "assistive_work_protection_audit_record",
  ]) {
    invariant(migration.includes(table), `Migration missing table ${table}.`);
  }
  for (const constraint of [
    "assistive_session_same_shell_refs_required",
    "assistive_session_fence_token_hashed",
    "assistive_session_insert_posture_separated",
    "assistive_insertion_point_slot_hash_required",
    "assistive_insertion_point_content_class_bounded",
    "assistive_patch_lease_expiry_order",
    "assistive_work_protection_same_shell_required",
    "assistive_deferred_delta_hash_required",
    "assistive_quiet_return_target_same_shell_required",
  ]) {
    invariant(migration.includes(constraint), `Migration missing constraint ${constraint}.`);
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/412_phase8_work_protection_and_insertion_lease_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(spec.includes(serviceName), `Backend spec missing ${serviceName}.`);
  }
  for (const requiredSnippet of [
    "browser-local insert legality is forbidden",
    "review_version_drift_regenerate_required",
    "selected_anchor_drift_regenerate_required",
    "slotHash",
    "note_section",
    "work_protection_buffers_disruptive_delta",
    "quiet-return target",
  ]) {
    invariant(spec.includes(requiredSnippet), `Backend spec missing ${requiredSnippet}.`);
  }

  const topology = readText("docs/backend/412_phase8_session_and_patch_lease_topology.mmd");
  for (const requiredSnippet of [
    "AssistiveSessionFenceValidator",
    "AssistiveDraftPatchLeaseValidator",
    "AssistiveWorkProtectionLease",
    "patch_lease_drift_invalidated",
    "browser_local_insert_legality_forbidden",
  ]) {
    invariant(topology.includes(requiredSnippet), `Topology missing ${requiredSnippet}.`);
  }

  const algorithm = readText("data/analysis/412_algorithm_alignment_notes.md");
  for (const requiredSnippet of [
    "8F",
    "AssistiveSessionService",
    "AssistiveSessionFenceValidator",
    "AssistiveDraftPatchLeaseIssuer",
    "AssistiveWorkProtectionLeaseService",
    "Interface Gap Handling",
  ]) {
    invariant(algorithm.includes(requiredSnippet), `Algorithm notes missing ${requiredSnippet}.`);
  }

  const external = readText("data/analysis/412_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    invariant(external.includes(url), `External notes missing official reference ${url}.`);
  }
  for (const requiredSnippet of [
    "Borrowed Into 412",
    "Rejected Or Kept Out Of Scope",
    "human-reviewed outputs",
    "local session fences",
    "DTAC posture",
    "browser-side insert legality",
  ]) {
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

function requireExactSuperset(
  actual: readonly string[],
  required: readonly string[],
  label: string,
): void {
  for (const requiredEntry of required) {
    invariant(actual.includes(requiredEntry), `${label} missing ${requiredEntry}.`);
  }
}

function requireIncludes(value: string, needle: string, label: string): void {
  invariant(value.includes(needle), `${label} missing ${needle}.`);
}
