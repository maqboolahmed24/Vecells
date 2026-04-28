import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const TASK_ID = "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts";
const CONTRACT_VERSION = "344.phase6.return-status-visibility-freeze.v1";

const REQUIRED_FILES = [
  "docs/architecture/344_phase6_bounce_back_and_visibility_contracts.md",
  "docs/api/344_phase6_return_status_and_visibility_api.md",
  "docs/policy/344_phase6_urgent_return_and_loop_prevention_rules.md",
  "data/contracts/344_phase6_bounce_back_schema.json",
  "data/contracts/344_phase6_patient_status_schema.json",
  "data/contracts/344_phase6_practice_visibility_schema.json",
  "data/contracts/344_phase6_operations_exception_registry.json",
  "data/contracts/344_phase6_projection_registry.json",
  "data/fixtures/344_phase6_bounce_back_examples.json",
  "data/fixtures/344_phase6_patient_status_examples.json",
  "data/fixtures/344_phase6_practice_visibility_examples.json",
  "data/analysis/344_external_reference_notes.json",
  "data/analysis/344_phase6_bounce_back_type_matrix.csv",
  "data/analysis/344_phase6_reopen_priority_matrix.csv",
  "data/analysis/344_phase6_visibility_field_matrix.csv",
  "tools/analysis/build_344_phase6_return_status_and_visibility_contracts.ts",
  "tools/analysis/validate_344_phase6_return_status_and_visibility_contracts.ts",
] as const;

const REQUIRED_SCRIPT =
  '"validate:344-phase6-return-status-and-visibility-contracts": "pnpm exec tsx ./tools/analysis/validate_344_phase6_return_status_and_visibility_contracts.ts"';

const REQUIRED_NOTES_URLS = [
  "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
  "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
  "https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/",
  "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
  "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
  "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
  "https://service-manual.nhs.uk/accessibility/content",
  "https://service-manual.nhs.uk/accessibility/testing",
] as const;

const REQUIRED_BOUNCE_BACK_TYPES = [
  "urgent_gp_return",
  "routine_gp_return",
  "patient_not_contactable",
  "patient_declined",
  "pharmacy_unable_to_complete",
  "referral_expired",
  "safeguarding_concern",
] as const;

const REQUIRED_PATIENT_MACRO_STATES = [
  "choose_or_confirm",
  "action_in_progress",
  "reviewing_next_steps",
  "completed",
  "urgent_action",
] as const;

const REQUIRED_OPERATIONS_EXCEPTION_CLASSES = [
  "discovery_unavailable",
  "no_eligible_providers_returned",
  "dispatch_failed",
  "acknowledgement_missing",
  "outcome_unmatched",
  "no_outcome_within_configured_window",
  "conflicting_outcomes",
  "reachability_repair_required",
  "consent_revoked_after_dispatch",
  "dispatch_proof_stale",
] as const;

