import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildEvidence,
  create347EligibilityService,
  deriveCandidateRulePack,
  evaluateSeededCase,
  positivePathwayEvidence,
  seed347Fixtures,
} from "../../tests/integration/347_rule_pack.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "packages", "domains", "pharmacy", "src", "phase6-pharmacy-eligibility-engine.ts"),
  path.join(ROOT, "packages", "domains", "pharmacy", "src", "index.ts"),
  path.join(ROOT, "packages", "domains", "pharmacy", "tests", "phase6-pharmacy-eligibility-engine.test.ts"),
  path.join(ROOT, "docs", "architecture", "347_phase6_eligibility_engine_and_policy_pack_compiler.md"),
  path.join(ROOT, "docs", "api", "347_pharmacy_rules_and_evaluation_api.md"),
  path.join(ROOT, "docs", "policy", "347_rule_pack_governance_and_promotion.md"),
  path.join(ROOT, "data", "analysis", "347_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "347_pathway_boundary_cases.csv"),
  path.join(ROOT, "data", "analysis", "347_golden_case_regression_matrix.csv"),
  path.join(ROOT, "data", "analysis", "347_threshold_coverage_matrix.csv"),
  path.join(ROOT, "data", "fixtures", "347_initial_rule_pack.json"),
  path.join(ROOT, "data", "fixtures", "347_golden_cases.json"),
  path.join(ROOT, "services", "command-api", "migrations", "155_phase6_pharmacy_eligibility_engine.sql"),
  path.join(ROOT, "tests", "integration", "347_rule_pack.helpers.ts"),
  path.join(ROOT, "tests", "integration", "347_pharmacy_eligibility_and_promotion.spec.ts"),
  path.join(ROOT, "tests", "integration", "347_pharmacy_rule_pack_replay.spec.ts"),
  path.join(ROOT, "tests", "integration", "347_pharmacy_rule_pack_mutation.spec.ts"),
  path.join(ROOT, "tests", "property", "347_pharmacy_rule_pack_determinism.spec.ts"),
  path.join(ROOT, "tools", "analysis", "validate_347_rule_pack_and_evaluation.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:347-rule-pack-and-evaluation": "pnpm exec tsx ./tools/analysis/validate_347_rule_pack_and_evaluation.ts"';

const REQUIRED_PATHWAYS = [
  "uncomplicated_uti_female_16_64",
  "shingles_18_plus",
  "acute_otitis_media_1_17",
  "acute_sore_throat_5_plus",
  "acute_sinusitis_12_plus",
  "impetigo_1_plus",
  "infected_insect_bites_1_plus",
] as const;

const REQUIRED_THRESHOLDS = [
  "alpha_required_symptom_weight",
  "eta_excl",
  "eta_global",
  "eta_contra",
  "tau_global_block",
  "tau_path_block",
  "tau_contra_block",
  "tau_req_pass",
  "tau_min_complete",
  "tau_eligible",
  "xi_minor_feature_weight",
  "tau_minor_eligible",
] as const;

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(
    fs.existsSync(filePath),
    `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`,
  );
  return fs.readFileSync(filePath, "utf8");
}

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/).filter(Boolean);
  requireCondition(Boolean(headerLine), "CSV_HEADER_MISSING");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_347_phase6_track_backend_build_eligibility_engine_pathway_rules_and_versioned_policy_pack_compiler",
    ) ||
      checklist.includes(
        "- [X] par_347_phase6_track_backend_build_eligibility_engine_pathway_rules_and_versioned_policy_pack_compiler",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_347",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:347-rule-pack-and-evaluation",
  );
}

function validateEngineExports() {
  const engine = read(
    path.join(ROOT, "packages", "domains", "pharmacy", "src", "phase6-pharmacy-eligibility-engine.ts"),
  );
  for (const requiredSymbol of [
    "createPhase6PharmacyEligibilityStore",
    "createPhase6PharmacyEligibilityEngineService",
    "validateRulePack",
    "compileRulePack",
    "promoteRulePack",
    "retireRulePack",
    "replayHistoricalEvaluation",
    "comparePackVersions",
    "runGoldenCaseRegression",
    "evaluateCurrentPharmacyCase",
    "PathwayEligibilityEvaluationSnapshot",
    "EligibilityExplanationBundleSnapshot",
  ]) {
    requireCondition(engine.includes(requiredSymbol), `ENGINE_SYMBOL_MISSING:${requiredSymbol}`);
  }
}

