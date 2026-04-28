import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const TASK_ID = "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts";
const CONTRACT_VERSION = "343.phase6.discovery-dispatch-outcome-freeze.v1";

const REQUIRED_FILES = [
  "docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md",
  "docs/api/343_phase6_discovery_choice_dispatch_outcome_api.md",
  "docs/policy/343_phase6_provider_choice_and_dispatch_truth_rules.md",
  "data/contracts/343_phase6_directory_choice_schema.json",
  "data/contracts/343_phase6_dispatch_schema.json",
  "data/contracts/343_phase6_transport_assurance_registry.json",
  "data/contracts/343_phase6_dispatch_truth_projection_schema.json",
  "data/contracts/343_phase6_outcome_reconciliation_schema.json",
  "data/contracts/343_phase6_outcome_truth_projection_schema.json",
  "data/contracts/343_phase6_dispatch_and_outcome_event_registry.json",
  "data/fixtures/343_phase6_choice_frontier_example.json",
  "data/fixtures/343_phase6_dispatch_proof_examples.json",
  "data/fixtures/343_phase6_outcome_match_examples.json",
  "data/analysis/343_external_reference_notes.json",
  "data/analysis/343_phase6_provider_choice_matrix.csv",
  "data/analysis/343_phase6_transport_proof_matrix.csv",
  "data/analysis/343_phase6_outcome_match_threshold_matrix.csv",
  "tools/analysis/build_343_phase6_discovery_dispatch_and_outcome_contracts.ts",
  "tools/analysis/validate_343_phase6_discovery_dispatch_and_outcome_contracts.ts",
] as const;

const REQUIRED_SCRIPT =
  '"validate:343-phase6-discovery-dispatch-and-outcome-contracts": "pnpm exec tsx ./tools/analysis/validate_343_phase6_discovery_dispatch_and_outcome_contracts.ts"';

const REQUIRED_NOTES_URLS = [
  "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services",
  "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services/service-search-versions-1-and-2",
  "https://digital.nhs.uk/developer/api-catalogue/Alphabet/E/Taxonomies/reference-data/Taxonomies/under-review-for-deprecation",
  "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
  "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
  "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
] as const;

const REQUIRED_ADAPTER_MODES = [
  "dohs_service_search",
  "eps_dos_legacy",
  "local_registry_override",
  "manual_directory_snapshot",
] as const;

