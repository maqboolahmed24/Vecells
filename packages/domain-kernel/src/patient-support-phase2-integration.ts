export const PORTAL_SUPPORT_PHASE2_TRUTH_KERNEL = "PatientSupportPhase2TruthKernel";
export const PORTAL_SUPPORT_PHASE2_VISUAL_MODE =
  "Portal_Support_Identity_Status_Integration_Lab";

export type PortalSupportIdentityState =
  | "signed_in"
  | "signed_out"
  | "identity_hold"
  | "wrong_patient_hold"
  | "capability_limited";

export type PortalSupportCauseClass =
  | "session_current"
  | "session_recovery_required"
  | "identity_hold"
  | "wrong_patient_freeze"
  | "repair_required"
  | "step_up_required"
  | "read_only_recovery";

export type PortalSupportRecoveryClass =
  | "none"
  | "same_shell_recovery"
  | "same_shell_repair"
  | "step_up"
  | "read_only";

export interface PortalSupportContactDomainBundle {
  readonly authClaim: string;
  readonly identityEvidence: string;
  readonly demographicEvidence: string;
  readonly communicationPreference: string;
  readonly supportReachability: string;
}

export interface PortalSupportFixtureBinding {
  readonly fixtureId: "portal_support_phase2_shared_fixture";
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly communicationClusterRef: string;
  readonly communicationThreadRef: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportObserveSessionId: string;
  readonly supportReplaySessionId: string;
  readonly maskedPatientRef: string;
  readonly canonicalRequestStatusLabel: string;
  readonly communicationStateLabel: string;
  readonly patientActionLabel: string;
  readonly supportActionLabel: string;
  readonly contactDomains: PortalSupportContactDomainBundle;
  readonly authoritativeReasonCodes: readonly string[];
}

export interface PortalSupportRouteSurface {
  readonly surfaceKey:
    | "patient_home"
    | "patient_requests"
    | "patient_request_detail"
    | "patient_more_info"
    | "patient_callback"
    | "patient_contact_repair"
    | "patient_records"
    | "patient_messages"
    | "patient_auth_recovery"
    | "patient_claim_resume"
    | "support_ticket"
    | "support_history"
    | "support_knowledge"
    | "support_action"
    | "support_observe"
    | "support_replay";
  readonly pathPattern: string;
  readonly routeFamily: string;
  readonly capabilityProfile:
    | "portal_full_access"
    | "portal_message_repair"
    | "portal_record_step_up"
    | "portal_session_recovery"
    | "portal_identity_hold"
    | "support_ticket_live"
    | "support_observe_only"
    | "support_replay_safe";
  readonly identityDependencies: readonly string[];
  readonly maskingCeiling: string;
  readonly fallbackMode: string;
  readonly projectionOwner: string;
  readonly currentProjectionOwner: string;
}

export interface PortalSupportPhase2Context {
  readonly truthKernel: typeof PORTAL_SUPPORT_PHASE2_TRUTH_KERNEL;
  readonly fixture: PortalSupportFixtureBinding;
  readonly surface: PortalSupportRouteSurface;
  readonly identityState: PortalSupportIdentityState;
  readonly causeClass: PortalSupportCauseClass;
  readonly recoveryClass: PortalSupportRecoveryClass;
  readonly canonicalStatusLabel: string;
  readonly communicationStateLabel: string;
  readonly patientActionLabel: string;
  readonly supportActionLabel: string;
  readonly contactDomains: PortalSupportContactDomainBundle;
  readonly reasonCodes: readonly string[];
}

const liveContactDomains = {
  authClaim: "NHS login session is current for the signed-in patient shell.",
  identityEvidence:
    "Same-patient request ownership is verified against lineage_211_a and the shared support binding.",
  demographicEvidence: "PDS demographic evidence remains masked and does not replace claim truth.",
  communicationPreference:
    "Patient preference stays secure message first with SMS fallback only after governed repair.",
  supportReachability:
    "Support reachability is tracked separately: the current email route failed and callback-safe fallback remains active.",
} as const satisfies PortalSupportContactDomainBundle;

