import {
  frontendContractManifestExamples,
  generateFrontendContractManifest,
  validateFrontendContractManifest,
  type FrontendContractManifestRuntime,
  type FrontendManifestGenerationInput,
  type FrontendManifestValidationVerdict,
} from "@vecells/api-contracts";
import {
  type ArtifactShellSpecimen,
  type CasePulseContract,
  type ProjectionFreshnessEnvelope,
  type StatusTruthInput,
} from "@vecells/design-system";
import {
  createInitialContinuitySnapshot,
  getPersistentShellRouteClaim,
  resolveActionGuardDecision,
  resolveRouteGuardDecision,
  type ActionGuardDecision,
  type AudienceSurfaceRuntimeBindingLike,
  type ContinuitySnapshot,
  type FrontendContractManifestLike,
  type ReleaseRecoveryDispositionLike,
  type ReleaseTrustFreezeVerdictLike,
  type RouteFreezeDispositionLike,
  type RouteGuardChannelProfile,
  type RouteGuardDecision,
  type RuntimeScenario,
} from "@vecells/persistent-shell";
import {
  surfacePostureSpecimens,
  type SurfacePostureContract,
} from "@vecells/surface-postures";

export const PATIENT_SHELL_TASK_ID = "par_115";
export const PATIENT_SHELL_VISUAL_MODE = "Patient_Shell_Gallery";

export type PatientHomeMode = "attention" | "quiet";
export type PatientPrimarySection =
  | "home"
  | "requests"
  | "appointments"
  | "records"
  | "messages";
export type PatientRouteKey =
  | "home"
  | "embedded"
  | "requests"
  | "request_detail"
  | "appointments"
  | "records"
  | "record_follow_up"
  | "messages"
  | "message_thread"
  | "recovery";
export type PatientRequestState =
  | "reply_needed"
  | "awaiting_review"
  | "in_progress"
  | "blocked_repair";
export type PatientAppointmentState =
  | "confirmation_pending"
  | "manage_eligible"
  | "waitlist_interest"
  | "fallback_recovery";
export type PatientRecordKind = "result" | "letter" | "medication";
export type PatientThreadState =
  | "reply_needed"
  | "awaiting_review"
  | "closed"
  | "blocked_contact";

export interface PatientShellLocation {
  routeKey: PatientRouteKey;
  section: PatientPrimarySection;
  routeFamilyRef:
    | "rf_patient_home"
    | "rf_patient_embedded_channel"
    | "rf_patient_requests"
    | "rf_patient_appointments"
    | "rf_patient_health_record"
    | "rf_patient_messages"
    | "rf_patient_secure_link_recovery";
  pathname: string;
  requestId: string | null;
  appointmentId: string | null;
  recordId: string | null;
  threadId: string | null;
}

export interface PatientShellViewMemory {
  homeMode: PatientHomeMode;
  selectedRequestId: string;
  selectedAppointmentId: string;
  selectedRecordId: string;
  selectedThreadId: string;
}

export interface PatientRequestProjection {
  id: string;
  title: string;
  state: PatientRequestState;
  summary: string;
  updatedAt: string;
  trustCue: string;
  nextStep: string;
  lineage: readonly string[];
  recoveryNote: string | null;
}

export interface PatientAppointmentProjection {
  id: string;
  title: string;
  status: PatientAppointmentState;
  dateLabel: string;
  locationLabel: string;
  summary: string;
  trustCue: string;
  manageLabel: string;
}

export interface PatientTrendPoint {
  label: string;
  value: number;
  interpretation: string;
}

export interface PatientRecordProjection {
  id: string;
  title: string;
  kind: PatientRecordKind;
  summary: string;
  updatedAt: string;
  trustCue: string;
  followUpLabel: string;
  detailSummary: string;
  trendPoints: readonly PatientTrendPoint[];
}

export interface PatientMessageLine {
  speaker: string;
  body: string;
  time: string;
  authoritative: boolean;
}

export interface PatientThreadProjection {
  id: string;
  subject: string;
  state: PatientThreadState;
  sender: string;
  preview: string;
  updatedAt: string;
  trustCue: string;
  threadLines: readonly PatientMessageLine[];
}

export interface PatientShellRouteView {
  location: PatientShellLocation;
  routeClaim: ReturnType<typeof getPersistentShellRouteClaim>;
  manifest: FrontendContractManifestRuntime;
  manifestVerdict: FrontendManifestValidationVerdict;
  runtimeBinding: AudienceSurfaceRuntimeBindingLike;
  guardDecision: RouteGuardDecision;
  mutationAction: ActionGuardDecision;
  liveUpdateAction: ActionGuardDecision;
  statusInput: StatusTruthInput;
  casePulse: CasePulseContract;
  selectedAnchorKey: string;
  trustCues: readonly string[];
  attentionLabel: string;
  artifactSpecimen: ArtifactShellSpecimen | null;
  messagePosture: SurfacePostureContract | null;
}

export const patientIdentitySummary = {
  fullName: "Samira Ahmed",
  givenName: "Samira",
  maskedNhsNumber: "943 *** 7812",
  contactRoute: "SMS and email confirmations",
  assuranceSummary: "Authenticated portal / same-device continuity",
} as const;

export const patientRequests: readonly PatientRequestProjection[] = [
  {
    id: "REQ-2049",
    title: "Travel support for the dermatology review",
    state: "reply_needed",
    summary: "The care team needs one photo and your latest flare window before confirming transport help.",
    updatedAt: "2026-04-13T08:12:00Z",
    trustCue:
      "Reply-needed status stays visible until a reviewed response is accepted into the request history.",
    nextStep: "Add the requested photo and confirm the flare timing.",
    lineage: [
      "Submitted on 10 Apr",
      "Clinician follow-up requested on 12 Apr",
      "Support message reopened on 13 Apr",
    ],
    recoveryNote: null,
  },
  {
    id: "REQ-2028",
    title: "Medication question about the evening dose",
    state: "awaiting_review",
    summary: "Your last message is in review and the next safe action is simply to keep the current schedule visible.",
    updatedAt: "2026-04-13T07:55:00Z",
    trustCue:
      "Awaiting-review copy must not overclaim a final clinical decision while the thread is still under review.",
    nextStep: "Keep the current dose summary nearby until the clinician reply lands.",
    lineage: [
      "Submitted on 11 Apr",
      "Nurse acknowledgement on 12 Apr",
      "Queued for pharmacist review on 13 Apr",
    ],
    recoveryNote: null,
  },
  {
    id: "REQ-1988",
    title: "Photo update for the wound check",
    state: "in_progress",
    summary: "The team is processing your updated photos and has not asked for anything else yet.",
    updatedAt: "2026-04-13T07:10:00Z",
    trustCue:
      "In-progress posture stays calm and specific instead of inflating reassurance beyond the current processing tuple.",
    nextStep: "Review the current summary and keep the return-safe request detail nearby.",
    lineage: [
      "Submitted on 09 Apr",
      "Photo batch accepted on 10 Apr",
      "Review in progress on 13 Apr",
    ],
    recoveryNote: null,
  },
  {
    id: "REQ-1934",
    title: "Contact-route repair for the secure link",
    state: "blocked_repair",
    summary: "The request summary is still visible, but reply movement is fenced until the contact route is repaired.",
    updatedAt: "2026-04-13T06:42:00Z",
    trustCue:
      "Blocked repair state keeps the same shell and lineage visible while only the bounded repair path remains actionable.",
    nextStep: "Repair the contact route and resume from the last safe request summary.",
    lineage: [
      "Submitted on 08 Apr",
      "Link challenge failed on 12 Apr",
      "Recovery route armed on 13 Apr",
    ],
    recoveryNote: "Use the same-shell recovery route instead of leaving the portal.",
  },
] as const;

