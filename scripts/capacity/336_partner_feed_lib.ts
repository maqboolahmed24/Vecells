import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import type {
  CapacitySourceTrustRecordInput,
  HubCapacityAdapterBindingSnapshot,
  HubCapacityRawSupplyRow,
  HubCapacitySourceMode,
  ManageCapabilityState,
} from "../../packages/domains/hub_coordination/src/phase5-network-capacity-pipeline.ts";

export const TASK_ID = "seq_336";
export const FULL_TASK_ID =
  "seq_336_phase5_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_network_capacity_feeds_and_partner_credentials";
export const SCHEMA_VERSION = "336.phase5.partner-feed-configuration.v1";
export const GENERATED_AT = "2026-04-23";
export const REGISTRY_VERSION = "336-phase5-partner-feed-control-plane-2026-04-23.v1";
export const OUTPUT_DIR = ".artifacts/capacity/336";
export const SOURCE_OUTPUT_PATHS = {
  registry: "ops/capacity/336_partner_feed_registry.yaml",
  credentials: "ops/capacity/336_partner_credential_manifest.yaml",
  siteServiceMap: "ops/capacity/336_partner_site_service_map.csv",
  contract: "data/contracts/336_capacity_feed_configuration_contract.json",
  gapRegister: "data/analysis/336_partner_feed_gap_register.json",
  interfaceGap:
    "data/analysis/PHASE5_BATCH_332_339_INTERFACE_GAP_PARTNER_FEED_PORTAL_AUTOMATION.json",
} as const;

const BASE_TIME = Date.parse("2026-04-23T10:00:00.000Z");

export type PartnerFeedEnvironmentId =
  | "local_twin"
  | "supported_test_candidate"
  | "integration_candidate";

export type PartnerPortalAutomationState =
  | "fully_automated"
  | "manual_bridge_required"
  | "not_required";

export type PartnerFeedVerificationState =
  | "verified"
  | "manifest_ready"
  | "manual_bridge_required"
  | "preflight_only"
  | "unsupported"
  | "failed";

export type PartnerFeedTrustState = "trusted" | "degraded" | "quarantined" | "unsupported";

export type PartnerFeedTransportMode =
  | "pull_fhir_poll"
  | "portal_export_sync"
  | "manual_board_curated"
  | "sftp_batch_import";

export type PartnerFeedAuthMode =
  | "signed_jwt_tls_mutual_auth"
  | "portal_credentials_plus_api_key"
  | "portal_credentials_only"
  | "manual_board_operator_session"
  | "sftp_keypair_and_dropbox"
  | "disabled_placeholder";

export interface PartnerFeedEntry {
  readonly feedId: string;
  readonly partnerRef: string;
  readonly partnerLabel: string;
  readonly environmentId: PartnerFeedEnvironmentId;
  readonly environmentLabel: string;
  readonly sourceMode: HubCapacitySourceMode;
  readonly transportMode: PartnerFeedTransportMode;
  readonly authMode: PartnerFeedAuthMode;
  readonly endpointIdentity: string;
  readonly endpointLocator: string;
  readonly adapterIdentity: string;
  readonly adapterBindingRef: string;
  readonly adapterBindingHash: string;
  readonly credentialBundleId: string;
  readonly sourceVersion: string;
  readonly scheduleRef: string;
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly portalAutomationState: PartnerPortalAutomationState;
  readonly verificationState: PartnerFeedVerificationState;
  readonly trustAdmissionState: PartnerFeedTrustState;
  readonly odsCode: string;
  readonly siteRef: string;
  readonly serviceRef: string;
  readonly siteLabel: string;
  readonly serviceLabel: string;
  readonly mappingRowRefs: readonly string[];
  readonly notes: readonly string[];
}

export interface PartnerCredentialEntry {
  readonly credentialId: string;
  readonly feedId: string;
  readonly credentialType: string;
  readonly purpose: string;
  readonly secretRef: string;
  readonly maskedFingerprint: string;
  readonly ownerRole: string;
  readonly rotationCadenceDays: number;
  readonly expiresAt: string;
  readonly notes: readonly string[];
}

export interface PartnerSiteServiceMapRow {
  readonly mappingId: string;
  readonly feedId: string;
  readonly environmentId: PartnerFeedEnvironmentId;
  readonly partnerRef: string;
  readonly odsCode: string;
  readonly siteRef: string;
  readonly siteLabel: string;
  readonly serviceRef: string;
  readonly serviceLabel: string;
  readonly endpointIdentity: string;
  readonly adapterIdentity: string;
  readonly sourceMode: HubCapacitySourceMode;
  readonly trustAdmissionState: PartnerFeedTrustState;
  readonly verificationState: PartnerFeedVerificationState;
}

export interface CapacityFeedConfigurationContract {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly registryRef: string;
  readonly credentialManifestRef: string;
  readonly siteServiceMapRef: string;
  readonly gapRegisterRef: string;
  readonly interfaceGapRef: string;
  readonly supportedEnvironmentIds: readonly PartnerFeedEnvironmentId[];
  readonly sourceModes: readonly HubCapacitySourceMode[];
  readonly automatedFeedIds: readonly string[];
  readonly manualBridgeFeedIds: readonly string[];
  readonly unsupportedFeedIds: readonly string[];
  readonly admissionManifest: readonly {
    trustAdmissionState: PartnerFeedTrustState;
    sourceMode: HubCapacitySourceMode;
    feedIds: readonly string[];
  }[];
  readonly sourceRefs: readonly string[];
}

export interface PartnerFeedGapRegister {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly gaps: readonly {
    gapId: string;
    category:
      | "supplier_portal"
      | "api_onboarding"
      | "unsupported_feed"
      | "security_review";
    state: "manual_bridge_required" | "explicitly_unsupported" | "review_required";
    affectedFeedIds: readonly string[];
    summary: string;
    fallback: string;
    followUpAction: string;
  }[];
}

export interface PartnerFeedPortalAutomationGap {
  readonly taskId: typeof FULL_TASK_ID;
  readonly gapId: "PHASE5_BATCH_332_339_INTERFACE_GAP_PARTNER_FEED_PORTAL_AUTOMATION";
  readonly missingSurface: string;
  readonly expectedOwnerTask: typeof FULL_TASK_ID;
  readonly temporaryFallback: string;
  readonly riskIfUnresolved: string;
  readonly followUpAction: string;
  readonly affectedFeedIds: readonly string[];
  readonly blockedCapabilities: readonly string[];
}

export interface PartnerFeedRegistryDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly registryVersion: string;
  readonly generatedAt: string;
  readonly feeds: readonly PartnerFeedEntry[];
}

export interface PartnerCredentialManifestDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly credentials: readonly PartnerCredentialEntry[];
}

