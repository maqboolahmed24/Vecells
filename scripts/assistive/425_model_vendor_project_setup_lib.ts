import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TASK_ID = "par_425";
export const FULL_TASK_ID =
  "par_425_phase8_use_Playwright_or_other_appropriate_tooling_browser_automation_to_provision_model_vendor_projects_and_api_keys";
export const SCHEMA_VERSION = "425.phase8.model-vendor-project-setup.v1";
export const GENERATED_AT = "2026-04-27T12:00:00.000Z";
export const CONTROL_PLANE_VERSION =
  "425-phase8-model-vendor-project-and-key-provisioning-2026-04-27.v1";
export const OUTPUT_DIR = ".artifacts/model-vendor-projects/425";

export const SOURCE_OUTPUT_PATHS = {
  registry: "data/config/425_model_vendor_registry.example.yaml",
  projectManifest: "data/config/425_model_vendor_project_manifest.example.json",
  keyReferenceManifest:
    "data/config/425_model_vendor_key_reference_manifest.example.json",
  contract: "data/contracts/425_model_vendor_project_and_key_contract.json",
  readinessMatrix: "data/analysis/425_project_key_readiness_matrix.csv",
} as const;

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export type ProviderId =
  | "vecells_assistive_vendor_watch_shadow_twin"
  | "openai"
  | "azure_openai"
  | "anthropic"
  | "google_vertex_ai"
  | "aws_bedrock";

export type EnvironmentId =
  | "development_local_twin"
  | "integration_candidate"
  | "preprod_rehearsal";

export type OperationMode = "dry_run" | "rehearsal" | "apply" | "verify";

export type ProviderSelectionState =
  | "primary_configured"
  | "optional_supported_pending_selection"
  | "unsupported_pending_interface";

export type ProviderBaselineState =
  | "watch_only"
  | "not_selected"
  | "unsupported";

export type ProjectIdentityStatus =
  | "local_shadow_twin"
  | "blocked_pending_provider_selection"
  | "blocked_pending_intended_use_review"
  | "unsupported_placeholder";

export type KeyReferenceStatus =
  | "ready_reference"
  | "blocked_pending_provider_selection"
  | "blocked_pending_intended_use_review"
  | "unsupported_placeholder";

export interface ModelVendorEnvironmentProfile {
  readonly environmentId: EnvironmentId;
  readonly environmentLabel: string;
  readonly releaseRingRef: string;
  readonly productionAllowed: false;
  readonly storageStateRef: string;
  readonly allowedModes: readonly OperationMode[];
  readonly notes: readonly string[];
}

export interface ModelVendorProviderProfile {
  readonly providerId: ProviderId;
  readonly providerDisplayName: string;
  readonly providerKind: "local_watch_twin" | "external_model_vendor";
  readonly selectionState: ProviderSelectionState;
  readonly currentBaselineState: ProviderBaselineState;
  readonly dependencyRef: "dep_assistive_model_vendor_family";
  readonly adapterProfileRef: "assistive_vendor_boundary";
  readonly mutationDefault: "blocked_watch_only";
  readonly officialReferenceRefs: readonly string[];
  readonly requiredGateRefs: readonly string[];
  readonly administrationSurfaces: readonly {
    readonly surfaceId: string;
    readonly surfaceKind:
      | "local_harness"
      | "vendor_dashboard"
      | "management_api"
      | "iac_manifest";
    readonly urlRef: string;
    readonly browserAutomationAllowed: boolean;
    readonly mutationAllowed: false;
    readonly evidencePolicyRef: string;
  }[];
}

export interface ModelVendorRegistryDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly primaryProviderId: ProviderId;
  readonly liveProviderSelectionStatus: "none_selected_watch_only";
  readonly environmentProfiles: readonly ModelVendorEnvironmentProfile[];
  readonly providers: readonly ModelVendorProviderProfile[];
  readonly providerSelectionEvidenceRefs: readonly string[];
}

export interface ModelVendorServiceIdentityBinding {
  readonly serviceIdentityId: string;
  readonly serviceIdentityLabel: string;
  readonly providerMemberRef: string;
  readonly role: "service_member" | "project_reader" | "project_admin_placeholder";
  readonly ownerRole: string;
  readonly scopeRefs: readonly string[];
  readonly secretBindingRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly status:
    | "active_local_reference"
    | "blocked_pending_selection"
    | "blocked_pending_intended_use_review";
}

export interface ModelVendorProjectEntry {
  readonly projectId: string;
  readonly providerId: ProviderId;
  readonly environmentId: EnvironmentId;
  readonly environmentLabel: string;
  readonly organizationRef: string;
  readonly providerProjectRef: string;
  readonly projectDisplayName: string;
  readonly projectIdentityStatus: ProjectIdentityStatus;
  readonly operationModes: Record<OperationMode, boolean>;
  readonly browserAdminSurfaceRef: string;
  readonly serviceIdentities: readonly ModelVendorServiceIdentityBinding[];
  readonly allowedModelFamilies: readonly string[];
  readonly regionPolicyRef: string;
  readonly subprocessorReviewRef: string;
  readonly rollbackRehearsalRef: string;
  readonly trustEnvelopeRefs: readonly string[];
  readonly notes: readonly string[];
}

export interface ModelVendorProjectManifestDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly registryRef: string;
  readonly projects: readonly ModelVendorProjectEntry[];
}

export interface ModelVendorKeyReferenceEntry {
  readonly keyReferenceId: string;
  readonly providerId: ProviderId;
  readonly projectId: string;
  readonly environmentId: EnvironmentId;
  readonly serviceIdentityId: string;
  readonly credentialClass:
    | "local_synthetic_invocation_handle"
    | "project_api_key"
    | "service_account_api_key"
    | "managed_identity_token";
  readonly keyStatus: KeyReferenceStatus;
  readonly secretRef: string;
  readonly managedVariableName: string;
  readonly vaultPathRef: string;
  readonly providerKeyIdentifierRef: string;
  readonly maskedFingerprint: string;
  readonly scopeRefs: readonly string[];
  readonly rotationCadenceDays: number;
  readonly evidenceRefs: readonly string[];
  readonly notes: readonly string[];
}

export interface ModelVendorKeyReferenceManifestDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly registryRef: string;
  readonly projectManifestRef: string;
  readonly keyReferences: readonly ModelVendorKeyReferenceEntry[];
}

