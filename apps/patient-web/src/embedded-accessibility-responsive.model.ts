export const EMBEDDED_ACCESSIBILITY_TASK_ID = "par_394";
export const EMBEDDED_ACCESSIBILITY_VISUAL_MODE =
  "NHSApp_Embedded_Accessibility_Responsive_Hardening";
export const EMBEDDED_ACCESSIBILITY_CONTRACT_REF =
  "EmbeddedAccessibilityResponsiveContract:394:phase7-cross-route";
export const EMBEDDED_ACCESSIBILITY_COVERAGE_PROFILE_REF =
  "EmbeddedA11yCoverageReporter:394:focus-keyboard-resize-semantics";
export const EMBEDDED_ACCESSIBILITY_STORAGE_KEY =
  "vecells.phase7.embedded-accessibility-responsive";

export type EmbeddedAccessibilityRouteFamily =
  | "entry_corridor"
  | "start_request"
  | "request_status"
  | "booking"
  | "pharmacy"
  | "recovery_artifact"
  | "embedded_shell";

export type EmbeddedAccessibilityContract =
  | "EmbeddedRouteSemanticBoundary"
  | "EmbeddedFocusGuard"
  | "EmbeddedFocusRestoreBoundary"
  | "StickyActionObscurationGuard"
  | "EmbeddedSafeAreaObserver"
  | "HostResizeResilienceLayer"
  | "AssistiveAnnouncementDedupeBus"
  | "EmbeddedKeyboardParityHooks"
  | "EmbeddedReducedMotionAdapter"
  | "EmbeddedTargetSizeUtilities"
  | "EmbeddedA11yCoverageReporter";

export interface EmbeddedA11yCoverageProfile {
  readonly routeFamily: EmbeddedAccessibilityRouteFamily;
  readonly label: string;
  readonly rootTestId: string;
  readonly actionTestId: string;
  readonly liveRegionTestId: string | null;
  readonly primaryLandmark: "main";
  readonly defaultPath: string;
  readonly stickyActionSelector: string;
  readonly focusRestoreSelector: string;
  readonly contracts: readonly EmbeddedAccessibilityContract[];
}

export interface EmbeddedA11yCoverageRow {
  readonly routeFamily: EmbeddedAccessibilityRouteFamily;
  readonly rootTestId: string;
  readonly actionTestId: string;
  readonly liveRegionTestId: string;
  readonly focusRestoreSelector: string;
  readonly contractCount: number;
  readonly defaultPath: string;
}

export const EMBEDDED_ACCESSIBILITY_CONTRACTS = [
  "EmbeddedRouteSemanticBoundary",
  "EmbeddedFocusGuard",
  "EmbeddedFocusRestoreBoundary",
  "StickyActionObscurationGuard",
  "EmbeddedSafeAreaObserver",
  "HostResizeResilienceLayer",
  "AssistiveAnnouncementDedupeBus",
  "EmbeddedKeyboardParityHooks",
  "EmbeddedReducedMotionAdapter",
  "EmbeddedTargetSizeUtilities",
  "EmbeddedA11yCoverageReporter",
] as const satisfies readonly EmbeddedAccessibilityContract[];

export const embeddedAccessibilityRouteFamilies = [
  "entry_corridor",
  "start_request",
  "request_status",
  "booking",
  "pharmacy",
  "recovery_artifact",
  "embedded_shell",
] as const satisfies readonly EmbeddedAccessibilityRouteFamily[];

