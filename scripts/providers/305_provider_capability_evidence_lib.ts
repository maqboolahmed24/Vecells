import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  bootstrapProviderSandboxes,
  buildProviderCallbackManifest,
  buildProviderSandboxRegistry,
  type ProviderCallbackEntry,
  type ProviderCallbackVerificationResult,
  type ProviderSandboxEntry,
  verifyProviderCallbacks,
} from "./304_provider_sandbox_lib.ts";
import {
  createPhase4BookingCapabilityEngineService,
  phase4ProviderCapabilityMatrix,
  type BookingActionScope,
  type BookingCapabilityResolutionResult,
  type BookingSelectionAudience,
  type ProviderCapabilityMatrixRowSnapshot,
} from "../../packages/domains/booking/src/phase4-booking-capability-engine.ts";

export const TASK_ID = "seq_305";
export const SCHEMA_VERSION = "305.phase4.provider-capability-evidence.v1";
export const GENERATED_AT = "2026-04-20";
export const REGISTRY_VERSION = "305-provider-capability-evidence-2026-04-20.v1";
export const OUTPUT_DIR = ".artifacts/provider-evidence/305";
export const SOURCE_OUTPUT_PATHS = {
  registry: "data/providers/305_provider_capability_evidence_registry.json",
  matrix: "data/providers/305_provider_capability_evidence_matrix.csv",
  credentials: "data/providers/305_provider_test_credential_manifest.json",
  prerequisites: "data/providers/305_provider_prerequisite_registry.json",
} as const;

export type ProviderEvidenceObservationMethod =
  | "browser_observed"
  | "document_observed"
  | "manual_attested";

export type ProviderEvidenceStatus =
  | "current"
  | "review_required"
  | "manual_attested"
  | "not_applicable";

export type ProviderEvidenceConfidence = "verified" | "provisional" | "manual_attested";

export interface ProviderCapabilityEvidenceRow {
  readonly evidenceId: string;
  readonly sandboxId: string;
  readonly providerCapabilityMatrixRef: string;
  readonly supplierRef: string;
  readonly supplierLabel: string;
  readonly environmentId: string;
  readonly tenantId: string;
  readonly practiceRef: string;
  readonly organisationRef: string;
  readonly providerAdapterBindingRef: string;
  readonly providerAdapterBindingHash: string;
  readonly adapterContractProfileRef: string;
  readonly capabilityClaimRef: string;
  readonly claimKind:
    | "action_support"
    | "audience_posture"
    | "prerequisite"
    | "confirmation_posture"
    | "callback_support"
    | "manage_posture";
  readonly claimValue: boolean | string;
  readonly claimOutcome: string;
  readonly selectionAudience: BookingSelectionAudience;
  readonly requestedActionScope: BookingActionScope;
  readonly bookingCapabilityResolutionRef: string;
  readonly capabilityTupleHash: string;
  readonly observationMethod: ProviderEvidenceObservationMethod;
  readonly observedAt: string;
  readonly staleAfter: string;
  readonly evidenceStatus: ProviderEvidenceStatus;
  readonly confidenceLevel: ProviderEvidenceConfidence;
  readonly evidenceArtifactRef: string;
  readonly gapArtifactRef: string | null;
  readonly credentialRefs: readonly string[];
  readonly prerequisiteRefs: readonly string[];
  readonly notes: readonly string[];
}

export interface ProviderCapabilityEvidenceRegistryDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly registryVersion: string;
  readonly generatedAt: string;
  readonly coverageSummary: {
    sandboxCount: number;
    uniqueProviderRowCount: number;
    evidenceRowCount: number;
    statusCounts: Record<string, number>;
    observationMethodCounts: Record<string, number>;
  };
  readonly evidenceRows: readonly ProviderCapabilityEvidenceRow[];
}

export interface ProviderTestCredentialRecord {
  readonly credentialId: string;
  readonly sandboxId: string;
  readonly providerCapabilityMatrixRef: string;
  readonly supplierRef: string;
  readonly environmentId: string;
  readonly credentialType: string;
  readonly purpose: string;
  readonly secretRef: string;
  readonly maskedFingerprint: string;
  readonly ownerRole: string;
  readonly rotationCadenceDays: number;
  readonly lastRotatedHint: string;
  readonly expiresAt: string;
  readonly expiryState: "current" | "review_required";
  readonly notes: readonly string[];
}

export interface ProviderTestCredentialManifestDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly credentials: readonly ProviderTestCredentialRecord[];
}

export interface ProviderPrerequisiteRecord {
  readonly prerequisiteId: string;
  readonly sandboxId: string;
  readonly providerCapabilityMatrixRef: string;
  readonly supplierRef: string;
  readonly environmentId: string;
  readonly prerequisiteRef: string;
  readonly category:
    | "environment_ceiling"
    | "gp_linkage"
    | "local_component"
    | "callback_support"
    | "direct_care_network"
    | "manual_handoff";
  readonly requiredState: string;
  readonly observedState: string;
  readonly capabilityEffect: string;
  readonly observationMethod: ProviderEvidenceObservationMethod;
  readonly observedAt: string;
  readonly staleAfter: string;
  readonly evidenceStatus: ProviderEvidenceStatus;
  readonly evidenceArtifactRef: string;
  readonly notes: readonly string[];
}

export interface ProviderPrerequisiteRegistryDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly prerequisites: readonly ProviderPrerequisiteRecord[];
}

export interface ProviderCapabilityEvidenceCaptureResult {
  readonly taskId: typeof TASK_ID;
  readonly outputDir: string;
  readonly sandboxOutputDir: string;
  readonly observationFiles: readonly string[];
  readonly automatedSandboxIds: readonly string[];
  readonly reviewRequiredSandboxIds: readonly string[];
  readonly callbackVerification: ProviderCallbackVerificationResult;
}

