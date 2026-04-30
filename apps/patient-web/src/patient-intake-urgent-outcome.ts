import type { ContactSummaryView } from "./patient-intake-contact-preferences";

export type UrgentOutcomeVariant =
  | "urgent_required_pending"
  | "urgent_issued"
  | "failed_safe_recovery";

export interface UrgentOutcomeSimulationState {
  urgentVariant: "urgent_required_pending" | "urgent_issued";
  recoveryVariant: "standard_recovery" | "failed_safe_recovery";
}

export interface UrgentOutcomeNavigationGrant {
  grantId: string;
  governedBy: "OutboundNavigationGrant";
  destinationType: "phone_dialer" | "external_browser";
  href: string;
  destinationLabel: string;
  audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1";
  surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1";
  runtimePublicationBundleRef: "rpb::local::authoritative";
  releasePublicationParityRef: "rpp::local::authoritative";
}

export interface UrgentOutcomeActionView {
  actionId: string;
  label: string;
  interactionKind: "governed_handoff" | "same_shell_return" | "toggle_disclosure";
  dataTestId: string;
  navigationGrant: UrgentOutcomeNavigationGrant | null;
}

export interface UrgentOutcomeSurfaceView {
  variant: UrgentOutcomeVariant;
  outcomeFamily: "urgent_diversion" | "failed_safe";
  result: "urgent_diversion" | "failed_safe";
  requestedSafetyState: "urgent_diversion_required" | null;
  requestSafetyState: "urgent_diversion_required" | "urgent_diverted" | null;
  urgentDiversionSettlementState: "pending" | "issued" | "not_applicable";
  artifactState: "external_handoff_ready" | "summary_only";
  visibilityTier: "public_safe_summary" | "public_recovery_summary";
  summarySafetyTier: "urgent_diversion_required" | "processing_failed";
  copyVariantRef:
    | "COPYVAR_142_URGENT_REQUIRED_V1"
    | "COPYVAR_142_URGENT_ISSUED_V1"
    | "COPYVAR_142_FAILED_SAFE_V1";
  outcomeGrammarContractRef: "OGC_151_PHASE1_OUTCOME_GRAMMAR_V1";
  artifactPresentationContractRef:
    | "APC_142_URGENT_DIVERSION_V1"
    | "APC_142_FAILED_SAFE_V1";
  outboundNavigationGrantPolicyRef:
    | "ONG_142_URGENT_DIVERSION_V1"
    | "ONG_142_FAILED_SAFE_V1";
  surfaceRouteContractRef:
    | "ISRC_139_INTAKE_URGENT_OUTCOME_V1"
    | "ISRC_139_INTAKE_RESUME_RECOVERY_V1";
  surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1";
  runtimePublicationBundleRef: "rpb::local::authoritative";
  releasePublicationParityRef: "rpp::local::authoritative";
  title: string;
  summary: string;
  urgencySentences: readonly string[];
  rationaleHeading: string;
  rationaleBody: string;
  rationaleDisclosureLabel: string;
  liveRegionMessage: string;
  statusLabel: string;
  statusTone: "urgent" | "issued" | "failed_safe";
  dominantAction: UrgentOutcomeActionView;
  secondaryAction: UrgentOutcomeActionView | null;
  focusTarget: "outcome_title" | "primary_action";
  supportSummaryTitle: string;
  supportSummaryLines: readonly string[];
  continuityNote: string;
  handoffNote: string;
  summaryContextTitle: string;
  summaryContextLines: readonly string[];
  quietSecondaryAllowed: boolean;
}

export interface BuildUrgentOutcomeSurfaceInput {
  routeKey: "urgent_outcome" | "resume_recovery";
  requestPublicId: string;
  requestType: string;
  detailNarrative: string;
  attachmentCount: number;
  contactSummaryView: ContactSummaryView;
  simulationState: UrgentOutcomeSimulationState;
}

export function createDefaultUrgentOutcomeSimulation(): UrgentOutcomeSimulationState {
  return {
    urgentVariant: "urgent_required_pending",
    recoveryVariant: "standard_recovery",
  };
}

export function normalizeUrgentOutcomeSimulation(
  value: Partial<UrgentOutcomeSimulationState> | null | undefined,
): UrgentOutcomeSimulationState {
  return {
    urgentVariant:
      value?.urgentVariant === "urgent_issued" ? "urgent_issued" : "urgent_required_pending",
    recoveryVariant:
      value?.recoveryVariant === "failed_safe_recovery"
        ? "failed_safe_recovery"
        : "standard_recovery",
  };
}

export function issueUrgentOutcome(
  simulationState: UrgentOutcomeSimulationState,
): UrgentOutcomeSimulationState {
  return {
    ...simulationState,
    urgentVariant: "urgent_issued",
  };
}

