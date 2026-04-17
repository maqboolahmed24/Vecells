import {
  getPersistentShellRouteClaim,
  navigateWithinShell,
  resolveInitialContinuitySnapshot,
  restoreSnapshotFromRefresh,
  selectAnchorInSnapshot,
  type ContinuitySnapshot,
  type RuntimeScenario,
} from "@vecells/persistent-shell";
import {
  buildProgressiveFlowView,
  createDefaultStructuredAnswers,
  getRequestTypeCards,
  projectActiveQuestionSummary,
  projectNarrativeAnswer,
  type PendingRequestTypeChange,
  type ProgressiveCompatibilityMode,
  type ProgressiveDeltaNoticeMemory,
  type ProgressiveSupersededAnswerRecord,
} from "./patient-intake-progressive-flow";
import {
  activeAttachmentCount,
  activeAttachmentRefs,
  normalizeIntakeAttachmentCards,
  type AttachmentUiState,
  type IntakeAttachmentCard,
} from "./patient-intake-attachment-lane";
import {
  buildConfirmationCopyPreview,
  buildContactSummaryChip,
  buildContactSummaryView,
  createDefaultDraftContactPreferences,
  normalizeDraftContactPreferences,
  type ContactConfirmationCopyModel,
  type ContactSummaryView,
  type DraftContactPreferencesView,
} from "./patient-intake-contact-preferences";
import {
  buildUrgentOutcomeSurface,
  createDefaultUrgentOutcomeSimulation,
  normalizeUrgentOutcomeSimulation,
  type UrgentOutcomeSimulationState,
  type UrgentOutcomeSurfaceView,
} from "./patient-intake-urgent-outcome";
import {
  buildReceiptSurface,
  createDefaultReceiptSimulation,
  normalizeReceiptSimulation,
  type ReceiptSimulationState,
  type ReceiptSurfaceView,
} from "./patient-intake-receipt-surface";
import {
  buildRequestStatusSurface,
  createDefaultRequestStatusSimulation,
  normalizeRequestStatusSimulation,
  type RequestStatusSimulationState,
  type RequestStatusSurfaceView,
} from "./patient-intake-request-status-surface";
import {
  ACCESS_GRANT_SCOPE_ENVELOPE_REF,
  ACCESS_GRANT_SUPERSESSION_RECORD_REF,
  GAP_RESOLVED_ACCESS_POSTURE_COPY_REBIND_V1,
  GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1,
  GAP_RESOLVED_ACCESS_POSTURE_COPY_STALE_PROMOTION_V1,
  PATIENT_ACTION_RECOVERY_ENVELOPE_REF,
  PATIENT_ACTION_RECOVERY_PROJECTION_REF,
  PATIENT_DEGRADED_MODE_PROJECTION_REF,
  PATIENT_EMBEDDED_SESSION_PROJECTION_REF,
  PATIENT_IDENTITY_HOLD_PROJECTION_REF,
  PATIENT_NAV_RETURN_CONTRACT_REF,
  PATIENT_SHELL_CONSISTENCY_PROJECTION_REF,
  RECOVERY_CONTINUATION_TOKEN_REF,
  buildPatientAccessSurface,
  createDefaultPatientAccessSimulation,
  normalizePatientAccessSimulation,
  type PatientAccessScenarioId,
  type PatientAccessSimulationState,
  type PatientAccessSurfaceInput,
  type PatientAccessSurfaceView,
} from "./patient-intake-access-postures";

export const PATIENT_INTAKE_MISSION_FRAME_TASK_ID = "par_155";
export const PATIENT_INTAKE_MISSION_FRAME_VISUAL_MODE = "Quiet_Clarity_Mission_Frame";
export const PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY = "patient.portal.requests";
export const PATIENT_INTAKE_ROUTE_FAMILY_REF = "rf_intake_self_service";
export const PATIENT_INTAKE_ENTRY_ALIAS = "/start-request";
export const PATIENT_INTAKE_CONTRACT_ENTRY = "/intake/start";
export const DEFAULT_DRAFT_PUBLIC_ID = "dft_7k49m2v8pq41";
export const DEFAULT_REQUEST_PUBLIC_ID = "req_qc_2049";

export type IntakeMissionFrameRouteKey =
  | "landing"
  | "request_type"
  | "details"
  | "supporting_files"
  | "contact_preferences"
  | "review_submit"
  | "resume_recovery"
  | "urgent_outcome"
  | "receipt_outcome"
  | "request_status";

export type IntakeRouteAliasSource = "start_request_alias" | "seq_139_contract";
export type IntakeShellPosture = "live" | "recovery_only" | "outcome_authoritative";
export type IntakeSummaryMode = "panel" | "drawer" | "sheet";
export type IntakeSavePresentation = "draft_not_started" | "saving_local" | "saved_authoritative";
export type IntakeRequestType = "Symptoms" | "Meds" | "Admin" | "Results";
export type DraftStepKey = IntakeMissionFrameRouteKey;
export type DraftQuietStatusState =
  | "draft_not_started"
  | "saving_local"
  | "saved_authoritative"
  | "submitting_authoritative"
  | "resume_safely"
  | "outcome_authoritative"
  | "status_authoritative";
export type DraftMutatingResumeState =
  | "allowed"
  | "read_only"
  | "claim_pending"
  | "rebind_required"
  | "identity_hold"
  | "embedded_recovery";

export interface IntakeDraftView {
  draftPublicId: string;
  ingressChannel: "self_service_form";
  surfaceChannelProfile: "browser";
  intakeConvergenceContractRef: "ICC_139_PHASE1_SELF_SERVICE_V1";
  identityContext: {
    bindingState: "anonymous" | "verified" | "held";
    subjectRefPresence: "none" | "patient_subject_ref";
    claimResumeState: "granted" | "pending" | "narrowed" | "rebind_required";
    actorBindingState: "anonymous" | "verified" | "held";
  };
  requestType: IntakeRequestType;
  structuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  contactPreferences: DraftContactPreferencesView;
  channelCapabilityCeiling: {
    canUploadFiles: boolean;
    canRenderTrackStatus: boolean;
    canRenderEmbedded: boolean;
    mutatingResumeState: DraftMutatingResumeState;
  };
  draftVersion: number;
  lastSavedAt: string;
  resumeToken: string;
  uiJourneyState: {
    currentStepKey: DraftStepKey;
    completedStepKeys: readonly DraftStepKey[];
    currentPathname: string;
    quietStatusState: DraftQuietStatusState;
    sameShellRecoveryState: "stable" | "recovery_only";
    shellContinuityKey: typeof PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY;
    selectedAnchorKey: string;
  };
  draftSchemaVersion: "INTAKE_DRAFT_VIEW_V1";
}

