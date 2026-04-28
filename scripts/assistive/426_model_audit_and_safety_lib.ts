import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  buildModelVendorKeyReferenceManifest,
  buildModelVendorProjectManifest,
  buildModelVendorRegistry,
  collectTrackedSecretRefs as collect425TrackedSecretRefs,
  containsSensitiveLeak as contains425SensitiveLeak,
  readAndValidateModelVendorSetup,
  readJsonOrJsonYaml,
  redactSensitiveText as redact425SensitiveText,
  ROOT,
  type EnvironmentId,
  type OperationMode,
  type ProviderId,
  type ValidationIssue,
  type ValidationResult,
  writeJson,
  writeText,
} from "./425_model_vendor_project_setup_lib.ts";

export { writeJson, writeText };
export type { EnvironmentId, OperationMode, ProviderId, ValidationIssue, ValidationResult };

export const TASK_ID = "par_426";
export const FULL_TASK_ID =
  "par_426_phase8_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_model_audit_logs_and_safety_settings";
export const SCHEMA_VERSION = "426.phase8.model-audit-and-safety.v1";
export const GENERATED_AT = "2026-04-27T12:10:00.000Z";
export const CONTROL_PLANE_VERSION =
  "426-phase8-model-audit-safety-controls-2026-04-27.v1";

export const SOURCE_OUTPUT_PATHS = {
  auditBaseline: "data/config/426_model_audit_baseline.example.json",
  safetyBaseline: "data/config/426_model_safety_baseline.example.json",
  contract: "data/contracts/426_model_audit_and_safety_contract.json",
  vendorControlMappingMatrix:
    "data/analysis/426_vendor_control_mapping_matrix.csv",
  readinessMatrix: "data/analysis/426_audit_and_safety_readiness_matrix.csv",
} as const;

export type AuditSafetyControlStatus =
  | "configured"
  | "verified"
  | "unsupported"
  | "blocked_pending_provider_selection"
  | "blocked_pending_human_review"
  | "not_applicable_local_twin";

export type NonProductionPolicyClass =
  | "development"
  | "test"
  | "training"
  | "integration"
  | "preprod_rehearsal";

export type AuditPayloadPolicy =
  | "metadata_only_redacted_no_prompts_responses"
  | "blocked_no_export_until_provider_selected";

export interface UnsupportedVendorControlRecord {
  readonly unsupportedControlId: string;
  readonly providerId: ProviderId;
  readonly projectId: string;
  readonly environmentId: EnvironmentId;
  readonly controlFamily:
    | "audit_logging"
    | "event_export"
    | "retention"
    | "model_allow_list"
    | "safety_guardrail";
  readonly localPhase8ControlRef: string;
  readonly vendorSurfaceRef: string;
  readonly currentState:
    | "not_applicable_local_twin"
    | "blocked_pending_provider_selection"
    | "unsupported";
  readonly requiredForCurrentBaseline: boolean;
  readonly requiredForFutureLiveProvider: boolean;
  readonly blockingImpact:
    | "does_not_block_current_watch_twin"
    | "blocks_apply_until_provider_selected"
    | "blocks_apply_until_vendor_surface_verified";
  readonly localFallbackRef: string;
  readonly evidenceRefs: readonly string[];
}

export interface ModelAuditControlEntry {
  readonly auditControlId: string;
  readonly providerId: ProviderId;
  readonly projectId: string;
  readonly environmentId: EnvironmentId;
  readonly environmentPolicyClass: NonProductionPolicyClass;
  readonly auditLogPosture:
    | "local_metadata_audit_stream_enabled"
    | "vendor_audit_log_blocked_pending_selection";
  readonly eventExportPosture:
    | "local_redacted_jsonl_export_configured"
    | "vendor_event_export_blocked_pending_selection";
  readonly retentionPosture:
    | "metadata_retention_configured"
    | "vendor_retention_blocked_pending_selection";
  readonly retentionDays: number | null;
  readonly eventExportDestinationRef: string;
  readonly payloadPolicy: AuditPayloadPolicy;
  readonly eventClassAllowList: readonly string[];
  readonly sourceControlRefs: readonly string[];
  readonly verificationEvidenceRefs: readonly string[];
  readonly status: AuditSafetyControlStatus;
  readonly notes: readonly string[];
}

export interface ModelAuditBaselineDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly registryRef: "data/config/425_model_vendor_registry.example.yaml";
  readonly projectManifestRef: "data/config/425_model_vendor_project_manifest.example.json";
  readonly primaryProviderId: ProviderId;
  readonly selectedProviderDetection:
    "inherited_425_watch_only_local_twin"
    | "blocked_pending_provider_reconciliation";
  readonly baselineMode: "watch_only_nonproduction";
  readonly auditControls: readonly ModelAuditControlEntry[];
  readonly unsupportedControls: readonly UnsupportedVendorControlRecord[];
}

export interface ModelSafetyControlEntry {
  readonly safetyControlId: string;
  readonly providerId: ProviderId;
  readonly projectId: string;
  readonly environmentId: EnvironmentId;
  readonly environmentPolicyClass: NonProductionPolicyClass;
  readonly modelAccessPosture:
    | "local_shadow_model_allow_list_verified"
    | "vendor_model_access_blocked_pending_selection";
  readonly allowedModelFamilies: readonly string[];
  readonly deniedModelFamilies: readonly string[];
  readonly deploymentSelectionRefs: readonly string[];
  readonly moderationPosture:
    | "local_synthetic_policy_gate_enabled"
    | "vendor_moderation_blocked_pending_selection";
  readonly safetyIdentifierPosture:
    | "hashed_actor_case_and_session_identifiers_required"
    | "blocked_pending_provider_selection";
  readonly humanReviewPosture: "human_in_loop_required_for_all_assistive_outputs";
  readonly promptAndOutputStoragePolicy:
    | "no_raw_prompts_or_outputs_in_vendor_evidence"
    | "blocked_until_provider_retention_verified";
  readonly guardrailRefs: readonly string[];
  readonly verificationEvidenceRefs: readonly string[];
  readonly status: AuditSafetyControlStatus;
  readonly notes: readonly string[];
}

export interface ModelSafetyBaselineDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly registryRef: "data/config/425_model_vendor_registry.example.yaml";
  readonly projectManifestRef: "data/config/425_model_vendor_project_manifest.example.json";
  readonly keyReferenceManifestRef: "data/config/425_model_vendor_key_reference_manifest.example.json";
  readonly primaryProviderId: ProviderId;
  readonly baselineMode: "watch_only_nonproduction";
  readonly safetyControls: readonly ModelSafetyControlEntry[];
  readonly unsupportedControls: readonly UnsupportedVendorControlRecord[];
}

