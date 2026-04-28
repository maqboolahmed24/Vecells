import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_trust_envelope/package.json",
  "packages/domains/assistive_trust_envelope/project.json",
  "packages/domains/assistive_trust_envelope/tsconfig.json",
  "packages/domains/assistive_trust_envelope/src/index.ts",
  "services/command-api/migrations/411_phase8_trust_envelope_projection.sql",
  "docs/backend/411_phase8_surface_binding_and_trust_envelope_spec.md",
  "docs/backend/411_phase8_surface_posture_and_recovery_topology.mmd",
  "data/contracts/411_trust_envelope_projection_contract.json",
  "data/analysis/411_algorithm_alignment_notes.md",
  "data/analysis/411_external_reference_notes.md",
  "data/analysis/PHASE8_BATCH_404_411_INTERFACE_GAP_TRUST_ENVELOPE_PROJECTION.json",
  "tests/unit/411_surface_binding_and_presentation_contract.spec.ts",
  "tests/integration/411_trust_envelope_posture_and_freeze_frame.spec.ts",
  "tests/integration/411_same_shell_recovery_and_fail_closed_projection.spec.ts",
  "tools/analysis/validate_411_phase8_trust_envelope_projection.ts",
] as const;

const REQUIRED_SERVICES = [
  "AssistiveSurfaceBindingResolver",
  "AssistivePresentationContractResolver",
  "AssistiveProvenanceEnvelopeService",
  "AssistiveConfidenceDigestService",
  "AssistiveFreezeFrameService",
  "AssistiveTrustEnvelopeProjector",
  "AssistiveSurfacePostureResolver",
] as const;

const REQUIRED_OBJECTS = [
  "AssistiveSurfaceBinding",
  "AssistivePresentationContract",
  "AssistiveProvenanceEnvelope",
  "AssistiveConfidenceDigest",
  "AssistiveFreezeFrame",
  "AssistiveCapabilityTrustEnvelope",
  "AssistiveTrustEnvelopeAuditRecord",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/developer/assurance/digital-assurance-for-apis-and-services",
  "https://digital.nhs.uk/developer/guides-and-documentation/onboarding-process",
  "https://playwright.dev/docs/aria-snapshots",
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
    packageJson.scripts?.["validate:411-phase8-trust-envelope-projection"] ===
      "pnpm exec tsx ./tools/analysis/validate_411_phase8_trust_envelope_projection.ts",
    "package.json missing validate:411-phase8-trust-envelope-projection script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_410_phase8_track_backend_build_invocation_eligibility_capability_composition_and_kill_switch_service/m.test(
      checklist,
    ),
    "Checklist task 410 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_411_phase8_track_backend_build_assistive_surface_binding_and_trust_envelope_projection/m.test(
      checklist,
    ),
    "Checklist task 411 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGateAndGap();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("411 phase8 trust envelope projection validated.");
}

function validateUpstreamGateAndGap(): void {
  for (const upstream of [
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/407_transcript_runtime_contract.json",
    "data/contracts/408_documentation_composer_contract.json",
    "data/contracts/409_recommendation_orchestrator_contract.json",
    "data/contracts/410_capability_control_plane_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `411 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track411 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_411",
  );
  invariant(track411, "403 registry missing par_411.");
  invariant(
    track411.readinessState === "blocked",
    "Static 403 registry is expected to still mark par_411 blocked.",
  );
  invariant(
    asArray(track411.blockingRefs, "track411.blockingRefs").includes(
      "GAP403_411_REQUIRES_410_CONTROL_PLANE",
    ),
    "par_411 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_404_411_INTERFACE_GAP_TRUST_ENVELOPE_PROJECTION.json");
  invariant(gap.taskId === "par_411", "411 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "403 launch packet", "411 gap note");
  requireIncludes(
    String(gap.temporaryFallback),
    "data/contracts/410_capability_control_plane_contract.json",
    "411 gap fallback",
  );
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_411", "411 gap follow-up");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_trust_envelope/package.json",
  );
  invariant(
    packageJson.name === "@vecells/domain-assistive-trust-envelope",
    "Assistive trust envelope package name drifted.",
  );
  invariant(
    packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit",
    "Assistive trust envelope typecheck script missing.",
  );
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-trust-envelope"'),
    "tsconfig.base.json missing @vecells/domain-assistive-trust-envelope path.",
  );

  const source = readText("packages/domains/assistive_trust_envelope/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveTrustEnvelopeProjectionPlane",
    "stableAssistiveTrustHash",
    "missing_trust_projection_fail_closed",
    "missing_rollout_verdict_fail_closed",
    "missing_watch_tuple_fail_closed",
    "missing_freeze_record_fail_closed",
    "publication_drift_freeze_frame_required",
    "runtime_publication_drift_freeze_frame_required",
    "selected_anchor_drift_freeze_frame_required",
    "confidence_suppressed_by_trust_posture",
    "same_shell_recovery_required",
    "browser_client_actionability_recompute_forbidden",
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
    surfaceBindingPolicy?: JsonRecord;
    posturePolicy?: JsonRecord;
    confidencePolicy?: JsonRecord;
    sameShellRecoveryPolicy?: JsonRecord;
    clientContract?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/411_trust_envelope_projection_contract.json");

  invariant(contract.taskId === "par_411", "411 runtime contract task id drifted.");
  invariant(
    contract.schemaVersion === "411.trust-envelope-projection-contract.v1",
    "411 runtime contract schema version drifted.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) =>
      String(service.serviceName),
    ),
    REQUIRED_SERVICES,
    "411 services",
  );
  requireExactSuperset(
    asStringArray(contract.persistedObjects, "contract.persistedObjects"),
    REQUIRED_OBJECTS,
    "411 persisted objects",
  );
  requireIncludes(
    JSON.stringify(contract.surfaceBindingPolicy),
    "staffOnlyVisibleSurface",
    "411 surface binding policy",
  );
  requireIncludes(
    JSON.stringify(contract.surfaceBindingPolicy),
    "WorkspaceTrustEnvelope",
    "411 surface binding policy",
  );
  requireIncludes(
    JSON.stringify(contract.posturePolicy),
    "surfacePostureState",
    "411 posture policy",
  );
  requireIncludes(JSON.stringify(contract.posturePolicy), "watch tuple", "411 posture policy");
  requireIncludes(
    JSON.stringify(contract.confidencePolicy),
    "rawScoreAsPrimaryTokenForbidden",
    "411 confidence policy",
  );
  requireIncludes(
    JSON.stringify(contract.sameShellRecoveryPolicy),
    "selected anchor drift",
    "411 same-shell recovery policy",
  );
  requireIncludes(
    JSON.stringify(contract.clientContract),
    "browser_client_actionability_recompute_forbidden",
    "411 client contract",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) =>
      String(entry.invariantId),
    ),
    [
      "INV411_001",
      "INV411_002",
      "INV411_003",
      "INV411_004",
      "INV411_005",
      "INV411_006",
      "INV411_007",
      "INV411_008",
    ],
    "411 invariants",
  );
}

