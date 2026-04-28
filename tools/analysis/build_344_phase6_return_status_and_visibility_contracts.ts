import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const TASK_ID = "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts";
const CONTRACT_VERSION = "344.phase6.return-status-visibility-freeze.v1";
const GENERATED_AT = new Date().toISOString();

const OUTPUTS = {
  architectureDoc: "docs/architecture/344_phase6_bounce_back_and_visibility_contracts.md",
  apiDoc: "docs/api/344_phase6_return_status_and_visibility_api.md",
  policyDoc: "docs/policy/344_phase6_urgent_return_and_loop_prevention_rules.md",
  bounceBackSchema: "data/contracts/344_phase6_bounce_back_schema.json",
  patientStatusSchema: "data/contracts/344_phase6_patient_status_schema.json",
  practiceVisibilitySchema: "data/contracts/344_phase6_practice_visibility_schema.json",
  operationsExceptionRegistry: "data/contracts/344_phase6_operations_exception_registry.json",
  projectionRegistry: "data/contracts/344_phase6_projection_registry.json",
  bounceBackExamples: "data/fixtures/344_phase6_bounce_back_examples.json",
  patientStatusExamples: "data/fixtures/344_phase6_patient_status_examples.json",
  practiceVisibilityExamples: "data/fixtures/344_phase6_practice_visibility_examples.json",
  externalNotes: "data/analysis/344_external_reference_notes.json",
  bounceBackTypeMatrix: "data/analysis/344_phase6_bounce_back_type_matrix.csv",
  reopenPriorityMatrix: "data/analysis/344_phase6_reopen_priority_matrix.csv",
  visibilityFieldMatrix: "data/analysis/344_phase6_visibility_field_matrix.csv",
} as const;

type FieldDef = {
  name: string;
  schema: Record<string, unknown>;
  description: string;
};

function repoPath(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function ensureDir(relativePath: string): void {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
}

function writeText(relativePath: string, content: string): void {
  ensureDir(relativePath);
  fs.writeFileSync(repoPath(relativePath), `${content.trimEnd()}\n`);
}

function writeJson(relativePath: string, payload: unknown): void {
  writeText(relativePath, JSON.stringify(payload, null, 2));
}

function csvEscape(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(relativePath: string, headers: string[], rows: Array<Record<string, unknown>>): void {
  const body = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  writeText(relativePath, body);
}

function primitiveString(description: string): Record<string, unknown> {
  return { type: "string", minLength: 1, description };
}

function isoDateTime(description: string): Record<string, unknown> {
  return { type: "string", format: "date-time", description };
}

function typedRefSchema(targetFamily: string, ownerTask: string, description: string, nullable = false): Record<string, unknown> {
  const schema = {
    type: "object",
    additionalProperties: false,
    description,
    properties: {
      targetFamily: { const: targetFamily },
      refId: { type: "string", minLength: 1 },
      ownerTask: { const: ownerTask },
    },
    required: ["targetFamily", "refId", "ownerTask"],
  };
  return nullable ? { oneOf: [schema, { type: "null" }] } : schema;
}

function typedRefArraySchema(targetFamily: string, ownerTask: string, description: string): Record<string, unknown> {
  return {
    type: "array",
    description,
    items: typedRefSchema(targetFamily, ownerTask, `${description} item`, false),
  };
}

function typedUnionRefSchema(
  targets: Array<{ targetFamily: string; ownerTask: string }>,
  description: string,
  nullable = false,
): Record<string, unknown> {
  const variants = targets.map(({ targetFamily, ownerTask }) =>
    typedRefSchema(targetFamily, ownerTask, `${description} variant`, false),
  );
  return nullable ? { oneOf: [...variants, { type: "null" }], description } : { oneOf: variants, description };
}

function buildObjectSchema(title: string, description: string, fields: FieldDef[]): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title,
    description,
    type: "object",
    additionalProperties: false,
    required: fields.map((field) => field.name),
    properties: Object.fromEntries(
      fields.map((field) => [
        field.name,
        {
          ...field.schema,
          description: field.description,
        },
      ]),
    ),
  };
}

