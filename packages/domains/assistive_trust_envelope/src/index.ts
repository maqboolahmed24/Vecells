import { createHash } from "node:crypto";

export type ISODateString = string;

export type AssistiveTrustActorRole =
  | "assistive_surface_resolver"
  | "trust_envelope_projector"
  | "clinical_reviewer"
  | "clinical_safety_lead"
  | "release_manager"
  | "assistive_ops"
  | "system";

export type AudienceTier = "staff" | "patient" | "ops" | "governance";
export type AllowedShell = "staff_workspace" | "ops_console" | "governance_console";
export type BindingState = "live" | "observe_only" | "stale" | "blocked";
export type PublicationState = "published" | "stale" | "withdrawn" | "blocked";
export type RuntimePublicationState = "current" | "stale" | "withdrawn" | "blocked";
export type RolloutRung =
  | "shadow_only"
  | "visible_summary"
  | "visible_insert"
  | "visible_commit"
  | "frozen"
  | "withdrawn";
export type RenderPosture = "shadow_only" | "visible" | "observe_only" | "blocked";
export type GrantState =
  | "live"
  | "shadow_only"
  | "observe_only"
  | "blocked"
  | "expired"
  | "revoked";
export type KillState = "inactive" | "shadow_only" | "blocked" | "withdrawn";
export type RunSettlementState =
  | "renderable"
  | "shadow_only"
  | "observe_only"
  | "abstained"
  | "quarantined"
  | "blocked_by_policy";
export type TrustState = "trusted" | "degraded" | "quarantined" | "shadow_only" | "frozen";
export type ContinuityState = "current" | "stale" | "drifted" | "blocked" | "unknown";
export type SurfacePostureState =
  | "interactive"
  | "observe_only"
  | "provenance_only"
  | "placeholder_only"
  | "hidden";
export type ActionabilityState =
  | "enabled"
  | "regenerate_only"
  | "observe_only"
  | "blocked_by_policy"
  | "blocked";
export type ConfidencePostureState = "conservative_band" | "suppressed" | "hidden";
export type CompletionAdjacencyState = "allowed" | "observe_only" | "blocked";
export type PresentationMode =
  | "summary_stub"
  | "inline_side_stage"
  | "bounded_drawer"
  | "control_workbench";
export type ProvenanceDisclosureMode =
  | "compact_footer"
  | "details_panel"
  | "internal_only"
  | "hidden";
export type ConfidenceDisclosureMode =
  | "conservative_band"
  | "suppressed"
  | "internal_diagnostics_only"
  | "hidden";
export type ExpansionRule =
  | "explicit_user_request"
  | "current_review_subject_only"
  | "never_auto_expand";
export type ReducedMotionMode = "respect_user_setting" | "static_only";
export type DominanceGuard = "companion_only" | "current_review_subject";
export type DisclosureLevel = "minimal" | "standard" | "internal";
export type FreshnessState = "fresh" | "stale" | "unknown";
export type ConfidenceDisplayBand = "suppressed" | "insufficient" | "guarded" | "supported";
export type EpistemicUncertaintyBand = "low" | "medium" | "high" | "unknown";
export type ExpectedHarmBand = "low" | "medium" | "high" | "critical" | "unknown";
export type FreezeReasonCode =
  | "publication_drift"
  | "runtime_publication_drift"
  | "selected_anchor_drift"
  | "route_family_drift"
  | "entity_continuity_drift"
  | "trust_projection_missing"
  | "rollout_verdict_missing"
  | "watch_tuple_missing"
  | "kill_switch_active"
  | "release_freeze"
  | "continuity_drift"
  | "workspace_trust_drift";
export type FreezeDisposition =
  | "read_only_provenance"
  | "placeholder_only"
  | "shadow_only"
  | "hidden";
export type RecoveryAction =
  | "regenerate_in_place"
  | "governed_recovery"
  | "contact_assistive_ops"
  | "wait_for_publication";

export const TRUST_ENVELOPE_INVARIANT_MARKERS = {
  missing_trust_projection_fail_closed: "missing_trust_projection_fail_closed",
  missing_rollout_verdict_fail_closed: "missing_rollout_verdict_fail_closed",
  missing_watch_tuple_fail_closed: "missing_watch_tuple_fail_closed",
  missing_freeze_record_fail_closed: "missing_freeze_record_fail_closed",
  publication_drift_freeze_frame_required: "publication_drift_freeze_frame_required",
  runtime_publication_drift_freeze_frame_required:
    "runtime_publication_drift_freeze_frame_required",
  selected_anchor_drift_freeze_frame_required: "selected_anchor_drift_freeze_frame_required",
  confidence_suppressed_by_trust_posture: "confidence_suppressed_by_trust_posture",
  same_shell_recovery_required: "same_shell_recovery_required",
  browser_client_actionability_recompute_forbidden:
    "browser_client_actionability_recompute_forbidden",
} as const;