const PROFILE_BY_ROUTE_FAMILY = {
  entry_corridor: {
    routeFamily: "entry_corridor",
    label: "Entry corridor",
    rootTestId: "EmbeddedEntryCorridorRoot",
    actionTestId: "EmbeddedEntryActionCluster",
    liveRegionTestId: null,
    primaryLandmark: "main",
    defaultPath: "/nhs-app/entry?entry=landing&route=request_status&channel=nhs_app",
    stickyActionSelector: "[data-testid='EmbeddedEntryActionCluster']",
    focusRestoreSelector: "[data-testid='EmbeddedEntryCorridorRoot'] h1",
    contracts: EMBEDDED_ACCESSIBILITY_CONTRACTS,
  },
  start_request: {
    routeFamily: "start_request",
    label: "Start request intake",
    rootTestId: "EmbeddedIntakeFrame",
    actionTestId: "EmbeddedSubmitActionBar",
    liveRegionTestId: null,
    primaryLandmark: "main",
    defaultPath: "/nhs-app/start-request/dft_389_playwright/request-type?fixture=empty",
    stickyActionSelector: "[data-testid='EmbeddedSubmitActionBar']",
    focusRestoreSelector: "[data-testid='EmbeddedIntakeFrame'] h1",
    contracts: EMBEDDED_ACCESSIBILITY_CONTRACTS,
  },
  request_status: {
    routeFamily: "request_status",
    label: "Request status",
    rootTestId: "EmbeddedRequestStatusFrame",
    actionTestId: "EmbeddedRequestActionReserve",
    liveRegionTestId: "EmbeddedRequestLiveRegion",
    primaryLandmark: "main",
    defaultPath: "/nhs-app/requests/request_211_a/status?fixture=status",
    stickyActionSelector: "[data-testid='EmbeddedRequestActionReserve']",
    focusRestoreSelector: "[data-testid='EmbeddedRequestStatusFrame'] h1",
    contracts: EMBEDDED_ACCESSIBILITY_CONTRACTS,
  },
  booking: {
    routeFamily: "booking",
    label: "Booking",
    rootTestId: "EmbeddedBookingFrame",
    actionTestId: "EmbeddedBookingActionReserve",
    liveRegionTestId: "EmbeddedBookingLiveRegion",
    primaryLandmark: "main",
    defaultPath: "/nhs-app/bookings/booking_case_391/offers?fixture=live",
    stickyActionSelector: "[data-testid='EmbeddedBookingActionReserve']",
    focusRestoreSelector: "[data-testid='EmbeddedBookingFrame'] h1",
    contracts: EMBEDDED_ACCESSIBILITY_CONTRACTS,
  },
  pharmacy: {
    routeFamily: "pharmacy",
    label: "Pharmacy",
    rootTestId: "EmbeddedPharmacyFrame",
    actionTestId: "EmbeddedPharmacyActionReserve",
    liveRegionTestId: "EmbeddedPharmacyLiveRegion",
    primaryLandmark: "main",
    defaultPath: "/nhs-app/pharmacy/PHC-2048/choice?fixture=choice",
    stickyActionSelector: "[data-testid='EmbeddedPharmacyActionReserve']",
    focusRestoreSelector: "[data-testid='EmbeddedPharmacyFrame'] h1",
    contracts: EMBEDDED_ACCESSIBILITY_CONTRACTS,
  },
  recovery_artifact: {
    routeFamily: "recovery_artifact",
    label: "Recovery and artifacts",
    rootTestId: "EmbeddedRecoveryArtifactFrame",
    actionTestId: "EmbeddedRecoveryActionCluster",
    liveRegionTestId: "EmbeddedRecoveryLiveRegion",
    primaryLandmark: "main",
    defaultPath: "/nhs-app/recovery/REC-393/expired-link?fixture=expired-link",
    stickyActionSelector: "[data-testid='EmbeddedRecoveryActionCluster']",
    focusRestoreSelector: "[data-testid='EmbeddedRecoveryArtifactFrame'] h1",
    contracts: EMBEDDED_ACCESSIBILITY_CONTRACTS,
  },
  embedded_shell: {
    routeFamily: "embedded_shell",
    label: "Persistent embedded shell",
    rootTestId: "EmbeddedPatientShellRoot",
    actionTestId: "EmbeddedActionReserve",
    liveRegionTestId: "EmbeddedRecoveryFrame",
    primaryLandmark: "main",
    defaultPath:
      "/nhs-app/requests/REQ-2049/status?phase7=embedded_shell&shell=embedded&channel=nhs_app&context=signed",
    stickyActionSelector: "[data-testid='EmbeddedActionReserve']",
    focusRestoreSelector: "[data-testid='EmbeddedPatientShellRoot'] h1",
    contracts: EMBEDDED_ACCESSIBILITY_CONTRACTS,
  },
} as const satisfies Record<EmbeddedAccessibilityRouteFamily, EmbeddedA11yCoverageProfile>;

export function isEmbeddedAccessibilityRouteFamily(
  value: string,
): value is EmbeddedAccessibilityRouteFamily {
  return embeddedAccessibilityRouteFamilies.includes(value as EmbeddedAccessibilityRouteFamily);
}

export function resolveEmbeddedA11yCoverageProfile(
  routeFamily: EmbeddedAccessibilityRouteFamily,
): EmbeddedA11yCoverageProfile {
  return PROFILE_BY_ROUTE_FAMILY[routeFamily];
}

export function embeddedA11yPathForFamily(routeFamily: EmbeddedAccessibilityRouteFamily): string {
  return resolveEmbeddedA11yCoverageProfile(routeFamily).defaultPath;
}

export function createEmbeddedA11yCoverageRows(): readonly EmbeddedA11yCoverageRow[] {
  return embeddedAccessibilityRouteFamilies.map((routeFamily) => {
    const profile = resolveEmbeddedA11yCoverageProfile(routeFamily);
    return {
      routeFamily,
      rootTestId: profile.rootTestId,
      actionTestId: profile.actionTestId,
      liveRegionTestId: profile.liveRegionTestId ?? "AssistiveAnnouncementDedupeBus",
      focusRestoreSelector: profile.focusRestoreSelector,
      contractCount: profile.contracts.length,
      defaultPath: profile.defaultPath,
    };
  });
}