export const patientAppointments: readonly PatientAppointmentProjection[] = [
  {
    id: "APT-778",
    title: "Dermatology review",
    status: "confirmation_pending",
    dateLabel: "Tuesday 16 April, 09:40",
    locationLabel: "Community clinic, Floor 2, Room 14",
    summary:
      "The slot is held, but final confirmation remains governed by the booking tuple and is still read-only here.",
    trustCue:
      "Do not imply a fully booked state while confirmation is pending and the route is read-only.",
    manageLabel: "Review the held summary",
  },
  {
    id: "APT-744",
    title: "Medication review call",
    status: "manage_eligible",
    dateLabel: "Friday 19 April, 14:20",
    locationLabel: "Phone call",
    summary:
      "This call already has a stable summary, but live change controls stay secondary to the current read-only posture.",
    trustCue: "Manage-eligible posture is shown truthfully, but change controls remain visibly fenced.",
    manageLabel: "Open the call summary",
  },
  {
    id: "APT-702",
    title: "Respiratory check waitlist",
    status: "waitlist_interest",
    dateLabel: "No slot assigned yet",
    locationLabel: "Nearest respiratory clinic",
    summary: "Your interest is recorded and the shell keeps the waitlist summary calm and specific.",
    trustCue: "Waitlist interest is not a booking promise.",
    manageLabel: "Review waitlist details",
  },
  {
    id: "APT-661",
    title: "Secure-link recovery visit",
    status: "fallback_recovery",
    dateLabel: "Last safe summary only",
    locationLabel: "Same-shell recovery path",
    summary:
      "This appointment stays on the last safe summary because confirmation evidence drifted and only recovery-safe posture remains.",
    trustCue: "Fallback recovery is bounded in the shell and never phrased as a confirmed visit.",
    manageLabel: "Open the recovery route",
  },
] as const;

export const patientRecords: readonly PatientRecordProjection[] = [
  {
    id: "REC-HEM-8",
    title: "Ferritin result",
    kind: "result",
    summary: "One low-but-improving iron trend is visible with summary and table parity.",
    updatedAt: "2026-04-13T08:02:00Z",
    trustCue:
      "Summary-first record posture keeps the meaning visible before any full artifact preview or follow-up step.",
    followUpLabel: "Ask a bounded follow-up question",
    detailSummary:
      "The result remains clinically meaningful, but the route still anchors on the summary and return-safe follow-up path.",
    trendPoints: [
      { label: "Feb", value: 18, interpretation: "Low" },
      { label: "Mar", value: 24, interpretation: "Improving" },
      { label: "Apr", value: 31, interpretation: "Recovering" },
    ],
  },
  {
    id: "REC-LET-3",
    title: "Dermatology letter",
    kind: "letter",
    summary: "A concise clinician letter is visible as a summary-first card with a bounded artifact preview.",
    updatedAt: "2026-04-12T14:21:00Z",
    trustCue: "Letters stay summary-first and return-safe; they do not replace the route shell.",
    followUpLabel: "Review the letter summary",
    detailSummary: "The letter summary highlights the next safe action and preserves the record-origin return target.",
    trendPoints: [
      { label: "Prep", value: 1, interpretation: "Summary ready" },
      { label: "Review", value: 2, interpretation: "Stable" },
      { label: "Follow-up", value: 1, interpretation: "Optional" },
    ],
  },
  {
    id: "REC-MED-2",
    title: "Medication reminder update",
    kind: "medication",
    summary: "The medication plan changed once and the summary clarifies what is new without overclaiming finality.",
    updatedAt: "2026-04-11T10:18:00Z",
    trustCue: "Medication changes remain summary-first until any dependent conversation is settled.",
    followUpLabel: "Review the medication note",
    detailSummary: "The route keeps the current medication note summary visible and bounded.",
    trendPoints: [
      { label: "Morning", value: 2, interpretation: "Current" },
      { label: "Evening", value: 1, interpretation: "Under review" },
      { label: "PRN", value: 1, interpretation: "Available" },
    ],
  },
] as const;

export const patientThreads: readonly PatientThreadProjection[] = [
  {
    id: "THR-420",
    subject: "Reply needed about the photo timing",
    state: "reply_needed",
    sender: "Dermatology team",
    preview: "The team needs one clarified photo time and one symptom note before review can continue.",
    updatedAt: "2026-04-13T08:16:00Z",
    trustCue:
      "Reply-needed status stays explicit and does not overclaim delivery or clinical review completion.",
    threadLines: [
      {
        speaker: "Dermatology team",
        body: "Please send one more photo taken in daylight and confirm when the flare peaked.",
        time: "08:16",
        authoritative: true,
      },
      {
        speaker: "You",
        body: "I can send the photo this morning.",
        time: "08:19",
        authoritative: false,
      },
    ],
  },
  {
    id: "THR-411",
    subject: "Awaiting review on the dose question",
    state: "awaiting_review",
    sender: "Pharmacy review queue",
    preview: "Your latest message is in review and no new action is requested from you yet.",
    updatedAt: "2026-04-13T07:43:00Z",
    trustCue: "Awaiting-review posture is specific without promising final pharmacist advice yet.",
    threadLines: [
      {
        speaker: "You",
        body: "Should I keep the evening dose at the current time?",
        time: "07:43",
        authoritative: false,
      },
      {
        speaker: "Pharmacy review queue",
        body: "We have your question and will respond through the same shell.",
        time: "07:48",
        authoritative: true,
      },
    ],
  },
  {
    id: "THR-402",
    subject: "Closed dressing advice thread",
    state: "closed",
    sender: "Care team",
    preview: "The dressing advice thread is settled and now remains as a closed reference only.",
    updatedAt: "2026-04-12T16:28:00Z",
    trustCue: "Closed threads remain readable, but the shell does not promote them as active tasks.",
    threadLines: [
      {
        speaker: "Care team",
        body: "The dressing plan is settled. Use the record summary if you need to review it again.",
        time: "16:28",
        authoritative: true,
      },
    ],
  },
  {
    id: "THR-399",
    subject: "Blocked contact-route repair thread",
    state: "blocked_contact",
    sender: "Secure messaging support",
    preview: "The thread summary remains visible while reply readiness is suppressed until the contact route is repaired.",
    updatedAt: "2026-04-13T06:41:00Z",
    trustCue:
      "Blocked contact posture keeps the summary visible without implying the reply lane is safe right now.",
    threadLines: [
      {
        speaker: "Secure messaging support",
        body: "We kept the summary here so you can return safely once the contact route is repaired.",
        time: "06:41",
        authoritative: true,
      },
    ],
  },
] as const;

const requestById = new Map(patientRequests.map((request) => [request.id, request] as const));
const appointmentById = new Map(
  patientAppointments.map((appointment) => [appointment.id, appointment] as const),
);
const recordById = new Map(patientRecords.map((record) => [record.id, record] as const));
const threadById = new Map(patientThreads.map((thread) => [thread.id, thread] as const));

function stripGeneratedManifest(
  manifest: FrontendContractManifestRuntime,
): FrontendManifestGenerationInput {
  const {
    frontendContractDigestRef: _frontendContractDigestRef,
    designContractDigestRef: _designContractDigestRef,
    surfaceAuthorityTupleHash: _surfaceAuthorityTupleHash,
    frontendContractDigestVerdict: _frontendContractDigestVerdict,
    designContractDigestVerdict: _designContractDigestVerdict,
    surfaceAuthorityTupleVerdict: _surfaceAuthorityTupleVerdict,
    driftState: _driftState,
    ...rest
  } = manifest;
  return rest;
}

const liveBaseManifest = frontendContractManifestExamples[0];
const readOnlyBaseManifest = frontendContractManifestExamples[1];

if (!liveBaseManifest || !readOnlyBaseManifest) {
  throw new Error("PATIENT_SHELL_MANIFEST_BASES_MISSING");
}

