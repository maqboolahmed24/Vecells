import { createHash } from "node:crypto";

export type ISODateString = string;

export type AssistiveFeedbackActorRole =
  | "feedback_chain_service"
  | "action_ledger"
  | "clinical_reviewer"
  | "second_reviewer"
  | "clinical_safety_lead"
  | "model_output_generator"
  | "system";

export type AssistiveActionType =
  | "accept_unchanged"
  | "accept_after_edit"
  | "reject_to_alternative"
  | "abstained_by_human"
  | "insert_draft"
  | "regenerate"
  | "dismiss_suggestion"
  | "acknowledge_abstain"
  | "stale_recovery";

export type AssistiveFeedbackChainState =
  | "in_review"
  | "approval_pending"
  | "settled_clean"
  | "adjudication_pending"
  | "excluded"
  | "revoked"
  | "superseded";

export type AssistiveActionSettlementState =
  | "pending"
  | "settled"
  | "recovery_required"
  | "manual_handoff_required"
  | "stale_recoverable";

export type AssistiveActionRecordState = "captured" | "superseded" | "revoked";
export type OverrideDisposition =
  | "accepted_unchanged"
  | "accepted_after_edit"
  | "rejected_to_alternative"
  | "abstained_by_human";
export type OverrideScope =
  | "style_only"
  | "content_material"
  | "policy_exception"
  | "trust_recovery";
export type ReasonRequirementState = "optional" | "required";
export type ContinuityValidationState = "trusted" | "degraded" | "stale" | "blocked";
export type OverrideRecordState = "captured" | "superseded" | "revoked";
export type RiskTier = "low" | "medium" | "high" | "critical";
export type ApprovalEligibilityState =
  | "blocked"
  | "single_review"
  | "dual_review"
  | "ready_to_settle";
export type ApprovalAssessmentState = "current" | "superseded" | "blocked" | "settled";
export type CompletionAdjacencyState = "allowed" | "observe_only" | "blocked";
export type FinalArtifactType =
  | "clinical_note"
  | "patient_message"
  | "endpoint_decision"
  | "question_set"
  | "handoff_summary";
export type ApprovalMode = "de_novo" | "assistive_seeded" | "assistive_edited";
export type WorkflowSettlementState =
  | "pending"
  | "settled"
  | "superseded"
  | "incident_held"
  | "excluded";
export type SupersessionReason =
  | "regenerate"
  | "artifact_hash_drift"
  | "final_human_artifact_superseded"
  | "incident_linked"
  | "manual_revoke";

export const ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS = {
  one_feedback_chain_per_artifact_revision: "one_feedback_chain_per_artifact_revision",
  action_gesture_key_idempotency_boundary: "action_gesture_key_idempotency_boundary",
  action_gesture_cannot_fork_chains: "action_gesture_cannot_fork_chains",
  material_override_reason_code_required: "material_override_reason_code_required",
  low_confidence_high_harm_acceptance_requires_reason:
    "low_confidence_high_harm_acceptance_requires_reason",
  dual_review_required_for_high_risk_low_trust_external_commit:
    "dual_review_required_for_high_risk_low_trust_external_commit",
  distinct_approver_required: "distinct_approver_required",
  model_output_generator_cannot_approve: "model_output_generator_cannot_approve",
  final_human_artifact_requires_authoritative_settlement:
    "final_human_artifact_requires_authoritative_settlement",
  assistive_acceptance_is_not_workflow_settlement:
    "assistive_acceptance_is_not_workflow_settlement",
  regenerate_supersedes_feedback_chain: "regenerate_supersedes_feedback_chain",
  artifact_hash_drift_supersedes_feedback_chain: "artifact_hash_drift_supersedes_feedback_chain",
  feedback_chain_outputs_for_414_only: "feedback_chain_outputs_for_414_only",
  phi_safe_feedback_telemetry_required: "phi_safe_feedback_telemetry_required",
} as const;

