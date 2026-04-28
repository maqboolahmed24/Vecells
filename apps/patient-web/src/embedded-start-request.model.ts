import {
  DEFAULT_DRAFT_PUBLIC_ID,
  PATIENT_INTAKE_ROUTE_FAMILY_REF,
  buildIntakeDraftView,
  defaultIntakeMissionFrameMemory,
  parsePatientIntakeMissionLocation,
  requestPublicIdForDraft,
  resolveMissionFrameView,
  routeStepDescriptors,
  selectedAnchorForRoute,
  type DraftStepKey,
  type IntakeDraftView,
  type IntakeMissionFrameLocation,
  type IntakeMissionFrameMemory,
  type IntakeMissionFrameRouteKey,
} from "./patient-intake-mission-frame.model";
import {
  buildProgressiveFlowView,
  createDefaultStructuredAnswers,
  moveDetailsForward,
  validateCurrentQuestionFrame,
  type ProgressiveFlowView,
  type ProgressiveRequestType,
  type ProgressiveValidationIssue,
} from "./patient-intake-progressive-flow";
import {
  buildContactSummaryView,
  primaryContactValidationMessage,
  type ContactSummaryView,
} from "./patient-intake-contact-preferences";
import {
  buildReceiptSurface,
  createDefaultReceiptSimulation,
  type ReceiptSurfaceView,
} from "./patient-intake-receipt-surface";

export const EMBEDDED_START_REQUEST_TASK_ID = "par_389";
export const EMBEDDED_START_REQUEST_VISUAL_MODE = "NHSApp_Embedded_Start_Request";
export const EMBEDDED_START_REQUEST_STORAGE_PREFIX = "vecells.phase7.embedded-start-request";
export const EMBEDDED_START_REQUEST_CONTRACT_REF =
  "EmbeddedStartRequestIntakeContract:389:phase1-canonical-intake";
export const EMBEDDED_START_REQUEST_CONVERGENCE_REF = "ICC_139_PHASE1_SELF_SERVICE_V1";
export const EMBEDDED_START_REQUEST_CONTINUITY_REF =
  "DraftContinuityEvidenceProjection:389:embedded-start-request";
export const EMBEDDED_START_REQUEST_SHELL_CONTINUITY_KEY =
  "patient.portal.requests.embedded.nhs-app";

export type EmbeddedStartRequestStep =
  | "request_type"
  | "details"
  | "contact_preferences"
  | "review_submit"
  | "receipt_outcome"
  | "resume_recovery";

export type EmbeddedAutosaveState =
  | "draft_not_started"
  | "saving"
  | "saved_authoritative"
  | "recovery_required"
  | "submitted";

export interface EmbeddedIntakeDraftContinuityEvidence {
  readonly evidenceRef: typeof EMBEDDED_START_REQUEST_CONTINUITY_REF;
  readonly draftPublicId: string;
  readonly routeFamilyRef: typeof PATIENT_INTAKE_ROUTE_FAMILY_REF;
  readonly shellContinuityKey: typeof EMBEDDED_START_REQUEST_SHELL_CONTINUITY_KEY;
  readonly selectedAnchorRef: string;
  readonly latestSaveSettlementRef: string;
  readonly validationState: "trusted" | "degraded" | "stale" | "blocked";
  readonly writableResume: boolean;
}

export interface EmbeddedSubmissionEnvelopeSummary {
  readonly envelopeRef: string;
  readonly draftPublicId: string;
  readonly requestPublicId: string | null;
  readonly state: "draft" | "review_ready" | "submitted" | "promoted_recovery";
  readonly promotionRecordRef: string | null;
  readonly intakeConvergenceContractRef: typeof EMBEDDED_START_REQUEST_CONVERGENCE_REF;
}

