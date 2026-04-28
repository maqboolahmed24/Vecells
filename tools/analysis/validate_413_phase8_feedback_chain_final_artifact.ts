import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_feedback_chain/package.json",
  "packages/domains/assistive_feedback_chain/project.json",
  "packages/domains/assistive_feedback_chain/tsconfig.json",
  "packages/domains/assistive_feedback_chain/src/index.ts",
  "services/command-api/migrations/413_phase8_feedback_chain_and_final_human_artifact.sql",
  "docs/backend/413_phase8_feedback_chain_and_final_human_artifact_spec.md",
  "docs/backend/413_phase8_feedback_chain_topology.mmd",
  "data/contracts/413_feedback_chain_and_final_human_artifact_contract.json",
  "data/analysis/413_algorithm_alignment_notes.md",
  "data/analysis/413_external_reference_notes.md",
  "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_FEEDBACK_CHAIN_AND_FINAL_HUMAN_ARTIFACT.json",
  "tests/unit/413_action_gesture_idempotency_and_override_rules.spec.ts",
  "tests/integration/413_feedback_chain_supersession_and_final_human_artifact.spec.ts",
  "tests/integration/413_dual_review_and_no_self_approval.spec.ts",
  "tools/analysis/validate_413_phase8_feedback_chain_final_artifact.ts",
] as const;

const REQUIRED_SERVICES = [
  "AssistiveFeedbackChainService",
  "AssistiveArtifactActionLedger",
  "ActionGestureIdempotencyGuard",
  "OverrideRecordService",
  "HumanApprovalGateEngine",
  "DistinctApproverPolicyGuard",
  "FinalHumanArtifactBinder",
  "AssistiveFeedbackChainSupersessionService",
] as const;

const REQUIRED_OBJECTS = [
  "AssistiveFeedbackChain",
  "AssistiveArtifactActionRecord",
  "OverrideRecord",
  "HumanApprovalGateAssessment",
  "FinalHumanArtifact",
  "AssistiveFeedbackAuditRecord",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
  "https://www.digitalregulations.innovation.nhs.uk/regulations-and-guidance-for-developers/all-developers-guidance/using-the-digital-technology-assessment-criteria-dtac/",
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
    packageJson.scripts?.["validate:413-phase8-feedback-chain-final-artifact"] ===
      "pnpm exec tsx ./tools/analysis/validate_413_phase8_feedback_chain_final_artifact.ts",
    "package.json missing validate:413-phase8-feedback-chain-final-artifact script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_412_phase8_track_backend_build_assistive_work_protection_and_suggestion_draft_insertion_leases/m.test(
      checklist,
    ),
    "Checklist task 412 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_413_phase8_track_backend_build_override_record_feedback_chain_and_final_human_artifact_linkage/m.test(
      checklist,
    ),
    "Checklist task 413 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGateAndGap();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("413 phase8 feedback chain and final human artifact validated.");
}

