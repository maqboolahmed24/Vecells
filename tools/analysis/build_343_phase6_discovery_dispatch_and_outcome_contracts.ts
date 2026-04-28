import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const TASK_ID = "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts";
const CONTRACT_VERSION = "343.phase6.discovery-dispatch-outcome-freeze.v1";
const GENERATED_AT = new Date().toISOString();

const OUTPUTS = {
  architectureDoc: "docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md",
  apiDoc: "docs/api/343_phase6_discovery_choice_dispatch_outcome_api.md",
  policyDoc: "docs/policy/343_phase6_provider_choice_and_dispatch_truth_rules.md",
  directoryChoiceSchema: "data/contracts/343_phase6_directory_choice_schema.json",
  dispatchSchema: "data/contracts/343_phase6_dispatch_schema.json",
  transportAssuranceRegistry: "data/contracts/343_phase6_transport_assurance_registry.json",
  dispatchTruthProjectionSchema: "data/contracts/343_phase6_dispatch_truth_projection_schema.json",
  outcomeReconciliationSchema: "data/contracts/343_phase6_outcome_reconciliation_schema.json",
  outcomeTruthProjectionSchema: "data/contracts/343_phase6_outcome_truth_projection_schema.json",
  eventRegistry: "data/contracts/343_phase6_dispatch_and_outcome_event_registry.json",
  choiceFixture: "data/fixtures/343_phase6_choice_frontier_example.json",
  dispatchFixture: "data/fixtures/343_phase6_dispatch_proof_examples.json",
  outcomeFixture: "data/fixtures/343_phase6_outcome_match_examples.json",
  externalNotes: "data/analysis/343_external_reference_notes.json",
  choiceMatrix: "data/analysis/343_phase6_provider_choice_matrix.csv",
  transportMatrix: "data/analysis/343_phase6_transport_proof_matrix.csv",
  outcomeThresholdMatrix: "data/analysis/343_phase6_outcome_match_threshold_matrix.csv",
} as const;

type FieldDef = {
  name: string;
  schema: Record<string, unknown>;
  description: string;
};

type TransportMode =
  | "bars_fhir"
  | "supplier_interop"
  | "nhsmail_shared_mailbox"
  | "mesh"
  | "manual_assisted_dispatch";

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

const discoveryAdapterModes = [
  "dohs_service_search",
  "eps_dos_legacy",
  "local_registry_override",
  "manual_directory_snapshot",
] as const;

const providerCapabilityStates = ["direct_supported", "manual_supported", "unsupported"] as const;
const choiceVisibilityStates = [
  "recommended_visible",
  "visible_with_warning",
  "suppressed_unsafe",
  "invalid_hidden",
] as const;
const overrideRequirementStates = ["none", "warned_choice_ack_required", "policy_override_required"] as const;
const transportModes: readonly TransportMode[] = [
  "bars_fhir",
  "supplier_interop",
  "nhsmail_shared_mailbox",
  "mesh",
  "manual_assisted_dispatch",
] as const;
const proofStates = ["pending", "satisfied", "disputed", "expired"] as const;
const riskStates = ["on_track", "at_risk", "likely_failed", "disputed"] as const;
const confidenceBands = ["high", "medium", "low"] as const;
const outcomeSourceFamilies = [
  "gp_workflow_observation",
  "direct_structured_message",
  "email_ingest",
  "manual_structured_capture",
] as const;
const replayPostures = ["exact_replay", "semantic_replay", "collision_review", "distinct"] as const;
const outcomeClassifications = [
  "advice_only",
  "medicine_supplied",
  "resolved_no_supply",
  "onward_referral",
  "urgent_gp_action",
  "unable_to_contact",
  "pharmacy_unable_to_complete",
  "unmatched",
] as const;
const outcomeTruthStates = [
  "waiting_for_outcome",
  "review_required",
  "resolved_pending_projection",
  "reopened_for_safety",
  "unmatched",
  "duplicate_ignored",
  "settled_resolved",
] as const;

const sourceFloors = {
  gp_workflow_observation: 0.95,
  direct_structured_message: 0.9,
  email_ingest: 0.62,
  manual_structured_capture: 0.55,
} as const;

const choiceMatrixRows = [
  {
    postureId: "CHOICE_001",
    capabilityState: "direct_supported",
    visibilityDisposition: "recommended_visible",
    visibleToPatient: "yes",
    rankingEligible: "yes",
    warningCopyRequirement: "none",
    overrideRequirement: "none",
    consentImplication: "Standard provider selection may proceed directly into consent capture.",
  },
  {
    postureId: "CHOICE_002",
    capabilityState: "manual_supported",
    visibilityDisposition: "recommended_visible",
    visibleToPatient: "yes",
    rankingEligible: "yes",
    warningCopyRequirement: "manual routing explanation",
    overrideRequirement: "none",
    consentImplication: "Consent must still bind to manual route family and selected explanation.",
  },
  {
    postureId: "CHOICE_003",
    capabilityState: "manual_supported",
    visibilityDisposition: "visible_with_warning",
    visibleToPatient: "yes",
    rankingEligible: "yes",
    warningCopyRequirement: "required",
    overrideRequirement: "warned_choice_ack_required",
    consentImplication: "Consent blocked until override acknowledgement settles and selectionBindingHash is refreshed.",
  },
  {
    postureId: "CHOICE_004",
    capabilityState: "direct_supported",
    visibilityDisposition: "suppressed_unsafe",
    visibleToPatient: "summary_only",
    rankingEligible: "no",
    warningCopyRequirement: "suppressed unsafe summary",
    overrideRequirement: "policy_override_required",
    consentImplication: "No consent capture allowed until recovery produces a visible lawful choice surface.",
  },
  {
    postureId: "CHOICE_005",
    capabilityState: "unsupported",
    visibilityDisposition: "invalid_hidden",
    visibleToPatient: "no",
    rankingEligible: "no",
    warningCopyRequirement: "not_applicable",
    overrideRequirement: "not_applicable",
    consentImplication: "Provider is not a selectable target and may not appear in the visible frontier.",
  },
] as const;

const transportProfiles = [
  {
    profileId: "TAP_343_BARS_FHIR_V1",
    transportMode: "bars_fhir" as const,
    assuranceClass: "direct_structured_with_business_ack",
    ackRequired: true,
    proofSources: ["bars_transport_receipt", "structured_provider_ack", "authoritative_bars_response"],
    proofDeadlinePolicy: "PT60M",
    dispatchConfidenceThreshold: 0.82,
    contradictionThreshold: 0.25,
    proofRiskModelRef: "dispatch.competing-risk.bars.v1",
    proofRiskCalibrationVersion: "cal-2026-04-bars-v1",
    proofRiskThresholdSetRef: "dispatch-thresholds-bars-v1",
    revisionPolicyRef: "monotone-proof-revision-v1",
    patientAssurancePolicy: "pending_until_authoritative_structured_proof",
    exceptionPolicy: "open_reconciliation_or_pending_ack",
    theta_dispatch_track: 0.35,
    theta_dispatch_fail: 0.7,
    lambda_dispatch_contra: 1.45,
    manualReviewRequired: false,
  },
  {
    profileId: "TAP_343_SUPPLIER_INTEROP_V1",
    transportMode: "supplier_interop" as const,
    assuranceClass: "supplier_structured_with_provider_ack",
    ackRequired: true,
    proofSources: ["supplier_delivery_receipt", "supplier_provider_ack", "operator_verified_provider_reply"],
    proofDeadlinePolicy: "PT90M",
    dispatchConfidenceThreshold: 0.8,
    contradictionThreshold: 0.28,
    proofRiskModelRef: "dispatch.competing-risk.supplier-interop.v1",
    proofRiskCalibrationVersion: "cal-2026-04-supplier-v1",
    proofRiskThresholdSetRef: "dispatch-thresholds-supplier-v1",
    revisionPolicyRef: "monotone-proof-revision-v1",
    patientAssurancePolicy: "pending_until_authoritative_supplier_or_provider_proof",
    exceptionPolicy: "pending_ack_then_reconciliation",
    theta_dispatch_track: 0.38,
    theta_dispatch_fail: 0.72,
    lambda_dispatch_contra: 1.5,
    manualReviewRequired: false,
  },
  {
    profileId: "TAP_343_NHSMAIL_SHARED_V1",
    transportMode: "nhsmail_shared_mailbox" as const,
    assuranceClass: "shared_mailbox_operator_attested",
    ackRequired: false,
    proofSources: ["operator_send_evidence", "provider_mailbox_reply", "manual_supervisor_attestation"],
    proofDeadlinePolicy: "PT240M",
    dispatchConfidenceThreshold: 0.74,
    contradictionThreshold: 0.2,
    proofRiskModelRef: "dispatch.competing-risk.nhsmail.v1",
    proofRiskCalibrationVersion: "cal-2026-04-nhsmail-v1",
    proofRiskThresholdSetRef: "dispatch-thresholds-nhsmail-v1",
    revisionPolicyRef: "monotone-proof-revision-v1",
    patientAssurancePolicy: "pending_until_attested_or_provider_reply",
    exceptionPolicy: "manual_follow_up_and_reconciliation",
    theta_dispatch_track: 0.42,
    theta_dispatch_fail: 0.68,
    lambda_dispatch_contra: 1.3,
    manualReviewRequired: true,
  },
  {
    profileId: "TAP_343_MESH_V1",
    transportMode: "mesh" as const,
    assuranceClass: "secure_async_with_business_ack",
    ackRequired: true,
    proofSources: ["mesh_submission_receipt", "mesh_business_ack", "provider_structured_ack"],
    proofDeadlinePolicy: "PT180M",
    dispatchConfidenceThreshold: 0.79,
    contradictionThreshold: 0.24,
    proofRiskModelRef: "dispatch.competing-risk.mesh.v1",
    proofRiskCalibrationVersion: "cal-2026-04-mesh-v1",
    proofRiskThresholdSetRef: "dispatch-thresholds-mesh-v1",
    revisionPolicyRef: "monotone-proof-revision-v1",
    patientAssurancePolicy: "pending_until_business_ack_or_provider_confirmation",
    exceptionPolicy: "pending_ack_then_manual_follow_up",
    theta_dispatch_track: 0.37,
    theta_dispatch_fail: 0.69,
    lambda_dispatch_contra: 1.4,
    manualReviewRequired: false,
  },
  {
    profileId: "TAP_343_MANUAL_ASSISTED_V1",
    transportMode: "manual_assisted_dispatch" as const,
    assuranceClass: "manual_supervised_dispatch",
    ackRequired: true,
    proofSources: ["operator_attestation", "second_reviewer_attestation", "provider_receipt_or_callback"],
    proofDeadlinePolicy: "PT120M",
    dispatchConfidenceThreshold: 0.76,
    contradictionThreshold: 0.18,
    proofRiskModelRef: "dispatch.competing-risk.manual.v1",
    proofRiskCalibrationVersion: "cal-2026-04-manual-v1",
    proofRiskThresholdSetRef: "dispatch-thresholds-manual-v1",
    revisionPolicyRef: "monotone-proof-revision-v1",
    patientAssurancePolicy: "pending_until_manual_attestation_and_confirmed_route",
    exceptionPolicy: "manual_supervisor_review_required",
    theta_dispatch_track: 0.34,
    theta_dispatch_fail: 0.64,
    lambda_dispatch_contra: 1.25,
    manualReviewRequired: true,
  },
] as const;

const transportMatrixRows = transportProfiles.map((profile) => ({
  transportMode: profile.transportMode,
  assuranceClass: profile.assuranceClass,
  proofSources: profile.proofSources.join(" | "),
  manualReviewPosture: profile.manualReviewRequired ? "required_by_policy" : "not_required_by_default",
  proofDeadlinePolicy: profile.proofDeadlinePolicy,
  patientSafeCopyPosture: profile.patientAssurancePolicy,
  failureAndDisputePosture: profile.exceptionPolicy,
}));

const outcomeThresholdMatrixRows = [
  {
    sourceFamily: "gp_workflow_observation",
    sourceFloor: sourceFloors.gp_workflow_observation,
    autoApplyCeiling: "trusted_strong_match_only",
    replayExpectations: "exact_replay_or_semantic_replay_settle_back_to_prior_outcome",
    humanReviewThresholdConditions: "review_if_below_tau_strong_match_or_tau_posterior_strong_or_above_tau_contra_apply",
    closureImplications: "may_resolve_only_after_settlement_and_projection_convergence",
  },
  {
    sourceFamily: "direct_structured_message",
    sourceFloor: sourceFloors.direct_structured_message,
    autoApplyCeiling: "trusted_strong_match_only",
    replayExpectations: "dedupe_by_replay_key_and_semantic_payload",
    humanReviewThresholdConditions: "review_if_runner_up_gap_below_delta_match_or_conflicting_transport_lineage",
    closureImplications: "no_close_while_reconciliation_gate_open",
  },
  {
    sourceFamily: "email_ingest",
    sourceFloor: sourceFloors.email_ingest,
    autoApplyCeiling: "outcome_reconciliation_pending_only_without_human_resolution",
    replayExpectations: "dedupe_then_gate_manual_review_for_auto_apply",
    humanReviewThresholdConditions: "always_review_unless_trusted_correlation_chain_and_strong_match_conditions_hold",
    closureImplications: "never_quietly_auto_close",
  },
  {
    sourceFamily: "manual_structured_capture",
    sourceFloor: sourceFloors.manual_structured_capture,
    autoApplyCeiling: "outcome_reconciliation_pending_only_without_human_resolution",
    replayExpectations: "dedupe_semantic_retries_to_same_ingest_attempt",
    humanReviewThresholdConditions: "manual_review_required_before_apply_or_reopen",
    closureImplications: "never_quietly_auto_close",
  },
] as const;

