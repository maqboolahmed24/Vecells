import {
  embeddedAccessibilityRouteFamilies,
  resolveEmbeddedA11yCoverageProfile,
  type EmbeddedAccessibilityRouteFamily,
} from "./embedded-accessibility-responsive.model";

export const EMBEDDED_DESIGN_CONVERGENCE_TASK_ID = "par_395";
export const EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE = "NHSApp_Embedded_Converged_Design_Bundle";
export const EMBEDDED_DESIGN_CONVERGENCE_CONTRACT_REF =
  "EmbeddedDesignConvergenceContract:395:phase7-publication-bundle";
export const EMBEDDED_DESIGN_PUBLICATION_BUNDLE_REF =
  "DesignContractPublicationBundle:395:embedded-nhs-app-patient-routes";
export const EMBEDDED_VISUALIZATION_PARITY_REF =
  "VisualizationParityProjection:395:embedded-route-fallbacks";

export type EmbeddedDesignArchetype =
  | "entry_recovery_card"
  | "summary_and_action"
  | "list_first_choice"
  | "timeline_status"
  | "form_and_review"
  | "visualization_with_fallback";

export type EmbeddedVisualizationKind =
  | "progress_rail"
  | "progress_stepper"
  | "timeline"
  | "comparison_strip"
  | "status_strip"
  | "summary_rows"
  | "semantic_strip";

export interface EmbeddedVisualizationFallbackRow {
  readonly label: string;
  readonly value: string;
  readonly parityRef: string;
}

export interface EmbeddedVisualizationFallbackProfile {
  readonly visualSurfaceId: string;
  readonly visualSurfaceLabel: string;
  readonly visualKind: EmbeddedVisualizationKind;
  readonly fallbackContractRef: string;
  readonly tableContractRef: string;
  readonly summary: string;
  readonly tableCaption: string;
  readonly rows: readonly EmbeddedVisualizationFallbackRow[];
}

export interface EmbeddedDesignRouteProfile {
  readonly routeFamily: EmbeddedAccessibilityRouteFamily;
  readonly label: string;
  readonly archetype: EmbeddedDesignArchetype;
  readonly rootTestId: string;
  readonly actionTestId: string;
  readonly semanticLabel: string;
  readonly automationPrefix: string;
  readonly primaryStateLabel: string;
  readonly recoveryStateLabel: string;
  readonly primaryCtaVerb: string;
  readonly copyTone: "secure" | "helpful" | "status" | "choice" | "recovery";
  readonly visualizationFallbacks: readonly EmbeddedVisualizationFallbackProfile[];
}

export interface EmbeddedDesignConvergenceRow {
  readonly routeFamily: EmbeddedAccessibilityRouteFamily;
  readonly archetype: EmbeddedDesignArchetype;
  readonly rootTestId: string;
  readonly actionTestId: string;
  readonly primaryStateLabel: string;
  readonly semanticLabel: string;
  readonly fallbackSurfaceCount: number;
}

function fallbackContract(visualSurfaceId: string): string {
  return `VisualizationFallbackContract:395:${visualSurfaceId}`;
}

function tableContract(visualSurfaceId: string): string {
  return `VisualizationTableContract:395:${visualSurfaceId}`;
}

