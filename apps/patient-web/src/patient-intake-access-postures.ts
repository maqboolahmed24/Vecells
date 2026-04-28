export const PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID =
  "PHASE1_PATIENT_ACTION_RECOVERY_SURFACE_V1";
export const GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1 =
  "GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1";
export const GAP_RESOLVED_ACCESS_POSTURE_COPY_REBIND_V1 =
  "GAP_RESOLVED_ACCESS_POSTURE_COPY_REBIND_V1";
export const GAP_RESOLVED_ACCESS_POSTURE_COPY_STALE_PROMOTION_V1 =
  "GAP_RESOLVED_ACCESS_POSTURE_COPY_STALE_PROMOTION_V1";
export const ACCESS_GRANT_SCOPE_ENVELOPE_REF = "AccessGrantScopeEnvelope";
export const ACCESS_GRANT_SUPERSESSION_RECORD_REF = "AccessGrantSupersessionRecord";
export const PATIENT_NAV_RETURN_CONTRACT_REF = "PatientNavReturnContract";
export const RECOVERY_CONTINUATION_TOKEN_REF = "RecoveryContinuationToken";
export const PATIENT_ACTION_RECOVERY_ENVELOPE_REF = "PatientActionRecoveryEnvelope";
export const PATIENT_SHELL_CONSISTENCY_PROJECTION_REF = "PatientShellConsistencyProjection";
export const PATIENT_EMBEDDED_SESSION_PROJECTION_REF = "PatientEmbeddedSessionProjection";
export const PATIENT_DEGRADED_MODE_PROJECTION_REF = "PatientDegradedModeProjection";
export const PATIENT_ACTION_RECOVERY_PROJECTION_REF = "PatientActionRecoveryProjection";
export const PATIENT_IDENTITY_HOLD_PROJECTION_REF = "PatientIdentityHoldProjection";

export type PatientAccessScenarioId =
  | "none"
  | "sign_in_uplift_pending"
  | "auth_return_read_only"
  | "claim_pending_narrowing"
  | "identity_hold"
  | "rebind_required"
  | "embedded_drift_recovery"
  | "stale_draft_promoted";

export type PatientAccessPostureKind =
  | "uplift_pending"
  | "read_only_return"
  | "claim_pending"
  | "identity_hold"
  | "rebind_required"
  | "embedded_drift"
  | "stale_draft_mapped_to_request";

export type PatientAccessSummaryVisibility = "visible" | "masked" | "hidden";
export type PatientAccessActionId =
  | "complete_sign_in_return"
  | "refresh_read_only_access"
  | "refresh_claim"
  | "continue_identity_check"
  | "rebind_identity"
  | "refresh_embedded_session"
  | "open_authoritative_receipt"
  | "open_request_status"
  | "dismiss_notice";

export interface PatientAccessSimulationState {
  scenarioId: PatientAccessScenarioId;
}

export interface PatientAccessAction {
  actionId: PatientAccessActionId;
  label: string;
  nextScenarioId: PatientAccessScenarioId | null;
  targetPathname: string | null;
}

export interface PatientAccessSurfaceView {
  contractId: typeof PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID;
  scenarioId: PatientAccessScenarioId;
  postureKind: PatientAccessPostureKind;
  source:
    | "simulated_access_contract"
    | "simulated_embedded_contract"
    | "promoted_draft_mapping"
    | "recovery_contract";
  tone: "continuity" | "neutral" | "pending" | "blocked";
  stripLabel: string;
  stripDetail: string;
  stripAnnouncement: string;
  stripActionLabel: string;
  title: string;
  explanation: string;
  keptItems: readonly string[];
  summaryVisibility: PatientAccessSummaryVisibility;
  summaryChips: readonly { label: string; value: string }[];
  maskedSummaryLabel: string;
  primaryAction: PatientAccessAction;
  secondaryAction: PatientAccessAction | null;
  maxWidthPx: number;
  focusTarget: "title" | "primary_action";
  liveAnnouncement: string;
  testId: string;
  allowUnderlyingSurface: boolean;
  suppressFooterTray: boolean;
  autoMapTargetPathname: string | null;
  contentGapResolution:
    | typeof GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1
    | typeof GAP_RESOLVED_ACCESS_POSTURE_COPY_REBIND_V1
    | typeof GAP_RESOLVED_ACCESS_POSTURE_COPY_STALE_PROMOTION_V1;
}