const REQUIRED_PROJECTION_NAMES = [
  "pharmacy_active_cases_projection",
  "pharmacy_waiting_for_choice_projection",
  "pharmacy_dispatched_waiting_outcome_projection",
  "pharmacy_bounce_back_projection",
  "pharmacy_dispatch_exception_projection",
  "pharmacy_provider_health_projection",
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

function ensureArrayIncludesAll(actual: readonly string[], expected: readonly string[], context: string): void {
  for (const value of expected) {
    requireCondition(actual.includes(value), `${context}:MISSING:${value}`);
  }
}

function getEnum(schema: any): string[] {
  if (Array.isArray(schema?.enum)) {
    return schema.enum;
  }
  if (Array.isArray(schema?.items?.enum)) {
    return schema.items.enum;
  }
  return [];
}

function validateChecklist(): void {
  requireCondition(checklistStateByNumber(343) === "X", "DEPENDENCY_INCOMPLETE:343");
  requireCondition(["-", "X"].includes(checklistStateByNumber(344)), "TASK_NOT_CLAIMED:344");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

function validatePackageScript(): void {
  requireCondition(
    fs.readFileSync(PACKAGE_JSON_PATH, "utf8").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:344-phase6-return-status-and-visibility-contracts",
  );
}

function validateExternalNotes(): void {
  const notes = readJson<{
    taskId?: string;
    reviewedOn?: string;
    accessedOn?: string;
    localSourceOfTruth?: string[];
    sources?: Array<{ url?: string }>;
  }>("data/analysis/344_external_reference_notes.json");

  requireCondition(notes.taskId === TASK_ID, "EXTERNAL_NOTES_TASK_ID_DRIFT");
  requireCondition(notes.reviewedOn === "2026-04-23", "EXTERNAL_NOTES_REVIEW_DATE_DRIFT");
  requireCondition(notes.accessedOn === "2026-04-23", "EXTERNAL_NOTES_ACCESS_DATE_DRIFT");
  ensureArrayIncludesAll(
    notes.localSourceOfTruth ?? [],
    [
      "blueprint/phase-6-the-pharmacy-loop.md",
      "blueprint/phase-0-the-foundation-protocol.md",
      "blueprint/patient-account-and-communications-blueprint.md",
      "blueprint/staff-operations-and-support-blueprint.md",
      "data/contracts/342_phase6_pharmacy_case_schema.json",
      "data/contracts/343_phase6_outcome_reconciliation_schema.json",
      "data/contracts/343_phase6_outcome_truth_projection_schema.json",
    ],
    "EXTERNAL_NOTES_LOCAL_SOURCE",
  );
  ensureArrayIncludesAll(
    (notes.sources ?? []).map((source) => source.url ?? ""),
    REQUIRED_NOTES_URLS,
    "EXTERNAL_NOTES_URL",
  );
}

function validateBounceBackSchema(): void {
  const schema = readJson<any>("data/contracts/344_phase6_bounce_back_schema.json");

  requireCondition(schema.title === "Phase6BounceBackContracts", "BOUNCE_BACK_SCHEMA_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "BOUNCE_BACK_SCHEMA_TASK_ID_DRIFT");
  requireCondition(schema["x-vecells-contract-version"] === CONTRACT_VERSION, "BOUNCE_BACK_SCHEMA_VERSION_DRIFT");
  ensureArrayIncludesAll(getEnum(schema.properties?.bounceBackTypes), REQUIRED_BOUNCE_BACK_TYPES, "BOUNCE_BACK_SCHEMA_TYPE");
  ensureArrayIncludesAll(
    getEnum(schema.properties?.directUrgentRouteRequiredTypes),
    ["urgent_gp_return", "safeguarding_concern"],
    "BOUNCE_BACK_SCHEMA_DIRECT_ROUTE_TYPE",
  );

  const thresholds = schema.properties?.thresholdFamily?.properties ?? {};
  requireCondition(thresholds.B_loop?.const === 3, "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:B_loop");
  requireCondition(thresholds.tau_loop?.const === 0.65, "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:tau_loop");
  requireCondition(
    thresholds.tau_reopen_secondary?.const === 0.6,
    "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:tau_reopen_secondary",
  );
  requireCondition(
    thresholds.tau_contact_return?.const === 0.7,
    "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:tau_contact_return",
  );
  requireCondition(thresholds.nu_clinical?.const === 0.35, "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:nu_clinical");
  requireCondition(thresholds.nu_contact?.const === 0.2, "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:nu_contact");
  requireCondition(thresholds.nu_provider?.const === 0.15, "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:nu_provider");
  requireCondition(thresholds.nu_consent?.const === 0.15, "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:nu_consent");
  requireCondition(thresholds.nu_timing?.const === 0.15, "BOUNCE_BACK_SCHEMA_THRESHOLD_DRIFT:nu_timing");

  requireCondition(schema.properties?.bounceBackAsWorkflowObjectLaw?.const === true, "BOUNCE_BACK_SCHEMA_WORKFLOW_LAW_DRIFT");
  requireCondition(
    schema.properties?.urgentReturnDistinctFromRoutineLaw?.const === true,
    "BOUNCE_BACK_SCHEMA_DISTINCT_RETURN_LAW_DRIFT",
  );
  requireCondition(
    schema.properties?.timerTruthInferenceForbidden?.const === true,
    "BOUNCE_BACK_SCHEMA_TIMER_LAW_DRIFT",
  );
  requireCondition(
    schema.properties?.calmPostureBlockedByReturnDebt?.const === true,
    "BOUNCE_BACK_SCHEMA_CALM_POSTURE_LAW_DRIFT",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.eventVocabulary),
    [
      "pharmacy.case.bounce_back",
      "pharmacy.return.urgent_activated",
      "pharmacy.return.routine_activated",
      "pharmacy.reachability.plan.refreshed",
      "pharmacy.loop_risk.escalated",
    ],
    "BOUNCE_BACK_SCHEMA_EVENT",
  );

  const algorithm = schema.properties?.algorithm?.properties ?? {};
  requireCondition(
    algorithm.materialChange?.const === "materialChange(b,l) = 1 - product_j (1 - nu_j * delta_j(b,l))",
    "BOUNCE_BACK_SCHEMA_FORMULA_DRIFT:materialChange",
  );
  requireCondition(
    algorithm.loopRisk?.const === "loopRisk(b,l) = min(bounceCount_l / B_loop, 1) * (1 - materialChange(b,l))",
    "BOUNCE_BACK_SCHEMA_FORMULA_DRIFT:loopRisk",
  );
  requireCondition(
    algorithm.reopenSignal?.const === "reopenSignal(b,l) = max(u_urgent(b), u_unable(b), u_contact(b), u_decline(b))",
    "BOUNCE_BACK_SCHEMA_FORMULA_DRIFT:reopenSignal",
  );
  requireCondition(
    algorithm.reopenPriorityBand?.const ===
      "reopenPriorityBand = max(originPriorityBand_l, 3 * 1[u_urgent(b) = 1], 2 * 1[max(u_unable(b), u_contact(b)) >= tau_reopen_secondary], 1 * 1[loopRisk(b,l) >= tau_loop])",
    "BOUNCE_BACK_SCHEMA_FORMULA_DRIFT:reopenPriorityBand",
  );

  const defs = schema.$defs ?? {};
  for (const defName of [
    "PharmacyBounceBackEvidenceEnvelope",
    "UrgentReturnDirectRouteProfile",
    "PharmacyReachabilityPlan",
    "PharmacyBounceBackRecord",
  ]) {
    requireCondition(defs[defName]?.title === defName, `BOUNCE_BACK_SCHEMA_DEF_MISSING:${defName}`);
  }

  ensureArrayIncludesAll(
    defs.PharmacyBounceBackRecord?.required ?? [],
    [
      "bounceBackRecordId",
      "pharmacyCaseRef",
      "bounceBackType",
      "normalizedEvidenceRefs",
      "urgencyCarryFloor",
      "materialChange",
      "loopRisk",
      "reopenSignal",
      "reopenPriorityBand",
      "sourceOutcomeOrDispatchRef",
      "reachabilityDependencyRef",
      "patientInstructionRef",
      "practiceVisibilityRef",
      "supervisorReviewState",
      "createdAt",
      "updatedAt",
    ],
    "BOUNCE_BACK_SCHEMA_RECORD_REQUIRED",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyBounceBackRecord?.properties?.reopenedCaseStatus),
    ["unresolved_returned", "urgent_bounce_back", "no_contact_return_pending"],
    "BOUNCE_BACK_SCHEMA_REOPENED_STATUS",
  );
  ensureArrayIncludesAll(
    getEnum(defs.UrgentReturnDirectRouteProfile?.properties?.routeClass),
    ["dedicated_professional_number", "urgent_care_escalation", "monitored_email_fallback"],
    "BOUNCE_BACK_SCHEMA_ROUTE_CLASS",
  );
  requireCondition(
    defs.UrgentReturnDirectRouteProfile?.properties?.updateRecordForbidden?.const === true,
    "BOUNCE_BACK_SCHEMA_UPDATE_RECORD_FORBIDDEN_DRIFT",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyReachabilityPlan?.properties?.routeAuthorityState),
    ["current", "stale_verification", "stale_demographics", "disputed", "superseded"],
    "BOUNCE_BACK_SCHEMA_ROUTE_AUTHORITY",
  );
}