export interface DraftResumeTokenState {
  draftPublicId: string;
  resumeToken: string;
  continuityState: "recovery_only";
  activeLeaseRef: string;
  resumeBlockedReasonCodes: readonly string[];
  mutatingResumeState: DraftMutatingResumeState;
  sameShellRecoveryRouteRef: string;
}

export interface DraftContinuityEvidenceProjection {
  projectionId: string;
  envelopeRef: string;
  draftPublicId: string;
  accessGrantRef: string;
  activeLeaseRef: string | null;
  continuityState: "recovery_only";
  quietStatusState: "resume_safely";
  sameShellRecoveryState: "recovery_only";
  lastSavedAt: string;
  authoritativeDraftVersion: number;
  latestMutationRef: string | null;
  latestSettlementRef: string;
  latestMergePlanRef: string | null;
  latestRecoveryRecordRef: string;
  resumeBlockedReasonCodes: readonly string[];
  requestType: IntakeRequestType;
  structuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  contactPreferences: DraftContactPreferencesView;
  identityContext: IntakeDraftView["identityContext"];
  channelCapabilityCeiling: IntakeDraftView["channelCapabilityCeiling"];
  surfaceChannelProfile: "browser";
  ingressChannel: "self_service_form";
  intakeConvergenceContractRef: "ICC_139_PHASE1_SELF_SERVICE_V1";
  resumeToken: string;
  currentStepKey: "resume_recovery";
  completedStepKeys: readonly DraftStepKey[];
  currentPathname: string;
  shellContinuityKey: typeof PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY;
  selectedAnchorKey: string;
}

export interface DraftRouteEntryResolution {
  resolutionSchemaVersion: "PHASE1_PROMOTED_DRAFT_RESOLUTION_V1";
  draftPublicId: string;
  entryAuthorityState: "recovery_only";
  targetIntent: "resume_recovery";
  targetStepKey: "review_submit";
  targetPathname: string;
  routeFamilyRef: typeof PATIENT_INTAKE_ROUTE_FAMILY_REF;
  requestPublicId: string | null;
  promotedRequestRef: string | null;
  receiptConsistencyKey: string | null;
  statusConsistencyKey: string | null;
  proofState: "grant_superseded_same_lineage";
  mutatingResumeState: DraftMutatingResumeState;
  reasonCodes: readonly string[];
  continuityProjection: DraftContinuityEvidenceProjection;
  recoveryRecord: null;
  lease: null;
  events: readonly unknown[];
}

export interface IntakeMissionFrameLocation {
  routeKey: IntakeMissionFrameRouteKey;
  pathname: string;
  draftPublicId: string | null;
  requestPublicId: string | null;
  stepKey: DraftStepKey;
  aliasSource: IntakeRouteAliasSource;
  routeFamilyRef: typeof PATIENT_INTAKE_ROUTE_FAMILY_REF;
  continuityKey: typeof PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY;
}

export interface MissionFrameLayoutContract {
  shellId: "Quiet_Clarity_Mission_Frame";
  canvasMaxWidthPx: number;
  mastheadHeightPx: number;
  quietStatusStripHeightPx: number;
  progressRailWidthPx: number;
  questionCanvasMaxWidthPx: number;
  questionCanvasReadingMeasureCh: [number, number];
  summaryPanelWidthPx: number;
  mobileStickyTrayHeightPx: number;
  verticalRhythmPx: {
    default: number;
    compact: number;
  };
}

export interface IntakeRequestTypeCard {
  requestType: IntakeRequestType;
  title: string;
  bestFor: string;
  description: string;
  cue: string;
}

export interface IntakeMissionFrameMemory {
  draftPublicId: string;
  phase1Integration: Phase1IntegratedMemoryState | null;
  requestType: IntakeRequestType;
  detailNarrative: string;
  supportingFocus: string;
  structuredAnswers: Record<string, unknown>;
  supersededAnswers: readonly ProgressiveSupersededAnswerRecord[];
  detailsCursorQuestionKey: string | null;
  pendingRequestTypeChange: PendingRequestTypeChange | null;
  bundleCompatibilityMode: ProgressiveCompatibilityMode;
  bundleCompatibilityScenarioId: string | null;
  helperQuestionKey: string | null;
  deltaNotice: ProgressiveDeltaNoticeMemory | null;
  attachments: readonly IntakeAttachmentCard[];
  contactPreferences: DraftContactPreferencesView;
  contactPreferencesBaseline: DraftContactPreferencesView;
  outcomeSimulation: UrgentOutcomeSimulationState;
  receiptSimulation: ReceiptSimulationState;
  requestStatusSimulation: RequestStatusSimulationState;
  accessSimulation: PatientAccessSimulationState;
  draftVersion: number;
  lastSavedAt: string;
  completedStepKeys: readonly DraftStepKey[];
  savePresentation: IntakeSavePresentation;
  summaryPeekOpen: boolean;
  reviewAffirmed: boolean;
}

export interface Phase1IntegratedMemoryState {
  enabled: boolean;
  contractRef: "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1";
  draftPublicId: string;
  leaseId: string;
  resumeToken: string;
  draftVersion: number;
  requestPublicId: string | null;
  requestRef: string | null;
  latestSettlementRef: string | null;
  latestDecisionClass: string | null;
  latestNotificationPosture: string | null;
  routeMetadata: {
    routeFamilyRef: string;
    lineageKey: string;
    shellContinuityKey: string;
    writablePosture: string;
    selectedAnchor: string;
    surfaceState: string;
    authoritativeProjectionTupleRefs: readonly string[];
    audienceSurfaceRuntimeBindingRef: string;
    contractRef: string;
  } | null;
}