export interface AssistiveFeedbackActorContext {
  actorRef: string;
  actorRole: AssistiveFeedbackActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface AssistiveFeedbackAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: AssistiveFeedbackActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface AssistiveFeedbackChain {
  assistiveFeedbackChainId: string;
  assistiveSessionRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactRef: string;
  artifactRevisionRef: string;
  artifactHash: string;
  capabilityCode: string;
  taskRef: string;
  routeIntentBindingRef: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  chainTupleHash: string;
  actionRecordRefs: readonly string[];
  latestActionRecordRef?: string;
  overrideRecordRefs: readonly string[];
  currentOverrideRecordRef?: string;
  approvalGateAssessmentRefs: readonly string[];
  currentApprovalGateAssessmentRef?: string;
  currentFinalHumanArtifactRef?: string;
  feedbackEligibilityFlagRef?: string;
  incidentLinkRefs: readonly string[];
  supersedesFeedbackChainRef?: string;
  supersededByFeedbackChainRef?: string;
  chainState: AssistiveFeedbackChainState;
  openedAt: ISODateString;
  settledAt?: ISODateString;
  revokedAt?: ISODateString;
}

export interface AssistiveArtifactActionRecord {
  actionRecordId: string;
  assistiveSessionId: string;
  assistiveFeedbackChainRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactRef: string;
  artifactHash: string;
  actionType: AssistiveActionType;
  actionGestureKey: string;
  sectionRef?: string;
  actorRef: string;
  routeIntentBindingRef: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  reviewActionLeaseRef: string;
  uiEventEnvelopeRef: string;
  uiTransitionSettlementRecordRef: string;
  uiTelemetryDisclosureFenceRef: string;
  resultingOverrideRecordRef?: string;
  resultingApprovalGateAssessmentRef?: string;
  resultingFinalHumanArtifactRef?: string;
  resultingFeedbackEligibilityFlagRef?: string;
  supersedesActionRecordRef?: string;
  timestamp: ISODateString;
  authoritativeSettlementState: AssistiveActionSettlementState;
  actionState: AssistiveActionRecordState;
}

export interface OverrideReasonPolicy {
  policyBundleRef: string;
  highHarmReasonThreshold: number;
  lowTrustReasonThreshold: number;
}

export interface OverrideRecord {
  overrideRecordId: string;
  assistiveSessionId: string;
  assistiveFeedbackChainRef: string;
  assistiveArtifactActionRecordRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  capabilityCode: string;
  decisionType: string;
  modelOutputRef: string;
  humanOutputRef: string;
  artifactHash: string;
  overrideDisposition: OverrideDisposition;
  overrideScope: OverrideScope;
  changedSpanRefs: readonly string[];
  overrideReasonCodes: readonly string[];
  reasonRequirementState: ReasonRequirementState;
  freeTextRef?: string;
  displayConfidenceBand: string;
  allowedSetMassAtDecision: number;
  epistemicUncertaintyAtDecision: number;
  expectedHarmAtDecision: number;
  trustScoreAtDecision: number;
  sessionFreshnessPenalty: number;
  continuityValidationState: ContinuityValidationState;
  provenanceEnvelopeRef: string;
  confidenceDigestRef: string;
  approvalGateAssessmentRef?: string;
  finalHumanArtifactRef?: string;
  feedbackEligibilityFlagRef?: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  reasonPolicyBundleRef: string;
  recordedAt: ISODateString;
  overrideState: OverrideRecordState;
}

export interface ApprovalEventInput {
  approverRef: string;
  approvalEventRef: string;
  approverRole: string;
  approvedAt: ISODateString;
}

export interface ApprovalGatePolicy {
  approvalPolicyBundleRef: string;
  thetaDualReview: number;
  tauSingleReviewerGreen: number;
  tauCommit: number;
}

export interface HumanApprovalGateAssessment {
  approvalGateAssessmentId: string;
  assistiveSessionRef: string;
  assistiveFeedbackChainRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactRef: string;
  artifactHash: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  selectedAnchorRef: string;
  approvalPolicyBundleRef: string;
  decisionType: string;
  riskTier: RiskTier;
  expectedHarmAtGate: number;
  requiredApproverCount: number;
  currentApproverCount: number;
  currentApproverRefs: readonly string[];
  trustScoreAtGate: number;
  sessionFreshnessPenalty: number;
  continuityValidationState: ContinuityValidationState;
  eligibilityState: ApprovalEligibilityState;
  blockingReasonCodes: readonly string[];
  finalHumanArtifactRef?: string;
  computedAt: ISODateString;
  assessmentState: ApprovalAssessmentState;
}

export interface FinalHumanArtifact {
  finalArtifactId: string;
  taskRef: string;
  assistiveFeedbackChainRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactType: FinalArtifactType;
  contentRef: string;
  artifactHash: string;
  approvedByRefs: readonly string[];
  approvalEventRefs: readonly string[];
  approvedAt: ISODateString;
  approvalMode: ApprovalMode;
  approvalGateAssessmentRef: string;
  sourceAssistiveRefs: readonly string[];
  artifactPresentationContractRef: string;
  authoritativeWorkflowSettlementRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  selectedAnchorRef: string;
  workflowSettlementState: WorkflowSettlementState;
  supersededByFinalHumanArtifactRef?: string;
  settledAt: ISODateString;
}

export interface AssistiveFeedbackChainStore {
  chains: Map<string, AssistiveFeedbackChain>;
  actions: Map<string, AssistiveArtifactActionRecord>;
  overrides: Map<string, OverrideRecord>;
  approvalAssessments: Map<string, HumanApprovalGateAssessment>;
  finalHumanArtifacts: Map<string, FinalHumanArtifact>;
  auditRecords: AssistiveFeedbackAuditRecord[];
  idempotencyKeys: Map<string, string>;
  actionGestureKeys: Map<string, string>;
  currentChainByTupleHash: Map<string, string>;
}

export interface AssistiveFeedbackClock {
  now(): ISODateString;
}

export interface AssistiveFeedbackIdGenerator {
  next(prefix: string): string;
}

export interface AssistiveFeedbackRuntime {
  store: AssistiveFeedbackChainStore;
  clock: AssistiveFeedbackClock;
  idGenerator: AssistiveFeedbackIdGenerator;
}

export interface OpenFeedbackChainCommand {
  assistiveFeedbackChainId?: string;
  assistiveSessionRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactRef: string;
  artifactRevisionRef: string;
  artifactHash: string;
  capabilityCode: string;
  taskRef: string;
  routeIntentBindingRef: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  supersedesFeedbackChainRef?: string;
  idempotencyKey?: string;
}

export interface RecordAssistiveActionCommand {
  actionRecordId?: string;
  assistiveSessionId: string;
  assistiveFeedbackChainRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactRef: string;
  artifactHash: string;
  actionType: AssistiveActionType;
  actionGestureKey: string;
  sectionRef?: string;
  actorRef: string;
  routeIntentBindingRef: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  reviewActionLeaseRef: string;
  uiEventEnvelopeRef: string;
  uiTransitionSettlementRecordRef: string;
  uiTelemetryDisclosureFenceRef: string;
  authoritativeSettlementState?: AssistiveActionSettlementState;
}

export interface CaptureOverrideRecordCommand {
  overrideRecordId?: string;
  assistiveSessionId: string;
  assistiveFeedbackChainRef: string;
  assistiveArtifactActionRecordRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  capabilityCode: string;
  decisionType: string;
  modelOutputRef: string;
  humanOutputRef: string;
  artifactHash: string;
  overrideDisposition: OverrideDisposition;
  overrideScope: OverrideScope;
  changedSpanRefs?: readonly string[];
  overrideReasonCodes?: readonly string[];
  freeTextRef?: string;
  displayConfidenceBand: string;
  allowedSetMassAtDecision: number;
  epistemicUncertaintyAtDecision: number;
  expectedHarmAtDecision: number;
  trustScoreAtDecision: number;
  sessionFreshnessPenalty: number;
  continuityValidationState: ContinuityValidationState;
  provenanceEnvelopeRef: string;
  confidenceDigestRef: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  reasonPolicy: OverrideReasonPolicy;
  idempotencyKey?: string;
}

export interface AssessHumanApprovalGateCommand {
  approvalGateAssessmentId?: string;
  assistiveSessionRef: string;
  assistiveFeedbackChainRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactRef: string;
  artifactHash: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  selectedAnchorRef: string;
  decisionType: string;
  riskTier: RiskTier;
  expectedHarmAtGate: number;
  trustScoreAtGate: number;
  sessionFreshnessPenalty: number;
  continuityValidationState: ContinuityValidationState;
  allFencesValid: boolean;
  externallyConsequential: boolean;
  irreversible: boolean;
  policyExceptionOverride?: boolean;
  hardStopOverride?: boolean;
  completionAdjacencyState: CompletionAdjacencyState;
  modelOutputGeneratorRef?: string;
  approvalEvents?: readonly ApprovalEventInput[];
  approvalGatePolicy: ApprovalGatePolicy;
  idempotencyKey?: string;
}

export interface BindFinalHumanArtifactCommand {
  finalArtifactId?: string;
  taskRef: string;
  assistiveFeedbackChainRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  artifactType: FinalArtifactType;
  contentRef: string;
  artifactHash: string;
  approvedByRefs: readonly string[];
  approvalEventRefs: readonly string[];
  approvedAt: ISODateString;
  approvalMode: ApprovalMode;
  approvalGateAssessmentRef: string;
  sourceAssistiveRefs: readonly string[];
  artifactPresentationContractRef: string;
  authoritativeWorkflowSettlementRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  selectedAnchorRef: string;
  workflowSettlementState: WorkflowSettlementState;
  completionAdjacencyState: CompletionAdjacencyState;
  idempotencyKey?: string;
}

export interface SupersedeFeedbackChainCommand {
  currentFeedbackChainRef: string;
  supersessionReason: SupersessionReason;
  replacementArtifactRef?: string;
  replacementArtifactRevisionRef?: string;
  replacementArtifactHash?: string;
  replacementIdempotencyKey?: string;
}

export class AssistiveFeedbackChainService {
  public constructor(private readonly runtime: AssistiveFeedbackRuntime) {}

