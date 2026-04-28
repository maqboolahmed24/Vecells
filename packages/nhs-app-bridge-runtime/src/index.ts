export const PHASE7_NHS_APP_BRIDGE_RUNTIME_NAME = "Phase7NhsAppBridgeRuntime";
export const PHASE7_NHS_APP_BRIDGE_SCHEMA_VERSION = "381.phase7.nhs-app-bridge-runtime.v1";
export const DEFAULT_NHS_APP_JS_API_BASE_URL = "https://www.nhsapp.service.nhs.uk/js/v2/nhsapp.js";
export const DEFAULT_SCRIPT_VERSION_HINT = "v=2025-10-21";
export const DEFAULT_BRIDGE_CHECKED_AT = "2026-04-27T00:25:15.000Z";
export const DEFAULT_LEASE_EXPIRES_AT = "2026-04-27T00:35:15.000Z";
export const DEFAULT_MAX_BYTE_DOWNLOAD_SIZE = 2_500_000;

export type NhsAppPlatform = "android" | "ios" | "none";
export type BridgeCapabilityState = "verified" | "stale" | "mismatched" | "unavailable";
export type BridgeRuntimeState =
  | "unavailable"
  | "negotiating"
  | "active"
  | "degraded"
  | "frozen"
  | "recovery";
export type BridgeAction =
  | "isEmbedded"
  | "setBackAction"
  | "clearBackAction"
  | "goHome"
  | "goToAppPage"
  | "openOverlay"
  | "openExternal"
  | "addToCalendar"
  | "downloadBytes";
export type BackBehaviour = "native_back_to_previous" | "go_to_app_page" | "custom" | "disabled";
export type BridgeLeaseState = "active" | "stale" | "cleared" | "blocked";
export type EmbeddedEligibilityState =
  | "live"
  | "read_only"
  | "placeholder_only"
  | "safe_browser_handoff"
  | "recovery_required"
  | "blocked";
export type OutboundDestinationClass = "browser_overlay" | "external_browser" | "app_page";
export type AppPageDestination =
  | "HOME_PAGE"
  | "SERVICES"
  | "YOUR_HEALTH"
  | "MESSAGES"
  | "UPLIFT"
  | "ACCOUNT"
  | "GO_BACK";

export interface NavigationContract {
  readonly navigationContractId: string;
  readonly routeId: string;
  readonly routeFamilyRef: string;
  readonly backBehaviour: BackBehaviour;
  readonly preferredExitDestination: AppPageDestination;
  readonly requiredBridgeCapabilities: readonly BridgeAction[];
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly routeFreezeDispositionRef: string;
  readonly allowsExternalBrowser: boolean;
  readonly allowsBrowserOverlay: boolean;
  readonly calendarSupport: "supported" | "not_supported";
  readonly downloadSupport: "supported" | "summary_only" | "not_supported";
  readonly maxDownloadBytes: number;
  readonly allowedExternalHosts: readonly string[];
  readonly allowedOverlayHosts: readonly string[];
  readonly allowedPathPatterns: readonly string[];
  readonly manifestVersionRef: string;
  readonly continuityEvidenceRef: string;
}

export interface PatientEmbeddedNavEligibilitySnapshot {
  readonly embeddedNavEligibilityId: string;
  readonly journeyPathRef: string;
  readonly routeFamilyRef: string;
  readonly patientEmbeddedSessionProjectionRef: string;
  readonly manifestVersionRef: string;
  readonly sessionEpochRef: string;
  readonly subjectBindingVersionRef: string;
  readonly currentBridgeCapabilityMatrixRef: string | null;
  readonly minimumBridgeCapabilitiesRef: string;
  readonly requiredBridgeActionRefs: readonly BridgeAction[];
  readonly allowedBridgeActionRefs: readonly BridgeAction[];
  readonly fallbackActionRefs: readonly BridgeAction[];
  readonly routeFreezeDispositionRef: string;
  readonly continuityEvidenceRef: string;
  readonly eligibilityState: EmbeddedEligibilityState;
  readonly evaluatedAt: string;
}

export interface BridgeCapabilityMatrix {
  readonly matrixId: string;
  readonly platform: NhsAppPlatform;
  readonly detectedApiVersion: "v2" | "unknown";
  readonly manifestVersionRef: string;
  readonly contextFenceRef: string;
  readonly scriptUrl: string;
  readonly scriptVersionHint: string;
  readonly supportedMethods: readonly BridgeAction[];
  readonly maxByteDownloadSize: number;
  readonly supportsGoBack: boolean;
  readonly capabilityState: BridgeCapabilityState;
  readonly checkedAt: string;
  readonly diagnostics: readonly BridgeDiagnostic[];
}

export interface BridgeActionLease {
  readonly leaseId: string;
  readonly routeId: string;
  readonly actionType: BridgeAction;
  readonly manifestVersionRef: string;
  readonly routeFamilyRef: string;
  readonly sessionEpochRef: string;
  readonly lineageFenceEpoch: string;
  readonly selectedAnchorRef: string;
  readonly bridgeCapabilityMatrixRef: string;
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly continuityEvidenceRef: string;
  readonly installedAt: string;
  readonly expiresAt: string;
  readonly clearedAt: string | null;
  readonly ownerRef: string;
  readonly leaseState: BridgeLeaseState;
  readonly clearReason: string | null;
}

export interface OutboundNavigationGrant {
  readonly outboundNavigationGrantId: string;
  readonly routeFamilyRef: string;
  readonly destinationClass: OutboundDestinationClass;
  readonly scrubbedUrlRef: string;
  readonly appDestination?: AppPageDestination | null;
  readonly allowedHostRef: string | null;
  readonly allowedPathPattern: string | null;
  readonly returnContractRef: string;
  readonly selectedAnchorRef: string;
  readonly maskingPolicyRef: string;
  readonly channelProfile: "browser" | "embedded" | "constrained_browser";
  readonly bridgeCapabilityMatrixRef: string;
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly truthTupleHash: string;
  readonly manifestVersionRef: string;
  readonly sessionEpochRef: string;
  readonly lineageFenceEpoch: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly grantState: "live" | "redeemed" | "expired" | "revoked" | "stale";
}