export interface AssistiveTrustActorContext {
  actorRef: string;
  actorRole: AssistiveTrustActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface AssistiveTrustEnvelopeAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: AssistiveTrustActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface AssistiveSurfaceBinding {
  assistiveSurfaceBindingId: string;
  capabilityCode: string;
  artifactRef: string;
  entityContinuityKey: string;
  routeFamily: string;
  allowedShell: AllowedShell;
  audienceTier: AudienceTier;
  visibilityPolicyRef: string;
  rolloutVerdictRef: string;
  rolloutRung: RolloutRung;
  renderPosture: RenderPosture;
  consistencyProjectionRef: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  workspaceTrustEnvelopeRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  selectedAnchorRequirement: string;
  decisionDockMode: "none" | "companion" | "decision_dock_bound";
  placeholderContractRef: string;
  publicationState: PublicationState;
  runtimePublicationState: RuntimePublicationState;
  bindingState: BindingState;
  bindingHash: string;
  createdAt: ISODateString;
}

export interface AssistivePresentationContract {
  assistivePresentationContractId: string;
  capabilityCode: string;
  presentationMode: PresentationMode;
  minWidthPx: number;
  maxWidthPx: number;
  provenanceDisclosureMode: ProvenanceDisclosureMode;
  confidenceDisclosureMode: ConfidenceDisclosureMode;
  expansionRule: ExpansionRule;
  reducedMotionMode: ReducedMotionMode;
  dominanceGuard: DominanceGuard;
  primaryActionLimit: number;
  rawScoreVisible: false;
  contractVersionRef: string;
  createdAt: ISODateString;
}

export interface AssistiveProvenanceEnvelope {
  assistiveProvenanceEnvelopeId: string;
  artifactRef: string;
  capabilityCode: string;
  inputEvidenceSnapshotRef: string;
  inputEvidenceSnapshotHash: string;
  captureBundleRef: string;
  derivationPackageRefs: readonly string[];
  summaryParityRef: string;
  evidenceMapSetRef: string;
  modelVersionRef: string;
  promptVersionRef: string;
  outputSchemaVersionRef: string;
  calibrationBundleRef: string;
  policyBundleRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  freshnessState: FreshnessState;
  trustState: TrustState;
  continuityState: ContinuityState;
  maskingPolicyRef: string;
  disclosureLevel: DisclosureLevel;
  provenanceHash: string;
  createdAt: ISODateString;
}

export interface AssistiveConfidenceDigest {
  assistiveConfidenceDigestId: string;
  artifactRef: string;
  capabilityCode: string;
  displayBand: ConfidenceDisplayBand;
  reasonCodes: readonly string[];
  supportProbabilityRef: string;
  evidenceCoverage: number;
  epistemicUncertainty: EpistemicUncertaintyBand;
  expectedHarmBand: ExpectedHarmBand;
  calibrationVersionRef: string;
  displayMode: ConfidenceDisclosureMode;
  confidencePostureState: ConfidencePostureState;
  visibleConfidenceAllowed: boolean;
  createdAt: ISODateString;
}

export interface AssistiveFreezeFrame {
  assistiveFreezeFrameId: string;
  artifactRef: string;
  capabilityCode: string;
  freezeReasonCode: FreezeReasonCode;
  freezeDisposition: FreezeDisposition;
  retainedVisibleTextRef?: string;
  retainedEvidenceAnchorRefs: readonly string[];
  retainedProvenanceEnvelopeRef?: string;
  suppressWriteAffordances: true;
  suppressedAffordances: readonly string[];
  recoveryAction: RecoveryAction;
  sameShellRouteFamily: string;
  sameShellSelectedAnchorRef: string;
  entityContinuityKey: string;
  releaseRecoveryDispositionRef: string;
  freezeHash: string;
  frozenAt: ISODateString;
}

export interface AssistiveCapabilityTrustEnvelope {
  assistiveCapabilityTrustEnvelopeId: string;
  artifactRef: string;
  capabilityCode: string;
  surfaceBindingRef: string;
  invocationGrantRef: string;
  runSettlementRef: string;
  visibilityPolicyRef: string;
  assistiveCapabilityWatchTupleRef?: string;
  trustProjectionRef?: string;
  rolloutVerdictRef?: string;
  provenanceEnvelopeRefs: readonly string[];
  confidenceDigestRefs: readonly string[];
  freezeFrameRef?: string;
  killSwitchStateRef: string;
  releaseFreezeRecordRef?: string;
  releaseRecoveryDispositionRef: string;
  consistencyProjectionRef: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  workspaceTrustEnvelopeRef: string;
  selectedAnchorRef: string;
  observedSelectedAnchorRef?: string;
  entityContinuityKey: string;
  observedEntityContinuityKey?: string;
  routeFamily: string;
  observedRouteFamily?: string;
  policyBundleRef: string;
  trustState: TrustState;
  surfacePostureState: SurfacePostureState;
  actionabilityState: ActionabilityState;
  confidencePostureState: ConfidencePostureState;
  completionAdjacencyState: CompletionAdjacencyState;
  blockingReasonRefs: readonly string[];
  sameShellRecoveryRequired: boolean;
  browserClientActionabilityRecomputeForbidden: true;
  envelopeHash: string;
  computedAt: ISODateString;
}

export interface AssistiveInvocationGrantProjection {
  assistiveInvocationGrantId: string;
  capabilityCode: string;
  routeFamily: string;
  entityContinuityKey: string;
  selectedAnchorRef?: string;
  rolloutVerdictRef?: string;
  rolloutRung?: RolloutRung;
  renderPosture: RenderPosture;
  grantState: GrantState;
  compiledPolicyBundleRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
}

export interface AssistiveRunSettlementProjection {
  assistiveRunSettlementId: string;
  assistiveInvocationGrantRef: string;
  settlementState: RunSettlementState;
  renderableArtifactRefs: readonly string[];
  blockedArtifactRefs: readonly string[];
  policyBundleRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
}

export interface MaterializedKillSwitchProjection {
  killSwitchStateId: string;
  killState: KillState;
  fallbackMode?: "shadow_only" | "observe_only" | "blocked" | "recovery_only";
  reasonCode: string;
}

export interface AssistiveTrustEnvelopeStore {
  surfaceBindings: Map<string, AssistiveSurfaceBinding>;
  presentationContracts: Map<string, AssistivePresentationContract>;
  provenanceEnvelopes: Map<string, AssistiveProvenanceEnvelope>;
  confidenceDigests: Map<string, AssistiveConfidenceDigest>;
  freezeFrames: Map<string, AssistiveFreezeFrame>;
  trustEnvelopes: Map<string, AssistiveCapabilityTrustEnvelope>;
  auditRecords: AssistiveTrustEnvelopeAuditRecord[];
  idempotencyKeys: Map<string, string>;
}

export interface AssistiveTrustEnvelopeClock {
  now(): ISODateString;
}

export interface AssistiveTrustEnvelopeIdGenerator {
  next(prefix: string): string;
}

export interface AssistiveTrustEnvelopeRuntime {
  store: AssistiveTrustEnvelopeStore;
  clock: AssistiveTrustEnvelopeClock;
  idGenerator: AssistiveTrustEnvelopeIdGenerator;
}

export interface ResolveSurfaceBindingCommand {
  assistiveSurfaceBindingId?: string;
  capabilityCode: string;
  artifactRef: string;
  entityContinuityKey: string;
  routeFamily: string;
  allowedShell: AllowedShell;
  audienceTier: AudienceTier;
  visibilityPolicyRef: string;
  rolloutVerdictRef: string;
  rolloutRung: RolloutRung;
  renderPosture?: RenderPosture;
  consistencyProjectionRef: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  workspaceTrustEnvelopeRef: string;
  assistiveCapabilityTrustEnvelopeRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  selectedAnchorRequirement: string;
  decisionDockMode?: AssistiveSurfaceBinding["decisionDockMode"];
  placeholderContractRef: string;
  publicationState?: PublicationState;
  runtimePublicationState?: RuntimePublicationState;
  idempotencyKey?: string;
}

export interface RegisterPresentationContractCommand {
  assistivePresentationContractId?: string;
  capabilityCode: string;
  presentationMode?: PresentationMode;
  minWidthPx?: number;
  maxWidthPx?: number;
  provenanceDisclosureMode?: ProvenanceDisclosureMode;
  confidenceDisclosureMode?: ConfidenceDisclosureMode;
  expansionRule?: ExpansionRule;
  reducedMotionMode?: ReducedMotionMode;
  dominanceGuard?: DominanceGuard;
  primaryActionLimit?: number;
  rawScoreVisible?: boolean;
  contractVersionRef: string;
  idempotencyKey?: string;
}

export interface CreateProvenanceEnvelopeCommand {
  assistiveProvenanceEnvelopeId?: string;
  artifactRef: string;
  capabilityCode: string;
  inputEvidenceSnapshotRef: string;
  inputEvidenceSnapshotHash: string;
  captureBundleRef: string;
  derivationPackageRefs: readonly string[];
  summaryParityRef: string;
  evidenceMapSetRef: string;
  modelVersionRef: string;
  promptVersionRef: string;
  outputSchemaVersionRef: string;
  calibrationBundleRef: string;
  policyBundleRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  freshnessState?: FreshnessState;
  trustState?: TrustState;
  continuityState?: ContinuityState;
  maskingPolicyRef: string;
  disclosureLevel?: DisclosureLevel;
  idempotencyKey?: string;
}

export interface CreateConfidenceDigestCommand {
  assistiveConfidenceDigestId?: string;
  artifactRef: string;
  capabilityCode: string;
  supportProbabilityRef: string;
  evidenceCoverage: number;
  epistemicUncertainty: EpistemicUncertaintyBand;
  expectedHarmBand: ExpectedHarmBand;
  calibrationVersionRef?: string;
  trustState: TrustState;
  publicationState: PublicationState;
  runtimePublicationState: RuntimePublicationState;
  continuityState: ContinuityState;
  requestedDisplayBand?: Exclude<ConfidenceDisplayBand, "suppressed">;
  idempotencyKey?: string;
}

export interface MaterializeFreezeFrameCommand {
  assistiveFreezeFrameId?: string;
  artifactRef: string;
  capabilityCode: string;
  freezeReasonCode: FreezeReasonCode;
  freezeDisposition?: FreezeDisposition;
  retainedVisibleTextRef?: string;
  retainedEvidenceAnchorRefs?: readonly string[];
  retainedProvenanceEnvelopeRef?: string;
  recoveryAction?: RecoveryAction;
  sameShellRouteFamily: string;
  sameShellSelectedAnchorRef: string;
  entityContinuityKey: string;
  releaseRecoveryDispositionRef: string;
  idempotencyKey?: string;
}

export interface ResolveAssistiveSurfacePostureCommand {
  binding: AssistiveSurfaceBinding;
  invocationGrant?: AssistiveInvocationGrantProjection;
  runSettlement?: AssistiveRunSettlementProjection;
  killSwitchState?: MaterializedKillSwitchProjection;
  trustState?: TrustState;
  trustProjectionRef?: string;
  rolloutVerdictRef?: string;
  assistiveCapabilityWatchTupleRef?: string;
  releaseFreezeRecordRef?: string;
  freezeFrame?: AssistiveFreezeFrame;
  freezeRecordResolved?: boolean;
  publicationState?: PublicationState;
  runtimePublicationState?: RuntimePublicationState;
  continuityState?: ContinuityState;
  selectedAnchorRef?: string;
  routeFamily?: string;
  entityContinuityKey?: string;
}

export interface AssistiveSurfacePostureDecision {
  trustState: TrustState;
  surfacePostureState: SurfacePostureState;
  actionabilityState: ActionabilityState;
  confidencePostureState: ConfidencePostureState;
  completionAdjacencyState: CompletionAdjacencyState;
  blockingReasonRefs: readonly string[];
  freezeFrameRequired: boolean;
  sameShellRecoveryRequired: boolean;
}

export interface ProjectTrustEnvelopeCommand {
  assistiveCapabilityTrustEnvelopeId?: string;
  artifactRef: string;
  capabilityCode: string;
  surfaceBindingRef: string;
  invocationGrant: AssistiveInvocationGrantProjection;
  runSettlement: AssistiveRunSettlementProjection;
  killSwitchState: MaterializedKillSwitchProjection;
  provenanceEnvelopeRefs: readonly string[];
  confidenceDigestRefs: readonly string[];
  trustState?: TrustState;
  trustProjectionRef?: string;
  assistiveCapabilityWatchTupleRef?: string;
  rolloutVerdictRef?: string;
  releaseFreezeRecordRef?: string;
  freezeFrameRef?: string;
  freezeRecordResolved?: boolean;
  selectedAnchorRef?: string;
  routeFamily?: string;
  entityContinuityKey?: string;
  continuityState?: ContinuityState;
  policyBundleRef?: string;
  idempotencyKey?: string;
}

export class AssistiveSurfaceBindingResolver {
  public constructor(private readonly runtime: AssistiveTrustEnvelopeRuntime) {}

