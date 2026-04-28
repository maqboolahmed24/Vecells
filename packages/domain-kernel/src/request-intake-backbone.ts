export type SubmissionSourceChannel =
  | "self_service_form"
  | "telephony_capture"
  | "secure_link_continuation"
  | "support_assisted_capture";

export type SurfaceChannelProfile =
  | "browser"
  | "embedded"
  | "telephony"
  | "secure_link"
  | "support_console";

export type SubmissionEnvelopeState =
  | "draft"
  | "evidence_pending"
  | "ready_to_promote"
  | "promoted"
  | "abandoned"
  | "expired";

export type RetentionClass = "pre_submission" | "clinically_material_pre_submit";

export type RequestWorkflowState =
  | "submitted"
  | "intake_normalized"
  | "triage_ready"
  | "triage_active"
  | "handoff_active"
  | "outcome_recorded"
  | "closed";

export type RequestSafetyState =
  | "not_screened"
  | "screen_clear"
  | "residual_risk_flagged"
  | "urgent_diversion_required"
  | "urgent_diverted";

export type RequestIdentityState = "anonymous" | "partial_match" | "matched" | "claimed";

export type RequestLineageBranchClass =
  | "primary_submission"
  | "same_request_continuation"
  | "same_episode_branch"
  | "related_episode_branch";

export type ContinuityWitnessClass =
  | "envelope_promotion"
  | "duplicate_resolution"
  | "workflow_return"
  | "more_info_cycle"
  | "telephony_continuation"
  | "manual_link";

export type RequestLineageState = "active" | "closure_pending" | "closed" | "superseded";

export type LineageCaseFamily =
  | "callback"
  | "clinician_message"
  | "booking"
  | "hub"
  | "pharmacy"
  | "admin_resolution"
  | "support_follow_up"
  | "exception";

export type LineageCaseLinkReason =
  | "direct_handoff"
  | "same_request_continuation"
  | "same_episode_related_work"
  | "related_episode_branch"
  | "bounce_back"
  | "recovery_follow_on"
  | "operational_follow_up";

export type LineageCaseOwnershipState =
  | "proposed"
  | "acknowledged"
  | "active"
  | "returned"
  | "closed"
  | "superseded"
  | "compensated";

export interface CompareAndSetWriteOptions {
  expectedVersion?: number;
}

export interface BackboneIdGenerator {
  nextId(kind: BackboneIdKind): string;
}

export type BackboneIdKind =
  | "submissionEnvelope"
  | "request"
  | "requestLineage"
  | "lineageCaseLink"
  | "episode"
  | "submissionPromotionRecord"
  | "idempotencyRecord"
  | "replayCollisionReview"
  | "adapterDispatchAttempt"
  | "adapterReceiptCheckpoint";

export function createDeterministicBackboneIdGenerator(seed = "foundation"): BackboneIdGenerator {
  const counters = new Map<BackboneIdKind, number>();

  return {
    nextId(kind: BackboneIdKind): string {
      const next = (counters.get(kind) ?? 0) + 1;
      counters.set(kind, next);
      return `${seed}_${kind}_${String(next).padStart(4, "0")}`;
    },
  };
}

export class RequestBackboneInvariantError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RequestBackboneInvariantError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

const requestWorkflowTransitions: Record<RequestWorkflowState, readonly RequestWorkflowState[]> = {
  submitted: ["intake_normalized"],
  intake_normalized: ["triage_ready"],
  triage_ready: ["triage_active"],
  triage_active: ["handoff_active", "outcome_recorded"],
  handoff_active: ["outcome_recorded"],
  outcome_recorded: ["closed"],
  closed: [],
};

const lineageOwnershipTransitions: Record<
  LineageCaseOwnershipState,
  readonly LineageCaseOwnershipState[]
> = {
  proposed: ["acknowledged", "active", "closed", "superseded"],
  acknowledged: ["active", "returned", "closed", "superseded", "compensated"],
  active: ["returned", "closed", "superseded", "compensated"],
  returned: ["closed", "superseded", "compensated"],
  closed: ["compensated"],
  superseded: [],
  compensated: [],
};