export interface ModelAuditAndSafetyContract {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly auditBaselineRef: typeof SOURCE_OUTPUT_PATHS.auditBaseline;
  readonly safetyBaselineRef: typeof SOURCE_OUTPUT_PATHS.safetyBaseline;
  readonly vendorProjectContractRef: "data/contracts/425_model_vendor_project_and_key_contract.json";
  readonly readinessMatrixRef: typeof SOURCE_OUTPUT_PATHS.readinessMatrix;
  readonly vendorControlMappingMatrixRef: typeof SOURCE_OUTPUT_PATHS.vendorControlMappingMatrix;
  readonly supportedEnvironmentIds: readonly EnvironmentId[];
  readonly supportedNonProductionPolicyClasses: readonly NonProductionPolicyClass[];
  readonly supportedControlStatuses: readonly AuditSafetyControlStatus[];
  readonly supportedAutomationModes: readonly OperationMode[];
  readonly defaultAutomationMode: "dry_run";
  readonly applyModeDefault: "blocked";
  readonly secretAndPayloadPolicy:
    "managed_secret_refs_only_metadata_audit_no_raw_prompts_outputs_or_exports";
  readonly browserEvidencePolicy:
    "isolated_contexts_per_environment_redacted_artifacts_no_storage_state_commits";
  readonly unsupportedControlPolicy:
    "explicit_records_required_fail_closed_for_current_required_controls";
  readonly sourceRefs: readonly string[];
  readonly externalReferenceRefs: readonly string[];
}

export interface ModelAuditAndSafetySetupDocuments {
  readonly auditBaseline: ModelAuditBaselineDocument;
  readonly safetyBaseline: ModelSafetyBaselineDocument;
  readonly contract: ModelAuditAndSafetyContract;
}

export interface ModelAuditAndSafetyReadinessEvidence {
  readonly taskId: typeof FULL_TASK_ID;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly mode: OperationMode;
  readonly primaryProviderId: ProviderId;
  readonly decision:
    | "ready_for_dry_run_rehearsal_verify"
    | "blocked_for_apply"
    | "blocked_by_validation";
  readonly validationIssueCount: number;
  readonly auditRows: readonly {
    readonly auditControlId: string;
    readonly providerId: ProviderId;
    readonly environmentId: EnvironmentId;
    readonly status: AuditSafetyControlStatus;
    readonly retentionDays: number | null;
    readonly payloadPolicy: AuditPayloadPolicy;
    readonly eventClassCount: number;
  }[];
  readonly safetyRows: readonly {
    readonly safetyControlId: string;
    readonly providerId: ProviderId;
    readonly environmentId: EnvironmentId;
    readonly status: AuditSafetyControlStatus;
    readonly allowedModelFamilyCount: number;
    readonly guardrailCount: number;
    readonly humanReviewPosture: ModelSafetyControlEntry["humanReviewPosture"];
  }[];
  readonly unsupportedControlRows: readonly {
    readonly unsupportedControlId: string;
    readonly providerId: ProviderId;
    readonly environmentId: EnvironmentId;
    readonly controlFamily: UnsupportedVendorControlRecord["controlFamily"];
    readonly currentState: UnsupportedVendorControlRecord["currentState"];
    readonly blockingImpact: UnsupportedVendorControlRecord["blockingImpact"];
  }[];
  readonly evidenceDigest: string;
  readonly blockedReasons: readonly string[];
}

const AUDIT_EVENT_CLASSES = [
  "assistive_invocation_metadata",
  "assistive_trust_posture_transition",
  "assistive_safety_gate_decision",
  "operator_override_recorded",
  "model_access_denied",
  "change_control_evidence_linked",
] as const;

const SOURCE_REFS = [
  "blueprint/phase-8-the-assistive-layer.md#8G",
  "blueprint/phase-8-the-assistive-layer.md#8H",
  "blueprint/phase-0-the-foundation-protocol.md#audit-disclosure-provenance",
  "blueprint/platform-runtime-and-release-blueprint.md#Security baseline contract",
  "blueprint/platform-admin-and-config-blueprint.md#configuration-and-admin-control",
  "data/contracts/415_monitoring_and_trust_projection_contract.json",
  "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
  "data/contracts/417_change_control_evidence_pipeline_contract.json",
  "data/contracts/425_model_vendor_project_and_key_contract.json",
] as const;

const EXTERNAL_REFERENCE_REFS = [
  "https://platform.openai.com/docs/api-reference/audit-logs?lang=go",
  "https://platform.openai.com/docs/guides/rbac",
  "https://platform.openai.com/docs/models/how-we-use-your-data",
  "https://platform.openai.com/docs/api-reference/moderations?lang=python",
  "https://platform.openai.com/docs/safety-best-practices/understanding-safety-risks",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/trace-viewer",
  "https://playwright.dev/docs/screenshots",
] as const;

const RAW_PAYLOAD_FIELD_NAMES = [
  "prompt",
  "prompts",
  "completion",
  "completions",
  "response",
  "responses",
  "rawAuditPayload",
  "raw_audit_payload",
  "auditPayload",
  "audit_payload",
] as const;

const RAW_PAYLOAD_PATTERNS = [
  /"messages"\s*:\s*\[/iu,
  /"input"\s*:\s*"(?!\[redacted\])/iu,
  /"output"\s*:\s*"(?!\[redacted\])/iu,
] as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableValue(entry));
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = stableValue((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return value;
}

function digest(value: unknown, length = 16): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex")
    .slice(0, length);
}

function csvEscape(value: unknown): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function pushIssue(
  issues: ValidationIssue[],
  code: string,
  message: string,
  ref?: string,
): void {
  issues.push({ code, message, ref });
}

function auditControlTemplate(input: ModelAuditControlEntry): ModelAuditControlEntry {
  return input;
}

function safetyControlTemplate(
  input: ModelSafetyControlEntry,
): ModelSafetyControlEntry {
  return input;
}