export interface PatientAccessSurfaceInput {
  scenarioId: PatientAccessScenarioId;
  currentPathname: string;
  currentRouteKey: string;
  draftPublicId: string;
  requestPublicId: string;
  selectedAnchorKey: string;
  currentStepTitle: string;
  safeSummaryChips: readonly { label: string; value: string }[];
  lastSavedAt: string;
  recoveryReason:
    | "identity_rebind_required"
    | "manifest_drift"
    | "channel_frozen"
    | "promoted_request_available"
    | "grant_scope_drift"
    | "grant_superseded"
    | null;
}

function maskedChipValue(label: string, value: string): string {
  if (label === "Files") {
    return value;
  }
  if (value.includes("@")) {
    const [, domain = "hidden.example"] = value.split("@");
    return `••••@${domain}`;
  }
  if (/\d/.test(value)) {
    return "Protected until access is confirmed";
  }
  return "Protected until access is confirmed";
}

function maskedSummaryChips(
  chips: readonly { label: string; value: string }[],
): readonly { label: string; value: string }[] {
  return chips.map((chip) => ({
    label: chip.label,
    value: maskedChipValue(chip.label, chip.value),
  }));
}

function keptContext(input: PatientAccessSurfaceInput): readonly string[] {
  return [
    `Same request thread: ${input.draftPublicId}`,
    `Last safe section: ${input.currentStepTitle}`,
    `Selected anchor kept: ${input.selectedAnchorKey.replaceAll("-", " ")}`,
  ];
}

export function createDefaultPatientAccessSimulation(): PatientAccessSimulationState {
  return { scenarioId: "none" };
}

export function normalizePatientAccessSimulation(
  value: Partial<PatientAccessSimulationState> | null | undefined,
): PatientAccessSimulationState {
  if (!value) {
    return createDefaultPatientAccessSimulation();
  }
  const scenarioId = value.scenarioId;
  if (
    scenarioId === "sign_in_uplift_pending" ||
    scenarioId === "auth_return_read_only" ||
    scenarioId === "claim_pending_narrowing" ||
    scenarioId === "identity_hold" ||
    scenarioId === "rebind_required" ||
    scenarioId === "embedded_drift_recovery" ||
    scenarioId === "stale_draft_promoted"
  ) {
    return { scenarioId };
  }
  return createDefaultPatientAccessSimulation();
}

export function resolveScenarioId(
  scenarioId: PatientAccessScenarioId,
  recoveryReason: PatientAccessSurfaceInput["recoveryReason"],
): PatientAccessScenarioId {
  if (recoveryReason === "identity_rebind_required") {
    return "rebind_required";
  }
  if (recoveryReason === "manifest_drift" || recoveryReason === "channel_frozen") {
    return "embedded_drift_recovery";
  }
  if (recoveryReason === "grant_scope_drift") {
    return "auth_return_read_only";
  }
  if (recoveryReason === "grant_superseded") {
    return "claim_pending_narrowing";
  }
  if (recoveryReason === "promoted_request_available") {
    return "stale_draft_promoted";
  }
  return scenarioId;
}

function receiptPath(input: PatientAccessSurfaceInput): string {
  return `/start-request/${input.draftPublicId}/receipt`;
}

function statusPath(input: PatientAccessSurfaceInput): string {
  return `/intake/requests/${input.requestPublicId}/status`;
}

export function transitionPatientAccessScenario(
  scenarioId: PatientAccessScenarioId,
  actionId: PatientAccessActionId,
): PatientAccessScenarioId {
  switch (`${scenarioId}:${actionId}`) {
    case "sign_in_uplift_pending:complete_sign_in_return":
      return "auth_return_read_only";
    case "auth_return_read_only:refresh_read_only_access":
      return "none";
    case "claim_pending_narrowing:refresh_claim":
      return "auth_return_read_only";
    case "identity_hold:continue_identity_check":
      return "rebind_required";
    case "rebind_required:rebind_identity":
      return "none";
    case "embedded_drift_recovery:refresh_embedded_session":
      return "none";
    case "stale_draft_promoted:open_request_status":
    case "stale_draft_promoted:dismiss_notice":
      return "none";
    default:
      return scenarioId;
  }
}

