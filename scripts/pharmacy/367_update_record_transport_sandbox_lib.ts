import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

import transportAssuranceRegistryContract from "../../data/contracts/343_phase6_transport_assurance_registry.json";
import { buildDispatchProviderBindingManifest } from "./366_directory_dispatch_credentials_lib.ts";

export const TASK_ID = "seq_367";
export const FULL_TASK_ID =
  "seq_367_phase6_use_Playwright_or_other_appropriate_tooling_browser_automation_to_request_update_record_and_referral_transport_sandboxes";
export const SCHEMA_VERSION = "367.phase6.transport-sandbox-readiness.v1";
export const GENERATED_AT = "2026-04-24T12:30:00.000Z";
export const CONTROL_PLANE_VERSION =
  "367-phase6-update-record-and-transport-sandbox-2026-04-24.v1";
export const OUTPUT_DIR = ".artifacts/transport-sandbox/367";
export const SOURCE_OUTPUT_PATHS = {
  updateRecordManifest:
    "data/config/367_update_record_observation_manifest.example.json",
  transportManifest: "data/config/367_transport_sandbox_manifest.example.json",
  contract: "data/contracts/367_sandbox_readiness_contract.json",
  mailboxMatrix: "ops/onboarding/367_mailbox_endpoint_and_contact_matrix.csv",
  transportObservationMatrix:
    "data/analysis/367_transport_and_observation_matrix.csv",
  requestStatusTracker: "data/analysis/367_request_status_tracker_template.csv",
  interfaceGap:
    "data/contracts/PHASE6_BATCH_364_371_INTERFACE_GAP_TRANSPORT_AND_UPDATE_RECORD_SANDBOX.json",
} as const;

export type SandboxEnvironmentId =
  | "development_local_twin"
  | "integration_candidate"
  | "training_candidate"
  | "deployment_candidate";

export type SandboxRequestState =
  | "not_requested"
  | "drafted"
  | "submitted"
  | "awaiting_response"
  | "approved"
  | "blocked"
  | "expired";

export type SandboxAutomationMode =
  | "draft_only"
  | "manual_stop_before_submit"
  | "submit_rehearsal"
  | "status_check_only"
  | "not_required";

export type ObservationRequestPathKind =
  | "supplier_assured_pairing"
  | "digital_onboarding_pack"
  | "environment_review_only";

export type TransportRequestPathKind =
  | "api_platform_digital_onboarding"
  | "mesh_mailbox_apply"
  | "supplier_admin_portal"
  | "nhsmail_shared_mailbox_admin"
  | "internal_operator_process";

export type TransportPurpose = "referral_dispatch" | "urgent_return_safety_net";

export type PharmacyDispatchTransportMode =
  | "bars_fhir"
  | "supplier_interop"
  | "nhsmail_shared_mailbox"
  | "mesh"
  | "manual_assisted_dispatch";

export interface SandboxEnvironmentProfile {
  readonly environmentId: SandboxEnvironmentId;
  readonly environmentLabel: string;
  readonly loginStrategy:
    | "portal_form_per_context"
    | "portal_form_manual_bridge"
    | "portal_form_status_only";
  readonly storageStateRef: string;
  readonly notes: readonly string[];
}

export interface UpdateRecordObservationEntry {
  readonly requestId: string;
  readonly environmentId: SandboxEnvironmentId;
  readonly environmentLabel: string;
  readonly observationChannel: "gp_connect_update_record";
  readonly outcomeSourceClass: "gp_workflow_observation";
  readonly requestPathKind: ObservationRequestPathKind;
  readonly requestState: SandboxRequestState;
  readonly automationMode: SandboxAutomationMode;
  readonly supportedServiceSet: readonly (
    | "pharmacy_first"
    | "blood_pressure_check"
    | "pharmacy_contraception"
  )[];
  readonly gpSupplierSet: readonly string[];
  readonly pharmacySupplierSet: readonly string[];
  readonly outboundSendingAllowed: false;
  readonly urgentReturnChannelForbidden: true;
  readonly monitoredSafetyNetRequired: boolean;
  readonly requestPackRef: string;
  readonly requestPackHash: string;
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly secretRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly expiresAt: string | null;
  readonly notes: readonly string[];
}

export interface UpdateRecordObservationManifestDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly environmentProfiles: readonly SandboxEnvironmentProfile[];
  readonly observations: readonly UpdateRecordObservationEntry[];
}

export interface TransportSandboxEntry {
  readonly requestId: string;
  readonly environmentId: SandboxEnvironmentId;
  readonly environmentLabel: string;
  readonly transportMode: PharmacyDispatchTransportMode;
  readonly transportPurpose: TransportPurpose;
  readonly requestPathKind: TransportRequestPathKind;
  readonly requestState: SandboxRequestState;
  readonly automationMode: SandboxAutomationMode;
  readonly boundDispatchBindingId: string | null;
  readonly transportAssuranceProfileId: string | null;
  readonly endpointOrMailboxRef: string;
  readonly contactOwnerRole: string;
  readonly requestPackRef: string;
  readonly requestPackHash: string;
  readonly updateRecordForbidden: boolean;
  readonly secretRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly expiresAt: string | null;
  readonly notes: readonly string[];
}

export interface TransportSandboxManifestDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly environmentProfiles: readonly SandboxEnvironmentProfile[];
  readonly transports: readonly TransportSandboxEntry[];
}

export interface SandboxReadinessContract {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly updateRecordManifestRef: string;
  readonly transportManifestRef: string;
  readonly mailboxMatrixRef: string;
  readonly transportObservationMatrixRef: string;
  readonly requestStatusTrackerRef: string;
  readonly interfaceGapRef: string;
  readonly supportedEnvironmentIds: readonly SandboxEnvironmentId[];
  readonly supportedRequestStates: readonly SandboxRequestState[];
  readonly supportedTransportModes: readonly PharmacyDispatchTransportMode[];
  readonly updateRecordOutcomeSourceClass: "gp_workflow_observation";
  readonly updateRecordOutboundSendingAllowed: false;
  readonly urgentReturnUpdateRecordForbidden: true;
  readonly sourceRefs: readonly string[];
}