function markdownTable(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

const bounceBackTypes = [
  "urgent_gp_return",
  "routine_gp_return",
  "patient_not_contactable",
  "patient_declined",
  "pharmacy_unable_to_complete",
  "referral_expired",
  "safeguarding_concern",
] as const;

const patientMacroStates = [
  "choose_or_confirm",
  "action_in_progress",
  "reviewing_next_steps",
  "completed",
  "urgent_action",
] as const;

const operationsExceptionClasses = [
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

const projectionNames = [
  "pharmacy_active_cases_projection",
  "pharmacy_waiting_for_choice_projection",
  "pharmacy_dispatched_waiting_outcome_projection",
  "pharmacy_bounce_back_projection",
  "pharmacy_dispatch_exception_projection",
  "pharmacy_provider_health_projection",
] as const;

const thresholdFamily = {
  B_loop: 3,
  tau_loop: 0.65,
  tau_reopen_secondary: 0.6,
  tau_contact_return: 0.7,
  nu_clinical: 0.35,
  nu_contact: 0.2,
  nu_provider: 0.15,
  nu_consent: 0.15,
  nu_timing: 0.15,
} as const;

const urgencyCarryFloors = {
  urgent_gp_return: 3,
  safeguarding_concern: 3,
  pharmacy_unable_to_complete: 2,
  referral_expired: 2,
  patient_not_contactable: 2,
  patient_declined: 1,
  routine_gp_return: 1,
} as const;

const directUrgentRouteRequiredTypes = ["urgent_gp_return", "safeguarding_concern"] as const;

const bounceBackTypeMatrixRows = [
  {
    bounceBackType: "urgent_gp_return",
    urgencyLevel: "urgent",
    dominantCopy: "urgent_action_now",
    reopenImplications: "urgent_bounce_back and immediate triage reacquire",
    reachabilityRequirements: "urgent_return dependency plus direct professional-number route",
    gpActionRequired: "yes",
    supervisorReviewMayBeMandatory: "yes_when_loop_risk_or_identity_freeze",
  },
  {
    bounceBackType: "routine_gp_return",
    urgencyLevel: "routine",
    dominantCopy: "reviewing_next_steps",
    reopenImplications: "unresolved_returned and governed practice reassessment",
    reachabilityRequirements: "outcome_confirmation dependency remains current",
    gpActionRequired: "yes",
    supervisorReviewMayBeMandatory: "possible",
  },
  {
    bounceBackType: "patient_not_contactable",
    urgencyLevel: "elevated",
    dominantCopy: "reviewing_next_steps_with_route_repair",
    reopenImplications: "no_contact_return_pending when threshold met",
    reachabilityRequirements: "urgent_return or outcome_confirmation dependency plus contact repair journey",
    gpActionRequired: "yes_if_review_or_reopen_required",
    supervisorReviewMayBeMandatory: "possible_when_loop_risk_high",
  },
  {
    bounceBackType: "patient_declined",
    urgencyLevel: "routine",
    dominantCopy: "reviewing_next_steps_choice_changed",
    reopenImplications: "unresolved_returned with alternative endpointing path",
    reachabilityRequirements: "current patient route only",
    gpActionRequired: "not_always",
    supervisorReviewMayBeMandatory: "possible_when_repeated_low_change",
  },
  {
    bounceBackType: "pharmacy_unable_to_complete",
    urgencyLevel: "elevated",
    dominantCopy: "reviewing_next_steps_gp_action_may_be_needed",
    reopenImplications: "unresolved_returned or urgent_bounce_back depending safety signal",
    reachabilityRequirements: "outcome_confirmation dependency current and repair explicit when broken",
    gpActionRequired: "yes",
    supervisorReviewMayBeMandatory: "possible",
  },
  {
    bounceBackType: "referral_expired",
    urgencyLevel: "elevated",
    dominantCopy: "reviewing_next_steps_referral_expired",
    reopenImplications: "unresolved_returned with requeue timing uplift",
    reachabilityRequirements: "outcome_confirmation dependency current",
    gpActionRequired: "yes_if_clinical_work_outstanding",
    supervisorReviewMayBeMandatory: "possible_when_repeated",
  },
  {
    bounceBackType: "safeguarding_concern",
    urgencyLevel: "urgent",
    dominantCopy: "urgent_action_now",
    reopenImplications: "urgent_bounce_back and safety-led reopen branch",
    reachabilityRequirements: "direct urgent route plus monitored fallback",
    gpActionRequired: "yes",
    supervisorReviewMayBeMandatory: "yes",
  },
] as const;

const reopenPriorityMatrixRows = [
  {
    scenarioId: "PH6_REOPEN_001",
    scenarioTitle: "Urgent GP return",
    originPriorityBand: 1,
    u_urgent: 1,
    u_unable: 0,
    u_contact: 0,
    materialChange: 0.84,
    loopRisk: 0.05,
    reopenPriorityBand: 3,
    resultingCaseStatus: "urgent_bounce_back",
    supervisorReviewState: "not_required",
  },
  {
    scenarioId: "PH6_REOPEN_002",
    scenarioTitle: "Unable to complete with clinically outstanding work",
    originPriorityBand: 1,
    u_urgent: 0,
    u_unable: 0.82,
    u_contact: 0.2,
    materialChange: 0.66,
    loopRisk: 0.11,
    reopenPriorityBand: 2,
    resultingCaseStatus: "unresolved_returned",
    supervisorReviewState: "not_required",
  },
  {
    scenarioId: "PH6_REOPEN_003",
    scenarioTitle: "No-contact return with failed route authority",
    originPriorityBand: 1,
    u_urgent: 0,
    u_unable: 0.2,
    u_contact: 0.78,
    materialChange: 0.49,
    loopRisk: 0.17,
    reopenPriorityBand: 2,
    resultingCaseStatus: "no_contact_return_pending",
    supervisorReviewState: "not_required",
  },
  {
    scenarioId: "PH6_REOPEN_004",
    scenarioTitle: "Repeated low-change bounce-back",
    originPriorityBand: 1,
    u_urgent: 0,
    u_unable: 0.25,
    u_contact: 0.35,
    materialChange: 0.14,
    loopRisk: 0.86,
    reopenPriorityBand: 1,
    resultingCaseStatus: "unresolved_returned",
    supervisorReviewState: "required",
  },
  {
    scenarioId: "PH6_REOPEN_005",
    scenarioTitle: "Safeguarding concern dominates all other inputs",
    originPriorityBand: 2,
    u_urgent: 1,
    u_unable: 0.4,
    u_contact: 0.3,
    materialChange: 0.92,
    loopRisk: 0.03,
    reopenPriorityBand: 3,
    resultingCaseStatus: "urgent_bounce_back",
    supervisorReviewState: "required",
  },
] as const;

const visibilityFieldMatrixRows = [
  {
    audienceFamily: "patient",
    visibleFields:
      "selected pharmacy summary | dispatch posture | patient instruction macro state | next safe action | warning or review copy | continuity evidence posture | last meaningful event time",
    suppressedFields:
      "internal queue rank | staff-only blocker notes | raw reconciliation scores | professional-number detail | minimum-necessary practice payload",
    placeholderPolicy: "show governed review or repair placeholders instead of disappearing the case",
    calmnessOrUrgencyCopyRules: "never say completed while review, urgent return, reachability repair, or identity freeze remains open",
  },
  {
    audienceFamily: "practice",
    visibleFields:
      "selected pharmacy | dispatch state | latest patient instruction state | last outcome evidence summary | GP action required state | triage re-entry | urgent return active | reachability repair required | current close blockers",
    suppressedFields:
      "patient-only reassurance copy | raw provider health internals | staff-only investigation notes not required for the current practice purpose",
    placeholderPolicy: "render minimum-necessary placeholders where a wider payload would otherwise require client-side hiding",
    calmnessOrUrgencyCopyRules: "urgent return and review-required posture dominate routine completion or booking-style certainty",
  },
  {
    audienceFamily: "operations",
    visibleFields:
      "exception class | owning projection | active blocker kind | GP action may be required | supervisor review state | provider health or dispatch health summary | reachability debt",
    suppressedFields:
      "patient-only copy variants | unnecessary clinical detail outside the current workbench purpose",
    placeholderPolicy: "show explicit blocked or summary-only states instead of widening by trimming after assembly",
    calmnessOrUrgencyCopyRules: "loop-risk, urgent return, and conflicting outcome posture remain high-attention until resolved",
  },
] as const;

const bounceBackEvidenceFields: FieldDef[] = [
  { name: "pharmacyBounceBackEvidenceEnvelopeId", schema: primitiveString("Bounce-back evidence envelope identifier."), description: "Bounce-back evidence envelope identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "sourceKind", schema: { type: "string", enum: ["outcome_observation", "dispatch_failure", "pharmacy_message", "manual_capture", "reachability_failure"] }, description: "Source kind for the normalized bounce-back evidence." },
  {
    name: "sourceOutcomeOrDispatchRef",
    schema: typedUnionRefSchema(
      [
        { targetFamily: "PharmacyOutcomeSettlement", ownerTask: "seq_343" },
        { targetFamily: "PharmacyDispatchSettlement", ownerTask: "seq_343" },
      ],
      "Source outcome or dispatch settlement reference.",
      true,
    ),
    description: "Source outcome or dispatch settlement reference.",
  },
  { name: "normalizedBounceBackType", schema: { type: "string", enum: bounceBackTypes }, description: "Normalized bounce-back type." },
  { name: "normalizedEvidenceRefs", schema: { type: "array", items: primitiveString("Normalized evidence reference.") }, description: "Normalized evidence references." },
  { name: "trustClass", schema: { type: "string", enum: ["high", "medium", "low"] }, description: "Trust class of the normalized evidence." },
  { name: "evidenceSummaryRef", schema: primitiveString("Evidence summary reference."), description: "Evidence summary reference." },
  { name: "receivedAt", schema: isoDateTime("Receipt timestamp."), description: "Receipt timestamp." },
  { name: "normalizedAt", schema: isoDateTime("Normalization timestamp."), description: "Normalization timestamp." },
];

const urgentReturnDirectRouteProfileFields: FieldDef[] = [
  { name: "urgentReturnDirectRouteProfileId", schema: primitiveString("Urgent return direct route profile identifier."), description: "Urgent return direct route profile identifier." },
  { name: "bounceBackType", schema: { type: "string", enum: ["urgent_gp_return", "safeguarding_concern"] }, description: "Bounce-back type requiring the direct route." },
  { name: "routeClass", schema: { type: "string", enum: ["dedicated_professional_number", "urgent_care_escalation", "monitored_email_fallback"] }, description: "Direct route class." },
  { name: "directRouteRef", schema: primitiveString("Direct urgent route reference."), description: "Direct urgent route reference." },
  { name: "fallbackRouteRef", schema: { oneOf: [primitiveString("Fallback route reference."), { type: "null" }] }, description: "Fallback route reference." },
  { name: "updateRecordForbidden", schema: { const: true }, description: "Whether Update Record is forbidden for this route." },
  { name: "monitoredSafetyNetRequired", schema: { type: "boolean" }, description: "Whether a monitored safety-net fallback is required." },
  { name: "contractSourceRef", schema: primitiveString("Contract source reference."), description: "Contract source reference." },
  { name: "routeEvidenceRequirementRef", schema: primitiveString("Route evidence requirement reference."), description: "Route evidence requirement reference." },
  { name: "calmCopyForbidden", schema: { const: true }, description: "Whether calm routine copy is forbidden while this route is active." },
  { name: "reviewedAt", schema: isoDateTime("Review timestamp."), description: "Review timestamp." },
];

const reachabilityPlanFields: FieldDef[] = [
  { name: "pharmacyReachabilityPlanId", schema: primitiveString("Reachability plan identifier."), description: "Reachability plan identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "patientContactRouteRef", schema: primitiveString("Current patient contact route reference."), description: "Current patient contact route reference." },
  { name: "pharmacyContactDependencyRef", schema: primitiveString("Pharmacy contact dependency reference."), description: "Pharmacy contact dependency reference." },
  { name: "outcomeConfirmationDependencyRef", schema: primitiveString("Outcome confirmation dependency reference."), description: "Outcome confirmation dependency reference." },
  { name: "urgentReturnDependencyRef", schema: primitiveString("Urgent return dependency reference."), description: "Urgent return dependency reference." },
  { name: "currentReachabilityAssessmentRef", schema: primitiveString("Current reachability assessment reference."), description: "Current reachability assessment reference." },
  { name: "currentContactRouteSnapshotRef", schema: primitiveString("Current contact route snapshot reference."), description: "Current contact route snapshot reference." },
  { name: "contactRepairJourneyRef", schema: { oneOf: [primitiveString("Contact repair journey reference."), { type: "null" }] }, description: "Contact repair journey reference." },
  { name: "routeAuthorityState", schema: { type: "string", enum: ["current", "stale_verification", "stale_demographics", "disputed", "superseded"] }, description: "Route authority state." },
  { name: "deliveryRiskState", schema: { type: "string", enum: ["clear", "at_risk", "likely_failed", "disputed"] }, description: "Delivery risk state." },
  { name: "repairState", schema: { type: "string", enum: ["clear", "repair_required", "recovering", "rebound_pending", "blocked_identity"] }, description: "Repair state." },
  { name: "dominantBrokenDependency", schema: { type: "string", enum: ["none", "pharmacy_contact", "outcome_confirmation", "urgent_return"] }, description: "Dominant broken dependency." },
  { name: "lastValidatedAt", schema: isoDateTime("Last validation timestamp."), description: "Last validation timestamp." },
  { name: "refreshedAt", schema: isoDateTime("Refresh timestamp."), description: "Refresh timestamp." },
];

const bounceBackRecordFields: FieldDef[] = [
  { name: "bounceBackRecordId", schema: primitiveString("Bounce-back record identifier."), description: "Bounce-back record identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "bounceBackEvidenceEnvelopeRef", schema: typedRefSchema("PharmacyBounceBackEvidenceEnvelope", "seq_344", "Normalized bounce-back evidence envelope reference.", false), description: "Normalized bounce-back evidence envelope reference." },
  { name: "bounceBackType", schema: { type: "string", enum: bounceBackTypes }, description: "Bounce-back type." },
  { name: "normalizedEvidenceRefs", schema: { type: "array", items: primitiveString("Normalized evidence reference.") }, description: "Normalized evidence references." },
  { name: "urgencyCarryFloor", schema: { type: "number", minimum: 0, maximum: 3 }, description: "Urgency carry floor for reopened work." },
  { name: "materialChange", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Material change score." },
  { name: "loopRisk", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Loop risk score." },
  { name: "reopenSignal", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Reopen signal score." },
  { name: "reopenPriorityBand", schema: { type: "integer", minimum: 0, maximum: 3 }, description: "Reopen priority band." },
  {
    name: "sourceOutcomeOrDispatchRef",
    schema: typedUnionRefSchema(
      [
        { targetFamily: "PharmacyOutcomeSettlement", ownerTask: "seq_343" },
        { targetFamily: "PharmacyDispatchSettlement", ownerTask: "seq_343" },
      ],
      "Source outcome or dispatch settlement reference.",
      true,
    ),
    description: "Source outcome or dispatch settlement reference.",
  },
  { name: "reachabilityDependencyRef", schema: { oneOf: [primitiveString("Reachability dependency reference."), { type: "null" }] }, description: "Reachability dependency reference." },
  { name: "patientInstructionRef", schema: typedRefSchema("PharmacyPatientStatusProjection", "seq_344", "Patient instruction projection reference.", false), description: "Patient instruction projection reference." },
  { name: "practiceVisibilityRef", schema: typedRefSchema("PharmacyPracticeVisibilityProjection", "seq_344", "Practice visibility projection reference.", false), description: "Practice visibility projection reference." },
  { name: "supervisorReviewState", schema: { type: "string", enum: ["not_required", "required", "in_review", "resolved"] }, description: "Supervisor review state." },
  { name: "directUrgentRouteRef", schema: typedRefSchema("UrgentReturnDirectRouteProfile", "seq_344", "Direct urgent route profile reference.", true), description: "Direct urgent route profile reference." },
  { name: "gpActionRequired", schema: { type: "boolean" }, description: "Whether GP action is required." },
  { name: "reopenedCaseStatus", schema: { type: "string", enum: ["unresolved_returned", "urgent_bounce_back", "no_contact_return_pending"] }, description: "Resulting reopened case status." },
  { name: "currentReachabilityPlanRef", schema: typedRefSchema("PharmacyReachabilityPlan", "seq_344", "Current reachability plan reference.", true), description: "Current reachability plan reference." },
  { name: "wrongPatientFreezeState", schema: { type: "string", enum: ["clear", "identity_repair_active"] }, description: "Wrong-patient freeze state." },
  { name: "autoRedispatchBlocked", schema: { type: "boolean" }, description: "Whether automatic redispatch is blocked." },
  { name: "autoCloseBlocked", schema: { type: "boolean" }, description: "Whether automatic close is blocked." },
  { name: "returnedTaskRef", schema: { oneOf: [primitiveString("Returned task reference."), { type: "null" }] }, description: "Returned or reopened task reference." },
  { name: "reopenByAt", schema: { oneOf: [isoDateTime("Reopen-by timestamp."), { type: "null" }] }, description: "Reopen-by timestamp." },
  { name: "patientInformedAt", schema: { oneOf: [isoDateTime("Patient informed timestamp."), { type: "null" }] }, description: "Patient informed timestamp." },
  { name: "createdAt", schema: isoDateTime("Creation timestamp."), description: "Creation timestamp." },
  { name: "updatedAt", schema: isoDateTime("Update timestamp."), description: "Update timestamp." },
];

const patientStatusProjectionFields: FieldDef[] = [
  { name: "pharmacyPatientStatusProjectionId", schema: primitiveString("Patient status projection identifier."), description: "Patient status projection identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "selectedProviderRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Selected pharmacy provider reference.", true), description: "Selected pharmacy provider reference." },
  { name: "dispatchTruthProjectionRef", schema: typedRefSchema("PharmacyDispatchTruthProjection", "seq_343", "Dispatch truth projection reference.", true), description: "Dispatch truth projection reference." },
  { name: "outcomeTruthProjectionRef", schema: typedRefSchema("PharmacyOutcomeTruthProjection", "seq_343", "Outcome truth projection reference.", true), description: "Outcome truth projection reference." },
  { name: "bounceBackRecordRef", schema: typedRefSchema("PharmacyBounceBackRecord", "seq_344", "Bounce-back record reference.", true), description: "Bounce-back record reference." },
  { name: "reachabilityPlanRef", schema: typedRefSchema("PharmacyReachabilityPlan", "seq_344", "Reachability plan reference.", true), description: "Reachability plan reference." },
  { name: "currentMacroState", schema: { type: "string", enum: patientMacroStates }, description: "Patient macro state." },
  { name: "nextSafeActionCopyRef", schema: primitiveString("Next safe action copy reference."), description: "Next safe action copy reference." },
  { name: "warningCopyRef", schema: { oneOf: [primitiveString("Warning copy reference."), { type: "null" }] }, description: "Warning copy reference." },
  { name: "reviewCopyRef", schema: { oneOf: [primitiveString("Review copy reference."), { type: "null" }] }, description: "Review copy reference." },
  { name: "continuityEvidenceRef", schema: primitiveString("Continuity evidence reference."), description: "Continuity evidence reference." },
  { name: "staleOrBlockedPosture", schema: { type: "string", enum: ["clear", "stale", "blocked", "repair_required", "identity_frozen"] }, description: "Stale or blocked posture." },
  { name: "dominantReachabilityDependencyRef", schema: { oneOf: [primitiveString("Dominant reachability dependency reference."), { type: "null" }] }, description: "Dominant reachability dependency reference." },
  { name: "lastMeaningfulEventAt", schema: isoDateTime("Last meaningful event timestamp."), description: "Last meaningful event timestamp." },
  { name: "calmCopyAllowed", schema: { type: "boolean" }, description: "Whether calm completion or in-progress copy is allowed." },
  { name: "currentClosureBlockerRefs", schema: { type: "array", items: primitiveString("Current closure blocker reference.") }, description: "Current closure blocker references." },
  { name: "currentIdentityRepairDispositionRef", schema: { oneOf: [primitiveString("Current identity repair disposition reference."), { type: "null" }] }, description: "Current identity repair disposition reference." },
  { name: "audienceMessageRef", schema: primitiveString("Audience message reference."), description: "Audience message reference." },
  { name: "computedAt", schema: isoDateTime("Computation timestamp."), description: "Computation timestamp." },
];

const practiceVisibilityProjectionFields: FieldDef[] = [
  { name: "pharmacyPracticeVisibilityProjectionId", schema: primitiveString("Practice visibility projection identifier."), description: "Practice visibility projection identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "selectedProviderRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Selected pharmacy provider reference.", true), description: "Selected pharmacy provider reference." },
  { name: "dispatchTruthProjectionRef", schema: typedRefSchema("PharmacyDispatchTruthProjection", "seq_343", "Dispatch truth projection reference.", true), description: "Dispatch truth projection reference." },
  { name: "patientStatusProjectionRef", schema: typedRefSchema("PharmacyPatientStatusProjection", "seq_344", "Patient status projection reference.", false), description: "Patient status projection reference." },
  { name: "latestOutcomeTruthProjectionRef", schema: typedRefSchema("PharmacyOutcomeTruthProjection", "seq_343", "Latest outcome truth projection reference.", true), description: "Latest outcome truth projection reference." },
  { name: "latestOutcomeEvidenceRef", schema: { oneOf: [primitiveString("Latest outcome evidence reference."), { type: "null" }] }, description: "Latest outcome evidence reference." },
  { name: "activeBounceBackRecordRef", schema: typedRefSchema("PharmacyBounceBackRecord", "seq_344", "Active bounce-back record reference.", true), description: "Active bounce-back record reference." },
  { name: "reachabilityPlanRef", schema: typedRefSchema("PharmacyReachabilityPlan", "seq_344", "Reachability plan reference.", true), description: "Reachability plan reference." },
  { name: "latestPatientInstructionState", schema: { type: "string", enum: patientMacroStates }, description: "Latest patient instruction macro state." },
  { name: "gpActionRequiredState", schema: { type: "string", enum: ["none", "routine_review", "urgent_gp_action"] }, description: "GP action required state." },
  { name: "triageReentryState", schema: { type: "string", enum: ["not_reentered", "reentry_pending", "triage_active"] }, description: "Triage re-entry state." },
  { name: "urgentReturnState", schema: { type: "string", enum: ["none", "routine_return_active", "urgent_return_active"] }, description: "Urgent return state." },
  { name: "reachabilityRepairState", schema: { type: "string", enum: ["not_required", "required", "in_progress"] }, description: "Reachability repair state." },
  { name: "currentCloseBlockerRefs", schema: { type: "array", items: primitiveString("Current close blocker reference.") }, description: "Current close blocker references." },
  { name: "currentConfirmationGateRefs", schema: { type: "array", items: primitiveString("Current confirmation gate reference.") }, description: "Current confirmation gate references." },
  { name: "minimumNecessaryAudienceView", schema: { type: "string", enum: ["summary_only", "clinical_action_required", "operations_attention"] }, description: "Minimum-necessary audience view." },
  { name: "wrongPatientFreezeState", schema: { type: "string", enum: ["clear", "identity_repair_active"] }, description: "Wrong-patient freeze state." },
  { name: "calmCopyAllowed", schema: { type: "boolean" }, description: "Whether calm copy is allowed for practice visibility surfaces." },
  { name: "computedAt", schema: isoDateTime("Computation timestamp."), description: "Computation timestamp." },
];

const bounceBackSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Phase6BounceBackContracts",
  description: "Frozen Phase 6 bounce-back, urgent-return, reopen-priority, and reachability-safety contract pack.",
  type: "object",
  additionalProperties: false,
  required: ["taskId", "contractVersion", "bounceBackTypes", "thresholdFamily", "directUrgentRouteRequiredTypes", "eventVocabulary"],
  properties: {
    taskId: { const: TASK_ID },
    contractVersion: { const: CONTRACT_VERSION },
    bounceBackTypes: { type: "array", items: { type: "string", enum: bounceBackTypes } },
    thresholdFamily: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(thresholdFamily),
      properties: Object.fromEntries(
        Object.entries(thresholdFamily).map(([key, value]) => [key, { const: value }]),
      ),
    },
    directUrgentRouteRequiredTypes: { type: "array", items: { type: "string", enum: directUrgentRouteRequiredTypes } },
    bounceBackAsWorkflowObjectLaw: { const: true },
    urgentReturnDistinctFromRoutineLaw: { const: true },
    timerTruthInferenceForbidden: { const: true },
    calmPostureBlockedByReturnDebt: { const: true },
    eventVocabulary: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "pharmacy.case.bounce_back",
          "pharmacy.return.urgent_activated",
          "pharmacy.return.routine_activated",
          "pharmacy.reachability.plan.refreshed",
          "pharmacy.loop_risk.escalated",
        ],
      },
    },
    algorithm: {
      type: "object",
      additionalProperties: false,
      required: ["materialChange", "loopRisk", "reopenSignal", "reopenPriorityBand"],
      properties: {
        materialChange: { const: "materialChange(b,l) = 1 - product_j (1 - nu_j * delta_j(b,l))" },
        loopRisk: { const: "loopRisk(b,l) = min(bounceCount_l / B_loop, 1) * (1 - materialChange(b,l))" },
        reopenSignal: { const: "reopenSignal(b,l) = max(u_urgent(b), u_unable(b), u_contact(b), u_decline(b))" },
        reopenPriorityBand: {
          const:
            "reopenPriorityBand = max(originPriorityBand_l, 3 * 1[u_urgent(b) = 1], 2 * 1[max(u_unable(b), u_contact(b)) >= tau_reopen_secondary], 1 * 1[loopRisk(b,l) >= tau_loop])",
        },
      },
    },
  },
  $defs: {
    PharmacyBounceBackEvidenceEnvelope: buildObjectSchema(
      "PharmacyBounceBackEvidenceEnvelope",
      "Immutable normalized bounce-back evidence envelope.",
      bounceBackEvidenceFields,
    ),
    UrgentReturnDirectRouteProfile: buildObjectSchema(
      "UrgentReturnDirectRouteProfile",
      "Direct urgent route profile and safety-net fallback rules.",
      urgentReturnDirectRouteProfileFields,
    ),
    PharmacyReachabilityPlan: buildObjectSchema(
      "PharmacyReachabilityPlan",
      "Reachability plan governing pharmacy contact, outcome confirmation, and urgent return dependencies.",
      reachabilityPlanFields,
    ),
    PharmacyBounceBackRecord: buildObjectSchema(
      "PharmacyBounceBackRecord",
      "First-class bounce-back workflow object for unresolved or urgent pharmacy return.",
      bounceBackRecordFields,
    ),
  },
  "x-vecells-task-id": TASK_ID,
  "x-vecells-contract-version": CONTRACT_VERSION,
};

const patientStatusSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Phase6PatientStatusContracts",
  description: "Frozen Phase 6 patient instruction and referral-status truth contract pack.",
  type: "object",
  additionalProperties: false,
  required: ["taskId", "contractVersion", "patientMacroStates", "derivationAuthorities"],
  properties: {
    taskId: { const: TASK_ID },
    contractVersion: { const: CONTRACT_VERSION },
    patientMacroStates: { type: "array", items: { type: "string", enum: patientMacroStates } },
    derivationAuthorities: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "PharmacyCase.status",
          "PharmacyDispatchTruthProjection",
          "PharmacyOutcomeTruthProjection",
          "PharmacyBounceBackRecord",
          "PharmacyReachabilityPlan",
          "ReachabilityAssessmentRecord",
          "IdentityRepairBranchDisposition",
        ],
      },
    },
    completedEligibilityLaw: { const: "settled_resolved_and_no_active_reconciliation_or_return_blockers" },
    frontendBooleanInferenceForbidden: { const: true },
    timerInferenceForbidden: { const: true },
    weakReviewMayNotReuseCalmCopy: { const: true },
  },
  $defs: {
    PharmacyPatientStatusProjection: buildObjectSchema(
      "PharmacyPatientStatusProjection",
      "Audience-safe patient pharmacy status projection derived from authoritative truth and reachability dependencies.",
      patientStatusProjectionFields,
    ),
  },
  "x-vecells-task-id": TASK_ID,
  "x-vecells-contract-version": CONTRACT_VERSION,
};

const practiceVisibilitySchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Phase6PracticeVisibilityContracts",
  description: "Frozen Phase 6 practice visibility contract pack with minimum-necessary audience views.",
  type: "object",
  additionalProperties: false,
  required: ["taskId", "contractVersion", "minimumNecessaryAudienceViews"],
  properties: {
    taskId: { const: TASK_ID },
    contractVersion: { const: CONTRACT_VERSION },
    minimumNecessaryAudienceViews: {
      type: "array",
      items: { type: "string", enum: ["summary_only", "clinical_action_required", "operations_attention"] },
    },
    minimumNecessaryEnforced: { const: true },
    clientSideHidingForbidden: { const: true },
    timerTruthInferenceForbidden: { const: true },
    calmCompletionCopyForbiddenWhileBlocked: { const: true },
  },
  $defs: {
    PharmacyPracticeVisibilityProjection: buildObjectSchema(
      "PharmacyPracticeVisibilityProjection",
      "Audience-safe practice visibility projection for pharmacy referrals and returns.",
      practiceVisibilityProjectionFields,
    ),
  },
  "x-vecells-task-id": TASK_ID,
  "x-vecells-contract-version": CONTRACT_VERSION,
};