export function buildPatientAccessSurface(
  input: PatientAccessSurfaceInput,
): PatientAccessSurfaceView | null {
  const scenarioId = resolveScenarioId(input.scenarioId, input.recoveryReason);
  if (scenarioId === "none") {
    return null;
  }

  const safeMaskedSummary = maskedSummaryChips(input.safeSummaryChips);
  const keptItems = keptContext(input);

  switch (scenarioId) {
    case "sign_in_uplift_pending":
      return {
        contractId: PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID,
        scenarioId,
        postureKind: "uplift_pending",
        source: "simulated_access_contract",
        tone: "continuity",
        stripLabel: "Finish sign in in this shell",
        stripDetail:
          "We kept your place and selected anchor. Personal details stay hidden until the return check completes.",
        stripAnnouncement:
          "Continue sign in in the same shell. Personal details stay hidden until the return check completes.",
        stripActionLabel: "Review access change",
        title: "Keep this request open while you sign in",
        explanation:
          "We are preserving this same request thread and will reopen it here before showing any personal detail that was not already safe.",
        keptItems,
        summaryVisibility: "hidden",
        summaryChips: [],
        maskedSummaryLabel: "Summary is hidden until sign-in return completes.",
        primaryAction: {
          actionId: "complete_sign_in_return",
          label: "Continue sign in",
          nextScenarioId: "auth_return_read_only",
          targetPathname: input.currentPathname,
        },
        secondaryAction: {
          actionId: "dismiss_notice",
          label: "Keep this page open",
          nextScenarioId: scenarioId,
          targetPathname: null,
        },
        maxWidthPx: 760,
        focusTarget: "primary_action",
        liveAnnouncement:
          "Sign-in uplift started. This request stays open in the same shell while access is checked.",
        testId: "access-uplift-pending-panel",
        allowUnderlyingSurface: false,
        suppressFooterTray: true,
        autoMapTargetPathname: null,
        contentGapResolution: GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1,
      };
    case "auth_return_read_only":
      return {
        contractId: PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID,
        scenarioId,
        postureKind: "read_only_return",
        source: input.recoveryReason === "grant_scope_drift" ? "recovery_contract" : "simulated_access_contract",
        tone: "neutral",
        stripLabel: "Editing is paused while access is narrowed",
        stripDetail:
          "You are back in the same request. We restored the shell but are keeping this step read-only until writable access is lawful again.",
        stripAnnouncement:
          "You are back in the same request. Editing is paused while access is narrowed.",
        stripActionLabel: "Review access change",
        title: "You are back in the same request, but editing is paused",
        explanation:
          "We reopened the same shell and preserved the last safe context. What you can see now is narrowed until the access and continuity checks agree again.",
        keptItems,
        summaryVisibility: "masked",
        summaryChips: safeMaskedSummary,
        maskedSummaryLabel: "Last-safe summary is masked while editing stays read-only.",
        primaryAction: {
          actionId: "refresh_read_only_access",
          label: "Refresh access",
          nextScenarioId: "none",
          targetPathname: input.currentPathname,
        },
        secondaryAction: {
          actionId: "open_request_status",
          label: "Track request instead",
          nextScenarioId: "none",
          targetPathname: statusPath(input),
        },
        maxWidthPx: 760,
        focusTarget: "title",
        liveAnnouncement:
          "Editing is paused. This request is open in read-only mode while access is narrowed.",
        testId: "read-only-return-frame",
        allowUnderlyingSurface: false,
        suppressFooterTray: true,
        autoMapTargetPathname: null,
        contentGapResolution: GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1,
      };
    case "claim_pending_narrowing":
      return {
        contractId: PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID,
        scenarioId,
        postureKind: "claim_pending",
        source: input.recoveryReason === "grant_superseded" ? "recovery_contract" : "simulated_access_contract",
        tone: "pending",
        stripLabel: "Claim check still in progress",
        stripDetail:
          "We kept the same request open, but claim confirmation is still pending so editable detail and personal summary stay withheld.",
        stripAnnouncement:
          "Claim confirmation is still pending. Editable detail and personal summary stay withheld in this shell.",
        stripActionLabel: "Review access change",
        title: "We kept your place, but the claim check is still pending",
        explanation:
          "This request has not been thrown away. We are preserving the same shell while we wait for the narrower claim proof that lets us widen what you can safely see.",
        keptItems,
        summaryVisibility: "hidden",
        summaryChips: [],
        maskedSummaryLabel: "Summary is hidden while the claim check is pending.",
        primaryAction: {
          actionId: "refresh_claim",
          label: "Check access again",
          nextScenarioId: "auth_return_read_only",
          targetPathname: input.currentPathname,
        },
        secondaryAction: null,
        maxWidthPx: 760,
        focusTarget: "primary_action",
        liveAnnouncement:
          "Claim check still pending. This request stays open, but details remain hidden.",
        testId: "claim-pending-frame",
        allowUnderlyingSurface: false,
        suppressFooterTray: true,
        autoMapTargetPathname: null,
        contentGapResolution: GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1,
      };
    case "identity_hold":
      return {
        contractId: PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID,
        scenarioId,
        postureKind: "identity_hold",
        source: "simulated_access_contract",
        tone: "blocked",
        stripLabel: "Confirm it is still you before editing",
        stripDetail:
          "We preserved the same request thread, but we are holding personal detail until the identity check is refreshed.",
        stripAnnouncement:
          "Identity check required. The request stays open, but personal detail is held until the check is refreshed.",
        stripActionLabel: "Review access change",
        title: "Before editing, confirm that this request is still yours",
        explanation:
          "We kept the shell, the draft lineage, and your last safe anchor. Personal detail stays hidden until the identity hold clears.",
        keptItems,
        summaryVisibility: "masked",
        summaryChips: safeMaskedSummary,
        maskedSummaryLabel: "Last-safe summary is masked while identity hold is active.",
        primaryAction: {
          actionId: "continue_identity_check",
          label: "Continue identity check",
          nextScenarioId: "rebind_required",
          targetPathname: input.currentPathname,
        },
        secondaryAction: null,
        maxWidthPx: 760,
        focusTarget: "primary_action",
        liveAnnouncement:
          "Identity hold active. Personal detail stays hidden until the identity check is refreshed.",
        testId: "identity-hold-bridge",
        allowUnderlyingSurface: false,
        suppressFooterTray: true,
        autoMapTargetPathname: null,
        contentGapResolution: GAP_RESOLVED_ACCESS_POSTURE_COPY_REBIND_V1,
      };
    case "rebind_required":
      return {
        contractId: PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID,
        scenarioId,
        postureKind: "rebind_required",
        source: input.recoveryReason === "identity_rebind_required" ? "recovery_contract" : "simulated_access_contract",
        tone: "continuity",
        stripLabel: "Rebind this request before editing",
        stripDetail:
          "We preserved the same shell and last-safe context, but the editable lane cannot continue until this request is rebound to the current access proof.",
        stripAnnouncement:
          "Rebind required. The same request is preserved, but editing cannot continue until the request is rebound.",
        stripActionLabel: "Review access change",
        title: "Rebind this request before editing continues",
        explanation:
          "Nothing has been restarted. We kept the shell and anchor, but personal detail and writable controls stay gated until the rebind step succeeds.",
        keptItems,
        summaryVisibility: "masked",
        summaryChips: safeMaskedSummary,
        maskedSummaryLabel: "Last-safe summary is masked until the rebind step succeeds.",
        primaryAction: {
          actionId: "rebind_identity",
          label: "Rebind and continue",
          nextScenarioId: "none",
          targetPathname: input.currentPathname,
        },
        secondaryAction: null,
        maxWidthPx: 760,
        focusTarget: "primary_action",
        liveAnnouncement:
          "Rebind required. Personal detail stays hidden until the same request is rebound.",
        testId: "rebind-required-bridge",
        allowUnderlyingSurface: false,
        suppressFooterTray: true,
        autoMapTargetPathname: null,
        contentGapResolution: GAP_RESOLVED_ACCESS_POSTURE_COPY_REBIND_V1,
      };
    case "embedded_drift_recovery":
      return {
        contractId: PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID,
        scenarioId,
        postureKind: "embedded_drift",
        source:
          input.recoveryReason === "manifest_drift" || input.recoveryReason === "channel_frozen"
            ? "recovery_contract"
            : "simulated_embedded_contract",
        tone: "continuity",
        stripLabel: "Refresh this secure view without losing your place",
        stripDetail:
          "The secure or embedded channel drifted, so we are holding the same shell and last-safe context until the view is refreshed.",
        stripAnnouncement:
          "Secure view refresh required. Your place is preserved in the same shell while the channel is refreshed.",
        stripActionLabel: "Review access change",
        title: "Refresh this secure view without starting over",
        explanation:
          "The shell is still holding the same request thread. We are pausing detail rendering until the embedded or manifest fence matches again.",
        keptItems,
        summaryVisibility: "masked",
        summaryChips: safeMaskedSummary,
        maskedSummaryLabel: "Last-safe summary is masked while the secure view refreshes.",
        primaryAction: {
          actionId: "refresh_embedded_session",
          label: "Refresh this secure view",
          nextScenarioId: "none",
          targetPathname: input.currentPathname,
        },
        secondaryAction: null,
        maxWidthPx: 760,
        focusTarget: "primary_action",
        liveAnnouncement:
          "Secure view refresh required. The shell preserved your place while the channel is refreshed.",
        testId: "embedded-drift-recovery-frame",
        allowUnderlyingSurface: false,
        suppressFooterTray: true,
        autoMapTargetPathname: null,
        contentGapResolution: GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1,
      };
    case "stale_draft_promoted": {
      const onReceiptRoute = input.currentRouteKey === "receipt_outcome";
      const onStatusRoute = input.currentRouteKey === "request_status";
      return {
        contractId: PATIENT_ACTION_RECOVERY_SURFACE_CONTRACT_ID,
        scenarioId,
        postureKind: "stale_draft_mapped_to_request",
        source: input.recoveryReason === "promoted_request_available" ? "recovery_contract" : "promoted_draft_mapping",
        tone: "neutral",
        stripLabel: "This draft is already a submitted request",
        stripDetail:
          "We mapped the stale draft token to the authoritative request shell instead of reopening editable draft work.",
        stripAnnouncement:
          "This draft is already a submitted request. We mapped you to the authoritative request shell.",
        stripActionLabel: "Review access change",
        title: "This draft is already a submitted request",
        explanation:
          "We did not reopen mutable draft work. You are now in the authoritative request shell for this same lineage.",
        keptItems,
        summaryVisibility: "masked",
        summaryChips: safeMaskedSummary,
        maskedSummaryLabel: "Last-safe summary is masked while we map to authoritative request truth.",
        primaryAction: onStatusRoute
          ? {
              actionId: "dismiss_notice",
              label: "Stay on request status",
              nextScenarioId: "none",
              targetPathname: input.currentPathname,
            }
          : {
              actionId: onReceiptRoute ? "open_request_status" : "open_authoritative_receipt",
              label: onReceiptRoute ? "Track request status" : "Open request receipt",
              nextScenarioId: onReceiptRoute ? "none" : "stale_draft_promoted",
              targetPathname: onReceiptRoute ? statusPath(input) : receiptPath(input),
            },
        secondaryAction: onReceiptRoute
          ? {
              actionId: "dismiss_notice",
              label: "Stay on receipt",
              nextScenarioId: "none",
              targetPathname: input.currentPathname,
            }
          : null,
        maxWidthPx: 760,
        focusTarget: "title",
        liveAnnouncement:
          "This draft is already submitted. You are being kept in the authoritative request shell.",
        testId: "stale-draft-notice",
        allowUnderlyingSurface: onReceiptRoute || onStatusRoute,
        suppressFooterTray: true,
        autoMapTargetPathname:
          onReceiptRoute || onStatusRoute ? null : receiptPath(input),
        contentGapResolution: GAP_RESOLVED_ACCESS_POSTURE_COPY_STALE_PROMOTION_V1,
      };
    }
    default:
      return null;
  }
}
