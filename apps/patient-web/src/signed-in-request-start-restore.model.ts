export const SIGNED_IN_REQUEST_START_TASK_ID = "par_199";
export const SIGNED_IN_REQUEST_START_VISUAL_MODE = "SignedIn_Mission_Frame";
export const SIGNED_IN_REQUEST_START_ENTRY = "/portal/start-request";
export const SIGNED_IN_REQUEST_ROUTE_FAMILY = "rf_signed_in_request_start";
export const SIGNED_IN_CANONICAL_DRAFT_ID = "dft_auth_199";
export const SIGNED_IN_PROMOTED_REQUEST_ID = "REQ-4219";

export type SignedInRequestScreenKey =
  | "SignedInStartRequestEntry"
  | "ContinueDraftEntry"
  | "SavedContextRestoreEntry"
  | "PromotedDraftMappedOutcome"
  | "NarrowedWritePostureEntry";

export type SignedInRequestEntryMode =
  | "start_new"
  | "continue_draft"
  | "saved_context_restore"
  | "post_auth_return"
  | "promoted_draft_mapped"
  | "narrowed_write_posture";

export type SignedInRequestStepKey =
  | "request_type"
  | "details"
  | "supporting_files"
  | "contact_preferences"
  | "review_submit"
  | "request_status";

export type RestoreDecision =
  | "start_canonical_intake"
  | "restore_authoritative_draft"
  | "restore_after_auth_return"
  | "map_to_promoted_request"
  | "defer_to_claim_posture";

export interface SubmissionEnvelope {
  projectionName: "SubmissionEnvelope";
  envelopeFamily: "canonical_phase1_intake";
  submissionChannel: "authenticated_patient_portal";
  canonicalIntakeShellPath: string;
  secondAuthenticatedIntakeModelForbidden: true;
}

export interface DraftSessionLease {
  projectionName: "DraftSessionLease";
  draftPublicId: string;
  leaseState: "active" | "reauthenticated" | "promoted" | "write_narrowed";
  sessionEpoch: "current";
  subjectBindingVersion: "current";
  leasePreservesStep: boolean;
}

export interface DraftContinuityEvidenceProjection {
  projectionName: "DraftContinuityEvidenceProjection";
  draftPublicId: string;
  requestType: "Symptoms" | "Meds" | "Admin" | "Results";
  currentStepKey: SignedInRequestStepKey;
  selectedAnchorKey: string;
  lastSafeSummary: string;
  lastMeaningfulUpdate: string;
  promotionState: "draft_open" | "promoted_to_request" | "not_promoted";
  restoreAuthority: "authoritative_projection";
  localCacheOnlyRestoreForbidden: true;
}

export interface RouteIntentBinding {
  projectionName: "RouteIntentBinding";
  routeFamily: typeof SIGNED_IN_REQUEST_ROUTE_FAMILY;
  routeIntent:
    | "authenticated_start_request"
    | "authenticated_continue_draft"
    | "authenticated_restore_saved_context"
    | "promoted_draft_mapping"
    | "claim_posture_deferral";
  validity: "valid" | "recovery_only" | "blocked";
  sameShellRequired: true;
}

export interface RecoveryContinuationToken {
  projectionName: "RecoveryContinuationToken";
  recoveryState: "not_required" | "post_auth_return" | "claim_completion_return";
  safeReturnPath: string;
  rawTokenVisibleToClient: false;
}

export interface PatientPortalEntryProjection {
  projectionName: "PatientPortalEntryProjection";
  portalRouteFamily: "authenticated_patient_portal";
  entryPath: typeof SIGNED_IN_REQUEST_START_ENTRY;
  patientLabel: string;
  maskedPatientRef: string;
}

export interface PatientHomeProjection {
  projectionName: "PatientHomeProjection";
  entryCardPlacement: "quiet_home_primary_action" | "saved_context_card";
  homeActionLabel: "Start new request" | "Continue draft";
  quietHomeDashboardForbidden: true;
}

export interface PatientNavReturnContract {
  projectionName: "PatientNavReturnContract";
  persistentShell: "PersistentShell";
  returnTarget: string;
  selectedAnchorKey: string;
  focusTestId: string;
  sameLineageRequired: true;
}

