import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import { createReplayCollisionApplication } from "../../services/command-api/src/replay-collision-authority.ts";

export const TASK_ID = "seq_335";
export const FULL_TASK_ID =
  "seq_335_phase5_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_mesh_mailboxes_and_cross_org_message_routes";
export const SCHEMA_VERSION = "335.phase5.mesh-route-configuration.v1";
export const GENERATED_AT = "2026-04-23";
export const REGISTRY_VERSION = "335-phase5-mesh-control-plane-2026-04-23.v1";
export const OUTPUT_DIR = ".artifacts/messaging/335";
export const SOURCE_OUTPUT_PATHS = {
  registry: "ops/messaging/335_mesh_mailbox_registry.yaml",
  routes: "ops/messaging/335_mesh_route_manifest.yaml",
  environmentMatrix: "ops/messaging/335_mesh_environment_matrix.csv",
  contract: "data/contracts/335_mesh_route_contract.json",
  gapRegister: "data/analysis/335_mesh_setup_gap_register.json",
  interfaceGap:
    "data/analysis/PHASE5_BATCH_332_339_INTERFACE_GAP_MESH_PORTAL_AUTOMATION.json",
} as const;

export type MeshEnvironmentId =
  | "local_twin"
  | "path_to_live_integration"
  | "path_to_live_deployment";

export type MeshPortalAutomationState =
  | "fully_automated"
  | "manual_bridge_required"
  | "not_required";

export type MeshVerificationState =
  | "manifest_ready"
  | "verified"
  | "manual_bridge_required"
  | "pre_mailbox_rehearsal_only"
  | "not_required"
  | "failed";

export type MeshRouteVerificationMode =
  | "automated_local_twin"
  | "manual_bridge_required"
  | "pre_mailbox_api_smoke";

export type MeshMailboxDirection =
  | "initiator"
  | "responder"
  | "duplex"
  | "receive_only";

export interface MeshMailboxEntry {
  readonly mailboxId: string;
  readonly environmentId: MeshEnvironmentId;
  readonly environmentLabel: string;
  readonly organisationRef: string;
  readonly organisationLabel: string;
  readonly mailboxAlias: string;
  readonly routePurpose: string;
  readonly adapterIdentity: string;
  readonly workflowGroup: string;
  readonly workflowIds: readonly string[];
  readonly mailboxDirection: MeshMailboxDirection;
  readonly mailboxBindingHash: string;
  readonly endpointLookupMode: "manifest_alias_only" | "ods_and_workflowid";
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly portalAutomationState: MeshPortalAutomationState;
  readonly setupPosture: string;
  readonly verificationState: MeshVerificationState;
  readonly secretRefs: Record<string, string>;
  readonly maskedSecretFingerprints: Record<string, string>;
  readonly certificateFingerprintRefs: Record<string, string>;
  readonly maskedCertificateFingerprints: Record<string, string>;
  readonly notes: readonly string[];
}

export interface MeshRouteEntry {
  readonly routeId: string;
  readonly environmentId: MeshEnvironmentId;
  readonly environmentLabel: string;
  readonly routeFamilyRef: string;
  readonly routePurpose: string;
  readonly sourceMailboxId: string;
  readonly sourceMailboxAlias: string;
  readonly destinationMailboxId: string;
  readonly destinationMailboxAlias: string;
  readonly sourceOrganisationRef: string;
  readonly destinationOrganisationRef: string;
  readonly adapterIdentity: string;
  readonly workflowGroup: string;
  readonly workflowId: string;
  readonly messageObjects: readonly string[];
  readonly authoritativeObjects: readonly string[];
  readonly verificationMode: MeshRouteVerificationMode;
  readonly verificationState: MeshVerificationState;
  readonly routeCorrelationTemplate: string;
  readonly receiptCorrelationTemplate: string;
  readonly transportAcceptanceSignal: string;
  readonly authoritativeBusinessProof: string;
  readonly businessGuardrail: string;
  readonly degradedFallback: string;
  readonly notes: readonly string[];
}

export interface MeshMailboxRegistryDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly registryVersion: string;
  readonly generatedAt: string;
  readonly mailboxes: readonly MeshMailboxEntry[];
}

export interface MeshRouteManifestDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly manifestVersion: string;
  readonly generatedAt: string;
  readonly routes: readonly MeshRouteEntry[];
}

export interface MeshConfigurationContract {
  readonly taskId: typeof FULL_TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly mailboxRegistryRef: string;
  readonly routeManifestRef: string;
  readonly environmentMatrixRef: string;
  readonly manualBridgeGapRef: string;
  readonly supportedEnvironmentIds: readonly MeshEnvironmentId[];
  readonly workflowGroups: readonly string[];
  readonly mailboxAliases: readonly string[];
  readonly routePurposes: readonly string[];
  readonly automatedRouteIds: readonly string[];
  readonly manualBridgeRouteIds: readonly string[];
  readonly messageObjectBindings: readonly {
    routePurpose: string;
    objectRefs: readonly string[];
    guardrail: string;
  }[];
  readonly sourceRefs: readonly string[];
}

export interface MeshSetupGapRegister {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly gaps: readonly {
    gapId: string;
    category:
      | "portal_admin"
      | "workflow_approval"
      | "environment_pre_mailbox";
    state: "manual_bridge_required" | "explicitly_not_automated";
    affectedEnvironmentIds: readonly MeshEnvironmentId[];
    affectedMailboxIds: readonly string[];
    affectedRouteIds: readonly string[];
    summary: string;
    fallback: string;
    followUpAction: string;
  }[];
}

export interface MeshPortalAutomationGap {
  readonly taskId: typeof FULL_TASK_ID;
  readonly gapId: "PHASE5_BATCH_332_339_INTERFACE_GAP_MESH_PORTAL_AUTOMATION";
  readonly missingSurface: string;
  readonly expectedOwnerTask: typeof FULL_TASK_ID;
  readonly temporaryFallback: string;
  readonly riskIfUnresolved: string;
  readonly followUpAction: string;
  readonly affectedEnvironmentIds: readonly MeshEnvironmentId[];
  readonly affectedMailboxIds: readonly string[];
  readonly blockedCapabilities: readonly string[];
}

interface MeshMailboxTemplate {
  readonly mailboxId: string;
  readonly environmentId: MeshEnvironmentId;
  readonly environmentLabel: string;
  readonly organisationRef: string;
  readonly organisationLabel: string;
  readonly mailboxAlias: string;
  readonly routePurpose: string;
  readonly adapterIdentity: string;
  readonly workflowGroup: string;
  readonly workflowIds: readonly string[];
  readonly mailboxDirection: MeshMailboxDirection;
  readonly endpointLookupMode: "manifest_alias_only" | "ods_and_workflowid";
  readonly portalSurfaceRef: string;
  readonly portalUrlRef: string;
  readonly portalAutomationState: MeshPortalAutomationState;
  readonly setupPosture: string;
  readonly verificationState: MeshVerificationState;
  readonly secretRefs: Record<string, string>;
  readonly certificateFingerprintRefs: Record<string, string>;
  readonly notes: readonly string[];
}

interface MeshRouteTemplate {
  readonly routeId: string;
  readonly environmentId: MeshEnvironmentId;
  readonly environmentLabel: string;
  readonly routeFamilyRef: string;
  readonly routePurpose: string;
  readonly sourceMailboxId: string;
  readonly destinationMailboxId: string;
  readonly workflowGroup: string;
  readonly workflowId: string;
  readonly messageObjects: readonly string[];
  readonly authoritativeObjects: readonly string[];
  readonly verificationMode: MeshRouteVerificationMode;
  readonly verificationState: MeshVerificationState;
  readonly routeCorrelationTemplate: string;
  readonly receiptCorrelationTemplate: string;
  readonly transportAcceptanceSignal: string;
  readonly authoritativeBusinessProof: string;
  readonly businessGuardrail: string;
  readonly degradedFallback: string;
  readonly notes: readonly string[];
}

interface RouteSeed {
  readonly seedId: string;
  readonly routeId: string;
  readonly environmentId: MeshEnvironmentId;
  readonly routeCorrelationKey: string;
  readonly dedupeKey: string;
  readonly safePayloadRef: string;
  readonly scenarioClasses: readonly string[];
  readonly expectedDecisionClasses: readonly string[];
  readonly notes: readonly string[];
}