interface PartnerFeedTemplate {
  readonly feedId: string;
  readonly partnerRef: string;
  readonly partnerLabel: string;
  readonly environmentId: PartnerFeedEnvironmentId;
  readonly environmentLabel: string;
  readonly sourceMode: HubCapacitySourceMode;
  readonly transportMode: PartnerFeedTransportMode;
  readonly authMode: PartnerFeedAuthMode;
  readonly endpointIdentity: string;
  readonly endpointLocator: string;
  readonly adapterIdentity: string;
  readonly credentialBundleId: string;
  readonly sourceVersion: string;
  readonly scheduleRef: string;
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly portalAutomationState: PartnerPortalAutomationState;
  readonly verificationState: PartnerFeedVerificationState;
  readonly trustAdmissionState: PartnerFeedTrustState;
  readonly odsCode: string;
  readonly siteRef: string;
  readonly siteLabel: string;
  readonly serviceRef: string;
  readonly serviceLabel: string;
  readonly notes: readonly string[];
  readonly sample: {
    readonly startMinute: number;
    readonly durationMinutes: number;
    readonly manageCapabilityState: ManageCapabilityState;
    readonly accessibilityFitScore: number;
    readonly travelMinutes: number;
    readonly modality: string;
    readonly clinicianType: string;
  };
}

interface PartnerCredentialTemplate {
  readonly credentialId: string;
  readonly feedId: string;
  readonly credentialType: string;
  readonly purpose: string;
  readonly secretRef: string;
  readonly ownerRole: string;
  readonly rotationCadenceDays: number;
  readonly expiresAt: string;
  readonly notes: readonly string[];
}

interface PartnerFeedRuntimeStateRow {
  readonly feedId: string;
  readonly adapterBindingHash: string;
  readonly endpointIdentity: string;
  readonly adapterIdentity: string;
  readonly sourceMode: HubCapacitySourceMode;
  readonly trustAdmissionState: PartnerFeedTrustState;
  readonly configuredAt: string;
}

interface PartnerFeedRuntimeState {
  readonly version: typeof REGISTRY_VERSION;
  readonly feeds: readonly PartnerFeedRuntimeStateRow[];
}

export interface PartnerFeedBootstrapResult {
  readonly taskId: typeof TASK_ID;
  readonly outputDir: string;
  readonly statePath: string;
  readonly actions: readonly {
    feedId: string;
    partnerRef: string;
    action:
      | "configured"
      | "already_current"
      | "manual_bridge_required"
      | "unsupported"
      | "not_required";
    detail: string;
  }[];
}

export interface PartnerFeedVerificationSummary {
  readonly taskId: typeof TASK_ID;
  readonly verificationAt: string;
  readonly sourceAdmissionDispositions: readonly {
    feedId: string;
    sourceRef: string;
    sourceIdentity: string;
    admissionDisposition: string;
    sourceTrustState: string;
    sourceFreshnessState: string;
  }[];
  readonly feedChecks: readonly {
    feedId: string;
    verificationState: PartnerFeedVerificationState;
    trustAdmissionState: PartnerFeedTrustState;
    decisionClasses: readonly string[];
    samplePayloadRef: string;
  }[];
  readonly snapshotId: string | null;
  readonly decisionPlanId: string | null;
  readonly capacityRankProofId: string | null;
}

interface BootstrapOptions {
  readonly outputDir?: string;
  readonly feedIds?: readonly string[];
}

interface InternalSmokeScenario {
  readonly bindings: readonly HubCapacityAdapterBindingSnapshot[];
  readonly expectedFeedIds: readonly string[];
}