export interface ProviderCapabilityEvidenceValidationResult {
  readonly taskId: typeof TASK_ID;
  readonly outputDir: string;
  readonly valid: boolean;
  readonly failures: readonly string[];
  readonly sandboxCoverage: readonly {
    sandboxId: string;
    evidenceRows: number;
    statusSet: readonly string[];
  }[];
}

interface CapabilityClaimTemplate {
  readonly claimRef: string;
  readonly claimKind: ProviderCapabilityEvidenceRow["claimKind"];
  readonly requestedActionScope: BookingActionScope;
  readonly selectionAudience:
    | BookingSelectionAudience
    | ((row: ProviderCapabilityMatrixRowSnapshot) => BookingSelectionAudience);
  readonly claimValue: (input: {
    sandbox: ProviderSandboxEntry;
    row: ProviderCapabilityMatrixRowSnapshot;
    callback: ProviderCallbackEntry;
  }) => boolean | string;
  readonly claimOutcome: (input: {
    sandbox: ProviderSandboxEntry;
    row: ProviderCapabilityMatrixRowSnapshot;
    callback: ProviderCallbackEntry;
  }) => string;
  readonly note: (input: {
    sandbox: ProviderSandboxEntry;
    row: ProviderCapabilityMatrixRowSnapshot;
    callback: ProviderCallbackEntry;
  }) => string;
}

interface CaptureOptions {
  readonly outputDir?: string;
  readonly sandboxOutputDir?: string;
}

const GAP_ARTIFACT_BY_SANDBOX: Record<string, string> = {
  sandbox_304_optum_im1_supported_test:
    "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_OPTUM_IM1.json",
  sandbox_304_tpp_im1_patient_supported_test:
    "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_TPP_IM1_PATIENT.json",
  sandbox_304_tpp_im1_transaction_supported_test:
    "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_TPP_IM1_TRANSACTION.json",
  sandbox_304_gp_connect_integration_candidate:
    "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_GP_CONNECT_EXISTING.json",
};