const REQUIRED_PROVIDER_CAPABILITY_STATES = ["direct_supported", "manual_supported", "unsupported"] as const;
const REQUIRED_CHOICE_VISIBILITY_STATES = [
  "recommended_visible",
  "visible_with_warning",
  "suppressed_unsafe",
  "invalid_hidden",
] as const;
const REQUIRED_TRANSPORT_MODES = [
  "bars_fhir",
  "supplier_interop",
  "nhsmail_shared_mailbox",
  "mesh",
  "manual_assisted_dispatch",
] as const;
const REQUIRED_PROOF_STATES = ["pending", "satisfied", "disputed", "expired"] as const;
const REQUIRED_RISK_STATES = ["on_track", "at_risk", "likely_failed", "disputed"] as const;
const REQUIRED_CONFIDENCE_BANDS = ["high", "medium", "low"] as const;
const REQUIRED_OUTCOME_SOURCE_FAMILIES = [
  "gp_workflow_observation",
  "direct_structured_message",
  "email_ingest",
  "manual_structured_capture",
] as const;
const REQUIRED_REPLAY_POSTURES = ["exact_replay", "semantic_replay", "collision_review", "distinct"] as const;
const REQUIRED_OUTCOME_CLASSIFICATIONS = [
  "advice_only",
  "medicine_supplied",
  "resolved_no_supply",
  "onward_referral",
  "urgent_gp_action",
  "unable_to_contact",
  "pharmacy_unable_to_complete",
  "unmatched",
] as const;
const REQUIRED_OUTCOME_TRUTH_STATES = [
  "waiting_for_outcome",
  "review_required",
  "resolved_pending_projection",
  "reopened_for_safety",
  "unmatched",
  "duplicate_ignored",
  "settled_resolved",
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

function getTypedRefMember(schema: any): any | undefined {
  if (schema?.properties?.targetFamily?.const && schema?.properties?.ownerTask?.const) {
    return schema;
  }
  if (Array.isArray(schema?.oneOf)) {
    return schema.oneOf.find((member: any) => member?.properties?.targetFamily?.const && member?.properties?.ownerTask?.const);
  }
  return undefined;
}

function validateChecklist(): void {
  requireCondition(checklistStateByNumber(342) === "X", "DEPENDENCY_INCOMPLETE:342");
  requireCondition(["-", "X"].includes(checklistStateByNumber(343)), "TASK_NOT_CLAIMED:343");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

function validatePackageScript(): void {
  requireCondition(
    fs.readFileSync(PACKAGE_JSON_PATH, "utf8").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:343-phase6-discovery-dispatch-and-outcome-contracts",
  );
}

function validateExternalNotes(): void {
  const notes = readJson<{
    taskId?: string;
    reviewedOn?: string;
    accessedOn?: string;
    localSourceOfTruth?: string[];
    sources?: Array<{ url?: string }>;
  }>("data/analysis/343_external_reference_notes.json");

  requireCondition(notes.taskId === TASK_ID, "EXTERNAL_NOTES_TASK_ID_DRIFT");
  requireCondition(notes.reviewedOn === "2026-04-23", "EXTERNAL_NOTES_REVIEW_DATE_DRIFT");
  requireCondition(notes.accessedOn === "2026-04-23", "EXTERNAL_NOTES_ACCESS_DATE_DRIFT");
  ensureArrayIncludesAll(
    notes.localSourceOfTruth ?? [],
    [
      "blueprint/phase-6-the-pharmacy-loop.md",
      "blueprint/phase-0-the-foundation-protocol.md",
      "blueprint/patient-account-and-communications-blueprint.md",
      "data/contracts/342_phase6_pharmacy_case_schema.json",
      "data/contracts/342_phase6_rule_pack_schema.json",
    ],
    "EXTERNAL_NOTES_LOCAL_SOURCE",
  );
  ensureArrayIncludesAll(
    (notes.sources ?? []).map((source) => source.url ?? ""),
    REQUIRED_NOTES_URLS,
    "EXTERNAL_NOTES_URL",
  );
}

function validateDirectoryChoiceSchema(): void {
  const schema = readJson<any>("data/contracts/343_phase6_directory_choice_schema.json");

  requireCondition(schema.title === "Phase6DirectoryChoiceContracts", "DIRECTORY_SCHEMA_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "DIRECTORY_SCHEMA_TASK_ID_DRIFT");
  requireCondition(schema["x-vecells-contract-version"] === CONTRACT_VERSION, "DIRECTORY_SCHEMA_VERSION_DRIFT");
  ensureArrayIncludesAll(getEnum(schema.properties?.adapterModes), REQUIRED_ADAPTER_MODES, "DIRECTORY_SCHEMA_ADAPTER_MODE");
  ensureArrayIncludesAll(
    getEnum(schema.properties?.providerCapabilityStates),
    REQUIRED_PROVIDER_CAPABILITY_STATES,
    "DIRECTORY_SCHEMA_PROVIDER_CAPABILITY",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.choiceVisibilityStates),
    REQUIRED_CHOICE_VISIBILITY_STATES,
    "DIRECTORY_SCHEMA_CHOICE_VISIBILITY",
  );
  requireCondition(schema.properties?.noHiddenTopKLaw?.const === true, "DIRECTORY_SCHEMA_HIDDEN_TOP_K_DRIFT");
  requireCondition(
    schema.properties?.fullChoiceVisibilityLaw?.const === "recommended_frontier_must_be_subset_of_full_visible_set",
    "DIRECTORY_SCHEMA_VISIBLE_FRONTIER_LAW_DRIFT",
  );

  const defs = schema.$defs ?? {};
  for (const defName of [
    "PharmacyDirectorySourceSnapshot",
    "PharmacyDirectorySnapshot",
    "PharmacyProviderCapabilitySnapshot",
    "PharmacyProvider",
    "PharmacyChoiceProof",
    "PharmacyChoiceExplanation",
    "PharmacyChoiceDisclosurePolicy",
    "PharmacyChoiceOverrideAcknowledgement",
    "PharmacyChoiceSession",
    "PharmacyChoiceTruthProjection",
    "PharmacyConsentRecord",
    "PharmacyConsentCheckpoint",
    "PharmacyConsentRevocationRecord",
  ]) {
    requireCondition(defs[defName]?.title === defName, `DIRECTORY_SCHEMA_DEF_MISSING:${defName}`);
  }

  ensureArrayIncludesAll(
    defs.PharmacyProvider?.required ?? [],
    [
      "odsCode",
      "displayName",
      "openingState",
      "nextSafeContactWindow",
      "dispatchCapabilityState",
      "accessibilityTags",
      "contactEndpoints",
      "consultationModeHints",
      "localityAndTravelInputs",
      "timingBand",
    ],
    "DIRECTORY_SCHEMA_PROVIDER_REQUIRED",
  );
  ensureArrayIncludesAll(
    defs.PharmacyConsentCheckpoint?.required ?? [],
    [
      "choiceProofRef",
      "selectedExplanationRef",
      "selectionBindingHash",
      "checkpointState",
      "continuityState",
    ],
    "DIRECTORY_SCHEMA_CONSENT_CHECKPOINT_REQUIRED",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyConsentCheckpoint?.properties?.checkpointState),
    ["satisfied", "missing", "refused", "expired", "withdrawn", "superseded", "revoked_post_dispatch", "withdrawal_reconciliation"],
    "DIRECTORY_SCHEMA_CONSENT_CHECKPOINT_STATE",
  );

  const nextSafeContactWindow = defs.PharmacyProvider?.properties?.nextSafeContactWindow;
  ensureArrayIncludesAll(
    nextSafeContactWindow?.required ?? [],
    ["windowStart", "windowEnd"],
    "DIRECTORY_SCHEMA_NEXT_SAFE_CONTACT_WINDOW_REQUIRED",
  );

  const choiceTruth = defs.PharmacyChoiceTruthProjection;
  ensureArrayIncludesAll(
    choiceTruth?.required ?? [],
    [
      "pharmacyChoiceTruthProjectionId",
      "pharmacyCaseId",
      "choiceSessionRef",
      "directorySnapshotRef",
      "choiceProofRef",
      "choiceDisclosurePolicyRef",
      "directoryTupleHash",
      "visibleProviderRefs",
      "recommendedProviderRefs",
      "warningVisibleProviderRefs",
      "suppressedUnsafeSummaryRef",
      "selectedProviderRef",
      "selectedProviderExplanationRef",
      "selectedProviderCapabilitySnapshotRef",
      "patientOverrideRequired",
      "overrideAcknowledgementRef",
      "selectionBindingHash",
      "visibleChoiceSetHash",
      "projectionState",
      "computedAt",
    ],
    "DIRECTORY_SCHEMA_CHOICE_TRUTH_REQUIRED",
  );
  ensureArrayIncludesAll(
    getEnum(choiceTruth?.properties?.projectionState),
    ["choosing", "selected_waiting_consent", "read_only_provenance", "recovery_required"],
    "DIRECTORY_SCHEMA_CHOICE_TRUTH_STATE",
  );
}

function validateDispatchSchema(): void {
  const schema = readJson<any>("data/contracts/343_phase6_dispatch_schema.json");

  requireCondition(schema.title === "Phase6DispatchContracts", "DISPATCH_SCHEMA_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "DISPATCH_SCHEMA_TASK_ID_DRIFT");
  requireCondition(schema["x-vecells-contract-version"] === CONTRACT_VERSION, "DISPATCH_SCHEMA_VERSION_DRIFT");
  ensureArrayIncludesAll(getEnum(schema.properties?.transportModes), REQUIRED_TRANSPORT_MODES, "DISPATCH_SCHEMA_TRANSPORT_MODE");
  ensureArrayIncludesAll(getEnum(schema.properties?.proofStates), REQUIRED_PROOF_STATES, "DISPATCH_SCHEMA_PROOF_STATE");
  ensureArrayIncludesAll(getEnum(schema.properties?.riskStates), REQUIRED_RISK_STATES, "DISPATCH_SCHEMA_RISK_STATE");
  requireCondition(schema.properties?.noProofEqualsCompletionLaw?.const === true, "DISPATCH_SCHEMA_NO_PROOF_LAW_DRIFT");
  requireCondition(
    schema.properties?.dispatchTruthSeparatedFromOutcomeTruth?.const === true,
    "DISPATCH_SCHEMA_TRUTH_SEPARATION_DRIFT",
  );

  const defs = schema.$defs ?? {};
  for (const defName of [
    "PharmacyReferralPackage",
    "PharmacyDispatchPlan",
    "DispatchAdapterBinding",
    "ReferralArtifactManifest",
    "PharmacyDispatchAttempt",
    "DispatchProofEnvelope",
    "ManualDispatchAssistanceRecord",
    "PharmacyDispatchSettlement",
    "PharmacyContinuityEvidenceProjection",
  ]) {
    requireCondition(defs[defName]?.title === defName, `DISPATCH_SCHEMA_DEF_MISSING:${defName}`);
  }

  ensureArrayIncludesAll(
    defs.DispatchProofEnvelope?.required ?? [],
    [
      "authoritativeProofSourceRef",
      "duplicateOfRef",
      "monotoneRevision",
      "proofState",
      "riskState",
      "stateConfidenceBand",
      "dispatchConfidence",
      "contradictionScore",
    ],
    "DISPATCH_SCHEMA_PROOF_ENVELOPE_REQUIRED",
  );
  ensureArrayIncludesAll(
    defs.PharmacyDispatchSettlement?.required ?? [],
    [
      "result",
      "proofRiskState",
      "stateConfidenceBand",
      "experienceContinuityEvidenceRef",
      "monotoneRevision",
    ],
    "DISPATCH_SCHEMA_SETTLEMENT_REQUIRED",
  );
  ensureArrayIncludesAll(
    getEnum(defs.PharmacyDispatchSettlement?.properties?.result),
    ["live_referral_confirmed", "pending_ack", "stale_choice_or_consent", "denied_scope", "reconciliation_required"],
    "DISPATCH_SCHEMA_SETTLEMENT_RESULT",
  );
  ensureArrayIncludesAll(
    getEnum(defs.DispatchProofEnvelope?.properties?.stateConfidenceBand),
    REQUIRED_CONFIDENCE_BANDS,
    "DISPATCH_SCHEMA_PROOF_CONFIDENCE_BAND",
  );
}

function validateTransportAssuranceRegistry(): void {
  const registry = readJson<any>("data/contracts/343_phase6_transport_assurance_registry.json");

  requireCondition(registry.taskId === TASK_ID, "TRANSPORT_REGISTRY_TASK_ID_DRIFT");
  requireCondition(registry.contractVersion === CONTRACT_VERSION, "TRANSPORT_REGISTRY_VERSION_DRIFT");
  requireCondition((registry.transportModes ?? []).length === 5, "TRANSPORT_REGISTRY_MODE_COUNT_DRIFT");
  requireCondition((registry.profiles ?? []).length === 5, "TRANSPORT_REGISTRY_PROFILE_COUNT_DRIFT");
  ensureArrayIncludesAll(registry.transportModes ?? [], REQUIRED_TRANSPORT_MODES, "TRANSPORT_REGISTRY_MODE");
  ensureArrayIncludesAll(
    (registry.profiles ?? []).map((profile: any) => profile.transportMode ?? ""),
    REQUIRED_TRANSPORT_MODES,
    "TRANSPORT_REGISTRY_PROFILE_MODE",
  );

  const model = registry.calibratedCompetingRiskModel ?? {};
  requireCondition(model.localAdapterDefaultsForbidden === true, "TRANSPORT_REGISTRY_LOCAL_DEFAULTS_DRIFT");
  requireCondition(
    model.formulae?.lambda === "lambda_k(u | x_a) = P(T_a = u, J_a = k | T_a >= u, x_a)",
    "TRANSPORT_REGISTRY_LAMBDA_FORMULA_DRIFT",
  );
  requireCondition(
    model.formulae?.survival === "S_a(u | x_a) = prod_{v = 1}^{u} (1 - sum_k lambda_k(v | x_a))",
    "TRANSPORT_REGISTRY_SURVIVAL_FORMULA_DRIFT",
  );
  requireCondition(
    model.formulae?.cumulativeIncidence === "F_k(u | x_a) = sum_{v = 1}^{u} lambda_k(v | x_a) * S_a(v - 1 | x_a)",
    "TRANSPORT_REGISTRY_CUMULATIVE_FORMULA_DRIFT",
  );
  requireCondition(
    model.formulae?.calibratedProbability === "p_k(u | x_a) = Cal_dispatch,k(F_k(u | x_a))",
    "TRANSPORT_REGISTRY_CALIBRATED_FORMULA_DRIFT",
  );

  for (const profile of registry.profiles ?? []) {
    for (const fieldName of [
      "profileId",
      "transportMode",
      "assuranceClass",
      "ackRequired",
      "proofSources",
      "proofDeadlinePolicy",
      "dispatchConfidenceThreshold",
      "contradictionThreshold",
      "proofRiskModelRef",
      "proofRiskCalibrationVersion",
      "proofRiskThresholdSetRef",
      "revisionPolicyRef",
      "patientAssurancePolicy",
      "exceptionPolicy",
    ]) {
      requireCondition(profile[fieldName] !== undefined, `TRANSPORT_REGISTRY_PROFILE_FIELD_MISSING:${fieldName}`);
    }
  }
}

function validateDispatchTruthProjection(): void {
  const schema = readJson<any>("data/contracts/343_phase6_dispatch_truth_projection_schema.json");

  requireCondition(schema.title === "PharmacyDispatchTruthProjection", "DISPATCH_TRUTH_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "DISPATCH_TRUTH_TASK_ID_DRIFT");
  requireCondition(schema["x-vecells-contract-version"] === CONTRACT_VERSION, "DISPATCH_TRUTH_VERSION_DRIFT");
  ensureArrayIncludesAll(
    schema.required ?? [],
    [
      "transportAcceptanceState",
      "providerAcceptanceState",
      "authoritativeProofState",
      "proofRiskState",
    ],
    "DISPATCH_TRUTH_REQUIRED",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.transportAcceptanceState),
    ["none", "accepted", "rejected", "timed_out", "disputed"],
    "DISPATCH_TRUTH_TRANSPORT_ACCEPTANCE",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.providerAcceptanceState),
    ["none", "accepted", "rejected", "timed_out", "disputed"],
    "DISPATCH_TRUTH_PROVIDER_ACCEPTANCE",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.authoritativeProofState),
    REQUIRED_PROOF_STATES,
    "DISPATCH_TRUTH_AUTHORITATIVE_PROOF",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.proofRiskState),
    REQUIRED_RISK_STATES,
    "DISPATCH_TRUTH_PROOF_RISK",
  );
}