function atMinute(minuteOffset: number): string {
  return new Date(BASE_TIME + minuteOffset * 60_000).toISOString();
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function maskedFingerprint(value: string): string {
  return `sha256:${sha256Hex(value).slice(0, 12)}`;
}

function stableStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function ensureDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath: string, contents: string): void {
  ensureDir(filePath);
  fs.writeFileSync(filePath, contents);
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function buildOutputDir(outputDir = OUTPUT_DIR): string {
  return path.isAbsolute(outputDir) ? outputDir : path.join(process.cwd(), outputDir);
}

function toneFromTrustState(state: PartnerFeedTrustState): string {
  switch (state) {
    case "trusted":
      return "trusted_offerable";
    case "degraded":
      return "degraded_diagnostic_only";
    case "quarantined":
      return "quarantined_hidden";
    case "unsupported":
      return "unsupported";
  }
}

const FEED_TEMPLATES = [
  {
    feedId: "feed_336_gp_connect_local_twin",
    partnerRef: "gp_connect_existing",
    partnerLabel: "GP Connect Appointment Management",
    environmentId: "local_twin",
    environmentLabel: "Local INT twin",
    sourceMode: "native_api_feed",
    transportMode: "pull_fhir_poll",
    authMode: "signed_jwt_tls_mutual_auth",
    endpointIdentity: "gpconnect:int:appointment-management:a83002",
    endpointLocator: "https://int.api.service.nhs.uk/",
    adapterIdentity: "phase5.capacity.native.gp_connect.int",
    credentialBundleId: "cred_bundle_336_gp_connect_local_twin",
    sourceVersion: "int.2026-04-23.v1",
    scheduleRef: "every_5_minutes",
    portalSurfaceRef: "portal://capacity/not-required/gp-connect-int",
    portalUrlRef: "not_required",
    portalAutomationState: "not_required",
    verificationState: "verified",
    trustAdmissionState: "trusted",
    odsCode: "A83002",
    siteRef: "site_336_hub_local_a",
    siteLabel: "Vecells Hub Local A",
    serviceRef: "service_336_extended_access_evening",
    serviceLabel: "Extended Access Evening",
    notes: [
      "Uses the current INT base URL and the appointment-management contract path.",
      "JWT, ODS, and adapter identity remain bound even in the local twin.",
    ],
    sample: {
      startMinute: 18,
      durationMinutes: 30,
      manageCapabilityState: "network_manage_ready",
      accessibilityFitScore: 0.88,
      travelMinutes: 14,
      modality: "in_person",
      clinicianType: "general_practice",
    },
  },
  {
    feedId: "feed_336_optum_local_twin",
    partnerRef: "optum_emis_web",
    partnerLabel: "Optum EMIS Web supported-test sync",
    environmentId: "local_twin",
    environmentLabel: "Local supplier portal twin",
    sourceMode: "partner_schedule_sync",
    transportMode: "portal_export_sync",
    authMode: "portal_credentials_plus_api_key",
    endpointIdentity: "partner:optum-emis:supported-test:capacity-sync",
    endpointLocator: "local-twin://partner/optum-emis/capacity-sync",
    adapterIdentity: "phase5.capacity.partner.optum.schedule-sync",
    credentialBundleId: "cred_bundle_336_optum_local_twin",
    sourceVersion: "supported-test.2026-04-23.v1",
    scheduleRef: "every_15_minutes",
    portalSurfaceRef: "portal://capacity/optum/local-twin",
    portalUrlRef: "https://portal.optum-capacity.example.invalid/local-twin",
    portalAutomationState: "fully_automated",
    verificationState: "verified",
    trustAdmissionState: "trusted",
    odsCode: "A83002",
    siteRef: "site_336_optum_local_a",
    siteLabel: "Optum Federation Site A",
    serviceRef: "service_336_routine_gp",
    serviceLabel: "Routine GP Capacity",
    notes: [
      "Masked local portal twin stands in for the real supplier-admin path.",
      "Bootstrap is convergent and keyed to the manifest binding hash.",
    ],
    sample: {
      startMinute: 21,
      durationMinutes: 30,
      manageCapabilityState: "network_manage_ready",
      accessibilityFitScore: 0.92,
      travelMinutes: 16,
      modality: "in_person",
      clinicianType: "general_practice",
    },
  },
  {
    feedId: "feed_336_tpp_local_twin",
    partnerRef: "tpp_systmone",
    partnerLabel: "TPP SystmOne supported-test sync",
    environmentId: "local_twin",
    environmentLabel: "Local supplier portal twin",
    sourceMode: "partner_schedule_sync",
    transportMode: "portal_export_sync",
    authMode: "portal_credentials_plus_api_key",
    endpointIdentity: "partner:tpp-systmone:supported-test:capacity-sync",
    endpointLocator: "local-twin://partner/tpp-systmone/capacity-sync",
    adapterIdentity: "phase5.capacity.partner.tpp.schedule-sync",
    credentialBundleId: "cred_bundle_336_tpp_local_twin",
    sourceVersion: "supported-test.2026-04-23.v1",
    scheduleRef: "every_15_minutes",
    portalSurfaceRef: "portal://capacity/tpp/local-twin",
    portalUrlRef: "https://portal.tpp-capacity.example.invalid/local-twin",
    portalAutomationState: "fully_automated",
    verificationState: "verified",
    trustAdmissionState: "degraded",
    odsCode: "A83002",
    siteRef: "site_336_tpp_local_a",
    siteLabel: "TPP Federation Site A",
    serviceRef: "service_336_extended_access_remote",
    serviceLabel: "Extended Access Remote",
    notes: [
      "This row stays diagnostically visible but cannot be represented as normal offerable truth.",
      "Portal bootstrap remains automated only in the masked local twin.",
    ],
    sample: {
      startMinute: 24,
      durationMinutes: 30,
      manageCapabilityState: "read_only",
      accessibilityFitScore: 0.75,
      travelMinutes: 19,
      modality: "telephone",
      clinicianType: "general_practice",
    },
  },
  {
    feedId: "feed_336_manual_board_local_twin",
    partnerRef: "vecells_manual_capacity_board",
    partnerLabel: "Vecells manual capacity board",
    environmentId: "local_twin",
    environmentLabel: "Local operations twin",
    sourceMode: "manual_capacity_board",
    transportMode: "manual_board_curated",
    authMode: "manual_board_operator_session",
    endpointIdentity: "ops:manual-board:network-capacity",
    endpointLocator: "local-twin://ops/manual-capacity-board",
    adapterIdentity: "phase5.capacity.manual.board",
    credentialBundleId: "cred_bundle_336_manual_board_local_twin",
    sourceVersion: "ops-board.2026-04-23.v1",
    scheduleRef: "operator_refresh_30_minutes",
    portalSurfaceRef: "portal://capacity/manual-board/local-twin",
    portalUrlRef: "not_required",
    portalAutomationState: "not_required",
    verificationState: "verified",
    trustAdmissionState: "trusted",
    odsCode: "A83002",
    siteRef: "site_336_manual_board_a",
    siteLabel: "Hub Desk Board A",
    serviceRef: "service_336_makeup_cover",
    serviceLabel: "Make-up Cover Session",
    notes: [
      "Manual board rows remain authoritative only while operator settlement and binding hash are current.",
      "The board adapter shares the same site and service map contract as API feeds.",
    ],
    sample: {
      startMinute: 27,
      durationMinutes: 30,
      manageCapabilityState: "read_only",
      accessibilityFitScore: 1,
      travelMinutes: 8,
      modality: "video",
      clinicianType: "advanced_nurse_practitioner",
    },
  },
  {
    feedId: "feed_336_batch_import_local_twin",
    partnerRef: "vecells_batched_capacity_import",
    partnerLabel: "Vecells batched import",
    environmentId: "local_twin",
    environmentLabel: "Local import twin",
    sourceMode: "batched_capacity_import",
    transportMode: "sftp_batch_import",
    authMode: "sftp_keypair_and_dropbox",
    endpointIdentity: "dropbox:capacity-import:network-horizon",
    endpointLocator: "local-twin://dropbox/network-capacity-import",
    adapterIdentity: "phase5.capacity.batch.import",
    credentialBundleId: "cred_bundle_336_batch_import_local_twin",
    sourceVersion: "dropbox.2026-04-23.v1",
    scheduleRef: "hourly_dropbox_ingest",
    portalSurfaceRef: "portal://capacity/import/local-twin",
    portalUrlRef: "not_required",
    portalAutomationState: "not_required",
    verificationState: "verified",
    trustAdmissionState: "quarantined",
    odsCode: "A83002",
    siteRef: "site_336_batch_import_a",
    siteLabel: "Imported Capacity Site A",
    serviceRef: "service_336_import_fallback",
    serviceLabel: "Imported Fallback Capacity",
    notes: [
      "This row proves quarantined supply is explicit configuration, not an accidental runtime surprise.",
      "Batch import rows are hidden from calm offerability until trust is restored.",
    ],
    sample: {
      startMinute: 30,
      durationMinutes: 30,
      manageCapabilityState: "blocked",
      accessibilityFitScore: 0.61,
      travelMinutes: 20,
      modality: "in_person",
      clinicianType: "general_practice",
    },
  },
  {
    feedId: "feed_336_optum_supported_test",
    partnerRef: "optum_emis_web",
    partnerLabel: "Optum EMIS Web supported-test sync",
    environmentId: "supported_test_candidate",
    environmentLabel: "Supplier supported test",
    sourceMode: "partner_schedule_sync",
    transportMode: "portal_export_sync",
    authMode: "portal_credentials_plus_api_key",
    endpointIdentity: "partner:optum-emis:supported-test:capacity-sync",
    endpointLocator: "https://portal.optum-capacity.example.invalid/supported-test",
    adapterIdentity: "phase5.capacity.partner.optum.schedule-sync",
    credentialBundleId: "cred_bundle_336_optum_supported_test",
    sourceVersion: "supported-test.2026-04-23.v1",
    scheduleRef: "every_15_minutes",
    portalSurfaceRef: "portal://capacity/optum/supported-test",
    portalUrlRef: "https://portal.optum-capacity.example.invalid/supported-test",
    portalAutomationState: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    trustAdmissionState: "trusted",
    odsCode: "A83002",
    siteRef: "site_336_optum_supported_a",
    siteLabel: "Optum Supported-Test Site A",
    serviceRef: "service_336_routine_gp",
    serviceLabel: "Routine GP Capacity",
    notes: [
      "Real supplier-admin steps remain outside unattended mutation and must stay manual-bridge bound.",
      "The manifest is still authoritative for endpoint, adapter, and credential bundle identity.",
    ],
    sample: {
      startMinute: 33,
      durationMinutes: 30,
      manageCapabilityState: "network_manage_ready",
      accessibilityFitScore: 0.9,
      travelMinutes: 14,
      modality: "in_person",
      clinicianType: "general_practice",
    },
  },
  {
    feedId: "feed_336_tpp_supported_test",
    partnerRef: "tpp_systmone",
    partnerLabel: "TPP SystmOne supported-test sync",
    environmentId: "supported_test_candidate",
    environmentLabel: "Supplier supported test",
    sourceMode: "partner_schedule_sync",
    transportMode: "portal_export_sync",
    authMode: "portal_credentials_plus_api_key",
    endpointIdentity: "partner:tpp-systmone:supported-test:capacity-sync",
    endpointLocator: "https://portal.tpp-capacity.example.invalid/supported-test",
    adapterIdentity: "phase5.capacity.partner.tpp.schedule-sync",
    credentialBundleId: "cred_bundle_336_tpp_supported_test",
    sourceVersion: "supported-test.2026-04-23.v1",
    scheduleRef: "every_15_minutes",
    portalSurfaceRef: "portal://capacity/tpp/supported-test",
    portalUrlRef: "https://portal.tpp-capacity.example.invalid/supported-test",
    portalAutomationState: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    trustAdmissionState: "degraded",
    odsCode: "A83002",
    siteRef: "site_336_tpp_supported_a",
    siteLabel: "TPP Supported-Test Site A",
    serviceRef: "service_336_extended_access_remote",
    serviceLabel: "Extended Access Remote",
    notes: [
      "This path remains manual-bridge and diagnostically bounded until supported-test proof closes the degraded posture.",
      "The repo must not infer ordinary offerability from portal visibility alone.",
    ],
    sample: {
      startMinute: 36,
      durationMinutes: 30,
      manageCapabilityState: "read_only",
      accessibilityFitScore: 0.7,
      travelMinutes: 21,
      modality: "telephone",
      clinicianType: "general_practice",
    },
  },
  {
    feedId: "feed_336_gp_connect_int_candidate",
    partnerRef: "gp_connect_existing",
    partnerLabel: "GP Connect Appointment Management",
    environmentId: "integration_candidate",
    environmentLabel: "NHS integration candidate",
    sourceMode: "native_api_feed",
    transportMode: "pull_fhir_poll",
    authMode: "signed_jwt_tls_mutual_auth",
    endpointIdentity: "gpconnect:int:appointment-management:integration-candidate",
    endpointLocator: "https://int.api.service.nhs.uk/",
    adapterIdentity: "phase5.capacity.native.gp_connect.int",
    credentialBundleId: "cred_bundle_336_gp_connect_int_candidate",
    sourceVersion: "int.2026-04-23.v1",
    scheduleRef: "every_5_minutes",
    portalSurfaceRef: "portal://capacity/not-required/gp-connect-int",
    portalUrlRef: "not_required",
    portalAutomationState: "not_required",
    verificationState: "preflight_only",
    trustAdmissionState: "trusted",
    odsCode: "A83002",
    siteRef: "site_336_gp_connect_int_a",
    siteLabel: "GP Connect INT Site A",
    serviceRef: "service_336_assurance_probe",
    serviceLabel: "Assurance Probe Session",
    notes: [
      "This row captures the real INT binding posture without claiming live supplier data or HSCN-side activation in the repo.",
      "Preflight only means endpoint, credential bundle, and ODS binding are declared but not represented as fully verified supplier truth.",
    ],
    sample: {
      startMinute: 39,
      durationMinutes: 30,
      manageCapabilityState: "network_manage_ready",
      accessibilityFitScore: 0.86,
      travelMinutes: 15,
      modality: "in_person",
      clinicianType: "general_practice",
    },
  },
  {
    feedId: "feed_336_legacy_shadow_unsupported",
    partnerRef: "legacy_shadow_supplier",
    partnerLabel: "Legacy shadow supplier",
    environmentId: "supported_test_candidate",
    environmentLabel: "Unsupported shadow feed",
    sourceMode: "partner_schedule_sync",
    transportMode: "portal_export_sync",
    authMode: "disabled_placeholder",
    endpointIdentity: "partner:legacy-shadow:capacity-sync",
    endpointLocator: "unsupported://legacy-shadow/capacity-sync",
    adapterIdentity: "phase5.capacity.partner.legacy-shadow",
    credentialBundleId: "cred_bundle_336_legacy_shadow_unsupported",
    sourceVersion: "unsupported.2026-04-23.v1",
    scheduleRef: "disabled",
    portalSurfaceRef: "portal://capacity/legacy-shadow/unsupported",
    portalUrlRef: "not_required",
    portalAutomationState: "not_required",
    verificationState: "unsupported",
    trustAdmissionState: "unsupported",
    odsCode: "A83002",
    siteRef: "site_336_legacy_shadow_a",
    siteLabel: "Legacy Shadow Site A",
    serviceRef: "service_336_shadow_only",
    serviceLabel: "Shadow-Only Capacity",
    notes: [
      "This row exists solely so unsupported supply cannot surprise the runtime as an undeclared feed.",
      "Unsupported rows never produce adapter bindings for the ingestion pipeline.",
    ],
    sample: {
      startMinute: 42,
      durationMinutes: 30,
      manageCapabilityState: "blocked",
      accessibilityFitScore: 0.5,
      travelMinutes: 25,
      modality: "in_person",
      clinicianType: "general_practice",
    },
  },
] as const satisfies readonly PartnerFeedTemplate[];

const CREDENTIAL_TEMPLATES = [
  {
    credentialId: "credential_336_gp_connect_local_twin_api_key",
    feedId: "feed_336_gp_connect_local_twin",
    credentialType: "api_key_reference",
    purpose: "GP Connect INT application key reference",
    secretRef: "secret://capacity/gp-connect/local-twin/api-key",
    ownerRole: "ROLE_INTEROPERABILITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-06-30",
    notes: ["Local twin only. Raw values stay outside source control."],
  },
  {
    credentialId: "credential_336_gp_connect_local_twin_private_key",
    feedId: "feed_336_gp_connect_local_twin",
    credentialType: "jwt_private_key_reference",
    purpose: "Signed JWT private key reference",
    secretRef: "vault://capacity/gp-connect/local-twin/private-key",
    ownerRole: "ROLE_SECURITY_LEAD",
    rotationCadenceDays: 180,
    expiresAt: "2026-06-30",
    notes: ["Used for signed JWT authentication in non-production only."],
  },
  {
    credentialId: "credential_336_optum_local_twin_portal_user",
    feedId: "feed_336_optum_local_twin",
    credentialType: "portal_user_reference",
    purpose: "Optum portal user reference",
    secretRef: "secret://capacity/optum/local-twin/user",
    ownerRole: "ROLE_INTEROPERABILITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-05-31",
    notes: ["Masked portal twin credential handle only."],
  },
  {
    credentialId: "credential_336_optum_local_twin_api_key",
    feedId: "feed_336_optum_local_twin",
    credentialType: "api_key_reference",
    purpose: "Optum capacity sync API key reference",
    secretRef: "secret://capacity/optum/local-twin/api-key",
    ownerRole: "ROLE_SECURITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-05-31",
    notes: ["Used only by the local partner portal twin."],
  },
  {
    credentialId: "credential_336_tpp_local_twin_portal_user",
    feedId: "feed_336_tpp_local_twin",
    credentialType: "portal_user_reference",
    purpose: "TPP portal user reference",
    secretRef: "secret://capacity/tpp/local-twin/user",
    ownerRole: "ROLE_INTEROPERABILITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-05-31",
    notes: ["Masked portal twin credential handle only."],
  },
  {
    credentialId: "credential_336_tpp_local_twin_api_key",
    feedId: "feed_336_tpp_local_twin",
    credentialType: "api_key_reference",
    purpose: "TPP capacity sync API key reference",
    secretRef: "secret://capacity/tpp/local-twin/api-key",
    ownerRole: "ROLE_SECURITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-05-31",
    notes: ["Used only by the local partner portal twin."],
  },
  {
    credentialId: "credential_336_manual_board_local_twin_operator_bundle",
    feedId: "feed_336_manual_board_local_twin",
    credentialType: "operator_session_reference",
    purpose: "Manual board operator session reference",
    secretRef: "vault://capacity/manual-board/local-twin/operator-bundle",
    ownerRole: "ROLE_BOOKING_DOMAIN_LEAD",
    rotationCadenceDays: 30,
    expiresAt: "2026-05-31",
    notes: ["Used only for local operator-session bootstrap."],
  },
  {
    credentialId: "credential_336_batch_import_local_twin_keypair",
    feedId: "feed_336_batch_import_local_twin",
    credentialType: "sftp_keypair_reference",
    purpose: "Batch import SFTP keypair reference",
    secretRef: "vault://capacity/batch-import/local-twin/keypair",
    ownerRole: "ROLE_SECURITY_LEAD",
    rotationCadenceDays: 180,
    expiresAt: "2026-06-30",
    notes: ["Drop-box ingest only. Raw keys are never written into evidence."],
  },
  {
    credentialId: "credential_336_optum_supported_test_portal_user",
    feedId: "feed_336_optum_supported_test",
    credentialType: "portal_user_reference",
    purpose: "Optum supported-test portal user reference",
    secretRef: "secret://capacity/optum/supported-test/user",
    ownerRole: "ROLE_INTEROPERABILITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-05-31",
    notes: ["Manual bridge only."],
  },
  {
    credentialId: "credential_336_optum_supported_test_api_key",
    feedId: "feed_336_optum_supported_test",
    credentialType: "api_key_reference",
    purpose: "Optum supported-test API key reference",
    secretRef: "secret://capacity/optum/supported-test/api-key",
    ownerRole: "ROLE_SECURITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-05-31",
    notes: ["Manual bridge only."],
  },
  {
    credentialId: "credential_336_tpp_supported_test_portal_user",
    feedId: "feed_336_tpp_supported_test",
    credentialType: "portal_user_reference",
    purpose: "TPP supported-test portal user reference",
    secretRef: "secret://capacity/tpp/supported-test/user",
    ownerRole: "ROLE_INTEROPERABILITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-05-31",
    notes: ["Manual bridge only."],
  },
  {
    credentialId: "credential_336_tpp_supported_test_api_key",
    feedId: "feed_336_tpp_supported_test",
    credentialType: "api_key_reference",
    purpose: "TPP supported-test API key reference",
    secretRef: "secret://capacity/tpp/supported-test/api-key",
    ownerRole: "ROLE_SECURITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-05-31",
    notes: ["Manual bridge only."],
  },
  {
    credentialId: "credential_336_gp_connect_int_candidate_api_key",
    feedId: "feed_336_gp_connect_int_candidate",
    credentialType: "api_key_reference",
    purpose: "GP Connect INT application key reference",
    secretRef: "secret://capacity/gp-connect/int/api-key",
    ownerRole: "ROLE_INTEROPERABILITY_LEAD",
    rotationCadenceDays: 90,
    expiresAt: "2026-06-30",
    notes: ["INT preflight binding only."],
  },
  {
    credentialId: "credential_336_gp_connect_int_candidate_private_key",
    feedId: "feed_336_gp_connect_int_candidate",
    credentialType: "jwt_private_key_reference",
    purpose: "GP Connect INT signed JWT private key reference",
    secretRef: "vault://capacity/gp-connect/int/private-key",
    ownerRole: "ROLE_SECURITY_LEAD",
    rotationCadenceDays: 180,
    expiresAt: "2026-06-30",
    notes: ["INT preflight binding only."],
  },
  {
    credentialId: "credential_336_legacy_shadow_unsupported_placeholder",
    feedId: "feed_336_legacy_shadow_unsupported",
    credentialType: "disabled_placeholder_reference",
    purpose: "Explicit unsupported placeholder so disabled feeds still have typed control-plane evidence",
    secretRef: "vault://capacity/legacy-shadow/unsupported-placeholder",
    ownerRole: "ROLE_RELEASE_MANAGER",
    rotationCadenceDays: 365,
    expiresAt: "2026-12-31",
    notes: ["Unsupported feeds never bootstrap or verify as active bindings."],
  },
] as const satisfies readonly PartnerCredentialTemplate[];

function feedTemplateById(feedId: string): PartnerFeedTemplate {
  const template = FEED_TEMPLATES.find((entry) => entry.feedId === feedId);
  if (!template) {
    throw new Error(`UNKNOWN_FEED:${feedId}`);
  }
  return template;
}

function buildMappingId(feedId: string): string {
  return `mapping_${feedId}`;
}

function buildAdapterBindingHash(template: PartnerFeedTemplate): string {
  return sha256Hex(
    stableStringify({
      feedId: template.feedId,
      endpointIdentity: template.endpointIdentity,
      adapterIdentity: template.adapterIdentity,
      sourceMode: template.sourceMode,
      trustAdmissionState: template.trustAdmissionState,
      odsCode: template.odsCode,
      siteRef: template.siteRef,
      serviceRef: template.serviceRef,
      sourceVersion: template.sourceVersion,
    }),
  );
}

function buildAdapterBindingRef(template: PartnerFeedTemplate): string {
  return `capacity_partner_binding_${buildAdapterBindingHash(template).slice(0, 24)}`;
}

function buildPartnerFeedEntry(template: PartnerFeedTemplate): PartnerFeedEntry {
  return {
    feedId: template.feedId,
    partnerRef: template.partnerRef,
    partnerLabel: template.partnerLabel,
    environmentId: template.environmentId,
    environmentLabel: template.environmentLabel,
    sourceMode: template.sourceMode,
    transportMode: template.transportMode,
    authMode: template.authMode,
    endpointIdentity: template.endpointIdentity,
    endpointLocator: template.endpointLocator,
    adapterIdentity: template.adapterIdentity,
    adapterBindingRef: buildAdapterBindingRef(template),
    adapterBindingHash: buildAdapterBindingHash(template),
    credentialBundleId: template.credentialBundleId,
    sourceVersion: template.sourceVersion,
    scheduleRef: template.scheduleRef,
    portalSurfaceRef: template.portalSurfaceRef,
    portalUrlRef: template.portalUrlRef,
    portalAutomationState: template.portalAutomationState,
    verificationState: template.verificationState,
    trustAdmissionState: template.trustAdmissionState,
    odsCode: template.odsCode,
    siteRef: template.siteRef,
    serviceRef: template.serviceRef,
    siteLabel: template.siteLabel,
    serviceLabel: template.serviceLabel,
    mappingRowRefs: [buildMappingId(template.feedId)],
    notes: template.notes,
  };
}

function buildCredentialEntry(template: PartnerCredentialTemplate): PartnerCredentialEntry {
  return {
    ...template,
    maskedFingerprint: maskedFingerprint(template.secretRef),
  };
}

export async function buildPartnerFeedRegistry(): Promise<PartnerFeedRegistryDocument> {
  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    registryVersion: REGISTRY_VERSION,
    generatedAt: GENERATED_AT,
    feeds: FEED_TEMPLATES.map((template) => buildPartnerFeedEntry(template)),
  };
}

