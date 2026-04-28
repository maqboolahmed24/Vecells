import { createHash } from "node:crypto";

export type ISODateString = string;

export type AssistiveWorkProtectionActorRole =
  | "assistive_session_service"
  | "assistive_lease_service"
  | "clinical_reviewer"
  | "clinical_safety_lead"
  | "trust_envelope_projector"
  | "system";

export type PublicationState = "published" | "stale" | "withdrawn" | "blocked";
export type RuntimePublicationState = "current" | "stale" | "withdrawn" | "blocked";
export type TrustEnvelopeActionabilityState =
  | "enabled"
  | "regenerate_only"
  | "observe_only"
  | "blocked_by_policy"
  | "blocked";
export type TrustEnvelopeCompletionAdjacencyState = "allowed" | "observe_only" | "blocked";
export type AssistiveSessionState = "live" | "stale" | "recovery_required" | "blocked";
export type FenceValidationState = "valid" | "stale" | "drifted" | "blocked";
export type InsertPostureState =
  | "allowed"
  | "regenerate_required"
  | "governed_recovery"
  | "blocked";
export type AssistiveContentClass =
  | "note_section"
  | "message_body"
  | "endpoint_reasoning"
  | "question_set";
export type InsertionSlotState = "live" | "occupied" | "stale" | "blocked";
export type AssistiveLeaseState = "active" | "invalidated" | "released" | "expired";
export type WorkProtectionLockReason = "composing" | "comparing" | "confirming" | "reading_delta";
export type InvalidatingDriftState =
  | "none"
  | "review_version"
  | "decision_epoch"
  | "policy_bundle"
  | "publication"
  | "trust"
  | "insertion_point_invalidated"
  | "anchor_invalidated"
  | "lease_expired";
export type DeferredDeltaKind = "non_disruptive" | "contextual" | "disruptive" | "blocking";
export type BlockerSeverity = "none" | "low" | "medium" | "high" | "critical";
export type DeferredDeltaState = "buffered" | "released" | "superseded" | "blocking_bypass";
export type QuietReturnTargetState = "current" | "stale" | "blocked";

export const ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS = {
  session_fence_token_required: "session_fence_token_required",
  selected_anchor_drift_regenerate_required: "selected_anchor_drift_regenerate_required",
  review_version_drift_regenerate_required: "review_version_drift_regenerate_required",
  decision_epoch_drift_regenerate_required: "decision_epoch_drift_regenerate_required",
  policy_bundle_drift_regenerate_required: "policy_bundle_drift_regenerate_required",
  publication_drift_regenerate_required: "publication_drift_regenerate_required",
  trust_envelope_actionability_required: "trust_envelope_actionability_required",
  insertion_point_slot_hash_required: "insertion_point_slot_hash_required",
  draft_patch_lease_requires_live_insertion_point:
    "draft_patch_lease_requires_live_insertion_point",
  patch_lease_drift_invalidated: "patch_lease_drift_invalidated",
  work_protection_buffers_disruptive_delta: "work_protection_buffers_disruptive_delta",
  same_shell_quiet_return_required: "same_shell_quiet_return_required",
  browser_local_insert_legality_forbidden: "browser_local_insert_legality_forbidden",
} as const;