export const patientAuthenticatedManifest = generateFrontendContractManifest({
  ...stripGeneratedManifest(liveBaseManifest),
  frontendContractManifestId: "FCM_115_PATIENT_AUTHENTICATED_PORTAL_SEED_V1",
  routeFamilyRefs: [
    "rf_patient_home",
    "rf_patient_requests",
    "rf_patient_health_record",
    "rf_patient_messages",
  ],
  gatewaySurfaceRef: "gws_patient_home_seed",
  gatewaySurfaceRefs: [
    "gws_patient_home_seed",
    "gws_patient_requests_seed",
    "gws_patient_health_record_seed",
    "gws_patient_messages_seed",
  ],
  surfaceRouteContractRef: "ASRC_115_PATIENT_AUTHENTICATED_PORTAL_V1",
  surfacePublicationRef: "ASPR_115_PATIENT_AUTHENTICATED_PORTAL_V1",
  audienceSurfaceRuntimeBindingRef: "ASRB_115_PATIENT_AUTHENTICATED_PORTAL_V1",
  designContractPublicationBundleRef: "DCPB_115_PATIENT_AUTHENTICATED_PORTAL_V1",
  profileSelectionResolutionRefs: [
    "PSR_104_PATIENT_PORTAL_V1",
    "PSR_104_RF_PATIENT_HOME_V1",
    "PSR_115_RF_PATIENT_HEALTH_RECORD_V1",
    "PSR_115_RF_PATIENT_MESSAGES_V1",
    "PSR_104_RF_PATIENT_REQUESTS_V1",
  ],
  surfaceStateKernelBindingRefs: [
    "SSKB_050_RF_PATIENT_HOME_V1",
    "SSKB_050_RF_PATIENT_REQUESTS_V1",
    "SSKB_115_RF_PATIENT_HEALTH_RECORD_V1",
    "SSKB_115_RF_PATIENT_MESSAGES_V1",
  ],
  projectionQueryContractRefs: [
    "PQC_115_RF_PATIENT_HOME_V1",
    "PQC_115_RF_PATIENT_REQUESTS_V1",
    "PQC_115_RF_PATIENT_HEALTH_RECORD_V1",
    "PQC_115_RF_PATIENT_MESSAGES_V1",
  ],
  projectionQueryContractDigestRefs: [
    "pqd::rf_patient_home_seed::v1",
    "pqd::rf_patient_requests_seed::v1",
    "pqd::rf_patient_health_record_seed::v1",
    "pqd::rf_patient_messages_seed::v1",
  ],
  mutationCommandContractRefs: [
    "MCC_115_RF_PATIENT_REQUESTS_REPLY_V1",
    "MCC_115_RF_PATIENT_MESSAGES_REPLY_V1",
  ],
  mutationCommandContractDigestRefs: [
    "mcd::rf_patient_requests_reply_seed::v1",
    "mcd::rf_patient_messages_reply_seed::v1",
  ],
  liveUpdateChannelContractRefs: [
    "LUC_115_RF_PATIENT_MESSAGES_V1",
    "LUC_115_RF_PATIENT_REQUESTS_V1",
  ],
  liveUpdateChannelDigestRefs: [
    "lcd::rf_patient_messages_seed::v1",
    "lcd::rf_patient_requests_seed::v1",
  ],
  releaseRecoveryDispositionRef: "RRD_115_PATIENT_PORTAL_RESUME",
  releaseRecoveryDispositionRefs: [
    "RRD_115_PATIENT_PORTAL_RESUME",
    "RRD_115_PATIENT_PORTAL_READ_ONLY",
  ],
  routeFreezeDispositionRef: "RFD_115_PATIENT_PORTAL_NORMAL",
  routeFreezeDispositionRefs: ["RFD_115_PATIENT_PORTAL_NORMAL"],
  accessibilitySemanticCoverageProfileRefs: [
    "ASCP_050_RF_PATIENT_HOME_V1",
    "ASCP_050_RF_PATIENT_REQUESTS_V1",
    "ASCP_115_RF_PATIENT_HEALTH_RECORD_V1",
    "ASCP_115_RF_PATIENT_MESSAGES_V1",
  ],
  automationAnchorProfileRefs: [
    "AAP_050_RF_PATIENT_HOME_V1",
    "AAP_050_RF_PATIENT_REQUESTS_V1",
    "AAP_115_RF_PATIENT_HEALTH_RECORD_V1",
    "AAP_115_RF_PATIENT_MESSAGES_V1",
  ],
  surfaceStateSemanticsProfileRefs: [
    "SSSP_050_RF_PATIENT_HOME_V1",
    "SSSP_050_RF_PATIENT_REQUESTS_V1",
    "SSSP_115_RF_PATIENT_HEALTH_RECORD_V1",
    "SSSP_115_RF_PATIENT_MESSAGES_V1",
  ],
  generatedAt: "2026-04-13T18:45:00Z",
  source_refs: [
    "prompt/115.md",
    "prompt/shared_operating_contract_106_to_115.md",
    "docs/architecture/112_route_guard_and_feature_flag_plumbing.md",
  ],
});

export const patientAppointmentsManifest = generateFrontendContractManifest({
  ...stripGeneratedManifest(readOnlyBaseManifest),
  frontendContractManifestId: "FCM_115_PATIENT_APPOINTMENTS_READ_ONLY_SEED_V1",
  audienceSurface: "audsurf_patient_authenticated_portal",
  surfaceRouteContractRef: "ASRC_115_PATIENT_APPOINTMENTS_V1",
  surfacePublicationRef: "ASPR_115_PATIENT_APPOINTMENTS_V1",
  audienceSurfaceRuntimeBindingRef: "ASRB_115_PATIENT_APPOINTMENTS_V1",
  designContractPublicationBundleRef: "DCPB_115_PATIENT_APPOINTMENTS_V1",
  routeFamilyRefs: ["rf_patient_appointments"],
  gatewaySurfaceRef: "gws_patient_appointments_seed",
  gatewaySurfaceRefs: ["gws_patient_appointments_seed"],
  profileSelectionResolutionRefs: ["PSR_115_RF_PATIENT_APPOINTMENTS_V1"],
  surfaceStateKernelBindingRefs: ["SSKB_115_RF_PATIENT_APPOINTMENTS_V1"],
  projectionQueryContractRefs: ["PQC_115_RF_PATIENT_APPOINTMENTS_V1"],
  projectionQueryContractDigestRefs: ["pqd::rf_patient_appointments_seed::v1"],
  mutationCommandContractRefs: ["MCC_115_RF_PATIENT_APPOINTMENTS_MANAGE_V1"],
  mutationCommandContractDigestRefs: ["mcd::rf_patient_appointments_manage_seed::v1"],
  liveUpdateChannelContractRefs: ["LUC_115_RF_PATIENT_APPOINTMENTS_V1"],
  liveUpdateChannelDigestRefs: ["lcd::rf_patient_appointments_seed::v1"],
  accessibilitySemanticCoverageProfileRefs: ["ASCP_115_RF_PATIENT_APPOINTMENTS_V1"],
  automationAnchorProfileRefs: ["AAP_115_RF_PATIENT_APPOINTMENTS_V1"],
  surfaceStateSemanticsProfileRefs: ["SSSP_115_RF_PATIENT_APPOINTMENTS_V1"],
  generatedAt: "2026-04-13T18:45:00Z",
  source_refs: [
    "prompt/115.md",
    "prompt/shared_operating_contract_106_to_115.md",
    "docs/architecture/112_route_guard_and_feature_flag_plumbing.md",
  ],
});

