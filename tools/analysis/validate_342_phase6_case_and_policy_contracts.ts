import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const REQUIRED_FILES = [
  "docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md",
  "docs/api/342_phase6_pharmacy_case_and_rules_api.md",
  "docs/policy/342_phase6_rule_pack_change_control.md",
  "data/contracts/342_phase6_pharmacy_case_schema.json",
  "data/contracts/342_phase6_case_state_machine.yaml",
  "data/contracts/342_phase6_event_registry.json",
  "data/contracts/342_phase6_api_surface.yaml",
  "data/contracts/342_phase6_rule_pack_schema.json",
  "data/contracts/342_phase6_pathway_registry.json",
  "data/contracts/342_phase6_threshold_family_registry.json",
  "data/contracts/342_phase6_explanation_bundle_schema.json",
  "data/fixtures/342_phase6_rule_pack_example.json",
  "data/fixtures/342_phase6_case_transition_examples.json",
  "data/analysis/342_external_reference_notes.json",
  "data/analysis/342_phase6_state_transition_matrix.csv",
  "data/analysis/342_phase6_pathway_decision_table.csv",
  "tools/analysis/build_342_phase6_case_and_policy_contracts.ts",
  "tools/analysis/validate_342_phase6_case_and_policy_contracts.ts",
] as const;

const REQUIRED_SCRIPT =
  '"validate:342-phase6-case-and-policy-contracts": "pnpm exec tsx ./tools/analysis/validate_342_phase6_case_and_policy_contracts.ts"';

const TASK_ID = "seq_342_phase6_freeze_pharmacy_case_model_eligibility_and_policy_pack_contracts";
const CONTRACT_VERSION = "342.phase6.pharmacy-case-policy-freeze.v1";

const REQUIRED_CASE_FIELDS = [
  "pharmacyCaseId",
  "episodeRef",
  "originRequestId",
  "requestLineageRef",
  "lineageCaseLinkRef",
  "originTaskId",
  "pharmacyIntentId",
  "sourceDecisionEpochRef",
  "sourceDecisionSupersessionRef",
  "patientRef",
  "tenantId",
  "serviceType",
  "candidatePathway",
  "eligibilityRef",
  "choiceSessionRef",
  "selectedProviderRef",
  "activeConsentRef",
  "activeConsentCheckpointRef",
  "latestConsentRevocationRef",
  "activeDispatchAttemptRef",
  "correlationRef",
  "outcomeRef",
  "bounceBackRef",
  "leaseRef",
  "ownershipEpoch",
  "staleOwnerRecoveryRef",
  "lineageFenceRef",
  "currentConfirmationGateRefs",
  "currentClosureBlockerRefs",
  "activeReachabilityDependencyRefs",
  "activeIdentityRepairCaseRef",
  "identityRepairBranchDispositionRef",
  "identityRepairReleaseSettlementRef",
  "status",
  "slaTargetAt",
  "createdAt",
  "updatedAt",
] as const;

const REQUIRED_STATUS_VALUES = [
  "candidate_received",
  "rules_evaluating",
  "ineligible_returned",
  "eligible_choice_pending",
  "provider_selected",
  "consent_pending",
  "package_ready",
  "dispatch_pending",
  "referred",
  "consultation_outcome_pending",
  "outcome_reconciliation_pending",
  "resolved_by_pharmacy",
  "unresolved_returned",
  "urgent_bounce_back",
  "no_contact_return_pending",
  "closed",
] as const;

const REQUIRED_TRANSITIONS = [
  ["candidate_received", "rules_evaluating"],
  ["rules_evaluating", "ineligible_returned"],
  ["rules_evaluating", "eligible_choice_pending"],
  ["eligible_choice_pending", "provider_selected"],
  ["provider_selected", "consent_pending"],
  ["provider_selected", "package_ready"],
  ["consent_pending", "package_ready"],
  ["package_ready", "consent_pending"],
  ["package_ready", "dispatch_pending"],
  ["dispatch_pending", "referred"],
  ["referred", "consultation_outcome_pending"],
  ["consultation_outcome_pending", "resolved_by_pharmacy"],
  ["consultation_outcome_pending", "unresolved_returned"],
  ["consultation_outcome_pending", "urgent_bounce_back"],
  ["consultation_outcome_pending", "no_contact_return_pending"],
  ["consultation_outcome_pending", "outcome_reconciliation_pending"],
  ["outcome_reconciliation_pending", "resolved_by_pharmacy"],
  ["outcome_reconciliation_pending", "unresolved_returned"],
  ["outcome_reconciliation_pending", "urgent_bounce_back"],
  ["outcome_reconciliation_pending", "no_contact_return_pending"],
  ["resolved_by_pharmacy", "closed"],
] as const;