const directorySourceSnapshotFields: FieldDef[] = [
  { name: "directorySourceSnapshotId", schema: primitiveString("Directory source snapshot identifier."), description: "Directory source snapshot identifier." },
  { name: "directorySnapshotRef", schema: typedRefSchema("PharmacyDirectorySnapshot", "seq_343", "Owning directory snapshot.", false), description: "Owning directory snapshot." },
  { name: "adapterMode", schema: { type: "string", enum: discoveryAdapterModes }, description: "Discovery adapter mode used for this source snapshot." },
  { name: "sourceLabel", schema: primitiveString("Human-readable source label."), description: "Human-readable source label." },
  { name: "sourceStatus", schema: { type: "string", enum: ["success", "partial", "failed", "superseded"] }, description: "Source execution result." },
  { name: "queryContextHash", schema: primitiveString("Stable hash of the lookup inputs."), description: "Stable hash of the lookup inputs." },
  { name: "rawResultCount", schema: { type: "integer", minimum: 0 }, description: "Raw result count from the source." },
  { name: "sourceTrustClass", schema: { type: "string", enum: ["authoritative", "strategic", "legacy", "manual_override"] }, description: "Source trust class." },
  { name: "stalenessMinutes", schema: { type: "integer", minimum: 0 }, description: "Observed staleness in minutes at normalization time." },
  { name: "capturedAt", schema: isoDateTime("Capture timestamp."), description: "Capture timestamp." },
];

const directorySnapshotFields: FieldDef[] = [
  { name: "directorySnapshotId", schema: primitiveString("Directory snapshot identifier."), description: "Directory snapshot identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "serviceType", schema: primitiveString("Resolved service type or lane."), description: "Resolved service type or lane." },
  { name: "pathwayOrLane", schema: primitiveString("Chosen pathway or fallback lane."), description: "Chosen pathway or fallback lane." },
  { name: "timingGuardrailRef", schema: typedRefSchema("PathwayTimingGuardrail", "seq_342", "Governing timing guardrail.", false), description: "Governing timing guardrail." },
  { name: "sourceSnapshotRefs", schema: typedRefArraySchema("PharmacyDirectorySourceSnapshot", "seq_343", "Bound source snapshot references."), description: "Bound source snapshot references." },
  { name: "providerRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Normalized provider references."), description: "Normalized provider references." },
  { name: "visibleProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Visible provider references."), description: "Visible provider references." },
  { name: "recommendedProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Recommended frontier references."), description: "Recommended frontier references." },
  { name: "directoryTupleHash", schema: primitiveString("Hash of the normalized directory tuple."), description: "Hash of the normalized directory tuple." },
  { name: "snapshotState", schema: { type: "string", enum: ["active", "superseded", "recovery_required"] }, description: "Current snapshot state." },
  { name: "capturedAt", schema: isoDateTime("Capture timestamp."), description: "Capture timestamp." },
];

const providerCapabilitySnapshotFields: FieldDef[] = [
  { name: "providerCapabilitySnapshotId", schema: primitiveString("Capability snapshot identifier."), description: "Capability snapshot identifier." },
  { name: "directorySnapshotRef", schema: typedRefSchema("PharmacyDirectorySnapshot", "seq_343", "Directory snapshot reference.", false), description: "Directory snapshot reference." },
  { name: "providerRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Provider reference.", false), description: "Provider reference." },
  { name: "supportedTransportModes", schema: { type: "array", items: { type: "string", enum: transportModes } }, description: "Transport modes supported by the provider in this snapshot." },
  { name: "manualFallbackState", schema: { type: "string", enum: ["not_needed", "allowed", "required", "unavailable"] }, description: "Manual fallback posture." },
  { name: "capabilityEvidenceRefs", schema: { type: "array", items: primitiveString("Capability evidence reference.") }, description: "Capability evidence references." },
  { name: "capabilityState", schema: { type: "string", enum: providerCapabilityStates }, description: "Capability state." },
  { name: "capabilityTupleHash", schema: primitiveString("Capability tuple hash."), description: "Capability tuple hash." },
  { name: "capturedAt", schema: isoDateTime("Capture timestamp."), description: "Capture timestamp." },
];

const providerFields: FieldDef[] = [
  { name: "providerId", schema: primitiveString("Provider identifier."), description: "Provider identifier." },
  { name: "providerCapabilitySnapshotRef", schema: typedRefSchema("PharmacyProviderCapabilitySnapshot", "seq_343", "Current capability snapshot reference.", false), description: "Current capability snapshot reference." },
  { name: "odsCode", schema: primitiveString("ODS code."), description: "ODS code." },
  { name: "displayName", schema: primitiveString("Display name."), description: "Display name." },
  { name: "openingState", schema: { type: "string", enum: ["open_now", "opens_later_today", "closed", "unknown"] }, description: "Opening state." },
  { name: "nextSafeContactWindow", schema: { type: "object", additionalProperties: false, required: ["windowStart", "windowEnd"], properties: { windowStart: isoDateTime("Window start."), windowEnd: isoDateTime("Window end.") } }, description: "Next safe contact window." },
  { name: "pathwaySuitability", schema: { type: "array", items: primitiveString("Pathway suitability code.") }, description: "Pathway suitability codes." },
  { name: "minorIllnessSuitability", schema: { type: "string", enum: ["supported", "manual_only", "unsupported"] }, description: "Minor illness suitability." },
  { name: "dispatchCapabilityState", schema: { type: "string", enum: providerCapabilityStates }, description: "Dispatch capability state for explanation posture." },
  { name: "accessibilityTags", schema: { type: "array", items: primitiveString("Accessibility tag.") }, description: "Accessibility tags." },
  { name: "contactEndpoints", schema: { type: "array", items: primitiveString("Referral contact endpoint.") }, description: "Referral contact endpoints." },
  { name: "consultationModeHints", schema: { type: "array", items: primitiveString("Consultation mode hint.") }, description: "Consultation mode hints." },
  { name: "localityAndTravelInputs", schema: { type: "object", additionalProperties: false, required: ["travelMinutes", "travelBand"], properties: { travelMinutes: { type: "number", minimum: 0 }, travelBand: { type: "string", enum: ["local", "nearby", "far"] } } }, description: "Locality and travel inputs." },
  { name: "timingBand", schema: { type: "integer", enum: [0, 1, 2] }, description: "Current timing band derived from the guardrail." },
  { name: "warningState", schema: { type: "string", enum: ["none", "manual_route_warning", "late_option_warning", "policy_override_required"] }, description: "Warning posture for the provider." },
  { name: "serviceFitClass", schema: { type: "integer", enum: [0, 1, 2] }, description: "Service fit class." },
  { name: "recommendationScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Recommendation score." },
  { name: "choiceVisibilityState", schema: { type: "string", enum: choiceVisibilityStates }, description: "Choice visibility state." },
  { name: "choiceExplanationRef", schema: typedRefSchema("PharmacyChoiceExplanation", "seq_343", "Choice explanation reference.", true), description: "Choice explanation reference." },
  { name: "overrideRequirementState", schema: { type: "string", enum: overrideRequirementStates }, description: "Override requirement state." },
];

const choiceProofFields: FieldDef[] = [
  { name: "pharmacyChoiceProofId", schema: primitiveString("Choice proof identifier."), description: "Choice proof identifier." },
  { name: "directorySnapshotRef", schema: typedRefSchema("PharmacyDirectorySnapshot", "seq_343", "Directory snapshot reference.", false), description: "Directory snapshot reference." },
  { name: "visibleProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Visible provider references."), description: "Visible provider references." },
  { name: "recommendedProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Recommended frontier references."), description: "Recommended frontier references." },
  { name: "warningVisibleProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Visible warned provider references."), description: "Visible warned provider references." },
  { name: "suppressedUnsafeProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Suppressed unsafe provider references."), description: "Suppressed unsafe provider references." },
  { name: "fullVisibleProviderCount", schema: { type: "integer", minimum: 0 }, description: "Count of the full visible provider set." },
  { name: "frontierToleranceRatio", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Recommended frontier tolerance relative to the best score." },
  { name: "rankingFormula", schema: primitiveString("Ranking formula identifier."), description: "Ranking formula identifier." },
  { name: "visibleChoiceSetHash", schema: primitiveString("Hash of the visible choice set."), description: "Hash of the visible choice set." },
  { name: "calculatedAt", schema: isoDateTime("Calculation timestamp."), description: "Calculation timestamp." },
];

const choiceExplanationFields: FieldDef[] = [
  { name: "pharmacyChoiceExplanationId", schema: primitiveString("Choice explanation identifier."), description: "Choice explanation identifier." },
  { name: "pharmacyChoiceProofRef", schema: typedRefSchema("PharmacyChoiceProof", "seq_343", "Choice proof reference.", false), description: "Choice proof reference." },
  { name: "providerRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Provider reference.", false), description: "Provider reference." },
  { name: "rankOrdinal", schema: { type: "integer", minimum: 1 }, description: "Ordinal rank within the visible frontier." },
  { name: "serviceFitClass", schema: { type: "integer", enum: [0, 1, 2] }, description: "Service fit class." },
  { name: "timingBand", schema: { type: "integer", enum: [0, 1, 2] }, description: "Timing band." },
  { name: "recommendationScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Recommendation score." },
  { name: "visibilityDisposition", schema: { type: "string", enum: choiceVisibilityStates }, description: "Visibility disposition." },
  { name: "reasonCodeRefs", schema: { type: "array", items: primitiveString("Reason code reference.") }, description: "Reason code references." },
  { name: "patientReasonCueRefs", schema: { type: "array", items: primitiveString("Patient-facing cue reference.") }, description: "Patient-facing cue references." },
  { name: "staffExplanationRefs", schema: { type: "array", items: primitiveString("Staff explanation reference.") }, description: "Staff explanation references." },
  { name: "warningCopyRef", schema: { oneOf: [primitiveString("Warning copy reference."), { type: "null" }] }, description: "Warning copy reference." },
  { name: "suppressionReasonCodeRef", schema: { oneOf: [primitiveString("Suppression reason code reference."), { type: "null" }] }, description: "Suppression reason code reference." },
  { name: "overrideRequirementState", schema: { type: "string", enum: overrideRequirementStates }, description: "Override requirement state." },
  { name: "disclosureTupleHash", schema: primitiveString("Disclosure tuple hash."), description: "Disclosure tuple hash." },
  { name: "generatedAt", schema: isoDateTime("Generation timestamp."), description: "Generation timestamp." },
];

const disclosurePolicyFields: FieldDef[] = [
  { name: "pharmacyChoiceDisclosurePolicyId", schema: primitiveString("Disclosure policy identifier."), description: "Disclosure policy identifier." },
  { name: "choiceProofRef", schema: typedRefSchema("PharmacyChoiceProof", "seq_343", "Choice proof reference.", false), description: "Choice proof reference." },
  { name: "suppressedUnsafeSummaryRef", schema: primitiveString("Suppressed unsafe summary reference."), description: "Suppressed unsafe summary reference." },
  { name: "warnedChoicePolicyRef", schema: primitiveString("Warned choice policy reference."), description: "Warned choice policy reference." },
  { name: "hiddenStatePolicyRef", schema: primitiveString("Hidden state policy reference."), description: "Hidden state policy reference." },
  { name: "generatedAt", schema: isoDateTime("Generation timestamp."), description: "Generation timestamp." },
];

const overrideAckFields: FieldDef[] = [
  { name: "pharmacyChoiceOverrideAcknowledgementId", schema: primitiveString("Override acknowledgement identifier."), description: "Override acknowledgement identifier." },
  { name: "choiceSessionRef", schema: typedRefSchema("PharmacyChoiceSession", "seq_343", "Choice session reference.", false), description: "Choice session reference." },
  { name: "providerRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Provider reference.", false), description: "Provider reference." },
  { name: "overrideRequirementState", schema: { type: "string", enum: ["warned_choice_ack_required", "policy_override_required"] }, description: "Override requirement being acknowledged." },
  { name: "acknowledgementScriptRef", schema: primitiveString("Acknowledgement script reference."), description: "Acknowledgement script reference." },
  { name: "actorRef", schema: primitiveString("Actor reference."), description: "Actor reference." },
  { name: "actorRole", schema: { type: "string", enum: ["patient", "staff"] }, description: "Actor role." },
  { name: "acknowledgedAt", schema: isoDateTime("Acknowledgement timestamp."), description: "Acknowledgement timestamp." },
];

const choiceSessionFields: FieldDef[] = [
  { name: "pharmacyChoiceSessionId", schema: primitiveString("Choice session identifier."), description: "Choice session identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "directorySnapshotRef", schema: typedRefSchema("PharmacyDirectorySnapshot", "seq_343", "Directory snapshot reference.", false), description: "Directory snapshot reference." },
  { name: "choiceProofRef", schema: typedRefSchema("PharmacyChoiceProof", "seq_343", "Choice proof reference.", false), description: "Choice proof reference." },
  { name: "choiceDisclosurePolicyRef", schema: typedRefSchema("PharmacyChoiceDisclosurePolicy", "seq_343", "Disclosure policy reference.", false), description: "Disclosure policy reference." },
  { name: "visibleProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Visible provider references."), description: "Visible provider references." },
  { name: "recommendedProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Recommended frontier references."), description: "Recommended frontier references." },
  { name: "selectedProviderRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Selected provider reference.", true), description: "Selected provider reference." },
  { name: "selectedProviderExplanationRef", schema: typedRefSchema("PharmacyChoiceExplanation", "seq_343", "Selected provider explanation reference.", true), description: "Selected provider explanation reference." },
  { name: "selectedProviderCapabilitySnapshotRef", schema: typedRefSchema("PharmacyProviderCapabilitySnapshot", "seq_343", "Selected provider capability snapshot reference.", true), description: "Selected provider capability snapshot reference." },
  { name: "overrideAcknowledgementRef", schema: typedRefSchema("PharmacyChoiceOverrideAcknowledgement", "seq_343", "Override acknowledgement reference.", true), description: "Override acknowledgement reference." },
  { name: "patientOverrideRequired", schema: { type: "boolean" }, description: "Whether warned-choice acknowledgement is still required." },
  { name: "selectionBindingHash", schema: { oneOf: [primitiveString("Selection binding hash."), { type: "null" }] }, description: "Selection binding hash." },
  { name: "visibleChoiceSetHash", schema: primitiveString("Visible choice set hash."), description: "Visible choice set hash." },
  { name: "sessionState", schema: { type: "string", enum: ["choosing", "selected_waiting_consent", "consent_pending", "superseded", "recovery_required", "completed"] }, description: "Choice session state." },
  { name: "createdAt", schema: isoDateTime("Creation timestamp."), description: "Creation timestamp." },
  { name: "updatedAt", schema: isoDateTime("Update timestamp."), description: "Update timestamp." },
];