  public resolveSurfaceBinding(
    command: ResolveSurfaceBindingCommand,
    actor: AssistiveTrustActorContext,
  ): AssistiveSurfaceBinding {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.surfaceBindings,
      () => {
        if (
          command.audienceTier !== "staff" ||
          !command.routeFamily.includes("staff") ||
          command.allowedShell !== "staff_workspace"
        ) {
          this.audit("resolveSurfaceBinding", actor, command.artifactRef, "failed_closed", [
            "assistive_surface_staff_only",
          ]);
          throw new Error("AssistiveSurfaceBinding is staff-only for visible Phase 8 surfaces.");
        }

        requireNonEmpty(command.visibilityPolicyRef, "visibilityPolicyRef");
        requireNonEmpty(command.consistencyProjectionRef, "consistencyProjectionRef");
        requireNonEmpty(
          command.staffWorkspaceConsistencyProjectionRef,
          "staffWorkspaceConsistencyProjectionRef",
        );
        requireNonEmpty(
          command.workspaceSliceTrustProjectionRef,
          "workspaceSliceTrustProjectionRef",
        );
        requireNonEmpty(command.workspaceTrustEnvelopeRef, "workspaceTrustEnvelopeRef");
        requireNonEmpty(command.surfaceRouteContractRef, "surfaceRouteContractRef");
        requireNonEmpty(command.surfacePublicationRef, "surfacePublicationRef");
        requireNonEmpty(command.runtimePublicationBundleRef, "runtimePublicationBundleRef");
        requireNonEmpty(command.selectedAnchorRequirement, "selectedAnchorRequirement");

        const publicationState = command.publicationState ?? "published";
        const runtimePublicationState = command.runtimePublicationState ?? "current";
        const bindingState = resolveBindingState(
          publicationState,
          runtimePublicationState,
          command.rolloutRung,
        );
        const renderPosture =
          command.renderPosture ?? renderPostureForBinding(bindingState, command.rolloutRung);
        const bindingMaterial = {
          capabilityCode: command.capabilityCode,
          artifactRef: command.artifactRef,
          entityContinuityKey: command.entityContinuityKey,
          routeFamily: command.routeFamily,
          selectedAnchorRequirement: command.selectedAnchorRequirement,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
        };
        const assistiveSurfaceBindingId =
          command.assistiveSurfaceBindingId ??
          `assistive-surface-binding:${stableAssistiveTrustHash(bindingMaterial)}`;
        const binding: AssistiveSurfaceBinding = {
          assistiveSurfaceBindingId,
          capabilityCode: command.capabilityCode,
          artifactRef: command.artifactRef,
          entityContinuityKey: command.entityContinuityKey,
          routeFamily: command.routeFamily,
          allowedShell: command.allowedShell,
          audienceTier: command.audienceTier,
          visibilityPolicyRef: command.visibilityPolicyRef,
          rolloutVerdictRef: command.rolloutVerdictRef,
          rolloutRung: command.rolloutRung,
          renderPosture,
          consistencyProjectionRef: command.consistencyProjectionRef,
          staffWorkspaceConsistencyProjectionRef: command.staffWorkspaceConsistencyProjectionRef,
          workspaceSliceTrustProjectionRef: command.workspaceSliceTrustProjectionRef,
          workspaceTrustEnvelopeRef: command.workspaceTrustEnvelopeRef,
          assistiveCapabilityTrustEnvelopeRef:
            command.assistiveCapabilityTrustEnvelopeRef ??
            `assistive-capability-trust-envelope:pending:${stableAssistiveTrustHash(bindingMaterial)}`,
          surfaceRouteContractRef: command.surfaceRouteContractRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          selectedAnchorRequirement: command.selectedAnchorRequirement,
          decisionDockMode: command.decisionDockMode ?? "companion",
          placeholderContractRef: command.placeholderContractRef,
          publicationState,
          runtimePublicationState,
          bindingState,
          bindingHash: stableAssistiveTrustHash({
            ...bindingMaterial,
            bindingState,
            renderPosture,
          }),
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.surfaceBindings.set(binding.assistiveSurfaceBindingId, binding);
        this.audit(
          "resolveSurfaceBinding",
          actor,
          command.artifactRef,
          bindingState === "live" ? "accepted" : "failed_closed",
          [bindingState],
        );
        return binding;
      },
    );
  }