export const patientRecoveryManifest = generateFrontendContractManifest({
  ...stripGeneratedManifest(readOnlyBaseManifest),
  frontendContractManifestId: "FCM_115_PATIENT_RECOVERY_SEED_V1",
  audienceSurface: "audsurf_patient_transaction_recovery",
  routeFamilyRefs: ["rf_patient_secure_link_recovery", "rf_patient_embedded_channel"],
  gatewaySurfaceRef: "gws_patient_secure_link_recovery_seed",
  gatewaySurfaceRefs: [
    "gws_patient_secure_link_recovery_seed",
    "gws_patient_embedded_channel_seed",
  ],
  surfaceRouteContractRef: "ASRC_115_PATIENT_TRANSACTION_RECOVERY_V1",
  surfacePublicationRef: "ASPR_115_PATIENT_TRANSACTION_RECOVERY_V1",
  audienceSurfaceRuntimeBindingRef: "ASRB_115_PATIENT_TRANSACTION_RECOVERY_V1",
  designContractPublicationBundleRef: "DCPB_115_PATIENT_TRANSACTION_RECOVERY_V1",
  runtimeBindingState: "stale",
  runtimePublicationState: "stale",
  publicationParityState: "stale",
  projectionCompatibilityState: "recovery_only",
  accessibilityCoverageState: "degraded",
  manifestState: "drifted",
  browserPostureState: "recovery_only",
  profileSelectionResolutionRefs: [
    "PSR_115_RF_PATIENT_RECOVERY_V1",
    "PSR_115_RF_PATIENT_EMBEDDED_V1",
  ],
  surfaceStateKernelBindingRefs: [
    "SSKB_115_RF_PATIENT_RECOVERY_V1",
    "SSKB_115_RF_PATIENT_EMBEDDED_V1",
  ],
  projectionQueryContractRefs: [
    "PQC_115_RF_PATIENT_RECOVERY_V1",
    "PQC_115_RF_PATIENT_EMBEDDED_V1",
  ],
  projectionQueryContractDigestRefs: [
    "pqd::rf_patient_recovery_seed::v1",
    "pqd::rf_patient_embedded_seed::v1",
  ],
  mutationCommandContractRefs: ["MCC_115_RF_PATIENT_RECOVERY_RESUME_V1"],
  mutationCommandContractDigestRefs: ["mcd::rf_patient_recovery_resume_seed::v1"],
  liveUpdateChannelContractRefs: [],
  liveUpdateChannelDigestRefs: [],
  accessibilitySemanticCoverageProfileRefs: [
    "ASCP_115_RF_PATIENT_RECOVERY_V1",
    "ASCP_115_RF_PATIENT_EMBEDDED_V1",
  ],
  automationAnchorProfileRefs: [
    "AAP_115_RF_PATIENT_RECOVERY_V1",
    "AAP_115_RF_PATIENT_EMBEDDED_V1",
  ],
  surfaceStateSemanticsProfileRefs: [
    "SSSP_115_RF_PATIENT_RECOVERY_V1",
    "SSSP_115_RF_PATIENT_EMBEDDED_V1",
  ],
  generatedAt: "2026-04-13T18:45:00Z",
  source_refs: [
    "prompt/115.md",
    "prompt/shared_operating_contract_106_to_115.md",
    "docs/architecture/112_route_guard_and_feature_flag_plumbing.md",
  ],
});

function bindingFromManifest(
  manifest: FrontendContractManifestRuntime,
  bindingState: AudienceSurfaceRuntimeBindingLike["bindingState"],
  surfaceAuthorityState: string,
  tupleSuffix: string,
): AudienceSurfaceRuntimeBindingLike {
  return {
    audienceSurfaceRuntimeBindingId: manifest.audienceSurfaceRuntimeBindingRef,
    audienceSurface: manifest.audienceSurface,
    routeFamilyRefs: manifest.routeFamilyRefs,
    gatewaySurfaceRefs: manifest.gatewaySurfaceRefs,
    surfaceRouteContractRef: manifest.surfaceRouteContractRef,
    surfacePublicationRef: manifest.surfacePublicationRef,
    runtimePublicationBundleRef: manifest.runtimePublicationBundleRef,
    designContractPublicationBundleRef: manifest.designContractPublicationBundleRef,
    bindingState,
    surfaceAuthorityState,
    releaseRecoveryDispositionRefs: manifest.releaseRecoveryDispositionRefs,
    routeFreezeDispositionRefs: manifest.routeFreezeDispositionRefs,
    surfaceTupleHash: `tuple::patient-shell::${tupleSuffix}`,
    generatedAt: manifest.generatedAt,
  };
}

export const patientAuthenticatedBinding = bindingFromManifest(
  patientAuthenticatedManifest,
  "live",
  "publishable_live",
  "live",
);
export const patientAppointmentsBinding = bindingFromManifest(
  patientAppointmentsManifest,
  "read_only",
  "read_only",
  "read-only",
);
export const patientRecoveryBinding = bindingFromManifest(
  patientRecoveryManifest,
  "recovery_only",
  "recovery_only",
  "recovery",
);

export const patientLiveReleaseVerdict: ReleaseTrustFreezeVerdictLike = {
  releaseTrustFreezeVerdictId: "RTFV_115_PATIENT_LIVE",
  audienceSurface: "audsurf_patient_authenticated_portal",
  routeFamilyRef: "rf_patient_requests",
  surfaceAuthorityState: "live",
  calmTruthState: "allowed",
  mutationAuthorityState: "enabled",
  blockerRefs: [],
  evaluatedAt: "2026-04-13T18:45:00Z",
};

export const patientAppointmentsReleaseVerdict: ReleaseTrustFreezeVerdictLike = {
  releaseTrustFreezeVerdictId: "RTFV_115_PATIENT_APPOINTMENTS_DIAGNOSTIC",
  audienceSurface: "audsurf_patient_authenticated_portal",
  routeFamilyRef: "rf_patient_appointments",
  surfaceAuthorityState: "diagnostic_only",
  calmTruthState: "suppressed",
  mutationAuthorityState: "observe_only",
  blockerRefs: ["appointment_publication_review_window"],
  evaluatedAt: "2026-04-13T18:45:00Z",
};

export const patientRecoveryReleaseVerdict: ReleaseTrustFreezeVerdictLike = {
  releaseTrustFreezeVerdictId: "RTFV_115_PATIENT_RECOVERY_ONLY",
  audienceSurface: "audsurf_patient_transaction_recovery",
  routeFamilyRef: "rf_patient_secure_link_recovery",
  surfaceAuthorityState: "recovery_only",
  calmTruthState: "suppressed",
  mutationAuthorityState: "governed_recovery",
  blockerRefs: ["secure_link_resume_required"],
  evaluatedAt: "2026-04-13T18:45:00Z",
};

export const patientReadOnlyRecoveryDisposition: ReleaseRecoveryDispositionLike = {
  releaseRecoveryDispositionId: "RRD_115_PATIENT_READ_ONLY",
  posture: "read_only",
  label: "Read-only review",
  summary: "Keep the current appointment summary visible while booking publication proof settles.",
  actionLabel: "Refresh booking proof",
  continuityMode: "refresh_tuple",
  reasonRefs: ["booking_publication_review_pending"],
};

export const patientRecoveryDisposition: ReleaseRecoveryDispositionLike = {
  releaseRecoveryDispositionId: "RRD_115_PATIENT_SECURE_LINK_RECOVERY",
  posture: "recovery_only",
  label: "Secure-link recovery",
  summary: "Stay in the same shell and resume only after the secure link and contact route are repaired.",
  actionLabel: "Resume the secure-link repair",
  continuityMode: "resume_return_contract",
  reasonRefs: ["secure_link_resume_required"],
};

export const patientBlockedFreezeDisposition: RouteFreezeDispositionLike = {
  routeFreezeDispositionId: "RFD_115_PATIENT_RECOVERY_BLOCKED",
  routeFamilyRef: "rf_patient_secure_link_recovery",
  freezeState: "recovery_only",
  sameShellDisposition: "downgrade_recovery_only",
  recoveryActionLabel: "Resume the secure-link repair",
  reasonRefs: ["secure_link_resume_required"],
};

export function defaultPatientShellViewMemory(): PatientShellViewMemory {
  return {
    homeMode: "attention",
    selectedRequestId: patientRequests[0]?.id ?? "REQ-2049",
    selectedAppointmentId: patientAppointments[0]?.id ?? "APT-778",
    selectedRecordId: patientRecords[0]?.id ?? "REC-HEM-8",
    selectedThreadId: patientThreads[0]?.id ?? "THR-420",
  };
}