const choiceTruthProjectionFields: FieldDef[] = [
  { name: "pharmacyChoiceTruthProjectionId", schema: primitiveString("Choice truth projection identifier."), description: "Choice truth projection identifier." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "choiceSessionRef", schema: typedRefSchema("PharmacyChoiceSession", "seq_343", "Choice session reference.", false), description: "Choice session reference." },
  { name: "directorySnapshotRef", schema: typedRefSchema("PharmacyDirectorySnapshot", "seq_343", "Directory snapshot reference.", false), description: "Directory snapshot reference." },
  { name: "choiceProofRef", schema: typedRefSchema("PharmacyChoiceProof", "seq_343", "Choice proof reference.", false), description: "Choice proof reference." },
  { name: "choiceDisclosurePolicyRef", schema: typedRefSchema("PharmacyChoiceDisclosurePolicy", "seq_343", "Choice disclosure policy reference.", false), description: "Choice disclosure policy reference." },
  { name: "directoryTupleHash", schema: primitiveString("Directory tuple hash."), description: "Directory tuple hash." },
  { name: "visibleProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Visible provider references."), description: "Visible provider references." },
  { name: "recommendedProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Recommended frontier references."), description: "Recommended frontier references." },
  { name: "warningVisibleProviderRefs", schema: typedRefArraySchema("PharmacyProvider", "seq_343", "Visible warned provider references."), description: "Visible warned provider references." },
  { name: "suppressedUnsafeSummaryRef", schema: { oneOf: [primitiveString("Suppressed unsafe summary reference."), { type: "null" }] }, description: "Suppressed unsafe summary reference." },
  { name: "selectedProviderRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Selected provider reference.", true), description: "Selected provider reference." },
  { name: "selectedProviderExplanationRef", schema: typedRefSchema("PharmacyChoiceExplanation", "seq_343", "Selected provider explanation reference.", true), description: "Selected provider explanation reference." },
  { name: "selectedProviderCapabilitySnapshotRef", schema: typedRefSchema("PharmacyProviderCapabilitySnapshot", "seq_343", "Selected provider capability snapshot reference.", true), description: "Selected provider capability snapshot reference." },
  { name: "patientOverrideRequired", schema: { type: "boolean" }, description: "Whether warned-choice acknowledgement is still required." },
  { name: "overrideAcknowledgementRef", schema: typedRefSchema("PharmacyChoiceOverrideAcknowledgement", "seq_343", "Override acknowledgement reference.", true), description: "Override acknowledgement reference." },
  { name: "selectionBindingHash", schema: { oneOf: [primitiveString("Selection binding hash."), { type: "null" }] }, description: "Selection binding hash." },
  { name: "visibleChoiceSetHash", schema: primitiveString("Visible choice set hash."), description: "Visible choice set hash." },
  { name: "projectionState", schema: { type: "string", enum: ["choosing", "selected_waiting_consent", "read_only_provenance", "recovery_required"] }, description: "Choice truth projection state." },
  { name: "computedAt", schema: isoDateTime("Computation timestamp."), description: "Computation timestamp." },
];

