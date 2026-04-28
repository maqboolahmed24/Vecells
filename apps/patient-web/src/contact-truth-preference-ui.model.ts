export const CONTACT_TRUTH_TASK_ID = "par_200";
export const CONTACT_TRUTH_VISUAL_MODE = "Contact_Truth_Ledger";
export const CONTACT_TRUTH_ENTRY = "/portal/account/contact";
export const CONTACT_TRUTH_REPAIR_ENTRY = "/portal/account/contact/repair";
export const CONTACT_TRUTH_EXTERNAL_OFF_ENTRY = "/portal/account/contact/external-off";
export const CONTACT_TRUTH_ROUTE_FAMILY = "rf_contact_truth_workspace";
export const CONTACT_TRUTH_BLOCKED_REQUEST_ID = "REQ-4219";

export type ContactTruthWorkspaceMode =
  | "contact_truth_workspace"
  | "repair_required"
  | "external_sources_unavailable";

export type ContactTruthScreenKey =
  | "AccountDetailsContactWorkspace"
  | "ContactRepairRequiredState"
  | "ExternalSourceUnavailableState";

export type ContactSourceFamily = "nhs_login_claim" | "vecells_preference" | "external_demographic";

export type ContactVerificationState =
  | "verified_current"
  | "patient_reviewed"
  | "feature_gated"
  | "stale_external"
  | "unavailable";

export type ContactEditAuthority =
  | "external_nhs_login"
  | "vecells_patient_preference"
  | "external_pds"
  | "external_gp_system"
  | "not_available_here";

export interface ProvenanceBadge {
  label: string;
  tone: "nhs" | "preference" | "external" | "risk" | "blocked" | "neutral";
  text: string;
}

export interface ContactSourceProvenanceDescriptor {
  projectionName: "ContactSourceProvenanceDescriptor";
  sourceLabel: string;
  verificationState: ContactVerificationState;
  freshnessLabel: string;
  editAuthority: ContactEditAuthority;
  editAuthorityLabel: string;
  badges: readonly ProvenanceBadge[];
}

export interface SourceTruthDescriptor {
  projectionName: "SourceTruthDescriptor";
  sourceId: "nhs-login-claim";
  family: "nhs_login_claim";
  title: string;
  managedBy: "NHS login";
  maskedClaims: readonly {
    label: string;
    value: string;
    claimUse: string;
  }[];
  editableHere: false;
  authorityBoundaryCopy: string;
  prohibitedSideEffectCopy: string;
  provenance: ContactSourceProvenanceDescriptor;
}

export interface PatientPreferenceStateProjection {
  projectionName: "PatientPreferenceStateProjection";
  sourceId: "vecells-contact-preferences";
  family: "vecells_preference";
  title: string;
  managedBy: "Vecells";
  editableHere: true;
  preferredRoute: "sms";
  reminderRoute: "email_paused";
  replyWindowPreference: "sms_first";
  reviewStatus: "reviewable";
  noExternalWriteSideEffects: true;
  preferenceBoundaryCopy: string;
  provenance: ContactSourceProvenanceDescriptor;
}

export interface DemographicSourceProjection {
  projectionName: "DemographicSourceProjection";
  sourceId: "pds-demographics" | "gp-demographics";
  family: "external_demographic";
  sourceLabel: "PDS" | "GP system";
  title: string;
  featureGate: "enabled" | "gated_off";
  rowAvailable: boolean;
  maskedRows: readonly {
    label: string;
    value: string;
    purpose: string;
  }[];
  absenceExplanation: string;
  editableHere: false;
  noPreferenceSideEffects: true;
  provenance: ContactSourceProvenanceDescriptor;
}

export interface PatientReachabilitySummaryProjection {
  projectionName: "PatientReachabilitySummaryProjection";
  blockerId: string;
  blockerState: "not_blocking" | "blocking_active_path";
  blocksActivePath: boolean;
  blockedActionLabel: string;
  blockedActionPath: string;
  blockerReason: string;
  repairRequired: boolean;
  promotedToVisiblePanel: boolean;
  hiddenInDisclosureForbidden: true;
  affectedChannels: readonly ("callback" | "reply" | "reminder")[];
}