const REQUIRED_EVENT_NAMES = [
  "pharmacy.case.created",
  "pharmacy.service_type.resolved",
  "pharmacy.pathway.evaluated",
  "pharmacy.choice.session.created",
  "pharmacy.provider.selected",
  "pharmacy.consent.checkpoint.updated",
  "pharmacy.package.composed",
  "pharmacy.dispatch.started",
  "pharmacy.dispatch.confirmed",
  "pharmacy.dispatch.proof_missing",
  "pharmacy.consent.revoked",
  "pharmacy.consent.revocation.recorded",
  "pharmacy.outcome.received",
  "pharmacy.outcome.reconciled",
  "pharmacy.reachability.blocked",
  "pharmacy.reachability.repaired",
  "pharmacy.case.resolved",
  "pharmacy.case.bounce_back",
  "pharmacy.case.reopened",
  "pharmacy.case.closed",
] as const;

const REQUIRED_API_PATHS = [
  "POST /v1/pharmacy/cases",
  "GET /v1/pharmacy/cases/{pharmacyCaseId}",
  "POST /v1/pharmacy/cases/{pharmacyCaseId}:evaluate",
  "POST /v1/pharmacy/cases/{pharmacyCaseId}:choose-provider",
  "POST /v1/pharmacy/cases/{pharmacyCaseId}:dispatch",
  "POST /v1/pharmacy/cases/{pharmacyCaseId}:capture-outcome",
  "POST /v1/pharmacy/cases/{pharmacyCaseId}:reopen",
  "POST /v1/pharmacy/cases/{pharmacyCaseId}:close",
] as const;