const ROUTE_PROFILES = {
  entry_corridor: {
    routeFamily: "entry_corridor",
    label: "Entry corridor",
    archetype: "entry_recovery_card",
    rootTestId: "EmbeddedEntryCorridorRoot",
    actionTestId: "EmbeddedEntryActionCluster",
    semanticLabel: "Secure NHS App entry corridor",
    automationPrefix: "embedded-entry",
    primaryStateLabel: "Secure check",
    recoveryStateLabel: "Return to NHS App",
    primaryCtaVerb: "Continue",
    copyTone: "secure",
    visualizationFallbacks: [
      {
        visualSurfaceId: "EmbeddedEntryProgressRail",
        visualSurfaceLabel: "Sign-in progress",
        visualKind: "progress_rail",
        fallbackContractRef: fallbackContract("EmbeddedEntryProgressRail"),
        tableContractRef: tableContract("EmbeddedEntryProgressRail"),
        summary: "The sign-in progress rail always has a text step list with the current step.",
        tableCaption: "Entry corridor progress fallback",
        rows: [
          { label: "Step 1", value: "Open NHS login", parityRef: "entry-progress-open" },
          { label: "Step 2", value: "Confirm details", parityRef: "entry-progress-confirm" },
          { label: "Step 3", value: "Return to the same journey", parityRef: "entry-progress-return" },
        ],
      },
    ],
  },
  start_request: {
    routeFamily: "start_request",
    label: "Start request intake",
    archetype: "form_and_review",
    rootTestId: "EmbeddedIntakeFrame",
    actionTestId: "EmbeddedSubmitActionBar",
    semanticLabel: "Embedded start request form and review",
    automationPrefix: "embedded-intake",
    primaryStateLabel: "Request in progress",
    recoveryStateLabel: "Draft recovery",
    primaryCtaVerb: "Save and continue",
    copyTone: "helpful",
    visualizationFallbacks: [
      {
        visualSurfaceId: "EmbeddedIntakeProgressStepper",
        visualSurfaceLabel: "Start request progress",
        visualKind: "progress_stepper",
        fallbackContractRef: fallbackContract("EmbeddedIntakeProgressStepper"),
        tableContractRef: tableContract("EmbeddedIntakeProgressStepper"),
        summary: "The intake progress stepper is mirrored as an ordered text sequence.",
        tableCaption: "Start request progress fallback",
        rows: [
          { label: "Request type", value: "Choose the request category", parityRef: "intake-step-type" },
          { label: "Details", value: "Answer the question frame", parityRef: "intake-step-details" },
          { label: "Contact", value: "Confirm contact preference", parityRef: "intake-step-contact" },
          { label: "Review", value: "Check answers before submit", parityRef: "intake-step-review" },
          { label: "Receipt", value: "Show confirmation and next step", parityRef: "intake-step-receipt" },
        ],
      },
    ],
  },
  request_status: {
    routeFamily: "request_status",
    label: "Request status",
    archetype: "timeline_status",
    rootTestId: "EmbeddedRequestStatusFrame",
    actionTestId: "EmbeddedRequestActionReserve",
    semanticLabel: "Embedded request status and reply route",
    automationPrefix: "embedded-request",
    primaryStateLabel: "Request update",
    recoveryStateLabel: "Action paused",
    primaryCtaVerb: "Review",
    copyTone: "status",
    visualizationFallbacks: [
      {
        visualSurfaceId: "EmbeddedRequestStatusTimeline",
        visualSurfaceLabel: "Request timeline",
        visualKind: "timeline",
        fallbackContractRef: fallbackContract("EmbeddedRequestStatusTimeline"),
        tableContractRef: tableContract("EmbeddedRequestStatusTimeline"),
        summary: "The request timeline has the same state, date, and explanation available in text.",
        tableCaption: "Request status timeline fallback",
        rows: [
          { label: "Current state", value: "Visible request state title", parityRef: "request-current-state" },
          { label: "Updated", value: "Last updated label", parityRef: "request-updated" },
          { label: "Next action", value: "Dominant request action reserve", parityRef: "request-next-action" },
        ],
      },
    ],
  },
  booking: {
    routeFamily: "booking",
    label: "Booking",
    archetype: "visualization_with_fallback",
    rootTestId: "EmbeddedBookingFrame",
    actionTestId: "EmbeddedBookingActionReserve",
    semanticLabel: "Embedded appointment booking and manage route",
    automationPrefix: "embedded-booking",
    primaryStateLabel: "Booking option",
    recoveryStateLabel: "Booking held",
    primaryCtaVerb: "Choose",
    copyTone: "choice",
    visualizationFallbacks: [
      {
        visualSurfaceId: "EmbeddedSlotComparisonStrip",
        visualSurfaceLabel: "Slot comparison",
        visualKind: "comparison_strip",
        fallbackContractRef: fallbackContract("EmbeddedSlotComparisonStrip"),
        tableContractRef: tableContract("EmbeddedSlotComparisonStrip"),
        summary: "The slot comparison strip is backed by a table with time, clinician, location, and hold truth.",
        tableCaption: "Booking slot comparison fallback",
        rows: [
          { label: "Selected slot", value: "Primary offer time and clinician", parityRef: "booking-selected-slot" },
          { label: "Alternatives", value: "Comparable slot options", parityRef: "booking-alternatives" },
          { label: "Hold state", value: "Truthful hold or waitlist posture", parityRef: "booking-hold-state" },
        ],
      },
    ],
  },
  pharmacy: {
    routeFamily: "pharmacy",
    label: "Pharmacy",
    archetype: "list_first_choice",
    rootTestId: "EmbeddedPharmacyFrame",
    actionTestId: "EmbeddedPharmacyActionReserve",
    semanticLabel: "Embedded pharmacy choice and referral route",
    automationPrefix: "embedded-pharmacy",
    primaryStateLabel: "Pharmacy referral",
    recoveryStateLabel: "Provider choice recovery",
    primaryCtaVerb: "Continue",
    copyTone: "choice",
    visualizationFallbacks: [
      {
        visualSurfaceId: "EmbeddedReferralStatusSurface",
        visualSurfaceLabel: "Referral status",
        visualKind: "status_strip",
        fallbackContractRef: fallbackContract("EmbeddedReferralStatusSurface"),
        tableContractRef: tableContract("EmbeddedReferralStatusSurface"),
        summary: "The referral status strip is backed by text rows for dispatch, pharmacy response, and patient next step.",
        tableCaption: "Pharmacy referral status fallback",
        rows: [
          { label: "Dispatch", value: "Referral sent or pending proof", parityRef: "pharmacy-dispatch" },
          { label: "Response", value: "Pharmacy response or recovery state", parityRef: "pharmacy-response" },
          { label: "Next step", value: "Patient instruction summary", parityRef: "pharmacy-next-step" },
        ],
      },
    ],
  },
  recovery_artifact: {
    routeFamily: "recovery_artifact",
    label: "Recovery and artifacts",
    archetype: "entry_recovery_card",
    rootTestId: "EmbeddedRecoveryArtifactFrame",
    actionTestId: "EmbeddedRecoveryActionCluster",
    semanticLabel: "Embedded recovery, artifact, and route-freeze route",
    automationPrefix: "embedded-recovery",
    primaryStateLabel: "Safe summary",
    recoveryStateLabel: "Recovery required",
    primaryCtaVerb: "Open",
    copyTone: "recovery",
    visualizationFallbacks: [
      {
        visualSurfaceId: "EmbeddedArtifactSummarySurface",
        visualSurfaceLabel: "Artifact summary",
        visualKind: "summary_rows",
        fallbackContractRef: fallbackContract("EmbeddedArtifactSummarySurface"),
        tableContractRef: tableContract("EmbeddedArtifactSummarySurface"),
        summary: "Artifact summaries remain available as labelled rows before preview or download.",
        tableCaption: "Artifact summary fallback",
        rows: [
          { label: "Artifact", value: "Document title and route family", parityRef: "artifact-title" },
          { label: "Mode", value: "Summary, preview, transfer, or fallback", parityRef: "artifact-mode" },
          { label: "Safe action", value: "Same-shell action or fallback", parityRef: "artifact-safe-action" },
        ],
      },
      {
        visualSurfaceId: "EmbeddedDownloadProgressCard",
        visualSurfaceLabel: "Download progress",
        visualKind: "progress_rail",
        fallbackContractRef: fallbackContract("EmbeddedDownloadProgressCard"),
        tableContractRef: tableContract("EmbeddedDownloadProgressCard"),
        summary: "Download progress is mirrored by text progress state and transfer posture.",
        tableCaption: "Artifact download progress fallback",
        rows: [
          { label: "Progress", value: "Percent ready", parityRef: "download-progress" },
          { label: "Transfer", value: "In progress or blocked", parityRef: "download-transfer" },
          { label: "Fallback", value: "Return to safe summary", parityRef: "download-fallback" },
        ],
      },
    ],
  },
  embedded_shell: {
    routeFamily: "embedded_shell",
    label: "Persistent embedded shell",
    archetype: "summary_and_action",
    rootTestId: "EmbeddedPatientShellRoot",
    actionTestId: "EmbeddedActionReserve",
    semanticLabel: "Persistent embedded patient shell",
    automationPrefix: "embedded-shell",
    primaryStateLabel: "Shell continuity",
    recoveryStateLabel: "Shell recovery",
    primaryCtaVerb: "Resume",
    copyTone: "status",
    visualizationFallbacks: [
      {
        visualSurfaceId: "EmbeddedRouteContextBoundary",
        visualSurfaceLabel: "Route semantic strip",
        visualKind: "semantic_strip",
        fallbackContractRef: fallbackContract("EmbeddedRouteContextBoundary"),
        tableContractRef: tableContract("EmbeddedRouteContextBoundary"),
        summary: "The shell semantic strip publishes route title, state, consent, and continuity as text rows.",
        tableCaption: "Embedded shell semantic fallback",
        rows: [
          { label: "Route", value: "Current embedded route title", parityRef: "shell-route" },
          { label: "State", value: "Live, stale, frozen, or blocked", parityRef: "shell-state" },
          { label: "Continuity", value: "Selected anchor and return contract", parityRef: "shell-continuity" },
        ],
      },
    ],
  },
} as const satisfies Record<EmbeddedAccessibilityRouteFamily, EmbeddedDesignRouteProfile>;

