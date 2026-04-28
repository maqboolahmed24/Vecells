import { createHash } from "node:crypto";

export type ISODateString = string;

export type AssistiveFreezeActorRole =
  | "release_freeze_service"
  | "freeze_disposition_resolver"
  | "policy_freshness_validator"
  | "publication_freshness_validator"
  | "session_invalidation_service"
  | "recovery_disposition_binder"
  | "actionability_freeze_guard"
  | "session_reclearance_service"
  | "clinical_safety_lead"
  | "release_manager"
  | "system";

export type RolloutRung = "shadow_only" | "visible_summary" | "visible_insert" | "visible_commit";
export type FreezeTriggerType =
  | "threshold_breach"
  | "trust_degraded"
  | "trust_quarantined"
  | "policy_drift"
  | "publication_stale"
  | "incident_spike"
  | "runtime_publication_stale"
  | "selected_anchor_drift"
  | "decision_epoch_drift"
  | "insertion_point_drift"
  | "final_artifact_superseded"
  | "manual_freeze";
export type FreezeRecordState = "monitoring" | "frozen" | "shadow_only" | "released";
export type FreezeMode =
  | "shadow_only"
  | "read_only_provenance"
  | "placeholder_only"
  | "assistive_hidden";
export type PolicyFreshnessState = "current" | "stale" | "mismatched" | "missing" | "blocked";
export type PublicationFreshnessState =
  | "current"
  | "stale"
  | "mismatched"
  | "withdrawn"
  | "missing"
  | "blocked";
export type RuntimePublicationState = "current" | "stale" | "withdrawn" | "missing" | "blocked";
export type TrustState = "trusted" | "degraded" | "quarantined" | "shadow_only" | "frozen";
export type SessionInvalidationTrigger =
  | "trust_degradation"
  | "policy_promotion"
  | "policy_bundle_mismatch"
  | "publication_drift"
  | "runtime_publication_drift"
  | "decision_epoch_drift"
  | "selected_anchor_drift"
  | "insertion_point_drift"
  | "incident_linked"
  | "final_artifact_superseded";
export type InvalidatedSurface =
  | "session"
  | "feedback_chain"
  | "draft_patch_lease"
  | "work_protection_lease";
export type InvalidationState = "invalidated" | "stale_recoverable" | "blocked";
export type RecoveryBindingState = "bound" | "stale" | "blocked";
export type ActionabilityDecisionState = "enabled" | "regenerate_only" | "observe_only" | "blocked";
export type AssistiveAction =
  | "accept"
  | "insert"
  | "regenerate"
  | "export"
  | "completion_adjacent"
  | "view_provenance";
export type ReclearanceMethod = "session_refresh" | "regeneration" | "operator_unfreeze";
export type ReclearanceState = "required" | "cleared" | "blocked";

export const ASSISTIVE_FREEZE_INVARIANT_MARKERS = {
  release_freeze_record_current_truth: "release_freeze_record_current_truth",
  freeze_disposition_exact_modes_only: "freeze_disposition_exact_modes_only",
  policy_freshness_tuple_match_required: "policy_freshness_tuple_match_required",
  publication_freshness_tuple_match_required: "publication_freshness_tuple_match_required",
  stale_session_invalidates_actionability: "stale_session_invalidates_actionability",
  insertion_lease_not_silently_resurrected: "insertion_lease_not_silently_resurrected",
  same_shell_recovery_disposition_required: "same_shell_recovery_disposition_required",
  actionability_freeze_guard_blocks_stale_controls:
    "actionability_freeze_guard_blocks_stale_controls",
  provenance_preserved_when_policy_allows: "provenance_preserved_when_policy_allows",
  freeze_records_phi_safe_refs_only: "freeze_records_phi_safe_refs_only",
  reclearance_requires_refresh_or_regeneration: "reclearance_requires_refresh_or_regeneration",
  exact_blocker_detail_exposed: "exact_blocker_detail_exposed",
} as const;