export async function buildPartnerCredentialManifest(): Promise<PartnerCredentialManifestDocument> {
  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    credentials: CREDENTIAL_TEMPLATES.map((template) => buildCredentialEntry(template)),
  };
}

export async function buildPartnerSiteServiceMap(): Promise<readonly PartnerSiteServiceMapRow[]> {
  const registry = await buildPartnerFeedRegistry();
  return registry.feeds.map((feed) => ({
    mappingId: buildMappingId(feed.feedId),
    feedId: feed.feedId,
    environmentId: feed.environmentId,
    partnerRef: feed.partnerRef,
    odsCode: feed.odsCode,
    siteRef: feed.siteRef,
    siteLabel: feed.siteLabel,
    serviceRef: feed.serviceRef,
    serviceLabel: feed.serviceLabel,
    endpointIdentity: feed.endpointIdentity,
    adapterIdentity: feed.adapterIdentity,
    sourceMode: feed.sourceMode,
    trustAdmissionState: feed.trustAdmissionState,
    verificationState: feed.verificationState,
  }));
}

function toYamlList(values: readonly string[], indent = "      "): string {
  return values.map((value) => `${indent}- ${value}`).join("\n");
}

export async function renderPartnerFeedRegistryYaml(): Promise<string> {
  const registry = await buildPartnerFeedRegistry();
  const rows = registry.feeds
    .map(
      (feed) => `  - feedId: ${feed.feedId}
    partnerRef: ${feed.partnerRef}
    partnerLabel: "${feed.partnerLabel}"
    environmentId: ${feed.environmentId}
    environmentLabel: "${feed.environmentLabel}"
    sourceMode: ${feed.sourceMode}
    transportMode: ${feed.transportMode}
    authMode: ${feed.authMode}
    endpointIdentity: ${feed.endpointIdentity}
    endpointLocator: ${feed.endpointLocator}
    adapterIdentity: ${feed.adapterIdentity}
    adapterBindingRef: ${feed.adapterBindingRef}
    adapterBindingHash: ${feed.adapterBindingHash}
    credentialBundleId: ${feed.credentialBundleId}
    sourceVersion: ${feed.sourceVersion}
    scheduleRef: ${feed.scheduleRef}
    portalSurfaceRef: ${feed.portalSurfaceRef}
    portalUrlRef: ${feed.portalUrlRef}
    portalAutomationState: ${feed.portalAutomationState}
    verificationState: ${feed.verificationState}
    trustAdmissionState: ${feed.trustAdmissionState}
    odsCode: ${feed.odsCode}
    siteRef: ${feed.siteRef}
    siteLabel: "${feed.siteLabel}"
    serviceRef: ${feed.serviceRef}
    serviceLabel: "${feed.serviceLabel}"
    mappingRowRefs:
${toYamlList(feed.mappingRowRefs)}
    notes:
${toYamlList(feed.notes)}`,
    )
    .join("\n");
  return `taskId: ${registry.taskId}
schemaVersion: ${registry.schemaVersion}
registryVersion: ${registry.registryVersion}
generatedAt: ${registry.generatedAt}
feeds:
${rows}
`;
}

