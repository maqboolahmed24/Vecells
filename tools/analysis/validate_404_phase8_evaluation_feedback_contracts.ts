import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "docs/contracts/404_phase8_evaluation_shadow_feedback_contract.md",
  "docs/contracts/404_phase8_evaluation_shadow_feedback_state_topology.mmd",
  "data/contracts/404_assistive_evaluation_contracts.json",
  "data/contracts/404_feedback_eligibility_contracts.json",
  "data/contracts/404_shadow_mode_evidence_requirements.json",
  "data/analysis/404_algorithm_alignment_notes.md",
  "data/analysis/404_external_reference_notes.md",
  "data/analysis/404_dependency_and_gap_register.json",
  "tools/analysis/validate_404_phase8_evaluation_feedback_contracts.ts",
] as const;

const REQUIRED_OBJECTS = [
  "CaseReplayBundle",
  "GroundTruthLabel",
  "ErrorTaxonomyRecord",
  "PromptTemplateVersion",
  "ModelRegistryEntry",
  "FeatureSnapshot",
  "AssistiveEvaluationSurfaceBinding",
  "EvaluationExportArtifact",
  "DatasetPartitionManifest",
  "ShadowEvidenceCompletenessRecord",
] as const;

const REQUIRED_REPLAY_FIELDS = [
  "requestRef",
  "taskRef",
  "evidenceSnapshotRefs",
  "expectedOutputsRef",
  "featureSnapshotRefs",
  "promptTemplateVersionRef",
  "modelRegistryEntryRef",
  "datasetPartition",
  "sensitivityTag",
  "surfaceRouteContractRef",
  "surfacePublicationRef",
  "runtimePublicationBundleRef",
  "telemetryDisclosureFenceRef",
] as const;

const REQUIRED_FEEDBACK_EXCLUSIONS = [
  "policy_exception_override",
  "dual_review_required",
  "high_risk_case",
  "incident_linked_case",
  "regenerate_only_flow",
  "stale_recovery_action",
  "incomplete_counterfactual_completeness",
  "final_human_artifact_supersession",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/publication/guidance-on-the-use-of-ai-enabled-ambient-scribing-products/",
  "https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
  "https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards",
  "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
  "https://www.gov.uk/government/publications/software-and-artificial-intelligence-ai-as-a-medical-device/software-and-artificial-intelligence-ai-as-a-medical-device",
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
    packageJson.scripts?.["validate:404-phase8-evaluation-feedback-contracts"] ===
      "pnpm exec tsx ./tools/analysis/validate_404_phase8_evaluation_feedback_contracts.ts",
    "package.json missing validate:404-phase8-evaluation-feedback-contracts script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(/^- \[X\] par_403_phase8_track_gate_freeze_assistive_capability_boundaries_policy_envelope_and_human_control_rules/m.test(checklist), "Checklist task 403 must be complete.");
  invariant(
    /^- \[(?:-|X)\] par_404_phase8_track_gate_freeze_evaluation_corpus_shadow_mode_and_feedback_eligibility_contracts/m.test(
      checklist,
    ),
    "Checklist task 404 must be claimed or complete while this validator runs.",
  );

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track404 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find((track) => track.trackId === "par_404");
  invariant(track404, "403 registry missing par_404.");
  invariant(track404.readinessState === "ready", "par_404 must be ready in 403 registry.");
  invariant(asArray(track404.blockingRefs, "track404.blockingRefs").length === 0, "par_404 must have no blockers.");

  const packet404 = readJson<{
    trackId?: string;
    readyToLaunch?: boolean;
    launchState?: string;
  }>("data/launchpacks/403_track_launch_packet_404.json");
  invariant(packet404.trackId === "par_404", "404 launch packet track id drifted.");
  invariant(packet404.readyToLaunch === true, "404 launch packet must be ready.");
  invariant(packet404.launchState === "open_now", "404 launch packet must be open_now.");

  validateEvaluationContract();
  validateFeedbackContract();
  validateShadowContract();
  validateDocsAndNotes();

  console.log("404 phase8 evaluation, shadow, and feedback contracts validated.");
}