export function parsePatientShellLocation(pathname: string): PatientShellLocation {
  const trimmed = pathname.trim() || "/home";
  const normalized = trimmed === "/" ? "/home" : trimmed.replace(/\/+$/, "") || "/home";
  const [root = "home", second, third] = normalized.replace(/^\/+/, "").split("/");

  if (root === "requests" && second) {
    return {
      routeKey: "request_detail",
      section: "requests",
      routeFamilyRef: "rf_patient_requests",
      pathname: normalized,
      requestId: second,
      appointmentId: null,
      recordId: null,
      threadId: null,
    };
  }

  if (root === "records" && second && third === "follow-up") {
    return {
      routeKey: "record_follow_up",
      section: "records",
      routeFamilyRef: "rf_patient_health_record",
      pathname: normalized,
      requestId: null,
      appointmentId: null,
      recordId: second,
      threadId: null,
    };
  }

  if (root === "messages" && second === "thread" && third) {
    return {
      routeKey: "message_thread",
      section: "messages",
      routeFamilyRef: "rf_patient_messages",
      pathname: normalized,
      requestId: null,
      appointmentId: null,
      recordId: null,
      threadId: third,
    };
  }

  if (root === "recovery" && second === "secure-link") {
    return {
      routeKey: "recovery",
      section: "messages",
      routeFamilyRef: "rf_patient_secure_link_recovery",
      pathname: normalized,
      requestId: null,
      appointmentId: null,
      recordId: null,
      threadId: null,
    };
  }

  if (root === "home" && second === "embedded") {
    return {
      routeKey: "embedded",
      section: "home",
      routeFamilyRef: "rf_patient_embedded_channel",
      pathname: normalized,
      requestId: null,
      appointmentId: null,
      recordId: null,
      threadId: null,
    };
  }

  switch (root) {
    case "requests":
      return {
        routeKey: "requests",
        section: "requests",
        routeFamilyRef: "rf_patient_requests",
        pathname: "/requests",
        requestId: null,
        appointmentId: null,
        recordId: null,
        threadId: null,
      };
    case "appointments":
      return {
        routeKey: "appointments",
        section: "appointments",
        routeFamilyRef: "rf_patient_appointments",
        pathname: "/appointments",
        requestId: null,
        appointmentId: null,
        recordId: null,
        threadId: null,
      };
    case "records":
      return {
        routeKey: "records",
        section: "records",
        routeFamilyRef: "rf_patient_health_record",
        pathname: "/records",
        requestId: null,
        appointmentId: null,
        recordId: null,
        threadId: null,
      };
    case "messages":
      return {
        routeKey: "messages",
        section: "messages",
        routeFamilyRef: "rf_patient_messages",
        pathname: "/messages",
        requestId: null,
        appointmentId: null,
        recordId: null,
        threadId: null,
      };
    case "home":
    default:
      return {
        routeKey: "home",
        section: "home",
        routeFamilyRef: "rf_patient_home",
        pathname: "/home",
        requestId: null,
        appointmentId: null,
        recordId: null,
        threadId: null,
      };
  }
}

export function formatPatientShellPath(location: PatientShellLocation): string {
  switch (location.routeKey) {
    case "request_detail":
      return `/requests/${location.requestId ?? defaultPatientShellViewMemory().selectedRequestId}`;
    case "record_follow_up":
      return `/records/${location.recordId ?? defaultPatientShellViewMemory().selectedRecordId}/follow-up`;
    case "message_thread":
      return `/messages/thread/${location.threadId ?? defaultPatientShellViewMemory().selectedThreadId}`;
    case "recovery":
      return "/recovery/secure-link";
    case "embedded":
      return "/home/embedded";
    case "requests":
      return "/requests";
    case "appointments":
      return "/appointments";
    case "records":
      return "/records";
    case "messages":
      return "/messages";
    case "home":
    default:
      return "/home";
  }
}

export function selectedAnchorKeyForLocation(
  location: PatientShellLocation,
  homeMode: PatientHomeMode,
): string {
  switch (location.routeKey) {
    case "home":
      return homeMode === "quiet" ? "home-next-step" : "home-spotlight";
    case "embedded":
      return "embedded-capabilities";
    case "requests":
      return "request-needs-attention";
    case "request_detail":
      return "request-lineage";
    case "appointments":
      return "appointments-upcoming";
    case "records":
      return "record-summary";
    case "record_follow_up":
      return "record-follow-up";
    case "messages":
      return "messages-inbox";
    case "message_thread":
      return "messages-thread";
    case "recovery":
      return "messages-recovery";
  }
}

export function runtimeScenarioForLocation(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): RuntimeScenario {
  if (location.routeKey === "appointments") {
    return "read_only";
  }
  if (location.routeKey === "recovery" || location.routeKey === "embedded") {
    return "recovery_only";
  }
  if (
    (location.routeKey === "messages" || location.routeKey === "message_thread") &&
    (location.threadId ?? memory.selectedThreadId) === "THR-399"
  ) {
    return "stale_review";
  }
  return "live";
}

export function continuitySnapshotForLocation(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
  snapshot?: ContinuitySnapshot,
): ContinuitySnapshot {
  const runtimeScenario = runtimeScenarioForLocation(location, memory);
  const anchorKey = selectedAnchorKeyForLocation(location, memory.homeMode);
  const routeFamilyRef = location.routeFamilyRef;
  let nextSnapshot =
    snapshot ??
    createInitialContinuitySnapshot({
      shellSlug: "patient-web",
      routeFamilyRef,
      anchorKey,
      runtimeScenario,
    });
  if (nextSnapshot.activeRouteFamilyRef !== routeFamilyRef) {
    nextSnapshot = {
      ...nextSnapshot,
      ...createInitialContinuitySnapshot({
        shellSlug: "patient-web",
        routeFamilyRef,
        anchorKey,
        runtimeScenario,
      }),
    };
  }
  if (nextSnapshot.selectedAnchor.anchorKey !== anchorKey) {
    nextSnapshot = createInitialContinuitySnapshot({
      shellSlug: "patient-web",
      routeFamilyRef,
      anchorKey,
      runtimeScenario,
    });
  }
  return nextSnapshot;
}

function channelProfileForLocation(location: PatientShellLocation): RouteGuardChannelProfile {
  return location.routeKey === "embedded" ? "embedded" : "browser";
}

function manifestForLocation(
  location: PatientShellLocation,
): FrontendContractManifestRuntime {
  switch (location.routeKey) {
    case "appointments":
      return patientAppointmentsManifest;
    case "embedded":
    case "recovery":
      return patientRecoveryManifest;
    default:
      return patientAuthenticatedManifest;
  }
}

function manifestForGuard(
  manifest: FrontendContractManifestRuntime,
): FrontendContractManifestLike {
  return {
    ...manifest,
    shellType: "patient",
    browserPostureState:
      manifest.browserPostureState === "publishable_live"
        ? "live"
        : manifest.browserPostureState,
  };
}

function bindingForLocation(location: PatientShellLocation): AudienceSurfaceRuntimeBindingLike {
  switch (location.routeKey) {
    case "appointments":
      return patientAppointmentsBinding;
    case "embedded":
    case "recovery":
      return patientRecoveryBinding;
    default:
      return patientAuthenticatedBinding;
  }
}

function releaseVerdictForLocation(
  location: PatientShellLocation,
): ReleaseTrustFreezeVerdictLike {
  switch (location.routeKey) {
    case "appointments":
      return {
        ...patientAppointmentsReleaseVerdict,
        routeFamilyRef: location.routeFamilyRef,
      };
    case "embedded":
    case "recovery":
      return {
        ...patientRecoveryReleaseVerdict,
        routeFamilyRef: location.routeFamilyRef,
      };
    default:
      return {
        ...patientLiveReleaseVerdict,
        routeFamilyRef: location.routeFamilyRef,
      };
  }
}

function releaseRecoveryForLocation(
  location: PatientShellLocation,
): ReleaseRecoveryDispositionLike | null {
  switch (location.routeKey) {
    case "appointments":
      return patientReadOnlyRecoveryDisposition;
    case "embedded":
    case "recovery":
      return patientRecoveryDisposition;
    default:
      return null;
  }
}

function routeFreezeForLocation(
  location: PatientShellLocation,
): RouteFreezeDispositionLike | null {
  return location.routeKey === "recovery" ? patientBlockedFreezeDisposition : null;
}

function selectedRequest(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): PatientRequestProjection {
  return (
    (location.requestId ? requestById.get(location.requestId) : undefined) ??
    requestById.get(memory.selectedRequestId) ??
    patientRequests[0]!
  );
}