export interface TransportAndUpdateRecordSandboxGap {
  readonly taskId: typeof FULL_TASK_ID;
  readonly gapId: "PHASE6_BATCH_364_371_INTERFACE_GAP_TRANSPORT_AND_UPDATE_RECORD_SANDBOX";
  readonly missingSurface: string;
  readonly expectedOwnerTask: typeof FULL_TASK_ID;
  readonly temporaryFallback: string;
  readonly riskIfUnresolved: string;
  readonly followUpAction: string;
  readonly inheritedSeamRef: string;
  readonly affectedEnvironmentIds: readonly SandboxEnvironmentId[];
  readonly blockedCapabilities: readonly string[];
}

export interface SandboxRuntimeStateRow {
  readonly requestId: string;
  readonly requestState: SandboxRequestState;
  readonly updatedAt: string;
  readonly operatorBundleHash: string | null;
  readonly bundlePath: string | null;
}

export interface SandboxRuntimeState {
  readonly version: typeof CONTROL_PLANE_VERSION;
  readonly requests: readonly SandboxRuntimeStateRow[];
}

export interface RequestTransitionResult {
  readonly taskId: typeof TASK_ID;
  readonly requestId: string;
  readonly previousState: SandboxRequestState;
  readonly nextState: SandboxRequestState;
  readonly action:
    | "prepared_draft"
    | "submitted"
    | "already_current"
    | "manual_stop_required"
    | "blocked"
    | "no_action_required";
  readonly runtimeStatePath: string;
}

export interface SandboxCheck {
  readonly requestId: string;
  readonly environmentId: SandboxEnvironmentId;
  readonly kind: "update_record" | "transport";
  readonly requestState: SandboxRequestState;
  readonly decisionClasses: readonly string[];
}

export interface SandboxReadinessSummary {
  readonly taskId: typeof TASK_ID;
  readonly verificationAt: string;
  readonly updateRecordChecks: readonly SandboxCheck[];
  readonly transportChecks: readonly SandboxCheck[];
  readonly byEnvironment: readonly {
    environmentId: SandboxEnvironmentId;
    environmentLabel: string;
    draftedCount: number;
    submittedOrAwaitingCount: number;
    approvedCount: number;
    blockedOrExpiredCount: number;
  }[];
}

export interface OperatorSubmissionBundle {
  readonly taskId: typeof FULL_TASK_ID;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly requestIds: readonly string[];
  readonly requests: readonly {
    requestId: string;
    kind: "update_record" | "transport";
    environmentId: SandboxEnvironmentId;
    requestState: SandboxRequestState;
    requestPathKind: string;
    requestPackRef: string;
    requestPackHash: string;
    endpointOrMailboxRef: string | null;
    maskedSecretFingerprints: readonly string[];
    evidenceRefs: readonly string[];
    notes: readonly string[];
  }[];
}

interface UpdateRecordObservationTemplate {
  readonly requestId: string;
  readonly environmentId: SandboxEnvironmentId;
  readonly requestPathKind: ObservationRequestPathKind;
  readonly requestState: SandboxRequestState;
  readonly automationMode: SandboxAutomationMode;
  readonly supportedServiceSet: readonly (
    | "pharmacy_first"
    | "blood_pressure_check"
    | "pharmacy_contraception"
  )[];
  readonly gpSupplierSet: readonly string[];
  readonly pharmacySupplierSet: readonly string[];
  readonly monitoredSafetyNetRequired: boolean;
  readonly requestPackRef: string;
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly secretRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly expiresAt: string | null;
  readonly notes: readonly string[];
}

interface TransportSandboxTemplate {
  readonly requestId: string;
  readonly environmentId: SandboxEnvironmentId;
  readonly transportMode: PharmacyDispatchTransportMode;
  readonly transportPurpose: TransportPurpose;
  readonly requestPathKind: TransportRequestPathKind;
  readonly requestState: SandboxRequestState;
  readonly automationMode: SandboxAutomationMode;
  readonly boundDispatchBindingId: string | null;
  readonly endpointOrMailboxRef: string;
  readonly contactOwnerRole: string;
  readonly requestPackRef: string;
  readonly updateRecordForbidden: boolean;
  readonly secretRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly expiresAt: string | null;
  readonly notes: readonly string[];
}

const ENVIRONMENT_PROFILES: readonly SandboxEnvironmentProfile[] = [
  {
    environmentId: "development_local_twin",
    environmentLabel: "Development local twin",
    loginStrategy: "portal_form_per_context",
    storageStateRef: path.posix.join(OUTPUT_DIR, "playwright.auth/dev-local-twin.json"),
    notes: [
      "Local twin is used for rehearsal-only internal process proof.",
      "No live NHS onboarding credentials are stored in source control.",
    ],
  },
  {
    environmentId: "integration_candidate",
    environmentLabel: "Integration candidate",
    loginStrategy: "portal_form_manual_bridge",
    storageStateRef: path.posix.join(OUTPUT_DIR, "playwright.auth/integration-candidate.json"),
    notes: [
      "Integration candidate keeps sandbox request packs explicit without claiming approval.",
    ],
  },
  {
    environmentId: "training_candidate",
    environmentLabel: "Training candidate",
    loginStrategy: "portal_form_manual_bridge",
    storageStateRef: path.posix.join(OUTPUT_DIR, "playwright.auth/training-candidate.json"),
    notes: [
      "Training candidate is used for rehearsed sandbox and mailbox request flows.",
    ],
  },
  {
    environmentId: "deployment_candidate",
    environmentLabel: "Deployment candidate",
    loginStrategy: "portal_form_status_only",
    storageStateRef: path.posix.join(OUTPUT_DIR, "playwright.auth/deployment-candidate.json"),
    notes: [
      "Deployment candidate remains verify-only until named operator evidence exists.",
    ],
  },
] as const;