const AUDIT_CONTROLS: readonly ModelAuditControlEntry[] = [
  auditControlTemplate({
    auditControlId: "auditctl_426_dev_shadow_twin",
    providerId: "vecells_assistive_vendor_watch_shadow_twin",
    projectId: "mvproj_425_dev_shadow_twin",
    environmentId: "development_local_twin",
    environmentPolicyClass: "development",
    auditLogPosture: "local_metadata_audit_stream_enabled",
    eventExportPosture: "local_redacted_jsonl_export_configured",
    retentionPosture: "metadata_retention_configured",
    retentionDays: 30,
    eventExportDestinationRef:
      "artifact://426/local/dev/redacted-assistive-audit-metadata.jsonl",
    payloadPolicy: "metadata_only_redacted_no_prompts_responses",
    eventClassAllowList: AUDIT_EVENT_CLASSES,
    sourceControlRefs: [
      "AssistiveCapabilityWatchTuple",
      "UITelemetryDisclosureFence",
      "AssuranceBaselineSnapshot",
    ],
    verificationEvidenceRefs: [
      "evidence://426/dev-shadow/audit-baseline-validated",
      "data/contracts/415_monitoring_and_trust_projection_contract.json",
    ],
    status: "verified",
    notes: [
      "Development uses the selected local watch twin and records only redacted metadata.",
      "No vendor dashboard mutation or raw audit export is implied by this local baseline.",
    ],
  }),
  auditControlTemplate({
    auditControlId: "auditctl_426_integration_shadow_twin",
    providerId: "vecells_assistive_vendor_watch_shadow_twin",
    projectId: "mvproj_425_integration_shadow_twin",
    environmentId: "integration_candidate",
    environmentPolicyClass: "integration",
    auditLogPosture: "local_metadata_audit_stream_enabled",
    eventExportPosture: "local_redacted_jsonl_export_configured",
    retentionPosture: "metadata_retention_configured",
    retentionDays: 90,
    eventExportDestinationRef:
      "artifact://426/integration/redacted-assistive-audit-metadata.jsonl",
    payloadPolicy: "metadata_only_redacted_no_prompts_responses",
    eventClassAllowList: AUDIT_EVENT_CLASSES,
    sourceControlRefs: [
      "AssistiveCapabilityWatchTuple",
      "AssistiveReleaseCandidate",
      "RFCBundle",
      "RollbackReadinessBundle",
    ],
    verificationEvidenceRefs: [
      "evidence://426/integration-shadow/audit-baseline-validated",
      "data/contracts/417_change_control_evidence_pipeline_contract.json",
    ],
    status: "verified",
    notes: [
      "Integration rehearsal extends retention for change-control and rollback evidence.",
      "The export remains metadata-only and does not include prompts, responses, or privileged identifiers.",
    ],
  }),
  auditControlTemplate({
    auditControlId: "auditctl_426_preprod_openai_placeholder",
    providerId: "openai",
    projectId: "mvproj_425_preprod_openai_placeholder",
    environmentId: "preprod_rehearsal",
    environmentPolicyClass: "preprod_rehearsal",
    auditLogPosture: "vendor_audit_log_blocked_pending_selection",
    eventExportPosture: "vendor_event_export_blocked_pending_selection",
    retentionPosture: "vendor_retention_blocked_pending_selection",
    retentionDays: null,
    eventExportDestinationRef: "blocked://426/openai/preprod/provider-not-selected",
    payloadPolicy: "blocked_no_export_until_provider_selected",
    eventClassAllowList: [],
    sourceControlRefs: [
      "AssistiveReleaseCandidate",
      "AssuranceBaselineSnapshot",
      "RFCBundle",
      "RollbackReadinessBundle",
    ],
    verificationEvidenceRefs: [
      "evidence://426/openai/preprod/provider-selection-required",
      "data/config/425_model_vendor_project_manifest.example.json#mvproj_425_preprod_openai_placeholder",
    ],
    status: "blocked_pending_provider_selection",
    notes: [
      "OpenAI is documented as an optional future provider but is not selected by the current repository baseline.",
      "Audit-log posture, export, and retention may not be marked configured until provider selection and admin verification exist.",
    ],
  }),
] as const;

const SAFETY_CONTROLS: readonly ModelSafetyControlEntry[] = [
  safetyControlTemplate({
    safetyControlId: "safetyctl_426_dev_shadow_twin",
    providerId: "vecells_assistive_vendor_watch_shadow_twin",
    projectId: "mvproj_425_dev_shadow_twin",
    environmentId: "development_local_twin",
    environmentPolicyClass: "development",
    modelAccessPosture: "local_shadow_model_allow_list_verified",
    allowedModelFamilies: ["local_placeholder_only"],
    deniedModelFamilies: [
      "openai_live_models",
      "external_unreviewed_models",
      "production_models",
    ],
    deploymentSelectionRefs: [
      "data/config/425_model_vendor_project_manifest.example.json#mvproj_425_dev_shadow_twin",
      "deployment://426/dev/local-shadow-summary-stub",
    ],
    moderationPosture: "local_synthetic_policy_gate_enabled",
    safetyIdentifierPosture:
      "hashed_actor_case_and_session_identifiers_required",
    humanReviewPosture: "human_in_loop_required_for_all_assistive_outputs",
    promptAndOutputStoragePolicy: "no_raw_prompts_or_outputs_in_vendor_evidence",
    guardrailRefs: [
      "guardrail://426/dev/no-authoritative-output",
      "guardrail://426/dev/disclosure-fence",
      "guardrail://426/dev/policy-blocked-insert-suppression",
      "guardrail://426/dev/synthetic-moderation-gate",
    ],
    verificationEvidenceRefs: [
      "evidence://426/dev-shadow/safety-baseline-validated",
      "data/contracts/422_trust_posture_contract.json",
    ],
    status: "verified",
    notes: [
      "Development is limited to the local placeholder model family inherited from task 425.",
      "Human review remains mandatory before assistive content can affect a final artifact.",
    ],
  }),
  safetyControlTemplate({
    safetyControlId: "safetyctl_426_integration_shadow_twin",
    providerId: "vecells_assistive_vendor_watch_shadow_twin",
    projectId: "mvproj_425_integration_shadow_twin",
    environmentId: "integration_candidate",
    environmentPolicyClass: "integration",
    modelAccessPosture: "local_shadow_model_allow_list_verified",
    allowedModelFamilies: ["local_placeholder_only"],
    deniedModelFamilies: [
      "openai_live_models",
      "external_unreviewed_models",
      "production_models",
    ],
    deploymentSelectionRefs: [
      "data/config/425_model_vendor_project_manifest.example.json#mvproj_425_integration_shadow_twin",
      "deployment://426/integration/local-shadow-summary-stub",
    ],
    moderationPosture: "local_synthetic_policy_gate_enabled",
    safetyIdentifierPosture:
      "hashed_actor_case_and_session_identifiers_required",
    humanReviewPosture: "human_in_loop_required_for_all_assistive_outputs",
    promptAndOutputStoragePolicy: "no_raw_prompts_or_outputs_in_vendor_evidence",
    guardrailRefs: [
      "guardrail://426/integration/no-authoritative-output",
      "guardrail://426/integration/disclosure-fence",
      "guardrail://426/integration/policy-blocked-insert-suppression",
      "guardrail://426/integration/synthetic-moderation-gate",
      "guardrail://426/integration/release-candidate-drift-check",
    ],
    verificationEvidenceRefs: [
      "evidence://426/integration-shadow/safety-baseline-validated",
      "data/contracts/415_monitoring_and_trust_projection_contract.json",
      "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
    ],
    status: "verified",
    notes: [
      "Integration rehearses safety drift detection against the release-candidate posture.",
      "No external model family can be added without provider-selection and intended-use evidence.",
    ],
  }),
  safetyControlTemplate({
    safetyControlId: "safetyctl_426_preprod_openai_placeholder",
    providerId: "openai",
    projectId: "mvproj_425_preprod_openai_placeholder",
    environmentId: "preprod_rehearsal",
    environmentPolicyClass: "training",
    modelAccessPosture: "vendor_model_access_blocked_pending_selection",
    allowedModelFamilies: [],
    deniedModelFamilies: ["*"],
    deploymentSelectionRefs: [
      "blocked://426/openai/preprod/provider-not-selected",
    ],
    moderationPosture: "vendor_moderation_blocked_pending_selection",
    safetyIdentifierPosture: "blocked_pending_provider_selection",
    humanReviewPosture: "human_in_loop_required_for_all_assistive_outputs",
    promptAndOutputStoragePolicy: "blocked_until_provider_retention_verified",
    guardrailRefs: [
      "guardrail://426/openai/preprod/provider-selection-required",
      "guardrail://426/openai/preprod/intended-use-review-required",
    ],
    verificationEvidenceRefs: [
      "evidence://426/openai/preprod/provider-selection-required",
      "data/config/425_model_vendor_project_manifest.example.json#mvproj_425_preprod_openai_placeholder",
    ],
    status: "blocked_pending_provider_selection",
    notes: [
      "This training/preprod row records the future control shape without granting model access.",
      "Wildcard denial is allowed only because the row is blocked and has no allowed model families.",
    ],
  }),
] as const;