const operationsExceptionRegistry = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  topLevelClasses: operationsExceptionClasses,
  eventVocabulary: [
    "pharmacy.operations_exception.raised",
    "pharmacy.operations_exception.resolved",
    "pharmacy.patient_status.projected",
    "pharmacy.practice_visibility.projected",
  ],
  exceptionClasses: [
    {
      classId: "discovery_unavailable",
      severity: "caution",
      blockerKind: "discovery",
      defaultProjection: "pharmacy_provider_health_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: false,
      reservedOwnerTask: "354",
    },
    {
      classId: "no_eligible_providers_returned",
      severity: "caution",
      blockerKind: "choice",
      defaultProjection: "pharmacy_waiting_for_choice_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: false,
      reservedOwnerTask: "354",
    },
    {
      classId: "dispatch_failed",
      severity: "urgent",
      blockerKind: "dispatch",
      defaultProjection: "pharmacy_dispatch_exception_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: true,
      reservedOwnerTask: "354",
    },
    {
      classId: "acknowledgement_missing",
      severity: "caution",
      blockerKind: "dispatch",
      defaultProjection: "pharmacy_dispatch_exception_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: false,
      reservedOwnerTask: "354",
    },
    {
      classId: "outcome_unmatched",
      severity: "caution",
      blockerKind: "reconciliation",
      defaultProjection: "pharmacy_dispatched_waiting_outcome_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: true,
      reservedOwnerTask: "354",
    },
    {
      classId: "no_outcome_within_configured_window",
      severity: "caution",
      blockerKind: "outcome_window",
      defaultProjection: "pharmacy_dispatched_waiting_outcome_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: false,
      reservedOwnerTask: "354",
    },
    {
      classId: "conflicting_outcomes",
      severity: "urgent",
      blockerKind: "reconciliation",
      defaultProjection: "pharmacy_dispatch_exception_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: true,
      reservedOwnerTask: "354",
    },
    {
      classId: "reachability_repair_required",
      severity: "urgent",
      blockerKind: "reachability",
      defaultProjection: "pharmacy_bounce_back_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: false,
      reservedOwnerTask: "354",
    },
    {
      classId: "consent_revoked_after_dispatch",
      severity: "urgent",
      blockerKind: "consent",
      defaultProjection: "pharmacy_dispatch_exception_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: true,
      reservedOwnerTask: "354",
    },
    {
      classId: "dispatch_proof_stale",
      severity: "caution",
      blockerKind: "dispatch",
      defaultProjection: "pharmacy_dispatch_exception_projection",
      patientCalmAllowed: false,
      supervisorReviewMayBeMandatory: false,
      reservedOwnerTask: "354",
    },
  ],
};