function validateMigration(): void {
  const migration = readText(
    "services/command-api/migrations/411_phase8_trust_envelope_projection.sql",
  );
  for (const table of [
    "assistive_surface_binding",
    "assistive_presentation_contract",
    "assistive_provenance_envelope",
    "assistive_confidence_digest",
    "assistive_freeze_frame",
    "assistive_capability_trust_envelope",
    "assistive_trust_envelope_audit_record",
  ]) {
    invariant(migration.includes(table), `Migration missing table ${table}.`);
  }
  for (const constraint of [
    "assistive_surface_binding_same_shell_refs_required",
    "assistive_surface_binding_staff_only",
    "assistive_presentation_contract_companion_only",
    "assistive_provenance_snapshot_hash_required",
    "assistive_confidence_digest_score_bounds",
    "assistive_freeze_frame_suppresses_write_affordances",
    "assistive_trust_envelope_posture_separation",
    "assistive_trust_envelope_blocked_actions_when_not_interactive",
  ]) {
    invariant(migration.includes(constraint), `Migration missing constraint ${constraint}.`);
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/411_phase8_surface_binding_and_trust_envelope_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(spec.includes(serviceName), `Backend spec missing ${serviceName}.`);
  }
  for (const requiredSnippet of [
    "same-shell",
    "fail closed",
    "surfacePostureState",
    "actionabilityState",
    "confidencePostureState",
    "completionAdjacencyState",
    "browserClientActionabilityRecomputeForbidden",
  ]) {
    invariant(spec.includes(requiredSnippet), `Backend spec missing ${requiredSnippet}.`);
  }

  const topology = readText("docs/backend/411_phase8_surface_posture_and_recovery_topology.mmd");
  for (const requiredSnippet of [
    "AssistiveTrustEnvelopeProjector",
    "AssistiveSurfacePostureResolver",
    "AssistiveCapabilityTrustEnvelope",
    "missing_trust_projection_fail_closed",
    "No browser client actionability recompute",
  ]) {
    invariant(topology.includes(requiredSnippet), `Topology missing ${requiredSnippet}.`);
  }

  const algorithm = readText("data/analysis/411_algorithm_alignment_notes.md");
  for (const requiredSnippet of [
    "Phase 8A",
    "AssistiveSurfaceBindingResolver",
    "AssistiveConfidenceDigestService",
    "AssistiveFreezeFrameService",
    "AssistiveTrustEnvelopeProjector",
    "Interface Gap Handling",
  ]) {
    invariant(algorithm.includes(requiredSnippet), `Algorithm notes missing ${requiredSnippet}.`);
  }

  const external = readText("data/analysis/411_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    invariant(external.includes(url), `External notes missing official reference ${url}.`);
  }
  for (const requiredSnippet of [
    "Borrowed Into 411",
    "Rejected Or Kept Out Of Scope",
    "Human review",
    "Digital assurance",
    "ARIA snapshots",
    "browser-side recomputation",
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