const UNSUPPORTED_AUDIT_CONTROLS: readonly UnsupportedVendorControlRecord[] = [
  {
    unsupportedControlId: "unsupported_426_dev_vendor_managed_audit_api",
    providerId: "vecells_assistive_vendor_watch_shadow_twin",
    projectId: "mvproj_425_dev_shadow_twin",
    environmentId: "development_local_twin",
    controlFamily: "audit_logging",
    localPhase8ControlRef: "AssistiveCapabilityWatchTuple",
    vendorSurfaceRef: "vendor://external/audit-log-api",
    currentState: "not_applicable_local_twin",
    requiredForCurrentBaseline: false,
    requiredForFutureLiveProvider: true,
    blockingImpact: "does_not_block_current_watch_twin",
    localFallbackRef: "artifact://426/local/dev/redacted-assistive-audit-metadata.jsonl",
    evidenceRefs: [
      "data/config/425_model_vendor_registry.example.yaml#vecells_assistive_vendor_watch_shadow_twin",
    ],
  },
  {
    unsupportedControlId: "unsupported_426_openai_preprod_audit_export",
    providerId: "openai",
    projectId: "mvproj_425_preprod_openai_placeholder",
    environmentId: "preprod_rehearsal",
    controlFamily: "event_export",
    localPhase8ControlRef: "AssuranceBaselineSnapshot",
    vendorSurfaceRef: "https://platform.openai.com/docs/api-reference/audit-logs?lang=go",
    currentState: "blocked_pending_provider_selection",
    requiredForCurrentBaseline: false,
    requiredForFutureLiveProvider: true,
    blockingImpact: "blocks_apply_until_provider_selected",
    localFallbackRef: "blocked://426/openai/preprod/provider-not-selected",
    evidenceRefs: [
      "data/config/425_model_vendor_project_manifest.example.json#mvproj_425_preprod_openai_placeholder",
    ],
  },
  {
    unsupportedControlId: "unsupported_426_openai_preprod_retention_verification",
    providerId: "openai",
    projectId: "mvproj_425_preprod_openai_placeholder",
    environmentId: "preprod_rehearsal",
    controlFamily: "retention",
    localPhase8ControlRef: "RollbackReadinessBundle",
    vendorSurfaceRef: "https://platform.openai.com/docs/models/how-we-use-your-data",
    currentState: "blocked_pending_provider_selection",
    requiredForCurrentBaseline: false,
    requiredForFutureLiveProvider: true,
    blockingImpact: "blocks_apply_until_provider_selected",
    localFallbackRef: "blocked://426/openai/preprod/retention-not-verified",
    evidenceRefs: [
      "data/config/425_model_vendor_project_manifest.example.json#mvproj_425_preprod_openai_placeholder",
    ],
  },
] as const;

const UNSUPPORTED_SAFETY_CONTROLS: readonly UnsupportedVendorControlRecord[] = [
  {
    unsupportedControlId: "unsupported_426_openai_preprod_model_allow_list",
    providerId: "openai",
    projectId: "mvproj_425_preprod_openai_placeholder",
    environmentId: "preprod_rehearsal",
    controlFamily: "model_allow_list",
    localPhase8ControlRef: "AssistiveReleaseCandidate",
    vendorSurfaceRef: "https://platform.openai.com/docs/guides/rbac",
    currentState: "blocked_pending_provider_selection",
    requiredForCurrentBaseline: false,
    requiredForFutureLiveProvider: true,
    blockingImpact: "blocks_apply_until_provider_selected",
    localFallbackRef: "blocked://426/openai/preprod/model-access-not-configured",
    evidenceRefs: [
      "data/config/425_model_vendor_project_manifest.example.json#mvproj_425_preprod_openai_placeholder",
    ],
  },
  {
    unsupportedControlId: "unsupported_426_openai_preprod_moderation_guardrail",
    providerId: "openai",
    projectId: "mvproj_425_preprod_openai_placeholder",
    environmentId: "preprod_rehearsal",
    controlFamily: "safety_guardrail",
    localPhase8ControlRef: "UITelemetryDisclosureFence",
    vendorSurfaceRef: "https://platform.openai.com/docs/api-reference/moderations?lang=python",
    currentState: "blocked_pending_provider_selection",
    requiredForCurrentBaseline: false,
    requiredForFutureLiveProvider: true,
    blockingImpact: "blocks_apply_until_provider_selected",
    localFallbackRef: "blocked://426/openai/preprod/moderation-not-configured",
    evidenceRefs: [
      "data/config/425_model_vendor_project_manifest.example.json#mvproj_425_preprod_openai_placeholder",
    ],
  },
] as const;