  public openFeedbackChain(
    command: OpenFeedbackChainCommand,
    actor: AssistiveFeedbackActorContext,
  ): AssistiveFeedbackChain {
    return withIdempotency(this.runtime, command.idempotencyKey, this.runtime.store.chains, () =>
      this.openFeedbackChainWithoutIdempotency(command, actor),
    );
  }

  public getChain(assistiveFeedbackChainId: string): AssistiveFeedbackChain | undefined {
    return this.runtime.store.chains.get(assistiveFeedbackChainId);
  }

  private openFeedbackChainWithoutIdempotency(
    command: OpenFeedbackChainCommand,
    actor: AssistiveFeedbackActorContext,
  ): AssistiveFeedbackChain {
    for (const [label, value] of [
      ["assistiveSessionRef", command.assistiveSessionRef],
      ["assistiveCapabilityTrustEnvelopeRef", command.assistiveCapabilityTrustEnvelopeRef],
      ["artifactRef", command.artifactRef],
      ["artifactRevisionRef", command.artifactRevisionRef],
      ["artifactHash", command.artifactHash],
      ["capabilityCode", command.capabilityCode],
      ["taskRef", command.taskRef],
      ["routeIntentBindingRef", command.routeIntentBindingRef],
      ["selectedAnchorRef", command.selectedAnchorRef],
      ["reviewVersionRef", command.reviewVersionRef],
      ["decisionEpochRef", command.decisionEpochRef],
      ["policyBundleRef", command.policyBundleRef],
      ["lineageFenceEpoch", command.lineageFenceEpoch],
    ] as const) {
      requireNonEmpty(value, label);
    }

    const chainTupleHash = feedbackChainTupleHash(command);
    const existingChainRef = this.runtime.store.currentChainByTupleHash.get(chainTupleHash);
    if (existingChainRef) {
      const existing = requireChain(this.runtime, existingChainRef);
      if (!isTerminalChainState(existing.chainState)) {
        recordAudit(
          this.runtime,
          "AssistiveFeedbackChainService",
          "openFeedbackChain",
          actor,
          existing.assistiveFeedbackChainId,
          "accepted",
          [ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.one_feedback_chain_per_artifact_revision],
        );
        return existing;
      }
    }

    const chain: AssistiveFeedbackChain = {
      assistiveFeedbackChainId:
        command.assistiveFeedbackChainId ?? `assistive-feedback-chain:${chainTupleHash}`,
      assistiveSessionRef: command.assistiveSessionRef,
      assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
      artifactRef: command.artifactRef,
      artifactRevisionRef: command.artifactRevisionRef,
      artifactHash: command.artifactHash,
      capabilityCode: command.capabilityCode,
      taskRef: command.taskRef,
      routeIntentBindingRef: command.routeIntentBindingRef,
      selectedAnchorRef: command.selectedAnchorRef,
      reviewVersionRef: command.reviewVersionRef,
      decisionEpochRef: command.decisionEpochRef,
      policyBundleRef: command.policyBundleRef,
      lineageFenceEpoch: command.lineageFenceEpoch,
      chainTupleHash,
      actionRecordRefs: [],
      overrideRecordRefs: [],
      approvalGateAssessmentRefs: [],
      incidentLinkRefs: [],
      supersedesFeedbackChainRef: command.supersedesFeedbackChainRef,
      chainState: "in_review",
      openedAt: this.runtime.clock.now(),
    };

    this.runtime.store.chains.set(chain.assistiveFeedbackChainId, chain);
    this.runtime.store.currentChainByTupleHash.set(chainTupleHash, chain.assistiveFeedbackChainId);
    recordAudit(
      this.runtime,
      "AssistiveFeedbackChainService",
      "openFeedbackChain",
      actor,
      chain.assistiveFeedbackChainId,
      "accepted",
      [
        ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.one_feedback_chain_per_artifact_revision,
        ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.feedback_chain_outputs_for_414_only,
      ],
    );
    return chain;
  }
}

export class ActionGestureIdempotencyGuard {
  public constructor(private readonly runtime: AssistiveFeedbackRuntime) {}

  public resolveExistingAction(
    actionGestureKey: string,
    assistiveFeedbackChainRef: string,
  ): AssistiveArtifactActionRecord | undefined {
    const existingActionRef = this.runtime.store.actionGestureKeys.get(actionGestureKey);
    if (!existingActionRef) {
      return undefined;
    }
    const existing = requireAction(this.runtime, existingActionRef);
    if (existing.assistiveFeedbackChainRef !== assistiveFeedbackChainRef) {
      throw new Error(
        `${ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.action_gesture_cannot_fork_chains}: ${actionGestureKey}`,
      );
    }
    return existing;
  }