const UPDATE_RECORD_TEMPLATES: readonly UpdateRecordObservationTemplate[] = [
  {
    requestId: "update_record_367_integration_pairing",
    environmentId: "integration_candidate",
    requestPathKind: "digital_onboarding_pack",
    requestState: "drafted",
    automationMode: "manual_stop_before_submit",
    supportedServiceSet: [
      "pharmacy_first",
      "blood_pressure_check",
      "pharmacy_contraception",
    ],
    gpSupplierSet: ["EMIS", "TPP"],
    pharmacySupplierSet: [
      "Cegedim Healthcare Solutions",
      "EMIS Pinnacle",
      "Positive Solutions",
      "Sonar Informatics",
    ],
    monitoredSafetyNetRequired: true,
    requestPackRef: "request-pack://367/update-record/integration/pairing",
    portalSurfaceRef: "/ops/sandbox/update-record",
    portalUrlRef: "https://admin.nonprod.vecells.example/integration/update-record",
    secretRefs: [
      "secret://vecells/nonprod/int/update-record/client-id",
      "secret://vecells/nonprod/int/update-record/client-secret",
    ],
    evidenceRefs: [
      "evidence://367/update-record/integration/draft-pack",
      "evidence://352/outcome/gp-workflow-observation",
    ],
    expiresAt: "2026-07-24T00:00:00.000Z",
    notes: [
      "Draft-only until the named operator confirms the assured supplier pairing and organisational details.",
      "This request exists for observation readiness only; Vecells remains forbidden from direct Update Record sending.",
    ],
  },
  {
    requestId: "update_record_367_training_pairing",
    environmentId: "training_candidate",
    requestPathKind: "supplier_assured_pairing",
    requestState: "not_requested",
    automationMode: "draft_only",
    supportedServiceSet: [
      "pharmacy_first",
      "blood_pressure_check",
      "pharmacy_contraception",
    ],
    gpSupplierSet: ["EMIS", "TPP"],
    pharmacySupplierSet: [
      "Cegedim Healthcare Solutions",
      "EMIS Pinnacle",
      "Positive Solutions",
      "Sonar Informatics",
    ],
    monitoredSafetyNetRequired: true,
    requestPackRef: "request-pack://367/update-record/training/pairing",
    portalSurfaceRef: "/ops/sandbox/update-record",
    portalUrlRef: "https://admin.nonprod.vecells.example/training/update-record",
    secretRefs: [
      "secret://vecells/nonprod/train/update-record/client-id",
      "secret://vecells/nonprod/train/update-record/client-secret",
    ],
    evidenceRefs: [
      "evidence://367/update-record/training/request-template",
      "evidence://352/outcome/gp-workflow-observation",
    ],
    expiresAt: null,
    notes: [
      "Training pairing is kept as an explicit request pack and is never auto-submitted by unattended automation.",
    ],
  },
  {
    requestId: "update_record_367_deployment_observation",
    environmentId: "deployment_candidate",
    requestPathKind: "environment_review_only",
    requestState: "blocked",
    automationMode: "status_check_only",
    supportedServiceSet: [
      "pharmacy_first",
      "blood_pressure_check",
      "pharmacy_contraception",
    ],
    gpSupplierSet: ["EMIS", "TPP"],
    pharmacySupplierSet: [
      "Cegedim Healthcare Solutions",
      "EMIS Pinnacle",
      "Positive Solutions",
      "Sonar Informatics",
    ],
    monitoredSafetyNetRequired: true,
    requestPackRef: "request-pack://367/update-record/deployment/review",
    portalSurfaceRef: "/ops/sandbox/update-record",
    portalUrlRef: "https://admin.nonprod.vecells.example/deployment/update-record",
    secretRefs: [
      "secret://vecells/nonprod/deploy/update-record/client-id",
      "secret://vecells/nonprod/deploy/update-record/client-secret",
    ],
    evidenceRefs: [
      "evidence://367/update-record/deployment/blocker-ledger",
      "evidence://345/readiness/deferred",
    ],
    expiresAt: null,
    notes: [
      "Deployment Update Record readiness remains blocked until prior non-production evidence is replaced by named operator approval.",
    ],
  },
] as const;

const TRANSPORT_TEMPLATES: readonly TransportSandboxTemplate[] = [
  {
    requestId: "transport_367_bars_deployment_preflight",
    environmentId: "deployment_candidate",
    transportMode: "bars_fhir",
    transportPurpose: "referral_dispatch",
    requestPathKind: "api_platform_digital_onboarding",
    requestState: "not_requested",
    automationMode: "manual_stop_before_submit",
    boundDispatchBindingId: "binding_366_bars_deployment_riverside",
    endpointOrMailboxRef: "bars://sandbox.apis.ptl.api.platform.nhs.uk/booking-and-referral",
    contactOwnerRole: "release_manager",
    requestPackRef: "request-pack://367/transport/bars/deployment",
    updateRecordForbidden: true,
    secretRefs: [
      "secret://vecells/nonprod/deploy/bars/client-cert",
      "secret://vecells/nonprod/deploy/bars/private-key",
    ],
    evidenceRefs: [
      "evidence://367/transport/bars/deployment/preflight-pack",
      "evidence://350/transport/bars",
    ],
    expiresAt: "2026-07-24T00:00:00.000Z",
    notes: [
      "BARS sandbox preflight stays explicit and separate from Update Record observation readiness.",
    ],
  },
  {
    requestId: "transport_367_supplier_integration",
    environmentId: "integration_candidate",
    transportMode: "supplier_interop",
    transportPurpose: "referral_dispatch",
    requestPathKind: "supplier_admin_portal",
    requestState: "blocked",
    automationMode: "manual_stop_before_submit",
    boundDispatchBindingId: "binding_366_supplier_integration_hilltop",
    endpointOrMailboxRef: "supplier://integration/hilltop/referral-admin",
    contactOwnerRole: "supplier_onboarding_lead",
    requestPackRef: "request-pack://367/transport/supplier/integration",
    updateRecordForbidden: true,
    secretRefs: [
      "secret://vecells/nonprod/int/supplier-interop/api-key",
      "secret://vecells/nonprod/int/supplier-interop/tls-key",
    ],
    evidenceRefs: [
      "evidence://367/transport/supplier/integration/blocker-ledger",
      "evidence://350/transport/supplier",
    ],
    expiresAt: null,
    notes: [
      "Supplier-admin onboarding remains blocked until external supplier evidence exists.",
    ],
  },
  {
    requestId: "transport_367_mesh_training_mailbox",
    environmentId: "training_candidate",
    transportMode: "mesh",
    transportPurpose: "referral_dispatch",
    requestPathKind: "mesh_mailbox_apply",
    requestState: "drafted",
    automationMode: "submit_rehearsal",
    boundDispatchBindingId: "binding_366_mesh_training_hilltop",
    endpointOrMailboxRef: "mesh://training/hilltop/referral-mailbox",
    contactOwnerRole: "transport_onboarding_operator",
    requestPackRef: "request-pack://367/transport/mesh/training",
    updateRecordForbidden: true,
    secretRefs: [
      "secret://vecells/nonprod/train/mesh/mailbox-password",
      "secret://vecells/nonprod/train/mesh/shared-key",
    ],
    evidenceRefs: [
      "evidence://367/transport/mesh/training/request-pack",
      "evidence://350/transport/mesh",
    ],
    expiresAt: "2026-06-30T00:00:00.000Z",
    notes: [
      "Training mailbox applications can be rehearsed and locally submitted, but approval remains external.",
    ],
  },
  {
    requestId: "transport_367_nhsmail_deployment_safetynet",
    environmentId: "deployment_candidate",
    transportMode: "nhsmail_shared_mailbox",
    transportPurpose: "urgent_return_safety_net",
    requestPathKind: "nhsmail_shared_mailbox_admin",
    requestState: "awaiting_response",
    automationMode: "status_check_only",
    boundDispatchBindingId: null,
    endpointOrMailboxRef: "nhsmail://pharmacy-safety-net@nhs.net",
    contactOwnerRole: "practice_operations_lead",
    requestPackRef: "request-pack://367/transport/nhsmail/deployment",
    updateRecordForbidden: true,
    secretRefs: [],
    evidenceRefs: [
      "evidence://367/transport/nhsmail/deployment/request-ticket",
      "evidence://353/urgent-return/safety-net",
    ],
    expiresAt: "2026-08-01T00:00:00.000Z",
    notes: [
      "This mailbox is an urgent-return safety-net route only and must never be treated as Update Record or calm outcome truth.",
    ],
  },
  {
    requestId: "transport_367_manual_assisted_local",
    environmentId: "development_local_twin",
    transportMode: "manual_assisted_dispatch",
    transportPurpose: "referral_dispatch",
    requestPathKind: "internal_operator_process",
    requestState: "approved",
    automationMode: "not_required",
    boundDispatchBindingId: null,
    endpointOrMailboxRef: "internal://operator-manual-assisted-dispatch",
    contactOwnerRole: "pharmacy_console_supervisor",
    requestPackRef: "request-pack://367/transport/manual-assisted/local",
    updateRecordForbidden: true,
    secretRefs: [],
    evidenceRefs: [
      "evidence://367/transport/manual-assisted/local-process",
      "evidence://350/transport/manual-assisted",
    ],
    expiresAt: null,
    notes: [
      "Internal manual-assisted dispatch is a governed operator process, not an NHS sandbox request.",
    ],
  },
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

function digestFromValue(value: unknown, length = 16): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex")
    .slice(0, length);
}

