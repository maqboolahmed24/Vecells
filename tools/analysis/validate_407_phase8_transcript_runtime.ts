import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_transcript/package.json",
  "packages/domains/assistive_transcript/project.json",
  "packages/domains/assistive_transcript/tsconfig.json",
  "packages/domains/assistive_transcript/src/index.ts",
  "services/command-api/migrations/407_phase8_transcript_artifact_pipeline.sql",
  "docs/backend/407_phase8_transcript_and_artifact_pipeline_spec.md",
  "docs/backend/407_phase8_transcript_lineage_and_retention_topology.mmd",
  "data/contracts/407_transcript_runtime_contract.json",
  "data/analysis/407_algorithm_alignment_notes.md",
  "data/analysis/407_external_reference_notes.md",
  "tests/unit/407_permission_retention_and_redaction_logic.spec.ts",
  "tests/integration/407_transcript_job_and_derivation_immutability.spec.ts",
  "tests/integration/407_transcript_presentation_artifact_and_recovery.spec.ts",
  "tools/analysis/validate_407_phase8_transcript_runtime.ts",
] as const;

const REQUIRED_SERVICES = [
  "AudioCaptureSessionService",
  "TranscriptJobOrchestrator",
  "TranscriptNormalizationPipeline",
  "TranscriptArtifactService",
  "TranscriptRedactionService",
  "ClinicalConceptSpanExtractor",
  "RetentionEnvelopeService",
  "TranscriptPresentationArtifactService",
] as const;

const REQUIRED_OBJECTS = [
  "AudioCaptureSession",
  "TranscriptJob",
  "SpeakerSegment",
  "ClinicalConceptSpan",
  "RedactionSpan",
  "EvidenceDerivationPackage",
  "TranscriptArtifact",
  "RetentionEnvelope",
  "TranscriptPresentationArtifact",
  "TranscriptDomainEvent",
  "TranscriptAuditRecord",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
  "https://digital.nhs.uk/developer/guides-and-documentation/introduction-to-healthcare-technology/clinical-safety",
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
    packageJson.scripts?.["validate:407-phase8-transcript-runtime"] ===
      "pnpm exec tsx ./tools/analysis/validate_407_phase8_transcript_runtime.ts",
    "package.json missing validate:407-phase8-transcript-runtime script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_406_phase8_track_backend_build_evaluation_corpus_label_store_replay_harness_and_shadow_dataset/m.test(
      checklist,
    ),
    "Checklist task 406 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_407_phase8_track_backend_build_audio_transcript_and_artifact_normalization_pipeline/m.test(
      checklist,
    ),
    "Checklist task 407 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGate();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("407 phase8 transcript runtime validated.");
}

function validateUpstreamGate(): void {
  for (const upstream of [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/404_shadow_mode_evidence_requirements.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/406_evaluation_runtime_contract.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, upstream)), `407 requires upstream artifact ${upstream}.`);
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track407 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find((track) => track.trackId === "par_407");
  invariant(track407, "403 registry missing par_407.");
  invariant(track407.readinessState === "ready", "par_407 must be ready in 403 registry.");
  invariant(asArray(track407.blockingRefs, "track407.blockingRefs").length === 0, "par_407 must have no blockers.");

  const packet407 = readJson<{
    trackId?: string;
    readyToLaunch?: boolean;
    launchState?: string;
    ownedInterfaces?: unknown[];
  }>("data/launchpacks/403_track_launch_packet_407.json");
  invariant(packet407.trackId === "par_407", "407 launch packet track id drifted.");
  invariant(packet407.readyToLaunch === true, "407 launch packet must be ready.");
  invariant(packet407.launchState === "open_now", "407 launch packet must be open_now.");
  requireExactSuperset(asStringArray(packet407.ownedInterfaces, "packet407.ownedInterfaces"), REQUIRED_SERVICES, "407 launch packet owned interfaces");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_transcript/package.json",
  );
  invariant(packageJson.name === "@vecells/domain-assistive-transcript", "Assistive transcript package name drifted.");
  invariant(packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit", "Assistive transcript package typecheck script missing.");
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-transcript"'),
    "tsconfig.base.json missing @vecells/domain-assistive-transcript path.",
  );

  const source = readText("packages/domains/assistive_transcript/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveTranscriptPlane",
    "stableTranscriptHash",
    "automatic_ambient_disabled_for_first_release",
    "quarantine_not_cleared",
    "raw_transcript_text_forbidden",
    "raw_blob_url_forbidden",
    "assistive.transcript.ready",
    "assistive.context.snapshot.created",
  ]) {
    invariant(source.includes(requiredSnippet), `Runtime source missing ${requiredSnippet}.`);
  }
}