function selectedAppointment(
  memory: PatientShellViewMemory,
): PatientAppointmentProjection {
  return appointmentById.get(memory.selectedAppointmentId) ?? patientAppointments[0]!;
}

function selectedRecord(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): PatientRecordProjection {
  return (
    (location.recordId ? recordById.get(location.recordId) : undefined) ??
    recordById.get(memory.selectedRecordId) ??
    patientRecords[0]!
  );
}

function selectedThread(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): PatientThreadProjection {
  return (
    (location.threadId ? threadById.get(location.threadId) : undefined) ??
    threadById.get(memory.selectedThreadId) ??
    patientThreads[0]!
  );
}

function projectionFreshnessEnvelope(
  location: PatientShellLocation,
  decision: RouteGuardDecision,
  snapshot: ContinuitySnapshot,
): ProjectionFreshnessEnvelope {
  const baseTime =
    location.routeKey === "appointments"
      ? "2026-04-13T08:14:00Z"
      : location.routeKey === "recovery" || location.routeKey === "embedded"
        ? "2026-04-13T08:18:00Z"
        : "2026-04-13T08:20:00Z";

  const projectionFreshnessState =
    decision.effectivePosture === "live"
      ? "fresh"
      : decision.effectivePosture === "read_only"
        ? "stale_review"
        : "blocked_recovery";
  const transportState =
    decision.effectivePosture === "live"
      ? "live"
      : decision.effectivePosture === "read_only"
        ? "paused"
        : "disconnected";
  const actionabilityState =
    decision.effectivePosture === "live"
      ? "live"
      : decision.effectivePosture === "read_only"
        ? "frozen"
        : "recovery_only";

  return {
    projectionFreshnessEnvelopeId: `pfe::${location.routeKey}`,
    continuityKey: snapshot.selectedAnchor.continuityFrameRef,
    entityScope: snapshot.selectedAnchor.entityRef,
    surfaceRef: location.routeFamilyRef,
    selectedAnchorRef: snapshot.selectedAnchor.anchorId,
    consistencyClass: "command_following",
    scope: "shell",
    projectionFreshnessState,
    transportState,
    actionabilityState,
    lastProjectionVersionRef: `projection::${location.routeFamilyRef}::2026-04-13`,
    lastCausalTokenApplied: `cause::${location.routeKey}::2026-04-13`,
    lastKnownGoodSnapshotRef: `snapshot::${location.routeKey}::good`,
    lastKnownGoodAt: baseTime,
    staleAfterAt: "2026-04-13T08:35:00Z",
    reasonRefs: decision.reasonRefs.length > 0 ? decision.reasonRefs : ["projection_current"],
    localizedDegradationRefs:
      decision.effectivePosture === "live" ? [] : [`degraded::${location.routeKey}`],
    derivedFromRefs: [decision.manifestRef ?? "manifest::missing", decision.runtimeBindingRef ?? "binding::missing"],
    evaluatedAt: "2026-04-13T08:22:00Z",
  };
}

function statusInputForLocation(
  location: PatientShellLocation,
  decision: RouteGuardDecision,
  snapshot: ContinuitySnapshot,
  memory: PatientShellViewMemory,
): StatusTruthInput {
  const request = selectedRequest(location, memory);
  const appointment = selectedAppointment(memory);
  const thread = selectedThread(location, memory);

  const macroState =
    location.routeKey === "home" && memory.homeMode === "quiet"
      ? "settled"
      : location.routeKey === "appointments"
        ? "awaiting_external"
        : location.routeKey === "recovery" || location.routeKey === "embedded"
          ? "recovery_required"
          : location.routeKey === "messages" || location.routeKey === "message_thread"
            ? thread.state === "reply_needed"
              ? "action_required"
              : thread.state === "awaiting_review"
                ? "reviewing_next_steps"
                : thread.state === "blocked_contact"
                  ? "blocked"
                  : "settled"
            : location.routeKey === "requests" || location.routeKey === "request_detail"
              ? request.state === "reply_needed"
                ? "action_required"
                : request.state === "blocked_repair"
                  ? "blocked"
                  : "in_review"
              : "reviewing_next_steps";

  return {
    audience: "patient",
    authority: {
      authorityId: `ssa::${location.routeFamilyRef}`,
      macroStateRef: macroState,
      bundleVersion: manifestForLocation(location).frontendContractManifestId,
      audienceTier: "patient",
      shellFreshnessEnvelopeRef: `pfe::${location.routeKey}`,
      projectionTrustState:
        decision.effectivePosture === "live"
          ? "trusted"
          : decision.effectivePosture === "read_only"
            ? "degraded"
            : "blocked",
      ownedSignalClasses: ["freshness", "trust", "dominant_action", "recovery"],
      localSignalSuppressionRef:
        location.routeKey === "message_thread" && thread.state === "blocked_contact"
          ? "reply_reassurance_suppressed"
          : "none",
      degradeMode:
        decision.effectivePosture === "live"
          ? "quiet_pending"
          : decision.effectivePosture === "read_only"
            ? "refresh_required"
            : "recovery_required",
    },
    freshnessEnvelope: projectionFreshnessEnvelope(location, decision, snapshot),
    localFeedbackState: "shown",
    processingAcceptanceState:
      location.routeKey === "appointments" ? "awaiting_external_confirmation" : "accepted_for_processing",
    pendingExternalState:
      location.routeKey === "appointments" ? "awaiting_confirmation" : "none",
    authoritativeOutcomeState:
      decision.effectivePosture === "live"
        ? memory.homeMode === "quiet" && location.routeKey === "home"
          ? "settled"
          : "pending"
        : decision.effectivePosture === "read_only"
          ? "review_required"
          : "recovery_required",
    saveState: "saved",
    dominantActionLabel:
      location.routeKey === "home" && memory.homeMode === "quiet"
        ? "Review the calm summary"
        : getPersistentShellRouteClaim(location.routeFamilyRef).dominantActionLabel,
    lastChangedAt:
      location.routeKey === "appointments"
        ? appointment.dateLabel.includes("No slot") ? "2026-04-13T07:34:00Z" : "2026-04-13T08:14:00Z"
        : location.routeKey === "messages" || location.routeKey === "message_thread"
          ? thread.updatedAt
          : request.updatedAt,
    provenanceLabel: "Seeded patient-shell projection",
  };
}

