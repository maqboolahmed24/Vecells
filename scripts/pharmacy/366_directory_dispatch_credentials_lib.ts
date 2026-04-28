import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

import transportAssuranceRegistryContract from "../../data/contracts/343_phase6_transport_assurance_registry.json";

export const TASK_ID = "seq_366";
export const FULL_TASK_ID =
  "seq_366_phase6_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_pharmacy_directory_and_dispatch_provider_credentials";
export const SCHEMA_VERSION = "366.phase6.directory-dispatch-credentials.v1";
export const GENERATED_AT = "2026-04-24T10:00:00.000Z";
export const CONTROL_PLANE_VERSION =
  "366-phase6-directory-dispatch-control-plane-2026-04-24.v1";
export const OUTPUT_DIR = ".artifacts/provider-config/366";
export const SOURCE_OUTPUT_PATHS = {
  directoryManifest: "data/config/366_directory_source_manifest.example.json",
  dispatchManifest:
    "data/config/366_dispatch_provider_binding_manifest.example.json",
  secretManifest: "data/config/366_secret_reference_manifest.example.json",
  contract: "data/contracts/366_directory_and_dispatch_binding_contract.json",
  providerInventoryTemplate:
    "ops/onboarding/366_provider_inventory_template.csv",
  nonProdBindingMatrix:
    "ops/onboarding/366_nonprod_provider_binding_matrix.csv",
  providerCapabilityMatrix:
    "data/analysis/366_provider_capability_binding_matrix.csv",
  verificationChecklist: "data/analysis/366_verification_checklist.csv",
} as const;

export type DirectoryDispatchEnvironmentId =
  | "development_local_twin"
  | "integration_candidate"
  | "training_candidate"
  | "deployment_candidate";

export type PharmacyDirectorySourceMode =
  | "dohs_service_search"
  | "eps_dos_legacy"
  | "local_registry_override"
  | "manual_directory_snapshot";

export type PharmacyDispatchTransportMode =
  | "bars_fhir"
  | "supplier_interop"
  | "nhsmail_shared_mailbox"
  | "mesh"
  | "manual_assisted_dispatch";

export type DirectoryDispatchPortalAutomationState =
  | "fully_automated"
  | "manual_bridge_required"
  | "not_required";

export type DirectoryDispatchVerificationState =
  | "manifest_ready"
  | "verified"
  | "manual_bridge_required"
  | "preflight_only"
  | "unsupported"
  | "failed";

export type DirectoryStrategicRouteClass =
  | "strategic_current"
  | "bounded_legacy_compatibility"
  | "local_override";

export type SecretProviderKind =
  | "vault_reference"
  | "ci_secret_provider"
  | "operator_keychain";

export type DirectoryDispatchMode = "dry_run" | "rehearsal" | "apply" | "verify";

export interface NonProdEnvironmentProfile {
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly environmentLabel: string;
  readonly loginStrategy:
    | "portal_form_per_context"
    | "portal_form_manual_bridge"
    | "portal_form_verify_only";
  readonly storageStateRef: string;
  readonly automationState: DirectoryDispatchPortalAutomationState;
  readonly evidenceCaptureMode:
    | "safe_summary_only"
    | "safe_summary_with_trace_after_secret_boundary";
  readonly notes: readonly string[];
}

export interface SecretReferenceEntry {
  readonly secretRefId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly bundleId: string;
  readonly locator: string;
  readonly secretProvider: SecretProviderKind;
  readonly purpose: string;
  readonly ownerRole: string;
  readonly maskedFingerprint: string;
  readonly rotationCadenceDays: number;
  readonly expiresAt: string;
  readonly notes: readonly string[];
}

export interface SecretReferenceManifestDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly environmentProfiles: readonly NonProdEnvironmentProfile[];
  readonly secrets: readonly SecretReferenceEntry[];
}

export interface DirectorySourceEntry {
  readonly sourceId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly environmentLabel: string;
  readonly providerRef: string;
  readonly providerLabel: string;
  readonly odsCode: string;
  readonly serviceCode: string;
  readonly directorySourceMode: PharmacyDirectorySourceMode;
  readonly strategicRouteClass: DirectoryStrategicRouteClass;
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly portalAutomationState: DirectoryDispatchPortalAutomationState;
  readonly verificationState: DirectoryDispatchVerificationState;
  readonly capabilityVerificationState:
    | "verified"
    | "manual_bridge_required"
    | "preflight_only";
  readonly supportedTransportModes: readonly PharmacyDispatchTransportMode[];
  readonly secretBundleId: string;
  readonly secretRefIds: readonly string[];
  readonly capabilityEvidenceRefs: readonly string[];
  readonly capabilityTupleHash: string;
  readonly notes: readonly string[];
}

export interface DirectorySourceManifestDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly environmentProfiles: readonly NonProdEnvironmentProfile[];
  readonly strategicDirectoryModes: readonly PharmacyDirectorySourceMode[];
  readonly boundedLegacyCompatibilityModes: readonly PharmacyDirectorySourceMode[];
  readonly sources: readonly DirectorySourceEntry[];
}

export interface DispatchProviderBindingEntry {
  readonly bindingId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly environmentLabel: string;
  readonly providerRef: string;
  readonly providerLabel: string;
  readonly odsCode: string;
  readonly transportMode: PharmacyDispatchTransportMode;
  readonly transportAssuranceProfileId: string;
  readonly dispatchAdapterBindingRef: string;
  readonly expectedAdapterVersion: string;
  readonly expectedTransformContractRef: string;
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly portalAutomationState: DirectoryDispatchPortalAutomationState;
  readonly verificationState: DirectoryDispatchVerificationState;
  readonly secretBundleId: string | null;
  readonly secretRefIds: readonly string[];
  readonly supportedTransportModes: readonly PharmacyDispatchTransportMode[];
  readonly providerCapabilityTupleHash: string;
  readonly dispatchBindingHash: string;
  readonly evidenceRefs: readonly string[];
  readonly notes: readonly string[];
}

export interface DispatchProviderBindingManifestDocument {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly environmentProfiles: readonly NonProdEnvironmentProfile[];
  readonly currentAdapterWave: "par_350";
  readonly bindings: readonly DispatchProviderBindingEntry[];
}