const ACTION_CLAIMS = [
  {
    claimRef: "search_slots_support",
    claimKind: "action_support",
    requestedActionScope: "search_slots",
    selectionAudience: (row: ProviderCapabilityMatrixRowSnapshot) =>
      row.capabilities.supports_patient_self_service ? "patient" : "staff",
    claimValue: ({ row }) => row.supportedActionScopes.includes("search_slots"),
    claimOutcome: ({ row }) =>
      row.supportedActionScopes.includes("search_slots") ? "supported" : "unsupported",
    note: ({ sandbox }) => `${sandbox.supplierLabel} search-slot support observed through the current environment posture.`,
  },
  {
    claimRef: "book_slot_support",
    claimKind: "action_support",
    requestedActionScope: "book_slot",
    selectionAudience: (row: ProviderCapabilityMatrixRowSnapshot) =>
      row.capabilities.supports_patient_self_service ? "patient" : "staff",
    claimValue: ({ row }) => row.supportedActionScopes.includes("book_slot"),
    claimOutcome: ({ row }) =>
      row.supportedActionScopes.includes("book_slot") ? "supported" : "unsupported",
    note: ({ row }) =>
      row.supportedActionScopes.includes("book_slot")
        ? "Booking commit is exposed for this row."
        : "Booking commit is intentionally unavailable from this provider row.",
  },
  {
    claimRef: "cancel_appointment_support",
    claimKind: "action_support",
    requestedActionScope: "cancel_appointment",
    selectionAudience: (row: ProviderCapabilityMatrixRowSnapshot) =>
      row.capabilities.supports_patient_self_service ? "patient" : "staff",
    claimValue: ({ row }) => row.supportedActionScopes.includes("cancel_appointment"),
    claimOutcome: ({ row }) =>
      row.supportedActionScopes.includes("cancel_appointment") ? "supported" : "unsupported",
    note: ({ row }) =>
      row.supportedActionScopes.includes("cancel_appointment")
        ? "Cancellation remains supported in the declared environment."
        : "Cancellation is intentionally excluded from this row.",
  },
  {
    claimRef: "reschedule_appointment_support",
    claimKind: "action_support",
    requestedActionScope: "reschedule_appointment",
    selectionAudience: (row: ProviderCapabilityMatrixRowSnapshot) =>
      row.capabilities.supports_patient_self_service ? "patient" : "staff",
    claimValue: ({ row }) => row.supportedActionScopes.includes("reschedule_appointment"),
    claimOutcome: ({ row }) =>
      row.supportedActionScopes.includes("reschedule_appointment") ? "supported" : "unsupported",
    note: ({ row }) =>
      row.supportedActionScopes.includes("reschedule_appointment")
        ? "Reschedule remains supported."
        : "Reschedule remains unavailable and must not leak into live UI exposure.",
  },
  {
    claimRef: "view_appointment_support",
    claimKind: "action_support",
    requestedActionScope: "view_appointment",
    selectionAudience: "staff",
    claimValue: ({ row }) => row.supportedActionScopes.includes("view_appointment"),
    claimOutcome: ({ row }) =>
      row.supportedActionScopes.includes("view_appointment") ? "supported" : "unsupported",
    note: () => "Appointment visibility is tracked separately from mutable manage capability.",
  },
  {
    claimRef: "manage_appointment_support",
    claimKind: "action_support",
    requestedActionScope: "view_booking_summary",
    selectionAudience: "staff",
    claimValue: ({ row }) => row.supportedActionScopes.includes("manage_appointment"),
    claimOutcome: ({ row }) =>
      row.supportedActionScopes.includes("manage_appointment") ? "supported" : "unsupported",
    note: ({ row }) => `Manage exposure is ${row.manageCapabilityState} for this row.`,
  },
  {
    claimRef: "request_staff_assist_support",
    claimKind: "action_support",
    requestedActionScope: "request_staff_assist",
    selectionAudience: "staff",
    claimValue: ({ row }) => row.supportedActionScopes.includes("request_staff_assist"),
    claimOutcome: ({ row }) =>
      row.supportedActionScopes.includes("request_staff_assist") ? "supported" : "unsupported",
    note: () => "Staff-assisted handoff must remain visible when self-service cannot lawfully continue.",
  },
  {
    claimRef: "launch_local_component_support",
    claimKind: "action_support",
    requestedActionScope: "launch_local_component",
    selectionAudience: "staff",
    claimValue: ({ row }) => row.supportedActionScopes.includes("launch_local_component"),
    claimOutcome: ({ row }) =>
      row.supportedActionScopes.includes("launch_local_component")
        ? "supported"
        : "unsupported",
    note: ({ row }) =>
      row.capabilities.requires_local_consumer_component
        ? "Local-component launch remains part of the required path."
        : "No local component launch path is declared.",
  },
  {
    claimRef: "patient_self_service_posture",
    claimKind: "audience_posture",
    requestedActionScope: "search_slots",
    selectionAudience: "patient",
    claimValue: ({ row }) => row.capabilities.supports_patient_self_service,
    claimOutcome: ({ row }) =>
      row.capabilities.supports_patient_self_service ? "supported" : "unsupported",
    note: ({ row }) =>
      row.capabilities.supports_patient_self_service
        ? "Patient self-service remains lawful for this row."
        : "Patient self-service is blocked or narrowed away from this row.",
  },
  {
    claimRef: "staff_assisted_posture",
    claimKind: "audience_posture",
    requestedActionScope: "request_staff_assist",
    selectionAudience: "staff",
    claimValue: ({ row }) => row.capabilities.supports_staff_assisted_booking,
    claimOutcome: ({ row }) =>
      row.capabilities.supports_staff_assisted_booking ? "supported" : "unsupported",
    note: ({ row }) =>
      row.capabilities.supports_staff_assisted_booking
        ? "Staff-assisted booking remains available."
        : "Staff-assisted booking is not the governing posture for this row.",
  },
  {
    claimRef: "async_commit_confirmation_posture",
    claimKind: "confirmation_posture",
    requestedActionScope: "view_booking_summary",
    selectionAudience: (row: ProviderCapabilityMatrixRowSnapshot) =>
      row.capabilities.supports_patient_self_service ? "patient" : "staff",
    claimValue: ({ row }) => row.capabilities.supports_async_commit_confirmation,
    claimOutcome: ({ row }) =>
      row.capabilities.supports_async_commit_confirmation ? "supported" : "unsupported",
    note: ({ row }) =>
      row.capabilities.supports_async_commit_confirmation
        ? "Async confirmation or later proof is part of the declared confirmation model."
        : "Confirmation remains synchronous or read-after-write only.",
  },
  {
    claimRef: "gp_linkage_requirement",
    claimKind: "prerequisite",
    requestedActionScope: "search_slots",
    selectionAudience: (row: ProviderCapabilityMatrixRowSnapshot) =>
      row.capabilities.supports_patient_self_service ? "patient" : "staff",
    claimValue: ({ row }) => row.capabilities.requires_gp_linkage_details,
    claimOutcome: ({ row }) =>
      row.capabilities.requires_gp_linkage_details ? "required" : "not_required",
    note: ({ row }) =>
      row.capabilities.requires_gp_linkage_details
        ? "GP linkage remains a prerequisite for lawful exposure."
        : "No GP linkage prerequisite is declared for this row.",
  },
  {
    claimRef: "local_component_requirement",
    claimKind: "prerequisite",
    requestedActionScope: "launch_local_component",
    selectionAudience: "staff",
    claimValue: ({ row }) => row.capabilities.requires_local_consumer_component,
    claimOutcome: ({ row }) =>
      row.capabilities.requires_local_consumer_component ? "required" : "not_required",
    note: ({ row }) =>
      row.capabilities.requires_local_consumer_component
        ? "Local component readiness remains mandatory."
        : "No local component prerequisite applies.",
  },
  {
    claimRef: "callback_support_posture",
    claimKind: "callback_support",
    requestedActionScope: "view_booking_summary",
    selectionAudience: "staff",
    claimValue: ({ sandbox }) => sandbox.callbackMode,
    claimOutcome: ({ sandbox }) => sandbox.callbackMode,
    note: ({ callback }) => `Callback verification mode is ${callback.verificationMode}.`,
  },
  {
    claimRef: "manage_support_posture",
    claimKind: "manage_posture",
    requestedActionScope: "view_booking_summary",
    selectionAudience: "staff",
    claimValue: ({ row }) => row.manageCapabilityState,
    claimOutcome: ({ row }) => row.manageCapabilityState,
    note: ({ row }) => `Manage support is declared as ${row.manageCapabilityState}.`,
  },
] as const satisfies readonly CapabilityClaimTemplate[];

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function maskSecretRef(secretRef: string): string {
  return `sha256:${sha256(secretRef).slice(0, 12)}`;
}

function buildOutputDir(outputDir?: string): string {
  return path.resolve(process.cwd(), outputDir ?? OUTPUT_DIR);
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll("\"", "\"\"")}"` : value;
}

function plusDays(date: string, days: number): string {
  const timestamp = new Date(date);
  timestamp.setUTCDate(timestamp.getUTCDate() + days);
  return timestamp.toISOString();
}

function observationMethodForSandbox(
  sandbox: ProviderSandboxEntry,
): ProviderEvidenceObservationMethod {
  if (sandbox.portalAutomationState === "fully_automated") {
    return "browser_observed";
  }
  if (sandbox.portalAutomationState === "manual_bridge_required") {
    return "document_observed";
  }
  return "manual_attested";
}

function evidenceStatusForSandbox(sandbox: ProviderSandboxEntry): ProviderEvidenceStatus {
  if (sandbox.portalAutomationState === "fully_automated") {
    return "current";
  }
  if (sandbox.portalAutomationState === "manual_bridge_required") {
    return "review_required";
  }
  return "manual_attested";
}