const consentRecordFields: FieldDef[] = [
  { name: "pharmacyConsentRecordId", schema: primitiveString("Consent record identifier."), description: "Consent record identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "providerRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Bound provider reference.", false), description: "Bound provider reference." },
  { name: "pathwayOrLane", schema: primitiveString("Bound pathway or lane."), description: "Bound pathway or lane." },
  { name: "referralScope", schema: primitiveString("Bound referral scope."), description: "Bound referral scope." },
  { name: "choiceSessionRef", schema: typedRefSchema("PharmacyChoiceSession", "seq_343", "Choice session reference.", false), description: "Choice session reference." },
  { name: "choiceProofRef", schema: typedRefSchema("PharmacyChoiceProof", "seq_343", "Choice proof reference.", false), description: "Choice proof reference." },
  { name: "selectedExplanationRef", schema: typedRefSchema("PharmacyChoiceExplanation", "seq_343", "Selected explanation reference.", false), description: "Selected explanation reference." },
  { name: "overrideAcknowledgementRef", schema: typedRefSchema("PharmacyChoiceOverrideAcknowledgement", "seq_343", "Override acknowledgement reference.", true), description: "Override acknowledgement reference." },
  { name: "selectionBindingHash", schema: primitiveString("Selection binding hash."), description: "Selection binding hash." },
  { name: "channel", schema: { type: "string", enum: ["patient_direct", "staff_assisted", "proxy_confirmed"] }, description: "Consent capture channel." },
  { name: "consentScriptVersionRef", schema: primitiveString("Consent script version reference."), description: "Consent script version reference." },
  { name: "patientAwarenessOfGpVisibility", schema: { type: "boolean" }, description: "Whether GP visibility implications were disclosed." },
  { name: "state", schema: { type: "string", enum: ["granted", "withdrawn", "expired", "superseded"] }, description: "Consent state." },
  { name: "grantedAt", schema: isoDateTime("Grant timestamp."), description: "Grant timestamp." },
  { name: "supersededAt", schema: { oneOf: [isoDateTime("Supersede timestamp."), { type: "null" }] }, description: "Supersede timestamp when applicable." },
];

const consentCheckpointFields: FieldDef[] = [
  { name: "pharmacyConsentCheckpointId", schema: primitiveString("Consent checkpoint identifier."), description: "Consent checkpoint identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "providerRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Bound provider reference.", false), description: "Bound provider reference." },
  { name: "pathwayOrLane", schema: primitiveString("Bound pathway or lane."), description: "Bound pathway or lane." },
  { name: "referralScope", schema: primitiveString("Bound referral scope."), description: "Bound referral scope." },
  { name: "choiceProofRef", schema: typedRefSchema("PharmacyChoiceProof", "seq_343", "Choice proof reference.", false), description: "Choice proof reference." },
  { name: "selectedExplanationRef", schema: typedRefSchema("PharmacyChoiceExplanation", "seq_343", "Selected explanation reference.", false), description: "Selected explanation reference." },
  { name: "consentRecordRef", schema: typedRefSchema("PharmacyConsentRecord", "seq_343", "Current consent record reference.", true), description: "Current consent record reference." },
  { name: "latestRevocationRef", schema: typedRefSchema("PharmacyConsentRevocationRecord", "seq_343", "Latest revocation reference.", true), description: "Latest revocation reference." },
  { name: "selectionBindingHash", schema: primitiveString("Selection binding hash."), description: "Selection binding hash." },
  { name: "packageFingerprint", schema: { oneOf: [primitiveString("Package fingerprint."), { type: "null" }] }, description: "Package fingerprint." },
  { name: "checkpointState", schema: { type: "string", enum: ["satisfied", "missing", "refused", "expired", "withdrawn", "superseded", "revoked_post_dispatch", "withdrawal_reconciliation"] }, description: "Checkpoint state." },
  { name: "continuityState", schema: { type: "string", enum: ["current", "stale", "blocked"] }, description: "Continuity state." },
  { name: "evaluatedAt", schema: isoDateTime("Evaluation timestamp."), description: "Evaluation timestamp." },
];

const revocationFields: FieldDef[] = [
  { name: "pharmacyConsentRevocationRecordId", schema: primitiveString("Consent revocation record identifier."), description: "Consent revocation record identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "consentRecordRef", schema: typedRefSchema("PharmacyConsentRecord", "seq_343", "Consent record reference.", false), description: "Consent record reference." },
  { name: "reasonClass", schema: { type: "string", enum: ["withdrawn_by_patient", "pathway_drift", "provider_drift", "scope_drift", "proof_superseded", "post_dispatch_withdrawal"] }, description: "Revocation reason class." },
  { name: "revocationState", schema: { type: "string", enum: ["pending", "recorded", "downstream_reconciliation", "resolved"] }, description: "Revocation workflow state." },
  { name: "recordedAt", schema: isoDateTime("Record timestamp."), description: "Record timestamp." },
];

const dispatchPackageFields: FieldDef[] = [
  { name: "packageId", schema: primitiveString("Referral package identifier."), description: "Referral package identifier." },
  { name: "pharmacyCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false), description: "Owning pharmacy case." },
  { name: "providerRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Selected provider reference.", false), description: "Selected provider reference." },
  { name: "pathwayOrLane", schema: primitiveString("Pathway or lane bound into the package."), description: "Pathway or lane bound into the package." },
  { name: "consentRef", schema: typedRefSchema("PharmacyConsentRecord", "seq_343", "Consent reference.", false), description: "Consent reference." },
  { name: "consentCheckpointRef", schema: typedRefSchema("PharmacyConsentCheckpoint", "seq_343", "Consent checkpoint reference.", false), description: "Consent checkpoint reference." },
  { name: "directorySnapshotRef", schema: typedRefSchema("PharmacyDirectorySnapshot", "seq_343", "Directory snapshot reference.", false), description: "Directory snapshot reference." },
  { name: "compiledPolicyBundleRef", schema: primitiveString("Compiled policy bundle reference."), description: "Compiled policy bundle reference." },
  { name: "selectedProviderCapabilitySnapshotRef", schema: typedRefSchema("PharmacyProviderCapabilitySnapshot", "seq_343", "Selected capability snapshot reference.", false), description: "Selected capability snapshot reference." },
  { name: "canonicalRepresentationSetRef", schema: primitiveString("Canonical representation set reference."), description: "Canonical representation set reference." },
  { name: "artifactRefs", schema: { type: "array", items: primitiveString("Package artifact reference.") }, description: "Package artifact references." },
  { name: "packageHash", schema: primitiveString("Package hash."), description: "Package hash." },
  { name: "packageFingerprint", schema: primitiveString("Package fingerprint."), description: "Package fingerprint." },
  { name: "packageState", schema: { type: "string", enum: ["frozen", "invalidated", "superseded"] }, description: "Package state." },
  { name: "frozenAt", schema: isoDateTime("Freeze timestamp."), description: "Freeze timestamp." },
];

const dispatchPlanFields: FieldDef[] = [
  { name: "dispatchPlanId", schema: primitiveString("Dispatch plan identifier."), description: "Dispatch plan identifier." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "packageId", schema: primitiveString("Frozen package identifier."), description: "Frozen package identifier." },
  { name: "providerRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Selected provider reference.", false), description: "Selected provider reference." },
  { name: "providerCapabilitySnapshotRef", schema: typedRefSchema("PharmacyProviderCapabilitySnapshot", "seq_343", "Capability snapshot reference.", false), description: "Capability snapshot reference." },
  { name: "transportMode", schema: { type: "string", enum: transportModes }, description: "Transport mode." },
  { name: "transportAssuranceProfileRef", schema: typedRefSchema("TransportAssuranceProfile", "seq_343", "Transport assurance profile reference.", false), description: "Transport assurance profile reference." },
  { name: "dispatchAdapterBindingRef", schema: typedRefSchema("DispatchAdapterBinding", "seq_343", "Dispatch adapter binding reference.", false), description: "Dispatch adapter binding reference." },
  { name: "transformContractRef", schema: primitiveString("Transform contract reference."), description: "Transform contract reference." },
  { name: "allowedArtifactClasses", schema: { type: "array", items: primitiveString("Allowed artifact class.") }, description: "Allowed artifact classes." },
  { name: "artifactManifestRef", schema: typedRefSchema("ReferralArtifactManifest", "seq_343", "Artifact manifest reference.", false), description: "Artifact manifest reference." },
  { name: "dispatchPayloadRef", schema: primitiveString("Dispatch payload reference."), description: "Dispatch payload reference." },
  { name: "dispatchPayloadHash", schema: primitiveString("Dispatch payload hash."), description: "Dispatch payload hash." },
  { name: "dispatchPlanHash", schema: primitiveString("Dispatch plan hash."), description: "Dispatch plan hash." },
  { name: "manualReviewPolicyRef", schema: primitiveString("Manual review policy reference."), description: "Manual review policy reference." },
  { name: "planState", schema: { type: "string", enum: ["active", "superseded", "invalidated"] }, description: "Plan state." },
  { name: "plannedAt", schema: isoDateTime("Plan creation timestamp."), description: "Plan creation timestamp." },
];

const dispatchAdapterBindingFields: FieldDef[] = [
  { name: "dispatchAdapterBindingId", schema: primitiveString("Dispatch adapter binding identifier."), description: "Dispatch adapter binding identifier." },
  { name: "transportMode", schema: { type: "string", enum: transportModes }, description: "Transport mode." },
  { name: "adapterVersionRef", schema: primitiveString("Adapter version reference."), description: "Adapter version reference." },
  { name: "transformContractRef", schema: primitiveString("Transform contract reference."), description: "Transform contract reference." },
  { name: "providerCapabilitySnapshotRef", schema: typedRefSchema("PharmacyProviderCapabilitySnapshot", "seq_343", "Capability snapshot reference.", false), description: "Capability snapshot reference." },
  { name: "allowedArtifactClasses", schema: { type: "array", items: primitiveString("Allowed artifact class.") }, description: "Allowed artifact classes." },
  { name: "requiresManualOperator", schema: { type: "boolean" }, description: "Whether manual operator evidence is required." },
  { name: "manualReviewPolicyRef", schema: primitiveString("Manual review policy reference."), description: "Manual review policy reference." },
  { name: "bindingHash", schema: primitiveString("Binding hash."), description: "Binding hash." },
  { name: "boundAt", schema: isoDateTime("Binding timestamp."), description: "Binding timestamp." },
];

const artifactManifestFields: FieldDef[] = [
  { name: "artifactManifestId", schema: primitiveString("Artifact manifest identifier."), description: "Artifact manifest identifier." },
  { name: "dispatchPlanRef", schema: typedRefSchema("PharmacyDispatchPlan", "seq_343", "Dispatch plan reference.", false), description: "Dispatch plan reference." },
  { name: "packageId", schema: primitiveString("Package identifier."), description: "Package identifier." },
  { name: "includedArtifactRefs", schema: { type: "array", items: primitiveString("Included artifact reference.") }, description: "Included artifact references." },
  { name: "redactedArtifactRefs", schema: { type: "array", items: primitiveString("Redacted artifact reference.") }, description: "Redacted artifact references." },
  { name: "omittedArtifactRefs", schema: { type: "array", items: primitiveString("Omitted artifact reference.") }, description: "Omitted artifact references." },
  { name: "transformNotesRef", schema: primitiveString("Transform notes reference."), description: "Transform notes reference." },
  { name: "classificationRef", schema: primitiveString("Classification reference."), description: "Classification reference." },
  { name: "manifestHash", schema: primitiveString("Manifest hash."), description: "Manifest hash." },
  { name: "compiledAt", schema: isoDateTime("Compile timestamp."), description: "Compile timestamp." },
];

const dispatchAttemptFields: FieldDef[] = [
  { name: "dispatchAttemptId", schema: primitiveString("Dispatch attempt identifier."), description: "Dispatch attempt identifier." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "packageId", schema: primitiveString("Package identifier."), description: "Package identifier." },
  { name: "dispatchPlanRef", schema: typedRefSchema("PharmacyDispatchPlan", "seq_343", "Dispatch plan reference.", false), description: "Dispatch plan reference." },
  { name: "transportMode", schema: { type: "string", enum: transportModes }, description: "Transport mode." },
  { name: "transportAssuranceProfileRef", schema: typedRefSchema("TransportAssuranceProfile", "seq_343", "Transport assurance profile reference.", false), description: "Transport assurance profile reference." },
  { name: "routeIntentBindingRef", schema: primitiveString("Route intent binding reference."), description: "Route intent binding reference." },
  { name: "canonicalObjectDescriptorRef", schema: primitiveString("Canonical object descriptor reference."), description: "Canonical object descriptor reference." },
  { name: "governingObjectVersionRef", schema: primitiveString("Governing object version reference."), description: "Governing object version reference." },
  { name: "routeIntentTupleHash", schema: primitiveString("Route intent tuple hash."), description: "Route intent tuple hash." },
  { name: "idempotencyKey", schema: primitiveString("Idempotency key."), description: "Idempotency key." },
  { name: "requestLifecycleLeaseRef", schema: typedRefSchema("RequestLifecycleLease", "seq_342", "Lifecycle lease reference.", false), description: "Lifecycle lease reference." },
  { name: "requestOwnershipEpochRef", schema: primitiveString("Ownership epoch reference."), description: "Ownership epoch reference." },
  { name: "commandActionRecordRef", schema: primitiveString("Command action record reference."), description: "Command action record reference." },
  { name: "idempotencyRecordRef", schema: primitiveString("Idempotency record reference."), description: "Idempotency record reference." },
  { name: "adapterDispatchAttemptRef", schema: primitiveString("Adapter dispatch attempt reference."), description: "Adapter dispatch attempt reference." },
  { name: "latestReceiptCheckpointRef", schema: primitiveString("Latest receipt checkpoint reference."), description: "Latest receipt checkpoint reference." },
  { name: "providerRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Provider reference.", false), description: "Provider reference." },
  { name: "providerCapabilitySnapshotRef", schema: typedRefSchema("PharmacyProviderCapabilitySnapshot", "seq_343", "Capability snapshot reference.", false), description: "Capability snapshot reference." },
  { name: "dispatchAdapterBindingRef", schema: typedRefSchema("DispatchAdapterBinding", "seq_343", "Dispatch adapter binding reference.", false), description: "Dispatch adapter binding reference." },
  { name: "dispatchPlanHash", schema: primitiveString("Dispatch plan hash."), description: "Dispatch plan hash." },
  { name: "packageHash", schema: primitiveString("Package hash."), description: "Package hash." },
  { name: "outboundReferenceSet", schema: { type: "array", items: primitiveString("Outbound transport reference.") }, description: "Outbound transport references." },
  { name: "outboundReferenceSetHash", schema: primitiveString("Outbound reference set hash."), description: "Outbound reference set hash." },
  { name: "status", schema: { type: "string", enum: ["created", "adapter_dispatched", "transport_accepted", "provider_accepted", "proof_pending", "proof_satisfied", "reconciliation_required", "superseded", "failed", "expired"] }, description: "Dispatch attempt status." },
  { name: "transportAcceptanceState", schema: { type: "string", enum: ["none", "accepted", "rejected", "timed_out", "disputed"] }, description: "Transport acceptance state." },
  { name: "providerAcceptanceState", schema: { type: "string", enum: ["none", "accepted", "rejected", "timed_out", "disputed"] }, description: "Provider acceptance state." },
  { name: "proofDeadlineAt", schema: isoDateTime("Proof deadline timestamp."), description: "Proof deadline timestamp." },
  { name: "proofState", schema: { type: "string", enum: proofStates }, description: "Proof state." },
  { name: "dispatchConfidence", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Dispatch confidence." },
  { name: "contradictionScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Contradiction score." },
  { name: "proofEnvelopeRef", schema: typedRefSchema("DispatchProofEnvelope", "seq_343", "Proof envelope reference.", true), description: "Proof envelope reference." },
  { name: "externalConfirmationGateRef", schema: typedRefSchema("ExternalConfirmationGate", "seq_343", "External confirmation gate reference.", true), description: "External confirmation gate reference." },
  { name: "authoritativeProofRef", schema: primitiveString("Authoritative proof reference."), description: "Authoritative proof reference." },
  { name: "supersededByAttemptRef", schema: typedRefSchema("PharmacyDispatchAttempt", "seq_343", "Superseding attempt reference.", true), description: "Superseding attempt reference." },
  { name: "attemptedAt", schema: isoDateTime("Attempt timestamp."), description: "Attempt timestamp." },
  { name: "confirmedAt", schema: { oneOf: [isoDateTime("Confirmation timestamp."), { type: "null" }] }, description: "Confirmation timestamp when proof satisfied." },
];

const proofEnvelopeFields: FieldDef[] = [
  { name: "dispatchProofEnvelopeId", schema: primitiveString("Proof envelope identifier."), description: "Proof envelope identifier." },
  { name: "dispatchAttemptId", schema: primitiveString("Dispatch attempt identifier."), description: "Dispatch attempt identifier." },
  { name: "transportAssuranceProfileRef", schema: typedRefSchema("TransportAssuranceProfile", "seq_343", "Transport assurance profile reference.", false), description: "Transport assurance profile reference." },
  { name: "proofDeadlineAt", schema: isoDateTime("Proof deadline timestamp."), description: "Proof deadline timestamp." },
  { name: "proofSources", schema: { type: "array", items: primitiveString("Proof source.") }, description: "Permitted proof sources." },
  { name: "transportAcceptanceEvidenceRefs", schema: { type: "array", items: primitiveString("Transport acceptance evidence reference.") }, description: "Transport acceptance evidence references." },
  { name: "providerAcceptanceEvidenceRefs", schema: { type: "array", items: primitiveString("Provider acceptance evidence reference.") }, description: "Provider acceptance evidence references." },
  { name: "deliveryEvidenceRefs", schema: { type: "array", items: primitiveString("Delivery evidence reference.") }, description: "Delivery evidence references." },
  { name: "authoritativeProofSourceRef", schema: { oneOf: [primitiveString("Authoritative proof source reference."), { type: "null" }] }, description: "Authoritative proof source reference." },
  { name: "proofComponents", schema: { type: "array", items: primitiveString("Proof component reference.") }, description: "Proof component references." },
  { name: "proofConfidence", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Proof confidence." },
  { name: "dispatchConfidence", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Dispatch confidence." },
  { name: "contradictionScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Contradiction score." },
  { name: "sourceCorrelationRefs", schema: { type: "array", items: primitiveString("Source correlation reference.") }, description: "Source correlation references." },
  { name: "duplicateOfRef", schema: { oneOf: [primitiveString("Duplicate envelope reference."), { type: "null" }] }, description: "Duplicate envelope reference when evidence belongs to an earlier attempt." },
  { name: "proofState", schema: { type: "string", enum: proofStates }, description: "Proof state." },
  { name: "riskState", schema: { type: "string", enum: riskStates }, description: "Risk state." },
  { name: "stateConfidenceBand", schema: { type: "string", enum: confidenceBands }, description: "State confidence band." },
  { name: "calibrationVersion", schema: primitiveString("Calibration version."), description: "Calibration version." },
  { name: "causalToken", schema: primitiveString("Causal token."), description: "Causal token." },
  { name: "monotoneRevision", schema: { type: "integer", minimum: 0 }, description: "Monotone revision number." },
  { name: "verifiedAt", schema: isoDateTime("Verification timestamp."), description: "Verification timestamp." },
];

const manualDispatchFields: FieldDef[] = [
  { name: "manualDispatchAssistanceRecordId", schema: primitiveString("Manual dispatch assistance identifier."), description: "Manual dispatch assistance identifier." },
  { name: "dispatchAttemptId", schema: primitiveString("Dispatch attempt identifier."), description: "Dispatch attempt identifier." },
  { name: "operatorRef", schema: primitiveString("Operator reference."), description: "Operator reference." },
  { name: "operatorActionRef", schema: primitiveString("Operator action reference."), description: "Operator action reference." },
  { name: "secondReviewerRef", schema: { oneOf: [primitiveString("Second reviewer reference."), { type: "null" }] }, description: "Second reviewer reference." },
  { name: "evidenceRefs", schema: { type: "array", items: primitiveString("Operator evidence reference.") }, description: "Operator evidence references." },
  { name: "attestationState", schema: { type: "string", enum: ["pending", "attested", "rejected"] }, description: "Attestation state." },
  { name: "completedAt", schema: { oneOf: [isoDateTime("Completion timestamp."), { type: "null" }] }, description: "Completion timestamp." },
];

const dispatchSettlementFields: FieldDef[] = [
  { name: "settlementId", schema: primitiveString("Dispatch settlement identifier."), description: "Dispatch settlement identifier." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "dispatchAttemptId", schema: primitiveString("Dispatch attempt identifier."), description: "Dispatch attempt identifier." },
  { name: "dispatchPlanRef", schema: typedRefSchema("PharmacyDispatchPlan", "seq_343", "Dispatch plan reference.", false), description: "Dispatch plan reference." },
  { name: "routeIntentBindingRef", schema: primitiveString("Route intent binding reference."), description: "Route intent binding reference." },
  { name: "canonicalObjectDescriptorRef", schema: primitiveString("Canonical object descriptor reference."), description: "Canonical object descriptor reference." },
  { name: "governingObjectVersionRef", schema: primitiveString("Governing object version reference."), description: "Governing object version reference." },
  { name: "routeIntentTupleHash", schema: primitiveString("Route intent tuple hash."), description: "Route intent tuple hash." },
  { name: "proofEnvelopeRef", schema: typedRefSchema("DispatchProofEnvelope", "seq_343", "Proof envelope reference.", false), description: "Proof envelope reference." },
  { name: "transportAssuranceProfileRef", schema: typedRefSchema("TransportAssuranceProfile", "seq_343", "Transport assurance profile reference.", false), description: "Transport assurance profile reference." },
  { name: "dispatchAdapterBindingRef", schema: typedRefSchema("DispatchAdapterBinding", "seq_343", "Dispatch adapter binding reference.", false), description: "Dispatch adapter binding reference." },
  { name: "consentCheckpointRef", schema: typedRefSchema("PharmacyConsentCheckpoint", "seq_343", "Consent checkpoint reference.", false), description: "Consent checkpoint reference." },
  { name: "result", schema: { type: "string", enum: ["live_referral_confirmed", "pending_ack", "stale_choice_or_consent", "denied_scope", "reconciliation_required"] }, description: "Settlement result." },
  { name: "proofRiskState", schema: { type: "string", enum: riskStates }, description: "Proof risk state." },
  { name: "stateConfidenceBand", schema: { type: "string", enum: confidenceBands }, description: "State confidence band." },
  { name: "calibrationVersion", schema: primitiveString("Calibration version."), description: "Calibration version." },
  { name: "receiptTextRef", schema: primitiveString("Receipt text reference."), description: "Receipt text reference." },
  { name: "experienceContinuityEvidenceRef", schema: primitiveString("Experience continuity evidence reference."), description: "Experience continuity evidence reference." },
  { name: "causalToken", schema: primitiveString("Causal token."), description: "Causal token." },
  { name: "recoveryRouteRef", schema: typedRefSchema("PharmacyBounceBackRecord", "seq_344", "Recovery route reference for reopen, bounce-back, or urgent-return follow-on.", true), description: "Recovery route reference for reopen, bounce-back, or urgent-return follow-on." },
  { name: "monotoneRevision", schema: { type: "integer", minimum: 0 }, description: "Monotone revision number." },
  { name: "recordedAt", schema: isoDateTime("Record timestamp."), description: "Record timestamp." },
];

const continuityProjectionFields: FieldDef[] = [
  { name: "pharmacyContinuityEvidenceProjectionId", schema: primitiveString("Continuity projection identifier."), description: "Continuity projection identifier." },
  { name: "routeFamilyRef", schema: primitiveString("Route family reference."), description: "Route family reference." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "selectedProviderRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Selected provider reference.", false), description: "Selected provider reference." },
  { name: "latestConsentCheckpointRef", schema: typedRefSchema("PharmacyConsentCheckpoint", "seq_343", "Latest consent checkpoint reference.", false), description: "Latest consent checkpoint reference." },
  { name: "latestConsentRevocationRef", schema: typedRefSchema("PharmacyConsentRevocationRecord", "seq_343", "Latest consent revocation reference.", true), description: "Latest consent revocation reference." },
  { name: "latestDispatchSettlementRef", schema: typedRefSchema("PharmacyDispatchSettlement", "seq_343", "Latest dispatch settlement reference.", true), description: "Latest dispatch settlement reference." },
  { name: "latestOutcomeSettlementRef", schema: typedRefSchema("PharmacyOutcomeSettlement", "seq_343", "Latest outcome settlement reference.", true), description: "Latest outcome settlement reference." },
  { name: "latestOutcomeTruthRef", schema: typedRefSchema("PharmacyOutcomeTruthProjection", "seq_343", "Latest outcome truth projection reference.", true), description: "Latest outcome truth projection reference." },
  { name: "latestOutcomeReconciliationGateRef", schema: typedRefSchema("PharmacyOutcomeReconciliationGate", "seq_343", "Latest outcome reconciliation gate reference.", true), description: "Latest outcome reconciliation gate reference." },
  { name: "experienceContinuityEvidenceRef", schema: primitiveString("Experience continuity evidence reference."), description: "Experience continuity evidence reference." },
  { name: "validationState", schema: { type: "string", enum: ["trusted", "degraded", "stale", "blocked"] }, description: "Continuity validation state." },
  { name: "blockingRefs", schema: { type: "array", items: primitiveString("Blocking reference.") }, description: "Blocking references." },
  { name: "capturedAt", schema: isoDateTime("Capture timestamp."), description: "Capture timestamp." },
];

const dispatchTruthProjectionFields: FieldDef[] = [
  { name: "pharmacyDispatchTruthProjectionId", schema: primitiveString("Dispatch truth projection identifier."), description: "Dispatch truth projection identifier." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "dispatchAttemptRef", schema: typedRefSchema("PharmacyDispatchAttempt", "seq_343", "Dispatch attempt reference.", false), description: "Dispatch attempt reference." },
  { name: "dispatchPlanRef", schema: typedRefSchema("PharmacyDispatchPlan", "seq_343", "Dispatch plan reference.", false), description: "Dispatch plan reference." },
  { name: "selectedProviderRef", schema: typedRefSchema("PharmacyProvider", "seq_343", "Selected provider reference.", false), description: "Selected provider reference." },
  { name: "packageId", schema: primitiveString("Package identifier."), description: "Package identifier." },
  { name: "packageHash", schema: primitiveString("Package hash."), description: "Package hash." },
  { name: "transportMode", schema: { type: "string", enum: transportModes }, description: "Transport mode." },
  { name: "transportAssuranceProfileRef", schema: typedRefSchema("TransportAssuranceProfile", "seq_343", "Transport assurance profile reference.", false), description: "Transport assurance profile reference." },
  { name: "dispatchAdapterBindingRef", schema: typedRefSchema("DispatchAdapterBinding", "seq_343", "Dispatch adapter binding reference.", false), description: "Dispatch adapter binding reference." },
  { name: "dispatchPlanHash", schema: primitiveString("Dispatch plan hash."), description: "Dispatch plan hash." },
  { name: "transportAcceptanceState", schema: { type: "string", enum: ["none", "accepted", "rejected", "timed_out", "disputed"] }, description: "Transport acceptance state." },
  { name: "providerAcceptanceState", schema: { type: "string", enum: ["none", "accepted", "rejected", "timed_out", "disputed"] }, description: "Provider acceptance state." },
  { name: "authoritativeProofState", schema: { type: "string", enum: proofStates }, description: "Authoritative proof state." },
  { name: "proofRiskState", schema: { type: "string", enum: riskStates }, description: "Proof risk state." },
  { name: "dispatchConfidence", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Dispatch confidence." },
  { name: "contradictionScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Contradiction score." },
  { name: "proofDeadlineAt", schema: isoDateTime("Proof deadline timestamp."), description: "Proof deadline timestamp." },
  { name: "outboundReferenceSetHash", schema: primitiveString("Outbound reference set hash."), description: "Outbound reference set hash." },
  { name: "proofEnvelopeRef", schema: typedRefSchema("DispatchProofEnvelope", "seq_343", "Proof envelope reference.", false), description: "Proof envelope reference." },
  { name: "dispatchSettlementRef", schema: typedRefSchema("PharmacyDispatchSettlement", "seq_343", "Dispatch settlement reference.", false), description: "Dispatch settlement reference." },
  { name: "continuityEvidenceRef", schema: typedRefSchema("PharmacyContinuityEvidenceProjection", "seq_343", "Continuity evidence reference.", false), description: "Continuity evidence reference." },
  { name: "audienceMessageRef", schema: primitiveString("Audience message reference."), description: "Audience message reference." },
  { name: "computedAt", schema: isoDateTime("Computation timestamp."), description: "Computation timestamp." },
];

const outcomeEnvelopeFields: FieldDef[] = [
  { name: "outcomeEvidenceEnvelopeId", schema: primitiveString("Outcome evidence envelope identifier."), description: "Outcome evidence envelope identifier." },
  { name: "sourceType", schema: { type: "string", enum: outcomeSourceFamilies }, description: "Outcome source family." },
  { name: "sourceMessageKey", schema: primitiveString("Source message key."), description: "Source message key." },
  { name: "rawPayloadHash", schema: primitiveString("Raw payload hash."), description: "Raw payload hash." },
  { name: "semanticPayloadHash", schema: primitiveString("Semantic payload hash."), description: "Semantic payload hash." },
  { name: "replayKey", schema: primitiveString("Replay key."), description: "Replay key." },
  { name: "decisionClass", schema: { type: "string", enum: replayPostures }, description: "Replay posture classification." },
  { name: "parserVersion", schema: primitiveString("Parser version."), description: "Parser version." },
  { name: "receivedAt", schema: isoDateTime("Receive timestamp."), description: "Receive timestamp." },
  { name: "trustClass", schema: { type: "string", enum: ["trusted_structured", "trusted_observed", "email_low_assurance", "manual_operator_entered"] }, description: "Trust class." },
  { name: "correlationRefs", schema: { type: "array", items: primitiveString("Correlation reference.") }, description: "Correlation references." },
  { name: "dedupeState", schema: { type: "string", enum: ["new", "duplicate", "collision_review"] }, description: "Dedupe state." },
];

const outcomeIngestFields: FieldDef[] = [
  { name: "ingestAttemptId", schema: primitiveString("Outcome ingest attempt identifier."), description: "Outcome ingest attempt identifier." },
  { name: "outcomeEvidenceEnvelopeRef", schema: typedRefSchema("OutcomeEvidenceEnvelope", "seq_343", "Outcome evidence envelope reference.", false), description: "Outcome evidence envelope reference." },
  { name: "pharmacyCaseId", schema: { oneOf: [primitiveString("Matched pharmacy case identifier."), { type: "null" }] }, description: "Matched pharmacy case identifier when one exists." },
  { name: "bestCandidateCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Best candidate case reference.", true), description: "Best candidate case reference." },
  { name: "runnerUpCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Runner-up case reference.", true), description: "Runner-up case reference." },
  { name: "matchState", schema: { type: "string", enum: ["strong_match", "review_required", "unmatched"] }, description: "Match state." },
  { name: "matchScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Best match score." },
  { name: "runnerUpMatchScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Runner-up match score." },
  { name: "posteriorMatchConfidence", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Posterior match confidence." },
  { name: "contradictionScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Contradiction score." },
  { name: "classificationState", schema: { type: "string", enum: outcomeClassifications }, description: "Outcome classification state." },
  { name: "replayState", schema: { type: "string", enum: replayPostures }, description: "Replay state." },
  { name: "manualReviewState", schema: { type: "string", enum: ["none", "required", "in_review", "approved_apply", "approved_reopen", "approved_unmatched"] }, description: "Manual review state." },
  { name: "outcomeReconciliationGateRef", schema: typedRefSchema("PharmacyOutcomeReconciliationGate", "seq_343", "Outcome reconciliation gate reference.", true), description: "Outcome reconciliation gate reference." },
  { name: "autoApplyEligible", schema: { type: "boolean" }, description: "Whether auto-apply remains eligible." },
  { name: "closeEligibilityState", schema: { type: "string", enum: ["blocked_by_reconciliation", "blocked_by_safety", "eligible_pending_projection", "not_closable"] }, description: "Close eligibility state." },
  { name: "settlementState", schema: { type: "string", enum: ["unsettled", "duplicate_ignored", "review_required", "resolved_pending_projection", "reopened_for_safety", "unmatched"] }, description: "Settlement state." },
  { name: "createdAt", schema: isoDateTime("Creation timestamp."), description: "Creation timestamp." },
  { name: "settledAt", schema: { oneOf: [isoDateTime("Settlement timestamp."), { type: "null" }] }, description: "Settlement timestamp." },
];

const reconciliationGateFields: FieldDef[] = [
  { name: "outcomeReconciliationGateId", schema: primitiveString("Outcome reconciliation gate identifier."), description: "Outcome reconciliation gate identifier." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "ingestAttemptRef", schema: typedRefSchema("PharmacyOutcomeIngestAttempt", "seq_343", "Ingest attempt reference.", false), description: "Ingest attempt reference." },
  { name: "outcomeEvidenceEnvelopeRef", schema: typedRefSchema("OutcomeEvidenceEnvelope", "seq_343", "Outcome evidence envelope reference.", false), description: "Outcome evidence envelope reference." },
  { name: "candidateCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Candidate case reference.", false), description: "Candidate case reference." },
  { name: "runnerUpCaseRef", schema: typedRefSchema("PharmacyCase", "seq_342", "Runner-up case reference.", true), description: "Runner-up case reference." },
  { name: "matchScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Match score." },
  { name: "runnerUpMatchScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Runner-up match score." },
  { name: "posteriorMatchConfidence", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Posterior match confidence." },
  { name: "contradictionScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Contradiction score." },
  { name: "classificationState", schema: { type: "string", enum: outcomeClassifications }, description: "Outcome classification state." },
  { name: "gateState", schema: { type: "string", enum: ["open", "in_review", "resolved_apply", "resolved_reopen", "resolved_unmatched", "superseded"] }, description: "Gate state." },
  { name: "manualReviewState", schema: { type: "string", enum: ["required", "in_review", "approved_apply", "approved_reopen", "approved_unmatched", "dismissed"] }, description: "Manual review state." },
  { name: "blockingClosureState", schema: { type: "string", enum: ["blocks_close", "operational_only"] }, description: "Blocking closure posture." },
  { name: "patientVisibilityState", schema: { type: "string", enum: ["review_placeholder", "hidden"] }, description: "Patient visibility state." },
  { name: "currentOwnerRef", schema: primitiveString("Current owner reference."), description: "Current owner reference." },
  { name: "resolutionNotesRef", schema: { oneOf: [primitiveString("Resolution notes reference."), { type: "null" }] }, description: "Resolution notes reference." },
  { name: "openedAt", schema: isoDateTime("Open timestamp."), description: "Open timestamp." },
  { name: "resolvedAt", schema: { oneOf: [isoDateTime("Resolve timestamp."), { type: "null" }] }, description: "Resolve timestamp." },
];

const outcomeSettlementFields: FieldDef[] = [
  { name: "settlementId", schema: primitiveString("Outcome settlement identifier."), description: "Outcome settlement identifier." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "ingestAttemptId", schema: primitiveString("Ingest attempt identifier."), description: "Ingest attempt identifier." },
  { name: "consentCheckpointRef", schema: typedRefSchema("PharmacyConsentCheckpoint", "seq_343", "Consent checkpoint reference.", true), description: "Consent checkpoint reference." },
  { name: "outcomeReconciliationGateRef", schema: typedRefSchema("PharmacyOutcomeReconciliationGate", "seq_343", "Outcome reconciliation gate reference.", true), description: "Outcome reconciliation gate reference." },
  { name: "result", schema: { type: "string", enum: ["resolved_pending_projection", "reopened_for_safety", "review_required", "unmatched", "duplicate_ignored"] }, description: "Settlement result." },
  { name: "matchConfidenceBand", schema: { type: "string", enum: confidenceBands }, description: "Match confidence band." },
  { name: "closeEligibilityState", schema: { type: "string", enum: ["blocked_by_reconciliation", "blocked_by_safety", "eligible_pending_projection", "not_closable"] }, description: "Close eligibility state." },
  { name: "receiptTextRef", schema: primitiveString("Receipt text reference."), description: "Receipt text reference." },
  { name: "experienceContinuityEvidenceRef", schema: primitiveString("Experience continuity evidence reference."), description: "Experience continuity evidence reference." },
  { name: "causalToken", schema: primitiveString("Causal token."), description: "Causal token." },
  { name: "recoveryRouteRef", schema: typedRefSchema("PharmacyBounceBackRecord", "seq_344", "Recovery route reference for reopen, bounce-back, or urgent-return follow-on.", true), description: "Recovery route reference for reopen, bounce-back, or urgent-return follow-on." },
  { name: "recordedAt", schema: isoDateTime("Record timestamp."), description: "Record timestamp." },
];

const outcomeTruthProjectionFields: FieldDef[] = [
  { name: "pharmacyOutcomeTruthProjectionId", schema: primitiveString("Outcome truth projection identifier."), description: "Outcome truth projection identifier." },
  { name: "pharmacyCaseId", schema: primitiveString("Owning pharmacy case identifier."), description: "Owning pharmacy case identifier." },
  { name: "latestOutcomeSettlementRef", schema: typedRefSchema("PharmacyOutcomeSettlement", "seq_343", "Latest outcome settlement reference.", true), description: "Latest outcome settlement reference." },
  { name: "latestOutcomeRecordRef", schema: primitiveString("Latest outcome record reference."), description: "Latest outcome record reference." },
  { name: "latestIngestAttemptRef", schema: typedRefSchema("PharmacyOutcomeIngestAttempt", "seq_343", "Latest ingest attempt reference.", true), description: "Latest ingest attempt reference." },
  { name: "outcomeReconciliationGateRef", schema: typedRefSchema("PharmacyOutcomeReconciliationGate", "seq_343", "Outcome reconciliation gate reference.", true), description: "Outcome reconciliation gate reference." },
  { name: "outcomeTruthState", schema: { type: "string", enum: outcomeTruthStates }, description: "Outcome truth state." },
  { name: "resolutionClass", schema: { oneOf: [{ type: "string", enum: outcomeClassifications }, { type: "null" }] }, description: "Resolution class." },
  { name: "matchConfidenceBand", schema: { type: "string", enum: confidenceBands }, description: "Match confidence band." },
  { name: "contradictionScore", schema: { type: "number", minimum: 0, maximum: 1 }, description: "Contradiction score." },
  { name: "manualReviewState", schema: { type: "string", enum: ["none", "required", "in_review", "approved_apply", "approved_reopen", "approved_unmatched"] }, description: "Manual review state." },
  { name: "closeEligibilityState", schema: { type: "string", enum: ["blocked_by_reconciliation", "blocked_by_safety", "eligible_pending_projection", "not_closable"] }, description: "Close eligibility state." },
  { name: "patientVisibilityState", schema: { type: "string", enum: ["review_placeholder", "recovery_required", "quiet_result", "hidden"] }, description: "Patient visibility state." },
  { name: "continuityEvidenceRef", schema: typedRefSchema("PharmacyContinuityEvidenceProjection", "seq_343", "Continuity evidence reference.", false), description: "Continuity evidence reference." },
  { name: "audienceMessageRef", schema: primitiveString("Audience message reference."), description: "Audience message reference." },
  { name: "computedAt", schema: isoDateTime("Computation timestamp."), description: "Computation timestamp." },
];

const directoryChoiceSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Phase6DirectoryChoiceContracts",
  description: "Frozen Phase 6 directory discovery, provider choice, choice truth, consent, and consent-drift contract pack.",
  type: "object",
  additionalProperties: false,
  required: ["taskId", "contractVersion", "adapterModes", "providerCapabilityStates", "choiceVisibilityStates"],
  properties: {
    taskId: { const: TASK_ID },
    contractVersion: { const: CONTRACT_VERSION },
    adapterModes: { type: "array", items: { type: "string", enum: discoveryAdapterModes } },
    providerCapabilityStates: { type: "array", items: { type: "string", enum: providerCapabilityStates } },
    choiceVisibilityStates: { type: "array", items: { type: "string", enum: choiceVisibilityStates } },
    noHiddenTopKLaw: { const: true },
    fullChoiceVisibilityLaw: { const: "recommended_frontier_must_be_subset_of_full_visible_set" },
  },
  $defs: {
    PharmacyDirectorySourceSnapshot: buildObjectSchema(
      "PharmacyDirectorySourceSnapshot",
      "One persisted source observation from a directory adapter execution.",
      directorySourceSnapshotFields,
    ),
    PharmacyDirectorySnapshot: buildObjectSchema(
      "PharmacyDirectorySnapshot",
      "Normalized directory snapshot for one pharmacy choice refresh.",
      directorySnapshotFields,
    ),
    PharmacyProviderCapabilitySnapshot: buildObjectSchema(
      "PharmacyProviderCapabilitySnapshot",
      "Provider capability snapshot used by discovery and dispatch planning.",
      providerCapabilitySnapshotFields,
    ),
    PharmacyProvider: buildObjectSchema(
      "PharmacyProvider",
      "Normalized provider abstraction for patient and staff choice surfaces.",
      providerFields,
    ),
    PharmacyChoiceProof: buildObjectSchema(
      "PharmacyChoiceProof",
      "Auditable visible frontier and recommended frontier proof.",
      choiceProofFields,
    ),
    PharmacyChoiceExplanation: buildObjectSchema(
      "PharmacyChoiceExplanation",
      "Provider-specific explanation bundle tied to the current proof and disclosure policy.",
      choiceExplanationFields,
    ),
    PharmacyChoiceDisclosurePolicy: buildObjectSchema(
      "PharmacyChoiceDisclosurePolicy",
      "Policy describing what is visible, warned, or suppressed from the same proof.",
      disclosurePolicyFields,
    ),
    PharmacyChoiceOverrideAcknowledgement: buildObjectSchema(
      "PharmacyChoiceOverrideAcknowledgement",
      "Recorded acknowledgement for warned or policy-overridden provider choice.",
      overrideAckFields,
    ),
    PharmacyChoiceSession: buildObjectSchema(
      "PharmacyChoiceSession",
      "Durable choice session with the full visible provider set and current selection provenance.",
      choiceSessionFields,
    ),
    PharmacyChoiceTruthProjection: buildObjectSchema(
      "PharmacyChoiceTruthProjection",
      "Audience-safe choice truth projection derived from the same proof, disclosure policy, and current selection provenance.",
      choiceTruthProjectionFields,
    ),
    PharmacyConsentRecord: buildObjectSchema(
      "PharmacyConsentRecord",
      "Explicit consent record bound to provider, proof, explanation, and scope.",
      consentRecordFields,
    ),
    PharmacyConsentCheckpoint: buildObjectSchema(
      "PharmacyConsentCheckpoint",
      "Single authority for whether dispatch and reassurance may proceed.",
      consentCheckpointFields,
    ),
    PharmacyConsentRevocationRecord: buildObjectSchema(
      "PharmacyConsentRevocationRecord",
      "Revocation or drift record that invalidates prior calm use of consent.",
      revocationFields,
    ),
  },
  "x-vecells-task-id": TASK_ID,
  "x-vecells-contract-version": CONTRACT_VERSION,
};

const dispatchSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Phase6DispatchContracts",
  description: "Frozen Phase 6 referral package, dispatch plan, proof, settlement, and continuity contract pack.",
  type: "object",
  additionalProperties: false,
  required: ["taskId", "contractVersion", "transportModes", "proofStates", "riskStates"],
  properties: {
    taskId: { const: TASK_ID },
    contractVersion: { const: CONTRACT_VERSION },
    transportModes: { type: "array", items: { type: "string", enum: transportModes } },
    proofStates: { type: "array", items: { type: "string", enum: proofStates } },
    riskStates: { type: "array", items: { type: "string", enum: riskStates } },
    noProofEqualsCompletionLaw: { const: true },
    dispatchTruthSeparatedFromOutcomeTruth: { const: true },
  },
  $defs: {
    PharmacyReferralPackage: buildObjectSchema(
      "PharmacyReferralPackage",
      "Frozen referral package bound to provider choice, consent, and lineage state.",
      dispatchPackageFields,
    ),
    PharmacyDispatchPlan: buildObjectSchema(
      "PharmacyDispatchPlan",
      "Transport-bound dispatch plan resolved from the frozen referral package.",
      dispatchPlanFields,
    ),
    DispatchAdapterBinding: buildObjectSchema(
      "DispatchAdapterBinding",
      "Versioned adapter binding for the chosen transport path.",
      dispatchAdapterBindingFields,
    ),
    ReferralArtifactManifest: buildObjectSchema(
      "ReferralArtifactManifest",
      "Manifest proving which artifacts were included, redacted, or omitted for transport.",
      artifactManifestFields,
    ),
    PharmacyDispatchAttempt: buildObjectSchema(
      "PharmacyDispatchAttempt",
      "Governed dispatch attempt aligned with the canonical Phase 0 effect ledger.",
      dispatchAttemptFields,
    ),
    DispatchProofEnvelope: buildObjectSchema(
      "DispatchProofEnvelope",
      "Single proof envelope separating transport acceptance, provider acceptance, delivery hints, and authoritative proof.",
      proofEnvelopeFields,
    ),
    ManualDispatchAssistanceRecord: buildObjectSchema(
      "ManualDispatchAssistanceRecord",
      "Operator and second-review evidence for manual assisted dispatch.",
      manualDispatchFields,
    ),
    PharmacyDispatchSettlement: buildObjectSchema(
      "PharmacyDispatchSettlement",
      "Settlement object tying proof envelope, consent checkpoint, and result posture together.",
      dispatchSettlementFields,
    ),
    PharmacyContinuityEvidenceProjection: buildObjectSchema(
      "PharmacyContinuityEvidenceProjection",
      "Continuity evidence projection used to decide whether audience-safe calmness is allowed.",
      continuityProjectionFields,
    ),
  },
  "x-vecells-task-id": TASK_ID,
  "x-vecells-contract-version": CONTRACT_VERSION,
};

const dispatchTruthProjectionSchema = {
  ...buildObjectSchema(
    "PharmacyDispatchTruthProjection",
    "Audience-safe dispatch truth projection derived from the authoritative proof envelope and continuity evidence.",
    dispatchTruthProjectionFields,
  ),
  "x-vecells-task-id": TASK_ID,
  "x-vecells-contract-version": CONTRACT_VERSION,
};

const outcomeReconciliationSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Phase6OutcomeReconciliationContracts",
  description: "Frozen Phase 6 outcome ingest, replay, matching, reconciliation, and settlement contract pack.",
  type: "object",
  additionalProperties: false,
  required: [
    "taskId",
    "contractVersion",
    "outcomeSourceFamilies",
    "replayPostures",
    "outcomeClassifications",
    "matchingAlgorithm",
    "sourceFamilyPolicies",
  ],
  properties: {
    taskId: { const: TASK_ID },
    contractVersion: { const: CONTRACT_VERSION },
    outcomeSourceFamilies: { type: "array", items: { type: "string", enum: outcomeSourceFamilies } },
    replayPostures: { type: "array", items: { type: "string", enum: replayPostures } },
    outcomeClassifications: { type: "array", items: { type: "string", enum: outcomeClassifications } },
    matchingAlgorithm: {
      type: "object",
      additionalProperties: false,
      required: ["formulae", "thresholds"],
      properties: {
        formulae: {
          type: "object",
          additionalProperties: false,
          required: ["rawMatch", "matchScore", "posterior"],
          properties: {
            rawMatch: {
              const: "rawMatch(c,e) = product_k max(epsilon, m_k(c,e))^{omega_k}",
            },
            matchScore: {
              const: "matchScore(c,e) = sourceFloor_e * rawMatch(c,e) * (1 - m_contra(c,e))^{lambda_match_contra}",
            },
            posterior: {
              const: "posterior(c | e) = exp(kappa_match * matchScore(c,e)) / sum_{c'} exp(kappa_match * matchScore(c',e))",
            },
          },
        },
        thresholds: {
          type: "object",
          additionalProperties: false,
          required: [
            "tau_patient_floor",
            "tau_service_floor",
            "tau_route_floor",
            "tau_match_time",
            "tau_strong_match",
            "tau_posterior_strong",
            "delta_match",
            "tau_contra_apply",
            "lambda_match_contra",
            "kappa_match",
          ],
          properties: {
            tau_patient_floor: { const: 0.92 },
            tau_service_floor: { const: 0.75 },
            tau_route_floor: { const: 0.7 },
            tau_match_time: { const: 720 },
            tau_strong_match: { const: 0.86 },
            tau_posterior_strong: { const: 0.8 },
            delta_match: { const: 0.12 },
            tau_contra_apply: { const: 0.2 },
            lambda_match_contra: { const: 1.6 },
            kappa_match: { const: 6 },
          },
        },
      },
    },
    sourceFamilyPolicies: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sourceFamily", "sourceFloor", "autoApplyPolicy", "manualReviewPolicy"],
        properties: {
          sourceFamily: { type: "string", enum: outcomeSourceFamilies },
          sourceFloor: { type: "number", minimum: 0, maximum: 1 },
          autoApplyPolicy: { type: "string", minLength: 1 },
          manualReviewPolicy: { type: "string", minLength: 1 },
        },
      },
    },
    noCompletionFromSilenceLaw: { const: true },
    weakMatchBypassesClosureForbidden: { const: true },
  },
  $defs: {
    OutcomeEvidenceEnvelope: buildObjectSchema(
      "OutcomeEvidenceEnvelope",
      "Immutable canonicalized outcome evidence envelope.",
      outcomeEnvelopeFields,
    ),
    PharmacyOutcomeIngestAttempt: buildObjectSchema(
      "PharmacyOutcomeIngestAttempt",
      "Governed ingest attempt for one envelope against the current case set.",
      outcomeIngestFields,
    ),
    PharmacyOutcomeReconciliationGate: buildObjectSchema(
      "PharmacyOutcomeReconciliationGate",
      "Dedicated weak-match review seam that blocks closure while open.",
      reconciliationGateFields,
    ),
    PharmacyOutcomeSettlement: buildObjectSchema(
      "PharmacyOutcomeSettlement",
      "Outcome settlement object produced after ingest and gate resolution.",
      outcomeSettlementFields,
    ),
  },
  "x-vecells-task-id": TASK_ID,
  "x-vecells-contract-version": CONTRACT_VERSION,
};