export interface ModelVendorProjectAndKeyContract {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly registryRef: string;
  readonly projectManifestRef: string;
  readonly keyReferenceManifestRef: string;
  readonly readinessMatrixRef: string;
  readonly supportedEnvironmentIds: readonly EnvironmentId[];
  readonly supportedProviderIds: readonly ProviderId[];
  readonly allowedAutomationModes: readonly OperationMode[];
  readonly defaultAutomationMode: "dry_run";
  readonly applyModeDefault: "blocked";
  readonly secretReferencePolicy:
    "secret_refs_vault_paths_managed_vars_only_no_raw_values";
  readonly browserEvidencePolicy:
    "isolated_contexts_redacted_artifacts_no_raw_secret_traces";
  readonly sourceRefs: readonly string[];
}

export interface ModelVendorSetupDocuments {
  readonly registry: ModelVendorRegistryDocument;
  readonly projectManifest: ModelVendorProjectManifestDocument;
  readonly keyReferenceManifest: ModelVendorKeyReferenceManifestDocument;
}

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly ref?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

export interface VendorDetectionResult {
  readonly primaryProviderId: ProviderId;
  readonly detectionState: "watch_only_local_twin" | "ambiguous" | "external_signal_found";
  readonly evidenceRefs: readonly string[];
  readonly providerSignals: readonly string[];
  readonly notes: readonly string[];
}

export interface ReadinessEvidence {
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
  readonly projectRows: readonly {
    readonly projectId: string;
    readonly providerId: ProviderId;
    readonly environmentId: EnvironmentId;
    readonly projectIdentityStatus: ProjectIdentityStatus;
    readonly applyAllowed: boolean;
    readonly serviceIdentityCount: number;
  }[];
  readonly keyReferenceRows: readonly {
    readonly keyReferenceId: string;
    readonly providerId: ProviderId;
    readonly environmentId: EnvironmentId;
    readonly keyStatus: KeyReferenceStatus;
    readonly maskedFingerprint: string;
    readonly scopeCount: number;
  }[];
  readonly blockedReasons: readonly string[];
}

const ENVIRONMENT_PROFILES: readonly ModelVendorEnvironmentProfile[] = [
  {
    environmentId: "development_local_twin",
    environmentLabel: "Development local twin",
    releaseRingRef: "ring://local/development",
    productionAllowed: false,
    storageStateRef: path.posix.join(
      OUTPUT_DIR,
      "playwright.auth/development-local-twin.json",
    ),
    allowedModes: ["dry_run", "rehearsal", "verify"],
    notes: [
      "Local twin is the primary configured path while live model vendors remain optional.",
      "No production account, raw key, or provider dashboard mutation is represented in this ring.",
    ],
  },
  {
    environmentId: "integration_candidate",
    environmentLabel: "Integration candidate",
    releaseRingRef: "ring://nonprod/integration",
    productionAllowed: false,
    storageStateRef: path.posix.join(
      OUTPUT_DIR,
      "playwright.auth/integration-candidate.json",
    ),
    allowedModes: ["dry_run", "rehearsal", "verify"],
    notes: [
      "Integration candidate can rehearse owner, member, scope, and key-reference joins.",
      "Apply remains blocked until a future provider-selection artifact names a live vendor.",
    ],
  },
  {
    environmentId: "preprod_rehearsal",
    environmentLabel: "Pre-production rehearsal",
    releaseRingRef: "ring://nonprod/preprod-rehearsal",
    productionAllowed: false,
    storageStateRef: path.posix.join(
      OUTPUT_DIR,
      "playwright.auth/preprod-rehearsal.json",
    ),
    allowedModes: ["dry_run", "verify"],
    notes: [
      "Pre-production rehearsal carries blocked placeholder references only.",
      "Future assistive vendor keys require intended-use and subprocessor review before ingest.",
    ],
  },
] as const;

const PROVIDERS: readonly ModelVendorProviderProfile[] = [
  {
    providerId: "vecells_assistive_vendor_watch_shadow_twin",
    providerDisplayName: "Vecells assistive vendor watch shadow twin",
    providerKind: "local_watch_twin",
    selectionState: "primary_configured",
    currentBaselineState: "watch_only",
    dependencyRef: "dep_assistive_model_vendor_family",
    adapterProfileRef: "assistive_vendor_boundary",
    mutationDefault: "blocked_watch_only",
    officialReferenceRefs: [
      "data/analysis/integration_assumption_ledger.csv#dep_assistive_model_vendor_family",
      "data/analysis/dependency_watchlist.csv#dep_assistive_model_vendor_family",
      "data/analysis/credential_capture_checklist.csv#CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY",
    ],
    requiredGateRefs: [
      "GATE_P8_PARALLEL_MERGE",
      "GATE_OPTIONAL_ASSISTIVE_ENABLEMENT",
      "LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW",
    ],
    administrationSurfaces: [
      {
        surfaceId: "425_local_shadow_twin_console",
        surfaceKind: "local_harness",
        urlRef: "local://tools/browser-automation/425_model_vendor_project_console",
        browserAutomationAllowed: true,
        mutationAllowed: false,
        evidencePolicyRef: "evidence-policy://425/redacted-local-harness",
      },
      {
        surfaceId: "425_shadow_twin_iac_manifest",
        surfaceKind: "iac_manifest",
        urlRef: "data/config/425_model_vendor_project_manifest.example.json",
        browserAutomationAllowed: false,
        mutationAllowed: false,
        evidencePolicyRef: "evidence-policy://425/config-drift-only",
      },
    ],
  },
  {
    providerId: "openai",
    providerDisplayName: "OpenAI API platform",
    providerKind: "external_model_vendor",
    selectionState: "optional_supported_pending_selection",
    currentBaselineState: "not_selected",
    dependencyRef: "dep_assistive_model_vendor_family",
    adapterProfileRef: "assistive_vendor_boundary",
    mutationDefault: "blocked_watch_only",
    officialReferenceRefs: [
      "https://developers.openai.com/api/reference/resources/organization/subresources/projects/subresources/api_keys/methods/list",
      "https://developers.openai.com/api/docs/guides/rbac",
      "https://developers.openai.com/api/reference/overview#authentication",
      "https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety",
    ],
    requiredGateRefs: [
      "LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW",
      "GATE_OPTIONAL_ASSISTIVE_ENABLEMENT",
      "LIVE_GATE_MODEL_VENDOR_PROVIDER_SELECTED",
    ],
    administrationSurfaces: [
      {
        surfaceId: "425_openai_dashboard_placeholder",
        surfaceKind: "vendor_dashboard",
        urlRef: "https://platform.openai.com/",
        browserAutomationAllowed: false,
        mutationAllowed: false,
        evidencePolicyRef: "evidence-policy://425/no-live-dashboard-without-selection",
      },
      {
        surfaceId: "425_openai_management_api_placeholder",
        surfaceKind: "management_api",
        urlRef:
          "https://developers.openai.com/api/reference/resources/organization",
        browserAutomationAllowed: false,
        mutationAllowed: false,
        evidencePolicyRef: "evidence-policy://425/admin-api-doc-reference-only",
      },
    ],
  },
  {
    providerId: "azure_openai",
    providerDisplayName: "Azure OpenAI",
    providerKind: "external_model_vendor",
    selectionState: "optional_supported_pending_selection",
    currentBaselineState: "not_selected",
    dependencyRef: "dep_assistive_model_vendor_family",
    adapterProfileRef: "assistive_vendor_boundary",
    mutationDefault: "blocked_watch_only",
    officialReferenceRefs: [],
    requiredGateRefs: ["LIVE_GATE_MODEL_VENDOR_PROVIDER_SELECTED"],
    administrationSurfaces: [],
  },
  {
    providerId: "anthropic",
    providerDisplayName: "Anthropic",
    providerKind: "external_model_vendor",
    selectionState: "optional_supported_pending_selection",
    currentBaselineState: "not_selected",
    dependencyRef: "dep_assistive_model_vendor_family",
    adapterProfileRef: "assistive_vendor_boundary",
    mutationDefault: "blocked_watch_only",
    officialReferenceRefs: [],
    requiredGateRefs: ["LIVE_GATE_MODEL_VENDOR_PROVIDER_SELECTED"],
    administrationSurfaces: [],
  },
  {
    providerId: "google_vertex_ai",
    providerDisplayName: "Google Vertex AI",
    providerKind: "external_model_vendor",
    selectionState: "optional_supported_pending_selection",
    currentBaselineState: "not_selected",
    dependencyRef: "dep_assistive_model_vendor_family",
    adapterProfileRef: "assistive_vendor_boundary",
    mutationDefault: "blocked_watch_only",
    officialReferenceRefs: [],
    requiredGateRefs: ["LIVE_GATE_MODEL_VENDOR_PROVIDER_SELECTED"],
    administrationSurfaces: [],
  },
  {
    providerId: "aws_bedrock",
    providerDisplayName: "AWS Bedrock",
    providerKind: "external_model_vendor",
    selectionState: "optional_supported_pending_selection",
    currentBaselineState: "not_selected",
    dependencyRef: "dep_assistive_model_vendor_family",
    adapterProfileRef: "assistive_vendor_boundary",
    mutationDefault: "blocked_watch_only",
    officialReferenceRefs: [],
    requiredGateRefs: ["LIVE_GATE_MODEL_VENDOR_PROVIDER_SELECTED"],
    administrationSurfaces: [],
  },
] as const;

