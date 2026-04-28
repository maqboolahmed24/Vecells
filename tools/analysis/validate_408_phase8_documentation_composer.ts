import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_documentation/package.json",
  "packages/domains/assistive_documentation/project.json",
  "packages/domains/assistive_documentation/tsconfig.json",
  "packages/domains/assistive_documentation/src/index.ts",
  "services/command-api/migrations/408_phase8_documentation_composer.sql",
  "docs/backend/408_phase8_documentation_composer_spec.md",
  "docs/backend/408_phase8_evidence_map_and_support_topology.mmd",
  "data/contracts/408_documentation_composer_contract.json",
  "data/analysis/408_algorithm_alignment_notes.md",
  "data/analysis/408_external_reference_notes.md",
  "tests/unit/408_draft_section_support_and_abstention.spec.ts",
  "tests/integration/408_documentation_context_and_evidence_map.spec.ts",
  "tests/integration/408_contradiction_and_calibration_bundle_pinning.spec.ts",
  "tools/analysis/validate_408_phase8_documentation_composer.ts",
] as const;

const REQUIRED_SERVICES = [
  "DocumentationContextSnapshotService",
  "DraftComposerOrchestrator",
  "DraftTemplateResolver",
  "DraftNoteArtifactService",
  "MessageDraftArtifactService",
  "EvidenceMapService",
  "ContradictionCheckEngine",
  "DocumentationCalibrationResolver",
] as const;

const REQUIRED_OBJECTS = [
  "DocumentationContextSnapshot",
  "DraftTemplate",
  "DocumentationCalibrationBundle",
  "EvidenceMapSet",
  "EvidenceMap",
  "ContradictionCheckResult",
  "DraftSection",
  "DraftNoteArtifact",
  "MessageDraftArtifact",
  "DocumentationPresentationArtifact",
  "DocumentationAuditRecord",
] as const;

const SUPPORTED_DRAFT_FAMILIES = [
  "triage_summary",
  "clinician_note_draft",
  "patient_message_draft",
  "callback_summary",
  "pharmacy_or_booking_handoff_summary",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/developer/assurance/process-for-apis-and-services",
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
    packageJson.scripts?.["validate:408-phase8-documentation-composer"] ===
      "pnpm exec tsx ./tools/analysis/validate_408_phase8_documentation_composer.ts",
    "package.json missing validate:408-phase8-documentation-composer script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_407_phase8_track_backend_build_audio_transcript_and_artifact_normalization_pipeline/m.test(checklist),
    "Checklist task 407 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_408_phase8_track_backend_build_summary_note_draft_and_structured_documentation_composer/m.test(checklist),
    "Checklist task 408 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGate();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("408 phase8 documentation composer validated.");
}

function validateUpstreamGate(): void {
  for (const upstream of [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/404_shadow_mode_evidence_requirements.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/406_evaluation_runtime_contract.json",
    "data/contracts/407_transcript_runtime_contract.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, upstream)), `408 requires upstream artifact ${upstream}.`);
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track408 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find((track) => track.trackId === "par_408");
  invariant(track408, "403 registry missing par_408.");
  invariant(track408.readinessState === "ready", "par_408 must be ready in 403 registry.");
  invariant(asArray(track408.blockingRefs, "track408.blockingRefs").length === 0, "par_408 must have no blockers.");

  const packet408 = readJson<{
    trackId?: string;
    readyToLaunch?: boolean;
    launchState?: string;
    ownedInterfaces?: unknown[];
  }>("data/launchpacks/403_track_launch_packet_408.json");
  invariant(packet408.trackId === "par_408", "408 launch packet track id drifted.");
  invariant(packet408.readyToLaunch === true, "408 launch packet must be ready.");
  invariant(packet408.launchState === "open_now", "408 launch packet must be open_now.");
  requireExactSuperset(asStringArray(packet408.ownedInterfaces, "packet408.ownedInterfaces"), REQUIRED_SERVICES, "408 launch packet owned interfaces");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_documentation/package.json",
  );
  invariant(packageJson.name === "@vecells/domain-assistive-documentation", "Assistive documentation package name drifted.");
  invariant(packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit", "Assistive documentation package typecheck script missing.");
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-documentation"'),
    "tsconfig.base.json missing @vecells/domain-assistive-documentation path.",
  );

  const source = readText("packages/domains/assistive_documentation/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveDocumentationComposerPlane",
    "stableDocumentationHash",
    "supportedDraftFamilies",
    "decoder_probability_forbidden",
    "raw_draft_text_forbidden",
    "validated_calibration_window_missing",
    "evidence_map_same_artifact_binding_required",
    "outbound_navigation_grant_required",
    "direct_record_writeback_forbidden",
  ]) {
    invariant(source.includes(requiredSnippet), `Runtime source missing ${requiredSnippet}.`);
  }
}