export const portalSupportSharedFixture = {
  fixtureId: "portal_support_phase2_shared_fixture",
  requestRef: "request_211_a",
  requestLineageRef: "lineage_211_a",
  communicationClusterRef: "cluster_214_derm",
  communicationThreadRef: "thread_214_primary",
  supportTicketId: "support_ticket_218_delivery_failure",
  supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
  supportObserveSessionId: "support_observe_session_218_delivery_failure",
  supportReplaySessionId: "support_replay_session_218_delivery_failure",
  maskedPatientRef: "NHS 943 *** 7812",
  canonicalRequestStatusLabel: "Reply needed",
  communicationStateLabel: "Delivery failed; callback-safe repair and the patient reply obligation remain aligned.",
  patientActionLabel: "Reply with more information",
  supportActionLabel: "Guide the patient back to the same reply-needed step",
  contactDomains: liveContactDomains,
  authoritativeReasonCodes: [
    "PHASE2_PATIENT_REQUEST_OWNERSHIP_CONFIRMED",
    "PHASE2_SUPPORT_LINEAGE_BINDING_CONFIRMED",
    "PHASE2_CONTACT_DOMAIN_SPLIT_PRESERVED",
    "PHASE2_RECOVERY_CAUSE_CLASSES_SHARED",
  ],
} as const satisfies PortalSupportFixtureBinding;