export interface EmbeddedStartRequestContext {
  readonly taskId: typeof EMBEDDED_START_REQUEST_TASK_ID;
  readonly visualMode: typeof EMBEDDED_START_REQUEST_VISUAL_MODE;
  readonly contractRef: typeof EMBEDDED_START_REQUEST_CONTRACT_REF;
  readonly step: EmbeddedStartRequestStep;
  readonly location: IntakeMissionFrameLocation;
  readonly memory: IntakeMissionFrameMemory;
  readonly draftView: IntakeDraftView;
  readonly progressiveView: ProgressiveFlowView;
  readonly contactSummary: ContactSummaryView;
  readonly receiptSurface: ReceiptSurfaceView;
  readonly validationIssues: readonly ProgressiveValidationIssue[];
  readonly draftContinuityEvidence: EmbeddedIntakeDraftContinuityEvidence;
  readonly submissionEnvelope: EmbeddedSubmissionEnvelopeSummary;
  readonly stepIndex: number;
  readonly stepTotal: number;
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string | null;
  readonly autosaveState: EmbeddedAutosaveState;
  readonly resumeBanner: {
    readonly visible: boolean;
    readonly title: string;
    readonly body: string;
    readonly actionLabel: string;
  };
}

const STEP_SEQUENCE: readonly EmbeddedStartRequestStep[] = [
  "request_type",
  "details",
  "contact_preferences",
  "review_submit",
  "receipt_outcome",
];

const STEP_TO_ROUTE_KEY: Record<EmbeddedStartRequestStep, IntakeMissionFrameRouteKey> = {
  request_type: "request_type",
  details: "details",
  contact_preferences: "contact_preferences",
  review_submit: "review_submit",
  receipt_outcome: "receipt_outcome",
  resume_recovery: "resume_recovery",
};

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || "/nhs-app/start-request";
  return trimmed === "/" ? "/nhs-app/start-request" : trimmed.replace(/\/+$/, "") || "/nhs-app/start-request";
}

export function isEmbeddedStartRequestPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    normalized === "/nhs-app/start-request" ||
    normalized.startsWith("/nhs-app/start-request/") ||
    normalized === "/nhs-app/intake/start" ||
    normalized.startsWith("/nhs-app/intake/") ||
    normalized === "/embedded-start-request" ||
    normalized.startsWith("/embedded-start-request/")
  );
}

function stepFromSegment(segment: string | null): EmbeddedStartRequestStep {
  switch (segment) {
    case "details":
      return "details";
    case "contact":
    case "contact-preferences":
      return "contact_preferences";
    case "review":
      return "review_submit";
    case "receipt":
      return "receipt_outcome";
    case "resume":
    case "recovery":
      return "resume_recovery";
    case "request-type":
    default:
      return "request_type";
  }
}

function routeAliasForStep(draftPublicId: string, step: EmbeddedStartRequestStep): string {
  switch (step) {
    case "request_type":
      return `/start-request/${draftPublicId}/request-type`;
    case "details":
      return `/start-request/${draftPublicId}/details`;
    case "contact_preferences":
      return `/start-request/${draftPublicId}/contact`;
    case "review_submit":
      return `/start-request/${draftPublicId}/review`;
    case "receipt_outcome":
      return `/start-request/${draftPublicId}/receipt`;
    case "resume_recovery":
      return `/start-request/${draftPublicId}/recovery`;
  }
}

export function embeddedStartRequestPath(input: {
  readonly draftPublicId: string;
  readonly step: EmbeddedStartRequestStep;
}): string {
  switch (input.step) {
    case "request_type":
      return `/nhs-app/start-request/${input.draftPublicId}/request-type`;
    case "details":
      return `/nhs-app/start-request/${input.draftPublicId}/details`;
    case "contact_preferences":
      return `/nhs-app/start-request/${input.draftPublicId}/contact`;
    case "review_submit":
      return `/nhs-app/start-request/${input.draftPublicId}/review`;
    case "receipt_outcome":
      return `/nhs-app/start-request/${input.draftPublicId}/receipt`;
    case "resume_recovery":
      return `/nhs-app/start-request/${input.draftPublicId}/resume`;
  }
}