function validateRuntimeContract(): void {
  const contract = readJson<{
    taskId?: string;
    schemaVersion?: string;
    services?: JsonRecord[];
    supportedInputOrder?: unknown[];
    persistedObjects?: unknown[];
    permissionAndCapturePolicy?: JsonRecord;
    derivationPolicy?: JsonRecord;
    retentionPolicy?: JsonRecord;
    presentationPolicy?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/407_transcript_runtime_contract.json");

  invariant(contract.taskId === "par_407", "407 runtime contract task id drifted.");
  invariant(contract.schemaVersion === "407.transcript-runtime-contract.v1", "407 runtime contract schema version drifted.");
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) => String(service.serviceName)),
    REQUIRED_SERVICES,
    "407 services",
  );
  requireExactSuperset(asStringArray(contract.persistedObjects, "contract.persistedObjects"), REQUIRED_OBJECTS, "407 persisted objects");
  requireExactSuperset(
    asStringArray(contract.supportedInputOrder, "contract.supportedInputOrder"),
    ["telephony_recording", "uploaded_audio_artifact", "clinician_dictation_clip", "live_ambient_capture_policy_gated"],
    "407 supported input order",
  );
  requireIncludes(JSON.stringify(contract.permissionAndCapturePolicy), "quarantineFirst", "407 permission policy");
  requireIncludes(JSON.stringify(contract.permissionAndCapturePolicy), "automaticAmbientCapture", "407 permission policy");
  requireIncludes(JSON.stringify(contract.derivationPolicy), "append_new_derivation_package", "407 derivation policy");
  requireIncludes(JSON.stringify(contract.retentionPolicy), "legalHoldRef", "407 retention policy");
  requireIncludes(JSON.stringify(contract.presentationPolicy), "raw blob URL", "407 presentation policy");
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) => String(entry.invariantId)),
    ["INV407_001", "INV407_002", "INV407_003", "INV407_004", "INV407_005", "INV407_006", "INV407_007"],
    "407 invariants",
  );
}

function validateMigration(): void {
  const migration = readText("services/command-api/migrations/407_phase8_transcript_artifact_pipeline.sql");
  for (const table of [
    "assistive_transcript_audio_capture_session",
    "assistive_transcript_retention_envelope",
    "assistive_transcript_job",
    "assistive_transcript_speaker_segment",
    "assistive_transcript_derivation_package",
    "assistive_transcript_artifact",
    "assistive_transcript_clinical_concept_span",
    "assistive_transcript_redaction_span",
    "assistive_transcript_presentation_artifact",
    "assistive_transcript_domain_event",
    "assistive_transcript_audit_record",
  ]) {
    invariant(migration.includes(table), `Migration missing table ${table}.`);
  }
  for (const constraint of [
    "assistive_transcript_ambient_manual_start",
    "assistive_transcript_automatic_ambient_disabled",
    "assistive_transcript_segment_order",
    "assistive_transcript_redaction_span_order",
    "assistive_transcript_external_handoff_has_grant",
  ]) {
    invariant(migration.includes(constraint), `Migration missing constraint ${constraint}.`);
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/407_phase8_transcript_and_artifact_pipeline_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(spec.includes(serviceName), `Backend spec missing ${serviceName}.`);
  }
  for (const requiredSnippet of ["quarantined", "manual-start", "retention", "raw blob URLs", "assistive.transcript.ready"]) {
    invariant(spec.includes(requiredSnippet), `Backend spec missing ${requiredSnippet}.`);
  }

  const topology = readText("docs/backend/407_phase8_transcript_lineage_and_retention_topology.mmd");
  for (const requiredSnippet of ["AudioCaptureSessionService", "TranscriptJobOrchestrator", "EvidenceDerivationPackage", "TranscriptPresentationArtifactService"]) {
    invariant(topology.includes(requiredSnippet), `Topology missing ${requiredSnippet}.`);
  }

  const algorithm = readText("data/analysis/407_algorithm_alignment_notes.md");
  for (const requiredSnippet of ["Phase 8C", "406", "quarantine", "immutable", "retention", "raw text"]) {
    invariant(algorithm.includes(requiredSnippet), `Algorithm notes missing ${requiredSnippet}.`);
  }

  const external = readText("data/analysis/407_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    invariant(external.includes(url), `External notes missing official reference ${url}.`);
  }
  for (const requiredSnippet of ["Borrowed Into 407", "Rejected Or Kept Out Of Scope", "accents", "objections", "retention"]) {
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