export interface IntakeRouteStepDescriptor {
  routeKey: IntakeMissionFrameRouteKey;
  stepKey: DraftStepKey;
  railLabel: string;
  eyebrow: string;
  title: string;
  helper: string;
  dominantActionLabel: string;
  secondaryActionLabel: string | null;
  selectedAnchorKey: string;
  surfaceRouteContractRef: string;
  contractPathPattern: string;
  implementedPathPattern: string;
  shellPosture: IntakeShellPosture;
  quietStatusState: DraftQuietStatusState;
  summaryMode: IntakeSummaryMode;
}

export interface IntakeMissionFrameView {
  location: IntakeMissionFrameLocation;
  routeClaim: ReturnType<typeof getPersistentShellRouteClaim>;
  shellPosture: IntakeShellPosture;
  runtimeScenario: RuntimeScenario;
  routeStep: IntakeRouteStepDescriptor;
  routeSteps: readonly IntakeRouteStepDescriptor[];
  draftView: IntakeDraftView | null;
  requestPublicId: string;
  requestTypeCards: readonly IntakeRequestTypeCard[];
  summaryChips: readonly { label: string; value: string }[];
  contactSummaryView: ContactSummaryView;
  contactConfirmationPreview: ContactConfirmationCopyModel;
  accessPosture: PatientAccessSurfaceView | null;
  urgentSurface: UrgentOutcomeSurfaceView | null;
  receiptSurface: ReceiptSurfaceView | null;
  requestStatusSurface: RequestStatusSurfaceView | null;
  provenanceNote: string;
  urgentEscapeLabel: string;
  resumeTokenState: DraftResumeTokenState | null;
  routeResolution: DraftRouteEntryResolution | null;
}

export const missionFrameLayoutContract: MissionFrameLayoutContract = {
  shellId: "Quiet_Clarity_Mission_Frame",
  canvasMaxWidthPx: 1480,
  mastheadHeightPx: 72,
  quietStatusStripHeightPx: 36,
  progressRailWidthPx: 112,
  questionCanvasMaxWidthPx: 720,
  questionCanvasReadingMeasureCh: [36, 56],
  summaryPanelWidthPx: 332,
  mobileStickyTrayHeightPx: 88,
  verticalRhythmPx: {
    default: 24,
    compact: 16,
  },
};

export const requestTypeCards: readonly IntakeRequestTypeCard[] = getRequestTypeCards();

export const routeStepDescriptors: readonly IntakeRouteStepDescriptor[] = [
  {
    routeKey: "landing",
    stepKey: "landing",
    railLabel: "Begin",
    eyebrow: "Quiet clarity intake",
    title: "Start one calm request thread",
    helper:
      "This mission frame keeps the same shell, status strip, and continuity anchor from the first question through review, urgent guidance, and receipt.",
    dominantActionLabel: "Start request",
    secondaryActionLabel: "When to use urgent help",
    selectedAnchorKey: "request-start",
    surfaceRouteContractRef: "ISRC_139_INTAKE_LANDING_V1",
    contractPathPattern: "/intake/start",
    implementedPathPattern: "/start-request",
    shellPosture: "live",
    quietStatusState: "draft_not_started",
    summaryMode: "panel",
  },
  {
    routeKey: "request_type",
    stepKey: "request_type",
    railLabel: "Type",
    eyebrow: "Question one",
    title: "What kind of help do you need today?",
    helper:
      "Choose the one route that best matches the main thing you need reviewed. The rest of the shell stays calm and unchanged.",
    dominantActionLabel: "Continue",
    secondaryActionLabel: "Back",
    selectedAnchorKey: "request-start",
    surfaceRouteContractRef: "ISRC_139_INTAKE_REQUEST_TYPE_V1",
    contractPathPattern: "/intake/drafts/:draftPublicId/request-type",
    implementedPathPattern: "/start-request/:draftPublicId/request-type",
    shellPosture: "live",
    quietStatusState: "saved_authoritative",
    summaryMode: "panel",
  },
  {
    routeKey: "details",
    stepKey: "details",
    railLabel: "Detail",
    eyebrow: "Question two",
    title: "Tell us the part we need to act on now",
    helper:
      "One bounded answer area keeps the current question, local validation, and recap chips in one reading measure.",
    dominantActionLabel: "Save and continue",
    secondaryActionLabel: "Back",
    selectedAnchorKey: "request-proof",
    surfaceRouteContractRef: "ISRC_139_INTAKE_DETAILS_V1",
    contractPathPattern: "/intake/drafts/:draftPublicId/details",
    implementedPathPattern: "/start-request/:draftPublicId/details",
    shellPosture: "live",
    quietStatusState: "saved_authoritative",
    summaryMode: "panel",
  },
  {
    routeKey: "supporting_files",
    stepKey: "supporting_files",
    railLabel: "Files",
    eyebrow: "Evidence lane",
    title: "Add supporting files if they help",
    helper:
      "Uploads stay in the same question canvas as a subordinate evidence lane. Scan and preview posture stays local instead of taking over the page.",
    dominantActionLabel: "Continue",
    secondaryActionLabel: "Back",
    selectedAnchorKey: "request-proof",
    surfaceRouteContractRef: "ISRC_139_INTAKE_SUPPORTING_FILES_V1",
    contractPathPattern: "/intake/drafts/:draftPublicId/supporting-files",
    implementedPathPattern: "/start-request/:draftPublicId/files",
    shellPosture: "live",
    quietStatusState: "saved_authoritative",
    summaryMode: "drawer",
  },
  {
    routeKey: "contact_preferences",
    stepKey: "contact_preferences",
    railLabel: "Contact",
    eyebrow: "Contact route",
    title: "How should we contact you about this request?",
    helper:
      "Preferences stay distinct from verified route truth. The shell only promises what the captured preference can legitimately mean now.",
    dominantActionLabel: "Review your request",
    secondaryActionLabel: "Back",
    selectedAnchorKey: "request-return",
    surfaceRouteContractRef: "ISRC_139_INTAKE_CONTACT_PREFERENCES_V1",
    contractPathPattern: "/intake/drafts/:draftPublicId/contact-preferences",
    implementedPathPattern: "/start-request/:draftPublicId/contact",
    shellPosture: "live",
    quietStatusState: "saved_authoritative",
    summaryMode: "drawer",
  },
  {
    routeKey: "review_submit",
    stepKey: "review_submit",
    railLabel: "Review",
    eyebrow: "Submit moment",
    title: "Review the parts that will travel with this request",
    helper:
      "The same shell now shows recap sections, one consequence panel, and one dominant submit action. Outcome routes morph in place instead of leaving the frame.",
    dominantActionLabel: "Submit request",
    secondaryActionLabel: "Back",
    selectedAnchorKey: "request-return",
    surfaceRouteContractRef: "ISRC_139_INTAKE_REVIEW_SUBMIT_V1",
    contractPathPattern: "/intake/drafts/:draftPublicId/review",
    implementedPathPattern: "/start-request/:draftPublicId/review",
    shellPosture: "live",
    quietStatusState: "submitting_authoritative",
    summaryMode: "drawer",
  },
  {
    routeKey: "resume_recovery",
    stepKey: "resume_recovery",
    railLabel: "Resume",
    eyebrow: "Bounded recovery",
    title: "Resume this request safely",
    helper:
      "Recovery holds the same shell, the same draft lineage, and one lawful return path. It never turns into a detached expired-link page.",
    dominantActionLabel: "Resume safely",
    secondaryActionLabel: "Return to review",
    selectedAnchorKey: "request-return",
    surfaceRouteContractRef: "ISRC_139_INTAKE_RESUME_RECOVERY_V1",
    contractPathPattern: "/intake/drafts/:draftPublicId/recovery?resumeToken=:resumeToken",
    implementedPathPattern: "/start-request/:draftPublicId/recovery",
    shellPosture: "recovery_only",
    quietStatusState: "resume_safely",
    summaryMode: "sheet",
  },
  {
    routeKey: "urgent_outcome",
    stepKey: "urgent_outcome",
    railLabel: "Urgent",
    eyebrow: "Urgent pathway",
    title: "Urgent guidance replaces routine completion",
    helper:
      "Urgent required, urgent issued, and failed-safe recovery each stay source-traceable and same-shell. The canvas changes posture without losing lineage continuity.",
    dominantActionLabel: "Urgent action",
    secondaryActionLabel: null,
    selectedAnchorKey: "request-return",
    surfaceRouteContractRef: "ISRC_139_INTAKE_URGENT_OUTCOME_V1",
    contractPathPattern: "/intake/requests/:requestPublicId/urgent-guidance",
    implementedPathPattern: "/start-request/:draftPublicId/urgent-guidance",
    shellPosture: "outcome_authoritative",
    quietStatusState: "outcome_authoritative",
    summaryMode: "sheet",
  },
  {
    routeKey: "receipt_outcome",
    stepKey: "receipt_outcome",
    railLabel: "Receipt",
    eyebrow: "Routine receipt",
    title: "The shell now shows the routine receipt",
    helper:
      "The calm receipt keeps the same shell, reference, ETA bucket, promise note, contact summary, and track-request handoff instead of using a detached success page.",
    dominantActionLabel: "Track request status",
    secondaryActionLabel: "Back to review",
    selectedAnchorKey: "request-return",
    surfaceRouteContractRef: "ISRC_139_INTAKE_RECEIPT_OUTCOME_V1",
    contractPathPattern: "/intake/requests/:requestPublicId/receipt",
    implementedPathPattern: "/start-request/:draftPublicId/receipt",
    shellPosture: "outcome_authoritative",
    quietStatusState: "outcome_authoritative",
    summaryMode: "sheet",
  },
  {
    routeKey: "request_status",
    stepKey: "request_status",
    railLabel: "Status",
    eyebrow: "Track request",
    title: "Track this request in the same shell",
    helper:
      "Status stays quiet and summary-first: one current state, one next-step message, one compact timeline, and no raw queue telemetry.",
    dominantActionLabel: "Track request",
    secondaryActionLabel: "Back to receipt",
    selectedAnchorKey: "request-return",
    surfaceRouteContractRef: "ISRC_139_INTAKE_REQUEST_STATUS_V1",
    contractPathPattern: "/intake/requests/:requestPublicId/status",
    implementedPathPattern: "/start-request/:draftPublicId/status",
    shellPosture: "outcome_authoritative",
    quietStatusState: "status_authoritative",
    summaryMode: "sheet",
  },
] as const;

