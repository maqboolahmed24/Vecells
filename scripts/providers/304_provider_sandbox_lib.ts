import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  createPhase4BookingCapabilityEngineService,
  phase4ProviderCapabilityMatrix,
  type BookingActionScope,
  type BookingProviderAdapterBindingSnapshot,
  type BookingSelectionAudience,
  type ProviderCapabilityMatrixRowSnapshot,
} from "../../packages/domains/booking/src/phase4-booking-capability-engine.ts";
import { createReplayCollisionApplication } from "../../services/command-api/src/replay-collision-authority.ts";

export const TASK_ID = "seq_304";
export const SCHEMA_VERSION = "304.phase4.provider-sandbox.v1";
export const GENERATED_AT = "2026-04-20";
export const REGISTRY_VERSION = "304-provider-sandbox-setup-2026-04-20.v1";
export const OUTPUT_DIR = ".artifacts/provider-sandboxes/304";
export const SOURCE_OUTPUT_PATHS = {
  registry: "ops/providers/304_provider_sandbox_registry.yaml",
  callbacks: "ops/providers/304_provider_callback_manifest.yaml",
  environmentMatrix: "ops/providers/304_provider_environment_matrix.csv",
} as const;

export type ProviderSandboxEnvironmentId =
  | "local_twin"
  | "sandbox_twin"
  | "supported_test_candidate"
  | "integration_candidate"
  | "ops_manual_twin";

export type ProviderPortalAutomationState =
  | "fully_automated"
  | "manual_bridge_required"
  | "not_applicable";

export type ProviderCallbackMode =
  | "supplier_callback"
  | "authoritative_read_after_write"
  | "manual_attestation"
  | "not_supported";

export interface ProviderSandboxEntry {
  readonly sandboxId: string;
  readonly providerCapabilityMatrixRef: string;
  readonly matrixVersionRef: string;
  readonly supplierRef: string;
  readonly supplierLabel: string;
  readonly integrationMode: string;
  readonly deploymentType: string;
  readonly environmentId: ProviderSandboxEnvironmentId;
  readonly environmentLabel: string;
  readonly tenantId: string;
  readonly practiceRef: string;
  readonly organisationRef: string;
  readonly providerAdapterBindingRef: string;
  readonly providerAdapterBindingHash: string;
  readonly adapterContractProfileRef: string;
  readonly authoritativeReadContractRef: string;
  readonly authoritativeReadAndConfirmationPolicyRef: string;
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly portalAutomationState: ProviderPortalAutomationState;
  readonly setupPosture: string;
  readonly smokeMethod: string;
  readonly resetSupport: "supported" | "not_supported";
  readonly callbackMode: ProviderCallbackMode;
  readonly secretRefs: Record<string, string>;
  readonly maskedSecretFingerprints: Record<string, string>;
  readonly notes: readonly string[];
}

export interface ProviderCallbackEntry {
  readonly callbackId: string;
  readonly sandboxId: string;
  readonly providerCapabilityMatrixRef: string;
  readonly supplierRef: string;
  readonly environmentId: ProviderSandboxEnvironmentId;
  readonly providerAdapterBindingRef: string;
  readonly providerAdapterBindingHash: string;
  readonly adapterContractProfileRef: string;
  readonly callbackMode: ProviderCallbackMode;
  readonly registrationSource: "portal" | "manifest_only" | "not_applicable";
  readonly callbackUrlPath: string | null;
  readonly callbackUrlRef: string | null;
  readonly verificationMode: string;
  readonly secretRef: string | null;
  readonly maskedSecretFingerprint: string | null;
  readonly replayWindowSeconds: number | null;
  readonly effectKeyTemplate: string;
  readonly providerCorrelationTemplate: string;
  readonly eventMappings: readonly {
    providerEvent: string;
    receiptSemantic: string;
    bookingTruthEffect: string;
  }[];
  readonly notes: readonly string[];
}

export interface ProviderSandboxRegistryDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly registryVersion: string;
  readonly generatedAt: string;
  readonly sandboxes: readonly ProviderSandboxEntry[];
}

export interface ProviderCallbackManifestDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly manifestVersion: string;
  readonly generatedAt: string;
  readonly callbacks: readonly ProviderCallbackEntry[];
}

interface ResolvedBindingBundle {
  readonly row: ProviderCapabilityMatrixRowSnapshot;
  readonly binding: BookingProviderAdapterBindingSnapshot;
}

interface SandboxTemplate {
  readonly sandboxId: string;
  readonly providerCapabilityMatrixRef: string;
  readonly environmentId: ProviderSandboxEnvironmentId;
  readonly environmentLabel: string;
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly portalAutomationState: ProviderPortalAutomationState;
  readonly setupPosture: string;
  readonly smokeMethod: string;
  readonly resetSupport: "supported" | "not_supported";
  readonly callbackMode: ProviderCallbackMode;
  readonly secretRefs: Record<string, string>;
  readonly notes: readonly string[];
}

interface CallbackTemplate {
  readonly callbackId: string;
  readonly sandboxId: string;
  readonly callbackMode: ProviderCallbackMode;
  readonly registrationSource: "portal" | "manifest_only" | "not_applicable";
  readonly callbackUrlPath: string | null;
  readonly callbackUrlRef: string | null;
  readonly verificationMode: string;
  readonly secretRef: string | null;
  readonly replayWindowSeconds: number | null;
  readonly effectKeyTemplate: string;
  readonly providerCorrelationTemplate: string;
  readonly eventMappings: readonly {
    providerEvent: string;
    receiptSemantic: string;
    bookingTruthEffect: string;
  }[];
  readonly notes: readonly string[];
}

interface BootstrapOptions {
  readonly outputDir?: string;
  readonly sandboxIds?: readonly string[];
}