export interface PatientRequestReturnBundle {
  projectionName: "PatientRequestReturnBundle";
  draftPublicId: string;
  selectedStepKey: SignedInRequestStepKey;
  selectedAnchorKey: string;
  requestType: DraftContinuityEvidenceProjection["requestType"];
  lastSafeSummary: string;
  currentSafeDestination: string;
  restoredBy: "soft_navigation" | "refresh_replay" | "post_auth_return" | "claim_completion_return";
}

export interface PatientActionRecoveryProjection {
  projectionName: "PatientActionRecoveryProjection";
  recoveryState: "not_required" | "same_shell_restore" | "claim_posture_required";
  nextSafeAction: string;
  recoveryPath: string;
  genericHomeRedirectForbidden: true;
}

export interface PatientAudienceCoverageProjection {
  projectionName: "PatientAudienceCoverageProjection";
  maxVisibleDetail: "account_summary" | "draft_safe_summary" | "request_truth_summary";
  allowedFields: readonly string[];
  suppressedFields: readonly string[];
  accountDisclosureDominatesIntake: false;
}

export interface PatientIdentityHoldProjection {
  projectionName: "PatientIdentityHoldProjection";
  holdState: "clear" | "claim_posture_narrowed";
  blocksWritableAction: boolean;
  postureFamilySource: "par_197 ClaimResumePostureResolver";
  nextSafePath: string;
}

export interface AuthenticatedAccountDisclosureModel {
  label: string;
  summary: string;
  maskedPatientRef: string;
  collapsible: true;
  dominance: "secondary";
}

export interface SavedContextCardModel {
  draftPublicId: string;
  requestType: DraftContinuityEvidenceProjection["requestType"];
  lastMeaningfulUpdate: string;
  currentSafeDestination: string;
  selectedAnchorKey: string;
  dominantActionLabel: string;
  dominantActionPath: string;
}

export interface SavedContextResolverInput {
  mode: SignedInRequestEntryMode;
  continuityEvidence: DraftContinuityEvidenceProjection;
  draftSessionLease: DraftSessionLease;
  identityHold: PatientIdentityHoldProjection;
}

export interface SavedContextResolution {
  projectionName: "SavedContextResolution";
  decision: RestoreDecision;
  reasonCode:
    | "canonical_start_allowed"
    | "authoritative_draft_restore_allowed"
    | "post_auth_return_restored"
    | "promoted_draft_maps_forward"
    | "claim_posture_narrows_write";
  canonicalTargetPath: string;
  opensDraftForEditing: boolean;
  mapsToRequestTruth: boolean;
  usesLocalCacheOnly: false;
}

export interface SignedInRequestScreenProjection {
  projectionName: "SignedInRequestScreenProjection";
  screenKey: SignedInRequestScreenKey;
  mode: SignedInRequestEntryMode;
  title: string;
  eyebrow: string;
  body: string;
  dominantActionLabel: string;
  dominantActionPath: string;
  secondaryActionLabel: string | null;
  secondaryActionPath: string | null;
  accent: "start" | "saved" | "mapped" | "blocked";
  focusTestId: string;
}

export interface SignedInRequestEntryProjection {
  projectionName: "SignedInRequestEntryProjection";
  taskId: typeof SIGNED_IN_REQUEST_START_TASK_ID;
  visualMode: typeof SIGNED_IN_REQUEST_START_VISUAL_MODE;
  pathname: string;
  screen: SignedInRequestScreenProjection;
  submissionEnvelope: SubmissionEnvelope;
  draftSessionLease: DraftSessionLease;
  draftContinuityEvidenceProjection: DraftContinuityEvidenceProjection;
  savedContextResolution: SavedContextResolution;
  routeIntentBinding: RouteIntentBinding;
  recoveryContinuationToken: RecoveryContinuationToken;
  patientPortalEntryProjection: PatientPortalEntryProjection;
  patientHomeProjection: PatientHomeProjection;
  patientNavReturnContract: PatientNavReturnContract;
  patientRequestReturnBundle: PatientRequestReturnBundle;
  patientActionRecoveryProjection: PatientActionRecoveryProjection;
  patientAudienceCoverageProjection: PatientAudienceCoverageProjection;
  patientIdentityHoldProjection: PatientIdentityHoldProjection;
  savedContextCard: SavedContextCardModel;
  accountDisclosure: AuthenticatedAccountDisclosureModel;
}