const projectionRegistry = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  projectionNames,
  supportingTruthProjections: [
    {
      projectionName: "PharmacyPatientStatusProjection",
      reservedOwnerTask: "351",
      inputs: ["PharmacyCase", "PharmacyDispatchTruthProjection", "PharmacyOutcomeTruthProjection", "PharmacyBounceBackRecord", "PharmacyReachabilityPlan"],
    },
    {
      projectionName: "PharmacyPracticeVisibilityProjection",
      reservedOwnerTask: "354",
      inputs: ["PharmacyCase", "PharmacyPatientStatusProjection", "PharmacyDispatchTruthProjection", "PharmacyOutcomeTruthProjection", "PharmacyBounceBackRecord", "PharmacyReachabilityPlan"],
    },
  ],
  projections: [
    {
      projectionName: "pharmacy_active_cases_projection",
      primaryAudience: "operations",
      purpose: "Current cross-case active pharmacy work overview.",
      requiredSummaryFields: ["caseCount", "activeReturnCount", "urgentReturnCount", "reachabilityDebtCount"],
      authoritativeInputs: ["PharmacyCase", "PharmacyPracticeVisibilityProjection"],
      reservedOwnerTask: "354",
    },
    {
      projectionName: "pharmacy_waiting_for_choice_projection",
      primaryAudience: "practice",
      purpose: "Choice-phase summary without hidden provider ranking or local reinterpretation.",
      requiredSummaryFields: ["visibleChoiceCount", "recommendedFrontierSummary", "warnedChoiceSummary", "staleProofPosture"],
      authoritativeInputs: ["PharmacyChoiceTruthProjection", "PharmacyConsentCheckpoint"],
      reservedOwnerTask: "354",
    },
    {
      projectionName: "pharmacy_dispatched_waiting_outcome_projection",
      primaryAudience: "operations",
      purpose: "Cases sent to pharmacy and waiting for outcome or reconciliation.",
      requiredSummaryFields: ["dispatchState", "authoritativeProofState", "outcomeWindowRisk", "currentBlockerSummary"],
      authoritativeInputs: ["PharmacyDispatchTruthProjection", "PharmacyOutcomeTruthProjection"],
      reservedOwnerTask: "354",
    },
    {
      projectionName: "pharmacy_bounce_back_projection",
      primaryAudience: "operations",
      purpose: "Returned and reopened pharmacy work including urgent-return dominance.",
      requiredSummaryFields: ["bounceBackType", "reopenPriorityBand", "gpActionRequiredState", "reachabilityRepairState"],
      authoritativeInputs: ["PharmacyBounceBackRecord", "PharmacyReachabilityPlan", "PharmacyPracticeVisibilityProjection"],
      reservedOwnerTask: "353",
    },
    {
      projectionName: "pharmacy_dispatch_exception_projection",
      primaryAudience: "operations",
      purpose: "Dispatch failures, stale proof, consent revocation, or reconciliation debt.",
      requiredSummaryFields: ["exceptionClass", "dispatchState", "proofRiskState", "supervisorReviewState"],
      authoritativeInputs: ["PharmacyDispatchTruthProjection", "PharmacyOutcomeTruthProjection"],
      reservedOwnerTask: "354",
    },
    {
      projectionName: "pharmacy_provider_health_projection",
      primaryAudience: "operations",
      purpose: "Provider availability, discovery health, and downstream validation due surfaces.",
      requiredSummaryFields: ["providerHealthState", "discoveryState", "validationDueState", "stockRiskSummary"],
      authoritativeInputs: ["PharmacyDirectorySnapshot", "PharmacyProviderCapabilitySnapshot"],
      reservedOwnerTask: "355",
    },
  ],
};

