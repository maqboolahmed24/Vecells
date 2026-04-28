import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_suggestion/package.json",
  "packages/domains/assistive_suggestion/project.json",
  "packages/domains/assistive_suggestion/tsconfig.json",
  "packages/domains/assistive_suggestion/src/index.ts",
  "services/command-api/migrations/409_phase8_recommendation_orchestrator.sql",
  "docs/backend/409_phase8_recommendation_orchestrator_spec.md",
  "docs/backend/409_phase8_allowed_set_uncertainty_and_settlement_topology.mmd",
  "data/contracts/409_recommendation_orchestrator_contract.json",
  "data/analysis/409_algorithm_alignment_notes.md",
  "data/analysis/409_external_reference_notes.md",
  "tests/unit/409_rule_guard_and_abstention_logic.spec.ts",
  "tests/integration/409_suggestion_envelope_and_prediction_set.spec.ts",
  "tests/integration/409_insert_draft_settlement_and_recovery.spec.ts",
  "tools/analysis/validate_409_phase8_recommendation_orchestrator.ts",
] as const;

const REQUIRED_SERVICES = [
  "SuggestionEnvelopeService",
  "RuleGuardEngine",
  "RiskSignalExtractor",
  "QuestionRecommendationService",
  "EndpointHypothesisRanker",
  "ConformalPredictionSetService",
  "AbstentionService",
  "SuggestionActionService",
  "SuggestionPresentationArtifactService",
] as const;

const REQUIRED_OBJECTS = [
  "SuggestionCalibrationBundle",
  "SuggestionEnvelope",
  "RiskSignal",
  "EndpointHypothesis",
  "QuestionSetRecommendation",
  "ConformalPredictionSet",
  "AbstentionRecord",
  "RuleGuardResult",
  "SuggestionDraftInsertionLease",
  "SuggestionSurfaceBinding",
  "SuggestionActionRecord",
  "SuggestionActionSettlement",
  "SuggestionPresentationArtifact",
  "SuggestionAuditRecord",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/developer/assurance/process-for-apis-and-services",
  "https://www.gov.uk/government/publications/software-and-artificial-intelligence-ai-as-a-medical-device/software-and-artificial-intelligence-ai-as-a-medical-device",
  "https://www.gov.uk/government/publications/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd",
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
    packageJson.scripts?.["validate:409-phase8-recommendation-orchestrator"] ===
      "pnpm exec tsx ./tools/analysis/validate_409_phase8_recommendation_orchestrator.ts",
    "package.json missing validate:409-phase8-recommendation-orchestrator script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_408_phase8_track_backend_build_summary_note_draft_and_structured_documentation_composer/m.test(checklist),
    "Checklist task 408 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_409_phase8_track_backend_build_risk_extraction_question_suggestions_and_endpoint_recommendation_orchestrator/m.test(
      checklist,
    ),
    "Checklist task 409 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGate();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("409 phase8 recommendation orchestrator validated.");
}

function validateUpstreamGate(): void {
  for (const upstream of [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/406_evaluation_runtime_contract.json",
    "data/contracts/408_documentation_composer_contract.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, upstream)), `409 requires upstream artifact ${upstream}.`);
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track409 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find((track) => track.trackId === "par_409");
  invariant(track409, "403 registry missing par_409.");
  invariant(track409.readinessState === "ready", "par_409 must be ready in 403 registry.");
  invariant(asArray(track409.blockingRefs, "track409.blockingRefs").length === 0, "par_409 must have no blockers.");

  const packet409 = readJson<{
    trackId?: string;
    readyToLaunch?: boolean;
    launchState?: string;
    ownedInterfaces?: unknown[];
  }>("data/launchpacks/403_track_launch_packet_409.json");
  invariant(packet409.trackId === "par_409", "409 launch packet track id drifted.");
  invariant(packet409.readyToLaunch === true, "409 launch packet must be ready.");
  invariant(packet409.launchState === "open_now", "409 launch packet must be open_now.");
  requireExactSuperset(asStringArray(packet409.ownedInterfaces, "packet409.ownedInterfaces"), REQUIRED_SERVICES, "409 launch packet owned interfaces");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_suggestion/package.json",
  );
  invariant(packageJson.name === "@vecells/domain-assistive-suggestion", "Assistive suggestion package name drifted.");
  invariant(packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit", "Assistive suggestion package typecheck script missing.");
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-suggestion"'),
    "tsconfig.base.json missing @vecells/domain-assistive-suggestion path.",
  );

  const source = readText("packages/domains/assistive_suggestion/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveSuggestionOrchestratorPlane",
    "stableSuggestionHash",
    "full_space_calibration_required",
    "allowed_set_mass_below_floor",
    "epistemic_uncertainty_blocked",
    "conformal_allowed_intersection_empty",
    "suggestion_draft_insertion_lease_required",
    "endpoint_decision_mutation_forbidden",
    "outbound_navigation_grant_required",
    "raw_artifact_url_forbidden",
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
    pipelinePolicy?: JsonRecord;
    calibrationPolicy?: JsonRecord;
    abstentionPolicy?: JsonRecord;
    actionPolicy?: JsonRecord;
    presentationPolicy?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/409_recommendation_orchestrator_contract.json");

  invariant(contract.taskId === "par_409", "409 runtime contract task id drifted.");
  invariant(contract.schemaVersion === "409.recommendation-orchestrator-contract.v1", "409 runtime contract schema version drifted.");
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) => String(service.serviceName)),
    REQUIRED_SERVICES,
    "409 services",
  );
  requireExactSuperset(asStringArray(contract.persistedObjects, "contract.persistedObjects"), REQUIRED_OBJECTS, "409 persisted objects");
  requireIncludes(JSON.stringify(contract.pipelinePolicy), "full_space_calibration", "409 pipeline policy");
  requireIncludes(JSON.stringify(contract.pipelinePolicy), "endpoint decision mutation", "409 pipeline policy");
  requireIncludes(JSON.stringify(contract.calibrationPolicy), "noLocalDefaults", "409 calibration policy");
  requireIncludes(JSON.stringify(contract.calibrationPolicy), "watchTupleRef", "409 calibration policy");
  requireIncludes(JSON.stringify(contract.abstentionPolicy), "allowed-set mass below gamma floor", "409 abstention policy");
  requireIncludes(JSON.stringify(contract.actionPolicy), "RouteIntentBinding", "409 action policy");
  requireIncludes(JSON.stringify(contract.presentationPolicy), "rawArtifactUrlForbidden", "409 presentation policy");
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) => String(entry.invariantId)),
    ["INV409_001", "INV409_002", "INV409_003", "INV409_004", "INV409_005", "INV409_006", "INV409_007", "INV409_008"],
    "409 invariants",
  );
}