export interface AssistiveFreezeActorContext {
  actorRef: string;
  actorRole: AssistiveFreezeActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface AssistiveFreezeAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: AssistiveFreezeActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface AssistiveReleaseFreezeRecord {
  assistiveReleaseFreezeRecordId: string;
  capabilityCode: string;
  releaseCandidateRef: string;
  rolloutSliceContractRef: string;
  rolloutVerdictRef: string;
  routeFamilyRef: string;
  audienceTier: string;
  releaseCohortRef: string;
  watchTupleHash: string;
  policyBundleRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  rolloutRungAtFreeze: RolloutRung;
  fallbackMode: FreezeMode;
  triggerType: FreezeTriggerType;
  triggerRef: string;
  freezeState: FreezeRecordState;
  openedAt: ISODateString;
  releasedAt?: ISODateString;
  currentBlockerRefs: readonly string[];
  freezeRecordHash: string;
}

export interface AssistiveFreezeDisposition {
  assistiveFreezeDispositionId: string;
  capabilityCode: string;
  rolloutVerdictRef: string;
  freezeRecordRef: string;
  freezeMode: FreezeMode;
  staffMessageRef: string;
  recoveryActionRef: string;
  releaseRecoveryDispositionRef: string;
  preserveVisibleArtifacts: boolean;
  preserveProvenanceFooter: boolean;
  suppressAccept: boolean;
  suppressInsert: boolean;
  suppressRegenerate: boolean;
  suppressExport: boolean;
  suppressCompletionAdjacent: boolean;
  appliesToRouteFamilies: readonly string[];
  dispositionState: "current" | "superseded" | "released";
  resolvedAt: ISODateString;
}

export interface AssistivePolicyFreshnessVerdict {
  policyFreshnessVerdictId: string;
  assistiveSessionRef: string;
  watchTupleHash: string;
  releaseCandidateRef: string;
  routeFamilyRef: string;
  expectedPolicyBundleRef: string;
  sessionPolicyBundleRef: string;
  promptPolicyBundleRef: string;
  approvalGatePolicyBundleRef: string;
  thresholdSetPolicyBundleRef: string;
  freshnessState: PolicyFreshnessState;
  driftedRefs: readonly string[];
  blockingReasonCodes: readonly string[];
  invalidatesActionability: boolean;
  evaluatedAt: ISODateString;
}

export interface AssistivePublicationFreshnessVerdict {
  publicationFreshnessVerdictId: string;
  assistiveSessionRef: string;
  routeFamilyRef: string;
  surfaceBindingRef: string;
  expectedSurfaceRouteContractRef: string;
  actualSurfaceRouteContractRef: string;
  expectedSurfacePublicationRef: string;
  actualSurfacePublicationRef: string;
  expectedRuntimePublicationBundleRef: string;
  actualRuntimePublicationBundleRef: string;
  surfacePublicationState: PublicationFreshnessState;
  runtimePublicationState: RuntimePublicationState;
  freshnessState: PublicationFreshnessState;
  driftedRefs: readonly string[];
  blockingReasonCodes: readonly string[];
  invalidatesActionability: boolean;
  evaluatedAt: ISODateString;
}

export interface AssistiveSessionInvalidationRecord {
  sessionInvalidationRecordId: string;
  assistiveSessionRef: string;
  watchTupleHash: string;
  trustProjectionRef: string;
  rolloutVerdictRef: string;
  policyFreshnessVerdictRef?: string;
  publicationFreshnessVerdictRef?: string;
  freezeRecordRef?: string;
  affectedFeedbackChainRefs: readonly string[];
  affectedPatchLeaseRefs: readonly string[];
  affectedWorkProtectionLeaseRefs: readonly string[];
  invalidatedSurfaces: readonly InvalidatedSurface[];
  triggerType: SessionInvalidationTrigger;
  triggerRef: string;
  selectedAnchorRef?: string;
  decisionEpochRef?: string;
  insertionPointRef?: string;
  finalHumanArtifactRef?: string;
  invalidationState: InvalidationState;
  recoveryRequired: boolean;
  staleActionBlockers: readonly AssistiveAction[];
  recordedAt: ISODateString;
}

export interface AssistiveRecoveryDispositionBinding {
  recoveryBindingId: string;
  assistiveSessionRef: string;
  freezeRecordRef: string;
  freezeDispositionRef: string;
  releaseRecoveryDispositionRef: string;
  routeFamilyRef: string;
  sameShellRequired: true;
  shellFamilyRef: string;
  dominantRecoveryActionRef: string;
  operatorMessageRef: string;
  clinicianMessageRef: string;
  preservedArtifactRefs: readonly string[];
  preservedProvenanceEnvelopeRefs: readonly string[];
  bindingState: RecoveryBindingState;
  blockingReasonCodes: readonly string[];
  boundAt: ISODateString;
}

export interface AssistiveActionabilityFreezeDecision {
  actionabilityFreezeDecisionId: string;
  assistiveSessionRef: string;
  requestedAction: AssistiveAction;
  freezeRecordRef?: string;
  freezeDispositionRef?: string;
  policyFreshnessVerdictRef?: string;
  publicationFreshnessVerdictRef?: string;
  sessionInvalidationRecordRef?: string;
  recoveryBindingRef?: string;
  decisionState: ActionabilityDecisionState;
  allowed: boolean;
  preserveVisibleArtifacts: boolean;
  preserveProvenanceFooter: boolean;
  blockingReasonCodes: readonly string[];
  decidedAt: ISODateString;
}

export interface AssistiveSessionReclearanceRecord {
  reclearanceRecordId: string;
  assistiveSessionRef: string;
  previousSessionInvalidationRef: string;
  previousPatchLeaseRefs: readonly string[];
  replacementSessionRef?: string;
  replacementPatchLeaseRefs: readonly string[];
  method: ReclearanceMethod;
  reclearanceState: ReclearanceState;
  requiredFreshRefs: readonly string[];
  blockingReasonCodes: readonly string[];
  clearedAt?: ISODateString;
  recordedAt: ISODateString;
}

export interface AssistiveFreezeStore {
  freezeRecords: Map<string, AssistiveReleaseFreezeRecord>;
  freezeDispositions: Map<string, AssistiveFreezeDisposition>;
  policyFreshnessVerdicts: Map<string, AssistivePolicyFreshnessVerdict>;
  publicationFreshnessVerdicts: Map<string, AssistivePublicationFreshnessVerdict>;
  sessionInvalidations: Map<string, AssistiveSessionInvalidationRecord>;
  recoveryBindings: Map<string, AssistiveRecoveryDispositionBinding>;
  actionabilityDecisions: Map<string, AssistiveActionabilityFreezeDecision>;
  reclearanceRecords: Map<string, AssistiveSessionReclearanceRecord>;
  auditRecords: AssistiveFreezeAuditRecord[];
  idempotencyKeys: Map<string, string>;
  currentFreezeRecordBySlice: Map<string, string>;
  currentDispositionByFreezeRecord: Map<string, string>;
  currentInvalidationBySession: Map<string, string>;
  currentRecoveryBindingBySession: Map<string, string>;
}

export interface AssistiveFreezeClock {
  now(): ISODateString;
}

export interface AssistiveFreezeIdGenerator {
  next(prefix: string): string;
}

export interface AssistiveFreezeRuntime {
  store: AssistiveFreezeStore;
  clock: AssistiveFreezeClock;
  idGenerator: AssistiveFreezeIdGenerator;
}

export interface OpenFreezeRecordCommand {
  assistiveReleaseFreezeRecordId?: string;
  capabilityCode: string;
  releaseCandidateRef: string;
  rolloutSliceContractRef: string;
  rolloutVerdictRef: string;
  routeFamilyRef: string;
  audienceTier: string;
  releaseCohortRef: string;
  watchTupleHash: string;
  policyBundleRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  rolloutRungAtFreeze: RolloutRung;
  fallbackMode?: FreezeMode;
  triggerType: FreezeTriggerType;
  triggerRef: string;
  freezeState?: FreezeRecordState;
  currentBlockerRefs?: readonly string[];
  idempotencyKey?: string;
}

export interface ReleaseFreezeRecordCommand {
  freezeRecordRef: string;
  releaseEvidenceRef: string;
  idempotencyKey?: string;
}

export interface ResolveFreezeDispositionCommand {
  assistiveFreezeDispositionId?: string;
  freezeRecordRef: string;
  trustState: TrustState;
  policyFreshnessState?: PolicyFreshnessState;
  publicationFreshnessState?: PublicationFreshnessState;
  runtimePublicationState?: RuntimePublicationState;
  staffMessageRef: string;
  recoveryActionRef: string;
  appliesToRouteFamilies?: readonly string[];
  idempotencyKey?: string;
}

export interface ValidatePolicyFreshnessCommand {
  policyFreshnessVerdictId?: string;
  assistiveSessionRef: string;
  watchTupleHash: string;
  releaseCandidateRef: string;
  routeFamilyRef: string;
  expectedPolicyBundleRef: string;
  sessionPolicyBundleRef: string;
  promptPolicyBundleRef: string;
  approvalGatePolicyBundleRef: string;
  thresholdSetPolicyBundleRef: string;
  idempotencyKey?: string;
}

export interface ValidatePublicationFreshnessCommand {
  publicationFreshnessVerdictId?: string;
  assistiveSessionRef: string;
  routeFamilyRef: string;
  surfaceBindingRef: string;
  expectedSurfaceRouteContractRef: string;
  actualSurfaceRouteContractRef: string;
  expectedSurfacePublicationRef: string;
  actualSurfacePublicationRef: string;
  expectedRuntimePublicationBundleRef: string;
  actualRuntimePublicationBundleRef: string;
  surfacePublicationState: PublicationFreshnessState;
  runtimePublicationState: RuntimePublicationState;
  idempotencyKey?: string;
}

export interface InvalidateSessionCommand {
  sessionInvalidationRecordId?: string;
  assistiveSessionRef: string;
  watchTupleHash: string;
  trustProjectionRef: string;
  rolloutVerdictRef: string;
  policyFreshnessVerdictRef?: string;
  publicationFreshnessVerdictRef?: string;
  freezeRecordRef?: string;
  affectedFeedbackChainRefs?: readonly string[];
  affectedPatchLeaseRefs?: readonly string[];
  affectedWorkProtectionLeaseRefs?: readonly string[];
  triggerType: SessionInvalidationTrigger;
  triggerRef: string;
  selectedAnchorRef?: string;
  decisionEpochRef?: string;
  insertionPointRef?: string;
  finalHumanArtifactRef?: string;
  idempotencyKey?: string;
}

export interface BindRecoveryDispositionCommand {
  recoveryBindingId?: string;
  assistiveSessionRef: string;
  freezeRecordRef: string;
  freezeDispositionRef: string;
  releaseRecoveryDispositionRef: string;
  routeFamilyRef: string;
  shellFamilyRef: string;
  dominantRecoveryActionRef: string;
  operatorMessageRef: string;
  clinicianMessageRef: string;
  preservedArtifactRefs?: readonly string[];
  preservedProvenanceEnvelopeRefs?: readonly string[];
  releaseRecoveryDispositionState?: "published" | "stale" | "withdrawn";
  idempotencyKey?: string;
}

export interface GuardActionabilityCommand {
  actionabilityFreezeDecisionId?: string;
  assistiveSessionRef: string;
  requestedAction: AssistiveAction;
  freezeRecordRef?: string;
  freezeDispositionRef?: string;
  policyFreshnessVerdictRef?: string;
  publicationFreshnessVerdictRef?: string;
  sessionInvalidationRecordRef?: string;
  recoveryBindingRef?: string;
  idempotencyKey?: string;
}

export interface ReclearSessionCommand {
  reclearanceRecordId?: string;
  assistiveSessionRef: string;
  previousSessionInvalidationRef: string;
  previousPatchLeaseRefs?: readonly string[];
  replacementSessionRef?: string;
  replacementPatchLeaseRefs?: readonly string[];
  method: ReclearanceMethod;
  requiredFreshRefs: readonly string[];
  freezeReleased?: boolean;
  policyFresh?: boolean;
  publicationFresh?: boolean;
  trustFresh?: boolean;
  idempotencyKey?: string;
}

export class AssistiveReleaseFreezeRecordService {
  public constructor(private readonly runtime: AssistiveFreezeRuntime) {}