const bounceBackExamples = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  scenarios: [
    {
      scenarioId: "PH6_BOUNCE_001",
      title: "Urgent GP return forces direct route and urgent case status",
      bounceBackType: "urgent_gp_return",
      urgencyCarryFloor: 3,
      materialChange: 0.84,
      loopRisk: 0.05,
      reopenSignal: 1,
      reopenPriorityBand: 3,
      resultingCaseStatus: "urgent_bounce_back",
      directUrgentRouteRequired: true,
      gpActionRequired: true,
      supervisorReviewState: "not_required",
    },
    {
      scenarioId: "PH6_BOUNCE_002",
      title: "No-contact return opens explicit reachability repair",
      bounceBackType: "patient_not_contactable",
      urgencyCarryFloor: 2,
      materialChange: 0.49,
      loopRisk: 0.17,
      reopenSignal: 0.78,
      reopenPriorityBand: 2,
      resultingCaseStatus: "no_contact_return_pending",
      directUrgentRouteRequired: false,
      gpActionRequired: true,
      supervisorReviewState: "not_required",
      reachabilityRepairRequired: true,
    },
    {
      scenarioId: "PH6_BOUNCE_003",
      title: "Routine return reopens the original request without urgent dominance",
      bounceBackType: "routine_gp_return",
      urgencyCarryFloor: 1,
      materialChange: 0.52,
      loopRisk: 0.18,
      reopenSignal: 0.44,
      reopenPriorityBand: 1,
      resultingCaseStatus: "unresolved_returned",
      directUrgentRouteRequired: false,
      gpActionRequired: true,
      supervisorReviewState: "not_required",
    },
    {
      scenarioId: "PH6_BOUNCE_004",
      title: "Repeated low-change expiry escalates supervisor review",
      bounceBackType: "referral_expired",
      urgencyCarryFloor: 2,
      materialChange: 0.14,
      loopRisk: 0.86,
      reopenSignal: 0.41,
      reopenPriorityBand: 1,
      resultingCaseStatus: "unresolved_returned",
      directUrgentRouteRequired: false,
      gpActionRequired: true,
      supervisorReviewState: "required",
      autoRedispatchBlocked: true,
      autoCloseBlocked: true,
    },
    {
      scenarioId: "PH6_BOUNCE_005",
      title: "Safeguarding concern dominates all routine messaging",
      bounceBackType: "safeguarding_concern",
      urgencyCarryFloor: 3,
      materialChange: 0.92,
      loopRisk: 0.03,
      reopenSignal: 1,
      reopenPriorityBand: 3,
      resultingCaseStatus: "urgent_bounce_back",
      directUrgentRouteRequired: true,
      gpActionRequired: true,
      supervisorReviewState: "required",
    },
    {
      scenarioId: "PH6_BOUNCE_006",
      title: "Patient decline keeps the case honest without urgent inflation",
      bounceBackType: "patient_declined",
      urgencyCarryFloor: 1,
      materialChange: 0.34,
      loopRisk: 0.26,
      reopenSignal: 0.39,
      reopenPriorityBand: 1,
      resultingCaseStatus: "unresolved_returned",
      directUrgentRouteRequired: false,
      gpActionRequired: false,
      supervisorReviewState: "not_required",
    },
  ],
};