const PROJECT_TEMPLATES: readonly Omit<
  ModelVendorProjectEntry,
  "environmentLabel"
>[] = [
  {
    projectId: "mvproj_425_dev_shadow_twin",
    providerId: "vecells_assistive_vendor_watch_shadow_twin",
    environmentId: "development_local_twin",
    organizationRef: "org://vecells/nonprod/development",
    providerProjectRef: "shadow-twin://assistive/vendor-watch/dev",
    projectDisplayName: "Assistive vendor watch local twin",
    projectIdentityStatus: "local_shadow_twin",
    operationModes: {
      dry_run: true,
      rehearsal: true,
      apply: false,
      verify: true,
    },
    browserAdminSurfaceRef: "425_local_shadow_twin_console",
    serviceIdentities: [
      {
        serviceIdentityId: "svc_425_assistive_dev_shadow_invoker",
        serviceIdentityLabel: "Assistive local shadow invoker",
        providerMemberRef: "member://425/local-shadow/dev/invoker",
        role: "service_member",
        ownerRole: "ROLE_INTEROPERABILITY_LEAD",
        scopeRefs: [
          "scope://assistive/shadow-invoke",
          "scope://assistive/provenance-write",
          "scope://assistive/audit-read",
        ],
        secretBindingRefs: ["keyref_425_dev_shadow_invocation_handle"],
        evidenceRefs: [
          "evidence://425/dev-shadow/service-identity-binding",
          "evidence://418/assistive-rail/non-authoritative-output",
        ],
        status: "active_local_reference",
      },
    ],
    allowedModelFamilies: ["local_placeholder_only"],
    regionPolicyRef: "region-policy://425/local-only",
    subprocessorReviewRef: "subprocessor-review://425/not-applicable-local-twin",
    rollbackRehearsalRef: "rollback://417/assistive-kill-switch-rehearsal",
    trustEnvelopeRefs: [
      "data/contracts/411_assistive_trust_envelope_projection_contract.json",
      "data/contracts/422_trust_posture_contract.json",
    ],
    notes: [
      "This is the primary configured path detected from the repository watch-only dependency posture.",
      "It proves joins, scoping, masking, and readiness without live provider mutation.",
    ],
  },
  {
    projectId: "mvproj_425_integration_shadow_twin",
    providerId: "vecells_assistive_vendor_watch_shadow_twin",
    environmentId: "integration_candidate",
    organizationRef: "org://vecells/nonprod/integration",
    providerProjectRef: "shadow-twin://assistive/vendor-watch/integration",
    projectDisplayName: "Assistive vendor watch integration twin",
    projectIdentityStatus: "local_shadow_twin",
    operationModes: {
      dry_run: true,
      rehearsal: true,
      apply: false,
      verify: true,
    },
    browserAdminSurfaceRef: "425_local_shadow_twin_console",
    serviceIdentities: [
      {
        serviceIdentityId: "svc_425_assistive_int_shadow_invoker",
        serviceIdentityLabel: "Assistive integration shadow invoker",
        providerMemberRef: "member://425/local-shadow/integration/invoker",
        role: "service_member",
        ownerRole: "ROLE_INTEROPERABILITY_LEAD",
        scopeRefs: [
          "scope://assistive/shadow-invoke",
          "scope://assistive/provenance-write",
          "scope://assistive/audit-read",
        ],
        secretBindingRefs: ["keyref_425_integration_shadow_invocation_handle"],
        evidenceRefs: [
          "evidence://425/integration-shadow/service-identity-binding",
          "evidence://423/stale-recovery/freeze-path",
        ],
        status: "active_local_reference",
      },
    ],
    allowedModelFamilies: ["local_placeholder_only"],
    regionPolicyRef: "region-policy://425/local-only",
    subprocessorReviewRef: "subprocessor-review://425/not-applicable-local-twin",
    rollbackRehearsalRef: "rollback://417/assistive-kill-switch-rehearsal",
    trustEnvelopeRefs: [
      "data/contracts/411_assistive_trust_envelope_projection_contract.json",
      "data/contracts/423_stale_freeze_recovery_contract.json",
    ],
    notes: [
      "Integration rehearsal remains local and non-authoritative.",
      "Any live provider widening must replace this placeholder with selected-provider evidence.",
    ],
  },
  {
    projectId: "mvproj_425_preprod_openai_placeholder",
    providerId: "openai",
    environmentId: "preprod_rehearsal",
    organizationRef: "org://vecells/preprod/assistive-placeholder",
    providerProjectRef: "provider-placeholder://openai/preprod/project-not-created",
    projectDisplayName: "OpenAI preprod placeholder - not selected",
    projectIdentityStatus: "blocked_pending_provider_selection",
    operationModes: {
      dry_run: false,
      rehearsal: false,
      apply: false,
      verify: true,
    },
    browserAdminSurfaceRef: "425_openai_dashboard_placeholder",
    serviceIdentities: [
      {
        serviceIdentityId: "svc_425_openai_preprod_placeholder",
        serviceIdentityLabel: "OpenAI service account placeholder",
        providerMemberRef: "member://425/openai/preprod/service-account-placeholder",
        role: "project_reader",
        ownerRole: "ROLE_DPO",
        scopeRefs: [
          "scope://assistive/provider-selection-readiness-read",
          "scope://assistive/subprocessor-review-read",
        ],
        secretBindingRefs: ["keyref_425_openai_preprod_vendor_key_blocked"],
        evidenceRefs: [
          "evidence://425/openai/preprod/provider-selection-blocked",
          "evidence://425/openai/preprod/intended-use-review-required",
        ],
        status: "blocked_pending_selection",
      },
    ],
    allowedModelFamilies: [],
    regionPolicyRef: "region-policy://425/provider-not-selected",
    subprocessorReviewRef: "subprocessor-review://425/required-before-openai-selection",
    rollbackRehearsalRef: "rollback://417/assistive-kill-switch-rehearsal",
    trustEnvelopeRefs: [
      "data/contracts/411_assistive_trust_envelope_projection_contract.json",
    ],
    notes: [
      "This typed placeholder records the shape needed if OpenAI is later selected.",
      "It does not assert that an OpenAI project, service account, or key exists.",
    ],
  },
] as const;