export async function renderPartnerCredentialManifestYaml(): Promise<string> {
  const manifest = await buildPartnerCredentialManifest();
  const rows = manifest.credentials
    .map(
      (entry) => `  - credentialId: ${entry.credentialId}
    feedId: ${entry.feedId}
    credentialType: ${entry.credentialType}
    purpose: "${entry.purpose}"
    secretRef: ${entry.secretRef}
    maskedFingerprint: ${entry.maskedFingerprint}
    ownerRole: ${entry.ownerRole}
    rotationCadenceDays: ${entry.rotationCadenceDays}
    expiresAt: ${entry.expiresAt}
    notes:
${toYamlList(entry.notes)}`,
    )
    .join("\n");
  return `taskId: ${manifest.taskId}
schemaVersion: ${manifest.schemaVersion}
generatedAt: ${manifest.generatedAt}
credentials:
${rows}
`;
}

export async function renderPartnerSiteServiceMapCsv(): Promise<string> {
  const rows = await buildPartnerSiteServiceMap();
  const header = [
    "mappingId",
    "feedId",
    "environmentId",
    "partnerRef",
    "odsCode",
    "siteRef",
    "siteLabel",
    "serviceRef",
    "serviceLabel",
    "endpointIdentity",
    "adapterIdentity",
    "sourceMode",
    "trustAdmissionState",
    "verificationState",
  ].join(",");
  const body = rows
    .map((row) =>
      [
        row.mappingId,
        row.feedId,
        row.environmentId,
        row.partnerRef,
        row.odsCode,
        row.siteRef,
        row.siteLabel,
        row.serviceRef,
        row.serviceLabel,
        row.endpointIdentity,
        row.adapterIdentity,
        row.sourceMode,
        row.trustAdmissionState,
        row.verificationState,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}\n`;
}

export async function buildCapacityFeedConfigurationContract(): Promise<CapacityFeedConfigurationContract> {
  const registry = await buildPartnerFeedRegistry();
  const automatedFeedIds = registry.feeds
    .filter(
      (feed) =>
        feed.environmentId === "local_twin" &&
        feed.trustAdmissionState !== "unsupported" &&
        feed.verificationState === "verified",
    )
    .map((feed) => feed.feedId);
  const manualBridgeFeedIds = registry.feeds
    .filter((feed) => feed.portalAutomationState === "manual_bridge_required")
    .map((feed) => feed.feedId);
  const unsupportedFeedIds = registry.feeds
    .filter((feed) => feed.trustAdmissionState === "unsupported")
    .map((feed) => feed.feedId);
  const sourceModes = [...new Set(registry.feeds.map((feed) => feed.sourceMode))].sort() as HubCapacitySourceMode[];
  const admissionManifest = (["trusted", "degraded", "quarantined", "unsupported"] as const).map(
    (trustAdmissionState) => ({
      trustAdmissionState,
      sourceMode: (registry.feeds.find((feed) => feed.trustAdmissionState === trustAdmissionState)
        ?.sourceMode ?? "partner_schedule_sync") as HubCapacitySourceMode,
      feedIds: registry.feeds
        .filter((feed) => feed.trustAdmissionState === trustAdmissionState)
        .map((feed) => feed.feedId),
    }),
  );

  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    registryRef: SOURCE_OUTPUT_PATHS.registry,
    credentialManifestRef: SOURCE_OUTPUT_PATHS.credentials,
    siteServiceMapRef: SOURCE_OUTPUT_PATHS.siteServiceMap,
    gapRegisterRef: SOURCE_OUTPUT_PATHS.gapRegister,
    interfaceGapRef: SOURCE_OUTPUT_PATHS.interfaceGap,
    supportedEnvironmentIds: ["integration_candidate", "local_twin", "supported_test_candidate"],
    sourceModes,
    automatedFeedIds,
    manualBridgeFeedIds,
    unsupportedFeedIds,
    admissionManifest,
    sourceRefs: [
      "blueprint/phase-5-the-network-horizon.md#5C",
      "blueprint/phase-0-the-foundation-protocol.md",
      "docs/architecture/318_capacity_ingestion_and_candidate_snapshot_pipeline.md",
    ],
  };
}

export async function buildPartnerFeedGapRegister(): Promise<PartnerFeedGapRegister> {
  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    gaps: [
      {
        gapId: "gap_336_supplier_portal_manual_bridge",
        category: "supplier_portal",
        state: "manual_bridge_required",
        affectedFeedIds: ["feed_336_optum_supported_test", "feed_336_tpp_supported_test"],
        summary:
          "Supplier-admin capacity portal steps remain lawful only as a manual bridge outside unattended browser mutation.",
        fallback:
          "Keep the manifest authoritative, bootstrap only the masked local twin, and capture the exact manual bridge in the runbook.",
        followUpAction:
          "Complete supported-test supplier walkthroughs under named operator approval and replace manual_bridge_required only after masked evidence is current.",
      },
      {
        gapId: "gap_336_gp_connect_int_preflight",
        category: "api_onboarding",
        state: "review_required",
        affectedFeedIds: ["feed_336_gp_connect_int_candidate"],
        summary:
          "The GP Connect INT binding is present as a preflight configuration but not represented as fully verified supplier truth inside the repo.",
        fallback:
          "Treat the row as preflight_only and require named INT onboarding and HSCN-side verification outside the repo before widening.",
        followUpAction:
          "Refresh INT onboarding evidence, SSP certificate registration, and SDS/ODS routing proof before reclassifying the row as verified.",
      },
      {
        gapId: "gap_336_legacy_unsupported_shadow",
        category: "unsupported_feed",
        state: "explicitly_unsupported",
        affectedFeedIds: ["feed_336_legacy_shadow_unsupported"],
        summary:
          "Legacy shadow supply is declared as unsupported so it cannot appear as an accidental live integration path.",
        fallback:
          "Keep the row in the registry, bind a disabled placeholder credential bundle, and never derive adapter bindings from it.",
        followUpAction:
          "Remove the row only if the external source is formally retired or replace it with a fully governed onboarding track.",
      },
      {
        gapId: "gap_336_secret_rotation_review",
        category: "security_review",
        state: "review_required",
        affectedFeedIds: FEED_TEMPLATES.map((template) => template.feedId),
        summary:
          "All partner credential bundles remain secret-safe but still require live rotation ownership outside source control.",
        fallback:
          "Expose only secret references and masked fingerprints in tracked artifacts and runtime evidence.",
        followUpAction:
          "Validate each secret bundle against the current rotation calendar before promoting any feed beyond non-production.",
      },
    ],
  };
}

export async function buildPartnerFeedPortalAutomationGap(): Promise<PartnerFeedPortalAutomationGap> {
  return {
    taskId: FULL_TASK_ID,
    gapId: "PHASE5_BATCH_332_339_INTERFACE_GAP_PARTNER_FEED_PORTAL_AUTOMATION",
    missingSurface:
      "lawful unattended automation for real supplier capacity-admin portals in supported-test environments",
    expectedOwnerTask: FULL_TASK_ID,
    temporaryFallback:
      "the local masked partner portal twin is automated end to end while real supplier-admin steps stay manual_bridge_required and manifest-driven",
    riskIfUnresolved:
      "portal drift or stale supported-test credentials could create false confidence about capacity source readiness",
    followUpAction:
      "refresh supported-test supplier-admin evidence under named operator approval, then replace manual bridge rows only after masked proof is current",
    affectedFeedIds: ["feed_336_optum_supported_test", "feed_336_tpp_supported_test"],
    blockedCapabilities: [
      "real_supplier_portal_auto_enable",
      "real_supplier_credential_rotation_in_browser",
      "real_supplier_portal_auto_repair",
    ],
  };
}

function runtimeStatePath(outputDir: string): string {
  return path.join(outputDir, "336_partner_feed_runtime_state.json");
}

function verificationSummaryPath(outputDir: string): string {
  return path.join(outputDir, "336_partner_feed_verification_summary.json");
}

function readRuntimeState(outputDir: string): PartnerFeedRuntimeState {
  const statePath = runtimeStatePath(outputDir);
  if (!fs.existsSync(statePath)) {
    return { version: REGISTRY_VERSION, feeds: [] };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8")) as PartnerFeedRuntimeState;
}

function writeRuntimeState(outputDir: string, state: PartnerFeedRuntimeState): void {
  writeJson(runtimeStatePath(outputDir), state);
}

function buildTrustRecord(
  feed: PartnerFeedEntry,
  evaluatedAt: string,
): CapacitySourceTrustRecordInput {
  switch (feed.trustAdmissionState) {
    case "trusted":
      return {
        sourceTrustRef: `trust_${feed.feedId}`,
        trustLowerBound: 0.93,
        completenessState: "complete",
        hardBlock: false,
        observedTrustState: "trusted",
        evaluatedAt,
        reviewDueAt: atMinute(64),
        sourceRefs: [`feed:${feed.feedId}`, `bundle:${feed.credentialBundleId}`],
      };
    case "degraded":
      return {
        sourceTrustRef: `trust_${feed.feedId}`,
        trustLowerBound: 0.58,
        completenessState: "partial",
        hardBlock: false,
        observedTrustState: "degraded",
        evaluatedAt,
        reviewDueAt: atMinute(34),
        sourceRefs: [`feed:${feed.feedId}`, `bundle:${feed.credentialBundleId}`],
      };
    case "quarantined":
      return {
        sourceTrustRef: `trust_${feed.feedId}`,
        trustLowerBound: 0.18,
        completenessState: "blocked",
        hardBlock: true,
        observedTrustState: "quarantined",
        evaluatedAt,
        reviewDueAt: atMinute(16),
        sourceRefs: [`feed:${feed.feedId}`, `bundle:${feed.credentialBundleId}`],
      };
    case "unsupported":
      return {
        sourceTrustRef: `trust_${feed.feedId}`,
        trustLowerBound: 0,
        completenessState: "blocked",
        hardBlock: true,
        observedTrustState: "unknown",
        evaluatedAt,
        reviewDueAt: atMinute(16),
        sourceRefs: [`feed:${feed.feedId}`, `bundle:${feed.credentialBundleId}`],
      };
  }
}

function buildRawSupplyRow(feed: PartnerFeedEntry): HubCapacityRawSupplyRow {
  const template = feedTemplateById(feed.feedId);
  const startAt = atMinute(template.sample.startMinute);
  const endAt = atMinute(template.sample.startMinute + template.sample.durationMinutes);
  return {
    upstreamSlotRef: `upstream_${feed.feedId}`,
    capacityUnitRef: `capacity_unit_${feed.feedId}`,
    siteId: feed.siteRef,
    siteLabel: feed.siteLabel,
    timezone: "Europe/London",
    modality: template.sample.modality,
    clinicianType: template.sample.clinicianType,
    startAt,
    endAt,
    manageCapabilityState: template.sample.manageCapabilityState,
    accessibilityFitScore: template.sample.accessibilityFitScore,
    travelMinutes: template.sample.travelMinutes,
    sourceRefs: [
      `feed:${feed.feedId}`,
      `mapping:${buildMappingId(feed.feedId)}`,
      `service:${feed.serviceRef}`,
      `ods:${feed.odsCode}`,
    ],
  };
}

export async function buildAutomatedAdapterBindings(): Promise<readonly HubCapacityAdapterBindingSnapshot[]> {
  const registry = await buildPartnerFeedRegistry();
  return registry.feeds
    .filter(
      (feed) =>
        feed.environmentId === "local_twin" &&
        feed.verificationState === "verified" &&
        feed.trustAdmissionState !== "unsupported",
    )
    .map((feed) => ({
      bindingRef: feed.adapterBindingRef,
      sourceMode: feed.sourceMode,
      sourceRef: feed.feedId,
      sourceIdentity: feed.endpointIdentity,
      sourceVersion: feed.sourceVersion,
      fetchedAt: atMinute(5),
      trustRecord: buildTrustRecord(feed, atMinute(4)),
      capacityRows: [buildRawSupplyRow(feed)],
      sourceRefs: [
        `feed:${feed.feedId}`,
        `adapter:${feed.adapterIdentity}`,
        `ods:${feed.odsCode}`,
        `site:${feed.siteRef}`,
        `service:${feed.serviceRef}`,
        `binding-hash:${feed.adapterBindingHash}`,
        `credential-bundle:${feed.credentialBundleId}`,
      ],
    }));
}

export async function buildSmokeScenario(): Promise<InternalSmokeScenario> {
  const bindings = await buildAutomatedAdapterBindings();
  return {
    bindings,
    expectedFeedIds: bindings.map((binding) => binding.sourceRef),
  };
}

export async function materializePartnerFeedTrackedArtifacts(
  rootDir = process.cwd(),
): Promise<{
  readonly registryPath: string;
  readonly credentialManifestPath: string;
  readonly siteServiceMapPath: string;
  readonly contractPath: string;
  readonly gapRegisterPath: string;
  readonly interfaceGapPath: string;
}> {
  const registryPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.registry);
  const credentialManifestPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.credentials);
  const siteServiceMapPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.siteServiceMap);
  const contractPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.contract);
  const gapRegisterPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.gapRegister);
  const interfaceGapPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.interfaceGap);

  writeText(registryPath, await renderPartnerFeedRegistryYaml());
  writeText(credentialManifestPath, await renderPartnerCredentialManifestYaml());
  writeText(siteServiceMapPath, await renderPartnerSiteServiceMapCsv());
  writeJson(contractPath, await buildCapacityFeedConfigurationContract());
  writeJson(gapRegisterPath, await buildPartnerFeedGapRegister());
  writeJson(interfaceGapPath, await buildPartnerFeedPortalAutomationGap());

  return {
    registryPath,
    credentialManifestPath,
    siteServiceMapPath,
    contractPath,
    gapRegisterPath,
    interfaceGapPath,
  };
}

function filterFeeds(
  feeds: readonly PartnerFeedEntry[],
  selectedFeedIds?: readonly string[],
): readonly PartnerFeedEntry[] {
  if (!selectedFeedIds || selectedFeedIds.length === 0) {
    return feeds;
  }
  const selected = new Set(selectedFeedIds);
  return feeds.filter((feed) => selected.has(feed.feedId));
}

export async function bootstrapPartnerFeeds(
  options: BootstrapOptions = {},
): Promise<PartnerFeedBootstrapResult> {
  const outputDir = buildOutputDir(options.outputDir);
  const registry = await buildPartnerFeedRegistry();
  const feeds = filterFeeds(registry.feeds, options.feedIds);
  const existingState = readRuntimeState(outputDir);
  const rows = [...existingState.feeds];
  const actions: PartnerFeedBootstrapResult["actions"] = [];

  for (const feed of feeds) {
    const current = rows.find((row) => row.feedId === feed.feedId);
    if (feed.trustAdmissionState === "unsupported") {
      actions.push({
        feedId: feed.feedId,
        partnerRef: feed.partnerRef,
        action: "unsupported",
        detail: "Feed remains explicit unsupported configuration and cannot bootstrap.",
      });
      continue;
    }
    if (feed.portalAutomationState === "manual_bridge_required") {
      actions.push({
        feedId: feed.feedId,
        partnerRef: feed.partnerRef,
        action: "manual_bridge_required",
        detail: "Supplier-admin setup remains manual-bridge only; manifest stays authoritative.",
      });
      continue;
    }
    if (current?.adapterBindingHash === feed.adapterBindingHash) {
      actions.push({
        feedId: feed.feedId,
        partnerRef: feed.partnerRef,
        action: "already_current",
        detail: "Runtime feed state already matches the manifest binding hash.",
      });
      continue;
    }

    const nextRow: PartnerFeedRuntimeStateRow = {
      feedId: feed.feedId,
      adapterBindingHash: feed.adapterBindingHash,
      endpointIdentity: feed.endpointIdentity,
      adapterIdentity: feed.adapterIdentity,
      sourceMode: feed.sourceMode,
      trustAdmissionState: feed.trustAdmissionState,
      configuredAt: atMinute(6),
    };
    const filtered = rows.filter((row) => row.feedId !== feed.feedId);
    filtered.push(nextRow);
    rows.splice(0, rows.length, ...filtered);

    actions.push({
      feedId: feed.feedId,
      partnerRef: feed.partnerRef,
      action: feed.portalAutomationState === "not_required" ? "not_required" : "configured",
      detail:
        feed.portalAutomationState === "not_required"
          ? "Manifest-driven non-portal setup is current."
          : "Automated local partner-portal binding converged to the manifest hash.",
    });
  }

  writeRuntimeState(outputDir, {
    version: REGISTRY_VERSION,
    feeds: rows.sort((left, right) => left.feedId.localeCompare(right.feedId)),
  });

  return {
    taskId: TASK_ID,
    outputDir,
    statePath: runtimeStatePath(outputDir),
    actions,
  };
}

export async function resetPartnerFeeds(
  options: BootstrapOptions = {},
): Promise<{
  readonly taskId: typeof TASK_ID;
  readonly outputDir: string;
  readonly removedPaths: readonly string[];
}> {
  const outputDir = buildOutputDir(options.outputDir);
  const removedPaths: string[] = [];
  for (const filePath of [runtimeStatePath(outputDir), verificationSummaryPath(outputDir)]) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
      removedPaths.push(filePath);
    }
  }
  return {
    taskId: TASK_ID,
    outputDir,
    removedPaths,
  };
}

export function decisionClassesForFeed(
  feed: PartnerFeedEntry,
  admissionDisposition?: string,
): readonly string[] {
  if (feed.trustAdmissionState === "unsupported") {
    return ["unsupported_feed_declared", "never_bootstrap"];
  }
  if (feed.portalAutomationState === "manual_bridge_required") {
    return ["manual_bridge_required", "manifest_authoritative"];
  }
  return [
    "binding_hash_current",
    "adapter_identity_bound",
    "site_service_mapping_bound",
    `trust_posture_${feed.trustAdmissionState}`,
    admissionDisposition ?? toneFromTrustState(feed.trustAdmissionState),
  ];
}

export async function writeVerificationSummary(
  outputDir: string,
  summary: PartnerFeedVerificationSummary,
): Promise<string> {
  const summaryPath = verificationSummaryPath(outputDir);
  writeJson(summaryPath, summary);
  return summaryPath;
}

export async function readVerificationSummary(
  outputDir: string,
): Promise<PartnerFeedVerificationSummary | null> {
  const summaryPath = verificationSummaryPath(outputDir);
  if (!fs.existsSync(summaryPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(summaryPath, "utf8")) as PartnerFeedVerificationSummary;
}

export async function buildStaticVerificationSummary(): Promise<PartnerFeedVerificationSummary> {
  const registry = await buildPartnerFeedRegistry();
  return {
    taskId: TASK_ID,
    verificationAt: atMinute(7),
    sourceAdmissionDispositions: [],
    feedChecks: registry.feeds.map((feed) => ({
      feedId: feed.feedId,
      verificationState: feed.verificationState,
      trustAdmissionState: feed.trustAdmissionState,
      decisionClasses: decisionClassesForFeed(feed),
      samplePayloadRef: `sample://${feed.feedId}`,
    })),
    snapshotId: null,
    decisionPlanId: null,
    capacityRankProofId: null,
  };
}