const REQUIRED_PATHWAYS = [
  "uncomplicated_uti_female_16_64",
  "impetigo_1_plus",
  "infected_insect_bites_1_plus",
  "acute_sore_throat_5_plus",
  "acute_sinusitis_12_plus",
  "shingles_18_plus",
  "acute_otitis_media_1_17",
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

const REQUIRED_NOTES_URLS = [
  "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/",
  "https://www.england.nhs.uk/long-read/launch-of-nhs-pharmacy-first-advanced-service/",
  "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
  "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
  "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
] as const;

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  const filePath = path.join(ROOT, relativePath);
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function parseCsv(relativePath: string): Record<string, string>[] {
  const text = read(relativePath).trim();
  requireCondition(text.length > 0, `CSV_EMPTY:${relativePath}`);
  const lines = text.split(/\r?\n/).filter(Boolean);
  requireCondition(lines.length >= 2, `CSV_MISSING_ROWS:${relativePath}`);

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
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
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function checklistStateByNumber(taskNumber: number): string {
  const checklist = fs.readFileSync(CHECKLIST_PATH, "utf8");
  const match = checklist.match(new RegExp(`^- \\[([ Xx-])\\] (?:seq|par)_${taskNumber}(?:_|\\b)`, "m"));
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskNumber}`);
  return match[1]!.toUpperCase();
}

function ensureArrayIncludesAll(actual: string[], expected: readonly string[], context: string): void {
  for (const value of expected) {
    requireCondition(actual.includes(value), `${context}:MISSING:${value}`);
  }
}

function validateChecklist(): void {
  requireCondition(checklistStateByNumber(341) === "X", "DEPENDENCY_INCOMPLETE:341");
  requireCondition(["-", "X"].includes(checklistStateByNumber(342)), "TASK_NOT_CLAIMED:342");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

function validatePackageScript(): void {
  requireCondition(
    fs.readFileSync(PACKAGE_JSON_PATH, "utf8").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:342-phase6-case-and-policy-contracts",
  );
}

function validateExternalNotes(): void {
  const notes = readJson<{
    taskId?: string;
    reviewedOn?: string;
    accessedOn?: string;
    localSourceOfTruth?: string[];
    sources?: Array<{ url?: string }>;
  }>("data/analysis/342_external_reference_notes.json");

  requireCondition(notes.taskId === TASK_ID, "EXTERNAL_NOTES_TASK_ID_DRIFT");
  requireCondition(notes.reviewedOn === "2026-04-23", "EXTERNAL_NOTES_REVIEW_DATE_DRIFT");
  requireCondition(notes.accessedOn === "2026-04-23", "EXTERNAL_NOTES_ACCESS_DATE_DRIFT");
  ensureArrayIncludesAll(
    notes.localSourceOfTruth ?? [],
    [
      "blueprint/phase-6-the-pharmacy-loop.md",
      "data/contracts/341_phase5_to_phase6_handoff_contract.json",
      "data/launchpacks/341_phase6_seed_packet_342.json",
    ],
    "EXTERNAL_NOTES_LOCAL_SOURCE",
  );
  const urls = (notes.sources ?? []).map((source) => source.url ?? "");
  ensureArrayIncludesAll(urls, REQUIRED_NOTES_URLS, "EXTERNAL_NOTES_URL");
}

function validateCaseSchema(): void {
  const schema = readJson<{
    title?: string;
    required?: string[];
    properties?: Record<string, any>;
    $defs?: Record<string, any>;
    ["x-vecells-task-id"]?: string;
    ["x-vecells-contract-version"]?: string;
  }>("data/contracts/342_phase6_pharmacy_case_schema.json");

  requireCondition(schema.title === "PharmacyCase", "CASE_SCHEMA_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "CASE_SCHEMA_TASK_ID_DRIFT");
  requireCondition(schema["x-vecells-contract-version"] === CONTRACT_VERSION, "CASE_SCHEMA_VERSION_DRIFT");
  ensureArrayIncludesAll(schema.required ?? [], REQUIRED_CASE_FIELDS, "CASE_SCHEMA_REQUIRED_FIELD");

  const statusEnum = schema.properties?.status?.enum;
  requireCondition(Array.isArray(statusEnum), "CASE_SCHEMA_STATUS_ENUM_MISSING");
  ensureArrayIncludesAll(statusEnum, REQUIRED_STATUS_VALUES, "CASE_SCHEMA_STATUS");

  for (const fieldName of ["pharmacyCaseId", "choiceSessionRef", "status"]) {
    const field = schema.properties?.[fieldName];
    requireCondition(field, `CASE_SCHEMA_FIELD_MISSING:${fieldName}`);
    requireCondition(field["x-vecells-mutability"], `CASE_SCHEMA_FIELD_MUTABILITY_MISSING:${fieldName}`);
    requireCondition(field["x-vecells-owner-task"], `CASE_SCHEMA_FIELD_OWNER_MISSING:${fieldName}`);
    requireCondition(field["x-vecells-source-section"], `CASE_SCHEMA_FIELD_SOURCE_MISSING:${fieldName}`);
    requireCondition(
      Array.isArray(field["x-vecells-downstream-dependents"]),
      `CASE_SCHEMA_FIELD_DEPENDENTS_MISSING:${fieldName}`,
    );
  }

  const defs = schema.$defs ?? {};
  requireCondition(defs.ServiceTypeDecision?.title === "ServiceTypeDecision", "CASE_SCHEMA_SERVICE_TYPE_DEF_MISSING");
  requireCondition(
    defs.PathwayEligibilityEvaluation?.title === "PathwayEligibilityEvaluation",
    "CASE_SCHEMA_ELIGIBILITY_DEF_MISSING",
  );
  ensureArrayIncludesAll(
    defs.PathwayEligibilityEvaluation?.required ?? [],
    [
      "evaluationId",
      "pharmacyCaseRef",
      "rulePackRef",
      "pathwayCode",
      "evaluatedPathways",
      "matchedRuleIds",
      "thresholdSnapshot",
      "rulePackVersion",
      "pathwayExclusionScore",
      "globalExclusionScore",
      "finalDisposition",
      "explanationBundleRef",
    ],
    "CASE_SCHEMA_ELIGIBILITY_REQUIRED",
  );
}

function validateRulePackSchema(): void {
  const schema = readJson<{
    title?: string;
    properties?: Record<string, any>;
    $defs?: Record<string, any>;
    ["x-vecells-in-place-mutation-forbidden"]?: boolean;
    ["x-vecells-golden-case-regression-required"]?: boolean;
  }>("data/contracts/342_phase6_rule_pack_schema.json");

  requireCondition(schema.title === "PharmacyRulePack", "RULE_PACK_SCHEMA_TITLE_DRIFT");
  requireCondition(schema["x-vecells-in-place-mutation-forbidden"] === true, "RULE_PACK_IN_PLACE_FLAG_DRIFT");
  requireCondition(
    schema["x-vecells-golden-case-regression-required"] === true,
    "RULE_PACK_GOLDEN_CASE_FLAG_DRIFT",
  );

  const promotionPolicy = schema.properties?.promotionPolicy;
  requireCondition(promotionPolicy, "RULE_PACK_PROMOTION_POLICY_MISSING");
  requireCondition(
    promotionPolicy.properties?.goldenCaseRegressionRequired?.const === true,
    "RULE_PACK_PROMOTION_GOLDEN_CASE_DRIFT",
  );
  requireCondition(
    promotionPolicy.properties?.hazardTraceabilityRequired?.const === true,
    "RULE_PACK_PROMOTION_HAZARD_DRIFT",
  );
  requireCondition(
    promotionPolicy.properties?.inPlaceMutationForbidden?.const === true,
    "RULE_PACK_PROMOTION_MUTATION_DRIFT",
  );

  const defs = schema.$defs ?? {};
  requireCondition(defs.PathwayDefinition?.title === "PathwayDefinition", "RULE_PACK_PATHWAY_DEF_MISSING");
  requireCondition(
    defs.PathwayTimingGuardrail?.title === "PathwayTimingGuardrail",
    "RULE_PACK_GUARDRAIL_DEF_MISSING",
  );
  ensureArrayIncludesAll(
    defs.PathwayDefinition?.required ?? [],
    [
      "pathwayCode",
      "displayName",
      "ageSexGate",
      "requiredSymptoms",
      "requiredSymptomWeights",
      "exclusionRules",
      "redFlagRules",
      "minorIllnessFallbackRules",
      "timingGuardrailRef",
      "allowedEscalationModes",
      "supplyModes",
    ],
    "RULE_PACK_PATHWAY_REQUIRED",
  );
}

function validateExplanationBundleSchema(): void {
  const schema = readJson<{
    title?: string;
    required?: string[];
    properties?: Record<string, any>;
  }>("data/contracts/342_phase6_explanation_bundle_schema.json");

  requireCondition(schema.title === "EligibilityExplanationBundle", "EXPLANATION_SCHEMA_TITLE_DRIFT");
  ensureArrayIncludesAll(
    schema.required ?? [],
    [
      "patientFacingReason",
      "staffFacingReason",
      "matchedRules",
      "nextBestEndpointSuggestion",
      "sharedEvidenceHash",
    ],
    "EXPLANATION_SCHEMA_REQUIRED",
  );
  requireCondition(schema.properties?.patientFacingReason, "EXPLANATION_SCHEMA_PATIENT_REASON_MISSING");
  requireCondition(schema.properties?.staffFacingReason, "EXPLANATION_SCHEMA_STAFF_REASON_MISSING");
}

function validateStateMachine(): void {
  const stateMachine = readJson<{
    taskId?: string;
    contractVersion?: string;
    aggregate?: string;
    closureAuthority?: string;
    states?: Array<{ stateId?: string }>;
    transitions?: Array<{ from?: string; to?: string }>;
  }>("data/contracts/342_phase6_case_state_machine.yaml");

  requireCondition(stateMachine.taskId === TASK_ID, "STATE_MACHINE_TASK_ID_DRIFT");
  requireCondition(stateMachine.contractVersion === CONTRACT_VERSION, "STATE_MACHINE_VERSION_DRIFT");
  requireCondition(stateMachine.aggregate === "PharmacyCase", "STATE_MACHINE_AGGREGATE_DRIFT");
  requireCondition(stateMachine.closureAuthority === "LifecycleCoordinator", "STATE_MACHINE_CLOSURE_AUTHORITY_DRIFT");
  requireCondition((stateMachine.states ?? []).length === 16, "STATE_MACHINE_STATE_COUNT_DRIFT");
  requireCondition((stateMachine.transitions ?? []).length === 21, "STATE_MACHINE_TRANSITION_COUNT_DRIFT");

  const states = (stateMachine.states ?? []).map((state) => state.stateId ?? "");
  ensureArrayIncludesAll(states, REQUIRED_STATUS_VALUES, "STATE_MACHINE_STATE");

  const actualTransitions = new Set(
    (stateMachine.transitions ?? []).map((transition) => `${transition.from ?? ""}->${transition.to ?? ""}`),
  );
  for (const [from, to] of REQUIRED_TRANSITIONS) {
    requireCondition(actualTransitions.has(`${from}->${to}`), `STATE_MACHINE_TRANSITION_MISSING:${from}->${to}`);
  }
}

function validateEventRegistry(): void {
  const registry = readJson<{
    taskId?: string;
    contractVersion?: string;
    events?: Array<{ eventName?: string }>;
  }>("data/contracts/342_phase6_event_registry.json");

  requireCondition(registry.taskId === TASK_ID, "EVENT_REGISTRY_TASK_ID_DRIFT");
  requireCondition(registry.contractVersion === CONTRACT_VERSION, "EVENT_REGISTRY_VERSION_DRIFT");
  requireCondition((registry.events ?? []).length === 20, "EVENT_REGISTRY_COUNT_DRIFT");
  const eventNames = (registry.events ?? []).map((event) => event.eventName ?? "");
  ensureArrayIncludesAll(eventNames, REQUIRED_EVENT_NAMES, "EVENT_REGISTRY_EVENT");
}

function validateApiSurface(): void {
  const apiSurface = readJson<{
    taskId?: string;
    contractVersion?: string;
    commandSurfaces?: Array<Record<string, unknown> & { method?: string; path?: string }>;
  }>("data/contracts/342_phase6_api_surface.yaml");

  requireCondition(apiSurface.taskId === TASK_ID, "API_SURFACE_TASK_ID_DRIFT");
  requireCondition(apiSurface.contractVersion === CONTRACT_VERSION, "API_SURFACE_VERSION_DRIFT");
  requireCondition((apiSurface.commandSurfaces ?? []).length === 8, "API_SURFACE_COUNT_DRIFT");

  const routes = (apiSurface.commandSurfaces ?? []).map(
    (command) => `${String(command.method ?? "")} ${String(command.path ?? "")}`,
  );
  ensureArrayIncludesAll(routes, REQUIRED_API_PATHS, "API_SURFACE_ROUTE");

  for (const command of apiSurface.commandSurfaces ?? []) {
    requireCondition(Array.isArray(command.statePreconditions), `API_SURFACE_PRECONDITIONS_MISSING:${command.path}`);
    requireCondition(Array.isArray(command.stateExits), `API_SURFACE_EXITS_MISSING:${command.path}`);
    requireCondition(command.idempotencyExpectation, `API_SURFACE_IDEMPOTENCY_MISSING:${command.path}`);
    requireCondition(Array.isArray(command.failureClasses), `API_SURFACE_FAILURES_MISSING:${command.path}`);
    requireCondition(Array.isArray(command.lineageAndLeaseChecks), `API_SURFACE_LEASE_CHECKS_MISSING:${command.path}`);
    requireCondition(command.staleWriteBehavior, `API_SURFACE_STALE_WRITE_MISSING:${command.path}`);
    requireCondition(Array.isArray(command.auditAppends), `API_SURFACE_AUDIT_MISSING:${command.path}`);
  }
}

function validatePathwayRegistry(): void {
  const registry = readJson<{
    taskId?: string;
    serviceLanes?: Array<{ laneId?: string }>;
    pathways?: Array<{ pathwayCode?: string }>;
    minorIllnessFallback?: { entryCondition?: string; prohibitedBypass?: string };
  }>("data/contracts/342_phase6_pathway_registry.json");

  requireCondition(registry.taskId === TASK_ID, "PATHWAY_REGISTRY_TASK_ID_DRIFT");
  requireCondition((registry.serviceLanes ?? []).length === 2, "PATHWAY_REGISTRY_SERVICE_LANE_COUNT_DRIFT");
  const laneIds = (registry.serviceLanes ?? []).map((lane) => lane.laneId ?? "");
  ensureArrayIncludesAll(laneIds, ["clinical_pathway_consultation", "minor_illness_fallback"], "PATHWAY_REGISTRY_LANE");

  requireCondition((registry.pathways ?? []).length === 7, "PATHWAY_REGISTRY_PATHWAY_COUNT_DRIFT");
  const pathwayCodes = (registry.pathways ?? []).map((pathway) => pathway.pathwayCode ?? "");
  ensureArrayIncludesAll(pathwayCodes, REQUIRED_PATHWAYS, "PATHWAY_REGISTRY_PATHWAY");

  requireCondition(registry.minorIllnessFallback?.entryCondition, "PATHWAY_REGISTRY_FALLBACK_ENTRY_MISSING");
  requireCondition(registry.minorIllnessFallback?.prohibitedBypass, "PATHWAY_REGISTRY_FALLBACK_BYPASS_MISSING");
}

function validateThresholdRegistry(): void {
  const registry = readJson<{
    taskId?: string;
    thresholdFamilies?: Array<{ thresholdId?: string }>;
    replayLaw?: {
      activePacksImmutable?: boolean;
      inPlaceMutationForbidden?: boolean;
      effectiveDatingRequired?: boolean;
      historicalReplayRequired?: boolean;
      goldenCaseRegressionRequired?: boolean;
    };
  }>("data/contracts/342_phase6_threshold_family_registry.json");

  requireCondition(registry.taskId === TASK_ID, "THRESHOLD_REGISTRY_TASK_ID_DRIFT");
  requireCondition((registry.thresholdFamilies ?? []).length === 12, "THRESHOLD_REGISTRY_COUNT_DRIFT");
  const thresholdIds = (registry.thresholdFamilies ?? []).map((threshold) => threshold.thresholdId ?? "");
  ensureArrayIncludesAll(thresholdIds, REQUIRED_THRESHOLDS, "THRESHOLD_REGISTRY_THRESHOLD");
  requireCondition(registry.replayLaw?.activePacksImmutable === true, "THRESHOLD_REPLAY_IMMUTABLE_DRIFT");
  requireCondition(registry.replayLaw?.inPlaceMutationForbidden === true, "THRESHOLD_REPLAY_MUTATION_DRIFT");
  requireCondition(registry.replayLaw?.effectiveDatingRequired === true, "THRESHOLD_REPLAY_EFFECTIVE_DATING_DRIFT");
  requireCondition(registry.replayLaw?.historicalReplayRequired === true, "THRESHOLD_REPLAY_HISTORY_DRIFT");
  requireCondition(
    registry.replayLaw?.goldenCaseRegressionRequired === true,
    "THRESHOLD_REPLAY_GOLDEN_CASE_DRIFT",
  );
}

function validateFixtures(): void {
  const packFixture = readJson<{
    taskId?: string;
    examplePack?: {
      pathwayDefinitions?: Array<Record<string, unknown>>;
      displayTextRefs?: string[];
      promotionPolicy?: Record<string, unknown>;
    };
  }>("data/fixtures/342_phase6_rule_pack_example.json");

  requireCondition(packFixture.taskId === TASK_ID, "RULE_PACK_FIXTURE_TASK_ID_DRIFT");
  requireCondition((packFixture.examplePack?.pathwayDefinitions ?? []).length === 7, "RULE_PACK_FIXTURE_PATHWAY_COUNT_DRIFT");
  requireCondition(
    (packFixture.examplePack?.displayTextRefs ?? []).length > 0,
    "RULE_PACK_FIXTURE_DISPLAY_TEXT_REFS_MISSING",
  );
  requireCondition(packFixture.examplePack?.promotionPolicy, "RULE_PACK_FIXTURE_PROMOTION_POLICY_MISSING");

  for (const pathway of packFixture.examplePack?.pathwayDefinitions ?? []) {
    requireCondition(pathway.timingGuardrailRef, "RULE_PACK_FIXTURE_GUARDRAIL_REF_MISSING");
  }

  const transitionsFixture = readJson<{
    taskId?: string;
    scenarios?: Array<{ scenarioId?: string }>;
  }>("data/fixtures/342_phase6_case_transition_examples.json");
  requireCondition(transitionsFixture.taskId === TASK_ID, "TRANSITION_FIXTURE_TASK_ID_DRIFT");
  requireCondition((transitionsFixture.scenarios ?? []).length >= 5, "TRANSITION_FIXTURE_SCENARIO_COUNT_DRIFT");
}

function validateMatrices(): void {
  const transitionRows = parseCsv("data/analysis/342_phase6_state_transition_matrix.csv");
  requireCondition(transitionRows.length === 21, "TRANSITION_MATRIX_ROW_COUNT_DRIFT");

  const actualTransitions = new Set(
    transitionRows.map((row) => `${row.fromState ?? ""}->${row.toState ?? ""}`),
  );
  for (const [from, to] of REQUIRED_TRANSITIONS) {
    requireCondition(actualTransitions.has(`${from}->${to}`), `TRANSITION_MATRIX_MISSING:${from}->${to}`);
  }

  const decisionRows = parseCsv("data/analysis/342_phase6_pathway_decision_table.csv");
  requireCondition(decisionRows.length === 6, "DECISION_TABLE_ROW_COUNT_DRIFT");
  ensureArrayIncludesAll(
    decisionRows.map((row) => row.scenarioId ?? ""),
    [
      "PH6_DECISION_001",
      "PH6_DECISION_002",
      "PH6_DECISION_003",
      "PH6_DECISION_004",
      "PH6_DECISION_005",
      "PH6_DECISION_006",
    ],
    "DECISION_TABLE_SCENARIO",
  );
}

function validateDocs(): void {
  const architecture = read("docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md");
  requireCondition(architecture.includes("## Aggregate boundary"), "ARCHITECTURE_DOC_SECTION_MISSING:Aggregate boundary");
  requireCondition(
    architecture.includes("## Canonical PharmacyCase state machine"),
    "ARCHITECTURE_DOC_SECTION_MISSING:Canonical PharmacyCase state machine",
  );
  requireCondition(
    architecture.includes("## Reserved later-owned interfaces"),
    "ARCHITECTURE_DOC_SECTION_MISSING:Reserved later-owned interfaces",
  );

  const apiDoc = read("docs/api/342_phase6_pharmacy_case_and_rules_api.md");
  requireCondition(apiDoc.includes("## Command surface"), "API_DOC_SECTION_MISSING:Command surface");
  requireCondition(apiDoc.includes("## Failure-class law"), "API_DOC_SECTION_MISSING:Failure-class law");

  const policyDoc = read("docs/policy/342_phase6_rule_pack_change_control.md");
  requireCondition(policyDoc.includes("## Promotion law"), "POLICY_DOC_SECTION_MISSING:Promotion law");
  requireCondition(policyDoc.includes("## Retirement law"), "POLICY_DOC_SECTION_MISSING:Retirement law");
}

function main(): void {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  validateExternalNotes();
  validateCaseSchema();
  validateRulePackSchema();
  validateExplanationBundleSchema();
  validateStateMachine();
  validateEventRegistry();
  validateApiSurface();
  validatePathwayRegistry();
  validateThresholdRegistry();
  validateFixtures();
  validateMatrices();
  validateDocs();
  console.log(
    JSON.stringify(
      {
        ok: true,
        taskId: TASK_ID,
        contractVersion: CONTRACT_VERSION,
        validatedFiles: REQUIRED_FILES.length,
        validatedTransitions: REQUIRED_TRANSITIONS.length,
        validatedEvents: REQUIRED_EVENT_NAMES.length,
      },
      null,
      2,
    ),
  );
}

main();