function csvEscape(value: unknown): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath: string, value: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function environmentProfile(environmentId: SandboxEnvironmentId): SandboxEnvironmentProfile {
  const profile = ENVIRONMENT_PROFILES.find((entry) => entry.environmentId === environmentId);
  if (!profile) {
    throw new Error(`Unknown environment profile: ${environmentId}`);
  }
  return profile;
}

function requestPackHashForTemplate(template: unknown): string {
  return `pack_${digestFromValue(template, 18)}`;
}

export function buildMaskedFingerprint(secretLocator: string): string {
  return `sha256:${digestFromValue({ secretLocator }, 12)}`;
}

export function redactSensitiveText(value: string, secretRefs: readonly string[]): string {
  let redacted = value;
  for (const secretRef of secretRefs) {
    redacted = redacted.replaceAll(secretRef, `[redacted:${buildMaskedFingerprint(secretRef)}]`);
  }
  redacted = redacted.replaceAll(/client_secret=[^&\s]+/gi, "client_secret=[redacted]");
  redacted = redacted.replaceAll(/password=[^&\s]+/gi, "password=[redacted]");
  redacted = redacted.replaceAll(/bearer\s+[a-z0-9._-]+/gi, "bearer [redacted]");
  return redacted;
}

export function containsSensitiveLeak(value: string, secretRefs: readonly string[]): boolean {
  const lowered = value.toLowerCase();
  if (
    lowered.includes("begin private key") ||
    lowered.includes("begin certificate") ||
    /client_secret=(?!\[redacted\])/i.test(value) ||
    /password=(?!\[redacted\])/i.test(value)
  ) {
    return true;
  }
  return secretRefs.some((secretRef) => value.includes(secretRef));
}

function transportProfileId(transportMode: PharmacyDispatchTransportMode): string | null {
  const profile = (
    transportAssuranceRegistryContract as {
      profiles: readonly { transportMode: string; profileId: string }[];
    }
  ).profiles.find((entry) => entry.transportMode === transportMode);
  return profile?.profileId ?? null;
}

function updateRecordEntryFromTemplate(
  template: UpdateRecordObservationTemplate,
): UpdateRecordObservationEntry {
  const profile = environmentProfile(template.environmentId);
  return {
    requestId: template.requestId,
    environmentId: template.environmentId,
    environmentLabel: profile.environmentLabel,
    observationChannel: "gp_connect_update_record",
    outcomeSourceClass: "gp_workflow_observation",
    requestPathKind: template.requestPathKind,
    requestState: template.requestState,
    automationMode: template.automationMode,
    supportedServiceSet: template.supportedServiceSet,
    gpSupplierSet: template.gpSupplierSet,
    pharmacySupplierSet: template.pharmacySupplierSet,
    outboundSendingAllowed: false,
    urgentReturnChannelForbidden: true,
    monitoredSafetyNetRequired: template.monitoredSafetyNetRequired,
    requestPackRef: template.requestPackRef,
    requestPackHash: requestPackHashForTemplate(template),
    portalSurfaceRef: template.portalSurfaceRef,
    portalUrlRef: template.portalUrlRef,
    secretRefs: template.secretRefs,
    evidenceRefs: template.evidenceRefs,
    expiresAt: template.expiresAt,
    notes: template.notes,
  };
}

function transportEntryFromTemplate(template: TransportSandboxTemplate): TransportSandboxEntry {
  const profile = environmentProfile(template.environmentId);
  return {
    requestId: template.requestId,
    environmentId: template.environmentId,
    environmentLabel: profile.environmentLabel,
    transportMode: template.transportMode,
    transportPurpose: template.transportPurpose,
    requestPathKind: template.requestPathKind,
    requestState: template.requestState,
    automationMode: template.automationMode,
    boundDispatchBindingId: template.boundDispatchBindingId,
    transportAssuranceProfileId:
      template.boundDispatchBindingId !== null || template.transportPurpose === "referral_dispatch"
        ? transportProfileId(template.transportMode)
        : null,
    endpointOrMailboxRef: template.endpointOrMailboxRef,
    contactOwnerRole: template.contactOwnerRole,
    requestPackRef: template.requestPackRef,
    requestPackHash: requestPackHashForTemplate(template),
    updateRecordForbidden: template.updateRecordForbidden,
    secretRefs: template.secretRefs,
    evidenceRefs: template.evidenceRefs,
    expiresAt: template.expiresAt,
    notes: template.notes,
  };
}