  public remember(actionGestureKey: string, actionRecordId: string): void {
    const existingActionRef = this.runtime.store.actionGestureKeys.get(actionGestureKey);
    if (existingActionRef && existingActionRef !== actionRecordId) {
      throw new Error(
        `${ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.action_gesture_key_idempotency_boundary}: ${actionGestureKey}`,
      );
    }
    this.runtime.store.actionGestureKeys.set(actionGestureKey, actionRecordId);
  }
}

export class AssistiveArtifactActionLedger {
  private readonly idempotencyGuard: ActionGestureIdempotencyGuard;

  public constructor(private readonly runtime: AssistiveFeedbackRuntime) {
    this.idempotencyGuard = new ActionGestureIdempotencyGuard(runtime);
  }

  public recordAction(
    command: RecordAssistiveActionCommand,
    actor: AssistiveFeedbackActorContext,
  ): AssistiveArtifactActionRecord {
    requireNonEmpty(command.actionGestureKey, "actionGestureKey");
    const chain = requireChain(this.runtime, command.assistiveFeedbackChainRef);
    assertChainWritable(chain);

    const existing = this.idempotencyGuard.resolveExistingAction(
      command.actionGestureKey,
      command.assistiveFeedbackChainRef,
    );
    if (existing) {
      recordAudit(
        this.runtime,
        "AssistiveArtifactActionLedger",
        "recordAction",
        actor,
        existing.actionRecordId,
        "accepted",
        [ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.action_gesture_key_idempotency_boundary],
      );
      return existing;
    }

    assertActionMatchesChain(command, chain);
    const actionRecordId =
      command.actionRecordId ??
      `assistive-action-record:${stableAssistiveFeedbackHash({
        assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
        actionGestureKey: command.actionGestureKey,
      })}`;
    const action: AssistiveArtifactActionRecord = {
      actionRecordId,
      assistiveSessionId: command.assistiveSessionId,
      assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
      assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
      artifactRef: command.artifactRef,
      artifactHash: command.artifactHash,
      actionType: command.actionType,
      actionGestureKey: command.actionGestureKey,
      sectionRef: command.sectionRef,
      actorRef: command.actorRef,
      routeIntentBindingRef: command.routeIntentBindingRef,
      selectedAnchorRef: command.selectedAnchorRef,
      reviewVersionRef: command.reviewVersionRef,
      decisionEpochRef: command.decisionEpochRef,
      reviewActionLeaseRef: command.reviewActionLeaseRef,
      uiEventEnvelopeRef: command.uiEventEnvelopeRef,
      uiTransitionSettlementRecordRef: command.uiTransitionSettlementRecordRef,
      uiTelemetryDisclosureFenceRef: command.uiTelemetryDisclosureFenceRef,
      timestamp: this.runtime.clock.now(),
      authoritativeSettlementState: command.authoritativeSettlementState ?? "pending",
      actionState: "captured",
    };

    this.runtime.store.actions.set(action.actionRecordId, action);
    this.idempotencyGuard.remember(action.actionGestureKey, action.actionRecordId);
    const updatedChain = appendActionToChain(chain, action, this.runtime.clock.now());
    this.runtime.store.chains.set(updatedChain.assistiveFeedbackChainId, updatedChain);
    recordAudit(
      this.runtime,
      "AssistiveArtifactActionLedger",
      "recordAction",
      actor,
      action.actionRecordId,
      "accepted",
      [
        ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.action_gesture_key_idempotency_boundary,
        ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.phi_safe_feedback_telemetry_required,
      ],
    );
    return action;
  }
}

export class OverrideRecordService {
  public constructor(private readonly runtime: AssistiveFeedbackRuntime) {}

  public captureOverrideRecord(
    command: CaptureOverrideRecordCommand,
    actor: AssistiveFeedbackActorContext,
  ): OverrideRecord {
    return withIdempotency(this.runtime, command.idempotencyKey, this.runtime.store.overrides, () =>
      this.captureOverrideWithoutIdempotency(command, actor),
    );
  }

  private captureOverrideWithoutIdempotency(
    command: CaptureOverrideRecordCommand,
    actor: AssistiveFeedbackActorContext,
  ): OverrideRecord {
    const chain = requireChain(this.runtime, command.assistiveFeedbackChainRef);
    assertChainWritable(chain);
    const action = requireAction(this.runtime, command.assistiveArtifactActionRecordRef);
    if (action.assistiveFeedbackChainRef !== chain.assistiveFeedbackChainId) {
      throw new Error("OverrideRecord must point to an action on the same feedback chain.");
    }

    const reasonRequirementState = requiresOverrideReason(command) ? "required" : "optional";
    const overrideReasonCodes = [...(command.overrideReasonCodes ?? [])];
    if (reasonRequirementState === "required" && overrideReasonCodes.length === 0) {
      recordAudit(
        this.runtime,
        "OverrideRecordService",
        "captureOverrideRecord",
        actor,
        chain.assistiveFeedbackChainId,
        "failed_closed",
        [
          ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.material_override_reason_code_required,
          ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.low_confidence_high_harm_acceptance_requires_reason,
        ],
      );
      throw new Error(
        `${ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.material_override_reason_code_required}: overrideReasonCodes required`,
      );
    }

    const overrideRecordId =
      command.overrideRecordId ??
      `assistive-override-record:${stableAssistiveFeedbackHash({
        assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
        assistiveArtifactActionRecordRef: command.assistiveArtifactActionRecordRef,
        humanOutputRef: command.humanOutputRef,
        overrideDisposition: command.overrideDisposition,
      })}`;
    const override: OverrideRecord = {
      overrideRecordId,
      assistiveSessionId: command.assistiveSessionId,
      assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
      assistiveArtifactActionRecordRef: command.assistiveArtifactActionRecordRef,
      assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
      capabilityCode: command.capabilityCode,
      decisionType: command.decisionType,
      modelOutputRef: command.modelOutputRef,
      humanOutputRef: command.humanOutputRef,
      artifactHash: command.artifactHash,
      overrideDisposition: command.overrideDisposition,
      overrideScope: command.overrideScope,
      changedSpanRefs: [...(command.changedSpanRefs ?? [])],
      overrideReasonCodes,
      reasonRequirementState,
      freeTextRef: command.freeTextRef,
      displayConfidenceBand: command.displayConfidenceBand,
      allowedSetMassAtDecision: command.allowedSetMassAtDecision,
      epistemicUncertaintyAtDecision: command.epistemicUncertaintyAtDecision,
      expectedHarmAtDecision: command.expectedHarmAtDecision,
      trustScoreAtDecision: command.trustScoreAtDecision,
      sessionFreshnessPenalty: command.sessionFreshnessPenalty,
      continuityValidationState: command.continuityValidationState,
      provenanceEnvelopeRef: command.provenanceEnvelopeRef,
      confidenceDigestRef: command.confidenceDigestRef,
      selectedAnchorRef: command.selectedAnchorRef,
      reviewVersionRef: command.reviewVersionRef,
      reasonPolicyBundleRef: command.reasonPolicy.policyBundleRef,
      recordedAt: this.runtime.clock.now(),
      overrideState: "captured",
    };

    this.runtime.store.overrides.set(override.overrideRecordId, override);
    const updatedAction: AssistiveArtifactActionRecord = {
      ...action,
      resultingOverrideRecordRef: override.overrideRecordId,
    };
    this.runtime.store.actions.set(updatedAction.actionRecordId, updatedAction);
    const updatedChain: AssistiveFeedbackChain = {
      ...chain,
      overrideRecordRefs: unique([...chain.overrideRecordRefs, override.overrideRecordId]),
      currentOverrideRecordRef: override.overrideRecordId,
    };
    this.runtime.store.chains.set(updatedChain.assistiveFeedbackChainId, updatedChain);
    recordAudit(
      this.runtime,
      "OverrideRecordService",
      "captureOverrideRecord",
      actor,
      override.overrideRecordId,
      "accepted",
      [
        reasonRequirementState,
        ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.phi_safe_feedback_telemetry_required,
      ],
    );
    return override;
  }
}

export class DistinctApproverPolicyGuard {
  public constructor(private readonly runtime: AssistiveFeedbackRuntime) {}