export interface AssistiveWorkProtectionActorContext {
  actorRef: string;
  actorRole: AssistiveWorkProtectionActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface AssistiveWorkProtectionAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: AssistiveWorkProtectionActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface AssistiveSession {
  assistiveSessionId: string;
  taskRef: string;
  contextSnapshotRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  entityContinuityKey: string;
  selectedAnchorRef: string;
  surfaceBindingRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  runtimePublicationState: RuntimePublicationState;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  workspaceTrustEnvelopeRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  reviewActionLeaseRef: string;
  sessionFenceTokenHash: string;
  trustEnvelopeActionabilityState: TrustEnvelopeActionabilityState;
  trustEnvelopeCompletionAdjacencyState: TrustEnvelopeCompletionAdjacencyState;
  liveTtlSeconds: number;
  graceTtlSeconds: number;
  lastValidatedAt: ISODateString;
  sessionState: AssistiveSessionState;
  insertPostureState: InsertPostureState;
  blockingReasonRefs: readonly string[];
  createdAt: ISODateString;
}

export interface AssistiveDraftInsertionPoint {
  assistiveDraftInsertionPointId: string;
  assistiveSessionRef: string;
  taskRef: string;
  surfaceRef: string;
  contentClass: AssistiveContentClass;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  lineageFenceEpoch: string;
  slotHash: string;
  slotState: InsertionSlotState;
  quietReturnTargetRef: string;
  lastValidatedAt: ISODateString;
}

export interface AssistiveDraftPatchLease {
  assistiveDraftPatchLeaseId: string;
  assistiveSessionRef: string;
  artifactRef: string;
  sectionRef: string;
  draftInsertionPointRef: string;
  reviewActionLeaseRef: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  lineageFenceEpoch: string;
  slotHash: string;
  contentClass: AssistiveContentClass;
  leaseState: AssistiveLeaseState;
  invalidatingDriftState: InvalidatingDriftState;
  issuedAt: ISODateString;
  expiresAt: ISODateString;
}

export interface AssistiveWorkProtectionLease {
  assistiveWorkProtectionLeaseId: string;
  assistiveSessionId: string;
  workspaceFocusProtectionLeaseRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactRef: string;
  lockReason: WorkProtectionLockReason;
  selectedAnchorRef: string;
  draftInsertionPointRef?: string;
  protectedRegionRef: string;
  quietReturnTargetRef: string;
  bufferedDeferredDeltaRefs: readonly string[];
  queueChangeBatchRef?: string;
  leaseState: AssistiveLeaseState;
  invalidatingDriftState: InvalidatingDriftState;
  startedAt: ISODateString;
  releasedAt?: ISODateString;
}

export interface AssistiveDeferredDelta {
  assistiveDeferredDeltaId: string;
  assistiveSessionRef: string;
  assistiveWorkProtectionLeaseRef: string;
  deltaKind: DeferredDeltaKind;
  blockerSeverity: BlockerSeverity;
  sourceRef: string;
  targetRef: string;
  deltaHash: string;
  deltaState: DeferredDeltaState;
  receivedAt: ISODateString;
}

export interface AssistiveQuietReturnTarget {
  assistiveQuietReturnTargetId: string;
  assistiveSessionRef: string;
  selectedAnchorRef: string;
  protectedRegionRef: string;
  priorQuietRegionRef: string;
  primaryReadingTargetRef: string;
  returnRouteRef: string;
  quietReturnTargetHash: string;
  targetState: QuietReturnTargetState;
  createdAt: ISODateString;
}

export interface AssistiveWorkProtectionStore {
  sessions: Map<string, AssistiveSession>;
  insertionPoints: Map<string, AssistiveDraftInsertionPoint>;
  patchLeases: Map<string, AssistiveDraftPatchLease>;
  workProtectionLeases: Map<string, AssistiveWorkProtectionLease>;
  deferredDeltas: Map<string, AssistiveDeferredDelta>;
  quietReturnTargets: Map<string, AssistiveQuietReturnTarget>;
  auditRecords: AssistiveWorkProtectionAuditRecord[];
  idempotencyKeys: Map<string, string>;
}

export interface AssistiveWorkProtectionClock {
  now(): ISODateString;
}

export interface AssistiveWorkProtectionIdGenerator {
  next(prefix: string): string;
}

export interface AssistiveWorkProtectionRuntime {
  store: AssistiveWorkProtectionStore;
  clock: AssistiveWorkProtectionClock;
  idGenerator: AssistiveWorkProtectionIdGenerator;
}

export interface StartAssistiveSessionCommand {
  assistiveSessionId?: string;
  taskRef: string;
  contextSnapshotRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  entityContinuityKey: string;
  selectedAnchorRef: string;
  surfaceBindingRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  runtimePublicationState?: RuntimePublicationState;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  workspaceTrustEnvelopeRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  reviewActionLeaseRef: string;
  sessionFenceToken: string;
  trustEnvelopeActionabilityState?: TrustEnvelopeActionabilityState;
  trustEnvelopeCompletionAdjacencyState?: TrustEnvelopeCompletionAdjacencyState;
  liveTtlSeconds?: number;
  graceTtlSeconds?: number;
  idempotencyKey?: string;
}

export interface ValidateAssistiveSessionFenceCommand {
  assistiveSessionRef: string;
  currentReviewVersionRef: string;
  currentDecisionEpochRef: string;
  currentPolicyBundleRef: string;
  currentLineageFenceEpoch: string;
  currentSelectedAnchorRef: string;
  currentSurfacePublicationRef: string;
  currentRuntimePublicationBundleRef: string;
  currentRuntimePublicationState: RuntimePublicationState;
  currentReviewActionLeaseRef: string;
  currentWorkspaceTrustEnvelopeRef: string;
  currentAssistiveCapabilityTrustEnvelopeRef: string;
  currentTrustEnvelopeActionabilityState: TrustEnvelopeActionabilityState;
  sessionFenceToken: string;
}

export interface AssistiveSessionFenceValidation {
  assistiveSessionRef: string;
  validationState: FenceValidationState;
  insertPostureState: InsertPostureState;
  sessionFreshnessPenalty: number;
  blockingReasonRefs: readonly string[];
  sameShellRecoveryRequired: boolean;
  validatedAt: ISODateString;
}

export interface RegisterInsertionPointCommand {
  assistiveDraftInsertionPointId?: string;
  assistiveSessionRef: string;
  taskRef: string;
  surfaceRef: string;
  contentClass: AssistiveContentClass;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  lineageFenceEpoch: string;
  slotHash: string;
  slotState?: InsertionSlotState;
  quietReturnTargetRef: string;
  idempotencyKey?: string;
}

export interface IssueDraftPatchLeaseCommand {
  assistiveDraftPatchLeaseId?: string;
  assistiveSessionRef: string;
  artifactRef: string;
  sectionRef: string;
  draftInsertionPointRef: string;
  reviewActionLeaseRef: string;
  contentClass: AssistiveContentClass;
  ttlSeconds?: number;
  idempotencyKey?: string;
}

export interface ValidateDraftPatchLeaseCommand {
  assistiveDraftPatchLeaseRef: string;
  currentReviewVersionRef: string;
  currentDecisionEpochRef: string;
  currentLineageFenceEpoch: string;
  currentSelectedAnchorRef: string;
  currentReviewActionLeaseRef: string;
  currentSlotHash: string;
}

export interface DraftPatchLeaseValidation {
  assistiveDraftPatchLeaseRef: string;
  leaseState: AssistiveLeaseState;
  insertPostureState: InsertPostureState;
  blockingReasonRefs: readonly string[];
  invalidatingDriftState: InvalidatingDriftState;
  validatedAt: ISODateString;
}

export interface IssueWorkProtectionLeaseCommand {
  assistiveWorkProtectionLeaseId?: string;
  assistiveSessionId: string;
  workspaceFocusProtectionLeaseRef: string;
  artifactRef: string;
  lockReason: WorkProtectionLockReason;
  draftInsertionPointRef?: string;
  protectedRegionRef: string;
  quietReturnTargetRef: string;
  queueChangeBatchRef?: string;
  idempotencyKey?: string;
}

export interface BufferDeferredDeltaCommand {
  assistiveSessionRef: string;
  assistiveWorkProtectionLeaseRef: string;
  deltaKind: DeferredDeltaKind;
  blockerSeverity: BlockerSeverity;
  sourceRef: string;
  targetRef: string;
  deltaHash: string;
  idempotencyKey?: string;
}

export interface ResolveQuietReturnTargetCommand {
  assistiveSessionRef: string;
  selectedAnchorRef: string;
  protectedRegionRef: string;
  priorQuietRegionRef: string;
  primaryReadingTargetRef: string;
  returnRouteRef: string;
  idempotencyKey?: string;
}

export class AssistiveSessionService {
  public constructor(private readonly runtime: AssistiveWorkProtectionRuntime) {}