export async function buildUpdateRecordObservationManifest(): Promise<UpdateRecordObservationManifestDocument> {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    environmentProfiles: ENVIRONMENT_PROFILES,
    observations: UPDATE_RECORD_TEMPLATES.map((template) => updateRecordEntryFromTemplate(template)),
  };
}

export async function buildTransportSandboxManifest(): Promise<TransportSandboxManifestDocument> {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    environmentProfiles: ENVIRONMENT_PROFILES,
    transports: TRANSPORT_TEMPLATES.map((template) => transportEntryFromTemplate(template)),
  };
}

export async function buildTransportAndUpdateRecordSandboxGap(): Promise<TransportAndUpdateRecordSandboxGap> {
  return {
    taskId: FULL_TASK_ID,
    gapId: "PHASE6_BATCH_364_371_INTERFACE_GAP_TRANSPORT_AND_UPDATE_RECORD_SANDBOX",
    missingSurface:
      "Environment-owned NHS onboarding approvals for Update Record observation pairing, MESH mailbox issuance, BARS sandbox access, and monitored mailbox confirmation.",
    expectedOwnerTask: FULL_TASK_ID,
    temporaryFallback:
      "Keep request packs, status tracking, and browser proof in repo while external approvals remain operator-gated and evidence-bound.",
    riskIfUnresolved:
      "The repo could overclaim Update Record or referral-transport readiness without named operator evidence or external approval artifacts.",
    followUpAction:
      "Replace manual-bridge rows with named operator evidence and rerun the 367 validator before widening any environment posture.",
    inheritedSeamRef:
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
    affectedEnvironmentIds: [
      "integration_candidate",
      "training_candidate",
      "deployment_candidate",
    ],
    blockedCapabilities: [
      "real_update_record_pairing",
      "mesh_mailbox_live_issue",
      "bars_nonprod_sandbox_approval",
      "monitored_mailbox_confirmation",
    ],
  };
}

export async function buildSandboxReadinessContract(): Promise<SandboxReadinessContract> {
  const transportManifest = await buildTransportSandboxManifest();
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    updateRecordManifestRef: SOURCE_OUTPUT_PATHS.updateRecordManifest,
    transportManifestRef: SOURCE_OUTPUT_PATHS.transportManifest,
    mailboxMatrixRef: SOURCE_OUTPUT_PATHS.mailboxMatrix,
    transportObservationMatrixRef: SOURCE_OUTPUT_PATHS.transportObservationMatrix,
    requestStatusTrackerRef: SOURCE_OUTPUT_PATHS.requestStatusTracker,
    interfaceGapRef: SOURCE_OUTPUT_PATHS.interfaceGap,
    supportedEnvironmentIds: ENVIRONMENT_PROFILES.map((entry) => entry.environmentId),
    supportedRequestStates: [
      "not_requested",
      "drafted",
      "submitted",
      "awaiting_response",
      "approved",
      "blocked",
      "expired",
    ],
    supportedTransportModes: [
      ...new Set(
        transportManifest.transports.map((entry) => entry.transportMode),
      ),
    ],
    updateRecordOutcomeSourceClass: "gp_workflow_observation",
    updateRecordOutboundSendingAllowed: false,
    urgentReturnUpdateRecordForbidden: true,
    sourceRefs: [
      "blueprint/phase-6-the-pharmacy-loop.md#6D",
      "blueprint/phase-6-the-pharmacy-loop.md#6F",
      "blueprint/phase-6-the-pharmacy-loop.md#6G",
      "data/contracts/343_phase6_transport_assurance_registry.json",
      "data/contracts/344_phase6_bounce_back_schema.json",
      "scripts/pharmacy/366_directory_dispatch_credentials_lib.ts",
    ],
  };
}

export async function renderMailboxEndpointAndContactMatrixCsv(): Promise<string> {
  const transportManifest = await buildTransportSandboxManifest();
  const header = [
    "requestId",
    "environmentId",
    "transportMode",
    "transportPurpose",
    "endpointOrMailboxRef",
    "contactOwnerRole",
    "requestState",
    "automationMode",
  ].join(",");
  const rows = transportManifest.transports.map((entry) =>
    [
      entry.requestId,
      entry.environmentId,
      entry.transportMode,
      entry.transportPurpose,
      entry.endpointOrMailboxRef,
      entry.contactOwnerRole,
      entry.requestState,
      entry.automationMode,
    ]
      .map(csvEscape)
      .join(","),
  );
  return `${header}\n${rows.join("\n")}\n`;
}