export const portalSupportRouteSurfaces: readonly PortalSupportRouteSurface[] = [
  {
    surfaceKey: "patient_home",
    pathPattern: "/home",
    routeFamily: "rf_patient_home_requests",
    capabilityProfile: "portal_full_access",
    identityDependencies: ["session_current", "same_patient_request_ownership"],
    maskingCeiling: "patient_safe_summary",
    fallbackMode: "same_shell_recovery",
    projectionOwner: "PatientHomeProjection",
    currentProjectionOwner: "par_215",
  },
  {
    surfaceKey: "patient_requests",
    pathPattern: "/requests",
    routeFamily: "rf_patient_home_requests",
    capabilityProfile: "portal_full_access",
    identityDependencies: ["session_current", "same_patient_request_ownership"],
    maskingCeiling: "same_patient_detail",
    fallbackMode: "same_shell_recovery",
    projectionOwner: "PatientRequestsIndexProjection",
    currentProjectionOwner: "par_215",
  },
  {
    surfaceKey: "patient_request_detail",
    pathPattern: "/requests/:requestId",
    routeFamily: "rf_patient_home_requests",
    capabilityProfile: "portal_full_access",
    identityDependencies: ["session_current", "same_patient_request_ownership"],
    maskingCeiling: "same_patient_detail",
    fallbackMode: "same_shell_recovery",
    projectionOwner: "PatientRequestDetailProjection",
    currentProjectionOwner: "par_215",
  },
  {
    surfaceKey: "patient_more_info",
    pathPattern: "/requests/:requestId/more-info/*",
    routeFamily: "rf_patient_more_info_cycle",
    capabilityProfile: "portal_full_access",
    identityDependencies: ["session_current", "same_patient_request_ownership"],
    maskingCeiling: "same_patient_detail",
    fallbackMode: "same_shell_repair",
    projectionOwner: "PatientMoreInfoStatusProjection",
    currentProjectionOwner: "par_216",
  },
  {
    surfaceKey: "patient_callback",
    pathPattern: "/requests/:requestId/callback/*",
    routeFamily: "rf_patient_callback_status",
    capabilityProfile: "portal_message_repair",
    identityDependencies: ["session_current", "same_patient_request_ownership", "reachability_current"],
    maskingCeiling: "same_patient_detail",
    fallbackMode: "same_shell_repair",
    projectionOwner: "PatientCallbackStatusProjection",
    currentProjectionOwner: "par_216",
  },
  {
    surfaceKey: "patient_contact_repair",
    pathPattern: "/contact-repair/:repairCaseRef/*",
    routeFamily: "rf_patient_contact_repair",
    capabilityProfile: "portal_message_repair",
    identityDependencies: ["session_current", "same_patient_request_ownership", "reachability_current"],
    maskingCeiling: "same_patient_detail",
    fallbackMode: "same_shell_repair",
    projectionOwner: "PatientContactRepairProjection",
    currentProjectionOwner: "par_216",
  },
  {
    surfaceKey: "patient_records",
    pathPattern: "/records/*",
    routeFamily: "rf_patient_records",
    capabilityProfile: "portal_record_step_up",
    identityDependencies: ["session_current", "same_patient_request_ownership", "record_release_current"],
    maskingCeiling: "same_patient_detail",
    fallbackMode: "step_up",
    projectionOwner: "PatientRecordSurfaceContext",
    currentProjectionOwner: "par_217",
  },
  {
    surfaceKey: "patient_messages",
    pathPattern: "/messages/*",
    routeFamily: "rf_patient_communications",
    capabilityProfile: "portal_message_repair",
    identityDependencies: ["session_current", "same_patient_request_ownership", "communication_visibility_current"],
    maskingCeiling: "same_patient_detail",
    fallbackMode: "same_shell_repair",
    projectionOwner: "PatientCommunicationsTimelineProjection",
    currentProjectionOwner: "par_217",
  },
  {
    surfaceKey: "patient_auth_recovery",
    pathPattern: "/auth/*",
    routeFamily: "rf_patient_auth_recovery",
    capabilityProfile: "portal_session_recovery",
    identityDependencies: ["auth_callback_truth", "session_governor"],
    maskingCeiling: "summary_only",
    fallbackMode: "same_shell_recovery",
    projectionOwner: "AuthRecoveryStateProjection",
    currentProjectionOwner: "par_195",
  },
  {
    surfaceKey: "patient_claim_resume",
    pathPattern: "/portal/claim/*",
    routeFamily: "rf_patient_claim_resume",
    capabilityProfile: "portal_identity_hold",
    identityDependencies: ["access_grant_truth", "identity_repair_truth"],
    maskingCeiling: "read_only_summary",
    fallbackMode: "read_only",
    projectionOwner: "ClaimResumePostureProjection",
    currentProjectionOwner: "par_197",
  },
  {
    surfaceKey: "support_ticket",
    pathPattern: "/ops/support/tickets/:supportTicketId",
    routeFamily: "rf_support_ticket_workspace",
    capabilityProfile: "support_ticket_live",
    identityDependencies: ["support_lineage_binding", "ticket_runtime_binding"],
    maskingCeiling: "support_summary",
    fallbackMode: "same_shell_recovery",
    projectionOwner: "SupportTicketWorkspaceProjection",
    currentProjectionOwner: "par_221",
  },
  {
    surfaceKey: "support_history",
    pathPattern: "/ops/support/tickets/:supportTicketId/history",
    routeFamily: "rf_support_ticket_workspace",
    capabilityProfile: "support_ticket_live",
    identityDependencies: ["support_lineage_binding", "history_disclosure_lease"],
    maskingCeiling: "governed_expand",
    fallbackMode: "same_shell_recovery",
    projectionOwner: "SupportSubjectContextBinding",
    currentProjectionOwner: "par_222",
  },
  {
    surfaceKey: "support_knowledge",
    pathPattern: "/ops/support/tickets/:supportTicketId/knowledge",
    routeFamily: "rf_support_ticket_workspace",
    capabilityProfile: "support_ticket_live",
    identityDependencies: ["support_lineage_binding", "knowledge_binding"],
    maskingCeiling: "support_summary",
    fallbackMode: "same_shell_recovery",
    projectionOwner: "SupportKnowledgeStackProjection",
    currentProjectionOwner: "par_222",
  },
  {
    surfaceKey: "support_action",
    pathPattern: "/ops/support/tickets/:supportTicketId/actions/:actionKey",
    routeFamily: "rf_support_ticket_workspace",
    capabilityProfile: "support_ticket_live",
    identityDependencies: ["support_lineage_binding", "action_lease_current"],
    maskingCeiling: "support_summary",
    fallbackMode: "same_shell_recovery",
    projectionOwner: "SupportActionWorkbenchProjection",
    currentProjectionOwner: "par_221",
  },
  {
    surfaceKey: "support_observe",
    pathPattern: "/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId",
    routeFamily: "rf_support_ticket_workspace",
    capabilityProfile: "support_observe_only",
    identityDependencies: ["support_lineage_binding", "observe_session_current"],
    maskingCeiling: "support_summary",
    fallbackMode: "read_only",
    projectionOwner: "SupportObserveSession",
    currentProjectionOwner: "par_222",
  },
  {
    surfaceKey: "support_replay",
    pathPattern: "/ops/support/replay/:supportReplaySessionId",
    routeFamily: "rf_support_ticket_workspace",
    capabilityProfile: "support_replay_safe",
    identityDependencies: ["support_lineage_binding", "replay_boundary_current"],
    maskingCeiling: "support_summary",
    fallbackMode: "read_only",
    projectionOwner: "SupportReplaySession",
    currentProjectionOwner: "par_222",
  },
] as const;

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/home";
  }
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function findSurface(pathname: string): PortalSupportRouteSurface {
  const normalized = normalizePathname(pathname);

  if (normalized === "/home") return portalSupportRouteSurfaces[0]!;
  if (normalized === "/requests") return portalSupportRouteSurfaces[1]!;
  if (/^\/requests\/[^/]+$/.test(normalized)) return portalSupportRouteSurfaces[2]!;
  if (/^\/requests\/[^/]+\/more-info(?:\/.*)?$/.test(normalized)) return portalSupportRouteSurfaces[3]!;
  if (/^\/requests\/[^/]+\/callback(?:\/.*)?$/.test(normalized)) return portalSupportRouteSurfaces[4]!;
  if (/^\/contact-repair\/[^/]+(?:\/.*)?$/.test(normalized)) return portalSupportRouteSurfaces[5]!;
  if (/^\/records(?:\/.*)?$/.test(normalized)) return portalSupportRouteSurfaces[6]!;
  if (/^\/messages(?:\/.*)?$/.test(normalized)) return portalSupportRouteSurfaces[7]!;
  if (/^\/auth(?:\/.*)?$/.test(normalized)) return portalSupportRouteSurfaces[8]!;
  if (/^\/portal\/claim(?:\/.*)?$/.test(normalized)) return portalSupportRouteSurfaces[9]!;
  if (/^\/ops\/support\/tickets\/[^/]+\/history$/.test(normalized)) return portalSupportRouteSurfaces[11]!;
  if (/^\/ops\/support\/tickets\/[^/]+\/knowledge$/.test(normalized)) return portalSupportRouteSurfaces[12]!;
  if (/^\/ops\/support\/tickets\/[^/]+\/actions\/[^/]+$/.test(normalized)) return portalSupportRouteSurfaces[13]!;
  if (/^\/ops\/support\/tickets\/[^/]+\/observe\/[^/]+$/.test(normalized)) return portalSupportRouteSurfaces[14]!;
  if (/^\/ops\/support\/replay\/[^/]+$/.test(normalized)) return portalSupportRouteSurfaces[15]!;
  if (/^\/ops\/support\/tickets\/[^/]+$/.test(normalized)) return portalSupportRouteSurfaces[10]!;
  return portalSupportRouteSurfaces[2]!;
}