const SECRET_PREFIXES = ["secret://", "vault://", "kms://", "env://managed/"] as const;
const RAW_SECRET_FIELD_NAMES = [
  "apiKey",
  "api_key",
  "clientSecret",
  "client_secret",
  "rawSecret",
  "raw_secret",
  "secretValue",
  "secret_value",
  "token",
  "accessToken",
  "refreshToken",
] as const;
const RAW_SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{16,}/u,
  /Bearer\s+(?!\$)[A-Za-z0-9._~+/=-]{20,}/iu,
  /BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE\s+KEY/u,
  /client_secret\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}/iu,
] as const;
const SECRET_LOCATOR_PATTERN = /\b(?:secret|vault|kms):\/\/[^\s"'<>()]+/giu;

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

function environmentProfile(
  environmentId: EnvironmentId,
): ModelVendorEnvironmentProfile {
  const profile = ENVIRONMENT_PROFILES.find(
    (entry) => entry.environmentId === environmentId,
  );
  if (!profile) {
    throw new Error(`Unknown model vendor environment: ${environmentId}`);
  }
  return profile;
}

export function stableFingerprintForSecretRef(input: {
  readonly keyReferenceId: string;
  readonly environmentId: EnvironmentId;
  readonly secretRef: string;
}): string {
  return `fp_sha256_${digest(
    {
      keyReferenceId: input.keyReferenceId,
      environmentId: input.environmentId,
      secretRef: input.secretRef,
    },
    20,
  )}`;
}

function keyReferenceTemplate(
  input: Omit<ModelVendorKeyReferenceEntry, "maskedFingerprint">,
): ModelVendorKeyReferenceEntry {
  return {
    ...input,
    maskedFingerprint: stableFingerprintForSecretRef({
      keyReferenceId: input.keyReferenceId,
      environmentId: input.environmentId,
      secretRef: input.secretRef,
    }),
  };
}

export function buildModelVendorRegistry(): ModelVendorRegistryDocument {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    primaryProviderId: "vecells_assistive_vendor_watch_shadow_twin",
    liveProviderSelectionStatus: "none_selected_watch_only",
    environmentProfiles: ENVIRONMENT_PROFILES,
    providers: PROVIDERS,
    providerSelectionEvidenceRefs: [
      "data/analysis/integration_assumption_ledger.csv#dep_assistive_model_vendor_family",
      "data/analysis/dependency_watchlist.csv#dep_assistive_model_vendor_family",
      "data/analysis/adapter_effect_family_matrix.csv#fxf_assistive_vendor_watch",
      "data/analysis/credential_capture_checklist.csv#CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY",
    ],
  };
}

export function buildModelVendorProjectManifest(): ModelVendorProjectManifestDocument {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    registryRef: SOURCE_OUTPUT_PATHS.registry,
    projects: PROJECT_TEMPLATES.map((project) => ({
      ...project,
      environmentLabel: environmentProfile(project.environmentId).environmentLabel,
    })),
  };
}