export async function renderTransportAndObservationMatrixCsv(): Promise<string> {
  const updateManifest = await buildUpdateRecordObservationManifest();
  const transportManifest = await buildTransportSandboxManifest();
  const rows = [
    ...updateManifest.observations.map((entry) =>
      [
        "update_record",
        entry.requestId,
        entry.environmentId,
        entry.requestState,
        entry.requestPathKind,
        entry.outcomeSourceClass,
        "Rule 3 and 6F boundary",
      ]
        .map(csvEscape)
        .join(","),
    ),
    ...transportManifest.transports.map((entry) =>
      [
        "transport",
        entry.requestId,
        entry.environmentId,
        entry.requestState,
        entry.requestPathKind,
        entry.transportPurpose,
        entry.transportPurpose === "urgent_return_safety_net"
          ? "Rule 5 and 6G boundary"
          : "6D transport readiness",
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];
  return `kind,requestId,environmentId,requestState,pathKind,boundaryFamily,phaseRule\n${rows.join("\n")}\n`;
}

export async function renderRequestStatusTrackerTemplateCsv(): Promise<string> {
  const updateManifest = await buildUpdateRecordObservationManifest();
  const transportManifest = await buildTransportSandboxManifest();
  const rows = [
    ...updateManifest.observations.map((entry) => [
      entry.requestId,
      "update_record",
      entry.environmentId,
      entry.requestState,
      entry.expiresAt ?? "",
      entry.automationMode,
      entry.notes[0] ?? "",
    ]),
    ...transportManifest.transports.map((entry) => [
      entry.requestId,
      "transport",
      entry.environmentId,
      entry.requestState,
      entry.expiresAt ?? "",
      entry.automationMode,
      entry.notes[0] ?? "",
    ]),
  ];
  return `requestId,kind,environmentId,requestState,expiresAt,automationMode,nextAction\n${rows
    .map((row) => row.map(csvEscape).join(","))
    .join("\n")}\n`;
}

function collectAllSecretRefs(
  updateManifest: UpdateRecordObservationManifestDocument,
  transportManifest: TransportSandboxManifestDocument,
): string[] {
  return [
    ...new Set([
      ...updateManifest.observations.flatMap((entry) => entry.secretRefs),
      ...transportManifest.transports.flatMap((entry) => entry.secretRefs),
    ]),
  ];
}

async function dispatchBindingById(): Promise<Map<string, {
  bindingId: string;
  environmentId: string;
  transportMode: string;
  transportAssuranceProfileId: string;
}>> {
  const dispatchManifest = await buildDispatchProviderBindingManifest();
  return new Map(
    dispatchManifest.bindings.map((entry) => [
      entry.bindingId,
      {
        bindingId: entry.bindingId,
        environmentId: entry.environmentId,
        transportMode: entry.transportMode,
        transportAssuranceProfileId: entry.transportAssuranceProfileId,
      },
    ]),
  );
}

function runtimeStatePath(outputDir: string): string {
  return path.join(outputDir, "367_sandbox_request_runtime_state.json");
}

function readinessSummaryPath(outputDir: string): string {
  return path.join(outputDir, "367_sandbox_readiness_summary.json");
}

function operatorBundlePath(outputDir: string, requestId: string): string {
  return path.join(outputDir, `367_operator_submission_bundle_${requestId}.json`);
}

function ensureOutputDir(outputDir?: string): string {
  const resolved = outputDir
    ? path.resolve(outputDir)
    : path.resolve(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

function readRuntimeState(outputDir: string): SandboxRuntimeState {
  const filePath = runtimeStatePath(outputDir);
  if (!fs.existsSync(filePath)) {
    return {
      version: CONTROL_PLANE_VERSION,
      requests: [],
    };
  }
  return readJson<SandboxRuntimeState>(filePath);
}

function writeRuntimeState(outputDir: string, state: SandboxRuntimeState): void {
  writeJson(runtimeStatePath(outputDir), state);
}

function entryRuntimeState(
  runtimeState: SandboxRuntimeState,
  requestId: string,
): SandboxRuntimeStateRow | undefined {
  return runtimeState.requests.find((entry) => entry.requestId === requestId);
}

function effectiveState(
  baselineState: SandboxRequestState,
  runtimeState: SandboxRuntimeState,
  requestId: string,
): SandboxRequestState {
  return entryRuntimeState(runtimeState, requestId)?.requestState ?? baselineState;
}

export async function resetTransportSandboxRuntime(outputDir?: string): Promise<void> {
  const resolved = ensureOutputDir(outputDir);
  writeRuntimeState(resolved, {
    version: CONTROL_PLANE_VERSION,
    requests: [],
  });
  if (fs.existsSync(readinessSummaryPath(resolved))) {
    fs.rmSync(readinessSummaryPath(resolved));
  }
}

export async function validateSandboxReadinessDocuments(
  updateManifest: UpdateRecordObservationManifestDocument,
  transportManifest: TransportSandboxManifestDocument,
): Promise<{ readonly issues: readonly string[] }> {
  const issues: string[] = [];
  const bindingIndex = await dispatchBindingById();

  for (const observation of updateManifest.observations) {
    if (observation.outboundSendingAllowed) {
      issues.push(`UPDATE_RECORD_OUTBOUND_FORBIDDEN:${observation.requestId}`);
    }
    if (!observation.urgentReturnChannelForbidden) {
      issues.push(`UPDATE_RECORD_URGENT_RETURN_DRIFT:${observation.requestId}`);
    }
    if (observation.outcomeSourceClass !== "gp_workflow_observation") {
      issues.push(`UPDATE_RECORD_SOURCE_DRIFT:${observation.requestId}`);
    }
    if (observation.supportedServiceSet.length !== 3) {
      issues.push(`UPDATE_RECORD_SERVICE_SET_DRIFT:${observation.requestId}`);
    }
    if (
      observation.requestState === "approved" &&
      observation.evidenceRefs.length === 0
    ) {
      issues.push(`UPDATE_RECORD_APPROVED_WITHOUT_EVIDENCE:${observation.requestId}`);
    }
  }

  for (const transport of transportManifest.transports) {
    if (
      transport.transportPurpose === "urgent_return_safety_net" &&
      !transport.updateRecordForbidden
    ) {
      issues.push(`URGENT_RETURN_UPDATE_RECORD_FORBIDDEN:${transport.requestId}`);
    }
    if (
      transport.transportPurpose === "urgent_return_safety_net" &&
      transport.boundDispatchBindingId !== null
    ) {
      issues.push(`URGENT_RETURN_BINDING_DRIFT:${transport.requestId}`);
    }

    if (transport.boundDispatchBindingId !== null) {
      const binding = bindingIndex.get(transport.boundDispatchBindingId);
      if (!binding) {
        issues.push(`MISSING_DISPATCH_BINDING:${transport.requestId}`);
        continue;
      }
      if (binding.environmentId !== transport.environmentId) {
        issues.push(`DISPATCH_BINDING_ENV_DRIFT:${transport.requestId}`);
      }
      if (binding.transportMode !== transport.transportMode) {
        issues.push(`DISPATCH_BINDING_MODE_DRIFT:${transport.requestId}`);
      }
      if (binding.transportAssuranceProfileId !== transport.transportAssuranceProfileId) {
        issues.push(`TRANSPORT_PROFILE_DRIFT:${transport.requestId}`);
      }
    }

    const expectedTransportProfile =
      transport.transportPurpose === "referral_dispatch"
        ? transportProfileId(transport.transportMode)
        : null;
    if (transport.transportAssuranceProfileId !== expectedTransportProfile) {
      issues.push(`TRANSPORT_PROFILE_EXPECTATION_DRIFT:${transport.requestId}`);
    }
  }

  return { issues };
}

export async function materializeTransportSandboxTrackedArtifacts(
  rootDir = process.cwd(),
): Promise<{
  readonly updateRecordManifestPath: string;
  readonly transportManifestPath: string;
  readonly contractPath: string;
  readonly mailboxMatrixPath: string;
  readonly transportObservationMatrixPath: string;
  readonly requestStatusTrackerPath: string;
  readonly interfaceGapPath: string;
}> {
  const updateRecordManifestPath = path.join(
    rootDir,
    SOURCE_OUTPUT_PATHS.updateRecordManifest,
  );
  const transportManifestPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.transportManifest);
  const contractPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.contract);
  const mailboxMatrixPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.mailboxMatrix);
  const transportObservationMatrixPath = path.join(
    rootDir,
    SOURCE_OUTPUT_PATHS.transportObservationMatrix,
  );
  const requestStatusTrackerPath = path.join(
    rootDir,
    SOURCE_OUTPUT_PATHS.requestStatusTracker,
  );
  const interfaceGapPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.interfaceGap);

  writeJson(updateRecordManifestPath, await buildUpdateRecordObservationManifest());
  writeJson(transportManifestPath, await buildTransportSandboxManifest());
  writeJson(contractPath, await buildSandboxReadinessContract());
  writeText(mailboxMatrixPath, await renderMailboxEndpointAndContactMatrixCsv());
  writeText(
    transportObservationMatrixPath,
    await renderTransportAndObservationMatrixCsv(),
  );
  writeText(requestStatusTrackerPath, await renderRequestStatusTrackerTemplateCsv());
  writeJson(interfaceGapPath, await buildTransportAndUpdateRecordSandboxGap());

  return {
    updateRecordManifestPath,
    transportManifestPath,
    contractPath,
    mailboxMatrixPath,
    transportObservationMatrixPath,
    requestStatusTrackerPath,
    interfaceGapPath,
  };
}