const canonicalStartPath = `/start-request/${SIGNED_IN_CANONICAL_DRAFT_ID}/request-type`;
const canonicalDetailsPath = `/start-request/${SIGNED_IN_CANONICAL_DRAFT_ID}/details`;
const canonicalFilesPath = `/start-request/${SIGNED_IN_CANONICAL_DRAFT_ID}/files`;
const promotedRequestPath = `/portal/requests/${SIGNED_IN_PROMOTED_REQUEST_ID}`;
const claimPosturePath = "/portal/claim/identity-hold";

const baseContinuity: DraftContinuityEvidenceProjection = {
  projectionName: "DraftContinuityEvidenceProjection",
  draftPublicId: SIGNED_IN_CANONICAL_DRAFT_ID,
  requestType: "Symptoms",
  currentStepKey: "details",
  selectedAnchorKey: "request-proof",
  lastSafeSummary: "You were adding symptom detail for a request started today.",
  lastMeaningfulUpdate: "Saved detail step 12 minutes ago",
  promotionState: "draft_open",
  restoreAuthority: "authoritative_projection",
  localCacheOnlyRestoreForbidden: true,
};

function screenForMode(mode: SignedInRequestEntryMode): SignedInRequestScreenProjection {
  switch (mode) {
    case "continue_draft":
      return {
        projectionName: "SignedInRequestScreenProjection",
        screenKey: "ContinueDraftEntry",
        mode,
        title: "Continue your saved request",
        eyebrow: "Saved progress",
        body: "We found saved answers for this account. Continue from the same place.",
        dominantActionLabel: "Continue draft",
        dominantActionPath: canonicalDetailsPath,
        secondaryActionLabel: "Start a different request",
        secondaryActionPath: canonicalStartPath,
        accent: "saved",
        focusTestId: "continue-draft-entry-action",
      };
    case "saved_context_restore":
      return {
        projectionName: "SignedInRequestScreenProjection",
        screenKey: "SavedContextRestoreEntry",
        mode,
        title: "Return to your saved step",
        eyebrow: "Saved progress",
        body: "We can reopen the step you were working on with your saved summary kept in place.",
        dominantActionLabel: "Restore saved step",
        dominantActionPath: canonicalFilesPath,
        secondaryActionLabel: "Review request type",
        secondaryActionPath: canonicalStartPath,
        accent: "saved",
        focusTestId: "restore-saved-context-action",
      };
    case "post_auth_return":
      return {
        projectionName: "SignedInRequestScreenProjection",
        screenKey: "SavedContextRestoreEntry",
        mode,
        title: "You are back in the same request",
        eyebrow: "Signed in",
        body: "Sign-in brought you back to the request you were already working on.",
        dominantActionLabel: "Continue restored step",
        dominantActionPath: canonicalFilesPath,
        secondaryActionLabel: "View saved summary",
        secondaryActionPath: `${SIGNED_IN_REQUEST_START_ENTRY}/restore`,
        accent: "saved",
        focusTestId: "restore-saved-context-action",
      };
    case "promoted_draft_mapped":
      return {
        projectionName: "SignedInRequestScreenProjection",
        screenKey: "PromotedDraftMappedOutcome",
        mode,
        title: "This draft is now a request",
        eyebrow: "Request created",
        body: "This saved draft has already been sent. You can view the current request status.",
        dominantActionLabel: "View current request",
        dominantActionPath: promotedRequestPath,
        secondaryActionLabel: "Back to saved work",
        secondaryActionPath: SIGNED_IN_REQUEST_START_ENTRY,
        accent: "mapped",
        focusTestId: "promoted-draft-mapped-action",
      };
    case "narrowed_write_posture":
      return {
        projectionName: "SignedInRequestScreenProjection",
        screenKey: "NarrowedWritePostureEntry",
        mode,
        title: "Editing is paused for safety",
        eyebrow: "Safety check",
        body: "We need to confirm access before more changes can be made.",
        dominantActionLabel: "Continue safety check",
        dominantActionPath: claimPosturePath,
        secondaryActionLabel: "Return to saved context",
        secondaryActionPath: `${SIGNED_IN_REQUEST_START_ENTRY}/continue`,
        accent: "blocked",
        focusTestId: "narrowed-write-posture-action",
      };
    case "start_new":
    default:
      return {
        projectionName: "SignedInRequestScreenProjection",
        screenKey: "SignedInStartRequestEntry",
        mode: "start_new",
        title: "Start new request",
        eyebrow: "Signed-in request",
        body: "Start from your signed-in account. We will keep the request linked to this patient portal.",
        dominantActionLabel: "Start new request",
        dominantActionPath: canonicalStartPath,
        secondaryActionLabel: "Continue saved draft",
        secondaryActionPath: `${SIGNED_IN_REQUEST_START_ENTRY}/continue`,
        accent: "start",
        focusTestId: "signed-in-start-request-action",
      };
  }
}