export interface NhsAppCalendarEvent {
  readonly subject: string;
  readonly body: string;
  readonly location: string;
  readonly startTimeEpochInSeconds: number;
  readonly endTimeEpochInSeconds?: number;
}

export interface NhsAppByteDownload {
  readonly base64data: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly byteLength: number;
}

export interface BridgeDiagnostic {
  readonly code: string;
  readonly severity: "info" | "warning" | "blocked";
  readonly actionRef: BridgeAction | null;
  readonly message: string;
}

export interface BridgeActionResult {
  readonly ok: boolean;
  readonly action: BridgeAction;
  readonly blockedReason: string | null;
  readonly diagnostics: readonly BridgeDiagnostic[];
  readonly lease: BridgeActionLease | null;
  readonly destinationUrl: string | null;
  readonly appDestination: AppPageDestination | null;
}

export interface BridgeRuntimeSnapshot {
  readonly bridgeId: string;
  readonly bridgeState: BridgeRuntimeState;
  readonly channelContextRef: string;
  readonly bridgeCapabilityMatrixRef: string;
  readonly patientEmbeddedSessionProjectionRef: string;
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly scriptUrl: string;
  readonly scriptVersionHint: string;
  readonly lastNegotiatedAt: string;
  readonly matrix: BridgeCapabilityMatrix;
  readonly navigationContract: NavigationContract;
  readonly eligibility: PatientEmbeddedNavEligibilitySnapshot;
  readonly visibleCapabilities: readonly BridgeAction[];
  readonly hiddenCapabilities: readonly BridgeDiagnostic[];
  readonly activeLeases: readonly BridgeActionLease[];
}

export interface RawNhsAppJsApi {
  readonly tools?: {
    readonly getAppPlatform?: () => NhsAppPlatform | string;
    readonly isOpenInNHSApp?: () => boolean;
  };
  readonly navigation?: {
    readonly setBackAction?: (backAction: () => void) => void;
    readonly clearBackAction?: () => void;
    readonly goToHomePage?: () => void;
    readonly goToPage?: (appPage: AppPageDestination | string) => void;
    readonly openBrowserOverlay?: (overlayUri: string) => void;
    readonly openExternalBrowser?: (browserUri: string) => void;
  };
  readonly storage?: {
    readonly addEventToCalendar?: (
      subject: string,
      body: string,
      location: string,
      startTimeEpochInSeconds: number,
      endTimeEpochInSeconds?: number,
    ) => void;
    readonly downloadFromBytes?: (base64data: string, filename: string, mimeType: string) => void;
  };
  readonly downloadFromBytes?: (base64data: string, filename: string, mimeType: string) => void;
}

export interface BridgeNegotiationInput {
  readonly api: RawNhsAppJsApi | null;
  readonly navigationContract: NavigationContract;
  readonly eligibility: PatientEmbeddedNavEligibilitySnapshot;
  readonly manifestVersionRef: string;
  readonly contextFenceRef: string;
  readonly scriptBaseUrl?: string;
  readonly scriptVersionHint?: string;
  readonly expectedScriptVersionHint?: string;
  readonly checkedAt?: string;
  readonly routeObservedAt?: string;
  readonly maxByteDownloadSize?: number;
}

export interface BridgeRuntimeInput {
  readonly api: RawNhsAppJsApi | null;
  readonly channelContextRef: string;
  readonly patientEmbeddedSessionProjectionRef: string;
  readonly navigationContract: NavigationContract;
  readonly eligibility: PatientEmbeddedNavEligibilitySnapshot;
  readonly matrix?: BridgeCapabilityMatrix;
  readonly leaseManager?: BridgeActionLeaseManager;
  readonly ownerRef?: string;
  readonly selectedAnchorRef?: string;
  readonly sessionEpochRef?: string;
  readonly lineageFenceEpoch?: string;
  readonly now?: string;
}

export interface NavigationContractValidation {
  readonly valid: boolean;
  readonly diagnostics: readonly BridgeDiagnostic[];
}

const ROUTE_CAPABILITY_DEFAULTS: Record<
  string,
  {
    readonly routeFamilyRef: string;
    readonly requiredBridgeCapabilities: readonly BridgeAction[];
    readonly backBehaviour: BackBehaviour;
    readonly preferredExitDestination: AppPageDestination;
    readonly allowsExternalBrowser: boolean;
    readonly allowsBrowserOverlay: boolean;
    readonly calendarSupport: NavigationContract["calendarSupport"];
    readonly downloadSupport: NavigationContract["downloadSupport"];
    readonly allowedExternalHosts: readonly string[];
    readonly allowedOverlayHosts: readonly string[];
    readonly allowedPathPatterns: readonly string[];
  }
> = {
  jp_request_status: {
    routeFamilyRef: "request_status",
    requiredBridgeCapabilities: ["isEmbedded", "setBackAction", "goToAppPage"],
    backBehaviour: "go_to_app_page",
    preferredExitDestination: "SERVICES",
    allowsExternalBrowser: false,
    allowsBrowserOverlay: false,
    calendarSupport: "not_supported",
    downloadSupport: "summary_only",
    allowedExternalHosts: [],
    allowedOverlayHosts: [],
    allowedPathPatterns: ["/requests/*"],
  },
  jp_manage_local_appointment: {
    routeFamilyRef: "appointment_manage",
    requiredBridgeCapabilities: ["isEmbedded", "setBackAction", "openOverlay", "addToCalendar"],
    backBehaviour: "native_back_to_previous",
    preferredExitDestination: "GO_BACK",
    allowsExternalBrowser: true,
    allowsBrowserOverlay: true,
    calendarSupport: "supported",
    downloadSupport: "summary_only",
    allowedExternalHosts: ["www.nhs.uk", "www.nhsapp.service.nhs.uk"],
    allowedOverlayHosts: ["www.nhs.uk", "www.nhsapp.service.nhs.uk"],
    allowedPathPatterns: ["/appointments/*", "/conditions/*", "/nhs-services/*"],
  },
  jp_pharmacy_status: {
    routeFamilyRef: "pharmacy_status",
    requiredBridgeCapabilities: ["isEmbedded", "setBackAction", "goToAppPage"],
    backBehaviour: "go_to_app_page",
    preferredExitDestination: "SERVICES",
    allowsExternalBrowser: false,
    allowsBrowserOverlay: true,
    calendarSupport: "not_supported",
    downloadSupport: "summary_only",
    allowedExternalHosts: [],
    allowedOverlayHosts: ["www.nhs.uk"],
    allowedPathPatterns: ["/requests/*", "/nhs-services/*"],
  },
};