function hasQuery(search: string | undefined, key: string, expected?: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  const value = params.get(key);
  return expected ? value === expected : value !== null;
}

function deriveCauseClass(pathname: string, search?: string): PortalSupportCauseClass {
  const normalized = normalizePathname(pathname);

  if (
    normalized === "/auth/signed-out" ||
    normalized === "/auth/recovery/session-expired" ||
    normalized === "/portal/claim/support-recovery" ||
    normalized === "/portal/claim/recover-only"
  ) {
    return "session_recovery_required";
  }

  if (normalized === "/portal/claim/read-only") {
    return "read_only_recovery";
  }

  if (normalized === "/portal/claim/identity-hold") {
    return "identity_hold";
  }

  if (normalized === "/portal/claim/wrong-patient-freeze" || normalized === "/portal/claim/rebind-required") {
    return "wrong_patient_freeze";
  }

  if (normalized.includes("step_up")) {
    return "step_up_required";
  }

  if (
    normalized.startsWith("/ops/support/replay/") ||
    hasQuery(search, "fallback") ||
    hasQuery(search, "state", "blocked")
  ) {
    return "read_only_recovery";
  }

  if (
    normalized.includes("/callback/at-risk") ||
    normalized.includes("/repair") ||
    normalized.startsWith("/contact-repair/") ||
    /^\/ops\/support\/tickets\/[^/]+\/actions\/controlled_resend$/.test(normalized)
  ) {
    return "repair_required";
  }

  return "session_current";
}

function deriveIdentityState(causeClass: PortalSupportCauseClass): PortalSupportIdentityState {
  switch (causeClass) {
    case "session_recovery_required":
      return "signed_out";
    case "identity_hold":
      return "identity_hold";
    case "wrong_patient_freeze":
      return "wrong_patient_hold";
    case "step_up_required":
      return "capability_limited";
    default:
      return "signed_in";
  }
}

function deriveRecoveryClass(causeClass: PortalSupportCauseClass): PortalSupportRecoveryClass {
  switch (causeClass) {
    case "session_recovery_required":
      return "same_shell_recovery";
    case "repair_required":
      return "same_shell_repair";
    case "step_up_required":
      return "step_up";
    case "identity_hold":
    case "wrong_patient_freeze":
    case "read_only_recovery":
      return "read_only";
    default:
      return "none";
  }
}