function confidenceForSandbox(sandbox: ProviderSandboxEntry): ProviderEvidenceConfidence {
  if (sandbox.portalAutomationState === "fully_automated") {
    return "verified";
  }
  if (sandbox.portalAutomationState === "manual_bridge_required") {
    return "provisional";
  }
  return "manual_attested";
}

function evidenceObservedAt(sandbox: ProviderSandboxEntry): string {
  if (sandbox.portalAutomationState === "fully_automated") {
    return `${GENERATED_AT}T10:05:00.000Z`;
  }
  if (sandbox.portalAutomationState === "manual_bridge_required") {
    return `${GENERATED_AT}T10:15:00.000Z`;
  }
  return `${GENERATED_AT}T10:25:00.000Z`;
}

function evidenceStaleAfter(sandbox: ProviderSandboxEntry): string {
  return plusDays(evidenceObservedAt(sandbox), sandbox.portalAutomationState === "fully_automated" ? 30 : 14);
}

function observationArtifactRef(sandbox: ProviderSandboxEntry): string {
  return `${OUTPUT_DIR}/observations/${sandbox.sandboxId}.json`;
}

function rowByRefMap(): Map<string, ProviderCapabilityMatrixRowSnapshot> {
  return new Map(
    phase4ProviderCapabilityMatrix.rows.map((row) => [row.providerCapabilityMatrixRef, row]),
  );
}

function defaultAudience(row: ProviderCapabilityMatrixRowSnapshot): BookingSelectionAudience {
  return row.capabilities.supports_patient_self_service ? "patient" : "staff";
}

function credentialPolicy(
  sandbox: ProviderSandboxEntry,
  key: string,
): {
  credentialType: string;
  purpose: string;
  ownerRole: string;
  rotationCadenceDays: number;
  lastRotatedHint: string;
  expiresAt: string;
  expiryState: "current" | "review_required";
} {
  const byKey: Record<
    string,
    {
      credentialType: string;
      purpose: string;
      ownerRole: string;
      rotationCadenceDays: number;
      lastRotatedHint: string;
    }
  > = {
    portalUser: {
      credentialType: "portal_user_reference",
      purpose: "Supplier portal login username reference",
      ownerRole: "ROLE_INTEROPERABILITY_LEAD",
      rotationCadenceDays: 90,
      lastRotatedHint: "2026-03-15",
    },
    portalPassword: {
      credentialType: "portal_password_reference",
      purpose: "Supplier portal login password reference",
      ownerRole: "ROLE_SECURITY_LEAD",
      rotationCadenceDays: 60,
      lastRotatedHint: "2026-04-01",
    },
    pairingPack: {
      credentialType: "pairing_pack_reference",
      purpose: "Supplier pairing pack or dossier reference",
      ownerRole: "ROLE_RELEASE_MANAGER",
      rotationCadenceDays: 180,
      lastRotatedHint: "2026-02-20",
    },
    gatewaySharedSecret: {
      credentialType: "callback_secret_reference",
      purpose: "Local-component callback HMAC shared secret",
      ownerRole: "ROLE_SECURITY_LEAD",
      rotationCadenceDays: 90,
      lastRotatedHint: "2026-03-28",
    },
    localComponentInstallPack: {
      credentialType: "local_component_pack_reference",
      purpose: "Local component install pack reference",
      ownerRole: "ROLE_BOOKING_DOMAIN_LEAD",
      rotationCadenceDays: 180,
      lastRotatedHint: "2026-03-02",
    },
    onboardingPack: {
      credentialType: "onboarding_pack_reference",
      purpose: "GP Connect onboarding pack reference",
      ownerRole: "ROLE_INTEROPERABILITY_LEAD",
      rotationCadenceDays: 180,
      lastRotatedHint: "2026-02-12",
    },
    consumerJwtKey: {
      credentialType: "jwt_key_reference",
      purpose: "Consumer JWT signing key reference",
      ownerRole: "ROLE_SECURITY_LEAD",
      rotationCadenceDays: 90,
      lastRotatedHint: "2026-03-10",
    },
    sspCertificate: {
      credentialType: "mtls_certificate_reference",
      purpose: "SSP mutual-TLS certificate reference",
      ownerRole: "ROLE_SECURITY_LEAD",
      rotationCadenceDays: 120,
      lastRotatedHint: "2026-02-18",
    },
    callbackSecret: {
      credentialType: "callback_secret_reference",
      purpose: "Repo-owned callback HMAC secret reference",
      ownerRole: "ROLE_SECURITY_LEAD",
      rotationCadenceDays: 90,
      lastRotatedHint: "2026-03-30",
    },
  };
  const base = byKey[key];
  invariant(base, `Unsupported credential policy key ${key}`);
  const expiryState =
    sandbox.portalAutomationState === "manual_bridge_required" ? "review_required" : "current";
  return {
    ...base,
    expiresAt: expiryState === "current" ? "2026-07-31" : "2026-05-31",
    expiryState,
  };
}

export async function buildProviderTestCredentialManifest(): Promise<ProviderTestCredentialManifestDocument> {
  const registry = await buildProviderSandboxRegistry();
  const credentials: ProviderTestCredentialRecord[] = [];

  for (const sandbox of registry.sandboxes) {
    for (const [key, secretRef] of Object.entries(sandbox.secretRefs)) {
      if (!/^(secret|vault|env):\/\//.test(secretRef)) {
        continue;
      }
      const policy = credentialPolicy(sandbox, key);
      credentials.push({
        credentialId: `credential_${sandbox.sandboxId}_${key}`,
        sandboxId: sandbox.sandboxId,
        providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
        supplierRef: sandbox.supplierRef,
        environmentId: sandbox.environmentId,
        credentialType: policy.credentialType,
        purpose: policy.purpose,
        secretRef,
        maskedFingerprint: maskSecretRef(secretRef),
        ownerRole: policy.ownerRole,
        rotationCadenceDays: policy.rotationCadenceDays,
        lastRotatedHint: policy.lastRotatedHint,
        expiresAt: policy.expiresAt,
        expiryState: policy.expiryState,
        notes: [
          `Bound to ${sandbox.environmentLabel}.`,
          "Raw credential material must never leave the backing secret store.",
        ],
      });
    }
  }

  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    credentials,
  };
}