function modeForPath(pathname: string): SignedInRequestEntryMode {
  switch (pathname.replace(/\/+$/, "")) {
    case `${SIGNED_IN_REQUEST_START_ENTRY}/continue`:
      return "continue_draft";
    case `${SIGNED_IN_REQUEST_START_ENTRY}/restore`:
      return "saved_context_restore";
    case `${SIGNED_IN_REQUEST_START_ENTRY}/post-auth-return`:
      return "post_auth_return";
    case `${SIGNED_IN_REQUEST_START_ENTRY}/promoted`:
      return "promoted_draft_mapped";
    case `${SIGNED_IN_REQUEST_START_ENTRY}/narrowed`:
      return "narrowed_write_posture";
    case SIGNED_IN_REQUEST_START_ENTRY:
    default:
      return "start_new";
  }
}

function continuityForMode(mode: SignedInRequestEntryMode): DraftContinuityEvidenceProjection {
  if (mode === "saved_context_restore" || mode === "post_auth_return") {
    return {
      ...baseContinuity,
      currentStepKey: "supporting_files",
      selectedAnchorKey: "request-proof",
      lastSafeSummary: "You were adding supporting files to a symptom request.",
      lastMeaningfulUpdate: "Evidence step saved after sign-in",
    };
  }
  if (mode === "promoted_draft_mapped") {
    return {
      ...baseContinuity,
      currentStepKey: "request_status",
      selectedAnchorKey: "request-return",
      lastSafeSummary: "This saved draft has already become request REQ-4219.",
      lastMeaningfulUpdate: "Promoted to a request",
      promotionState: "promoted_to_request",
    };
  }
  if (mode === "start_new") {
    return {
      ...baseContinuity,
      currentStepKey: "request_type",
      selectedAnchorKey: "request-start",
      lastSafeSummary: "No saved answer is required to start a new request.",
      lastMeaningfulUpdate: "New signed-in start",
      promotionState: "not_promoted",
    };
  }
  return baseContinuity;
}

function leaseForMode(mode: SignedInRequestEntryMode): DraftSessionLease {
  return {
    projectionName: "DraftSessionLease",
    draftPublicId: SIGNED_IN_CANONICAL_DRAFT_ID,
    leaseState:
      mode === "promoted_draft_mapped"
        ? "promoted"
        : mode === "narrowed_write_posture"
          ? "write_narrowed"
          : mode === "post_auth_return"
            ? "reauthenticated"
            : "active",
    sessionEpoch: "current",
    subjectBindingVersion: "current",
    leasePreservesStep: mode !== "start_new",
  };
}

function identityHoldForMode(mode: SignedInRequestEntryMode): PatientIdentityHoldProjection {
  return {
    projectionName: "PatientIdentityHoldProjection",
    holdState: mode === "narrowed_write_posture" ? "claim_posture_narrowed" : "clear",
    blocksWritableAction: mode === "narrowed_write_posture",
    postureFamilySource: "par_197 ClaimResumePostureResolver",
    nextSafePath: mode === "narrowed_write_posture" ? claimPosturePath : canonicalDetailsPath,
  };
}