const patientStatusExamples = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  scenarios: [
    {
      scenarioId: "PH6_STATUS_001",
      title: "Patient still choosing a pharmacy",
      currentMacroState: "choose_or_confirm",
      calmCopyAllowed: false,
      staleOrBlockedPosture: "clear",
      governingTruth: "choice_session_active",
    },
    {
      scenarioId: "PH6_STATUS_002",
      title: "Referral is in progress and contact route is current",
      currentMacroState: "action_in_progress",
      calmCopyAllowed: false,
      staleOrBlockedPosture: "clear",
      governingTruth: "dispatch_truth_pending_or_pharmacy_contact_active",
    },
    {
      scenarioId: "PH6_STATUS_003",
      title: "Weak outcome review keeps the patient in next-steps review",
      currentMacroState: "reviewing_next_steps",
      calmCopyAllowed: false,
      staleOrBlockedPosture: "blocked",
      governingTruth: "outcome_review_required",
    },
    {
      scenarioId: "PH6_STATUS_004",
      title: "Settled result permits completed only when blockers are absent",
      currentMacroState: "completed",
      calmCopyAllowed: true,
      staleOrBlockedPosture: "clear",
      governingTruth: "settled_resolved_and_no_active_blockers",
    },
    {
      scenarioId: "PH6_STATUS_005",
      title: "Urgent return dominates the top-level state",
      currentMacroState: "urgent_action",
      calmCopyAllowed: false,
      staleOrBlockedPosture: "blocked",
      governingTruth: "urgent_bounce_back",
    },
    {
      scenarioId: "PH6_STATUS_006",
      title: "Reachability repair blocks quiet progress even after dispatch",
      currentMacroState: "reviewing_next_steps",
      calmCopyAllowed: false,
      staleOrBlockedPosture: "repair_required",
      governingTruth: "reachability_dependency_failed",
    },
  ],
};

const practiceVisibilityExamples = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  scenarios: [
    {
      scenarioId: "PH6_VIS_001",
      title: "Routine in-progress pharmacy referral",
      minimumNecessaryAudienceView: "summary_only",
      urgentReturnState: "none",
      reachabilityRepairState: "not_required",
      calmCopyAllowed: false,
      gpActionRequiredState: "none",
    },
    {
      scenarioId: "PH6_VIS_002",
      title: "Review-required outcome blocks calm completion",
      minimumNecessaryAudienceView: "clinical_action_required",
      urgentReturnState: "none",
      reachabilityRepairState: "not_required",
      calmCopyAllowed: false,
      gpActionRequiredState: "routine_review",
      currentCloseBlockers: ["outcome_reconciliation_gate_open"],
    },
    {
      scenarioId: "PH6_VIS_003",
      title: "Urgent return is active and triage has re-entered",
      minimumNecessaryAudienceView: "clinical_action_required",
      urgentReturnState: "urgent_return_active",
      reachabilityRepairState: "required",
      calmCopyAllowed: false,
      gpActionRequiredState: "urgent_gp_action",
      triageReentryState: "triage_active",
    },
    {
      scenarioId: "PH6_VIS_004",
      title: "Operations attention surface for loop-risk and provider issues",
      minimumNecessaryAudienceView: "operations_attention",
      urgentReturnState: "routine_return_active",
      reachabilityRepairState: "in_progress",
      calmCopyAllowed: false,
      gpActionRequiredState: "routine_review",
      currentCloseBlockers: ["loop_risk_review_open", "reachability_dependency_open"],
    },
  ],
};