export interface PatientContactRepairProjection {
  projectionName: "PatientContactRepairProjection";
  repairId: string;
  repairState: "not_started" | "ready_to_start";
  sameShellRequired: true;
  blockedActionContextPreserved: true;
  returnTarget: string;
  returnFocusTestId: "contact-return-action";
  repairEntryLabel: string;
  repairCopy: string;
}

export interface PatientNavReturnContract {
  projectionName: "PatientNavReturnContract";
  persistentShell: "PersistentShell";
  returnTarget: string;
  selectedAnchorKey: "reply-window";
  focusTestId: "contact-return-action";
  sameLineageRequired: true;
}

export interface PatientActionRecoveryProjection {
  projectionName: "PatientActionRecoveryProjection";
  recoveryState: "not_required" | "contact_repair_required";
  nextSafeAction: string;
  recoveryPath: string;
  genericHomeRedirectForbidden: true;
}

export interface ContactTruthWorkspaceRouteProjection {
  projectionName: "ContactTruthWorkspaceRouteProjection";
  taskId: typeof CONTACT_TRUTH_TASK_ID;
  visualMode: typeof CONTACT_TRUTH_VISUAL_MODE;
  routeFamily: typeof CONTACT_TRUTH_ROUTE_FAMILY;
  pathname: string;
  mode: ContactTruthWorkspaceMode;
  screenKey: ContactTruthScreenKey;
  accountHeader: {
    title: "Account details";
    patientLabel: string;
    maskedAccountRef: string;
    summary: string;
  };
  nhsLoginClaim: SourceTruthDescriptor;
  vecellsPreference: PatientPreferenceStateProjection;
  demographicSources: readonly DemographicSourceProjection[];
  reachabilitySummary: PatientReachabilitySummaryProjection;
  contactRepairProjection: PatientContactRepairProjection;
  patientNavReturnContract: PatientNavReturnContract;
  patientActionRecoveryProjection: PatientActionRecoveryProjection;
}

const nhsLoginClaim: SourceTruthDescriptor = {
  projectionName: "SourceTruthDescriptor",
  sourceId: "nhs-login-claim",
  family: "nhs_login_claim",
  title: "NHS login contact claims",
  managedBy: "NHS login",
  maskedClaims: [
    {
      label: "Email claim",
      value: "a***@example.invalid",
      claimUse: "Sign-in, account recovery, and identity assurance only.",
    },
    {
      label: "Mobile claim",
      value: "mobile ending 118",
      claimUse: "Sign-in challenge and account verification only.",
    },
  ],
  editableHere: false,
  authorityBoundaryCopy:
    "These claims are view-only in Vecells and externally managed through NHS login.",
  prohibitedSideEffectCopy:
    "Changing Vecells preferences does not update NHS login contact claims.",
  provenance: {
    projectionName: "ContactSourceProvenanceDescriptor",
    sourceLabel: "NHS login",
    verificationState: "verified_current",
    freshnessLabel: "Verified during current session",
    editAuthority: "external_nhs_login",
    editAuthorityLabel: "Externally managed through NHS login",
    badges: [
      { label: "Source", tone: "nhs", text: "NHS login claim" },
      { label: "Freshness", tone: "neutral", text: "Current session" },
      { label: "Edit authority", tone: "blocked", text: "View only here" },
    ],
  },
};

const vecellsPreference: PatientPreferenceStateProjection = {
  projectionName: "PatientPreferenceStateProjection",
  sourceId: "vecells-contact-preferences",
  family: "vecells_preference",
  title: "Vecells communication preferences",
  managedBy: "Vecells",
  editableHere: true,
  preferredRoute: "sms",
  reminderRoute: "email_paused",
  replyWindowPreference: "sms_first",
  reviewStatus: "reviewable",
  noExternalWriteSideEffects: true,
  preferenceBoundaryCopy:
    "Reviewing or editing these preferences changes Vecells communication behavior only. It does not update NHS login, PDS demographic rows, or GP demographic rows.",
  provenance: {
    projectionName: "ContactSourceProvenanceDescriptor",
    sourceLabel: "Vecells preferences",
    verificationState: "patient_reviewed",
    freshnessLabel: "Last reviewed during intake",
    editAuthority: "vecells_patient_preference",
    editAuthorityLabel: "Editable as Vecells preferences",
    badges: [
      { label: "Source", tone: "preference", text: "Vecells preference" },
      { label: "Freshness", tone: "neutral", text: "Patient reviewed" },
      { label: "Edit authority", tone: "preference", text: "Editable here" },
    ],
  },
};