export function parseEmbeddedStartRequestLocation(input: {
  readonly pathname: string;
  readonly search?: string;
}): { readonly draftPublicId: string; readonly step: EmbeddedStartRequestStep; readonly fixture: string | null } {
  const normalized = normalizePathname(input.pathname);
  const params = new URLSearchParams(input.search ?? "");
  const fixture = params.get("fixture");
  const parts = normalized.split("/").filter(Boolean);
  let draftPublicId = params.get("draft") ?? DEFAULT_DRAFT_PUBLIC_ID;
  let segment: string | null = params.get("step");

  const startIndex = parts.indexOf("start-request");
  if (startIndex >= 0) {
    const possibleDraft = parts[startIndex + 1];
    const possibleSegment = parts[startIndex + 2];
    if (possibleDraft && possibleDraft.startsWith("dft_")) {
      draftPublicId = possibleDraft;
      segment = possibleSegment ?? segment;
    } else {
      segment = possibleDraft ?? segment;
    }
  }

  const intakeIndex = parts.indexOf("intake");
  if (intakeIndex >= 0) {
    const possibleDraft = parts[intakeIndex + 2];
    const possibleSegment = parts[intakeIndex + 3] ?? parts[intakeIndex + 1];
    if (possibleDraft?.startsWith("dft_")) {
      draftPublicId = possibleDraft;
    }
    segment = possibleSegment ?? segment;
  }

  return {
    draftPublicId,
    step: stepFromSegment(segment),
    fixture,
  };
}

export function canonicalLocationForEmbedded(input: {
  readonly draftPublicId: string;
  readonly step: EmbeddedStartRequestStep;
}): IntakeMissionFrameLocation {
  return parsePatientIntakeMissionLocation(routeAliasForStep(input.draftPublicId, input.step));
}

function emptyEmbeddedMemory(draftPublicId: string): IntakeMissionFrameMemory {
  const fallback = defaultIntakeMissionFrameMemory(draftPublicId);
  return {
    ...fallback,
    structuredAnswers: {},
    detailNarrative: "",
    supportingFocus: "",
    completedStepKeys: [],
    draftVersion: 1,
    savePresentation: "draft_not_started",
    reviewAffirmed: false,
    lastSavedAt: "2026-04-27T09:10:00Z",
  };
}

export function createEmbeddedStartRequestMemory(input: {
  readonly draftPublicId: string;
  readonly fixture?: string | null;
  readonly patch?: Partial<IntakeMissionFrameMemory>;
}): IntakeMissionFrameMemory {
  const fixture = input.fixture ?? "partial";
  const base =
    fixture === "empty" || fixture === "validation"
      ? emptyEmbeddedMemory(input.draftPublicId)
      : defaultIntakeMissionFrameMemory(input.draftPublicId);
  const next: IntakeMissionFrameMemory = {
    ...base,
    ...input.patch,
    draftPublicId: input.draftPublicId,
  };
  if (fixture === "validation") {
    return {
      ...next,
      requestType: "Admin",
      structuredAnswers: {},
      detailsCursorQuestionKey: "admin.supportType",
      completedStepKeys: ["request_type"],
      savePresentation: "draft_not_started",
    };
  }
  if (fixture === "review" || fixture === "receipt") {
    return {
      ...next,
      completedStepKeys: ["request_type", "details", "contact_preferences"],
      savePresentation: "saved_authoritative",
      reviewAffirmed: true,
    };
  }
  if (fixture === "resume") {
    return {
      ...next,
      savePresentation: "saved_authoritative",
      accessSimulation: {
        ...next.accessSimulation,
        scenarioId: "embedded_drift_recovery",
      },
    };
  }
  if (fixture === "promoted") {
    return {
      ...next,
      completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
      savePresentation: "saved_authoritative",
      reviewAffirmed: true,
    };
  }
  return next;
}

function submissionStateFor(
  step: EmbeddedStartRequestStep,
  fixture: string | null,
): EmbeddedSubmissionEnvelopeSummary["state"] {
  if (fixture === "promoted") return "promoted_recovery";
  if (step === "receipt_outcome") return "submitted";
  if (step === "review_submit") return "review_ready";
  return "draft";
}

function autosaveStateFor(
  step: EmbeddedStartRequestStep,
  memory: IntakeMissionFrameMemory,
  fixture: string | null,
): EmbeddedAutosaveState {
  if (step === "receipt_outcome") return "submitted";
  if (fixture === "resume" || fixture === "promoted") return "recovery_required";
  if (memory.savePresentation === "saving_local") return "saving";
  if (memory.savePresentation === "draft_not_started") return "draft_not_started";
  return "saved_authoritative";
}