  public eligibleApproverRefs(
    approvalEvents: readonly ApprovalEventInput[],
    modelOutputGeneratorRef?: string,
  ): string[] {
    return unique(
      approvalEvents
        .map((event) => event.approverRef)
        .filter((approverRef) => approverRef !== modelOutputGeneratorRef),
    );
  }

  public blockingReasons(
    requiredApproverCount: number,
    approvalEvents: readonly ApprovalEventInput[],
    modelOutputGeneratorRef?: string,
  ): string[] {
    const eligibleRefs = this.eligibleApproverRefs(approvalEvents, modelOutputGeneratorRef);
    const reasons: string[] = [];
    if (
      modelOutputGeneratorRef &&
      approvalEvents.some((event) => event.approverRef === modelOutputGeneratorRef)
    ) {
      reasons.push(
        ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.model_output_generator_cannot_approve,
      );
    }
    if (eligibleRefs.length < requiredApproverCount) {
      reasons.push(ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.distinct_approver_required);
    }
    return reasons;
  }
}

export class HumanApprovalGateEngine {
  private readonly approverGuard: DistinctApproverPolicyGuard;

  public constructor(private readonly runtime: AssistiveFeedbackRuntime) {
    this.approverGuard = new DistinctApproverPolicyGuard(runtime);
  }

  public assessApprovalGate(
    command: AssessHumanApprovalGateCommand,
    actor: AssistiveFeedbackActorContext,
  ): HumanApprovalGateAssessment {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.approvalAssessments,
      () => this.assessApprovalGateWithoutIdempotency(command, actor),
    );
  }

  private assessApprovalGateWithoutIdempotency(
    command: AssessHumanApprovalGateCommand,
    actor: AssistiveFeedbackActorContext,
  ): HumanApprovalGateAssessment {
    const chain = requireChain(this.runtime, command.assistiveFeedbackChainRef);
    assertActionMatchesChain(
      {
        assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
        assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
        artifactRef: command.artifactRef,
        artifactHash: command.artifactHash,
        selectedAnchorRef: command.selectedAnchorRef,
        reviewVersionRef: command.reviewVersionRef,
        decisionEpochRef: command.decisionEpochRef,
        routeIntentBindingRef: chain.routeIntentBindingRef,
      },
      chain,
    );

    const requiredApproverCount = requiresDualReview(command) ? 2 : 1;
    const approvalEvents = command.approvalEvents ?? [];
    const currentApproverRefs = this.approverGuard.eligibleApproverRefs(
      approvalEvents,
      command.modelOutputGeneratorRef,
    );
    const blockingReasonCodes = [
      ...approvalGateBlockingReasons(command),
      ...this.approverGuard.blockingReasons(
        requiredApproverCount,
        approvalEvents,
        command.modelOutputGeneratorRef,
      ),
    ];
    const uniqueBlockingReasonCodes = unique(blockingReasonCodes);
    const eligibilityState = approvalEligibilityState(
      uniqueBlockingReasonCodes,
      requiredApproverCount,
      currentApproverRefs.length,
    );
    const assessment: HumanApprovalGateAssessment = {
      approvalGateAssessmentId:
        command.approvalGateAssessmentId ??
        `human-approval-gate:${stableAssistiveFeedbackHash({
          assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
          artifactHash: command.artifactHash,
          approvalPolicyBundleRef: command.approvalGatePolicy.approvalPolicyBundleRef,
          currentApproverRefs,
        })}`,
      assistiveSessionRef: command.assistiveSessionRef,
      assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
      assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
      artifactRef: command.artifactRef,
      artifactHash: command.artifactHash,
      reviewVersionRef: command.reviewVersionRef,
      decisionEpochRef: command.decisionEpochRef,
      selectedAnchorRef: command.selectedAnchorRef,
      approvalPolicyBundleRef: command.approvalGatePolicy.approvalPolicyBundleRef,
      decisionType: command.decisionType,
      riskTier: command.riskTier,
      expectedHarmAtGate: command.expectedHarmAtGate,
      requiredApproverCount,
      currentApproverCount: currentApproverRefs.length,
      currentApproverRefs,
      trustScoreAtGate: command.trustScoreAtGate,
      sessionFreshnessPenalty: command.sessionFreshnessPenalty,
      continuityValidationState: command.continuityValidationState,
      eligibilityState,
      blockingReasonCodes: uniqueBlockingReasonCodes,
      computedAt: this.runtime.clock.now(),
      assessmentState: eligibilityState === "blocked" ? "blocked" : "current",
    };

    this.runtime.store.approvalAssessments.set(assessment.approvalGateAssessmentId, assessment);
    const updatedChain: AssistiveFeedbackChain = {
      ...chain,
      approvalGateAssessmentRefs: unique([
        ...chain.approvalGateAssessmentRefs,
        assessment.approvalGateAssessmentId,
      ]),
      currentApprovalGateAssessmentRef: assessment.approvalGateAssessmentId,
      chainState:
        assessment.eligibilityState === "ready_to_settle" ? chain.chainState : "approval_pending",
    };
    this.runtime.store.chains.set(updatedChain.assistiveFeedbackChainId, updatedChain);
    recordAudit(
      this.runtime,
      "HumanApprovalGateEngine",
      "assessApprovalGate",
      actor,
      assessment.approvalGateAssessmentId,
      assessment.eligibilityState === "blocked" ? "failed_closed" : "accepted",
      [
        requiredApproverCount === 2
          ? ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.dual_review_required_for_high_risk_low_trust_external_commit
          : "single_review_allowed",
        ...assessment.blockingReasonCodes,
      ],
    );
    return assessment;
  }
}