function validateUpstreamGateAndGap(): void {
  for (const upstream of [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/411_trust_envelope_projection_contract.json",
    "data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `413 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track413 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_413",
  );
  invariant(track413, "403 registry missing par_413.");
  invariant(
    track413.readinessState === "blocked",
    "Static 403 registry is expected to still mark par_413 blocked.",
  );
  invariant(
    asArray(track413.blockingRefs, "track413.blockingRefs").includes(
      "GAP403_413_REQUIRES_404_AND_412",
    ),
    "par_413 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>(
    "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_FEEDBACK_CHAIN_AND_FINAL_HUMAN_ARTIFACT.json",
  );
  invariant(gap.taskId === "par_413", "413 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "403 launch packet", "413 gap note");
  requireIncludes(
    String(gap.temporaryFallback),
    "data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json",
    "413 gap fallback",
  );
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_413", "413 gap follow-up");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_feedback_chain/package.json",
  );
  invariant(
    packageJson.name === "@vecells/domain-assistive-feedback-chain",
    "Assistive feedback chain package name drifted.",
  );
  invariant(
    packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit",
    "Assistive feedback chain typecheck script missing.",
  );
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-feedback-chain"'),
    "tsconfig.base.json missing @vecells/domain-assistive-feedback-chain path.",
  );

  const source = readText("packages/domains/assistive_feedback_chain/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const requiredSnippet of [
    "createAssistiveFeedbackChainPlane",
    "stableAssistiveFeedbackHash",
    "one_feedback_chain_per_artifact_revision",
    "action_gesture_key_idempotency_boundary",
    "action_gesture_cannot_fork_chains",
    "material_override_reason_code_required",
    "low_confidence_high_harm_acceptance_requires_reason",
    "dual_review_required_for_high_risk_low_trust_external_commit",
    "distinct_approver_required",
    "model_output_generator_cannot_approve",
    "final_human_artifact_requires_authoritative_settlement",
    "assistive_acceptance_is_not_workflow_settlement",
    "regenerate_supersedes_feedback_chain",
    "artifact_hash_drift_supersedes_feedback_chain",
    "feedback_chain_outputs_for_414_only",
    "phi_safe_feedback_telemetry_required",
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
    gesturePolicy?: JsonRecord;
    overridePolicy?: JsonRecord;
    approvalPolicy?: JsonRecord;
    finalArtifactPolicy?: JsonRecord;
    downstreamInputsFor414?: JsonRecord;
    invariants?: JsonRecord[];
  }>("data/contracts/413_feedback_chain_and_final_human_artifact_contract.json");

  invariant(contract.taskId === "par_413", "413 runtime contract task id drifted.");
  invariant(
    contract.schemaVersion === "413.feedback-chain-final-human-artifact.v1",
    "413 runtime contract schema version drifted.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) =>
      String(service.serviceName),
    ),
    REQUIRED_SERVICES,
    "413 services",
  );
  requireExactSuperset(
    asStringArray(contract.persistedObjects, "contract.persistedObjects"),
    REQUIRED_OBJECTS,
    "413 persisted objects",
  );
  requireIncludes(JSON.stringify(contract.gesturePolicy), "actionGestureKey", "413 gesture policy");
  requireIncludes(
    JSON.stringify(contract.overridePolicy),
    "requiredReasonConditions",
    "413 override policy",
  );
  requireIncludes(
    JSON.stringify(contract.approvalPolicy),
    "model_output_generator_cannot_approve",
    "413 approval policy",
  );
  requireIncludes(
    JSON.stringify(contract.finalArtifactPolicy),
    "assistive_acceptance_is_not_workflow_settlement",
    "413 final artifact policy",
  );
  requireIncludes(
    JSON.stringify(contract.downstreamInputsFor414),
    "doesNotCompute",
    "413 downstream 414 inputs",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) =>
      String(entry.code),
    ),
    [
      "one_feedback_chain_per_artifact_revision",
      "action_gesture_key_idempotency_boundary",
      "material_override_reason_code_required",
      "dual_review_required_for_high_risk_low_trust_external_commit",
      "distinct_approver_required",
      "final_human_artifact_requires_authoritative_settlement",
      "assistive_acceptance_is_not_workflow_settlement",
      "feedback_chain_outputs_for_414_only",
    ],
    "413 invariants",
  );
}

function validateMigration(): void {
  const migration = readText(
    "services/command-api/migrations/413_phase8_feedback_chain_and_final_human_artifact.sql",
  );
  for (const tableName of [
    "assistive_feedback_chain",
    "assistive_artifact_action_record",
    "override_record",
    "human_approval_gate_assessment",
    "final_human_artifact",
    "assistive_feedback_chain_audit_record",
  ]) {
    requireIncludes(migration, tableName, "413 migration");
  }
  for (const requiredConstraint of [
    "assistive_feedback_chain_one_live_revision_idx",
    "assistive_action_gesture_global_idx",
    "override_reason_required_codes_present",
    "human_approval_gate_distinct_approver_refs_present",
    "human_approval_gate_no_soft_commit",
    "final_human_artifact_authoritative_settlement_required",
    "final_human_artifact_source_assistive_refs_required",
    "assistive_action_phi_safe_telemetry_required",
  ]) {
    requireIncludes(migration, requiredConstraint, "413 migration constraints");
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/413_phase8_feedback_chain_and_final_human_artifact_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    requireIncludes(spec, serviceName, "413 backend spec");
  }
  for (const phrase of [
    "actionGestureKey",
    "FinalHumanArtifact",
    "authoritative workflow settlement",
    "Task `414` consumes",
    "does not compute trainability",
  ]) {
    requireIncludes(spec, phrase, "413 backend spec");
  }

  const topology = readText("docs/backend/413_phase8_feedback_chain_topology.mmd");
  for (const node of [
    "AssistiveFeedbackChain",
    "AssistiveArtifactActionRecord",
    "OverrideRecord",
    "HumanApprovalGateAssessment",
    "FinalHumanArtifact",
    "Task 414 inputs",
  ]) {
    requireIncludes(topology, node, "413 topology");
  }

  const algorithmNotes = readText("data/analysis/413_algorithm_alignment_notes.md");
  for (const phrase of [
    "blueprint/phase-8-the-assistive-layer.md",
    "actionGestureKey",
    "FinalHumanArtifact",
    "does not compute",
  ]) {
    requireIncludes(algorithmNotes, phrase, "413 algorithm notes");
  }

  const externalNotes = readText("data/analysis/413_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    requireIncludes(externalNotes, url, "413 external reference notes");
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