function actionLabelsFor(step: EmbeddedStartRequestStep): {
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string | null;
} {
  switch (step) {
    case "request_type":
      return { primaryActionLabel: "Continue", secondaryActionLabel: null };
    case "details":
      return { primaryActionLabel: "Save and continue", secondaryActionLabel: "Back" };
    case "contact_preferences":
      return { primaryActionLabel: "Review your request", secondaryActionLabel: "Back" };
    case "review_submit":
      return { primaryActionLabel: "Confirm and send", secondaryActionLabel: "Back" };
    case "receipt_outcome":
      return { primaryActionLabel: "Track request status", secondaryActionLabel: null };
    case "resume_recovery":
      return { primaryActionLabel: "Resume safely", secondaryActionLabel: "Open receipt" };
  }
}

export function stepIndexFor(step: EmbeddedStartRequestStep): number {
  if (step === "resume_recovery") return 1;
  return Math.max(0, STEP_SEQUENCE.indexOf(step));
}

export function nextStepAfter(step: EmbeddedStartRequestStep): EmbeddedStartRequestStep {
  switch (step) {
    case "request_type":
      return "details";
    case "details":
      return "contact_preferences";
    case "contact_preferences":
      return "review_submit";
    case "review_submit":
      return "receipt_outcome";
    case "resume_recovery":
      return "review_submit";
    case "receipt_outcome":
      return "receipt_outcome";
  }
}

export function previousStepBefore(step: EmbeddedStartRequestStep): EmbeddedStartRequestStep {
  switch (step) {
    case "details":
      return "request_type";
    case "contact_preferences":
      return "details";
    case "review_submit":
      return "contact_preferences";
    case "receipt_outcome":
      return "review_submit";
    case "resume_recovery":
    case "request_type":
      return "request_type";
  }
}

export function selectEmbeddedRequestType(
  memory: IntakeMissionFrameMemory,
  requestType: ProgressiveRequestType,
): IntakeMissionFrameMemory {
  const structuredAnswers =
    requestType === "Symptoms" ? createDefaultStructuredAnswers("Symptoms") : {};
  return {
    ...memory,
    requestType,
    structuredAnswers,
    completedStepKeys: ["request_type"],
    savePresentation: "saving_local",
    draftVersion: memory.draftVersion + 1,
  };
}

export function moveEmbeddedDetailsForward(memory: IntakeMissionFrameMemory): {
  readonly nextMemory: IntakeMissionFrameMemory;
  readonly complete: boolean;
  readonly validationIssues: readonly ProgressiveValidationIssue[];
} {
  const result = moveDetailsForward(memory);
  return {
    ...result,
    nextMemory: {
      ...result.nextMemory,
      completedStepKeys: result.complete
        ? [...new Set([...result.nextMemory.completedStepKeys, "details" as DraftStepKey])]
        : result.nextMemory.completedStepKeys,
    },
  };
}

