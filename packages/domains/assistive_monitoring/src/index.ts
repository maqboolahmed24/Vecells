import { createHash } from "node:crypto";

export type ISODateString = string;

export type AssistiveMonitoringActorRole =
  | "shadow_comparison_runner"
  | "drift_detection_orchestrator"
  | "fairness_slice_metric_service"
  | "release_guard_threshold_service"
  | "incident_link_service"
  | "watch_tuple_registry"
  | "trust_projection_engine"
  | "current_posture_resolver"
  | "clinical_safety_lead"
  | "system";

export type DetectorType =
  | "representation_mmd"
  | "output_js"
  | "performance_delta"
  | "calibration_gap"
  | "fairness_gap";
export type DriftSeverity = "none" | "watch" | "warning" | "critical";
export type TriggerState = "clear" | "watch" | "warn" | "block";
export type MetricLevel = "visible" | "insert" | "commit" | "release";
export type MetricDirection = "higher_is_better" | "lower_is_better";
export type BiasActionState = "insufficient_evidence" | "watch" | "warn" | "block";
export type IncidentSeverity = "low" | "moderate" | "high" | "critical";
export type InvestigationState = "open" | "investigating" | "mitigated" | "closed";
export type SurfacePublicationState = "published" | "stale" | "conflict" | "withdrawn" | "blocked";
export type RuntimePublicationState = "current" | "stale" | "withdrawn" | "blocked" | "missing";
export type KillSwitchState = "inactive" | "shadow_only" | "blocked" | "withdrawn";
export type FreezeState = "none" | "monitoring" | "frozen" | "shadow_only" | "released";
export type EvidenceState = "complete" | "stale" | "missing" | "blocked";
export type DisclosureFenceState = "healthy" | "degraded" | "failed" | "missing";
export type ThresholdState = "green" | "warn" | "block";
export type TrustState = "trusted" | "degraded" | "quarantined" | "shadow_only" | "frozen";
export type VisibilityEligibilityState = "visible" | "observe_only" | "blocked";
export type InsertEligibilityState = "enabled" | "observe_only" | "blocked";
export type ApprovalEligibilityState = "single_review" | "dual_review" | "blocked";
export type RolloutCeilingState = "shadow_only" | "visible" | "observe_only" | "blocked";
export type FallbackMode =
  | "shadow_only"
  | "observe_only"
  | "read_only_provenance"
  | "placeholder_only"
  | "assistive_hidden";
export type SliceMembershipState = "in_slice" | "out_of_slice" | "unknown" | "superseded";
export type RolloutRung =
  | "shadow_only"
  | "visible_summary"
  | "visible_insert"
  | "visible_commit"
  | "frozen"
  | "withdrawn";
export type RenderPosture = "shadow_only" | "visible" | "observe_only" | "blocked";
export type InsertPosture = "enabled" | "observe_only" | "blocked";
export type ApprovalPosture = "single_review" | "dual_review" | "blocked";
export type PolicyState = "exact" | "stale" | "blocked";
export type PublicationState = "published" | "stale" | "withdrawn" | "blocked";
export type VerdictState = "current" | "stale" | "superseded" | "blocked";
export type PostureState = "current" | "observe_only" | "shadow_only" | "blocked";

export const ASSISTIVE_MONITORING_INVARIANT_MARKERS = {
  watch_tuple_pins_model_prompt_policy_runtime: "watch_tuple_pins_model_prompt_policy_runtime",
  watch_tuple_immutable: "watch_tuple_immutable",
  interval_aware_thresholds: "interval_aware_thresholds",
  drift_requires_effect_and_evidence: "drift_requires_effect_and_evidence",
  fairness_small_slices_not_healthy: "fairness_small_slices_not_healthy",
  trust_projection_monotonic_penalty: "trust_projection_monotonic_penalty",
  current_posture_fail_closed: "current_posture_fail_closed",
  kill_switch_current_state_not_history: "kill_switch_current_state_not_history",
  incident_links_downgrade_trust: "incident_links_downgrade_trust",
  monitoring_phi_safe_refs_only: "monitoring_phi_safe_refs_only",
  route_cohort_posture_authoritative: "route_cohort_posture_authoritative",
  missing_visible_evidence_shadow_only: "missing_visible_evidence_shadow_only",
} as const;