export function buildNavigationContract(input: {
  readonly routeId: string;
  readonly manifestVersionRef: string;
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly routeFreezeDispositionRef: string;
  readonly continuityEvidenceRef: string;
  readonly routeFamilyRef?: string;
  readonly requiredBridgeCapabilities?: readonly BridgeAction[];
  readonly allowedExternalHosts?: readonly string[];
  readonly allowedOverlayHosts?: readonly string[];
  readonly allowedPathPatterns?: readonly string[];
  readonly maxDownloadBytes?: number;
}): NavigationContract {
  const defaults = ROUTE_CAPABILITY_DEFAULTS[input.routeId] ?? {
    routeFamilyRef: input.routeFamilyRef ?? input.routeId,
    requiredBridgeCapabilities: ["isEmbedded", "setBackAction"],
    backBehaviour: "native_back_to_previous" as const,
    preferredExitDestination: "GO_BACK" as const,
    allowsExternalBrowser: false,
    allowsBrowserOverlay: false,
    calendarSupport: "not_supported" as const,
    downloadSupport: "not_supported" as const,
    allowedExternalHosts: [],
    allowedOverlayHosts: [],
    allowedPathPatterns: [],
  };
  const requiredBridgeCapabilities =
    input.requiredBridgeCapabilities ?? defaults.requiredBridgeCapabilities;
  return freeze({
    navigationContractId: `NavigationContract:381:${input.routeId}:${shortHash({
      routeFamilyRef: input.routeFamilyRef ?? defaults.routeFamilyRef,
      manifestVersionRef: input.manifestVersionRef,
      requiredBridgeCapabilities,
    })}`,
    routeId: input.routeId,
    routeFamilyRef: input.routeFamilyRef ?? defaults.routeFamilyRef,
    backBehaviour: defaults.backBehaviour,
    preferredExitDestination: defaults.preferredExitDestination,
    requiredBridgeCapabilities,
    patientEmbeddedNavEligibilityRef: input.patientEmbeddedNavEligibilityRef,
    routeFreezeDispositionRef: input.routeFreezeDispositionRef,
    allowsExternalBrowser: defaults.allowsExternalBrowser,
    allowsBrowserOverlay: defaults.allowsBrowserOverlay,
    calendarSupport: defaults.calendarSupport,
    downloadSupport: defaults.downloadSupport,
    maxDownloadBytes: input.maxDownloadBytes ?? DEFAULT_MAX_BYTE_DOWNLOAD_SIZE,
    allowedExternalHosts: input.allowedExternalHosts ?? defaults.allowedExternalHosts,
    allowedOverlayHosts: input.allowedOverlayHosts ?? defaults.allowedOverlayHosts,
    allowedPathPatterns: input.allowedPathPatterns ?? defaults.allowedPathPatterns,
    manifestVersionRef: input.manifestVersionRef,
    continuityEvidenceRef: input.continuityEvidenceRef,
  });
}

export function validateNavigationContract(
  contract: NavigationContract,
): NavigationContractValidation {
  const diagnostics: BridgeDiagnostic[] = [];
  if (!contract.routeId || !contract.routeFamilyRef) {
    diagnostics.push(blocked("navigation_contract_route_missing", null));
  }
  if (!contract.patientEmbeddedNavEligibilityRef) {
    diagnostics.push(blocked("navigation_contract_eligibility_missing", null));
  }
  if (!contract.routeFreezeDispositionRef) {
    diagnostics.push(blocked("navigation_contract_freeze_ref_missing", null));
  }
  if (contract.requiredBridgeCapabilities.length === 0) {
    diagnostics.push(warning("navigation_contract_has_no_required_capabilities", null));
  }
  if (contract.allowsExternalBrowser && contract.allowedExternalHosts.length === 0) {
    diagnostics.push(blocked("external_browser_allowed_without_host_allowlist", "openExternal"));
  }
  if (contract.allowsBrowserOverlay && contract.allowedOverlayHosts.length === 0) {
    diagnostics.push(blocked("overlay_allowed_without_host_allowlist", "openOverlay"));
  }
  if (
    contract.maxDownloadBytes > DEFAULT_MAX_BYTE_DOWNLOAD_SIZE &&
    contract.downloadSupport !== "not_supported"
  ) {
    diagnostics.push(warning("download_ceiling_exceeds_default_bridge_ceiling", "downloadBytes"));
  }
  return {
    valid: diagnostics.every((diagnostic) => diagnostic.severity !== "blocked"),
    diagnostics,
  };
}