export class FinalHumanArtifactBinder {
  public constructor(private readonly runtime: AssistiveFeedbackRuntime) {}

  public bindFinalHumanArtifact(
    command: BindFinalHumanArtifactCommand,
    actor: AssistiveFeedbackActorContext,
  ): FinalHumanArtifact {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.finalHumanArtifacts,
      () => this.bindFinalHumanArtifactWithoutIdempotency(command, actor),
    );
  }

  private bindFinalHumanArtifactWithoutIdempotency(
    command: BindFinalHumanArtifactCommand,
    actor: AssistiveFeedbackActorContext,
  ): FinalHumanArtifact {
    const chain = requireChain(this.runtime, command.assistiveFeedbackChainRef);
    assertChainWritable(chain);
    const assessment = requireApprovalAssessment(this.runtime, command.approvalGateAssessmentRef);
    if (assessment.assistiveFeedbackChainRef !== chain.assistiveFeedbackChainId) {
      throw new Error("FinalHumanArtifact must point to an assessment on the same chain.");
    }
    if (
      command.workflowSettlementState !== "settled" ||
      command.completionAdjacencyState !== "allowed"
    ) {
      recordAudit(
        this.runtime,
        "FinalHumanArtifactBinder",
        "bindFinalHumanArtifact",
        actor,
        chain.assistiveFeedbackChainId,
        "failed_closed",
        [
          ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.final_human_artifact_requires_authoritative_settlement,
          ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.assistive_acceptance_is_not_workflow_settlement,
        ],
      );
      throw new Error(
        `${ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.final_human_artifact_requires_authoritative_settlement}: workflow settlement must be settled`,
      );
    }
    if (
      assessment.eligibilityState !== "ready_to_settle" ||
      assessment.currentApproverCount < assessment.requiredApproverCount
    ) {
      throw new Error("HumanApprovalGateAssessment is not ready to settle.");
    }
    if (!command.sourceAssistiveRefs.includes(chain.artifactRef)) {
      throw new Error("FinalHumanArtifact must retain the source assistive artifact ref.");
    }

    const finalArtifact: FinalHumanArtifact = {
      finalArtifactId:
        command.finalArtifactId ??
        `final-human-artifact:${stableAssistiveFeedbackHash({
          assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
          contentRef: command.contentRef,
          authoritativeWorkflowSettlementRef: command.authoritativeWorkflowSettlementRef,
        })}`,
      taskRef: command.taskRef,
      assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
      assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
      artifactType: command.artifactType,
      contentRef: command.contentRef,
      artifactHash: command.artifactHash,
      approvedByRefs: [...command.approvedByRefs],
      approvalEventRefs: [...command.approvalEventRefs],
      approvedAt: command.approvedAt,
      approvalMode: command.approvalMode,
      approvalGateAssessmentRef: command.approvalGateAssessmentRef,
      sourceAssistiveRefs: [...command.sourceAssistiveRefs],
      artifactPresentationContractRef: command.artifactPresentationContractRef,
      authoritativeWorkflowSettlementRef: command.authoritativeWorkflowSettlementRef,
      taskCompletionSettlementEnvelopeRef: command.taskCompletionSettlementEnvelopeRef,
      reviewVersionRef: command.reviewVersionRef,
      decisionEpochRef: command.decisionEpochRef,
      selectedAnchorRef: command.selectedAnchorRef,
      workflowSettlementState: command.workflowSettlementState,
      settledAt: this.runtime.clock.now(),
    };

    this.runtime.store.finalHumanArtifacts.set(finalArtifact.finalArtifactId, finalArtifact);
    this.runtime.store.approvalAssessments.set(assessment.approvalGateAssessmentId, {
      ...assessment,
      finalHumanArtifactRef: finalArtifact.finalArtifactId,
      assessmentState: "settled",
    });
    const updatedChain: AssistiveFeedbackChain = {
      ...chain,
      currentFinalHumanArtifactRef: finalArtifact.finalArtifactId,
      chainState: "settled_clean",
      settledAt: finalArtifact.settledAt,
    };
    this.runtime.store.chains.set(updatedChain.assistiveFeedbackChainId, updatedChain);
    recordAudit(
      this.runtime,
      "FinalHumanArtifactBinder",
      "bindFinalHumanArtifact",
      actor,
      finalArtifact.finalArtifactId,
      "accepted",
      [
        ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.final_human_artifact_requires_authoritative_settlement,
        ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.assistive_acceptance_is_not_workflow_settlement,
      ],
    );
    return finalArtifact;
  }
}

export class AssistiveFeedbackChainSupersessionService {
  public constructor(private readonly runtime: AssistiveFeedbackRuntime) {}