function buildSummaryContextLines(input: {
  requestType: string;
  detailNarrative: string;
  attachmentCount: number;
  contactSummaryView: ContactSummaryView;
}): readonly string[] {
  return [
    `Request type: ${input.requestType}`,
    input.detailNarrative || "The latest structured answer summary stays attached to this shell.",
    input.attachmentCount > 0
      ? `Supporting files kept in view: ${input.attachmentCount}`
      : "No supporting files were attached to this request.",
    `Contact preference held separately: ${input.contactSummaryView.preferredRouteLabel} at ${input.contactSummaryView.preferredDestinationMasked}`,
  ];
}

function urgentGuidanceGrant(requestPublicId: string): UrgentOutcomeNavigationGrant {
  return {
    grantId: `ONG_142_PATIENT_URGENT_HANDOFF_${requestPublicId.toUpperCase()}_V1`,
    governedBy: "OutboundNavigationGrant",
    destinationType: "external_browser",
    href: `https://urgent.service.local/request/${requestPublicId}/guidance`,
    destinationLabel: "Urgent guidance package",
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    releasePublicationParityRef: "rpp::local::authoritative",
  };
}

function phoneDialerGrant(label: string, href: string, requestPublicId: string): UrgentOutcomeNavigationGrant {
  return {
    grantId: `ONG_142_PATIENT_DIALER_${requestPublicId.toUpperCase()}_V1`,
    governedBy: "OutboundNavigationGrant",
    destinationType: "phone_dialer",
    href,
    destinationLabel: label,
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    releasePublicationParityRef: "rpp::local::authoritative",
  };
}