const outcomeTruthProjectionSchema = {
  ...buildObjectSchema(
    "PharmacyOutcomeTruthProjection",
    "Audience-safe outcome truth projection derived from ingest attempts, reconciliation gates, and continuity evidence.",
    outcomeTruthProjectionFields,
  ),
  "x-vecells-task-id": TASK_ID,
  "x-vecells-contract-version": CONTRACT_VERSION,
};

const transportAssuranceRegistry = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  transportModes,
  calibratedCompetingRiskModel: {
    formulae: {
      lambda: "lambda_k(u | x_a) = P(T_a = u, J_a = k | T_a >= u, x_a)",
      survival: "S_a(u | x_a) = prod_{v = 1}^{u} (1 - sum_k lambda_k(v | x_a))",
      cumulativeIncidence: "F_k(u | x_a) = sum_{v = 1}^{u} lambda_k(v | x_a) * S_a(v - 1 | x_a)",
      calibratedProbability: "p_k(u | x_a) = Cal_dispatch,k(F_k(u | x_a))",
    },
    riskStateMapping: {
      on_track: "max_k p_k(u | x_a) < theta_dispatch_track",
      at_risk: "theta_dispatch_track <= max_k p_k(u | x_a) < theta_dispatch_fail",
      likely_failed: "max_k p_k(u | x_a) >= theta_dispatch_fail",
      disputed: "contradictionScore(a) > contradictionThreshold or contradictory authoritative evidence exists",
    },
    localAdapterDefaultsForbidden: true,
  },
  profiles: transportProfiles,
};