  public getSurfaceBinding(bindingId: string): AssistiveSurfaceBinding | undefined {
    return this.runtime.store.surfaceBindings.get(bindingId);
  }

  private audit(
    action: string,
    actor: AssistiveTrustActorContext,
    subjectRef: string,
    outcome: AssistiveTrustEnvelopeAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveSurfaceBindingResolver",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistivePresentationContractResolver {
  public constructor(private readonly runtime: AssistiveTrustEnvelopeRuntime) {}

  public registerPresentationContract(
    command: RegisterPresentationContractCommand,
    actor: AssistiveTrustActorContext,
  ): AssistivePresentationContract {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.presentationContracts,
      () => {
        const dominanceGuard = command.dominanceGuard ?? "companion_only";
        const primaryActionLimit = command.primaryActionLimit ?? 1;
        if (dominanceGuard !== "companion_only") {
          this.audit(
            "registerPresentationContract",
            actor,
            command.capabilityCode,
            "failed_closed",
            ["dominance_guard_must_remain_companion_only"],
          );
          throw new Error(
            "AssistivePresentationContract dominance guard must remain companion_only.",
          );
        }
        if (primaryActionLimit > 1 || command.rawScoreVisible === true) {
          this.audit(
            "registerPresentationContract",
            actor,
            command.capabilityCode,
            "failed_closed",
            ["presentation_overclaiming_blocked"],
          );
          throw new Error(
            "AssistivePresentationContract allows one dominant safe action and no raw score chip.",
          );
        }

        const contract: AssistivePresentationContract = {
          assistivePresentationContractId:
            command.assistivePresentationContractId ??
            `assistive-presentation-contract:${stableAssistiveTrustHash({
              capabilityCode: command.capabilityCode,
              contractVersionRef: command.contractVersionRef,
            })}`,
          capabilityCode: command.capabilityCode,
          presentationMode: command.presentationMode ?? "summary_stub",
          minWidthPx: command.minWidthPx ?? 280,
          maxWidthPx: command.maxWidthPx ?? 520,
          provenanceDisclosureMode: command.provenanceDisclosureMode ?? "compact_footer",
          confidenceDisclosureMode: command.confidenceDisclosureMode ?? "suppressed",
          expansionRule: command.expansionRule ?? "explicit_user_request",
          reducedMotionMode: command.reducedMotionMode ?? "respect_user_setting",
          dominanceGuard,
          primaryActionLimit,
          rawScoreVisible: false,
          contractVersionRef: command.contractVersionRef,
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.presentationContracts.set(
          contract.assistivePresentationContractId,
          contract,
        );
        this.audit("registerPresentationContract", actor, command.capabilityCode, "accepted", [
          contract.presentationMode,
          contract.dominanceGuard,
        ]);
        return contract;
      },
    );
  }

  private audit(
    action: string,
    actor: AssistiveTrustActorContext,
    subjectRef: string,
    outcome: AssistiveTrustEnvelopeAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistivePresentationContractResolver",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistiveProvenanceEnvelopeService {
  public constructor(private readonly runtime: AssistiveTrustEnvelopeRuntime) {}

  public createProvenanceEnvelope(
    command: CreateProvenanceEnvelopeCommand,
    actor: AssistiveTrustActorContext,
  ): AssistiveProvenanceEnvelope {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.provenanceEnvelopes,
      () => {
        if ((command as { rawEvidenceText?: string }).rawEvidenceText) {
          this.audit("createProvenanceEnvelope", actor, command.artifactRef, "failed_closed", [
            "raw_evidence_text_forbidden",
          ]);
          throw new Error(
            "AssistiveProvenanceEnvelope stores hashes and refs, not raw evidence text.",
          );
        }
        requireNonEmpty(command.inputEvidenceSnapshotHash, "inputEvidenceSnapshotHash");
        requireNonEmpty(command.inputEvidenceSnapshotRef, "inputEvidenceSnapshotRef");
        requireNonEmpty(command.modelVersionRef, "modelVersionRef");
        requireNonEmpty(command.promptVersionRef, "promptVersionRef");
        requireNonEmpty(command.outputSchemaVersionRef, "outputSchemaVersionRef");
        requireNonEmpty(command.policyBundleRef, "policyBundleRef");

        const provenanceHash = stableAssistiveTrustHash({
          artifactRef: command.artifactRef,
          inputEvidenceSnapshotHash: command.inputEvidenceSnapshotHash,
          derivationPackageRefs: command.derivationPackageRefs,
          modelVersionRef: command.modelVersionRef,
          promptVersionRef: command.promptVersionRef,
          outputSchemaVersionRef: command.outputSchemaVersionRef,
          policyBundleRef: command.policyBundleRef,
        });
        const envelope: AssistiveProvenanceEnvelope = {
          assistiveProvenanceEnvelopeId:
            command.assistiveProvenanceEnvelopeId ??
            `assistive-provenance-envelope:${provenanceHash}`,
          artifactRef: command.artifactRef,
          capabilityCode: command.capabilityCode,
          inputEvidenceSnapshotRef: command.inputEvidenceSnapshotRef,
          inputEvidenceSnapshotHash: command.inputEvidenceSnapshotHash,
          captureBundleRef: command.captureBundleRef,
          derivationPackageRefs: [...command.derivationPackageRefs],
          summaryParityRef: command.summaryParityRef,
          evidenceMapSetRef: command.evidenceMapSetRef,
          modelVersionRef: command.modelVersionRef,
          promptVersionRef: command.promptVersionRef,
          outputSchemaVersionRef: command.outputSchemaVersionRef,
          calibrationBundleRef: command.calibrationBundleRef,
          policyBundleRef: command.policyBundleRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          freshnessState: command.freshnessState ?? "fresh",
          trustState: command.trustState ?? "trusted",
          continuityState: command.continuityState ?? "current",
          maskingPolicyRef: command.maskingPolicyRef,
          disclosureLevel: command.disclosureLevel ?? "standard",
          provenanceHash,
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.provenanceEnvelopes.set(
          envelope.assistiveProvenanceEnvelopeId,
          envelope,
        );
        this.audit("createProvenanceEnvelope", actor, command.artifactRef, "accepted", [
          "provenance_hash_bound",
          envelope.freshnessState,
        ]);
        return envelope;
      },
    );
  }

  private audit(
    action: string,
    actor: AssistiveTrustActorContext,
    subjectRef: string,
    outcome: AssistiveTrustEnvelopeAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveProvenanceEnvelopeService",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistiveConfidenceDigestService {
  public constructor(private readonly runtime: AssistiveTrustEnvelopeRuntime) {}

  public createConfidenceDigest(
    command: CreateConfidenceDigestCommand,
    actor: AssistiveTrustActorContext,
  ): AssistiveConfidenceDigest {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.confidenceDigests,
      () => {
        if ((command as { rawScore?: number }).rawScore !== undefined) {
          this.audit("createConfidenceDigest", actor, command.artifactRef, "failed_closed", [
            "raw_confidence_score_forbidden",
          ]);
          throw new Error(
            "AssistiveConfidenceDigest may not expose raw confidence scores as live truth.",
          );
        }
        if (command.evidenceCoverage < 0 || command.evidenceCoverage > 1) {
          throw new Error("evidenceCoverage must be between 0 and 1.");
        }

        const reasonCodes = confidenceSuppressionReasons(command);
        const visibleConfidenceAllowed = reasonCodes.length === 0;
        const displayBand = visibleConfidenceAllowed
          ? resolveConservativeBand(command)
          : "suppressed";
        const confidencePostureState: ConfidencePostureState = visibleConfidenceAllowed
          ? "conservative_band"
          : "suppressed";
        const displayMode: ConfidenceDisclosureMode = visibleConfidenceAllowed
          ? "conservative_band"
          : "suppressed";
        const digest: AssistiveConfidenceDigest = {
          assistiveConfidenceDigestId:
            command.assistiveConfidenceDigestId ??
            `assistive-confidence-digest:${stableAssistiveTrustHash({
              artifactRef: command.artifactRef,
              supportProbabilityRef: command.supportProbabilityRef,
              calibrationVersionRef: command.calibrationVersionRef ?? "missing",
            })}`,
          artifactRef: command.artifactRef,
          capabilityCode: command.capabilityCode,
          displayBand,
          reasonCodes,
          supportProbabilityRef: command.supportProbabilityRef,
          evidenceCoverage: command.evidenceCoverage,
          epistemicUncertainty: command.epistemicUncertainty,
          expectedHarmBand: command.expectedHarmBand,
          calibrationVersionRef: command.calibrationVersionRef ?? "calibration:missing",
          displayMode,
          confidencePostureState,
          visibleConfidenceAllowed,
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.confidenceDigests.set(digest.assistiveConfidenceDigestId, digest);
        this.audit(
          "createConfidenceDigest",
          actor,
          command.artifactRef,
          visibleConfidenceAllowed ? "accepted" : "failed_closed",
          digest.reasonCodes,
        );
        return digest;
      },
    );
  }

  private audit(
    action: string,
    actor: AssistiveTrustActorContext,
    subjectRef: string,
    outcome: AssistiveTrustEnvelopeAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveConfidenceDigestService",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistiveFreezeFrameService {
  public constructor(private readonly runtime: AssistiveTrustEnvelopeRuntime) {}

  public materializeFreezeFrame(
    command: MaterializeFreezeFrameCommand,
    actor: AssistiveTrustActorContext,
  ): AssistiveFreezeFrame {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.freezeFrames,
      () => {
        const retainedEvidenceAnchorRefs = [...(command.retainedEvidenceAnchorRefs ?? [])];
        const freezeHash = stableAssistiveTrustHash({
          artifactRef: command.artifactRef,
          freezeReasonCode: command.freezeReasonCode,
          sameShellRouteFamily: command.sameShellRouteFamily,
          sameShellSelectedAnchorRef: command.sameShellSelectedAnchorRef,
          entityContinuityKey: command.entityContinuityKey,
          retainedEvidenceAnchorRefs,
        });
        const freezeFrame: AssistiveFreezeFrame = {
          assistiveFreezeFrameId:
            command.assistiveFreezeFrameId ?? `assistive-freeze-frame:${freezeHash}`,
          artifactRef: command.artifactRef,
          capabilityCode: command.capabilityCode,
          freezeReasonCode: command.freezeReasonCode,
          freezeDisposition: command.freezeDisposition ?? "read_only_provenance",
          retainedVisibleTextRef: command.retainedVisibleTextRef,
          retainedEvidenceAnchorRefs,
          retainedProvenanceEnvelopeRef: command.retainedProvenanceEnvelopeRef,
          suppressWriteAffordances: true,
          suppressedAffordances: [
            "accept",
            "insert",
            "regenerate",
            "export",
            "browser_handoff",
            "completion",
          ],
          recoveryAction: command.recoveryAction ?? "regenerate_in_place",
          sameShellRouteFamily: command.sameShellRouteFamily,
          sameShellSelectedAnchorRef: command.sameShellSelectedAnchorRef,
          entityContinuityKey: command.entityContinuityKey,
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          freezeHash,
          frozenAt: this.runtime.clock.now(),
        };
        this.runtime.store.freezeFrames.set(freezeFrame.assistiveFreezeFrameId, freezeFrame);
        this.audit("materializeFreezeFrame", actor, command.artifactRef, "failed_closed", [
          `${command.freezeReasonCode}_freeze_frame_required`,
          TRUST_ENVELOPE_INVARIANT_MARKERS.same_shell_recovery_required,
        ]);
        return freezeFrame;
      },
    );
  }

  private audit(
    action: string,
    actor: AssistiveTrustActorContext,
    subjectRef: string,
    outcome: AssistiveTrustEnvelopeAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveFreezeFrameService",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export class AssistiveSurfacePostureResolver {
  public resolvePosture(
    command: ResolveAssistiveSurfacePostureCommand,
  ): AssistiveSurfacePostureDecision {
    const reasonCodes: string[] = [];
    const publicationState = command.publicationState ?? command.binding.publicationState;
    const runtimePublicationState =
      command.runtimePublicationState ?? command.binding.runtimePublicationState;
    const continuityState = command.continuityState ?? "current";
    const trustState = command.trustState ?? "degraded";
    const selectedAnchorRef =
      command.selectedAnchorRef ?? command.binding.selectedAnchorRequirement;
    const routeFamily = command.routeFamily ?? command.binding.routeFamily;
    const entityContinuityKey = command.entityContinuityKey ?? command.binding.entityContinuityKey;
    let freezeFrameRequired = false;
    let sameShellRecoveryRequired = false;

    if (!command.assistiveCapabilityWatchTupleRef) {
      reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.missing_watch_tuple_fail_closed);
    }
    if (!command.trustProjectionRef) {
      reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.missing_trust_projection_fail_closed);
    }
    if (!command.rolloutVerdictRef && !command.binding.rolloutVerdictRef) {
      reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.missing_rollout_verdict_fail_closed);
    }
    if (command.freezeRecordResolved === false) {
      reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.missing_freeze_record_fail_closed);
    }
    if (!command.invocationGrant) {
      reasonCodes.push("invocation_grant_missing");
    } else if (
      !["live", "shadow_only", "observe_only"].includes(command.invocationGrant.grantState)
    ) {
      reasonCodes.push("invocation_grant_not_live");
    }
    if (!command.runSettlement) {
      reasonCodes.push("run_settlement_missing");
    } else if (command.runSettlement.settlementState !== "renderable") {
      reasonCodes.push(`run_settlement_${command.runSettlement.settlementState}`);
    }
    if (!command.killSwitchState) {
      reasonCodes.push("kill_switch_state_missing");
    } else if (command.killSwitchState.killState !== "inactive") {
      reasonCodes.push(
        command.killSwitchState.killState === "shadow_only"
          ? "kill_switch_shadow_only"
          : "assistive_kill_switch_active",
      );
    }
    if (publicationState !== "published") {
      freezeFrameRequired = true;
      sameShellRecoveryRequired = true;
      reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.publication_drift_freeze_frame_required);
    }
    if (runtimePublicationState !== "current") {
      freezeFrameRequired = true;
      sameShellRecoveryRequired = true;
      reasonCodes.push(
        TRUST_ENVELOPE_INVARIANT_MARKERS.runtime_publication_drift_freeze_frame_required,
      );
    }
    if (continuityState !== "current") {
      freezeFrameRequired = true;
      sameShellRecoveryRequired = true;
      reasonCodes.push("continuity_drift_freeze_frame_required");
    }
    if (selectedAnchorRef !== command.binding.selectedAnchorRequirement) {
      freezeFrameRequired = true;
      sameShellRecoveryRequired = true;
      reasonCodes.push(
        TRUST_ENVELOPE_INVARIANT_MARKERS.selected_anchor_drift_freeze_frame_required,
      );
    }
    if (routeFamily !== command.binding.routeFamily) {
      freezeFrameRequired = true;
      sameShellRecoveryRequired = true;
      reasonCodes.push("route_family_drift_freeze_frame_required");
    }
    if (entityContinuityKey !== command.binding.entityContinuityKey) {
      freezeFrameRequired = true;
      sameShellRecoveryRequired = true;
      reasonCodes.push("entity_continuity_drift_freeze_frame_required");
    }
    if (freezeFrameRequired && !command.freezeFrame) {
      reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.missing_freeze_record_fail_closed);
    }
    if (trustState !== "trusted") {
      reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.confidence_suppressed_by_trust_posture);
    }

    const uniqueReasons = unique(reasonCodes);
    const failClosed = uniqueReasons.length > 0 || command.binding.bindingState !== "live";
    if (
      !failClosed &&
      command.invocationGrant?.grantState === "live" &&
      command.runSettlement?.settlementState === "renderable"
    ) {
      return {
        trustState: "trusted",
        surfacePostureState: "interactive",
        actionabilityState: "enabled",
        confidencePostureState: "conservative_band",
        completionAdjacencyState: "allowed",
        blockingReasonRefs: [],
        freezeFrameRequired: false,
        sameShellRecoveryRequired: false,
      };
    }

    const conservativeTrustState = resolveConservativeTrustState(
      trustState,
      command.freezeFrame,
      command.runSettlement,
      command.invocationGrant,
    );
    return {
      trustState: conservativeTrustState,
      surfacePostureState: resolveSurfacePosture(
        conservativeTrustState,
        command.freezeFrame,
        command.invocationGrant,
        command.runSettlement,
        uniqueReasons,
      ),
      actionabilityState: resolveActionability(
        conservativeTrustState,
        command.freezeFrame,
        command.invocationGrant,
        uniqueReasons,
      ),
      confidencePostureState: conservativeTrustState === "shadow_only" ? "hidden" : "suppressed",
      completionAdjacencyState: conservativeTrustState === "shadow_only" ? "blocked" : "blocked",
      blockingReasonRefs: uniqueReasons.length > 0 ? uniqueReasons : ["binding_not_live"],
      freezeFrameRequired,
      sameShellRecoveryRequired,
    };
  }
}