const externalReferenceNotes = {
  taskId: TASK_ID,
  reviewedOn: "2026-04-23",
  accessedOn: "2026-04-23",
  localSourceOfTruth: [
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/staff-operations-and-support-blueprint.md",
    "data/contracts/342_phase6_pharmacy_case_schema.json",
    "data/contracts/343_phase6_outcome_reconciliation_schema.json",
    "data/contracts/343_phase6_outcome_truth_projection_schema.json",
  ],
  summary:
    "Accessed on 2026-04-23. External sources were used only to confirm current urgent pharmacy return routing expectations, the dedicated monitored-email safety-net requirement, current clinical-safety posture, and current NHS accessibility/content guidance for high-attention status communication. The local blueprint remained authoritative for bounce-back, patient-status, and minimum-necessary visibility algorithms.",
  sources: [
    {
      sourceId: "pharmacy_first_referral_guidance",
      title: "Referring minor illness patients to a community pharmacist",
      url: "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
      publisher: "NHS England",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that urgent or clinically significant pharmacy returns still use direct practice contact routes, including the dedicated professional number, rather than a passive summary path.",
        "Supported keeping urgent return distinct from routine review in the 344 contract pack.",
      ],
      rejectedOrConstrained: [
        "Operational referral guidance did not override the local reopen-priority, loop-risk, or minimum-necessary projection laws.",
      ],
    },
    {
      sourceId: "gp_connect_update_record",
      title: "GP Connect: Update Record",
      url: "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that Update Record is for consultation summaries and must not be used to communicate urgent actions, referrals, or safeguarding concerns.",
        "Supported the 344 rule that urgent return uses a direct urgent route and not the Update Record channel.",
      ],
      rejectedOrConstrained: [
        "Update Record availability did not justify routine calm copy while urgent-return or reconciliation blockers remain open.",
      ],
    },
    {
      sourceId: "gp_contract_2026_27",
      title: "Changes to the GP Contract in 2026/27",
      url: "https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/",
      publisher: "NHS England",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that practices are required to maintain a dedicated, monitored email address as a safety-net for community pharmacy communications where GP Connect is unavailable or a route is not yet supported.",
        "Supported explicit monitored-email fallback in the urgent-return route profile and visibility law.",
      ],
      rejectedOrConstrained: [
        "The contract update did not replace the local blueprint's stronger fail-closed law for reachability repair and urgent dominance.",
      ],
    },
    {
      sourceId: "digital_clinical_safety_assurance",
      title: "Digital clinical safety assurance",
      url: "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
      publisher: "NHS England",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Reinforced that urgent return, no-contact ambiguity, and repeated bounce-back risk are clinical-safety concerns rather than mere operational noise.",
        "Supported explicit blocker, supervisor-review, and no-calm-copy laws in the 344 pack.",
      ],
      rejectedOrConstrained: [
        "Clinical-safety guidance did not relax the local blueprint's minimum-necessary or same-truth requirements.",
      ],
    },
    {
      sourceId: "dcb_step_by_step",
      title: "Step by step guidance",
      url: "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Supported treating return-path ambiguity, reachability failure, and visibility overclaim as safety-relevant release concerns.",
      ],
      rejectedOrConstrained: [
        "Applicability guidance did not override the local projection and blocker model.",
      ],
    },
    {
      sourceId: "interruption_page",
      title: "Interruption page",
      url: "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
      publisher: "NHS digital service manual",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Supported using an explicit high-attention pattern for urgent or unusual staff-facing return states rather than quiet inline copy.",
        "Reinforced that urgent return and unusual clinician action should be visually distinct and brief.",
      ],
      rejectedOrConstrained: [
        "The pattern guidance did not justify repetitive high-attention interruption for routine pharmacy review states.",
      ],
    },
    {
      sourceId: "accessibility_content",
      title: "Accessibility guidance for: Content",
      url: "https://service-manual.nhs.uk/accessibility/content",
      publisher: "NHS digital service manual",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Supported clear, descriptive, non-ambiguous wording for patient next-step and urgent-status copy.",
        "Reinforced heading clarity, message uniqueness, and explicit focusable summaries for blocked or urgent states.",
      ],
      rejectedOrConstrained: [
        "Generic accessibility guidance did not replace the local macro-state vocabulary or visibility law.",
      ],
    },
    {
      sourceId: "accessibility_testing",
      title: "Accessibility guidance for: Testing",
      url: "https://service-manual.nhs.uk/accessibility/testing",
      publisher: "NHS digital service manual",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Supported explicit testing expectations for important dynamic changes in urgent or blocked status communication.",
      ],
      rejectedOrConstrained: [
        "Testing guidance did not alter the local same-truth requirement across patient, practice, and operations surfaces.",
      ],
    },
  ],
};

function buildArchitectureDoc(): string {
  return `# 344 Phase 6 Bounce-Back And Visibility Contracts

Contract version: \`${CONTRACT_VERSION}\`

This document freezes the Phase 6 return-path, patient-status, practice-visibility, and pharmacy-operations truth families so later implementation tracks cannot quietly reinterpret urgent return, review, or calm completion.

## Why 344 exists

- [342_phase6_pharmacy_case_model_and_policy_contracts.md](/Users/test/Code/V/docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md) already froze the return-oriented case states but explicitly reserved bounce-back detail, reachability debt, and visibility payloads for seq_344.
- [343_phase6_discovery_dispatch_and_outcome_contracts.md](/Users/test/Code/V/docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md) already routes reopened pharmacy outcomes into a typed PharmacyBounceBackRecord seam owned here.
- Patient, practice, and operations surfaces need one honest truth family, not three competing interpretations of timers, dispatch, or outcome state.

## Bounce-back and reachability boundary

${markdownTable(
    ["Contract", "Purpose", "Non-negotiable law"],
    [
      ["PharmacyBounceBackEvidenceEnvelope", "Immutable normalized envelope for urgent, routine, no-contact, or safeguarding return evidence.", "Return evidence must be normalized before branch mutation or reopen prioritization."],
      ["UrgentReturnDirectRouteProfile", "Direct urgent route and monitored fallback policy.", "Urgent return must use a direct route and must never reuse Update Record as the urgent transport."],
      ["PharmacyReachabilityPlan", "Single authority over pharmacy contact, outcome confirmation, and urgent-return dependencies.", "Broken or stale reachability must remain explicit and block calm progress."],
      ["PharmacyBounceBackRecord", "First-class workflow object for returned or reopened pharmacy work.", "Bounce-back is not a timeline note; it carries urgency, loop risk, reopen priority, and blocker posture."],
    ],
  )}

## Patient status boundary

${markdownTable(
    ["Contract", "Purpose", "Non-negotiable law"],
    [
      ["PharmacyPatientStatusProjection", "Audience-safe patient pharmacy status and instruction surface.", "Patient macro state must come from authoritative truth projections and blockers, never from timers or UI booleans."],
      ["Patient macro state vocabulary", "Top-level patient state family for pharmacy requests.", "Only choose_or_confirm, action_in_progress, reviewing_next_steps, completed, and urgent_action are legal."],
      ["Calm completion law", "Guardrail for completed posture.", "Completed is forbidden until outcome truth is settled_resolved, continuity evidence is current, and no active reconciliation, urgent return, reachability, or identity blocker remains."],
    ],
  )}

## Practice visibility and operations boundary

${markdownTable(
    ["Contract", "Purpose", "Non-negotiable law"],
    [
      ["PharmacyPracticeVisibilityProjection", "Minimum-necessary practice visibility for pharmacy referrals and returns.", "Practice visibility may summarize truth, but it may not overclaim completion or booking certainty."],
      ["Operations exception registry", "Canonical pharmacy exception vocabulary for queueing and escalation.", "Top-level exception classes are frozen and may not be replaced by ad hoc synonyms."],
      ["Projection registry", "Named projection families for practice and operations surfaces.", "pharmacy_waiting_for_choice_projection must include the choice-truth summary and may not invent hidden ranking logic."],
    ],
  )}

## Cross-surface laws

- Patient, practice, and operations surfaces derive from the same authoritative truth family.
- Urgent return is materially distinct from routine unresolved return and dominates ordinary copy.
- Reachability repair debt remains explicit until the linked dependency rebounds under a current route authority state.
- Weak review or unresolved return posture may not reuse calm completion copy.
- Wrong-patient or identity-repair branches freeze calm and writable posture where applicable.

## Reserved later-owned interfaces

${markdownTable(
    ["Owner", "Already frozen here", "Deferred implementation detail"],
    [
      ["351", "Patient macro-state vocabulary and patient status projection contract.", "Executable patient instruction generation and referral-status surfaces."],
      ["353", "Bounce-back record, urgent route profile, reachability plan, reopen-priority, and loop-risk law.", "Executable bounce-back, urgent-return, and reopen implementation."],
      ["354", "Practice visibility projection, operations exception vocabulary, and named queue projections.", "Practice visibility, operations queue, and exception APIs."],
      ["355", "Provider-health and operations projection family boundaries for dense pharmacy workbenches.", "Pharmacy-console support regions and stock-truth dependent surfaces."],
      ["361", "Patient visibility truth and urgent-review grammar already frozen.", "Browser-visible patient return and review surfaces."],
      ["362", "Practice and operations visibility truth already frozen.", "Browser-visible practice visibility and operations queue surfaces."],
    ],
  )}
`;
}