const eventRegistry = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  events: [
    { eventName: "pharmacy.directory.snapshot.created", eventFamily: "discovery", aggregate: "PharmacyDirectorySnapshot", summary: "A normalized directory snapshot has been persisted for the case." },
    { eventName: "pharmacy.directory.source.snapshot.recorded", eventFamily: "discovery", aggregate: "PharmacyDirectorySourceSnapshot", summary: "A raw source snapshot has been recorded for one adapter." },
    { eventName: "pharmacy.choice.proof.created", eventFamily: "choice", aggregate: "PharmacyChoiceProof", summary: "A full visible choice proof and frontier have been published." },
    { eventName: "pharmacy.choice.truth.projected", eventFamily: "choice", aggregate: "PharmacyChoiceTruthProjection", summary: "Choice truth projection has been refreshed for audience-safe chooser and assist surfaces." },
    { eventName: "pharmacy.choice.override.acknowledged", eventFamily: "choice", aggregate: "PharmacyChoiceOverrideAcknowledgement", summary: "A warned-choice or policy-override acknowledgement has been recorded." },
    { eventName: "pharmacy.consent.captured", eventFamily: "consent", aggregate: "PharmacyConsentRecord", summary: "Consent has been captured for the selected provider, proof, and scope." },
    { eventName: "pharmacy.consent.checkpoint.satisfied", eventFamily: "consent", aggregate: "PharmacyConsentCheckpoint", summary: "The current consent checkpoint is satisfied for dispatch." },
    { eventName: "pharmacy.consent.checkpoint.unsatisfied", eventFamily: "consent", aggregate: "PharmacyConsentCheckpoint", summary: "The current consent checkpoint is not satisfied and dispatch is blocked." },
    { eventName: "pharmacy.referral.package.frozen", eventFamily: "dispatch", aggregate: "PharmacyReferralPackage", summary: "A canonical referral package has been frozen." },
    { eventName: "pharmacy.dispatch.plan.created", eventFamily: "dispatch", aggregate: "PharmacyDispatchPlan", summary: "A transport-bound dispatch plan has been created." },
    { eventName: "pharmacy.dispatch.attempt.created", eventFamily: "dispatch", aggregate: "PharmacyDispatchAttempt", summary: "A governed dispatch attempt has been started." },
    { eventName: "pharmacy.dispatch.proof.updated", eventFamily: "dispatch", aggregate: "DispatchProofEnvelope", summary: "Dispatch proof evidence has updated the current proof envelope." },
    { eventName: "pharmacy.dispatch.settled", eventFamily: "dispatch", aggregate: "PharmacyDispatchSettlement", summary: "Dispatch settlement has been recomputed for the active attempt." },
    { eventName: "pharmacy.dispatch.truth.projected", eventFamily: "dispatch", aggregate: "PharmacyDispatchTruthProjection", summary: "Dispatch truth projection has been refreshed for audience-safe surfaces." },
    { eventName: "pharmacy.outcome.evidence.received", eventFamily: "outcome", aggregate: "OutcomeEvidenceEnvelope", summary: "Outcome evidence has been canonicalized into an immutable envelope." },
    { eventName: "pharmacy.outcome.ingest.attempted", eventFamily: "outcome", aggregate: "PharmacyOutcomeIngestAttempt", summary: "Outcome ingest has been attempted against the current case set." },
    { eventName: "pharmacy.outcome.replay.ignored", eventFamily: "outcome", aggregate: "PharmacyOutcomeSettlement", summary: "Exact or semantic replay has been settled back to the prior accepted outcome." },
    { eventName: "pharmacy.outcome.reconciliation.opened", eventFamily: "outcome", aggregate: "PharmacyOutcomeReconciliationGate", summary: "A reconciliation gate has been opened for weak, ambiguous, or contradictory outcome truth." },
    { eventName: "pharmacy.outcome.reconciliation.resolved", eventFamily: "outcome", aggregate: "PharmacyOutcomeReconciliationGate", summary: "A reconciliation gate has been resolved for apply, reopen, or unmatched disposition." },
    { eventName: "pharmacy.outcome.settled", eventFamily: "outcome", aggregate: "PharmacyOutcomeSettlement", summary: "Outcome settlement has been recorded." },
    { eventName: "pharmacy.outcome.truth.projected", eventFamily: "outcome", aggregate: "PharmacyOutcomeTruthProjection", summary: "Outcome truth projection has been refreshed for audience-safe surfaces." },
  ],
};