export function negotiateBridgeCapabilityMatrix(
  input: BridgeNegotiationInput,
): BridgeCapabilityMatrix {
  const scriptVersionHint = input.scriptVersionHint ?? DEFAULT_SCRIPT_VERSION_HINT;
  const scriptUrl = appendScriptHint(
    input.scriptBaseUrl ?? DEFAULT_NHS_APP_JS_API_BASE_URL,
    scriptVersionHint,
  );
  const checkedAt = input.checkedAt ?? DEFAULT_BRIDGE_CHECKED_AT;
  const diagnostics: BridgeDiagnostic[] = [];
  const api = input.api;
  const platform = normalizePlatform(api?.tools?.getAppPlatform?.() ?? "none");
  const isOpen = api?.tools?.isOpenInNHSApp?.() ?? platform !== "none";

  let capabilityState: BridgeCapabilityState = "verified";
  if (!api || !isOpen || platform === "none") {
    capabilityState = "unavailable";
    diagnostics.push(blocked("nhs_app_js_api_unavailable", null));
  }
  if (input.expectedScriptVersionHint && input.expectedScriptVersionHint !== scriptVersionHint) {
    capabilityState = "mismatched";
    diagnostics.push(blocked("script_version_hint_mismatch", null));
  }
  if (input.routeObservedAt && parseTime(checkedAt) < parseTime(input.routeObservedAt)) {
    capabilityState = "stale";
    diagnostics.push(blocked("capability_matrix_stale_for_route_context", null));
  }
  if (input.navigationContract.manifestVersionRef !== input.manifestVersionRef) {
    capabilityState = "mismatched";
    diagnostics.push(blocked("manifest_version_mismatch", null));
  }
  if (input.eligibility.routeFamilyRef !== input.navigationContract.routeFamilyRef) {
    capabilityState = "mismatched";
    diagnostics.push(blocked("route_family_eligibility_mismatch", null));
  }
  const supportedMethods = api ? detectSupportedMethods(api) : [];
  for (const required of input.navigationContract.requiredBridgeCapabilities) {
    if (required !== "isEmbedded" && !supportedMethods.includes(required)) {
      diagnostics.push(blocked("required_bridge_method_missing", required));
    }
  }
  return freeze({
    matrixId: `BridgeCapabilityMatrix:381:${shortHash({
      platform,
      manifestVersionRef: input.manifestVersionRef,
      contextFenceRef: input.contextFenceRef,
      scriptUrl,
      supportedMethods,
      capabilityState,
    })}`,
    platform,
    detectedApiVersion: api ? "v2" : "unknown",
    manifestVersionRef: input.manifestVersionRef,
    contextFenceRef: input.contextFenceRef,
    scriptUrl,
    scriptVersionHint,
    supportedMethods,
    maxByteDownloadSize: Math.min(
      input.maxByteDownloadSize ?? DEFAULT_MAX_BYTE_DOWNLOAD_SIZE,
      input.navigationContract.maxDownloadBytes,
    ),
    supportsGoBack: supportedMethods.includes("goToAppPage"),
    capabilityState,
    checkedAt,
    diagnostics,
  });
}

export function visibleCapabilitiesFor(
  matrix: BridgeCapabilityMatrix,
  contract: NavigationContract,
  eligibility: PatientEmbeddedNavEligibilitySnapshot,
): { visible: BridgeAction[]; hidden: BridgeDiagnostic[] } {
  const visible: BridgeAction[] = [];
  const hidden: BridgeDiagnostic[] = [];
  const routeAllowed = routeAllowedActions(contract);
  for (const action of routeAllowed) {
    if (action === "isEmbedded") {
      visible.push(action);
      continue;
    }
    if (matrix.capabilityState !== "verified") {
      hidden.push(blocked(`capability_${matrix.capabilityState}`, action));
      continue;
    }
    if (eligibility.eligibilityState !== "live") {
      hidden.push(blocked(`eligibility_${eligibility.eligibilityState}`, action));
      continue;
    }
    if (!matrix.supportedMethods.includes(action)) {
      hidden.push(blocked("runtime_method_missing", action));
      continue;
    }
    if (!eligibility.allowedBridgeActionRefs.includes(action)) {
      hidden.push(blocked("eligibility_action_not_allowed", action));
      continue;
    }
    visible.push(action);
  }
  return { visible: unique(visible), hidden };
}

export class BridgeActionLeaseManager {
  private readonly leases = new Map<string, BridgeActionLease>();

  installLease(
    input: Omit<BridgeActionLease, "leaseId" | "clearedAt" | "leaseState" | "clearReason">,
  ): BridgeActionLease {
    const lease = freeze({
      ...input,
      leaseId: `BridgeActionLease:381:${shortHash(input)}`,
      clearedAt: null,
      leaseState: "active" as const,
      clearReason: null,
    });
    this.leases.set(lease.leaseId, lease);
    return lease;
  }

  clearLease(leaseId: string, reason: string, clearedAt: string): BridgeActionLease | null {
    const lease = this.leases.get(leaseId);
    if (!lease) {
      return null;
    }
    const cleared = freeze({
      ...lease,
      leaseState: "cleared" as const,
      clearedAt,
      clearReason: reason,
    });
    this.leases.set(leaseId, cleared);
    return cleared;
  }

  clearActiveForRoute(routeId: string, reason: string, clearedAt: string): BridgeActionLease[] {
    return this.listLeases()
      .filter((lease) => lease.routeId === routeId && lease.leaseState === "active")
      .map((lease) => this.clearLease(lease.leaseId, reason, clearedAt))
      .filter((lease): lease is BridgeActionLease => lease !== null);
  }

  markStaleOnFenceDrift(
    fence: Partial<
      Pick<
        BridgeActionLease,
        | "manifestVersionRef"
        | "routeFamilyRef"
        | "sessionEpochRef"
        | "lineageFenceEpoch"
        | "bridgeCapabilityMatrixRef"
        | "patientEmbeddedNavEligibilityRef"
        | "continuityEvidenceRef"
      >
    >,
    reason: string,
    observedAt: string,
  ): BridgeActionLease[] {
    const stale: BridgeActionLease[] = [];
    for (const lease of this.listLeases()) {
      if (lease.leaseState !== "active") {
        continue;
      }
      const drifted = Object.entries(fence).some(([key, value]) => {
        if (value == null) {
          return false;
        }
        return lease[key as keyof BridgeActionLease] !== value;
      });
      if (!drifted) {
        continue;
      }
      const updated = freeze({
        ...lease,
        leaseState: "stale" as const,
        clearedAt: observedAt,
        clearReason: reason,
      });
      this.leases.set(lease.leaseId, updated);
      stale.push(updated);
    }
    return stale;
  }

  getActiveLease(routeId: string, actionType: BridgeAction): BridgeActionLease | null {
    return (
      this.listLeases().find(
        (lease) =>
          lease.routeId === routeId &&
          lease.actionType === actionType &&
          lease.leaseState === "active",
      ) ?? null
    );
  }

  listLeases(): BridgeActionLease[] {
    return Array.from(this.leases.values()).map((lease) => clone(lease));
  }
}

export class NhsAppBridgeRuntime {
  private readonly api: RawNhsAppJsApi | null;
  private readonly leaseManager: BridgeActionLeaseManager;
  private readonly ownerRef: string;
  private readonly selectedAnchorRef: string;
  private readonly sessionEpochRef: string;
  private readonly lineageFenceEpoch: string;
  private readonly now: string;
  readonly channelContextRef: string;
  readonly patientEmbeddedSessionProjectionRef: string;
  readonly navigationContract: NavigationContract;
  readonly eligibility: PatientEmbeddedNavEligibilitySnapshot;
  readonly matrix: BridgeCapabilityMatrix;