  public openFreezeRecord(
    command: OpenFreezeRecordCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistiveReleaseFreezeRecord {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.freezeRecords,
      () => {
        for (const [field, value] of Object.entries({
          capabilityCode: command.capabilityCode,
          releaseCandidateRef: command.releaseCandidateRef,
          rolloutSliceContractRef: command.rolloutSliceContractRef,
          rolloutVerdictRef: command.rolloutVerdictRef,
          routeFamilyRef: command.routeFamilyRef,
          audienceTier: command.audienceTier,
          releaseCohortRef: command.releaseCohortRef,
          watchTupleHash: command.watchTupleHash,
          policyBundleRef: command.policyBundleRef,
          surfaceRouteContractRef: command.surfaceRouteContractRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          triggerRef: command.triggerRef,
        })) {
          requireNonEmpty(value, field);
        }
        const fallbackMode = command.fallbackMode ?? fallbackModeForTrigger(command.triggerType);
        const freezeRecordHash = stableAssistiveFreezeHash({
          capabilityCode: command.capabilityCode,
          releaseCandidateRef: command.releaseCandidateRef,
          rolloutSliceContractRef: command.rolloutSliceContractRef,
          rolloutVerdictRef: command.rolloutVerdictRef,
          routeFamilyRef: command.routeFamilyRef,
          audienceTier: command.audienceTier,
          releaseCohortRef: command.releaseCohortRef,
          watchTupleHash: command.watchTupleHash,
          policyBundleRef: command.policyBundleRef,
          surfaceRouteContractRef: command.surfaceRouteContractRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          triggerType: command.triggerType,
          triggerRef: command.triggerRef,
        });
        const freezeRecord: AssistiveReleaseFreezeRecord = {
          assistiveReleaseFreezeRecordId:
            command.assistiveReleaseFreezeRecordId ??
            `assistive-release-freeze-record:${freezeRecordHash}`,
          capabilityCode: command.capabilityCode,
          releaseCandidateRef: command.releaseCandidateRef,
          rolloutSliceContractRef: command.rolloutSliceContractRef,
          rolloutVerdictRef: command.rolloutVerdictRef,
          routeFamilyRef: command.routeFamilyRef,
          audienceTier: command.audienceTier,
          releaseCohortRef: command.releaseCohortRef,
          watchTupleHash: command.watchTupleHash,
          policyBundleRef: command.policyBundleRef,
          surfaceRouteContractRef: command.surfaceRouteContractRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          rolloutRungAtFreeze: command.rolloutRungAtFreeze,
          fallbackMode,
          triggerType: command.triggerType,
          triggerRef: command.triggerRef,
          freezeState: command.freezeState ?? freezeStateForTrigger(command.triggerType),
          openedAt: this.runtime.clock.now(),
          currentBlockerRefs: [...(command.currentBlockerRefs ?? [command.triggerRef])],
          freezeRecordHash,
        };
        this.runtime.store.freezeRecords.set(
          freezeRecord.assistiveReleaseFreezeRecordId,
          freezeRecord,
        );
        this.runtime.store.currentFreezeRecordBySlice.set(
          freezeSliceKey(command.watchTupleHash, command.routeFamilyRef, command.audienceTier),
          freezeRecord.assistiveReleaseFreezeRecordId,
        );
        recordAudit(
          this.runtime,
          "AssistiveReleaseFreezeRecordService",
          "openFreezeRecord",
          actor,
          freezeRecord.assistiveReleaseFreezeRecordId,
          "accepted",
          [
            ASSISTIVE_FREEZE_INVARIANT_MARKERS.release_freeze_record_current_truth,
            ASSISTIVE_FREEZE_INVARIANT_MARKERS.freeze_records_phi_safe_refs_only,
          ],
        );
        return freezeRecord;
      },
    );
  }

  public releaseFreezeRecord(
    command: ReleaseFreezeRecordCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistiveReleaseFreezeRecord {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.freezeRecords,
      () => {
        const freezeRecord = requireFreezeRecord(this.runtime, command.freezeRecordRef);
        requireNonEmpty(command.releaseEvidenceRef, "releaseEvidenceRef");
        const released: AssistiveReleaseFreezeRecord = {
          ...freezeRecord,
          freezeState: "released",
          releasedAt: this.runtime.clock.now(),
          currentBlockerRefs: [],
        };
        this.runtime.store.freezeRecords.set(released.assistiveReleaseFreezeRecordId, released);
        recordAudit(
          this.runtime,
          "AssistiveReleaseFreezeRecordService",
          "releaseFreezeRecord",
          actor,
          released.assistiveReleaseFreezeRecordId,
          "accepted",
          [ASSISTIVE_FREEZE_INVARIANT_MARKERS.reclearance_requires_refresh_or_regeneration],
        );
        return released;
      },
    );
  }
}

export class AssistiveFreezeDispositionResolver {
  public constructor(private readonly runtime: AssistiveFreezeRuntime) {}