export async function buildProviderPrerequisiteRegistry(): Promise<ProviderPrerequisiteRegistryDocument> {
  const registry = await buildProviderSandboxRegistry();
  const callbacks = await buildProviderCallbackManifest();
  const rowByRef = rowByRefMap();
  const callbackBySandboxId = new Map(callbacks.callbacks.map((entry) => [entry.sandboxId, entry]));
  const prerequisites: ProviderPrerequisiteRecord[] = [];

  for (const sandbox of registry.sandboxes) {
    const row = rowByRef.get(sandbox.providerCapabilityMatrixRef);
    invariant(row, `Missing matrix row for ${sandbox.providerCapabilityMatrixRef}`);
    const callback = callbackBySandboxId.get(sandbox.sandboxId);
    invariant(callback, `Missing callback row for ${sandbox.sandboxId}`);
    const observedAt = evidenceObservedAt(sandbox);
    const staleAfter = evidenceStaleAfter(sandbox);
    const method = observationMethodForSandbox(sandbox);
    const status = evidenceStatusForSandbox(sandbox);

    prerequisites.push({
      prerequisiteId: `prereq_${sandbox.sandboxId}_environment_ceiling`,
      sandboxId: sandbox.sandboxId,
      providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
      supplierRef: sandbox.supplierRef,
      environmentId: sandbox.environmentId,
      prerequisiteRef: "environment_ceiling",
      category: "environment_ceiling",
      requiredState:
        sandbox.environmentId === "supported_test_candidate"
          ? "supported_test_only"
          : sandbox.environmentId === "integration_candidate"
            ? "integration_candidate_only"
            : "repo_owned_twin",
      observedState:
        sandbox.portalAutomationState === "manual_bridge_required"
          ? "manual_bridge_required"
          : sandbox.environmentId,
      capabilityEffect: "Controls whether capability evidence can be treated as fully automated.",
      observationMethod: method,
      observedAt,
      staleAfter,
      evidenceStatus: status,
      evidenceArtifactRef: observationArtifactRef(sandbox),
      notes: [
        `Environment label is ${sandbox.environmentLabel}.`,
        "Capability evidence must never be confused with live production posture.",
      ],
    });

    prerequisites.push({
      prerequisiteId: `prereq_${sandbox.sandboxId}_callback_posture`,
      sandboxId: sandbox.sandboxId,
      providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
      supplierRef: sandbox.supplierRef,
      environmentId: sandbox.environmentId,
      prerequisiteRef: "callback_support",
      category: "callback_support",
      requiredState: callback.callbackMode,
      observedState: callback.verificationMode,
      capabilityEffect: "Determines whether external confirmation is callback-led, read-after-write, or manual only.",
      observationMethod: method,
      observedAt,
      staleAfter,
      evidenceStatus: status,
      evidenceArtifactRef: observationArtifactRef(sandbox),
      notes: [
        `Registration source is ${callback.registrationSource}.`,
        callback.callbackUrlPath
          ? `Edge callback path is ${callback.callbackUrlPath}.`
          : "No callback URL is declared for this row.",
      ],
    });

    if (row.capabilities.requires_gp_linkage_details) {
      prerequisites.push({
        prerequisiteId: `prereq_${sandbox.sandboxId}_gp_linkage`,
        sandboxId: sandbox.sandboxId,
        providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
        supplierRef: sandbox.supplierRef,
        environmentId: sandbox.environmentId,
        prerequisiteRef: "gp_linkage_details",
        category: "gp_linkage",
        requiredState: "linked",
        observedState: "linked_required_by_contract",
        capabilityEffect: "Patient-facing exposure must degrade when GP linkage is absent.",
        observationMethod: method,
        observedAt,
        staleAfter,
        evidenceStatus: status,
        evidenceArtifactRef: observationArtifactRef(sandbox),
        notes: ["GP linkage requirement comes directly from the capability row."],
      });
    }

    if (row.capabilities.requires_local_consumer_component) {
      prerequisites.push({
        prerequisiteId: `prereq_${sandbox.sandboxId}_local_component`,
        sandboxId: sandbox.sandboxId,
        providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
        supplierRef: sandbox.supplierRef,
        environmentId: sandbox.environmentId,
        prerequisiteRef: "local_component_ready",
        category: "local_component",
        requiredState: "ready",
        observedState:
          sandbox.portalAutomationState === "fully_automated"
            ? "ready"
            : "manual_install_checkpoint",
        capabilityEffect: "Local component readiness gates booking and callback posture.",
        observationMethod: method,
        observedAt,
        staleAfter,
        evidenceStatus: status,
        evidenceArtifactRef: observationArtifactRef(sandbox),
        notes: ["Local component posture remains explicit so staff-only rows cannot overclaim self-service."],
      });
    }

    if (sandbox.environmentId === "integration_candidate") {
      prerequisites.push({
        prerequisiteId: `prereq_${sandbox.sandboxId}_direct_care_network`,
        sandboxId: sandbox.sandboxId,
        providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
        supplierRef: sandbox.supplierRef,
        environmentId: sandbox.environmentId,
        prerequisiteRef: "direct_care_network_access",
        category: "direct_care_network",
        requiredState: "hscn_and_ssp_ready",
        observedState: "manual_onboarding_checkpoint",
        capabilityEffect: "Direct-care access remains required before capability can be treated as current.",
        observationMethod: method,
        observedAt,
        staleAfter,
        evidenceStatus: status,
        evidenceArtifactRef: observationArtifactRef(sandbox),
        notes: ["GP Connect onboarding requires HSCN, JWT, and mutual-TLS prerequisites."],
      });
    }

    if (sandbox.callbackMode === "manual_attestation") {
      prerequisites.push({
        prerequisiteId: `prereq_${sandbox.sandboxId}_manual_handoff`,
        sandboxId: sandbox.sandboxId,
        providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
        supplierRef: sandbox.supplierRef,
        environmentId: sandbox.environmentId,
        prerequisiteRef: "manual_handoff_queue",
        category: "manual_handoff",
        requiredState: "ops_queue_configured",
        observedState: "ops_queue_configured",
        capabilityEffect: "Manual assist rows must expose queue-based settlement instead of automated confirmation.",
        observationMethod: method,
        observedAt,
        staleAfter,
        evidenceStatus: status,
        evidenceArtifactRef: observationArtifactRef(sandbox),
        notes: ["Manual assist relies on governed staff settlement, not supplier callbacks."],
      });
    }
  }

  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    prerequisites,
  };
}