export const missionFrameGalleryRequirements = [
  "desktop, tablet, and mobile mission-frame layout proofs",
  "same-shell route alias map for /start-request and /intake contracts",
  "shell anatomy diagram with table parity",
  "journey diagram with table parity",
  "quiet status strip singularity proof",
  "summary peek panel, drawer, and sheet parity",
  "urgent and receipt same-shell outcome proof",
] as const;

function routeStepFor(key: IntakeMissionFrameRouteKey): IntakeRouteStepDescriptor {
  return (
    routeStepDescriptors.find((descriptor) => descriptor.routeKey === key) ??
    routeStepDescriptors[0]!
  );
}

export function isPatientIntakeMissionFramePath(pathname: string): boolean {
  return (
    pathname === PATIENT_INTAKE_ENTRY_ALIAS ||
    pathname.startsWith(`${PATIENT_INTAKE_ENTRY_ALIAS}/`) ||
    pathname === PATIENT_INTAKE_CONTRACT_ENTRY ||
    pathname.startsWith("/intake/")
  );
}

function routeFromAliasSegment(segment: string): IntakeMissionFrameRouteKey | null {
  switch (segment) {
    case "request-type":
      return "request_type";
    case "details":
      return "details";
    case "files":
      return "supporting_files";
    case "contact":
      return "contact_preferences";
    case "review":
      return "review_submit";
    case "recovery":
      return "resume_recovery";
    case "urgent-guidance":
      return "urgent_outcome";
    case "receipt":
      return "receipt_outcome";
    case "status":
      return "request_status";
    default:
      return null;
  }
}

function routeFromContractSegment(segment: string): IntakeMissionFrameRouteKey | null {
  switch (segment) {
    case "request-type":
      return "request_type";
    case "details":
      return "details";
    case "supporting-files":
      return "supporting_files";
    case "contact-preferences":
      return "contact_preferences";
    case "review":
      return "review_submit";
    case "recovery":
      return "resume_recovery";
    case "urgent-guidance":
      return "urgent_outcome";
    case "receipt":
      return "receipt_outcome";
    case "status":
      return "request_status";
    default:
      return null;
  }
}