  constructor(input: BridgeRuntimeInput) {
    this.api = input.api;
    this.channelContextRef = input.channelContextRef;
    this.patientEmbeddedSessionProjectionRef = input.patientEmbeddedSessionProjectionRef;
    this.navigationContract = input.navigationContract;
    this.eligibility = input.eligibility;
    this.matrix =
      input.matrix ??
      negotiateBridgeCapabilityMatrix({
        api: input.api,
        navigationContract: input.navigationContract,
        eligibility: input.eligibility,
        manifestVersionRef: input.navigationContract.manifestVersionRef,
        contextFenceRef: input.channelContextRef,
      });
    this.leaseManager = input.leaseManager ?? new BridgeActionLeaseManager();
    this.ownerRef = input.ownerRef ?? PHASE7_NHS_APP_BRIDGE_RUNTIME_NAME;
    this.selectedAnchorRef = input.selectedAnchorRef ?? "SelectedAnchor:phase7-381-default";
    this.sessionEpochRef = input.sessionEpochRef ?? input.eligibility.sessionEpochRef;
    this.lineageFenceEpoch = input.lineageFenceEpoch ?? "LineageFence:phase7-381-default";
    this.now = input.now ?? DEFAULT_BRIDGE_CHECKED_AT;
  }

  isEmbedded(): boolean {
    return this.matrix.platform !== "none" && this.matrix.capabilityState !== "unavailable";
  }

  setBackAction(backAction: () => void): BridgeActionResult {
    const allowed = this.assertActionAllowed("setBackAction");
    if (!allowed.ok) {
      return allowed;
    }
    const lease = this.leaseManager.installLease({
      routeId: this.navigationContract.routeId,
      actionType: "setBackAction",
      manifestVersionRef: this.navigationContract.manifestVersionRef,
      routeFamilyRef: this.navigationContract.routeFamilyRef,
      sessionEpochRef: this.sessionEpochRef,
      lineageFenceEpoch: this.lineageFenceEpoch,
      selectedAnchorRef: this.selectedAnchorRef,
      bridgeCapabilityMatrixRef: this.matrix.matrixId,
      patientEmbeddedNavEligibilityRef: this.eligibility.embeddedNavEligibilityId,
      continuityEvidenceRef: this.navigationContract.continuityEvidenceRef,
      installedAt: this.now,
      expiresAt: DEFAULT_LEASE_EXPIRES_AT,
      ownerRef: this.ownerRef,
    });
    this.api?.navigation?.setBackAction?.(backAction);
    return ok("setBackAction", lease);
  }

  clearBackAction(reason = "route_exit"): BridgeActionResult {
    this.api?.navigation?.clearBackAction?.();
    const active = this.leaseManager.getActiveLease(
      this.navigationContract.routeId,
      "setBackAction",
    );
    const lease = active ? this.leaseManager.clearLease(active.leaseId, reason, this.now) : null;
    return ok("clearBackAction", lease);
  }

  clearForRouteExit(reason = "route_exit"): readonly BridgeActionLease[] {
    this.api?.navigation?.clearBackAction?.();
    return this.leaseManager.clearActiveForRoute(this.navigationContract.routeId, reason, this.now);
  }

  clearForFenceDrift(
    fence: Parameters<BridgeActionLeaseManager["markStaleOnFenceDrift"]>[0],
    reason = "fence_drift",
  ): readonly BridgeActionLease[] {
    this.api?.navigation?.clearBackAction?.();
    return this.leaseManager.markStaleOnFenceDrift(fence, reason, this.now);
  }

  goHome(): BridgeActionResult {
    const allowed = this.assertActionAllowed("goHome");
    if (!allowed.ok) {
      return allowed;
    }
    this.api?.navigation?.goToHomePage?.();
    return ok("goHome", null);
  }

  goToAppPage(destination: AppPageDestination, grant: OutboundNavigationGrant): BridgeActionResult {
    const allowed = this.assertActionAllowed("goToAppPage");
    if (!allowed.ok) {
      return allowed;
    }
    const grantResult = this.assertGrant("app_page", null, grant, destination);
    if (!grantResult.ok) {
      return grantResult;
    }
    this.api?.navigation?.goToPage?.(destination);
    return { ...ok("goToAppPage", null), appDestination: destination };
  }

  openOverlay(url: string, grant: OutboundNavigationGrant): BridgeActionResult {
    const allowed = this.assertActionAllowed("openOverlay");
    if (!allowed.ok) {
      return allowed;
    }
    const grantResult = this.assertGrant("browser_overlay", url, grant, null);
    if (!grantResult.ok) {
      return grantResult;
    }
    this.api?.navigation?.openBrowserOverlay?.(url);
    return { ...ok("openOverlay", null), destinationUrl: url };
  }

  openExternal(url: string, grant: OutboundNavigationGrant): BridgeActionResult {
    const allowed = this.assertActionAllowed("openExternal");
    if (!allowed.ok) {
      return allowed;
    }
    const grantResult = this.assertGrant("external_browser", url, grant, null);
    if (!grantResult.ok) {
      return grantResult;
    }
    this.api?.navigation?.openExternalBrowser?.(url);
    return { ...ok("openExternal", null), destinationUrl: url };
  }

  addToCalendar(event: NhsAppCalendarEvent): BridgeActionResult {
    const allowed = this.assertActionAllowed("addToCalendar");
    if (!allowed.ok) {
      return allowed;
    }
    this.api?.storage?.addEventToCalendar?.(
      event.subject,
      event.body,
      event.location,
      event.startTimeEpochInSeconds,
      event.endTimeEpochInSeconds,
    );
    return ok("addToCalendar", null);
  }

  downloadBytes(file: NhsAppByteDownload): BridgeActionResult {
    const allowed = this.assertActionAllowed("downloadBytes");
    if (!allowed.ok) {
      return allowed;
    }
    if (file.byteLength > this.matrix.maxByteDownloadSize) {
      return blockedResult("downloadBytes", "payload_too_large", [
        blocked("payload_too_large", "downloadBytes"),
      ]);
    }
    const download = this.api?.storage?.downloadFromBytes ?? this.api?.downloadFromBytes;
    download?.(file.base64data, file.filename, file.mimeType);
    return ok("downloadBytes", null);
  }