  public resolveDisposition(
    command: ResolveFreezeDispositionCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistiveFreezeDisposition {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.freezeDispositions,
      () => {
        const freezeRecord = requireFreezeRecord(this.runtime, command.freezeRecordRef);
        const freezeMode = resolveFreezeMode(command, freezeRecord);
        const preserveVisibleArtifacts = freezeMode === "read_only_provenance";
        const dispositionHash = stableAssistiveFreezeHash({
          freezeRecordRef: command.freezeRecordRef,
          trustState: command.trustState,
          policyFreshnessState: command.policyFreshnessState,
          publicationFreshnessState: command.publicationFreshnessState,
          runtimePublicationState: command.runtimePublicationState,
          freezeMode,
        });
        const disposition: AssistiveFreezeDisposition = {
          assistiveFreezeDispositionId:
            command.assistiveFreezeDispositionId ??
            `assistive-freeze-disposition:${dispositionHash}`,
          capabilityCode: freezeRecord.capabilityCode,
          rolloutVerdictRef: freezeRecord.rolloutVerdictRef,
          freezeRecordRef: freezeRecord.assistiveReleaseFreezeRecordId,
          freezeMode,
          staffMessageRef: command.staffMessageRef,
          recoveryActionRef: command.recoveryActionRef,
          releaseRecoveryDispositionRef: freezeRecord.releaseRecoveryDispositionRef,
          preserveVisibleArtifacts,
          preserveProvenanceFooter: freezeMode !== "assistive_hidden",
          suppressAccept: true,
          suppressInsert: true,
          suppressRegenerate:
            freezeMode === "assistive_hidden" || freezeMode === "placeholder_only",
          suppressExport: true,
          suppressCompletionAdjacent: true,
          appliesToRouteFamilies: [
            ...(command.appliesToRouteFamilies ?? [freezeRecord.routeFamilyRef]),
          ],
          dispositionState: freezeRecord.freezeState === "released" ? "released" : "current",
          resolvedAt: this.runtime.clock.now(),
        };
        this.runtime.store.freezeDispositions.set(
          disposition.assistiveFreezeDispositionId,
          disposition,
        );
        this.runtime.store.currentDispositionByFreezeRecord.set(
          freezeRecord.assistiveReleaseFreezeRecordId,
          disposition.assistiveFreezeDispositionId,
        );
        recordAudit(
          this.runtime,
          "AssistiveFreezeDispositionResolver",
          "resolveDisposition",
          actor,
          disposition.assistiveFreezeDispositionId,
          "accepted",
          [
            ASSISTIVE_FREEZE_INVARIANT_MARKERS.freeze_disposition_exact_modes_only,
            ASSISTIVE_FREEZE_INVARIANT_MARKERS.provenance_preserved_when_policy_allows,
          ],
        );
        return disposition;
      },
    );
  }
}

export class AssistivePolicyFreshnessValidator {
  public constructor(private readonly runtime: AssistiveFreezeRuntime) {}