export function resolveEmbeddedDesignRouteProfile(
  routeFamily: EmbeddedAccessibilityRouteFamily,
): EmbeddedDesignRouteProfile {
  return ROUTE_PROFILES[routeFamily];
}

export function createEmbeddedDesignConvergenceRows(): readonly EmbeddedDesignConvergenceRow[] {
  return embeddedAccessibilityRouteFamilies.map((routeFamily) => {
    const profile = resolveEmbeddedDesignRouteProfile(routeFamily);
    return {
      routeFamily,
      archetype: profile.archetype,
      rootTestId: profile.rootTestId,
      actionTestId: profile.actionTestId,
      primaryStateLabel: profile.primaryStateLabel,
      semanticLabel: profile.semanticLabel,
      fallbackSurfaceCount: profile.visualizationFallbacks.length,
    };
  });
}

export function createEmbeddedAutomationAnchorRows(): readonly {
  readonly routeFamily: EmbeddedAccessibilityRouteFamily;
  readonly rootTestId: string;
  readonly actionTestId: string;
  readonly a11yRootTestId: string;
  readonly automationPrefix: string;
}[] {
  return embeddedAccessibilityRouteFamilies.map((routeFamily) => {
    const designProfile = resolveEmbeddedDesignRouteProfile(routeFamily);
    const a11yProfile = resolveEmbeddedA11yCoverageProfile(routeFamily);
    return {
      routeFamily,
      rootTestId: designProfile.rootTestId,
      actionTestId: designProfile.actionTestId,
      a11yRootTestId: a11yProfile.rootTestId,
      automationPrefix: designProfile.automationPrefix,
    };
  });
}

export { embeddedAccessibilityRouteFamilies as embeddedDesignRouteFamilies };
export type { EmbeddedAccessibilityRouteFamily as EmbeddedDesignRouteFamily };