function validatePatientStatusSchema(): void {
  const schema = readJson<any>("data/contracts/344_phase6_patient_status_schema.json");

  requireCondition(schema.title === "Phase6PatientStatusContracts", "PATIENT_STATUS_SCHEMA_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "PATIENT_STATUS_SCHEMA_TASK_ID_DRIFT");
  requireCondition(schema["x-vecells-contract-version"] === CONTRACT_VERSION, "PATIENT_STATUS_SCHEMA_VERSION_DRIFT");
  ensureArrayIncludesAll(
    getEnum(schema.properties?.patientMacroStates),
    REQUIRED_PATIENT_MACRO_STATES,
    "PATIENT_STATUS_SCHEMA_MACRO_STATE",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.derivationAuthorities),
    [
      "PharmacyCase.status",
      "PharmacyDispatchTruthProjection",
      "PharmacyOutcomeTruthProjection",
      "PharmacyBounceBackRecord",
      "PharmacyReachabilityPlan",
      "ReachabilityAssessmentRecord",
      "IdentityRepairBranchDisposition",
    ],
    "PATIENT_STATUS_SCHEMA_DERIVATION_AUTHORITY",
  );
  requireCondition(
    schema.properties?.completedEligibilityLaw?.const ===
      "settled_resolved_and_no_active_reconciliation_or_return_blockers",
    "PATIENT_STATUS_SCHEMA_COMPLETED_ELIGIBILITY_DRIFT",
  );
  requireCondition(
    schema.properties?.frontendBooleanInferenceForbidden?.const === true,
    "PATIENT_STATUS_SCHEMA_BOOLEAN_INFERENCE_DRIFT",
  );
  requireCondition(schema.properties?.timerInferenceForbidden?.const === true, "PATIENT_STATUS_SCHEMA_TIMER_LAW_DRIFT");
  requireCondition(
    schema.properties?.weakReviewMayNotReuseCalmCopy?.const === true,
    "PATIENT_STATUS_SCHEMA_CALM_COPY_LAW_DRIFT",
  );

  const defs = schema.$defs ?? {};
  requireCondition(
    defs.PharmacyPatientStatusProjection?.title === "PharmacyPatientStatusProjection",
    "PATIENT_STATUS_SCHEMA_DEF_MISSING:PharmacyPatientStatusProjection",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyPatientStatusProjection?.properties?.currentMacroState),
    REQUIRED_PATIENT_MACRO_STATES,
    "PATIENT_STATUS_SCHEMA_PROJECTION_MACRO_STATE",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyPatientStatusProjection?.properties?.staleOrBlockedPosture),
    ["clear", "stale", "blocked", "repair_required", "identity_frozen"],
    "PATIENT_STATUS_SCHEMA_POSTURE",
  );
}