export function buildModelAuditBaseline(): ModelAuditBaselineDocument {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    registryRef: "data/config/425_model_vendor_registry.example.yaml",
    projectManifestRef: "data/config/425_model_vendor_project_manifest.example.json",
    primaryProviderId: "vecells_assistive_vendor_watch_shadow_twin",
    selectedProviderDetection: "inherited_425_watch_only_local_twin",
    baselineMode: "watch_only_nonproduction",
    auditControls: AUDIT_CONTROLS,
    unsupportedControls: UNSUPPORTED_AUDIT_CONTROLS,
  };
}

export function buildModelSafetyBaseline(): ModelSafetyBaselineDocument {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    registryRef: "data/config/425_model_vendor_registry.example.yaml",
    projectManifestRef: "data/config/425_model_vendor_project_manifest.example.json",
    keyReferenceManifestRef:
      "data/config/425_model_vendor_key_reference_manifest.example.json",
    primaryProviderId: "vecells_assistive_vendor_watch_shadow_twin",
    baselineMode: "watch_only_nonproduction",
    safetyControls: SAFETY_CONTROLS,
    unsupportedControls: UNSUPPORTED_SAFETY_CONTROLS,
  };
}

export function buildModelAuditAndSafetyContract(): ModelAuditAndSafetyContract {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    auditBaselineRef: SOURCE_OUTPUT_PATHS.auditBaseline,
    safetyBaselineRef: SOURCE_OUTPUT_PATHS.safetyBaseline,
    vendorProjectContractRef:
      "data/contracts/425_model_vendor_project_and_key_contract.json",
    readinessMatrixRef: SOURCE_OUTPUT_PATHS.readinessMatrix,
    vendorControlMappingMatrixRef: SOURCE_OUTPUT_PATHS.vendorControlMappingMatrix,
    supportedEnvironmentIds: [
      "development_local_twin",
      "integration_candidate",
      "preprod_rehearsal",
    ],
    supportedNonProductionPolicyClasses: [
      "development",
      "test",
      "training",
      "integration",
      "preprod_rehearsal",
    ],
    supportedControlStatuses: [
      "configured",
      "verified",
      "unsupported",
      "blocked_pending_provider_selection",
      "blocked_pending_human_review",
      "not_applicable_local_twin",
    ],
    supportedAutomationModes: ["dry_run", "rehearsal", "apply", "verify"],
    defaultAutomationMode: "dry_run",
    applyModeDefault: "blocked",
    secretAndPayloadPolicy:
      "managed_secret_refs_only_metadata_audit_no_raw_prompts_outputs_or_exports",
    browserEvidencePolicy:
      "isolated_contexts_per_environment_redacted_artifacts_no_storage_state_commits",
    unsupportedControlPolicy:
      "explicit_records_required_fail_closed_for_current_required_controls",
    sourceRefs: SOURCE_REFS,
    externalReferenceRefs: EXTERNAL_REFERENCE_REFS,
  };
}

export function renderVendorControlMappingMatrixCsv(
  setup: ModelAuditAndSafetySetupDocuments = {
    auditBaseline: buildModelAuditBaseline(),
    safetyBaseline: buildModelSafetyBaseline(),
    contract: buildModelAuditAndSafetyContract(),
  },
): string {
  const rows = [
    [
      "local_phase8_object",
      "control_family",
      "provider_id",
      "environment_id",
      "vendor_or_local_surface",
      "configured_status",
      "evidence_ref",
      "unsupported_record_ref",
    ],
  ];

  for (const audit of setup.auditBaseline.auditControls) {
    for (const localObject of audit.sourceControlRefs) {
      rows.push([
        localObject,
        "audit_logging",
        audit.providerId,
        audit.environmentId,
        audit.auditLogPosture,
        audit.status,
        audit.verificationEvidenceRefs[0] ?? "",
        setup.auditBaseline.unsupportedControls
          .filter(
            (entry) =>
              entry.providerId === audit.providerId &&
              entry.environmentId === audit.environmentId &&
              entry.controlFamily === "audit_logging",
          )
          .map((entry) => entry.unsupportedControlId)
          .join(";"),
      ]);
    }
  }

  for (const safety of setup.safetyBaseline.safetyControls) {
    for (const guardrail of safety.guardrailRefs) {
      rows.push([
        guardrail,
        "safety_guardrail",
        safety.providerId,
        safety.environmentId,
        safety.moderationPosture,
        safety.status,
        safety.verificationEvidenceRefs[0] ?? "",
        setup.safetyBaseline.unsupportedControls
          .filter(
            (entry) =>
              entry.providerId === safety.providerId &&
              entry.environmentId === safety.environmentId &&
              entry.controlFamily === "safety_guardrail",
          )
          .map((entry) => entry.unsupportedControlId)
          .join(";"),
      ]);
    }
  }

  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}

export function renderAuditAndSafetyReadinessMatrixCsv(
  setup: ModelAuditAndSafetySetupDocuments = {
    auditBaseline: buildModelAuditBaseline(),
    safetyBaseline: buildModelSafetyBaseline(),
    contract: buildModelAuditAndSafetyContract(),
  },
): string {
  const rows = [
    [
      "control_id",
      "control_type",
      "provider_id",
      "environment_id",
      "policy_class",
      "status",
      "apply_allowed",
      "readiness_decision",
      "blocked_reason",
    ],
  ];

  for (const audit of setup.auditBaseline.auditControls) {
    const ready = audit.status === "verified" || audit.status === "configured";
    rows.push([
      audit.auditControlId,
      "audit",
      audit.providerId,
      audit.environmentId,
      audit.environmentPolicyClass,
      audit.status,
      "false",
      ready ? "ready_for_dry_run_rehearsal_verify" : "blocked_placeholder_only",
      ready ? "apply_blocked_watch_only" : "provider_not_selected_or_retention_unverified",
    ]);
  }

  for (const safety of setup.safetyBaseline.safetyControls) {
    const ready = safety.status === "verified" || safety.status === "configured";
    rows.push([
      safety.safetyControlId,
      "safety",
      safety.providerId,
      safety.environmentId,
      safety.environmentPolicyClass,
      safety.status,
      "false",
      ready ? "ready_for_dry_run_rehearsal_verify" : "blocked_placeholder_only",
      ready ? "apply_blocked_watch_only" : "provider_not_selected_or_safety_unverified",
    ]);
  }

  for (const unsupported of [
    ...setup.auditBaseline.unsupportedControls,
    ...setup.safetyBaseline.unsupportedControls,
  ]) {
    rows.push([
      unsupported.unsupportedControlId,
      `unsupported_${unsupported.controlFamily}`,
      unsupported.providerId,
      unsupported.environmentId,
      "preprod_rehearsal",
      unsupported.currentState,
      "false",
      unsupported.requiredForCurrentBaseline
        ? "blocked_by_validation"
        : "unsupported_recorded",
      unsupported.blockingImpact,
    ]);
  }

  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}