export interface SubmissionEnvelopeSnapshot {
  envelopeId: string;
  sourceChannel: SubmissionSourceChannel;
  initialSurfaceChannelProfile: SurfaceChannelProfile;
  intakeConvergenceContractRef: string;
  sourceLineageRef: string;
  state: SubmissionEnvelopeState;
  latestIngressRecordRef: string | null;
  latestEvidenceSnapshotRef: string | null;
  currentNormalizedSubmissionRef: string | null;
  retentionClass: RetentionClass;
  verifiedSubjectRef: string | null;
  candidatePatientRefs: readonly string[];
  candidateEpisodeRef: string | null;
  candidateRequestRef: string | null;
  promotionDecisionRef: string | null;
  promotionRecordRef: string | null;
  expiresAt: string | null;
  promotedRequestRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RequestSnapshot {
  requestId: string;
  episodeId: string;
  originEnvelopeRef: string;
  promotionRecordRef: string;
  requestVersion: number;
  tenantId: string;
  sourceChannel: SubmissionSourceChannel;
  originIngressRecordRef: string;
  normalizedSubmissionRef: string;
  requestType: string;
  narrativeRef: string | null;
  structuredDataRef: string | null;
  attachmentRefs: readonly string[];
  contactPreferencesRef: string | null;
  workflowState: RequestWorkflowState;
  safetyState: RequestSafetyState;
  identityState: RequestIdentityState;
  priorityBand: string | null;
  pathwayRef: string | null;
  assignedQueueRef: string | null;
  patientRef: string | null;
  currentIdentityBindingRef: string | null;
  currentEvidenceSnapshotRef: string | null;
  currentEvidenceAssimilationRef: string | null;
  currentMaterialDeltaAssessmentRef: string | null;
  currentEvidenceClassificationRef: string | null;
  currentSafetyPreemptionRef: string | null;
  currentSafetyDecisionRef: string | null;
  currentUrgentDiversionSettlementRef: string | null;
  safetyDecisionEpoch: number;
  requestLineageRef: string;
  currentTriageTaskRef: string | null;
  latestLineageCaseLinkRef: string | null;
  activeLineageCaseLinkRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
  currentClosureBlockerRefs: readonly string[];
  slaClockRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RequestLineageSnapshot {
  requestLineageId: string;
  episodeRef: string;
  requestRef: string;
  originEnvelopeRef: string | null;
  submissionPromotionRecordRef: string | null;
  branchClass: RequestLineageBranchClass;
  branchDecisionRef: string | null;
  continuityWitnessClass: ContinuityWitnessClass;
  continuityWitnessRef: string;
  latestTriageTaskRef: string | null;
  latestDecisionEpochRef: string | null;
  latestClosureRecordRef: string | null;
  activeLineageCaseLinkRefs: readonly string[];
  latestLineageCaseLinkRef: string | null;
  lineageState: RequestLineageState;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface LineageCaseLinkSnapshot {
  lineageCaseLinkId: string;
  requestLineageRef: string;
  episodeRef: string;
  requestRef: string;
  caseFamily: LineageCaseFamily;
  domainCaseRef: string;
  parentLineageCaseLinkRef: string | null;
  originDecisionEpochRef: string | null;
  originDecisionSupersessionRef: string | null;
  originTriageTaskRef: string | null;
  originDuplicateResolutionDecisionRef: string | null;
  linkReason: LineageCaseLinkReason;
  ownershipState: LineageCaseOwnershipState;
  currentClosureBlockerRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
  latestMilestoneRef: string | null;
  returnToTriageRef: string | null;
  openedAt: string;
  closedAt: string | null;
  supersededAt: string | null;
  updatedAt: string;
  version: number;
}

export interface PersistedSubmissionEnvelopeRow extends SubmissionEnvelopeSnapshot {
  aggregateType: "SubmissionEnvelope";
  persistenceSchemaVersion: 1;
}

export interface PersistedRequestRow extends RequestSnapshot {
  aggregateType: "Request";
  persistenceSchemaVersion: 1;
}

export interface PersistedRequestLineageRow extends RequestLineageSnapshot {
  aggregateType: "RequestLineage";
  persistenceSchemaVersion: 1;
}

export interface PersistedLineageCaseLinkRow extends LineageCaseLinkSnapshot {
  aggregateType: "LineageCaseLink";
  persistenceSchemaVersion: 1;
}

export function serializeSubmissionEnvelope(
  aggregate: SubmissionEnvelopeAggregate,
): PersistedSubmissionEnvelopeRow {
  return {
    aggregateType: "SubmissionEnvelope",
    persistenceSchemaVersion: 1,
    ...aggregate.toSnapshot(),
  };
}

export function serializeRequest(aggregate: RequestAggregate): PersistedRequestRow {
  return {
    aggregateType: "Request",
    persistenceSchemaVersion: 1,
    ...aggregate.toSnapshot(),
  };
}

export function serializeRequestLineage(
  aggregate: RequestLineageAggregate,
): PersistedRequestLineageRow {
  return {
    aggregateType: "RequestLineage",
    persistenceSchemaVersion: 1,
    ...aggregate.toSnapshot(),
  };
}

export function serializeLineageCaseLink(
  aggregate: LineageCaseLinkAggregate,
): PersistedLineageCaseLinkRow {
  return {
    aggregateType: "LineageCaseLink",
    persistenceSchemaVersion: 1,
    ...aggregate.toSnapshot(),
  };
}

export function hydrateSubmissionEnvelope(
  row: PersistedSubmissionEnvelopeRow,
): SubmissionEnvelopeAggregate {
  return SubmissionEnvelopeAggregate.hydrate(row);
}

export function hydrateRequest(row: PersistedRequestRow): RequestAggregate {
  return RequestAggregate.hydrate(row);
}

export function hydrateRequestLineage(row: PersistedRequestLineageRow): RequestLineageAggregate {
  return RequestLineageAggregate.hydrate(row);
}

export function hydrateLineageCaseLink(row: PersistedLineageCaseLinkRow): LineageCaseLinkAggregate {
  return LineageCaseLinkAggregate.hydrate(row);
}

export interface SubmissionEnvelopeRepository {
  getSubmissionEnvelope(envelopeId: string): Promise<SubmissionEnvelopeAggregate | undefined>;
  saveSubmissionEnvelope(
    envelope: SubmissionEnvelopeAggregate,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findSubmissionEnvelopeBySourceLineage(
    sourceLineageRef: string,
  ): Promise<SubmissionEnvelopeAggregate | undefined>;
  listSubmissionEnvelopes(): Promise<readonly SubmissionEnvelopeAggregate[]>;
}

export interface RequestRepository {
  getRequest(requestId: string): Promise<RequestAggregate | undefined>;
  saveRequest(request: RequestAggregate, options?: CompareAndSetWriteOptions): Promise<void>;
  listRequests(): Promise<readonly RequestAggregate[]>;
}

export interface RequestLineageRepository {
  getRequestLineage(requestLineageId: string): Promise<RequestLineageAggregate | undefined>;
  saveRequestLineage(
    lineage: RequestLineageAggregate,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listRequestLineages(): Promise<readonly RequestLineageAggregate[]>;
}

export interface LineageCaseLinkRepository {
  getLineageCaseLink(lineageCaseLinkId: string): Promise<LineageCaseLinkAggregate | undefined>;
  saveLineageCaseLink(
    link: LineageCaseLinkAggregate,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findActiveLineageCaseLinksForRequestLineage(
    requestLineageId: string,
  ): Promise<readonly LineageCaseLinkAggregate[]>;
  listLineageCaseLinks(): Promise<readonly LineageCaseLinkAggregate[]>;
}

export interface CreateSubmissionEnvelopeInput {
  envelopeId: string;
  sourceChannel: SubmissionSourceChannel;
  initialSurfaceChannelProfile: SurfaceChannelProfile;
  intakeConvergenceContractRef: string;
  sourceLineageRef: string;
  createdAt: string;
  expiresAt?: string | null;
  retentionClass?: RetentionClass;
}

export interface AppendSubmissionIngressInput {
  ingressRecordRef: string;
  updatedAt: string;
}

export interface RecordSubmissionEvidenceInput {
  evidenceSnapshotRef: string;
  updatedAt: string;
  retentionClass?: RetentionClass;
}

export interface RecordNormalizedSubmissionInput {
  normalizedSubmissionRef: string;
  updatedAt: string;
  candidatePatientRefs?: readonly string[];
  candidateEpisodeRef?: string | null;
  candidateRequestRef?: string | null;
  verifiedSubjectRef?: string | null;
}

export interface MarkEnvelopeReadyInput {
  promotionDecisionRef: string;
  updatedAt: string;
}

export interface PromoteEnvelopeInput {
  promotionRecordRef: string;
  promotedRequestRef: string;
  updatedAt: string;
}

export class SubmissionEnvelopeAggregate {
  private readonly snapshot: SubmissionEnvelopeSnapshot;

  private constructor(snapshot: SubmissionEnvelopeSnapshot) {
    this.snapshot = SubmissionEnvelopeAggregate.normalize(snapshot);
  }

  static create(input: CreateSubmissionEnvelopeInput): SubmissionEnvelopeAggregate {
    return new SubmissionEnvelopeAggregate({
      envelopeId: requireRef(input.envelopeId, "envelopeId"),
      sourceChannel: input.sourceChannel,
      initialSurfaceChannelProfile: input.initialSurfaceChannelProfile,
      intakeConvergenceContractRef: requireRef(
        input.intakeConvergenceContractRef,
        "intakeConvergenceContractRef",
      ),
      sourceLineageRef: requireRef(input.sourceLineageRef, "sourceLineageRef"),
      state: "draft",
      latestIngressRecordRef: null,
      latestEvidenceSnapshotRef: null,
      currentNormalizedSubmissionRef: null,
      retentionClass: input.retentionClass ?? "pre_submission",
      verifiedSubjectRef: null,
      candidatePatientRefs: [],
      candidateEpisodeRef: null,
      candidateRequestRef: null,
      promotionDecisionRef: null,
      promotionRecordRef: null,
      expiresAt: input.expiresAt ?? null,
      promotedRequestRef: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      version: 1,
    });
  }

  static hydrate(snapshot: SubmissionEnvelopeSnapshot): SubmissionEnvelopeAggregate {
    return new SubmissionEnvelopeAggregate(snapshot);
  }

  private static normalize(snapshot: SubmissionEnvelopeSnapshot): SubmissionEnvelopeSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_ENVELOPE_VERSION",
      "SubmissionEnvelope version must be >= 1.",
    );
    const normalized: SubmissionEnvelopeSnapshot = {
      ...snapshot,
      envelopeId: requireRef(snapshot.envelopeId, "envelopeId"),
      intakeConvergenceContractRef: requireRef(
        snapshot.intakeConvergenceContractRef,
        "intakeConvergenceContractRef",
      ),
      sourceLineageRef: requireRef(snapshot.sourceLineageRef, "sourceLineageRef"),
      candidatePatientRefs: uniqueSortedRefs(snapshot.candidatePatientRefs),
    };

    if (normalized.state === "promoted") {
      invariant(
        normalized.promotionRecordRef && normalized.promotedRequestRef,
        "PROMOTED_ENVELOPE_MISSING_BRIDGE",
        "Promoted envelopes require promotion and request references.",
      );
    }

    return normalized;
  }

  get version(): number {
    return this.snapshot.version;
  }

  get state(): SubmissionEnvelopeState {
    return this.snapshot.state;
  }

  get envelopeId(): string {
    return this.snapshot.envelopeId;
  }

  toSnapshot(): SubmissionEnvelopeSnapshot {
    return {
      ...this.snapshot,
      candidatePatientRefs: [...this.snapshot.candidatePatientRefs],
    };
  }

  appendIngress(input: AppendSubmissionIngressInput): SubmissionEnvelopeAggregate {
    invariant(
      !["promoted", "abandoned", "expired"].includes(this.snapshot.state),
      "ENVELOPE_APPEND_FORBIDDEN",
      "Promoted or terminal envelopes cannot accept new ingress records.",
    );

    return new SubmissionEnvelopeAggregate({
      ...this.snapshot,
      latestIngressRecordRef: requireRef(input.ingressRecordRef, "ingressRecordRef"),
      state: this.snapshot.state === "draft" ? "evidence_pending" : "evidence_pending",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  recordEvidenceSnapshot(input: RecordSubmissionEvidenceInput): SubmissionEnvelopeAggregate {
    invariant(
      !["promoted", "abandoned", "expired"].includes(this.snapshot.state),
      "ENVELOPE_EVIDENCE_FORBIDDEN",
      "Promoted or terminal envelopes cannot accept new evidence snapshots.",
    );

    return new SubmissionEnvelopeAggregate({
      ...this.snapshot,
      latestEvidenceSnapshotRef: requireRef(input.evidenceSnapshotRef, "evidenceSnapshotRef"),
      retentionClass: input.retentionClass ?? this.snapshot.retentionClass,
      state: "evidence_pending",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  recordNormalizedSubmission(input: RecordNormalizedSubmissionInput): SubmissionEnvelopeAggregate {
    invariant(
      !["promoted", "abandoned", "expired"].includes(this.snapshot.state),
      "ENVELOPE_NORMALIZATION_FORBIDDEN",
      "Promoted or terminal envelopes cannot accept new normalized submissions.",
    );

    return new SubmissionEnvelopeAggregate({
      ...this.snapshot,
      currentNormalizedSubmissionRef: requireRef(
        input.normalizedSubmissionRef,
        "normalizedSubmissionRef",
      ),
      candidatePatientRefs:
        input.candidatePatientRefs === undefined
          ? this.snapshot.candidatePatientRefs
          : uniqueSortedRefs(input.candidatePatientRefs),
      candidateEpisodeRef: input.candidateEpisodeRef ?? this.snapshot.candidateEpisodeRef,
      candidateRequestRef: input.candidateRequestRef ?? this.snapshot.candidateRequestRef,
      verifiedSubjectRef: input.verifiedSubjectRef ?? this.snapshot.verifiedSubjectRef,
      state: "evidence_pending",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markReadyToPromote(input: MarkEnvelopeReadyInput): SubmissionEnvelopeAggregate {
    invariant(
      this.snapshot.latestIngressRecordRef,
      "ENVELOPE_READY_MISSING_INGRESS",
      "SubmissionEnvelope requires an immutable ingress record before promotion readiness.",
    );
    invariant(
      this.snapshot.latestEvidenceSnapshotRef,
      "ENVELOPE_READY_MISSING_EVIDENCE",
      "SubmissionEnvelope requires a frozen evidence snapshot before promotion readiness.",
    );
    invariant(
      this.snapshot.currentNormalizedSubmissionRef,
      "ENVELOPE_READY_MISSING_NORMALIZED_SUBMISSION",
      "SubmissionEnvelope requires canonical normalization before readiness.",
    );
    invariant(
      !["promoted", "abandoned", "expired"].includes(this.snapshot.state),
      "ENVELOPE_READY_FORBIDDEN",
      "Terminal envelopes cannot become ready to promote.",
    );

    return new SubmissionEnvelopeAggregate({
      ...this.snapshot,
      state: "ready_to_promote",
      promotionDecisionRef: requireRef(input.promotionDecisionRef, "promotionDecisionRef"),
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  promote(input: PromoteEnvelopeInput): SubmissionEnvelopeAggregate {
    if (this.snapshot.state === "promoted") {
      invariant(
        this.snapshot.promotionRecordRef === input.promotionRecordRef &&
          this.snapshot.promotedRequestRef === input.promotedRequestRef,
        "ENVELOPE_PROMOTION_REPLAY_MISMATCH",
        "Promotion replay must resolve to the same request and promotion record.",
      );
      return this;
    }

    invariant(
      this.snapshot.state === "ready_to_promote",
      "ENVELOPE_NOT_READY_TO_PROMOTE",
      "Only ready_to_promote envelopes may cross the submission boundary.",
    );

    return new SubmissionEnvelopeAggregate({
      ...this.snapshot,
      state: "promoted",
      promotionRecordRef: requireRef(input.promotionRecordRef, "promotionRecordRef"),
      promotedRequestRef: requireRef(input.promotedRequestRef, "promotedRequestRef"),
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  abandon(updatedAt: string): SubmissionEnvelopeAggregate {
    invariant(
      this.snapshot.state !== "promoted",
      "ENVELOPE_ABANDON_AFTER_PROMOTION",
      "Promoted envelopes may not be abandoned.",
    );

    return new SubmissionEnvelopeAggregate({
      ...this.snapshot,
      state: "abandoned",
      updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  expire(updatedAt: string): SubmissionEnvelopeAggregate {
    invariant(
      this.snapshot.state !== "promoted",
      "ENVELOPE_EXPIRE_AFTER_PROMOTION",
      "Promoted envelopes may not expire.",
    );

    return new SubmissionEnvelopeAggregate({
      ...this.snapshot,
      state: "expired",
      updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface CreateRequestInput {
  requestId: string;
  episodeId: string;
  originEnvelopeRef: string;
  promotionRecordRef: string;
  tenantId: string;
  sourceChannel: SubmissionSourceChannel;
  originIngressRecordRef: string;
  normalizedSubmissionRef: string;
  requestType: string;
  requestLineageRef: string;
  createdAt: string;
  narrativeRef?: string | null;
  structuredDataRef?: string | null;
  attachmentRefs?: readonly string[];
  contactPreferencesRef?: string | null;
  priorityBand?: string | null;
  pathwayRef?: string | null;
  assignedQueueRef?: string | null;
  patientRef?: string | null;
  currentIdentityBindingRef?: string | null;
  identityState?: RequestIdentityState;
  safetyState?: RequestSafetyState;
  currentEvidenceSnapshotRef?: string | null;
  currentConfirmationGateRefs?: readonly string[];
  currentClosureBlockerRefs?: readonly string[];
  slaClockRef?: string | null;
}

export interface AdvanceRequestWorkflowInput {
  nextState: RequestWorkflowState;
  updatedAt: string;
  currentTriageTaskRef?: string | null;
  assignedQueueRef?: string | null;
}

export interface BindRequestIdentityInput {
  identityBindingRef: string;
  patientRef: string | null;
  identityState: Extract<RequestIdentityState, "matched" | "claimed">;
  updatedAt: string;
}

export interface RecordRequestEvidenceInput {
  evidenceSnapshotRef: string;
  updatedAt: string;
  evidenceAssimilationRef?: string | null;
  materialDeltaAssessmentRef?: string | null;
  evidenceClassificationRef?: string | null;
}

export interface RecordRequestSafetyInput {
  safetyState: RequestSafetyState;
  safetyDecisionRef: string | null;
  updatedAt: string;
  safetyDecisionEpoch?: number;
  safetyPreemptionRef?: string | null;
  urgentDiversionSettlementRef?: string | null;
}

export interface RefreshRequestLineageSummaryInput {
  latestLineageCaseLinkRef: string | null;
  activeLineageCaseLinkRefs: readonly string[];
  currentConfirmationGateRefs?: readonly string[];
  currentClosureBlockerRefs?: readonly string[];
  updatedAt: string;
}

export class RequestAggregate {
  private readonly snapshot: RequestSnapshot;

  private constructor(snapshot: RequestSnapshot) {
    this.snapshot = RequestAggregate.normalize(snapshot);
  }

  static create(input: CreateRequestInput): RequestAggregate {
    return new RequestAggregate({
      requestId: requireRef(input.requestId, "requestId"),
      episodeId: requireRef(input.episodeId, "episodeId"),
      originEnvelopeRef: requireRef(input.originEnvelopeRef, "originEnvelopeRef"),
      promotionRecordRef: requireRef(input.promotionRecordRef, "promotionRecordRef"),
      requestVersion: 1,
      tenantId: requireRef(input.tenantId, "tenantId"),
      sourceChannel: input.sourceChannel,
      originIngressRecordRef: requireRef(input.originIngressRecordRef, "originIngressRecordRef"),
      normalizedSubmissionRef: requireRef(input.normalizedSubmissionRef, "normalizedSubmissionRef"),
      requestType: requireRef(input.requestType, "requestType"),
      narrativeRef: input.narrativeRef ?? null,
      structuredDataRef: input.structuredDataRef ?? null,
      attachmentRefs: uniqueSortedRefs(input.attachmentRefs ?? []),
      contactPreferencesRef: input.contactPreferencesRef ?? null,
      workflowState: "submitted",
      safetyState: input.safetyState ?? "not_screened",
      identityState: input.identityState ?? "anonymous",
      priorityBand: input.priorityBand ?? null,
      pathwayRef: input.pathwayRef ?? null,
      assignedQueueRef: input.assignedQueueRef ?? null,
      patientRef: input.patientRef ?? null,
      currentIdentityBindingRef: input.currentIdentityBindingRef ?? null,
      currentEvidenceSnapshotRef: input.currentEvidenceSnapshotRef ?? null,
      currentEvidenceAssimilationRef: null,
      currentMaterialDeltaAssessmentRef: null,
      currentEvidenceClassificationRef: null,
      currentSafetyPreemptionRef: null,
      currentSafetyDecisionRef: null,
      currentUrgentDiversionSettlementRef: null,
      safetyDecisionEpoch: 0,
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      currentTriageTaskRef: null,
      latestLineageCaseLinkRef: null,
      activeLineageCaseLinkRefs: [],
      currentConfirmationGateRefs: uniqueSortedRefs(input.currentConfirmationGateRefs ?? []),
      currentClosureBlockerRefs: uniqueSortedRefs(input.currentClosureBlockerRefs ?? []),
      slaClockRef: input.slaClockRef ?? null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      version: 1,
    });
  }

  static hydrate(snapshot: RequestSnapshot): RequestAggregate {
    return new RequestAggregate(snapshot);
  }

  private static normalize(snapshot: RequestSnapshot): RequestSnapshot {
    invariant(snapshot.version >= 1, "INVALID_REQUEST_VERSION", "Request version must be >= 1.");
    invariant(
      snapshot.requestVersion === snapshot.version,
      "REQUEST_VERSION_DRIFT",
      "Request requestVersion must stay aligned with persistence version.",
    );
    invariant(
      snapshot.workflowState !== ("draft" as RequestWorkflowState),
      "REQUEST_DRAFT_FORBIDDEN",
      "Request is not a draft store.",
    );
    if (snapshot.patientRef) {
      invariant(
        snapshot.currentIdentityBindingRef,
        "REQUEST_PATIENT_REF_REQUIRES_IDENTITY_BINDING",
        "Request.patientRef may derive only from a verified identity binding.",
      );
      invariant(
        snapshot.identityState === "matched" || snapshot.identityState === "claimed",
        "REQUEST_PATIENT_REF_REQUIRES_VERIFIED_IDENTITY_STATE",
        "Request.patientRef may derive only from a matched or claimed identity state.",
      );
    }
    return {
      ...snapshot,
      attachmentRefs: uniqueSortedRefs(snapshot.attachmentRefs),
      activeLineageCaseLinkRefs: uniqueSortedRefs(snapshot.activeLineageCaseLinkRefs),
      currentConfirmationGateRefs: uniqueSortedRefs(snapshot.currentConfirmationGateRefs),
      currentClosureBlockerRefs: uniqueSortedRefs(snapshot.currentClosureBlockerRefs),
    };
  }

  get requestId(): string {
    return this.snapshot.requestId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  get workflowState(): RequestWorkflowState {
    return this.snapshot.workflowState;
  }

  get requestLineageRef(): string {
    return this.snapshot.requestLineageRef;
  }

  get episodeId(): string {
    return this.snapshot.episodeId;
  }

  toSnapshot(): RequestSnapshot {
    return {
      ...this.snapshot,
      attachmentRefs: [...this.snapshot.attachmentRefs],
      activeLineageCaseLinkRefs: [...this.snapshot.activeLineageCaseLinkRefs],
      currentConfirmationGateRefs: [...this.snapshot.currentConfirmationGateRefs],
      currentClosureBlockerRefs: [...this.snapshot.currentClosureBlockerRefs],
    };
  }

  advanceWorkflow(input: AdvanceRequestWorkflowInput): RequestAggregate {
    invariant(
      requestWorkflowTransitions[this.snapshot.workflowState].includes(input.nextState),
      "REQUEST_ILLEGAL_WORKFLOW_TRANSITION",
      `Request workflow transition ${this.snapshot.workflowState} -> ${input.nextState} is not allowed.`,
    );

    return new RequestAggregate({
      ...this.snapshot,
      workflowState: input.nextState,
      currentTriageTaskRef:
        input.currentTriageTaskRef === undefined
          ? this.snapshot.currentTriageTaskRef
          : input.currentTriageTaskRef,
      assignedQueueRef:
        input.assignedQueueRef === undefined
          ? this.snapshot.assignedQueueRef
          : input.assignedQueueRef,
      updatedAt: input.updatedAt,
      requestVersion: nextVersion(this.snapshot.requestVersion),
      version: nextVersion(this.snapshot.version),
    });
  }

  bindIdentity(input: BindRequestIdentityInput): RequestAggregate {
    return new RequestAggregate({
      ...this.snapshot,
      currentIdentityBindingRef: requireRef(input.identityBindingRef, "identityBindingRef"),
      patientRef: input.patientRef,
      identityState: input.identityState,
      updatedAt: input.updatedAt,
      requestVersion: nextVersion(this.snapshot.requestVersion),
      version: nextVersion(this.snapshot.version),
    });
  }

  recordEvidence(input: RecordRequestEvidenceInput): RequestAggregate {
    return new RequestAggregate({
      ...this.snapshot,
      currentEvidenceSnapshotRef: requireRef(input.evidenceSnapshotRef, "evidenceSnapshotRef"),
      currentEvidenceAssimilationRef:
        input.evidenceAssimilationRef ?? this.snapshot.currentEvidenceAssimilationRef,
      currentMaterialDeltaAssessmentRef:
        input.materialDeltaAssessmentRef ?? this.snapshot.currentMaterialDeltaAssessmentRef,
      currentEvidenceClassificationRef:
        input.evidenceClassificationRef ?? this.snapshot.currentEvidenceClassificationRef,
      updatedAt: input.updatedAt,
      requestVersion: nextVersion(this.snapshot.requestVersion),
      version: nextVersion(this.snapshot.version),
    });
  }

  recordSafety(input: RecordRequestSafetyInput): RequestAggregate {
    return new RequestAggregate({
      ...this.snapshot,
      safetyState: input.safetyState,
      currentSafetyDecisionRef: input.safetyDecisionRef,
      currentSafetyPreemptionRef:
        input.safetyPreemptionRef ?? this.snapshot.currentSafetyPreemptionRef,
      currentUrgentDiversionSettlementRef:
        input.urgentDiversionSettlementRef ?? this.snapshot.currentUrgentDiversionSettlementRef,
      safetyDecisionEpoch:
        input.safetyDecisionEpoch === undefined
          ? this.snapshot.safetyDecisionEpoch + 1
          : input.safetyDecisionEpoch,
      updatedAt: input.updatedAt,
      requestVersion: nextVersion(this.snapshot.requestVersion),
      version: nextVersion(this.snapshot.version),
    });
  }

  refreshLineageSummary(input: RefreshRequestLineageSummaryInput): RequestAggregate {
    invariant(
      input.latestLineageCaseLinkRef === null ||
        input.activeLineageCaseLinkRefs.includes(input.latestLineageCaseLinkRef) ||
        this.snapshot.latestLineageCaseLinkRef === input.latestLineageCaseLinkRef,
      "REQUEST_LINEAGE_SUMMARY_MISMATCH",
      "Latest lineage case link must remain active or match the last observed lineage summary.",
    );

    return new RequestAggregate({
      ...this.snapshot,
      latestLineageCaseLinkRef: input.latestLineageCaseLinkRef,
      activeLineageCaseLinkRefs: uniqueSortedRefs(input.activeLineageCaseLinkRefs),
      currentConfirmationGateRefs:
        input.currentConfirmationGateRefs === undefined
          ? this.snapshot.currentConfirmationGateRefs
          : uniqueSortedRefs(input.currentConfirmationGateRefs),
      currentClosureBlockerRefs:
        input.currentClosureBlockerRefs === undefined
          ? this.snapshot.currentClosureBlockerRefs
          : uniqueSortedRefs(input.currentClosureBlockerRefs),
      updatedAt: input.updatedAt,
      requestVersion: nextVersion(this.snapshot.requestVersion),
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface CreateRequestLineageInput {
  requestLineageId: string;
  episodeRef: string;
  requestRef: string;
  originEnvelopeRef?: string | null;
  submissionPromotionRecordRef?: string | null;
  continuityWitnessRef: string;
  createdAt: string;
}

export interface BranchRequestLineageInput {
  requestLineageId: string;
  episodeRef: string;
  requestRef: string;
  originEnvelopeRef?: string | null;
  submissionPromotionRecordRef?: string | null;
  branchClass: Extract<RequestLineageBranchClass, "same_episode_branch" | "related_episode_branch">;
  branchDecisionRef: string;
  continuityWitnessClass: Exclude<ContinuityWitnessClass, "envelope_promotion">;
  continuityWitnessRef: string;
  createdAt: string;
}

export interface RecordContinuationInput {
  continuityWitnessClass: Exclude<ContinuityWitnessClass, "envelope_promotion">;
  continuityWitnessRef: string;
  updatedAt: string;
  latestTriageTaskRef?: string | null;
  latestDecisionEpochRef?: string | null;
}

export interface UpdateLineageSummaryInput {
  latestClosureRecordRef?: string | null;
  latestLineageCaseLinkRef?: string | null;
  activeLineageCaseLinkRefs?: readonly string[];
  latestTriageTaskRef?: string | null;
  latestDecisionEpochRef?: string | null;
  updatedAt: string;
}

export class RequestLineageAggregate {
  private readonly snapshot: RequestLineageSnapshot;

  private constructor(snapshot: RequestLineageSnapshot) {
    this.snapshot = RequestLineageAggregate.normalize(snapshot);
  }

  static create(input: CreateRequestLineageInput): RequestLineageAggregate {
    return new RequestLineageAggregate({
      requestLineageId: requireRef(input.requestLineageId, "requestLineageId"),
      episodeRef: requireRef(input.episodeRef, "episodeRef"),
      requestRef: requireRef(input.requestRef, "requestRef"),
      originEnvelopeRef: input.originEnvelopeRef ?? null,
      submissionPromotionRecordRef: input.submissionPromotionRecordRef ?? null,
      branchClass: "primary_submission",
      branchDecisionRef: null,
      continuityWitnessClass: "envelope_promotion",
      continuityWitnessRef: requireRef(input.continuityWitnessRef, "continuityWitnessRef"),
      latestTriageTaskRef: null,
      latestDecisionEpochRef: null,
      latestClosureRecordRef: null,
      activeLineageCaseLinkRefs: [],
      latestLineageCaseLinkRef: null,
      lineageState: "active",
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      version: 1,
    });
  }

  static branch(input: BranchRequestLineageInput): RequestLineageAggregate {
    return new RequestLineageAggregate({
      requestLineageId: requireRef(input.requestLineageId, "requestLineageId"),
      episodeRef: requireRef(input.episodeRef, "episodeRef"),
      requestRef: requireRef(input.requestRef, "requestRef"),
      originEnvelopeRef: input.originEnvelopeRef ?? null,
      submissionPromotionRecordRef: input.submissionPromotionRecordRef ?? null,
      branchClass: input.branchClass,
      branchDecisionRef: requireRef(input.branchDecisionRef, "branchDecisionRef"),
      continuityWitnessClass: input.continuityWitnessClass,
      continuityWitnessRef: requireRef(input.continuityWitnessRef, "continuityWitnessRef"),
      latestTriageTaskRef: null,
      latestDecisionEpochRef: null,
      latestClosureRecordRef: null,
      activeLineageCaseLinkRefs: [],
      latestLineageCaseLinkRef: null,
      lineageState: "active",
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      version: 1,
    });
  }

  static hydrate(snapshot: RequestLineageSnapshot): RequestLineageAggregate {
    return new RequestLineageAggregate(snapshot);
  }

  private static normalize(snapshot: RequestLineageSnapshot): RequestLineageSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_REQUEST_LINEAGE_VERSION",
      "RequestLineage version must be >= 1.",
    );
    if (snapshot.branchClass === "primary_submission") {
      invariant(
        snapshot.branchDecisionRef === null,
        "PRIMARY_LINEAGE_CANNOT_HAVE_BRANCH_DECISION",
        "Primary submission lineage cannot carry a branch decision.",
      );
      invariant(
        snapshot.continuityWitnessClass === "envelope_promotion",
        "PRIMARY_LINEAGE_REQUIRES_PROMOTION_WITNESS",
        "Primary submission lineage must originate from envelope promotion.",
      );
    } else if (snapshot.branchClass === "same_request_continuation") {
      invariant(
        snapshot.branchDecisionRef === null,
        "CONTINUATION_LINEAGE_CANNOT_HAVE_BRANCH_DECISION",
        "Same-request continuation reuses an existing lineage rather than minting a branch decision.",
      );
    } else {
      invariant(
        !!snapshot.branchDecisionRef,
        "BRANCHED_LINEAGE_REQUIRES_BRANCH_DECISION",
        "Same-episode and related-episode branches require an explicit branchDecisionRef.",
      );
    }
    return {
      ...snapshot,
      activeLineageCaseLinkRefs: uniqueSortedRefs(snapshot.activeLineageCaseLinkRefs),
    };
  }

  get requestLineageId(): string {
    return this.snapshot.requestLineageId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  get requestRef(): string {
    return this.snapshot.requestRef;
  }

  toSnapshot(): RequestLineageSnapshot {
    return {
      ...this.snapshot,
      activeLineageCaseLinkRefs: [...this.snapshot.activeLineageCaseLinkRefs],
    };
  }

  recordContinuation(input: RecordContinuationInput): RequestLineageAggregate {
    invariant(
      this.snapshot.lineageState === "active",
      "REQUEST_LINEAGE_NOT_ACTIVE",
      "Only active request lineages may record continuity witnesses.",
    );
    invariant(
      this.snapshot.branchClass === "primary_submission" ||
        this.snapshot.branchClass === "same_request_continuation",
      "REQUEST_LINEAGE_CONTINUATION_REUSE_REQUIRED",
      "Same-request continuation must reuse the existing lineage rather than create a new branch.",
    );

    return new RequestLineageAggregate({
      ...this.snapshot,
      branchClass: "same_request_continuation",
      continuityWitnessClass: input.continuityWitnessClass,
      continuityWitnessRef: requireRef(input.continuityWitnessRef, "continuityWitnessRef"),
      latestTriageTaskRef:
        input.latestTriageTaskRef === undefined
          ? this.snapshot.latestTriageTaskRef
          : input.latestTriageTaskRef,
      latestDecisionEpochRef:
        input.latestDecisionEpochRef === undefined
          ? this.snapshot.latestDecisionEpochRef
          : input.latestDecisionEpochRef,
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  updateSummary(input: UpdateLineageSummaryInput): RequestLineageAggregate {
    const activeRefs =
      input.activeLineageCaseLinkRefs === undefined
        ? this.snapshot.activeLineageCaseLinkRefs
        : uniqueSortedRefs(input.activeLineageCaseLinkRefs);
    const latestLineageCaseLinkRef =
      input.latestLineageCaseLinkRef === undefined
        ? this.snapshot.latestLineageCaseLinkRef
        : input.latestLineageCaseLinkRef;

    invariant(
      latestLineageCaseLinkRef === null ||
        activeRefs.includes(latestLineageCaseLinkRef) ||
        this.snapshot.latestLineageCaseLinkRef === latestLineageCaseLinkRef,
      "REQUEST_LINEAGE_LINK_SUMMARY_MISMATCH",
      "RequestLineage latest link must remain active or match the previously observed lineage link.",
    );

    return new RequestLineageAggregate({
      ...this.snapshot,
      latestTriageTaskRef:
        input.latestTriageTaskRef === undefined
          ? this.snapshot.latestTriageTaskRef
          : input.latestTriageTaskRef,
      latestDecisionEpochRef:
        input.latestDecisionEpochRef === undefined
          ? this.snapshot.latestDecisionEpochRef
          : input.latestDecisionEpochRef,
      latestClosureRecordRef:
        input.latestClosureRecordRef === undefined
          ? this.snapshot.latestClosureRecordRef
          : input.latestClosureRecordRef,
      latestLineageCaseLinkRef,
      activeLineageCaseLinkRefs: activeRefs,
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface ProposeLineageCaseLinkInput {
  lineageCaseLinkId: string;
  requestLineageRef: string;
  episodeRef: string;
  requestRef: string;
  caseFamily: LineageCaseFamily;
  domainCaseRef: string;
  linkReason: LineageCaseLinkReason;
  openedAt: string;
  parentLineageCaseLinkRef?: string | null;
  originDecisionEpochRef?: string | null;
  originDecisionSupersessionRef?: string | null;
  originTriageTaskRef?: string | null;
  originDuplicateResolutionDecisionRef?: string | null;
}

export interface UpdateLineageCaseLinkInput {
  nextState: LineageCaseOwnershipState;
  updatedAt: string;
  latestMilestoneRef?: string | null;
  returnToTriageRef?: string | null;
  currentClosureBlockerRefs?: readonly string[];
  currentConfirmationGateRefs?: readonly string[];
}

export class LineageCaseLinkAggregate {
  private readonly snapshot: LineageCaseLinkSnapshot;

  private constructor(snapshot: LineageCaseLinkSnapshot) {
    this.snapshot = LineageCaseLinkAggregate.normalize(snapshot);
  }

  static propose(input: ProposeLineageCaseLinkInput): LineageCaseLinkAggregate {
    return new LineageCaseLinkAggregate({
      lineageCaseLinkId: requireRef(input.lineageCaseLinkId, "lineageCaseLinkId"),
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      episodeRef: requireRef(input.episodeRef, "episodeRef"),
      requestRef: requireRef(input.requestRef, "requestRef"),
      caseFamily: input.caseFamily,
      domainCaseRef: requireRef(input.domainCaseRef, "domainCaseRef"),
      parentLineageCaseLinkRef: input.parentLineageCaseLinkRef ?? null,
      originDecisionEpochRef: input.originDecisionEpochRef ?? null,
      originDecisionSupersessionRef: input.originDecisionSupersessionRef ?? null,
      originTriageTaskRef: input.originTriageTaskRef ?? null,
      originDuplicateResolutionDecisionRef: input.originDuplicateResolutionDecisionRef ?? null,
      linkReason: input.linkReason,
      ownershipState: "proposed",
      currentClosureBlockerRefs: [],
      currentConfirmationGateRefs: [],
      latestMilestoneRef: null,
      returnToTriageRef: null,
      openedAt: input.openedAt,
      closedAt: null,
      supersededAt: null,
      updatedAt: input.openedAt,
      version: 1,
    });
  }

  static hydrate(snapshot: LineageCaseLinkSnapshot): LineageCaseLinkAggregate {
    return new LineageCaseLinkAggregate(snapshot);
  }

  private static normalize(snapshot: LineageCaseLinkSnapshot): LineageCaseLinkSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_LINEAGE_CASE_LINK_VERSION",
      "LineageCaseLink version must be >= 1.",
    );
    if (snapshot.ownershipState === "closed") {
      invariant(
        snapshot.closedAt !== null,
        "CLOSED_LINEAGE_CASE_LINK_REQUIRES_CLOSED_AT",
        "Closed links require closedAt.",
      );
    }
    if (snapshot.ownershipState === "superseded" || snapshot.ownershipState === "compensated") {
      invariant(
        snapshot.supersededAt !== null,
        "SUPERSEDED_OR_COMPENSATED_LINK_REQUIRES_SUPERSEDED_AT",
        "Superseded or compensated links require supersededAt.",
      );
    }
    return {
      ...snapshot,
      currentClosureBlockerRefs: uniqueSortedRefs(snapshot.currentClosureBlockerRefs),
      currentConfirmationGateRefs: uniqueSortedRefs(snapshot.currentConfirmationGateRefs),
    };
  }

  get lineageCaseLinkId(): string {
    return this.snapshot.lineageCaseLinkId;
  }

  get requestLineageRef(): string {
    return this.snapshot.requestLineageRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  get ownershipState(): LineageCaseOwnershipState {
    return this.snapshot.ownershipState;
  }

  toSnapshot(): LineageCaseLinkSnapshot {
    return {
      ...this.snapshot,
      currentClosureBlockerRefs: [...this.snapshot.currentClosureBlockerRefs],
      currentConfirmationGateRefs: [...this.snapshot.currentConfirmationGateRefs],
    };
  }

  transition(input: UpdateLineageCaseLinkInput): LineageCaseLinkAggregate {
    invariant(
      lineageOwnershipTransitions[this.snapshot.ownershipState].includes(input.nextState),
      "ILLEGAL_LINEAGE_CASE_LINK_TRANSITION",
      `LineageCaseLink transition ${this.snapshot.ownershipState} -> ${input.nextState} is not allowed.`,
    );

    const nextSnapshot: LineageCaseLinkSnapshot = {
      ...this.snapshot,
      ownershipState: input.nextState,
      latestMilestoneRef:
        input.latestMilestoneRef === undefined
          ? this.snapshot.latestMilestoneRef
          : input.latestMilestoneRef,
      returnToTriageRef:
        input.returnToTriageRef === undefined
          ? this.snapshot.returnToTriageRef
          : input.returnToTriageRef,
      currentClosureBlockerRefs:
        input.currentClosureBlockerRefs === undefined
          ? this.snapshot.currentClosureBlockerRefs
          : uniqueSortedRefs(input.currentClosureBlockerRefs),
      currentConfirmationGateRefs:
        input.currentConfirmationGateRefs === undefined
          ? this.snapshot.currentConfirmationGateRefs
          : uniqueSortedRefs(input.currentConfirmationGateRefs),
      closedAt:
        input.nextState === "closed"
          ? input.updatedAt
          : input.nextState === this.snapshot.ownershipState
            ? this.snapshot.closedAt
            : this.snapshot.closedAt,
      supersededAt:
        input.nextState === "superseded" || input.nextState === "compensated"
          ? input.updatedAt
          : this.snapshot.supersededAt,
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    };

    return new LineageCaseLinkAggregate(nextSnapshot);
  }

  refreshOperationalFacts(
    refs: Pick<
      UpdateLineageCaseLinkInput,
      "currentClosureBlockerRefs" | "currentConfirmationGateRefs" | "latestMilestoneRef"
    > & { updatedAt: string },
  ): LineageCaseLinkAggregate {
    invariant(
      this.snapshot.ownershipState !== "superseded" &&
        this.snapshot.ownershipState !== "compensated",
      "LINEAGE_CASE_LINK_OPERATIONAL_UPDATE_FORBIDDEN",
      "Superseded or compensated lineage links cannot accept new operational facts.",
    );

    return new LineageCaseLinkAggregate({
      ...this.snapshot,
      currentClosureBlockerRefs:
        refs.currentClosureBlockerRefs === undefined
          ? this.snapshot.currentClosureBlockerRefs
          : uniqueSortedRefs(refs.currentClosureBlockerRefs),
      currentConfirmationGateRefs:
        refs.currentConfirmationGateRefs === undefined
          ? this.snapshot.currentConfirmationGateRefs
          : uniqueSortedRefs(refs.currentConfirmationGateRefs),
      latestMilestoneRef:
        refs.latestMilestoneRef === undefined
          ? this.snapshot.latestMilestoneRef
          : refs.latestMilestoneRef,
      updatedAt: refs.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}