export interface DirectoryDispatchBindingContract {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly controlPlaneVersion: typeof CONTROL_PLANE_VERSION;
  readonly directoryManifestRef: string;
  readonly dispatchManifestRef: string;
  readonly secretManifestRef: string;
  readonly providerInventoryTemplateRef: string;
  readonly nonProdBindingMatrixRef: string;
  readonly providerCapabilityMatrixRef: string;
  readonly verificationChecklistRef: string;
  readonly supportedEnvironmentIds: readonly DirectoryDispatchEnvironmentId[];
  readonly automationModes: readonly DirectoryDispatchMode[];
  readonly strategicDirectoryModes: readonly PharmacyDirectorySourceMode[];
  readonly boundedLegacyCompatibilityModes: readonly PharmacyDirectorySourceMode[];
  readonly dispatchTransportModes: readonly PharmacyDispatchTransportMode[];
  readonly fullyAutomatedSourceIds: readonly string[];
  readonly fullyAutomatedBindingIds: readonly string[];
  readonly manualBridgeSourceIds: readonly string[];
  readonly manualBridgeBindingIds: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface RuntimeDirectorySourceStateRow {
  readonly sourceId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly capabilityTupleHash: string;
  readonly configuredAt: string;
}

export interface RuntimeDispatchBindingStateRow {
  readonly bindingId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly dispatchBindingHash: string;
  readonly configuredAt: string;
}

export interface DirectoryDispatchRuntimeState {
  readonly version: typeof CONTROL_PLANE_VERSION;
  readonly directorySources: readonly RuntimeDirectorySourceStateRow[];
  readonly dispatchBindings: readonly RuntimeDispatchBindingStateRow[];
}

export interface BootstrapAction {
  readonly area: "directory_source" | "dispatch_binding";
  readonly rowId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly action:
    | "would_configure"
    | "configured"
    | "already_current"
    | "manual_bridge_required"
    | "not_required";
  readonly detail: string;
}

export interface DirectoryDispatchBootstrapResult {
  readonly taskId: typeof TASK_ID;
  readonly mode: DirectoryDispatchMode;
  readonly outputDir: string;
  readonly actions: readonly BootstrapAction[];
  readonly runtimeStatePath: string;
}

export interface DirectoryCheck {
  readonly sourceId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly providerRef: string;
  readonly verificationState: DirectoryDispatchVerificationState;
  readonly decisionClasses: readonly string[];
}

export interface DispatchCheck {
  readonly bindingId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly providerRef: string;
  readonly verificationState: DirectoryDispatchVerificationState;
  readonly decisionClasses: readonly string[];
}

export interface DirectoryDispatchReadinessSummary {
  readonly taskId: typeof TASK_ID;
  readonly verificationAt: string;
  readonly sourceChecks: readonly DirectoryCheck[];
  readonly dispatchChecks: readonly DispatchCheck[];
  readonly byEnvironment: readonly {
    environmentId: DirectoryDispatchEnvironmentId;
    environmentLabel: string;
    readinessState: "verified" | "manual_bridge_required" | "preflight_only";
    automatedRowsConfigured: number;
    manualBridgeRows: number;
  }[];
}

interface DirectorySourceTemplate {
  readonly sourceId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly providerRef: string;
  readonly providerLabel: string;
  readonly odsCode: string;
  readonly serviceCode: string;
  readonly directorySourceMode: PharmacyDirectorySourceMode;
  readonly strategicRouteClass: DirectoryStrategicRouteClass;
  readonly portalAutomationState: DirectoryDispatchPortalAutomationState;
  readonly verificationState: DirectoryDispatchVerificationState;
  readonly capabilityVerificationState:
    | "verified"
    | "manual_bridge_required"
    | "preflight_only";
  readonly supportedTransportModes: readonly PharmacyDispatchTransportMode[];
  readonly secretBundleId: string;
  readonly secretRefIds: readonly string[];
  readonly capabilityEvidenceRefs: readonly string[];
  readonly notes: readonly string[];
}

interface DispatchBindingTemplate {
  readonly bindingId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly providerRef: string;
  readonly providerLabel: string;
  readonly odsCode: string;
  readonly transportMode: PharmacyDispatchTransportMode;
  readonly portalAutomationState: DirectoryDispatchPortalAutomationState;
  readonly verificationState: DirectoryDispatchVerificationState;
  readonly secretBundleId: string | null;
  readonly secretRefIds: readonly string[];
  readonly supportedTransportModes: readonly PharmacyDispatchTransportMode[];
  readonly evidenceRefs: readonly string[];
  readonly notes: readonly string[];
}

interface SecretTemplate {
  readonly secretRefId: string;
  readonly environmentId: DirectoryDispatchEnvironmentId;
  readonly bundleId: string;
  readonly locator: string;
  readonly secretProvider: SecretProviderKind;
  readonly purpose: string;
  readonly ownerRole: string;
  readonly rotationCadenceDays: number;
  readonly expiresAt: string;
  readonly notes: readonly string[];
}

const ENVIRONMENT_PROFILES: readonly NonProdEnvironmentProfile[] = [
  {
    environmentId: "development_local_twin",
    environmentLabel: "Development local twin",
    loginStrategy: "portal_form_per_context",
    storageStateRef: path.posix.join(OUTPUT_DIR, "playwright.auth/dev-local-twin.json"),
    automationState: "fully_automated",
    evidenceCaptureMode: "safe_summary_with_trace_after_secret_boundary",
    notes: [
      "Local twin is the only fully automated mutation target.",
      "Each browser context stays isolated per environment profile.",
    ],
  },
  {
    environmentId: "integration_candidate",
    environmentLabel: "Integration candidate",
    loginStrategy: "portal_form_manual_bridge",
    storageStateRef: path.posix.join(OUTPUT_DIR, "playwright.auth/integration-candidate.json"),
    automationState: "manual_bridge_required",
    evidenceCaptureMode: "safe_summary_only",
    notes: [
      "Integration candidate requires named operator review before mutation.",
      "Browser automation may assemble the request pack and stop before submit.",
    ],
  },
  {
    environmentId: "training_candidate",
    environmentLabel: "Training candidate",
    loginStrategy: "portal_form_manual_bridge",
    storageStateRef: path.posix.join(OUTPUT_DIR, "playwright.auth/training-candidate.json"),
    automationState: "manual_bridge_required",
    evidenceCaptureMode: "safe_summary_only",
    notes: [
      "Training candidate demonstrates the same manifest and verification law without storing cookies in source control.",
    ],
  },
  {
    environmentId: "deployment_candidate",
    environmentLabel: "Deployment candidate",
    loginStrategy: "portal_form_verify_only",
    storageStateRef: path.posix.join(OUTPUT_DIR, "playwright.auth/deployment-candidate.json"),
    automationState: "manual_bridge_required",
    evidenceCaptureMode: "safe_summary_only",
    notes: [
      "Deployment candidate remains preflight only until release approval freezes the tuple.",
    ],
  },
] as const;

const SECRET_TEMPLATES: readonly SecretTemplate[] = [
  {
    secretRefId: "secret_366_dohs_dev_client_id",
    environmentId: "development_local_twin",
    bundleId: "bundle_366_dohs_dev_local",
    locator: "secret://vecells/nonprod/dev/pharmacy/dohs/client-id",
    secretProvider: "vault_reference",
    purpose: "DoHS client identifier reference for development local twin.",
    ownerRole: "platform_config_admin",
    rotationCadenceDays: 90,
    expiresAt: "2026-07-23T00:00:00.000Z",
    notes: ["Reference only. The client identifier value stays outside source control."],
  },
  {
    secretRefId: "secret_366_dohs_dev_client_secret",
    environmentId: "development_local_twin",
    bundleId: "bundle_366_dohs_dev_local",
    locator: "secret://vecells/nonprod/dev/pharmacy/dohs/client-secret",
    secretProvider: "vault_reference",
    purpose: "DoHS client secret reference for development local twin.",
    ownerRole: "platform_config_admin",
    rotationCadenceDays: 90,
    expiresAt: "2026-07-23T00:00:00.000Z",
    notes: ["Reference only. Browser evidence must never render this locator."],
  },
  {
    secretRefId: "secret_366_registry_dev_api_token",
    environmentId: "development_local_twin",
    bundleId: "bundle_366_registry_dev_local",
    locator: "secret://vecells/nonprod/dev/pharmacy/local-registry/token",
    secretProvider: "ci_secret_provider",
    purpose: "Local registry override token reference for development local twin.",
    ownerRole: "platform_config_admin",
    rotationCadenceDays: 30,
    expiresAt: "2026-05-24T00:00:00.000Z",
    notes: ["Injected into the local twin only for rehearsed capability overrides."],
  },
  {
    secretRefId: "secret_366_bars_dev_client_cert",
    environmentId: "development_local_twin",
    bundleId: "bundle_366_bars_dev_riverside",
    locator: "secret://vecells/nonprod/dev/pharmacy/bars/client-certificate",
    secretProvider: "vault_reference",
    purpose: "BARS client certificate reference for Riverside local twin dispatch.",
    ownerRole: "integration_operator",
    rotationCadenceDays: 60,
    expiresAt: "2026-06-24T00:00:00.000Z",
    notes: ["Certificate value is never copied into the repository or browser traces."],
  },
  {
    secretRefId: "secret_366_bars_dev_private_key",
    environmentId: "development_local_twin",
    bundleId: "bundle_366_bars_dev_riverside",
    locator: "secret://vecells/nonprod/dev/pharmacy/bars/private-key",
    secretProvider: "vault_reference",
    purpose: "BARS private-key reference for Riverside local twin dispatch.",
    ownerRole: "integration_operator",
    rotationCadenceDays: 60,
    expiresAt: "2026-06-24T00:00:00.000Z",
    notes: ["Private-key material must remain vault-backed at all times."],
  },
  {
    secretRefId: "secret_366_supplier_int_api_key",
    environmentId: "integration_candidate",
    bundleId: "bundle_366_supplier_integration_hilltop",
    locator: "secret://vecells/nonprod/int/pharmacy/supplier-interop/api-key",
    secretProvider: "vault_reference",
    purpose: "Supplier interop API key reference for integration candidate.",
    ownerRole: "supplier_onboarding_lead",
    rotationCadenceDays: 60,
    expiresAt: "2026-06-24T00:00:00.000Z",
    notes: ["Manual bridge required until supplier onboarding evidence is current."],
  },
  {
    secretRefId: "secret_366_supplier_int_tls_key",
    environmentId: "integration_candidate",
    bundleId: "bundle_366_supplier_integration_hilltop",
    locator: "secret://vecells/nonprod/int/pharmacy/supplier-interop/tls-key",
    secretProvider: "vault_reference",
    purpose: "Supplier interop TLS key reference for integration candidate.",
    ownerRole: "supplier_onboarding_lead",
    rotationCadenceDays: 60,
    expiresAt: "2026-06-24T00:00:00.000Z",
    notes: ["Operator handoff required before any submit action."],
  },
  {
    secretRefId: "secret_366_mesh_training_mailbox",
    environmentId: "training_candidate",
    bundleId: "bundle_366_mesh_training_hilltop",
    locator: "secret://vecells/nonprod/train/pharmacy/mesh/mailbox-password",
    secretProvider: "operator_keychain",
    purpose: "MESH mailbox password reference for training candidate.",
    ownerRole: "transport_onboarding_operator",
    rotationCadenceDays: 45,
    expiresAt: "2026-06-08T00:00:00.000Z",
    notes: ["Training mailbox setup remains manual bridge only."],
  },
  {
    secretRefId: "secret_366_mesh_training_shared_key",
    environmentId: "training_candidate",
    bundleId: "bundle_366_mesh_training_hilltop",
    locator: "secret://vecells/nonprod/train/pharmacy/mesh/shared-key",
    secretProvider: "operator_keychain",
    purpose: "MESH shared key reference for training candidate.",
    ownerRole: "transport_onboarding_operator",
    rotationCadenceDays: 45,
    expiresAt: "2026-06-08T00:00:00.000Z",
    notes: ["The portal must only expose the masked fingerprint."],
  },
  {
    secretRefId: "secret_366_dohs_training_client_id",
    environmentId: "training_candidate",
    bundleId: "bundle_366_dohs_training",
    locator: "secret://vecells/nonprod/train/pharmacy/dohs/client-id",
    secretProvider: "ci_secret_provider",
    purpose: "DoHS client identifier reference for training candidate.",
    ownerRole: "platform_config_admin",
    rotationCadenceDays: 90,
    expiresAt: "2026-07-23T00:00:00.000Z",
    notes: ["Used for verify-only and request-pack generation in training."],
  },
  {
    secretRefId: "secret_366_dohs_training_client_secret",
    environmentId: "training_candidate",
    bundleId: "bundle_366_dohs_training",
    locator: "secret://vecells/nonprod/train/pharmacy/dohs/client-secret",
    secretProvider: "ci_secret_provider",
    purpose: "DoHS client secret reference for training candidate.",
    ownerRole: "platform_config_admin",
    rotationCadenceDays: 90,
    expiresAt: "2026-07-23T00:00:00.000Z",
    notes: ["Reference only."],
  },
  {
    secretRefId: "secret_366_dohs_deployment_client_id",
    environmentId: "deployment_candidate",
    bundleId: "bundle_366_dohs_deployment",
    locator: "secret://vecells/nonprod/deploy/pharmacy/dohs/client-id",
    secretProvider: "vault_reference",
    purpose: "DoHS client identifier reference for deployment candidate preflight.",
    ownerRole: "release_manager",
    rotationCadenceDays: 90,
    expiresAt: "2026-07-23T00:00:00.000Z",
    notes: ["Verify-only deployment reference. Browser evidence must remain masked."],
  },
  {
    secretRefId: "secret_366_dohs_deployment_client_secret",
    environmentId: "deployment_candidate",
    bundleId: "bundle_366_dohs_deployment",
    locator: "secret://vecells/nonprod/deploy/pharmacy/dohs/client-secret",
    secretProvider: "vault_reference",
    purpose: "DoHS client secret reference for deployment candidate preflight.",
    ownerRole: "release_manager",
    rotationCadenceDays: 90,
    expiresAt: "2026-07-23T00:00:00.000Z",
    notes: ["Reference only. Never render this locator after the secret boundary."],
  },
  {
    secretRefId: "secret_366_registry_deployment_token",
    environmentId: "deployment_candidate",
    bundleId: "bundle_366_registry_deployment",
    locator: "secret://vecells/nonprod/deploy/pharmacy/local-registry/token",
    secretProvider: "vault_reference",
    purpose: "Deployment candidate registry override token reference.",
    ownerRole: "release_manager",
    rotationCadenceDays: 30,
    expiresAt: "2026-05-24T00:00:00.000Z",
    notes: ["Deployment candidate remains verify-only pending release approval."],
  },
  {
    secretRefId: "secret_366_bars_deployment_client_cert",
    environmentId: "deployment_candidate",
    bundleId: "bundle_366_bars_deployment_riverside",
    locator: "secret://vecells/nonprod/deploy/pharmacy/bars/client-certificate",
    secretProvider: "vault_reference",
    purpose: "BARS client certificate reference for Riverside deployment preflight.",
    ownerRole: "release_manager",
    rotationCadenceDays: 60,
    expiresAt: "2026-06-24T00:00:00.000Z",
    notes: ["Deployment preflight uses deployment-scoped certificate references only."],
  },
  {
    secretRefId: "secret_366_bars_deployment_private_key",
    environmentId: "deployment_candidate",
    bundleId: "bundle_366_bars_deployment_riverside",
    locator: "secret://vecells/nonprod/deploy/pharmacy/bars/private-key",
    secretProvider: "vault_reference",
    purpose: "BARS private-key reference for Riverside deployment preflight.",
    ownerRole: "release_manager",
    rotationCadenceDays: 60,
    expiresAt: "2026-06-24T00:00:00.000Z",
    notes: ["Private-key material remains vault-backed and verify-only in deployment candidate."],
  },
] as const;

const DIRECTORY_SOURCE_TEMPLATES: readonly DirectorySourceTemplate[] = [
  {
    sourceId: "source_366_dohs_dev_riverside",
    environmentId: "development_local_twin",
    providerRef: "provider_366_riverside",
    providerLabel: "Riverside Pharmacy",
    odsCode: "A10001",
    serviceCode: "SRV-PHARMACY-FIRST-A10001",
    directorySourceMode: "dohs_service_search",
    strategicRouteClass: "strategic_current",
    portalAutomationState: "fully_automated",
    verificationState: "verified",
    capabilityVerificationState: "verified",
    supportedTransportModes: ["bars_fhir"],
    secretBundleId: "bundle_366_dohs_dev_local",
    secretRefIds: [
      "secret_366_dohs_dev_client_id",
      "secret_366_dohs_dev_client_secret",
    ],
    capabilityEvidenceRefs: [
      "evidence://366/directory/dev/riverside/service-search",
      "evidence://348/provider/A10001",
    ],
    notes: [
      "Strategic directory route for Riverside local twin.",
      "Capability tuple is the basis for the BARS dispatch binding.",
    ],
  },
  {
    sourceId: "source_366_registry_dev_market_square",
    environmentId: "development_local_twin",
    providerRef: "provider_366_market_square",
    providerLabel: "Market Square Pharmacy",
    odsCode: "A10002",
    serviceCode: "SRV-PHARMACY-FIRST-A10002",
    directorySourceMode: "local_registry_override",
    strategicRouteClass: "local_override",
    portalAutomationState: "fully_automated",
    verificationState: "verified",
    capabilityVerificationState: "verified",
    supportedTransportModes: ["nhsmail_shared_mailbox", "manual_assisted_dispatch"],
    secretBundleId: "bundle_366_registry_dev_local",
    secretRefIds: ["secret_366_registry_dev_api_token"],
    capabilityEvidenceRefs: [
      "evidence://366/directory/dev/market-square/registry-override",
      "evidence://348/provider/A10002",
    ],
    notes: [
      "Local registry override remains bounded to the local twin and never replaces DoHS as the strategic path.",
    ],
  },
  {
    sourceId: "source_366_dohs_integration_hilltop",
    environmentId: "integration_candidate",
    providerRef: "provider_366_hilltop",
    providerLabel: "Hilltop Pharmacy",
    odsCode: "A10003",
    serviceCode: "SRV-PHARMACY-FIRST-A10003",
    directorySourceMode: "dohs_service_search",
    strategicRouteClass: "strategic_current",
    portalAutomationState: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    capabilityVerificationState: "manual_bridge_required",
    supportedTransportModes: ["supplier_interop"],
    secretBundleId: "bundle_366_supplier_integration_hilltop",
    secretRefIds: [
      "secret_366_supplier_int_api_key",
      "secret_366_supplier_int_tls_key",
    ],
    capabilityEvidenceRefs: [
      "evidence://366/directory/int/hilltop/request-pack",
      "evidence://348/provider/A10003",
    ],
    notes: [
      "Integration candidate is strategic but requires manual bridge for supplier-admin onboarding.",
    ],
  },
  {
    sourceId: "source_366_dohs_training_hilltop",
    environmentId: "training_candidate",
    providerRef: "provider_366_hilltop",
    providerLabel: "Hilltop Pharmacy",
    odsCode: "A10003",
    serviceCode: "SRV-PHARMACY-FIRST-A10003",
    directorySourceMode: "dohs_service_search",
    strategicRouteClass: "strategic_current",
    portalAutomationState: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    capabilityVerificationState: "manual_bridge_required",
    supportedTransportModes: ["mesh"],
    secretBundleId: "bundle_366_dohs_training",
    secretRefIds: [
      "secret_366_dohs_training_client_id",
      "secret_366_dohs_training_client_secret",
    ],
    capabilityEvidenceRefs: [
      "evidence://366/directory/train/hilltop/dohs-rehearsal",
      "evidence://348/provider/A10003",
    ],
    notes: [
      "Training candidate keeps the strategic DoHS route visible even when MESH onboarding is manual.",
    ],
  },
  {
    sourceId: "source_366_eps_training_hilltop_legacy",
    environmentId: "training_candidate",
    providerRef: "provider_366_hilltop",
    providerLabel: "Hilltop Pharmacy",
    odsCode: "A10003",
    serviceCode: "SRV-PHARMACY-FIRST-A10003",
    directorySourceMode: "eps_dos_legacy",
    strategicRouteClass: "bounded_legacy_compatibility",
    portalAutomationState: "manual_bridge_required",
    verificationState: "preflight_only",
    capabilityVerificationState: "preflight_only",
    supportedTransportModes: ["mesh"],
    secretBundleId: "bundle_366_dohs_training",
    secretRefIds: [
      "secret_366_dohs_training_client_id",
      "secret_366_dohs_training_client_secret",
    ],
    capabilityEvidenceRefs: [
      "evidence://366/directory/train/hilltop/legacy-fallback",
    ],
    notes: [
      "Legacy discovery remains explicit compatibility only and is never marked fully automated.",
    ],
  },
  {
    sourceId: "source_366_dohs_deployment_riverside",
    environmentId: "deployment_candidate",
    providerRef: "provider_366_riverside",
    providerLabel: "Riverside Pharmacy",
    odsCode: "A10001",
    serviceCode: "SRV-PHARMACY-FIRST-A10001",
    directorySourceMode: "dohs_service_search",
    strategicRouteClass: "strategic_current",
    portalAutomationState: "manual_bridge_required",
    verificationState: "preflight_only",
    capabilityVerificationState: "preflight_only",
    supportedTransportModes: ["bars_fhir"],
    secretBundleId: "bundle_366_dohs_deployment",
    secretRefIds: [
      "secret_366_dohs_deployment_client_id",
      "secret_366_dohs_deployment_client_secret",
    ],
    capabilityEvidenceRefs: [
      "evidence://366/directory/deploy/riverside/dohs-preflight",
      "evidence://348/provider/A10001",
    ],
    notes: [
      "Deployment candidate keeps the strategic DoHS route explicit while remaining verify-only until release freeze approves widening.",
    ],
  },
] as const;

const DISPATCH_BINDING_TEMPLATES: readonly DispatchBindingTemplate[] = [
  {
    bindingId: "binding_366_bars_dev_riverside",
    environmentId: "development_local_twin",
    providerRef: "provider_366_riverside",
    providerLabel: "Riverside Pharmacy",
    odsCode: "A10001",
    transportMode: "bars_fhir",
    portalAutomationState: "fully_automated",
    verificationState: "verified",
    secretBundleId: "bundle_366_bars_dev_riverside",
    secretRefIds: [
      "secret_366_bars_dev_client_cert",
      "secret_366_bars_dev_private_key",
    ],
    supportedTransportModes: ["bars_fhir"],
    evidenceRefs: [
      "evidence://366/dispatch/dev/riverside/bars-local-twin",
      "evidence://350/transport/bars",
    ],
    notes: [
      "The BARS binding is the automated direct dispatch path for the local twin.",
    ],
  },
  {
    bindingId: "binding_366_nhsmail_dev_market_square",
    environmentId: "development_local_twin",
    providerRef: "provider_366_market_square",
    providerLabel: "Market Square Pharmacy",
    odsCode: "A10002",
    transportMode: "nhsmail_shared_mailbox",
    portalAutomationState: "fully_automated",
    verificationState: "verified",
    secretBundleId: null,
    secretRefIds: [],
    supportedTransportModes: ["nhsmail_shared_mailbox", "manual_assisted_dispatch"],
    evidenceRefs: [
      "evidence://366/dispatch/dev/market-square/nhsmail-local-twin",
      "evidence://350/transport/nhsmail",
    ],
    notes: [
      "Shared mailbox dispatch does not store application secrets in source control.",
      "Readiness is bound to the mailbox alias, owner role, and capability tuple.",
    ],
  },
  {
    bindingId: "binding_366_supplier_integration_hilltop",
    environmentId: "integration_candidate",
    providerRef: "provider_366_hilltop",
    providerLabel: "Hilltop Pharmacy",
    odsCode: "A10003",
    transportMode: "supplier_interop",
    portalAutomationState: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    secretBundleId: "bundle_366_supplier_integration_hilltop",
    secretRefIds: [
      "secret_366_supplier_int_api_key",
      "secret_366_supplier_int_tls_key",
    ],
    supportedTransportModes: ["supplier_interop"],
    evidenceRefs: [
      "evidence://366/dispatch/int/hilltop/supplier-request-pack",
      "evidence://350/transport/supplier",
    ],
    notes: [
      "Supplier interop remains manual bridge until the supplier-admin portal confirms the tuple.",
    ],
  },
  {
    bindingId: "binding_366_mesh_training_hilltop",
    environmentId: "training_candidate",
    providerRef: "provider_366_hilltop",
    providerLabel: "Hilltop Pharmacy",
    odsCode: "A10003",
    transportMode: "mesh",
    portalAutomationState: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    secretBundleId: "bundle_366_mesh_training_hilltop",
    secretRefIds: [
      "secret_366_mesh_training_mailbox",
      "secret_366_mesh_training_shared_key",
    ],
    supportedTransportModes: ["mesh"],
    evidenceRefs: [
      "evidence://366/dispatch/train/hilltop/mesh-request-pack",
      "evidence://350/transport/mesh",
    ],
    notes: [
      "Training MESH onboarding is rehearsed in-browser but never auto-submitted.",
    ],
  },
  {
    bindingId: "binding_366_bars_deployment_riverside",
    environmentId: "deployment_candidate",
    providerRef: "provider_366_riverside",
    providerLabel: "Riverside Pharmacy",
    odsCode: "A10001",
    transportMode: "bars_fhir",
    portalAutomationState: "manual_bridge_required",
    verificationState: "preflight_only",
    secretBundleId: "bundle_366_bars_deployment_riverside",
    secretRefIds: [
      "secret_366_bars_deployment_client_cert",
      "secret_366_bars_deployment_private_key",
    ],
    supportedTransportModes: ["bars_fhir"],
    evidenceRefs: [
      "evidence://366/dispatch/deploy/riverside/preflight",
      "evidence://350/transport/bars",
    ],
    notes: [
      "Deployment candidate is verify-only until release approval freezes the provider tuple.",
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

function atUtc(iso: string): string {
  return new Date(iso).toISOString();
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

function envProfile(environmentId: DirectoryDispatchEnvironmentId): NonProdEnvironmentProfile {
  const profile = ENVIRONMENT_PROFILES.find((entry) => entry.environmentId === environmentId);
  if (!profile) {
    throw new Error(`Unknown environment profile: ${environmentId}`);
  }
  return profile;
}

export function buildMaskedFingerprint(secretLocator: string): string {
  return `sha256:${digestFromValue({ secretLocator }, 12)}`;
}

export function maskSecretLocator(secretLocator: string): string {
  const scheme = secretLocator.split("://")[0] ?? "secret";
  return `${scheme}://***${secretLocator.slice(-8)}`;
}

export function redactSensitiveText(
  value: string,
  secretManifest: SecretReferenceManifestDocument,
): string {
  let redacted = value;
  for (const secret of secretManifest.secrets) {
    redacted = redacted.replaceAll(secret.locator, `[redacted:${secret.secretRefId}]`);
    redacted = redacted.replaceAll(secret.secretRefId, `[redacted:${secret.secretRefId}]`);
  }
  redacted = redacted.replaceAll(/client_secret=[^&\s]+/gi, "client_secret=[redacted]");
  redacted = redacted.replaceAll(/bearer\s+[a-z0-9._-]+/gi, "bearer [redacted]");
  redacted = redacted.replaceAll(/password=[^&\s]+/gi, "password=[redacted]");
  return redacted;
}

export function containsSecretLeak(
  value: string,
  secretManifest: SecretReferenceManifestDocument,
): boolean {
  const lowered = value.toLowerCase();
  if (
    lowered.includes("begin private key") ||
    lowered.includes("client_secret=") ||
    lowered.includes("password=")
  ) {
    return true;
  }
  return secretManifest.secrets.some((secret) => value.includes(secret.locator));
}

function transportProfileId(transportMode: PharmacyDispatchTransportMode): string {
  const profile = (
    transportAssuranceRegistryContract as {
      profiles: readonly { transportMode: string; profileId: string }[];
    }
  ).profiles.find((entry) => entry.transportMode === transportMode);
  if (!profile) {
    throw new Error(`Missing transport assurance profile for ${transportMode}`);
  }
  return profile.profileId;
}

function expectedAdapterVersion(transportMode: PharmacyDispatchTransportMode): string {
  return `dispatch-adapter.${transportMode}.350.v1`;
}

function expectedTransformContractRef(
  transportMode: PharmacyDispatchTransportMode,
): string {
  return `phase6.dispatch.transform.${transportMode}.350.v1`;
}

function capabilityTupleHashForTemplate(
  template: DirectorySourceTemplate,
): string {
  return `cap_${digestFromValue({
    environmentId: template.environmentId,
    providerRef: template.providerRef,
    directorySourceMode: template.directorySourceMode,
    strategicRouteClass: template.strategicRouteClass,
    supportedTransportModes: [...template.supportedTransportModes].sort(),
    capabilityVerificationState: template.capabilityVerificationState,
  })}`;
}

function capabilityTupleHashByProviderAndEnvironment(
  providerRef: string,
  environmentId: DirectoryDispatchEnvironmentId,
): string {
  const primary = DIRECTORY_SOURCE_TEMPLATES.find(
    (template) =>
      template.providerRef === providerRef &&
      template.environmentId === environmentId &&
      template.strategicRouteClass !== "bounded_legacy_compatibility",
  );
  if (!primary) {
    throw new Error(
      `Missing strategic directory source for ${providerRef}/${environmentId}`,
    );
  }
  return capabilityTupleHashForTemplate(primary);
}

function dispatchBindingHashForTemplate(
  template: DispatchBindingTemplate,
): string {
  return `bind_${digestFromValue({
    environmentId: template.environmentId,
    providerRef: template.providerRef,
    transportMode: template.transportMode,
    transportAssuranceProfileId: transportProfileId(template.transportMode),
    expectedAdapterVersion: expectedAdapterVersion(template.transportMode),
    expectedTransformContractRef: expectedTransformContractRef(template.transportMode),
    providerCapabilityTupleHash: capabilityTupleHashByProviderAndEnvironment(
      template.providerRef,
      template.environmentId,
    ),
    supportedTransportModes: [...template.supportedTransportModes].sort(),
  })}`;
}

function secretEntryFromTemplate(template: SecretTemplate): SecretReferenceEntry {
  return {
    ...template,
    maskedFingerprint: buildMaskedFingerprint(template.locator),
  };
}

export async function buildSecretReferenceManifest(): Promise<SecretReferenceManifestDocument> {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    environmentProfiles: ENVIRONMENT_PROFILES,
    secrets: SECRET_TEMPLATES.map((template) => secretEntryFromTemplate(template)),
  };
}

function directorySourceEntryFromTemplate(
  template: DirectorySourceTemplate,
): DirectorySourceEntry {
  const profile = envProfile(template.environmentId);
  return {
    ...template,
    environmentLabel: profile.environmentLabel,
    portalSurfaceRef: "/ops/config/pharmacy-directory-sources",
    portalUrlRef: `https://admin.nonprod.vecells.example/${template.environmentId}/directory-sources`,
    capabilityTupleHash: capabilityTupleHashForTemplate(template),
  };
}

export async function buildDirectorySourceManifest(): Promise<DirectorySourceManifestDocument> {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    environmentProfiles: ENVIRONMENT_PROFILES,
    strategicDirectoryModes: ["dohs_service_search", "local_registry_override"],
    boundedLegacyCompatibilityModes: ["eps_dos_legacy"],
    sources: DIRECTORY_SOURCE_TEMPLATES.map((template) =>
      directorySourceEntryFromTemplate(template),
    ),
  };
}

function dispatchBindingEntryFromTemplate(
  template: DispatchBindingTemplate,
): DispatchProviderBindingEntry {
  const profile = envProfile(template.environmentId);
  return {
    ...template,
    environmentLabel: profile.environmentLabel,
    transportAssuranceProfileId: transportProfileId(template.transportMode),
    dispatchAdapterBindingRef: `dispatch_binding/${template.bindingId}`,
    expectedAdapterVersion: expectedAdapterVersion(template.transportMode),
    expectedTransformContractRef: expectedTransformContractRef(template.transportMode),
    portalSurfaceRef: "/ops/config/pharmacy-dispatch-bindings",
    portalUrlRef: `https://admin.nonprod.vecells.example/${template.environmentId}/dispatch-bindings`,
    providerCapabilityTupleHash: capabilityTupleHashByProviderAndEnvironment(
      template.providerRef,
      template.environmentId,
    ),
    dispatchBindingHash: dispatchBindingHashForTemplate(template),
  };
}

export async function buildDispatchProviderBindingManifest(): Promise<DispatchProviderBindingManifestDocument> {
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    environmentProfiles: ENVIRONMENT_PROFILES,
    currentAdapterWave: "par_350",
    bindings: DISPATCH_BINDING_TEMPLATES.map((template) =>
      dispatchBindingEntryFromTemplate(template),
    ),
  };
}

export async function buildDirectoryAndDispatchBindingContract(): Promise<DirectoryDispatchBindingContract> {
  const directoryManifest = await buildDirectorySourceManifest();
  const dispatchManifest = await buildDispatchProviderBindingManifest();
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    controlPlaneVersion: CONTROL_PLANE_VERSION,
    directoryManifestRef: SOURCE_OUTPUT_PATHS.directoryManifest,
    dispatchManifestRef: SOURCE_OUTPUT_PATHS.dispatchManifest,
    secretManifestRef: SOURCE_OUTPUT_PATHS.secretManifest,
    providerInventoryTemplateRef: SOURCE_OUTPUT_PATHS.providerInventoryTemplate,
    nonProdBindingMatrixRef: SOURCE_OUTPUT_PATHS.nonProdBindingMatrix,
    providerCapabilityMatrixRef: SOURCE_OUTPUT_PATHS.providerCapabilityMatrix,
    verificationChecklistRef: SOURCE_OUTPUT_PATHS.verificationChecklist,
    supportedEnvironmentIds: ENVIRONMENT_PROFILES.map((profile) => profile.environmentId),
    automationModes: ["dry_run", "rehearsal", "apply", "verify"],
    strategicDirectoryModes: directoryManifest.strategicDirectoryModes,
    boundedLegacyCompatibilityModes:
      directoryManifest.boundedLegacyCompatibilityModes,
    dispatchTransportModes: [
      ...new Set(dispatchManifest.bindings.map((binding) => binding.transportMode)),
    ],
    fullyAutomatedSourceIds: directoryManifest.sources
      .filter((entry) => entry.portalAutomationState === "fully_automated")
      .map((entry) => entry.sourceId),
    fullyAutomatedBindingIds: dispatchManifest.bindings
      .filter((entry) => entry.portalAutomationState === "fully_automated")
      .map((entry) => entry.bindingId),
    manualBridgeSourceIds: directoryManifest.sources
      .filter((entry) => entry.portalAutomationState === "manual_bridge_required")
      .map((entry) => entry.sourceId),
    manualBridgeBindingIds: dispatchManifest.bindings
      .filter((entry) => entry.portalAutomationState === "manual_bridge_required")
      .map((entry) => entry.bindingId),
    sourceRefs: [
      "blueprint/phase-6-the-pharmacy-loop.md#6C",
      "blueprint/phase-6-the-pharmacy-loop.md#6D",
      "blueprint/phase-0-the-foundation-protocol.md",
      "blueprint/platform-admin-and-config-blueprint.md",
      "blueprint/platform-runtime-and-release-blueprint.md",
      "docs/architecture/348_pharmacy_directory_and_provider_choice_pipeline.md",
      "docs/architecture/350_dispatch_transport_and_retry_expiry_logic.md",
      "docs/architecture/354_pharmacy_operations_queue_and_visibility_api.md",
      "docs/architecture/355_pharmacy_console_backend_projection_contract.md",
    ],
  };
}

function csvEscape(value: unknown): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function renderProviderInventoryTemplateCsv(): Promise<string> {
  const directoryManifest = await buildDirectorySourceManifest();
  const dispatchManifest = await buildDispatchProviderBindingManifest();
  const dispatchByKey = new Map<string, DispatchProviderBindingEntry[]>();

  for (const binding of dispatchManifest.bindings) {
    const key = `${binding.environmentId}:${binding.providerRef}`;
    dispatchByKey.set(key, [...(dispatchByKey.get(key) ?? []), binding]);
  }

  const header = [
    "providerRef",
    "providerLabel",
    "odsCode",
    "environmentId",
    "directorySourceMode",
    "strategicRouteClass",
    "supportedTransportModes",
    "dispatchBindingIds",
    "verificationState",
    "capabilityTupleHash",
  ].join(",");

  const rows = directoryManifest.sources
    .filter((entry) => entry.strategicRouteClass !== "bounded_legacy_compatibility")
    .map((entry) => {
      const key = `${entry.environmentId}:${entry.providerRef}`;
      const bindings = dispatchByKey.get(key) ?? [];
      return [
        entry.providerRef,
        entry.providerLabel,
        entry.odsCode,
        entry.environmentId,
        entry.directorySourceMode,
        entry.strategicRouteClass,
        entry.supportedTransportModes.join("|"),
        bindings.map((binding) => binding.bindingId).join("|"),
        entry.verificationState,
        entry.capabilityTupleHash,
      ]
        .map(csvEscape)
        .join(",");
    })
    .join("\n");

  return `${header}\n${rows}\n`;
}

export async function renderNonProdProviderBindingMatrixCsv(): Promise<string> {
  const dispatchManifest = await buildDispatchProviderBindingManifest();
  const header = [
    "bindingId",
    "environmentId",
    "providerRef",
    "providerLabel",
    "odsCode",
    "transportMode",
    "portalAutomationState",
    "verificationState",
    "transportAssuranceProfileId",
    "expectedAdapterVersion",
    "dispatchBindingHash",
  ].join(",");
  const rows = dispatchManifest.bindings
    .map((entry) =>
      [
        entry.bindingId,
        entry.environmentId,
        entry.providerRef,
        entry.providerLabel,
        entry.odsCode,
        entry.transportMode,
        entry.portalAutomationState,
        entry.verificationState,
        entry.transportAssuranceProfileId,
        entry.expectedAdapterVersion,
        entry.dispatchBindingHash,
      ]
        .map(csvEscape)
        .join(","),
    )
    .join("\n");
  return `${header}\n${rows}\n`;
}

export async function renderProviderCapabilityBindingMatrixCsv(): Promise<string> {
  const directoryManifest = await buildDirectorySourceManifest();
  const dispatchManifest = await buildDispatchProviderBindingManifest();
  const header = [
    "environmentId",
    "providerRef",
    "providerLabel",
    "directorySourceMode",
    "strategicRouteClass",
    "capabilityTupleHash",
    "capabilityVerificationState",
    "supportedTransportModes",
    "dispatchBindingIds",
    "portalAutomationState",
  ].join(",");
  const rows = directoryManifest.sources.map((entry) => {
    const dispatchBindingIds = dispatchManifest.bindings
      .filter(
        (binding) =>
          binding.environmentId === entry.environmentId &&
          binding.providerRef === entry.providerRef,
      )
      .map((binding) => binding.bindingId)
      .join("|");
    return [
      entry.environmentId,
      entry.providerRef,
      entry.providerLabel,
      entry.directorySourceMode,
      entry.strategicRouteClass,
      entry.capabilityTupleHash,
      entry.capabilityVerificationState,
      entry.supportedTransportModes.join("|"),
      dispatchBindingIds,
      entry.portalAutomationState,
    ]
      .map(csvEscape)
      .join(",");
  });
  return `${header}\n${rows.join("\n")}\n`;
}

export async function renderVerificationChecklistCsv(): Promise<string> {
  const rows = [
    [
      "check_366_directory_strategic_current",
      "directory",
      "fail_closed_if_no_strategic_current_source_per_environment",
      "source:buildDirectorySourceManifest",
    ],
    [
      "check_366_directory_legacy_bounded",
      "directory",
      "fail_closed_if_legacy_source_is_marked_fully_automated",
      "source:buildDirectorySourceManifest",
    ],
    [
      "check_366_secret_reference_coverage",
      "secret",
      "fail_closed_if_secret_bundle_references_are_missing_or_cross_environment",
      "source:buildSecretReferenceManifest",
    ],
    [
      "check_366_dispatch_profile_alignment",
      "dispatch",
      "fail_closed_if_transport_profile_or_adapter_version_drifts_from_par_350",
      "source:buildDispatchProviderBindingManifest",
    ],
    [
      "check_366_capability_tuple_alignment",
      "dispatch",
      "fail_closed_if_dispatch_binding_provider_capability_tuple_hash_drifts",
      "source:buildDispatchProviderBindingManifest",
    ],
    [
      "check_366_browser_redaction",
      "browser_automation",
      "fail_closed_if_safe evidence contains secret locators or raw credentials",
      "source:366_redaction_helpers",
    ],
    [
      "check_366_runtime_readiness_summary",
      "verification",
      "fail_closed_if_local_twin_rows_are_not_current_or manual_bridge rows become implicit",
      "source:verifyDirectoryAndDispatchReadiness",
    ],
  ];
  return `checkId,area,failClosedRule,sourceRef\n${rows
    .map((row) => row.map(csvEscape).join(","))
    .join("\n")}\n`;
}

function runtimeStatePath(outputDir: string): string {
  return path.join(outputDir, "366_directory_dispatch_runtime_state.json");
}

function readinessSummaryPath(outputDir: string): string {
  return path.join(outputDir, "366_directory_dispatch_readiness_summary.json");
}

function ensureOutputDir(outputDir?: string): string {
  const resolved = outputDir
    ? path.resolve(outputDir)
    : path.resolve(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

function readRuntimeState(outputDir: string): DirectoryDispatchRuntimeState {
  const filePath = runtimeStatePath(outputDir);
  if (!fs.existsSync(filePath)) {
    return {
      version: CONTROL_PLANE_VERSION,
      directorySources: [],
      dispatchBindings: [],
    };
  }
  return readJson<DirectoryDispatchRuntimeState>(filePath);
}

function writeRuntimeState(
  outputDir: string,
  state: DirectoryDispatchRuntimeState,
): void {
  writeJson(runtimeStatePath(outputDir), state);
}

export async function resetDirectoryAndDispatchRuntime(
  outputDir?: string,
): Promise<void> {
  const resolved = ensureOutputDir(outputDir);
  writeRuntimeState(resolved, {
    version: CONTROL_PLANE_VERSION,
    directorySources: [],
    dispatchBindings: [],
  });
  if (fs.existsSync(readinessSummaryPath(resolved))) {
    fs.rmSync(readinessSummaryPath(resolved));
  }
}

export async function validateDirectoryDispatchControlPlaneDocuments(
  directoryManifest: DirectorySourceManifestDocument,
  dispatchManifest: DispatchProviderBindingManifestDocument,
  secretManifest: SecretReferenceManifestDocument,
): Promise<{ readonly issues: readonly string[] }> {
  const issues: string[] = [];
  const secretRefsById = new Map(
    secretManifest.secrets.map((secret) => [secret.secretRefId, secret]),
  );

  const strategicByEnvironment = new Map<
    DirectoryDispatchEnvironmentId,
    DirectorySourceEntry[]
  >();
  for (const source of directoryManifest.sources) {
    if (
      source.strategicRouteClass !== "bounded_legacy_compatibility" &&
      source.directorySourceMode !== "manual_directory_snapshot"
    ) {
      strategicByEnvironment.set(source.environmentId, [
        ...(strategicByEnvironment.get(source.environmentId) ?? []),
        source,
      ]);
    }
    if (
      source.strategicRouteClass === "bounded_legacy_compatibility" &&
      source.portalAutomationState === "fully_automated"
    ) {
      issues.push(`LEGACY_SOURCE_AUTO_ENABLED:${source.sourceId}`);
    }
    for (const secretRefId of source.secretRefIds) {
      const secret = secretRefsById.get(secretRefId);
      if (!secret) {
        issues.push(`MISSING_SECRET_REF:${source.sourceId}:${secretRefId}`);
        continue;
      }
      if (secret.environmentId !== source.environmentId) {
        issues.push(`SECRET_ENVIRONMENT_DRIFT:${source.sourceId}:${secretRefId}`);
      }
    }
  }

  for (const profile of ENVIRONMENT_PROFILES) {
    if ((strategicByEnvironment.get(profile.environmentId) ?? []).length === 0) {
      issues.push(`NO_STRATEGIC_SOURCE:${profile.environmentId}`);
    }
  }

  for (const binding of dispatchManifest.bindings) {
    const profileId = transportProfileId(binding.transportMode);
    if (profileId !== binding.transportAssuranceProfileId) {
      issues.push(`TRANSPORT_PROFILE_DRIFT:${binding.bindingId}`);
    }
    if (
      binding.expectedAdapterVersion !== expectedAdapterVersion(binding.transportMode)
    ) {
      issues.push(`ADAPTER_VERSION_DRIFT:${binding.bindingId}`);
    }
    if (
      binding.expectedTransformContractRef !==
      expectedTransformContractRef(binding.transportMode)
    ) {
      issues.push(`TRANSFORM_CONTRACT_DRIFT:${binding.bindingId}`);
    }
    const expectedCapabilityTupleHash = capabilityTupleHashByProviderAndEnvironment(
      binding.providerRef,
      binding.environmentId,
    );
    if (expectedCapabilityTupleHash !== binding.providerCapabilityTupleHash) {
      issues.push(`CAPABILITY_TUPLE_DRIFT:${binding.bindingId}`);
    }
    if (!binding.supportedTransportModes.includes(binding.transportMode)) {
      issues.push(`TRANSPORT_NOT_DECLARED:${binding.bindingId}`);
    }
    for (const secretRefId of binding.secretRefIds) {
      const secret = secretRefsById.get(secretRefId);
      if (!secret) {
        issues.push(`MISSING_SECRET_REF:${binding.bindingId}:${secretRefId}`);
        continue;
      }
      if (secret.environmentId !== binding.environmentId) {
        issues.push(`SECRET_ENVIRONMENT_DRIFT:${binding.bindingId}:${secretRefId}`);
      }
    }
  }

  return { issues };
}

export async function readAndValidateDirectoryDispatchControlPlane(
  rootDir = process.cwd(),
): Promise<{
  readonly directoryManifest: DirectorySourceManifestDocument;
  readonly dispatchManifest: DispatchProviderBindingManifestDocument;
  readonly secretManifest: SecretReferenceManifestDocument;
}> {
  const directoryManifest = readJson<DirectorySourceManifestDocument>(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.directoryManifest),
  );
  const dispatchManifest = readJson<DispatchProviderBindingManifestDocument>(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.dispatchManifest),
  );
  const secretManifest = readJson<SecretReferenceManifestDocument>(
    path.join(rootDir, SOURCE_OUTPUT_PATHS.secretManifest),
  );
  const validation = await validateDirectoryDispatchControlPlaneDocuments(
    directoryManifest,
    dispatchManifest,
    secretManifest,
  );
  if (validation.issues.length > 0) {
    throw new Error(validation.issues.join("\n"));
  }
  return { directoryManifest, dispatchManifest, secretManifest };
}

export async function materializeDirectoryDispatchTrackedArtifacts(
  rootDir = process.cwd(),
): Promise<{
  readonly directoryManifestPath: string;
  readonly dispatchManifestPath: string;
  readonly secretManifestPath: string;
  readonly contractPath: string;
  readonly providerInventoryTemplatePath: string;
  readonly nonProdBindingMatrixPath: string;
  readonly providerCapabilityMatrixPath: string;
  readonly verificationChecklistPath: string;
}> {
  const directoryManifestPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.directoryManifest);
  const dispatchManifestPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.dispatchManifest);
  const secretManifestPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.secretManifest);
  const contractPath = path.join(rootDir, SOURCE_OUTPUT_PATHS.contract);
  const providerInventoryTemplatePath = path.join(
    rootDir,
    SOURCE_OUTPUT_PATHS.providerInventoryTemplate,
  );
  const nonProdBindingMatrixPath = path.join(
    rootDir,
    SOURCE_OUTPUT_PATHS.nonProdBindingMatrix,
  );
  const providerCapabilityMatrixPath = path.join(
    rootDir,
    SOURCE_OUTPUT_PATHS.providerCapabilityMatrix,
  );
  const verificationChecklistPath = path.join(
    rootDir,
    SOURCE_OUTPUT_PATHS.verificationChecklist,
  );

  writeJson(directoryManifestPath, await buildDirectorySourceManifest());
  writeJson(dispatchManifestPath, await buildDispatchProviderBindingManifest());
  writeJson(secretManifestPath, await buildSecretReferenceManifest());
  writeJson(contractPath, await buildDirectoryAndDispatchBindingContract());
  writeText(providerInventoryTemplatePath, await renderProviderInventoryTemplateCsv());
  writeText(nonProdBindingMatrixPath, await renderNonProdProviderBindingMatrixCsv());
  writeText(providerCapabilityMatrixPath, await renderProviderCapabilityBindingMatrixCsv());
  writeText(verificationChecklistPath, await renderVerificationChecklistCsv());

  return {
    directoryManifestPath,
    dispatchManifestPath,
    secretManifestPath,
    contractPath,
    providerInventoryTemplatePath,
    nonProdBindingMatrixPath,
    providerCapabilityMatrixPath,
    verificationChecklistPath,
  };
}