function validateDocs() {
  const architecture = read(
    path.join(ROOT, "docs", "architecture", "347_phase6_eligibility_engine_and_policy_pack_compiler.md"),
  );
  const apiDoc = read(path.join(ROOT, "docs", "api", "347_pharmacy_rules_and_evaluation_api.md"));
  const policy = read(
    path.join(ROOT, "docs", "policy", "347_rule_pack_governance_and_promotion.md"),
  );

  for (const keyword of [
    "PharmacyRulePack",
    "EligibilityExplanationBundle",
    "compileHash",
    "minor-illness fallback",
    "evaluateCurrentPharmacyCase",
  ]) {
    requireCondition(architecture.includes(keyword), `ARCHITECTURE_KEYWORD_MISSING:${keyword}`);
  }

  for (const keyword of [
    "importDraftRulePack",
    "validateRulePack",
    "compileRulePack",
    "promoteRulePack",
    "retireRulePack",
    "replayHistoricalEvaluation",
    "comparePackVersions",
  ]) {
    requireCondition(apiDoc.includes(keyword), `API_KEYWORD_MISSING:${keyword}`);
  }

  for (const keyword of [
    "immutable",
    "golden-case regression",
    "global block",
    "No in-place edits",
    "tau_minor_eligible",
  ]) {
    requireCondition(
      policy.toLowerCase().includes(keyword.toLowerCase()),
      `POLICY_KEYWORD_MISSING:${keyword}`,
    );
  }
}

function validateMigration() {
  const sql = read(
    path.join(ROOT, "services", "command-api", "migrations", "155_phase6_pharmacy_eligibility_engine.sql"),
  );
  for (const requiredTable of [
    "phase6_pharmacy_rule_packs",
    "phase6_pharmacy_rule_pack_threshold_sets",
    "phase6_pharmacy_pathway_definitions",
    "phase6_pharmacy_timing_guardrails",
    "phase6_pharmacy_compiled_rule_packs",
    "phase6_pharmacy_golden_cases",
    "phase6_pharmacy_eligibility_explanation_bundles",
    "phase6_pharmacy_eligibility_evaluations",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  requireCondition(
    sql.includes("idx_phase6_pharmacy_evaluations_replay_key"),
    "MIGRATION_INDEX_MISSING:idx_phase6_pharmacy_evaluations_replay_key",
  );
}

function validateCsvArtifacts() {
  const boundaryRows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "347_pathway_boundary_cases.csv")),
  );
  requireCondition(boundaryRows.length >= 15, "BOUNDARY_CASE_COUNT_DRIFT");
  for (const requiredPathway of [...REQUIRED_PATHWAYS, "minor_illness_fallback"]) {
    requireCondition(
      boundaryRows.some((row) => row.pathway_code === requiredPathway),
      `BOUNDARY_PATHWAY_MISSING:${requiredPathway}`,
    );
  }
  requireCondition(
    boundaryRows.some((row) => row.expected_gate === "global_blocked"),
    "BOUNDARY_GLOBAL_BLOCK_CASE_MISSING",
  );

  const goldenRows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "347_golden_case_regression_matrix.csv")),
  );
  requireCondition(goldenRows.length >= 10, "GOLDEN_CASE_COUNT_DRIFT");
  for (const goldenCaseId of [
    "GC347_001_uti_positive",
    "GC347_004_global_red_flag_block",
    "GC347_008_minor_illness_fallback_valid",
    "GC347_010_shingles_lower_boundary_positive",
  ]) {
    requireCondition(
      goldenRows.some((row) => row.golden_case_id === goldenCaseId),
      `GOLDEN_CASE_MATRIX_ROW_MISSING:${goldenCaseId}`,
    );
  }

  const thresholdRows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "347_threshold_coverage_matrix.csv")),
  );
  requireCondition(thresholdRows.length === REQUIRED_THRESHOLDS.length, "THRESHOLD_MATRIX_COUNT_DRIFT");
  for (const thresholdId of REQUIRED_THRESHOLDS) {
    requireCondition(
      thresholdRows.some((row) => row.threshold_id === thresholdId),
      `THRESHOLD_MATRIX_ROW_MISSING:${thresholdId}`,
    );
  }
}