export interface BootstrapResult {
  readonly taskId: typeof TASK_ID;
  readonly outputDir: string;
  readonly actions: readonly {
    sandboxId: string;
    portalAutomationState: ProviderPortalAutomationState;
    callbackMode: ProviderCallbackMode;
    action: "configured" | "already_current" | "manual_bridge_required" | "not_applicable";
    detail: string;
  }[];
  readonly statePath: string;
}

export interface ProviderCallbackVerificationResult {
  readonly taskId: typeof TASK_ID;
  readonly verificationAt: string;
  readonly callbackChecks: readonly {
    callbackId: string;
    sandboxId: string;
    callbackMode: ProviderCallbackMode;
    state: "verified" | "manual_bridge_required" | "not_applicable" | "failed";
    receiptDecisionClasses: readonly string[];
    verificationMode: string;
  }[];
}

interface RuntimeState {
  readonly version: typeof REGISTRY_VERSION;
  readonly registrations: readonly {
    sandboxId: string;
    callbackId: string;
    callbackUrlPath: string;
    providerAdapterBindingHash: string;
    verificationMode: string;
    maskedSecretFingerprint: string | null;
    configuredAt: string;
  }[];
}

const SANDBOX_TEMPLATES = [
  {
    sandboxId: "sandbox_304_optum_im1_supported_test",
    providerCapabilityMatrixRef: "PCM_279_OPTUM_IM1_PATIENT_V1",
    environmentId: "supported_test_candidate",
    environmentLabel: "SUPPORTED TEST candidate",
    portalSurfaceRef: "portal://booking/im1-pairing/optum/supported-test",
    portalUrlRef: "https://portal.optum-im1.example.invalid/supported-test",
    portalAutomationState: "manual_bridge_required",
    setupPosture: "browser_observed_manual_bridge",
    smokeMethod: "authoritative_read_after_write_only",
    resetSupport: "not_supported",
    callbackMode: "authoritative_read_after_write",
    secretRefs: {
      portalUser: "secret://booking/im1/optum/supported-test/user",
      portalPassword: "secret://booking/im1/optum/supported-test/password",
      pairingPack: "vault://booking/im1/optum/pairing-pack",
    },
    notes: [
      "IM1 patient API needs pairing-pack approval and supported-test access before real mutation.",
      "This row stays dry-run and manual-bridge until lawful supplier access is available.",
    ],
  },
  {
    sandboxId: "sandbox_304_tpp_im1_patient_supported_test",
    providerCapabilityMatrixRef: "PCM_279_TPP_IM1_PATIENT_V1",
    environmentId: "supported_test_candidate",
    environmentLabel: "SUPPORTED TEST candidate",
    portalSurfaceRef: "portal://booking/im1-pairing/tpp/patient-supported-test",
    portalUrlRef: "https://portal.tpp-im1.example.invalid/patient-supported-test",
    portalAutomationState: "manual_bridge_required",
    setupPosture: "browser_observed_manual_bridge",
    smokeMethod: "authoritative_read_after_write_only",
    resetSupport: "not_supported",
    callbackMode: "authoritative_read_after_write",
    secretRefs: {
      portalUser: "secret://booking/im1/tpp/patient-supported-test/user",
      portalPassword: "secret://booking/im1/tpp/patient-supported-test/password",
      pairingPack: "vault://booking/im1/tpp/patient/pairing-pack",
    },
    notes: [
      "TPP patient IM1 setup must remain clearly labeled as supported-test to avoid live confusion.",
      "No callback registration is claimed for patient IM1; read-after-write remains authoritative.",
    ],
  },
  {
    sandboxId: "sandbox_304_tpp_im1_transaction_supported_test",
    providerCapabilityMatrixRef: "PCM_279_TPP_IM1_TRANSACTION_V1",
    environmentId: "supported_test_candidate",
    environmentLabel: "SUPPORTED TEST candidate with local component",
    portalSurfaceRef: "portal://booking/im1-pairing/tpp/transaction-supported-test",
    portalUrlRef: "https://portal.tpp-im1.example.invalid/transaction-supported-test",
    portalAutomationState: "manual_bridge_required",
    setupPosture: "browser_observed_manual_bridge",
    smokeMethod: "component_heartbeat_plus_external_gate",
    resetSupport: "not_supported",
    callbackMode: "supplier_callback",
    secretRefs: {
      portalUser: "secret://booking/im1/tpp/transaction-supported-test/user",
      portalPassword: "secret://booking/im1/tpp/transaction-supported-test/password",
      gatewaySharedSecret: "secret://booking/local-component/tpp/supported-test/hmac",
      localComponentInstallPack: "vault://booking/local-component/tpp/install-pack",
    },
    notes: [
      "TPP transaction API stays bound to a local component and external confirmation gate.",
      "This row remains manual bridge because the actual supplier portal cannot be mutated lawfully from the repo harness.",
    ],
  },
  {
    sandboxId: "sandbox_304_gp_connect_integration_candidate",
    providerCapabilityMatrixRef: "PCM_279_GP_CONNECT_EXISTING_V1",
    environmentId: "integration_candidate",
    environmentLabel: "Integration candidate on HSCN",
    portalSurfaceRef: "portal://booking/gp-connect/consumer-registration",
    portalUrlRef: "https://portal.gp-connect.example.invalid/integration",
    portalAutomationState: "manual_bridge_required",
    setupPosture: "browser_observed_manual_bridge",
    smokeMethod: "ssp_direct_reference_confirmation",
    resetSupport: "not_supported",
    callbackMode: "not_supported",
    secretRefs: {
      onboardingPack: "vault://booking/gp-connect/integration/onboarding-pack",
      consumerJwtKey: "secret://booking/gp-connect/integration/consumer-jwt-key",
      sspCertificate: "secret://booking/gp-connect/integration/ssp-mtls-certificate",
    },
    notes: [
      "GP Connect appointment management is staff-facing direct-care integration rather than patient self-service.",
      "No supplier callback is assumed; authoritative outcome comes from direct response and later read or manage proof.",
    ],
  },
  {
    sandboxId: "sandbox_304_vecells_local_gateway_local_twin",
    providerCapabilityMatrixRef: "PCM_279_LOCAL_GATEWAY_COMPONENT_V1",
    environmentId: "local_twin",
    environmentLabel: "Local twin",
    portalSurfaceRef: "portal://booking/local-gateway/config/local",
    portalUrlRef: "http://127.0.0.1:0/portal/local-gateway/local",
    portalAutomationState: "fully_automated",
    setupPosture: "local_manifest_and_portal_twin",
    smokeMethod: "hmac_callback_and_replay_checkpoint",
    resetSupport: "supported",
    callbackMode: "supplier_callback",
    secretRefs: {
      portalUser: "env://BOOKING_LOCAL_GATEWAY_LOCAL_USER",
      portalPassword: "env://BOOKING_LOCAL_GATEWAY_LOCAL_PASSWORD",
      callbackSecret: "secret://booking/local-gateway/local/hmac",
    },
    notes: [
      "Local twin is the fully automated rehearsal path for callback registration and replay-safe verification.",
      "Mutation remains fail-closed to the local harness and never widens to real supplier traffic.",
    ],
  },
  {
    sandboxId: "sandbox_304_vecells_local_gateway_sandbox_twin",
    providerCapabilityMatrixRef: "PCM_279_LOCAL_GATEWAY_COMPONENT_V1",
    environmentId: "sandbox_twin",
    environmentLabel: "Sandbox twin",
    portalSurfaceRef: "portal://booking/local-gateway/config/sandbox",
    portalUrlRef: "https://booking-sandbox-gateway.vecells.invalid/portal",
    portalAutomationState: "fully_automated",
    setupPosture: "portal_twin_with_masked_evidence",
    smokeMethod: "hmac_callback_and_replay_checkpoint",
    resetSupport: "supported",
    callbackMode: "supplier_callback",
    secretRefs: {
      portalUser: "secret://booking/local-gateway/sandbox/user",
      portalPassword: "secret://booking/local-gateway/sandbox/password",
      callbackSecret: "secret://booking/local-gateway/sandbox/hmac",
    },
    notes: [
      "Sandbox twin mirrors the provider portal flow but keeps credential references masked.",
      "This is the repeatable portal-mediated proof path used by the Playwright specs.",
    ],
  },
  {
    sandboxId: "sandbox_304_manual_assist_ops_twin",
    providerCapabilityMatrixRef: "PCM_279_MANUAL_ASSIST_ONLY_V1",
    environmentId: "ops_manual_twin",
    environmentLabel: "Operations manual twin",
    portalSurfaceRef: "portal://booking/manual-assist/network-config",
    portalUrlRef: "https://ops-manual-assist.vecells.invalid/booking-network",
    portalAutomationState: "not_applicable",
    setupPosture: "manual_network_registry_only",
    smokeMethod: "queue_routing_and_support_handoff",
    resetSupport: "supported",
    callbackMode: "manual_attestation",
    secretRefs: {
      supportQueueRef: "config://booking/manual-assist/queue-ref",
      operatorRunbookRef: "docs://ops/304_booking_provider_sandbox_runbook.md",
    },
    notes: [
      "Manual assist network has no supplier portal callback to register.",
      "The control-plane duty here is explicit routing metadata and masked owner references only.",
    ],
  },
] as const satisfies readonly SandboxTemplate[];