export function resolveEmbeddedStartRequestContext(input: {
  readonly pathname: string;
  readonly search?: string;
  readonly memory?: IntakeMissionFrameMemory;
}): EmbeddedStartRequestContext {
  const parsed = parseEmbeddedStartRequestLocation(input);
  const fixture = parsed.fixture;
  const step = fixture === "promoted" ? "resume_recovery" : parsed.step;
  const memory =
    input.memory ??
    createEmbeddedStartRequestMemory({
      draftPublicId: parsed.draftPublicId,
      fixture,
    });
  const location = canonicalLocationForEmbedded({ draftPublicId: parsed.draftPublicId, step });
  const missionView = resolveMissionFrameView({ location, memory });
  const draftView =
    missionView.draftView ??
    buildIntakeDraftView(
      canonicalLocationForEmbedded({ draftPublicId: parsed.draftPublicId, step: "request_type" }),
      memory,
    )!;
  const progressiveView = buildProgressiveFlowView(memory);
  const contactSummary = buildContactSummaryView({
    preferences: memory.contactPreferences,
    baselinePreferences: memory.contactPreferencesBaseline,
  });
  const requestPublicId = requestPublicIdForDraft(parsed.draftPublicId);
  const receiptSurface =
    missionView.receiptSurface ??
    buildReceiptSurface({
      requestPublicId,
      contactSummaryView: contactSummary,
      simulationState: createDefaultReceiptSimulation(),
    });
  const actionLabels = actionLabelsFor(step);
  const selectedAnchorRef =
    step === "receipt_outcome"
      ? selectedAnchorForRoute("receipt_outcome")
      : selectedAnchorForRoute(STEP_TO_ROUTE_KEY[step]);
  const validationIssues: readonly ProgressiveValidationIssue[] =
    step === "details"
      ? validateCurrentQuestionFrame(memory)
      : step === "contact_preferences"
        ? primaryContactValidationMessage(contactSummary)
          ? [
              {
                code: "FIELD_REQUIRED",
                questionKey: "contact.preferences",
                message: primaryContactValidationMessage(contactSummary)!,
              },
            ]
          : []
        : [];
  return {
    taskId: EMBEDDED_START_REQUEST_TASK_ID,
    visualMode: EMBEDDED_START_REQUEST_VISUAL_MODE,
    contractRef: EMBEDDED_START_REQUEST_CONTRACT_REF,
    step,
    location,
    memory,
    draftView: {
      ...draftView,
      surfaceChannelProfile: "browser",
      channelCapabilityCeiling: {
        ...draftView.channelCapabilityCeiling,
        canRenderEmbedded: true,
      },
      uiJourneyState: {
        ...draftView.uiJourneyState,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: selectedAnchorRef,
      },
    },
    progressiveView,
    contactSummary,
    receiptSurface,
    validationIssues,
    draftContinuityEvidence: {
      evidenceRef: EMBEDDED_START_REQUEST_CONTINUITY_REF,
      draftPublicId: parsed.draftPublicId,
      routeFamilyRef: PATIENT_INTAKE_ROUTE_FAMILY_REF,
      shellContinuityKey: EMBEDDED_START_REQUEST_SHELL_CONTINUITY_KEY,
      selectedAnchorRef,
      latestSaveSettlementRef: `DraftSaveSettlement:389:${parsed.draftPublicId}:${memory.draftVersion}`,
      validationState: fixture === "promoted" ? "stale" : fixture === "resume" ? "degraded" : "trusted",
      writableResume: fixture !== "promoted" && fixture !== "resume",
    },
    submissionEnvelope: {
      envelopeRef: `SubmissionEnvelope:389:${parsed.draftPublicId}`,
      draftPublicId: parsed.draftPublicId,
      requestPublicId: step === "receipt_outcome" || fixture === "promoted" ? requestPublicId : null,
      state: submissionStateFor(step, fixture),
      promotionRecordRef:
        step === "receipt_outcome" || fixture === "promoted"
          ? `SubmissionPromotionRecord:389:${requestPublicId}`
          : null,
      intakeConvergenceContractRef: EMBEDDED_START_REQUEST_CONVERGENCE_REF,
    },
    stepIndex: stepIndexFor(step),
    stepTotal: STEP_SEQUENCE.length,
    primaryActionLabel: fixture === "promoted" ? "Open receipt" : actionLabels.primaryActionLabel,
    secondaryActionLabel: fixture === "promoted" ? null : actionLabels.secondaryActionLabel,
    autosaveState: autosaveStateFor(step, memory, fixture),
    resumeBanner: {
      visible: fixture === "resume" || fixture === "promoted",
      title:
        fixture === "promoted"
          ? "This draft was already sent"
          : "Resume this request inside the NHS App",
      body:
        fixture === "promoted"
          ? "We kept the same lineage and will open the receipt instead of reopening editable draft fields."
          : "We checked the draft continuity evidence before allowing edits in this embedded shell.",
      actionLabel: fixture === "promoted" ? "Open receipt" : "Resume safely",
    },
  };
}

export const embeddedStartRequestSteps = routeStepDescriptors.filter((step) =>
  ["request_type", "details", "contact_preferences", "review_submit", "receipt_outcome"].includes(step.routeKey),
);