export class AssistiveTrustEnvelopeProjector {
  public constructor(
    private readonly runtime: AssistiveTrustEnvelopeRuntime,
    private readonly postureResolver: AssistiveSurfacePostureResolver = new AssistiveSurfacePostureResolver(),
  ) {}

  public projectTrustEnvelope(
    command: ProjectTrustEnvelopeCommand,
    actor: AssistiveTrustActorContext,
  ): AssistiveCapabilityTrustEnvelope {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.trustEnvelopes,
      () => {
        const binding = this.runtime.store.surfaceBindings.get(command.surfaceBindingRef);
        if (!binding) {
          this.audit("projectTrustEnvelope", actor, command.artifactRef, "failed_closed", [
            "surface_binding_missing",
          ]);
          throw new Error(`AssistiveSurfaceBinding not found: ${command.surfaceBindingRef}`);
        }

        const freezeFrame = this.resolveOrMaterializeFreezeFrame(command, binding, actor);
        const posture = this.postureResolver.resolvePosture({
          binding,
          invocationGrant: command.invocationGrant,
          runSettlement: command.runSettlement,
          killSwitchState: command.killSwitchState,
          trustState: command.trustState,
          trustProjectionRef: command.trustProjectionRef,
          rolloutVerdictRef: command.rolloutVerdictRef,
          assistiveCapabilityWatchTupleRef: command.assistiveCapabilityWatchTupleRef,
          releaseFreezeRecordRef: command.releaseFreezeRecordRef,
          freezeFrame,
          freezeRecordResolved: command.freezeRecordResolved,
          publicationState: binding.publicationState,
          runtimePublicationState: binding.runtimePublicationState,
          continuityState: command.continuityState,
          selectedAnchorRef: command.selectedAnchorRef,
          routeFamily: command.routeFamily,
          entityContinuityKey: command.entityContinuityKey,
        });
        const blockingReasonRefs = enforceConfidenceSuppressionFromDigests(
          posture,
          command.confidenceDigestRefs,
          this.runtime.store.confidenceDigests,
        );
        const envelopeHashMaterial = {
          artifactRef: command.artifactRef,
          surfaceBindingRef: command.surfaceBindingRef,
          invocationGrantRef: command.invocationGrant.assistiveInvocationGrantId,
          runSettlementRef: command.runSettlement.assistiveRunSettlementId,
          trustProjectionRef: command.trustProjectionRef ?? "missing",
          rolloutVerdictRef: command.rolloutVerdictRef ?? binding.rolloutVerdictRef,
          freezeFrameRef: freezeFrame?.assistiveFreezeFrameId ?? "none",
          posture,
          blockingReasonRefs,
        };
        const envelopeHash = stableAssistiveTrustHash(envelopeHashMaterial);
        const envelope: AssistiveCapabilityTrustEnvelope = {
          assistiveCapabilityTrustEnvelopeId:
            command.assistiveCapabilityTrustEnvelopeId ??
            `assistive-capability-trust-envelope:${envelopeHash}`,
          artifactRef: command.artifactRef,
          capabilityCode: command.capabilityCode,
          surfaceBindingRef: binding.assistiveSurfaceBindingId,
          invocationGrantRef: command.invocationGrant.assistiveInvocationGrantId,
          runSettlementRef: command.runSettlement.assistiveRunSettlementId,
          visibilityPolicyRef: binding.visibilityPolicyRef,
          assistiveCapabilityWatchTupleRef: command.assistiveCapabilityWatchTupleRef,
          trustProjectionRef: command.trustProjectionRef,
          rolloutVerdictRef: command.rolloutVerdictRef ?? binding.rolloutVerdictRef,
          provenanceEnvelopeRefs: [...command.provenanceEnvelopeRefs],
          confidenceDigestRefs: [...command.confidenceDigestRefs],
          freezeFrameRef: freezeFrame?.assistiveFreezeFrameId,
          killSwitchStateRef: command.killSwitchState.killSwitchStateId,
          releaseFreezeRecordRef: command.releaseFreezeRecordRef,
          releaseRecoveryDispositionRef: binding.releaseRecoveryDispositionRef,
          consistencyProjectionRef: binding.consistencyProjectionRef,
          staffWorkspaceConsistencyProjectionRef: binding.staffWorkspaceConsistencyProjectionRef,
          workspaceSliceTrustProjectionRef: binding.workspaceSliceTrustProjectionRef,
          workspaceTrustEnvelopeRef: binding.workspaceTrustEnvelopeRef,
          selectedAnchorRef: binding.selectedAnchorRequirement,
          observedSelectedAnchorRef: command.selectedAnchorRef,
          entityContinuityKey: binding.entityContinuityKey,
          observedEntityContinuityKey: command.entityContinuityKey,
          routeFamily: binding.routeFamily,
          observedRouteFamily: command.routeFamily,
          policyBundleRef:
            command.policyBundleRef ?? command.invocationGrant.compiledPolicyBundleRef,
          trustState: posture.trustState,
          surfacePostureState: posture.surfacePostureState,
          actionabilityState: posture.actionabilityState,
          confidencePostureState: blockingReasonRefs.includes(
            TRUST_ENVELOPE_INVARIANT_MARKERS.confidence_suppressed_by_trust_posture,
          )
            ? "suppressed"
            : posture.confidencePostureState,
          completionAdjacencyState: posture.completionAdjacencyState,
          blockingReasonRefs,
          sameShellRecoveryRequired:
            posture.sameShellRecoveryRequired ||
            blockingReasonRefs.includes(
              TRUST_ENVELOPE_INVARIANT_MARKERS.same_shell_recovery_required,
            ),
          browserClientActionabilityRecomputeForbidden: true,
          envelopeHash,
          computedAt: this.runtime.clock.now(),
        };
        this.runtime.store.trustEnvelopes.set(
          envelope.assistiveCapabilityTrustEnvelopeId,
          envelope,
        );
        this.audit(
          "projectTrustEnvelope",
          actor,
          command.artifactRef,
          envelope.surfacePostureState === "interactive" ? "accepted" : "failed_closed",
          envelope.blockingReasonRefs.length > 0 ? envelope.blockingReasonRefs : ["interactive"],
        );
        return envelope;
      },
    );
  }

  private resolveOrMaterializeFreezeFrame(
    command: ProjectTrustEnvelopeCommand,
    binding: AssistiveSurfaceBinding,
    actor: AssistiveTrustActorContext,
  ): AssistiveFreezeFrame | undefined {
    if (command.freezeFrameRef) {
      return this.runtime.store.freezeFrames.get(command.freezeFrameRef);
    }
    const reason = detectFreezeReason(command, binding);
    if (!reason) {
      return undefined;
    }
    const freezeFrames = new AssistiveFreezeFrameService(this.runtime);
    return freezeFrames.materializeFreezeFrame(
      {
        artifactRef: command.artifactRef,
        capabilityCode: command.capabilityCode,
        freezeReasonCode: reason,
        freezeDisposition: "read_only_provenance",
        retainedEvidenceAnchorRefs: command.provenanceEnvelopeRefs,
        retainedProvenanceEnvelopeRef: command.provenanceEnvelopeRefs[0],
        sameShellRouteFamily: binding.routeFamily,
        sameShellSelectedAnchorRef: binding.selectedAnchorRequirement,
        entityContinuityKey: binding.entityContinuityKey,
        releaseRecoveryDispositionRef: binding.releaseRecoveryDispositionRef,
      },
      actor,
    );
  }

  private audit(
    action: string,
    actor: AssistiveTrustActorContext,
    subjectRef: string,
    outcome: AssistiveTrustEnvelopeAuditRecord["outcome"],
    reasonCodes: readonly string[],
  ): void {
    recordAudit(
      this.runtime,
      "AssistiveTrustEnvelopeProjector",
      action,
      actor,
      subjectRef,
      outcome,
      reasonCodes,
    );
  }
}