  public supersedeChain(
    command: SupersedeFeedbackChainCommand,
    actor: AssistiveFeedbackActorContext,
  ): {
    supersededChain: AssistiveFeedbackChain;
    replacementChain?: AssistiveFeedbackChain;
  } {
    const chain = requireChain(this.runtime, command.currentFeedbackChainRef);
    const reasonMarker =
      command.supersessionReason === "artifact_hash_drift"
        ? ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.artifact_hash_drift_supersedes_feedback_chain
        : ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.regenerate_supersedes_feedback_chain;
    const replacementChain =
      command.replacementArtifactRef &&
      command.replacementArtifactRevisionRef &&
      command.replacementArtifactHash
        ? this.createReplacementChain(command, chain, actor)
        : undefined;
    const supersededChain: AssistiveFeedbackChain = {
      ...chain,
      chainState: "superseded",
      supersededByFeedbackChainRef: replacementChain?.assistiveFeedbackChainId,
      revokedAt: this.runtime.clock.now(),
    };
    this.runtime.store.chains.set(supersededChain.assistiveFeedbackChainId, supersededChain);
    if (
      this.runtime.store.currentChainByTupleHash.get(chain.chainTupleHash) ===
      chain.assistiveFeedbackChainId
    ) {
      this.runtime.store.currentChainByTupleHash.delete(chain.chainTupleHash);
    }
    recordAudit(
      this.runtime,
      "AssistiveFeedbackChainSupersessionService",
      "supersedeChain",
      actor,
      chain.assistiveFeedbackChainId,
      "accepted",
      [reasonMarker],
    );
    return { supersededChain, replacementChain };
  }

  private createReplacementChain(
    command: SupersedeFeedbackChainCommand,
    chain: AssistiveFeedbackChain,
    actor: AssistiveFeedbackActorContext,
  ): AssistiveFeedbackChain {
    const service = new AssistiveFeedbackChainService(this.runtime);
    return service.openFeedbackChain(
      {
        assistiveSessionRef: chain.assistiveSessionRef,
        assistiveCapabilityTrustEnvelopeRef: chain.assistiveCapabilityTrustEnvelopeRef,
        artifactRef: command.replacementArtifactRef ?? chain.artifactRef,
        artifactRevisionRef: command.replacementArtifactRevisionRef ?? chain.artifactRevisionRef,
        artifactHash: command.replacementArtifactHash ?? chain.artifactHash,
        capabilityCode: chain.capabilityCode,
        taskRef: chain.taskRef,
        routeIntentBindingRef: chain.routeIntentBindingRef,
        selectedAnchorRef: chain.selectedAnchorRef,
        reviewVersionRef: chain.reviewVersionRef,
        decisionEpochRef: chain.decisionEpochRef,
        policyBundleRef: chain.policyBundleRef,
        lineageFenceEpoch: chain.lineageFenceEpoch,
        supersedesFeedbackChainRef: chain.assistiveFeedbackChainId,
        idempotencyKey: command.replacementIdempotencyKey,
      },
      actor,
    );
  }
}

export function createAssistiveFeedbackChainPlane(
  options: {
    clock?: AssistiveFeedbackClock;
    idGenerator?: AssistiveFeedbackIdGenerator;
    store?: AssistiveFeedbackChainStore;
  } = {},
) {
  const runtime: AssistiveFeedbackRuntime = {
    store: options.store ?? createAssistiveFeedbackChainStore(),
    clock: options.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options.idGenerator ?? createSequentialIdGenerator(),
  };
  return {
    runtime,
    feedbackChains: new AssistiveFeedbackChainService(runtime),
    actionGestureIdempotency: new ActionGestureIdempotencyGuard(runtime),
    actionLedger: new AssistiveArtifactActionLedger(runtime),
    overrideRecords: new OverrideRecordService(runtime),
    approvalGates: new HumanApprovalGateEngine(runtime),
    distinctApprovers: new DistinctApproverPolicyGuard(runtime),
    finalHumanArtifacts: new FinalHumanArtifactBinder(runtime),
    supersession: new AssistiveFeedbackChainSupersessionService(runtime),
  };
}

export function createAssistiveFeedbackChainStore(): AssistiveFeedbackChainStore {
  return {
    chains: new Map(),
    actions: new Map(),
    overrides: new Map(),
    approvalAssessments: new Map(),
    finalHumanArtifacts: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
    actionGestureKeys: new Map(),
    currentChainByTupleHash: new Map(),
  };
}

export function stableAssistiveFeedbackHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 32);
}

function createSequentialIdGenerator(): AssistiveFeedbackIdGenerator {
  let counter = 0;
  return {
    next(prefix: string): string {
      counter += 1;
      return `${prefix}:${counter.toString().padStart(6, "0")}`;
    },
  };
}