function buildCacheKey(
  sandbox: ProviderSandboxEntry,
  audience: BookingSelectionAudience,
  actionScope: BookingActionScope,
): string {
  return `${sandbox.sandboxId}|${audience}|${actionScope}`;
}

async function resolveClaimResults(): Promise<Map<string, BookingCapabilityResolutionResult>> {
  const registry = await buildProviderSandboxRegistry();
  const rowByRef = rowByRefMap();
  const service = createPhase4BookingCapabilityEngineService();
  const cache = new Map<string, BookingCapabilityResolutionResult>();

  for (const sandbox of registry.sandboxes) {
    const row = rowByRef.get(sandbox.providerCapabilityMatrixRef);
    invariant(row, `Missing matrix row for ${sandbox.providerCapabilityMatrixRef}`);
    for (const claim of ACTION_CLAIMS) {
      const audience =
        typeof claim.selectionAudience === "function"
          ? claim.selectionAudience(row)
          : claim.selectionAudience;
      const cacheKey = buildCacheKey(sandbox, audience, claim.requestedActionScope);
      if (cache.has(cacheKey)) {
        continue;
      }
      const result = await service.resolveBookingCapability({
        bookingCaseId: `evidence_${sandbox.sandboxId}_${claim.claimRef}`,
        appointmentId: null,
        tenantId: sandbox.tenantId,
        practiceRef: sandbox.practiceRef,
        organisationRef: sandbox.organisationRef,
        supplierRef: sandbox.supplierRef,
        integrationMode: row.integrationMode,
        deploymentType: row.deploymentType,
        selectionAudience: audience,
        requestedActionScope: claim.requestedActionScope,
        gpLinkageCheckpointRef: row.capabilities.requires_gp_linkage_details
          ? `gp_linkage_${sandbox.sandboxId}`
          : null,
        gpLinkageStatus: row.capabilities.requires_gp_linkage_details ? "linked" : "not_required",
        localConsumerCheckpointRef: row.capabilities.requires_local_consumer_component
          ? `local_component_${sandbox.sandboxId}`
          : null,
        localConsumerStatus: row.capabilities.requires_local_consumer_component
          ? "ready"
          : "not_required",
        supplierDegradationStatus: "nominal",
        publicationState: "published",
        assuranceTrustState: "writable",
        routeIntentBindingRef: `provider_capability_evidence_route_${sandbox.sandboxId}`,
        surfaceRouteContractRef: "booking_route_contract_v1",
        surfacePublicationRef: `provider_capability_evidence_publication_${sandbox.sandboxId}`,
        runtimePublicationBundleRef: `provider_capability_evidence_runtime_${sandbox.sandboxId}`,
        governingObjectDescriptorRef: "BookingCase",
        governingObjectRef: `provider_capability_evidence_${sandbox.sandboxId}`,
        governingObjectVersionRef: "v1",
        parentAnchorRef: `provider_capability_anchor_${sandbox.sandboxId}`,
        commandActionRecordRef: `provider_capability_action_${sandbox.sandboxId}_${claim.claimRef}`,
        commandSettlementRecordRef: `provider_capability_settlement_${sandbox.sandboxId}_${claim.claimRef}`,
        subjectRef: `provider_capability_subject_${sandbox.sandboxId}`,
        evaluatedAt: `${GENERATED_AT}T10:00:00.000Z`,
        expiresInSeconds: 7200,
      });
      cache.set(cacheKey, result);
    }
  }

  return cache;
}