  public startSession(
    command: StartAssistiveSessionCommand,
    actor: AssistiveWorkProtectionActorContext,
  ): AssistiveSession {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.sessions,
      () => {
        for (const [label, value] of [
          ["taskRef", command.taskRef],
          ["contextSnapshotRef", command.contextSnapshotRef],
          ["reviewVersionRef", command.reviewVersionRef],
          ["decisionEpochRef", command.decisionEpochRef],
          ["policyBundleRef", command.policyBundleRef],
          ["lineageFenceEpoch", command.lineageFenceEpoch],
          ["selectedAnchorRef", command.selectedAnchorRef],
          ["surfaceBindingRef", command.surfaceBindingRef],
          ["surfacePublicationRef", command.surfacePublicationRef],
          ["runtimePublicationBundleRef", command.runtimePublicationBundleRef],
          [
            "staffWorkspaceConsistencyProjectionRef",
            command.staffWorkspaceConsistencyProjectionRef,
          ],
          ["workspaceSliceTrustProjectionRef", command.workspaceSliceTrustProjectionRef],
          ["workspaceTrustEnvelopeRef", command.workspaceTrustEnvelopeRef],
          ["assistiveCapabilityTrustEnvelopeRef", command.assistiveCapabilityTrustEnvelopeRef],
          ["reviewActionLeaseRef", command.reviewActionLeaseRef],
        ] as const) {
          requireNonEmpty(value, label);
        }
        if (!command.sessionFenceToken) {
          this.audit("startSession", actor, command.taskRef, "failed_closed", [
            ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.session_fence_token_required,
          ]);
          throw new Error("sessionFenceToken is required for AssistiveSession.");
        }

        const runtimePublicationState = command.runtimePublicationState ?? "current";
        const trustEnvelopeActionabilityState =
          command.trustEnvelopeActionabilityState ?? "enabled";
        const trustEnvelopeCompletionAdjacencyState =
          command.trustEnvelopeCompletionAdjacencyState ?? "allowed";
        const blockingReasonRefs = sessionBlockingReasons({
          runtimePublicationState,
          trustEnvelopeActionabilityState,
        });
        const sessionState: AssistiveSessionState =
          blockingReasonRefs.length === 0 ? "live" : "recovery_required";
        const insertPostureState: InsertPostureState =
          blockingReasonRefs.length === 0 ? "allowed" : "regenerate_required";
        const sessionHash = stableAssistiveWorkProtectionHash({
          taskRef: command.taskRef,
          contextSnapshotRef: command.contextSnapshotRef,
          reviewVersionRef: command.reviewVersionRef,
          decisionEpochRef: command.decisionEpochRef,
          selectedAnchorRef: command.selectedAnchorRef,
          surfaceBindingRef: command.surfaceBindingRef,
        });
        const session: AssistiveSession = {
          assistiveSessionId: command.assistiveSessionId ?? `assistive-session:${sessionHash}`,
          taskRef: command.taskRef,
          contextSnapshotRef: command.contextSnapshotRef,
          reviewVersionRef: command.reviewVersionRef,
          decisionEpochRef: command.decisionEpochRef,
          policyBundleRef: command.policyBundleRef,
          lineageFenceEpoch: command.lineageFenceEpoch,
          entityContinuityKey: command.entityContinuityKey,
          selectedAnchorRef: command.selectedAnchorRef,
          surfaceBindingRef: command.surfaceBindingRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          runtimePublicationState,
          staffWorkspaceConsistencyProjectionRef: command.staffWorkspaceConsistencyProjectionRef,
          workspaceSliceTrustProjectionRef: command.workspaceSliceTrustProjectionRef,
          workspaceTrustEnvelopeRef: command.workspaceTrustEnvelopeRef,
          assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
          reviewActionLeaseRef: command.reviewActionLeaseRef,
          sessionFenceTokenHash: stableAssistiveWorkProtectionHash(command.sessionFenceToken),
          trustEnvelopeActionabilityState,
          trustEnvelopeCompletionAdjacencyState,
          liveTtlSeconds: command.liveTtlSeconds ?? 300,
          graceTtlSeconds: command.graceTtlSeconds ?? 300,
          lastValidatedAt: this.runtime.clock.now(),
          sessionState,
          insertPostureState,
          blockingReasonRefs,
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.sessions.set(session.assistiveSessionId, session);
        this.audit(
          "startSession",
          actor,
          command.taskRef,
          sessionState === "live" ? "accepted" : "failed_closed",
          [
            ...blockingReasonRefs,
            ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.browser_local_insert_legality_forbidden,
          ],
        );
        return session;
      },
    );
  }

  public getSession(assistiveSessionId: string): AssistiveSession | undefined {
    return this.runtime.store.sessions.get(assistiveSessionId);
  }