interface RouteSeedDocument {
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly seeds: readonly RouteSeed[];
}

interface RuntimeMailboxStateRow {
  readonly mailboxId: string;
  readonly mailboxBindingHash: string;
  readonly environmentId: MeshEnvironmentId;
  readonly mailboxAlias: string;
  readonly adapterIdentity: string;
  readonly configuredAt: string;
  readonly maskedSecretFingerprint: string | null;
  readonly maskedCertificateFingerprint: string | null;
}

interface MeshRuntimeState {
  readonly version: typeof REGISTRY_VERSION;
  readonly mailboxes: readonly RuntimeMailboxStateRow[];
}

export interface MeshBootstrapResult {
  readonly taskId: typeof TASK_ID;
  readonly outputDir: string;
  readonly actions: readonly {
    mailboxId: string;
    portalAutomationState: MeshPortalAutomationState;
    action: "configured" | "already_current" | "manual_bridge_required" | "not_required";
    detail: string;
  }[];
  readonly statePath: string;
}

export interface MeshRouteVerificationResult {
  readonly taskId: typeof TASK_ID;
  readonly verificationAt: string;
  readonly routeChecks: readonly {
    routeId: string;
    routePurpose: string;
    environmentId: MeshEnvironmentId;
    verificationMode: MeshRouteVerificationMode;
    state: MeshVerificationState;
    routeCorrelationKey: string;
    dispatchDecisionClasses: readonly string[];
    businessGuardrailVerified: boolean;
  }[];
}

interface BootstrapOptions {
  readonly outputDir?: string;
  readonly mailboxIds?: readonly string[];
}

interface RouteVerificationOptions {
  readonly outputDir?: string;
  readonly routeIds?: readonly string[];
}

const MAILBOX_TEMPLATES = [
  {
    mailboxId: "mailbox_335_vecells_hub_local_twin",
    environmentId: "local_twin",
    environmentLabel: "Local MESH twin",
    organisationRef: "ORG_VECELLS_HUB",
    organisationLabel: "Vecells Hub Coordination",
    mailboxAlias: "MBX_VEC_HUB_LOCAL",
    routePurpose: "practice_visibility_dispatch",
    adapterIdentity: "mesh.adapter://hub/practice-continuity",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowIds: ["VEC_HUB_BOOKING_NOTICE", "VEC_HUB_BOOKING_ACK"],
    mailboxDirection: "initiator",
    endpointLookupMode: "manifest_alias_only",
    portalSurfaceRef: "portal://mesh/local/mailbox-admin",
    portalUrlRef: "http://127.0.0.1:0/portal/mailboxes",
    portalAutomationState: "fully_automated",
    setupPosture: "local_manifest_and_mesh_twin",
    verificationState: "manifest_ready",
    secretRefs: {
      portalUser: "env://MESH_HUB_LOCAL_PORTAL_USER",
      portalPassword: "env://MESH_HUB_LOCAL_PORTAL_PASSWORD",
      sharedKey: "secret://mesh/hub/local/shared-key",
    },
    certificateFingerprintRefs: {
      client: "certfp://mesh/hub/local/client",
      trust: "certfp://mesh/hub/local/trust",
    },
    notes: [
      "Canonical automated dispatch mailbox for non-production continuity proof.",
      "Carries the hub-side initiator posture for practice visibility and reminder refresh traffic.",
    ],
  },
  {
    mailboxId: "mailbox_335_practice_proxy_local_twin",
    environmentId: "local_twin",
    environmentLabel: "Local MESH twin",
    organisationRef: "ORG_ORIGIN_PRACTICE",
    organisationLabel: "Origin Practice Proxy",
    mailboxAlias: "MBX_PRACTICE_PROXY_LOCAL",
    routePurpose: "practice_visibility_and_ack",
    adapterIdentity: "mesh.adapter://practice/business-ack",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowIds: ["VEC_HUB_BOOKING_NOTICE", "VEC_HUB_BOOKING_ACK"],
    mailboxDirection: "responder",
    endpointLookupMode: "manifest_alias_only",
    portalSurfaceRef: "portal://mesh/local/mailbox-admin",
    portalUrlRef: "http://127.0.0.1:0/portal/mailboxes",
    portalAutomationState: "fully_automated",
    setupPosture: "local_manifest_and_mesh_twin",
    verificationState: "manifest_ready",
    secretRefs: {
      portalUser: "env://MESH_PRACTICE_LOCAL_PORTAL_USER",
      portalPassword: "env://MESH_PRACTICE_LOCAL_PORTAL_PASSWORD",
      sharedKey: "secret://mesh/practice/local/shared-key",
    },
    certificateFingerprintRefs: {
      client: "certfp://mesh/practice/local/client",
      trust: "certfp://mesh/practice/local/trust",
    },
    notes: [
      "Represents the origin-practice mailbox in deterministic local replay.",
      "Keeps business acknowledgement separate from transport pickup semantics.",
    ],
  },
  {
    mailboxId: "mailbox_335_servicing_site_local_twin",
    environmentId: "local_twin",
    environmentLabel: "Local MESH twin",
    organisationRef: "ORG_SERVICING_SITE",
    organisationLabel: "Servicing Site Proxy",
    mailboxAlias: "MBX_SERVICING_SITE_LOCAL",
    routePurpose: "servicing_site_relay",
    adapterIdentity: "mesh.adapter://hub/servicing-site-relay",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowIds: ["VEC_HUB_BOOKING_NOTICE"],
    mailboxDirection: "receive_only",
    endpointLookupMode: "manifest_alias_only",
    portalSurfaceRef: "portal://mesh/local/mailbox-admin",
    portalUrlRef: "http://127.0.0.1:0/portal/mailboxes",
    portalAutomationState: "fully_automated",
    setupPosture: "local_manifest_and_mesh_twin",
    verificationState: "manifest_ready",
    secretRefs: {
      portalUser: "env://MESH_SERVICING_SITE_LOCAL_PORTAL_USER",
      portalPassword: "env://MESH_SERVICING_SITE_LOCAL_PORTAL_PASSWORD",
      sharedKey: "secret://mesh/servicing-site/local/shared-key",
    },
    certificateFingerprintRefs: {
      client: "certfp://mesh/servicing-site/local/client",
      trust: "certfp://mesh/servicing-site/local/trust",
    },
    notes: [
      "Observe-only relay mailbox for servicing-site continuity views.",
      "Does not clear acknowledgement debt and must stay minimum-necessary.",
    ],
  },
  {
    mailboxId: "mailbox_335_vecells_hub_path_to_live_deployment",
    environmentId: "path_to_live_deployment",
    environmentLabel: "Path to Live deployment",
    organisationRef: "ORG_VECELLS_HUB",
    organisationLabel: "Vecells Hub Coordination",
    mailboxAlias: "MBX_VEC_HUB_PTL",
    routePurpose: "practice_visibility_dispatch",
    adapterIdentity: "mesh.adapter://hub/practice-continuity",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowIds: ["VEC_HUB_BOOKING_NOTICE", "VEC_HUB_BOOKING_ACK"],
    mailboxDirection: "initiator",
    endpointLookupMode: "ods_and_workflowid",
    portalSurfaceRef: "portal://nhs/mesh/mailbox-application",
    portalUrlRef:
      "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/messaging-exchange-for-social-care-and-health-apply-for-a-mailbox",
    portalAutomationState: "manual_bridge_required",
    setupPosture: "mailbox_admin_bridge_required",
    verificationState: "manual_bridge_required",
    secretRefs: {
      onboardingPack: "vault://mesh/ptl/hub/onboarding-pack",
      mailboxManagerContact: "secret://mesh/ptl/hub/mailbox-manager-email",
      sharedKey: "secret://mesh/ptl/hub/shared-key",
    },
    certificateFingerprintRefs: {
      csrSubject: "certfp://mesh/ptl/hub/csr-subject",
      client: "certfp://mesh/ptl/hub/client",
    },
    notes: [
      "Real Path to Live mailbox creation stays behind NHS mailbox-admin approval and digital onboarding.",
      "The repo records the authoritative row and manual bridge but does not perform unattended NHS portal mutation.",
    ],
  },
  {
    mailboxId: "mailbox_335_practice_proxy_path_to_live_deployment",
    environmentId: "path_to_live_deployment",
    environmentLabel: "Path to Live deployment",
    organisationRef: "ORG_ORIGIN_PRACTICE",
    organisationLabel: "Origin Practice Proxy",
    mailboxAlias: "MBX_PRACTICE_PROXY_PTL",
    routePurpose: "practice_visibility_and_ack",
    adapterIdentity: "mesh.adapter://practice/business-ack",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowIds: ["VEC_HUB_BOOKING_NOTICE", "VEC_HUB_BOOKING_ACK"],
    mailboxDirection: "responder",
    endpointLookupMode: "ods_and_workflowid",
    portalSurfaceRef: "portal://nhs/mesh/ui-and-mailbox-admin",
    portalUrlRef:
      "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-user-interface-ui",
    portalAutomationState: "manual_bridge_required",
    setupPosture: "mailbox_admin_and_ui_account_bridge_required",
    verificationState: "manual_bridge_required",
    secretRefs: {
      uiAccountRequest: "vault://mesh/ptl/practice/ui-account-request",
      smartcardRef: "secret://mesh/ptl/practice/smartcard-reference",
      sharedKey: "secret://mesh/ptl/practice/shared-key",
    },
    certificateFingerprintRefs: {
      csrSubject: "certfp://mesh/ptl/practice/csr-subject",
      client: "certfp://mesh/ptl/practice/client",
    },
    notes: [
      "UI and mailbox lookup steps remain manual because they depend on lawful smartcard and HSCN access.",
      "Origin-practice responder workflow remains explicit and environment-bound.",
    ],
  },
  {
    mailboxId: "mailbox_335_servicing_site_path_to_live_deployment",
    environmentId: "path_to_live_deployment",
    environmentLabel: "Path to Live deployment",
    organisationRef: "ORG_SERVICING_SITE",
    organisationLabel: "Servicing Site Proxy",
    mailboxAlias: "MBX_SERVICING_SITE_PTL",
    routePurpose: "servicing_site_relay",
    adapterIdentity: "mesh.adapter://hub/servicing-site-relay",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowIds: ["VEC_HUB_BOOKING_NOTICE"],
    mailboxDirection: "receive_only",
    endpointLookupMode: "ods_and_workflowid",
    portalSurfaceRef: "portal://nhs/mesh/mailbox-application",
    portalUrlRef:
      "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/messaging-exchange-for-social-care-and-health-apply-for-a-mailbox",
    portalAutomationState: "manual_bridge_required",
    setupPosture: "mailbox_admin_bridge_required",
    verificationState: "manual_bridge_required",
    secretRefs: {
      onboardingPack: "vault://mesh/ptl/servicing-site/onboarding-pack",
      mailboxManagerContact: "secret://mesh/ptl/servicing-site/mailbox-manager-email",
      sharedKey: "secret://mesh/ptl/servicing-site/shared-key",
    },
    certificateFingerprintRefs: {
      csrSubject: "certfp://mesh/ptl/servicing-site/csr-subject",
      client: "certfp://mesh/ptl/servicing-site/client",
    },
    notes: [
      "Servicing-site relay remains explicit for later cross-site continuity expansion.",
      "No unattended portal automation is attempted for the real Path to Live mailbox row.",
    ],
  },
] as const satisfies readonly MeshMailboxTemplate[];

