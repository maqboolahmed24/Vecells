import { createHash } from "node:crypto";
import { buildTransitionEnvelope, type TransitionEnvelope } from "@vecells/api-contracts";
import {
  CommandActionRecordDocument,
  CommandSettlementRecordDocument,
  createCommandSettlementStore,
  createDraftAutosaveStore,
  createDraftSessionAutosaveService,
  createSubmissionBackboneCommandService,
  type DraftAutosaveDependencies,
  type DraftContinuityEvidenceProjectionDocument,
  type DraftSessionLeaseDocument,
} from "@vecells/domain-identity-access";
import {
  buildPhase1OutcomeArtifactId,
  createNormalizedSubmissionService,
  type IntakeOutcomePresentationArtifactSnapshot,
  buildSubmitNormalizationSeedDigest,
  buildSubmitReplaySemanticFingerprint,
  type OutcomeNavigationGrantSnapshot,
  type PatientReceiptConsistencyEnvelopeSnapshot,
  type Phase1OutcomeTupleSnapshot,
  createSubmissionPromotionTransactionStore,
  IntakeSubmitSettlementDocument,
  NormalizedSubmissionDocument,
  SubmissionSnapshotFreezeDocument,
  SubmitNormalizationSeedDocument,
  normalizedSubmissionVersionRef,
  type Phase1SubmitDecisionClass,
  type SubmissionAttachmentStateView,
  type SubmissionEnvelopeValidationVerdict,
  type ContactPreferenceValidationSummary,
} from "../../../packages/domains/intake_request/src/index";
import type {
  EvidenceClassificationDecisionSnapshot,
  PersistedUrgentDiversionSettlementRow,
  SafetyDecisionRecordSnapshot,
  SafetyPreemptionRecordSnapshot,
} from "@vecells/domain-intake-safety";
import type {
  PreviousReceiptEnvelopeSummary,
  Phase1PatientStatusProjectionSnapshot,
  Phase1TriageEtaForecastSnapshot,
  Phase1TriageTaskSnapshot,
} from "@vecells/domain-triage-workspace";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  emitIntakeNormalized,
  emitRequestSnapshotCreated,
  emitRequestSafetyClassified,
  emitRequestSafetyDecided,
  emitRequestSafetyPreempted,
  emitRequestSafetyUrgentDiversionRequired,
  makeFoundationEvent,
  type SubmissionLineageEventEnvelope,
} from "@vecells/event-contracts";
import { createAttachmentScanSimulator } from "../../adapter-simulators/src/attachment-scan-simulator";
import { createConfirmationDispatchApplication } from "./confirmation-dispatch";
import { createContactPreferenceApplication } from "./contact-preference";
import { createEvidenceBackboneApplication } from "./evidence-backbone";
import { createIntakeAttachmentApplication } from "./intake-attachment";
import { createIntakeOutcomeApplication } from "./intake-outcome";
import { createIntakeTriageApplication } from "./intake-triage";
import { createReplayCollisionApplication } from "./replay-collision-authority";
import { createSubmissionEnvelopeValidationApplication } from "./submission-envelope-validation";
import { createSynchronousSafetyApplication } from "./synchronous-safety";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