function pdsDemographicSource(available: boolean): DemographicSourceProjection {
  return {
    projectionName: "DemographicSourceProjection",
    sourceId: "pds-demographics",
    family: "external_demographic",
    sourceLabel: "PDS",
    title: "PDS demographic contact row",
    featureGate: available ? "enabled" : "gated_off",
    rowAvailable: available,
    maskedRows: available
      ? [
          {
            label: "Postal address",
            value: "address on file, redacted",
            purpose: "Demographic reference; not a communication preference.",
          },
          {
            label: "Telephone",
            value: "demographic phone ending 884",
            purpose: "External demographic row only.",
          },
        ]
      : [],
    absenceExplanation: available
      ? "PDS enrichment is feature-gated on and projected as external demographic context."
      : "PDS enrichment is feature-gated off in this environment, so no PDS contact row is shown as truth.",
    editableHere: false,
    noPreferenceSideEffects: true,
    provenance: {
      projectionName: "ContactSourceProvenanceDescriptor",
      sourceLabel: "PDS",
      verificationState: available ? "stale_external" : "feature_gated",
      freshnessLabel: available ? "Projected from last enrichment" : "Feature gate off",
      editAuthority: available ? "external_pds" : "not_available_here",
      editAuthorityLabel: available ? "External demographic authority" : "Unavailable here",
      badges: [
        { label: "Source", tone: "external", text: "External demographic" },
        {
          label: "Freshness",
          tone: available ? "risk" : "neutral",
          text: available ? "External projection" : "Gate off",
        },
        {
          label: "Edit authority",
          tone: "external",
          text: available ? "PDS only" : "Not available",
        },
      ],
    },
  };
}

function gpDemographicSource(available: boolean): DemographicSourceProjection {
  return {
    projectionName: "DemographicSourceProjection",
    sourceId: "gp-demographics",
    family: "external_demographic",
    sourceLabel: "GP system",
    title: "GP demographic contact row",
    featureGate: available ? "enabled" : "gated_off",
    rowAvailable: available,
    maskedRows: available
      ? [
          {
            label: "Practice-held phone",
            value: "practice phone ending 204",
            purpose: "External demographic row only.",
          },
        ]
      : [],
    absenceExplanation: available
      ? "GP demographic projection is available as reference only."
      : "GP demographic contact is not projected in this environment. Vecells does not infer it from preferences.",
    editableHere: false,
    noPreferenceSideEffects: true,
    provenance: {
      projectionName: "ContactSourceProvenanceDescriptor",
      sourceLabel: "GP system",
      verificationState: available ? "stale_external" : "unavailable",
      freshnessLabel: available ? "Projected from GP system" : "No GP projection",
      editAuthority: available ? "external_gp_system" : "not_available_here",
      editAuthorityLabel: available ? "External GP authority" : "Unavailable here",
      badges: [
        { label: "Source", tone: "external", text: "External demographic" },
        {
          label: "Freshness",
          tone: available ? "risk" : "neutral",
          text: available ? "External projection" : "Unavailable",
        },
        {
          label: "Edit authority",
          tone: "external",
          text: available ? "GP only" : "Not available",
        },
      ],
    },
  };
}

function reachabilitySummary(blocking: boolean): PatientReachabilitySummaryProjection {
  return {
    projectionName: "PatientReachabilitySummaryProjection",
    blockerId: "reachability-contact-route-200",
    blockerState: blocking ? "blocking_active_path" : "not_blocking",
    blocksActivePath: blocking,
    blockedActionLabel: "Reply to request update",
    blockedActionPath: `/portal/requests/${CONTACT_TRUTH_BLOCKED_REQUEST_ID}#reply-window`,
    blockerReason: blocking
      ? "The current reply path needs a reachable SMS route before the patient can continue."
      : "No active callback, reply, or reminder path is currently blocked.",
    repairRequired: blocking,
    promotedToVisiblePanel: blocking,
    hiddenInDisclosureForbidden: true,
    affectedChannels: blocking ? ["callback", "reply", "reminder"] : [],
  };
}