function expectedVendorSetup(rootDir = ROOT) {
  if (fs.existsSync(path.join(rootDir, "data/config/425_model_vendor_registry.example.yaml"))) {
    return readAndValidateModelVendorSetup(rootDir);
  }
  const setup = {
    registry: buildModelVendorRegistry(),
    projectManifest: buildModelVendorProjectManifest(),
    keyReferenceManifest: buildModelVendorKeyReferenceManifest(),
  };
  return {
    ...setup,
    validation: { valid: true, issues: [] },
  };
}

export function validateModelAuditAndSafetySetupDocuments(
  setup: ModelAuditAndSafetySetupDocuments,
  rootDir = ROOT,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const vendorSetup = expectedVendorSetup(rootDir);
  const providerIds = new Set(
    vendorSetup.registry.providers.map((entry) => entry.providerId),
  );
  const projectById = new Map(
    vendorSetup.projectManifest.projects.map((project) => [project.projectId, project]),
  );
  const environmentIds = new Set(
    vendorSetup.registry.environmentProfiles.map((entry) => entry.environmentId),
  );
  const primaryProviderId = vendorSetup.registry.primaryProviderId;

  if (!vendorSetup.validation.valid) {
    for (const issue of vendorSetup.validation.issues) {
      pushIssue(
        issues,
        `UPSTREAM_425_${issue.code}`,
        issue.message,
        issue.ref,
      );
    }
  }

  if (setup.auditBaseline.taskId !== FULL_TASK_ID) {
    pushIssue(issues, "AUDIT_BASELINE_TASK_ID_DRIFT", "Audit baseline task id drifted.");
  }
  if (setup.safetyBaseline.taskId !== FULL_TASK_ID) {
    pushIssue(
      issues,
      "SAFETY_BASELINE_TASK_ID_DRIFT",
      "Safety baseline task id drifted.",
    );
  }
  if (setup.contract.taskId !== FULL_TASK_ID) {
    pushIssue(issues, "CONTRACT_TASK_ID_DRIFT", "Contract task id drifted.");
  }
  if (setup.auditBaseline.primaryProviderId !== primaryProviderId) {
    pushIssue(
      issues,
      "AUDIT_PRIMARY_PROVIDER_MISMATCH",
      "Audit baseline must inherit the 425 primary provider.",
    );
  }
  if (setup.safetyBaseline.primaryProviderId !== primaryProviderId) {
    pushIssue(
      issues,
      "SAFETY_PRIMARY_PROVIDER_MISMATCH",
      "Safety baseline must inherit the 425 primary provider.",
    );
  }
  if (setup.contract.applyModeDefault !== "blocked") {
    pushIssue(issues, "CONTRACT_APPLY_NOT_BLOCKED", "Apply must default to blocked.");
  }
  if (!setup.contract.supportedAutomationModes.includes("apply")) {
    pushIssue(
      issues,
      "CONTRACT_APPLY_MODE_NOT_MODELED",
      "Contract must model apply mode even though readiness blocks it.",
    );
  }

  const auditIds = new Set<string>();
  for (const audit of setup.auditBaseline.auditControls) {
    if (auditIds.has(audit.auditControlId)) {
      pushIssue(
        issues,
        "AUDIT_CONTROL_DUPLICATE",
        "Audit control ids must be unique.",
        audit.auditControlId,
      );
    }
    auditIds.add(audit.auditControlId);
    validateCommonControlRef(
      issues,
      audit.providerId,
      audit.projectId,
      audit.environmentId,
      providerIds,
      environmentIds,
      projectById,
      audit.auditControlId,
    );
    if (
      audit.status === "verified" ||
      audit.status === "configured"
    ) {
      if (audit.providerId !== primaryProviderId) {
        pushIssue(
          issues,
          "EXTERNAL_AUDIT_CONFIGURED_WITHOUT_PROVIDER_SELECTION",
          "External vendor audit controls cannot be configured until provider selection is explicit.",
          audit.auditControlId,
        );
      }
      if (audit.retentionDays === null || audit.retentionDays < 1) {
        pushIssue(
          issues,
          "AUDIT_RETENTION_MISSING",
          "Configured audit controls require positive retention days.",
          audit.auditControlId,
        );
      }
      if ((audit.retentionDays ?? 0) > 365) {
        pushIssue(
          issues,
          "AUDIT_RETENTION_TOO_LONG_NONPROD",
          "Non-production audit retention must stay at or below 365 days.",
          audit.auditControlId,
        );
      }
      if (audit.eventClassAllowList.length === 0) {
        pushIssue(
          issues,
          "AUDIT_EVENT_CLASSES_MISSING",
          "Configured audit controls require explicit event classes.",
          audit.auditControlId,
        );
      }
      if (audit.payloadPolicy !== "metadata_only_redacted_no_prompts_responses") {
        pushIssue(
          issues,
          "AUDIT_PAYLOAD_POLICY_UNSAFE",
          "Configured audit controls must be metadata-only and redacted.",
          audit.auditControlId,
        );
      }
      if (!audit.eventExportDestinationRef.startsWith("artifact://")) {
        pushIssue(
          issues,
          "AUDIT_EXPORT_DESTINATION_UNSAFE",
          "Configured audit controls must export to a redacted artifact reference.",
          audit.auditControlId,
        );
      }
    }
    if (
      audit.providerId === primaryProviderId &&
      audit.status !== "configured" &&
      audit.status !== "verified"
    ) {
      pushIssue(
        issues,
        "PRIMARY_AUDIT_CONTROL_NOT_READY",
        "Primary provider audit controls must be configured or verified.",
        audit.auditControlId,
      );
    }
  }

  const safetyIds = new Set<string>();
  for (const safety of setup.safetyBaseline.safetyControls) {
    if (safetyIds.has(safety.safetyControlId)) {
      pushIssue(
        issues,
        "SAFETY_CONTROL_DUPLICATE",
        "Safety control ids must be unique.",
        safety.safetyControlId,
      );
    }
    safetyIds.add(safety.safetyControlId);
    validateCommonControlRef(
      issues,
      safety.providerId,
      safety.projectId,
      safety.environmentId,
      providerIds,
      environmentIds,
      projectById,
      safety.safetyControlId,
    );
    if (
      safety.status === "verified" ||
      safety.status === "configured"
    ) {
      if (safety.providerId !== primaryProviderId) {
        pushIssue(
          issues,
          "EXTERNAL_SAFETY_CONFIGURED_WITHOUT_PROVIDER_SELECTION",
          "External vendor safety controls cannot be configured until provider selection is explicit.",
          safety.safetyControlId,
        );
      }
      if (safety.allowedModelFamilies.length === 0) {
        pushIssue(
          issues,
          "SAFETY_ALLOW_LIST_MISSING",
          "Configured safety controls require a model allow-list.",
          safety.safetyControlId,
        );
      }
      if (
        safety.allowedModelFamilies.some(
          (model) => model === "*" || /all|production|live/i.test(model),
        )
      ) {
        pushIssue(
          issues,
          "SAFETY_ALLOW_LIST_TOO_BROAD",
          "Wildcard, live, or production model allow-list entries are forbidden.",
          safety.safetyControlId,
        );
      }
      if (safety.guardrailRefs.length === 0) {
        pushIssue(
          issues,
          "SAFETY_GUARDRAIL_REFS_MISSING",
          "Configured safety controls require guardrail refs.",
          safety.safetyControlId,
        );
      }
      if (
        safety.promptAndOutputStoragePolicy !==
        "no_raw_prompts_or_outputs_in_vendor_evidence"
      ) {
        pushIssue(
          issues,
          "SAFETY_PROMPT_STORAGE_POLICY_UNSAFE",
          "Configured safety controls must forbid raw prompt/output evidence.",
          safety.safetyControlId,
        );
      }
    }
    if (
      safety.providerId === primaryProviderId &&
      safety.status !== "configured" &&
      safety.status !== "verified"
    ) {
      pushIssue(
        issues,
        "PRIMARY_SAFETY_CONTROL_NOT_READY",
        "Primary provider safety controls must be configured or verified.",
        safety.safetyControlId,
      );
    }
  }

  validateUnsupportedRecords(
    issues,
    setup.auditBaseline.unsupportedControls,
    providerIds,
    environmentIds,
    projectById,
    primaryProviderId,
  );
  validateUnsupportedRecords(
    issues,
    setup.safetyBaseline.unsupportedControls,
    providerIds,
    environmentIds,
    projectById,
    primaryProviderId,
  );
  validateBlockedExternalRowsHaveUnsupportedRecords(setup, issues);
  detectRawPayloadOrSecretFields(setup, issues);

  return { valid: issues.length === 0, issues };
}