invariant(
  normalizedSubmissionVersionRef === "PHASE1_NORMALIZED_SUBMISSION_V1",
  "Normalized submission version drifted from the par_149 contract.",
);

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function addMinutes(timestamp: string, minutes: number): string {
  return new Date(Date.parse(timestamp) + minutes * 60_000).toISOString();
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextLocalId(seed: string, counters: Map<string, number>, kind: string): string {
  const next = (counters.get(kind) ?? 0) + 1;
  counters.set(kind, next);
  return `${seed}_${kind}_${String(next).padStart(4, "0")}`;
}

function toRequestPublicId(requestRef: string | null): string | null {
  return requestRef ? `req_${Buffer.from(requestRef, "utf8").toString("base64url").slice(0, 12)}` : null;
}

function createRouteIntentTupleHash(input: {
  routeFamilyRef: string;
  routeIntentBindingRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: string;
  manifestVersionRef: string;
  sessionEpochRef?: string | null;
}): string {
  return sha256Hex({
    routeFamilyRef: input.routeFamilyRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    audienceSurfaceRuntimeBindingRef: input.audienceSurfaceRuntimeBindingRef,
    releaseApprovalFreezeRef: input.releaseApprovalFreezeRef,
    channelReleaseFreezeState: input.channelReleaseFreezeState,
    manifestVersionRef: input.manifestVersionRef,
    sessionEpochRef: optionalRef(input.sessionEpochRef),
  });
}

function buildExpectedEffectSetHash(expectedEffectSetRefs: readonly string[]): string {
  return sha256Hex(uniqueSorted(expectedEffectSetRefs));
}

function mapReplayDecisionClass(
  decisionClass: Phase1SubmitDecisionClass,
): "distinct" | "exact_replay" | "semantic_replay" | "collision_review" {
  if (decisionClass === "exact_replay") {
    return "exact_replay";
  }
  if (decisionClass === "semantic_replay") {
    return "semantic_replay";
  }
  if (decisionClass === "collision_review") {
    return "collision_review";
  }
  return "distinct";
}

function resolveContactAuthorityPolicyRef(
  state: SubmissionEnvelopeValidationVerdict["submitReadiness"]["contactAuthorityState"],
): string {
  if (state === "assumed_self_service_browser_minimum") {
    return "GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1";
  }
  if (state === "verified") {
    return "PHASE1_CONTACT_AUTHORITY_VERIFIED_V1";
  }
  if (state === "rebind_required") {
    return "PARALLEL_INTERFACE_GAP_145_EMBEDDED_CONTACT_AUTHORITY_DEFERRED";
  }
  return "PHASE1_CONTACT_AUTHORITY_BLOCKED_V1";
}

function buildSubmitTransitionEnvelope(input: {
  action: CommandActionRecordDocument;
  settlement: CommandSettlementRecordDocument;
  entityRef: string;
  targetIntent: string;
  localAckState: "queued" | "local_ack" | "optimistic_applied" | "superseded";
  settlementPolicy: "projection_token" | "external_ack" | "manual_review";
  userVisibleMessage?: string;
}): TransitionEnvelope {
  const actionSnapshot = input.action.toSnapshot();
  const settlementSnapshot = input.settlement.toSnapshot();
  return buildTransitionEnvelope({
    settlement: settlementSnapshot,
    entityRef: input.entityRef,
    commandRef: actionSnapshot.actionRecordId,
    affectedAnchorRef: actionSnapshot.parentAnchorRef,
    originState: actionSnapshot.actionScope,
    targetIntent: input.targetIntent,
    localAckState: input.localAckState,
    causalToken: actionSnapshot.causalToken,
    settlementPolicy: input.settlementPolicy,
    userVisibleMessage: input.userVisibleMessage,
    visibleScope: "active_shell",
    startedAt: actionSnapshot.createdAt,
    lastSafeAnchorRef: settlementSnapshot.lastSafeAnchorRef ?? actionSnapshot.parentAnchorRef,
    allowedSummaryTier: settlementSnapshot.allowedSummaryTier,
  });
}

export interface SubmitDraftCommand {
  draftPublicId: string;
  draftVersion: number;
  leaseId: string;
  resumeToken: string;
  clientCommandId: string;
  idempotencyKey: string;
  sourceCommandId?: string;
  transportCorrelationId?: string;
  intentGeneration?: number;
  observedAt: string;
}

export interface IntakeSubmitCommandResult {
  decisionClass: Phase1SubmitDecisionClass;
  replayed: boolean;
  settlement: IntakeSubmitSettlementDocument;
  transitionEnvelope: TransitionEnvelope;
  commandAction: CommandActionRecordDocument | null;
  commandSettlement: CommandSettlementRecordDocument | null;
  submissionSnapshotFreeze: SubmissionSnapshotFreezeDocument | null;
  normalizedSubmission: NormalizedSubmissionDocument | null;
  normalizationSeed: SubmitNormalizationSeedDocument | null;
  evidenceClassification: EvidenceClassificationDecisionSnapshot | null;
  safetyPreemption: SafetyPreemptionRecordSnapshot | null;
  safetyDecision: SafetyDecisionRecordSnapshot | null;
  urgentDiversionSettlement: PersistedUrgentDiversionSettlementRow | null;
  outcomeTuple: Phase1OutcomeTupleSnapshot | null;
  outcomePresentationArtifact: IntakeOutcomePresentationArtifactSnapshot | null;
  receiptConsistencyEnvelope: PatientReceiptConsistencyEnvelopeSnapshot | null;
  outboundNavigationGrant: OutcomeNavigationGrantSnapshot | null;
  triageTask: Phase1TriageTaskSnapshot | null;
  triageEtaForecast: Phase1TriageEtaForecastSnapshot | null;
  patientStatusProjection: Phase1PatientStatusProjectionSnapshot | null;
  evidenceCaptureBundleRef: string | null;
  evidenceSnapshotRef: string | null;
  requestRef: string | null;
  requestLineageRef: string | null;
  promotionRecordRef: string | null;
  reasonCodes: readonly string[];
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface IntakeSubmitApplication {
  readonly repositories: DraftAutosaveDependencies;
  readonly drafts: ReturnType<typeof createDraftSessionAutosaveService>;
  readonly attachmentApp: ReturnType<typeof createIntakeAttachmentApplication>;
  readonly contactPreferenceApp: ReturnType<typeof createContactPreferenceApplication>;
  readonly confirmationDispatch: ReturnType<typeof createConfirmationDispatchApplication>;
  readonly validation: ReturnType<typeof createSubmissionEnvelopeValidationApplication>;
  readonly evidence: ReturnType<typeof createEvidenceBackboneApplication>;
  readonly synchronousSafety: ReturnType<typeof createSynchronousSafetyApplication>;
  readonly outcomes: ReturnType<typeof createIntakeOutcomeApplication>;
  readonly triage: ReturnType<typeof createIntakeTriageApplication>;
  readonly replay: ReturnType<typeof createReplayCollisionApplication>;
  readonly transactionRepositories: ReturnType<typeof createSubmissionPromotionTransactionStore>;
  readonly commandRepositories: ReturnType<typeof createCommandSettlementStore>;
  readonly migrationPlanRef: "services/command-api/migrations/085_phase1_submission_snapshot_freeze_and_promotion.sql";
  readonly migrationPlanRefs: readonly string[];
  submitDraft(input: SubmitDraftCommand): Promise<IntakeSubmitCommandResult>;
}

function buildSubmitRawPayload(input: {
  projection: DraftContinuityEvidenceProjectionDocument;
  validationVerdict: SubmissionEnvelopeValidationVerdict;
  contactSummary: ContactPreferenceValidationSummary | undefined;
  attachmentStates: readonly SubmissionAttachmentStateView[];
}) {
  const projectionSnapshot = input.projection.toSnapshot();
  return {
    envelopeRef: projectionSnapshot.envelopeRef,
    draftPublicId: projectionSnapshot.draftPublicId,
    draftVersion: projectionSnapshot.authoritativeDraftVersion,
    requestType: projectionSnapshot.requestType,
    structuredAnswers: projectionSnapshot.structuredAnswers,
    freeTextNarrative: projectionSnapshot.freeTextNarrative.trim(),
    attachmentRefs: uniqueSorted(projectionSnapshot.attachmentRefs),
    attachmentStates: input.attachmentStates,
    contactSummary: input.contactSummary ?? null,
    latestMutationRef: projectionSnapshot.latestMutationRef,
    latestSettlementRef: projectionSnapshot.latestSettlementRef,
    latestMergePlanRef: projectionSnapshot.latestMergePlanRef,
    normalizedSubmissionCandidate: input.validationVerdict.normalizedSubmissionCandidate,
  };
}

function buildSubmitSemanticPayload(input: {
  projection: DraftContinuityEvidenceProjectionDocument;
  validationVerdict: SubmissionEnvelopeValidationVerdict;
  contactSummary: ContactPreferenceValidationSummary | undefined;
  attachmentStates: readonly SubmissionAttachmentStateView[];
}) {
  const projectionSnapshot = input.projection.toSnapshot();
  return {
    envelopeRef: projectionSnapshot.envelopeRef,
    sourceLineageRef: projectionSnapshot.envelopeRef,
    requestType: projectionSnapshot.requestType,
    activeStructuredAnswers: input.validationVerdict.activeStructuredAnswers,
    freeTextNarrative: projectionSnapshot.freeTextNarrative.trim(),
    attachmentRefs: uniqueSorted(projectionSnapshot.attachmentRefs),
    contactPreferencesRef: input.contactSummary?.contactPreferencesRef ?? null,
    routeIntentBindingRef:
      input.contactSummary?.routeSnapshotSeedRef ?? projectionSnapshot.selectedAnchorKey,
    normalizedSubmissionCandidate: input.validationVerdict.normalizedSubmissionCandidate,
    attachmentStates: input.attachmentStates.map((state) => ({
      attachmentRef: state.attachmentRef,
      submitDisposition: state.submitDisposition,
      documentReferenceState: state.documentReferenceState,
    })),
  };
}

function buildSourceArtifactPayload(input: {
  projection: DraftContinuityEvidenceProjectionDocument;
  validationVerdict: SubmissionEnvelopeValidationVerdict;
  contactSummary: ContactPreferenceValidationSummary | undefined;
  attachmentStates: readonly SubmissionAttachmentStateView[];
  routeTuple: {
    routeFamilyRef: string;
    routeIntentBindingRef: string;
    audienceSurfaceRuntimeBindingRef: string;
    releaseApprovalFreezeRef: string;
    channelReleaseFreezeState: string;
    manifestVersionRef: string;
    sessionEpochRef?: string | null;
  };
}) {
  const snapshot = input.projection.toSnapshot();
  return {
    envelopeRef: snapshot.envelopeRef,
    draftPublicId: snapshot.draftPublicId,
    draftVersion: snapshot.authoritativeDraftVersion,
    requestType: snapshot.requestType,
    activeQuestionKeys: input.validationVerdict.activeQuestionKeys,
    activeStructuredAnswers: input.validationVerdict.activeStructuredAnswers,
    freeTextNarrative: snapshot.freeTextNarrative,
    normalizedSubmissionCandidate: input.validationVerdict.normalizedSubmissionCandidate,
    attachmentRefs: uniqueSorted(snapshot.attachmentRefs),
    attachmentStates: input.attachmentStates,
    contactSummary: input.contactSummary ?? null,
    routeTuple: input.routeTuple,
    validationVerdictHash: input.validationVerdict.verdictHash,
  };
}

function buildCommandActionRecord(input: {
  actionRecordId: string;
  envelopeRef: string;
  routeFamilyRef: string;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  audienceSurfaceRuntimeBindingRef: string;
  releaseApprovalFreezeRef: string;
  manifestVersionRef: string;
  parentAnchorRef: string;
  edgeCorrelationId: string;
  sourceCommandId: string;
  transportCorrelationId: string;
  semanticPayloadHash: string;
  idempotencyKey: string;
  idempotencyRecordRef: string;
  expectedEffectSetHash: string;
  createdAt: string;
}): CommandActionRecordDocument {
  return CommandActionRecordDocument.create({
    actionRecordId: input.actionRecordId,
    actionScope: "phase1_intake_submit",
    governingObjectRef: input.envelopeRef,
    canonicalObjectDescriptorRef: "SubmissionEnvelope",
    initiatingBoundedContextRef: "intake_request",
    governingBoundedContextRef: "intake_request",
    governingObjectVersionRef: `${input.envelopeRef}@promotion_boundary_v1`,
    lineageScope: "envelope",
    routeIntentRef: input.routeIntentBindingRef,
    routeContractDigestRef: `${input.routeFamilyRef}::${input.manifestVersionRef}`,
    requiredContextBoundaryRefs: [],
    parentAnchorRef: input.parentAnchorRef,
    routeIntentTupleHash: input.routeIntentTupleHash,
    edgeCorrelationId: input.edgeCorrelationId,
    initiatingUiEventRef: input.sourceCommandId,
    initiatingUiEventCausalityFrameRef: `${input.edgeCorrelationId}::frame`,
    actingContextRef: "patient_self_service",
    policyBundleRef: "PHASE1_INTAKE_SUBMIT_PROMOTION_POLICY_V1",
    sourceCommandId: input.sourceCommandId,
    transportCorrelationId: input.transportCorrelationId,
    semanticPayloadHash: input.semanticPayloadHash,
    idempotencyKey: input.idempotencyKey,
    idempotencyRecordRef: input.idempotencyRecordRef,
    commandFollowingTokenRef: `${input.actionRecordId}::follow`,
    expectedEffectSetHash: input.expectedEffectSetHash,
    causalToken: `${input.actionRecordId}::cause`,
    createdAt: input.createdAt,
    settledAt: input.createdAt,
    supersedesActionRecordRef: null,
    lineageFenceEpoch: 1,
  });
}

function buildCommandSettlementRecord(input: {
  settlementId: string;
  actionRecordRef: string;
  decisionClass: Phase1SubmitDecisionClass;
  result:
    | "applied"
    | "review_required"
    | "stale_recoverable"
    | "blocked_policy";
  authoritativeOutcomeState:
    | "settled"
    | "review_required"
    | "stale_recoverable"
    | "recovery_required";
  proofClass: "projection_visible" | "review_disposition" | "recovery_disposition";
  recordedAt: string;
  projectionVisibilityRef?: string | null;
  sameShellRecoveryRef?: string | null;
  lastSafeAnchorRef?: string | null;
  blockingRefs?: readonly string[];
  allowedSummaryTier?: string | null;
  quietEligibleAt?: string | null;
  staleAfterAt?: string | null;
  auditRecordRef: string;
}): CommandSettlementRecordDocument {
  return CommandSettlementRecordDocument.create({
    settlementId: input.settlementId,
    actionRecordRef: input.actionRecordRef,
    replayDecisionClass: mapReplayDecisionClass(input.decisionClass),
    result: input.result,
    processingAcceptanceState:
      input.result === "applied" ? "externally_accepted" : "not_started",
    externalObservationState:
      input.result === "applied"
        ? "projection_visible"
        : input.result === "review_required"
          ? "review_disposition_observed"
          : "recovery_observed",
    authoritativeOutcomeState: input.authoritativeOutcomeState,
    authoritativeProofClass: input.proofClass,
    settlementRevision: 1,
    supersedesSettlementRef: null,
    externalEffectRefs: [],
    sameShellRecoveryRef: optionalRef(input.sameShellRecoveryRef),
    projectionVersionRef: null,
    uiTransitionSettlementRef: null,
    projectionVisibilityRef: optionalRef(input.projectionVisibilityRef),
    auditRecordRef: input.auditRecordRef,
    blockingRefs: uniqueSorted(input.blockingRefs ?? []),
    quietEligibleAt: optionalRef(input.quietEligibleAt),
    staleAfterAt: optionalRef(input.staleAfterAt),
    lastSafeAnchorRef: optionalRef(input.lastSafeAnchorRef),
    allowedSummaryTier: optionalRef(input.allowedSummaryTier),
    recordedAt: input.recordedAt,
  });
}

export function createIntakeSubmitApplication(options?: {
  repositories?: DraftAutosaveDependencies;
  communicationRepositories?: ReturnType<
    typeof createConfirmationDispatchApplication
  >["communicationRepositories"];
}) {
  const repositories = options?.repositories ?? createDraftAutosaveStore();
  const attachmentApp = createIntakeAttachmentApplication({
    repositories,
    scanner: createAttachmentScanSimulator(),
  });
  const contactPreferenceApp = createContactPreferenceApplication({
    repositories,
  });
  const confirmationDispatch = createConfirmationDispatchApplication({
    communicationRepositories: options?.communicationRepositories,
    reachabilityRepositories: contactPreferenceApp.repositories,
    contactPreferenceRepositories: contactPreferenceApp.contactPreferenceRepositories,
  });
  const validation = createSubmissionEnvelopeValidationApplication({
    repositories,
    attachmentStateResolver: async ({ draftPublicId }) =>
      attachmentApp.buildSubmissionAttachmentStates(draftPublicId),
    contactPreferenceResolver: async ({ draftPublicId }) =>
      contactPreferenceApp.buildContactPreferenceValidationSummary(draftPublicId),
  });
  const evidence = createEvidenceBackboneApplication();
  const synchronousSafety = createSynchronousSafetyApplication({
    evidenceBackbone: evidence.repositories,
  });
  const outcomes = createIntakeOutcomeApplication({
    urgentDiversionRepositories: synchronousSafety.repositories,
  });
  const triage = createIntakeTriageApplication();
  const replay = createReplayCollisionApplication();
  const normalizedSubmissionService = createNormalizedSubmissionService();
  const commandRepositories = createCommandSettlementStore();
  const transactionRepositories = createSubmissionPromotionTransactionStore();
  const drafts = createDraftSessionAutosaveService(repositories);
  const submissionCommands = createSubmissionBackboneCommandService(
    repositories,
    createDeterministicBackboneIdGenerator("command_api_intake_submit_submission"),
  );
  const localCounters = new Map<string, number>();

  async function requireProjection(
    draftPublicId: string,
  ): Promise<DraftContinuityEvidenceProjectionDocument> {
    const projection = await repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
    invariant(!!projection, `Draft projection not found for ${draftPublicId}.`);
    return projection;
  }

  async function requireLease(leaseId: string): Promise<DraftSessionLeaseDocument> {
    const lease = await repositories.getDraftLease(leaseId);
    invariant(!!lease, `Draft lease not found for ${leaseId}.`);
    return lease;
  }

  function buildRecoveryRoute(draftPublicId: string): string {
    return `/intake/drafts/${draftPublicId}/recover`;
  }

  function buildAuthoritativeRequestRoute(requestPublicId: string | null, requestRef: string): string {
    return `/requests/${requestPublicId ?? requestRef}`;
  }

  async function buildOutcomeChain(
    intakeSubmitSettlementRef: string,
  ): Promise<{
    urgentDiversionSettlement: PersistedUrgentDiversionSettlementRow | null;
    outcomeTuple: Phase1OutcomeTupleSnapshot | null;
    outcomePresentationArtifact: IntakeOutcomePresentationArtifactSnapshot | null;
    receiptConsistencyEnvelope: PatientReceiptConsistencyEnvelopeSnapshot | null;
    outboundNavigationGrant: OutcomeNavigationGrantSnapshot | null;
    triageTask: Phase1TriageTaskSnapshot | null;
    triageEtaForecast: Phase1TriageEtaForecastSnapshot | null;
    patientStatusProjection: Phase1PatientStatusProjectionSnapshot | null;
  }> {
    const tupleDocument = await outcomes.outcomeRepositories.findOutcomeTupleBySettlement(
      intakeSubmitSettlementRef,
    );
    if (!tupleDocument) {
      return {
        urgentDiversionSettlement: null,
        outcomeTuple: null,
        outcomePresentationArtifact: null,
        receiptConsistencyEnvelope: null,
        outboundNavigationGrant: null,
        triageTask: null,
        triageEtaForecast: null,
        patientStatusProjection: null,
      };
    }

    const tuple = tupleDocument.toSnapshot();
    const artifactDocument = await outcomes.outcomeRepositories.getOutcomeArtifact(
      tuple.presentationArtifactRef,
    );
    invariant(
      !!artifactDocument,
      `Outcome artifact ${tuple.presentationArtifactRef} is missing for ${tuple.phase1OutcomeTupleId}.`,
    );
    const receiptEnvelopeDocument = tuple.receiptEnvelopeRef
      ? await outcomes.outcomeRepositories.getReceiptEnvelope(tuple.receiptEnvelopeRef)
      : undefined;
    invariant(
      !tuple.receiptEnvelopeRef || !!receiptEnvelopeDocument,
      `Receipt envelope ${tuple.receiptEnvelopeRef} is missing for ${tuple.phase1OutcomeTupleId}.`,
    );
    const outboundNavigationGrantDocument = tuple.outboundNavigationGrantRef
      ? await outcomes.outcomeRepositories.getOutcomeNavigationGrant(tuple.outboundNavigationGrantRef)
      : undefined;
    invariant(
      !tuple.outboundNavigationGrantRef || !!outboundNavigationGrantDocument,
      `Outcome navigation grant ${tuple.outboundNavigationGrantRef} is missing for ${tuple.phase1OutcomeTupleId}.`,
    );
    const urgentDiversionSettlement = tuple.urgentDiversionSettlementRef
      ? (await synchronousSafety.repositories.getUrgentDiversionSettlement(
          tuple.urgentDiversionSettlementRef,
        )) ?? null
      : null;
    invariant(
      !tuple.urgentDiversionSettlementRef || !!urgentDiversionSettlement,
      `Urgent diversion settlement ${tuple.urgentDiversionSettlementRef} is missing for ${tuple.phase1OutcomeTupleId}.`,
    );
    const triageTaskDocument = tuple.requestRef
      ? await triage.repositories.findTriageTaskByRequest(tuple.requestRef)
      : undefined;
    const triageEtaForecastDocument = triageTaskDocument
      ? await triage.repositories.findLatestEtaForecastByTask(triageTaskDocument.triageTaskId)
      : undefined;
    const statusConsistencyKey = receiptEnvelopeDocument?.toSnapshot().statusConsistencyKey ?? null;
    const patientStatusProjectionDocument = statusConsistencyKey
      ? await triage.repositories.findLatestPatientStatusProjectionByStatusConsistencyKey(
          statusConsistencyKey,
        )
      : undefined;

    return {
      urgentDiversionSettlement,
      outcomeTuple: tuple,
      outcomePresentationArtifact: artifactDocument.toSnapshot(),
      receiptConsistencyEnvelope: receiptEnvelopeDocument?.toSnapshot() ?? null,
      outboundNavigationGrant: outboundNavigationGrantDocument?.toSnapshot() ?? null,
      triageTask: triageTaskDocument?.toSnapshot() ?? null,
      triageEtaForecast: triageEtaForecastDocument?.toSnapshot() ?? null,
      patientStatusProjection: patientStatusProjectionDocument?.toSnapshot() ?? null,
    };
  }

  function buildOutcomeEvents(input: {
    requestRef: string | null;
    evidenceSnapshotRef: string | null;
    evidenceClass:
      | "technical_metadata"
      | "operationally_material_nonclinical"
      | "contact_safety_relevant"
      | "potentially_clinical"
      | null;
    outcomeTuple: Phase1OutcomeTupleSnapshot | null;
    outcomePresentationArtifact: IntakeOutcomePresentationArtifactSnapshot | null;
    receiptConsistencyEnvelope: PatientReceiptConsistencyEnvelopeSnapshot | null;
    urgentDiversionSettlement: PersistedUrgentDiversionSettlementRow | null;
  }): readonly SubmissionLineageEventEnvelope<unknown>[] {
    const governingRef = input.requestRef ?? input.outcomeTuple?.requestRef ?? "draft_outcome_recovery";
    if (!input.outcomeTuple || !input.outcomePresentationArtifact) {
      return [];
    }

    const events: SubmissionLineageEventEnvelope<unknown>[] = [];

    if (input.outcomeTuple.outcomeResult === "urgent_diversion" && input.urgentDiversionSettlement) {
      events.push(
        makeFoundationEvent("safety.urgent_diversion.completed", {
          governingRef,
          recoveryMode: "urgent_diversion_issued",
          supersedesRef:
            input.urgentDiversionSettlement.supersedesSettlementRef ??
            input.urgentDiversionSettlement.safetyDecisionRef,
          evidenceBoundaryRef:
            input.evidenceSnapshotRef ?? input.outcomeTuple.intakeSubmitSettlementRef,
        }),
      );
    }

    if (!input.receiptConsistencyEnvelope) {
      return events;
    }

    const receiptEnvelopeRef = input.receiptConsistencyEnvelope.consistencyEnvelopeId;
    const artifactRef = input.outcomePresentationArtifact.intakeOutcomePresentationArtifactId;

    events.push(
      makeFoundationEvent("patient.receipt.consistency.updated", {
        governingRef,
        governingVersionRef: `receipt_revision::${input.receiptConsistencyEnvelope.monotoneRevision}`,
        previousState: "unissued",
        nextState: input.receiptConsistencyEnvelope.promiseState,
        stateAxis: "patient_receipt_promise",
        receiptEnvelopeRef,
      }),
    );

    if (input.outcomeTuple.outcomeResult === "triage_ready") {
      events.push(
        makeFoundationEvent("patient.receipt.issued", {
          governingRef,
          settlementState: input.outcomeTuple.appliesToState,
          settlementRef: input.outcomeTuple.phase1OutcomeTupleId,
          receiptEnvelopeRef,
        }),
      );
      events.push(
        makeFoundationEvent("communication.receipt.enveloped", {
          governingRef,
          artifactRef,
          artifactHash: sha256Hex({
            artifactRef,
            receiptEnvelopeRef,
            copyVariantRef: input.outcomePresentationArtifact.copyVariantRef,
          }),
          evidenceClass: input.evidenceClass ?? "potentially_clinical",
          receiptEnvelopeRef,
        }),
      );
    } else {
      events.push(
        makeFoundationEvent("patient.receipt.degraded", {
          governingRef,
          recoveryMode: input.outcomeTuple.appliesToState,
          supersedesRef: input.outcomeTuple.intakeSubmitSettlementRef,
          evidenceBoundaryRef:
            input.evidenceSnapshotRef ?? input.outcomeTuple.intakeSubmitSettlementRef,
          degradedModeRef: input.outcomePresentationArtifact.copyVariantRef,
          receiptEnvelopeRef,
        }),
      );
    }

    return events;
  }

  async function buildArtifacts(input: {
    projection: DraftContinuityEvidenceProjectionDocument;
    validationVerdict: SubmissionEnvelopeValidationVerdict;
    contactSummary: ContactPreferenceValidationSummary | undefined;
    attachmentStates: readonly SubmissionAttachmentStateView[];
    routeTuple: {
      routeFamilyRef: string;
      routeIntentBindingRef: string;
      audienceSurfaceRuntimeBindingRef: string;
      releaseApprovalFreezeRef: string;
      channelReleaseFreezeState: "released" | "monitoring" | "frozen";
      manifestVersionRef: string;
      sessionEpochRef?: string | null;
    };
    contactFreezeRef: string | null;
    replayClass: "distinct" | "collision_review";
    recordedAt: string;
  }) {
    const projectionSnapshot = input.projection.toSnapshot();
    const primaryIngressRecordRef = `ingress::${projectionSnapshot.draftPublicId}::${input.recordedAt}`;
    const sourcePayload = buildSourceArtifactPayload({
      projection: input.projection,
      validationVerdict: input.validationVerdict,
      contactSummary: input.contactSummary,
      attachmentStates: input.attachmentStates,
      routeTuple: input.routeTuple,
    });
    const normalizedPreview = normalizedSubmissionService.buildPreviewCandidate({
      requestType: projectionSnapshot.requestType,
      activeStructuredAnswers: input.validationVerdict.activeStructuredAnswers,
      freeTextNarrative: projectionSnapshot.freeTextNarrative,
      attachmentRefs: projectionSnapshot.attachmentRefs,
      contactPreferencesRef: input.contactSummary?.contactPreferencesRef ?? null,
    });
    const normalizedArtifactPayload = {
      normalizedSubmissionSchemaVersion: "NORMALIZED_SUBMISSION_V1_PREVIEW",
      normalizationVersionRef: normalizedSubmissionVersionRef,
      requestType: normalizedPreview.requestType,
      requestShape: normalizedPreview.requestShape,
      summaryFragments: normalizedPreview.summaryFragments,
      authoredNarrative: normalizedPreview.authoredNarrative,
      dedupeFeatures: normalizedPreview.dedupeFeatures,
      dedupeFingerprint: normalizedPreview.dedupeFingerprint,
      attachmentRefs: normalizedPreview.attachmentRefs,
      contactPreferencesRef: normalizedPreview.contactPreferencesRef,
      reasonCodes: normalizedPreview.reasonCodes,
      sourceLineageRef: projectionSnapshot.envelopeRef,
    };

    const sourceArtifact = await evidence.services.artifacts.registerSourceArtifact({
      locator: `memory://phase1-submit/${projectionSnapshot.envelopeRef}/${input.recordedAt}/source.json`,
      checksum: sha256Hex(sourcePayload),
      mediaType: "application/json",
      byteLength: Buffer.byteLength(stableStringify(sourcePayload), "utf8"),
      createdAt: input.recordedAt,
    });

    const captureBundle = await evidence.services.captureBundles.freezeCaptureBundle({
      evidenceLineageRef: projectionSnapshot.envelopeRef,
      sourceChannel: projectionSnapshot.ingressChannel,
      replayClass: input.replayClass,
      capturePolicyVersion: "PHASE1_SUBMIT_CAPTURE_POLICY_V1",
      sourceHash: sha256Hex(buildSubmitRawPayload(input)),
      semanticHash: buildSubmitReplaySemanticFingerprint({
        sourceLineageRef: projectionSnapshot.envelopeRef,
        requestType: projectionSnapshot.requestType,
        normalizedPayload: normalizedArtifactPayload,
        attachmentRefs: projectionSnapshot.attachmentRefs,
        contactPreferencesRef: input.contactSummary?.contactPreferencesRef ?? null,
      }),
      sourceArtifactRefs: [sourceArtifact.artifactId],
      createdAt: input.recordedAt,
    });

    const freeze = SubmissionSnapshotFreezeDocument.create({
      freezeSchemaVersion: "PHASE1_SUBMISSION_SNAPSHOT_FREEZE_V1",
      submissionSnapshotFreezeId: transactionRepositories.nextGeneratedId("freeze"),
      envelopeRef: projectionSnapshot.envelopeRef,
      draftPublicId: projectionSnapshot.draftPublicId,
      sourceLineageRef: projectionSnapshot.envelopeRef,
      draftVersion: projectionSnapshot.authoritativeDraftVersion,
      requestType: projectionSnapshot.requestType,
      intakeExperienceBundleRef: input.validationVerdict.bundleRef,
      validationVerdictHash: input.validationVerdict.verdictHash,
      activeQuestionKeys: input.validationVerdict.activeQuestionKeys,
      activeStructuredAnswers: input.validationVerdict.activeStructuredAnswers,
      freeTextNarrative: projectionSnapshot.freeTextNarrative,
      attachmentRefs: projectionSnapshot.attachmentRefs,
      contactPreferencesRef: input.contactSummary?.contactPreferencesRef ?? null,
      contactPreferenceFreezeRef: input.contactFreezeRef,
      routeFamilyRef: input.routeTuple.routeFamilyRef,
      routeIntentBindingRef: input.routeTuple.routeIntentBindingRef,
      audienceSurfaceRuntimeBindingRef: input.routeTuple.audienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef: input.routeTuple.releaseApprovalFreezeRef,
      channelReleaseFreezeState: input.routeTuple.channelReleaseFreezeState,
      manifestVersionRef: input.routeTuple.manifestVersionRef,
      sessionEpochRef: input.routeTuple.sessionEpochRef ?? null,
      surfaceChannelProfile: projectionSnapshot.surfaceChannelProfile,
      ingressChannel: projectionSnapshot.ingressChannel,
      intakeConvergenceContractRef: projectionSnapshot.intakeConvergenceContractRef,
      sourceHash: captureBundle.toSnapshot().sourceHash,
      semanticHash: captureBundle.toSnapshot().semanticHash,
      normalizedCandidateHash: buildSubmitNormalizationSeedDigest(normalizedArtifactPayload),
      evidenceCaptureBundleRef: captureBundle.captureBundleId,
      frozenAt: input.recordedAt,
      identityContext: projectionSnapshot.identityContext,
      channelCapabilityCeiling: projectionSnapshot.channelCapabilityCeiling,
      contactAuthorityState: input.validationVerdict.submitReadiness.contactAuthorityState,
      contactAuthorityPolicyRef: resolveContactAuthorityPolicyRef(
        input.validationVerdict.submitReadiness.contactAuthorityState,
      ),
    });
    await transactionRepositories.saveSubmissionSnapshotFreeze(freeze);

    const derivedArtifact = await evidence.services.artifacts.registerDerivedArtifact({
      locator: `memory://phase1-submit/${projectionSnapshot.envelopeRef}/${input.recordedAt}/normalized-submission.json`,
      checksum: sha256Hex(normalizedArtifactPayload),
      mediaType: "application/json",
      byteLength: Buffer.byteLength(stableStringify(normalizedArtifactPayload), "utf8"),
      createdAt: input.recordedAt,
    });

    const derivation = await evidence.services.derivations.createDerivationPackage({
      captureBundleRef: captureBundle.captureBundleId,
      derivationClass: "canonical_normalization",
      derivationVersion: normalizedSubmissionService.normalizationVersionRef,
      policyVersionRef: "PHASE1_NORMALIZED_SUBMISSION_POLICY_V1",
      derivedArtifactRef: derivedArtifact.artifactId,
      createdAt: input.recordedAt,
    });

    const currentSnapshot = await evidence.repositories.getCurrentEvidenceSnapshotForLineage(
      projectionSnapshot.envelopeRef,
    );
    const evidenceSnapshot = await evidence.services.snapshots.createEvidenceSnapshot({
      captureBundleRef: captureBundle.captureBundleId,
      authoritativeNormalizedDerivationPackageRef: derivation.derivationPackageId,
      supersedesEvidenceSnapshotRef: currentSnapshot?.evidenceSnapshotId ?? null,
      materialDeltaDisposition: currentSnapshot ? "triage_meaning_changed" : null,
      createdAt: input.recordedAt,
    });

    const freezeSnapshot = freeze.toSnapshot();
    const normalizedSubmission = normalizedSubmissionService.createNormalizedSubmission({
      normalizedSubmissionId: transactionRepositories.nextGeneratedId("seed"),
      governingSnapshotRef: evidenceSnapshot.evidenceSnapshotId,
      primaryIngressRecordRef,
      requestLineageRef: null,
      createdAt: input.recordedAt,
      freeze: {
        submissionSnapshotFreezeRef: freezeSnapshot.submissionSnapshotFreezeId,
        submissionEnvelopeRef: freezeSnapshot.envelopeRef,
        sourceLineageRef: freezeSnapshot.sourceLineageRef,
        draftPublicId: freezeSnapshot.draftPublicId,
        requestType: freezeSnapshot.requestType as
          | "Symptoms"
          | "Meds"
          | "Admin"
          | "Results",
        intakeExperienceBundleRef: freezeSnapshot.intakeExperienceBundleRef,
        activeQuestionKeys: freezeSnapshot.activeQuestionKeys,
        activeStructuredAnswers: freezeSnapshot.activeStructuredAnswers,
        freeTextNarrative: freezeSnapshot.freeTextNarrative,
        attachmentRefs: freezeSnapshot.attachmentRefs,
        contactPreferencesRef: freezeSnapshot.contactPreferencesRef,
        routeFamilyRef: freezeSnapshot.routeFamilyRef,
        routeIntentBindingRef: freezeSnapshot.routeIntentBindingRef,
        audienceSurfaceRuntimeBindingRef: freezeSnapshot.audienceSurfaceRuntimeBindingRef,
        releaseApprovalFreezeRef: freezeSnapshot.releaseApprovalFreezeRef,
        channelReleaseFreezeState: freezeSnapshot.channelReleaseFreezeState,
        manifestVersionRef: freezeSnapshot.manifestVersionRef,
        sessionEpochRef: freezeSnapshot.sessionEpochRef,
        surfaceChannelProfile: freezeSnapshot.surfaceChannelProfile,
        ingressChannel: freezeSnapshot.ingressChannel,
        intakeConvergenceContractRef: freezeSnapshot.intakeConvergenceContractRef,
        sourceHash: freezeSnapshot.sourceHash,
        semanticHash: freezeSnapshot.semanticHash,
        evidenceCaptureBundleRef: freezeSnapshot.evidenceCaptureBundleRef,
        frozenAt: freezeSnapshot.frozenAt,
        identityContext: freezeSnapshot.identityContext,
        channelCapabilityCeiling: freezeSnapshot.channelCapabilityCeiling,
        contactAuthorityState: freezeSnapshot.contactAuthorityState,
        contactAuthorityPolicyRef: freezeSnapshot.contactAuthorityPolicyRef,
      },
    });

    const normalizationSeed = SubmitNormalizationSeedDocument.create({
      seedSchemaVersion: "PHASE1_SUBMIT_NORMALIZATION_SEED_V1",
      submitNormalizationSeedId: normalizedSubmission.normalizedSubmissionId,
      submissionSnapshotFreezeRef: freeze.submissionSnapshotFreezeId,
      envelopeRef: projectionSnapshot.envelopeRef,
      sourceLineageRef: projectionSnapshot.envelopeRef,
      evidenceCaptureBundleRef: captureBundle.captureBundleId,
      requestType: projectionSnapshot.requestType,
      intakeExperienceBundleRef: input.validationVerdict.bundleRef,
      normalizationVersionRef: normalizedSubmission.toSnapshot().normalizationVersionRef,
      normalizedHash: normalizedSubmission.toSnapshot().normalizedHash,
      dedupeFingerprint: normalizedSubmission.toSnapshot().dedupeFingerprint,
      futureContractGapRefs: [],
      normalizedPayload: normalizedSubmission.toSnapshot() as unknown as Record<string, unknown>,
      createdAt: input.recordedAt,
    });
    await transactionRepositories.saveSubmitNormalizationSeed(normalizationSeed);

    return {
      freeze,
      normalizedSubmission,
      normalizationSeed,
      captureBundle,
      evidenceSnapshot,
      primaryIngressRecordRef,
    };
  }

  async function buildReplayResult(input: {
    settlementId: string;
    decisionClass: "exact_replay" | "semantic_replay";
  }): Promise<IntakeSubmitCommandResult> {
    const settlement = await transactionRepositories.getIntakeSubmitSettlement(input.settlementId);
    invariant(!!settlement, `Authoritative intake submit settlement ${input.settlementId} was not found.`);
    const snapshot = settlement.toSnapshot();
    const action = snapshot.commandActionRecordRef
      ? await commandRepositories.getCommandActionRecord(snapshot.commandActionRecordRef)
      : undefined;
    const commandSettlement = snapshot.commandSettlementRecordRef
      ? await commandRepositories.getCommandSettlementRecord(snapshot.commandSettlementRecordRef)
      : undefined;
    const normalizationSeed = snapshot.normalizedSubmissionRef
      ? (await transactionRepositories.getSubmitNormalizationSeed(
          snapshot.normalizedSubmissionRef,
        )) ?? null
      : null;
    const normalizedSubmission =
      normalizationSeed?.toSnapshot().normalizedPayload &&
      typeof normalizationSeed.toSnapshot().normalizedPayload === "object"
        ? NormalizedSubmissionDocument.hydrate(
            normalizationSeed.toSnapshot().normalizedPayload as unknown as Parameters<
              typeof NormalizedSubmissionDocument.hydrate
            >[0],
          )
        : null;
    const request = snapshot.requestRef
      ? (await repositories.getRequest(snapshot.requestRef)) ?? null
      : null;
    const requestSnapshot = request?.toSnapshot() ?? null;
    const evidenceClassification =
      requestSnapshot?.currentEvidenceClassificationRef
        ? await synchronousSafety.repositories.getEvidenceClassificationDecision(
            requestSnapshot.currentEvidenceClassificationRef,
          )
        : null;
    const safetyPreemption =
      requestSnapshot?.currentSafetyPreemptionRef
        ? await synchronousSafety.repositories.getSafetyPreemptionRecord(
            requestSnapshot.currentSafetyPreemptionRef,
          )
        : null;
    const safetyDecision =
      requestSnapshot?.currentSafetyDecisionRef
        ? await synchronousSafety.repositories.getSafetyDecisionRecord(
            requestSnapshot.currentSafetyDecisionRef,
          )
        : null;
    const outcomeChain = await buildOutcomeChain(snapshot.intakeSubmitSettlementId);
    invariant(action && commandSettlement, "Replay settlement is missing its command action chain.");
    return {
      decisionClass: input.decisionClass,
      replayed: true,
      settlement,
      transitionEnvelope: buildSubmitTransitionEnvelope({
        action,
        settlement: commandSettlement,
        entityRef: snapshot.requestRef ?? snapshot.envelopeRef,
        targetIntent:
          snapshot.settlementState === "request_submitted"
            ? "authoritative_request_shell"
            : snapshot.settlementState === "collision_review_open"
              ? "collision_review"
              : "resume_recovery",
        localAckState: "local_ack",
        settlementPolicy:
          snapshot.settlementState === "request_submitted" ? "projection_token" : "manual_review",
      }),
      commandAction: action,
      commandSettlement,
      submissionSnapshotFreeze: snapshot.submissionSnapshotFreezeRef
        ? (await transactionRepositories.getSubmissionSnapshotFreeze(
            snapshot.submissionSnapshotFreezeRef,
          )) ?? null
        : null,
      normalizedSubmission,
      normalizationSeed,
      evidenceClassification,
      safetyPreemption,
      safetyDecision,
      urgentDiversionSettlement: outcomeChain.urgentDiversionSettlement,
      outcomeTuple: outcomeChain.outcomeTuple,
      outcomePresentationArtifact: outcomeChain.outcomePresentationArtifact,
      receiptConsistencyEnvelope: outcomeChain.receiptConsistencyEnvelope,
      outboundNavigationGrant: outcomeChain.outboundNavigationGrant,
      triageTask: outcomeChain.triageTask,
      triageEtaForecast: outcomeChain.triageEtaForecast,
      patientStatusProjection: outcomeChain.patientStatusProjection,
      evidenceCaptureBundleRef: snapshot.evidenceCaptureBundleRef,
      evidenceSnapshotRef: snapshot.evidenceSnapshotRef,
      requestRef: snapshot.requestRef,
      requestLineageRef: snapshot.requestLineageRef,
      promotionRecordRef: snapshot.promotionRecordRef,
      reasonCodes: snapshot.reasonCodes,
      events: [],
    };
  }

  async function createRecoverySettlement(input: {
    projection: DraftContinuityEvidenceProjectionDocument;
    decisionClass: "stale_recoverable" | "submit_blocked";
    reasonCodes: readonly string[];
    observedAt: string;
  }): Promise<IntakeSubmitCommandResult> {
    const projectionSnapshot = input.projection.toSnapshot();
    const actionRecordId = nextLocalId("phase1_submit", localCounters, "action");
    const settlementId = transactionRepositories.nextGeneratedId("settlement");
    const action = buildCommandActionRecord({
      actionRecordId,
      envelopeRef: projectionSnapshot.envelopeRef,
      routeFamilyRef: "rf_intake_self_service",
      routeIntentBindingRef: projectionSnapshot.selectedAnchorKey,
      routeIntentTupleHash: createRouteIntentTupleHash({
        routeFamilyRef: "rf_intake_self_service",
        routeIntentBindingRef: projectionSnapshot.selectedAnchorKey,
        audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
        releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
        channelReleaseFreezeState: "monitoring",
        manifestVersionRef: "manifest_phase1_browser_v1",
      }),
      audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
      releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
      manifestVersionRef: "manifest_phase1_browser_v1",
      parentAnchorRef: `draft_anchor::${projectionSnapshot.selectedAnchorKey}`,
      edgeCorrelationId: `${actionRecordId}::edge`,
      sourceCommandId: `${actionRecordId}::source`,
      transportCorrelationId: `${actionRecordId}::transport`,
      semanticPayloadHash: sha256Hex(input.reasonCodes),
      idempotencyKey: `${actionRecordId}::idempotency`,
      idempotencyRecordRef: `${actionRecordId}::not_accepted`,
      expectedEffectSetHash: buildExpectedEffectSetHash(["intake.submit.recovery"]),
      createdAt: input.observedAt,
    });
    await commandRepositories.saveCommandActionRecord(action);
    const commandSettlement = buildCommandSettlementRecord({
      settlementId: nextLocalId("phase1_submit", localCounters, "command_settlement"),
      actionRecordRef: action.actionRecordId,
      decisionClass: input.decisionClass,
      result: input.decisionClass === "submit_blocked" ? "blocked_policy" : "stale_recoverable",
      authoritativeOutcomeState: "recovery_required",
      proofClass: "recovery_disposition",
      recordedAt: input.observedAt,
      sameShellRecoveryRef: buildRecoveryRoute(projectionSnapshot.draftPublicId),
      lastSafeAnchorRef: `draft_anchor::${projectionSnapshot.selectedAnchorKey}`,
      allowedSummaryTier: "summary_only",
      staleAfterAt: addMinutes(input.observedAt, 15),
      auditRecordRef: `audit://phase1-submit/${settlementId}`,
      blockingRefs: input.reasonCodes,
    });
    await commandRepositories.saveCommandSettlementRecord(commandSettlement);
    const submitSettlement = IntakeSubmitSettlementDocument.create({
      settlementSchemaVersion: "INTAKE_SUBMIT_SETTLEMENT_V1",
      intakeSubmitSettlementId: settlementId,
      decisionClass: input.decisionClass,
      settlementState: input.decisionClass === "submit_blocked" ? "submit_blocked" : "recovery_required",
      envelopeRef: projectionSnapshot.envelopeRef,
      draftPublicId: projectionSnapshot.draftPublicId,
      sourceLineageRef: projectionSnapshot.envelopeRef,
      requestRef: null,
      requestLineageRef: null,
      promotionRecordRef: null,
      submissionSnapshotFreezeRef: null,
      evidenceCaptureBundleRef: null,
      evidenceSnapshotRef: null,
      normalizedSubmissionRef: null,
      collisionReviewRef: null,
      commandActionRecordRef: action.actionRecordId,
      commandSettlementRecordRef: commandSettlement.settlementId,
      routeIntentBindingRef: projectionSnapshot.selectedAnchorKey,
      receiptConsistencyKey: null,
      statusConsistencyKey: null,
      reasonCodes: input.reasonCodes,
      gapRefs:
        input.decisionClass === "submit_blocked"
          ? []
          : ["GAP_RESOLVED_STALE_SUBMIT_RECOVERY_SETTLEMENT_V1"],
      recordedAt: input.observedAt,
    });
    await transactionRepositories.saveIntakeSubmitSettlement(submitSettlement);
    const outcomeResult = await outcomes.outcomeGrammarService.settleOutcome({
      intakeSubmitSettlementRef: submitSettlement.intakeSubmitSettlementId,
      draftPublicId: projectionSnapshot.draftPublicId,
      requestRef: null,
      requestLineageRef: null,
      requestPublicId: null,
      submissionPromotionRecordRef: null,
      normalizedSubmissionRef: null,
      receiptConsistencyKey: null,
      statusConsistencyKey: null,
      result:
        input.decisionClass === "submit_blocked" ? "denied_scope" : "stale_recoverable",
      appliesToState:
        input.decisionClass === "submit_blocked" ? "denied_scope" : "stale_recoverable",
      routeFamilyRef: "rf_intake_self_service",
      routeIntentBindingRef: projectionSnapshot.selectedAnchorKey,
      audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
      surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
      runtimePublicationBundleRef: "rpb::local::authoritative",
      releasePublicationParityRef: "rpp::local::authoritative",
      continuityKey: projectionSnapshot.shellContinuityKey,
      selectedAnchorRef: projectionSnapshot.selectedAnchorKey,
      returnTargetRef: buildRecoveryRoute(projectionSnapshot.draftPublicId),
      recordedAt: input.observedAt,
    });
    return {
      decisionClass: input.decisionClass,
      replayed: false,
      settlement: submitSettlement,
      transitionEnvelope: buildSubmitTransitionEnvelope({
        action,
        settlement: commandSettlement,
        entityRef: projectionSnapshot.envelopeRef,
        targetIntent: input.decisionClass === "submit_blocked" ? "submit_review" : "resume_recovery",
        localAckState: "local_ack",
        settlementPolicy: "manual_review",
      }),
      commandAction: action,
      commandSettlement,
      submissionSnapshotFreeze: null,
      normalizedSubmission: null,
      normalizationSeed: null,
      evidenceClassification: null,
      safetyPreemption: null,
      safetyDecision: null,
      urgentDiversionSettlement: null,
      outcomeTuple: outcomeResult.tuple,
      outcomePresentationArtifact: outcomeResult.artifact,
      receiptConsistencyEnvelope: outcomeResult.receiptEnvelope,
      outboundNavigationGrant: outcomeResult.outboundNavigationGrant,
      triageTask: null,
      triageEtaForecast: null,
      patientStatusProjection: null,
      evidenceCaptureBundleRef: null,
      evidenceSnapshotRef: null,
      requestRef: null,
      requestLineageRef: null,
      promotionRecordRef: null,
      reasonCodes: input.reasonCodes,
      events: buildOutcomeEvents({
        requestRef: null,
        evidenceSnapshotRef: null,
        evidenceClass: null,
        outcomeTuple: outcomeResult.tuple,
        outcomePresentationArtifact: outcomeResult.artifact,
        receiptConsistencyEnvelope: outcomeResult.receiptEnvelope,
        urgentDiversionSettlement: null,
      }),
    };
  }

  const application: IntakeSubmitApplication = {
    repositories,
    drafts,
    attachmentApp,
    contactPreferenceApp,
    confirmationDispatch,
    validation,
    evidence,
    synchronousSafety,
    outcomes,
    triage,
    replay,
    transactionRepositories,
    commandRepositories,
    migrationPlanRef: "services/command-api/migrations/085_phase1_submission_snapshot_freeze_and_promotion.sql",
    migrationPlanRefs: [
      "services/command-api/migrations/063_evidence_backbone.sql",
      "services/command-api/migrations/066_submission_promotion_exactly_once.sql",
      "services/command-api/migrations/067_idempotency_and_replay_collision.sql",
      "services/command-api/migrations/068_identity_binding_and_access_grants.sql",
      "services/command-api/migrations/071_request_lifecycle_lease_and_command_action_records.sql",
      "services/command-api/migrations/072_command_settlement_and_transition_envelope_library.sql",
      "services/command-api/migrations/082_draft_session_lease_and_autosave.sql",
      "services/command-api/migrations/083_phase1_attachment_pipeline.sql",
      "services/command-api/migrations/084_phase1_contact_preference_capture.sql",
      "services/command-api/migrations/085_phase1_submission_snapshot_freeze_and_promotion.sql",
      "services/command-api/migrations/086_phase1_outcome_grammar_and_urgent_diversion.sql",
      "services/command-api/migrations/088_phase1_triage_task_eta_and_status.sql",
      "services/command-api/migrations/089_phase1_confirmation_dispatch_and_observability.sql",
      "services/command-api/migrations/079_evidence_assimilation_and_safety_orchestrator.sql",
    ] as const,
    async submitDraft(input: SubmitDraftCommand): Promise<IntakeSubmitCommandResult> {
      return repositories.withPromotionBoundary(async () => {
        const projection = await requireProjection(input.draftPublicId);
        const projectionSnapshot = projection.toSnapshot();
        const existingSettlement = await transactionRepositories.findLatestIntakeSubmitSettlementByEnvelope(
          projectionSnapshot.envelopeRef,
        );
        const attachmentStates = await attachmentApp.buildSubmissionAttachmentStates(input.draftPublicId);
        const contactSummary = await contactPreferenceApp.buildContactPreferenceValidationSummary(
          input.draftPublicId,
        ).catch(() => undefined);
        const validationVerdict = await validation.evaluateSubmitReadiness(input.draftPublicId);
        const routeTuple = {
          routeFamilyRef: "rf_intake_self_service",
          routeIntentBindingRef: projectionSnapshot.selectedAnchorKey,
          audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
          releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
          channelReleaseFreezeState: "monitoring" as const,
          manifestVersionRef: "manifest_phase1_browser_v1",
          sessionEpochRef: null,
        };
        const rawPayload = buildSubmitRawPayload({
          projection,
          validationVerdict,
          contactSummary,
          attachmentStates,
        });
        const semanticPayload = buildSubmitSemanticPayload({
          projection,
          validationVerdict,
          contactSummary,
          attachmentStates,
        });

        if (!existingSettlement) {
          const lease = await requireLease(input.leaseId).catch(() => null);
          const staleReasonCodes: string[] = [];
          if (!lease) {
            staleReasonCodes.push("DRAFT_LEASE_NOT_FOUND");
          } else {
            const leaseSnapshot = lease.toSnapshot();
            if (leaseSnapshot.draftPublicId !== input.draftPublicId) {
              staleReasonCodes.push("DRAFT_LEASE_DRAFT_MISMATCH");
            }
            if (leaseSnapshot.leaseState !== "live") {
              staleReasonCodes.push("DRAFT_LEASE_NOT_LIVE");
            }
            if (leaseSnapshot.leaseMode !== "foreground_mutating") {
              staleReasonCodes.push("DRAFT_LEASE_MUTATION_NOT_ALLOWED");
            }
          }
          if (projectionSnapshot.resumeToken !== input.resumeToken) {
            staleReasonCodes.push("DRAFT_RESUME_TOKEN_MISMATCH");
          }
          if (projectionSnapshot.activeLeaseRef !== input.leaseId) {
            staleReasonCodes.push("DRAFT_ACTIVE_LEASE_MISMATCH");
          }
          if (projectionSnapshot.authoritativeDraftVersion !== input.draftVersion) {
            staleReasonCodes.push("DRAFT_VERSION_CONFLICT");
          }
          if (staleReasonCodes.length > 0) {
            return createRecoverySettlement({
              projection,
              decisionClass: "stale_recoverable",
              reasonCodes: staleReasonCodes,
              observedAt: input.observedAt,
            });
          }
          if (validationVerdict.verdictState !== "submit_ready") {
            return createRecoverySettlement({
              projection,
              decisionClass: "submit_blocked",
              reasonCodes: validationVerdict.submitReadiness.blockerCodes,
              observedAt: input.observedAt,
            });
          }
        }

        const actionRecordId = nextLocalId("phase1_submit", localCounters, "action");
        const intakeSubmitSettlementId = transactionRepositories.nextGeneratedId("settlement");
        const replayDecision = await replay.authority.resolveInboundCommand({
          actionScope: "phase1_intake_submit",
          governingLineageRef: projectionSnapshot.envelopeRef,
          effectiveActorRef: projectionSnapshot.draftPublicId,
          intentGeneration: input.intentGeneration ?? 1,
          scope: {
            governingObjectRef: projectionSnapshot.envelopeRef,
            governingObjectVersionRef: `${projectionSnapshot.envelopeRef}@${projectionSnapshot.authoritativeDraftVersion}`,
            routeIntentTupleHash: createRouteIntentTupleHash(routeTuple),
            routeContractDigestRef: `${routeTuple.routeFamilyRef}::${routeTuple.manifestVersionRef}`,
            audienceSurfaceRuntimeBindingRef: routeTuple.audienceSurfaceRuntimeBindingRef,
            releaseTrustFreezeVerdictRef: routeTuple.releaseApprovalFreezeRef,
          },
          expectedEffectSetRefs: ["request.created", "request.submitted", "intake.submit.settled"],
          rawPayload,
          semanticPayload,
          sourceCommandId: input.sourceCommandId ?? input.clientCommandId,
          transportCorrelationId:
            input.transportCorrelationId ??
            `${projectionSnapshot.draftPublicId}::${projectionSnapshot.authoritativeDraftVersion}::${input.clientCommandId}`,
          firstAcceptedActionRecordRef: actionRecordId,
          acceptedSettlementRef: intakeSubmitSettlementId,
          decisionBasisRef: `submit_preflight::${validationVerdict.verdictHash}`,
          observedAt: input.observedAt,
        });

        if (replayDecision.decisionClass === "exact_replay" || replayDecision.decisionClass === "semantic_replay") {
          return buildReplayResult({
            settlementId: replayDecision.authoritativeSettlementRef,
            decisionClass: replayDecision.decisionClass,
          });
        }

        const action = buildCommandActionRecord({
          actionRecordId,
          envelopeRef: projectionSnapshot.envelopeRef,
          routeFamilyRef: routeTuple.routeFamilyRef,
          routeIntentBindingRef: routeTuple.routeIntentBindingRef,
          routeIntentTupleHash: createRouteIntentTupleHash(routeTuple),
          audienceSurfaceRuntimeBindingRef: routeTuple.audienceSurfaceRuntimeBindingRef,
          releaseApprovalFreezeRef: routeTuple.releaseApprovalFreezeRef,
          manifestVersionRef: routeTuple.manifestVersionRef,
          parentAnchorRef: `draft_anchor::${projectionSnapshot.selectedAnchorKey}`,
          edgeCorrelationId: `${actionRecordId}::edge`,
          sourceCommandId: input.sourceCommandId ?? input.clientCommandId,
          transportCorrelationId:
            input.transportCorrelationId ??
            `${projectionSnapshot.draftPublicId}::${projectionSnapshot.authoritativeDraftVersion}::${input.clientCommandId}`,
          semanticPayloadHash: replayDecision.canonicalHashes.semanticPayloadHash,
          idempotencyKey: input.idempotencyKey,
          idempotencyRecordRef: replayDecision.idempotencyRecord.idempotencyRecordId,
          expectedEffectSetHash: replayDecision.canonicalHashes.expectedEffectSetHash,
          createdAt: input.observedAt,
        });
        await commandRepositories.saveCommandActionRecord(action);

        const frozenContacts = contactSummary
          ? await contactPreferenceApp.freezeContactPreferencesForSubmit({
              draftPublicId: input.draftPublicId,
              frozenAt: input.observedAt,
            })
          : null;
        const frozenArtifacts = await buildArtifacts({
          projection,
          validationVerdict,
          contactSummary,
          attachmentStates,
          routeTuple,
          contactFreezeRef:
            frozenContacts?.submitFreeze.toSnapshot().contactPreferenceSubmitFreezeId ?? null,
          replayClass:
            replayDecision.decisionClass === "collision_review" ? "collision_review" : "distinct",
          recordedAt: input.observedAt,
        });

        if (replayDecision.decisionClass === "collision_review") {
          const commandSettlement = buildCommandSettlementRecord({
            settlementId: nextLocalId("phase1_submit", localCounters, "command_settlement"),
            actionRecordRef: action.actionRecordId,
            decisionClass: "collision_review",
            result: "review_required",
            authoritativeOutcomeState: "review_required",
            proofClass: "review_disposition",
            recordedAt: input.observedAt,
            auditRecordRef: `audit://phase1-submit/${intakeSubmitSettlementId}`,
            blockingRefs: [replayDecision.collisionReview?.replayCollisionReviewId ?? "collision_review"],
          });
          await commandRepositories.saveCommandSettlementRecord(commandSettlement);
          const settlement = IntakeSubmitSettlementDocument.create({
            settlementSchemaVersion: "INTAKE_SUBMIT_SETTLEMENT_V1",
            intakeSubmitSettlementId,
            decisionClass: "collision_review",
            settlementState: "collision_review_open",
            envelopeRef: projectionSnapshot.envelopeRef,
            draftPublicId: projectionSnapshot.draftPublicId,
            sourceLineageRef: projectionSnapshot.envelopeRef,
            requestRef: null,
            requestLineageRef: null,
            promotionRecordRef: null,
            submissionSnapshotFreezeRef: frozenArtifacts.freeze.submissionSnapshotFreezeId,
            evidenceCaptureBundleRef: frozenArtifacts.captureBundle.captureBundleId,
            evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
            normalizedSubmissionRef: frozenArtifacts.normalizationSeed.submitNormalizationSeedId,
            collisionReviewRef: replayDecision.collisionReview?.replayCollisionReviewId ?? "collision_review",
            commandActionRecordRef: action.actionRecordId,
            commandSettlementRecordRef: commandSettlement.settlementId,
            routeIntentBindingRef: routeTuple.routeIntentBindingRef,
            receiptConsistencyKey: null,
            statusConsistencyKey: null,
            reasonCodes: ["SUBMIT_COLLISION_REVIEW_REQUIRED"],
            gapRefs: [],
            recordedAt: input.observedAt,
          });
          await transactionRepositories.saveIntakeSubmitSettlement(settlement);
          return {
            decisionClass: "collision_review",
            replayed: false,
            settlement,
            transitionEnvelope: buildSubmitTransitionEnvelope({
              action,
              settlement: commandSettlement,
              entityRef: projectionSnapshot.envelopeRef,
              targetIntent: "collision_review",
              localAckState: "queued",
              settlementPolicy: "manual_review",
            }),
            commandAction: action,
            commandSettlement,
            submissionSnapshotFreeze: frozenArtifacts.freeze,
            normalizedSubmission: frozenArtifacts.normalizedSubmission,
            normalizationSeed: frozenArtifacts.normalizationSeed,
            evidenceClassification: null,
            safetyPreemption: null,
            safetyDecision: null,
            urgentDiversionSettlement: null,
            outcomeTuple: null,
            outcomePresentationArtifact: null,
            receiptConsistencyEnvelope: null,
            outboundNavigationGrant: null,
            triageTask: null,
            triageEtaForecast: null,
            patientStatusProjection: null,
            evidenceCaptureBundleRef: frozenArtifacts.captureBundle.captureBundleId,
            evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
            requestRef: null,
            requestLineageRef: null,
            promotionRecordRef: null,
            reasonCodes: ["SUBMIT_COLLISION_REVIEW_REQUIRED"],
            events: [
              emitIntakeNormalized({
                envelopeId: projectionSnapshot.envelopeRef,
                normalizedSubmissionRef: frozenArtifacts.normalizedSubmission.normalizedSubmissionId,
              }),
              emitRequestSnapshotCreated({
                envelopeId: projectionSnapshot.envelopeRef,
                evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
              }),
            ],
          };
        }

        if (!frozenContacts) {
          return createRecoverySettlement({
            projection,
            decisionClass: "submit_blocked",
            reasonCodes: ["CONTACT_PREFERENCE_CAPTURE_REQUIRED"],
            observedAt: input.observedAt,
          });
        }

        const envelope = await repositories.getSubmissionEnvelope(projectionSnapshot.envelopeRef);
        invariant(!!envelope, `SubmissionEnvelope ${projectionSnapshot.envelopeRef} not found.`);
        if (!envelope.toSnapshot().latestIngressRecordRef) {
          await submissionCommands.appendEnvelopeIngress({
            envelopeId: envelope.envelopeId,
            ingressRecordRef: frozenArtifacts.primaryIngressRecordRef,
            updatedAt: input.observedAt,
          });
        }
        await submissionCommands.attachEnvelopeEvidence({
          envelopeId: projectionSnapshot.envelopeRef,
          evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
          updatedAt: input.observedAt,
        });
        await submissionCommands.attachEnvelopeNormalization({
          envelopeId: projectionSnapshot.envelopeRef,
          normalizedSubmissionRef: frozenArtifacts.normalizedSubmission.normalizedSubmissionId,
          updatedAt: input.observedAt,
        });
        await submissionCommands.markEnvelopeReady({
          envelopeId: projectionSnapshot.envelopeRef,
          promotionDecisionRef: `promotion_decision::${intakeSubmitSettlementId}`,
          updatedAt: input.observedAt,
        });

        const mutabilitySnapshot = repositories.getDraftMutabilitySnapshot?.(
          projectionSnapshot.envelopeRef,
        );
        const liveGrantRefs =
          mutabilitySnapshot?.liveAccessGrantRefs ??
          (await repositories.listAccessGrantsForGoverningObject(projectionSnapshot.envelopeRef))
            .filter((grant) => {
              const state = grant.toSnapshot().grantState;
              return (
                state !== "superseded" &&
                state !== "rotated" &&
                state !== "revoked" &&
                state !== "expired"
              );
            })
            .map((grant) => grant.grantId);
        const liveDraftLeaseRefs =
          mutabilitySnapshot?.liveDraftLeaseRefs ??
          (await repositories.listDraftLeases())
            .filter(
              (lease) =>
                lease.toSnapshot().envelopeRef === projectionSnapshot.envelopeRef &&
                lease.toSnapshot().leaseState === "live",
            )
            .map((lease) => lease.leaseId);

        const promotionCommandSettlementId = nextLocalId(
          "phase1_submit",
          localCounters,
          "command_settlement",
        );
        const promoted = await submissionCommands.promoteEnvelope({
          envelopeId: projectionSnapshot.envelopeRef,
          promotedAt: input.observedAt,
          tenantId: "tenant_phase1_self_service",
          requestType: projectionSnapshot.requestType,
          episodeFingerprint: sha256Hex({
            envelopeRef: projectionSnapshot.envelopeRef,
            requestType: projectionSnapshot.requestType,
            semanticHash: replayDecision.canonicalHashes.semanticPayloadHash,
          }),
          promotionCommandActionRecordRef: action.actionRecordId,
          promotionCommandSettlementRecordRef: promotionCommandSettlementId,
          supersededAccessGrantRefs: liveGrantRefs,
          supersededDraftLeaseRefs: liveDraftLeaseRefs,
        });
        await drafts.supersedeDraftForPromotion({
          draftPublicId: input.draftPublicId,
          recordedAt: input.observedAt,
          governingObjectRef: projectionSnapshot.envelopeRef,
          reasonCodes: [
            "DRAFT_PROMOTED_IMMUTABLE_SUBMIT_BOUNDARY",
            "GAP_RESOLVED_POST_PROMOTION_RECOVERY_ROUTE_ENTRY_V1",
          ],
        });

        const normalizedSnapshot = frozenArtifacts.normalizedSubmission.toSnapshot();
        const freezeSnapshot = frozenArtifacts.freeze.toSnapshot();
        const promotionSnapshot = promoted.promotionRecord.toSnapshot();
        const previousReceiptEnvelope = await outcomes.outcomeRepositories.findLatestReceiptEnvelopeByReceiptConsistencyKey(
          promotionSnapshot.receiptConsistencyKey,
        );
        const safetyEvaluation = await synchronousSafety.services.synchronousSafety.evaluateFrozenSubmission(
          {
            episodeId: promoted.episode.episodeId,
            requestId: promoted.request.requestId,
            currentSafetyDecisionEpoch: promoted.request.toSnapshot().safetyDecisionEpoch,
            decidedAt: input.observedAt,
            evidenceCut: {
              requestId: promoted.request.requestId,
              submissionSnapshotFreezeRef: freezeSnapshot.submissionSnapshotFreezeId,
              evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
              normalizedSubmissionRef: normalizedSnapshot.normalizedSubmissionId,
              sourceLineageRef: projectionSnapshot.envelopeRef,
              requestTypeRef: normalizedSnapshot.requestType,
              requestShape: normalizedSnapshot.requestShape,
              activeStructuredAnswers: normalizedSnapshot.activeStructuredAnswers,
              authoredNarrativeText:
                normalizedSnapshot.authoredNarrative.authoredText ??
                normalizedSnapshot.authoredNarrative.canonicalText,
              summaryFragments: normalizedSnapshot.summaryFragments.map(
                (fragment) => fragment.fragmentText,
              ),
              attachmentRefs: normalizedSnapshot.attachmentRefs,
              contactPreferencesRef: normalizedSnapshot.contactPreferencesRef,
              contactAuthorityState: freezeSnapshot.contactAuthorityState,
              contactAuthorityClass: normalizedSnapshot.contactAuthorityClass,
              evidenceReadinessState: normalizedSnapshot.evidenceReadinessState,
              channelCapabilityCeiling: normalizedSnapshot.channelCapabilityCeiling,
              identityContext: freezeSnapshot.identityContext,
              frozenAt: freezeSnapshot.frozenAt,
            },
          },
        );
        const requestWithSafety = promoted.request
          .recordEvidence({
            evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
            evidenceClassificationRef:
              safetyEvaluation.classification.classificationDecisionId,
            updatedAt: input.observedAt,
          })
          .recordSafety({
            safetyState: safetyEvaluation.safetyDecision.requestedSafetyState,
            safetyDecisionRef: safetyEvaluation.safetyDecision.safetyDecisionId,
            safetyPreemptionRef: safetyEvaluation.preemption.preemptionId,
            updatedAt: input.observedAt,
            safetyDecisionEpoch: safetyEvaluation.safetyDecision.resultingSafetyEpoch,
          });
        let urgentDiversionSettlement: PersistedUrgentDiversionSettlementRow | null = null;
        let triageTask: Phase1TriageTaskSnapshot | null = null;
        let triageEtaForecast: Phase1TriageEtaForecastSnapshot | null = null;
        let patientStatusProjection: Phase1PatientStatusProjectionSnapshot | null = null;
        let persistedRequest = requestWithSafety.advanceWorkflow({
          nextState: "intake_normalized",
          updatedAt: input.observedAt,
        });
        if (safetyEvaluation.safetyDecision.requestedSafetyState === "urgent_diversion_required") {
          const predictedArtifactRef = buildPhase1OutcomeArtifactId({
            intakeSubmitSettlementRef: intakeSubmitSettlementId,
            result: "urgent_diversion",
            appliesToState: "urgent_diverted",
          });
          const issuedUrgentOutcome = await outcomes.urgentDiversionService.issueSettlement({
            requestId: promoted.request.requestId,
            safetyDecisionRef: safetyEvaluation.safetyDecision.safetyDecisionId,
            actionMode: "urgent_guidance_presented",
            presentationArtifactRef: predictedArtifactRef,
            authoritativeActionRef: action.actionRecordId,
            settlementState: "issued",
            issuedAt: input.observedAt,
            settledAt: input.observedAt,
          });
          urgentDiversionSettlement = issuedUrgentOutcome.urgentDiversionSettlement;
          persistedRequest = persistedRequest.recordSafety({
            safetyState: "urgent_diverted",
            safetyDecisionRef: safetyEvaluation.safetyDecision.safetyDecisionId,
            safetyPreemptionRef: safetyEvaluation.preemption.preemptionId,
            urgentDiversionSettlementRef:
              urgentDiversionSettlement.urgentDiversionSettlementId,
            updatedAt: input.observedAt,
            safetyDecisionEpoch: safetyEvaluation.safetyDecision.resultingSafetyEpoch,
          });
        } else {
          const previousReceiptSummary: PreviousReceiptEnvelopeSummary | null = previousReceiptEnvelope
            ? {
                receiptBucket: previousReceiptEnvelope.toSnapshot().receiptBucket,
                promiseState: previousReceiptEnvelope.toSnapshot().promiseState,
                etaLowerBoundAt: previousReceiptEnvelope.toSnapshot().etaLowerBoundAt,
                etaMedianAt: previousReceiptEnvelope.toSnapshot().etaMedianAt,
                etaUpperBoundAt: previousReceiptEnvelope.toSnapshot().etaUpperBoundAt,
                bucketConfidence: previousReceiptEnvelope.toSnapshot().bucketConfidence,
                monotoneRevision: previousReceiptEnvelope.toSnapshot().monotoneRevision,
              }
            : null;
          const triageResult = await triage.triageService.createTriageTask({
            requestRef: promoted.request.requestId,
            requestLineageRef: promoted.requestLineage.requestLineageId,
            submissionPromotionRecordRef: promoted.promotionRecord.promotionRecordId,
            normalizedSubmissionRef: frozenArtifacts.normalizedSubmission.normalizedSubmissionId,
            receiptConsistencyKey: promotionSnapshot.receiptConsistencyKey,
            statusConsistencyKey: promotionSnapshot.statusConsistencyKey,
            tenantId: promoted.request.toSnapshot().tenantId,
            requestTypeRef:
              frozenArtifacts.normalizedSubmission.toSnapshot().requestType,
            safetyState: safetyEvaluation.safetyDecision.requestedSafetyState,
            residualRiskRuleRefs:
              safetyEvaluation.safetyDecision.residualContributorRuleRefs,
            createdAt: input.observedAt,
            previousEnvelope: previousReceiptSummary,
          });
          triageTask = triageResult.triageTask;
          triageEtaForecast = triageResult.etaForecast;
          patientStatusProjection = triageResult.patientStatusProjection;
          persistedRequest = persistedRequest.advanceWorkflow({
            nextState: "triage_ready",
            currentTriageTaskRef: triageResult.triageTask.triageTaskId,
            assignedQueueRef: triageResult.triageTask.workflowQueueRef,
            updatedAt: input.observedAt,
          });
          const persistedRequestLineage = await repositories.getRequestLineage(
            promoted.requestLineage.requestLineageId,
          );
          invariant(
            !!persistedRequestLineage,
            `RequestLineage ${promoted.requestLineage.requestLineageId} not found.`,
          );
          await repositories.saveRequestLineage(
            persistedRequestLineage.updateSummary({
              latestTriageTaskRef: triageResult.triageTask.triageTaskId,
              latestDecisionEpochRef: `${promoted.request.requestId}::safety_epoch::${safetyEvaluation.safetyDecision.resultingSafetyEpoch}`,
              updatedAt: input.observedAt,
            }),
            {
              expectedVersion: persistedRequestLineage.version,
            },
          );
        }
        await repositories.saveRequest(persistedRequest, {
          expectedVersion: promoted.request.version,
        });

        const commandSettlement = buildCommandSettlementRecord({
          settlementId: promotionCommandSettlementId,
          actionRecordRef: action.actionRecordId,
          decisionClass: "new_lineage",
          result: "applied",
          authoritativeOutcomeState: "settled",
          proofClass: "projection_visible",
          recordedAt: input.observedAt,
          projectionVisibilityRef: `projection://request/${promoted.request.requestId}/${persistedRequest.toSnapshot().workflowState}`,
          quietEligibleAt: addMinutes(input.observedAt, 1),
          auditRecordRef: `audit://phase1-submit/${intakeSubmitSettlementId}`,
        });
        await commandRepositories.saveCommandSettlementRecord(commandSettlement);

        for (const attachment of attachmentStates) {
          if (attachment.documentReferenceState !== "created") {
            continue;
          }
          await attachmentApp.bindPromotedRequestAttachment({
            attachmentPublicId: attachment.attachmentRef,
            requestPublicId: toRequestPublicId(promoted.request.requestId) ?? promoted.request.requestId,
            boundAt: input.observedAt,
          });
        }

        const settlement = IntakeSubmitSettlementDocument.create({
          settlementSchemaVersion: "INTAKE_SUBMIT_SETTLEMENT_V1",
          intakeSubmitSettlementId,
          decisionClass: "new_lineage",
          settlementState: "request_submitted",
          envelopeRef: projectionSnapshot.envelopeRef,
          draftPublicId: projectionSnapshot.draftPublicId,
          sourceLineageRef: projectionSnapshot.envelopeRef,
          requestRef: promoted.request.requestId,
          requestLineageRef: promoted.requestLineage.requestLineageId,
          promotionRecordRef: promoted.promotionRecord.promotionRecordId,
          submissionSnapshotFreezeRef: frozenArtifacts.freeze.submissionSnapshotFreezeId,
          evidenceCaptureBundleRef: frozenArtifacts.captureBundle.captureBundleId,
          evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
          normalizedSubmissionRef: frozenArtifacts.normalizedSubmission.normalizedSubmissionId,
          collisionReviewRef: null,
          commandActionRecordRef: action.actionRecordId,
          commandSettlementRecordRef: commandSettlement.settlementId,
          routeIntentBindingRef: routeTuple.routeIntentBindingRef,
          receiptConsistencyKey: promoted.promotionRecord.toSnapshot().receiptConsistencyKey,
          statusConsistencyKey: promoted.promotionRecord.toSnapshot().statusConsistencyKey,
          reasonCodes: ["GAP_RESOLVED_SUBMISSION_PROMOTION_TRANSACTION_V1"],
          gapRefs: [],
          recordedAt: input.observedAt,
        });
        await transactionRepositories.saveIntakeSubmitSettlement(settlement);
        const requestPublicId = toRequestPublicId(promoted.request.requestId);
        const outcomeResult = await outcomes.outcomeGrammarService.settleOutcome({
          intakeSubmitSettlementRef: intakeSubmitSettlementId,
          draftPublicId: projectionSnapshot.draftPublicId,
          requestRef: promoted.request.requestId,
          requestLineageRef: promoted.requestLineage.requestLineageId,
          requestPublicId,
          submissionPromotionRecordRef: promoted.promotionRecord.promotionRecordId,
          normalizedSubmissionRef: frozenArtifacts.normalizedSubmission.normalizedSubmissionId,
          receiptConsistencyKey: promoted.promotionRecord.toSnapshot().receiptConsistencyKey,
          statusConsistencyKey: promoted.promotionRecord.toSnapshot().statusConsistencyKey,
          result:
            safetyEvaluation.safetyDecision.requestedSafetyState === "urgent_diversion_required"
              ? "urgent_diversion"
              : "triage_ready",
          appliesToState:
            safetyEvaluation.safetyDecision.requestedSafetyState === "urgent_diversion_required"
              ? "urgent_diverted"
              : safetyEvaluation.safetyDecision.requestedSafetyState,
          routeFamilyRef: routeTuple.routeFamilyRef,
          routeIntentBindingRef: routeTuple.routeIntentBindingRef,
          audienceSurfaceRuntimeBindingRef: routeTuple.audienceSurfaceRuntimeBindingRef,
          surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
          runtimePublicationBundleRef: "rpb::local::authoritative",
          releasePublicationParityRef: "rpp::local::authoritative",
          continuityKey: projectionSnapshot.shellContinuityKey,
          selectedAnchorRef: projectionSnapshot.selectedAnchorKey,
          returnTargetRef: buildAuthoritativeRequestRoute(
            requestPublicId,
            promoted.request.requestId,
          ),
          urgentDiversionSettlementRef:
            urgentDiversionSettlement?.urgentDiversionSettlementId ?? null,
          receiptEnvelopeOverride:
            triageEtaForecast && patientStatusProjection
              ? {
                  receiptBucket: triageEtaForecast.receiptBucket,
                  etaPromiseRef: triageEtaForecast.etaPromiseRef,
                  etaLowerBoundAt: triageEtaForecast.etaLowerBoundAt,
                  etaMedianAt: triageEtaForecast.etaMedianAt,
                  etaUpperBoundAt: triageEtaForecast.etaUpperBoundAt,
                  bucketConfidence: triageEtaForecast.bucketConfidence,
                  promiseState: triageEtaForecast.promiseState,
                  calibrationVersionRef: triageEtaForecast.calibrationVersionRef,
                  statusProjectionVersionRef:
                    patientStatusProjection.patientStatusProjectionId,
                  causalToken: triageEtaForecast.triageEtaForecastId,
                  monotoneRevision:
                    (previousReceiptEnvelope?.toSnapshot().monotoneRevision ?? 0) + 1,
                }
              : undefined,
          recordedAt: input.observedAt,
        });
        const confirmationDispatchResult =
          triageTask && outcomeResult.receiptEnvelope
            ? await confirmationDispatch.queueRoutineConfirmation({
                requestRef: promoted.request.requestId,
                requestLineageRef: promoted.requestLineage.requestLineageId,
                triageTaskRef: triageTask.triageTaskId,
                receiptEnvelopeRef: outcomeResult.receiptEnvelope.consistencyEnvelopeId,
                outcomeArtifactRef:
                  outcomeResult.artifact.intakeOutcomePresentationArtifactId,
                routeSubjectRef: promoted.request.requestId,
                contactSummary: contactSummary ?? null,
                queuedAt: input.observedAt,
              })
            : null;

        return {
          decisionClass: "new_lineage",
          replayed: false,
          settlement,
          transitionEnvelope: buildSubmitTransitionEnvelope({
            action,
            settlement: commandSettlement,
            entityRef: promoted.request.requestId,
            targetIntent: "authoritative_request_shell",
            localAckState: "local_ack",
            settlementPolicy: "projection_token",
          }),
          commandAction: action,
          commandSettlement,
          submissionSnapshotFreeze: frozenArtifacts.freeze,
          normalizedSubmission: frozenArtifacts.normalizedSubmission,
          normalizationSeed: frozenArtifacts.normalizationSeed,
          evidenceClassification: safetyEvaluation.classification,
          safetyPreemption: safetyEvaluation.preemption,
          safetyDecision: safetyEvaluation.safetyDecision,
          urgentDiversionSettlement,
          outcomeTuple: outcomeResult.tuple,
          outcomePresentationArtifact: outcomeResult.artifact,
          receiptConsistencyEnvelope: outcomeResult.receiptEnvelope,
          outboundNavigationGrant: outcomeResult.outboundNavigationGrant,
          triageTask,
          triageEtaForecast,
          patientStatusProjection,
          evidenceCaptureBundleRef: frozenArtifacts.captureBundle.captureBundleId,
          evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
          requestRef: promoted.request.requestId,
          requestLineageRef: promoted.requestLineage.requestLineageId,
          promotionRecordRef: promoted.promotionRecord.promotionRecordId,
          reasonCodes: ["GAP_RESOLVED_SUBMISSION_PROMOTION_TRANSACTION_V1"],
          events: [
            emitIntakeNormalized({
              envelopeId: projectionSnapshot.envelopeRef,
              normalizedSubmissionRef: frozenArtifacts.normalizedSubmission.normalizedSubmissionId,
            }),
            emitRequestSnapshotCreated({
              envelopeId: projectionSnapshot.envelopeRef,
              evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
            }),
            emitRequestSafetyClassified({
              requestId: promoted.request.requestId,
              evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
              classificationDecisionRef:
                safetyEvaluation.classification.classificationDecisionId,
              dominantEvidenceClass: safetyEvaluation.classification.dominantEvidenceClass,
              misclassificationRiskState:
                safetyEvaluation.classification.misclassificationRiskState,
            }),
            emitRequestSafetyPreempted({
              requestId: promoted.request.requestId,
              preemptionRef: safetyEvaluation.preemption.preemptionId,
              openingSafetyEpoch: safetyEvaluation.preemption.openingSafetyEpoch,
              status: safetyEvaluation.preemption.status,
              reasonCode: safetyEvaluation.preemption.reasonCode,
            }),
            emitRequestSafetyDecided({
              requestId: promoted.request.requestId,
              safetyDecisionRef: safetyEvaluation.safetyDecision.safetyDecisionId,
              requestedSafetyState:
                safetyEvaluation.safetyDecision.requestedSafetyState,
              decisionOutcome: safetyEvaluation.safetyDecision.decisionOutcome,
              resultingSafetyEpoch:
                safetyEvaluation.safetyDecision.resultingSafetyEpoch,
            }),
            ...(safetyEvaluation.safetyDecision.requestedSafetyState ===
            "urgent_diversion_required"
              ? [
                  emitRequestSafetyUrgentDiversionRequired({
                    requestId: promoted.request.requestId,
                    safetyDecisionRef:
                      safetyEvaluation.safetyDecision.safetyDecisionId,
                    preemptionRef: safetyEvaluation.preemption.preemptionId,
                    resultingSafetyEpoch:
                      safetyEvaluation.safetyDecision.resultingSafetyEpoch,
                  }),
                ]
              : []),
            ...(triageTask
              ? [
                  makeFoundationEvent("triage.task.created", {
                    governingRef: promoted.request.requestId,
                    governingVersionRef: triageTask.triageTaskId,
                    previousState: "not_created",
                    nextState: triageTask.taskState,
                    stateAxis: "triage_task_lifecycle",
                    triageTaskRef: triageTask.triageTaskId,
                    workflowQueueRef: triageTask.workflowQueueRef,
                  }),
                ]
              : []),
            ...buildOutcomeEvents({
              requestRef: promoted.request.requestId,
              evidenceSnapshotRef: frozenArtifacts.evidenceSnapshot.evidenceSnapshotId,
              evidenceClass: safetyEvaluation.classification.dominantEvidenceClass,
              outcomeTuple: outcomeResult.tuple,
              outcomePresentationArtifact: outcomeResult.artifact,
              receiptConsistencyEnvelope: outcomeResult.receiptEnvelope,
              urgentDiversionSettlement,
            }),
            ...(confirmationDispatchResult?.events ?? []),
            ...promoted.events,
          ],
        };
      });
    },
  };

  return application;
}