  snapshot(): BridgeRuntimeSnapshot {
    const capabilities = visibleCapabilitiesFor(
      this.matrix,
      this.navigationContract,
      this.eligibility,
    );
    const bridgeState: BridgeRuntimeState =
      this.matrix.capabilityState === "verified" && this.eligibility.eligibilityState === "live"
        ? "active"
        : this.matrix.capabilityState === "unavailable"
          ? "unavailable"
          : this.matrix.capabilityState === "stale" || this.matrix.capabilityState === "mismatched"
            ? "degraded"
            : "recovery";
    return freeze({
      bridgeId: `NHSAppBridge:381:${shortHash({
        matrix: this.matrix.matrixId,
        route: this.navigationContract.navigationContractId,
        eligibility: this.eligibility.embeddedNavEligibilityId,
      })}`,
      bridgeState,
      channelContextRef: this.channelContextRef,
      bridgeCapabilityMatrixRef: this.matrix.matrixId,
      patientEmbeddedSessionProjectionRef: this.patientEmbeddedSessionProjectionRef,
      patientEmbeddedNavEligibilityRef: this.eligibility.embeddedNavEligibilityId,
      scriptUrl: this.matrix.scriptUrl,
      scriptVersionHint: this.matrix.scriptVersionHint,
      lastNegotiatedAt: this.matrix.checkedAt,
      matrix: this.matrix,
      navigationContract: this.navigationContract,
      eligibility: this.eligibility,
      visibleCapabilities: capabilities.visible,
      hiddenCapabilities: capabilities.hidden,
      activeLeases: this.leaseManager.listLeases().filter((lease) => lease.leaseState === "active"),
    });
  }

  listLeases(): BridgeActionLease[] {
    return this.leaseManager.listLeases();
  }

  private assertActionAllowed(action: BridgeAction): BridgeActionResult {
    if (action === "isEmbedded" || action === "clearBackAction") {
      return ok(action, null);
    }
    const capabilities = visibleCapabilitiesFor(
      this.matrix,
      this.navigationContract,
      this.eligibility,
    );
    if (!capabilities.visible.includes(action)) {
      const diagnostic =
        capabilities.hidden.find((entry) => entry.actionRef === action) ??
        blocked("bridge_action_not_visible", action);
      return blockedResult(action, diagnostic.code, [diagnostic]);
    }
    return ok(action, null);
  }

  private assertGrant(
    expectedDestinationClass: OutboundDestinationClass,
    requestedUrl: string | null,
    grant: OutboundNavigationGrant,
    appDestination: AppPageDestination | null,
  ): BridgeActionResult {
    const diagnostics: BridgeDiagnostic[] = [];
    if (grant.destinationClass !== expectedDestinationClass) {
      diagnostics.push(blocked("destination_class_mismatch", null));
    }
    if (grant.grantState !== "live" || parseTime(grant.expiresAt) <= parseTime(this.now)) {
      diagnostics.push(blocked("outbound_navigation_grant_not_live", null));
    }
    if (grant.routeFamilyRef !== this.navigationContract.routeFamilyRef) {
      diagnostics.push(blocked("outbound_navigation_route_family_mismatch", null));
    }
    if (grant.manifestVersionRef !== this.navigationContract.manifestVersionRef) {
      diagnostics.push(blocked("outbound_navigation_manifest_mismatch", null));
    }
    if (grant.sessionEpochRef !== this.sessionEpochRef) {
      diagnostics.push(blocked("outbound_navigation_session_epoch_mismatch", null));
    }
    if (grant.lineageFenceEpoch !== this.lineageFenceEpoch) {
      diagnostics.push(blocked("outbound_navigation_lineage_fence_mismatch", null));
    }
    if (grant.bridgeCapabilityMatrixRef !== this.matrix.matrixId) {
      diagnostics.push(blocked("outbound_navigation_bridge_matrix_mismatch", null));
    }
    if (grant.patientEmbeddedNavEligibilityRef !== this.eligibility.embeddedNavEligibilityId) {
      diagnostics.push(blocked("outbound_navigation_eligibility_mismatch", null));
    }
    if (grant.selectedAnchorRef !== this.selectedAnchorRef) {
      diagnostics.push(blocked("outbound_navigation_anchor_mismatch", null));
    }
    if (appDestination && grant.appDestination !== appDestination) {
      diagnostics.push(blocked("app_page_destination_mismatch", "goToAppPage"));
    }
    if (requestedUrl) {
      const sanitized = scrubDestinationUrl(requestedUrl);
      if (sanitized !== requestedUrl || grant.scrubbedUrlRef !== requestedUrl) {
        diagnostics.push(blocked("destination_not_scrubbed", null));
      }
      const policy = expectedDestinationClass === "browser_overlay" ? "overlay" : "external";
      if (!destinationAllowed(requestedUrl, this.navigationContract, grant, policy)) {
        diagnostics.push(blocked("destination_not_allowlisted", null));
      }
    }
    if (diagnostics.length > 0) {
      return blockedResult(
        expectedDestinationClass === "browser_overlay"
          ? "openOverlay"
          : expectedDestinationClass === "external_browser"
            ? "openExternal"
            : "goToAppPage",
        diagnostics[0]?.code ?? "outbound_navigation_denied",
        diagnostics,
      );
    }
    return ok(
      expectedDestinationClass === "browser_overlay"
        ? "openOverlay"
        : expectedDestinationClass === "external_browser"
          ? "openExternal"
          : "goToAppPage",
      null,
    );
  }
}

export function createNhsAppBridgeRuntime(input: BridgeRuntimeInput): NhsAppBridgeRuntime {
  return new NhsAppBridgeRuntime(input);
}

