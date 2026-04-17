import { createHash } from "node:crypto";
import type { EdgeCorrelationContext } from "@vecells/observability";
import { createIntakeSubmitApplication } from "../../command-api/src/intake-submit";
import { createNotificationDispatchApplication } from "../../notification-worker/src/confirmation-dispatch";

export const phase1IntegratedIntakeContractRef =
  "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1";
export const phase1IntegratedRouteFamilyRef = "rf_intake_self_service";
export const phase1IntegratedContinuityKey = "patient.portal.requests";
export const phase1IntegratedSurfaceBindingRef = "ASRB_050_PATIENT_PUBLIC_ENTRY_V1";

export type Phase1IntegratedRouteId =
  | "phase1_intake_get_bundle"
  | "phase1_intake_start_draft"
  | "phase1_intake_patch_draft"
  | "phase1_intake_capture_contact"
  | "phase1_intake_submit_journey"
  | "phase1_intake_get_projection"
  | "phase1_intake_advance_notification";

export interface Phase1IntegratedHttpResponse {
  statusCode: number;
  body: unknown;
}

type RequestType = "Symptoms" | "Meds" | "Admin" | "Results";
type DraftStepKey =
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
type ContactChannel = "sms" | "phone" | "email";
type ContactWindow = "weekday_daytime" | "weekday_evening" | "anytime";
type ContactAccessibilityNeed =
  | "large_text"
  | "screen_reader_support"
  | "relay_or_textphone"
  | "british_sign_language"
  | "easy_read";

interface IntegratedDraftSession {
  draftPublicId: string;
  leaseId: string;
  resumeToken: string;
  draftVersion: number;
  requestType: RequestType;
  routeTupleRef: string;
  mirroredAttachments: Map<string, string>;
  latestRequestPublicId: string | null;
  latestSettlementRef: string | null;
}

interface NormalizedBody {
  readonly [key: string]: unknown;
}