  private audit(
    action: string,
    actor: AssistiveWorkProtectionActorContext,
    subjectRef: string,
    outcome: AssistiveWorkProtectionAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveSessionService",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistiveSessionFenceValidator {
  public constructor(private readonly runtime: AssistiveWorkProtectionRuntime) {}

  public validateSessionFence(
    command: ValidateAssistiveSessionFenceCommand,
  ): AssistiveSessionFenceValidation {
    const session = requireSession(this.runtime, command.assistiveSessionRef);
    const blockingReasonRefs = sessionValidationReasons(session, command);
    const sessionFreshnessPenalty = computeSessionFreshnessPenalty(
      session,
      this.runtime.clock.now(),
    );
    if (sessionFreshnessPenalty > 0) {
      blockingReasonRefs.push("session_freshness_penalty_requires_revalidation");
    }

    const validationState = resolveValidationState(blockingReasonRefs);
    const insertPostureState =
      validationState === "valid"
        ? "allowed"
        : validationState === "blocked"
          ? "blocked"
          : "regenerate_required";
    const updated: AssistiveSession = {
      ...session,
      lastValidatedAt: this.runtime.clock.now(),
      sessionState:
        validationState === "valid"
          ? "live"
          : validationState === "blocked"
            ? "blocked"
            : "recovery_required",
      insertPostureState,
      blockingReasonRefs: unique(blockingReasonRefs),
    };
    this.runtime.store.sessions.set(updated.assistiveSessionId, updated);

    return {
      assistiveSessionRef: updated.assistiveSessionId,
      validationState,
      insertPostureState,
      sessionFreshnessPenalty,
      blockingReasonRefs: updated.blockingReasonRefs,
      sameShellRecoveryRequired: validationState !== "valid",
      validatedAt: this.runtime.clock.now(),
    };
  }
}

export class AssistiveDraftInsertionPointService {
  public constructor(private readonly runtime: AssistiveWorkProtectionRuntime) {}

  public registerInsertionPoint(
    command: RegisterInsertionPointCommand,
    actor: AssistiveWorkProtectionActorContext,
  ): AssistiveDraftInsertionPoint {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.insertionPoints,
      () => {
        const session = requireSession(this.runtime, command.assistiveSessionRef);
        if (!command.slotHash) {
          this.audit("registerInsertionPoint", actor, command.taskRef, "failed_closed", [
            ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.insertion_point_slot_hash_required,
          ]);
          throw new Error("slotHash is required for AssistiveDraftInsertionPoint.");
        }
        if (
          session.selectedAnchorRef !== command.selectedAnchorRef ||
          session.reviewVersionRef !== command.reviewVersionRef
        ) {
          this.audit("registerInsertionPoint", actor, command.taskRef, "failed_closed", [
            ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.selected_anchor_drift_regenerate_required,
          ]);
          throw new Error("Insertion point must match the live assistive session fence.");
        }
        const insertionPointHash = stableAssistiveWorkProtectionHash({
          assistiveSessionRef: command.assistiveSessionRef,
          taskRef: command.taskRef,
          surfaceRef: command.surfaceRef,
          contentClass: command.contentClass,
          selectedAnchorRef: command.selectedAnchorRef,
          slotHash: command.slotHash,
        });
        const insertionPoint: AssistiveDraftInsertionPoint = {
          assistiveDraftInsertionPointId:
            command.assistiveDraftInsertionPointId ??
            `assistive-draft-insertion-point:${insertionPointHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          taskRef: command.taskRef,
          surfaceRef: command.surfaceRef,
          contentClass: command.contentClass,
          selectedAnchorRef: command.selectedAnchorRef,
          reviewVersionRef: command.reviewVersionRef,
          decisionEpochRef: command.decisionEpochRef,
          lineageFenceEpoch: command.lineageFenceEpoch,
          slotHash: command.slotHash,
          slotState: command.slotState ?? "live",
          quietReturnTargetRef: command.quietReturnTargetRef,
          lastValidatedAt: this.runtime.clock.now(),
        };
        this.runtime.store.insertionPoints.set(
          insertionPoint.assistiveDraftInsertionPointId,
          insertionPoint,
        );
        this.audit(
          "registerInsertionPoint",
          actor,
          command.taskRef,
          insertionPoint.slotState === "live" ? "accepted" : "failed_closed",
          [insertionPoint.slotState],
        );
        return insertionPoint;
      },
    );
  }

  public resolveLiveInsertionPoints(
    assistiveSessionRef: string,
    contentClass?: AssistiveContentClass,
  ): AssistiveDraftInsertionPoint[] {
    return [...this.runtime.store.insertionPoints.values()].filter(
      (point) =>
        point.assistiveSessionRef === assistiveSessionRef &&
        point.slotState === "live" &&
        (contentClass === undefined || point.contentClass === contentClass),
    );
  }

  public invalidateInsertionPoint(
    assistiveDraftInsertionPointId: string,
    actor: AssistiveWorkProtectionActorContext,
    reasonCode = "insertion_point_invalidated",
  ): AssistiveDraftInsertionPoint {
    const insertionPoint = requireInsertionPoint(this.runtime, assistiveDraftInsertionPointId);
    const updated: AssistiveDraftInsertionPoint = {
      ...insertionPoint,
      slotState: "stale",
      lastValidatedAt: this.runtime.clock.now(),
    };
    this.runtime.store.insertionPoints.set(updated.assistiveDraftInsertionPointId, updated);
    this.audit("invalidateInsertionPoint", actor, updated.taskRef, "failed_closed", [reasonCode]);
    return updated;
  }

  private audit(
    action: string,
    actor: AssistiveWorkProtectionActorContext,
    subjectRef: string,
    outcome: AssistiveWorkProtectionAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveDraftInsertionPointService",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistiveDraftPatchLeaseIssuer {
  public constructor(private readonly runtime: AssistiveWorkProtectionRuntime) {}

  public issueDraftPatchLease(
    command: IssueDraftPatchLeaseCommand,
    actor: AssistiveWorkProtectionActorContext,
  ): AssistiveDraftPatchLease {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.patchLeases,
      () => {
        const session = requireSession(this.runtime, command.assistiveSessionRef);
        const insertionPoint = requireInsertionPoint(this.runtime, command.draftInsertionPointRef);
        if (session.sessionState !== "live" || session.insertPostureState !== "allowed") {
          this.audit("issueDraftPatchLease", actor, command.artifactRef, "failed_closed", [
            "assistive_session_not_live",
          ]);
          throw new Error("AssistiveDraftPatchLease requires a live assistive session.");
        }
        if (
          insertionPoint.slotState !== "live" ||
          insertionPoint.contentClass !== command.contentClass
        ) {
          this.audit("issueDraftPatchLease", actor, command.artifactRef, "failed_closed", [
            ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.draft_patch_lease_requires_live_insertion_point,
          ]);
          throw new Error(
            "AssistiveDraftPatchLease requires a live insertion point with matching content class.",
          );
        }
        if (command.reviewActionLeaseRef !== session.reviewActionLeaseRef) {
          throw new Error("AssistiveDraftPatchLease reviewActionLeaseRef must match the session.");
        }

        const issuedAt = this.runtime.clock.now();
        const expiresAt = new Date(
          Date.parse(issuedAt) + (command.ttlSeconds ?? 180) * 1000,
        ).toISOString();
        const leaseHash = stableAssistiveWorkProtectionHash({
          assistiveSessionRef: command.assistiveSessionRef,
          artifactRef: command.artifactRef,
          sectionRef: command.sectionRef,
          draftInsertionPointRef: command.draftInsertionPointRef,
          slotHash: insertionPoint.slotHash,
        });
        const lease: AssistiveDraftPatchLease = {
          assistiveDraftPatchLeaseId:
            command.assistiveDraftPatchLeaseId ?? `assistive-draft-patch-lease:${leaseHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          artifactRef: command.artifactRef,
          sectionRef: command.sectionRef,
          draftInsertionPointRef: command.draftInsertionPointRef,
          reviewActionLeaseRef: command.reviewActionLeaseRef,
          selectedAnchorRef: insertionPoint.selectedAnchorRef,
          reviewVersionRef: insertionPoint.reviewVersionRef,
          decisionEpochRef: insertionPoint.decisionEpochRef,
          lineageFenceEpoch: insertionPoint.lineageFenceEpoch,
          slotHash: insertionPoint.slotHash,
          contentClass: insertionPoint.contentClass,
          leaseState: "active",
          invalidatingDriftState: "none",
          issuedAt,
          expiresAt,
        };
        this.runtime.store.patchLeases.set(lease.assistiveDraftPatchLeaseId, lease);
        this.audit("issueDraftPatchLease", actor, command.artifactRef, "accepted", [
          "draft_patch_lease_active",
        ]);
        return lease;
      },
    );
  }