function validateFixtures() {
  const initialRulePack = JSON.parse(
    read(path.join(ROOT, "data", "fixtures", "347_initial_rule_pack.json")),
  ) as {
    pathwayDefinitions: Array<{ pathwayCode: string }>;
    timingGuardrails: Array<{ pathwayCode: string }>;
    thresholdValues: Record<string, unknown>;
    displayTextCatalog: Record<string, string>;
  };
  const goldenCases = JSON.parse(
    read(path.join(ROOT, "data", "fixtures", "347_golden_cases.json")),
  ) as Array<{ goldenCaseId: string }>;

  requireCondition(initialRulePack.pathwayDefinitions.length === 7, "FIXTURE_PATHWAY_COUNT_DRIFT");
  requireCondition(initialRulePack.timingGuardrails.length === 7, "FIXTURE_GUARDRAIL_COUNT_DRIFT");
  requireCondition(goldenCases.length === 10, "FIXTURE_GOLDEN_CASE_COUNT_DRIFT");

  for (const pathwayCode of REQUIRED_PATHWAYS) {
    requireCondition(
      initialRulePack.pathwayDefinitions.some((entry) => entry.pathwayCode === pathwayCode),
      `FIXTURE_PATHWAY_MISSING:${pathwayCode}`,
    );
    requireCondition(
      initialRulePack.timingGuardrails.some((entry) => entry.pathwayCode === pathwayCode),
      `FIXTURE_GUARDRAIL_MISSING:${pathwayCode}`,
    );
  }

  for (const thresholdId of REQUIRED_THRESHOLDS) {
    requireCondition(
      Object.hasOwn(initialRulePack.thresholdValues, thresholdId),
      `FIXTURE_THRESHOLD_MISSING:${thresholdId}`,
    );
  }

  requireCondition(
    Object.hasOwn(initialRulePack.displayTextCatalog, "copy.guardrail.uti.warning"),
    "FIXTURE_DISPLAY_TEXT_MISSING:copy.guardrail.uti.warning",
  );
}