export function buildModelVendorKeyReferenceManifest(): ModelVendorKeyReferenceManifestDocument {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    registryRef: SOURCE_OUTPUT_PATHS.registry,
    projectManifestRef: SOURCE_OUTPUT_PATHS.projectManifest,
    keyReferences: [
      keyReferenceTemplate({
        keyReferenceId: "keyref_425_dev_shadow_invocation_handle",
        providerId: "vecells_assistive_vendor_watch_shadow_twin",
        projectId: "mvproj_425_dev_shadow_twin",
        environmentId: "development_local_twin",
        serviceIdentityId: "svc_425_assistive_dev_shadow_invoker",
        credentialClass: "local_synthetic_invocation_handle",
        keyStatus: "ready_reference",
        secretRef:
          "secret://vecells/nonprod/dev/assistive-shadow-twin/invocation-handle",
        managedVariableName: "VECELLS_ASSISTIVE_DEV_SHADOW_INVOCATION_REF",
        vaultPathRef: "vault://shared-nonprod/assistive/dev/shadow-invocation",
        providerKeyIdentifierRef:
          "keyref://425/local-shadow/dev/invocation-handle",
        scopeRefs: [
          "scope://assistive/shadow-invoke",
          "scope://assistive/provenance-write",
          "scope://assistive/audit-read",
        ],
        rotationCadenceDays: 30,
        evidenceRefs: [
          "evidence://425/dev-shadow/masked-fingerprint",
          "evidence://089/secrets-kms/access-boundary",
        ],
        notes: [
          "Reference handle only. No raw invocation value is stored in the manifest.",
        ],
      }),
      keyReferenceTemplate({
        keyReferenceId: "keyref_425_integration_shadow_invocation_handle",
        providerId: "vecells_assistive_vendor_watch_shadow_twin",
        projectId: "mvproj_425_integration_shadow_twin",
        environmentId: "integration_candidate",
        serviceIdentityId: "svc_425_assistive_int_shadow_invoker",
        credentialClass: "local_synthetic_invocation_handle",
        keyStatus: "ready_reference",
        secretRef:
          "secret://vecells/nonprod/integration/assistive-shadow-twin/invocation-handle",
        managedVariableName: "VECELLS_ASSISTIVE_INT_SHADOW_INVOCATION_REF",
        vaultPathRef:
          "vault://shared-nonprod/assistive/integration/shadow-invocation",
        providerKeyIdentifierRef:
          "keyref://425/local-shadow/integration/invocation-handle",
        scopeRefs: [
          "scope://assistive/shadow-invoke",
          "scope://assistive/provenance-write",
          "scope://assistive/audit-read",
        ],
        rotationCadenceDays: 30,
        evidenceRefs: [
          "evidence://425/integration-shadow/masked-fingerprint",
          "evidence://089/secrets-kms/access-boundary",
        ],
        notes: [
          "Integration reference handle proves registry resolution without live provider access.",
        ],
      }),
      keyReferenceTemplate({
        keyReferenceId: "keyref_425_openai_preprod_vendor_key_blocked",
        providerId: "openai",
        projectId: "mvproj_425_preprod_openai_placeholder",
        environmentId: "preprod_rehearsal",
        serviceIdentityId: "svc_425_openai_preprod_placeholder",
        credentialClass: "service_account_api_key",
        keyStatus: "blocked_pending_provider_selection",
        secretRef: "secret://vecells/preprod/assistive/openai/vendor-key-ref",
        managedVariableName: "OPENAI_ASSISTIVE_PREPROD_VENDOR_KEY_REF",
        vaultPathRef: "vault://preprod/assistive/openai/vendor-key-ref",
        providerKeyIdentifierRef:
          "provider-placeholder://openai/preprod/service-account-key-not-issued",
        scopeRefs: [
          "scope://assistive/provider-selection-readiness-read",
          "scope://assistive/subprocessor-review-read",
        ],
        rotationCadenceDays: 30,
        evidenceRefs: [
          "evidence://425/openai/preprod/blocked-pending-selection",
          "evidence://secret-ownership/CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY",
        ],
        notes: [
          "Placeholder only. The repository does not select or issue an OpenAI key for current baseline use.",
        ],
      }),
    ],
  };
}

export function buildModelVendorProjectAndKeyContract(): ModelVendorProjectAndKeyContract {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    registryRef: SOURCE_OUTPUT_PATHS.registry,
    projectManifestRef: SOURCE_OUTPUT_PATHS.projectManifest,
    keyReferenceManifestRef: SOURCE_OUTPUT_PATHS.keyReferenceManifest,
    readinessMatrixRef: SOURCE_OUTPUT_PATHS.readinessMatrix,
    supportedEnvironmentIds: ENVIRONMENT_PROFILES.map(
      (entry) => entry.environmentId,
    ),
    supportedProviderIds: PROVIDERS.map((entry) => entry.providerId),
    allowedAutomationModes: ["dry_run", "rehearsal", "verify"],
    defaultAutomationMode: "dry_run",
    applyModeDefault: "blocked",
    secretReferencePolicy:
      "secret_refs_vault_paths_managed_vars_only_no_raw_values",
    browserEvidencePolicy:
      "isolated_contexts_redacted_artifacts_no_raw_secret_traces",
    sourceRefs: [
      "blueprint/phase-8-the-assistive-layer.md#8H",
      "blueprint/platform-runtime-and-release-blueprint.md#Security baseline contract",
      "data/analysis/integration_assumption_ledger.csv#dep_assistive_model_vendor_family",
      "data/analysis/dependency_watchlist.csv#dep_assistive_model_vendor_family",
      "data/analysis/credential_capture_checklist.csv#CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY",
    ],
  };
}

export function renderProjectKeyReadinessMatrixCsv(
  setup: ModelVendorSetupDocuments = {
    registry: buildModelVendorRegistry(),
    projectManifest: buildModelVendorProjectManifest(),
    keyReferenceManifest: buildModelVendorKeyReferenceManifest(),
  },
): string {
  const keyByProject = new Map<string, ModelVendorKeyReferenceEntry[]>();
  for (const keyRef of setup.keyReferenceManifest.keyReferences) {
    keyByProject.set(keyRef.projectId, [
      ...(keyByProject.get(keyRef.projectId) ?? []),
      keyRef,
    ]);
  }

  const rows = [
    [
      "project_id",
      "provider_id",
      "environment_id",
      "project_identity_status",
      "service_identity_count",
      "key_reference_count",
      "apply_allowed",
      "readiness_decision",
      "blocked_reason",
    ],
  ];

  for (const project of setup.projectManifest.projects) {
    const keyRefs = keyByProject.get(project.projectId) ?? [];
    const readinessDecision =
      project.providerId === setup.registry.primaryProviderId &&
      project.projectIdentityStatus === "local_shadow_twin"
        ? "ready_for_dry_run_rehearsal_verify"
        : "blocked_placeholder_only";
    const blockedReason = project.operationModes.apply
      ? "invalid_apply_enabled"
      : readinessDecision === "blocked_placeholder_only"
        ? "provider_not_selected_or_intended_use_review_missing"
        : "apply_blocked_watch_only";
    rows.push([
      project.projectId,
      project.providerId,
      project.environmentId,
      project.projectIdentityStatus,
      String(project.serviceIdentities.length),
      String(keyRefs.length),
      String(project.operationModes.apply),
      readinessDecision,
      blockedReason,
    ]);
  }

  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}

