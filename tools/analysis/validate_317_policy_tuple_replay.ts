import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  atMinute,
  buildEnhancedAccessPolicyCompileInput,
  buildTrustedPolicyFacts,
  evaluateAcrossAllScopes,
  setupEnhancedAccessPolicyHarness,
} from "../../tests/integration/317_enhanced_access_policy.helpers.ts";
import { phase5PolicyEvaluationScopes } from "../../packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "src",
    "phase5-enhanced-access-policy-engine.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-enhanced-access-policy-engine.test.ts",
  ),
  path.join(ROOT, "docs", "architecture", "317_enhanced_access_policy_compiler_and_evaluation_engine.md"),
  path.join(ROOT, "docs", "api", "317_network_policy_evaluation_api.md"),
  path.join(ROOT, "docs", "security", "317_policy_tuple_drift_and_replay_rules.md"),
  path.join(ROOT, "data", "analysis", "317_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "317_policy_tuple_examples.json"),
  path.join(ROOT, "data", "analysis", "317_policy_exception_catalog.csv"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_BATCH_316_323_INTERFACE_GAP_POLICY_EVALUATION_SCOPE_REGISTRY.json",
  ),
  path.join(
    ROOT,
    "services",
    "command-api",
    "migrations",
    "145_phase5_enhanced_access_policy_engine.sql",
  ),
  path.join(ROOT, "tests", "integration", "317_policy_tuple_compilation_and_scopes.spec.ts"),
  path.join(ROOT, "tests", "integration", "317_policy_replay_and_migration.spec.ts"),
  path.join(ROOT, "tests", "property", "317_policy_tuple_replay.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:317-policy-tuple-replay": "pnpm exec tsx ./tools/analysis/validate_317_policy_tuple_replay.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_317_phase5_track_backend_build_enhanced_access_policy_engine_and_versioned_policy_packs",
    ) ||
      checklist.includes(
        "- [X] par_317_phase5_track_backend_build_enhanced_access_policy_engine_and_versioned_policy_packs",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_317",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:317-policy-tuple-replay",
  );
}

