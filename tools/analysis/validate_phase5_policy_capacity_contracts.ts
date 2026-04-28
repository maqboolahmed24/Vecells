import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const REQUIRED_FILES = [
  path.join(ROOT, "docs", "architecture", "312_phase5_policy_capacity_and_candidate_ranking_contract.md"),
  path.join(ROOT, "docs", "api", "312_phase5_candidate_snapshot_and_rank_contract.md"),
  path.join(ROOT, "docs", "security", "312_phase5_policy_tuple_and_source_trust_rules.md"),
  path.join(ROOT, "docs", "frontend", "312_phase5_policy_tuple_and_capacity_atlas.html"),
  path.join(ROOT, "data", "contracts", "312_enhanced_access_policy.schema.json"),
  path.join(ROOT, "data", "contracts", "312_hub_routing_policy_pack.schema.json"),
  path.join(ROOT, "data", "contracts", "312_hub_variance_window_policy.schema.json"),
  path.join(ROOT, "data", "contracts", "312_hub_service_obligation_policy.schema.json"),
  path.join(ROOT, "data", "contracts", "312_hub_practice_visibility_policy.schema.json"),
  path.join(ROOT, "data", "contracts", "312_hub_capacity_ingestion_policy.schema.json"),
  path.join(ROOT, "data", "contracts", "312_network_coordination_policy_evaluation.schema.json"),
  path.join(ROOT, "data", "contracts", "312_network_candidate_snapshot.schema.json"),
  path.join(ROOT, "data", "contracts", "312_cross_site_decision_plan.schema.json"),
  path.join(ROOT, "data", "contracts", "312_network_slot_candidate.schema.json"),
  path.join(ROOT, "data", "contracts", "312_capacity_rank_proof_contract.json"),
  path.join(ROOT, "data", "contracts", "312_capacity_rank_explanation_contract.json"),
  path.join(ROOT, "data", "contracts", "312_enhanced_access_minutes_ledger.schema.json"),
  path.join(ROOT, "data", "contracts", "312_cancellation_make_up_ledger.schema.json"),
  path.join(ROOT, "data", "analysis", "312_external_reference_notes.json"),
  path.join(ROOT, "data", "analysis", "312_policy_family_boundary_matrix.csv"),
  path.join(ROOT, "data", "analysis", "312_candidate_rank_formula_manifest.json"),
  path.join(ROOT, "data", "analysis", "312_capacity_ingestion_gap_log.json"),
  path.join(ROOT, "data", "contracts", "PHASE5_INTERFACE_GAP_POLICY_CAPACITY_QUEUE_AND_SLA.json"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_INTERFACE_GAP_POLICY_CAPACITY_PATIENT_CHOICE_AND_DISCLOSURE.json",
  ),
  path.join(ROOT, "tools", "analysis", "build_312_phase5_policy_capacity_contracts.ts"),
  path.join(ROOT, "tools", "analysis", "validate_phase5_policy_capacity_contracts.ts"),
  path.join(ROOT, "tests", "playwright", "312_policy_tuple_and_capacity_atlas.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:312-phase5-policy-capacity-contracts": "pnpm exec tsx ./tools/analysis/validate_phase5_policy_capacity_contracts.ts"';

const REQUIRED_FORMULAS = [
  "windowClass(c,s)",
  "u_modality(c,s)",
  "u_access(c,s)",
  "u_travel(c,s)",
  "u_wait(c,s)",
  "u_fresh(c,s)",
  "baseUtility(c,s)",
  "uncertaintyRadius(c,s)",
  "robustFit(c,s)",
];

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseJson(filePath: string) {
  return JSON.parse(read(filePath));
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  requireCondition(lines.length > 1, "CSV_MISSING_ROWS");
  const parseLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function validateChecklist() {
  const checklist = read(CHECKLIST_PATH);
  requireCondition(
    checklist.includes(
      "- [-] seq_312_phase5_freeze_enhanced_access_policy_capacity_ingestion_and_candidate_ranking_contracts",
    ) ||
      checklist.includes(
        "- [X] seq_312_phase5_freeze_enhanced_access_policy_capacity_ingestion_and_candidate_ranking_contracts",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_312",
  );
}

function validatePackageScript() {
  const packageJson = read(PACKAGE_JSON_PATH);
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:312-phase5-policy-capacity-contracts",
  );
}

function validateFormulaManifest() {
  const manifest = parseJson(path.join(ROOT, "data", "analysis", "312_candidate_rank_formula_manifest.json"));
  requireCondition(manifest.taskId === "seq_312", "FORMULA_MANIFEST_TASK_ID_DRIFT");
  const formulaNames = manifest.formulas.map((entry: { name: string }) => entry.name);
  for (const formula of REQUIRED_FORMULAS) {
    requireCondition(formulaNames.includes(formula), `FORMULA_MISSING:${formula}`);
  }
  requireCondition(
    manifest.lexicographicOrder.length === 6,
    "LEXICOGRAPHIC_ORDER_COUNT_DRIFT",
  );
  const expectedLexicographic = [
    ["windowClass", "desc"],
    ["sourceTrustTier", "desc"],
    ["robustFit", "desc"],
    ["travelMinutes", "asc"],
    ["startAt", "asc"],
    ["candidateId", "asc"],
  ];
  for (const [index, [key, direction]] of expectedLexicographic.entries()) {
    requireCondition(
      manifest.lexicographicOrder[index]?.key === key &&
        manifest.lexicographicOrder[index]?.direction === direction,
      `LEXICOGRAPHIC_ORDER_DRIFT:${key}`,
    );
  }
  requireCondition(
    Array.isArray(manifest.separationLaws) &&
      manifest.separationLaws.some((entry: string) => entry.includes("Service-obligation")) &&
      manifest.separationLaws.some((entry: string) => entry.includes("Window fit remains a separate hard band")),
    "SEPARATION_LAWS_MISSING",
  );
}

function validateSchemas() {
  const enhancedAccess = parseJson(path.join(ROOT, "data", "contracts", "312_enhanced_access_policy.schema.json"));
  const policyEval = parseJson(
    path.join(ROOT, "data", "contracts", "312_network_coordination_policy_evaluation.schema.json"),
  );
  const slotCandidate = parseJson(path.join(ROOT, "data", "contracts", "312_network_slot_candidate.schema.json"));
  const snapshot = parseJson(path.join(ROOT, "data", "contracts", "312_network_candidate_snapshot.schema.json"));
  const decisionPlan = parseJson(path.join(ROOT, "data", "contracts", "312_cross_site_decision_plan.schema.json"));
  const minutesLedger = parseJson(
    path.join(ROOT, "data", "contracts", "312_enhanced_access_minutes_ledger.schema.json"),
  );
  const cancellationLedger = parseJson(
    path.join(ROOT, "data", "contracts", "312_cancellation_make_up_ledger.schema.json"),
  );

  for (const field of [
    "policyTupleHash",
    "routingPolicyPackRef",
    "varianceWindowPolicyRef",
    "serviceObligationPolicyRef",
    "practiceVisibilityPolicyRef",
    "capacityIngestionPolicyRef",
    "rankPlanVersionRef",
    "uncertaintyModelVersionRef",
  ]) {
    requireCondition(enhancedAccess.required.includes(field), `ENHANCED_ACCESS_REQUIRED_FIELD_MISSING:${field}`);
  }

  for (const field of [
    "routingDisposition",
    "varianceDisposition",
    "serviceObligationDisposition",
    "practiceVisibilityDisposition",
    "capacityAdmissionDisposition",
    "policyTupleHash",
  ]) {
    requireCondition(policyEval.required.includes(field), `POLICY_EVALUATION_REQUIRED_FIELD_MISSING:${field}`);
  }

  for (const field of [
    "candidateId",
    "sourceTrustState",
    "sourceTrustTier",
    "requiredWindowFit",
    "windowClass",
    "offerabilityState",
    "baseUtility",
    "uncertaintyRadius",
    "robustFit",
  ]) {
    requireCondition(slotCandidate.required.includes(field), `SLOT_CANDIDATE_REQUIRED_FIELD_MISSING:${field}`);
  }

  requireCondition(snapshot.required.includes("capacityRankProofRef"), "SNAPSHOT_PROOF_REF_MISSING");
  requireCondition(
    decisionPlan.required.includes("dominanceDecisions") &&
      decisionPlan.required.includes("patientOfferableFrontierRefs") &&
      decisionPlan.required.includes("directCommitFrontierRefs"),
    "DECISION_PLAN_FRONTIER_FIELDS_MISSING",
  );
  requireCondition(minutesLedger.required.includes("requiredMinutes"), "MINUTES_LEDGER_REQUIRED_MINUTES_MISSING");
  requireCondition(
    cancellationLedger.required.includes("makeUpDueAt") &&
      cancellationLedger.required.includes("makeUpState"),
    "CANCELLATION_LEDGER_MAKEUP_FIELDS_MISSING",
  );
}

function validateBoundaryMatrix() {
  const rows = parseCsv(read(path.join(ROOT, "data", "analysis", "312_policy_family_boundary_matrix.csv")));
  requireCondition(rows.length === 5, "POLICY_FAMILY_BOUNDARY_ROW_COUNT_DRIFT");
  const rowById = new Map(rows.map((row) => [row.familyId, row]));

  requireCondition(rowById.get("routing")?.mayChangePatientOfferable === "yes", "ROUTING_FRONTIER_DRIFT");
  requireCondition(rowById.get("variance")?.mayChangeDirectCommit === "yes", "VARIANCE_FRONTIER_DRIFT");
  requireCondition(
    rowById.get("capacity_ingestion")?.mayChangePatientOfferable === "yes" &&
      rowById.get("capacity_ingestion")?.mayRescoreRank === "no",
    "CAPACITY_INGESTION_BOUNDARY_DRIFT",
  );
  requireCondition(
    rowById.get("service_obligation")?.mayMintLedger === "yes" &&
      rowById.get("service_obligation")?.mayRescoreRank === "no",
    "SERVICE_OBLIGATION_BOUNDARY_DRIFT",
  );
  requireCondition(
    rowById.get("practice_visibility")?.mayCreateAckDebt === "yes" &&
      rowById.get("practice_visibility")?.mayRescoreRank === "no",
    "PRACTICE_VISIBILITY_BOUNDARY_DRIFT",
  );
}

function validateRankContracts() {
  const proof = parseJson(path.join(ROOT, "data", "contracts", "312_capacity_rank_proof_contract.json"));
  const explanation = parseJson(
    path.join(ROOT, "data", "contracts", "312_capacity_rank_explanation_contract.json"),
  );

  requireCondition(proof.taskId === "seq_312", "CAPACITY_RANK_PROOF_TASK_ID_DRIFT");
  requireCondition(
    proof.definitions?.CapacityRankProof?.stableOrderingRule?.join("|").includes("windowClass desc") &&
      proof.definitions?.CapacityRankProof?.stableOrderingRule?.join("|").includes("candidateId asc"),
    "CAPACITY_RANK_PROOF_ORDERING_DRIFT",
  );
  requireCondition(
    proof.definitions?.CapacityRankProof?.frontierLaw?.some((entry: string) =>
      entry.includes("Degraded and quarantined supply"),
    ),
    "CAPACITY_RANK_PROOF_FRONTIER_LAW_DRIFT",
  );
  requireCondition(
    explanation.definitions?.CapacityRankExplanation?.requiredFields?.includes("uncertaintyRadius"),
    "CAPACITY_RANK_EXPLANATION_UNCERTAINTY_FIELD_MISSING",
  );
  requireCondition(
    explanation.definitions?.CapacityRankExplanation?.disclosureLaw?.some((entry: string) =>
      entry.includes("must not recalculate"),
    ),
    "CAPACITY_RANK_EXPLANATION_DISCLOSURE_LAW_DRIFT",
  );
}

function validateExternalReferences() {
  const notes = parseJson(path.join(ROOT, "data", "analysis", "312_external_reference_notes.json"));
  const urls = new Set(notes.sourcesReviewed.map((entry: { url: string }) => entry.url));
  for (const url of [
    "https://www.england.nhs.uk/gp/investment/gp-contract/network-contract-directed-enhanced-service-des/",
    "https://www.england.nhs.uk/gp/investment/gp-contract/network-contract-directed-enhanced-service-des/enhanced-access-faqs/",
    "https://www.england.nhs.uk/publication/how-to-align-capacity-with-demand-in-general-practice/",
    "https://www.england.nhs.uk/publication/demand-and-capacity-models-core-model/",
    "https://hl7.org/fhir/R4/slot.html",
    "https://hl7.org/fhir/R4/appointment.html",
    "https://www.hl7.org/fhir/schedule.html",
    "https://playwright.dev/docs/best-practices",
    "https://linear.app/docs/triage",
    "https://vercel.com/docs/observability",
    "https://carbondesignsystem.com/components/data-table/usage/",
    "https://service-manual.nhs.uk/design-system/components/table",
  ]) {
    requireCondition(urls.has(url), `EXTERNAL_REFERENCE_MISSING:${url}`);
  }
}

function validateGapLogAndSeams() {
  const gapLog = parseJson(path.join(ROOT, "data", "analysis", "312_capacity_ingestion_gap_log.json"));
  requireCondition(Array.isArray(gapLog.gaps) && gapLog.gaps.length === 2, "GAP_LOG_COUNT_DRIFT");
  const gapIds = new Set(gapLog.gaps.map((entry: { seamId: string }) => entry.seamId));
  requireCondition(
    gapIds.has("PHASE5_INTERFACE_GAP_POLICY_CAPACITY_QUEUE_AND_SLA") &&
      gapIds.has("PHASE5_INTERFACE_GAP_POLICY_CAPACITY_PATIENT_CHOICE_AND_DISCLOSURE"),
    "GAP_LOG_SEAM_IDS_DRIFT",
  );
}

function validateAtlas() {
  const html = read(path.join(ROOT, "docs", "frontend", "312_phase5_policy_tuple_and_capacity_atlas.html"));
  requireCondition(
    html.includes('data-testid="Phase5PolicyCapacityAtlas"'),
    "ATLAS_ROOT_TEST_ID_MISSING",
  );
  requireCondition(
    html.includes('data-visual-mode="Phase5_Policy_Tuple_And_Capacity_Atlas"'),
    "ATLAS_VISUAL_MODE_DRIFT",
  );
  for (const testId of ["CandidateTable", "FormulaParityTable", "SourceAdmissionParityTable", "LedgerParityTable"]) {
    requireCondition(html.includes(`data-testid="${testId}"`), `ATLAS_TABLE_MISSING:${testId}`);
  }
  requireCondition(
    html.includes('data-active-family="routing"') &&
      html.includes('data-active-candidate="candidate_trusted_required_001"'),
    "ATLAS_INITIAL_SELECTION_DRIFT",
  );
}

function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateFormulaManifest();
  validateSchemas();
  validateBoundaryMatrix();
  validateRankContracts();
  validateExternalReferences();
  validateGapLogAndSeams();
  validateAtlas();
  console.log("312 phase5 policy/capacity contracts validation passed.");
}

main();