export function buildUrgentOutcomeSurface(
  input: BuildUrgentOutcomeSurfaceInput,
): UrgentOutcomeSurfaceView | null {
  const summaryContextLines = buildSummaryContextLines(input);
  if (input.routeKey === "resume_recovery") {
    if (input.simulationState.recoveryVariant !== "failed_safe_recovery") {
      return null;
    }
    return {
      variant: "failed_safe_recovery",
      outcomeFamily: "failed_safe",
      result: "failed_safe",
      requestedSafetyState: null,
      requestSafetyState: null,
      urgentDiversionSettlementState: "not_applicable",
      artifactState: "summary_only",
      visibilityTier: "public_recovery_summary",
      summarySafetyTier: "processing_failed",
      copyVariantRef: "COPYVAR_142_FAILED_SAFE_V1",
      outcomeGrammarContractRef: "OGC_151_PHASE1_OUTCOME_GRAMMAR_V1",
      artifactPresentationContractRef: "APC_142_FAILED_SAFE_V1",
      outboundNavigationGrantPolicyRef: "ONG_142_FAILED_SAFE_V1",
      surfaceRouteContractRef: "ISRC_139_INTAKE_RESUME_RECOVERY_V1",
      surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
      runtimePublicationBundleRef: "rpb::local::authoritative",
      releasePublicationParityRef: "rpp::local::authoritative",
      title: "We could not safely complete this online",
      summary: "Your details are still available, but this request was not placed in the routine queue.",
      urgencySentences: [
        "Call the practice now so a person can decide the next safe step.",
        "If the problem is getting worse, use urgent help instead of waiting.",
      ],
      rationaleHeading: "Why this stayed inside recovery",
      rationaleBody:
        "The shell kept your last safe summary and draft context, but the safety outcome did not allow a calm receipt or routine queue admission.",
      rationaleDisclosureLabel: "Read why this changed",
      liveRegionMessage:
        "We could not safely complete this online. Your details remain in view, but you need a different next step now.",
      statusLabel: "Failed-safe recovery required",
      statusTone: "failed_safe",
      dominantAction: {
        actionId: "call_practice_now",
        label: "Call the practice now",
        interactionKind: "governed_handoff",
        dataTestId: "failed-safe-dominant-action",
        navigationGrant: phoneDialerGrant("Practice line", "tel:+441632960000", input.requestPublicId),
      },
      secondaryAction: {
        actionId: "keep_saved_copy",
        label: "Keep this draft open",
        interactionKind: "same_shell_return",
        dataTestId: "failed-safe-secondary-action",
        navigationGrant: null,
      },
      focusTarget: "primary_action",
      supportSummaryTitle: "What stays available",
      supportSummaryLines: [
        "Your last safe request summary stays in view.",
        "Nothing here implies the request was received or placed in review.",
      ],
      continuityNote:
        "Editing is paused until a person decides the next safe step.",
      handoffNote: "Calling the practice is not the same as an online confirmation or receipt.",
      summaryContextTitle: "What you told us",
      summaryContextLines,
      quietSecondaryAllowed: true,
    };
  }

  if (input.simulationState.urgentVariant === "urgent_issued") {
    return {
      variant: "urgent_issued",
      outcomeFamily: "urgent_diversion",
      result: "urgent_diversion",
      requestedSafetyState: "urgent_diversion_required",
      requestSafetyState: "urgent_diverted",
      urgentDiversionSettlementState: "issued",
      artifactState: "external_handoff_ready",
      visibilityTier: "public_safe_summary",
      summarySafetyTier: "urgent_diversion_required",
      copyVariantRef: "COPYVAR_142_URGENT_ISSUED_V1",
      outcomeGrammarContractRef: "OGC_151_PHASE1_OUTCOME_GRAMMAR_V1",
      artifactPresentationContractRef: "APC_142_URGENT_DIVERSION_V1",
      outboundNavigationGrantPolicyRef: "ONG_142_URGENT_DIVERSION_V1",
      surfaceRouteContractRef: "ISRC_139_INTAKE_URGENT_OUTCOME_V1",
      surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
      runtimePublicationBundleRef: "rpb::local::authoritative",
      releasePublicationParityRef: "rpp::local::authoritative",
      title: "Urgent guidance has been issued",
      summary: "We have switched this request to the urgent pathway and recorded that change.",
      urgencySentences: [
        "Use the urgent guidance now. Do not wait for a routine reply.",
        "The urgent guidance stays attached to this request.",
      ],
      rationaleHeading: "Why we changed the path",
      rationaleBody:
        "This request now needs urgent guidance. Routine review is no longer the next step.",
      rationaleDisclosureLabel: "See why we changed the path",
      liveRegionMessage: "Urgent guidance has been issued for this request.",
      statusLabel: "Urgent guidance issued",
      statusTone: "issued",
      dominantAction: {
        actionId: "open_urgent_guidance",
        label: "Open urgent guidance",
        interactionKind: "governed_handoff",
        dataTestId: "urgent-dominant-action",
        navigationGrant: urgentGuidanceGrant(input.requestPublicId),
      },
      secondaryAction: {
        actionId: "review_handoff_reason",
        label: "See why we changed the path",
        interactionKind: "toggle_disclosure",
        dataTestId: "urgent-secondary-action",
        navigationGrant: null,
      },
      focusTarget: "primary_action",
      supportSummaryTitle: "What stays attached to this request",
      supportSummaryLines: [
        "Your last safe summary stays attached to this request.",
        "Urgent guidance is now the dominant next step; routine completion is no longer available here.",
      ],
      continuityNote: "This request is now showing urgent guidance.",
      handoffNote: "The urgent guidance link is explicit so you know when you are leaving this page.",
      summaryContextTitle: "What you told us",
      summaryContextLines,
      quietSecondaryAllowed: true,
    };
  }

  return {
    variant: "urgent_required_pending",
    outcomeFamily: "urgent_diversion",
    result: "urgent_diversion",
    requestedSafetyState: "urgent_diversion_required",
    requestSafetyState: "urgent_diversion_required",
    urgentDiversionSettlementState: "pending",
    artifactState: "external_handoff_ready",
    visibilityTier: "public_safe_summary",
    summarySafetyTier: "urgent_diversion_required",
    copyVariantRef: "COPYVAR_142_URGENT_REQUIRED_V1",
    outcomeGrammarContractRef: "OGC_151_PHASE1_OUTCOME_GRAMMAR_V1",
    artifactPresentationContractRef: "APC_142_URGENT_DIVERSION_V1",
    outboundNavigationGrantPolicyRef: "ONG_142_URGENT_DIVERSION_V1",
    surfaceRouteContractRef: "ISRC_139_INTAKE_URGENT_OUTCOME_V1",
    surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    releasePublicationParityRef: "rpp::local::authoritative",
    title: "Get urgent help now",
    summary: "This request cannot stay in the routine queue.",
    urgencySentences: [
      "Call 999 now if the person is in immediate danger, has severe chest pain, or is struggling to breathe.",
      "If you cannot call yourself, ask someone nearby to help you now.",
    ],
    rationaleHeading: "Why this changed before sending",
    rationaleBody:
      "Your answers suggest urgent help is required now. We keep your request summary visible while showing the safest next step.",
    rationaleDisclosureLabel: "Read the urgent guidance",
    liveRegionMessage:
      "Urgent help is needed now. This request cannot stay in the routine queue.",
    statusLabel: "Urgent help required",
    statusTone: "urgent",
    dominantAction: {
      actionId: "call_999_now",
      label: "Call 999 now",
      interactionKind: "governed_handoff",
      dataTestId: "urgent-dominant-action",
      navigationGrant: phoneDialerGrant("Emergency services", "tel:999", input.requestPublicId),
    },
    secondaryAction: {
      actionId: "view_urgent_guidance",
      label: "Read the urgent guidance",
      interactionKind: "toggle_disclosure",
      dataTestId: "urgent-secondary-action",
      navigationGrant: null,
    },
    focusTarget: "primary_action",
    supportSummaryTitle: "What stays visible",
    supportSummaryLines: [
      "Your request summary stays visible while urgent guidance is shown.",
      "Nothing here means urgent guidance has already been issued or recorded.",
    ],
    continuityNote: "Urgent help is needed now, before routine submission continues.",
    handoffNote: "Use the urgent action shown here instead of waiting for a routine response.",
    summaryContextTitle: "What you told us",
    summaryContextLines,
    quietSecondaryAllowed: true,
  };
}