export function validateModelVendorSetupDocuments(
  setup: ModelVendorSetupDocuments,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const providerIds = new Set(setup.registry.providers.map((entry) => entry.providerId));
  const environmentIds = new Set(
    setup.registry.environmentProfiles.map((entry) => entry.environmentId),
  );
  const projectIds = new Set(
    setup.projectManifest.projects.map((entry) => entry.projectId),
  );
  const serviceIdentityIds = new Set<string>();
  const keyRefIds = new Set(
    setup.keyReferenceManifest.keyReferences.map((entry) => entry.keyReferenceId),
  );

  if (setup.registry.taskId !== FULL_TASK_ID) {
    pushIssue(issues, "REGISTRY_TASK_ID_DRIFT", "Registry task id drifted.");
  }
  if (setup.projectManifest.taskId !== FULL_TASK_ID) {
    pushIssue(
      issues,
      "PROJECT_MANIFEST_TASK_ID_DRIFT",
      "Project manifest task id drifted.",
    );
  }
  if (setup.keyReferenceManifest.taskId !== FULL_TASK_ID) {
    pushIssue(
      issues,
      "KEY_MANIFEST_TASK_ID_DRIFT",
      "Key reference manifest task id drifted.",
    );
  }

  const primaryProviders = setup.registry.providers.filter(
    (entry) => entry.selectionState === "primary_configured",
  );
  if (primaryProviders.length !== 1) {
    pushIssue(
      issues,
      "PRIMARY_PROVIDER_AMBIGUOUS",
      `Expected exactly one primary configured provider, found ${primaryProviders.length}.`,
    );
  }
  if (!providerIds.has(setup.registry.primaryProviderId)) {
    pushIssue(
      issues,
      "PRIMARY_PROVIDER_UNKNOWN",
      `Primary provider ${setup.registry.primaryProviderId} is not declared.`,
    );
  }
  if (primaryProviders[0]?.providerId !== setup.registry.primaryProviderId) {
    pushIssue(
      issues,
      "PRIMARY_PROVIDER_MISMATCH",
      "Registry primary provider does not match the selected provider row.",
    );
  }
  if (setup.registry.liveProviderSelectionStatus !== "none_selected_watch_only") {
    pushIssue(
      issues,
      "LIVE_PROVIDER_SELECTION_UNEXPECTED",
      "Live provider selection must remain none_selected_watch_only for task 425.",
    );
  }

  for (const environment of setup.registry.environmentProfiles) {
    if (environment.productionAllowed !== false) {
      pushIssue(
        issues,
        "PRODUCTION_ENVIRONMENT_ENABLED",
        "Task 425 may not provision production model vendor resources.",
        environment.environmentId,
      );
    }
    if (environment.environmentId.toLowerCase().includes("production")) {
      pushIssue(
        issues,
        "PRODUCTION_ENVIRONMENT_LABEL",
        "Environment ids must not target production.",
        environment.environmentId,
      );
    }
    if (environment.allowedModes.includes("apply")) {
      pushIssue(
        issues,
        "ENVIRONMENT_APPLY_ALLOWED",
        "Apply mode must be blocked at environment level for current task 425.",
        environment.environmentId,
      );
    }
  }

  for (const provider of setup.registry.providers) {
    if (
      provider.providerKind === "external_model_vendor" &&
      provider.selectionState !== "optional_supported_pending_selection" &&
      provider.selectionState !== "unsupported_pending_interface"
    ) {
      pushIssue(
        issues,
        "EXTERNAL_PROVIDER_SELECTED_UNEXPECTEDLY",
        "External model vendors must remain optional or unsupported until explicit selection evidence exists.",
        provider.providerId,
      );
    }
    if (provider.mutationDefault !== "blocked_watch_only") {
      pushIssue(
        issues,
        "PROVIDER_MUTATION_DEFAULT_NOT_BLOCKED",
        "Provider mutation must default to blocked_watch_only.",
        provider.providerId,
      );
    }
    if (
      provider.providerKind === "external_model_vendor" &&
      provider.selectionState === "optional_supported_pending_selection" &&
      provider.currentBaselineState !== "not_selected"
    ) {
      pushIssue(
        issues,
        "OPTIONAL_PROVIDER_BASELINE_NOT_BLOCKED",
        "Optional providers must remain not_selected in current baseline.",
        provider.providerId,
      );
    }
  }

  for (const project of setup.projectManifest.projects) {
    if (!providerIds.has(project.providerId)) {
      pushIssue(
        issues,
        "PROJECT_PROVIDER_UNKNOWN",
        `Project ${project.projectId} references unknown provider ${project.providerId}.`,
        project.projectId,
      );
    }
    if (!environmentIds.has(project.environmentId)) {
      pushIssue(
        issues,
        "PROJECT_ENVIRONMENT_UNKNOWN",
        `Project ${project.projectId} references unknown environment ${project.environmentId}.`,
        project.projectId,
      );
    }
    if (project.operationModes.apply) {
      pushIssue(
        issues,
        "PROJECT_APPLY_ENABLED",
        "No task 425 project may enable apply mode by default.",
        project.projectId,
      );
    }
    if (project.serviceIdentities.length < 1) {
      pushIssue(
        issues,
        "PROJECT_SERVICE_IDENTITY_MISSING",
        "Every project row must bind at least one service identity or placeholder.",
        project.projectId,
      );
    }
    if (
      project.providerId !== setup.registry.primaryProviderId &&
      project.projectIdentityStatus === "local_shadow_twin"
    ) {
      pushIssue(
        issues,
        "EXTERNAL_PROJECT_FAKED_AS_LOCAL",
        "External provider placeholders may not be marked as local_shadow_twin.",
        project.projectId,
      );
    }
    if (
      project.providerId !== setup.registry.primaryProviderId &&
      !project.projectIdentityStatus.startsWith("blocked_") &&
      project.projectIdentityStatus !== "unsupported_placeholder"
    ) {
      pushIssue(
        issues,
        "EXTERNAL_PROJECT_NOT_BLOCKED",
        "External provider project placeholders must remain blocked or unsupported.",
        project.projectId,
      );
    }
    for (const identity of project.serviceIdentities) {
      if (serviceIdentityIds.has(identity.serviceIdentityId)) {
        pushIssue(
          issues,
          "SERVICE_IDENTITY_DUPLICATE",
          "Service identity ids must be globally unique.",
          identity.serviceIdentityId,
        );
      }
      serviceIdentityIds.add(identity.serviceIdentityId);
      if (!identity.providerMemberRef.startsWith("member://")) {
        pushIssue(
          issues,
          "SERVICE_MEMBER_REF_INVALID",
          "Service identities must bind an explicit member:// reference.",
          identity.serviceIdentityId,
        );
      }
      if (identity.scopeRefs.length === 0) {
        pushIssue(
          issues,
          "SERVICE_IDENTITY_SCOPE_MISSING",
          "Service identities must have scoped capability references.",
          identity.serviceIdentityId,
        );
      }
      if (identity.scopeRefs.some((scope) => scope === "*" || /all/i.test(scope))) {
        pushIssue(
          issues,
          "SERVICE_IDENTITY_SCOPE_TOO_BROAD",
          "Wildcard or all-resource scopes are forbidden.",
          identity.serviceIdentityId,
        );
      }
      for (const keyRef of identity.secretBindingRefs) {
        if (!keyRefIds.has(keyRef)) {
          pushIssue(
            issues,
            "SERVICE_IDENTITY_SECRET_BINDING_UNKNOWN",
            `Service identity references unknown key reference ${keyRef}.`,
            identity.serviceIdentityId,
          );
        }
      }
    }
  }

  for (const keyRef of setup.keyReferenceManifest.keyReferences) {
    if (!providerIds.has(keyRef.providerId)) {
      pushIssue(
        issues,
        "KEY_PROVIDER_UNKNOWN",
        `Key reference ${keyRef.keyReferenceId} references unknown provider ${keyRef.providerId}.`,
        keyRef.keyReferenceId,
      );
    }
    if (!projectIds.has(keyRef.projectId)) {
      pushIssue(
        issues,
        "KEY_PROJECT_UNKNOWN",
        `Key reference ${keyRef.keyReferenceId} references unknown project ${keyRef.projectId}.`,
        keyRef.keyReferenceId,
      );
    }
    if (!serviceIdentityIds.has(keyRef.serviceIdentityId)) {
      pushIssue(
        issues,
        "KEY_SERVICE_IDENTITY_UNKNOWN",
        `Key reference ${keyRef.keyReferenceId} references unknown service identity ${keyRef.serviceIdentityId}.`,
        keyRef.keyReferenceId,
      );
    }
    if (!SECRET_PREFIXES.some((prefix) => keyRef.secretRef.startsWith(prefix))) {
      pushIssue(
        issues,
        "KEY_SECRET_REF_INVALID_PREFIX",
        "Secret references must use secret://, vault://, kms://, or env://managed/ locators.",
        keyRef.keyReferenceId,
      );
    }
    if (!SECRET_PREFIXES.some((prefix) => keyRef.vaultPathRef.startsWith(prefix))) {
      pushIssue(
        issues,
        "KEY_VAULT_REF_INVALID_PREFIX",
        "Vault path references must use managed locator prefixes.",
        keyRef.keyReferenceId,
      );
    }
    if (!/^[A-Z][A-Z0-9_]+_REF$/u.test(keyRef.managedVariableName)) {
      pushIssue(
        issues,
        "KEY_MANAGED_VARIABLE_INVALID",
        "Managed variable names must be uppercase reference handles ending in _REF.",
        keyRef.keyReferenceId,
      );
    }
    if (
      keyRef.maskedFingerprint !==
      stableFingerprintForSecretRef({
        keyReferenceId: keyRef.keyReferenceId,
        environmentId: keyRef.environmentId,
        secretRef: keyRef.secretRef,
      })
    ) {
      pushIssue(
        issues,
        "KEY_MASKED_FINGERPRINT_DRIFT",
        "Masked fingerprint does not match the secret reference handle.",
        keyRef.keyReferenceId,
      );
    }
    if (keyRef.scopeRefs.length === 0) {
      pushIssue(
        issues,
        "KEY_SCOPE_MISSING",
        "Every key reference must be scoped.",
        keyRef.keyReferenceId,
      );
    }
    if (keyRef.scopeRefs.some((scope) => scope === "*" || /all/i.test(scope))) {
      pushIssue(
        issues,
        "KEY_SCOPE_TOO_BROAD",
        "Wildcard or all-resource key scopes are forbidden.",
        keyRef.keyReferenceId,
      );
    }
    if (
      keyRef.providerId !== setup.registry.primaryProviderId &&
      keyRef.keyStatus === "ready_reference"
    ) {
      pushIssue(
        issues,
        "EXTERNAL_KEY_READY_WITHOUT_SELECTION",
        "External provider key references cannot be ready without provider selection.",
        keyRef.keyReferenceId,
      );
    }
  }

  detectRawSecretFields(setup, issues);

  return { valid: issues.length === 0, issues };
}