export function parsePatientIntakeMissionLocation(pathname: string): IntakeMissionFrameLocation {
  const cleanPathname = pathname.replace(/\/+$/, "") || "/";
  if (
    cleanPathname === PATIENT_INTAKE_ENTRY_ALIAS ||
    cleanPathname === PATIENT_INTAKE_CONTRACT_ENTRY
  ) {
    return {
      routeKey: "landing",
      pathname: cleanPathname,
      draftPublicId: null,
      requestPublicId: null,
      stepKey: "landing",
      aliasSource:
        cleanPathname === PATIENT_INTAKE_ENTRY_ALIAS ? "start_request_alias" : "seq_139_contract",
      routeFamilyRef: PATIENT_INTAKE_ROUTE_FAMILY_REF,
      continuityKey: PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY,
    };
  }

  const startAliasMatch = cleanPathname.match(/^\/start-request\/([^/]+)\/([^/?#]+)$/);
  if (startAliasMatch) {
    const draftPublicId = startAliasMatch[1] ?? DEFAULT_DRAFT_PUBLIC_ID;
    const segment = startAliasMatch[2] ?? "request-type";
    const routeKey = routeFromAliasSegment(segment) ?? "request_type";
    return {
      routeKey,
      pathname: cleanPathname,
      draftPublicId,
      requestPublicId:
        routeKey === "urgent_outcome" ||
        routeKey === "receipt_outcome" ||
        routeKey === "request_status"
          ? requestPublicIdForDraft(draftPublicId)
          : null,
      stepKey: routeStepFor(routeKey).stepKey,
      aliasSource: "start_request_alias",
      routeFamilyRef: PATIENT_INTAKE_ROUTE_FAMILY_REF,
      continuityKey: PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY,
    };
  }

  const contractDraftMatch = cleanPathname.match(/^\/intake\/drafts\/([^/]+)\/([^/?#]+)$/);
  if (contractDraftMatch) {
    const draftPublicId = contractDraftMatch[1] ?? DEFAULT_DRAFT_PUBLIC_ID;
    const segment = contractDraftMatch[2] ?? "request-type";
    const routeKey = routeFromContractSegment(segment) ?? "request_type";
    return {
      routeKey,
      pathname: cleanPathname,
      draftPublicId,
      requestPublicId: null,
      stepKey: routeStepFor(routeKey).stepKey,
      aliasSource: "seq_139_contract",
      routeFamilyRef: PATIENT_INTAKE_ROUTE_FAMILY_REF,
      continuityKey: PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY,
    };
  }

  const contractOutcomeMatch = cleanPathname.match(/^\/intake\/requests\/([^/]+)\/([^/?#]+)$/);
  if (contractOutcomeMatch) {
    const requestPublicId = contractOutcomeMatch[1] ?? DEFAULT_REQUEST_PUBLIC_ID;
    const segment = contractOutcomeMatch[2] ?? "receipt";
    const routeKey = routeFromContractSegment(segment) ?? "receipt_outcome";
    return {
      routeKey,
      pathname: cleanPathname,
      draftPublicId: draftPublicIdForRequest(requestPublicId),
      requestPublicId,
      stepKey: routeStepFor(routeKey).stepKey,
      aliasSource: "seq_139_contract",
      routeFamilyRef: PATIENT_INTAKE_ROUTE_FAMILY_REF,
      continuityKey: PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY,
    };
  }

  return {
    routeKey: "landing",
    pathname: PATIENT_INTAKE_ENTRY_ALIAS,
    draftPublicId: null,
    requestPublicId: null,
    stepKey: "landing",
    aliasSource: "start_request_alias",
    routeFamilyRef: PATIENT_INTAKE_ROUTE_FAMILY_REF,
    continuityKey: PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY,
  };
}

export function formatPatientIntakeMissionPath(location: IntakeMissionFrameLocation): string {
  const routeStep = routeStepFor(location.routeKey);
  if (location.aliasSource === "seq_139_contract") {
    switch (location.routeKey) {
      case "landing":
        return PATIENT_INTAKE_CONTRACT_ENTRY;
      case "urgent_outcome":
      case "receipt_outcome":
      case "request_status":
        return routeStep.contractPathPattern.replace(
          ":requestPublicId",
          location.requestPublicId ?? DEFAULT_REQUEST_PUBLIC_ID,
        );
      default:
        return routeStep.contractPathPattern.replace(
          ":draftPublicId",
          location.draftPublicId ?? DEFAULT_DRAFT_PUBLIC_ID,
        );
    }
  }

  if (location.routeKey === "landing") {
    return PATIENT_INTAKE_ENTRY_ALIAS;
  }
  return routeStep.implementedPathPattern.replace(
    ":draftPublicId",
    location.draftPublicId ?? DEFAULT_DRAFT_PUBLIC_ID,
  );
}

function draftIdentityContext(
  accessScenarioId: PatientAccessScenarioId,
): IntakeDraftView["identityContext"] {
  switch (accessScenarioId) {
    case "sign_in_uplift_pending":
      return {
        bindingState: "anonymous",
        subjectRefPresence: "none",
        claimResumeState: "pending",
        actorBindingState: "anonymous",
      };
    case "auth_return_read_only":
      return {
        bindingState: "verified",
        subjectRefPresence: "patient_subject_ref",
        claimResumeState: "narrowed",
        actorBindingState: "verified",
      };
    case "claim_pending_narrowing":
      return {
        bindingState: "verified",
        subjectRefPresence: "patient_subject_ref",
        claimResumeState: "pending",
        actorBindingState: "verified",
      };
    case "identity_hold":
      return {
        bindingState: "held",
        subjectRefPresence: "patient_subject_ref",
        claimResumeState: "pending",
        actorBindingState: "held",
      };
    case "rebind_required":
      return {
        bindingState: "verified",
        subjectRefPresence: "patient_subject_ref",
        claimResumeState: "rebind_required",
        actorBindingState: "verified",
      };
    case "embedded_drift_recovery":
    case "stale_draft_promoted":
      return {
        bindingState: "verified",
        subjectRefPresence: "patient_subject_ref",
        claimResumeState: "narrowed",
        actorBindingState: "verified",
      };
    default:
      return {
        bindingState: "anonymous",
        subjectRefPresence: "none",
        claimResumeState: "granted",
        actorBindingState: "anonymous",
      };
  }
}

function draftCapabilityCeiling(
  mutatingResumeState: IntakeDraftView["channelCapabilityCeiling"]["mutatingResumeState"] = "allowed",
): IntakeDraftView["channelCapabilityCeiling"] {
  return {
    canUploadFiles: true,
    canRenderTrackStatus: true,
    canRenderEmbedded: mutatingResumeState === "embedded_recovery",
    mutatingResumeState,
  };
}

function mutatingResumeStateForScenario(
  routeKey: IntakeMissionFrameRouteKey,
  scenarioId: PatientAccessScenarioId,
): DraftMutatingResumeState {
  if (routeKey === "resume_recovery") {
    return "rebind_required";
  }
  switch (scenarioId) {
    case "auth_return_read_only":
      return "read_only";
    case "claim_pending_narrowing":
      return "claim_pending";
    case "identity_hold":
      return "identity_hold";
    case "rebind_required":
      return "rebind_required";
    case "embedded_drift_recovery":
      return "embedded_recovery";
    default:
      return "allowed";
  }
}

function draftStructuredAnswers(memory: IntakeMissionFrameMemory): Record<string, unknown> {
  return {
    ...memory.structuredAnswers,
    attachments: memory.attachments
      .filter((attachment) => attachment.keptInDraft)
      .map((attachment) => ({
        attachmentRef: attachment.attachmentRef,
        filename: attachment.filename,
        state: attachment.uiState,
        currentSafeMode: attachment.currentSafeMode,
        outcomeRef: attachment.outcomeRef,
      })),
  };
}

export function requestPublicIdForDraft(draftPublicId: string): string {
  if (draftPublicId === DEFAULT_DRAFT_PUBLIC_ID) {
    return DEFAULT_REQUEST_PUBLIC_ID;
  }
  return `req_${draftPublicId.replace(/^dft_/, "")}`;
}

export function draftPublicIdForRequest(requestPublicId: string): string {
  if (requestPublicId === DEFAULT_REQUEST_PUBLIC_ID) {
    return DEFAULT_DRAFT_PUBLIC_ID;
  }
  return `dft_${requestPublicId.replace(/^req_/, "")}`;
}

export function defaultIntakeMissionFrameMemory(
  draftPublicId: string = DEFAULT_DRAFT_PUBLIC_ID,
): IntakeMissionFrameMemory {
  const structuredAnswers = createDefaultStructuredAnswers("Symptoms");
  const contactPreferences = createDefaultDraftContactPreferences();
  return {
    draftPublicId,
    phase1Integration: null,
    requestType: "Symptoms",
    detailNarrative: projectNarrativeAnswer({
      requestType: "Symptoms",
      structuredAnswers,
    }),
    supportingFocus: projectActiveQuestionSummary({
      requestType: "Symptoms",
      structuredAnswers,
    }),
    structuredAnswers,
    supersededAnswers: [],
    detailsCursorQuestionKey: "symptoms.category",
    pendingRequestTypeChange: null,
    bundleCompatibilityMode: "resume_compatible",
    bundleCompatibilityScenarioId: "BC_140_SAME_SEMANTICS_PATCH_V1",
    helperQuestionKey: null,
    deltaNotice: null,
    attachments: [],
    contactPreferences,
    contactPreferencesBaseline: createDefaultDraftContactPreferences(),
    outcomeSimulation: createDefaultUrgentOutcomeSimulation(),
    receiptSimulation: createDefaultReceiptSimulation(),
    requestStatusSimulation: createDefaultRequestStatusSimulation(),
    accessSimulation: createDefaultPatientAccessSimulation(),
    draftVersion: 6,
    lastSavedAt: "2026-04-14T10:42:00Z",
    completedStepKeys: ["request_type", "details"],
    savePresentation: "saved_authoritative",
    summaryPeekOpen: false,
    reviewAffirmed: true,
  };
}

export function selectedAnchorForRoute(routeKey: IntakeMissionFrameRouteKey): string {
  return routeStepFor(routeKey).selectedAnchorKey;
}

export function runtimeScenarioForRoute(routeKey: IntakeMissionFrameRouteKey): RuntimeScenario {
  return routeKey === "resume_recovery" ? "recovery_only" : "live";
}

export function shellPostureForRoute(routeKey: IntakeMissionFrameRouteKey): IntakeShellPosture {
  return routeStepFor(routeKey).shellPosture;
}

export function synchronizeMissionFrameSnapshot(
  current: ContinuitySnapshot,
  location: IntakeMissionFrameLocation,
): ContinuitySnapshot {
  const runtimeScenario = runtimeScenarioForRoute(location.routeKey);
  const selectedAnchorKey = selectedAnchorForRoute(location.routeKey);
  let nextSnapshot = current;

  if (nextSnapshot.activeRouteFamilyRef !== location.routeFamilyRef) {
    nextSnapshot = navigateWithinShell(nextSnapshot, location.routeFamilyRef, {
      runtimeScenario,
      timestamp: "2026-04-14T11:15:00Z",
    }).snapshot;
  }

  if (nextSnapshot.selectedAnchor.anchorKey !== selectedAnchorKey) {
    nextSnapshot = selectAnchorInSnapshot(nextSnapshot, selectedAnchorKey, "2026-04-14T11:16:00Z");
  }

  return restoreSnapshotFromRefresh(nextSnapshot, {
    availableAnchorKeys: [selectedAnchorKey],
    runtimeScenario,
    timestamp: "2026-04-14T11:17:00Z",
  });
}

export function createInitialMissionFrameSnapshot(
  location: IntakeMissionFrameLocation,
): ContinuitySnapshot {
  return synchronizeMissionFrameSnapshot(
    resolveInitialContinuitySnapshot("patient-web", location.routeFamilyRef),
    location,
  );
}

export function buildIntakeDraftView(
  location: IntakeMissionFrameLocation,
  memory: IntakeMissionFrameMemory,
): IntakeDraftView | null {
  if (location.routeKey === "landing") {
    return null;
  }
  const draftPublicId = location.draftPublicId ?? memory.draftPublicId;
  const routeStep = routeStepFor(location.routeKey);
  const mutatingResumeState = mutatingResumeStateForScenario(
    location.routeKey,
    memory.accessSimulation.scenarioId,
  );
  return {
    draftPublicId,
    ingressChannel: "self_service_form",
    surfaceChannelProfile: "browser",
    intakeConvergenceContractRef: "ICC_139_PHASE1_SELF_SERVICE_V1",
    identityContext: draftIdentityContext(memory.accessSimulation.scenarioId),
    requestType: memory.requestType,
    structuredAnswers: draftStructuredAnswers(memory),
    freeTextNarrative: projectNarrativeAnswer(memory) || memory.detailNarrative,
    attachmentRefs: activeAttachmentRefs(memory.attachments),
    contactPreferences: memory.contactPreferences,
    channelCapabilityCeiling: draftCapabilityCeiling(mutatingResumeState),
    draftVersion: memory.draftVersion,
    lastSavedAt: memory.lastSavedAt,
    resumeToken: `resume_${draftPublicId}`,
    uiJourneyState: {
      currentStepKey: routeStep.stepKey,
      completedStepKeys: memory.completedStepKeys,
      currentPathname: formatPatientIntakeMissionPath(location),
      quietStatusState:
        memory.savePresentation === "draft_not_started"
          ? "draft_not_started"
          : memory.savePresentation === "saving_local"
            ? "saving_local"
            : routeStep.quietStatusState,
      sameShellRecoveryState: location.routeKey === "resume_recovery" ? "recovery_only" : "stable",
      shellContinuityKey: PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY,
      selectedAnchorKey: routeStep.selectedAnchorKey,
    },
    draftSchemaVersion: "INTAKE_DRAFT_VIEW_V1",
  };
}

export function buildResumeTokenState(
  location: IntakeMissionFrameLocation,
  memory: IntakeMissionFrameMemory,
): DraftResumeTokenState | null {
  if (location.routeKey !== "resume_recovery") {
    return null;
  }
  return {
    draftPublicId: location.draftPublicId ?? memory.draftPublicId,
    resumeToken: `resume_${location.draftPublicId ?? memory.draftPublicId}`,
    continuityState: "recovery_only",
    activeLeaseRef: "lease_resume_qc_01",
    resumeBlockedReasonCodes: ["lease_superseded_pending_rebind"],
    mutatingResumeState: mutatingResumeStateForScenario(
      location.routeKey,
      memory.accessSimulation.scenarioId,
    ),
    sameShellRecoveryRouteRef: formatPatientIntakeMissionPath(location),
  };
}

export function buildRouteResolution(
  location: IntakeMissionFrameLocation,
  memory: IntakeMissionFrameMemory,
): DraftRouteEntryResolution | null {
  if (location.routeKey !== "resume_recovery") {
    return null;
  }
  const draftPublicId = location.draftPublicId ?? memory.draftPublicId;
  const continuityProjection: DraftContinuityEvidenceProjection = {
    projectionId: "proj_resume_qc_01",
    envelopeRef: "env_qc_01",
    draftPublicId,
    accessGrantRef: "grant_qc_01",
    activeLeaseRef: null,
    continuityState: "recovery_only",
    quietStatusState: "resume_safely",
    sameShellRecoveryState: "recovery_only",
    lastSavedAt: memory.lastSavedAt,
    authoritativeDraftVersion: memory.draftVersion,
    latestMutationRef: null,
    latestSettlementRef: "settlement_qc_01",
    latestMergePlanRef: null,
    latestRecoveryRecordRef: "recovery_qc_01",
    resumeBlockedReasonCodes: ["lease_superseded_pending_rebind"],
    requestType: memory.requestType,
    structuredAnswers: draftStructuredAnswers(memory),
    freeTextNarrative: memory.detailNarrative,
    attachmentRefs: activeAttachmentRefs(memory.attachments),
    contactPreferences: memory.contactPreferences,
    identityContext: draftIdentityContext(memory.accessSimulation.scenarioId),
    channelCapabilityCeiling: draftCapabilityCeiling(
      mutatingResumeStateForScenario(location.routeKey, memory.accessSimulation.scenarioId),
    ),
    surfaceChannelProfile: "browser",
    ingressChannel: "self_service_form",
    intakeConvergenceContractRef: "ICC_139_PHASE1_SELF_SERVICE_V1",
    resumeToken: `resume_${draftPublicId}`,
    currentStepKey: "resume_recovery",
    completedStepKeys: memory.completedStepKeys,
    currentPathname: formatPatientIntakeMissionPath(location),
    shellContinuityKey: PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY,
    selectedAnchorKey: selectedAnchorForRoute("resume_recovery"),
  };
  return {
    resolutionSchemaVersion: "PHASE1_PROMOTED_DRAFT_RESOLUTION_V1",
    draftPublicId,
    entryAuthorityState: "recovery_only",
    targetIntent: "resume_recovery",
    targetStepKey: "review_submit",
    targetPathname: `/start-request/${draftPublicId}/review`,
    routeFamilyRef: PATIENT_INTAKE_ROUTE_FAMILY_REF,
    requestPublicId: null,
    promotedRequestRef: null,
    receiptConsistencyKey: null,
    statusConsistencyKey: null,
    proofState: "grant_superseded_same_lineage",
    mutatingResumeState: "rebind_required",
    reasonCodes: ["resume_same_shell_projection_rebind_required"],
    continuityProjection,
    recoveryRecord: null,
    lease: null,
    events: [],
  };
}

export function buildSummaryChips(
  memory: IntakeMissionFrameMemory,
): readonly { label: string; value: string }[] {
  const activeSummary = buildProgressiveFlowView(memory).activeSummaryChips.map((chip) => ({
    label: chip.label,
    value: chip.value,
  }));
  const contactSummaryView = buildContactSummaryView({
    preferences: memory.contactPreferences,
    baselinePreferences: memory.contactPreferencesBaseline,
  });
  return [
    ...activeSummary.slice(0, 4),
    {
      label: "Files",
      value: `${activeAttachmentCount(memory.attachments)} item${activeAttachmentCount(memory.attachments) === 1 ? "" : "s"}`,
    },
    {
      label: "Contact",
      value: buildContactSummaryChip(contactSummaryView),
    },
  ];
}

function accessRecoveryReasonForScenario(
  scenarioId: PatientAccessScenarioId,
): PatientAccessSurfaceInput["recoveryReason"] {
  switch (scenarioId) {
    case "rebind_required":
      return "identity_rebind_required";
    case "embedded_drift_recovery":
      return "manifest_drift";
    case "stale_draft_promoted":
      return "promoted_request_available";
    default:
      return null;
  }
}

export function resolveMissionFrameView(input: {
  location: IntakeMissionFrameLocation;
  memory: IntakeMissionFrameMemory;
}): IntakeMissionFrameView {
  const routeStep = routeStepFor(input.location.routeKey);
  const contactSummaryView = buildContactSummaryView({
    preferences: input.memory.contactPreferences,
    baselinePreferences: input.memory.contactPreferencesBaseline,
  });
  const summaryChips = buildSummaryChips(input.memory);
  const requestPublicId =
    input.location.requestPublicId ??
    input.memory.phase1Integration?.requestPublicId ??
    requestPublicIdForDraft(input.location.draftPublicId ?? input.memory.draftPublicId);
  const accessPosture = buildPatientAccessSurface({
    scenarioId: input.memory.accessSimulation.scenarioId,
    currentPathname: formatPatientIntakeMissionPath(input.location),
    currentRouteKey: input.location.routeKey,
    draftPublicId: input.location.draftPublicId ?? input.memory.draftPublicId,
    requestPublicId,
    selectedAnchorKey: routeStep.selectedAnchorKey,
    currentStepTitle: routeStep.title,
    safeSummaryChips: summaryChips,
    lastSavedAt: input.memory.lastSavedAt,
    recoveryReason: accessRecoveryReasonForScenario(input.memory.accessSimulation.scenarioId),
  });
  return {
    location: input.location,
    routeClaim: getPersistentShellRouteClaim(PATIENT_INTAKE_ROUTE_FAMILY_REF),
    shellPosture: shellPostureForRoute(input.location.routeKey),
    runtimeScenario: runtimeScenarioForRoute(input.location.routeKey),
    routeStep,
    routeSteps: routeStepDescriptors,
    draftView: buildIntakeDraftView(input.location, input.memory),
    requestPublicId,
    requestTypeCards,
    summaryChips: accessPosture?.summaryVisibility === "hidden" ? [] : accessPosture?.summaryChips ?? summaryChips,
    contactSummaryView,
    contactConfirmationPreview: buildConfirmationCopyPreview({
      summaryView: contactSummaryView,
      lifecycleState: "step_preview",
    }),
    accessPosture,
    urgentSurface:
      input.location.routeKey === "urgent_outcome" || input.location.routeKey === "resume_recovery"
        ? buildUrgentOutcomeSurface({
            routeKey:
              input.location.routeKey === "resume_recovery"
                ? "resume_recovery"
                : "urgent_outcome",
            requestPublicId,
            requestType: input.memory.requestType,
            detailNarrative: projectNarrativeAnswer(input.memory) || input.memory.detailNarrative,
            attachmentCount: activeAttachmentCount(input.memory.attachments),
            contactSummaryView,
            simulationState: input.memory.outcomeSimulation,
          })
        : null,
    receiptSurface:
      input.location.routeKey === "receipt_outcome"
        ? buildReceiptSurface({
            requestPublicId,
            contactSummaryView,
            simulationState: input.memory.receiptSimulation,
          })
        : null,
    requestStatusSurface:
      input.location.routeKey === "request_status"
        ? buildRequestStatusSurface({
            draftPublicId: input.memory.draftPublicId,
            requestPublicId,
            aliasSource: input.location.aliasSource,
            receiptSimulation: input.memory.receiptSimulation,
            statusSimulation: input.memory.requestStatusSimulation,
          })
        : null,
    provenanceNote:
      accessPosture
        ? `This shell is rendering ${ACCESS_GRANT_SCOPE_ENVELOPE_REF}, ${ACCESS_GRANT_SUPERSESSION_RECORD_REF}, ${PATIENT_NAV_RETURN_CONTRACT_REF}, ${RECOVERY_CONTINUATION_TOKEN_REF}, ${PATIENT_ACTION_RECOVERY_ENVELOPE_REF}, ${PATIENT_SHELL_CONSISTENCY_PROJECTION_REF}, ${PATIENT_EMBEDDED_SESSION_PROJECTION_REF}, ${PATIENT_DEGRADED_MODE_PROJECTION_REF}, ${PATIENT_ACTION_RECOVERY_PROJECTION_REF}, and ${PATIENT_IDENTITY_HOLD_PROJECTION_REF} through the same mission frame. ${GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1}, ${GAP_RESOLVED_ACCESS_POSTURE_COPY_REBIND_V1}, and ${GAP_RESOLVED_ACCESS_POSTURE_COPY_STALE_PROMOTION_V1} bound the missing copy slots.`
        : input.location.aliasSource === "start_request_alias"
          ? "This shell renders the required /start-request alias while preserving the seq_139 route contract mapping one-to-one."
          : "This shell is rendering through the seq_139 contract path and the same continuity key.",
    urgentEscapeLabel: "If you feel suddenly unwell, call 999 now.",
    resumeTokenState: buildResumeTokenState(input.location, input.memory),
    routeResolution: buildRouteResolution(input.location, input.memory),
  };
}

export function normalizeMissionFrameMemory(
  draftPublicId: string,
  partialMemory: Partial<IntakeMissionFrameMemory> | null | undefined,
): IntakeMissionFrameMemory {
  const fallback = defaultIntakeMissionFrameMemory(draftPublicId);
  if (!partialMemory) {
    return fallback;
  }
  const contactPreferences = normalizeDraftContactPreferences(partialMemory.contactPreferences);
  return {
    ...fallback,
    ...partialMemory,
    draftPublicId,
    attachments: normalizeIntakeAttachmentCards(
      partialMemory.attachments as readonly Partial<IntakeAttachmentCard>[] | undefined,
    ),
    contactPreferences,
    contactPreferencesBaseline: normalizeDraftContactPreferences(
      partialMemory.contactPreferencesBaseline ??
        partialMemory.contactPreferences ??
        contactPreferences,
    ),
    outcomeSimulation: normalizeUrgentOutcomeSimulation(partialMemory.outcomeSimulation),
    receiptSimulation: normalizeReceiptSimulation(partialMemory.receiptSimulation),
    requestStatusSimulation: normalizeRequestStatusSimulation(
      partialMemory.requestStatusSimulation,
    ),
    accessSimulation: normalizePatientAccessSimulation(partialMemory.accessSimulation),
  };
}

export function attachmentUiStateFromMemoryState(
  state: AttachmentUiState | null | undefined,
): AttachmentUiState {
  return state ?? "ready_kept";
}