function validateRuntimeContract(): void {
  const contract = readJson<{
    taskId?: string;
    schemaVersion?: string;
    services?: JsonRecord[];
    supportedDraftFamilies?: unknown[];
    persistedObjects?: unknown[];
    supportComputation?: JsonRecord;
    calibrationPolicy?: JsonRecord;
    presentationPolicy?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/408_documentation_composer_contract.json");

  invariant(contract.taskId === "par_408", "408 runtime contract task id drifted.");
  invariant(contract.schemaVersion === "408.documentation-composer-contract.v1", "408 runtime contract schema version drifted.");
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) => String(service.serviceName)),
    REQUIRED_SERVICES,
    "408 services",
  );
  requireExactSuperset(asStringArray(contract.supportedDraftFamilies, "contract.supportedDraftFamilies"), SUPPORTED_DRAFT_FAMILIES, "408 draft families");
  requireExactSuperset(asStringArray(contract.persistedObjects, "contract.persistedObjects"), REQUIRED_OBJECTS, "408 persisted objects");
  requireIncludes(JSON.stringify(contract.supportComputation), "decoder probabilities", "408 support computation");
  requireIncludes(JSON.stringify(contract.supportComputation), "minimum evidenceCoverage over required rendered sections only", "408 support computation");
  requireIncludes(JSON.stringify(contract.calibrationPolicy), "noLocalDefaults", "408 calibration policy");
  requireIncludes(JSON.stringify(contract.calibrationPolicy), "releaseCohortRef", "408 calibration policy");
  requireIncludes(JSON.stringify(contract.presentationPolicy), "direct final-record writeback", "408 presentation policy");
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) => String(entry.invariantId)),
    ["INV408_001", "INV408_002", "INV408_003", "INV408_004", "INV408_005", "INV408_006", "INV408_007"],
    "408 invariants",
  );
}

function validateMigration(): void {
  const migration = readText("services/command-api/migrations/408_phase8_documentation_composer.sql");
  for (const table of [
    "assistive_documentation_context_snapshot",
    "assistive_documentation_template_registry",
    "assistive_documentation_calibration_bundle",
    "assistive_documentation_evidence_map_set",
    "assistive_documentation_evidence_map",
    "assistive_documentation_contradiction_check",
    "assistive_documentation_draft_section",
    "assistive_documentation_draft_note_artifact",
    "assistive_documentation_message_draft_artifact",
    "assistive_documentation_presentation_artifact",
    "assistive_documentation_audit_record",
  ]) {
    invariant(migration.includes(table), `Migration missing table ${table}.`);
  }
  for (const constraint of [
    "assistive_documentation_context_transcripts_required",
    "assistive_documentation_visible_confidence_requires_validated_window",
    "assistive_documentation_evidence_weight_bounds",
    "assistive_documentation_rendered_section_has_text_ref",
    "assistive_documentation_external_handoff_has_grant",
  ]) {
    invariant(migration.includes(constraint), `Migration missing constraint ${constraint}.`);
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/408_phase8_documentation_composer_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(spec.includes(serviceName), `Backend spec missing ${serviceName}.`);
  }
  for (const requiredSnippet of ["sectioned artifacts", "decoder probabilities", "minimumSectionSupport", "outbound navigation grant"]) {
    invariant(spec.includes(requiredSnippet), `Backend spec missing ${requiredSnippet}.`);
  }

  const topology = readText("docs/backend/408_phase8_evidence_map_and_support_topology.mmd");
  for (const requiredSnippet of ["DocumentationContextSnapshotService", "EvidenceMapService", "ContradictionCheckEngine", "DraftComposerOrchestrator"]) {
    invariant(topology.includes(requiredSnippet), `Topology missing ${requiredSnippet}.`);
  }

  const algorithm = readText("data/analysis/408_algorithm_alignment_notes.md");
  for (const requiredSnippet of ["Phase 8D", "decoder probabilities", "minimumSectionSupport", "Calibration Pinning", "407"]) {
    invariant(algorithm.includes(requiredSnippet), `Algorithm notes missing ${requiredSnippet}.`);
  }

  const external = readText("data/analysis/408_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    invariant(external.includes(url), `External notes missing official reference ${url}.`);
  }
  for (const requiredSnippet of ["Borrowed Into 408", "Rejected Or Kept Out Of Scope", "Human review", "output audit", "DCB0129", "DCB0160"]) {
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