export function createLiveEligibility(input: {
  readonly journeyPathRef?: string;
  readonly routeFamilyRef: string;
  readonly manifestVersionRef: string;
  readonly sessionEpochRef?: string;
  readonly subjectBindingVersionRef?: string;
  readonly currentBridgeCapabilityMatrixRef?: string | null;
  readonly allowedBridgeActionRefs?: readonly BridgeAction[];
  readonly eligibilityState?: EmbeddedEligibilityState;
  readonly continuityEvidenceRef?: string;
}): PatientEmbeddedNavEligibilitySnapshot {
  const allowed = input.allowedBridgeActionRefs ?? [
    "isEmbedded",
    "setBackAction",
    "clearBackAction",
    "goHome",
    "goToAppPage",
    "openOverlay",
    "openExternal",
    "addToCalendar",
    "downloadBytes",
  ];
  return freeze({
    embeddedNavEligibilityId: `PatientEmbeddedNavEligibility:381:${shortHash(input)}`,
    journeyPathRef: input.journeyPathRef ?? "jp_manage_local_appointment",
    routeFamilyRef: input.routeFamilyRef,
    patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:381-local",
    manifestVersionRef: input.manifestVersionRef,
    sessionEpochRef: input.sessionEpochRef ?? "SessionEpoch:381",
    subjectBindingVersionRef: input.subjectBindingVersionRef ?? "SubjectBindingVersion:381",
    currentBridgeCapabilityMatrixRef: input.currentBridgeCapabilityMatrixRef ?? null,
    minimumBridgeCapabilitiesRef: "MinimumBridgeCapabilities:phase7-381",
    requiredBridgeActionRefs: allowed,
    allowedBridgeActionRefs: allowed,
    fallbackActionRefs: ["goToAppPage", "clearBackAction"],
    routeFreezeDispositionRef: "RouteFreezeDisposition:phase7-381",
    continuityEvidenceRef: input.continuityEvidenceRef ?? "ContinuityEvidence:phase7-381-trusted",
    eligibilityState: input.eligibilityState ?? "live",
    evaluatedAt: DEFAULT_BRIDGE_CHECKED_AT,
  });
}

export function createOutboundNavigationGrant(input: {
  readonly routeFamilyRef: string;
  readonly destinationClass: OutboundDestinationClass;
  readonly scrubbedUrlRef?: string;
  readonly appDestination?: AppPageDestination | null;
  readonly allowedHostRef?: string | null;
  readonly allowedPathPattern?: string | null;
  readonly selectedAnchorRef?: string;
  readonly bridgeCapabilityMatrixRef: string;
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly manifestVersionRef: string;
  readonly sessionEpochRef?: string;
  readonly lineageFenceEpoch?: string;
  readonly grantState?: OutboundNavigationGrant["grantState"];
  readonly expiresAt?: string;
}): OutboundNavigationGrant {
  return freeze({
    outboundNavigationGrantId: `OutboundNavigationGrant:381:${shortHash(input)}`,
    routeFamilyRef: input.routeFamilyRef,
    destinationClass: input.destinationClass,
    scrubbedUrlRef: input.scrubbedUrlRef ?? "app://GO_BACK",
    appDestination: input.appDestination ?? null,
    allowedHostRef: input.allowedHostRef ?? null,
    allowedPathPattern: input.allowedPathPattern ?? null,
    returnContractRef: "ReturnContract:phase7-381-same-shell",
    selectedAnchorRef: input.selectedAnchorRef ?? "SelectedAnchor:phase7-381-default",
    maskingPolicyRef: "MaskingPolicy:minimum-necessary-381",
    channelProfile: "embedded",
    bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrixRef,
    patientEmbeddedNavEligibilityRef: input.patientEmbeddedNavEligibilityRef,
    truthTupleHash: `truth:${shortHash(input)}`,
    manifestVersionRef: input.manifestVersionRef,
    sessionEpochRef: input.sessionEpochRef ?? "SessionEpoch:381",
    lineageFenceEpoch: input.lineageFenceEpoch ?? "LineageFence:phase7-381-default",
    issuedAt: DEFAULT_BRIDGE_CHECKED_AT,
    expiresAt: input.expiresAt ?? DEFAULT_LEASE_EXPIRES_AT,
    grantState: input.grantState ?? "live",
  });
}

export function createFakeNhsAppApi(input?: {
  readonly platform?: NhsAppPlatform;
  readonly missingMethods?: readonly BridgeAction[];
}): RawNhsAppJsApi & {
  readonly calls: readonly { readonly action: string; readonly payload: readonly unknown[] }[];
  readonly triggerBackAction: () => void;
} {
  const calls: { action: string; payload: readonly unknown[] }[] = [];
  let backAction: (() => void) | null = null;
  const missing = new Set(input?.missingMethods ?? []);
  const maybe = <T extends (...args: never[]) => void>(
    action: BridgeAction,
    fn: T,
  ): T | undefined => (missing.has(action) ? undefined : fn);
  return {
    calls,
    triggerBackAction() {
      calls.push({ action: "triggerBackAction", payload: [] });
      backAction?.();
    },
    tools: {
      getAppPlatform: () => input?.platform ?? "ios",
      isOpenInNHSApp: () => (input?.platform ?? "ios") !== "none",
    },
    navigation: {
      setBackAction: maybe("setBackAction", ((callback: () => void) => {
        calls.push({ action: "setBackAction", payload: [] });
        backAction = callback;
      }) as never),
      clearBackAction: maybe("clearBackAction", (() => {
        calls.push({ action: "clearBackAction", payload: [] });
        backAction = null;
      }) as never),
      goToHomePage: maybe("goHome", (() => {
        calls.push({ action: "goHome", payload: [] });
      }) as never),
      goToPage: maybe("goToAppPage", ((appPage: AppPageDestination) => {
        calls.push({ action: "goToAppPage", payload: [appPage] });
      }) as never),
      openBrowserOverlay: maybe("openOverlay", ((url: string) => {
        calls.push({ action: "openOverlay", payload: [url] });
      }) as never),
      openExternalBrowser: maybe("openExternal", ((url: string) => {
        calls.push({ action: "openExternal", payload: [url] });
      }) as never),
    },
    storage: {
      addEventToCalendar: maybe("addToCalendar", ((...payload: unknown[]) => {
        calls.push({ action: "addToCalendar", payload });
      }) as never),
      downloadFromBytes: maybe("downloadBytes", ((...payload: unknown[]) => {
        calls.push({ action: "downloadBytes", payload });
      }) as never),
    },
  };
}