function repairProjection(blocking: boolean): PatientContactRepairProjection {
  return {
    projectionName: "PatientContactRepairProjection",
    repairId: "contact-repair-200",
    repairState: blocking ? "ready_to_start" : "not_started",
    sameShellRequired: true,
    blockedActionContextPreserved: true,
    returnTarget: `/portal/requests/${CONTACT_TRUTH_BLOCKED_REQUEST_ID}#reply-window`,
    returnFocusTestId: "contact-return-action",
    repairEntryLabel: blocking ? "Repair contact route" : "No repair required",
    repairCopy: blocking
      ? "Repair runs in the account shell and returns to the blocked reply action with context preserved."
      : "If a callback, reply, or reminder becomes blocked, repair is promoted here instead of hidden.",
  };
}

function modeForPath(pathname: string): ContactTruthWorkspaceMode {
  const normalized = pathname.replace(/\/+$/, "");
  if (normalized === CONTACT_TRUTH_REPAIR_ENTRY) {
    return "repair_required";
  }
  if (normalized === CONTACT_TRUTH_EXTERNAL_OFF_ENTRY) {
    return "external_sources_unavailable";
  }
  return "contact_truth_workspace";
}

function screenForMode(mode: ContactTruthWorkspaceMode): ContactTruthScreenKey {
  if (mode === "repair_required") {
    return "ContactRepairRequiredState";
  }
  if (mode === "external_sources_unavailable") {
    return "ExternalSourceUnavailableState";
  }
  return "AccountDetailsContactWorkspace";
}

export function ContactTruthWorkspaceResolver(
  pathname: string,
): ContactTruthWorkspaceRouteProjection {
  const mode = modeForPath(pathname);
  const blocking = mode === "repair_required";
  const externalOff = mode === "external_sources_unavailable";
  const reachability = reachabilitySummary(blocking);
  const repair = repairProjection(blocking);
  return {
    projectionName: "ContactTruthWorkspaceRouteProjection",
    taskId: CONTACT_TRUTH_TASK_ID,
    visualMode: CONTACT_TRUTH_VISUAL_MODE,
    routeFamily: CONTACT_TRUTH_ROUTE_FAMILY,
    pathname,
    mode,
    screenKey: screenForMode(mode),
    accountHeader: {
      title: "Account details",
      patientLabel: "Signed-in patient",
      maskedAccountRef: "NHS login verified account",
      summary:
        "Contact sources are shown as separate authorities. Preferences can be reviewed here; external claims and demographic rows remain externally managed.",
    },
    nhsLoginClaim,
    vecellsPreference,
    demographicSources: externalOff
      ? [pdsDemographicSource(false), gpDemographicSource(false)]
      : [pdsDemographicSource(true), gpDemographicSource(false)],
    reachabilitySummary: reachability,
    contactRepairProjection: repair,
    patientNavReturnContract: {
      projectionName: "PatientNavReturnContract",
      persistentShell: "PersistentShell",
      returnTarget: repair.returnTarget,
      selectedAnchorKey: "reply-window",
      focusTestId: "contact-return-action",
      sameLineageRequired: true,
    },
    patientActionRecoveryProjection: {
      projectionName: "PatientActionRecoveryProjection",
      recoveryState: blocking ? "contact_repair_required" : "not_required",
      nextSafeAction: repair.repairEntryLabel,
      recoveryPath: blocking ? CONTACT_TRUTH_REPAIR_ENTRY : CONTACT_TRUTH_ENTRY,
      genericHomeRedirectForbidden: true,
    },
  };
}

export function isContactTruthPreferencePath(pathname: string): boolean {
  return pathname === CONTACT_TRUTH_ENTRY || pathname.startsWith(`${CONTACT_TRUTH_ENTRY}/`);
}