function detectRawSecretFields(value: unknown, issues: ValidationIssue[], ref = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => detectRawSecretFields(entry, issues, `${ref}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && RAW_SECRET_PATTERNS.some((pattern) => pattern.test(value))) {
      pushIssue(
        issues,
        "RAW_SECRET_PATTERN_DETECTED",
        "Detected a raw secret-shaped value in manifest data.",
        ref,
      );
    }
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (
      RAW_SECRET_FIELD_NAMES.some(
        (fieldName) => fieldName.toLowerCase() === key.toLowerCase(),
      )
    ) {
      pushIssue(
        issues,
        "RAW_SECRET_FIELD_DETECTED",
        `Raw secret field ${key} is not allowed in model vendor manifests.`,
        `${ref}.${key}`,
      );
    }
    detectRawSecretFields(entry, issues, `${ref}.${key}`);
  }
}

export function buildReadinessEvidence(
  setup: ModelVendorSetupDocuments,
  mode: OperationMode,
): ReadinessEvidence {
  const validation = validateModelVendorSetupDocuments(setup);
  const blockedReasons = validation.issues.map((issue) => issue.code);

  if (mode === "apply") {
    blockedReasons.push("APPLY_MODE_BLOCKED_WATCH_ONLY");
  }

  const decision: ReadinessEvidence["decision"] =
    validation.issues.length > 0
      ? "blocked_by_validation"
      : mode === "apply"
        ? "blocked_for_apply"
        : "ready_for_dry_run_rehearsal_verify";

  return {
    taskId: FULL_TASK_ID,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    mode,
    primaryProviderId: setup.registry.primaryProviderId,
    decision,
    validationIssueCount: validation.issues.length,
    projectRows: setup.projectManifest.projects.map((project) => ({
      projectId: project.projectId,
      providerId: project.providerId,
      environmentId: project.environmentId,
      projectIdentityStatus: project.projectIdentityStatus,
      applyAllowed: project.operationModes.apply,
      serviceIdentityCount: project.serviceIdentities.length,
    })),
    keyReferenceRows: setup.keyReferenceManifest.keyReferences.map((keyRef) => ({
      keyReferenceId: keyRef.keyReferenceId,
      providerId: keyRef.providerId,
      environmentId: keyRef.environmentId,
      keyStatus: keyRef.keyStatus,
      maskedFingerprint: keyRef.maskedFingerprint,
      scopeCount: keyRef.scopeRefs.length,
    })),
    blockedReasons,
  };
}

export function collectTrackedSecretRefs(
  setup: ModelVendorSetupDocuments = {
    registry: buildModelVendorRegistry(),
    projectManifest: buildModelVendorProjectManifest(),
    keyReferenceManifest: buildModelVendorKeyReferenceManifest(),
  },
): readonly string[] {
  return setup.keyReferenceManifest.keyReferences.flatMap((keyRef) => [
    keyRef.secretRef,
    keyRef.vaultPathRef,
  ]);
}

export function redactSensitiveText(
  value: string,
  secretRefs: readonly string[] = collectTrackedSecretRefs(),
): string {
  let redacted = value;
  for (const secretRef of secretRefs) {
    redacted = redacted.replaceAll(secretRef, "[secret-ref:redacted]");
  }
  redacted = redacted.replace(SECRET_LOCATOR_PATTERN, "[secret-ref:redacted]");
  for (const pattern of RAW_SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, "[secret-value:redacted]");
  }
  return redacted;
}

export function containsSensitiveLeak(
  value: string,
  secretRefs: readonly string[] = collectTrackedSecretRefs(),
): boolean {
  if (secretRefs.some((secretRef) => value.includes(secretRef))) {
    return true;
  }
  if (SECRET_LOCATOR_PATTERN.test(value)) {
    SECRET_LOCATOR_PATTERN.lastIndex = 0;
    return true;
  }
  SECRET_LOCATOR_PATTERN.lastIndex = 0;
  return RAW_SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

export function resolvePrimaryConfiguredVendor(
  registry: ModelVendorRegistryDocument,
): ModelVendorProviderProfile {
  const providers = registry.providers.filter(
    (entry) => entry.selectionState === "primary_configured",
  );
  if (providers.length !== 1) {
    throw new Error(`PRIMARY_PROVIDER_AMBIGUOUS:${providers.length}`);
  }
  const primary = providers[0]!;
  if (primary.providerId !== registry.primaryProviderId) {
    throw new Error("PRIMARY_PROVIDER_MISMATCH");
  }
  return primary;
}

export function resolveEnvironmentProfile(
  registry: ModelVendorRegistryDocument,
  environmentId: EnvironmentId,
): ModelVendorEnvironmentProfile {
  const matches = registry.environmentProfiles.filter(
    (entry) => entry.environmentId === environmentId,
  );
  if (matches.length !== 1) {
    throw new Error(`ENVIRONMENT_PROFILE_AMBIGUOUS:${environmentId}`);
  }
  return matches[0]!;
}

export function parseJsonCompatibleYaml<T>(source: string): T {
  const trimmed = source.trim();
  if (!trimmed.startsWith("{")) {
    throw new Error("Registry YAML must use JSON-compatible YAML for deterministic parsing.");
  }
  return JSON.parse(trimmed) as T;
}

export function readJsonOrJsonYaml<T>(filePath: string): T {
  const source = fs.readFileSync(filePath, "utf8");
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    return parseJsonCompatibleYaml<T>(source);
  }
  return JSON.parse(source) as T;
}

export function readAndValidateModelVendorSetup(
  rootDir = ROOT,
): ModelVendorSetupDocuments & { readonly validation: ValidationResult } {
  const setup = {
    registry: readJsonOrJsonYaml<ModelVendorRegistryDocument>(
      path.join(rootDir, SOURCE_OUTPUT_PATHS.registry),
    ),
    projectManifest: readJsonOrJsonYaml<ModelVendorProjectManifestDocument>(
      path.join(rootDir, SOURCE_OUTPUT_PATHS.projectManifest),
    ),
    keyReferenceManifest: readJsonOrJsonYaml<ModelVendorKeyReferenceManifestDocument>(
      path.join(rootDir, SOURCE_OUTPUT_PATHS.keyReferenceManifest),
    ),
  };
  return {
    ...setup,
    validation: validateModelVendorSetupDocuments(setup),
  };
}

export function materializeModelVendorSetupArtifacts(rootDir: string): void {
  writeJson(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.registry),
    buildModelVendorRegistry(),
  );
  writeJson(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.projectManifest),
    buildModelVendorProjectManifest(),
  );
  writeJson(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.keyReferenceManifest),
    buildModelVendorKeyReferenceManifest(),
  );
  writeJson(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.contract),
    buildModelVendorProjectAndKeyContract(),
  );
  writeText(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.readinessMatrix),
    renderProjectKeyReadinessMatrixCsv(),
  );
}

export function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeText(filePath: string, value: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function listFiles(dirPath: string, maxDepth = 3): string[] {
  if (maxDepth < 0 || !fs.existsSync(dirPath)) {
    return [];
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(entryPath, maxDepth - 1));
    } else if (/\.(?:ts|tsx|js|mjs|json|yaml|yml|env)$/iu.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

export function detectPrimaryConfiguredVendorFromRepository(
  rootDir = ROOT,
): VendorDetectionResult {
  const evidenceRefs = [
    "data/analysis/integration_assumption_ledger.csv#dep_assistive_model_vendor_family",
    "data/analysis/dependency_watchlist.csv#dep_assistive_model_vendor_family",
    "data/analysis/adapter_effect_family_matrix.csv#fxf_assistive_vendor_watch",
    "data/analysis/credential_capture_checklist.csv#CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY",
  ];
  const watchFiles = evidenceRefs.map((ref) => ref.split("#")[0]!);
  const watchText = watchFiles
    .map((relativePath) => {
      const fullPath = path.join(rootDir, relativePath);
      return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
    })
    .join("\n");

  const providerSignals: string[] = [];
  const configFiles = [
    path.join(rootDir, "package.json"),
    ...listFiles(path.join(rootDir, "services"), 3),
    ...listFiles(path.join(rootDir, "apps"), 2),
    ...listFiles(path.join(rootDir, "infra"), 3),
  ];
  const signalPatterns: readonly [ProviderId, RegExp][] = [
    ["openai", /\bOPENAI_API_KEY\b|\bOpenAI-Project\b|\bOPENAI_ADMIN_KEY\b/u],
    ["azure_openai", /\bAZURE_OPENAI_API_KEY\b|\bAZURE_OPENAI_ENDPOINT\b/u],
    ["anthropic", /\bANTHROPIC_API_KEY\b/u],
    ["google_vertex_ai", /\bGOOGLE_APPLICATION_CREDENTIALS\b|\bVERTEX_AI\b/u],
    ["aws_bedrock", /\bAWS_BEDROCK\b|\bBEDROCK_RUNTIME\b/u],
  ];
  for (const filePath of configFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const source = fs.readFileSync(filePath, "utf8");
    for (const [providerId, pattern] of signalPatterns) {
      if (pattern.test(source)) {
        providerSignals.push(`${providerId}:${path.relative(rootDir, filePath)}`);
      }
    }
  }

  if (
    watchText.includes("dep_assistive_model_vendor_family") &&
    watchText.includes("watch_only") &&
    watchText.includes("replaceable_by_simulator") &&
    watchText.includes("CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY") &&
    providerSignals.length === 0
  ) {
    return {
      primaryProviderId: "vecells_assistive_vendor_watch_shadow_twin",
      detectionState: "watch_only_local_twin",
      evidenceRefs,
      providerSignals,
      notes: [
        "Repository dependency rows mark the assistive model vendor as optional/watch-only.",
        "No direct live provider runtime config signal was found in app/service/infra config.",
      ],
    };
  }

  return {
    primaryProviderId:
      providerSignals.length === 1
        ? (providerSignals[0]!.split(":")[0] as ProviderId)
        : "vecells_assistive_vendor_watch_shadow_twin",
    detectionState:
      providerSignals.length === 1 ? "external_signal_found" : "ambiguous",
    evidenceRefs,
    providerSignals,
    notes: [
      "Provider detection did not resolve the clean watch-only local twin path.",
      "A human must reconcile provider signals before browser automation can mutate resources.",
    ],
  };
}