function validateCommonControlRef(
  issues: ValidationIssue[],
  providerId: ProviderId,
  projectId: string,
  environmentId: EnvironmentId,
  providerIds: Set<ProviderId>,
  environmentIds: Set<EnvironmentId>,
  projectById: Map<string, { providerId: ProviderId; environmentId: EnvironmentId }>,
  ref: string,
): void {
  if (!providerIds.has(providerId)) {
    pushIssue(issues, "CONTROL_PROVIDER_UNKNOWN", "Control references unknown provider.", ref);
  }
  if (!environmentIds.has(environmentId)) {
    pushIssue(
      issues,
      "CONTROL_ENVIRONMENT_UNKNOWN",
      "Control references unknown environment.",
      ref,
    );
  }
  const project = projectById.get(projectId);
  if (!project) {
    pushIssue(issues, "CONTROL_PROJECT_UNKNOWN", "Control references unknown project.", ref);
    return;
  }
  if (project.providerId !== providerId) {
    pushIssue(
      issues,
      "CONTROL_PROJECT_PROVIDER_MISMATCH",
      "Control provider does not match the referenced 425 project.",
      ref,
    );
  }
  if (project.environmentId !== environmentId) {
    pushIssue(
      issues,
      "CONTROL_PROJECT_ENVIRONMENT_MISMATCH",
      "Control environment does not match the referenced 425 project.",
      ref,
    );
  }
  if (/production/i.test(environmentId)) {
    pushIssue(
      issues,
      "CONTROL_PRODUCTION_ENVIRONMENT_FORBIDDEN",
      "Task 426 may not configure production model vendor controls.",
      ref,
    );
  }
}

function validateUnsupportedRecords(
  issues: ValidationIssue[],
  records: readonly UnsupportedVendorControlRecord[],
  providerIds: Set<ProviderId>,
  environmentIds: Set<EnvironmentId>,
  projectById: Map<string, { providerId: ProviderId; environmentId: EnvironmentId }>,
  primaryProviderId: ProviderId,
): void {
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.unsupportedControlId)) {
      pushIssue(
        issues,
        "UNSUPPORTED_CONTROL_DUPLICATE",
        "Unsupported control ids must be unique.",
        record.unsupportedControlId,
      );
    }
    seen.add(record.unsupportedControlId);
    validateCommonControlRef(
      issues,
      record.providerId,
      record.projectId,
      record.environmentId,
      providerIds,
      environmentIds,
      projectById,
      record.unsupportedControlId,
    );
    if (record.requiredForCurrentBaseline && record.providerId === primaryProviderId) {
      pushIssue(
        issues,
        "CURRENT_BASELINE_REQUIRED_CONTROL_UNSUPPORTED",
        "A current-baseline required control cannot be unsupported.",
        record.unsupportedControlId,
      );
    }
    if (!record.localFallbackRef) {
      pushIssue(
        issues,
        "UNSUPPORTED_CONTROL_FALLBACK_MISSING",
        "Unsupported controls require an explicit local fallback or blocked ref.",
        record.unsupportedControlId,
      );
    }
    if (record.evidenceRefs.length === 0) {
      pushIssue(
        issues,
        "UNSUPPORTED_CONTROL_EVIDENCE_MISSING",
        "Unsupported controls require evidence refs.",
        record.unsupportedControlId,
      );
    }
  }
}