export function createAssistiveTrustEnvelopeProjectionPlane(
  options: {
    clock?: AssistiveTrustEnvelopeClock;
    idGenerator?: AssistiveTrustEnvelopeIdGenerator;
    store?: AssistiveTrustEnvelopeStore;
  } = {},
) {
  const runtime: AssistiveTrustEnvelopeRuntime = {
    store: options.store ?? createAssistiveTrustEnvelopeStore(),
    clock: options.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options.idGenerator ?? createSequentialIdGenerator(),
  };
  const postureResolver = new AssistiveSurfacePostureResolver();
  return {
    runtime,
    surfaceBindings: new AssistiveSurfaceBindingResolver(runtime),
    presentationContracts: new AssistivePresentationContractResolver(runtime),
    provenanceEnvelopes: new AssistiveProvenanceEnvelopeService(runtime),
    confidenceDigests: new AssistiveConfidenceDigestService(runtime),
    freezeFrames: new AssistiveFreezeFrameService(runtime),
    surfacePostures: postureResolver,
    trustEnvelopes: new AssistiveTrustEnvelopeProjector(runtime, postureResolver),
  };
}

export function createAssistiveTrustEnvelopeStore(): AssistiveTrustEnvelopeStore {
  return {
    surfaceBindings: new Map(),
    presentationContracts: new Map(),
    provenanceEnvelopes: new Map(),
    confidenceDigests: new Map(),
    freezeFrames: new Map(),
    trustEnvelopes: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
  };
}