function buildApiDoc(): string {
  return `# 344 Phase 6 Return, Status, And Visibility API

The first executable API surface for 344 is blocker-first, minimum-necessary, and explicit about urgent return dominance.

## Return and reopen commands

${markdownTable(
    ["Operation", "Route", "Primary preconditions", "Primary exits"],
    [
      ["recordPharmacyBounceBack", "POST /v1/pharmacy/cases/{pharmacyCaseId}:record-bounce-back", "Current lease and fence are valid.<br>Return evidence has been normalized and typed.", "bounce-back record, case status update, reachability-plan refresh"],
      ["refreshPharmacyReachabilityPlan", "POST /v1/pharmacy/cases/{pharmacyCaseId}:refresh-reachability-plan", "Current dependencies and route snapshot are resolvable.", "reachability plan, repair posture, blocker refresh"],
      ["settleBounceBackSupervisorReview", "POST /v1/pharmacy/bounce-backs/{bounceBackRecordId}:settle-supervisor-review", "Loop-risk or urgent review is open.", "supervisor review settlement, auto-redispatch or auto-close gate update"],
    ],
  )}

## Patient status and practice visibility queries

${markdownTable(
    ["Operation", "Route", "Primary preconditions", "Primary exits"],
    [
      ["getPharmacyPatientStatus", "GET /v1/pharmacy/cases/{pharmacyCaseId}/patient-status", "Minimum-necessary patient audience is in scope.", "patient status projection"],
      ["refreshPharmacyPatientStatus", "POST /v1/pharmacy/cases/{pharmacyCaseId}:refresh-patient-status", "Authoritative truth projections and blockers are current.", "patient status projection refresh"],
      ["getPharmacyPracticeVisibility", "GET /v1/pharmacy/cases/{pharmacyCaseId}/practice-visibility", "Practice audience view is in scope.", "practice visibility projection"],
      ["refreshPharmacyPracticeVisibility", "POST /v1/pharmacy/cases/{pharmacyCaseId}:refresh-practice-visibility", "Minimum-necessary audience, blockers, and truth refs are current.", "practice visibility projection refresh"],
    ],
  )}

## Operations exception and projection surfaces

${markdownTable(
    ["Operation", "Route", "Primary preconditions", "Primary exits"],
    [
      ["listPharmacyOperationsProjection", "GET /v1/pharmacy/operations/projections/{projectionName}", "Projection name is one of the frozen canonical names.", "projection slice with deterministic queue semantics"],
      ["raisePharmacyOperationsException", "POST /v1/pharmacy/operations/exceptions:raise", "Exception class is one of the frozen top-level classes.", "operations exception work item"],
      ["resolvePharmacyOperationsException", "POST /v1/pharmacy/operations/exceptions/{exceptionId}:resolve", "Exception exists and the required blocker or review state has actually settled.", "exception resolution, projection refresh"],
    ],
  )}

## Failure-class law

- urgent_return_direct_route_missing
- urgent_return_illegal_update_record_channel
- patient_status_macro_state_unknown
- completed_copy_while_blocked
- minimum_necessary_visibility_violation
- operations_exception_class_unknown
- reachability_repair_state_missing
- loop_risk_review_required
- identity_repair_freeze_active

## Idempotency and blocker rules

- Bounce-back record creation is idempotent on pharmacy case, normalized evidence hash, bounce-back type, and current lineage epoch.
- Patient status projection refresh is idempotent on the authoritative truth tuple and current blocker set.
- Practice visibility refresh is idempotent on the same truth tuple plus minimum-necessary audience view.
- Urgent return and reachability repair are blocker facts. They remain orthogonal to closure and may not be collapsed into fake calm states.
`;
}

function buildPolicyDoc(): string {
  return `# 344 Phase 6 Urgent Return And Loop Prevention Rules

## Urgent return law

- Urgent return posture is materially distinct from routine unresolved return.
- Urgent return must use a direct route declared by policy, with monitored fallback where required.
- Update Record is not an urgent-return channel and may not be used for safeguarding concerns.
- Urgent return must dominate ordinary queue, status, and reassurance copy.

## Loop prevention law

- PharmacyBounceBackRecord persists materialChange, loopRisk, reopenSignal, and reopenPriorityBand.
- When loopRisk >= tau_loop, supervisor review becomes mandatory and automatic redispatch or automatic close is blocked.
- Low-change repeated bounce-backs may not quietly cycle back into calm progress.

## Patient calmness law

- Patient macro state is frozen to choose_or_confirm, action_in_progress, reviewing_next_steps, completed, or urgent_action.
- Calm completed copy is forbidden until outcome truth is settled_resolved, continuity evidence is current, and no reconciliation, urgent return, reachability, or identity blocker remains.
- Weak review, urgent return, and no-contact ambiguity must render as governed review or urgent action, never as quiet completion.

## Minimum-necessary visibility law

- Practice visibility is minimum-necessary and audience-safe by construction.
- Client-side trimming of wider payloads is forbidden.
- Reachability repair, urgent return, and close blockers remain explicit in practice and operations surfaces until resolved.

## Explicit prohibitions

- No bounce-back as an untyped timeline note.
- No urgent and routine return sharing the same copy or route assumptions.
- No practice truth inferred from timers, stale dispatch posture, or last-known demographics.
- No patient or practice calm copy while return, reconciliation, or reachability blockers remain active.
- No widened visibility payload that depends on client-side hiding.
`;
}

function main(): void {
  writeText(OUTPUTS.architectureDoc, buildArchitectureDoc());
  writeText(OUTPUTS.apiDoc, buildApiDoc());
  writeText(OUTPUTS.policyDoc, buildPolicyDoc());
  writeJson(OUTPUTS.bounceBackSchema, bounceBackSchema);
  writeJson(OUTPUTS.patientStatusSchema, patientStatusSchema);
  writeJson(OUTPUTS.practiceVisibilitySchema, practiceVisibilitySchema);
  writeJson(OUTPUTS.operationsExceptionRegistry, operationsExceptionRegistry);
  writeJson(OUTPUTS.projectionRegistry, projectionRegistry);
  writeJson(OUTPUTS.bounceBackExamples, bounceBackExamples);
  writeJson(OUTPUTS.patientStatusExamples, patientStatusExamples);
  writeJson(OUTPUTS.practiceVisibilityExamples, practiceVisibilityExamples);
  writeJson(OUTPUTS.externalNotes, externalReferenceNotes);
  writeCsv(
    OUTPUTS.bounceBackTypeMatrix,
    ["bounceBackType", "urgencyLevel", "dominantCopy", "reopenImplications", "reachabilityRequirements", "gpActionRequired", "supervisorReviewMayBeMandatory"],
    [...bounceBackTypeMatrixRows],
  );
  writeCsv(
    OUTPUTS.reopenPriorityMatrix,
    ["scenarioId", "scenarioTitle", "originPriorityBand", "u_urgent", "u_unable", "u_contact", "materialChange", "loopRisk", "reopenPriorityBand", "resultingCaseStatus", "supervisorReviewState"],
    [...reopenPriorityMatrixRows],
  );
  writeCsv(
    OUTPUTS.visibilityFieldMatrix,
    ["audienceFamily", "visibleFields", "suppressedFields", "placeholderPolicy", "calmnessOrUrgencyCopyRules"],
    [...visibilityFieldMatrixRows],
  );

  console.log(
    JSON.stringify(
      {
        generatedAt: GENERATED_AT,
        taskId: TASK_ID,
        contractVersion: CONTRACT_VERSION,
        bounceBackTypeCount: bounceBackTypes.length,
        patientMacroStateCount: patientMacroStates.length,
        operationsExceptionClassCount: operationsExceptionClasses.length,
        projectionCount: projectionNames.length,
      },
      null,
      2,
    ),
  );
}

main();