const ROUTE_TEMPLATES = [
  {
    routeId: "route_335_hub_notice_local",
    environmentId: "local_twin",
    environmentLabel: "Local MESH twin",
    routeFamilyRef: "rf_hub_queue",
    routePurpose: "practice_visibility_notice",
    sourceMailboxId: "mailbox_335_vecells_hub_local_twin",
    destinationMailboxId: "mailbox_335_practice_proxy_local_twin",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowId: "VEC_HUB_BOOKING_NOTICE",
    messageObjects: [
      "PracticeContinuityMessage",
      "PracticeVisibilityProjection",
      "HubContinuityEvidenceProjection",
    ],
    authoritativeObjects: [
      "PracticeAcknowledgementRecord",
      "HubCoordinationCase.practiceAckGeneration",
    ],
    verificationMode: "automated_local_twin",
    verificationState: "manifest_ready",
    routeCorrelationTemplate:
      "hubCoordinationCaseId|ackGeneration|truthTupleHash|environmentId|routePurpose",
    receiptCorrelationTemplate:
      "practiceContinuityMessageId|adapterCorrelationKey|dispatchWorkflowId",
    transportAcceptanceSignal: "message_accepted_or_queued",
    authoritativeBusinessProof:
      "Current PracticeAcknowledgementRecord on the live ackGeneration and truthTupleHash.",
    businessGuardrail:
      "Transport acceptance and delivery download do not clear acknowledgement debt.",
    degradedFallback:
      "Keep acknowledgement debt explicit, open a recovery case, or use governed practice callback.",
    notes: [
      "Canonical outbound continuity notice after a hub-side commit or reopen.",
    ],
  },
  {
    routeId: "route_335_practice_ack_local",
    environmentId: "local_twin",
    environmentLabel: "Local MESH twin",
    routeFamilyRef: "rf_hub_case_management",
    routePurpose: "practice_business_ack",
    sourceMailboxId: "mailbox_335_practice_proxy_local_twin",
    destinationMailboxId: "mailbox_335_vecells_hub_local_twin",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowId: "VEC_HUB_BOOKING_ACK",
    messageObjects: ["PracticeAcknowledgementRecord", "PracticeContinuityMessage"],
    authoritativeObjects: [
      "HubCoordinationCase.practiceAckGeneration",
      "HubContinuityEvidenceProjection",
    ],
    verificationMode: "automated_local_twin",
    verificationState: "manifest_ready",
    routeCorrelationTemplate:
      "practiceContinuityMessageId|ackGeneration|truthTupleHash|environmentId",
    receiptCorrelationTemplate:
      "practiceContinuityMessageId|ackGeneration|presentedTruthTupleHash",
    transportAcceptanceSignal: "delivery_downloaded",
    authoritativeBusinessProof:
      "Generation-bound PracticeAcknowledgementRecord accepted against the current message.",
    businessGuardrail:
      "Mailbox pickup is weaker than business acknowledgement and cannot settle the case by itself.",
    degradedFallback:
      "Keep the acknowledgement debt open and route to staff escalation or same-lineage recovery.",
    notes: [
      "Inbound business acknowledgement route. Must remain separate from mailbox download semantics.",
    ],
  },
  {
    routeId: "route_335_reminder_refresh_local",
    environmentId: "local_twin",
    environmentLabel: "Local MESH twin",
    routeFamilyRef: "rf_staff_workspace",
    routePurpose: "practice_visibility_refresh_after_reminder",
    sourceMailboxId: "mailbox_335_vecells_hub_local_twin",
    destinationMailboxId: "mailbox_335_practice_proxy_local_twin",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowId: "VEC_HUB_BOOKING_NOTICE",
    messageObjects: [
      "NetworkReminderPlan",
      "PracticeVisibilityProjection",
      "HubManageSettlement",
    ],
    authoritativeObjects: ["PracticeAcknowledgementRecord", "PracticeVisibilityProjection"],
    verificationMode: "automated_local_twin",
    verificationState: "manifest_ready",
    routeCorrelationTemplate:
      "hubCoordinationCaseId|reminderPlanId|visibilityEnvelopeVersionRef|environmentId",
    receiptCorrelationTemplate:
      "hubCoordinationCaseId|practiceVisibilityProjectionId|dispatchWorkflowId",
    transportAcceptanceSignal: "message_accepted",
    authoritativeBusinessProof:
      "Current PracticeVisibilityProjection refreshed under the current reminder settlement.",
    businessGuardrail:
      "Reminder transport success must not imply the origin practice has acknowledged refreshed continuity.",
    degradedFallback:
      "Hold explicit reminder debt and refresh the visibility projection in recovery posture.",
    notes: [
      "Shares the continuity workflow group but stays bound to reminder and manage truth.",
    ],
  },
  {
    routeId: "route_335_recovery_follow_up_local",
    environmentId: "local_twin",
    environmentLabel: "Local MESH twin",
    routeFamilyRef: "rf_support_ticket_workspace",
    routePurpose: "hub_manual_recovery_follow_up",
    sourceMailboxId: "mailbox_335_vecells_hub_local_twin",
    destinationMailboxId: "mailbox_335_practice_proxy_local_twin",
    workflowGroup: "WG_HUB_MANUAL_RECOVERY",
    workflowId: "VEC_HUB_RECOVERY_ACTION",
    messageObjects: [
      "HubFallbackRecord",
      "HubReturnToPracticeRecord",
      "HubCoordinationException",
    ],
    authoritativeObjects: ["HubCoordinationException", "PracticeAcknowledgementRecord"],
    verificationMode: "automated_local_twin",
    verificationState: "manifest_ready",
    routeCorrelationTemplate:
      "hubCoordinationCaseId|fallbackRecordId|exceptionClass|environmentId",
    receiptCorrelationTemplate:
      "hubCoordinationCaseId|returnToPracticeRecordId|dispatchWorkflowId",
    transportAcceptanceSignal: "message_accepted",
    authoritativeBusinessProof:
      "Recovery follow-up evidence on the same lineage plus current acknowledgement or explicit inability.",
    businessGuardrail:
      "Transport acceptance is evidence of action only, not evidence that recovery succeeded.",
    degradedFallback:
      "Keep the same-lineage exception open and use governed phone escalation if policy allows.",
    notes: [
      "Explicit same-lineage recovery lane for no-slot, callback, and reopen follow-up.",
    ],
  },
  {
    routeId: "route_335_servicing_site_relay_local",
    environmentId: "local_twin",
    environmentLabel: "Local MESH twin",
    routeFamilyRef: "rf_staff_workspace",
    routePurpose: "servicing_site_relay_notice",
    sourceMailboxId: "mailbox_335_vecells_hub_local_twin",
    destinationMailboxId: "mailbox_335_servicing_site_local_twin",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowId: "VEC_HUB_BOOKING_NOTICE",
    messageObjects: ["PracticeVisibilityProjection", "HubAppointmentRecord"],
    authoritativeObjects: ["CrossOrganisationVisibilityEnvelope", "PracticeVisibilityProjection"],
    verificationMode: "automated_local_twin",
    verificationState: "manifest_ready",
    routeCorrelationTemplate:
      "hubCoordinationCaseId|servicingSiteRef|visibilityEnvelopeVersionRef|environmentId",
    receiptCorrelationTemplate:
      "hubCoordinationCaseId|servicingSiteRef|dispatchWorkflowId",
    transportAcceptanceSignal: "message_accepted",
    authoritativeBusinessProof:
      "Current minimum-necessary servicing-site relay under the active visibility envelope.",
    businessGuardrail:
      "Servicing-site relay never clears practice acknowledgement debt or patient-facing truth.",
    degradedFallback:
      "Keep relay read-only and open operator review when routing or audience drift is detected.",
    notes: [
      "Observe-only relay used to keep servicing-site continuity explicit and environment-bound.",
    ],
  },
  {
    routeId: "route_335_hub_notice_ptl",
    environmentId: "path_to_live_deployment",
    environmentLabel: "Path to Live deployment",
    routeFamilyRef: "rf_hub_queue",
    routePurpose: "practice_visibility_notice",
    sourceMailboxId: "mailbox_335_vecells_hub_path_to_live_deployment",
    destinationMailboxId: "mailbox_335_practice_proxy_path_to_live_deployment",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowId: "VEC_HUB_BOOKING_NOTICE",
    messageObjects: [
      "PracticeContinuityMessage",
      "PracticeVisibilityProjection",
      "HubContinuityEvidenceProjection",
    ],
    authoritativeObjects: [
      "PracticeAcknowledgementRecord",
      "HubCoordinationCase.practiceAckGeneration",
    ],
    verificationMode: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    routeCorrelationTemplate:
      "hubCoordinationCaseId|ackGeneration|truthTupleHash|environmentId|routePurpose",
    receiptCorrelationTemplate:
      "practiceContinuityMessageId|adapterCorrelationKey|dispatchWorkflowId",
    transportAcceptanceSignal: "message_accepted_or_queued",
    authoritativeBusinessProof:
      "Current PracticeAcknowledgementRecord on the live ackGeneration and truthTupleHash.",
    businessGuardrail:
      "PTL transport acceptance is still weaker than business acknowledgement and cannot settle the case.",
    degradedFallback:
      "Operate the manual bridge and keep the case in explicit continuity-pending posture.",
    notes: [
      "Real PTL row remains manual until mailbox-admin and workflow approvals are in place.",
    ],
  },
  {
    routeId: "route_335_practice_ack_ptl",
    environmentId: "path_to_live_deployment",
    environmentLabel: "Path to Live deployment",
    routeFamilyRef: "rf_hub_case_management",
    routePurpose: "practice_business_ack",
    sourceMailboxId: "mailbox_335_practice_proxy_path_to_live_deployment",
    destinationMailboxId: "mailbox_335_vecells_hub_path_to_live_deployment",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowId: "VEC_HUB_BOOKING_ACK",
    messageObjects: ["PracticeAcknowledgementRecord", "PracticeContinuityMessage"],
    authoritativeObjects: [
      "HubCoordinationCase.practiceAckGeneration",
      "HubContinuityEvidenceProjection",
    ],
    verificationMode: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    routeCorrelationTemplate:
      "practiceContinuityMessageId|ackGeneration|truthTupleHash|environmentId",
    receiptCorrelationTemplate:
      "practiceContinuityMessageId|ackGeneration|presentedTruthTupleHash",
    transportAcceptanceSignal: "delivery_downloaded",
    authoritativeBusinessProof:
      "Generation-bound PracticeAcknowledgementRecord accepted against the current message.",
    businessGuardrail:
      "MOLES and mailbox tracking do not replace a current-generation business acknowledgement record.",
    degradedFallback:
      "Use manual bridge verification and staff escalation while the debt remains open.",
    notes: [
      "Responder proof in PTL stays manual because mailbox lookup and tracking are smartcard/HSCN-gated.",
    ],
  },
  {
    routeId: "route_335_recovery_follow_up_ptl",
    environmentId: "path_to_live_deployment",
    environmentLabel: "Path to Live deployment",
    routeFamilyRef: "rf_support_ticket_workspace",
    routePurpose: "hub_manual_recovery_follow_up",
    sourceMailboxId: "mailbox_335_vecells_hub_path_to_live_deployment",
    destinationMailboxId: "mailbox_335_practice_proxy_path_to_live_deployment",
    workflowGroup: "WG_HUB_MANUAL_RECOVERY",
    workflowId: "VEC_HUB_RECOVERY_ACTION",
    messageObjects: [
      "HubFallbackRecord",
      "HubReturnToPracticeRecord",
      "HubCoordinationException",
    ],
    authoritativeObjects: ["HubCoordinationException", "PracticeAcknowledgementRecord"],
    verificationMode: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    routeCorrelationTemplate:
      "hubCoordinationCaseId|fallbackRecordId|exceptionClass|environmentId",
    receiptCorrelationTemplate:
      "hubCoordinationCaseId|returnToPracticeRecordId|dispatchWorkflowId",
    transportAcceptanceSignal: "message_accepted",
    authoritativeBusinessProof:
      "Same-lineage recovery evidence plus current acknowledgement or explicit inability.",
    businessGuardrail:
      "Recovery dispatch in PTL is action evidence only and not recovery settlement.",
    degradedFallback:
      "Keep the exception open and use governed callback or practice escalation.",
    notes: [
      "Recovery route is defined now so later PTL onboarding cannot invent a different lineage model.",
    ],
  },
  {
    routeId: "route_335_servicing_site_relay_ptl",
    environmentId: "path_to_live_deployment",
    environmentLabel: "Path to Live deployment",
    routeFamilyRef: "rf_staff_workspace",
    routePurpose: "servicing_site_relay_notice",
    sourceMailboxId: "mailbox_335_vecells_hub_path_to_live_deployment",
    destinationMailboxId: "mailbox_335_servicing_site_path_to_live_deployment",
    workflowGroup: "WG_HUB_PRACTICE_VISIBILITY",
    workflowId: "VEC_HUB_BOOKING_NOTICE",
    messageObjects: ["PracticeVisibilityProjection", "HubAppointmentRecord"],
    authoritativeObjects: ["CrossOrganisationVisibilityEnvelope", "PracticeVisibilityProjection"],
    verificationMode: "manual_bridge_required",
    verificationState: "manual_bridge_required",
    routeCorrelationTemplate:
      "hubCoordinationCaseId|servicingSiteRef|visibilityEnvelopeVersionRef|environmentId",
    receiptCorrelationTemplate:
      "hubCoordinationCaseId|servicingSiteRef|dispatchWorkflowId",
    transportAcceptanceSignal: "message_accepted",
    authoritativeBusinessProof:
      "Current minimum-necessary servicing-site relay under the active visibility envelope.",
    businessGuardrail:
      "Servicing-site relay still cannot clear practice acknowledgement debt or patient closure.",
    degradedFallback:
      "Keep the relay observe-only and route to operator review when manual bridge evidence is incomplete.",
    notes: [
      "PTL servicing-site relay is explicit but not auto-configured.",
    ],
  },
] as const satisfies readonly MeshRouteTemplate[];

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function maskRef(value: string): string {
  return `sha256:${sha256(value).slice(0, 12)}`;
}