function validateEvaluationContract(): void {
  const evaluation = readJson<{
    taskId?: string;
    schemaVersion?: string;
    sourceLaunchVerdict?: string;
    datasetPartitions?: JsonRecord[];
    objectContracts?: JsonRecord[];
    invariants?: JsonRecord[];
    downstreamConsumers?: unknown[];
  }>("data/contracts/404_assistive_evaluation_contracts.json");

  invariant(evaluation.taskId === "par_404", "Evaluation contract task id drifted.");
  invariant(evaluation.schemaVersion === "404.assistive-evaluation-contracts.v1", "Evaluation schema version drifted.");
  invariant(evaluation.sourceLaunchVerdict === "open_phase8_now", "Evaluation contract must inherit open Phase 8 verdict.");

  const partitions = asArray<JsonRecord>(evaluation.datasetPartitions, "evaluation.datasetPartitions");
  requireExactSet(partitions.map((partition) => String(partition.partitionId)), ["gold", "shadow_live", "feedback"], "dataset partitions");

  const gold = requiredByKey(partitions, "partitionId", "gold", "gold partition");
  invariant(gold.mutability === "immutable_after_publication", "Gold partition must be immutable after publication.");
  invariant(gold.trainingUse === "forbidden_as_default_tuning_bucket", "Gold partition must not be a casual tuning bucket.");

  const feedbackPartition = requiredByKey(partitions, "partitionId", "feedback", "feedback partition");
  invariant(
    String(feedbackPartition.trainingUse).includes("feedback_eligibility_flag_state_eligible"),
    "Feedback partition must require eligible FeedbackEligibilityFlag.",
  );

  const contracts = asArray<JsonRecord>(evaluation.objectContracts, "evaluation.objectContracts");
  requireExactSuperset(
    contracts.map((contract) => String(contract.objectName)),
    [...REQUIRED_OBJECTS],
    "evaluation object contracts",
  );

  const replay = requiredByKey(contracts, "objectName", "CaseReplayBundle", "CaseReplayBundle");
  requireExactSuperset(asStringArray(replay.requiredFields, "CaseReplayBundle.requiredFields"), [...REQUIRED_REPLAY_FIELDS], "CaseReplayBundle fields");
  requireIncludes(asStringArray(replay.states, "CaseReplayBundle.states"), "frozen", "CaseReplayBundle states");
  requireIncludes(JSON.stringify(replay.dependencyRules), "mutable current task state", "CaseReplayBundle dependency rules");

  const label = requiredByKey(contracts, "objectName", "GroundTruthLabel", "GroundTruthLabel");
  requireIncludes(asStringArray(label.requiredFields, "GroundTruthLabel.requiredFields"), "annotatorRole", "GroundTruthLabel fields");
  requireIncludes(JSON.stringify(label.dependencyRules), "not final truth", "GroundTruthLabel dependency rules");

  const adjudication = requiredByKey(contracts, "objectName", "LabelAdjudicationRecord", "LabelAdjudicationRecord");
  requireIncludes(asStringArray(adjudication.states, "LabelAdjudicationRecord.states"), "adjudicated", "LabelAdjudicationRecord states");

  const exportArtifact = requiredByKey(contracts, "objectName", "EvaluationExportArtifact", "EvaluationExportArtifact");
  requireIncludes(asStringArray(exportArtifact.requiredFields, "EvaluationExportArtifact.requiredFields"), "artifactPresentationContractRef", "EvaluationExportArtifact fields");
  requireIncludes(asStringArray(exportArtifact.requiredFields, "EvaluationExportArtifact.requiredFields"), "outboundNavigationGrantPolicyRef", "EvaluationExportArtifact fields");
  requireIncludes(JSON.stringify(exportArtifact.dependencyRules), "PHI-bearing CSV", "EvaluationExportArtifact dependency rules");

  const invariantIds = asArray<JsonRecord>(evaluation.invariants, "evaluation.invariants").map((invariantRow) =>
    String(invariantRow.invariantId),
  );
  requireExactSuperset(
    invariantIds,
    ["INV404_001", "INV404_002", "INV404_003", "INV404_004", "INV404_005", "INV404_006", "INV404_007"],
    "evaluation invariants",
  );
  requireExactSuperset(
    asStringArray(evaluation.downstreamConsumers, "evaluation.downstreamConsumers"),
    ["par_406", "par_408", "par_409", "par_413", "par_414", "par_415"],
    "evaluation downstream consumers",
  );
}