function validatePracticeVisibilitySchema(): void {
  const schema = readJson<any>("data/contracts/344_phase6_practice_visibility_schema.json");

  requireCondition(schema.title === "Phase6PracticeVisibilityContracts", "PRACTICE_VISIBILITY_SCHEMA_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "PRACTICE_VISIBILITY_SCHEMA_TASK_ID_DRIFT");
  requireCondition(
    schema["x-vecells-contract-version"] === CONTRACT_VERSION,
    "PRACTICE_VISIBILITY_SCHEMA_VERSION_DRIFT",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.minimumNecessaryAudienceViews),
    ["summary_only", "clinical_action_required", "operations_attention"],
    "PRACTICE_VISIBILITY_SCHEMA_AUDIENCE_VIEW",
  );
  requireCondition(
    schema.properties?.minimumNecessaryEnforced?.const === true,
    "PRACTICE_VISIBILITY_SCHEMA_MINIMUM_NECESSARY_DRIFT",
  );
  requireCondition(
    schema.properties?.clientSideHidingForbidden?.const === true,
    "PRACTICE_VISIBILITY_SCHEMA_CLIENT_SIDE_HIDING_DRIFT",
  );
  requireCondition(
    schema.properties?.timerTruthInferenceForbidden?.const === true,
    "PRACTICE_VISIBILITY_SCHEMA_TIMER_LAW_DRIFT",
  );
  requireCondition(
    schema.properties?.calmCompletionCopyForbiddenWhileBlocked?.const === true,
    "PRACTICE_VISIBILITY_SCHEMA_CALM_COMPLETION_LAW_DRIFT",
  );

  const defs = schema.$defs ?? {};
  requireCondition(
    defs.PharmacyPracticeVisibilityProjection?.title === "PharmacyPracticeVisibilityProjection",
    "PRACTICE_VISIBILITY_SCHEMA_DEF_MISSING:PharmacyPracticeVisibilityProjection",
  );
  ensureArrayIncludesAll(
    defs.PharmacyPracticeVisibilityProjection?.required ?? [],
    [
      "selectedProviderRef",
      "dispatchTruthProjectionRef",
      "patientStatusProjectionRef",
      "latestOutcomeTruthProjectionRef",
      "latestOutcomeEvidenceRef",
      "gpActionRequiredState",
      "triageReentryState",
      "urgentReturnState",
      "reachabilityRepairState",
      "currentCloseBlockerRefs",
      "minimumNecessaryAudienceView",
    ],
    "PRACTICE_VISIBILITY_SCHEMA_REQUIRED",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyPracticeVisibilityProjection?.properties?.gpActionRequiredState),
    ["none", "routine_review", "urgent_gp_action"],
    "PRACTICE_VISIBILITY_SCHEMA_GP_ACTION",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyPracticeVisibilityProjection?.properties?.triageReentryState),
    ["not_reentered", "reentry_pending", "triage_active"],
    "PRACTICE_VISIBILITY_SCHEMA_TRIAGE_REENTRY",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyPracticeVisibilityProjection?.properties?.urgentReturnState),
    ["none", "routine_return_active", "urgent_return_active"],
    "PRACTICE_VISIBILITY_SCHEMA_URGENT_RETURN_STATE",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyPracticeVisibilityProjection?.properties?.reachabilityRepairState),
    ["not_required", "required", "in_progress"],
    "PRACTICE_VISIBILITY_SCHEMA_REACHABILITY_REPAIR_STATE",
  );
}