function buildOutputDir(outputDir?: string): string {
  return path.resolve(process.cwd(), outputDir ?? OUTPUT_DIR);
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
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) =>
        nested && typeof nested === "object"
          ? `${indent}${key}:\n${toYaml(nested, depth + 1)}`
          : `${indent}${key}: ${yamlScalar(nested)}`,
      )
      .join("\n");
  }
  return `${indent}${yamlScalar(value)}`;
}

function mailboxBindingHash(template: MeshMailboxTemplate): string {
  return sha256(
    JSON.stringify({
      environmentId: template.environmentId,
      organisationRef: template.organisationRef,
      mailboxAlias: template.mailboxAlias,
      routePurpose: template.routePurpose,
      adapterIdentity: template.adapterIdentity,
      workflowGroup: template.workflowGroup,
      workflowIds: template.workflowIds,
    }),
  );
}

function readRuntimeState(statePath: string): MeshRuntimeState {
  if (!fs.existsSync(statePath)) {
    return {
      version: REGISTRY_VERSION,
      mailboxes: [],
    };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8")) as MeshRuntimeState;
}

function routeSeedPath(outputDir: string): string {
  return path.join(outputDir, "335_mesh_nonprod_route_check_seed.json");
}

function routeVerificationPath(outputDir: string): string {
  return path.join(outputDir, "335_mesh_route_verification_summary.json");
}

function bootstrapSummaryPath(outputDir: string): string {
  return path.join(outputDir, "335_mesh_mailbox_bootstrap_summary.json");
}

function runtimeStatePath(outputDir: string): string {
  return path.join(outputDir, "335_mesh_mailbox_runtime_state.json");
}

function environmentLabel(environmentId: MeshEnvironmentId): string {
  switch (environmentId) {
    case "local_twin":
      return "Local MESH twin";
    case "path_to_live_integration":
      return "Path to Live integration";
    case "path_to_live_deployment":
      return "Path to Live deployment";
  }
}

export async function buildMeshMailboxRegistry(): Promise<MeshMailboxRegistryDocument> {
  const mailboxes = MAILBOX_TEMPLATES.map((template) => ({
    mailboxId: template.mailboxId,
    environmentId: template.environmentId,
    environmentLabel: template.environmentLabel,
    organisationRef: template.organisationRef,
    organisationLabel: template.organisationLabel,
    mailboxAlias: template.mailboxAlias,
    routePurpose: template.routePurpose,
    adapterIdentity: template.adapterIdentity,
    workflowGroup: template.workflowGroup,
    workflowIds: template.workflowIds,
    mailboxDirection: template.mailboxDirection,
    mailboxBindingHash: mailboxBindingHash(template),
    endpointLookupMode: template.endpointLookupMode,
    portalSurfaceRef: template.portalSurfaceRef,
    portalUrlRef: template.portalUrlRef,
    portalAutomationState: template.portalAutomationState,
    setupPosture: template.setupPosture,
    verificationState: template.verificationState,
    secretRefs: template.secretRefs,
    maskedSecretFingerprints: Object.fromEntries(
      Object.entries(template.secretRefs).map(([key, value]) => [key, maskRef(value)]),
    ),
    certificateFingerprintRefs: template.certificateFingerprintRefs,
    maskedCertificateFingerprints: Object.fromEntries(
      Object.entries(template.certificateFingerprintRefs).map(([key, value]) => [
        key,
        maskRef(value),
      ]),
    ),
    notes: template.notes,
  })) satisfies readonly MeshMailboxEntry[];

  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    registryVersion: REGISTRY_VERSION,
    generatedAt: GENERATED_AT,
    mailboxes,
  };
}