  private audit(
    action: string,
    actor: AssistiveWorkProtectionActorContext,
    subjectRef: string,
    outcome: AssistiveWorkProtectionAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveDraftPatchLeaseIssuer",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistiveDraftPatchLeaseValidator {
  public constructor(private readonly runtime: AssistiveWorkProtectionRuntime) {}

  public validateDraftPatchLease(
    command: ValidateDraftPatchLeaseCommand,
  ): DraftPatchLeaseValidation {
    const lease = requirePatchLease(this.runtime, command.assistiveDraftPatchLeaseRef);
    const reasons = patchLeaseValidationReasons(lease, command, this.runtime.clock.now());
    const invalidatingDriftState = resolvePatchLeaseDriftState(reasons);
    const leaseState: AssistiveLeaseState =
      reasons.length === 0
        ? "active"
        : invalidatingDriftState === "lease_expired"
          ? "expired"
          : "invalidated";
    const updated: AssistiveDraftPatchLease = { ...lease, leaseState, invalidatingDriftState };
    this.runtime.store.patchLeases.set(updated.assistiveDraftPatchLeaseId, updated);
    return {
      assistiveDraftPatchLeaseRef: updated.assistiveDraftPatchLeaseId,
      leaseState,
      insertPostureState: leaseState === "active" ? "allowed" : "regenerate_required",
      blockingReasonRefs: unique(reasons),
      invalidatingDriftState,
      validatedAt: this.runtime.clock.now(),
    };
  }
}

export class AssistiveWorkProtectionLeaseService {
  public constructor(private readonly runtime: AssistiveWorkProtectionRuntime) {}

  public issueWorkProtectionLease(
    command: IssueWorkProtectionLeaseCommand,
    actor: AssistiveWorkProtectionActorContext,
  ): AssistiveWorkProtectionLease {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.workProtectionLeases,
      () => {
        const session = requireSession(this.runtime, command.assistiveSessionId);
        if (session.sessionState !== "live") {
          this.audit("issueWorkProtectionLease", actor, command.artifactRef, "failed_closed", [
            "assistive_session_not_live",
          ]);
          throw new Error("AssistiveWorkProtectionLease requires a live session.");
        }
        if (command.draftInsertionPointRef) {
          const insertionPoint = requireInsertionPoint(
            this.runtime,
            command.draftInsertionPointRef,
          );
          if (insertionPoint.slotState !== "live") {
            throw new Error("AssistiveWorkProtectionLease requires a live insertion point.");
          }
        }
        const leaseHash = stableAssistiveWorkProtectionHash({
          assistiveSessionId: command.assistiveSessionId,
          artifactRef: command.artifactRef,
          lockReason: command.lockReason,
          protectedRegionRef: command.protectedRegionRef,
          quietReturnTargetRef: command.quietReturnTargetRef,
        });
        const lease: AssistiveWorkProtectionLease = {
          assistiveWorkProtectionLeaseId:
            command.assistiveWorkProtectionLeaseId ??
            `assistive-work-protection-lease:${leaseHash}`,
          assistiveSessionId: command.assistiveSessionId,
          workspaceFocusProtectionLeaseRef: command.workspaceFocusProtectionLeaseRef,
          assistiveCapabilityTrustEnvelopeRef: session.assistiveCapabilityTrustEnvelopeRef,
          artifactRef: command.artifactRef,
          lockReason: command.lockReason,
          selectedAnchorRef: session.selectedAnchorRef,
          draftInsertionPointRef: command.draftInsertionPointRef,
          protectedRegionRef: command.protectedRegionRef,
          quietReturnTargetRef: command.quietReturnTargetRef,
          bufferedDeferredDeltaRefs: [],
          queueChangeBatchRef: command.queueChangeBatchRef,
          leaseState: "active",
          invalidatingDriftState: "none",
          startedAt: this.runtime.clock.now(),
        };
        this.runtime.store.workProtectionLeases.set(lease.assistiveWorkProtectionLeaseId, lease);
        this.audit("issueWorkProtectionLease", actor, command.artifactRef, "accepted", [
          ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.same_shell_quiet_return_required,
        ]);
        return lease;
      },
    );
  }