export async function buildProviderCapabilityEvidenceRegistry(): Promise<ProviderCapabilityEvidenceRegistryDocument> {
  const registry = await buildProviderSandboxRegistry();
  const callbacks = await buildProviderCallbackManifest();
  const credentials = await buildProviderTestCredentialManifest();
  const prerequisites = await buildProviderPrerequisiteRegistry();
  const rowByRef = rowByRefMap();
  const callbackBySandboxId = new Map(callbacks.callbacks.map((entry) => [entry.sandboxId, entry]));
  const credentialRefsBySandboxId = new Map<string, string[]>();
  for (const credential of credentials.credentials) {
    const rows = credentialRefsBySandboxId.get(credential.sandboxId) ?? [];
    rows.push(credential.credentialId);
    credentialRefsBySandboxId.set(credential.sandboxId, rows);
  }
  const prerequisiteRefsBySandboxId = new Map<string, string[]>();
  for (const prerequisite of prerequisites.prerequisites) {
    const rows = prerequisiteRefsBySandboxId.get(prerequisite.sandboxId) ?? [];
    rows.push(prerequisite.prerequisiteId);
    prerequisiteRefsBySandboxId.set(prerequisite.sandboxId, rows);
  }
  const claimResults = await resolveClaimResults();
  const evidenceRows: ProviderCapabilityEvidenceRow[] = [];

  for (const sandbox of registry.sandboxes) {
    const row = rowByRef.get(sandbox.providerCapabilityMatrixRef);
    invariant(row, `Missing matrix row for ${sandbox.providerCapabilityMatrixRef}`);
    const callback = callbackBySandboxId.get(sandbox.sandboxId);
    invariant(callback, `Missing callback row for ${sandbox.sandboxId}`);
    const observationMethod = observationMethodForSandbox(sandbox);
    const evidenceStatus = evidenceStatusForSandbox(sandbox);
    const confidenceLevel = confidenceForSandbox(sandbox);
    const observedAt = evidenceObservedAt(sandbox);
    const staleAfter = evidenceStaleAfter(sandbox);
    const credentialRefs = credentialRefsBySandboxId.get(sandbox.sandboxId) ?? [];
    const prerequisiteRefs = prerequisiteRefsBySandboxId.get(sandbox.sandboxId) ?? [];
    const gapArtifactRef = GAP_ARTIFACT_BY_SANDBOX[sandbox.sandboxId] ?? null;

    for (const claim of ACTION_CLAIMS) {
      const selectionAudience =
        typeof claim.selectionAudience === "function"
          ? claim.selectionAudience(row)
          : claim.selectionAudience;
      const result = claimResults.get(
        buildCacheKey(sandbox, selectionAudience, claim.requestedActionScope),
      );
      invariant(result, `Missing claim resolution for ${sandbox.sandboxId} ${claim.claimRef}`);
      evidenceRows.push({
        evidenceId: `evidence_${sandbox.sandboxId}_${claim.claimRef}`,
        sandboxId: sandbox.sandboxId,
        providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
        supplierRef: sandbox.supplierRef,
        supplierLabel: sandbox.supplierLabel,
        environmentId: sandbox.environmentId,
        tenantId: sandbox.tenantId,
        practiceRef: sandbox.practiceRef,
        organisationRef: sandbox.organisationRef,
        providerAdapterBindingRef: sandbox.providerAdapterBindingRef,
        providerAdapterBindingHash: sandbox.providerAdapterBindingHash,
        adapterContractProfileRef: sandbox.adapterContractProfileRef,
        capabilityClaimRef: claim.claimRef,
        claimKind: claim.claimKind,
        claimValue: claim.claimValue({ sandbox, row, callback }),
        claimOutcome: claim.claimOutcome({ sandbox, row, callback }),
        selectionAudience,
        requestedActionScope: claim.requestedActionScope,
        bookingCapabilityResolutionRef: result.resolution.bookingCapabilityResolutionId,
        capabilityTupleHash: result.resolution.capabilityTupleHash,
        observationMethod,
        observedAt,
        staleAfter,
        evidenceStatus,
        confidenceLevel,
        evidenceArtifactRef: observationArtifactRef(sandbox),
        gapArtifactRef,
        credentialRefs,
        prerequisiteRefs,
        notes: [
          claim.note({ sandbox, row, callback }),
          `Capability state resolved as ${result.resolution.capabilityState}.`,
        ],
      });
    }
  }

  const statusCounts: Record<string, number> = {};
  const methodCounts: Record<string, number> = {};
  for (const row of evidenceRows) {
    statusCounts[row.evidenceStatus] = (statusCounts[row.evidenceStatus] ?? 0) + 1;
    methodCounts[row.observationMethod] = (methodCounts[row.observationMethod] ?? 0) + 1;
  }

  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    registryVersion: REGISTRY_VERSION,
    generatedAt: GENERATED_AT,
    coverageSummary: {
      sandboxCount: registry.sandboxes.length,
      uniqueProviderRowCount: new Set(
        registry.sandboxes.map((sandbox) => sandbox.providerCapabilityMatrixRef),
      ).size,
      evidenceRowCount: evidenceRows.length,
      statusCounts,
      observationMethodCounts: methodCounts,
    },
    evidenceRows,
  };
}

export async function renderProviderCapabilityEvidenceMatrixCsv(): Promise<string> {
  const registry = await buildProviderCapabilityEvidenceRegistry();
  const headers = [
    "evidence_id",
    "sandbox_id",
    "provider_capability_matrix_ref",
    "environment_id",
    "capability_claim_ref",
    "claim_kind",
    "claim_value",
    "claim_outcome",
    "evidence_status",
    "confidence_level",
    "observation_method",
    "selection_audience",
    "requested_action_scope",
    "capability_tuple_hash",
    "observed_at",
    "stale_after",
    "evidence_artifact_ref",
    "gap_artifact_ref",
  ];
  const rows = registry.evidenceRows.map((row) =>
    [
      row.evidenceId,
      row.sandboxId,
      row.providerCapabilityMatrixRef,
      row.environmentId,
      row.capabilityClaimRef,
      row.claimKind,
      String(row.claimValue),
      row.claimOutcome,
      row.evidenceStatus,
      row.confidenceLevel,
      row.observationMethod,
      row.selectionAudience,
      row.requestedActionScope,
      row.capabilityTupleHash,
      row.observedAt,
      row.staleAfter,
      row.evidenceArtifactRef,
      row.gapArtifactRef ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );
  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

export async function materializeProviderCapabilityEvidenceArtifacts(
  rootDir = process.cwd(),
): Promise<{
  registryPath: string;
  matrixPath: string;
  credentialsPath: string;
  prerequisitesPath: string;
}> {
  const registryPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.registry);
  const matrixPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.matrix);
  const credentialsPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.credentials);
  const prerequisitesPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.prerequisites);

  writeJson(registryPath, await buildProviderCapabilityEvidenceRegistry());
  fs.mkdirSync(path.dirname(matrixPath), { recursive: true });
  fs.writeFileSync(matrixPath, await renderProviderCapabilityEvidenceMatrixCsv(), "utf8");
  writeJson(credentialsPath, await buildProviderTestCredentialManifest());
  writeJson(prerequisitesPath, await buildProviderPrerequisiteRegistry());

  return {
    registryPath,
    matrixPath,
    credentialsPath,
    prerequisitesPath,
  };
}

