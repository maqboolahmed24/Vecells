import type {
  IntakeMissionFrameMemory,
  IntakeMissionFrameLocation,
  Phase1IntegratedMemoryState,
} from "./patient-intake-mission-frame.model";
import { createDefaultReceiptSimulation } from "./patient-intake-receipt-surface";
import { createDefaultRequestStatusSimulation } from "./patient-intake-request-status-surface";

const CONTRACT_REF = "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1" as const;

interface IntegratedRouteMetadata {
  routeFamilyRef: string;
  lineageKey: string;
  shellContinuityKey: string;
  writablePosture: string;
  selectedAnchor: string;
  surfaceState: string;
  authoritativeProjectionTupleRefs: readonly string[];
  audienceSurfaceRuntimeBindingRef: string;
  contractRef: string;
}

interface IntegratedSessionPayload {
  draftPublicId: string;
  leaseId: string;
  resumeToken: string;
  draftVersion: number;
}

interface StartDraftPayload {
  draft: {
    draftPublicId: string;
    requestType: IntakeMissionFrameMemory["requestType"];
    draftVersion: number;
    resumeToken: string;
  };
  integratedSession: IntegratedSessionPayload;
  routeMetadata: IntegratedRouteMetadata;
}

interface SubmitJourneyPayload {
  decisionClass: string;
  replayed: boolean;
  requestPublicId: string | null;
  requestRef: string | null;
  requestLineageRef: string | null;
  settlement: {
    intakeSubmitSettlementId: string;
    draftPublicId: string;
  };
  outcomeTuple: {
    outcomeResult: string;
    appliesToState: string;
  } | null;
  receiptConsistencyEnvelope: {
    consistencyEnvelopeId: string;
    receiptConsistencyKey: string | null;
    statusConsistencyKey: string | null;
    receiptBucket: string;
    promiseState: string;
    communicationPosture?: string;
  } | null;
  notification: {
    patientCommunicationPosture: string;
  } | null;
  routeMetadata: IntegratedRouteMetadata;
}

function configuredBaseUrl(): string | null {
  const raw = import.meta.env.VITE_PHASE1_INTAKE_API_BASE_URL;
  return typeof raw === "string" && raw.trim() ? raw.replace(/\/+$/, "") : null;
}

export function isPhase1IntegratedIntakeEnabled(): boolean {
  return configuredBaseUrl() !== null;
}

async function postJson<TPayload>(path: string, body: unknown): Promise<TPayload> {
  const baseUrl = configuredBaseUrl();
  if (!baseUrl) {
    throw new Error("PHASE1_INTEGRATED_INTAKE_API_NOT_CONFIGURED");
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": `patient-web-${Date.now().toString(36)}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    throw new Error(`PHASE1_INTEGRATED_INTAKE_REQUEST_FAILED_${response.status}`);
  }
  return (await response.json()) as TPayload;
}

function memoryPayload(
  memory: IntakeMissionFrameMemory,
  location?: IntakeMissionFrameLocation,
): Record<string, unknown> {
  return {
    draftPublicId: memory.draftPublicId,
    requestType: memory.requestType,
    structuredAnswers: memory.structuredAnswers,
    detailNarrative: memory.detailNarrative,
    attachments: memory.attachments,
    contactPreferences: memory.contactPreferences,
    completedStepKeys: memory.completedStepKeys,
    currentPathname: location?.pathname,
    currentStepKey: location?.routeKey,
    observedAt: new Date().toISOString(),
    memory,
  };
}

function integrationState(input: {
  memory: IntakeMissionFrameMemory;
  session?: IntegratedSessionPayload | null;
  routeMetadata: IntegratedRouteMetadata | null;
  requestPublicId?: string | null;
  requestRef?: string | null;
  settlementRef?: string | null;
  decisionClass?: string | null;
  notificationPosture?: string | null;
}): Phase1IntegratedMemoryState {
  const prior = input.memory.phase1Integration;
  const session = input.session ?? prior;
  return {
    enabled: true,
    contractRef: CONTRACT_REF,
    draftPublicId: session?.draftPublicId ?? input.memory.draftPublicId,
    leaseId: session?.leaseId ?? prior?.leaseId ?? "",
    resumeToken: session?.resumeToken ?? prior?.resumeToken ?? "",
    draftVersion: session?.draftVersion ?? prior?.draftVersion ?? input.memory.draftVersion,
    requestPublicId: input.requestPublicId ?? prior?.requestPublicId ?? null,
    requestRef: input.requestRef ?? prior?.requestRef ?? null,
    latestSettlementRef: input.settlementRef ?? prior?.latestSettlementRef ?? null,
    latestDecisionClass: input.decisionClass ?? prior?.latestDecisionClass ?? null,
    latestNotificationPosture:
      input.notificationPosture ?? prior?.latestNotificationPosture ?? null,
    routeMetadata: input.routeMetadata ?? prior?.routeMetadata ?? null,
  };
}