  public invalidateWorkProtectionLease(
    assistiveWorkProtectionLeaseId: string,
    actor: AssistiveWorkProtectionActorContext,
    invalidatingDriftState: InvalidatingDriftState,
  ): AssistiveWorkProtectionLease {
    const lease = requireWorkProtectionLease(this.runtime, assistiveWorkProtectionLeaseId);
    const updated: AssistiveWorkProtectionLease = {
      ...lease,
      leaseState: "invalidated",
      invalidatingDriftState,
    };
    this.runtime.store.workProtectionLeases.set(updated.assistiveWorkProtectionLeaseId, updated);
    this.audit("invalidateWorkProtectionLease", actor, updated.artifactRef, "failed_closed", [
      invalidatingDriftState,
    ]);
    return updated;
  }

  public releaseWorkProtectionLease(
    assistiveWorkProtectionLeaseId: string,
    actor: AssistiveWorkProtectionActorContext,
  ): AssistiveWorkProtectionLease {
    const lease = requireWorkProtectionLease(this.runtime, assistiveWorkProtectionLeaseId);
    const updated: AssistiveWorkProtectionLease = {
      ...lease,
      leaseState: "released",
      releasedAt: this.runtime.clock.now(),
    };
    this.runtime.store.workProtectionLeases.set(updated.assistiveWorkProtectionLeaseId, updated);
    this.audit("releaseWorkProtectionLease", actor, updated.artifactRef, "accepted", ["released"]);
    return updated;
  }

  private audit(
    action: string,
    actor: AssistiveWorkProtectionActorContext,
    subjectRef: string,
    outcome: AssistiveWorkProtectionAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveWorkProtectionLeaseService",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistiveDeferredDeltaBuffer {
  public constructor(private readonly runtime: AssistiveWorkProtectionRuntime) {}

  public bufferDeferredDelta(
    command: BufferDeferredDeltaCommand,
    actor: AssistiveWorkProtectionActorContext,
  ): AssistiveDeferredDelta {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.deferredDeltas,
      () => {
        const lease = requireWorkProtectionLease(
          this.runtime,
          command.assistiveWorkProtectionLeaseRef,
        );
        if (lease.leaseState !== "active") {
          throw new Error("Cannot buffer deferred delta without an active work-protection lease.");
        }
        const deltaState: DeferredDeltaState =
          command.deltaKind === "blocking" ||
          command.blockerSeverity === "high" ||
          command.blockerSeverity === "critical"
            ? "blocking_bypass"
            : "buffered";
        const deltaId = `assistive-deferred-delta:${stableAssistiveWorkProtectionHash({
          assistiveWorkProtectionLeaseRef: command.assistiveWorkProtectionLeaseRef,
          deltaHash: command.deltaHash,
          sourceRef: command.sourceRef,
          targetRef: command.targetRef,
        })}`;
        const delta: AssistiveDeferredDelta = {
          assistiveDeferredDeltaId: deltaId,
          assistiveSessionRef: command.assistiveSessionRef,
          assistiveWorkProtectionLeaseRef: command.assistiveWorkProtectionLeaseRef,
          deltaKind: command.deltaKind,
          blockerSeverity: command.blockerSeverity,
          sourceRef: command.sourceRef,
          targetRef: command.targetRef,
          deltaHash: command.deltaHash,
          deltaState,
          receivedAt: this.runtime.clock.now(),
        };
        this.runtime.store.deferredDeltas.set(delta.assistiveDeferredDeltaId, delta);
        if (deltaState === "buffered") {
          const updatedLease: AssistiveWorkProtectionLease = {
            ...lease,
            bufferedDeferredDeltaRefs: unique([
              ...lease.bufferedDeferredDeltaRefs,
              delta.assistiveDeferredDeltaId,
            ]),
          };
          this.runtime.store.workProtectionLeases.set(
            updatedLease.assistiveWorkProtectionLeaseId,
            updatedLease,
          );
        }
        recordAudit(
          this.runtime,
          "AssistiveDeferredDeltaBuffer",
          "bufferDeferredDelta",
          actor,
          command.targetRef,
          deltaState === "buffered" ? "accepted" : "failed_closed",
          [
            ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.work_protection_buffers_disruptive_delta,
            deltaState,
          ],
        );
        return delta;
      },
    );
  }
}

export class AssistiveQuietReturnTargetResolver {
  public constructor(private readonly runtime: AssistiveWorkProtectionRuntime) {}