export interface AssistiveMonitoringActorContext {
  actorRef: string;
  actorRole: AssistiveMonitoringActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface AssistiveMonitoringAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: AssistiveMonitoringActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface ShadowComparisonRun {
  comparisonRunId: string;
  assistiveSessionRef: string;
  humanOutcomeRef: string;
  modelOutcomeRef: string;
  deltaMetricsRef: string;
  overrideDispositionRef?: string;
  incidentOutcomeRef?: string;
  decisionLatencyMs: number;
  evidenceLevel: "offline_gold" | "live_shadow" | "post_visible";
  routeFamilyRef: string;
  tenantRef: string;
  releaseCohortRef: string;
  watchTupleHash: string;
  metricWindowRef: string;
  recordedAt: ISODateString;
}

export interface DriftSignal {
  driftSignalId: string;
  capabilityCode: string;
  watchTupleHash: string;
  metricCode: string;
  segmentKey: string;
  detectorType: DetectorType;
  effectSize: number;
  evidenceValue: number;
  thresholdRef?: string;
  minimumEffectSize: number;
  evidenceBoundary: number;
  observedAt: ISODateString;
  severity: DriftSeverity;
  triggerState: TriggerState;
}

export interface BiasSliceMetric {
  sliceMetricId: string;
  capabilityCode: string;
  watchTupleHash: string;
  sliceDefinition: string;
  clinicallyComparableStratumRef: string;
  metricCode: string;
  metricDirection: MetricDirection;
  numerator: number;
  denominator: number;
  posteriorMean: number;
  intervalLow: number;
  intervalHigh: number;
  effectiveSampleSize: number;
  referenceSliceRef: string;
  metricSet: string;
  windowRef: string;
  thresholdRef?: string;
  actionState: BiasActionState;
}

export interface ReleaseGuardThreshold {
  thresholdId: string;
  capabilityCode: string;
  metricCode: string;
  metricLevel: MetricLevel;
  targetRiskAlpha: number;
  minimumSampleSize: number;
  intervalMethodRef: "wilson_95" | "beta_binomial_95";
  sequentialDetectorPolicyRef: string;
  warningLevel: number;
  blockLevel: number;
  effectSizeFloor: number;
  evidenceBoundary: number;
  metricDirection: MetricDirection;
  penaltyWeight: number;
  thresholdState: "active" | "superseded" | "retired";
  createdAt: ISODateString;
}

export interface AssistiveIncidentLink {
  incidentLinkId: string;
  assistiveSessionRef: string;
  watchTupleHash: string;
  incidentSystemRef: string;
  severity: IncidentSeverity;
  investigationState: InvestigationState;
  disclosureFenceFailure: boolean;
  linkedAt: ISODateString;
}

export interface AssistiveCapabilityWatchTuple {
  assistiveCapabilityWatchTupleId: string;
  capabilityCode: string;
  releaseCandidateRef: string;
  rolloutLadderPolicyRef: string;
  modelVersionRef: string;
  promptBundleHash: string;
  policyBundleRef: string;
  releaseCohortRef: string;
  surfaceRouteContractRefs: readonly string[];
  runtimePublicationBundleRef: string;
  calibrationBundleRef: string;
  uncertaintySelectorVersionRef: string;
  conformalBundleRef: string;
  thresholdSetRef: string;
  routeContractTupleHash: string;
  watchTupleHash: string;
  tupleState: "current" | "superseded" | "withdrawn";
  createdAt: ISODateString;
}

export interface TrustPenaltyComponent {
  code: string;
  sourceRef: string;
  severity: number;
  weight: number;
  normalizedPenalty: number;
}

export interface AssistiveCapabilityTrustProjection {
  assistiveCapabilityTrustProjectionId: string;
  watchTupleHash: string;
  capabilityCode: string;
  releaseCandidateRef: string;
  rolloutLadderPolicyRef: string;
  audienceTier: string;
  assuranceSliceTrustRefs: readonly string[];
  incidentRateRef?: string;
  surfacePublicationState: SurfacePublicationState;
  runtimePublicationBundleRef: string;
  runtimePublicationState: RuntimePublicationState;
  assistiveKillSwitchStateRef?: string;
  assistiveKillSwitchState: KillSwitchState;
  releaseFreezeRecordRef?: string;
  freezeState: FreezeState;
  freezeDispositionRef?: string;
  releaseRecoveryDispositionRef: string;
  trustScore: number;
  trustPenaltyRef: string;
  trustPenaltyComponents: readonly TrustPenaltyComponent[];
  thresholdState: ThresholdState;
  trustState: TrustState;
  visibilityEligibilityState: VisibilityEligibilityState;
  insertEligibilityState: InsertEligibilityState;
  approvalEligibilityState: ApprovalEligibilityState;
  rolloutCeilingState: RolloutCeilingState;
  fallbackMode: FallbackMode;
  blockingReasonCodes: readonly string[];
  thresholdBreachRefs: readonly string[];
  incidentLinkRefs: readonly string[];
  evaluatedAt: ISODateString;
}

export interface AssistiveCapabilityRolloutVerdict {
  assistiveCapabilityRolloutVerdictId: string;
  capabilityCode: string;
  watchTupleHash: string;
  releaseCandidateRef: string;
  rolloutSliceContractRef: string;
  routeFamilyRef: string;
  audienceTier: string;
  releaseCohortRef: string;
  sliceMembershipState: SliceMembershipState;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  trustProjectionRef: string;
  releaseFreezeRecordRef?: string;
  freezeDispositionRef?: string;
  policyState: PolicyState;
  publicationState: PublicationState;
  shadowEvidenceState: EvidenceState;
  visibleEvidenceState: EvidenceState;
  insertEvidenceState: EvidenceState;
  commitEvidenceState: EvidenceState;
  rolloutRung: RolloutRung;
  renderPosture: RenderPosture;
  insertPosture: InsertPosture;
  approvalPosture: ApprovalPosture;
  fallbackMode: FallbackMode;
  verdictState: VerdictState;
  blockingReasonCodes: readonly string[];
  evaluatedAt: ISODateString;
}

export interface AssistiveCurrentPosture {
  currentPostureId: string;
  capabilityCode: string;
  watchTupleHash: string;
  routeFamilyRef: string;
  audienceTier: string;
  trustProjectionRef: string;
  rolloutVerdictRef: string;
  trustState: TrustState;
  postureState: PostureState;
  visibilityCeiling: VisibilityEligibilityState;
  insertCeiling: InsertEligibilityState;
  approvalCeiling: ApprovalEligibilityState;
  renderPosture: RenderPosture;
  insertPosture: InsertPosture;
  approvalPosture: ApprovalPosture;
  fallbackMode: FallbackMode;
  thresholdBreachRefs: readonly string[];
  incidentLinkRefs: readonly string[];
  blockingReasonCodes: readonly string[];
  resolvedAt: ISODateString;
}

export interface AssistiveMonitoringStore {
  shadowComparisonRuns: Map<string, ShadowComparisonRun>;
  driftSignals: Map<string, DriftSignal>;
  biasSliceMetrics: Map<string, BiasSliceMetric>;
  releaseGuardThresholds: Map<string, ReleaseGuardThreshold>;
  incidentLinks: Map<string, AssistiveIncidentLink>;
  watchTuples: Map<string, AssistiveCapabilityWatchTuple>;
  trustProjections: Map<string, AssistiveCapabilityTrustProjection>;
  rolloutVerdicts: Map<string, AssistiveCapabilityRolloutVerdict>;
  currentPostures: Map<string, AssistiveCurrentPosture>;
  auditRecords: AssistiveMonitoringAuditRecord[];
  idempotencyKeys: Map<string, string>;
  watchTupleByHash: Map<string, string>;
  currentProjectionByWatchTuple: Map<string, string>;
  currentPostureByRouteCohort: Map<string, string>;
}

export interface AssistiveMonitoringClock {
  now(): ISODateString;
}

export interface AssistiveMonitoringIdGenerator {
  next(prefix: string): string;
}

export interface AssistiveMonitoringRuntime {
  store: AssistiveMonitoringStore;
  clock: AssistiveMonitoringClock;
  idGenerator: AssistiveMonitoringIdGenerator;
}

export interface RecordShadowComparisonRunCommand {
  comparisonRunId?: string;
  assistiveSessionRef: string;
  humanOutcomeRef: string;
  modelOutcomeRef: string;
  deltaMetricsRef: string;
  overrideDispositionRef?: string;
  incidentOutcomeRef?: string;
  decisionLatencyMs: number;
  evidenceLevel: ShadowComparisonRun["evidenceLevel"];
  routeFamilyRef: string;
  tenantRef: string;
  releaseCohortRef: string;
  watchTupleHash: string;
  metricWindowRef: string;
  idempotencyKey?: string;
}

export interface RegisterReleaseGuardThresholdCommand {
  thresholdId?: string;
  capabilityCode: string;
  metricCode: string;
  metricLevel: MetricLevel;
  targetRiskAlpha: number;
  minimumSampleSize: number;
  intervalMethodRef: "wilson_95" | "beta_binomial_95";
  sequentialDetectorPolicyRef: string;
  warningLevel: number;
  blockLevel: number;
  effectSizeFloor?: number;
  evidenceBoundary?: number;
  metricDirection: MetricDirection;
  penaltyWeight?: number;
  idempotencyKey?: string;
}

export interface RecordDriftSignalCommand {
  driftSignalId?: string;
  capabilityCode: string;
  watchTupleHash: string;
  metricCode: string;
  segmentKey: string;
  detectorType: DetectorType;
  effectSize: number;
  evidenceValue: number;
  thresholdRef?: string;
  observedAt?: ISODateString;
  idempotencyKey?: string;
}

export interface RecordBiasSliceMetricCommand {
  sliceMetricId?: string;
  capabilityCode: string;
  watchTupleHash: string;
  sliceDefinition: string;
  clinicallyComparableStratumRef: string;
  metricCode: string;
  metricDirection: MetricDirection;
  numerator: number;
  denominator: number;
  referenceSliceRef: string;
  metricSet: string;
  windowRef: string;
  thresholdRef?: string;
  priorAlpha?: number;
  priorBeta?: number;
  idempotencyKey?: string;
}

export interface LinkIncidentCommand {
  incidentLinkId?: string;
  assistiveSessionRef: string;
  watchTupleHash: string;
  incidentSystemRef: string;
  severity: IncidentSeverity;
  investigationState: InvestigationState;
  disclosureFenceFailure?: boolean;
  idempotencyKey?: string;
}

export interface RegisterWatchTupleCommand {
  assistiveCapabilityWatchTupleId?: string;
  capabilityCode: string;
  releaseCandidateRef: string;
  rolloutLadderPolicyRef: string;
  modelVersionRef: string;
  promptBundleHash: string;
  policyBundleRef: string;
  releaseCohortRef: string;
  surfaceRouteContractRefs: readonly string[];
  runtimePublicationBundleRef: string;
  calibrationBundleRef: string;
  uncertaintySelectorVersionRef: string;
  conformalBundleRef: string;
  thresholdSetRef: string;
  watchTupleHash?: string;
  idempotencyKey?: string;
}

export interface MaterializeTrustProjectionCommand {
  assistiveCapabilityTrustProjectionId?: string;
  watchTupleHash: string;
  audienceTier: string;
  assuranceSliceTrustRefs: readonly string[];
  incidentRateRef?: string;
  surfacePublicationState: SurfacePublicationState;
  runtimePublicationBundleRef: string;
  runtimePublicationState: RuntimePublicationState;
  assistiveKillSwitchStateRef?: string;
  assistiveKillSwitchState: KillSwitchState;
  releaseFreezeRecordRef?: string;
  freezeState: FreezeState;
  freezeDispositionRef?: string;
  releaseRecoveryDispositionRef: string;
  driftSignalRefs?: readonly string[];
  biasSliceMetricRefs?: readonly string[];
  incidentLinkRefs?: readonly string[];
  calibrationEvidenceState: EvidenceState;
  uncertaintyEvidenceState: EvidenceState;
  outcomeEvidenceState: EvidenceState;
  visibleEvidenceState: EvidenceState;
  disclosureFenceState: DisclosureFenceState;
  tauTrusted?: number;
  tauQuarantine?: number;
  tauVisible?: number;
  tauInsert?: number;
  idempotencyKey?: string;
}

export interface ResolveCurrentPostureCommand {
  currentPostureId?: string;
  trustProjectionRef: string;
  rolloutSliceContractRef: string;
  routeFamilyRef: string;
  audienceTier: string;
  releaseCohortRef: string;
  sliceMembershipState: SliceMembershipState;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  policyState: PolicyState;
  publicationState: PublicationState;
  shadowEvidenceState: EvidenceState;
  visibleEvidenceState: EvidenceState;
  insertEvidenceState: EvidenceState;
  commitEvidenceState: EvidenceState;
  rolloutRung: RolloutRung;
  fallbackMode?: FallbackMode;
  idempotencyKey?: string;
}

export class ShadowComparisonRunService {
  public constructor(private readonly runtime: AssistiveMonitoringRuntime) {}