function validateMigration(): void {
  const migration = readText("services/command-api/migrations/409_phase8_recommendation_orchestrator.sql");
  for (const table of [
    "assistive_suggestion_calibration_bundle",
    "assistive_suggestion_rule_guard_result",
    "assistive_suggestion_risk_signal",
    "assistive_suggestion_question_recommendation",
    "assistive_suggestion_endpoint_hypothesis",
    "assistive_suggestion_conformal_prediction_set",
    "assistive_suggestion_surface_binding",
    "assistive_suggestion_envelope",
    "assistive_suggestion_abstention_record",
    "assistive_suggestion_draft_insertion_lease",
    "assistive_suggestion_action_record",
    "assistive_suggestion_action_settlement",
    "assistive_suggestion_presentation_artifact",
    "assistive_suggestion_audit_record",
  ]) {
    invariant(migration.includes(table), `Migration missing table ${table}.`);
  }
  for (const constraint of [
    "assistive_suggestion_full_space_required",
    "assistive_suggestion_calibration_probability_bounds",
    "assistive_suggestion_allowed_set_hash_required",
    "assistive_suggestion_envelope_score_bounds",
    "assistive_suggestion_top_only_when_not_full_abstain",
    "assistive_suggestion_insert_only_when_not_abstained",
    "assistive_suggestion_lease_expiry_order",
    "assistive_suggestion_insert_action_requires_lease",
    "assistive_suggestion_external_handoff_has_grant",
  ]) {
    invariant(migration.includes(constraint), `Migration missing constraint ${constraint}.`);
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/409_phase8_recommendation_orchestrator_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(spec.includes(serviceName), `Backend spec missing ${serviceName}.`);
  }
  for (const requiredSnippet of [
    "full-space calibrated probability",
    "allowed-set mass",
    "AbstentionRecord",
    "SuggestionDraftInsertionLease",
    "ArtifactPresentationContract",
  ]) {
    invariant(spec.includes(requiredSnippet), `Backend spec missing ${requiredSnippet}.`);
  }

  const topology = readText("docs/backend/409_phase8_allowed_set_uncertainty_and_settlement_topology.mmd");
  for (const requiredSnippet of [
    "RuleGuardEngine",
    "ConformalPredictionSetService",
    "SuggestionEnvelopeService",
    "SuggestionActionSettlement",
    "No EndpointDecision mutation",
  ]) {
    invariant(topology.includes(requiredSnippet), `Topology missing ${requiredSnippet}.`);
  }

  const algorithm = readText("data/analysis/409_algorithm_alignment_notes.md");
  for (const requiredSnippet of [
    "Phase 8E",
    "full-space calibrated probabilities",
    "allowed-set mass",
    "AbstentionRecord",
    "SuggestionDraftInsertionLease",
    "EndpointDecision",
    "408",
  ]) {
    invariant(algorithm.includes(requiredSnippet), `Algorithm notes missing ${requiredSnippet}.`);
  }

  const external = readText("data/analysis/409_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    invariant(external.includes(url), `External notes missing official reference ${url}.`);
  }
  for (const requiredSnippet of [
    "Borrowed Into 409",
    "Rejected Or Kept Out Of Scope",
    "Human oversight",
    "Clinical-decision support boundaries",
    "Intended purpose",
    "Software and AI medical device",
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