const choiceFixture = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  scenarioId: "PH6_CHOICE_FRONTIER_001",
  summary: "Full visible provider set with one warned manual option, one suppressed-unsafe option, and no hidden top-K pruning.",
  providers: [
    {
      providerId: "PHARM_001",
      displayName: "Riverside Pharmacy",
      capabilityState: "direct_supported",
      visibilityDisposition: "recommended_visible",
      timingBand: 2,
      serviceFitClass: 2,
      recommendationScore: 0.91,
      reasonCodes: ["open_now", "exact_pathway_fit"],
    },
    {
      providerId: "PHARM_002",
      displayName: "Market Square Pharmacy",
      capabilityState: "manual_supported",
      visibilityDisposition: "visible_with_warning",
      timingBand: 2,
      serviceFitClass: 1,
      recommendationScore: 0.88,
      warningCopyRef: "warn.manual_route.same_day",
      overrideRequirementState: "warned_choice_ack_required",
    },
    {
      providerId: "PHARM_003",
      displayName: "Hilltop Pharmacy",
      capabilityState: "direct_supported",
      visibilityDisposition: "suppressed_unsafe",
      timingBand: 0,
      serviceFitClass: 2,
      recommendationScore: 0.72,
      suppressionReasonCodeRef: "late_option_exceeds_guardrail",
    },
    {
      providerId: "PHARM_004",
      displayName: "Legacy Unsupported Pharmacy",
      capabilityState: "unsupported",
      visibilityDisposition: "invalid_hidden",
      timingBand: 1,
      serviceFitClass: 0,
      recommendationScore: 0.4,
    },
  ],
  choiceProof: {
    visibleProviderRefs: ["PHARM_001", "PHARM_002"],
    recommendedProviderRefs: ["PHARM_001", "PHARM_002"],
    warningVisibleProviderRefs: ["PHARM_002"],
    suppressedUnsafeProviderRefs: ["PHARM_003"],
    fullVisibleProviderCount: 2,
    visibleChoiceSetHash: "choice-visible-set-343-example",
  },
  choiceTruthProjection: {
    visibleProviderRefs: ["PHARM_001", "PHARM_002"],
    recommendedProviderRefs: ["PHARM_001", "PHARM_002"],
    warningVisibleProviderRefs: ["PHARM_002"],
    suppressedUnsafeSummaryRef: "suppressed-unsafe-summary-343-example",
    selectedProviderRef: "PHARM_002",
    patientOverrideRequired: true,
    projectionState: "selected_waiting_consent",
    visibleChoiceSetHash: "choice-visible-set-343-example",
  },
  explicitLawChecks: {
    recommendedSubsetOfVisible: true,
    hiddenTopKUsed: false,
    warnedChoiceStillSelectable: true,
  },
};

const dispatchFixture = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  scenarios: [
    {
      scenarioId: "PH6_DISPATCH_001",
      title: "BaRS FHIR referral with authoritative structured proof",
      transportMode: "bars_fhir",
      proofState: "satisfied",
      riskState: "on_track",
      settlementResult: "live_referral_confirmed",
      authoritativeProofSourceRef: "bars.provider.ack.001",
      patientSafeCopy: "calm_referred_allowed",
    },
    {
      scenarioId: "PH6_DISPATCH_002",
      title: "MESH submission with mailbox delivery but no authoritative business proof",
      transportMode: "mesh",
      proofState: "pending",
      riskState: "at_risk",
      settlementResult: "pending_ack",
      authoritativeProofSourceRef: null,
      patientSafeCopy: "still_confirming_referral",
    },
    {
      scenarioId: "PH6_DISPATCH_003",
      title: "Manual assisted dispatch requiring operator evidence and second review",
      transportMode: "manual_assisted_dispatch",
      proofState: "pending",
      riskState: "at_risk",
      settlementResult: "pending_ack",
      authoritativeProofSourceRef: null,
      manualDispatchAssistanceState: "pending",
      patientSafeCopy: "still_confirming_referral",
    },
    {
      scenarioId: "PH6_DISPATCH_004",
      title: "Choice drift after consent invalidates dispatch plan before send",
      transportMode: "supplier_interop",
      proofState: "expired",
      riskState: "disputed",
      settlementResult: "stale_choice_or_consent",
      authoritativeProofSourceRef: null,
      patientSafeCopy: "recovery_required",
    },
  ],
};

const outcomeFixture = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  scenarios: [
    {
      scenarioId: "PH6_OUTCOME_001",
      title: "Exact replay settles back to prior accepted outcome",
      sourceType: "gp_workflow_observation",
      replayState: "exact_replay",
      matchScore: 1,
      posteriorMatchConfidence: 1,
      contradictionScore: 0,
      settlementResult: "duplicate_ignored",
      outcomeTruthState: "duplicate_ignored",
    },
    {
      scenarioId: "PH6_OUTCOME_002",
      title: "Strong structured match resolves pending projection",
      sourceType: "direct_structured_message",
      replayState: "distinct",
      matchScore: 0.93,
      posteriorMatchConfidence: 0.89,
      contradictionScore: 0.04,
      settlementResult: "resolved_pending_projection",
      outcomeTruthState: "resolved_pending_projection",
    },
    {
      scenarioId: "PH6_OUTCOME_003",
      title: "Email ingest weak match opens reconciliation gate",
      sourceType: "email_ingest",
      replayState: "distinct",
      matchScore: 0.69,
      posteriorMatchConfidence: 0.62,
      contradictionScore: 0.11,
      settlementResult: "review_required",
      gateState: "open",
      outcomeTruthState: "review_required",
    },
    {
      scenarioId: "PH6_OUTCOME_004",
      title: "Collision review blocks ordinary auto-apply",
      sourceType: "direct_structured_message",
      replayState: "collision_review",
      matchScore: 0.84,
      posteriorMatchConfidence: 0.73,
      contradictionScore: 0.19,
      settlementResult: "review_required",
      gateState: "open",
      outcomeTruthState: "review_required",
    },
    {
      scenarioId: "PH6_OUTCOME_005",
      title: "Unmatched manual capture remains unmatched",
      sourceType: "manual_structured_capture",
      replayState: "distinct",
      matchScore: 0.22,
      posteriorMatchConfidence: 0.31,
      contradictionScore: 0.02,
      settlementResult: "unmatched",
      outcomeTruthState: "unmatched",
    },
    {
      scenarioId: "PH6_OUTCOME_006",
      title: "Trusted urgent GP action reopens into the typed bounce-back seam",
      sourceType: "gp_workflow_observation",
      replayState: "distinct",
      matchScore: 0.9,
      posteriorMatchConfidence: 0.87,
      contradictionScore: 0.05,
      classificationState: "urgent_gp_action",
      settlementResult: "reopened_for_safety",
      recoveryRouteRef: {
        targetFamily: "PharmacyBounceBackRecord",
        refId: "PBBR_343_001",
        ownerTask: "seq_344",
      },
      outcomeTruthState: "reopened_for_safety",
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
    "data/contracts/342_phase6_pharmacy_case_schema.json",
    "data/contracts/342_phase6_rule_pack_schema.json",
  ],
  summary:
    "Accessed on 2026-04-23. External sources were used only to confirm current national discovery posture, current Update Record and MESH boundaries, and current safety-assurance expectations. The local blueprint remained authoritative for provider-choice, dispatch-proof, and outcome-reconciliation algorithms.",
  sources: [
    {
      sourceId: "dohs_api",
      title: "Directory of Healthcare Services (Service Search) API",
      url: "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that DoHS is the current strategic service-search API and that version 3 is in production.",
        "Supported keeping `dohs_service_search` as the primary discovery adapter mode in the 343 contract pack.",
      ],
      rejectedOrConstrained: [
        "The API page did not override local provider-normalization, full-choice, or timing-band law.",
      ],
    },
    {
      sourceId: "service_search_v1_v2",
      title: "Service Search API - versions 1 and 2",
      url: "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services/service-search-versions-1-and-2",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that Service Search API versions 1 and 2 are deprecated on 2 February 2026 and that migration to version 3 is expected.",
        "Kept legacy discovery modes explicit but secondary in the 343 discovery contract.",
      ],
      rejectedOrConstrained: [
        "Deprecation status did not justify deleting legacy adapter seams from the frozen contract.",
      ],
    },
    {
      sourceId: "eps_dos_under_review",
      title: "API and integration catalogue entry for Electronic Prescription Service Directory of Services API",
      url: "https://digital.nhs.uk/developer/api-catalogue/Alphabet/E/Taxonomies/reference-data/Taxonomies/under-review-for-deprecation",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that the EPS DoS API still exists but is under review for deprecation.",
        "Supported keeping `eps_dos_legacy` as a legacy adapter mode rather than treating it as the strategic discovery path.",
      ],
      rejectedOrConstrained: [
        "The catalogue entry did not define local provider capability, warning, or override semantics.",
      ],
    },
    {
      sourceId: "gp_connect_update_record",
      title: "GP Connect: Update Record",
      url: "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that Update Record carries consultation summaries after Pharmacy First and is not used to communicate urgent actions or referrals back to general practice.",
        "Supported keeping dispatch truth and outcome truth separate, and keeping urgent return outside Update Record semantics.",
      ],
      rejectedOrConstrained: [
        "Update Record capability did not justify quiet completion from structured summary alone.",
      ],
    },
    {
      sourceId: "mesh_workflow_ids",
      title: "Message Exchange for Social Care and Health (MESH): Workflow Groups and Workflow IDs",
      url: "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed the distinction between business acknowledgements and mailbox download acknowledgements.",
        "Supported explicit MESH proof-source separation in the dispatch proof envelope.",
      ],
      rejectedOrConstrained: [
        "Mailbox download acknowledgement did not justify live referral truth on its own.",
      ],
    },
    {
      sourceId: "mesh_service",
      title: "Message Exchange for Social Care and Health",
      url: "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed MESH as the nationally recognised asynchronous message-sharing mechanism for this transport family.",
        "Supported explicit `mesh` transport mode and separate secure asynchronous assurance policy in the registry.",
      ],
      rejectedOrConstrained: [
        "The MESH service page did not define patient-safe reassurance or outcome-close semantics.",
      ],
    },
    {
      sourceId: "digital_clinical_safety_assurance",
      title: "Digital clinical safety assurance",
      url: "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
      publisher: "NHS England",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Reinforced that ambiguous matching, dispatch uncertainty, and communication of uncertainty are clinical-risk concerns.",
        "Supported explicit proof, replay, and reconciliation-gate controls as safety-relevant release law.",
      ],
      rejectedOrConstrained: [
        "Clinical-safety guidance did not relax the local requirement for explicit weak-match and stale-proof blocking.",
      ],
    },
    {
      sourceId: "dcb_step_by_step",
      title: "Step by step guidance",
      url: "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Reinforced that products supporting real-time or near-real-time direct care in publicly funded services should treat DCB0129/DCB0160 as applicable or strongly recommended.",
        "Supported keeping transport proof, replay, and outcome matching inside the governed safety posture.",
      ],
      rejectedOrConstrained: [
        "Applicability guidance did not override the local blueprint's stronger fail-closed rules for weak match and silent completion.",
      ],
    },
  ],
};