function validateBlockedExternalRowsHaveUnsupportedRecords(
  setup: ModelAuditAndSafetySetupDocuments,
  issues: ValidationIssue[],
): void {
  const unsupportedByProviderEnv = new Set(
    [...setup.auditBaseline.unsupportedControls, ...setup.safetyBaseline.unsupportedControls].map(
      (entry) => `${entry.providerId}:${entry.environmentId}`,
    ),
  );
  for (const audit of setup.auditBaseline.auditControls) {
    if (
      audit.status === "blocked_pending_provider_selection" &&
      !unsupportedByProviderEnv.has(`${audit.providerId}:${audit.environmentId}`)
    ) {
      pushIssue(
        issues,
        "BLOCKED_AUDIT_UNSUPPORTED_RECORD_MISSING",
        "Blocked vendor audit rows need explicit unsupported-control evidence.",
        audit.auditControlId,
      );
    }
  }
  for (const safety of setup.safetyBaseline.safetyControls) {
    if (
      safety.status === "blocked_pending_provider_selection" &&
      !unsupportedByProviderEnv.has(`${safety.providerId}:${safety.environmentId}`)
    ) {
      pushIssue(
        issues,
        "BLOCKED_SAFETY_UNSUPPORTED_RECORD_MISSING",
        "Blocked vendor safety rows need explicit unsupported-control evidence.",
        safety.safetyControlId,
      );
    }
  }
}

function detectRawPayloadOrSecretFields(
  value: unknown,
  issues: ValidationIssue[],
  ref = "$",
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      detectRawPayloadOrSecretFields(entry, issues, `${ref}[${index}]`),
    );
    return;
  }
  if (!value || typeof value !== "object") {
    if (
      typeof value === "string" &&
      (containsSensitiveLeak(value) ||
        RAW_PAYLOAD_PATTERNS.some((pattern) => pattern.test(value)))
    ) {
      pushIssue(
        issues,
        "RAW_SECRET_OR_PAYLOAD_PATTERN_DETECTED",
        "Detected a raw secret-shaped or payload-shaped value in 426 manifests.",
        ref,
      );
    }
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (
      RAW_PAYLOAD_FIELD_NAMES.some(
        (fieldName) => fieldName.toLowerCase() === key.toLowerCase(),
      )
    ) {
      pushIssue(
        issues,
        "RAW_PAYLOAD_FIELD_DETECTED",
        `Raw payload field ${key} is not allowed in model audit/safety manifests.`,
        `${ref}.${key}`,
      );
    }
    detectRawPayloadOrSecretFields(entry, issues, `${ref}.${key}`);
  }
}

export function buildModelAuditAndSafetyReadinessEvidence(
  setup: ModelAuditAndSafetySetupDocuments,
  mode: OperationMode,
  rootDir = ROOT,
): ModelAuditAndSafetyReadinessEvidence {
  const validation = validateModelAuditAndSafetySetupDocuments(setup, rootDir);
  const blockedReasons = validation.issues.map((issue) => issue.code);
  if (mode === "apply") {
    blockedReasons.push("APPLY_MODE_BLOCKED_WATCH_ONLY");
  }
  const decision: ModelAuditAndSafetyReadinessEvidence["decision"] =
    validation.issues.length > 0
      ? "blocked_by_validation"
      : mode === "apply"
        ? "blocked_for_apply"
        : "ready_for_dry_run_rehearsal_verify";
  const auditRows = setup.auditBaseline.auditControls.map((audit) => ({
    auditControlId: audit.auditControlId,
    providerId: audit.providerId,
    environmentId: audit.environmentId,
    status: audit.status,
    retentionDays: audit.retentionDays,
    payloadPolicy: audit.payloadPolicy,
    eventClassCount: audit.eventClassAllowList.length,
  }));
  const safetyRows = setup.safetyBaseline.safetyControls.map((safety) => ({
    safetyControlId: safety.safetyControlId,
    providerId: safety.providerId,
    environmentId: safety.environmentId,
    status: safety.status,
    allowedModelFamilyCount: safety.allowedModelFamilies.length,
    guardrailCount: safety.guardrailRefs.length,
    humanReviewPosture: safety.humanReviewPosture,
  }));
  const unsupportedControlRows = [
    ...setup.auditBaseline.unsupportedControls,
    ...setup.safetyBaseline.unsupportedControls,
  ].map((unsupported) => ({
    unsupportedControlId: unsupported.unsupportedControlId,
    providerId: unsupported.providerId,
    environmentId: unsupported.environmentId,
    controlFamily: unsupported.controlFamily,
    currentState: unsupported.currentState,
    blockingImpact: unsupported.blockingImpact,
  }));

  return {
    taskId: FULL_TASK_ID,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    mode,
    primaryProviderId: setup.auditBaseline.primaryProviderId,
    decision,
    validationIssueCount: validation.issues.length,
    auditRows,
    safetyRows,
    unsupportedControlRows,
    evidenceDigest: `evidence_sha256_${digest(
      { mode, auditRows, safetyRows, unsupportedControlRows },
      20,
    )}`,
    blockedReasons,
  };
}

export function collectTrackedSecretRefs(): readonly string[] {
  return collect425TrackedSecretRefs();
}

export function redactSensitiveText(value: string): string {
  return redact425SensitiveText(value, collectTrackedSecretRefs());
}

export function containsSensitiveLeak(value: string): boolean {
  return contains425SensitiveLeak(value, collectTrackedSecretRefs());
}

export function readAndValidateModelAuditAndSafetySetup(
  rootDir = ROOT,
): ModelAuditAndSafetySetupDocuments & { readonly validation: ValidationResult } {
  const setup = {
    auditBaseline: readJsonOrJsonYaml<ModelAuditBaselineDocument>(
      path.join(rootDir, SOURCE_OUTPUT_PATHS.auditBaseline),
    ),
    safetyBaseline: readJsonOrJsonYaml<ModelSafetyBaselineDocument>(
      path.join(rootDir, SOURCE_OUTPUT_PATHS.safetyBaseline),
    ),
    contract: readJsonOrJsonYaml<ModelAuditAndSafetyContract>(
      path.join(rootDir, SOURCE_OUTPUT_PATHS.contract),
    ),
  };
  return {
    ...setup,
    validation: validateModelAuditAndSafetySetupDocuments(setup, rootDir),
  };
}

export function materializeModelAuditAndSafetyArtifacts(rootDir: string): void {
  const setup = {
    auditBaseline: buildModelAuditBaseline(),
    safetyBaseline: buildModelSafetyBaseline(),
    contract: buildModelAuditAndSafetyContract(),
  };
  writeJson(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.auditBaseline),
    setup.auditBaseline,
  );
  writeJson(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.safetyBaseline),
    setup.safetyBaseline,
  );
  writeJson(path.join(rootDir, SOURCE_OUTPUT_PATHS.contract), setup.contract);
  writeText(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.vendorControlMappingMatrix),
    renderVendorControlMappingMatrixCsv(setup),
  );
  writeText(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.readinessMatrix),
    renderAuditAndSafetyReadinessMatrixCsv(setup),
  );
}