export async function bootstrapDirectoryAndDispatchCredentials(
  options: {
    readonly outputDir?: string;
    readonly mode?: DirectoryDispatchMode;
    readonly sourceIds?: readonly string[];
    readonly bindingIds?: readonly string[];
  } = {},
): Promise<DirectoryDispatchBootstrapResult> {
  const mode = options.mode ?? "apply";
  const outputDir = ensureOutputDir(options.outputDir);
  const directoryManifest = await buildDirectorySourceManifest();
  const dispatchManifest = await buildDispatchProviderBindingManifest();
  const runtimeState = readRuntimeState(outputDir);
  const nextDirectorySources = [...runtimeState.directorySources];
  const nextDispatchBindings = [...runtimeState.dispatchBindings];
  const actions: BootstrapAction[] = [];
  const selectedSourceIds = options.sourceIds
    ? new Set(options.sourceIds)
    : options.bindingIds
      ? new Set<string>()
      : null;
  const selectedBindingIds = options.bindingIds
    ? new Set(options.bindingIds)
    : options.sourceIds
      ? new Set<string>()
      : null;
  const configuredAt = GENERATED_AT;

  for (const source of directoryManifest.sources) {
    if (selectedSourceIds && !selectedSourceIds.has(source.sourceId)) {
      continue;
    }
    if (source.portalAutomationState === "manual_bridge_required") {
      actions.push({
        area: "directory_source",
        rowId: source.sourceId,
        environmentId: source.environmentId,
        action: "manual_bridge_required",
        detail:
          "Directory source stays manual bridge until the named operator completes the portal flow.",
      });
      continue;
    }
    if (source.portalAutomationState === "not_required") {
      actions.push({
        area: "directory_source",
        rowId: source.sourceId,
        environmentId: source.environmentId,
        action: "not_required",
        detail: "No browser-driven configuration is required for this source row.",
      });
      continue;
    }

    const existing = nextDirectorySources.find((row) => row.sourceId === source.sourceId);
    if (mode === "dry_run") {
      actions.push({
        area: "directory_source",
        rowId: source.sourceId,
        environmentId: source.environmentId,
        action: "would_configure",
        detail: "Dry-run mode emits the intended mutation without writing runtime state.",
      });
      continue;
    }
    if (existing?.capabilityTupleHash === source.capabilityTupleHash) {
      actions.push({
        area: "directory_source",
        rowId: source.sourceId,
        environmentId: source.environmentId,
        action: "already_current",
        detail: "Runtime directory tuple already matches the manifest capability hash.",
      });
      continue;
    }
    nextDirectorySources.push({
      sourceId: source.sourceId,
      environmentId: source.environmentId,
      capabilityTupleHash: source.capabilityTupleHash,
      configuredAt,
    });
    actions.push({
      area: "directory_source",
      rowId: source.sourceId,
      environmentId: source.environmentId,
      action: "configured",
      detail: mode === "rehearsal"
        ? "Rehearsal mode wrote the masked local twin runtime state."
        : "Apply mode wrote the local twin directory capability tuple.",
    });
  }

  for (const binding of dispatchManifest.bindings) {
    if (selectedBindingIds && !selectedBindingIds.has(binding.bindingId)) {
      continue;
    }
    if (binding.portalAutomationState === "manual_bridge_required") {
      actions.push({
        area: "dispatch_binding",
        rowId: binding.bindingId,
        environmentId: binding.environmentId,
        action: "manual_bridge_required",
        detail:
          "Dispatch binding remains manual bridge until the onboarding portal confirms the tuple.",
      });
      continue;
    }
    if (binding.portalAutomationState === "not_required") {
      actions.push({
        area: "dispatch_binding",
        rowId: binding.bindingId,
        environmentId: binding.environmentId,
        action: "not_required",
        detail: "No credential mutation is required for this dispatch binding row.",
      });
      continue;
    }
    const existing = nextDispatchBindings.find((row) => row.bindingId === binding.bindingId);
    if (mode === "dry_run") {
      actions.push({
        area: "dispatch_binding",
        rowId: binding.bindingId,
        environmentId: binding.environmentId,
        action: "would_configure",
        detail: "Dry-run mode emits the intended dispatch mutation without writing runtime state.",
      });
      continue;
    }
    if (existing?.dispatchBindingHash === binding.dispatchBindingHash) {
      actions.push({
        area: "dispatch_binding",
        rowId: binding.bindingId,
        environmentId: binding.environmentId,
        action: "already_current",
        detail: "Runtime dispatch binding already matches the manifest hash.",
      });
      continue;
    }
    nextDispatchBindings.push({
      bindingId: binding.bindingId,
      environmentId: binding.environmentId,
      dispatchBindingHash: binding.dispatchBindingHash,
      configuredAt,
    });
    actions.push({
      area: "dispatch_binding",
      rowId: binding.bindingId,
      environmentId: binding.environmentId,
      action: "configured",
      detail: mode === "rehearsal"
        ? "Rehearsal mode wrote the masked local twin dispatch binding."
        : "Apply mode wrote the local twin dispatch binding hash.",
    });
  }

  if (mode !== "dry_run" && mode !== "verify") {
    writeRuntimeState(outputDir, {
      version: CONTROL_PLANE_VERSION,
      directorySources: nextDirectorySources,
      dispatchBindings: nextDispatchBindings,
    });
  }

  return {
    taskId: TASK_ID,
    mode,
    outputDir,
    actions,
    runtimeStatePath: runtimeStatePath(outputDir),
  };
}