function validateOutcomeReconciliationSchema(): void {
  const schema = readJson<any>("data/contracts/343_phase6_outcome_reconciliation_schema.json");

  requireCondition(schema.title === "Phase6OutcomeReconciliationContracts", "OUTCOME_SCHEMA_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "OUTCOME_SCHEMA_TASK_ID_DRIFT");
  requireCondition(schema["x-vecells-contract-version"] === CONTRACT_VERSION, "OUTCOME_SCHEMA_VERSION_DRIFT");
  ensureArrayIncludesAll(
    getEnum(schema.properties?.outcomeSourceFamilies),
    REQUIRED_OUTCOME_SOURCE_FAMILIES,
    "OUTCOME_SCHEMA_SOURCE_FAMILY",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.replayPostures),
    REQUIRED_REPLAY_POSTURES,
    "OUTCOME_SCHEMA_REPLAY_POSTURE",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.outcomeClassifications),
    REQUIRED_OUTCOME_CLASSIFICATIONS,
    "OUTCOME_SCHEMA_CLASSIFICATION",
  );

  const thresholds = schema.properties?.matchingAlgorithm?.properties?.thresholds?.properties ?? {};
  requireCondition(thresholds.tau_patient_floor?.const === 0.92, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:tau_patient_floor");
  requireCondition(thresholds.tau_service_floor?.const === 0.75, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:tau_service_floor");
  requireCondition(thresholds.tau_route_floor?.const === 0.7, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:tau_route_floor");
  requireCondition(thresholds.tau_match_time?.const === 720, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:tau_match_time");
  requireCondition(thresholds.tau_strong_match?.const === 0.86, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:tau_strong_match");
  requireCondition(thresholds.tau_posterior_strong?.const === 0.8, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:tau_posterior_strong");
  requireCondition(thresholds.delta_match?.const === 0.12, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:delta_match");
  requireCondition(thresholds.tau_contra_apply?.const === 0.2, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:tau_contra_apply");
  requireCondition(thresholds.lambda_match_contra?.const === 1.6, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:lambda_match_contra");
  requireCondition(thresholds.kappa_match?.const === 6, "OUTCOME_SCHEMA_THRESHOLD_DRIFT:kappa_match");
  requireCondition(schema.properties?.noCompletionFromSilenceLaw?.const === true, "OUTCOME_SCHEMA_SILENCE_LAW_DRIFT");
  requireCondition(
    schema.properties?.weakMatchBypassesClosureForbidden?.const === true,
    "OUTCOME_SCHEMA_WEAK_MATCH_LAW_DRIFT",
  );

  const sourceFamilyPolicies = schema.properties?.sourceFamilyPolicies;
  ensureArrayIncludesAll(
    sourceFamilyPolicies?.items?.required ?? [],
    ["sourceFamily", "sourceFloor", "autoApplyPolicy", "manualReviewPolicy"],
    "OUTCOME_SCHEMA_SOURCE_POLICY_REQUIRED",
  );

  const defs = schema.$defs ?? {};
  for (const defName of [
    "OutcomeEvidenceEnvelope",
    "PharmacyOutcomeIngestAttempt",
    "PharmacyOutcomeReconciliationGate",
    "PharmacyOutcomeSettlement",
  ]) {
    requireCondition(defs[defName]?.title === defName, `OUTCOME_SCHEMA_DEF_MISSING:${defName}`);
  }

  ensureArrayIncludesAll(
    getEnum(defs.PharmacyOutcomeSettlement?.properties?.result),
    ["resolved_pending_projection", "reopened_for_safety", "review_required", "unmatched", "duplicate_ignored"],
    "OUTCOME_SCHEMA_SETTLEMENT_RESULT",
  );
  const recoveryRoute = defs.PharmacyOutcomeSettlement?.properties?.recoveryRouteRef;
  const recoveryRouteMember = getTypedRefMember(recoveryRoute);
  requireCondition(recoveryRouteMember?.properties?.targetFamily?.const === "PharmacyBounceBackRecord", "OUTCOME_SCHEMA_RECOVERY_ROUTE_TARGET_DRIFT");
  requireCondition(recoveryRouteMember?.properties?.ownerTask?.const === "seq_344", "OUTCOME_SCHEMA_RECOVERY_ROUTE_OWNER_DRIFT");
}

function validateOutcomeTruthProjection(): void {
  const schema = readJson<any>("data/contracts/343_phase6_outcome_truth_projection_schema.json");

  requireCondition(schema.title === "PharmacyOutcomeTruthProjection", "OUTCOME_TRUTH_TITLE_DRIFT");
  requireCondition(schema["x-vecells-task-id"] === TASK_ID, "OUTCOME_TRUTH_TASK_ID_DRIFT");
  requireCondition(schema["x-vecells-contract-version"] === CONTRACT_VERSION, "OUTCOME_TRUTH_VERSION_DRIFT");
  ensureArrayIncludesAll(
    getEnum(schema.properties?.outcomeTruthState),
    REQUIRED_OUTCOME_TRUTH_STATES,
    "OUTCOME_TRUTH_STATE",
  );
  ensureArrayIncludesAll(
    getEnum(schema.properties?.patientVisibilityState),
    ["review_placeholder", "recovery_required", "quiet_result", "hidden"],
    "OUTCOME_TRUTH_PATIENT_VISIBILITY",
  );
  ensureArrayIncludesAll(
    schema.required ?? [],
    [
      "outcomeTruthState",
      "matchConfidenceBand",
      "contradictionScore",
      "manualReviewState",
      "closeEligibilityState",
      "patientVisibilityState",
      "continuityEvidenceRef",
    ],
    "OUTCOME_TRUTH_REQUIRED",
  );
}

function validateEventRegistry(): void {
  const registry = readJson<any>("data/contracts/343_phase6_dispatch_and_outcome_event_registry.json");

  requireCondition(registry.taskId === TASK_ID, "EVENT_REGISTRY_TASK_ID_DRIFT");
  requireCondition(registry.contractVersion === CONTRACT_VERSION, "EVENT_REGISTRY_VERSION_DRIFT");
  requireCondition((registry.events ?? []).length === 21, "EVENT_REGISTRY_COUNT_DRIFT");
  ensureArrayIncludesAll(
    (registry.events ?? []).map((event: any) => event.eventName ?? ""),
    [
      "pharmacy.choice.proof.created",
      "pharmacy.choice.truth.projected",
      "pharmacy.consent.captured",
      "pharmacy.referral.package.frozen",
      "pharmacy.dispatch.proof.updated",
      "pharmacy.dispatch.settled",
      "pharmacy.outcome.evidence.received",
      "pharmacy.outcome.replay.ignored",
      "pharmacy.outcome.reconciliation.opened",
      "pharmacy.outcome.settled",
      "pharmacy.outcome.truth.projected",
    ],
    "EVENT_REGISTRY_EVENT",
  );
}

function validateFixtures(): void {
  const choiceFixture = readJson<any>("data/fixtures/343_phase6_choice_frontier_example.json");
  requireCondition(choiceFixture.taskId === TASK_ID, "CHOICE_FIXTURE_TASK_ID_DRIFT");
  requireCondition(choiceFixture.explicitLawChecks?.recommendedSubsetOfVisible === true, "CHOICE_FIXTURE_VISIBLE_SET_DRIFT");
  requireCondition(choiceFixture.explicitLawChecks?.hiddenTopKUsed === false, "CHOICE_FIXTURE_HIDDEN_TOP_K_DRIFT");
  requireCondition(choiceFixture.explicitLawChecks?.warnedChoiceStillSelectable === true, "CHOICE_FIXTURE_WARNED_CHOICE_DRIFT");
  ensureArrayIncludesAll(
    (choiceFixture.providers ?? []).map((provider: any) => provider.visibilityDisposition ?? ""),
    ["visible_with_warning", "suppressed_unsafe", "invalid_hidden"],
    "CHOICE_FIXTURE_VISIBILITY_DISPOSITION",
  );
  requireCondition(
    choiceFixture.choiceTruthProjection?.projectionState === "selected_waiting_consent",
    "CHOICE_FIXTURE_TRUTH_PROJECTION_STATE_DRIFT",
  );
  requireCondition(choiceFixture.choiceTruthProjection?.patientOverrideRequired === true, "CHOICE_FIXTURE_OVERRIDE_DRIFT");
  requireCondition(choiceFixture.choiceTruthProjection?.selectedProviderRef === "PHARM_002", "CHOICE_FIXTURE_SELECTED_PROVIDER_DRIFT");

  const dispatchFixture = readJson<any>("data/fixtures/343_phase6_dispatch_proof_examples.json");
  requireCondition(dispatchFixture.taskId === TASK_ID, "DISPATCH_FIXTURE_TASK_ID_DRIFT");
  requireCondition((dispatchFixture.scenarios ?? []).length >= 4, "DISPATCH_FIXTURE_SCENARIO_COUNT_DRIFT");
  ensureArrayIncludesAll(
    (dispatchFixture.scenarios ?? []).map((scenario: any) => scenario.transportMode ?? ""),
    ["manual_assisted_dispatch", "mesh", "bars_fhir", "supplier_interop"],
    "DISPATCH_FIXTURE_TRANSPORT_MODE",
  );
  ensureArrayIncludesAll(
    (dispatchFixture.scenarios ?? []).map((scenario: any) => scenario.settlementResult ?? ""),
    ["pending_ack", "stale_choice_or_consent", "live_referral_confirmed"],
    "DISPATCH_FIXTURE_SETTLEMENT_RESULT",
  );

  const outcomeFixture = readJson<any>("data/fixtures/343_phase6_outcome_match_examples.json");
  requireCondition(outcomeFixture.taskId === TASK_ID, "OUTCOME_FIXTURE_TASK_ID_DRIFT");
  requireCondition((outcomeFixture.scenarios ?? []).length >= 6, "OUTCOME_FIXTURE_SCENARIO_COUNT_DRIFT");
  ensureArrayIncludesAll(
    (outcomeFixture.scenarios ?? []).map((scenario: any) => scenario.settlementResult ?? ""),
    ["duplicate_ignored", "review_required", "unmatched", "reopened_for_safety"],
    "OUTCOME_FIXTURE_SETTLEMENT_RESULT",
  );
  const reopenedScenario = (outcomeFixture.scenarios ?? []).find(
    (scenario: any) => scenario.scenarioId === "PH6_OUTCOME_006",
  );
  requireCondition(reopenedScenario, "OUTCOME_FIXTURE_REOPEN_SCENARIO_MISSING");
  requireCondition(reopenedScenario.outcomeTruthState === "reopened_for_safety", "OUTCOME_FIXTURE_REOPEN_TRUTH_DRIFT");
  requireCondition(
    reopenedScenario.recoveryRouteRef?.ownerTask === "seq_344",
    "OUTCOME_FIXTURE_RECOVERY_ROUTE_OWNER_DRIFT",
  );
}

function validateMatrices(): void {
  const choiceRows = parseCsv("data/analysis/343_phase6_provider_choice_matrix.csv");
  requireCondition(choiceRows.length === 5, "CHOICE_MATRIX_ROW_COUNT_DRIFT");
  ensureArrayIncludesAll(
    choiceRows.map((row) => row.visibilityDisposition ?? ""),
    REQUIRED_CHOICE_VISIBILITY_STATES,
    "CHOICE_MATRIX_VISIBILITY_DISPOSITION",
  );

  const transportRows = parseCsv("data/analysis/343_phase6_transport_proof_matrix.csv");
  requireCondition(transportRows.length === 5, "TRANSPORT_MATRIX_ROW_COUNT_DRIFT");
  ensureArrayIncludesAll(
    transportRows.map((row) => row.transportMode ?? ""),
    REQUIRED_TRANSPORT_MODES,
    "TRANSPORT_MATRIX_TRANSPORT_MODE",
  );

  const outcomeRows = parseCsv("data/analysis/343_phase6_outcome_match_threshold_matrix.csv");
  requireCondition(outcomeRows.length === 4, "OUTCOME_MATRIX_ROW_COUNT_DRIFT");
  ensureArrayIncludesAll(
    outcomeRows.map((row) => row.sourceFamily ?? ""),
    REQUIRED_OUTCOME_SOURCE_FAMILIES,
    "OUTCOME_MATRIX_SOURCE_FAMILY",
  );
}

function validateDocs(): void {
  const architecture = read("docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md");
  for (const section of [
    "## Discovery and choice boundary",
    "## Dispatch and proof boundary",
    "## Outcome reconciliation boundary",
    "## Separation laws",
    "## Reserved and downstream seams",
  ]) {
    requireCondition(architecture.includes(section), `ARCHITECTURE_DOC_SECTION_MISSING:${section}`);
  }
  requireCondition(architecture.includes("PharmacyChoiceTruthProjection"), "ARCHITECTURE_DOC_CHOICE_TRUTH_MISSING");
  requireCondition(architecture.includes("seq_344"), "ARCHITECTURE_DOC_SEQ_344_SEAM_MISSING");

  const apiDoc = read("docs/api/343_phase6_discovery_choice_dispatch_outcome_api.md");
  for (const section of [
    "## Discovery and choice commands",
    "## Dispatch commands",
    "## Outcome and reconciliation commands",
    "## Failure-class law",
    "## Idempotency and replay rules",
  ]) {
    requireCondition(apiDoc.includes(section), `API_DOC_SECTION_MISSING:${section}`);
  }

  const policyDoc = read("docs/policy/343_phase6_provider_choice_and_dispatch_truth_rules.md");
  for (const section of [
    "## Full choice law",
    "## Consent binding law",
    "## Dispatch truth law",
    "## Outcome truth law",
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
  validateDirectoryChoiceSchema();
  validateDispatchSchema();
  validateTransportAssuranceRegistry();
  validateDispatchTruthProjection();
  validateOutcomeReconciliationSchema();
  validateOutcomeTruthProjection();
  validateEventRegistry();
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
        validatedTransportModes: REQUIRED_TRANSPORT_MODES.length,
        validatedOutcomeSourceFamilies: REQUIRED_OUTCOME_SOURCE_FAMILIES.length,
        validatedEvents: 21,
      },
      null,
      2,
    ),
  );
}

main();