function buildArchitectureDoc(): string {
  return `# 343 Phase 6 Discovery, Dispatch, And Outcome Contracts

Contract version: \`${CONTRACT_VERSION}\`

This document freezes the Phase 6 provider discovery, provider choice, dispatch truth, and outcome reconciliation backbone so later implementation tracks cannot invent per-adapter semantics.

## Why 343 exists

- [342_phase6_pharmacy_case_model_and_policy_contracts.md](/Users/test/Code/V/docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md) froze the case, policy pack, and state machine but left the later-owned discovery, consent, dispatch, and outcome objects typed only by reference.
- Provider choice, dispatch proof, and outcome truth are separate authorities and must stay separate.
- The contract must preserve full visible choice, explicit consent binding, transport-neutral dispatch, and replay-safe outcome matching.

## Discovery and choice boundary

${markdownTable(
    ["Contract", "Purpose", "Non-negotiable law"],
    [
      ["PharmacyDirectorySnapshot", "One normalized choice refresh for a pharmacy case.", "Recommended providers must come from the same full visible set the patient can inspect."],
      ["PharmacyProviderCapabilitySnapshot", "Provider capability and transport summary for one normalized provider.", "`manual_supported` remains visible with warning; only `unsupported` may be hidden as invalid."],
      ["PharmacyChoiceProof", "Auditable visible frontier and recommended frontier proof.", "No hidden top-K funneling is allowed."],
      ["PharmacyChoiceSession", "Durable choice session carrying the visible set, selected provider, and override posture.", "Selection provenance must survive drift as read-only context instead of being silently rewritten."],
      ["PharmacyChoiceTruthProjection", "Audience-safe choice truth for patient chooser, request detail, and staff assist surfaces.", "Visible order, recommended frontier, warning copy, and selection provenance must resolve from the same current proof and disclosure policy."],
      ["PharmacyConsentCheckpoint", "Single authority for whether dispatch and calm reassurance may proceed.", "Provider, proof, scope, or package drift must supersede earlier consent before dispatch."],
    ],
  )}

## Dispatch and proof boundary

${markdownTable(
    ["Contract", "Purpose", "Non-negotiable law"],
    [
      ["PharmacyReferralPackage", "Immutable dispatch artifact bound to provider choice, consent, and policy.", "Package lineage may not drift independently from consent or provider selection."],
      ["PharmacyDispatchPlan", "Transport-bound plan derived from the frozen package.", "Transport mode, adapter binding, and transform contract are locked only after package freeze."],
      ["DispatchProofEnvelope", "Single proof envelope for transport acceptance, provider acceptance, delivery hints, and authoritative proof.", "Only `authoritativeProofSourceRef` may satisfy live referral truth."],
      ["PharmacyDispatchSettlement", "Dispatch result bound to proof, consent checkpoint, and continuity evidence.", "Settlement copy and proof-envelope state may not diverge under retry or replay."],
      ["PharmacyDispatchTruthProjection", "Audience-safe dispatch truth for patient, staff, and operations surfaces.", "Calm referred posture is forbidden while authoritative proof remains unsatisfied."],
    ],
  )}

## Outcome reconciliation boundary

${markdownTable(
    ["Contract", "Purpose", "Non-negotiable law"],
    [
      ["OutcomeEvidenceEnvelope", "Immutable canonicalized outcome evidence envelope.", "Replay posture must be classified before any case mutation."],
      ["PharmacyOutcomeIngestAttempt", "Best-match attempt over candidate open cases.", "Exact and semantic replay must settle back to the prior accepted outcome."],
      ["PharmacyOutcomeReconciliationGate", "Case-local weak-match review seam.", "Weak or contradictory outcome truth blocks closure while the gate is open."],
      ["PharmacyOutcomeSettlement", "Recorded outcome result after replay, matching, gate resolution, and typed downstream recovery handoff when required.", "Email or manual capture may not quietly settle to resolved without stronger policy conditions."],
      ["PharmacyOutcomeTruthProjection", "Audience-safe outcome posture for patient, staff, and operations views.", "Calm completion is forbidden until the gate is absent or resolved and continuity evidence validates the same route and consent chain."],
    ],
  )}

## Separation laws

- Recommended frontier and visible frontier must remain auditable from the same proof and disclosure policy.
- Dispatch proof and outcome truth are different authorities. Dispatch may confirm live handoff without implying completion.
- Transport acceptance, provider acceptance, and mailbox delivery are subordinate evidence lanes. Only authoritative proof satisfies live referral truth.
- Update Record summaries and observed outcomes may update outcome posture, but they do not justify urgent return semantics or silent completion.
- Silence is not proof. No elapsed timer, missing Update Record, or missing email can imply outcome completion.

## Reserved and downstream seams

${markdownTable(
    ["Owner", "Already frozen here", "Deferred implementation detail"],
    [
      ["seq_344", "Outcome classes and dispatch failures that must reopen, bounce back, or widen urgent-return debt already point to typed seams.", "Bounce-back detail, patient macro states, practice visibility payloads, and operations exceptions."],
      ["348", "Directory, provider, choice proof, explanation, disclosure, and consent families.", "Executable discovery adapters, ranking engine, and choice/consent workflow."],
      ["349", "Referral package, artifact manifest, dispatch plan, and transport-neutral governance chain.", "Executable package composer and policy/governance binding."],
      ["350", "Dispatch attempt, proof envelope, transport assurance profile, and settlement families.", "Adapter execution, retry, proof refresh, and expiry logic."],
      ["351", "Choice and dispatch truth projections are already frozen as audience-safe authorities.", "Patient instruction and referral-status surfaces built from the frozen truth projections."],
      ["352", "Outcome envelope, ingest attempt, reconciliation gate, settlement, and truth projection families.", "Executable ingest, matching, replay, and reconciliation engine."],
    ],
  )}
`;
}

function buildApiDoc(): string {
  return `# 343 Phase 6 Discovery, Choice, Dispatch, And Outcome API

The first executable API surface for 343 is intentionally transport-neutral and replay-first.

## Discovery and choice commands

${markdownTable(
    ["Operation", "Route", "Primary preconditions", "Primary exits"],
    [
      ["getPharmacyDirectory", "GET /v1/pharmacy/cases/{pharmacyCaseId}/directory", "Case is in `eligible_choice_pending`, `provider_selected`, or `consent_pending`.<br>Current rule pack and timing guardrail are resolvable.", "read_only"],
      ["refreshPharmacyDirectory", "POST /v1/pharmacy/cases/{pharmacyCaseId}:refresh-directory", "Active lease and fence are current.<br>Discovery adapters are configured.", "directory snapshot, choice proof, disclosure policy"],
      ["selectPharmacyProvider", "POST /v1/pharmacy/cases/{pharmacyCaseId}:select-provider", "Provider is present in the active visible set.<br>Selected explanation matches the current proof.", "provider selection, selected_waiting_consent"],
      ["acknowledgeChoiceOverride", "POST /v1/pharmacy/cases/{pharmacyCaseId}:acknowledge-choice-override", "Selected provider requires warned-choice or policy override acknowledgement.", "override acknowledgement, selected_waiting_consent"],
      ["capturePharmacyConsent", "POST /v1/pharmacy/cases/{pharmacyCaseId}:capture-consent", "Selected provider, proof, explanation, scope, and binding hash still agree.", "consent record, consent checkpoint"],
    ],
  )}

## Dispatch commands

${markdownTable(
    ["Operation", "Route", "Primary preconditions", "Primary exits"],
    [
      ["composeReferralPackage", "POST /v1/pharmacy/cases/{pharmacyCaseId}:compose-package", "Consent checkpoint is `satisfied`.<br>Provider, pathway, scope, and selection binding remain current.", "package_ready, referral package"],
      ["dispatchPharmacyReferral", "POST /v1/pharmacy/cases/{pharmacyCaseId}:dispatch", "Frozen package, dispatch plan, and transport assurance profile all match the same tuple.<br>ScopedMutationGate admits the send.", "dispatch attempt, proof envelope, settlement"],
      ["recordManualDispatchAssist", "POST /v1/pharmacy/dispatch/{dispatchAttemptId}:record-manual-assist", "Transport mode is `manual_assisted_dispatch`.<br>Operator and review policy are current.", "manual assistance record"],
    ],
  )}

## Outcome and reconciliation commands

${markdownTable(
    ["Operation", "Route", "Primary preconditions", "Primary exits"],
    [
      ["ingestPharmacyOutcome", "POST /v1/pharmacy/outcomes:ingest", "Immutable envelope can be formed and replay classified first.", "ingest attempt, settlement, optional reconciliation gate"],
      ["resolveOutcomeReconciliationGate", "POST /v1/pharmacy/outcomes/{outcomeReconciliationGateId}:resolve", "Gate is open or in review.<br>Resolution is one of apply, reopen, or unmatched.", "gate resolution, settlement, truth projection refresh"],
    ],
  )}

## Failure-class law

- \`choice_provider_not_visible\`
- \`hidden_top_k_violation\`
- \`stale_choice_or_consent\`
- \`consent_binding_mismatch\`
- \`dispatch_plan_tuple_drift\`
- \`authoritative_proof_missing\`
- \`manual_attestation_required\`
- \`duplicate_outcome_replay\`
- \`outcome_collision_review_required\`
- \`weak_match_requires_reconciliation\`
- \`completion_inferred_from_silence\`

## Idempotency and replay rules

- Discovery refresh is idempotent on case, lane, location tuple, and current guardrail.
- Provider selection is idempotent on choice proof, provider ref, and selection binding hash.
- Dispatch is idempotent on package hash, dispatch plan hash, route-intent tuple hash, and transport assurance profile.
- Outcome ingest is idempotent on \`replayKey\`, \`rawPayloadHash\`, \`semanticPayloadHash\`, and trusted correlation chain.
- Exact or semantic replay must settle back to the prior accepted outcome rather than mutating the case a second time.
`;
}

function buildPolicyDoc(): string {
  return `# 343 Phase 6 Provider Choice And Dispatch Truth Rules

## Full choice law

- Recommended frontier must be a subset of the full visible provider set.
- \`manual_supported\` providers stay visible with warning unless a stronger safety rule suppresses them.
- No implementation may compute a hidden top-K shortlist and present that as the patient choice surface.

## Consent binding law

- Consent binds to provider, pathway or lane, choice proof, selected explanation, referral scope, channel, and \`selectionBindingHash\`.
- Provider change, pathway change, material scope drift, superseded proof, or mismatched package fingerprint invalidates earlier consent.
- Calm reassurance and dispatch are forbidden when the current \`PharmacyConsentCheckpoint\` is non-satisfied.

## Dispatch truth law

- Dispatch is a post-submit mutation that must traverse \`ScopedMutationGate\`.
- Transport acceptance, provider acceptance, and delivery hints are supportive evidence only.
- Only \`authoritativeProofSourceRef\` may satisfy live referral truth for the current attempt.
- Settlement copy and proof-envelope state must not diverge under retry, replay, or later dispute.

## Outcome truth law

- Dispatch truth and outcome truth are separate authorities.
- Exact or semantic replay returns \`duplicate_ignored\` and must not reopen or close the case again.
- Weak, ambiguous, contradictory, email-ingested, or manual-capture outcomes must stop at reconciliation unless stronger policy conditions are satisfied.
- Absence of Update Record, absence of email, or elapsed time may not imply completion.

## Explicit prohibitions

- No hidden recommended provider that the user cannot inspect.
- No dispatch plan that lacks the current consent binding.
- No live referral truth from mailbox download or weak receipt alone.
- No auto-close from weak email or manual outcome ingest.
- No patient-safe calmness while proof, reconciliation, or continuity evidence is stale or blocked.
`;
}

function main(): void {
  writeText(OUTPUTS.architectureDoc, buildArchitectureDoc());
  writeText(OUTPUTS.apiDoc, buildApiDoc());
  writeText(OUTPUTS.policyDoc, buildPolicyDoc());
  writeJson(OUTPUTS.directoryChoiceSchema, directoryChoiceSchema);
  writeJson(OUTPUTS.dispatchSchema, dispatchSchema);
  writeJson(OUTPUTS.transportAssuranceRegistry, transportAssuranceRegistry);
  writeJson(OUTPUTS.dispatchTruthProjectionSchema, dispatchTruthProjectionSchema);
  writeJson(OUTPUTS.outcomeReconciliationSchema, outcomeReconciliationSchema);
  writeJson(OUTPUTS.outcomeTruthProjectionSchema, outcomeTruthProjectionSchema);
  writeJson(OUTPUTS.eventRegistry, eventRegistry);
  writeJson(OUTPUTS.choiceFixture, choiceFixture);
  writeJson(OUTPUTS.dispatchFixture, dispatchFixture);
  writeJson(OUTPUTS.outcomeFixture, outcomeFixture);
  writeJson(OUTPUTS.externalNotes, externalReferenceNotes);
  writeCsv(
    OUTPUTS.choiceMatrix,
    [
      "postureId",
      "capabilityState",
      "visibilityDisposition",
      "visibleToPatient",
      "rankingEligible",
      "warningCopyRequirement",
      "overrideRequirement",
      "consentImplication",
    ],
    choiceMatrixRows as unknown as Array<Record<string, unknown>>,
  );
  writeCsv(
    OUTPUTS.transportMatrix,
    [
      "transportMode",
      "assuranceClass",
      "proofSources",
      "manualReviewPosture",
      "proofDeadlinePolicy",
      "patientSafeCopyPosture",
      "failureAndDisputePosture",
    ],
    transportMatrixRows,
  );
  writeCsv(
    OUTPUTS.outcomeThresholdMatrix,
    [
      "sourceFamily",
      "sourceFloor",
      "autoApplyCeiling",
      "replayExpectations",
      "humanReviewThresholdConditions",
      "closureImplications",
    ],
    outcomeThresholdMatrixRows as unknown as Array<Record<string, unknown>>,
  );

  console.log(
    JSON.stringify(
      {
        generatedAt: GENERATED_AT,
        taskId: TASK_ID,
        contractVersion: CONTRACT_VERSION,
        discoveryAdapterModeCount: discoveryAdapterModes.length,
        transportModeCount: transportModes.length,
        outcomeSourceFamilyCount: outcomeSourceFamilies.length,
        eventCount: eventRegistry.events.length,
      },
      null,
      2,
    ),
  );
}

main();