export function SavedContextResolver(input: SavedContextResolverInput): SavedContextResolution {
  const { mode, continuityEvidence, draftSessionLease, identityHold } = input;
  if (identityHold.blocksWritableAction || draftSessionLease.leaseState === "write_narrowed") {
    return {
      projectionName: "SavedContextResolution",
      decision: "defer_to_claim_posture",
      reasonCode: "claim_posture_narrows_write",
      canonicalTargetPath: claimPosturePath,
      opensDraftForEditing: false,
      mapsToRequestTruth: false,
      usesLocalCacheOnly: false,
    };
  }
  if (
    continuityEvidence.promotionState === "promoted_to_request" ||
    draftSessionLease.leaseState === "promoted"
  ) {
    return {
      projectionName: "SavedContextResolution",
      decision: "map_to_promoted_request",
      reasonCode: "promoted_draft_maps_forward",
      canonicalTargetPath: promotedRequestPath,
      opensDraftForEditing: false,
      mapsToRequestTruth: true,
      usesLocalCacheOnly: false,
    };
  }
  if (mode === "post_auth_return") {
    return {
      projectionName: "SavedContextResolution",
      decision: "restore_after_auth_return",
      reasonCode: "post_auth_return_restored",
      canonicalTargetPath: canonicalFilesPath,
      opensDraftForEditing: true,
      mapsToRequestTruth: false,
      usesLocalCacheOnly: false,
    };
  }
  if (mode === "continue_draft" || mode === "saved_context_restore") {
    return {
      projectionName: "SavedContextResolution",
      decision: "restore_authoritative_draft",
      reasonCode: "authoritative_draft_restore_allowed",
      canonicalTargetPath:
        continuityEvidence.currentStepKey === "supporting_files"
          ? canonicalFilesPath
          : canonicalDetailsPath,
      opensDraftForEditing: true,
      mapsToRequestTruth: false,
      usesLocalCacheOnly: false,
    };
  }
  return {
    projectionName: "SavedContextResolution",
    decision: "start_canonical_intake",
    reasonCode: "canonical_start_allowed",
    canonicalTargetPath: canonicalStartPath,
    opensDraftForEditing: true,
    mapsToRequestTruth: false,
    usesLocalCacheOnly: false,
  };
}