  public recordShadowComparisonRun(
    command: RecordShadowComparisonRunCommand,
    actor: AssistiveMonitoringActorContext,
  ): ShadowComparisonRun {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.shadowComparisonRuns,
      () => {
        requireWatchTuple(this.runtime, command.watchTupleHash);
        requireNonEmpty(command.deltaMetricsRef, "deltaMetricsRef");
        if (command.decisionLatencyMs < 0) {
          throw new Error("decisionLatencyMs must be non-negative.");
        }
        const runHash = stableAssistiveMonitoringHash({
          assistiveSessionRef: command.assistiveSessionRef,
          humanOutcomeRef: command.humanOutcomeRef,
          modelOutcomeRef: command.modelOutcomeRef,
          deltaMetricsRef: command.deltaMetricsRef,
          evidenceLevel: command.evidenceLevel,
          metricWindowRef: command.metricWindowRef,
          watchTupleHash: command.watchTupleHash,
        });
        const run: ShadowComparisonRun = {
          comparisonRunId: command.comparisonRunId ?? `shadow-comparison-run:${runHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          humanOutcomeRef: command.humanOutcomeRef,
          modelOutcomeRef: command.modelOutcomeRef,
          deltaMetricsRef: command.deltaMetricsRef,
          overrideDispositionRef: command.overrideDispositionRef,
          incidentOutcomeRef: command.incidentOutcomeRef,
          decisionLatencyMs: command.decisionLatencyMs,
          evidenceLevel: command.evidenceLevel,
          routeFamilyRef: command.routeFamilyRef,
          tenantRef: command.tenantRef,
          releaseCohortRef: command.releaseCohortRef,
          watchTupleHash: command.watchTupleHash,
          metricWindowRef: command.metricWindowRef,
          recordedAt: this.runtime.clock.now(),
        };
        this.runtime.store.shadowComparisonRuns.set(run.comparisonRunId, run);
        recordAudit(
          this.runtime,
          "ShadowComparisonRunService",
          "recordShadowComparisonRun",
          actor,
          run.comparisonRunId,
          "accepted",
          [ASSISTIVE_MONITORING_INVARIANT_MARKERS.monitoring_phi_safe_refs_only],
        );
        return run;
      },
    );
  }
}

export class ReleaseGuardThresholdService {
  public constructor(private readonly runtime: AssistiveMonitoringRuntime) {}

  public registerThreshold(
    command: RegisterReleaseGuardThresholdCommand,
    actor: AssistiveMonitoringActorContext,
  ): ReleaseGuardThreshold {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.releaseGuardThresholds,
      () => {
        if (command.minimumSampleSize <= 0) {
          throw new Error("minimumSampleSize must be positive.");
        }
        for (const [field, value] of [
          ["targetRiskAlpha", command.targetRiskAlpha],
          ["warningLevel", command.warningLevel],
          ["blockLevel", command.blockLevel],
          ["penaltyWeight", command.penaltyWeight ?? 1],
        ] as const) {
          if (value < 0 || value > 1) {
            throw new Error(`${field} must be between 0 and 1.`);
          }
        }
        const thresholdHash = stableAssistiveMonitoringHash({
          capabilityCode: command.capabilityCode,
          metricCode: command.metricCode,
          metricLevel: command.metricLevel,
          targetRiskAlpha: command.targetRiskAlpha,
          minimumSampleSize: command.minimumSampleSize,
          intervalMethodRef: command.intervalMethodRef,
          sequentialDetectorPolicyRef: command.sequentialDetectorPolicyRef,
          warningLevel: command.warningLevel,
          blockLevel: command.blockLevel,
          metricDirection: command.metricDirection,
        });
        const threshold: ReleaseGuardThreshold = {
          thresholdId: command.thresholdId ?? `release-guard-threshold:${thresholdHash}`,
          capabilityCode: command.capabilityCode,
          metricCode: command.metricCode,
          metricLevel: command.metricLevel,
          targetRiskAlpha: command.targetRiskAlpha,
          minimumSampleSize: command.minimumSampleSize,
          intervalMethodRef: command.intervalMethodRef,
          sequentialDetectorPolicyRef: command.sequentialDetectorPolicyRef,
          warningLevel: command.warningLevel,
          blockLevel: command.blockLevel,
          effectSizeFloor: command.effectSizeFloor ?? command.warningLevel,
          evidenceBoundary: command.evidenceBoundary ?? 0.8,
          metricDirection: command.metricDirection,
          penaltyWeight: command.penaltyWeight ?? 1,
          thresholdState: "active",
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.releaseGuardThresholds.set(threshold.thresholdId, threshold);
        recordAudit(
          this.runtime,
          "ReleaseGuardThresholdService",
          "registerThreshold",
          actor,
          threshold.thresholdId,
          "accepted",
          [ASSISTIVE_MONITORING_INVARIANT_MARKERS.interval_aware_thresholds],
        );
        return threshold;
      },
    );
  }
}

export class AssistiveDriftDetectionOrchestrator {
  public constructor(private readonly runtime: AssistiveMonitoringRuntime) {}

  public recordDriftSignal(
    command: RecordDriftSignalCommand,
    actor: AssistiveMonitoringActorContext,
  ): DriftSignal {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.driftSignals,
      () => {
        requireWatchTuple(this.runtime, command.watchTupleHash);
        const threshold = command.thresholdRef
          ? requireThreshold(this.runtime, command.thresholdRef)
          : undefined;
        const minimumEffectSize = threshold?.effectSizeFloor ?? 0.05;
        const evidenceBoundary = threshold?.evidenceBoundary ?? 0.8;
        const hasEffect = Math.abs(command.effectSize) >= minimumEffectSize;
        const hasEvidence = command.evidenceValue >= evidenceBoundary;
        const triggerState = driftTriggerState(
          command.effectSize,
          hasEffect,
          hasEvidence,
          threshold,
        );
        const severity = driftSeverityFromTrigger(triggerState);
        const signalHash = stableAssistiveMonitoringHash({
          capabilityCode: command.capabilityCode,
          watchTupleHash: command.watchTupleHash,
          metricCode: command.metricCode,
          segmentKey: command.segmentKey,
          detectorType: command.detectorType,
          effectSize: command.effectSize,
          evidenceValue: command.evidenceValue,
          thresholdRef: command.thresholdRef,
          observedAt: command.observedAt ?? this.runtime.clock.now(),
        });
        const signal: DriftSignal = {
          driftSignalId: command.driftSignalId ?? `drift-signal:${signalHash}`,
          capabilityCode: command.capabilityCode,
          watchTupleHash: command.watchTupleHash,
          metricCode: command.metricCode,
          segmentKey: command.segmentKey,
          detectorType: command.detectorType,
          effectSize: command.effectSize,
          evidenceValue: command.evidenceValue,
          thresholdRef: command.thresholdRef,
          minimumEffectSize,
          evidenceBoundary,
          observedAt: command.observedAt ?? this.runtime.clock.now(),
          severity,
          triggerState,
        };
        this.runtime.store.driftSignals.set(signal.driftSignalId, signal);
        recordAudit(
          this.runtime,
          "AssistiveDriftDetectionOrchestrator",
          "recordDriftSignal",
          actor,
          signal.driftSignalId,
          "accepted",
          [ASSISTIVE_MONITORING_INVARIANT_MARKERS.drift_requires_effect_and_evidence],
        );
        return signal;
      },
    );
  }
}

export class FairnessSliceMetricService {
  public constructor(private readonly runtime: AssistiveMonitoringRuntime) {}

  public recordSliceMetric(
    command: RecordBiasSliceMetricCommand,
    actor: AssistiveMonitoringActorContext,
  ): BiasSliceMetric {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.biasSliceMetrics,
      () => {
        requireWatchTuple(this.runtime, command.watchTupleHash);
        if (command.denominator <= 0) {
          throw new Error("denominator must be positive.");
        }
        if (command.numerator < 0 || command.numerator > command.denominator) {
          throw new Error("numerator must be between 0 and denominator.");
        }
        const threshold = command.thresholdRef
          ? requireThreshold(this.runtime, command.thresholdRef)
          : undefined;
        const interval = wilsonInterval(command.numerator, command.denominator);
        const priorAlpha = command.priorAlpha ?? 0.5;
        const priorBeta = command.priorBeta ?? 0.5;
        const posteriorMean =
          (command.numerator + priorAlpha) / (command.denominator + priorAlpha + priorBeta);
        const actionState = fairnessActionState(
          command.metricDirection,
          interval,
          command.denominator,
          threshold,
        );
        const metricHash = stableAssistiveMonitoringHash({
          capabilityCode: command.capabilityCode,
          watchTupleHash: command.watchTupleHash,
          sliceDefinition: command.sliceDefinition,
          clinicallyComparableStratumRef: command.clinicallyComparableStratumRef,
          metricCode: command.metricCode,
          numerator: command.numerator,
          denominator: command.denominator,
          windowRef: command.windowRef,
          thresholdRef: command.thresholdRef,
        });
        const metric: BiasSliceMetric = {
          sliceMetricId: command.sliceMetricId ?? `bias-slice-metric:${metricHash}`,
          capabilityCode: command.capabilityCode,
          watchTupleHash: command.watchTupleHash,
          sliceDefinition: command.sliceDefinition,
          clinicallyComparableStratumRef: command.clinicallyComparableStratumRef,
          metricCode: command.metricCode,
          metricDirection: command.metricDirection,
          numerator: command.numerator,
          denominator: command.denominator,
          posteriorMean: round(posteriorMean),
          intervalLow: interval.low,
          intervalHigh: interval.high,
          effectiveSampleSize: command.denominator,
          referenceSliceRef: command.referenceSliceRef,
          metricSet: command.metricSet,
          windowRef: command.windowRef,
          thresholdRef: command.thresholdRef,
          actionState,
        };
        this.runtime.store.biasSliceMetrics.set(metric.sliceMetricId, metric);
        recordAudit(
          this.runtime,
          "FairnessSliceMetricService",
          "recordSliceMetric",
          actor,
          metric.sliceMetricId,
          "accepted",
          [
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.interval_aware_thresholds,
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.fairness_small_slices_not_healthy,
          ],
        );
        return metric;
      },
    );
  }
}

export class AssistiveIncidentLinkService {
  public constructor(private readonly runtime: AssistiveMonitoringRuntime) {}

  public linkIncident(
    command: LinkIncidentCommand,
    actor: AssistiveMonitoringActorContext,
  ): AssistiveIncidentLink {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.incidentLinks,
      () => {
        requireWatchTuple(this.runtime, command.watchTupleHash);
        const linkHash = stableAssistiveMonitoringHash({
          assistiveSessionRef: command.assistiveSessionRef,
          watchTupleHash: command.watchTupleHash,
          incidentSystemRef: command.incidentSystemRef,
          severity: command.severity,
          investigationState: command.investigationState,
        });
        const link: AssistiveIncidentLink = {
          incidentLinkId: command.incidentLinkId ?? `assistive-incident-link:${linkHash}`,
          assistiveSessionRef: command.assistiveSessionRef,
          watchTupleHash: command.watchTupleHash,
          incidentSystemRef: command.incidentSystemRef,
          severity: command.severity,
          investigationState: command.investigationState,
          disclosureFenceFailure: command.disclosureFenceFailure ?? false,
          linkedAt: this.runtime.clock.now(),
        };
        this.runtime.store.incidentLinks.set(link.incidentLinkId, link);
        recordAudit(
          this.runtime,
          "AssistiveIncidentLinkService",
          "linkIncident",
          actor,
          link.incidentLinkId,
          "accepted",
          [ASSISTIVE_MONITORING_INVARIANT_MARKERS.incident_links_downgrade_trust],
        );
        return link;
      },
    );
  }
}

export class AssistiveCapabilityWatchTupleRegistry {
  public constructor(private readonly runtime: AssistiveMonitoringRuntime) {}

  public registerWatchTuple(
    command: RegisterWatchTupleCommand,
    actor: AssistiveMonitoringActorContext,
  ): AssistiveCapabilityWatchTuple {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.watchTuples,
      () => {
        for (const [field, value] of Object.entries({
          capabilityCode: command.capabilityCode,
          releaseCandidateRef: command.releaseCandidateRef,
          rolloutLadderPolicyRef: command.rolloutLadderPolicyRef,
          modelVersionRef: command.modelVersionRef,
          promptBundleHash: command.promptBundleHash,
          policyBundleRef: command.policyBundleRef,
          releaseCohortRef: command.releaseCohortRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          calibrationBundleRef: command.calibrationBundleRef,
          uncertaintySelectorVersionRef: command.uncertaintySelectorVersionRef,
          conformalBundleRef: command.conformalBundleRef,
          thresholdSetRef: command.thresholdSetRef,
        })) {
          requireNonEmpty(value, field);
        }
        if (command.surfaceRouteContractRefs.length === 0) {
          throw new Error("surfaceRouteContractRefs must not be empty.");
        }
        const routeContractTupleHash = stableAssistiveMonitoringHash(
          command.surfaceRouteContractRefs,
        );
        const computedWatchTupleHash = stableAssistiveMonitoringHash({
          capabilityCode: command.capabilityCode,
          releaseCandidateRef: command.releaseCandidateRef,
          rolloutLadderPolicyRef: command.rolloutLadderPolicyRef,
          modelVersionRef: command.modelVersionRef,
          promptBundleHash: command.promptBundleHash,
          policyBundleRef: command.policyBundleRef,
          releaseCohortRef: command.releaseCohortRef,
          surfaceRouteContractRefs: command.surfaceRouteContractRefs,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          calibrationBundleRef: command.calibrationBundleRef,
          uncertaintySelectorVersionRef: command.uncertaintySelectorVersionRef,
          conformalBundleRef: command.conformalBundleRef,
          thresholdSetRef: command.thresholdSetRef,
        });
        const watchTupleHash = command.watchTupleHash ?? computedWatchTupleHash;
        const tupleId =
          command.assistiveCapabilityWatchTupleId ??
          `assistive-capability-watch-tuple:${watchTupleHash}`;
        const existing = this.runtime.store.watchTuples.get(tupleId);
        if (existing && existing.watchTupleHash !== watchTupleHash) {
          throw new Error(
            `${ASSISTIVE_MONITORING_INVARIANT_MARKERS.watch_tuple_immutable}: ${tupleId}`,
          );
        }
        const tuple: AssistiveCapabilityWatchTuple = {
          assistiveCapabilityWatchTupleId: tupleId,
          capabilityCode: command.capabilityCode,
          releaseCandidateRef: command.releaseCandidateRef,
          rolloutLadderPolicyRef: command.rolloutLadderPolicyRef,
          modelVersionRef: command.modelVersionRef,
          promptBundleHash: command.promptBundleHash,
          policyBundleRef: command.policyBundleRef,
          releaseCohortRef: command.releaseCohortRef,
          surfaceRouteContractRefs: [...command.surfaceRouteContractRefs],
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          calibrationBundleRef: command.calibrationBundleRef,
          uncertaintySelectorVersionRef: command.uncertaintySelectorVersionRef,
          conformalBundleRef: command.conformalBundleRef,
          thresholdSetRef: command.thresholdSetRef,
          routeContractTupleHash,
          watchTupleHash,
          tupleState: "current",
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.watchTuples.set(tuple.assistiveCapabilityWatchTupleId, tuple);
        this.runtime.store.watchTupleByHash.set(
          tuple.watchTupleHash,
          tuple.assistiveCapabilityWatchTupleId,
        );
        recordAudit(
          this.runtime,
          "AssistiveCapabilityWatchTupleRegistry",
          "registerWatchTuple",
          actor,
          tuple.assistiveCapabilityWatchTupleId,
          "accepted",
          [
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.watch_tuple_pins_model_prompt_policy_runtime,
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.watch_tuple_immutable,
          ],
        );
        return tuple;
      },
    );
  }
}

export class AssistiveCapabilityTrustProjectionEngine {
  public constructor(private readonly runtime: AssistiveMonitoringRuntime) {}

  public materializeTrustProjection(
    command: MaterializeTrustProjectionCommand,
    actor: AssistiveMonitoringActorContext,
  ): AssistiveCapabilityTrustProjection {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.trustProjections,
      () => {
        const tuple = requireWatchTuple(this.runtime, command.watchTupleHash);
        const driftSignals = (command.driftSignalRefs ?? []).map((ref) =>
          requireDriftSignal(this.runtime, ref),
        );
        const biasMetrics = (command.biasSliceMetricRefs ?? []).map((ref) =>
          requireBiasMetric(this.runtime, ref),
        );
        const incidentLinks = (command.incidentLinkRefs ?? []).map((ref) =>
          requireIncidentLink(this.runtime, ref),
        );
        const thresholdState = resolveThresholdState(driftSignals, biasMetrics);
        const thresholdBreachRefs = [
          ...driftSignals
            .filter((signal) => signal.triggerState === "warn" || signal.triggerState === "block")
            .map((signal) => signal.driftSignalId),
          ...biasMetrics
            .filter((metric) => metric.actionState === "warn" || metric.actionState === "block")
            .map((metric) => metric.sliceMetricId),
        ];
        const hardBlockers = hardBlockerCodes(command, thresholdState, incidentLinks);
        const evidenceBlockers = evidenceBlockerCodes(command);
        const penaltyComponents = trustPenaltyComponents(
          driftSignals,
          biasMetrics,
          incidentLinks,
          command,
        );
        const totalPenalty = penaltyComponents.reduce(
          (sum, component) => sum + component.normalizedPenalty,
          0,
        );
        const publicationCurrent = command.surfacePublicationState === "published";
        const runtimeCurrent =
          command.runtimePublicationState === "current" &&
          tuple.runtimePublicationBundleRef === command.runtimePublicationBundleRef;
        const noHardFreeze = command.freezeState !== "frozen";
        const hardBlocked = hardBlockers.length > 0 || thresholdState === "block";
        const trustScore =
          publicationCurrent && runtimeCurrent && noHardFreeze && !hardBlocked
            ? round(Math.exp(-totalPenalty))
            : 0;
        const tauTrusted = command.tauTrusted ?? 0.85;
        const tauQuarantine = command.tauQuarantine ?? 0.55;
        const tauVisible = command.tauVisible ?? 0.8;
        const tauInsert = command.tauInsert ?? 0.9;
        const trustState = resolveTrustState({
          trustScore,
          tauTrusted,
          tauQuarantine,
          thresholdState,
          hardBlockers,
          evidenceBlockers,
          freezeState: command.freezeState,
        });
        const visibilityEligibilityState = resolveVisibilityEligibility(
          trustState,
          trustScore,
          tauVisible,
          thresholdState,
          publicationCurrent,
          runtimeCurrent,
        );
        const insertEligibilityState = resolveInsertEligibility(
          trustState,
          trustScore,
          tauInsert,
          thresholdState,
        );
        const approvalEligibilityState =
          trustState === "trusted"
            ? "single_review"
            : trustState === "degraded"
              ? "dual_review"
              : "blocked";
        const rolloutCeilingState = rolloutCeilingFromTrust(trustState);
        const blockingReasonCodes = unique([...hardBlockers, ...evidenceBlockers]);
        const trustPenaltyRef = `trust-penalty:${stableAssistiveMonitoringHash(penaltyComponents)}`;
        const projectionHash = stableAssistiveMonitoringHash({
          watchTupleHash: command.watchTupleHash,
          audienceTier: command.audienceTier,
          surfacePublicationState: command.surfacePublicationState,
          runtimePublicationState: command.runtimePublicationState,
          assistiveKillSwitchState: command.assistiveKillSwitchState,
          freezeState: command.freezeState,
          thresholdState,
          trustScore,
          blockingReasonCodes,
        });
        const projection: AssistiveCapabilityTrustProjection = {
          assistiveCapabilityTrustProjectionId:
            command.assistiveCapabilityTrustProjectionId ??
            `assistive-capability-trust-projection:${projectionHash}`,
          watchTupleHash: command.watchTupleHash,
          capabilityCode: tuple.capabilityCode,
          releaseCandidateRef: tuple.releaseCandidateRef,
          rolloutLadderPolicyRef: tuple.rolloutLadderPolicyRef,
          audienceTier: command.audienceTier,
          assuranceSliceTrustRefs: [...command.assuranceSliceTrustRefs],
          incidentRateRef: command.incidentRateRef,
          surfacePublicationState: command.surfacePublicationState,
          runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
          runtimePublicationState: command.runtimePublicationState,
          assistiveKillSwitchStateRef: command.assistiveKillSwitchStateRef,
          assistiveKillSwitchState: command.assistiveKillSwitchState,
          releaseFreezeRecordRef: command.releaseFreezeRecordRef,
          freezeState: command.freezeState,
          freezeDispositionRef: command.freezeDispositionRef,
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          trustScore,
          trustPenaltyRef,
          trustPenaltyComponents: penaltyComponents,
          thresholdState,
          trustState,
          visibilityEligibilityState,
          insertEligibilityState,
          approvalEligibilityState,
          rolloutCeilingState,
          fallbackMode: fallbackModeFromTrust(trustState),
          blockingReasonCodes,
          thresholdBreachRefs,
          incidentLinkRefs: incidentLinks.map((link) => link.incidentLinkId),
          evaluatedAt: this.runtime.clock.now(),
        };
        this.runtime.store.trustProjections.set(
          projection.assistiveCapabilityTrustProjectionId,
          projection,
        );
        this.runtime.store.currentProjectionByWatchTuple.set(
          projection.watchTupleHash,
          projection.assistiveCapabilityTrustProjectionId,
        );
        recordAudit(
          this.runtime,
          "AssistiveCapabilityTrustProjectionEngine",
          "materializeTrustProjection",
          actor,
          projection.assistiveCapabilityTrustProjectionId,
          "accepted",
          [
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.trust_projection_monotonic_penalty,
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.kill_switch_current_state_not_history,
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.missing_visible_evidence_shadow_only,
          ],
        );
        return projection;
      },
    );
  }
}

export class AssistiveCurrentPostureResolver {
  public constructor(private readonly runtime: AssistiveMonitoringRuntime) {}

  public resolveCurrentPosture(
    command: ResolveCurrentPostureCommand,
    actor: AssistiveMonitoringActorContext,
  ): AssistiveCurrentPosture {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.currentPostures,
      () => {
        const projection = requireTrustProjection(this.runtime, command.trustProjectionRef);
        const tuple = requireWatchTuple(this.runtime, projection.watchTupleHash);
        const blockers = postureBlockers(command, projection);
        const renderPosture = resolveRenderPosture(command, projection, blockers);
        const insertPosture = resolveInsertPosture(command, projection, blockers);
        const approvalPosture = resolveApprovalPosture(command, projection, blockers);
        const verdictState = resolveVerdictState(command, projection, blockers);
        const verdictHash = stableAssistiveMonitoringHash({
          trustProjectionRef: command.trustProjectionRef,
          rolloutSliceContractRef: command.rolloutSliceContractRef,
          routeFamilyRef: command.routeFamilyRef,
          audienceTier: command.audienceTier,
          releaseCohortRef: command.releaseCohortRef,
          rolloutRung: command.rolloutRung,
          renderPosture,
          insertPosture,
          approvalPosture,
          blockers,
        });
        const verdict: AssistiveCapabilityRolloutVerdict = {
          assistiveCapabilityRolloutVerdictId: `assistive-capability-rollout-verdict:${verdictHash}`,
          capabilityCode: tuple.capabilityCode,
          watchTupleHash: tuple.watchTupleHash,
          releaseCandidateRef: tuple.releaseCandidateRef,
          rolloutSliceContractRef: command.rolloutSliceContractRef,
          routeFamilyRef: command.routeFamilyRef,
          audienceTier: command.audienceTier,
          releaseCohortRef: command.releaseCohortRef,
          sliceMembershipState: command.sliceMembershipState,
          surfaceRouteContractRef: command.surfaceRouteContractRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          trustProjectionRef: projection.assistiveCapabilityTrustProjectionId,
          releaseFreezeRecordRef: projection.releaseFreezeRecordRef,
          freezeDispositionRef: projection.freezeDispositionRef,
          policyState: command.policyState,
          publicationState: command.publicationState,
          shadowEvidenceState: command.shadowEvidenceState,
          visibleEvidenceState: command.visibleEvidenceState,
          insertEvidenceState: command.insertEvidenceState,
          commitEvidenceState: command.commitEvidenceState,
          rolloutRung: command.rolloutRung,
          renderPosture,
          insertPosture,
          approvalPosture,
          fallbackMode: command.fallbackMode ?? projection.fallbackMode,
          verdictState,
          blockingReasonCodes: blockers,
          evaluatedAt: this.runtime.clock.now(),
        };
        this.runtime.store.rolloutVerdicts.set(
          verdict.assistiveCapabilityRolloutVerdictId,
          verdict,
        );
        const postureState = postureStateFromVerdict(verdict, projection);
        const postureHash = stableAssistiveMonitoringHash({
          trustProjectionRef: projection.assistiveCapabilityTrustProjectionId,
          rolloutVerdictRef: verdict.assistiveCapabilityRolloutVerdictId,
          postureState,
        });
        const posture: AssistiveCurrentPosture = {
          currentPostureId: command.currentPostureId ?? `assistive-current-posture:${postureHash}`,
          capabilityCode: tuple.capabilityCode,
          watchTupleHash: tuple.watchTupleHash,
          routeFamilyRef: command.routeFamilyRef,
          audienceTier: command.audienceTier,
          trustProjectionRef: projection.assistiveCapabilityTrustProjectionId,
          rolloutVerdictRef: verdict.assistiveCapabilityRolloutVerdictId,
          trustState: projection.trustState,
          postureState,
          visibilityCeiling: projection.visibilityEligibilityState,
          insertCeiling: projection.insertEligibilityState,
          approvalCeiling: projection.approvalEligibilityState,
          renderPosture,
          insertPosture,
          approvalPosture,
          fallbackMode: verdict.fallbackMode,
          thresholdBreachRefs: [...projection.thresholdBreachRefs],
          incidentLinkRefs: [...projection.incidentLinkRefs],
          blockingReasonCodes: unique([...projection.blockingReasonCodes, ...blockers]),
          resolvedAt: this.runtime.clock.now(),
        };
        this.runtime.store.currentPostures.set(posture.currentPostureId, posture);
        this.runtime.store.currentPostureByRouteCohort.set(
          routeCohortKey(tuple.watchTupleHash, command.routeFamilyRef, command.audienceTier),
          posture.currentPostureId,
        );
        recordAudit(
          this.runtime,
          "AssistiveCurrentPostureResolver",
          "resolveCurrentPosture",
          actor,
          posture.currentPostureId,
          "accepted",
          [
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.current_posture_fail_closed,
            ASSISTIVE_MONITORING_INVARIANT_MARKERS.route_cohort_posture_authoritative,
          ],
        );
        return posture;
      },
    );
  }
}

export function createAssistiveMonitoringPlane(options?: {
  store?: AssistiveMonitoringStore;
  clock?: AssistiveMonitoringClock;
  idGenerator?: AssistiveMonitoringIdGenerator;
}) {
  const runtime: AssistiveMonitoringRuntime = {
    store: options?.store ?? createAssistiveMonitoringStore(),
    clock: options?.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options?.idGenerator ?? createSequentialIdGenerator(),
  };
  return {
    runtime,
    shadowComparisons: new ShadowComparisonRunService(runtime),
    driftDetection: new AssistiveDriftDetectionOrchestrator(runtime),
    fairnessMetrics: new FairnessSliceMetricService(runtime),
    thresholds: new ReleaseGuardThresholdService(runtime),
    incidentLinks: new AssistiveIncidentLinkService(runtime),
    watchTuples: new AssistiveCapabilityWatchTupleRegistry(runtime),
    trustProjections: new AssistiveCapabilityTrustProjectionEngine(runtime),
    currentPostures: new AssistiveCurrentPostureResolver(runtime),
  };
}

export function createAssistiveMonitoringStore(): AssistiveMonitoringStore {
  return {
    shadowComparisonRuns: new Map(),
    driftSignals: new Map(),
    biasSliceMetrics: new Map(),
    releaseGuardThresholds: new Map(),
    incidentLinks: new Map(),
    watchTuples: new Map(),
    trustProjections: new Map(),
    rolloutVerdicts: new Map(),
    currentPostures: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
    watchTupleByHash: new Map(),
    currentProjectionByWatchTuple: new Map(),
    currentPostureByRouteCohort: new Map(),
  };
}

export function stableAssistiveMonitoringHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex")
    .slice(0, 32);
}

export function wilsonInterval(successes: number, trials: number): { low: number; high: number } {
  if (trials <= 0) {
    return { low: 0, high: 1 };
  }
  const z = 1.96;
  const p = successes / trials;
  const denominator = 1 + (z * z) / trials;
  const center = p + (z * z) / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * trials)) / trials);
  return {
    low: round(Math.max(0, (center - margin) / denominator)),
    high: round(Math.min(1, (center + margin) / denominator)),
  };
}

function createSequentialIdGenerator(): AssistiveMonitoringIdGenerator {
  let counter = 0;
  return {
    next(prefix: string) {
      counter += 1;
      return `${prefix}:${counter}`;
    },
  };
}

function withIdempotency<T>(
  runtime: AssistiveMonitoringRuntime,
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
  runtime: AssistiveMonitoringRuntime,
  serviceName: string,
  action: string,
  actor: AssistiveMonitoringActorContext,
  subjectRef: string,
  outcome: AssistiveMonitoringAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("assistive-monitoring-audit"),
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

function requireWatchTuple(
  runtime: AssistiveMonitoringRuntime,
  watchTupleHash: string,
): AssistiveCapabilityWatchTuple {
  const tupleId = runtime.store.watchTupleByHash.get(watchTupleHash);
  const tuple = tupleId ? runtime.store.watchTuples.get(tupleId) : undefined;
  if (!tuple) {
    throw new Error(`Unknown AssistiveCapabilityWatchTuple ${watchTupleHash}.`);
  }
  return tuple;
}

function requireThreshold(
  runtime: AssistiveMonitoringRuntime,
  thresholdRef: string,
): ReleaseGuardThreshold {
  const threshold = runtime.store.releaseGuardThresholds.get(thresholdRef);
  if (!threshold) {
    throw new Error(`Unknown ReleaseGuardThreshold ${thresholdRef}.`);
  }
  return threshold;
}

function requireDriftSignal(runtime: AssistiveMonitoringRuntime, signalRef: string): DriftSignal {
  const signal = runtime.store.driftSignals.get(signalRef);
  if (!signal) {
    throw new Error(`Unknown DriftSignal ${signalRef}.`);
  }
  return signal;
}

function requireBiasMetric(
  runtime: AssistiveMonitoringRuntime,
  metricRef: string,
): BiasSliceMetric {
  const metric = runtime.store.biasSliceMetrics.get(metricRef);
  if (!metric) {
    throw new Error(`Unknown BiasSliceMetric ${metricRef}.`);
  }
  return metric;
}

function requireIncidentLink(
  runtime: AssistiveMonitoringRuntime,
  incidentLinkRef: string,
): AssistiveIncidentLink {
  const incident = runtime.store.incidentLinks.get(incidentLinkRef);
  if (!incident) {
    throw new Error(`Unknown AssistiveIncidentLink ${incidentLinkRef}.`);
  }
  return incident;
}

function requireTrustProjection(
  runtime: AssistiveMonitoringRuntime,
  projectionRef: string,
): AssistiveCapabilityTrustProjection {
  const projection = runtime.store.trustProjections.get(projectionRef);
  if (!projection) {
    throw new Error(`Unknown AssistiveCapabilityTrustProjection ${projectionRef}.`);
  }
  return projection;
}

function requireNonEmpty(value: string, label: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function driftTriggerState(
  effectSize: number,
  hasEffect: boolean,
  hasEvidence: boolean,
  threshold?: ReleaseGuardThreshold,
): TriggerState {
  if (!hasEffect && !hasEvidence) {
    return "clear";
  }
  if (!hasEffect || !hasEvidence) {
    return "watch";
  }
  const magnitude = Math.abs(effectSize);
  if (threshold && magnitude >= threshold.blockLevel) {
    return "block";
  }
  if (threshold && magnitude >= threshold.warningLevel) {
    return "warn";
  }
  return "watch";
}

function driftSeverityFromTrigger(triggerState: TriggerState): DriftSeverity {
  if (triggerState === "block") {
    return "critical";
  }
  if (triggerState === "warn") {
    return "warning";
  }
  if (triggerState === "watch") {
    return "watch";
  }
  return "none";
}

function fairnessActionState(
  direction: MetricDirection,
  interval: { low: number; high: number },
  effectiveSampleSize: number,
  threshold?: ReleaseGuardThreshold,
): BiasActionState {
  if (!threshold) {
    return "watch";
  }
  if (effectiveSampleSize < threshold.minimumSampleSize) {
    return "insufficient_evidence";
  }
  if (direction === "higher_is_better") {
    if (interval.low < threshold.blockLevel) {
      return "block";
    }
    if (interval.low < threshold.warningLevel) {
      return "warn";
    }
    return "watch";
  }
  if (interval.high > threshold.blockLevel) {
    return "block";
  }
  if (interval.high > threshold.warningLevel) {
    return "warn";
  }
  return "watch";
}

function resolveThresholdState(
  driftSignals: readonly DriftSignal[],
  biasMetrics: readonly BiasSliceMetric[],
): ThresholdState {
  if (
    driftSignals.some((signal) => signal.triggerState === "block") ||
    biasMetrics.some((metric) => metric.actionState === "block")
  ) {
    return "block";
  }
  if (
    driftSignals.some((signal) => signal.triggerState === "warn") ||
    biasMetrics.some(
      (metric) => metric.actionState === "warn" || metric.actionState === "insufficient_evidence",
    )
  ) {
    return "warn";
  }
  return "green";
}

function hardBlockerCodes(
  command: MaterializeTrustProjectionCommand,
  thresholdState: ThresholdState,
  incidentLinks: readonly AssistiveIncidentLink[],
): string[] {
  const blockers: string[] = [];
  if (command.surfacePublicationState !== "published") {
    blockers.push("surface_publication_not_published");
  }
  if (command.runtimePublicationState !== "current") {
    blockers.push("runtime_bundle_not_current");
  }
  if (
    command.assistiveKillSwitchState === "blocked" ||
    command.assistiveKillSwitchState === "withdrawn"
  ) {
    blockers.push("assistive_kill_switch_blocks_capability");
  }
  if (command.freezeState === "frozen") {
    blockers.push("release_freeze_active");
  }
  if (command.disclosureFenceState === "failed" || command.disclosureFenceState === "missing") {
    blockers.push("disclosure_fence_below_floor");
  }
  if (thresholdState === "block") {
    blockers.push("release_guard_threshold_block");
  }
  if (
    incidentLinks.some(
      (link) =>
        (link.severity === "high" || link.severity === "critical" || link.disclosureFenceFailure) &&
        link.investigationState !== "closed",
    )
  ) {
    blockers.push("active_high_severity_incident_link");
  }
  return unique(blockers);
}

function evidenceBlockerCodes(command: MaterializeTrustProjectionCommand): string[] {
  const blockers: string[] = [];
  for (const [code, state] of [
    ["calibration_evidence_incomplete", command.calibrationEvidenceState],
    ["uncertainty_evidence_incomplete", command.uncertaintyEvidenceState],
    ["outcome_evidence_incomplete", command.outcomeEvidenceState],
    ["visible_evidence_incomplete", command.visibleEvidenceState],
  ] as const) {
    if (state !== "complete") {
      blockers.push(code);
    }
  }
  return blockers;
}

function trustPenaltyComponents(
  driftSignals: readonly DriftSignal[],
  biasMetrics: readonly BiasSliceMetric[],
  incidentLinks: readonly AssistiveIncidentLink[],
  command: MaterializeTrustProjectionCommand,
): TrustPenaltyComponent[] {
  const components: TrustPenaltyComponent[] = [];
  for (const signal of driftSignals) {
    const severity =
      signal.triggerState === "block"
        ? 1
        : signal.triggerState === "warn"
          ? 0.6
          : signal.triggerState === "watch"
            ? 0.2
            : 0;
    if (severity > 0) {
      components.push({
        code: `drift:${signal.detectorType}:${signal.metricCode}`,
        sourceRef: signal.driftSignalId,
        severity,
        weight: 1,
        normalizedPenalty: round(severity),
      });
    }
  }
  for (const metric of biasMetrics) {
    const severity =
      metric.actionState === "block"
        ? 1
        : metric.actionState === "warn"
          ? 0.6
          : metric.actionState === "insufficient_evidence"
            ? 0.25
            : 0;
    if (severity > 0) {
      components.push({
        code: `fairness:${metric.metricCode}:${metric.sliceDefinition}`,
        sourceRef: metric.sliceMetricId,
        severity,
        weight: 1,
        normalizedPenalty: round(severity),
      });
    }
  }
  for (const incident of incidentLinks) {
    const severity =
      incident.severity === "critical"
        ? 1
        : incident.severity === "high"
          ? 0.8
          : incident.severity === "moderate"
            ? 0.4
            : 0.15;
    if (incident.investigationState !== "closed") {
      components.push({
        code: `incident:${incident.severity}`,
        sourceRef: incident.incidentLinkId,
        severity,
        weight: 1,
        normalizedPenalty: round(severity),
      });
    }
  }
  for (const [code, state] of [
    ["calibration", command.calibrationEvidenceState],
    ["uncertainty", command.uncertaintyEvidenceState],
    ["outcome", command.outcomeEvidenceState],
    ["visible", command.visibleEvidenceState],
  ] as const) {
    if (state !== "complete") {
      components.push({
        code: `staleness:${code}:${state}`,
        sourceRef: code,
        severity: state === "blocked" ? 1 : state === "missing" ? 0.8 : 0.5,
        weight: 1,
        normalizedPenalty: state === "blocked" ? 1 : state === "missing" ? 0.8 : 0.5,
      });
    }
  }
  if (command.disclosureFenceState === "degraded") {
    components.push({
      code: "disclosure_fence:degraded",
      sourceRef: "disclosure_fence",
      severity: 0.6,
      weight: 1,
      normalizedPenalty: 0.6,
    });
  }
  if (command.assistiveKillSwitchState === "shadow_only") {
    components.push({
      code: "kill_switch:shadow_only",
      sourceRef: command.assistiveKillSwitchStateRef ?? "current_kill_switch_state",
      severity: 0.8,
      weight: 1,
      normalizedPenalty: 0.8,
    });
  }
  return components;
}

function resolveTrustState(input: {
  trustScore: number;
  tauTrusted: number;
  tauQuarantine: number;
  thresholdState: ThresholdState;
  hardBlockers: readonly string[];
  evidenceBlockers: readonly string[];
  freezeState: FreezeState;
}): TrustState {
  if (input.freezeState === "frozen") {
    return "frozen";
  }
  if (input.evidenceBlockers.length > 0) {
    return "shadow_only";
  }
  if (
    input.hardBlockers.length > 0 ||
    input.thresholdState === "block" ||
    input.trustScore < input.tauQuarantine
  ) {
    return "quarantined";
  }
  if (input.trustScore >= input.tauTrusted) {
    return "trusted";
  }
  return "degraded";
}

function resolveVisibilityEligibility(
  trustState: TrustState,
  trustScore: number,
  tauVisible: number,
  thresholdState: ThresholdState,
  publicationCurrent: boolean,
  runtimeCurrent: boolean,
): VisibilityEligibilityState {
  if (
    trustState === "trusted" &&
    trustScore >= tauVisible &&
    thresholdState !== "block" &&
    publicationCurrent &&
    runtimeCurrent
  ) {
    return "visible";
  }
  if (trustState === "degraded") {
    return "observe_only";
  }
  return "blocked";
}

function resolveInsertEligibility(
  trustState: TrustState,
  trustScore: number,
  tauInsert: number,
  thresholdState: ThresholdState,
): InsertEligibilityState {
  if (trustState === "trusted" && trustScore >= tauInsert && thresholdState === "green") {
    return "enabled";
  }
  if (trustState === "trusted" || trustState === "degraded") {
    return "observe_only";
  }
  return "blocked";
}

function rolloutCeilingFromTrust(trustState: TrustState): RolloutCeilingState {
  if (trustState === "trusted") {
    return "visible";
  }
  if (trustState === "degraded") {
    return "observe_only";
  }
  if (trustState === "shadow_only") {
    return "shadow_only";
  }
  return "blocked";
}

function fallbackModeFromTrust(trustState: TrustState): FallbackMode {
  if (trustState === "trusted") {
    return "observe_only";
  }
  if (trustState === "degraded") {
    return "read_only_provenance";
  }
  if (trustState === "shadow_only") {
    return "shadow_only";
  }
  if (trustState === "frozen") {
    return "placeholder_only";
  }
  return "assistive_hidden";
}

function postureBlockers(
  command: ResolveCurrentPostureCommand,
  projection: AssistiveCapabilityTrustProjection,
): string[] {
  const blockers = [...projection.blockingReasonCodes];
  if (command.sliceMembershipState !== "in_slice") {
    blockers.push("rollout_slice_not_in_scope");
  }
  if (command.policyState !== "exact") {
    blockers.push("policy_state_not_exact");
  }
  if (command.publicationState !== "published") {
    blockers.push("publication_state_not_published");
  }
  if (command.shadowEvidenceState !== "complete") {
    blockers.push("shadow_evidence_incomplete");
  }
  if (
    command.visibleEvidenceState !== "complete" &&
    rungAtLeast(command.rolloutRung, "visible_summary")
  ) {
    blockers.push("visible_evidence_incomplete_for_rung");
  }
  if (
    command.insertEvidenceState !== "complete" &&
    rungAtLeast(command.rolloutRung, "visible_insert")
  ) {
    blockers.push("insert_evidence_incomplete_for_rung");
  }
  if (command.commitEvidenceState !== "complete" && command.rolloutRung === "visible_commit") {
    blockers.push("commit_evidence_incomplete_for_rung");
  }
  return unique(blockers);
}

function resolveRenderPosture(
  command: ResolveCurrentPostureCommand,
  projection: AssistiveCapabilityTrustProjection,
  blockers: readonly string[],
): RenderPosture {
  if (
    blockers.length === 0 &&
    rungAtLeast(command.rolloutRung, "visible_summary") &&
    projection.visibilityEligibilityState === "visible"
  ) {
    return "visible";
  }
  if (
    projection.trustState === "degraded" ||
    projection.visibilityEligibilityState === "observe_only"
  ) {
    return "observe_only";
  }
  if (command.shadowEvidenceState === "complete" && projection.trustState === "shadow_only") {
    return "shadow_only";
  }
  return "blocked";
}

function resolveInsertPosture(
  command: ResolveCurrentPostureCommand,
  projection: AssistiveCapabilityTrustProjection,
  blockers: readonly string[],
): InsertPosture {
  if (
    blockers.length === 0 &&
    rungAtLeast(command.rolloutRung, "visible_insert") &&
    projection.insertEligibilityState === "enabled"
  ) {
    return "enabled";
  }
  if (
    projection.insertEligibilityState === "observe_only" &&
    command.publicationState === "published"
  ) {
    return "observe_only";
  }
  return "blocked";
}

function resolveApprovalPosture(
  command: ResolveCurrentPostureCommand,
  projection: AssistiveCapabilityTrustProjection,
  blockers: readonly string[],
): ApprovalPosture {
  if (blockers.length === 0 && command.rolloutRung === "visible_commit") {
    return projection.approvalEligibilityState;
  }
  return "blocked";
}

function resolveVerdictState(
  command: ResolveCurrentPostureCommand,
  projection: AssistiveCapabilityTrustProjection,
  blockers: readonly string[],
): VerdictState {
  if (command.sliceMembershipState === "superseded") {
    return "superseded";
  }
  if (command.policyState === "stale" || command.publicationState === "stale") {
    return "stale";
  }
  if (
    projection.trustState === "quarantined" ||
    projection.trustState === "frozen" ||
    blockers.length > 0
  ) {
    return "blocked";
  }
  return "current";
}

function postureStateFromVerdict(
  verdict: AssistiveCapabilityRolloutVerdict,
  projection: AssistiveCapabilityTrustProjection,
): PostureState {
  if (verdict.renderPosture === "visible" && projection.trustState === "trusted") {
    return "current";
  }
  if (verdict.renderPosture === "observe_only") {
    return "observe_only";
  }
  if (verdict.renderPosture === "shadow_only") {
    return "shadow_only";
  }
  return "blocked";
}

function rungAtLeast(actual: RolloutRung, minimum: RolloutRung): boolean {
  const order: Record<RolloutRung, number> = {
    shadow_only: 0,
    visible_summary: 1,
    visible_insert: 2,
    visible_commit: 3,
    frozen: -1,
    withdrawn: -1,
  };
  return order[actual] >= order[minimum];
}

function routeCohortKey(
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

function round(value: number): number {
  return Number(value.toFixed(6));
}