  public validatePolicyFreshness(
    command: ValidatePolicyFreshnessCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistivePolicyFreshnessVerdict {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.policyFreshnessVerdicts,
      () => {
        const refs = {
          sessionPolicyBundleRef: command.sessionPolicyBundleRef,
          promptPolicyBundleRef: command.promptPolicyBundleRef,
          approvalGatePolicyBundleRef: command.approvalGatePolicyBundleRef,
          thresholdSetPolicyBundleRef: command.thresholdSetPolicyBundleRef,
        };
        const driftedRefs = Object.entries(refs)
          .filter(([, value]) => value !== command.expectedPolicyBundleRef)
          .map(([key, value]) => `${key}:${value}`);
        const missingRefs = Object.entries(refs)
          .filter(([, value]) => value.length === 0)
          .map(([key]) => key);
        const freshnessState: PolicyFreshnessState =
          missingRefs.length > 0 ? "missing" : driftedRefs.length > 0 ? "mismatched" : "current";
        const blockingReasonCodes =
          freshnessState === "current" ? [] : ["policy_freshness_tuple_mismatch", ...missingRefs];
        const verdictHash = stableAssistiveFreezeHash({
          assistiveSessionRef: command.assistiveSessionRef,
          watchTupleHash: command.watchTupleHash,
          releaseCandidateRef: command.releaseCandidateRef,
          routeFamilyRef: command.routeFamilyRef,
          expectedPolicyBundleRef: command.expectedPolicyBundleRef,
          refs,
        });
        const verdict: AssistivePolicyFreshnessVerdict = {
          policyFreshnessVerdictId:
            command.policyFreshnessVerdictId ?? `assistive-policy-freshness-verdict:${verdictHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          watchTupleHash: command.watchTupleHash,
          releaseCandidateRef: command.releaseCandidateRef,
          routeFamilyRef: command.routeFamilyRef,
          expectedPolicyBundleRef: command.expectedPolicyBundleRef,
          sessionPolicyBundleRef: command.sessionPolicyBundleRef,
          promptPolicyBundleRef: command.promptPolicyBundleRef,
          approvalGatePolicyBundleRef: command.approvalGatePolicyBundleRef,
          thresholdSetPolicyBundleRef: command.thresholdSetPolicyBundleRef,
          freshnessState,
          driftedRefs,
          blockingReasonCodes,
          invalidatesActionability: freshnessState !== "current",
          evaluatedAt: this.runtime.clock.now(),
        };
        this.runtime.store.policyFreshnessVerdicts.set(verdict.policyFreshnessVerdictId, verdict);
        recordAudit(
          this.runtime,
          "AssistivePolicyFreshnessValidator",
          "validatePolicyFreshness",
          actor,
          verdict.policyFreshnessVerdictId,
          "accepted",
          [ASSISTIVE_FREEZE_INVARIANT_MARKERS.policy_freshness_tuple_match_required],
        );
        return verdict;
      },
    );
  }
}

export class AssistivePublicationFreshnessValidator {
  public constructor(private readonly runtime: AssistiveFreezeRuntime) {}

  public validatePublicationFreshness(
    command: ValidatePublicationFreshnessCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistivePublicationFreshnessVerdict {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.publicationFreshnessVerdicts,
      () => {
        const driftedRefs: string[] = [];
        if (command.actualSurfaceRouteContractRef !== command.expectedSurfaceRouteContractRef) {
          driftedRefs.push(`surfaceRouteContractRef:${command.actualSurfaceRouteContractRef}`);
        }
        if (command.actualSurfacePublicationRef !== command.expectedSurfacePublicationRef) {
          driftedRefs.push(`surfacePublicationRef:${command.actualSurfacePublicationRef}`);
        }
        if (
          command.actualRuntimePublicationBundleRef !== command.expectedRuntimePublicationBundleRef
        ) {
          driftedRefs.push(
            `runtimePublicationBundleRef:${command.actualRuntimePublicationBundleRef}`,
          );
        }
        const freshnessState = resolvePublicationFreshness(command, driftedRefs);
        const blockingReasonCodes =
          freshnessState === "current"
            ? []
            : unique([
                "publication_freshness_tuple_mismatch",
                ...driftedRefs,
                command.surfacePublicationState !== "current"
                  ? `surface_publication_${command.surfacePublicationState}`
                  : "",
                command.runtimePublicationState !== "current"
                  ? `runtime_publication_${command.runtimePublicationState}`
                  : "",
              ]);
        const verdictHash = stableAssistiveFreezeHash({
          assistiveSessionRef: command.assistiveSessionRef,
          routeFamilyRef: command.routeFamilyRef,
          surfaceBindingRef: command.surfaceBindingRef,
          expectedSurfaceRouteContractRef: command.expectedSurfaceRouteContractRef,
          actualSurfaceRouteContractRef: command.actualSurfaceRouteContractRef,
          expectedSurfacePublicationRef: command.expectedSurfacePublicationRef,
          actualSurfacePublicationRef: command.actualSurfacePublicationRef,
          expectedRuntimePublicationBundleRef: command.expectedRuntimePublicationBundleRef,
          actualRuntimePublicationBundleRef: command.actualRuntimePublicationBundleRef,
          surfacePublicationState: command.surfacePublicationState,
          runtimePublicationState: command.runtimePublicationState,
        });
        const verdict: AssistivePublicationFreshnessVerdict = {
          publicationFreshnessVerdictId:
            command.publicationFreshnessVerdictId ??
            `assistive-publication-freshness-verdict:${verdictHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          routeFamilyRef: command.routeFamilyRef,
          surfaceBindingRef: command.surfaceBindingRef,
          expectedSurfaceRouteContractRef: command.expectedSurfaceRouteContractRef,
          actualSurfaceRouteContractRef: command.actualSurfaceRouteContractRef,
          expectedSurfacePublicationRef: command.expectedSurfacePublicationRef,
          actualSurfacePublicationRef: command.actualSurfacePublicationRef,
          expectedRuntimePublicationBundleRef: command.expectedRuntimePublicationBundleRef,
          actualRuntimePublicationBundleRef: command.actualRuntimePublicationBundleRef,
          surfacePublicationState: command.surfacePublicationState,
          runtimePublicationState: command.runtimePublicationState,
          freshnessState,
          driftedRefs,
          blockingReasonCodes,
          invalidatesActionability: freshnessState !== "current",
          evaluatedAt: this.runtime.clock.now(),
        };
        this.runtime.store.publicationFreshnessVerdicts.set(
          verdict.publicationFreshnessVerdictId,
          verdict,
        );
        recordAudit(
          this.runtime,
          "AssistivePublicationFreshnessValidator",
          "validatePublicationFreshness",
          actor,
          verdict.publicationFreshnessVerdictId,
          "accepted",
          [ASSISTIVE_FREEZE_INVARIANT_MARKERS.publication_freshness_tuple_match_required],
        );
        return verdict;
      },
    );
  }
}

export class AssistiveSessionInvalidationService {
  public constructor(private readonly runtime: AssistiveFreezeRuntime) {}