async function validateRuntimeProof() {
  const seeded = create347EligibilityService();
  const baselineRulePackId = await seed347Fixtures(seeded.service);

  const integrated = await evaluateSeededCase(seeded.service, {
    seed: "347_validator_case",
    rulePackId: baselineRulePackId,
    evidence: positivePathwayEvidence("shingles_18_plus"),
  });
  requireCondition(
    integrated.evaluation.finalDisposition === "eligible_choice_pending",
    "RUNTIME_CASE_EVALUATION_DISPOSITION_DRIFT",
  );
  requireCondition(
    integrated.caseMutation.pharmacyCase.status === "eligible_choice_pending",
    "RUNTIME_CASE_STATUS_DRIFT",
  );
  requireCondition(
    integrated.caseMutation.pharmacyCase.eligibilityRef?.refId === integrated.evaluation.evaluationId,
    "RUNTIME_CASE_ELIGIBILITY_REF_DRIFT",
  );

  const fallback = await seeded.service.evaluateEvidence({
    pharmacyCaseId: "pharmacy_case_347_validator_fallback",
    rulePackId: baselineRulePackId,
    replayKey: "validator_347_fallback",
    evaluatedAt: "2026-04-23T14:05:00.000Z",
    evidence: buildEvidence({
      patientAgeYears: 31,
      sexAtBirth: "male",
      symptomEvidence: {
        "sore_throat.pain": { support: 0.35, completeness: 0.62 },
        "sore_throat.fever_past_24h": { support: 0.2, completeness: 0.58 },
        "sinusitis.nasal_discharge": { support: 0.3, completeness: 0.55 },
      },
      minorIllnessFeatureScores: {
        symptomBurden: 0.92,
        selfCareFit: 0.9,
        comorbidityPenalty: 0.08,
        escalationNeedPenalty: 0.06,
      },
      evaluatedAt: "2026-04-23T14:05:00.000Z",
    }),
  });
  requireCondition(
    fallback.evaluation.finalDisposition === "minor_illness_fallback",
    "RUNTIME_FALLBACK_DISPOSITION_DRIFT",
  );
  requireCondition(
    fallback.evaluation.pathwayGateResult === "fallback_only",
    "RUNTIME_FALLBACK_GATE_DRIFT",
  );

  const replay = await seeded.service.replayHistoricalEvaluation({
    evaluationId: integrated.evaluation.evaluationId,
  });
  requireCondition(
    replay.evaluation.sharedEvidenceHash === integrated.evaluation.sharedEvidenceHash,
    "RUNTIME_REPLAY_HASH_DRIFT",
  );

  const compareEnv = create347EligibilityService();
  const compareBaselineRulePackId = await seed347Fixtures(compareEnv.service);
  const candidate = deriveCandidateRulePack(
    "RPK_P6_2026_08_01_VALIDATOR",
    "2026-08-01T00:00:00.000Z",
    (pack) => {
      pack.thresholdValues.tau_eligible = 0.64;
    },
  );
  await compareEnv.service.importDraftRulePack(candidate);
  await compareEnv.service.validateRulePack(candidate.rulePackId, "2026-04-23T14:10:00.000Z");
  const compiledCandidate = await compareEnv.service.compileRulePack(
    candidate.rulePackId,
    "2026-04-23T14:11:00.000Z",
  );
  const comparison = await compareEnv.service.comparePackVersions({
    baselineRulePackId: compareBaselineRulePackId,
    candidateRulePackId: candidate.rulePackId,
    pharmacyCaseId: "pharmacy_case_347_validator_compare",
    evidence: positivePathwayEvidence("acute_sore_throat_5_plus"),
    evaluatedAt: "2026-04-23T14:12:00.000Z",
  });
  requireCondition(
    comparison.thresholdDeltaRefs.includes("tau_eligible"),
    "RUNTIME_THRESHOLD_DELTA_MISSING:tau_eligible",
  );
  const promotedCandidate = await compareEnv.service.promoteRulePack({
    rulePackId: candidate.rulePackId,
    promotedAt: "2026-04-23T14:13:00.000Z",
    promotedByRef: "validator_347",
    promotionReason: "validator_safe_candidate_promotion",
  });
  requireCondition(promotedCandidate.packState === "promoted", "RUNTIME_PROMOTION_STATE_DRIFT");
  requireCondition(
    promotedCandidate.compileHash === compiledCandidate.compileHash,
    "RUNTIME_PROMOTION_HASH_DRIFT",
  );
  const baselineAfterPromotion = await compareEnv.service.getRulePack(compareBaselineRulePackId);
  requireCondition(
    baselineAfterPromotion?.packState === "superseded",
    "RUNTIME_BASELINE_SUPERSESSION_DRIFT",
  );

  const mutationEnv = create347EligibilityService();
  const mutationBaselineRulePackId = await seed347Fixtures(mutationEnv.service);
  const mutated = deriveCandidateRulePack(
    "RPK_P6_2026_09_01_MUTATION_VALIDATOR",
    "2026-09-01T00:00:00.000Z",
    (pack) => {
      pack.thresholdValues.tau_global_block = 1;
    },
  );
  await mutationEnv.service.importDraftRulePack(mutated);
  await mutationEnv.service.validateRulePack(mutated.rulePackId, "2026-04-23T14:20:00.000Z");
  await mutationEnv.service.compileRulePack(mutated.rulePackId, "2026-04-23T14:21:00.000Z");
  const regression = await mutationEnv.service.runGoldenCaseRegression({
    candidateRulePackId: mutated.rulePackId,
    baselineRulePackId: mutationBaselineRulePackId,
  });
  requireCondition(!regression.passed, "RUNTIME_MUTATION_REGRESSION_FALSE_NEGATIVE");
  requireCondition(
    regression.entries.some(
      (entry) =>
        entry.goldenCaseId === "GC347_004_global_red_flag_block" &&
        entry.failures.includes("forbidden_behavior_drift"),
    ),
    "RUNTIME_MUTATION_GOLDEN_CASE_DRIFT_MISSING",
  );
}

async function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateEngineExports();
  validateDocs();
  validateMigration();
  validateCsvArtifacts();
  validateFixtures();
  await validateRuntimeProof();
  console.log("validate_347_rule_pack_and_evaluation: ok");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