function isRecord(value: unknown): value is NormalizedBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalRecord(value: unknown): NormalizedBody | null {
  return isRecord(value) ? value : null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field.toUpperCase()}_REQUIRED`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requestTypeFrom(value: unknown): RequestType {
  return value === "Meds" || value === "Admin" || value === "Results" ? value : "Symptoms";
}

function boolFrom(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function nowIso(value: unknown): string {
  return optionalString(value) ?? new Date().toISOString();
}

function snapshotOf<TSnapshot>(value: { toSnapshot(): TSnapshot } | null | undefined): TSnapshot | null {
  return value ? value.toSnapshot() : null;
}

function requestPublicIdFromRequestRef(requestRef: string | null): string | null {
  return requestRef ? `req_${createHash("sha256").update(requestRef).digest("hex").slice(0, 20)}` : null;
}

interface LeaseSnapshotLike {
  routeFamilyRef?: string | null;
  routeIntentBindingRef?: string | null;
  audienceSurfaceRuntimeBindingRef?: string | null;
  releaseApprovalFreezeRef?: string | null;
  manifestVersionRef?: string | null;
  sessionEpochRef?: string | null;
  subjectBindingVersionRef?: string | null;
  subjectRef?: string | null;
}

function runtimeContextFromLease(lease: { toSnapshot(): LeaseSnapshotLike }) {
  const snapshot = lease.toSnapshot();
  return {
    routeFamilyRef: String(snapshot.routeFamilyRef ?? phase1IntegratedRouteFamilyRef),
    actionScope: "envelope_resume" as const,
    lineageScope: "envelope" as const,
    routeIntentBindingRef: String(snapshot.routeIntentBindingRef ?? "RIB_164_INTEGRATED_INTAKE_V1"),
    routeIntentBindingState: "live" as const,
    audienceSurfaceRuntimeBindingRef: String(
      snapshot.audienceSurfaceRuntimeBindingRef ?? phase1IntegratedSurfaceBindingRef,
    ),
    releaseApprovalFreezeRef: String(
      snapshot.releaseApprovalFreezeRef ?? "release_freeze_phase1_self_service_v1",
    ),
    channelReleaseFreezeState: "monitoring" as const,
    manifestVersionRef: String(snapshot.manifestVersionRef ?? "manifest_phase1_browser_v1"),
    sessionEpochRef: optionalString(snapshot.sessionEpochRef) ?? "session_epoch_browser_v1",
    subjectBindingVersionRef: optionalString(snapshot.subjectBindingVersionRef),
    subjectRef: optionalString(snapshot.subjectRef),
  };
}

function bodyMemory(body: NormalizedBody): NormalizedBody {
  return optionalRecord(body.memory) ?? body;
}

function structuredAnswersFrom(body: NormalizedBody): Record<string, unknown> {
  const memory = bodyMemory(body);
  const answers = optionalRecord(memory.structuredAnswers);
  return answers ? { ...answers } : {};
}

function attachmentCardsFrom(body: NormalizedBody): readonly NormalizedBody[] {
  const memory = bodyMemory(body);
  return Array.isArray(memory.attachments)
    ? memory.attachments.filter(isRecord)
    : [];
}

function contactPreferencesFrom(body: NormalizedBody): NormalizedBody | null {
  const memory = bodyMemory(body);
  return optionalRecord(body.contactPreferences) ?? optionalRecord(memory.contactPreferences);
}

function isDraftStepKey(value: unknown): value is DraftStepKey {
  return (
    value === "landing" ||
    value === "request_type" ||
    value === "details" ||
    value === "supporting_files" ||
    value === "contact_preferences" ||
    value === "review_submit" ||
    value === "resume_recovery" ||
    value === "urgent_outcome" ||
    value === "receipt_outcome" ||
    value === "request_status"
  );
}

function completedStepKeysFrom(body: NormalizedBody): readonly DraftStepKey[] {
  const memory = bodyMemory(body);
  if (!Array.isArray(memory.completedStepKeys)) {
    return ["request_type", "details", "supporting_files", "contact_preferences", "review_submit"];
  }
  return memory.completedStepKeys.filter(isDraftStepKey);
}

function draftPatchInputFrom(body: NormalizedBody, session: IntegratedDraftSession) {
  const memory = bodyMemory(body);
  const recordedAt = nowIso(body.observedAt ?? body.recordedAt);
  const candidateStepKey = optionalString(memory.currentStepKey) ?? optionalString(body.currentStepKey);
  const currentStepKey: DraftStepKey =
    isDraftStepKey(candidateStepKey)
      ? candidateStepKey
      : "review_submit";
  return {
    draftVersion: session.draftVersion,
    clientCommandId:
      optionalString(body.clientCommandId) ??
      `cmd_164_patch_${session.draftPublicId}_${session.draftVersion}`,
    idempotencyKey:
      optionalString(body.idempotencyKey) ??
      `idem_164_patch_${session.draftPublicId}_${session.draftVersion}`,
    leaseId: session.leaseId,
    resumeToken: session.resumeToken,
    structuredAnswers: structuredAnswersFrom(body),
    freeTextNarrative:
      optionalString(memory.detailNarrative) ??
      optionalString(memory.freeTextNarrative) ??
      optionalString(body.freeTextNarrative) ??
      "",
    currentStepKey,
    completedStepKeys: completedStepKeysFrom(body),
    currentPathname:
      optionalString(body.currentPathname) ??
      optionalString(memory.currentPathname) ??
      `/start-request/${session.draftPublicId}/review`,
    shellContinuityKey: phase1IntegratedContinuityKey,
    selectedAnchorKey: optionalString(body.selectedAnchorKey) ?? "request-proof",
    recordedAt,
  };
}

function mapReceiptBucket(value: string | null | undefined) {
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

function notificationPosture(input: {
  localAckState?: string;
  transportAckState?: string;
  deliveryEvidenceState?: string;
  patientPostureState?: string;
}) {
  if (input.patientPostureState === "delivery_evidenced" || input.deliveryEvidenceState === "delivered") {
    return "delivered";
  }
  if (input.transportAckState === "accepted") {
    return "delivery_pending";
  }
  if (input.patientPostureState === "recovery_required") {
    return "recovery_required";
  }
  return input.localAckState === "queued" ? "queued" : "recovery_required";
}

function contactCaptureInput(body: NormalizedBody, session: IntegratedDraftSession) {
  const preferences = contactPreferencesFrom(body) ?? {};
  const destinations = optionalRecord(preferences.destinations) ?? {};
  const quietHours = optionalRecord(preferences.quietHours) ?? {};
  const followUpPermission = preferences.followUpPermission;
  const preferredChannelCandidate = optionalString(preferences.preferredChannel);
  const preferredChannel: ContactChannel =
    preferredChannelCandidate === "phone" || preferredChannelCandidate === "email"
      ? preferredChannelCandidate
      : "sms";
  const contactWindowCandidate = optionalString(preferences.contactWindow);
  const contactWindow: ContactWindow =
    contactWindowCandidate === "weekday_evening" || contactWindowCandidate === "anytime"
      ? contactWindowCandidate
      : "weekday_daytime";
  return {
    draftPublicId: session.draftPublicId,
    preferredChannel,
    destinations: {
      sms: optionalString(destinations.sms),
      phone: optionalString(destinations.phone),
      email: optionalString(destinations.email),
    },
    contactWindow,
    voicemailAllowed: boolFrom(preferences.voicemailAllowed),
    followUpPermission:
      followUpPermission === "granted" ? true : followUpPermission === "declined" ? false : null,
    quietHours: {
      startLocalTime: optionalString(quietHours.start) ?? "20:00",
      endLocalTime: optionalString(quietHours.end) ?? "08:00",
      timezone: "Europe/London",
    },
    languagePreference:
      optionalString(preferences.languagePreference)?.toLowerCase() === "english"
        ? "en"
        : optionalString(preferences.languagePreference) ?? "en",
    translationRequired: boolFrom(preferences.translationRequired),
    accessibilityNeeds: Array.isArray(preferences.accessibilityNeeds)
      ? preferences.accessibilityNeeds.filter(
          (value): value is ContactAccessibilityNeed => typeof value === "string",
        )
      : [],
    sourceEvidenceRef: optionalString(preferences.sourceEvidenceRef) ?? "phase1_integrated_shell",
    clientCommandId:
      optionalString(body.contactClientCommandId) ?? `cmd_164_contact_${session.draftPublicId}`,
    idempotencyKey:
      optionalString(body.contactIdempotencyKey) ?? `idem_164_contact_${session.draftPublicId}`,
    recordedAt: nowIso(body.observedAt ?? body.recordedAt),
  };
}

export function isPhase1IntegratedIntakeRoute(routeId: string): routeId is Phase1IntegratedRouteId {
  return routeId.startsWith("phase1_intake_");
}

export function createPhase1IntegratedIntakeApplication(config: {
  environment: "local" | "test" | "ci" | "staging" | "production";
}) {
  const submitApp = createIntakeSubmitApplication();
  const notificationWorker = createNotificationDispatchApplication(
    {
      serviceName: "notification-worker",
      environment: config.environment,
      providerMode: "simulator",
    },
    {
      repositories: submitApp.confirmationDispatch.communicationRepositories,
      reachabilityRepositories: submitApp.confirmationDispatch.reachabilityRepositories,
    },
  );
  const sessions = new Map<string, IntegratedDraftSession>();
  const latestSubmitByDraft = new Map<string, Awaited<ReturnType<typeof submitApp.submitDraft>>>();
  const latestSubmitByRequestPublicId = new Map<
    string,
    Awaited<ReturnType<typeof submitApp.submitDraft>>
  >();

  async function sessionForDraft(draftPublicId: string): Promise<IntegratedDraftSession> {
    const existing = sessions.get(draftPublicId);
    if (existing) {
      const projection =
        await submitApp.repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
      if (projection) {
        const snapshot = projection.toSnapshot();
        existing.draftVersion = snapshot.authoritativeDraftVersion;
        existing.resumeToken = snapshot.resumeToken;
        existing.leaseId = snapshot.activeLeaseRef ?? existing.leaseId;
      }
      return existing;
    }
    throw new Error("DRAFT_SESSION_NOT_FOUND");
  }

  function routeMetadata(input: {
    draftPublicId: string;
    requestPublicId?: string | null;
    surfaceState: string;
    writablePosture: "writable" | "read_only" | "recovery_only";
    selectedAnchor: string;
    projectionTupleRefs?: readonly string[];
  }) {
    return {
      routeFamilyRef: phase1IntegratedRouteFamilyRef,
      lineageKey: input.requestPublicId ?? input.draftPublicId,
      shellContinuityKey: phase1IntegratedContinuityKey,
      writablePosture: input.writablePosture,
      selectedAnchor: input.selectedAnchor,
      surfaceState: input.surfaceState,
      authoritativeProjectionTupleRefs: input.projectionTupleRefs ?? [],
      audienceSurfaceRuntimeBindingRef: phase1IntegratedSurfaceBindingRef,
      contractRef: phase1IntegratedIntakeContractRef,
    };
  }

  async function buildNotificationTruth(requestRef: string | null) {
    if (!requestRef) {
      return null;
    }
    const envelopes =
      await submitApp.confirmationDispatch.communicationRepositories.listCommunicationEnvelopes();
    const envelope = [...envelopes]
      .reverse()
      .find((candidate) => candidate.toSnapshot().requestRef === requestRef);
    if (!envelope) {
      return null;
    }
    const envelopeSnapshot = envelope.toSnapshot();
    const bridge =
      await submitApp.confirmationDispatch.communication.getReceiptBridgeForCommunicationEnvelope(
        envelopeSnapshot.communicationEnvelopeId,
      );
    const bridgeSnapshot = bridge?.toSnapshot() ?? null;
    const transportSettlements =
      await submitApp.confirmationDispatch.communicationRepositories.listTransportSettlementsForEnvelope(
        envelopeSnapshot.communicationEnvelopeId,
      );
    const transportSettlementSnapshots = transportSettlements.map((item) => item.toSnapshot());
    const latestTransportSettlement =
      transportSettlementSnapshots[transportSettlementSnapshots.length - 1] ?? null;
    const deliveryEvidence =
      await submitApp.confirmationDispatch.communicationRepositories.listDeliveryEvidenceForEnvelope(
        envelopeSnapshot.communicationEnvelopeId,
      );
    const deliveryEvidenceSnapshots = deliveryEvidence.map((item) => item.toSnapshot());
    const latestDeliveryEvidence =
      deliveryEvidenceSnapshots[deliveryEvidenceSnapshots.length - 1] ?? null;
    const transportAckState =
      latestTransportSettlement?.outcome === "accepted"
        ? "accepted"
        : (latestTransportSettlement?.outcome ?? envelopeSnapshot.transportAckState);
    const deliveryEvidenceState =
      latestDeliveryEvidence?.deliveryEvidenceState ?? envelopeSnapshot.deliveryEvidenceState;
    return {
      communicationEnvelope: envelopeSnapshot,
      receiptBridge: bridgeSnapshot,
      transportSettlements: transportSettlementSnapshots,
      deliveryEvidence: deliveryEvidenceSnapshots,
      patientCommunicationPosture: notificationPosture({
        localAckState: envelopeSnapshot.localAckState,
        transportAckState,
        deliveryEvidenceState,
        patientPostureState: bridgeSnapshot?.patientPostureState,
      }),
      truthLadder: [
        "local_ack_queued",
        transportAckState,
        deliveryEvidenceState,
        bridgeSnapshot?.authoritativeOutcomeState ?? "receipt_bridge_pending",
      ],
    };
  }

  async function buildProjection(result: Awaited<ReturnType<typeof submitApp.submitDraft>>) {
    const requestPublicId = requestPublicIdFromRequestRef(result.requestRef);
    const notification = await buildNotificationTruth(result.requestRef);
    const receipt = result.receiptConsistencyEnvelope
      ? {
          ...result.receiptConsistencyEnvelope,
          receiptBucket: mapReceiptBucket(result.receiptConsistencyEnvelope.receiptBucket),
          communicationPosture:
            notification?.patientCommunicationPosture ?? "queued",
        }
      : null;
    return {
      decisionClass: result.decisionClass,
      replayed: result.replayed,
      requestPublicId,
      requestRef: result.requestRef,
      requestLineageRef: result.requestLineageRef,
      settlement: snapshotOf(result.settlement),
      transitionEnvelope: result.transitionEnvelope,
      outcomeTuple: result.outcomeTuple,
      urgentDiversionSettlement: result.urgentDiversionSettlement,
      receiptConsistencyEnvelope: receipt,
      patientStatusProjection: result.patientStatusProjection,
      triageTask: result.triageTask,
      triageEtaForecast: result.triageEtaForecast,
      outboundNavigationGrant: result.outboundNavigationGrant,
      notification,
      routeMetadata: routeMetadata({
        draftPublicId: result.settlement.toSnapshot().draftPublicId,
        requestPublicId,
        surfaceState:
          result.outcomeTuple?.outcomeResult === "urgent_diversion"
            ? "urgent_diversion"
            : result.receiptConsistencyEnvelope
              ? "routine_receipt"
              : result.decisionClass,
        writablePosture:
          result.decisionClass === "new_lineage" || result.replayed ? "read_only" : "recovery_only",
        selectedAnchor:
          result.outcomeTuple?.outcomeResult === "urgent_diversion"
            ? "urgent-outcome"
            : "receipt-outcome",
        projectionTupleRefs: [
          result.settlement.intakeSubmitSettlementId,
          result.receiptConsistencyEnvelope?.consistencyEnvelopeId ?? "",
          notification?.communicationEnvelope.communicationEnvelopeId ?? "",
        ].filter(Boolean),
      }),
      reasonCodes: result.reasonCodes,
      eventTypes: result.events.map((event) => event.eventType),
    };
  }

  async function patchDraft(body: NormalizedBody) {
    const draftPublicId = requiredString(body.draftPublicId ?? bodyMemory(body).draftPublicId, "draftPublicId");
    const session = await sessionForDraft(draftPublicId);
    const lease = await submitApp.repositories.getDraftLease(session.leaseId);
    if (!lease) {
      throw new Error("DRAFT_LEASE_NOT_FOUND");
    }
    const patched = await submitApp.drafts.patchDraft(
      draftPublicId,
      draftPatchInputFrom(body, session),
      runtimeContextFromLease(lease),
    );
    session.draftVersion = patched.view.draftVersion;
    session.resumeToken = patched.view.resumeToken;
    const projection =
      await submitApp.repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
    session.leaseId = projection?.toSnapshot().activeLeaseRef ?? session.leaseId;
    return {
      draft: patched.view,
      replayed: patched.replayed,
      saveSettlement: snapshotOf(patched.saveSettlement),
      mergePlan: snapshotOf(patched.mergePlan),
      recoveryRecord: snapshotOf(patched.recoveryRecord),
      routeMetadata: routeMetadata({
        draftPublicId,
        surfaceState: "draft_autosave",
        writablePosture: patched.saveSettlement.toSnapshot().ackState === "saved_authoritative"
          ? "writable"
          : "recovery_only",
        selectedAnchor: "request-proof",
        projectionTupleRefs: [patched.saveSettlement.settlementId],
      }),
      integratedSession: {
        draftPublicId,
        leaseId: session.leaseId,
        resumeToken: session.resumeToken,
        draftVersion: session.draftVersion,
      },
    };
  }

  async function mirrorAttachments(body: NormalizedBody, session: IntegratedDraftSession) {
    const cards = attachmentCardsFrom(body).filter((card) => card.keptInDraft !== false);
    for (const card of cards) {
      const clientRef = requiredString(card.attachmentRef, "attachmentRef");
      if (session.mirroredAttachments.has(clientRef)) {
        continue;
      }
      const initiated = await submitApp.attachmentApp.initiateAttachmentUpload({
        draftPublicId: session.draftPublicId,
        fileName: optionalString(card.filename) ?? "supporting-evidence.pdf",
        declaredMimeType: optionalString(card.mimeType) ?? "application/pdf",
        byteSize: Number(card.sizeBytes) > 0 ? Number(card.sizeBytes) : 1024,
        initiatedAt: nowIso(body.observedAt ?? card.stateUpdatedAt),
        clientUploadId: clientRef,
      });
      if (!initiated.uploadSession) {
        session.mirroredAttachments.set(clientRef, initiated.attachment.attachmentPublicId);
        continue;
      }
      await submitApp.attachmentApp.recordAttachmentUpload({
        uploadSessionId: initiated.uploadSession.uploadSessionId,
        fileName: optionalString(card.filename) ?? "supporting-evidence.pdf",
        reportedMimeType: optionalString(card.mimeType) ?? "application/pdf",
        bytes: Buffer.from(`phase1-integrated-attachment::${clientRef}`),
        uploadedAt: nowIso(body.observedAt ?? card.stateUpdatedAt),
      });
      await submitApp.attachmentApp.runAttachmentWorker({
        now: nowIso(body.observedAt ?? card.stateUpdatedAt),
      });
      session.mirroredAttachments.set(clientRef, initiated.attachment.attachmentPublicId);
    }
  }

  return {
    submitApp,
    notificationWorker,
    async getBundle() {
      return {
        contractRef: phase1IntegratedIntakeContractRef,
        routeFamilyRef: phase1IntegratedRouteFamilyRef,
        shellContinuityKey: phase1IntegratedContinuityKey,
        gatewayRoutes: [
          "/phase1/intake/bundle",
          "/phase1/intake/start",
          "/phase1/intake/patch",
          "/phase1/intake/contact",
          "/phase1/intake/submit",
          "/phase1/intake/projection",
          "/phase1/intake/notifications/advance",
        ],
        settlementCapabilities: [
          "draft_created",
          "draft_autosaved",
          "attachments_quarantined_then_promoted",
          "contact_preferences_captured",
          "submit_settled",
          "urgent_diversion_or_routine_receipt",
          "notification_queued_then_worker_processed",
          "stale_promoted_draft_recovered",
        ],
      };
    },
    async startDraft(body: NormalizedBody) {
      const requestType = requestTypeFrom(body.requestType ?? bodyMemory(body).requestType);
      const created = await submitApp.drafts.createDraft({
        requestType,
        surfaceChannelProfile: "browser",
        routeEntryRef: "phase1_intake_entry",
        createdAt: nowIso(body.observedAt ?? body.createdAt),
        sessionEpochRef: "session_epoch_browser_v1",
      });
      const session: IntegratedDraftSession = {
        draftPublicId: created.view.draftPublicId,
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        draftVersion: created.view.draftVersion,
        requestType,
        routeTupleRef: "RIB_164_INTEGRATED_INTAKE_V1",
        mirroredAttachments: new Map(),
        latestRequestPublicId: null,
        latestSettlementRef: null,
      };
      sessions.set(session.draftPublicId, session);
      return {
        draft: created.view,
        lease: snapshotOf(created.lease),
        continuityProjection: snapshotOf(created.continuityProjection),
        accessGrant: snapshotOf(created.accessGrant),
        routeMetadata: routeMetadata({
          draftPublicId: session.draftPublicId,
          surfaceState: "draft_started",
          writablePosture: "writable",
          selectedAnchor: "request-start",
          projectionTupleRefs: [created.envelope.envelopeId, created.lease.leaseId],
        }),
        integratedSession: {
          draftPublicId: session.draftPublicId,
          leaseId: session.leaseId,
          resumeToken: session.resumeToken,
          draftVersion: session.draftVersion,
        },
        eventTypes: created.events.map((event) => event.eventType),
      };
    },
    patchDraft,
    async captureContactPreferences(body: NormalizedBody) {
      const draftPublicId = requiredString(body.draftPublicId ?? bodyMemory(body).draftPublicId, "draftPublicId");
      const session = await sessionForDraft(draftPublicId);
      const captured = await submitApp.contactPreferenceApp.captureContactPreferences(
        contactCaptureInput(body, session),
      );
      return {
        replayed: captured.replayed,
        capture: snapshotOf(captured.capture),
        maskedView: snapshotOf(captured.maskedView),
        routeSnapshotSeed: snapshotOf(captured.routeSnapshotSeed),
        validationSummary:
          await submitApp.contactPreferenceApp.buildContactPreferenceValidationSummary(draftPublicId),
        routeMetadata: routeMetadata({
          draftPublicId,
          surfaceState: "contact_preferences_captured",
          writablePosture: "writable",
          selectedAnchor: "contact-plan",
          projectionTupleRefs: [captured.capture.contactPreferenceCaptureId],
        }),
      };
    },
    async submitJourney(body: NormalizedBody) {
      const draftPublicId = requiredString(body.draftPublicId ?? bodyMemory(body).draftPublicId, "draftPublicId");
      const session = await sessionForDraft(draftPublicId);
      await patchDraft(body);
      await mirrorAttachments(body, session);
      await submitApp.contactPreferenceApp.captureContactPreferences(contactCaptureInput(body, session));
      submitApp.validation.seedUrgentDecisionState(draftPublicId, "clear");
      submitApp.validation.seedConvergenceState(draftPublicId, "valid");
      const projection =
        await submitApp.repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
      if (!projection) {
        throw new Error("DRAFT_PROJECTION_NOT_FOUND");
      }
      const snapshot = projection.toSnapshot();
      const result = await submitApp.submitDraft({
        draftPublicId,
        draftVersion: snapshot.authoritativeDraftVersion,
        leaseId: snapshot.activeLeaseRef ?? session.leaseId,
        resumeToken: snapshot.resumeToken,
        clientCommandId: optionalString(body.clientCommandId) ?? `cmd_164_submit_${draftPublicId}`,
        idempotencyKey: optionalString(body.idempotencyKey) ?? `idem_164_submit_${draftPublicId}`,
        sourceCommandId: optionalString(body.sourceCommandId) ?? `source_164_submit_${draftPublicId}`,
        transportCorrelationId:
          optionalString(body.transportCorrelationId) ?? `transport_164_submit_${draftPublicId}`,
        intentGeneration: Number(body.intentGeneration) > 0 ? Number(body.intentGeneration) : 1,
        observedAt: nowIso(body.observedAt),
      });
      const requestPublicId = requestPublicIdFromRequestRef(result.requestRef);
      session.latestRequestPublicId = requestPublicId;
      session.latestSettlementRef = result.settlement.intakeSubmitSettlementId;
      latestSubmitByDraft.set(draftPublicId, result);
      if (requestPublicId) {
        latestSubmitByRequestPublicId.set(requestPublicId, result);
      }
      return buildProjection(result);
    },
    async getProjection(searchParams: URLSearchParams) {
      const draftPublicId = searchParams.get("draftPublicId");
      const requestPublicId = searchParams.get("requestPublicId");
      const result =
        (draftPublicId ? latestSubmitByDraft.get(draftPublicId) : undefined) ??
        (requestPublicId ? latestSubmitByRequestPublicId.get(requestPublicId) : undefined);
      if (!result) {
        return {
          routeMetadata: routeMetadata({
            draftPublicId: draftPublicId ?? "unknown",
            requestPublicId,
            surfaceState: "projection_missing",
            writablePosture: "recovery_only",
            selectedAnchor: "recovery",
          }),
          reasonCodes: ["PHASE1_INTEGRATED_PROJECTION_NOT_FOUND"],
        };
      }
      return buildProjection(result);
    },
    async advanceNotification(body: NormalizedBody, correlation: EdgeCorrelationContext) {
      const requestPublicId = optionalString(body.requestPublicId);
      const result = requestPublicId ? latestSubmitByRequestPublicId.get(requestPublicId) : null;
      const requestRef = optionalString(body.requestRef) ?? result?.requestRef ?? null;
      const notification = await buildNotificationTruth(requestRef);
      if (!notification) {
        throw new Error("NOTIFICATION_ENVELOPE_NOT_FOUND");
      }
      if (notification.communicationEnvelope.dispatchEligibilityState !== "dispatchable") {
        await notificationWorker.communication.refreshRouteTruth({
          communicationEnvelopeRef: notification.communicationEnvelope.communicationEnvelopeId,
          currentContactRouteSnapshotRef:
            notification.communicationEnvelope.currentContactRouteSnapshotRef,
          currentReachabilityAssessmentRef:
            notification.communicationEnvelope.currentReachabilityAssessmentRef,
          routeAuthorityState: "current",
          reachabilityAssessmentState: "clear",
          deliveryRiskState: "on_track",
          recordedAt: nowIso(body.recordedAt),
          reasonCodes: ["PHASE1_INTEGRATED_SIMULATOR_ROUTE_TRUTH_REFRESHED"],
        });
      }
      const processed = await notificationWorker.processQueuedConfirmation({
        communicationEnvelopeRef: notification.communicationEnvelope.communicationEnvelopeId,
        transportSettlementKey:
          optionalString(body.transportSettlementKey) ??
          `transport_164_${notification.communicationEnvelope.communicationEnvelopeId}`,
        workerRunRef: optionalString(body.workerRunRef) ?? "worker_run_164_integrated",
        transportOutcome:
          body.transportOutcome === "rejected" || body.transportOutcome === "timed_out"
            ? body.transportOutcome
            : "accepted",
        providerCorrelationRef:
          optionalString(body.providerCorrelationRef) ?? "provider_164_simulated_acceptance",
        recordedAt: nowIso(body.recordedAt),
        correlation,
      });
      const delivered = body.deliveryEvidence === true
        ? await notificationWorker.ingestConfirmationWebhook({
            communicationEnvelopeRef: notification.communicationEnvelope.communicationEnvelopeId,
            deliveryEvidenceKey:
              optionalString(body.deliveryEvidenceKey) ??
              `delivery_164_${notification.communicationEnvelope.communicationEnvelopeId}`,
            webhookScenario: "delivered",
            providerCorrelationRef:
              optionalString(body.providerCorrelationRef) ?? "provider_164_simulated_acceptance",
            observedAt: nowIso(body.observedAt),
            recordedAt: nowIso(body.recordedAt),
            correlation,
          })
        : null;
      return {
        processed,
        delivered,
        notification: await buildNotificationTruth(requestRef),
      };
    },
  };
}

export async function buildPhase1IntegratedIntakeResponse(
  application: ReturnType<typeof createPhase1IntegratedIntakeApplication>,
  routeId: Phase1IntegratedRouteId,
  body: unknown,
  searchParams: URLSearchParams,
  correlation: EdgeCorrelationContext,
): Promise<Phase1IntegratedHttpResponse> {
  const requestBody = optionalRecord(body) ?? {};
  switch (routeId) {
    case "phase1_intake_get_bundle":
      return { statusCode: 200, body: await application.getBundle() };
    case "phase1_intake_start_draft":
      return { statusCode: 201, body: await application.startDraft(requestBody) };
    case "phase1_intake_patch_draft":
      return { statusCode: 200, body: await application.patchDraft(requestBody) };
    case "phase1_intake_capture_contact":
      return { statusCode: 200, body: await application.captureContactPreferences(requestBody) };
    case "phase1_intake_submit_journey":
      return { statusCode: 200, body: await application.submitJourney(requestBody) };
    case "phase1_intake_get_projection":
      return { statusCode: 200, body: await application.getProjection(searchParams) };
    case "phase1_intake_advance_notification":
      return {
        statusCode: 200,
        body: await application.advanceNotification(requestBody, correlation),
      };
  }
}