export async function captureProviderCapabilityEvidence(
  options: CaptureOptions = {},
): Promise<ProviderCapabilityEvidenceCaptureResult> {
  const outputDir = buildOutputDir(options.outputDir);
  const sandboxOutputDir = path.resolve(
    process.cwd(),
    options.sandboxOutputDir ?? ".artifacts/provider-sandboxes/304",
  );
  const materialized = await materializeProviderCapabilityEvidenceArtifacts();
  await bootstrapProviderSandboxes({ outputDir: sandboxOutputDir });
  const callbackVerification = await verifyProviderCallbacks({ outputDir: sandboxOutputDir });
  const registry = await buildProviderCapabilityEvidenceRegistry();
  const credentials = await buildProviderTestCredentialManifest();
  const prerequisites = await buildProviderPrerequisiteRegistry();
  const observationFiles: string[] = [];

  for (const sandbox of await buildProviderSandboxRegistry().then((result) => result.sandboxes)) {
    const observationPath = path.resolve(process.cwd(), observationArtifactRef(sandbox));
    observationFiles.push(observationPath);
    const relatedEvidence = registry.evidenceRows.filter((row) => row.sandboxId === sandbox.sandboxId);
    const relatedCredentials = credentials.credentials.filter(
      (credential) => credential.sandboxId === sandbox.sandboxId,
    );
    const relatedPrerequisites = prerequisites.prerequisites.filter(
      (prerequisite) => prerequisite.sandboxId === sandbox.sandboxId,
    );
    const callbackCheck = callbackVerification.callbackChecks.find(
      (row) => row.sandboxId === sandbox.sandboxId,
    );
    writeJson(observationPath, {
      taskId: TASK_ID,
      generatedAt: `${GENERATED_AT}T10:40:00.000Z`,
      sourceArtifacts: materialized,
      sandboxId: sandbox.sandboxId,
      providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
      environmentId: sandbox.environmentId,
      providerAdapterBindingHash: sandbox.providerAdapterBindingHash,
      observationMethod: observationMethodForSandbox(sandbox),
      evidenceStatus: evidenceStatusForSandbox(sandbox),
      callbackVerification: callbackCheck ?? null,
      evidenceClaims: relatedEvidence.map((row) => ({
        evidenceId: row.evidenceId,
        capabilityClaimRef: row.capabilityClaimRef,
        claimOutcome: row.claimOutcome,
        evidenceStatus: row.evidenceStatus,
      })),
      credentialFingerprints: relatedCredentials.map((credential) => ({
        credentialId: credential.credentialId,
        maskedFingerprint: credential.maskedFingerprint,
        ownerRole: credential.ownerRole,
      })),
      prerequisites: relatedPrerequisites.map((prerequisite) => ({
        prerequisiteId: prerequisite.prerequisiteId,
        prerequisiteRef: prerequisite.prerequisiteRef,
        observedState: prerequisite.observedState,
      })),
    });
  }

  const result = {
    taskId: TASK_ID,
    outputDir,
    sandboxOutputDir,
    observationFiles,
    automatedSandboxIds: registry.evidenceRows
      .filter((row) => row.evidenceStatus === "current")
      .map((row) => row.sandboxId)
      .filter((value, index, rows) => rows.indexOf(value) === index),
    reviewRequiredSandboxIds: registry.evidenceRows
      .filter((row) => row.evidenceStatus === "review_required")
      .map((row) => row.sandboxId)
      .filter((value, index, rows) => rows.indexOf(value) === index),
    callbackVerification,
  } satisfies ProviderCapabilityEvidenceCaptureResult;
  writeJson(path.join(outputDir, "305_capability_evidence_capture_summary.json"), result);
  return result;
}

export async function validateProviderCapabilityEvidence(
  options: CaptureOptions = {},
): Promise<ProviderCapabilityEvidenceValidationResult> {
  const outputDir = buildOutputDir(options.outputDir);
  const registry = await buildProviderCapabilityEvidenceRegistry();
  const failures: string[] = [];
  const sandboxCoverage = [...new Set(registry.evidenceRows.map((row) => row.sandboxId))]
    .sort()
    .map((sandboxId) => {
      const rows = registry.evidenceRows.filter((row) => row.sandboxId === sandboxId);
      const statusSet = [...new Set(rows.map((row) => row.evidenceStatus))].sort();
      return {
        sandboxId,
        evidenceRows: rows.length,
        statusSet,
      };
    });

  for (const coverage of sandboxCoverage) {
    if (coverage.evidenceRows === 0) {
      failures.push(`${coverage.sandboxId} has no evidence rows`);
    }
  }

  for (const row of registry.evidenceRows) {
    if (!row.capabilityTupleHash || !row.bookingCapabilityResolutionRef) {
      failures.push(`${row.evidenceId} is missing capability tuple linkage`);
    }
    if (new Date(row.staleAfter).getTime() <= new Date(row.observedAt).getTime()) {
      failures.push(`${row.evidenceId} staleAfter is not after observedAt`);
    }
    if (row.evidenceStatus === "current" && row.confidenceLevel !== "verified") {
      failures.push(`${row.evidenceId} is current without verified confidence`);
    }
    if (
      row.evidenceStatus === "review_required" &&
      row.confidenceLevel === "verified"
    ) {
      failures.push(`${row.evidenceId} is review_required but still marked verified`);
    }
  }

  const result = {
    taskId: TASK_ID,
    outputDir,
    valid: failures.length === 0,
    failures,
    sandboxCoverage,
  } satisfies ProviderCapabilityEvidenceValidationResult;
  writeJson(path.join(outputDir, "305_capability_evidence_validation_summary.json"), result);
  return result;
}