function validateMigration() {
  const sql = read(
    path.join(
      ROOT,
      "services",
      "command-api",
      "migrations",
      "145_phase5_enhanced_access_policy_engine.sql",
    ),
  );
  for (const requiredTable of [
    "phase5_hub_routing_policy_packs",
    "phase5_hub_variance_window_policies",
    "phase5_hub_service_obligation_policies",
    "phase5_hub_practice_visibility_policies",
    "phase5_hub_capacity_ingestion_policies",
    "phase5_enhanced_access_policies",
    "phase5_enhanced_access_policy_active_bindings",
    "phase5_network_coordination_policy_evaluations",
    "phase5_policy_exception_records",
    "phase5_policy_evaluation_replay_fixtures",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  requireCondition(
    sql.includes("Phase 5 Enhanced Access policy engine"),
    "MIGRATION_DEPENDENCY_NOTE_MISSING",
  );
}

function validateAnalysisArtifacts() {
  const examples = JSON.parse(
    read(path.join(ROOT, "data", "analysis", "317_policy_tuple_examples.json")),
  ) as {
    scopeExamples?: Array<{ scope: string }>;
    driftExample?: { driftDisposition?: string };
  };
  const catalog = read(path.join(ROOT, "data", "analysis", "317_policy_exception_catalog.csv"));
  const notes = read(path.join(ROOT, "data", "analysis", "317_external_reference_notes.md"));
  const gapNote = JSON.parse(
    read(
      path.join(
        ROOT,
        "data",
        "contracts",
        "PHASE5_BATCH_316_323_INTERFACE_GAP_POLICY_EVALUATION_SCOPE_REGISTRY.json",
      ),
    ),
  ) as {
    taskId?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  };

  const scopes = new Set((examples.scopeExamples ?? []).map((value) => value.scope));
  for (const scope of phase5PolicyEvaluationScopes) {
    requireCondition(scopes.has(scope), `EXAMPLE_SCOPE_MISSING:${scope}`);
  }
  requireCondition(
    examples.driftExample?.driftDisposition === "drifted",
    "DRIFT_EXAMPLE_MISSING_OR_INVALID",
  );

  for (const exceptionCode of [
    "POLICY_TUPLE_DRIFT",
    "VARIANCE_OUTSIDE_WINDOW_VISIBLE",
    "SERVICE_OBLIGATION_MAKE_UP_REQUIRED",
    "PRACTICE_VISIBILITY_RESTRICTED",
    "CAPACITY_DEGRADED_CALLBACK_ONLY",
    "CAPACITY_STALE",
  ]) {
    requireCondition(catalog.includes(exceptionCode), `EXCEPTION_CATALOG_ENTRY_MISSING:${exceptionCode}`);
  }

  requireCondition(
    notes.includes("Network Contract DES: Contract specification 2025/26"),
    "EXTERNAL_REF_NOTE_MISSING:DES_2025_26",
  );
  requireCondition(
    notes.includes("Digital clinical safety assurance"),
    "EXTERNAL_REF_NOTE_MISSING:DIGITAL_CLINICAL_SAFETY_ASSURANCE",
  );
  requireCondition(
    notes.includes("Step by step guidance"),
    "EXTERNAL_REF_NOTE_MISSING:DCB_GUIDANCE",
  );

  requireCondition(gapNote.taskId === "par_317", "GAP_NOTE_TASK_ID_INVALID");
  requireCondition(
    gapNote.temporaryFallback?.includes("phase5PolicyEvaluationScopes") === true,
    "GAP_NOTE_FALLBACK_MISSING_SCOPE_REGISTRY",
  );
  requireCondition(
    gapNote.followUpAction?.includes("evaluationScope enum") === true,
    "GAP_NOTE_FOLLOW_UP_MISSING",
  );
}

async function validateRuntimeProof() {
  const harness = await setupEnhancedAccessPolicyHarness("317_validator");
  const scopeResults = await evaluateAcrossAllScopes(
    harness,
    atMinute(5),
    buildTrustedPolicyFacts("317_validator"),
  );

  requireCondition(
    scopeResults.length === phase5PolicyEvaluationScopes.length,
    "RUNTIME_SCOPE_COUNT_INVALID",
  );
  requireCondition(
    scopeResults.every(
      (value) =>
        value.evaluation.policyTupleHash === harness.compiled.compiledPolicy.policyTupleHash,
    ),
    "RUNTIME_SCOPE_TUPLE_HASH_MISMATCH",
  );

  const replay = await harness.policyService.replayHistoricalEvaluation({
    policyEvaluationId: scopeResults[0]!.evaluation.policyEvaluationId,
  });
  requireCondition(replay.matchesStoredEvaluation, "RUNTIME_REPLAY_MISMATCH");

  const oldPolicy = harness.compiled.compiledPolicy;
  const nextInput = buildEnhancedAccessPolicyCompileInput("317_validator_next", oldPolicy.pcnRef);
  const nextCompile = await harness.policyService.compileEnhancedAccessPolicy({
    ...nextInput,
    policyVersion: "317.policy.validator.v2",
    effectiveAt: atMinute(20),
    varianceWindowPolicy: {
      ...nextInput.varianceWindowPolicy,
      policyVersion: "variance.validator.v2",
      approvedVarianceAfterMinutes: nextInput.varianceWindowPolicy.approvedVarianceAfterMinutes + 30,
    },
  });
  const drift = await harness.policyService.resolvePolicyTupleDrift({
    pcnRef: oldPolicy.pcnRef,
    boundPolicyTupleHash: oldPolicy.policyTupleHash,
    asOf: atMinute(21),
  });
  requireCondition(
    drift.driftDisposition === "drifted" &&
      drift.currentPolicyTupleHash === nextCompile.compiledPolicy.policyTupleHash,
    "RUNTIME_DRIFT_RESOLUTION_FAILED",
  );
}

async function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateMigration();
  validateAnalysisArtifacts();
  await validateRuntimeProof();
  console.log("317 policy tuple replay validation passed.");
}

await main();