function casePulseForLocation(
  location: PatientShellLocation,
  decision: RouteGuardDecision,
  snapshot: ContinuitySnapshot,
  memory: PatientShellViewMemory,
): CasePulseContract {
  const request = selectedRequest(location, memory);
  const appointment = selectedAppointment(memory);
  const record = selectedRecord(location, memory);
  const thread = selectedThread(location, memory);

  const headline =
    location.routeKey === "home" && memory.homeMode === "quiet"
      ? "Nothing urgent needs you right now"
      : location.routeKey === "appointments"
        ? appointment.title
        : location.routeKey === "records" || location.routeKey === "record_follow_up"
          ? record.title
          : location.routeKey === "messages" || location.routeKey === "message_thread"
            ? thread.subject
            : request.title;
  const subheadline =
    location.routeKey === "home" && memory.homeMode === "quiet"
      ? "The shell stays calm, keeps your current context visible, and offers one gentle next step."
      : location.routeKey === "appointments"
        ? appointment.summary
        : location.routeKey === "records" || location.routeKey === "record_follow_up"
          ? record.detailSummary
          : location.routeKey === "messages" || location.routeKey === "message_thread"
            ? thread.preview
            : request.summary;
  const macroState = statusInputForLocation(location, decision, snapshot, memory).authority.macroStateRef;

  return {
    entityRef: snapshot.selectedAnchor.entityRef,
    entityType: "Patient route",
    audience: "patient",
    macroState,
    headline,
    subheadline,
    primaryNextActionLabel:
      location.routeKey === "home" && memory.homeMode === "quiet"
        ? "Open the latest record summary"
        : getPersistentShellRouteClaim(location.routeFamilyRef).dominantActionLabel,
    ownershipOrActorSummary: "Patient portal continuity stays on the same browser shell.",
    urgencyBand:
      memory.homeMode === "quiet" && location.routeKey === "home"
        ? "Quiet home"
        : decision.effectivePosture === "live"
          ? "Actionable truth"
          : decision.effectivePosture === "read_only"
            ? "Read-only review"
            : "Recovery only",
    confirmationPosture:
      decision.effectivePosture === "live"
        ? "The current summary stays causally honest."
        : "The account keeps the last safe summary visible while status is downgraded in place.",
    lastMeaningfulUpdateAt: statusInputForLocation(location, decision, snapshot, memory).lastChangedAt,
    changedSinceSeen:
      location.routeKey === "record_follow_up"
        ? "Record-origin follow-up remains inside the same shell."
        : location.routeKey === "message_thread"
          ? "Thread continuity and reply posture remain coupled."
          : location.routeKey === "appointments"
            ? "Booking posture remains explicit."
            : "Selected anchor and return target remain visible.",
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: macroState.replaceAll("_", " "),
        detail: "Shell status remains subordinate to the current settled projection.",
      },
      {
        key: "ownership",
        label: "Ownership",
        value: "Patient-led",
        detail: "Utility actions remain secondary to the current route task.",
      },
      {
        key: "trust",
        label: "Trust",
        value:
          decision.effectivePosture === "live"
            ? "Trusted"
            : decision.effectivePosture === "read_only"
              ? "Guarded"
              : "Recovery",
        detail: "Trust status is published from the same account details and never guessed from transport alone.",
      },
      {
        key: "urgency",
        label: "Urgency",
        value:
          location.routeKey === "home" && memory.homeMode === "quiet"
            ? "Low"
            : location.routeKey === "recovery" || location.routeKey === "embedded"
              ? "Repair"
              : "Focused",
        detail: "Only one dominant patient task is promoted at a time.",
      },
      {
        key: "interaction",
        label: "Interaction",
        value: snapshot.selectedAnchor.lastKnownLabel,
        detail: "The selected anchor survives same-shell moves and refresh-safe restoration.",
      },
    ],
  };
}

function cloneSurfacePosture(
  postureId: string,
  overrides: Partial<SurfacePostureContract>,
): SurfacePostureContract {
  const specimen = surfacePostureSpecimens.find((candidate) => candidate.postureId === postureId);
  if (!specimen) {
    throw new Error(`PATIENT_SHELL_POSTURE_SPECIMEN_NOT_FOUND:${postureId}`);
  }
  return {
    ...specimen,
    ...overrides,
    sourceRefs: [...specimen.sourceRefs, "prompt/115.md"],
  };
}

export function createBlockedMessagePosture(
  location: PatientShellLocation,
  snapshot: ContinuitySnapshot,
  memory: PatientShellViewMemory,
  decision: RouteGuardDecision,
): SurfacePostureContract {
  const thread = selectedThread(location, memory);
  return cloneSurfacePosture("patient_calm_degraded", {
    regionLabel: "Messages",
    title: "This thread remains visible, but reply posture is bounded",
    summary: thread.preview,
    selectedAnchor: {
      anchorId: snapshot.selectedAnchor.anchorId,
      label: snapshot.selectedAnchor.lastKnownLabel,
      summary: "The thread anchor remains pinned while the reply lane is suppressed.",
      returnLabel: "Back to the current thread summary",
    },
    statusInput: statusInputForLocation(location, decision, snapshot, memory),
    pulse: casePulseForLocation(location, decision, snapshot, memory),
    dominantQuestion: "What is still safe to understand from this conversation right now?",
    nextSafeActionLabel: "Review the current thread summary",
    liveContentSummary: "The current thread summary and return-safe context remain visible.",
    preservationSummary: "Keep the thread summary, sender, and repair path visible.",
  });
}