function validateFeedbackContract(): void {
  const feedback = readJson<{
    taskId?: string;
    eligibilityStates?: JsonRecord[];
    objectContracts?: JsonRecord[];
    eligibilityRequirements?: unknown[];
    exclusionReasons?: JsonRecord[];
    revocationReasons?: JsonRecord[];
    stateTransitions?: JsonRecord[];
    trainingExportRules?: unknown[];
    invariants?: JsonRecord[];
  }>("data/contracts/404_feedback_eligibility_contracts.json");

  invariant(feedback.taskId === "par_404", "Feedback contract task id drifted.");
  requireExactSet(
    asArray<JsonRecord>(feedback.eligibilityStates, "feedback.eligibilityStates").map((state) => String(state.state)),
    ["pending_settlement", "requires_adjudication", "eligible", "excluded", "revoked"],
    "feedback eligibility states",
  );

  const contracts = asArray<JsonRecord>(feedback.objectContracts, "feedback.objectContracts");
  requireExactSuperset(
    contracts.map((contract) => String(contract.objectName)),
    [
      "FeedbackEligibilityFlag",
      "FeedbackEligibilityEvaluation",
      "AdjudicationRoutingDecision",
      "FeedbackRevocationRecord",
      "TrainabilityExclusionPolicy",
    ],
    "feedback object contracts",
  );

  const flag = requiredByKey(contracts, "objectName", "FeedbackEligibilityFlag", "FeedbackEligibilityFlag");
  requireExactSet(
    asStringArray(flag.states, "FeedbackEligibilityFlag.states"),
    ["pending_settlement", "requires_adjudication", "eligible", "excluded", "revoked"],
    "FeedbackEligibilityFlag states",
  );
  requireExactSuperset(
    asStringArray(flag.requiredFields, "FeedbackEligibilityFlag.requiredFields"),
    [
      "finalHumanArtifactRef",
      "authoritativeWorkflowSettlementRef",
      "labelQualityState",
      "counterfactualCompletenessState",
      "eligibilityState",
      "exclusionReasonRefs",
      "revocationReasonRefs",
      "adjudicationRoutingDecisionRef",
      "supersedesEligibilityFlagRef",
    ],
    "FeedbackEligibilityFlag fields",
  );
  requireIncludes(JSON.stringify(flag.dependencyRules), "settled finalHumanArtifactRef", "FeedbackEligibilityFlag dependency rules");
  requireIncludes(JSON.stringify(flag.dependencyRules), "revoked creates a new flag", "FeedbackEligibilityFlag dependency rules");

  const exclusions = asArray<JsonRecord>(feedback.exclusionReasons, "feedback.exclusionReasons").map((reason) =>
    String(reason.reasonId),
  );
  requireExactSuperset(exclusions, [...REQUIRED_FEEDBACK_EXCLUSIONS], "feedback exclusion reasons");
  invariant(
    asArray<JsonRecord>(feedback.revocationReasons, "feedback.revocationReasons").length >= 6,
    "Feedback revocation reasons must be explicit.",
  );
  invariant(
    asArray(feedback.eligibilityRequirements, "feedback.eligibilityRequirements").length >= 6,
    "Feedback eligibility requirements must be explicit.",
  );
  requireIncludes(JSON.stringify(feedback.stateTransitions), "\"from\":\"eligible\",\"to\":\"revoked\"", "feedback transitions");
  requireIncludes(JSON.stringify(feedback.trainingExportRules), "only FeedbackEligibilityFlag.state eligible", "feedback training export rules");
  requireExactSuperset(
    asArray<JsonRecord>(feedback.invariants, "feedback.invariants").map((entry) => String(entry.invariantId)),
    ["INV404_FB_001", "INV404_FB_002", "INV404_FB_003", "INV404_FB_004"],
    "feedback invariants",
  );
}

function validateShadowContract(): void {
  const shadow = readJson<{
    taskId?: string;
    completenessStates?: unknown[];
    objectContracts?: JsonRecord[];
    requiredMetricFamilies?: JsonRecord[];
    freshnessWindows?: JsonRecord[];
    publicationBindings?: JsonRecord;
    completenessDerivationOrder?: JsonRecord[];
    blockingReasonCodes?: unknown[];
    invariants?: JsonRecord[];
    downstreamConsumers?: unknown[];
  }>("data/contracts/404_shadow_mode_evidence_requirements.json");

  invariant(shadow.taskId === "par_404", "Shadow contract task id drifted.");
  requireExactSet(asStringArray(shadow.completenessStates, "shadow.completenessStates"), ["complete", "stale", "missing", "blocked"], "shadow completeness states");

  const contracts = asArray<JsonRecord>(shadow.objectContracts, "shadow.objectContracts");
  requireExactSuperset(
    contracts.map((contract) => String(contract.objectName)),
    [
      "ShadowModeEvidenceRequirement",
      "ShadowCompletenessAssessment",
      "ShadowEvidenceMetricSet",
      "ShadowEvidencePublicationBinding",
    ],
    "shadow object contracts",
  );

  invariant(
    asArray<JsonRecord>(shadow.requiredMetricFamilies, "shadow.requiredMetricFamilies").length >= 10,
    "Shadow metric families must be broad enough for rollout and monitoring.",
  );
  invariant(
    asArray<JsonRecord>(shadow.freshnessWindows, "shadow.freshnessWindows").length >= 5,
    "Shadow freshness windows must cover multiple capabilities.",
  );

  requireExactSuperset(
    asStringArray(shadow.publicationBindings?.requiredRefs, "shadow.publicationBindings.requiredRefs"),
    [
      "surfaceRouteContractRef",
      "surfacePublicationRef",
      "runtimePublicationBundleRef",
      "telemetryDisclosureFenceRef",
      "releaseRecoveryDispositionRef",
      "assistiveEvaluationSurfaceBindingRef",
    ],
    "shadow publication binding refs",
  );
  requireIncludes(JSON.stringify(shadow.completenessDerivationOrder), "\"state\":\"blocked\"", "shadow derivation order");
  requireIncludes(JSON.stringify(shadow.blockingReasonCodes), "telemetry_disclosure_fence_missing", "shadow blocking reason codes");
  requireExactSuperset(
    asArray<JsonRecord>(shadow.invariants, "shadow.invariants").map((entry) => String(entry.invariantId)),
    ["INV404_SHADOW_001", "INV404_SHADOW_002", "INV404_SHADOW_003", "INV404_SHADOW_004"],
    "shadow invariants",
  );
  requireExactSuperset(
    asStringArray(shadow.downstreamConsumers, "shadow.downstreamConsumers"),
    ["par_406", "par_411", "par_415"],
    "shadow downstream consumers",
  );
}