export function stableAssistiveTrustHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 32);
}

function createSequentialIdGenerator(): AssistiveTrustEnvelopeIdGenerator {
  let counter = 0;
  return {
    next(prefix: string): string {
      counter += 1;
      return `${prefix}:${counter.toString().padStart(6, "0")}`;
    },
  };
}

function withIdempotency<T extends object>(
  runtime: AssistiveTrustEnvelopeRuntime,
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
  runtime: AssistiveTrustEnvelopeRuntime,
  serviceName: string,
  action: string,
  actor: AssistiveTrustActorContext,
  subjectRef: string,
  outcome: AssistiveTrustEnvelopeAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("assistive-trust-audit"),
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

function resolveBindingState(
  publicationState: PublicationState,
  runtimePublicationState: RuntimePublicationState,
  rolloutRung: RolloutRung,
): BindingState {
  if (
    publicationState === "blocked" ||
    publicationState === "withdrawn" ||
    runtimePublicationState === "blocked" ||
    runtimePublicationState === "withdrawn"
  ) {
    return "blocked";
  }
  if (
    publicationState === "stale" ||
    runtimePublicationState === "stale" ||
    rolloutRung === "frozen" ||
    rolloutRung === "withdrawn"
  ) {
    return "stale";
  }
  if (rolloutRung === "shadow_only") {
    return "observe_only";
  }
  return "live";
}

function renderPostureForBinding(
  bindingState: BindingState,
  rolloutRung: RolloutRung,
): RenderPosture {
  if (bindingState === "blocked") {
    return "blocked";
  }
  if (bindingState === "stale") {
    return "observe_only";
  }
  if (bindingState === "observe_only" || rolloutRung === "shadow_only") {
    return "shadow_only";
  }
  return "visible";
}

function confidenceSuppressionReasons(command: CreateConfidenceDigestCommand): string[] {
  const reasons: string[] = [];
  if (!command.calibrationVersionRef) {
    reasons.push("calibration_missing");
  }
  if (command.trustState !== "trusted") {
    reasons.push(TRUST_ENVELOPE_INVARIANT_MARKERS.confidence_suppressed_by_trust_posture);
  }
  if (command.publicationState !== "published") {
    reasons.push("confidence_suppressed_by_publication_posture");
  }
  if (command.runtimePublicationState !== "current") {
    reasons.push("confidence_suppressed_by_runtime_publication_posture");
  }
  if (command.continuityState !== "current") {
    reasons.push("confidence_suppressed_by_continuity_posture");
  }
  if (command.epistemicUncertainty === "unknown" || command.expectedHarmBand === "critical") {
    reasons.push("confidence_suppressed_by_uncertainty_or_harm");
  }
  return unique(reasons);
}

function resolveConservativeBand(
  command: CreateConfidenceDigestCommand,
): Exclude<ConfidenceDisplayBand, "suppressed"> {
  if (command.requestedDisplayBand) {
    return command.requestedDisplayBand;
  }
  if (
    command.evidenceCoverage < 0.45 ||
    command.epistemicUncertainty === "high" ||
    ["high", "critical"].includes(command.expectedHarmBand)
  ) {
    return "insufficient";
  }
  if (
    command.evidenceCoverage < 0.75 ||
    command.epistemicUncertainty === "medium" ||
    command.expectedHarmBand === "medium"
  ) {
    return "guarded";
  }
  return "supported";
}

function resolveConservativeTrustState(
  requestedTrustState: TrustState,
  freezeFrame: AssistiveFreezeFrame | undefined,
  settlement: AssistiveRunSettlementProjection | undefined,
  grant: AssistiveInvocationGrantProjection | undefined,
): TrustState {
  if (freezeFrame) {
    return "frozen";
  }
  if (
    settlement?.settlementState === "quarantined" ||
    settlement?.settlementState === "blocked_by_policy"
  ) {
    return "quarantined";
  }
  if (grant?.grantState === "shadow_only" || settlement?.settlementState === "shadow_only") {
    return "shadow_only";
  }
  if (requestedTrustState === "trusted") {
    return "degraded";
  }
  return requestedTrustState;
}

function resolveSurfacePosture(
  trustState: TrustState,
  freezeFrame: AssistiveFreezeFrame | undefined,
  grant: AssistiveInvocationGrantProjection | undefined,
  settlement: AssistiveRunSettlementProjection | undefined,
  reasons: readonly string[],
): SurfacePostureState {
  if (
    trustState === "shadow_only" ||
    grant?.grantState === "shadow_only" ||
    settlement?.settlementState === "shadow_only"
  ) {
    return "hidden";
  }
  if (
    freezeFrame?.freezeDisposition === "placeholder_only" ||
    reasons.includes(TRUST_ENVELOPE_INVARIANT_MARKERS.missing_trust_projection_fail_closed)
  ) {
    return "placeholder_only";
  }
  if (trustState === "quarantined") {
    return "provenance_only";
  }
  if (trustState === "frozen") {
    return "provenance_only";
  }
  return "observe_only";
}

function resolveActionability(
  trustState: TrustState,
  freezeFrame: AssistiveFreezeFrame | undefined,
  grant: AssistiveInvocationGrantProjection | undefined,
  reasons: readonly string[],
): ActionabilityState {
  if (grant?.grantState === "observe_only") {
    return "observe_only";
  }
  if (
    trustState === "frozen" &&
    freezeFrame &&
    !reasons.includes(TRUST_ENVELOPE_INVARIANT_MARKERS.missing_freeze_record_fail_closed)
  ) {
    return "regenerate_only";
  }
  if (trustState === "degraded") {
    return "regenerate_only";
  }
  if (trustState === "quarantined") {
    return "blocked_by_policy";
  }
  return "blocked";
}

function enforceConfidenceSuppressionFromDigests(
  posture: AssistiveSurfacePostureDecision,
  confidenceDigestRefs: readonly string[],
  confidenceDigests: Map<string, AssistiveConfidenceDigest>,
): readonly string[] {
  const reasonCodes = [...posture.blockingReasonRefs];
  for (const ref of confidenceDigestRefs) {
    const digest = confidenceDigests.get(ref);
    if (digest && !digest.visibleConfidenceAllowed) {
      reasonCodes.push(...digest.reasonCodes);
    }
  }
  if (posture.confidencePostureState !== "conservative_band") {
    reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.confidence_suppressed_by_trust_posture);
  }
  if (posture.sameShellRecoveryRequired || posture.freezeFrameRequired) {
    reasonCodes.push(TRUST_ENVELOPE_INVARIANT_MARKERS.same_shell_recovery_required);
  }
  return unique(reasonCodes);
}

function detectFreezeReason(
  command: ProjectTrustEnvelopeCommand,
  binding: AssistiveSurfaceBinding,
): FreezeReasonCode | undefined {
  if (binding.publicationState !== "published") {
    return "publication_drift";
  }
  if (binding.runtimePublicationState !== "current") {
    return "runtime_publication_drift";
  }
  if (
    command.selectedAnchorRef &&
    command.selectedAnchorRef !== binding.selectedAnchorRequirement
  ) {
    return "selected_anchor_drift";
  }
  if (command.routeFamily && command.routeFamily !== binding.routeFamily) {
    return "route_family_drift";
  }
  if (command.entityContinuityKey && command.entityContinuityKey !== binding.entityContinuityKey) {
    return "entity_continuity_drift";
  }
  if (command.continuityState && command.continuityState !== "current") {
    return "continuity_drift";
  }
  if (command.killSwitchState.killState !== "inactive") {
    return "kill_switch_active";
  }
  if (command.releaseFreezeRecordRef) {
    return "release_freeze";
  }
  return undefined;
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