function validateOperationsExceptionRegistry(): void {
  const registry = readJson<any>("data/contracts/344_phase6_operations_exception_registry.json");

  requireCondition(registry.taskId === TASK_ID, "OPERATIONS_EXCEPTION_REGISTRY_TASK_ID_DRIFT");
  requireCondition(registry.contractVersion === CONTRACT_VERSION, "OPERATIONS_EXCEPTION_REGISTRY_VERSION_DRIFT");
  requireCondition((registry.topLevelClasses ?? []).length === 10, "OPERATIONS_EXCEPTION_REGISTRY_COUNT_DRIFT");
  ensureArrayIncludesAll(
    registry.topLevelClasses ?? [],
    REQUIRED_OPERATIONS_EXCEPTION_CLASSES,
    "OPERATIONS_EXCEPTION_REGISTRY_CLASS",
  );
  ensureArrayIncludesAll(
    registry.eventVocabulary ?? [],
    [
      "pharmacy.operations_exception.raised",
      "pharmacy.operations_exception.resolved",
      "pharmacy.patient_status.projected",
      "pharmacy.practice_visibility.projected",
    ],
    "OPERATIONS_EXCEPTION_REGISTRY_EVENT",
  );

  for (const exceptionClass of registry.exceptionClasses ?? []) {
    for (const fieldName of [
      "classId",
      "severity",
      "blockerKind",
      "defaultProjection",
      "patientCalmAllowed",
      "supervisorReviewMayBeMandatory",
      "reservedOwnerTask",
    ]) {
      requireCondition(
        Object.prototype.hasOwnProperty.call(exceptionClass, fieldName),
        `OPERATIONS_EXCEPTION_REGISTRY_FIELD_MISSING:${fieldName}`,
      );
    }
  }
}