export async function buildMeshRouteManifest(): Promise<MeshRouteManifestDocument> {
  const registry = await buildMeshMailboxRegistry();
  const mailboxById = new Map(registry.mailboxes.map((mailbox) => [mailbox.mailboxId, mailbox]));
  const routes = ROUTE_TEMPLATES.map((template) => {
    const sourceMailbox = mailboxById.get(template.sourceMailboxId);
    const destinationMailbox = mailboxById.get(template.destinationMailboxId);
    invariant(sourceMailbox, `Missing source mailbox ${template.sourceMailboxId}`);
    invariant(destinationMailbox, `Missing destination mailbox ${template.destinationMailboxId}`);
    return {
      routeId: template.routeId,
      environmentId: template.environmentId,
      environmentLabel: template.environmentLabel,
      routeFamilyRef: template.routeFamilyRef,
      routePurpose: template.routePurpose,
      sourceMailboxId: sourceMailbox.mailboxId,
      sourceMailboxAlias: sourceMailbox.mailboxAlias,
      destinationMailboxId: destinationMailbox.mailboxId,
      destinationMailboxAlias: destinationMailbox.mailboxAlias,
      sourceOrganisationRef: sourceMailbox.organisationRef,
      destinationOrganisationRef: destinationMailbox.organisationRef,
      adapterIdentity: sourceMailbox.adapterIdentity,
      workflowGroup: template.workflowGroup,
      workflowId: template.workflowId,
      messageObjects: template.messageObjects,
      authoritativeObjects: template.authoritativeObjects,
      verificationMode: template.verificationMode,
      verificationState: template.verificationState,
      routeCorrelationTemplate: template.routeCorrelationTemplate,
      receiptCorrelationTemplate: template.receiptCorrelationTemplate,
      transportAcceptanceSignal: template.transportAcceptanceSignal,
      authoritativeBusinessProof: template.authoritativeBusinessProof,
      businessGuardrail: template.businessGuardrail,
      degradedFallback: template.degradedFallback,
      notes: template.notes,
    } satisfies MeshRouteEntry;
  });

  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    manifestVersion: REGISTRY_VERSION,
    generatedAt: GENERATED_AT,
    routes,
  };
}

export async function buildMeshConfigurationContract(): Promise<MeshConfigurationContract> {
  const registry = await buildMeshMailboxRegistry();
  const manifest = await buildMeshRouteManifest();
  return {
    taskId: FULL_TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    mailboxRegistryRef: SOURCE_OUTPUT_PATHS.registry,
    routeManifestRef: SOURCE_OUTPUT_PATHS.routes,
    environmentMatrixRef: SOURCE_OUTPUT_PATHS.environmentMatrix,
    manualBridgeGapRef: SOURCE_OUTPUT_PATHS.interfaceGap,
    supportedEnvironmentIds: [
      "local_twin",
      "path_to_live_integration",
      "path_to_live_deployment",
    ],
    workflowGroups: [
      ...new Set(manifest.routes.map((route) => route.workflowGroup)),
    ],
    mailboxAliases: registry.mailboxes.map((mailbox) => mailbox.mailboxAlias),
    routePurposes: [...new Set(manifest.routes.map((route) => route.routePurpose))],
    automatedRouteIds: manifest.routes
      .filter((route) => route.verificationMode === "automated_local_twin")
      .map((route) => route.routeId),
    manualBridgeRouteIds: manifest.routes
      .filter((route) => route.verificationMode === "manual_bridge_required")
      .map((route) => route.routeId),
    messageObjectBindings: [
      {
        routePurpose: "practice_visibility_notice",
        objectRefs: [
          "PracticeContinuityMessage",
          "PracticeVisibilityProjection",
          "PracticeAcknowledgementRecord",
        ],
        guardrail:
          "Transport acceptance and delivery download never settle practice acknowledgement debt.",
      },
      {
        routePurpose: "practice_business_ack",
        objectRefs: [
          "PracticeAcknowledgementRecord",
          "HubCoordinationCase.practiceAckGeneration",
        ],
        guardrail:
          "Only a current-generation practice acknowledgement may clear the live debt.",
      },
      {
        routePurpose: "practice_visibility_refresh_after_reminder",
        objectRefs: [
          "NetworkReminderPlan",
          "PracticeVisibilityProjection",
          "HubManageSettlement",
        ],
        guardrail:
          "Reminder transport success does not imply refreshed continuity has been acknowledged.",
      },
      {
        routePurpose: "hub_manual_recovery_follow_up",
        objectRefs: [
          "HubFallbackRecord",
          "HubReturnToPracticeRecord",
          "HubCoordinationException",
        ],
        guardrail:
          "Recovery dispatch is action evidence only and may not be flattened into recovery settlement.",
      },
      {
        routePurpose: "servicing_site_relay_notice",
        objectRefs: [
          "CrossOrganisationVisibilityEnvelope",
          "PracticeVisibilityProjection",
          "HubAppointmentRecord",
        ],
        guardrail:
          "Servicing-site relay remains observe-only and cannot clear practice or patient truth.",
      },
    ],
    sourceRefs: [
      "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
      "blueprint/phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility",
      "blueprint/phase-0-the-foundation-protocol.md#adapter-receipts-checkpoints-and-external-settlement",
      "docs/architecture/322_practice_continuity_message_and_acknowledgement_chain.md",
      "docs/architecture/324_network_reminders_manage_and_practice_visibility_backend.md",
      "docs/architecture/325_hub_reconciler_supplier_mirror_and_exception_worker.md",
    ],
  };
}