function withIdempotency<T extends object>(
  runtime: AssistiveFeedbackRuntime,
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
  runtime: AssistiveFeedbackRuntime,
  serviceName: string,
  action: string,
  actor: AssistiveFeedbackActorContext,
  subjectRef: string,
  outcome: AssistiveFeedbackAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("assistive-feedback-audit"),
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

function requireChain(
  runtime: AssistiveFeedbackRuntime,
  assistiveFeedbackChainId: string,
): AssistiveFeedbackChain {
  const chain = runtime.store.chains.get(assistiveFeedbackChainId);
  if (!chain) {
    throw new Error(`AssistiveFeedbackChain not found: ${assistiveFeedbackChainId}`);
  }
  return chain;
}

function requireAction(
  runtime: AssistiveFeedbackRuntime,
  actionRecordId: string,
): AssistiveArtifactActionRecord {
  const action = runtime.store.actions.get(actionRecordId);
  if (!action) {
    throw new Error(`AssistiveArtifactActionRecord not found: ${actionRecordId}`);
  }
  return action;
}

function requireApprovalAssessment(
  runtime: AssistiveFeedbackRuntime,
  approvalGateAssessmentId: string,
): HumanApprovalGateAssessment {
  const assessment = runtime.store.approvalAssessments.get(approvalGateAssessmentId);
  if (!assessment) {
    throw new Error(`HumanApprovalGateAssessment not found: ${approvalGateAssessmentId}`);
  }
  return assessment;
}

function feedbackChainTupleHash(command: {
  assistiveSessionRef: string;
  artifactRef: string;
  artifactRevisionRef: string;
  artifactHash: string;
  capabilityCode: string;
  taskRef: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
}): string {
  return stableAssistiveFeedbackHash({
    assistiveSessionRef: command.assistiveSessionRef,
    artifactRef: command.artifactRef,
    artifactRevisionRef: command.artifactRevisionRef,
    artifactHash: command.artifactHash,
    capabilityCode: command.capabilityCode,
    taskRef: command.taskRef,
    selectedAnchorRef: command.selectedAnchorRef,
    reviewVersionRef: command.reviewVersionRef,
    decisionEpochRef: command.decisionEpochRef,
    policyBundleRef: command.policyBundleRef,
    lineageFenceEpoch: command.lineageFenceEpoch,
  });
}

function isTerminalChainState(chainState: AssistiveFeedbackChainState): boolean {
  return chainState === "superseded" || chainState === "revoked" || chainState === "excluded";
}

function assertChainWritable(chain: AssistiveFeedbackChain): void {
  if (chain.chainState === "superseded" || chain.chainState === "revoked") {
    throw new Error(`AssistiveFeedbackChain is not writable in state ${chain.chainState}.`);
  }
}

function assertActionMatchesChain(
  command: {
    assistiveFeedbackChainRef: string;
    assistiveCapabilityTrustEnvelopeRef: string;
    artifactRef: string;
    artifactHash: string;
    selectedAnchorRef: string;
    reviewVersionRef: string;
    decisionEpochRef: string;
    routeIntentBindingRef: string;
  },
  chain: AssistiveFeedbackChain,
): void {
  const mismatches: string[] = [];
  if (command.assistiveFeedbackChainRef !== chain.assistiveFeedbackChainId) {
    mismatches.push("assistiveFeedbackChainRef");
  }
  if (command.assistiveCapabilityTrustEnvelopeRef !== chain.assistiveCapabilityTrustEnvelopeRef) {
    mismatches.push("assistiveCapabilityTrustEnvelopeRef");
  }
  if (command.artifactRef !== chain.artifactRef) {
    mismatches.push("artifactRef");
  }
  if (command.artifactHash !== chain.artifactHash) {
    mismatches.push("artifactHash");
  }
  if (command.selectedAnchorRef !== chain.selectedAnchorRef) {
    mismatches.push("selectedAnchorRef");
  }
  if (command.reviewVersionRef !== chain.reviewVersionRef) {
    mismatches.push("reviewVersionRef");
  }
  if (command.decisionEpochRef !== chain.decisionEpochRef) {
    mismatches.push("decisionEpochRef");
  }
  if (command.routeIntentBindingRef !== chain.routeIntentBindingRef) {
    mismatches.push("routeIntentBindingRef");
  }
  if (mismatches.length > 0) {
    throw new Error(`Action does not match AssistiveFeedbackChain: ${mismatches.join(", ")}`);
  }
}

function appendActionToChain(
  chain: AssistiveFeedbackChain,
  action: AssistiveArtifactActionRecord,
  now: ISODateString,
): AssistiveFeedbackChain {
  const chainState =
    action.actionType === "dismiss_suggestion" || action.actionType === "acknowledge_abstain"
      ? "excluded"
      : chain.chainState;
  return {
    ...chain,
    actionRecordRefs: unique([...chain.actionRecordRefs, action.actionRecordId]),
    latestActionRecordRef: action.actionRecordId,
    chainState,
    revokedAt: chainState === "excluded" ? now : chain.revokedAt,
  };
}

function requiresOverrideReason(command: CaptureOverrideRecordCommand): boolean {
  const materialScope =
    command.overrideScope === "content_material" ||
    command.overrideScope === "policy_exception" ||
    command.overrideScope === "trust_recovery";
  const materialDisposition =
    command.overrideDisposition === "accepted_after_edit" ||
    command.overrideDisposition === "rejected_to_alternative" ||
    command.overrideDisposition === "abstained_by_human";
  const lowConfidenceAcceptance =
    command.overrideDisposition === "accepted_unchanged" &&
    ["suppressed", "insufficient", "guarded"].includes(command.displayConfidenceBand);
  const highHarm = command.expectedHarmAtDecision >= command.reasonPolicy.highHarmReasonThreshold;
  const lowTrust = command.trustScoreAtDecision < command.reasonPolicy.lowTrustReasonThreshold;
  const freshnessOrContinuityRisk =
    command.sessionFreshnessPenalty > 0 || command.continuityValidationState !== "trusted";
  return (
    materialScope ||
    materialDisposition ||
    lowConfidenceAcceptance ||
    highHarm ||
    lowTrust ||
    freshnessOrContinuityRisk
  );
}

function requiresDualReview(command: AssessHumanApprovalGateCommand): boolean {
  const consequenceBearing = command.externallyConsequential || command.irreversible;
  const highRisk = command.riskTier === "high" || command.riskTier === "critical";
  const highHarm = command.expectedHarmAtGate > command.approvalGatePolicy.thetaDualReview;
  const lowTrust = command.trustScoreAtGate < command.approvalGatePolicy.tauSingleReviewerGreen;
  return (
    consequenceBearing &&
    (highRisk ||
      highHarm ||
      lowTrust ||
      Boolean(command.policyExceptionOverride) ||
      Boolean(command.hardStopOverride))
  );
}

function approvalGateBlockingReasons(command: AssessHumanApprovalGateCommand): string[] {
  const reasons: string[] = [];
  if (!command.allFencesValid) {
    reasons.push("all_fences_valid_required");
  }
  if (command.sessionFreshnessPenalty !== 0) {
    reasons.push("session_freshness_penalty_must_be_zero");
  }
  if (command.continuityValidationState !== "trusted") {
    reasons.push("continuity_validation_trusted_required");
  }
  if (command.trustScoreAtGate < command.approvalGatePolicy.tauCommit) {
    reasons.push("trust_score_below_commit_threshold");
  }
  if (command.completionAdjacencyState !== "allowed") {
    reasons.push("completion_adjacency_allowed_required");
  }
  return reasons;
}

function approvalEligibilityState(
  blockingReasonCodes: readonly string[],
  requiredApproverCount: number,
  currentApproverCount: number,
): ApprovalEligibilityState {
  const onlyApproverBlocking = blockingReasonCodes.every(
    (reason) =>
      reason === ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.distinct_approver_required ||
      reason === ASSISTIVE_FEEDBACK_CHAIN_INVARIANT_MARKERS.model_output_generator_cannot_approve,
  );
  if (blockingReasonCodes.length > 0 && !onlyApproverBlocking) {
    return "blocked";
  }
  if (currentApproverCount >= requiredApproverCount) {
    return "ready_to_settle";
  }
  return requiredApproverCount === 2 ? "dual_review" : "single_review";
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