export async function readAndValidateTransportSandboxControlPlane(
  rootDir = process.cwd(),
): Promise<{
  readonly updateManifest: UpdateRecordObservationManifestDocument;
  readonly transportManifest: TransportSandboxManifestDocument;
}> {
  const updateManifest = readJson<UpdateRecordObservationManifestDocument>(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.updateRecordManifest),
  );
  const transportManifest = readJson<TransportSandboxManifestDocument>(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.transportManifest),
  );
  const validation = await validateSandboxReadinessDocuments(
    updateManifest,
    transportManifest,
  );
  if (validation.issues.length > 0) {
    throw new Error(validation.issues.join("\n"));
  }
  return { updateManifest, transportManifest };
}

export async function prepareOperatorSubmissionBundle(
  options: {
    readonly outputDir?: string;
    readonly requestIds?: readonly string[];
  } = {},
): Promise<{
  readonly bundle: OperatorSubmissionBundle;
  readonly outputPath: string;
}> {
  const outputDir = ensureOutputDir(options.outputDir);
  const updateManifest = await buildUpdateRecordObservationManifest();
  const transportManifest = await buildTransportSandboxManifest();
  const runtimeState = readRuntimeState(outputDir);
  const requestIds = options.requestIds
    ? [...new Set(options.requestIds)]
    : [
        "update_record_367_integration_pairing",
        "transport_367_bars_deployment_preflight",
        "transport_367_mesh_training_mailbox",
      ];

  const requests = requestIds.map((requestId) => {
    const updateEntry = updateManifest.observations.find((entry) => entry.requestId === requestId);
    if (updateEntry) {
      return {
        requestId,
        kind: "update_record" as const,
        environmentId: updateEntry.environmentId,
        requestState: effectiveState(updateEntry.requestState, runtimeState, requestId),
        requestPathKind: updateEntry.requestPathKind,
        requestPackRef: updateEntry.requestPackRef,
        requestPackHash: updateEntry.requestPackHash,
        endpointOrMailboxRef: null,
        maskedSecretFingerprints: updateEntry.secretRefs.map((secretRef) =>
          buildMaskedFingerprint(secretRef),
        ),
        evidenceRefs: updateEntry.evidenceRefs,
        notes: updateEntry.notes,
      };
    }
    const transportEntry = transportManifest.transports.find((entry) => entry.requestId === requestId);
    if (!transportEntry) {
      throw new Error(`Unknown request id: ${requestId}`);
    }
    return {
      requestId,
      kind: "transport" as const,
      environmentId: transportEntry.environmentId,
      requestState: effectiveState(transportEntry.requestState, runtimeState, requestId),
      requestPathKind: transportEntry.requestPathKind,
      requestPackRef: transportEntry.requestPackRef,
      requestPackHash: transportEntry.requestPackHash,
      endpointOrMailboxRef: transportEntry.endpointOrMailboxRef,
      maskedSecretFingerprints: transportEntry.secretRefs.map((secretRef) =>
        buildMaskedFingerprint(secretRef),
      ),
      evidenceRefs: transportEntry.evidenceRefs,
      notes: transportEntry.notes,
    };
  });

  const bundle: OperatorSubmissionBundle = {
    taskId: FULL_TASK_ID,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    requestIds,
    requests,
  };
  const bundleDigest = digestFromValue(bundle, 18);
  const outputPath = path.join(outputDir, `367_operator_submission_bundle_${bundleDigest}.json`);
  writeJson(outputPath, bundle);

  const nextRequests = runtimeState.requests.filter(
    (entry) => !requestIds.includes(entry.requestId),
  );
  for (const request of requests) {
    nextRequests.push({
      requestId: request.requestId,
      requestState: request.requestState,
      updatedAt: GENERATED_AT,
      operatorBundleHash: bundleDigest,
      bundlePath: outputPath,
    });
  }
  writeRuntimeState(outputDir, {
    version: CONTROL_PLANE_VERSION,
    requests: nextRequests,
  });

  return { bundle, outputPath };
}