export function renderBridgeDiagnosticsHtml(snapshot: BridgeRuntimeSnapshot): string {
  const hidden = snapshot.hiddenCapabilities.map(
    (diagnostic) => `<li data-bridge-hidden="${escapeHtml(diagnostic.actionRef ?? "runtime")}">
      <span>${escapeHtml(diagnostic.actionRef ?? "runtime")}</span>
      <strong>${escapeHtml(diagnostic.code)}</strong>
    </li>`,
  );
  const visible = snapshot.visibleCapabilities.map(
    (action) => `<li data-bridge-visible="${escapeHtml(action)}">${escapeHtml(action)}</li>`,
  );
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NHS App bridge diagnostics</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f3f5f7; color: #14212b; }
    main { max-width: 860px; margin: 0 auto; padding: 24px; }
    .ribbon { border-left: 6px solid #0072ce; background: #ffffff; padding: 16px; }
    .ribbon[data-state="degraded"], .ribbon[data-state="unavailable"] { border-left-color: #d5281b; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 20px 0 8px; }
    ul { padding-left: 20px; }
    li, p, code { overflow-wrap: anywhere; }
    code { font-size: 13px; }
  </style>
</head>
<body>
  <main aria-labelledby="bridge-title" data-testid="bridge-diagnostics-root" data-bridge-state="${escapeHtml(
    snapshot.bridgeState,
  )}" data-capability-state="${escapeHtml(snapshot.matrix.capabilityState)}">
    <section class="ribbon" data-state="${escapeHtml(snapshot.bridgeState)}" aria-label="Bridge capability state">
      <h1 id="bridge-title">NHS App bridge diagnostics</h1>
      <p role="status">Bridge state: <strong>${escapeHtml(snapshot.bridgeState)}</strong></p>
      <p>Capability matrix: <code>${escapeHtml(snapshot.bridgeCapabilityMatrixRef)}</code></p>
      <p>Script: <code>${escapeHtml(snapshot.scriptUrl)}</code></p>
    </section>
    <section aria-labelledby="visible-title">
      <h2 id="visible-title">Verified capabilities</h2>
      <ul>${visible.join("")}</ul>
    </section>
    <section aria-labelledby="hidden-title">
      <h2 id="hidden-title">Hidden capabilities</h2>
      <ul>${hidden.join("")}</ul>
    </section>
    <section aria-labelledby="lease-title">
      <h2 id="lease-title">Active leases</h2>
      <p>${snapshot.activeLeases.length} active lease${snapshot.activeLeases.length === 1 ? "" : "s"}</p>
    </section>
  </main>
</body>
</html>`;
}

function detectSupportedMethods(api: RawNhsAppJsApi): BridgeAction[] {
  const methods: BridgeAction[] = ["isEmbedded"];
  if (typeof api.navigation?.setBackAction === "function") methods.push("setBackAction");
  if (typeof api.navigation?.clearBackAction === "function") methods.push("clearBackAction");
  if (typeof api.navigation?.goToHomePage === "function") methods.push("goHome");
  if (typeof api.navigation?.goToPage === "function") methods.push("goToAppPage");
  if (typeof api.navigation?.openBrowserOverlay === "function") methods.push("openOverlay");
  if (typeof api.navigation?.openExternalBrowser === "function") methods.push("openExternal");
  if (typeof api.storage?.addEventToCalendar === "function") methods.push("addToCalendar");
  if (
    typeof api.storage?.downloadFromBytes === "function" ||
    typeof api.downloadFromBytes === "function"
  ) {
    methods.push("downloadBytes");
  }
  return methods;
}

function routeAllowedActions(contract: NavigationContract): BridgeAction[] {
  const actions = new Set<BridgeAction>([
    "isEmbedded",
    "setBackAction",
    "clearBackAction",
    "goHome",
    "goToAppPage",
    ...contract.requiredBridgeCapabilities,
  ]);
  if (contract.allowsBrowserOverlay) actions.add("openOverlay");
  if (contract.allowsExternalBrowser) actions.add("openExternal");
  if (contract.calendarSupport === "supported") actions.add("addToCalendar");
  if (contract.downloadSupport === "supported") actions.add("downloadBytes");
  return Array.from(actions);
}

function destinationAllowed(
  requestedUrl: string,
  contract: NavigationContract,
  grant: OutboundNavigationGrant,
  policy: "overlay" | "external",
): boolean {
  try {
    const parsed = new URL(requestedUrl);
    const hostAllowlist =
      policy === "overlay" ? contract.allowedOverlayHosts : contract.allowedExternalHosts;
    const contractHostAllowed = hostAllowlist.includes(parsed.host);
    const grantHostAllowed = !grant.allowedHostRef || grant.allowedHostRef === parsed.host;
    const pathPattern = grant.allowedPathPattern ?? contract.allowedPathPatterns[0] ?? "/";
    return contractHostAllowed && grantHostAllowed && pathMatches(pathPattern, parsed.pathname);
  } catch {
    return false;
  }
}

function scrubDestinationUrl(value: string): string {
  const parsed = new URL(value);
  for (const key of [
    "token",
    "code",
    "assertedLoginIdentity",
    "asserted_login_identity",
    "nhsNumber",
  ]) {
    parsed.searchParams.delete(key);
  }
  return parsed.toString();
}

function pathMatches(pattern: string, pathname: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(pathname);
}

function appendScriptHint(baseUrl: string, scriptVersionHint: string): string {
  if (!scriptVersionHint) {
    return baseUrl;
  }
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${scriptVersionHint}`;
}

function normalizePlatform(value: string): NhsAppPlatform {
  if (value === "android" || value === "ios") {
    return value;
  }
  return "none";
}

function ok(action: BridgeAction, lease: BridgeActionLease | null): BridgeActionResult {
  return {
    ok: true,
    action,
    blockedReason: null,
    diagnostics: [],
    lease,
    destinationUrl: null,
    appDestination: null,
  };
}

function blockedResult(
  action: BridgeAction,
  blockedReason: string,
  diagnostics: readonly BridgeDiagnostic[],
): BridgeActionResult {
  return {
    ok: false,
    action,
    blockedReason,
    diagnostics,
    lease: null,
    destinationUrl: null,
    appDestination: null,
  };
}

function blocked(code: string, actionRef: BridgeAction | null): BridgeDiagnostic {
  return {
    code,
    severity: "blocked",
    actionRef,
    message: code,
  };
}

function warning(code: string, actionRef: BridgeAction | null): BridgeDiagnostic {
  return {
    code,
    severity: "warning",
    actionRef,
    message: code,
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  if (value === undefined) {
    return "undefined";
  }
  return JSON.stringify(value);
}

function shortHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