export async function verifyDirectoryAndDispatchReadiness(
  outputDir?: string,
): Promise<DirectoryDispatchReadinessSummary> {
  const resolvedOutputDir = ensureOutputDir(outputDir);
  const directoryManifest = await buildDirectorySourceManifest();
  const dispatchManifest = await buildDispatchProviderBindingManifest();
  const secretManifest = await buildSecretReferenceManifest();
  const validation = await validateDirectoryDispatchControlPlaneDocuments(
    directoryManifest,
    dispatchManifest,
    secretManifest,
  );
  if (validation.issues.length > 0) {
    throw new Error(validation.issues.join("\n"));
  }
  const runtimeState = readRuntimeState(resolvedOutputDir);
  const sourceChecks: DirectoryCheck[] = directoryManifest.sources.map((source) => {
    const runtime = runtimeState.directorySources.find(
      (row) => row.sourceId === source.sourceId,
    );
    const decisionClasses = [
      source.strategicRouteClass === "strategic_current"
        ? "strategic_current_directory"
        : source.strategicRouteClass === "bounded_legacy_compatibility"
          ? "legacy_compatibility_only"
          : "local_override_directory",
      runtime?.capabilityTupleHash === source.capabilityTupleHash
        ? "capability_tuple_current"
        : source.portalAutomationState === "fully_automated"
          ? "capability_tuple_not_configured"
          : "capability_tuple_manual_bridge",
      source.portalAutomationState === "manual_bridge_required"
        ? "manual_bridge_required"
        : "fully_automated_row",
    ];
    return {
      sourceId: source.sourceId,
      environmentId: source.environmentId,
      providerRef: source.providerRef,
      verificationState:
        source.portalAutomationState === "fully_automated" && runtime
          ? "verified"
          : source.verificationState,
      decisionClasses,
    };
  });

  const dispatchChecks: DispatchCheck[] = dispatchManifest.bindings.map((binding) => {
    const runtime = runtimeState.dispatchBindings.find(
      (row) => row.bindingId === binding.bindingId,
    );
    const decisionClasses = [
      runtime?.dispatchBindingHash === binding.dispatchBindingHash
        ? "dispatch_binding_current"
        : binding.portalAutomationState === "fully_automated"
          ? "dispatch_binding_not_configured"
          : "dispatch_binding_manual_bridge",
      binding.expectedAdapterVersion === expectedAdapterVersion(binding.transportMode)
        ? "adapter_version_aligned"
        : "adapter_version_drift",
      binding.transportAssuranceProfileId === transportProfileId(binding.transportMode)
        ? "transport_profile_aligned"
        : "transport_profile_drift",
      binding.secretRefIds.length > 0
        ? "secret_bundle_present"
        : "no_application_secret_required",
      binding.portalAutomationState === "manual_bridge_required"
        ? "manual_bridge_required"
        : "fully_automated_row",
    ];
    return {
      bindingId: binding.bindingId,
      environmentId: binding.environmentId,
      providerRef: binding.providerRef,
      verificationState:
        binding.portalAutomationState === "fully_automated" && runtime
          ? "verified"
          : binding.verificationState,
      decisionClasses,
    };
  });

  const byEnvironment = ENVIRONMENT_PROFILES.map((profile) => {
    const automatedRowsConfigured =
      sourceChecks.filter(
        (row) =>
          row.environmentId === profile.environmentId &&
          row.decisionClasses.includes("capability_tuple_current"),
      ).length +
      dispatchChecks.filter(
        (row) =>
          row.environmentId === profile.environmentId &&
          row.decisionClasses.includes("dispatch_binding_current"),
      ).length;
    const manualBridgeRows =
      sourceChecks.filter(
        (row) =>
          row.environmentId === profile.environmentId &&
          row.decisionClasses.includes("manual_bridge_required"),
      ).length +
      dispatchChecks.filter(
        (row) =>
          row.environmentId === profile.environmentId &&
          row.decisionClasses.includes("manual_bridge_required"),
      ).length;
    return {
      environmentId: profile.environmentId,
      environmentLabel: profile.environmentLabel,
      readinessState:
        profile.automationState === "fully_automated"
          ? "verified"
          : profile.environmentId === "deployment_candidate"
            ? "preflight_only"
            : "manual_bridge_required",
      automatedRowsConfigured,
      manualBridgeRows,
    } as const;
  });

  const summary: DirectoryDispatchReadinessSummary = {
    taskId: TASK_ID,
    verificationAt: GENERATED_AT,
    sourceChecks,
    dispatchChecks,
    byEnvironment,
  };
  writeJson(readinessSummaryPath(resolvedOutputDir), summary);
  return summary;
}

export async function materializeDirectoryDispatchExamplesToTempDir(): Promise<string> {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "vecells-366-directory-dispatch-"),
  );
  await materializeDirectoryDispatchTrackedArtifacts(outputDir);
  return outputDir;
}