  public invalidateSession(
    command: InvalidateSessionCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistiveSessionInvalidationRecord {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.sessionInvalidations,
      () => {
        const invalidatedSurfaces = unique([
          "session",
          command.affectedFeedbackChainRefs && command.affectedFeedbackChainRefs.length > 0
            ? "feedback_chain"
            : "",
          command.affectedPatchLeaseRefs && command.affectedPatchLeaseRefs.length > 0
            ? "draft_patch_lease"
            : "",
          command.affectedWorkProtectionLeaseRefs &&
          command.affectedWorkProtectionLeaseRefs.length > 0
            ? "work_protection_lease"
            : "",
        ]) as InvalidatedSurface[];
        const staleActionBlockers = staleActionsForTrigger(command.triggerType);
        const invalidationHash = stableAssistiveFreezeHash({
          assistiveSessionRef: command.assistiveSessionRef,
          watchTupleHash: command.watchTupleHash,
          trustProjectionRef: command.trustProjectionRef,
          rolloutVerdictRef: command.rolloutVerdictRef,
          policyFreshnessVerdictRef: command.policyFreshnessVerdictRef,
          publicationFreshnessVerdictRef: command.publicationFreshnessVerdictRef,
          freezeRecordRef: command.freezeRecordRef,
          triggerType: command.triggerType,
          triggerRef: command.triggerRef,
          selectedAnchorRef: command.selectedAnchorRef,
          decisionEpochRef: command.decisionEpochRef,
          insertionPointRef: command.insertionPointRef,
        });
        const record: AssistiveSessionInvalidationRecord = {
          sessionInvalidationRecordId:
            command.sessionInvalidationRecordId ??
            `assistive-session-invalidation:${invalidationHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          watchTupleHash: command.watchTupleHash,
          trustProjectionRef: command.trustProjectionRef,
          rolloutVerdictRef: command.rolloutVerdictRef,
          policyFreshnessVerdictRef: command.policyFreshnessVerdictRef,
          publicationFreshnessVerdictRef: command.publicationFreshnessVerdictRef,
          freezeRecordRef: command.freezeRecordRef,
          affectedFeedbackChainRefs: [...(command.affectedFeedbackChainRefs ?? [])],
          affectedPatchLeaseRefs: [...(command.affectedPatchLeaseRefs ?? [])],
          affectedWorkProtectionLeaseRefs: [...(command.affectedWorkProtectionLeaseRefs ?? [])],
          invalidatedSurfaces,
          triggerType: command.triggerType,
          triggerRef: command.triggerRef,
          selectedAnchorRef: command.selectedAnchorRef,
          decisionEpochRef: command.decisionEpochRef,
          insertionPointRef: command.insertionPointRef,
          finalHumanArtifactRef: command.finalHumanArtifactRef,
          invalidationState: "stale_recoverable",
          recoveryRequired: true,
          staleActionBlockers,
          recordedAt: this.runtime.clock.now(),
        };
        this.runtime.store.sessionInvalidations.set(record.sessionInvalidationRecordId, record);
        this.runtime.store.currentInvalidationBySession.set(
          command.assistiveSessionRef,
          record.sessionInvalidationRecordId,
        );
        recordAudit(
          this.runtime,
          "AssistiveSessionInvalidationService",
          "invalidateSession",
          actor,
          record.sessionInvalidationRecordId,
          "accepted",
          [
            ASSISTIVE_FREEZE_INVARIANT_MARKERS.stale_session_invalidates_actionability,
            ASSISTIVE_FREEZE_INVARIANT_MARKERS.exact_blocker_detail_exposed,
          ],
        );
        return record;
      },
    );
  }
}

export class AssistiveRecoveryDispositionBinder {
  public constructor(private readonly runtime: AssistiveFreezeRuntime) {}

  public bindRecoveryDisposition(
    command: BindRecoveryDispositionCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistiveRecoveryDispositionBinding {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.recoveryBindings,
      () => {
        requireFreezeRecord(this.runtime, command.freezeRecordRef);
        const disposition = requireFreezeDisposition(this.runtime, command.freezeDispositionRef);
        const bindingState: RecoveryBindingState =
          command.releaseRecoveryDispositionState === "stale"
            ? "stale"
            : command.releaseRecoveryDispositionState === "withdrawn"
              ? "blocked"
              : "bound";
        const blockingReasonCodes =
          bindingState === "bound" ? [] : [`release_recovery_disposition_${bindingState}`];
        const bindingHash = stableAssistiveFreezeHash({
          assistiveSessionRef: command.assistiveSessionRef,
          freezeRecordRef: command.freezeRecordRef,
          freezeDispositionRef: command.freezeDispositionRef,
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          routeFamilyRef: command.routeFamilyRef,
          shellFamilyRef: command.shellFamilyRef,
          dominantRecoveryActionRef: command.dominantRecoveryActionRef,
        });
        const binding: AssistiveRecoveryDispositionBinding = {
          recoveryBindingId:
            command.recoveryBindingId ?? `assistive-recovery-binding:${bindingHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          freezeRecordRef: command.freezeRecordRef,
          freezeDispositionRef: command.freezeDispositionRef,
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          routeFamilyRef: command.routeFamilyRef,
          sameShellRequired: true,
          shellFamilyRef: command.shellFamilyRef,
          dominantRecoveryActionRef: command.dominantRecoveryActionRef,
          operatorMessageRef: command.operatorMessageRef,
          clinicianMessageRef: command.clinicianMessageRef,
          preservedArtifactRefs:
            disposition.preserveVisibleArtifacts || disposition.preserveProvenanceFooter
              ? [...(command.preservedArtifactRefs ?? [])]
              : [],
          preservedProvenanceEnvelopeRefs: disposition.preserveProvenanceFooter
            ? [...(command.preservedProvenanceEnvelopeRefs ?? [])]
            : [],
          bindingState,
          blockingReasonCodes,
          boundAt: this.runtime.clock.now(),
        };
        this.runtime.store.recoveryBindings.set(binding.recoveryBindingId, binding);
        this.runtime.store.currentRecoveryBindingBySession.set(
          command.assistiveSessionRef,
          binding.recoveryBindingId,
        );
        recordAudit(
          this.runtime,
          "AssistiveRecoveryDispositionBinder",
          "bindRecoveryDisposition",
          actor,
          binding.recoveryBindingId,
          bindingState === "bound" ? "accepted" : "blocked",
          [ASSISTIVE_FREEZE_INVARIANT_MARKERS.same_shell_recovery_disposition_required],
        );
        return binding;
      },
    );
  }
}

export class AssistiveActionabilityFreezeGuard {
  public constructor(private readonly runtime: AssistiveFreezeRuntime) {}