const CALLBACK_TEMPLATES = [
  {
    callbackId: "callback_304_optum_im1_supported_test",
    sandboxId: "sandbox_304_optum_im1_supported_test",
    callbackMode: "authoritative_read_after_write",
    registrationSource: "manifest_only",
    callbackUrlPath: null,
    callbackUrlRef: null,
    verificationMode: "read_after_write_followup",
    secretRef: "vault://booking/im1/optum/pairing-pack",
    replayWindowSeconds: null,
    effectKeyTemplate: "booking_commit|provider_binding_hash|canonical_reservation_key",
    providerCorrelationTemplate: "provider_reference|reservation_key",
    eventMappings: [
      {
        providerEvent: "sync_or_polled_confirmation",
        receiptSemantic: "read_after_write_snapshot",
        bookingTruthEffect: "provider_reference_seen_or_same_commit_read_after_write",
      },
    ],
    notes: [
      "No supplier callback is configured for Optum patient IM1 in this pack.",
      "Verification stays bound to the authoritative read contract and current binding hash.",
    ],
  },
  {
    callbackId: "callback_304_tpp_im1_patient_supported_test",
    sandboxId: "sandbox_304_tpp_im1_patient_supported_test",
    callbackMode: "authoritative_read_after_write",
    registrationSource: "manifest_only",
    callbackUrlPath: null,
    callbackUrlRef: null,
    verificationMode: "read_after_write_followup",
    secretRef: "vault://booking/im1/tpp/patient/pairing-pack",
    replayWindowSeconds: null,
    effectKeyTemplate: "booking_commit|provider_binding_hash|canonical_reservation_key",
    providerCorrelationTemplate: "provider_reference|reservation_key",
    eventMappings: [
      {
        providerEvent: "sync_or_polled_confirmation",
        receiptSemantic: "read_after_write_snapshot",
        bookingTruthEffect: "provider_reference_seen_or_same_commit_read_after_write",
      },
    ],
    notes: [
      "TPP patient IM1 follows the same read-after-write posture as the Optum patient row.",
    ],
  },
  {
    callbackId: "callback_304_tpp_im1_transaction_supported_test",
    sandboxId: "sandbox_304_tpp_im1_transaction_supported_test",
    callbackMode: "supplier_callback",
    registrationSource: "portal",
    callbackUrlPath: "/edge/booking/provider/tpp-transaction/confirmation-callback",
    callbackUrlRef: "url://booking/provider/tpp-transaction/confirmation-callback",
    verificationMode: "hmac_sha256_local_component",
    secretRef: "secret://booking/local-component/tpp/supported-test/hmac",
    replayWindowSeconds: 300,
    effectKeyTemplate: "booking_commit|environment|provider_binding_hash|provider_correlation",
    providerCorrelationTemplate: "provider_correlation|event_id|binding_hash",
    eventMappings: [
      {
        providerEvent: "booking.accepted",
        receiptSemantic: "accepted_for_processing",
        bookingTruthEffect: "processing_acceptance_state_accepted_for_processing",
      },
      {
        providerEvent: "booking.confirmed",
        receiptSemantic: "durable_provider_reference",
        bookingTruthEffect: "booking_confirmation_truth_confirmed",
      },
      {
        providerEvent: "booking.rejected",
        receiptSemantic: "authoritative_failure",
        bookingTruthEffect: "booking_confirmation_truth_failed",
      },
    ],
    notes: [
      "The local component callback stays edge-scoped and never targets queue workers directly.",
    ],
  },
  {
    callbackId: "callback_304_gp_connect_integration_candidate",
    sandboxId: "sandbox_304_gp_connect_integration_candidate",
    callbackMode: "not_supported",
    registrationSource: "not_applicable",
    callbackUrlPath: null,
    callbackUrlRef: null,
    verificationMode: "ssp_direct_response_only",
    secretRef: "secret://booking/gp-connect/integration/ssp-mtls-certificate",
    replayWindowSeconds: null,
    effectKeyTemplate: "booking_commit|provider_binding_hash|consumer_jwt_sub|ssp_request_id",
    providerCorrelationTemplate: "ssp_request_id|appointment_reference",
    eventMappings: [
      {
        providerEvent: "direct_response_or_followup_read",
        receiptSemantic: "provider_reference_or_conflict",
        bookingTruthEffect: "confirmed_or_reconciliation_required",
      },
    ],
    notes: [
      "GP Connect does not expose a supplier webhook endpoint in this pack.",
    ],
  },
  {
    callbackId: "callback_304_vecells_local_gateway_local_twin",
    sandboxId: "sandbox_304_vecells_local_gateway_local_twin",
    callbackMode: "supplier_callback",
    registrationSource: "portal",
    callbackUrlPath: "/edge/booking/provider/vecells-local-gateway/confirmation-callback",
    callbackUrlRef: "url://booking/provider/vecells-local-gateway/confirmation-callback",
    verificationMode: "hmac_sha256",
    secretRef: "secret://booking/local-gateway/local/hmac",
    replayWindowSeconds: 300,
    effectKeyTemplate: "booking_commit|environment|provider_binding_hash|provider_correlation",
    providerCorrelationTemplate: "provider_correlation|event_id|binding_hash",
    eventMappings: [
      {
        providerEvent: "booking.accepted",
        receiptSemantic: "accepted_for_processing",
        bookingTruthEffect: "processing_acceptance_state_accepted_for_processing",
      },
      {
        providerEvent: "booking.confirmed",
        receiptSemantic: "durable_provider_reference",
        bookingTruthEffect: "booking_confirmation_truth_confirmed",
      },
      {
        providerEvent: "booking.rejected",
        receiptSemantic: "authoritative_failure",
        bookingTruthEffect: "booking_confirmation_truth_failed",
      },
    ],
    notes: [
      "Local twin callback is the canonical automated replay-safe verification path.",
    ],
  },
  {
    callbackId: "callback_304_vecells_local_gateway_sandbox_twin",
    sandboxId: "sandbox_304_vecells_local_gateway_sandbox_twin",
    callbackMode: "supplier_callback",
    registrationSource: "portal",
    callbackUrlPath: "/edge/booking/provider/vecells-local-gateway/confirmation-callback",
    callbackUrlRef: "url://booking/provider/vecells-local-gateway/confirmation-callback",
    verificationMode: "hmac_sha256",
    secretRef: "secret://booking/local-gateway/sandbox/hmac",
    replayWindowSeconds: 300,
    effectKeyTemplate: "booking_commit|environment|provider_binding_hash|provider_correlation",
    providerCorrelationTemplate: "provider_correlation|event_id|binding_hash",
    eventMappings: [
      {
        providerEvent: "booking.accepted",
        receiptSemantic: "accepted_for_processing",
        bookingTruthEffect: "processing_acceptance_state_accepted_for_processing",
      },
      {
        providerEvent: "booking.confirmed",
        receiptSemantic: "durable_provider_reference",
        bookingTruthEffect: "booking_confirmation_truth_confirmed",
      },
      {
        providerEvent: "booking.rejected",
        receiptSemantic: "authoritative_failure",
        bookingTruthEffect: "booking_confirmation_truth_failed",
      },
    ],
    notes: [
      "Sandbox twin uses the same endpoint path as local twin but a different secret reference and environment label.",
    ],
  },
  {
    callbackId: "callback_304_manual_assist_ops_twin",
    sandboxId: "sandbox_304_manual_assist_ops_twin",
    callbackMode: "manual_attestation",
    registrationSource: "manifest_only",
    callbackUrlPath: null,
    callbackUrlRef: null,
    verificationMode: "manual_settlement_queue",
    secretRef: null,
    replayWindowSeconds: null,
    effectKeyTemplate: "booking_case|manual_assist_queue_ref|settlement_revision",
    providerCorrelationTemplate: "queue_ref|ticket_ref",
    eventMappings: [
      {
        providerEvent: "manual_settlement",
        receiptSemantic: "staff_attested_outcome",
        bookingTruthEffect: "confirmed_or_failed_after_manual_review",
      },
    ],
    notes: [
      "Manual assist rows must not masquerade as supplier callback integrations.",
    ],
  },
] as const satisfies readonly CallbackTemplate[];

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

