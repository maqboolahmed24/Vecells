import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_control_plane/package.json",
  "packages/domains/assistive_control_plane/project.json",
  "packages/domains/assistive_control_plane/tsconfig.json",
  "packages/domains/assistive_control_plane/src/index.ts",
  "services/command-api/migrations/410_phase8_capability_control_plane.sql",
  "docs/backend/410_phase8_capability_control_plane_spec.md",
  "docs/backend/410_phase8_invocation_and_kill_switch_topology.mmd",
  "data/contracts/410_capability_control_plane_contract.json",
  "data/analysis/410_algorithm_alignment_notes.md",
  "data/analysis/410_external_reference_notes.md",
  "data/analysis/PHASE8_BATCH_404_411_INTERFACE_GAP_INVOCATION_AND_COMPOSITION.json",
  "tests/unit/410_invocation_eligibility_and_composition.spec.ts",
  "tests/integration/410_kill_switch_release_state_and_run_settlement.spec.ts",
  "tests/integration/410_per_run_grant_scope_and_expiry.spec.ts",
  "tools/analysis/validate_410_phase8_capability_control_plane.ts",
] as const;

const REQUIRED_SERVICES = [
  "AssistiveCapabilityManifestService",
  "IntendedUseProfileService",
  "InvocationEligibilityService",
  "AssistiveInvocationGrantIssuer",
  "AssistiveCompositionPolicyEngine",
  "AssistiveReleaseStateResolver",
  "AssistiveKillSwitchService",
  "AssistiveRunSettlementService",
] as const;

const REQUIRED_OBJECTS = [
  "AssistiveCapabilityManifest",
  "IntendedUseProfile",
  "AssistiveCompositionPolicy",
  "AssistiveReleaseState",
  "AssistiveKillSwitchState",
  "AssistiveInvocationGrant",
  "AssistiveRunSettlement",
  "AssistiveControlAuditRecord",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://www.gov.uk/government/publications/software-and-artificial-intelligence-ai-as-a-medical-device/software-and-artificial-intelligence-ai-as-a-medical-device",
  "https://www.gov.uk/government/publications/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd",
  "https://www.gov.uk/government/publications/impact-of-ai-on-the-regulation-of-medical-products/impact-of-ai-on-the-regulation-of-medical-products",
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
    packageJson.scripts?.["validate:410-phase8-capability-control-plane"] ===
      "pnpm exec tsx ./tools/analysis/validate_410_phase8_capability_control_plane.ts",
    "package.json missing validate:410-phase8-capability-control-plane script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_409_phase8_track_backend_build_risk_extraction_question_suggestions_and_endpoint_recommendation_orchestrator/m.test(
      checklist,
    ),
    "Checklist task 409 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_410_phase8_track_backend_build_invocation_eligibility_capability_composition_and_kill_switch_service/m.test(
      checklist,
    ),
    "Checklist task 410 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGateAndGap();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("410 phase8 capability control plane validated.");
}

function validateUpstreamGateAndGap(): void {
  for (const upstream of [
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/409_recommendation_orchestrator_contract.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, upstream)), `410 requires upstream artifact ${upstream}.`);
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track410 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find((track) => track.trackId === "par_410");
  invariant(track410, "403 registry missing par_410.");
  invariant(track410.readinessState === "blocked", "Static 403 registry is expected to still mark par_410 blocked.");
  invariant(asArray(track410.blockingRefs, "track410.blockingRefs").includes("GAP403_410_REQUIRES_404_TO_409_OBJECTS"), "par_410 blocker ref drifted.");

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    expectedOwnerTask?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_404_411_INTERFACE_GAP_INVOCATION_AND_COMPOSITION.json");
  invariant(gap.taskId === "par_410", "410 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "403 launch packet", "410 gap note");
  requireIncludes(String(gap.temporaryFallback), "data/contracts/409_recommendation_orchestrator_contract.json", "410 gap fallback");
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_410", "410 gap follow-up");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_control_plane/package.json",
  );
  invariant(packageJson.name === "@vecells/domain-assistive-control-plane", "Assistive control plane package name drifted.");
  invariant(packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit", "Assistive control plane typecheck script missing.");
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-control-plane"'),
    "tsconfig.base.json missing @vecells/domain-assistive-control-plane path.",
  );

  const source = readText("packages/domains/assistive_control_plane/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveCapabilityControlPlane",
    "stableAssistiveControlHash",
    "capability_manifest_missing",
    "intended_use_profile_missing",
    "release_state_missing",
    "kill_switch_state_missing",
    "blocked_downstream_consumer",
    "composition_loop_detected",
    "schema_validation_failed",
    "policy_validation_failed",
    "no_auto_write_policy_enforced",
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
    admissionPolicy?: JsonRecord;
    compositionPolicy?: JsonRecord;
    releaseAndKillSwitchPolicy?: JsonRecord;
    settlementPolicy?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/410_capability_control_plane_contract.json");

  invariant(contract.taskId === "par_410", "410 runtime contract task id drifted.");
  invariant(contract.schemaVersion === "410.capability-control-plane-contract.v1", "410 runtime contract schema version drifted.");
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) => String(service.serviceName)),
    REQUIRED_SERVICES,
    "410 services",
  );
  requireExactSuperset(asStringArray(contract.persistedObjects, "contract.persistedObjects"), REQUIRED_OBJECTS, "410 persisted objects");
  requireIncludes(JSON.stringify(contract.admissionPolicy), "kill-switch state", "410 admission policy");
  requireIncludes(JSON.stringify(contract.admissionPolicy), "visibilityCeiling", "410 admission policy");
  requireIncludes(JSON.stringify(contract.compositionPolicy), "EndpointDecision", "410 composition policy");
  requireIncludes(JSON.stringify(contract.releaseAndKillSwitchPolicy), "killSwitchStateIsCurrentTruth", "410 release and kill-switch policy");
  requireIncludes(JSON.stringify(contract.settlementPolicy), "renderableArtifactRefs", "410 settlement policy");
  requireIncludes(JSON.stringify(contract.settlementPolicy), "quarantined", "410 settlement policy");
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) => String(entry.invariantId)),
    ["INV410_001", "INV410_002", "INV410_003", "INV410_004", "INV410_005", "INV410_006", "INV410_007", "INV410_008"],
    "410 invariants",
  );
}