function validateProjectionRegistry(): void {
  const registry = readJson<any>("data/contracts/344_phase6_projection_registry.json");

  requireCondition(registry.taskId === TASK_ID, "PROJECTION_REGISTRY_TASK_ID_DRIFT");
  requireCondition(registry.contractVersion === CONTRACT_VERSION, "PROJECTION_REGISTRY_VERSION_DRIFT");
  requireCondition((registry.projectionNames ?? []).length === 6, "PROJECTION_REGISTRY_COUNT_DRIFT");
  ensureArrayIncludesAll(registry.projectionNames ?? [], REQUIRED_PROJECTION_NAMES, "PROJECTION_REGISTRY_NAME");

  const supportingTruthProjections = registry.supportingTruthProjections ?? [];
  const patientStatusProjection = supportingTruthProjections.find(
    (projection: any) => projection.projectionName === "PharmacyPatientStatusProjection",
  );
  requireCondition(patientStatusProjection, "PROJECTION_REGISTRY_SUPPORTING_TRUTH_MISSING:PharmacyPatientStatusProjection");
  requireCondition(
    patientStatusProjection.reservedOwnerTask === "351",
    "PROJECTION_REGISTRY_SUPPORTING_TRUTH_OWNER_DRIFT:PharmacyPatientStatusProjection",
  );

  const practiceVisibilityProjection = supportingTruthProjections.find(
    (projection: any) => projection.projectionName === "PharmacyPracticeVisibilityProjection",
  );
  requireCondition(
    practiceVisibilityProjection,
    "PROJECTION_REGISTRY_SUPPORTING_TRUTH_MISSING:PharmacyPracticeVisibilityProjection",
  );
  requireCondition(
    practiceVisibilityProjection.reservedOwnerTask === "354",
    "PROJECTION_REGISTRY_SUPPORTING_TRUTH_OWNER_DRIFT:PharmacyPracticeVisibilityProjection",
  );

  const waitingForChoiceProjection = (registry.projections ?? []).find(
    (projection: any) => projection.projectionName === "pharmacy_waiting_for_choice_projection",
  );
  requireCondition(waitingForChoiceProjection, "PROJECTION_REGISTRY_MISSING:pharmacy_waiting_for_choice_projection");
  ensureArrayIncludesAll(
    waitingForChoiceProjection.requiredSummaryFields ?? [],
    ["visibleChoiceCount", "recommendedFrontierSummary", "warnedChoiceSummary", "staleProofPosture"],
    "PROJECTION_REGISTRY_WAITING_FOR_CHOICE_SUMMARY_FIELD",
  );

  const bounceBackProjection = (registry.projections ?? []).find(
    (projection: any) => projection.projectionName === "pharmacy_bounce_back_projection",
  );
  requireCondition(bounceBackProjection, "PROJECTION_REGISTRY_MISSING:pharmacy_bounce_back_projection");
  requireCondition(
    bounceBackProjection.reservedOwnerTask === "353",
    "PROJECTION_REGISTRY_BOUNCE_BACK_OWNER_DRIFT",
  );

  const providerHealthProjection = (registry.projections ?? []).find(
    (projection: any) => projection.projectionName === "pharmacy_provider_health_projection",
  );
  requireCondition(providerHealthProjection, "PROJECTION_REGISTRY_MISSING:pharmacy_provider_health_projection");
  requireCondition(
    providerHealthProjection.reservedOwnerTask === "355",
    "PROJECTION_REGISTRY_PROVIDER_HEALTH_OWNER_DRIFT",
  );
}