export async function transitionSandboxRequestState(
  options: {
    readonly requestId: string;
    readonly action: "prepare_draft" | "submit_request";
    readonly outputDir?: string;
  },
): Promise<RequestTransitionResult> {
  const outputDir = ensureOutputDir(options.outputDir);
  const updateManifest = await buildUpdateRecordObservationManifest();
  const transportManifest = await buildTransportSandboxManifest();
  const runtimeState = readRuntimeState(outputDir);

  const updateEntry = updateManifest.observations.find(
    (entry) => entry.requestId === options.requestId,
  );
  const transportEntry = transportManifest.transports.find(
    (entry) => entry.requestId === options.requestId,
  );
  const entry = updateEntry ?? transportEntry;
  if (!entry) {
    throw new Error(`Unknown request id: ${options.requestId}`);
  }

  const previousState = effectiveState(entry.requestState, runtimeState, options.requestId);
  let nextState = previousState;
  let action: RequestTransitionResult["action"] = "already_current";

  if (options.action === "prepare_draft") {
    if (previousState === "blocked" || previousState === "approved") {
      action = previousState === "blocked" ? "blocked" : "no_action_required";
    } else if (previousState === "drafted") {
      action = "already_current";
    } else {
      nextState = "drafted";
      action = "prepared_draft";
    }
  } else {
    if (entry.automationMode === "manual_stop_before_submit") {
      action = "manual_stop_required";
    } else if (entry.automationMode === "not_required") {
      action = "no_action_required";
    } else if (previousState === "blocked" || previousState === "expired") {
      action = "blocked";
    } else if (previousState === "submitted") {
      action = "already_current";
    } else {
      nextState = "submitted";
      action = "submitted";
    }
  }

  const nextRequests = runtimeState.requests.filter(
    (runtimeEntry) => runtimeEntry.requestId !== options.requestId,
  );
  nextRequests.push({
    requestId: options.requestId,
    requestState: nextState,
    updatedAt: GENERATED_AT,
    operatorBundleHash: entryRuntimeState(runtimeState, options.requestId)?.operatorBundleHash ?? null,
    bundlePath: entryRuntimeState(runtimeState, options.requestId)?.bundlePath ?? null,
  });
  writeRuntimeState(outputDir, {
    version: CONTROL_PLANE_VERSION,
    requests: nextRequests,
  });

  return {
    taskId: TASK_ID,
    requestId: options.requestId,
    previousState,
    nextState,
    action,
    runtimeStatePath: runtimeStatePath(outputDir),
  };
}

export async function seedSandboxRequestStates(
  options: {
    readonly outputDir?: string;
    readonly overrides: readonly {
      requestId: string;
      requestState: SandboxRequestState;
    }[];
  },
): Promise<void> {
  const outputDir = ensureOutputDir(options.outputDir);
  const runtimeState = readRuntimeState(outputDir);
  const nextRequests = runtimeState.requests.filter(
    (entry) => !options.overrides.some((override) => override.requestId === entry.requestId),
  );
  for (const override of options.overrides) {
    nextRequests.push({
      requestId: override.requestId,
      requestState: override.requestState,
      updatedAt: GENERATED_AT,
      operatorBundleHash: entryRuntimeState(runtimeState, override.requestId)?.operatorBundleHash ?? null,
      bundlePath: entryRuntimeState(runtimeState, override.requestId)?.bundlePath ?? null,
    });
  }
  writeRuntimeState(outputDir, {
    version: CONTROL_PLANE_VERSION,
    requests: nextRequests,
  });
}

export async function verifyUpdateRecordAndTransportSandboxReadiness(
  outputDir?: string,
): Promise<SandboxReadinessSummary> {
  const resolvedOutputDir = ensureOutputDir(outputDir);
  const updateManifest = await buildUpdateRecordObservationManifest();
  const transportManifest = await buildTransportSandboxManifest();
  const validation = await validateSandboxReadinessDocuments(
    updateManifest,
    transportManifest,
  );
  if (validation.issues.length > 0) {
    throw new Error(validation.issues.join("\n"));
  }
  const runtimeState = readRuntimeState(resolvedOutputDir);

  const updateRecordChecks: SandboxCheck[] = updateManifest.observations.map((entry) => {
    const requestState = effectiveState(entry.requestState, runtimeState, entry.requestId);
    const decisionClasses = [
      "consultation_summary_only",
      "urgent_return_forbidden",
      entry.monitoredSafetyNetRequired ? "monitored_safety_net_required" : "no_safety_net_required",
      `request_state:${requestState}`,
      `automation:${entry.automationMode}`,
    ];
    return {
      requestId: entry.requestId,
      environmentId: entry.environmentId,
      kind: "update_record",
      requestState,
      decisionClasses,
    };
  });

  const transportChecks: SandboxCheck[] = transportManifest.transports.map((entry) => {
    const requestState = effectiveState(entry.requestState, runtimeState, entry.requestId);
    const decisionClasses = [
      `purpose:${entry.transportPurpose}`,
      entry.updateRecordForbidden ? "update_record_forbidden" : "update_record_not_forbidden",
      entry.boundDispatchBindingId ? "dispatch_binding_bound" : "dispatch_binding_not_required",
      `request_state:${requestState}`,
      `automation:${entry.automationMode}`,
    ];
    return {
      requestId: entry.requestId,
      environmentId: entry.environmentId,
      kind: "transport",
      requestState,
      decisionClasses,
    };
  });

  const byEnvironment = ENVIRONMENT_PROFILES.map((profile) => {
    const states = [
      ...updateRecordChecks
        .filter((entry) => entry.environmentId === profile.environmentId)
        .map((entry) => entry.requestState),
      ...transportChecks
        .filter((entry) => entry.environmentId === profile.environmentId)
        .map((entry) => entry.requestState),
    ];
    return {
      environmentId: profile.environmentId,
      environmentLabel: profile.environmentLabel,
      draftedCount: states.filter((state) => state === "drafted").length,
      submittedOrAwaitingCount: states.filter((state) =>
        state === "submitted" || state === "awaiting_response"
      ).length,
      approvedCount: states.filter((state) => state === "approved").length,
      blockedOrExpiredCount: states.filter((state) =>
        state === "blocked" || state === "expired"
      ).length,
    } as const;
  });

  const summary: SandboxReadinessSummary = {
    taskId: TASK_ID,
    verificationAt: GENERATED_AT,
    updateRecordChecks,
    transportChecks,
    byEnvironment,
  };
  writeJson(readinessSummaryPath(resolvedOutputDir), summary);
  return summary;
}

export async function materializeTransportSandboxExamplesToTempDir(): Promise<string> {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-367-sandbox-"));
  await materializeTransportSandboxTrackedArtifacts(outputDir);
  return outputDir;
}

export async function collectTrackedSecretRefs(): Promise<readonly string[]> {
  return collectAllSecretRefs(
    await buildUpdateRecordObservationManifest(),
    await buildTransportSandboxManifest(),
  );
}