export function SignedInRequestEntryResolver(pathname: string): SignedInRequestEntryProjection {
  const mode = modeForPath(pathname);
  const screen = screenForMode(mode);
  const continuityEvidence = continuityForMode(mode);
  const draftSessionLease = leaseForMode(mode);
  const identityHold = identityHoldForMode(mode);
  const savedContextResolution = SavedContextResolver({
    mode,
    continuityEvidence,
    draftSessionLease,
    identityHold,
  });
  const returnBundle: PatientRequestReturnBundle = {
    projectionName: "PatientRequestReturnBundle",
    draftPublicId: continuityEvidence.draftPublicId,
    selectedStepKey: continuityEvidence.currentStepKey,
    selectedAnchorKey: continuityEvidence.selectedAnchorKey,
    requestType: continuityEvidence.requestType,
    lastSafeSummary: continuityEvidence.lastSafeSummary,
    currentSafeDestination: savedContextResolution.canonicalTargetPath,
    restoredBy:
      mode === "post_auth_return"
        ? "post_auth_return"
        : mode === "narrowed_write_posture"
          ? "claim_completion_return"
          : "soft_navigation",
  };
  return {
    projectionName: "SignedInRequestEntryProjection",
    taskId: SIGNED_IN_REQUEST_START_TASK_ID,
    visualMode: SIGNED_IN_REQUEST_START_VISUAL_MODE,
    pathname,
    screen,
    submissionEnvelope: {
      projectionName: "SubmissionEnvelope",
      envelopeFamily: "canonical_phase1_intake",
      submissionChannel: "authenticated_patient_portal",
      canonicalIntakeShellPath: canonicalStartPath,
      secondAuthenticatedIntakeModelForbidden: true,
    },
    draftSessionLease,
    draftContinuityEvidenceProjection: continuityEvidence,
    savedContextResolution,
    routeIntentBinding: {
      projectionName: "RouteIntentBinding",
      routeFamily: SIGNED_IN_REQUEST_ROUTE_FAMILY,
      routeIntent:
        mode === "promoted_draft_mapped"
          ? "promoted_draft_mapping"
          : mode === "narrowed_write_posture"
            ? "claim_posture_deferral"
            : mode === "continue_draft"
              ? "authenticated_continue_draft"
              : mode === "saved_context_restore" || mode === "post_auth_return"
                ? "authenticated_restore_saved_context"
                : "authenticated_start_request",
      validity: mode === "narrowed_write_posture" ? "blocked" : "valid",
      sameShellRequired: true,
    },
    recoveryContinuationToken: {
      projectionName: "RecoveryContinuationToken",
      recoveryState:
        mode === "post_auth_return"
          ? "post_auth_return"
          : mode === "narrowed_write_posture"
            ? "claim_completion_return"
            : "not_required",
      safeReturnPath: savedContextResolution.canonicalTargetPath,
      rawTokenVisibleToClient: false,
    },
    patientPortalEntryProjection: {
      projectionName: "PatientPortalEntryProjection",
      portalRouteFamily: "authenticated_patient_portal",
      entryPath: SIGNED_IN_REQUEST_START_ENTRY,
      patientLabel: "Signed-in patient",
      maskedPatientRef: "NHS 943 *** 7812",
    },
    patientHomeProjection: {
      projectionName: "PatientHomeProjection",
      entryCardPlacement: mode === "start_new" ? "quiet_home_primary_action" : "saved_context_card",
      homeActionLabel: mode === "start_new" ? "Start new request" : "Continue draft",
      quietHomeDashboardForbidden: true,
    },
    patientNavReturnContract: {
      projectionName: "PatientNavReturnContract",
      persistentShell: "PersistentShell",
      returnTarget: savedContextResolution.canonicalTargetPath,
      selectedAnchorKey: continuityEvidence.selectedAnchorKey,
      focusTestId: screen.focusTestId,
      sameLineageRequired: true,
    },
    patientRequestReturnBundle: returnBundle,
    patientActionRecoveryProjection: {
      projectionName: "PatientActionRecoveryProjection",
      recoveryState:
        mode === "narrowed_write_posture"
          ? "claim_posture_required"
          : mode === "start_new"
            ? "not_required"
            : "same_shell_restore",
      nextSafeAction: screen.dominantActionLabel,
      recoveryPath: savedContextResolution.canonicalTargetPath,
      genericHomeRedirectForbidden: true,
    },
    patientAudienceCoverageProjection: {
      projectionName: "PatientAudienceCoverageProjection",
      maxVisibleDetail:
        mode === "promoted_draft_mapped" ? "request_truth_summary" : "draft_safe_summary",
      allowedFields: ["requestType", "lastMeaningfulUpdate", "selectedAnchor", "safeDestination"],
      suppressedFields: [
        "rawIdentifiers",
        "clinicalReasoning",
        "staffNotes",
        "fullPatientIdentifier",
      ],
      accountDisclosureDominatesIntake: false,
    },
    patientIdentityHoldProjection: identityHold,
    savedContextCard: {
      draftPublicId: continuityEvidence.draftPublicId,
      requestType: continuityEvidence.requestType,
      lastMeaningfulUpdate: continuityEvidence.lastMeaningfulUpdate,
      currentSafeDestination: savedContextResolution.canonicalTargetPath,
      selectedAnchorKey: continuityEvidence.selectedAnchorKey,
      dominantActionLabel: screen.dominantActionLabel,
      dominantActionPath: screen.dominantActionPath,
    },
    accountDisclosure: {
      label: "Account context",
      summary: "Signed in with NHS login. Account details stay separate from request answers.",
      maskedPatientRef: "NHS 943 *** 7812",
      collapsible: true,
      dominance: "secondary",
    },
  };
}

export function isSignedInRequestStartPath(pathname: string): boolean {
  return (
    pathname === SIGNED_IN_REQUEST_START_ENTRY ||
    pathname.startsWith(`${SIGNED_IN_REQUEST_START_ENTRY}/`)
  );
}