export function createRecordArtifactSpecimen(
  location: PatientShellLocation,
  snapshot: ContinuitySnapshot,
  memory: PatientShellViewMemory,
): ArtifactShellSpecimen {
  const record = selectedRecord(location, memory);
  return {
    id: `artifact::${record.id}`,
    title: `${record.title} summary`,
    subtitle:
      "The record stays summary-first and the follow-up path remains return-safe inside the same patient shell.",
    artifactKind: "record_result_summary",
    artifactLabel: record.title,
    summarySections: [
      {
        id: "result-summary",
        title: "What changed",
        body: record.summary,
        emphasis: "Summary-first posture remains authoritative here.",
      },
      {
        id: "follow-up",
        title: "Bounded follow-up",
        body: "Use the same route family to review the result meaning or ask a bounded follow-up question.",
      },
      {
        id: "return-safe",
        title: "Return-safe continuity",
        body: `Return to ${snapshot.selectedAnchor.lastKnownLabel} without losing the record origin.`,
      },
    ],
    previewPages: [
      {
        id: "page-1",
        title: "Record summary",
        lines: [
          record.title,
          record.detailSummary,
          "Trend remains visible through summary and table parity.",
        ],
      },
    ],
    contract: {
      contractId: `artifact-contract::${record.id}`,
      artifactKind: "record_result_summary",
      summaryRequired: true,
      previewPolicy: "inline_preview",
      downloadPolicy: "allowed",
      printPolicy: "blocked",
      handoffPolicy: "grant_required",
      requiredSummaryAuthority: "verified_or_provisional",
      source_refs: [
        "prompt/115.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    binding: {
      bindingId: `artifact-binding::${record.id}`,
      routeFamilyRef: "rf_patient_health_record",
      artifactLabel: record.title,
      selectedAnchorRef: snapshot.selectedAnchor.anchorId,
      selectedAnchorLabel: snapshot.selectedAnchor.lastKnownLabel,
      previewContractRef: `preview::${record.id}`,
      downloadContractRef: `download::${record.id}`,
      printContractRef: `print::${record.id}`,
      handoffContractRef: `handoff::${record.id}`,
      requiredParityStates: ["summary_verified", "summary_provisional"],
      embeddedFallback: "summary_only",
      staleFallback: "summary_only",
      unsupportedFallback: "placeholder_only",
      source_refs: [
        "prompt/115.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    parityDigest: {
      parityDigestId: `artifact-parity::${record.id}`,
      sourceArtifactHash: `src_${record.id.toLowerCase()}`,
      summaryHash: `sum_${record.id.toLowerCase()}`,
      authorityState: "summary_provisional",
      sourceParityState: "summary_provisional",
      parityStatement:
        "The summary and record-origin follow-up stay aligned to the same seeded projection tuple.",
      lastVerifiedAt: "2026-04-13T08:22:00Z",
      verifiedBy: "Patient shell seed projection",
      driftReason: null,
      source_refs: [
        "prompt/115.md",
        "docs/architecture/109_artifact_parity_and_return_safety.md",
      ],
    },
    context: {
      contextId: `artifact-context::${record.id}`,
      shellContinuityKey: snapshot.selectedAnchor.continuityFrameRef,
      routeFamilyRef: "rf_patient_health_record",
      selectedAnchorRef: snapshot.selectedAnchor.anchorId,
      selectedAnchorLabel: snapshot.selectedAnchor.lastKnownLabel,
      returnTargetRef: `return::${record.id}`,
      returnTargetLabel: "Back to the record summary list",
      channelPosture: "standard_browser",
      artifactModeRequest: "governed_preview",
      visibilityCeiling: "full",
      summarySafetyTier: "provisional",
      byteDeliveryPosture: "available",
      currentRouteLineage: "record-summary -> bounded follow-up",
      source_refs: [
        "prompt/115.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    transferSettlement: {
      settlementId: `artifact-settlement::${record.id}`,
      transferKind: "none",
      authoritativeTransferState: "not_started",
      localAckState: "none",
      progressLabel: "No external transfer is currently in progress.",
      lastUpdatedAt: "2026-04-13T08:22:00Z",
      source_refs: [
        "prompt/115.md",
        "docs/architecture/109_artifact_mode_truth_and_handoff_rules.md",
      ],
    },
    fallbackDisposition: {
      fallbackId: `artifact-fallback::${record.id}`,
      fallbackKind: "summary_only",
      trigger: "none",
      title: "Return-safe summary",
      summary:
        "If preview posture drifts, the summary remains in place and the record-origin return target stays visible.",
      recoveryActionLabel: "Return to the record summary",
      source_refs: [
        "prompt/115.md",
        "docs/architecture/109_artifact_presentation_shell.md",
      ],
    },
    grant: {
      grantId: `artifact-grant::${record.id}`,
      routeFamilyRef: "rf_patient_health_record",
      continuityKey: snapshot.selectedAnchor.continuityFrameRef,
      selectedAnchorRef: snapshot.selectedAnchor.anchorId,
      returnTargetRef: `return::${record.id}`,
      destinationLabel: "Governed browser handoff",
      destinationType: "browser",
      state: "active",
      expiresAt: null,
      scrubbedDestination: `browser://${record.id.toLowerCase()}`,
      reason:
        "The preview remains scoped to the same patient record route family and return target.",
      source_refs: [
        "prompt/115.md",
        "docs/architecture/109_artifact_mode_truth_and_handoff_rules.md",
      ],
    },
  };
}

export function resolvePatientShellView(input: {
  location: PatientShellLocation;
  memory: PatientShellViewMemory;
  continuitySnapshot: ContinuitySnapshot;
}): PatientShellRouteView {
  const manifest = manifestForLocation(input.location);
  const runtimeBinding = bindingForLocation(input.location);
  const guardDecision = resolveRouteGuardDecision({
    routeFamilyRef: input.location.routeFamilyRef,
    manifest: manifestForGuard(manifest),
    runtimeBinding,
    audienceContext: {
      channelProfile: channelProfileForLocation(input.location),
      embeddedCapabilities:
        input.location.routeKey === "embedded" ? (["secure_storage"] as const) : [],
    },
    releaseVerdict: releaseVerdictForLocation(input.location),
    routeFreezeDisposition: routeFreezeForLocation(input.location) ?? undefined,
    releaseRecoveryDisposition: releaseRecoveryForLocation(input.location) ?? undefined,
  });

  const mutationAction = resolveActionGuardDecision({
    decision: guardDecision,
    capabilityId: `${input.location.routeFamilyRef}::mutation_command`,
  });
  const liveUpdateAction = resolveActionGuardDecision({
    decision: guardDecision,
    capabilityId: `${input.location.routeFamilyRef}::live_update_channel`,
  });

  const routeClaim = getPersistentShellRouteClaim(input.location.routeFamilyRef);
  const manifestVerdict = validateFrontendContractManifest(manifest, {
    routeFamilyRef: input.location.routeFamilyRef,
    expectPublishableLive: false,
  });
  const statusInput = statusInputForLocation(
    input.location,
    guardDecision,
    input.continuitySnapshot,
    input.memory,
  );
  const casePulse = casePulseForLocation(
    input.location,
    guardDecision,
    input.continuitySnapshot,
    input.memory,
  );
  const artifactSpecimen =
    input.location.routeKey === "record_follow_up"
      ? createRecordArtifactSpecimen(
          input.location,
          input.continuitySnapshot,
          input.memory,
        )
      : null;
  const thread = selectedThread(input.location, input.memory);
  const messagePosture =
    (input.location.routeKey === "messages" || input.location.routeKey === "message_thread") &&
    thread.state === "blocked_contact"
      ? createBlockedMessagePosture(
          input.location,
          input.continuitySnapshot,
          input.memory,
          guardDecision,
        )
      : null;

  return {
    location: input.location,
    routeClaim,
    manifest,
    manifestVerdict,
    runtimeBinding,
    guardDecision,
    mutationAction,
    liveUpdateAction,
    statusInput,
    casePulse,
    selectedAnchorKey: selectedAnchorKeyForLocation(input.location, input.memory.homeMode),
    trustCues:
      input.location.routeKey === "appointments"
        ? patientAppointments.map((appointment) => appointment.trustCue)
        : input.location.routeKey === "records" || input.location.routeKey === "record_follow_up"
          ? patientRecords.map((record) => record.trustCue)
          : input.location.routeKey === "messages" || input.location.routeKey === "message_thread"
            ? patientThreads.map((message) => message.trustCue)
            : patientRequests.map((request) => request.trustCue),
    attentionLabel:
      input.location.routeKey === "home" && input.memory.homeMode === "quiet"
        ? "Quiet home"
        : "Attention needed",
    artifactSpecimen,
    messagePosture,
  };
}

export function navPathForSection(section: PatientPrimarySection): string {
  switch (section) {
    case "home":
      return "/home";
    case "requests":
      return "/requests";
    case "appointments":
      return "/appointments";
    case "records":
      return "/records";
    case "messages":
      return "/messages";
  }
}

export function isMutationAllowed(view: PatientShellRouteView): boolean {
  return view.mutationAction.state === "enabled";
}

export function resolveHomeSpotlightRequest(): PatientRequestProjection {
  return patientRequests[0]!;
}

export function resolveQuietHomeNextRecord(): PatientRecordProjection {
  return patientRecords[0]!;
}

export function resolveSelectedRequestForLocation(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): PatientRequestProjection {
  return selectedRequest(location, memory);
}

export function resolveSelectedAppointmentForLocation(
  memory: PatientShellViewMemory,
): PatientAppointmentProjection {
  return selectedAppointment(memory);
}

export function resolveSelectedRecordForLocation(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): PatientRecordProjection {
  return selectedRecord(location, memory);
}

export function resolveSelectedThreadForLocation(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): PatientThreadProjection {
  return selectedThread(location, memory);
}

export const patientShellProjectionExamples = [
  {
    exampleId: "HOME_ATTENTION",
    routeKey: "home",
    path: "/home",
    posture: "live",
    summary: "Attention-needed home with one dominant request task.",
  },
  {
    exampleId: "HOME_QUIET",
    routeKey: "home",
    path: "/home",
    posture: "live",
    summary: "Quiet-home state with one gentle next step.",
  },
  {
    exampleId: "REQUEST_DETAIL",
    routeKey: "request_detail",
    path: "/requests/REQ-2049",
    posture: "live",
    summary: "Same-shell request detail preserves the selected request anchor.",
  },
  {
    exampleId: "APPOINTMENTS_READ_ONLY",
    routeKey: "appointments",
    path: "/appointments",
    posture: "read_only",
    summary: "Appointment itinerary remains truthful and read-only while booking publication drifts.",
  },
  {
    exampleId: "RECORD_FOLLOW_UP",
    routeKey: "record_follow_up",
    path: "/records/REC-HEM-8/follow-up",
    posture: "live",
    summary: "Record-origin follow-up stays summary-first and return-safe.",
  },
  {
    exampleId: "MESSAGE_THREAD",
    routeKey: "message_thread",
    path: "/messages/thread/THR-420",
    posture: "live",
    summary: "Message thread continuity stays inside the same shell.",
  },
  {
    exampleId: "MESSAGE_BLOCKED_CONTACT",
    routeKey: "message_thread",
    path: "/messages/thread/THR-399",
    posture: "stale_review",
    summary: "Blocked contact-route thread keeps calm degraded posture without overclaiming reply readiness.",
  },
  {
    exampleId: "RECOVERY_ROUTE",
    routeKey: "recovery",
    path: "/recovery/secure-link",
    posture: "recovery_only",
    summary: "Bounded secure-link recovery remains inside the same shell.",
  },
  {
    exampleId: "EMBEDDED_ROUTE",
    routeKey: "embedded",
    path: "/home/embedded",
    posture: "recovery_only",
    summary: "Embedded posture fails closed in place when the required host capabilities are missing.",
  },
] as const;

export const patientShellGalleryRequirements = [
  "five authenticated primary sections",
  "same-shell request detail continuity",
  "read-only appointment truth",
  "record-origin follow-up with artifact summary-first behavior",
  "message thread continuity with blocked contact posture",
  "bounded recovery and embedded fallback",
  "selected-anchor persistence, DOM markers, and PHI-safe telemetry",
] as const;