function validateDocsAndNotes(): void {
  const contractDoc = readText("docs/contracts/404_phase8_evaluation_shadow_feedback_contract.md");
  for (const needle of [
    "CaseReplayBundle",
    "FeedbackEligibilityFlag",
    "EvaluationExportArtifact",
    "`gold`",
    "`shadow_live`",
    "`feedback`",
    "`complete`",
    "`stale`",
    "`missing`",
    "`blocked`",
    "`pending_settlement`",
    "`requires_adjudication`",
    "`eligible`",
    "`excluded`",
    "`revoked`",
  ]) {
    requireIncludes(contractDoc, needle, "404 contract doc");
  }

  const stateTopology = readText("docs/contracts/404_phase8_evaluation_shadow_feedback_state_topology.mmd");
  for (const needle of ["ShadowComplete", "FeedbackEligible", "FeedbackRevoked", "ExportSummaryOnly"]) {
    requireIncludes(stateTopology, needle, "404 state topology");
  }

  const externalNotes = readText("data/analysis/404_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    requireIncludes(externalNotes, url, "404 external reference notes");
  }
  requireIncludes(externalNotes, "Rejected or constrained", "404 external reference notes");

  const alignmentNotes = readText("data/analysis/404_algorithm_alignment_notes.md");
  requireIncludes(alignmentNotes, "No blocking interface gap remains", "404 algorithm alignment notes");
  requireIncludes(alignmentNotes, "FeedbackEligibilityFlag", "404 algorithm alignment notes");

  const gapRegister = readJson<{
    blockingGapCount?: number;
    fallbackGapFileRequired?: boolean;
    resolvedInterfaceGaps?: JsonRecord[];
    downstreamContracts?: JsonRecord[];
  }>("data/analysis/404_dependency_and_gap_register.json");
  invariant(gapRegister.blockingGapCount === 0, "404 gap register must have zero blockers.");
  invariant(gapRegister.fallbackGapFileRequired === false, "404 fallback gap file must not be required.");
  invariant(
    asArray<JsonRecord>(gapRegister.resolvedInterfaceGaps, "gapRegister.resolvedInterfaceGaps").length >= 6,
    "404 gap register must document support object resolutions.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(gapRegister.downstreamContracts, "gapRegister.downstreamContracts").map((entry) =>
      String(entry.consumerTaskId),
    ),
    ["par_406", "par_408", "par_409", "par_413", "par_414", "par_415"],
    "404 downstream gap register contracts",
  );
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function asArray<T = unknown>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asStringArray(value: unknown, label: string): string[] {
  return asArray<unknown>(value, label).map((entry) => String(entry));
}

function requiredByKey(rows: JsonRecord[], key: string, expected: string, label: string): JsonRecord {
  const row = rows.find((entry) => entry[key] === expected);
  invariant(row, `${label} missing.`);
  return row;
}

function requireExactSet(actual: string[], expected: string[], label: string): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  invariant(
    actualSorted.length === expectedSorted.length && expectedSorted.every((value, index) => actualSorted[index] === value),
    `${label} mismatch. Expected ${expectedSorted.join(", ")} got ${actualSorted.join(", ")}.`,
  );
}

function requireExactSuperset(actual: string[], expected: string[], label: string): void {
  for (const expectedValue of expected) {
    requireIncludes(actual, expectedValue, label);
  }
}

function requireIncludes(haystack: string[] | string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