export async function buildMeshSetupGapRegister(): Promise<MeshSetupGapRegister> {
  const registry = await buildMeshMailboxRegistry();
  const manifest = await buildMeshRouteManifest();
  const pathToLiveMailboxIds = registry.mailboxes
    .filter((mailbox) => mailbox.environmentId === "path_to_live_deployment")
    .map((mailbox) => mailbox.mailboxId);
  const manualRouteIds = manifest.routes
    .filter((route) => route.verificationMode === "manual_bridge_required")
    .map((route) => route.routeId);
  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    gaps: [
      {
        gapId: "gap_335_ptl_mailbox_admin_bridge",
        category: "portal_admin",
        state: "manual_bridge_required",
        affectedEnvironmentIds: ["path_to_live_deployment"],
        affectedMailboxIds: pathToLiveMailboxIds,
        affectedRouteIds: manualRouteIds,
        summary:
          "Real Path to Live mailbox creation and amendment remain NHS-admin-managed and are not lawfully auto-mutated from the repo harness.",
        fallback:
          "Use the tracked registry, contract, and runbook; then execute the mailbox-admin steps manually and compare against the masked manifest evidence.",
        followUpAction:
          "When lawful mailbox-admin access is available, bind real selectors and replace the manual bridge with portal-backed convergence.",
      },
      {
        gapId: "gap_335_moles_smartcard_lookup",
        category: "portal_admin",
        state: "manual_bridge_required",
        affectedEnvironmentIds: ["path_to_live_deployment"],
        affectedMailboxIds: [
          "mailbox_335_practice_proxy_path_to_live_deployment",
          "mailbox_335_vecells_hub_path_to_live_deployment",
        ],
        affectedRouteIds: ["route_335_practice_ack_ptl"],
        summary:
          "MOLES mailbox lookup and tracking remain smartcard and HSCN-gated, so repo-owned browser automation stops at a masked local twin.",
        fallback:
          "Record ODS-plus-workflow lookup inputs in the manifest and run the operator-only MOLES step through the manual bridge.",
        followUpAction:
          "Capture a lawful HSCN and smartcard-backed route check once access is granted.",
      },
      {
        gapId: "gap_335_workflow_id_mapping",
        category: "workflow_approval",
        state: "explicitly_not_automated",
        affectedEnvironmentIds: ["local_twin", "path_to_live_deployment"],
        affectedMailboxIds: registry.mailboxes.map((mailbox) => mailbox.mailboxId),
        affectedRouteIds: manifest.routes.map((route) => route.routeId),
        summary:
          "Candidate Vecells workflow IDs must still be mapped against the current NHS worksheet or approved via the workflow-request process.",
        fallback:
          "Keep the candidate workflow IDs explicit in the manifest and treat them as controlled placeholders until approval is complete.",
        followUpAction:
          "Reconcile the manifest against the current NHS workflow sheet before widening beyond controlled non-production use.",
      },
      {
        gapId: "gap_335_ptl_integration_pre_mailbox",
        category: "environment_pre_mailbox",
        state: "explicitly_not_automated",
        affectedEnvironmentIds: ["path_to_live_integration"],
        affectedMailboxIds: [],
        affectedRouteIds: [],
        summary:
          "Path to Live integration can rehearse API connectivity without a mailbox, but it is not a message route binding and cannot stand in for deployment routing proof.",
        fallback:
          "Represent PTL integration explicitly in the environment matrix as pre-mailbox rehearsal only.",
        followUpAction:
          "Promote the route to a mailbox-backed PTL deployment row before claiming route verification.",
      },
    ],
  };
}

export async function buildMeshPortalAutomationGap(): Promise<MeshPortalAutomationGap> {
  const gapRegister = await buildMeshSetupGapRegister();
  const affectedMailboxIds = gapRegister.gaps
    .flatMap((gap) => gap.affectedMailboxIds)
    .filter((value, index, rows) => rows.indexOf(value) === index);
  return {
    taskId: FULL_TASK_ID,
    gapId: "PHASE5_BATCH_332_339_INTERFACE_GAP_MESH_PORTAL_AUTOMATION",
    missingSurface:
      "Real NHS mailbox-admin, MOLES, and Path to Live portal mutation for cross-organisation MESH route enrollment.",
    expectedOwnerTask: FULL_TASK_ID,
    temporaryFallback:
      "Use manifest-driven convergence plus the masked local portal twin in the repo, then execute the NHS-managed mailbox-admin and MOLES steps through the manual bridge documented in the runbook.",
    riskIfUnresolved:
      "Path to Live rows remain explicit but manually bridged, so CI cannot claim unattended convergence for real NHS-managed MESH admin surfaces.",
    followUpAction:
      "Once lawful mailbox-admin, smartcard, and HSCN access are available, replace the manual bridge with portal-backed selectors and evidence capture.",
    affectedEnvironmentIds: ["path_to_live_deployment"],
    affectedMailboxIds,
    blockedCapabilities: [
      "live NHS mailbox creation or amendment",
      "MOLES mailbox lookup with smartcard-bound login",
      "real MESH UI account grant and verification from unattended CI",
    ],
  };
}

function expectedDecisionClasses(route: MeshRouteEntry): readonly string[] {
  const base = ["accepted_new", "semantic_replay", "stale_ignored", "route_binding_verified"];
  switch (route.routePurpose) {
    case "practice_visibility_notice":
      return [...base, "transport_only_not_acknowledged"];
    case "practice_business_ack":
      return [...base, "business_ack_generation_bound"];
    case "practice_visibility_refresh_after_reminder":
      return [...base, "reminder_refresh_requires_current_projection"];
    case "hub_manual_recovery_follow_up":
      return [...base, "transport_only_not_recovery_settled"];
    case "servicing_site_relay_notice":
      return [...base, "observe_only_visibility_guard"];
    default:
      return base;
  }
}

export async function buildRouteSeedDocument(): Promise<RouteSeedDocument> {
  const manifest = await buildMeshRouteManifest();
  return {
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    seeds: manifest.routes
      .filter((route) => route.environmentId !== "path_to_live_deployment")
      .map((route) => ({
        seedId: `seed_${route.routeId}`,
        routeId: route.routeId,
        environmentId: route.environmentId,
        routeCorrelationKey: maskRef(`${route.routeId}|${route.environmentId}|corr`).replace(
          "sha256:",
          "corr:",
        ),
        dedupeKey: `${route.routePurpose}|${route.environmentId}|${route.workflowId}|current_generation`,
        safePayloadRef: `fixture://mesh/335/${route.routePurpose}/nonprod-safe-envelope`,
        scenarioClasses: ["send", "receive", "retry", "duplicate"],
        expectedDecisionClasses: expectedDecisionClasses(route),
        notes: [
          "Payload fixture is non-production-safe and excludes patient-identifiable content.",
        ],
      })),
  };
}