  public resolveQuietReturnTarget(
    command: ResolveQuietReturnTargetCommand,
    actor: AssistiveWorkProtectionActorContext,
  ): AssistiveQuietReturnTarget {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.quietReturnTargets,
      () => {
        const session = requireSession(this.runtime, command.assistiveSessionRef);
        const quietReturnTargetHash = stableAssistiveWorkProtectionHash({
          assistiveSessionRef: command.assistiveSessionRef,
          selectedAnchorRef: command.selectedAnchorRef,
          protectedRegionRef: command.protectedRegionRef,
          priorQuietRegionRef: command.priorQuietRegionRef,
          primaryReadingTargetRef: command.primaryReadingTargetRef,
          returnRouteRef: command.returnRouteRef,
        });
        const target: AssistiveQuietReturnTarget = {
          assistiveQuietReturnTargetId: `assistive-quiet-return-target:${quietReturnTargetHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          selectedAnchorRef: command.selectedAnchorRef,
          protectedRegionRef: command.protectedRegionRef,
          priorQuietRegionRef: command.priorQuietRegionRef,
          primaryReadingTargetRef: command.primaryReadingTargetRef,
          returnRouteRef: command.returnRouteRef,
          quietReturnTargetHash,
          targetState:
            session.selectedAnchorRef === command.selectedAnchorRef ? "current" : "stale",
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.quietReturnTargets.set(target.assistiveQuietReturnTargetId, target);
        recordAudit(
          this.runtime,
          "AssistiveQuietReturnTargetResolver",
          "resolveQuietReturnTarget",
          actor,
          command.returnRouteRef,
          "accepted",
          [ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.same_shell_quiet_return_required],
        );
        return target;
      },
    );
  }
}

export function createAssistiveWorkProtectionPlane(
  options: {
    clock?: AssistiveWorkProtectionClock;
    idGenerator?: AssistiveWorkProtectionIdGenerator;
    store?: AssistiveWorkProtectionStore;
  } = {},
) {
  const runtime: AssistiveWorkProtectionRuntime = {
    store: options.store ?? createAssistiveWorkProtectionStore(),
    clock: options.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options.idGenerator ?? createSequentialIdGenerator(),
  };
  return {
    runtime,
    sessions: new AssistiveSessionService(runtime),
    sessionFences: new AssistiveSessionFenceValidator(runtime),
    insertionPoints: new AssistiveDraftInsertionPointService(runtime),
    patchLeaseIssuer: new AssistiveDraftPatchLeaseIssuer(runtime),
    patchLeaseValidator: new AssistiveDraftPatchLeaseValidator(runtime),
    workProtectionLeases: new AssistiveWorkProtectionLeaseService(runtime),
    deferredDeltaBuffer: new AssistiveDeferredDeltaBuffer(runtime),
    quietReturnTargets: new AssistiveQuietReturnTargetResolver(runtime),
  };
}

export function createAssistiveWorkProtectionStore(): AssistiveWorkProtectionStore {
  return {
    sessions: new Map(),
    insertionPoints: new Map(),
    patchLeases: new Map(),
    workProtectionLeases: new Map(),
    deferredDeltas: new Map(),
    quietReturnTargets: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
  };
}

export function stableAssistiveWorkProtectionHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 32);
}

function createSequentialIdGenerator(): AssistiveWorkProtectionIdGenerator {
  let counter = 0;
  return {
    next(prefix: string): string {
      counter += 1;
      return `${prefix}:${counter.toString().padStart(6, "0")}`;
    },
  };
}

function withIdempotency<T extends object>(
  runtime: AssistiveWorkProtectionRuntime,
  idempotencyKey: string | undefined,
  map: Map<string, T>,
  producer: () => T,
): T {
  if (idempotencyKey) {
    const existingId = runtime.store.idempotencyKeys.get(idempotencyKey);
    if (existingId) {
      const existing = map.get(existingId);
      if (existing) {
        return existing;
      }
    }
  }
  const produced = producer();
  if (idempotencyKey) {
    const objectId = firstStringValueEndingWithId(produced);
    if (objectId) {
      runtime.store.idempotencyKeys.set(idempotencyKey, objectId);
    }
  }
  return produced;
}

function firstStringValueEndingWithId(value: object): string | undefined {
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key.endsWith("Id") && typeof entry === "string") {
      return entry;
    }
  }
  return undefined;
}

function recordAudit(
  runtime: AssistiveWorkProtectionRuntime,
  serviceName: string,
  action: string,
  actor: AssistiveWorkProtectionActorContext,
  subjectRef: string,
  outcome: AssistiveWorkProtectionAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("assistive-work-protection-audit"),
    serviceName,
    action,
    actorRef: actor.actorRef,
    actorRole: actor.actorRole,
    routeIntentBindingRef: actor.routeIntentBindingRef,
    auditCorrelationId: actor.auditCorrelationId,
    purposeOfUse: actor.purposeOfUse,
    subjectRef,
    outcome,
    reasonCodes: [...reasonCodes],
    recordedAt: runtime.clock.now(),
  });
}

function requireSession(
  runtime: AssistiveWorkProtectionRuntime,
  assistiveSessionId: string,
): AssistiveSession {
  const session = runtime.store.sessions.get(assistiveSessionId);
  if (!session) {
    throw new Error(`AssistiveSession not found: ${assistiveSessionId}`);
  }
  return session;
}

function requireInsertionPoint(
  runtime: AssistiveWorkProtectionRuntime,
  insertionPointId: string,
): AssistiveDraftInsertionPoint {
  const insertionPoint = runtime.store.insertionPoints.get(insertionPointId);
  if (!insertionPoint) {
    throw new Error(`AssistiveDraftInsertionPoint not found: ${insertionPointId}`);
  }
  return insertionPoint;
}

function requirePatchLease(
  runtime: AssistiveWorkProtectionRuntime,
  patchLeaseId: string,
): AssistiveDraftPatchLease {
  const lease = runtime.store.patchLeases.get(patchLeaseId);
  if (!lease) {
    throw new Error(`AssistiveDraftPatchLease not found: ${patchLeaseId}`);
  }
  return lease;
}

function requireWorkProtectionLease(
  runtime: AssistiveWorkProtectionRuntime,
  leaseId: string,
): AssistiveWorkProtectionLease {
  const lease = runtime.store.workProtectionLeases.get(leaseId);
  if (!lease) {
    throw new Error(`AssistiveWorkProtectionLease not found: ${leaseId}`);
  }
  return lease;
}

function sessionBlockingReasons(command: {
  runtimePublicationState: RuntimePublicationState;
  trustEnvelopeActionabilityState: TrustEnvelopeActionabilityState;
}): string[] {
  const reasons: string[] = [];
  if (command.runtimePublicationState !== "current") {
    reasons.push(ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.publication_drift_regenerate_required);
  }
  if (command.trustEnvelopeActionabilityState !== "enabled") {
    reasons.push(ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.trust_envelope_actionability_required);
  }
  return reasons;
}

function sessionValidationReasons(
  session: AssistiveSession,
  command: ValidateAssistiveSessionFenceCommand,
): string[] {
  const reasons: string[] = [];
  if (
    session.sessionFenceTokenHash !== stableAssistiveWorkProtectionHash(command.sessionFenceToken)
  ) {
    reasons.push(ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.session_fence_token_required);
  }
  if (session.reviewVersionRef !== command.currentReviewVersionRef) {
    reasons.push(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.review_version_drift_regenerate_required,
    );
  }
  if (session.decisionEpochRef !== command.currentDecisionEpochRef) {
    reasons.push(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.decision_epoch_drift_regenerate_required,
    );
  }
  if (session.policyBundleRef !== command.currentPolicyBundleRef) {
    reasons.push(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.policy_bundle_drift_regenerate_required,
    );
  }
  if (session.lineageFenceEpoch !== command.currentLineageFenceEpoch) {
    reasons.push("lineage_fence_drift_regenerate_required");
  }
  if (session.selectedAnchorRef !== command.currentSelectedAnchorRef) {
    reasons.push(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.selected_anchor_drift_regenerate_required,
    );
  }
  if (
    session.surfacePublicationRef !== command.currentSurfacePublicationRef ||
    session.runtimePublicationBundleRef !== command.currentRuntimePublicationBundleRef ||
    command.currentRuntimePublicationState !== "current"
  ) {
    reasons.push(ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.publication_drift_regenerate_required);
  }
  if (session.reviewActionLeaseRef !== command.currentReviewActionLeaseRef) {
    reasons.push("review_action_lease_drift_regenerate_required");
  }
  if (session.workspaceTrustEnvelopeRef !== command.currentWorkspaceTrustEnvelopeRef) {
    reasons.push("workspace_trust_envelope_drift_regenerate_required");
  }
  if (
    session.assistiveCapabilityTrustEnvelopeRef !==
    command.currentAssistiveCapabilityTrustEnvelopeRef
  ) {
    reasons.push("assistive_trust_envelope_drift_regenerate_required");
  }
  if (command.currentTrustEnvelopeActionabilityState !== "enabled") {
    reasons.push(ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.trust_envelope_actionability_required);
  }
  return unique(reasons);
}

function patchLeaseValidationReasons(
  lease: AssistiveDraftPatchLease,
  command: ValidateDraftPatchLeaseCommand,
  now: ISODateString,
): string[] {
  const reasons: string[] = [];
  if (Date.parse(now) >= Date.parse(lease.expiresAt)) {
    reasons.push("patch_lease_expired");
  }
  if (lease.leaseState !== "active") {
    reasons.push(ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.patch_lease_drift_invalidated);
  }
  if (lease.reviewVersionRef !== command.currentReviewVersionRef) {
    reasons.push(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.review_version_drift_regenerate_required,
    );
  }
  if (lease.decisionEpochRef !== command.currentDecisionEpochRef) {
    reasons.push(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.decision_epoch_drift_regenerate_required,
    );
  }
  if (lease.lineageFenceEpoch !== command.currentLineageFenceEpoch) {
    reasons.push("lineage_fence_drift_regenerate_required");
  }
  if (lease.selectedAnchorRef !== command.currentSelectedAnchorRef) {
    reasons.push(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.selected_anchor_drift_regenerate_required,
    );
  }
  if (lease.reviewActionLeaseRef !== command.currentReviewActionLeaseRef) {
    reasons.push("review_action_lease_drift_regenerate_required");
  }
  if (lease.slotHash !== command.currentSlotHash) {
    reasons.push(ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.patch_lease_drift_invalidated);
  }
  return unique(reasons);
}

function resolvePatchLeaseDriftState(reasons: readonly string[]): InvalidatingDriftState {
  if (reasons.length === 0) {
    return "none";
  }
  if (reasons.includes("patch_lease_expired")) {
    return "lease_expired";
  }
  if (
    reasons.includes(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.selected_anchor_drift_regenerate_required,
    )
  ) {
    return "anchor_invalidated";
  }
  if (
    reasons.includes(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.review_version_drift_regenerate_required,
    )
  ) {
    return "review_version";
  }
  if (
    reasons.includes(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.decision_epoch_drift_regenerate_required,
    )
  ) {
    return "decision_epoch";
  }
  return "insertion_point_invalidated";
}

function resolveValidationState(reasons: readonly string[]): FenceValidationState {
  if (reasons.length === 0) {
    return "valid";
  }
  if (
    reasons.includes(
      ASSISTIVE_WORK_PROTECTION_INVARIANT_MARKERS.trust_envelope_actionability_required,
    )
  ) {
    return "blocked";
  }
  return "drifted";
}

function computeSessionFreshnessPenalty(session: AssistiveSession, now: ISODateString): number {
  const elapsedSeconds = Math.max(
    0,
    (Date.parse(now) - Date.parse(session.lastValidatedAt)) / 1000,
  );
  if (elapsedSeconds <= session.liveTtlSeconds) {
    return 0;
  }
  return Math.min(
    1,
    (elapsedSeconds - session.liveTtlSeconds) / Math.max(1, session.graceTtlSeconds),
  );
}

function requireNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function stableStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return '"__undefined__"';
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