function validateFixtures(): void {
  const bounceBackExamples = readJson<any>("data/fixtures/344_phase6_bounce_back_examples.json");
  requireCondition(bounceBackExamples.taskId === TASK_ID, "BOUNCE_BACK_FIXTURE_TASK_ID_DRIFT");
  requireCondition((bounceBackExamples.scenarios ?? []).length >= 6, "BOUNCE_BACK_FIXTURE_SCENARIO_COUNT_DRIFT");
  ensureArrayIncludesAll(
    (bounceBackExamples.scenarios ?? []).map((scenario: any) => scenario.bounceBackType ?? ""),
    [
      "urgent_gp_return",
      "patient_not_contactable",
      "routine_gp_return",
      "referral_expired",
      "safeguarding_concern",
      "patient_declined",
    ],
    "BOUNCE_BACK_FIXTURE_TYPE",
  );
  requireCondition(
    (bounceBackExamples.scenarios ?? []).some((scenario: any) => scenario.directUrgentRouteRequired === true),
    "BOUNCE_BACK_FIXTURE_DIRECT_URGENT_ROUTE_MISSING",
  );
  requireCondition(
    (bounceBackExamples.scenarios ?? []).some((scenario: any) => scenario.supervisorReviewState === "required"),
    "BOUNCE_BACK_FIXTURE_SUPERVISOR_REVIEW_REQUIRED_MISSING",
  );
  requireCondition(
    (bounceBackExamples.scenarios ?? []).some((scenario: any) => scenario.resultingCaseStatus === "urgent_bounce_back"),
    "BOUNCE_BACK_FIXTURE_URGENT_CASE_STATUS_MISSING",
  );

  const patientStatusExamples = readJson<any>("data/fixtures/344_phase6_patient_status_examples.json");
  requireCondition(patientStatusExamples.taskId === TASK_ID, "PATIENT_STATUS_FIXTURE_TASK_ID_DRIFT");
  requireCondition((patientStatusExamples.scenarios ?? []).length >= 6, "PATIENT_STATUS_FIXTURE_SCENARIO_COUNT_DRIFT");
  ensureArrayIncludesAll(
    (patientStatusExamples.scenarios ?? []).map((scenario: any) => scenario.currentMacroState ?? ""),
    REQUIRED_PATIENT_MACRO_STATES,
    "PATIENT_STATUS_FIXTURE_MACRO_STATE",
  );
  const completedScenario = (patientStatusExamples.scenarios ?? []).find(
    (scenario: any) => scenario.currentMacroState === "completed",
  );
  requireCondition(completedScenario?.calmCopyAllowed === true, "PATIENT_STATUS_FIXTURE_COMPLETED_CALM_COPY_DRIFT");
  requireCondition(
    (patientStatusExamples.scenarios ?? []).some(
      (scenario: any) =>
        (scenario.currentMacroState === "reviewing_next_steps" || scenario.currentMacroState === "urgent_action") &&
        scenario.calmCopyAllowed === false,
    ),
    "PATIENT_STATUS_FIXTURE_REVIEW_OR_URGENT_CALM_COPY_DRIFT",
  );

  const practiceVisibilityExamples = readJson<any>("data/fixtures/344_phase6_practice_visibility_examples.json");
  requireCondition(practiceVisibilityExamples.taskId === TASK_ID, "PRACTICE_VISIBILITY_FIXTURE_TASK_ID_DRIFT");
  requireCondition((practiceVisibilityExamples.scenarios ?? []).length >= 4, "PRACTICE_VISIBILITY_FIXTURE_SCENARIO_COUNT_DRIFT");
  ensureArrayIncludesAll(
    (practiceVisibilityExamples.scenarios ?? []).map((scenario: any) => scenario.urgentReturnState ?? ""),
    ["none", "urgent_return_active", "routine_return_active"],
    "PRACTICE_VISIBILITY_FIXTURE_URGENT_RETURN_STATE",
  );
  ensureArrayIncludesAll(
    (practiceVisibilityExamples.scenarios ?? []).map((scenario: any) => scenario.minimumNecessaryAudienceView ?? ""),
    ["summary_only", "clinical_action_required", "operations_attention"],
    "PRACTICE_VISIBILITY_FIXTURE_AUDIENCE_VIEW",
  );
  requireCondition(
    (practiceVisibilityExamples.scenarios ?? []).every(
      (scenario: any) =>
        !Array.isArray(scenario.currentCloseBlockers) ||
        scenario.currentCloseBlockers.length === 0 ||
        scenario.calmCopyAllowed === false,
    ),
    "PRACTICE_VISIBILITY_FIXTURE_BLOCKER_CALM_COPY_DRIFT",
  );
}