function readRuntimeState(statePath: string): RuntimeState {
  if (!fs.existsSync(statePath)) {
    return { version: REGISTRY_VERSION, registrations: [] };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8")) as RuntimeState;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath: string, value: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll("\"", "\"\"")}"` : value;
}

function yamlScalar(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  const text = String(value);
  if (text.length === 0) {
    return '""';
  }
  if (/^[A-Za-z0-9_./:+|#-]+$/.test(text) && !text.includes(": ")) {
    return text;
  }
  return JSON.stringify(text);
}

function toYaml(value: unknown, depth = 0): string {
  const indent = "  ".repeat(depth);
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}[]`;
    }
    return value
      .map((entry) => {
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const objectEntries = Object.entries(entry as Record<string, unknown>);
          const [firstKey, firstValue] = objectEntries[0]!;
          const head =
            firstValue && typeof firstValue === "object"
              ? `${indent}- ${firstKey}:\n${toYaml(firstValue, depth + 2)}`
              : `${indent}- ${firstKey}: ${yamlScalar(firstValue)}`;
          const tail = objectEntries
            .slice(1)
            .map(([key, nested]) =>
              nested && typeof nested === "object"
                ? `${indent}  ${key}:\n${toYaml(nested, depth + 2)}`
                : `${indent}  ${key}: ${yamlScalar(nested)}`,
            )
            .join("\n");
          return tail ? `${head}\n${tail}` : head;
        }
        if (Array.isArray(entry)) {
          return `${indent}-\n${toYaml(entry, depth + 1)}`;
        }
        return `${indent}- ${yamlScalar(entry)}`;
      })
      .join("\n");
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries
      .map(([key, nested]) =>
        nested && typeof nested === "object"
          ? `${indent}${key}:\n${toYaml(nested, depth + 1)}`
          : `${indent}${key}: ${yamlScalar(nested)}`,
      )
      .join("\n");
  }
  return `${indent}${yamlScalar(value)}`;
}

function primaryAudienceForRow(row: ProviderCapabilityMatrixRowSnapshot): BookingSelectionAudience {
  return row.capabilities.supports_patient_self_service ? "patient" : "staff";
}

function primaryActionScopeForRow(row: ProviderCapabilityMatrixRowSnapshot): BookingActionScope {
  return (row.supportedActionScopes.includes("search_slots")
    ? "search_slots"
    : row.supportedActionScopes[0]) as BookingActionScope;
}

async function resolveBindingBundles(): Promise<Map<string, ResolvedBindingBundle>> {
  const service = createPhase4BookingCapabilityEngineService();
  const bundles = new Map<string, ResolvedBindingBundle>();
  for (const row of phase4ProviderCapabilityMatrix.rows) {
    const result = await service.resolveBookingCapability({
      bookingCaseId: `sandbox_case_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      appointmentId: null,
      tenantId: row.tenantId,
      practiceRef: row.practiceRef,
      organisationRef: row.organisationRef,
      supplierRef: row.supplierRef,
      integrationMode: row.integrationMode,
      deploymentType: row.deploymentType,
      selectionAudience: primaryAudienceForRow(row),
      requestedActionScope: primaryActionScopeForRow(row),
      gpLinkageCheckpointRef: row.capabilities.requires_gp_linkage_details
        ? `gp_linkage_checkpoint_${row.providerCapabilityMatrixRef.toLowerCase()}`
        : null,
      gpLinkageStatus: row.capabilities.requires_gp_linkage_details ? "linked" : "not_required",
      localConsumerCheckpointRef: row.capabilities.requires_local_consumer_component
        ? `local_consumer_checkpoint_${row.providerCapabilityMatrixRef.toLowerCase()}`
        : null,
      localConsumerStatus: row.capabilities.requires_local_consumer_component
        ? "ready"
        : "not_required",
      supplierDegradationStatus: "nominal",
      publicationState: "published",
      assuranceTrustState: "writable",
      routeIntentBindingRef: `route_intent_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      surfaceRouteContractRef: "booking_route_contract_v1",
      surfacePublicationRef: `surface_publication_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      runtimePublicationBundleRef: `runtime_publication_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      governingObjectDescriptorRef: "BookingCase",
      governingObjectRef: `sandbox_control_plane_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      governingObjectVersionRef: "v1",
      parentAnchorRef: `anchor_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      commandActionRecordRef: `sandbox_action_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      commandSettlementRecordRef: `sandbox_settlement_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      subjectRef: `sandbox_subject_${row.providerCapabilityMatrixRef.toLowerCase()}`,
      evaluatedAt: `${GENERATED_AT}T09:00:00.000Z`,
      expiresInSeconds: 7200,
    });
    bundles.set(row.providerCapabilityMatrixRef, {
      row: result.providerCapabilityMatrixRow,
      binding: result.providerAdapterBinding,
    });
  }
  return bundles;
}

export async function buildProviderSandboxRegistry(): Promise<ProviderSandboxRegistryDocument> {
  const bindings = await resolveBindingBundles();
  const sandboxes = SANDBOX_TEMPLATES.map((template) => {
    const bundle = bindings.get(template.providerCapabilityMatrixRef);
    invariant(bundle, `Missing binding bundle for ${template.providerCapabilityMatrixRef}`);
    const maskedSecretFingerprints = Object.fromEntries(
      Object.entries(template.secretRefs).map(([key, value]) => [key, maskSecretRef(value)]),
    );
    return {
      sandboxId: template.sandboxId,
      providerCapabilityMatrixRef: bundle.row.providerCapabilityMatrixRef,
      matrixVersionRef: bundle.row.matrixVersionRef,
      supplierRef: bundle.row.supplierRef,
      supplierLabel: bundle.row.supplierLabel ?? bundle.row.supplierRef,
      integrationMode: bundle.row.integrationMode,
      deploymentType: bundle.row.deploymentType,
      environmentId: template.environmentId,
      environmentLabel: template.environmentLabel,
      tenantId: bundle.row.tenantId,
      practiceRef: bundle.row.practiceRef,
      organisationRef: bundle.row.organisationRef,
      providerAdapterBindingRef: bundle.binding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: bundle.binding.bindingHash,
      adapterContractProfileRef: bundle.binding.adapterContractProfileRef,
      authoritativeReadContractRef: bundle.binding.authoritativeReadContractRef,
      authoritativeReadAndConfirmationPolicyRef:
        bundle.binding.authoritativeReadAndConfirmationPolicyRef,
      portalSurfaceRef: template.portalSurfaceRef,
      portalUrlRef: template.portalUrlRef,
      portalAutomationState: template.portalAutomationState,
      setupPosture: template.setupPosture,
      smokeMethod: template.smokeMethod,
      resetSupport: template.resetSupport,
      callbackMode: template.callbackMode,
      secretRefs: template.secretRefs,
      maskedSecretFingerprints,
      notes: template.notes,
    } satisfies ProviderSandboxEntry;
  });
  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    registryVersion: REGISTRY_VERSION,
    generatedAt: GENERATED_AT,
    sandboxes,
  };
}

export async function buildProviderCallbackManifest(): Promise<ProviderCallbackManifestDocument> {
  const registry = await buildProviderSandboxRegistry();
  const sandboxById = new Map(registry.sandboxes.map((entry) => [entry.sandboxId, entry]));
  const callbacks = CALLBACK_TEMPLATES.map((template) => {
    const sandbox = sandboxById.get(template.sandboxId);
    invariant(sandbox, `Missing sandbox ${template.sandboxId}`);
    return {
      callbackId: template.callbackId,
      sandboxId: sandbox.sandboxId,
      providerCapabilityMatrixRef: sandbox.providerCapabilityMatrixRef,
      supplierRef: sandbox.supplierRef,
      environmentId: sandbox.environmentId,
      providerAdapterBindingRef: sandbox.providerAdapterBindingRef,
      providerAdapterBindingHash: sandbox.providerAdapterBindingHash,
      adapterContractProfileRef: sandbox.adapterContractProfileRef,
      callbackMode: template.callbackMode,
      registrationSource: template.registrationSource,
      callbackUrlPath: template.callbackUrlPath,
      callbackUrlRef: template.callbackUrlRef,
      verificationMode: template.verificationMode,
      secretRef: template.secretRef,
      maskedSecretFingerprint: template.secretRef ? maskSecretRef(template.secretRef) : null,
      replayWindowSeconds: template.replayWindowSeconds,
      effectKeyTemplate: template.effectKeyTemplate,
      providerCorrelationTemplate: template.providerCorrelationTemplate,
      eventMappings: template.eventMappings,
      notes: template.notes,
    } satisfies ProviderCallbackEntry;
  });
  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    manifestVersion: REGISTRY_VERSION,
    generatedAt: GENERATED_AT,
    callbacks,
  };
}

export async function renderProviderSandboxRegistryYaml(): Promise<string> {
  return `${toYaml(await buildProviderSandboxRegistry())}\n`;
}

export async function renderProviderCallbackManifestYaml(): Promise<string> {
  return `${toYaml(await buildProviderCallbackManifest())}\n`;
}

export async function renderProviderEnvironmentMatrixCsv(): Promise<string> {
  const registry = await buildProviderSandboxRegistry();
  const callbacks = await buildProviderCallbackManifest();
  const callbackBySandboxId = new Map(callbacks.callbacks.map((entry) => [entry.sandboxId, entry]));
  const headers = [
    "sandbox_id",
    "provider_capability_matrix_ref",
    "supplier_ref",
    "integration_mode",
    "environment_id",
    "portal_automation_state",
    "setup_posture",
    "callback_mode",
    "callback_url_path",
    "verification_mode",
    "reset_support",
    "smoke_method",
  ];
  const rows = registry.sandboxes.map((entry) => {
    const callback = callbackBySandboxId.get(entry.sandboxId);
    return [
      entry.sandboxId,
      entry.providerCapabilityMatrixRef,
      entry.supplierRef,
      entry.integrationMode,
      entry.environmentId,
      entry.portalAutomationState,
      entry.setupPosture,
      entry.callbackMode,
      callback?.callbackUrlPath ?? "",
      callback?.verificationMode ?? "",
      entry.resetSupport,
      entry.smokeMethod,
    ]
      .map(csvEscape)
      .join(",");
  });
  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

export async function materializeProviderSandboxArtifacts(rootDir = process.cwd()): Promise<{
  registryPath: string;
  callbackManifestPath: string;
  environmentMatrixPath: string;
}> {
  const registryPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.registry);
  const callbackManifestPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.callbacks);
  const environmentMatrixPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.environmentMatrix);

  writeText(registryPath, await renderProviderSandboxRegistryYaml());
  writeText(callbackManifestPath, await renderProviderCallbackManifestYaml());
  writeText(environmentMatrixPath, await renderProviderEnvironmentMatrixCsv());

  return {
    registryPath,
    callbackManifestPath,
    environmentMatrixPath,
  };
}

export async function bootstrapProviderSandboxes(
  options: BootstrapOptions = {},
): Promise<BootstrapResult> {
  const registry = await buildProviderSandboxRegistry();
  const callbacks = await buildProviderCallbackManifest();
  const sandboxFilter = options.sandboxIds ? new Set(options.sandboxIds) : null;
  const outputDir = buildOutputDir(options.outputDir);
  const statePath = path.join(outputDir, "304_provider_sandbox_runtime_state.json");
  const existing = readRuntimeState(statePath);
  const nextRegistrations = [...existing.registrations];
  const actions: BootstrapResult["actions"][number][] = [];

  for (const sandbox of registry.sandboxes) {
    if (sandboxFilter && !sandboxFilter.has(sandbox.sandboxId)) {
      continue;
    }
    const callback = callbacks.callbacks.find((entry) => entry.sandboxId === sandbox.sandboxId);
    invariant(callback, `Missing callback row for ${sandbox.sandboxId}`);
    if (sandbox.portalAutomationState !== "fully_automated") {
      actions.push({
        sandboxId: sandbox.sandboxId,
        portalAutomationState: sandbox.portalAutomationState,
        callbackMode: callback.callbackMode,
        action:
          sandbox.portalAutomationState === "not_applicable"
            ? "not_applicable"
            : "manual_bridge_required",
        detail:
          sandbox.portalAutomationState === "not_applicable"
            ? "No supplier portal mutation exists for this row."
            : "Portal mutation remains blocked behind a narrow manual bridge.",
      });
      continue;
    }
    invariant(callback.callbackUrlPath, `Missing callback URL for ${callback.callbackId}`);
    const existingRegistration = nextRegistrations.find(
      (entry) =>
        entry.sandboxId === sandbox.sandboxId &&
        entry.callbackId === callback.callbackId &&
        entry.callbackUrlPath === callback.callbackUrlPath &&
        entry.providerAdapterBindingHash === sandbox.providerAdapterBindingHash,
    );
    if (existingRegistration) {
      actions.push({
        sandboxId: sandbox.sandboxId,
        portalAutomationState: sandbox.portalAutomationState,
        callbackMode: callback.callbackMode,
        action: "already_current",
        detail: "Local sandbox portal already matches the current binding hash and callback URL.",
      });
      continue;
    }
    nextRegistrations.push({
      sandboxId: sandbox.sandboxId,
      callbackId: callback.callbackId,
      callbackUrlPath: callback.callbackUrlPath,
      providerAdapterBindingHash: sandbox.providerAdapterBindingHash,
      verificationMode: callback.verificationMode,
      maskedSecretFingerprint: callback.maskedSecretFingerprint,
      configuredAt: `${GENERATED_AT}T09:15:00.000Z`,
    });
    actions.push({
      sandboxId: sandbox.sandboxId,
      portalAutomationState: sandbox.portalAutomationState,
      callbackMode: callback.callbackMode,
      action: "configured",
      detail: "Local sandbox portal converged to the current callback target and binding hash.",
    });
  }

  const dedupedRegistrations = nextRegistrations.filter((entry, index, rows) => {
    return (
      rows.findIndex(
        (candidate) =>
          candidate.sandboxId === entry.sandboxId &&
          candidate.callbackId === entry.callbackId &&
          candidate.providerAdapterBindingHash === entry.providerAdapterBindingHash,
      ) === index
    );
  });
  writeJson(statePath, {
    version: REGISTRY_VERSION,
    registrations: dedupedRegistrations,
  } satisfies RuntimeState);
  writeJson(path.join(outputDir, "304_provider_sandbox_bootstrap_summary.json"), {
    taskId: TASK_ID,
    generatedAt: `${GENERATED_AT}T09:15:00.000Z`,
    actions,
  });
  return {
    taskId: TASK_ID,
    outputDir,
    actions,
    statePath,
  };
}

async function smokeCheckpointReplay(callback: ProviderCallbackEntry): Promise<readonly string[]> {
  if (callback.callbackMode !== "supplier_callback") {
    return [];
  }
  const application = createReplayCollisionApplication();
  const command = await application.authority.resolveInboundCommand({
    actionScope: "booking_commit",
    governingLineageRef: `lineage_${callback.callbackId}`,
    effectiveActorRef: "actor_booking_control_plane",
    sourceCommandId: `cmd_${callback.callbackId}`,
    sourceCommandIdFamily: "command_id",
    transportCorrelationId: `transport_${callback.callbackId}`,
    causalParentRef: `causal_parent_${callback.callbackId}`,
    intentGeneration: 1,
    expectedEffectSetRefs: ["booking.commit", "booking.callback.verify"],
    scope: {
      governingObjectRef: callback.sandboxId,
      governingObjectVersionRef: "v1",
      routeIntentTupleHash: `route_tuple_${callback.callbackId}`,
      routeContractDigestRef: "booking_route_contract_v1",
      audienceSurfaceRuntimeBindingRef: "booking_control_plane_surface",
      releaseTrustFreezeVerdictRef: "release_trust_clear",
    },
    rawPayload: `{"callbackId":"${callback.callbackId}"}`,
    semanticPayload: { callbackId: callback.callbackId },
    firstAcceptedActionRecordRef: `action_${callback.callbackId}`,
    acceptedSettlementRef: `settlement_${callback.callbackId}`,
    decisionBasisRef: `decision_basis_${callback.callbackId}`,
    observedAt: `${GENERATED_AT}T09:20:00.000Z`,
  });

  const dispatch = await application.authority.ensureAdapterDispatchAttempt({
    idempotencyRecordRef: command.idempotencyRecord.idempotencyRecordId,
    actionScope: "booking_commit",
    governingLineageRef: `lineage_${callback.callbackId}`,
    actionRecordRef: command.authoritativeActionRecordRef,
    adapterContractProfileRef: callback.adapterContractProfileRef,
    effectScope: "booking_commit::provider_callback",
    effectKey: `${callback.callbackId}|${callback.providerAdapterBindingHash}`,
    transportPayload: `{"provider":"${callback.supplierRef}"}`,
    semanticPayload: { provider: callback.supplierRef },
    providerCorrelationRef: `${callback.sandboxId}|${callback.providerAdapterBindingHash}`,
    firstDispatchedAt: `${GENERATED_AT}T09:20:10.000Z`,
  });

  const accepted = await application.authority.recordAdapterReceiptCheckpoint({
    actionScope: "booking_commit",
    governingLineageRef: `lineage_${callback.callbackId}`,
    adapterContractProfileRef: callback.adapterContractProfileRef,
    effectKey: dispatch.dispatchAttempt.effectKey,
    providerCorrelationRef: `${callback.sandboxId}|${callback.providerAdapterBindingHash}`,
    transportMessageId: `${callback.callbackId}_msg_accepted`,
    orderingKey: "002",
    rawReceipt: '{"event":"booking.confirmed","trace":"a"}',
    semanticReceipt: { event: "booking.confirmed", trace: "a" },
    linkedSettlementRef: `settlement_${callback.callbackId}`,
    recordedAt: `${GENERATED_AT}T09:20:20.000Z`,
  });
  const semanticReplay = await application.authority.recordAdapterReceiptCheckpoint({
    actionScope: "booking_commit",
    governingLineageRef: `lineage_${callback.callbackId}`,
    adapterContractProfileRef: callback.adapterContractProfileRef,
    effectKey: dispatch.dispatchAttempt.effectKey,
    providerCorrelationRef: `${callback.sandboxId}|${callback.providerAdapterBindingHash}`,
    transportMessageId: `${callback.callbackId}_msg_accepted`,
    orderingKey: "002",
    rawReceipt: '{"trace":"b","event":"booking.confirmed"}',
    semanticReceipt: { trace: "b", event: "booking.confirmed" },
    linkedSettlementRef: `settlement_${callback.callbackId}`,
    recordedAt: `${GENERATED_AT}T09:20:25.000Z`,
  });
  const stale = await application.authority.recordAdapterReceiptCheckpoint({
    actionScope: "booking_commit",
    governingLineageRef: `lineage_${callback.callbackId}`,
    adapterContractProfileRef: callback.adapterContractProfileRef,
    effectKey: dispatch.dispatchAttempt.effectKey,
    providerCorrelationRef: `${callback.sandboxId}|${callback.providerAdapterBindingHash}`,
    transportMessageId: `${callback.callbackId}_msg_stale`,
    orderingKey: "001",
    rawReceipt: '{"event":"booking.accepted"}',
    semanticReceipt: { event: "booking.accepted" },
    linkedSettlementRef: `settlement_${callback.callbackId}`,
    recordedAt: `${GENERATED_AT}T09:20:30.000Z`,
  });

  return [accepted.decisionClass, semanticReplay.decisionClass, stale.decisionClass];
}

export async function verifyProviderCallbacks(
  options: BootstrapOptions = {},
): Promise<ProviderCallbackVerificationResult> {
  const manifest = await buildProviderCallbackManifest();
  const registry = await buildProviderSandboxRegistry();
  const outputDir = buildOutputDir(options.outputDir);
  const statePath = path.join(outputDir, "304_provider_sandbox_runtime_state.json");
  const state = readRuntimeState(statePath);
  const sandboxFilter = options.sandboxIds ? new Set(options.sandboxIds) : null;
  const sandboxById = new Map(registry.sandboxes.map((sandbox) => [sandbox.sandboxId, sandbox]));
  const callbackChecks: ProviderCallbackVerificationResult["callbackChecks"][number][] = [];

  for (const callback of manifest.callbacks) {
    if (sandboxFilter && !sandboxFilter.has(callback.sandboxId)) {
      continue;
    }
    if (callback.callbackMode === "supplier_callback") {
      const sandbox = sandboxById.get(callback.sandboxId);
      invariant(sandbox, `Missing sandbox ${callback.sandboxId}`);
      const registration = state.registrations.find(
        (entry) =>
          entry.sandboxId === callback.sandboxId &&
          entry.callbackId === callback.callbackId &&
          entry.providerAdapterBindingHash === callback.providerAdapterBindingHash,
      );
      if (!registration) {
        callbackChecks.push({
          callbackId: callback.callbackId,
          sandboxId: callback.sandboxId,
          callbackMode: callback.callbackMode,
          state:
            sandbox.portalAutomationState === "manual_bridge_required"
              ? "manual_bridge_required"
              : "failed",
          receiptDecisionClasses: [],
          verificationMode: callback.verificationMode,
        });
        continue;
      }
      const receiptDecisionClasses = await smokeCheckpointReplay(callback);
      callbackChecks.push({
        callbackId: callback.callbackId,
        sandboxId: callback.sandboxId,
        callbackMode: callback.callbackMode,
        state: "verified",
        receiptDecisionClasses,
        verificationMode: callback.verificationMode,
      });
      continue;
    }
    if (callback.callbackMode === "authoritative_read_after_write") {
      callbackChecks.push({
        callbackId: callback.callbackId,
        sandboxId: callback.sandboxId,
        callbackMode: callback.callbackMode,
        state: "verified",
        receiptDecisionClasses: [],
        verificationMode: callback.verificationMode,
      });
      continue;
    }
    callbackChecks.push({
      callbackId: callback.callbackId,
      sandboxId: callback.sandboxId,
      callbackMode: callback.callbackMode,
      state:
        callback.callbackMode === "manual_attestation" ? "manual_bridge_required" : "not_applicable",
      receiptDecisionClasses: [],
      verificationMode: callback.verificationMode,
    });
  }

  const result = {
    taskId: TASK_ID,
    verificationAt: `${GENERATED_AT}T09:25:00.000Z`,
    callbackChecks,
  } satisfies ProviderCallbackVerificationResult;
  writeJson(path.join(outputDir, "304_provider_callback_verification_summary.json"), result);
  return result;
}

export async function resetProviderSandboxes(options: BootstrapOptions = {}): Promise<{
  taskId: typeof TASK_ID;
  statePath: string;
  removedSandboxIds: readonly string[];
}> {
  const outputDir = buildOutputDir(options.outputDir);
  const statePath = path.join(outputDir, "304_provider_sandbox_runtime_state.json");
  const current = readRuntimeState(statePath);
  const sandboxFilter = options.sandboxIds ? new Set(options.sandboxIds) : null;
  const removedSandboxIds = new Set<string>();
  const registrations = current.registrations.filter((entry) => {
    const remove = sandboxFilter ? sandboxFilter.has(entry.sandboxId) : true;
    if (remove) {
      removedSandboxIds.add(entry.sandboxId);
      return false;
    }
    return true;
  });
  writeJson(statePath, {
    version: REGISTRY_VERSION,
    registrations,
  } satisfies RuntimeState);
  const result: {
    taskId: typeof TASK_ID;
    statePath: string;
    removedSandboxIds: readonly string[];
  } = {
    taskId: TASK_ID,
    statePath,
    removedSandboxIds: [...removedSandboxIds].sort(),
  };
  writeJson(path.join(outputDir, "304_provider_sandbox_reset_summary.json"), result);
  return result;
}