function validateMigration(): void {
  const migration = readText("services/command-api/migrations/410_phase8_capability_control_plane.sql");
  for (const table of [
    "assistive_intended_use_profile",
    "assistive_composition_policy",
    "assistive_capability_manifest",
    "assistive_release_state",
    "assistive_kill_switch_state",
    "assistive_invocation_grant",
    "assistive_run_settlement",
    "assistive_control_audit_record",
  ]) {
    invariant(migration.includes(table), `Migration missing table ${table}.`);
  }
  for (const constraint of [
    "assistive_control_profile_roles_required",
    "assistive_control_max_chain_depth_nonnegative",
    "assistive_control_manifest_contexts_required",
    "assistive_control_release_window_order",
    "assistive_control_kill_state_reason_required",
    "assistive_control_grant_expiry_order",
    "assistive_control_grant_fence_token_hashed",
    "assistive_control_quarantine_reason_required",
    "assistive_control_renderable_requires_valid_schema",
  ]) {
    invariant(migration.includes(constraint), `Migration missing constraint ${constraint}.`);
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/410_phase8_capability_control_plane_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(spec.includes(serviceName), `Backend spec missing ${serviceName}.`);
  }
  for (const requiredSnippet of [
    "per-run grant",
    "current kill-switch truth",
    "shadow_only",
    "blocked_by_policy",
    "EndpointDecision",
  ]) {
    invariant(spec.includes(requiredSnippet), `Backend spec missing ${requiredSnippet}.`);
  }

  const topology = readText("docs/backend/410_phase8_invocation_and_kill_switch_topology.mmd");
  for (const requiredSnippet of [
    "AssistiveReleaseStateResolver",
    "InvocationEligibilityService",
    "AssistiveInvocationGrantIssuer",
    "AssistiveRunSettlementService",
    "No model invocation and no EndpointDecision mutation",
  ]) {
    invariant(topology.includes(requiredSnippet), `Topology missing ${requiredSnippet}.`);
  }

  const algorithm = readText("data/analysis/410_algorithm_alignment_notes.md");
  for (const requiredSnippet of [
    "Phase 8A",
    "InvocationEligibilityService",
    "AssistiveInvocationGrant",
    "AssistiveKillSwitchState",
    "AssistiveRunSettlement",
    "Interface Gap Handling",
  ]) {
    invariant(algorithm.includes(requiredSnippet), `Algorithm notes missing ${requiredSnippet}.`);
  }

  const external = readText("data/analysis/410_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    invariant(external.includes(url), `External notes missing official reference ${url}.`);
  }
  for (const requiredSnippet of [
    "Borrowed Into 410",
    "Rejected Or Kept Out Of Scope",
    "Intended-use discipline",
    "IM1 AI deployment guidance",
    "MHRA intended-purpose guidance",
    "kill-switch state",
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

function requireExactSuperset(actual: readonly string[], required: readonly string[], label: string): void {
  for (const requiredEntry of required) {
    invariant(actual.includes(requiredEntry), `${label} missing ${requiredEntry}.`);
  }
}

function requireIncludes(value: string, needle: string, label: string): void {
  invariant(value.includes(needle), `${label} missing ${needle}.`);
}