  public guardAction(
    command: GuardActionabilityCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistiveActionabilityFreezeDecision {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.actionabilityDecisions,
      () => {
        const freezeRecord = command.freezeRecordRef
          ? requireFreezeRecord(this.runtime, command.freezeRecordRef)
          : undefined;
        const disposition = command.freezeDispositionRef
          ? requireFreezeDisposition(this.runtime, command.freezeDispositionRef)
          : undefined;
        const policyVerdict = command.policyFreshnessVerdictRef
          ? requirePolicyVerdict(this.runtime, command.policyFreshnessVerdictRef)
          : undefined;
        const publicationVerdict = command.publicationFreshnessVerdictRef
          ? requirePublicationVerdict(this.runtime, command.publicationFreshnessVerdictRef)
          : undefined;
        const invalidation = command.sessionInvalidationRecordRef
          ? requireInvalidation(this.runtime, command.sessionInvalidationRecordRef)
          : undefined;
        const recoveryBinding = command.recoveryBindingRef
          ? requireRecoveryBinding(this.runtime, command.recoveryBindingRef)
          : undefined;
        const blockers = actionabilityBlockers(
          command.requestedAction,
          freezeRecord,
          disposition,
          policyVerdict,
          publicationVerdict,
          invalidation,
          recoveryBinding,
        );
        const allowed = blockers.length === 0;
        const decisionState = allowed
          ? "enabled"
          : command.requestedAction === "view_provenance" &&
              disposition?.preserveProvenanceFooter &&
              recoveryBinding?.bindingState === "bound"
            ? "observe_only"
            : disposition?.freezeMode === "read_only_provenance"
              ? "observe_only"
              : "blocked";
        const decisionHash = stableAssistiveFreezeHash({
          assistiveSessionRef: command.assistiveSessionRef,
          requestedAction: command.requestedAction,
          freezeRecordRef: command.freezeRecordRef,
          freezeDispositionRef: command.freezeDispositionRef,
          policyFreshnessVerdictRef: command.policyFreshnessVerdictRef,
          publicationFreshnessVerdictRef: command.publicationFreshnessVerdictRef,
          sessionInvalidationRecordRef: command.sessionInvalidationRecordRef,
          recoveryBindingRef: command.recoveryBindingRef,
          blockers,
        });
        const decision: AssistiveActionabilityFreezeDecision = {
          actionabilityFreezeDecisionId:
            command.actionabilityFreezeDecisionId ??
            `assistive-actionability-freeze-decision:${decisionHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          requestedAction: command.requestedAction,
          freezeRecordRef: command.freezeRecordRef,
          freezeDispositionRef: command.freezeDispositionRef,
          policyFreshnessVerdictRef: command.policyFreshnessVerdictRef,
          publicationFreshnessVerdictRef: command.publicationFreshnessVerdictRef,
          sessionInvalidationRecordRef: command.sessionInvalidationRecordRef,
          recoveryBindingRef: command.recoveryBindingRef,
          decisionState,
          allowed,
          preserveVisibleArtifacts: disposition?.preserveVisibleArtifacts ?? false,
          preserveProvenanceFooter: disposition?.preserveProvenanceFooter ?? false,
          blockingReasonCodes: blockers,
          decidedAt: this.runtime.clock.now(),
        };
        this.runtime.store.actionabilityDecisions.set(
          decision.actionabilityFreezeDecisionId,
          decision,
        );
        recordAudit(
          this.runtime,
          "AssistiveActionabilityFreezeGuard",
          "guardAction",
          actor,
          decision.actionabilityFreezeDecisionId,
          allowed ? "accepted" : "blocked",
          [ASSISTIVE_FREEZE_INVARIANT_MARKERS.actionability_freeze_guard_blocks_stale_controls],
        );
        return decision;
      },
    );
  }
}

export class AssistiveSessionReclearanceService {
  public constructor(private readonly runtime: AssistiveFreezeRuntime) {}

  public reclearSession(
    command: ReclearSessionCommand,
    actor: AssistiveFreezeActorContext,
  ): AssistiveSessionReclearanceRecord {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.reclearanceRecords,
      () => {
        requireInvalidation(this.runtime, command.previousSessionInvalidationRef);
        const blockers: string[] = [];
        if (command.method === "operator_unfreeze" && !command.freezeReleased) {
          blockers.push("freeze_not_released");
        }
        if (!command.policyFresh) {
          blockers.push("policy_not_fresh");
        }
        if (!command.publicationFresh) {
          blockers.push("publication_not_fresh");
        }
        if (!command.trustFresh) {
          blockers.push("trust_not_fresh");
        }
        if (command.method === "session_refresh" && !command.replacementSessionRef) {
          blockers.push("replacement_session_required");
        }
        if (
          command.method === "regeneration" &&
          (command.replacementPatchLeaseRefs ?? []).length === 0
        ) {
          blockers.push("replacement_patch_lease_required");
        }
        if (
          (command.previousPatchLeaseRefs ?? []).some((ref) =>
            (command.replacementPatchLeaseRefs ?? []).includes(ref),
          )
        ) {
          blockers.push("previous_patch_lease_cannot_be_reused");
        }
        const reclearanceState: ReclearanceState = blockers.length === 0 ? "cleared" : "blocked";
        const reclearanceHash = stableAssistiveFreezeHash({
          assistiveSessionRef: command.assistiveSessionRef,
          previousSessionInvalidationRef: command.previousSessionInvalidationRef,
          previousPatchLeaseRefs: command.previousPatchLeaseRefs,
          replacementSessionRef: command.replacementSessionRef,
          replacementPatchLeaseRefs: command.replacementPatchLeaseRefs,
          method: command.method,
          requiredFreshRefs: command.requiredFreshRefs,
          blockers,
        });
        const record: AssistiveSessionReclearanceRecord = {
          reclearanceRecordId:
            command.reclearanceRecordId ?? `assistive-session-reclearance:${reclearanceHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          previousSessionInvalidationRef: command.previousSessionInvalidationRef,
          previousPatchLeaseRefs: [...(command.previousPatchLeaseRefs ?? [])],
          replacementSessionRef: command.replacementSessionRef,
          replacementPatchLeaseRefs: [...(command.replacementPatchLeaseRefs ?? [])],
          method: command.method,
          reclearanceState,
          requiredFreshRefs: [...command.requiredFreshRefs],
          blockingReasonCodes: blockers,
          clearedAt: reclearanceState === "cleared" ? this.runtime.clock.now() : undefined,
          recordedAt: this.runtime.clock.now(),
        };
        this.runtime.store.reclearanceRecords.set(record.reclearanceRecordId, record);
        recordAudit(
          this.runtime,
          "AssistiveSessionReclearanceService",
          "reclearSession",
          actor,
          record.reclearanceRecordId,
          reclearanceState === "cleared" ? "accepted" : "blocked",
          [
            ASSISTIVE_FREEZE_INVARIANT_MARKERS.reclearance_requires_refresh_or_regeneration,
            ASSISTIVE_FREEZE_INVARIANT_MARKERS.insertion_lease_not_silently_resurrected,
          ],
        );
        return record;
      },
    );
  }
}

export function createAssistiveFreezePlane(options?: {
  store?: AssistiveFreezeStore;
  clock?: AssistiveFreezeClock;
  idGenerator?: AssistiveFreezeIdGenerator;
}) {
  const runtime: AssistiveFreezeRuntime = {
    store: options?.store ?? createAssistiveFreezeStore(),
    clock: options?.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options?.idGenerator ?? createSequentialIdGenerator(),
  };
  return {
    runtime,
    freezeRecords: new AssistiveReleaseFreezeRecordService(runtime),
    freezeDispositions: new AssistiveFreezeDispositionResolver(runtime),
    policyFreshness: new AssistivePolicyFreshnessValidator(runtime),
    publicationFreshness: new AssistivePublicationFreshnessValidator(runtime),
    sessionInvalidations: new AssistiveSessionInvalidationService(runtime),
    recoveryBindings: new AssistiveRecoveryDispositionBinder(runtime),
    actionabilityGuard: new AssistiveActionabilityFreezeGuard(runtime),
    reclearance: new AssistiveSessionReclearanceService(runtime),
  };
}

export function createAssistiveFreezeStore(): AssistiveFreezeStore {
  return {
    freezeRecords: new Map(),
    freezeDispositions: new Map(),
    policyFreshnessVerdicts: new Map(),
    publicationFreshnessVerdicts: new Map(),
    sessionInvalidations: new Map(),
    recoveryBindings: new Map(),
    actionabilityDecisions: new Map(),
    reclearanceRecords: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
    currentFreezeRecordBySlice: new Map(),
    currentDispositionByFreezeRecord: new Map(),
    currentInvalidationBySession: new Map(),
    currentRecoveryBindingBySession: new Map(),
  };
}

export function stableAssistiveFreezeHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex")
    .slice(0, 32);
}

function createSequentialIdGenerator(): AssistiveFreezeIdGenerator {
  let counter = 0;
  return {
    next(prefix: string) {
      counter += 1;
      return `${prefix}:${counter}`;
    },
  };
}

function withIdempotency<T>(
  runtime: AssistiveFreezeRuntime,
  idempotencyKey: string | undefined,
  targetStore: Map<string, T>,
  create: () => T,
): T {
  if (idempotencyKey) {
    const existingId = runtime.store.idempotencyKeys.get(idempotencyKey);
    if (existingId) {
      const existing = targetStore.get(existingId);
      if (existing) {
        return existing;
      }
    }
  }
  const created = create();
  if (idempotencyKey) {
    const id = firstStringValueEndingInId(created);
    if (id) {
      runtime.store.idempotencyKeys.set(idempotencyKey, id);
    }
  }
  return created;
}

function firstStringValueEndingInId(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key.endsWith("Id") && typeof entry === "string") {
      return entry;
    }
  }
  return undefined;
}

function recordAudit(
  runtime: AssistiveFreezeRuntime,
  serviceName: string,
  action: string,
  actor: AssistiveFreezeActorContext,
  subjectRef: string,
  outcome: AssistiveFreezeAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("assistive-freeze-audit"),
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

function requireFreezeRecord(
  runtime: AssistiveFreezeRuntime,
  freezeRecordRef: string,
): AssistiveReleaseFreezeRecord {
  const record = runtime.store.freezeRecords.get(freezeRecordRef);
  if (!record) {
    throw new Error(`Unknown AssistiveReleaseFreezeRecord ${freezeRecordRef}.`);
  }
  return record;
}

function requireFreezeDisposition(
  runtime: AssistiveFreezeRuntime,
  dispositionRef: string,
): AssistiveFreezeDisposition {
  const disposition = runtime.store.freezeDispositions.get(dispositionRef);
  if (!disposition) {
    throw new Error(`Unknown AssistiveFreezeDisposition ${dispositionRef}.`);
  }
  return disposition;
}

function requirePolicyVerdict(
  runtime: AssistiveFreezeRuntime,
  verdictRef: string,
): AssistivePolicyFreshnessVerdict {
  const verdict = runtime.store.policyFreshnessVerdicts.get(verdictRef);
  if (!verdict) {
    throw new Error(`Unknown AssistivePolicyFreshnessVerdict ${verdictRef}.`);
  }
  return verdict;
}

function requirePublicationVerdict(
  runtime: AssistiveFreezeRuntime,
  verdictRef: string,
): AssistivePublicationFreshnessVerdict {
  const verdict = runtime.store.publicationFreshnessVerdicts.get(verdictRef);
  if (!verdict) {
    throw new Error(`Unknown AssistivePublicationFreshnessVerdict ${verdictRef}.`);
  }
  return verdict;
}

function requireInvalidation(
  runtime: AssistiveFreezeRuntime,
  invalidationRef: string,
): AssistiveSessionInvalidationRecord {
  const invalidation = runtime.store.sessionInvalidations.get(invalidationRef);
  if (!invalidation) {
    throw new Error(`Unknown AssistiveSessionInvalidationRecord ${invalidationRef}.`);
  }
  return invalidation;
}

function requireRecoveryBinding(
  runtime: AssistiveFreezeRuntime,
  bindingRef: string,
): AssistiveRecoveryDispositionBinding {
  const binding = runtime.store.recoveryBindings.get(bindingRef);
  if (!binding) {
    throw new Error(`Unknown AssistiveRecoveryDispositionBinding ${bindingRef}.`);
  }
  return binding;
}

function requireNonEmpty(value: unknown, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function fallbackModeForTrigger(triggerType: FreezeTriggerType): FreezeMode {
  if (triggerType === "trust_degraded") {
    return "read_only_provenance";
  }
  if (triggerType === "policy_drift" || triggerType === "publication_stale") {
    return "placeholder_only";
  }
  if (triggerType === "trust_quarantined" || triggerType === "incident_spike") {
    return "assistive_hidden";
  }
  return "shadow_only";
}

function freezeStateForTrigger(triggerType: FreezeTriggerType): FreezeRecordState {
  if (triggerType === "trust_degraded") {
    return "monitoring";
  }
  if (triggerType === "threshold_breach" || triggerType === "trust_quarantined") {
    return "frozen";
  }
  if (triggerType === "manual_freeze") {
    return "frozen";
  }
  return "shadow_only";
}

function resolveFreezeMode(
  command: ResolveFreezeDispositionCommand,
  freezeRecord: AssistiveReleaseFreezeRecord,
): FreezeMode {
  if (
    command.trustState === "quarantined" ||
    command.trustState === "frozen" ||
    freezeRecord.triggerType === "incident_spike"
  ) {
    return "assistive_hidden";
  }
  if (
    command.policyFreshnessState === "mismatched" ||
    command.policyFreshnessState === "blocked" ||
    command.publicationFreshnessState === "withdrawn" ||
    command.runtimePublicationState === "withdrawn"
  ) {
    return "placeholder_only";
  }
  if (command.trustState === "degraded") {
    return "read_only_provenance";
  }
  return freezeRecord.fallbackMode;
}

function resolvePublicationFreshness(
  command: ValidatePublicationFreshnessCommand,
  driftedRefs: readonly string[],
): PublicationFreshnessState {
  if (
    command.surfacePublicationState === "withdrawn" ||
    command.runtimePublicationState === "withdrawn"
  ) {
    return "withdrawn";
  }
  if (
    command.surfacePublicationState === "missing" ||
    command.runtimePublicationState === "missing"
  ) {
    return "missing";
  }
  if (
    command.surfacePublicationState === "blocked" ||
    command.runtimePublicationState === "blocked"
  ) {
    return "blocked";
  }
  if (command.surfacePublicationState === "stale" || command.runtimePublicationState === "stale") {
    return "stale";
  }
  if (driftedRefs.length > 0) {
    return "mismatched";
  }
  return "current";
}

function staleActionsForTrigger(triggerType: SessionInvalidationTrigger): AssistiveAction[] {
  const alwaysBlocked: AssistiveAction[] = ["accept", "insert", "export", "completion_adjacent"];
  if (
    triggerType === "policy_bundle_mismatch" ||
    triggerType === "publication_drift" ||
    triggerType === "runtime_publication_drift" ||
    triggerType === "incident_linked"
  ) {
    return [...alwaysBlocked, "regenerate"];
  }
  return alwaysBlocked;
}

function actionabilityBlockers(
  requestedAction: AssistiveAction,
  freezeRecord?: AssistiveReleaseFreezeRecord,
  disposition?: AssistiveFreezeDisposition,
  policyVerdict?: AssistivePolicyFreshnessVerdict,
  publicationVerdict?: AssistivePublicationFreshnessVerdict,
  invalidation?: AssistiveSessionInvalidationRecord,
  recoveryBinding?: AssistiveRecoveryDispositionBinding,
): string[] {
  const blockers: string[] = [];
  if (freezeRecord && freezeRecord.freezeState !== "released") {
    blockers.push(`freeze_state_${freezeRecord.freezeState}`);
  }
  if (policyVerdict?.invalidatesActionability) {
    blockers.push(...policyVerdict.blockingReasonCodes);
  }
  if (publicationVerdict?.invalidatesActionability) {
    blockers.push(...publicationVerdict.blockingReasonCodes);
  }
  if (invalidation?.staleActionBlockers.includes(requestedAction)) {
    blockers.push(`session_invalidated_for_${requestedAction}`);
  }
  if (recoveryBinding && recoveryBinding.bindingState !== "bound") {
    blockers.push(...recoveryBinding.blockingReasonCodes);
  }
  if (disposition) {
    const suppressed =
      (requestedAction === "accept" && disposition.suppressAccept) ||
      (requestedAction === "insert" && disposition.suppressInsert) ||
      (requestedAction === "regenerate" && disposition.suppressRegenerate) ||
      (requestedAction === "export" && disposition.suppressExport) ||
      (requestedAction === "completion_adjacent" && disposition.suppressCompletionAdjacent);
    if (suppressed) {
      blockers.push(`freeze_disposition_suppresses_${requestedAction}`);
    }
  }
  return unique(blockers);
}

function freezeSliceKey(
  watchTupleHash: string,
  routeFamilyRef: string,
  audienceTier: string,
): string {
  return `${watchTupleHash}:${routeFamilyRef}:${audienceTier}`;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