function labelSetForCause(causeClass: PortalSupportCauseClass) {
  switch (causeClass) {
    case "session_recovery_required":
      return {
        canonicalStatusLabel: "Signed out",
        communicationStateLabel:
          "Session recovery is required before patient or support surfaces can widen beyond safe summary.",
        patientActionLabel: "Sign in and safely resume",
        supportActionLabel: "Keep the current tuple summary-only until session recovery finishes",
        reasonCodes: ["PHASE2_SESSION_EXPIRED", "PHASE2_RETURN_INTENT_PRESERVED"],
      } as const;
    case "identity_hold":
      return {
        canonicalStatusLabel: "Identity hold",
        communicationStateLabel:
          "Identity evidence is under hold, so both portal and support routes stay narrowed to patient-safe summary.",
        patientActionLabel: "Continue identity check",
        supportActionLabel: "Preserve chronology and wait for identity release",
        reasonCodes: ["PHASE2_IDENTITY_HOLD_ACTIVE", "PHASE2_MASKING_NARROWED"],
      } as const;
    case "wrong_patient_freeze":
      return {
        canonicalStatusLabel: "Wrong patient freeze",
        communicationStateLabel:
          "A subject mismatch blocks writable actions and keeps all linked routes in the same frozen cause class.",
        patientActionLabel: "Rebind the correct patient",
        supportActionLabel: "Escalate through the bounded identity correction path",
        reasonCodes: ["PHASE2_WRONG_PATIENT_FREEZE", "PHASE2_SUBJECT_REBIND_REQUIRED"],
      } as const;
    case "repair_required":
      return {
        canonicalStatusLabel: "Repair required",
        communicationStateLabel:
          "Delivery failed and both patient and support shells now expose the same callback-safe repair posture.",
        patientActionLabel: "Repair contact route",
        supportActionLabel: "Repair the outbound route without leaving the same ticket anchor",
        reasonCodes: ["PHASE2_REPAIR_REQUIRED", "PHASE2_CONTACT_ROUTE_SEPARATION_PRESERVED"],
      } as const;
    case "step_up_required":
      return {
        canonicalStatusLabel: "Step-up required",
        communicationStateLabel:
          "Capability downgrade is active, so records and communications stay summary-first until the step-up checkpoint settles.",
        patientActionLabel: "Complete step-up",
        supportActionLabel: "Do not widen beyond the current disclosure ceiling",
        reasonCodes: ["PHASE2_STEP_UP_REQUIRED", "PHASE2_RECORD_AND_MESSAGE_RESTRICTION_PARITY"],
      } as const;
    case "read_only_recovery":
      return {
        canonicalStatusLabel: "Read-only recovery",
        communicationStateLabel:
          "The current support replay or fallback is read-only, but the cause class still points back to the same authoritative request lineage.",
        patientActionLabel: "Use the last safe summary",
        supportActionLabel: "Reacquire continuity before restoring writable authority",
        reasonCodes: ["PHASE2_READ_ONLY_RECOVERY", "PHASE2_REPLAY_AND_PORTAL_RECOVERY_ALIGNED"],
      } as const;
    default:
      return {
        canonicalStatusLabel: portalSupportSharedFixture.canonicalRequestStatusLabel,
        communicationStateLabel: portalSupportSharedFixture.communicationStateLabel,
        patientActionLabel: portalSupportSharedFixture.patientActionLabel,
        supportActionLabel: portalSupportSharedFixture.supportActionLabel,
        reasonCodes: ["PHASE2_REQUEST_LINEAGE_PARITY", "PHASE2_COMMUNICATION_STATE_PARITY"],
      } as const;
  }
}

export function resolvePortalSupportPhase2Context(input: {
  readonly pathname: string;
  readonly search?: string;
}): PortalSupportPhase2Context {
  const surface = findSurface(input.pathname);
  const causeClass = deriveCauseClass(input.pathname, input.search);
  const labels = labelSetForCause(causeClass);

  return {
    truthKernel: PORTAL_SUPPORT_PHASE2_TRUTH_KERNEL,
    fixture: portalSupportSharedFixture,
    surface,
    identityState: deriveIdentityState(causeClass),
    causeClass,
    recoveryClass: deriveRecoveryClass(causeClass),
    canonicalStatusLabel: labels.canonicalStatusLabel,
    communicationStateLabel: labels.communicationStateLabel,
    patientActionLabel: labels.patientActionLabel,
    supportActionLabel: labels.supportActionLabel,
    contactDomains: portalSupportSharedFixture.contactDomains,
    reasonCodes: [...portalSupportSharedFixture.authoritativeReasonCodes, ...labels.reasonCodes],
  };
}