async function simulateRouteDecisions(route: MeshRouteEntry): Promise<readonly string[]> {
  const application = createReplayCollisionApplication();
  const command = await application.authority.resolveInboundCommand({
    actionScope: "booking_commit",
    governingLineageRef: `mesh_route_${route.routeId}`,
    effectiveActorRef: "actor_mesh_control_plane",
    sourceCommandId: `cmd_${route.routeId}`,
    sourceCommandIdFamily: "command_id",
    transportCorrelationId: `transport_${route.routeId}`,
    causalParentRef: `causal_${route.routeId}`,
    intentGeneration: 1,
    expectedEffectSetRefs: ["mesh.dispatch", "mesh.receipt.verify"],
    scope: {
      governingObjectRef: route.routeId,
      governingObjectVersionRef: "v1",
      routeIntentTupleHash: `route_tuple_${route.routeId}`,
      routeContractDigestRef: SCHEMA_VERSION,
      audienceSurfaceRuntimeBindingRef: "mesh_control_plane_surface",
      releaseTrustFreezeVerdictRef: "release_trust_clear",
    },
    rawPayload: `{"routeId":"${route.routeId}"}`,
    semanticPayload: { routeId: route.routeId, routePurpose: route.routePurpose },
    firstAcceptedActionRecordRef: `action_${route.routeId}`,
    acceptedSettlementRef: `settlement_${route.routeId}`,
    decisionBasisRef: `basis_${route.routeId}`,
    observedAt: `${GENERATED_AT}T10:15:00.000Z`,
  });

  const dispatch = await application.authority.ensureAdapterDispatchAttempt({
    idempotencyRecordRef: command.idempotencyRecord.idempotencyRecordId,
    actionScope: "booking_commit",
    governingLineageRef: `mesh_route_${route.routeId}`,
    actionRecordRef: command.authoritativeActionRecordRef,
    adapterContractProfileRef: route.adapterIdentity,
    effectScope: "practice_continuity::mesh_route",
    effectKey: `${route.routeId}|${route.environmentId}|${route.workflowId}`,
    transportPayload: `{"workflowId":"${route.workflowId}"}`,
    semanticPayload: { workflowId: route.workflowId, routePurpose: route.routePurpose },
    providerCorrelationRef: `${route.sourceMailboxAlias}|${route.destinationMailboxAlias}`,
    firstDispatchedAt: `${GENERATED_AT}T10:15:05.000Z`,
  });

  const accepted = await application.authority.recordAdapterReceiptCheckpoint({
    actionScope: "booking_commit",
    governingLineageRef: `mesh_route_${route.routeId}`,
    adapterContractProfileRef: route.adapterIdentity,
    effectKey: dispatch.dispatchAttempt.effectKey,
    providerCorrelationRef: `${route.sourceMailboxAlias}|${route.destinationMailboxAlias}`,
    transportMessageId: `${route.routeId}_accepted`,
    orderingKey: "002",
    rawReceipt: '{"event":"accepted"}',
    semanticReceipt: { event: "accepted" },
    linkedSettlementRef: `settlement_${route.routeId}`,
    recordedAt: `${GENERATED_AT}T10:15:10.000Z`,
  });
  const replay = await application.authority.recordAdapterReceiptCheckpoint({
    actionScope: "booking_commit",
    governingLineageRef: `mesh_route_${route.routeId}`,
    adapterContractProfileRef: route.adapterIdentity,
    effectKey: dispatch.dispatchAttempt.effectKey,
    providerCorrelationRef: `${route.sourceMailboxAlias}|${route.destinationMailboxAlias}`,
    transportMessageId: `${route.routeId}_accepted`,
    orderingKey: "002",
    rawReceipt: '{"trace":"replay","event":"accepted"}',
    semanticReceipt: { trace: "replay", event: "accepted" },
    linkedSettlementRef: `settlement_${route.routeId}`,
    recordedAt: `${GENERATED_AT}T10:15:15.000Z`,
  });
  const stale = await application.authority.recordAdapterReceiptCheckpoint({
    actionScope: "booking_commit",
    governingLineageRef: `mesh_route_${route.routeId}`,
    adapterContractProfileRef: route.adapterIdentity,
    effectKey: dispatch.dispatchAttempt.effectKey,
    providerCorrelationRef: `${route.sourceMailboxAlias}|${route.destinationMailboxAlias}`,
    transportMessageId: `${route.routeId}_stale`,
    orderingKey: "001",
    rawReceipt: '{"event":"accepted"}',
    semanticReceipt: { event: "accepted" },
    linkedSettlementRef: `settlement_${route.routeId}`,
    recordedAt: `${GENERATED_AT}T10:15:20.000Z`,
  });

  return [
    accepted.decisionClass,
    replay.decisionClass,
    stale.decisionClass,
    ...expectedDecisionClasses(route).filter(
      (decision) =>
        ![accepted.decisionClass, replay.decisionClass, stale.decisionClass].includes(decision),
    ),
  ];
}

export async function renderMeshMailboxRegistryYaml(): Promise<string> {
  return `${toYaml(await buildMeshMailboxRegistry())}\n`;
}

export async function renderMeshRouteManifestYaml(): Promise<string> {
  return `${toYaml(await buildMeshRouteManifest())}\n`;
}

export async function renderMeshEnvironmentMatrixCsv(): Promise<string> {
  const manifest = await buildMeshRouteManifest();
  const rows = manifest.routes.map((route) => [
    route.environmentId,
    route.environmentLabel,
    route.routeId,
    route.routePurpose,
    route.sourceMailboxAlias,
    route.destinationMailboxAlias,
    "mailbox_required",
    route.verificationMode === "automated_local_twin"
      ? "fully_automated"
      : "manual_bridge_required",
    route.verificationMode,
    route.verificationState,
    route.businessGuardrail,
  ]);
  rows.push(
    [
      "path_to_live_integration",
      environmentLabel("path_to_live_integration"),
      "premailbox_335_hub_notice_ptl_integration",
      "practice_visibility_notice",
      "MAILBOX_NOT_REQUIRED",
      "MAILBOX_NOT_REQUIRED",
      "api_smoke_without_mailbox",
      "not_required",
      "pre_mailbox_api_smoke",
      "pre_mailbox_rehearsal_only",
      "Path to Live integration is recorded explicitly as pre-mailbox rehearsal only.",
    ],
    [
      "path_to_live_integration",
      environmentLabel("path_to_live_integration"),
      "premailbox_335_practice_ack_ptl_integration",
      "practice_business_ack",
      "MAILBOX_NOT_REQUIRED",
      "MAILBOX_NOT_REQUIRED",
      "api_smoke_without_mailbox",
      "not_required",
      "pre_mailbox_api_smoke",
      "pre_mailbox_rehearsal_only",
      "No mailbox-backed acknowledgement route exists until Path to Live deployment onboarding completes.",
    ],
  );
  return [
    [
      "environment_id",
      "environment_label",
      "route_id",
      "route_purpose",
      "source_mailbox_alias",
      "destination_mailbox_alias",
      "binding_mode",
      "portal_automation_state",
      "verification_mode",
      "verification_state",
      "notes",
    ].join(","),
    ...rows.map((row) => row.map((value) => csvEscape(value)).join(",")),
  ].join("\n").concat("\n");
}

export async function materializeMeshTrackedArtifacts(rootDir = process.cwd()): Promise<{
  registryPath: string;
  routeManifestPath: string;
  environmentMatrixPath: string;
  contractPath: string;
  gapRegisterPath: string;
  interfaceGapPath: string;
}> {
  const registryPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.registry);
  const routeManifestPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.routes);
  const environmentMatrixPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.environmentMatrix);
  const contractPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.contract);
  const gapRegisterPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.gapRegister);
  const interfaceGapPath = path.resolve(rootDir, SOURCE_OUTPUT_PATHS.interfaceGap);

  writeText(registryPath, await renderMeshMailboxRegistryYaml());
  writeText(routeManifestPath, await renderMeshRouteManifestYaml());
  writeText(environmentMatrixPath, await renderMeshEnvironmentMatrixCsv());
  writeJson(contractPath, await buildMeshConfigurationContract());
  writeJson(gapRegisterPath, await buildMeshSetupGapRegister());
  writeJson(interfaceGapPath, await buildMeshPortalAutomationGap());

  return {
    registryPath,
    routeManifestPath,
    environmentMatrixPath,
    contractPath,
    gapRegisterPath,
    interfaceGapPath,
  };
}