function receiptBucket(value: string | null | undefined) {
  switch (value) {
    case "same_day":
    case "next_working_day":
    case "within_2_working_days":
    case "after_2_working_days":
      return value;
    default:
      return "after_2_working_days";
  }
}

function promiseState(value: string | null | undefined) {
  switch (value) {
    case "improved":
    case "at_risk":
    case "revised_downward":
    case "recovery_required":
      return value;
    default:
      return "on_track";
  }
}

function communicationPosture(value: string | null | undefined) {
  switch (value) {
    case "delivery_pending":
    case "delivered":
    case "recovery_required":
      return value;
    default:
      return "queued";
  }
}

export async function startIntegratedDraft(
  memory: IntakeMissionFrameMemory,
): Promise<IntakeMissionFrameMemory | null> {
  if (!isPhase1IntegratedIntakeEnabled()) {
    return null;
  }
  const payload = await postJson<StartDraftPayload>("/phase1/intake/start", {
    requestType: memory.requestType,
    observedAt: new Date().toISOString(),
  });
  return {
    ...memory,
    draftPublicId: payload.draft.draftPublicId,
    requestType: payload.draft.requestType,
    draftVersion: payload.draft.draftVersion,
    phase1Integration: integrationState({
      memory: {
        ...memory,
        draftPublicId: payload.draft.draftPublicId,
        draftVersion: payload.draft.draftVersion,
      },
      session: payload.integratedSession,
      routeMetadata: payload.routeMetadata,
    }),
  };
}

export async function patchIntegratedDraft(
  memory: IntakeMissionFrameMemory,
  location: IntakeMissionFrameLocation,
): Promise<Phase1IntegratedMemoryState | null> {
  if (!isPhase1IntegratedIntakeEnabled() || !memory.phase1Integration) {
    return null;
  }
  const payload = await postJson<{
    integratedSession: IntegratedSessionPayload;
    routeMetadata: IntegratedRouteMetadata;
  }>("/phase1/intake/patch", memoryPayload(memory, location));
  return integrationState({
    memory,
    session: payload.integratedSession,
    routeMetadata: payload.routeMetadata,
  });
}

export async function submitIntegratedJourney(
  memory: IntakeMissionFrameMemory,
  location: IntakeMissionFrameLocation,
): Promise<SubmitJourneyPayload | null> {
  if (!isPhase1IntegratedIntakeEnabled() || !memory.phase1Integration) {
    return null;
  }
  return postJson<SubmitJourneyPayload>("/phase1/intake/submit", {
    ...memoryPayload(memory, location),
    clientCommandId: `cmd_164_submit_${memory.phase1Integration.draftPublicId}`,
    idempotencyKey: `idem_164_submit_${memory.phase1Integration.draftPublicId}`,
  });
}

export function applyIntegratedSubmitResult(
  memory: IntakeMissionFrameMemory,
  payload: SubmitJourneyPayload,
): IntakeMissionFrameMemory {
  const receiptSimulation = createDefaultReceiptSimulation();
  const requestStatusSimulation = createDefaultRequestStatusSimulation();
  const notificationPosture =
    payload.notification?.patientCommunicationPosture ??
    payload.receiptConsistencyEnvelope?.communicationPosture ??
    null;
  return {
    ...memory,
    phase1Integration: integrationState({
      memory,
      routeMetadata: payload.routeMetadata,
      requestPublicId: payload.requestPublicId,
      requestRef: payload.requestRef,
      settlementRef: payload.settlement.intakeSubmitSettlementId,
      decisionClass: payload.decisionClass,
      notificationPosture,
    }),
    outcomeSimulation:
      payload.outcomeTuple?.outcomeResult === "urgent_diversion"
        ? {
            urgentVariant: "urgent_issued",
            recoveryVariant: memory.outcomeSimulation.recoveryVariant,
          }
        : memory.outcomeSimulation,
    receiptSimulation: payload.receiptConsistencyEnvelope
      ? {
          ...receiptSimulation,
          macroState: "received",
          receiptBucket: receiptBucket(payload.receiptConsistencyEnvelope.receiptBucket),
          promiseState: promiseState(payload.receiptConsistencyEnvelope.promiseState),
          communicationPosture: communicationPosture(notificationPosture),
        }
      : memory.receiptSimulation,
    requestStatusSimulation: payload.receiptConsistencyEnvelope
      ? {
          ...requestStatusSimulation,
          lastMeaningfulUpdateLine:
            "Last meaningful update: the authoritative settlement, receipt envelope, and notification queue were read from the same Phase 1 integration seam.",
        }
      : memory.requestStatusSimulation,
    savePresentation: "saved_authoritative",
  };
}