function validateMatrices(): void {
  const bounceBackTypeRows = parseCsv("data/analysis/344_phase6_bounce_back_type_matrix.csv");
  requireCondition(bounceBackTypeRows.length === 7, "BOUNCE_BACK_TYPE_MATRIX_ROW_COUNT_DRIFT");
  ensureArrayIncludesAll(
    bounceBackTypeRows.map((row) => row.bounceBackType ?? ""),
    REQUIRED_BOUNCE_BACK_TYPES,
    "BOUNCE_BACK_TYPE_MATRIX_TYPE",
  );

  const reopenPriorityRows = parseCsv("data/analysis/344_phase6_reopen_priority_matrix.csv");
  requireCondition(reopenPriorityRows.length === 5, "REOPEN_PRIORITY_MATRIX_ROW_COUNT_DRIFT");
  ensureArrayIncludesAll(
    reopenPriorityRows.map((row) => row.scenarioId ?? ""),
    ["PH6_REOPEN_001", "PH6_REOPEN_002", "PH6_REOPEN_003", "PH6_REOPEN_004", "PH6_REOPEN_005"],
    "REOPEN_PRIORITY_MATRIX_SCENARIO",
  );

  const visibilityRows = parseCsv("data/analysis/344_phase6_visibility_field_matrix.csv");
  requireCondition(visibilityRows.length === 3, "VISIBILITY_FIELD_MATRIX_ROW_COUNT_DRIFT");
  ensureArrayIncludesAll(
    visibilityRows.map((row) => row.audienceFamily ?? ""),
    ["patient", "practice", "operations"],
    "VISIBILITY_FIELD_MATRIX_AUDIENCE_FAMILY",
  );
}

function validateDocs(): void {
  const architectureDoc = read("docs/architecture/344_phase6_bounce_back_and_visibility_contracts.md");
  for (const section of [
    "## Why 344 exists",
    "## Bounce-back and reachability boundary",
    "## Patient status boundary",
    "## Practice visibility and operations boundary",
    "## Cross-surface laws",
    "## Reserved later-owned interfaces",
  ]) {
    requireCondition(architectureDoc.includes(section), `ARCHITECTURE_DOC_SECTION_MISSING:${section}`);
  }
  for (const taskNumber of ["351", "353", "354", "355", "361", "362"]) {
    requireCondition(architectureDoc.includes(taskNumber), `ARCHITECTURE_DOC_TASK_MISSING:${taskNumber}`);
  }

  const apiDoc = read("docs/api/344_phase6_return_status_and_visibility_api.md");
  for (const section of [
    "## Return and reopen commands",
    "## Patient status and practice visibility queries",
    "## Operations exception and projection surfaces",
    "## Failure-class law",
    "## Idempotency and blocker rules",
  ]) {
    requireCondition(apiDoc.includes(section), `API_DOC_SECTION_MISSING:${section}`);
  }

  const policyDoc = read("docs/policy/344_phase6_urgent_return_and_loop_prevention_rules.md");
  for (const section of [
    "## Urgent return law",
    "## Loop prevention law",
    "## Patient calmness law",
    "## Minimum-necessary visibility law",
    "## Explicit prohibitions",
  ]) {
    requireCondition(policyDoc.includes(section), `POLICY_DOC_SECTION_MISSING:${section}`);
  }
}

function main(): void {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  validateExternalNotes();
  validateBounceBackSchema();
  validatePatientStatusSchema();
  validatePracticeVisibilitySchema();
  validateOperationsExceptionRegistry();
  validateProjectionRegistry();
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
        validatedBounceBackTypes: REQUIRED_BOUNCE_BACK_TYPES.length,
        validatedPatientMacroStates: REQUIRED_PATIENT_MACRO_STATES.length,
        validatedOperationsExceptionClasses: REQUIRED_OPERATIONS_EXCEPTION_CLASSES.length,
        validatedProjectionNames: REQUIRED_PROJECTION_NAMES.length,
      },
      null,
      2,
    ),
  );
}

main();