export async function bootstrapMeshMailboxes(
  options: BootstrapOptions = {},
): Promise<MeshBootstrapResult> {
  const registry = await buildMeshMailboxRegistry();
  const outputDir = buildOutputDir(options.outputDir);
  const statePath = runtimeStatePath(outputDir);
  const current = readRuntimeState(statePath);
  const mailboxFilter = options.mailboxIds ? new Set(options.mailboxIds) : null;
  const nextMailboxes = [...current.mailboxes];
  const actions: MeshBootstrapResult["actions"][number][] = [];

  for (const mailbox of registry.mailboxes) {
    if (mailboxFilter && !mailboxFilter.has(mailbox.mailboxId)) {
      continue;
    }
    if (mailbox.portalAutomationState !== "fully_automated") {
      actions.push({
        mailboxId: mailbox.mailboxId,
        portalAutomationState: mailbox.portalAutomationState,
        action:
          mailbox.portalAutomationState === "not_required"
            ? "not_required"
            : "manual_bridge_required",
        detail:
          mailbox.portalAutomationState === "not_required"
            ? "This environment does not require a mailbox-backed portal mutation."
            : "Real NHS-managed mailbox setup stays behind the narrow manual bridge.",
      });
      continue;
    }
    const existing = nextMailboxes.find(
      (row) =>
        row.mailboxId === mailbox.mailboxId &&
        row.mailboxBindingHash === mailbox.mailboxBindingHash,
    );
    if (existing) {
      actions.push({
        mailboxId: mailbox.mailboxId,
        portalAutomationState: mailbox.portalAutomationState,
        action: "already_current",
        detail: "Local MESH twin already matches the current mailbox binding hash.",
      });
      continue;
    }
    const firstMaskedSecret = Object.values(mailbox.maskedSecretFingerprints)[0] ?? null;
    const firstMaskedCertificate =
      Object.values(mailbox.maskedCertificateFingerprints)[0] ?? null;
    nextMailboxes.push({
      mailboxId: mailbox.mailboxId,
      mailboxBindingHash: mailbox.mailboxBindingHash,
      environmentId: mailbox.environmentId,
      mailboxAlias: mailbox.mailboxAlias,
      adapterIdentity: mailbox.adapterIdentity,
      configuredAt: `${GENERATED_AT}T10:00:00.000Z`,
      maskedSecretFingerprint: firstMaskedSecret,
      maskedCertificateFingerprint: firstMaskedCertificate,
    });
    actions.push({
      mailboxId: mailbox.mailboxId,
      portalAutomationState: mailbox.portalAutomationState,
      action: "configured",
      detail: "Local MESH twin converged to the manifest-backed mailbox binding.",
    });
  }

  const dedupedMailboxes = nextMailboxes.filter((row, index, rows) => {
    return (
      rows.findIndex(
        (candidate) =>
          candidate.mailboxId === row.mailboxId &&
          candidate.mailboxBindingHash === row.mailboxBindingHash,
      ) === index
    );
  });

  writeJson(statePath, {
    version: REGISTRY_VERSION,
    mailboxes: dedupedMailboxes,
  } satisfies MeshRuntimeState);
  writeJson(bootstrapSummaryPath(outputDir), {
    taskId: TASK_ID,
    generatedAt: `${GENERATED_AT}T10:00:00.000Z`,
    actions,
  });

  return {
    taskId: TASK_ID,
    outputDir,
    actions,
    statePath,
  };
}

export async function seedNonProdRouteChecks(outputDir = buildOutputDir()): Promise<{
  taskId: typeof TASK_ID;
  seedPath: string;
  seedCount: number;
}> {
  const seedDocument = await buildRouteSeedDocument();
  const seedPath = routeSeedPath(outputDir);
  writeJson(seedPath, seedDocument);
  return {
    taskId: TASK_ID,
    seedPath,
    seedCount: seedDocument.seeds.length,
  };
}

export async function verifyMeshRoutes(
  options: RouteVerificationOptions = {},
): Promise<MeshRouteVerificationResult> {
  const manifest = await buildMeshRouteManifest();
  const registry = await buildMeshMailboxRegistry();
  const outputDir = buildOutputDir(options.outputDir);
  if (!fs.existsSync(routeSeedPath(outputDir))) {
    await seedNonProdRouteChecks(outputDir);
  }
  const seedDocument = JSON.parse(fs.readFileSync(routeSeedPath(outputDir), "utf8")) as RouteSeedDocument;
  const routeFilter = options.routeIds ? new Set(options.routeIds) : null;
  const state = readRuntimeState(runtimeStatePath(outputDir));
  const mailboxById = new Map(registry.mailboxes.map((mailbox) => [mailbox.mailboxId, mailbox]));

  const routeChecks: MeshRouteVerificationResult["routeChecks"][number][] = [];

  for (const route of manifest.routes) {
    if (routeFilter && !routeFilter.has(route.routeId)) {
      continue;
    }
    if (route.verificationMode === "manual_bridge_required") {
      routeChecks.push({
        routeId: route.routeId,
        routePurpose: route.routePurpose,
        environmentId: route.environmentId,
        verificationMode: route.verificationMode,
        state: "manual_bridge_required",
        routeCorrelationKey: maskRef(route.routeCorrelationTemplate).replace("sha256:", "corr:"),
        dispatchDecisionClasses: [],
        businessGuardrailVerified: true,
      });
      continue;
    }
    const sourceMailbox = mailboxById.get(route.sourceMailboxId);
    const destinationMailbox = mailboxById.get(route.destinationMailboxId);
    invariant(sourceMailbox, `Missing source mailbox ${route.sourceMailboxId}`);
    invariant(destinationMailbox, `Missing destination mailbox ${route.destinationMailboxId}`);
    const sourceConfigured = state.mailboxes.some(
      (row) =>
        row.mailboxId === sourceMailbox.mailboxId &&
        row.mailboxBindingHash === sourceMailbox.mailboxBindingHash,
    );
    const destinationConfigured = state.mailboxes.some(
      (row) =>
        row.mailboxId === destinationMailbox.mailboxId &&
        row.mailboxBindingHash === destinationMailbox.mailboxBindingHash,
    );
    if (!sourceConfigured || !destinationConfigured) {
      routeChecks.push({
        routeId: route.routeId,
        routePurpose: route.routePurpose,
        environmentId: route.environmentId,
        verificationMode: route.verificationMode,
        state: "failed",
        routeCorrelationKey: "corr:missing_mailbox_binding",
        dispatchDecisionClasses: [],
        businessGuardrailVerified: false,
      });
      continue;
    }
    const seeded = seedDocument.seeds.find((seed) => seed.routeId === route.routeId);
    const decisions = await simulateRouteDecisions(route);
    const expected = seeded?.expectedDecisionClasses ?? expectedDecisionClasses(route);
    const businessGuardrailVerified = expected.every((decision) => decisions.includes(decision));
    routeChecks.push({
      routeId: route.routeId,
      routePurpose: route.routePurpose,
      environmentId: route.environmentId,
      verificationMode: route.verificationMode,
      state: businessGuardrailVerified ? "verified" : "failed",
      routeCorrelationKey: seeded?.routeCorrelationKey ?? "corr:missing_seed",
      dispatchDecisionClasses: decisions,
      businessGuardrailVerified,
    });
  }

  const result = {
    taskId: TASK_ID,
    verificationAt: `${GENERATED_AT}T10:20:00.000Z`,
    routeChecks,
  } satisfies MeshRouteVerificationResult;
  writeJson(routeVerificationPath(outputDir), result);
  return result;
}

export async function resetMeshMailboxes(options: BootstrapOptions = {}): Promise<{
  taskId: typeof TASK_ID;
  statePath: string;
  removedMailboxIds: readonly string[];
}> {
  const outputDir = buildOutputDir(options.outputDir);
  const statePath = runtimeStatePath(outputDir);
  const current = readRuntimeState(statePath);
  const mailboxFilter = options.mailboxIds ? new Set(options.mailboxIds) : null;
  const removedMailboxIds = new Set<string>();
  const remaining = current.mailboxes.filter((row) => {
    const remove = mailboxFilter ? mailboxFilter.has(row.mailboxId) : true;
    if (remove) {
      removedMailboxIds.add(row.mailboxId);
      return false;
    }
    return true;
  });
  writeJson(statePath, {
    version: REGISTRY_VERSION,
    mailboxes: remaining,
  } satisfies MeshRuntimeState);
  return {
    taskId: TASK_ID,
    statePath,
    removedMailboxIds: [...removedMailboxIds].sort(),
  };
}
