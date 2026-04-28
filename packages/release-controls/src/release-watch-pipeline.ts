import { stableDigest, type BuildProvenanceState } from "./build-provenance";
import {
  createRuntimePublicationSimulationHarness,
  type RuntimePublicationAuthorityVerdict,
} from "./runtime-publication";

export type ReleaseWatchTupleState = "proposed" | "active" | "stale" | "superseded" | "closed";
export type WaveObservationPolicyState = "armed" | "satisfied" | "blocked" | "superseded";
export type ReleaseWatchState =
  | "accepted"
  | "satisfied"
  | "blocked"
  | "stale"
  | "rollback_required";
export type ReleaseWatchRoutePostureState =
  | "converged"
  | "constrained"
  | "rollback_required"
  | "freeze_conflict";
export type ObservationWindowState = "open" | "extended" | "satisfied" | "expired" | "superseded";
export type WaveObservationProbeClass =
  | "publication_parity"
  | "provenance_verification"
  | "continuity_evidence"
  | "route_recovery_posture"
  | "assurance_slice_trust"
  | "synthetic_user_journey";
export type WaveObservationProbeState = "pending" | "passed" | "failed" | "stale";
export type ReleaseWatchRollbackTriggerClass =
  | "hard_parity_drift"
  | "trust_freeze_or_assurance_block"
  | "continuity_control_regression"
  | "critical_synthetic_journey_failure"
  | "route_publication_or_recovery_disposition_drift"
  | "manual_operator_approved";
export type ReleaseWatchRollbackTriggerState = "armed" | "clear" | "triggered";
export type ReleaseWatchRollbackReadinessState = "ready" | "constrained" | "blocked" | "stale";
export type ReleaseWatchActionType = "widen" | "pause" | "resume" | "rollback" | "close";
export type ReleaseWatchTimelineEventType =
  | "tuple_published"
  | "tuple_superseded"
  | "policy_published"
  | "policy_superseded"
  | "observation_window_opened"
  | "observation_evaluated"
  | "rollback_trigger_evaluated"
  | "action_eligibility_refreshed"
  | "tuple_closed";
export type ReleaseWatchIssueSeverity = "error" | "warning";

export interface ReleaseWatchIssue {
  code: string;
  severity: ReleaseWatchIssueSeverity;
  message: string;
  memberRefs: readonly string[];
}

export interface ReleaseWatchTupleMembers {
  releaseRef: string;
  promotionIntentRef: string;
  approvalEvidenceBundleRef: string;
  baselineTupleHash: string;
  approvalTupleHash: string;
  releaseApprovalFreezeRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  waveRef: string;
  waveEligibilitySnapshotRef: string;
  waveGuardrailSnapshotRef: string;
  waveObservationPolicyRef: string;
  waveControlFenceRef: string;
  tenantScopeMode: string;
  tenantScopeRef: string;
  affectedTenantCount: number;
  affectedOrganisationCount: number;
  tenantScopeTupleHash: string;
  requiredAssuranceSliceRefs: readonly string[];
  releaseTrustFreezeVerdictRefs: readonly string[];
  requiredContinuityControlRefs: readonly string[];
  continuityEvidenceDigestRefs: readonly string[];
  activeChannelFreezeRefs: readonly string[];
  recoveryDispositionRefs: readonly string[];
}

export interface ReleaseWatchTupleContract extends ReleaseWatchTupleMembers {
  releaseWatchTupleId: string;
  watchTupleHash: string;
  tupleState: ReleaseWatchTupleState;
  supersededByReleaseWatchTupleRef: string | null;
  staleReasonRefs: readonly string[];
  publishedAt: string;
  closedAt: string | null;
  sourceRefs: readonly string[];
}

export interface WaveObservationPolicyMembers {
  releaseRef: string;
  waveRef: string;
  promotionIntentRef: string;
  releaseApprovalFreezeRef: string;
  waveEligibilitySnapshotRef: string;
  watchTupleHash: string;
  minimumDwellDuration: string;
  minimumObservationSamples: number;
  requiredProbeRefs: readonly string[];
  requiredContinuityControlRefs: readonly string[];
  requiredContinuityEvidenceDigestRefs: readonly string[];
  requiredPublicationParityState: "exact";
  requiredRoutePostureState: ReleaseWatchRoutePostureState;
  requiredProvenanceState: BuildProvenanceState;
  stabilizationCriteriaRef: string;
  rollbackTriggerRefs: readonly string[];
  gapResolutionRefs: readonly string[];
  operationalReadinessSnapshotRef: string | null;
}

export interface WaveObservationPolicyContract extends WaveObservationPolicyMembers {
  waveObservationPolicyId: string;
  policyHash: string;
  policyState: WaveObservationPolicyState;
  supersededByWaveObservationPolicyRef: string | null;
  publishedAt: string;
  sourceRefs: readonly string[];
}

export interface WaveObservationProbeDefinition {
  probeRef: string;
  probeClass: WaveObservationProbeClass;
  label: string;
  description: string;
  staleAfterMinutes: number;
  requiredForSatisfaction: boolean;
  failureSeverity: "warning" | "critical";
  sourceRefs: readonly string[];
}

export interface WaveObservationProbeReading {
  probeRef: string;
  state: WaveObservationProbeState;
  observedAt: string;
  evidenceRefs: readonly string[];
  severity: "info" | "warning" | "critical";
  summary: string;
}

export interface WaveObservationWindow {
  observationWindowId: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  watchTupleHash: string;
  policyHash: string;
  startsAt: string;
  closesAt: string;
  requiredProbeRefs: readonly string[];
  observedRuntimePublicationBundleRef: string;
  observedPublicationParityRef: string;
  observedContinuityEvidenceDigestRefs: readonly string[];
  observedRoutePostureState: ReleaseWatchRoutePostureState;
  observedProvenanceState: BuildProvenanceState;
  observedRollbackReadinessState: ReleaseWatchRollbackReadinessState;
  observedProbeStates: Readonly<Record<string, WaveObservationProbeState>>;
  observationState: ObservationWindowState;
  watchState: ReleaseWatchState;
  triggerState: ReleaseWatchRollbackTriggerState;
  reasonRefs: readonly string[];
  operationalReadinessSnapshotRef: string | null;
  observedSamples: number;
  evaluatedAt: string;
  closedAt: string | null;
}

export interface ReleaseWatchRollbackTriggerEvaluation {
  rollbackTriggerEvaluationId: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  triggerRef: string;
  triggerClass: ReleaseWatchRollbackTriggerClass;
  triggerState: ReleaseWatchRollbackTriggerState;
  evaluatedAt: string;
  reasonRefs: readonly string[];
  sourceRefs: readonly string[];
}

export interface ReleaseWatchActionEligibility {
  waveActionType: ReleaseWatchActionType;
  allowed: boolean;
  tupleState: ReleaseWatchTupleState;
  policyState: WaveObservationPolicyState;
  watchState: ReleaseWatchState;
  blockingReasonRefs: readonly string[];
  warningReasonRefs: readonly string[];
}

export interface ReleaseWatchTimelineEvent {
  timelineEventId: string;
  releaseRef: string;
  waveRef: string;
  releaseWatchTupleRef: string | null;
  waveObservationPolicyRef: string | null;
  observationWindowRef: string | null;
  eventType: ReleaseWatchTimelineEventType;
  reasonRefs: readonly string[];
  payloadHash: string;
  recordedAt: string;
  sourceRefs: readonly string[];
}

export interface ReleaseWatchTupleValidationResult {
  valid: boolean;
  watchTupleHash: string;
  tupleState: ReleaseWatchTupleState;
  issues: readonly ReleaseWatchIssue[];
  refusalReasonRefs: readonly string[];
}

export interface WaveObservationPolicyValidationResult {
  valid: boolean;
  policyHash: string;
  policyState: WaveObservationPolicyState;
  issues: readonly ReleaseWatchIssue[];
  refusalReasonRefs: readonly string[];
}

export interface ReleaseWatchEvaluationInput {
  tuple: ReleaseWatchTupleContract;
  currentTuple: ReleaseWatchTupleMembers;
  policy: WaveObservationPolicyContract;
  currentPolicy: WaveObservationPolicyMembers;
  observationWindow: WaveObservationWindow;
  publicationVerdict: RuntimePublicationAuthorityVerdict;
  probeCatalog: readonly WaveObservationProbeDefinition[];
  probeReadings: readonly WaveObservationProbeReading[];
  routePostureState: ReleaseWatchRoutePostureState;
  provenanceState: BuildProvenanceState;
  currentContinuityEvidenceDigestRefs: readonly string[];
  currentAssuranceSliceRefs?: readonly string[];
  trustFreezeLive?: boolean;
  assuranceHardBlock?: boolean;
  rollbackReadinessState?: ReleaseWatchRollbackReadinessState;
  manualRollbackApproved?: boolean;
  now: string;
  observedSamples?: number;
}

export interface ReleaseWatchEvaluationResult {
  tuple: ReleaseWatchTupleContract;
  policy: WaveObservationPolicyContract;
  tupleValidation: ReleaseWatchTupleValidationResult;
  policyValidation: WaveObservationPolicyValidationResult;
  observationWindow: WaveObservationWindow;
  triggerEvaluations: readonly ReleaseWatchRollbackTriggerEvaluation[];
  actionEligibility: readonly ReleaseWatchActionEligibility[];
  watchState: ReleaseWatchState;
}

export interface ReleaseWatchPublishResult {
  acceptedState: "accepted" | "deduplicated";
  tuple: ReleaseWatchTupleContract;
  policy: WaveObservationPolicyContract;
  observationWindow: WaveObservationWindow;
}

export interface ReleaseWatchMetricsSnapshot {
  activeTupleCount: number;
  staleTupleCount: number;
  blockedPolicyCount: number;
  supersededTupleCount: number;
  rollbackTriggerActivationCount: number;
  observationWindowCount: number;
  timelineEventCount: number;
}

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function arraysEqualAsSets(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = uniqueSorted(left);
  const normalizedRight = uniqueSorted(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

function createIssue(
  code: string,
  message: string,
  memberRefs: readonly string[] = [],
  severity: ReleaseWatchIssueSeverity = "error",
): ReleaseWatchIssue {
  return { code, severity, message, memberRefs };
}

function durationToMilliseconds(duration: string): number {
  const match =
    /^P(?:(?<days>\d+)D)?(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)?$/.exec(
      duration,
    );
  if (!match?.groups) {
    throw new Error(`RELEASE_WATCH_DURATION_INVALID:${duration}`);
  }
  const days = Number(match.groups["days"] ?? 0);
  const hours = Number(match.groups["hours"] ?? 0);
  const minutes = Number(match.groups["minutes"] ?? 0);
  const seconds = Number(match.groups["seconds"] ?? 0);
  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
}

function addDuration(isoTimestamp: string, duration: string): string {
  const startsAt = new Date(isoTimestamp).getTime();
  if (Number.isNaN(startsAt)) {
    throw new Error(`RELEASE_WATCH_TIMESTAMP_INVALID:${isoTimestamp}`);
  }
  return new Date(startsAt + durationToMilliseconds(duration)).toISOString();
}

function inferProbeClass(probeRef: string): WaveObservationProbeClass {
  if (probeRef.includes("parity")) {
    return "publication_parity";
  }
  if (probeRef.includes("provenance")) {
    return "provenance_verification";
  }
  if (
    probeRef.includes("continuity") ||
    probeRef.includes("callback") ||
    probeRef.includes("projection")
  ) {
    return "continuity_evidence";
  }
  if (probeRef.includes("route") || probeRef.includes("recovery")) {
    return "route_recovery_posture";
  }
  if (probeRef.includes("trust") || probeRef.includes("assurance")) {
    return "assurance_slice_trust";
  }
  return "synthetic_user_journey";
}

function inferTriggerClass(triggerRef: string): ReleaseWatchRollbackTriggerClass {
  if (triggerRef.includes("parity")) {
    return "hard_parity_drift";
  }
  if (triggerRef.includes("trust") || triggerRef.includes("assurance")) {
    return "trust_freeze_or_assurance_block";
  }
  if (triggerRef.includes("continuity")) {
    return "continuity_control_regression";
  }
  if (triggerRef.includes("journey") || triggerRef.includes("synthetic")) {
    return "critical_synthetic_journey_failure";
  }
  if (triggerRef.includes("manual")) {
    return "manual_operator_approved";
  }
  return "route_publication_or_recovery_disposition_drift";
}

export function deriveReleaseWatchTupleHash(tuple: ReleaseWatchTupleMembers): string {
  return stableDigest({
    baselineTupleHash: tuple.baselineTupleHash,
    approvalTupleHash: tuple.approvalTupleHash,
    releaseApprovalFreezeRef: tuple.releaseApprovalFreezeRef,
    runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
    releasePublicationParityRef: tuple.releasePublicationParityRef,
    waveEligibilitySnapshotRef: tuple.waveEligibilitySnapshotRef,
    waveGuardrailSnapshotRef: tuple.waveGuardrailSnapshotRef,
    waveObservationPolicyRef: tuple.waveObservationPolicyRef,
    waveControlFenceRef: tuple.waveControlFenceRef,
    tenantScopeTupleHash: tuple.tenantScopeTupleHash,
    activeChannelFreezeRefs: uniqueSorted(tuple.activeChannelFreezeRefs),
    recoveryDispositionRefs: uniqueSorted(tuple.recoveryDispositionRefs),
    requiredAssuranceSliceRefs: uniqueSorted(tuple.requiredAssuranceSliceRefs),
    releaseTrustFreezeVerdictRefs: uniqueSorted(tuple.releaseTrustFreezeVerdictRefs),
    requiredContinuityControlRefs: uniqueSorted(tuple.requiredContinuityControlRefs),
    continuityEvidenceDigestRefs: uniqueSorted(tuple.continuityEvidenceDigestRefs),
    tenantScopeMode: tuple.tenantScopeMode,
    tenantScopeRef: tuple.tenantScopeRef,
    affectedTenantCount: tuple.affectedTenantCount,
    affectedOrganisationCount: tuple.affectedOrganisationCount,
  });
}

export function deriveWaveObservationPolicyHash(policy: WaveObservationPolicyMembers): string {
  return stableDigest({
    releaseRef: policy.releaseRef,
    waveRef: policy.waveRef,
    promotionIntentRef: policy.promotionIntentRef,
    releaseApprovalFreezeRef: policy.releaseApprovalFreezeRef,
    waveEligibilitySnapshotRef: policy.waveEligibilitySnapshotRef,
    watchTupleHash: policy.watchTupleHash,
    minimumDwellDuration: policy.minimumDwellDuration,
    minimumObservationSamples: policy.minimumObservationSamples,
    requiredProbeRefs: uniqueSorted(policy.requiredProbeRefs),
    requiredContinuityControlRefs: uniqueSorted(policy.requiredContinuityControlRefs),
    requiredContinuityEvidenceDigestRefs: uniqueSorted(policy.requiredContinuityEvidenceDigestRefs),
    requiredPublicationParityState: policy.requiredPublicationParityState,
    requiredRoutePostureState: policy.requiredRoutePostureState,
    requiredProvenanceState: policy.requiredProvenanceState,
    stabilizationCriteriaRef: policy.stabilizationCriteriaRef,
    rollbackTriggerRefs: uniqueSorted(policy.rollbackTriggerRefs),
    gapResolutionRefs: uniqueSorted(policy.gapResolutionRefs),
    operationalReadinessSnapshotRef: policy.operationalReadinessSnapshotRef,
  });
}

export function createReleaseWatchTuple(
  input: Omit<
    ReleaseWatchTupleContract,
    | "watchTupleHash"
    | "tupleState"
    | "supersededByReleaseWatchTupleRef"
    | "staleReasonRefs"
    | "closedAt"
  > & {
    tupleState?: ReleaseWatchTupleState;
    supersededByReleaseWatchTupleRef?: string | null;
    staleReasonRefs?: readonly string[];
    closedAt?: string | null;
  },
): ReleaseWatchTupleContract {
  const tuple: ReleaseWatchTupleMembers = {
    releaseRef: input.releaseRef,
    promotionIntentRef: input.promotionIntentRef,
    approvalEvidenceBundleRef: input.approvalEvidenceBundleRef,
    baselineTupleHash: input.baselineTupleHash,
    approvalTupleHash: input.approvalTupleHash,
    releaseApprovalFreezeRef: input.releaseApprovalFreezeRef,
    runtimePublicationBundleRef: input.runtimePublicationBundleRef,
    releasePublicationParityRef: input.releasePublicationParityRef,
    waveRef: input.waveRef,
    waveEligibilitySnapshotRef: input.waveEligibilitySnapshotRef,
    waveGuardrailSnapshotRef: input.waveGuardrailSnapshotRef,
    waveObservationPolicyRef: input.waveObservationPolicyRef,
    waveControlFenceRef: input.waveControlFenceRef,
    tenantScopeMode: input.tenantScopeMode,
    tenantScopeRef: input.tenantScopeRef,
    affectedTenantCount: input.affectedTenantCount,
    affectedOrganisationCount: input.affectedOrganisationCount,
    tenantScopeTupleHash: input.tenantScopeTupleHash,
    requiredAssuranceSliceRefs: input.requiredAssuranceSliceRefs,
    releaseTrustFreezeVerdictRefs: input.releaseTrustFreezeVerdictRefs,
    requiredContinuityControlRefs: input.requiredContinuityControlRefs,
    continuityEvidenceDigestRefs: input.continuityEvidenceDigestRefs,
    activeChannelFreezeRefs: input.activeChannelFreezeRefs,
    recoveryDispositionRefs: input.recoveryDispositionRefs,
  };
  return {
    ...input,
    watchTupleHash: deriveReleaseWatchTupleHash(tuple),
    tupleState: input.tupleState ?? "proposed",
    supersededByReleaseWatchTupleRef: input.supersededByReleaseWatchTupleRef ?? null,
    staleReasonRefs: input.staleReasonRefs ?? [],
    closedAt: input.closedAt ?? null,
  };
}

export function createWaveObservationPolicy(
  input: Omit<
    WaveObservationPolicyContract,
    "policyHash" | "policyState" | "supersededByWaveObservationPolicyRef"
  > & {
    policyState?: WaveObservationPolicyState;
    supersededByWaveObservationPolicyRef?: string | null;
  },
): WaveObservationPolicyContract {
  const members: WaveObservationPolicyMembers = {
    releaseRef: input.releaseRef,
    waveRef: input.waveRef,
    promotionIntentRef: input.promotionIntentRef,
    releaseApprovalFreezeRef: input.releaseApprovalFreezeRef,
    waveEligibilitySnapshotRef: input.waveEligibilitySnapshotRef,
    watchTupleHash: input.watchTupleHash,
    minimumDwellDuration: input.minimumDwellDuration,
    minimumObservationSamples: input.minimumObservationSamples,
    requiredProbeRefs: input.requiredProbeRefs,
    requiredContinuityControlRefs: input.requiredContinuityControlRefs,
    requiredContinuityEvidenceDigestRefs: input.requiredContinuityEvidenceDigestRefs,
    requiredPublicationParityState: input.requiredPublicationParityState,
    requiredRoutePostureState: input.requiredRoutePostureState,
    requiredProvenanceState: input.requiredProvenanceState,
    stabilizationCriteriaRef: input.stabilizationCriteriaRef,
    rollbackTriggerRefs: input.rollbackTriggerRefs,
    gapResolutionRefs: input.gapResolutionRefs,
    operationalReadinessSnapshotRef: input.operationalReadinessSnapshotRef,
  };
  return {
    ...input,
    policyHash: deriveWaveObservationPolicyHash(members),
    policyState: input.policyState ?? "armed",
    supersededByWaveObservationPolicyRef: input.supersededByWaveObservationPolicyRef ?? null,
  };
}

export function validateReleaseWatchTuple(input: {
  tuple: ReleaseWatchTupleContract;
  current: ReleaseWatchTupleMembers;
}): ReleaseWatchTupleValidationResult {
  const issues: ReleaseWatchIssue[] = [];
  const expectedHash = deriveReleaseWatchTupleHash(input.current);

  type ReleaseWatchTupleArrayField =
    | "requiredAssuranceSliceRefs"
    | "releaseTrustFreezeVerdictRefs"
    | "requiredContinuityControlRefs"
    | "continuityEvidenceDigestRefs"
    | "activeChannelFreezeRefs"
    | "recoveryDispositionRefs";

  const requiredArrayFields: ReadonlyArray<readonly [ReleaseWatchTupleArrayField, string]> = [
    ["requiredAssuranceSliceRefs", "ASSURANCE_SLICE_REFS"],
    ["releaseTrustFreezeVerdictRefs", "RELEASE_TRUST_FREEZE_VERDICTS"],
    ["requiredContinuityControlRefs", "CONTINUITY_CONTROL_REFS"],
    ["continuityEvidenceDigestRefs", "CONTINUITY_EVIDENCE_DIGESTS"],
    ["activeChannelFreezeRefs", "ACTIVE_CHANNEL_FREEZES"],
    ["recoveryDispositionRefs", "RECOVERY_DISPOSITIONS"],
  ];
  requiredArrayFields.forEach(([fieldName, label]) => {
    if (input.current[fieldName].length === 0) {
      issues.push(
        createIssue(`MISSING_${label}`, `${fieldName} must publish at least one member.`),
      );
    }
  });

  (
    [
      ["releaseApprovalFreezeRef", "DRIFT_RELEASE_APPROVAL_FREEZE"],
      ["runtimePublicationBundleRef", "DRIFT_RUNTIME_PUBLICATION_BUNDLE"],
      ["releasePublicationParityRef", "DRIFT_RELEASE_PUBLICATION_PARITY"],
      ["waveEligibilitySnapshotRef", "DRIFT_WAVE_ELIGIBILITY_SNAPSHOT"],
      ["waveGuardrailSnapshotRef", "DRIFT_WAVE_GUARDRAIL_SNAPSHOT"],
      ["waveObservationPolicyRef", "DRIFT_WAVE_OBSERVATION_POLICY_REF"],
      ["waveControlFenceRef", "DRIFT_WAVE_CONTROL_FENCE"],
      ["tenantScopeMode", "DRIFT_TENANT_SCOPE_MODE"],
      ["tenantScopeRef", "DRIFT_TENANT_SCOPE_REF"],
      ["tenantScopeTupleHash", "DRIFT_TENANT_SCOPE_HASH"],
      ["baselineTupleHash", "DRIFT_BASELINE_TUPLE_HASH"],
      ["approvalTupleHash", "DRIFT_APPROVAL_TUPLE_HASH"],
    ] as const
  ).forEach(([fieldName, issueCode]) => {
    if (input.tuple[fieldName] !== input.current[fieldName]) {
      issues.push(
        createIssue(issueCode, `${fieldName} drifted from the authoritative watch tuple.`, [
          String(input.tuple[fieldName]),
          String(input.current[fieldName]),
        ]),
      );
    }
  });

  (
    [
      ["requiredAssuranceSliceRefs", "DRIFT_ASSURANCE_SLICE_REFS"],
      ["releaseTrustFreezeVerdictRefs", "DRIFT_RELEASE_TRUST_FREEZE_VERDICTS"],
      ["requiredContinuityControlRefs", "DRIFT_CONTINUITY_CONTROL_REFS"],
      ["continuityEvidenceDigestRefs", "DRIFT_CONTINUITY_EVIDENCE_DIGESTS"],
      ["activeChannelFreezeRefs", "DRIFT_ACTIVE_CHANNEL_FREEZES"],
      ["recoveryDispositionRefs", "DRIFT_RECOVERY_DISPOSITIONS"],
    ] as const
  ).forEach(([fieldName, issueCode]) => {
    if (!arraysEqualAsSets(input.tuple[fieldName], input.current[fieldName])) {
      issues.push(
        createIssue(issueCode, `${fieldName} drifted from the authoritative watch tuple.`, [
          ...uniqueSorted(input.tuple[fieldName]),
          ...uniqueSorted(input.current[fieldName]),
        ]),
      );
    }
  });

  if (input.tuple.watchTupleHash !== expectedHash) {
    issues.push(
      createIssue(
        "DRIFT_WATCH_TUPLE_HASH",
        "Stored watch tuple hash no longer matches authoritative tuple members.",
        [input.tuple.watchTupleHash, expectedHash],
      ),
    );
  }

  const refusalReasonRefs = issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => issue.code);
  const tupleState =
    refusalReasonRefs.length > 0 || input.tuple.tupleState === "stale"
      ? "stale"
      : input.tuple.tupleState;
  return {
    valid: refusalReasonRefs.length === 0 && tupleState !== "superseded",
    watchTupleHash: expectedHash,
    tupleState,
    issues,
    refusalReasonRefs,
  };
}

export function validateWaveObservationPolicy(input: {
  policy: WaveObservationPolicyContract;
  current: WaveObservationPolicyMembers;
}): WaveObservationPolicyValidationResult {
  const issues: ReleaseWatchIssue[] = [];
  const expectedHash = deriveWaveObservationPolicyHash(input.current);

  if (input.current.requiredProbeRefs.length === 0) {
    issues.push(createIssue("MISSING_REQUIRED_PROBES", "requiredProbeRefs must not be empty."));
  }
  if (input.current.minimumObservationSamples < 1) {
    issues.push(
      createIssue(
        "INVALID_MINIMUM_OBSERVATION_SAMPLES",
        "minimumObservationSamples must be at least 1.",
      ),
    );
  }

  (
    [
      ["watchTupleHash", "DRIFT_WATCH_TUPLE_HASH"],
      ["minimumDwellDuration", "DRIFT_MINIMUM_DWELL_DURATION"],
      ["requiredPublicationParityState", "DRIFT_REQUIRED_PUBLICATION_PARITY_STATE"],
      ["requiredRoutePostureState", "DRIFT_REQUIRED_ROUTE_POSTURE_STATE"],
      ["requiredProvenanceState", "DRIFT_REQUIRED_PROVENANCE_STATE"],
      ["stabilizationCriteriaRef", "DRIFT_STABILIZATION_CRITERIA"],
      ["operationalReadinessSnapshotRef", "DRIFT_OPERATIONAL_READINESS_SNAPSHOT"],
    ] as const
  ).forEach(([fieldName, issueCode]) => {
    if (input.policy[fieldName] !== input.current[fieldName]) {
      issues.push(
        createIssue(issueCode, `${fieldName} drifted from the authoritative observation policy.`, [
          String(input.policy[fieldName]),
          String(input.current[fieldName]),
        ]),
      );
    }
  });

  (
    [
      ["requiredProbeRefs", "DRIFT_REQUIRED_PROBES"],
      ["requiredContinuityControlRefs", "DRIFT_REQUIRED_CONTINUITY_CONTROLS"],
      ["requiredContinuityEvidenceDigestRefs", "DRIFT_REQUIRED_CONTINUITY_EVIDENCE"],
      ["rollbackTriggerRefs", "DRIFT_ROLLBACK_TRIGGER_REFS"],
      ["gapResolutionRefs", "DRIFT_GAP_RESOLUTION_REFS"],
    ] as const
  ).forEach(([fieldName, issueCode]) => {
    if (!arraysEqualAsSets(input.policy[fieldName], input.current[fieldName])) {
      issues.push(
        createIssue(issueCode, `${fieldName} drifted from the authoritative observation policy.`, [
          ...uniqueSorted(input.policy[fieldName]),
          ...uniqueSorted(input.current[fieldName]),
        ]),
      );
    }
  });

  if (input.policy.minimumObservationSamples !== input.current.minimumObservationSamples) {
    issues.push(
      createIssue(
        "DRIFT_MINIMUM_OBSERVATION_SAMPLES",
        "minimumObservationSamples drifted from the authoritative observation policy.",
        [
          String(input.policy.minimumObservationSamples),
          String(input.current.minimumObservationSamples),
        ],
      ),
    );
  }

  if (input.policy.policyHash !== expectedHash) {
    issues.push(
      createIssue(
        "DRIFT_POLICY_HASH",
        "Stored observation policy hash no longer matches authoritative policy members.",
        [input.policy.policyHash, expectedHash],
      ),
    );
  }

  const refusalReasonRefs = issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => issue.code);
  const policyState =
    refusalReasonRefs.length > 0 || input.policy.policyState === "blocked"
      ? "blocked"
      : input.policy.policyState;
  return {
    valid: refusalReasonRefs.length === 0 && policyState !== "superseded",
    policyHash: expectedHash,
    policyState,
    issues,
    refusalReasonRefs,
  };
}

function buildProbeStateMap(
  requiredProbeRefs: readonly string[],
  probeCatalog: readonly WaveObservationProbeDefinition[],
  probeReadings: readonly WaveObservationProbeReading[],
  now: string,
): {
  stateMap: Record<string, WaveObservationProbeState>;
  missingProbeRefs: string[];
  staleProbeRefs: string[];
  failedProbeRefs: string[];
  criticalSyntheticFailures: string[];
} {
  const nowMillis = new Date(now).getTime();
  const definitionByRef = new Map(probeCatalog.map((probe) => [probe.probeRef, probe]));
  const readingByRef = new Map(probeReadings.map((reading) => [reading.probeRef, reading]));
  const stateMap: Record<string, WaveObservationProbeState> = {};
  const missingProbeRefs: string[] = [];
  const staleProbeRefs: string[] = [];
  const failedProbeRefs: string[] = [];
  const criticalSyntheticFailures: string[] = [];

  requiredProbeRefs.forEach((probeRef) => {
    const definition = definitionByRef.get(probeRef) ?? {
      probeRef,
      probeClass: inferProbeClass(probeRef),
      label: probeRef,
      description: probeRef,
      staleAfterMinutes: 30,
      requiredForSatisfaction: true,
      failureSeverity: "warning" as const,
      sourceRefs: ["release-watch-pipeline.ts"],
    };
    const reading = readingByRef.get(probeRef);
    if (!reading) {
      stateMap[probeRef] = "pending";
      missingProbeRefs.push(probeRef);
      return;
    }
    const observedAt = new Date(reading.observedAt).getTime();
    if (Number.isNaN(observedAt) || reading.state === "stale") {
      stateMap[probeRef] = "stale";
      staleProbeRefs.push(probeRef);
      return;
    }
    const stalenessBudget = definition.staleAfterMinutes * 60 * 1000;
    if (nowMillis - observedAt > stalenessBudget) {
      stateMap[probeRef] = "stale";
      staleProbeRefs.push(probeRef);
      return;
    }
    stateMap[probeRef] = reading.state;
    if (reading.state === "failed") {
      failedProbeRefs.push(probeRef);
      if (
        definition.probeClass === "synthetic_user_journey" &&
        (definition.failureSeverity === "critical" || reading.severity === "critical")
      ) {
        criticalSyntheticFailures.push(probeRef);
      }
    }
  });

  return {
    stateMap,
    missingProbeRefs,
    staleProbeRefs,
    failedProbeRefs,
    criticalSyntheticFailures,
  };
}

function evaluateRollbackTriggers(input: {
  tuple: ReleaseWatchTupleContract;
  policy: WaveObservationPolicyContract;
  publicationVerdict: RuntimePublicationAuthorityVerdict;
  routePostureState: ReleaseWatchRoutePostureState;
  continuityExact: boolean;
  trustFreezeLive: boolean;
  assuranceHardBlock: boolean;
  missingAssuranceRefs: readonly string[];
  criticalSyntheticFailures: readonly string[];
  manualRollbackApproved: boolean;
  now: string;
}): ReleaseWatchRollbackTriggerEvaluation[] {
  return input.policy.rollbackTriggerRefs.map((triggerRef) => {
    const triggerClass = inferTriggerClass(triggerRef);
    const reasonRefs: string[] = [];
    switch (triggerClass) {
      case "hard_parity_drift":
        if (
          !input.publicationVerdict.publishable ||
          input.publicationVerdict.parityState !== "exact" ||
          input.publicationVerdict.publicationState !== "published"
        ) {
          reasonRefs.push("ROLLBACK_TRIGGER_PARITY_DRIFT");
        }
        break;
      case "trust_freeze_or_assurance_block":
        if (!input.trustFreezeLive) {
          reasonRefs.push("ROLLBACK_TRIGGER_RELEASE_TRUST_FROZEN");
        }
        if (input.assuranceHardBlock) {
          reasonRefs.push("ROLLBACK_TRIGGER_ASSURANCE_HARD_BLOCK");
        }
        if (input.missingAssuranceRefs.length > 0) {
          reasonRefs.push("ROLLBACK_TRIGGER_ASSURANCE_SLICE_DRIFT");
        }
        break;
      case "continuity_control_regression":
        if (!input.continuityExact) {
          reasonRefs.push("ROLLBACK_TRIGGER_CONTINUITY_REGRESSION");
        }
        break;
      case "critical_synthetic_journey_failure":
        if (input.criticalSyntheticFailures.length > 0) {
          reasonRefs.push(
            ...input.criticalSyntheticFailures.map(
              (probeRef) => `ROLLBACK_TRIGGER_SYNTHETIC_FAIL::${probeRef}`,
            ),
          );
        }
        break;
      case "route_publication_or_recovery_disposition_drift":
        if (
          input.routePostureState === "rollback_required" ||
          input.routePostureState === "freeze_conflict"
        ) {
          reasonRefs.push(`ROLLBACK_TRIGGER_ROUTE_POSTURE::${input.routePostureState}`);
        }
        break;
      case "manual_operator_approved":
        if (input.manualRollbackApproved) {
          reasonRefs.push("ROLLBACK_TRIGGER_MANUAL_APPROVAL");
        }
        break;
      default:
        break;
    }
    return {
      rollbackTriggerEvaluationId: `${triggerRef}::${input.tuple.releaseWatchTupleId}`,
      releaseWatchTupleRef: input.tuple.releaseWatchTupleId,
      waveObservationPolicyRef: input.policy.waveObservationPolicyId,
      triggerRef,
      triggerClass,
      triggerState: reasonRefs.length > 0 ? "triggered" : "clear",
      evaluatedAt: input.now,
      reasonRefs,
      sourceRefs: ["release-watch-pipeline.ts"],
    };
  });
}

function evaluateActionEligibility(input: {
  tupleState: ReleaseWatchTupleState;
  policyState: WaveObservationPolicyState;
  watchState: ReleaseWatchState;
  observationState: ObservationWindowState;
  triggerEvaluations: readonly ReleaseWatchRollbackTriggerEvaluation[];
}): ReleaseWatchActionEligibility[] {
  const anyTriggered = input.triggerEvaluations.some(
    (trigger) => trigger.triggerState === "triggered",
  );
  const baseBlockingRefs =
    input.tupleState === "stale"
      ? ["WATCH_TUPLE_STALE"]
      : input.tupleState === "superseded"
        ? ["WATCH_TUPLE_SUPERSEDED"]
        : [];
  const blockedPolicyRefs =
    input.policyState === "blocked"
      ? ["OBSERVATION_POLICY_BLOCKED"]
      : input.policyState === "superseded"
        ? ["OBSERVATION_POLICY_SUPERSEDED"]
        : [];
  return [
    {
      waveActionType: "widen",
      allowed:
        input.tupleState === "active" &&
        input.policyState === "satisfied" &&
        input.watchState === "satisfied" &&
        input.observationState === "satisfied" &&
        !anyTriggered,
      tupleState: input.tupleState,
      policyState: input.policyState,
      watchState: input.watchState,
      blockingReasonRefs: [
        ...baseBlockingRefs,
        ...blockedPolicyRefs,
        ...(input.watchState !== "satisfied"
          ? [`WATCH_STATE_${input.watchState.toUpperCase()}`]
          : []),
        ...(anyTriggered ? ["ROLLBACK_TRIGGER_ACTIVE"] : []),
      ],
      warningReasonRefs: [],
    },
    {
      waveActionType: "pause",
      allowed: input.tupleState !== "closed" && input.tupleState !== "superseded",
      tupleState: input.tupleState,
      policyState: input.policyState,
      watchState: input.watchState,
      blockingReasonRefs:
        input.tupleState === "closed" || input.tupleState === "superseded"
          ? ["WATCH_TUPLE_NOT_PAUSABLE"]
          : [],
      warningReasonRefs: input.watchState === "rollback_required" ? ["PAUSE_IS_RECOVERY_ONLY"] : [],
    },
    {
      waveActionType: "resume",
      allowed:
        input.tupleState === "active" &&
        input.policyState === "satisfied" &&
        input.watchState === "satisfied" &&
        !anyTriggered,
      tupleState: input.tupleState,
      policyState: input.policyState,
      watchState: input.watchState,
      blockingReasonRefs: [
        ...baseBlockingRefs,
        ...blockedPolicyRefs,
        ...(input.watchState !== "satisfied"
          ? [`WATCH_STATE_${input.watchState.toUpperCase()}`]
          : []),
        ...(anyTriggered ? ["ROLLBACK_TRIGGER_ACTIVE"] : []),
      ],
      warningReasonRefs: [],
    },
    {
      waveActionType: "rollback",
      allowed:
        input.tupleState !== "closed" &&
        (anyTriggered || input.watchState === "rollback_required" || input.tupleState === "stale"),
      tupleState: input.tupleState,
      policyState: input.policyState,
      watchState: input.watchState,
      blockingReasonRefs:
        input.tupleState === "closed"
          ? ["WATCH_TUPLE_CLOSED"]
          : anyTriggered || input.watchState === "rollback_required" || input.tupleState === "stale"
            ? []
            : ["ROLLBACK_NOT_ARMED"],
      warningReasonRefs: [],
    },
    {
      waveActionType: "close",
      allowed:
        input.tupleState === "active" &&
        input.policyState === "satisfied" &&
        input.watchState === "satisfied" &&
        input.observationState === "satisfied" &&
        !anyTriggered,
      tupleState: input.tupleState,
      policyState: input.policyState,
      watchState: input.watchState,
      blockingReasonRefs: [
        ...baseBlockingRefs,
        ...blockedPolicyRefs,
        ...(input.observationState !== "satisfied" ? ["OBSERVATION_WINDOW_NOT_SATISFIED"] : []),
        ...(anyTriggered ? ["ROLLBACK_TRIGGER_ACTIVE"] : []),
      ],
      warningReasonRefs: [],
    },
  ];
}

export function evaluateReleaseWatchPipeline(
  input: ReleaseWatchEvaluationInput,
): ReleaseWatchEvaluationResult {
  const tupleValidation = validateReleaseWatchTuple({
    tuple: input.tuple,
    current: input.currentTuple,
  });
  const policyValidation = validateWaveObservationPolicy({
    policy: input.policy,
    current: input.currentPolicy,
  });

  const trustFreezeLive = input.trustFreezeLive ?? true;
  const assuranceHardBlock = input.assuranceHardBlock ?? false;
  const rollbackReadinessState = input.rollbackReadinessState ?? "ready";
  const manualRollbackApproved = input.manualRollbackApproved ?? false;
  const currentAssuranceSliceRefs = uniqueSorted(
    input.currentAssuranceSliceRefs ?? input.currentTuple.requiredAssuranceSliceRefs,
  );
  const missingAssuranceRefs = uniqueSorted(input.currentTuple.requiredAssuranceSliceRefs).filter(
    (ref) => !currentAssuranceSliceRefs.includes(ref),
  );
  const continuityExact = arraysEqualAsSets(
    input.currentPolicy.requiredContinuityEvidenceDigestRefs,
    input.currentContinuityEvidenceDigestRefs,
  );
  const probeState = buildProbeStateMap(
    input.currentPolicy.requiredProbeRefs,
    input.probeCatalog,
    input.probeReadings,
    input.now,
  );
  const dwellSatisfied =
    new Date(input.now).getTime() >= new Date(input.observationWindow.startsAt).getTime() &&
    new Date(input.now).getTime() >= new Date(input.observationWindow.closesAt).getTime();
  const observedSamples = input.observedSamples ?? input.probeReadings.length;
  const sampleSatisfied = observedSamples >= input.currentPolicy.minimumObservationSamples;
  const publicationSatisfied =
    input.publicationVerdict.publishable &&
    input.publicationVerdict.parityState === input.currentPolicy.requiredPublicationParityState;
  const routePostureSatisfied =
    input.routePostureState === input.currentPolicy.requiredRoutePostureState;
  const provenanceSatisfied = input.provenanceState === input.currentPolicy.requiredProvenanceState;
  const allProbesPassed =
    probeState.missingProbeRefs.length === 0 &&
    probeState.staleProbeRefs.length === 0 &&
    probeState.failedProbeRefs.length === 0;

  const triggerEvaluations = evaluateRollbackTriggers({
    tuple: input.tuple,
    policy: input.policy,
    publicationVerdict: input.publicationVerdict,
    routePostureState: input.routePostureState,
    continuityExact,
    trustFreezeLive,
    assuranceHardBlock,
    missingAssuranceRefs,
    criticalSyntheticFailures: probeState.criticalSyntheticFailures,
    manualRollbackApproved,
    now: input.now,
  });
  const anyTriggered = triggerEvaluations.some((trigger) => trigger.triggerState === "triggered");
  const windowExpired =
    new Date(input.now).getTime() > new Date(input.observationWindow.closesAt).getTime();
  const runtimeTruthDrifted =
    !publicationSatisfied ||
    !routePostureSatisfied ||
    !provenanceSatisfied ||
    !continuityExact ||
    !trustFreezeLive ||
    assuranceHardBlock ||
    missingAssuranceRefs.length > 0;

  const driftReasonRefs = [
    ...tupleValidation.refusalReasonRefs,
    ...policyValidation.refusalReasonRefs,
    ...probeState.staleProbeRefs.map((probeRef) => `STALE_PROBE::${probeRef}`),
    ...(missingAssuranceRefs.length > 0 ? ["MISSING_ASSURANCE_SLICE_REFS"] : []),
    ...(!continuityExact ? ["CONTINUITY_EVIDENCE_DRIFT"] : []),
    ...(!publicationSatisfied ? ["PUBLICATION_PARITY_NOT_EXACT"] : []),
    ...(!routePostureSatisfied ? [`ROUTE_POSTURE_${input.routePostureState.toUpperCase()}`] : []),
    ...(!provenanceSatisfied ? [`PROVENANCE_STATE_${input.provenanceState.toUpperCase()}`] : []),
    ...(!trustFreezeLive ? ["RELEASE_TRUST_FREEZE_NOT_LIVE"] : []),
    ...(assuranceHardBlock ? ["ASSURANCE_HARD_BLOCK"] : []),
  ];

  let watchState: ReleaseWatchState;
  let observationState: ObservationWindowState;
  let policyState: WaveObservationPolicyState;
  let tupleState = tupleValidation.tupleState;

  if (input.policy.policyState === "superseded" || input.tuple.tupleState === "superseded") {
    watchState = "stale";
    observationState = "superseded";
    policyState = "superseded";
    tupleState = "superseded";
  } else if (anyTriggered) {
    watchState = "rollback_required";
    observationState = windowExpired ? "expired" : "open";
    policyState = "blocked";
  } else if (
    tupleValidation.refusalReasonRefs.length > 0 ||
    policyValidation.refusalReasonRefs.length > 0 ||
    runtimeTruthDrifted
  ) {
    watchState = "stale";
    observationState = "open";
    policyState = input.policy.policyState;
    tupleState = "stale";
  } else if (
    dwellSatisfied &&
    sampleSatisfied &&
    allProbesPassed &&
    continuityExact &&
    publicationSatisfied &&
    routePostureSatisfied &&
    provenanceSatisfied &&
    trustFreezeLive &&
    !assuranceHardBlock &&
    missingAssuranceRefs.length === 0
  ) {
    watchState = "satisfied";
    observationState = "satisfied";
    policyState = "satisfied";
  } else if (windowExpired || probeState.failedProbeRefs.length > 0) {
    watchState = "blocked";
    observationState = "expired";
    policyState = "blocked";
  } else {
    watchState = "accepted";
    observationState = sampleSatisfied ? "extended" : "open";
    policyState = "armed";
  }

  const updatedTuple: ReleaseWatchTupleContract = {
    ...input.tuple,
    tupleState,
    staleReasonRefs: watchState === "stale" ? driftReasonRefs : input.tuple.staleReasonRefs,
  };
  const updatedPolicy: WaveObservationPolicyContract = {
    ...input.policy,
    policyState,
  };
  const updatedObservationWindow: WaveObservationWindow = {
    ...input.observationWindow,
    observedRuntimePublicationBundleRef: input.currentTuple.runtimePublicationBundleRef,
    observedPublicationParityRef: input.currentTuple.releasePublicationParityRef,
    observedContinuityEvidenceDigestRefs: uniqueSorted(input.currentContinuityEvidenceDigestRefs),
    observedRoutePostureState: input.routePostureState,
    observedProvenanceState: input.provenanceState,
    observedRollbackReadinessState: rollbackReadinessState,
    observedProbeStates: probeState.stateMap,
    observationState,
    watchState,
    triggerState: anyTriggered ? "triggered" : "clear",
    reasonRefs:
      watchState === "satisfied"
        ? [`STABILIZATION_CRITERIA_MET::${input.policy.stabilizationCriteriaRef}`]
        : driftReasonRefs,
    operationalReadinessSnapshotRef: input.currentPolicy.operationalReadinessSnapshotRef,
    observedSamples,
    evaluatedAt: input.now,
    closedAt: observationState === "satisfied" || observationState === "expired" ? input.now : null,
  };

  const actionEligibility = evaluateActionEligibility({
    tupleState: updatedTuple.tupleState,
    policyState: updatedPolicy.policyState,
    watchState,
    observationState,
    triggerEvaluations,
  });

  return {
    tuple: updatedTuple,
    policy: updatedPolicy,
    tupleValidation: {
      ...tupleValidation,
      tupleState: updatedTuple.tupleState,
      valid:
        tupleValidation.refusalReasonRefs.length === 0 && updatedTuple.tupleState !== "superseded",
    },
    policyValidation: {
      ...policyValidation,
      policyState: updatedPolicy.policyState,
      valid:
        policyValidation.refusalReasonRefs.length === 0 &&
        updatedPolicy.policyState !== "superseded",
    },
    observationWindow: updatedObservationWindow,
    triggerEvaluations,
    actionEligibility,
    watchState,
  };
}

function waveKey(releaseRef: string, waveRef: string): string {
  return `${releaseRef}::${waveRef}`;
}

function createTimelineEvent(
  input: Omit<ReleaseWatchTimelineEvent, "timelineEventId" | "payloadHash"> & {
    sequence: number;
  },
): ReleaseWatchTimelineEvent {
  return {
    timelineEventId: `rwt-event::${String(input.sequence).padStart(4, "0")}`,
    payloadHash: stableDigest({
      releaseRef: input.releaseRef,
      waveRef: input.waveRef,
      eventType: input.eventType,
      reasonRefs: uniqueSorted(input.reasonRefs),
      recordedAt: input.recordedAt,
      tupleRef: input.releaseWatchTupleRef,
      policyRef: input.waveObservationPolicyRef,
      observationWindowRef: input.observationWindowRef,
    }),
    releaseRef: input.releaseRef,
    waveRef: input.waveRef,
    releaseWatchTupleRef: input.releaseWatchTupleRef,
    waveObservationPolicyRef: input.waveObservationPolicyRef,
    observationWindowRef: input.observationWindowRef,
    eventType: input.eventType,
    reasonRefs: input.reasonRefs,
    recordedAt: input.recordedAt,
    sourceRefs: input.sourceRefs,
  };
}

export class ReleaseWatchPipelineStore {
  private tuples = new Map<string, ReleaseWatchTupleContract>();
  private policies = new Map<string, WaveObservationPolicyContract>();
  private windows = new Map<string, WaveObservationWindow>();
  private evaluations = new Map<string, ReleaseWatchEvaluationResult>();
  private activeTupleRefs = new Map<string, string>();
  private activePolicyRefs = new Map<string, string>();
  private activeObservationRefs = new Map<string, string>();
  private timeline: ReleaseWatchTimelineEvent[] = [];

  saveTuple(tuple: ReleaseWatchTupleContract): void {
    this.tuples.set(tuple.releaseWatchTupleId, tuple);
    if (tuple.tupleState === "active") {
      this.activeTupleRefs.set(waveKey(tuple.releaseRef, tuple.waveRef), tuple.releaseWatchTupleId);
    }
  }

  savePolicy(policy: WaveObservationPolicyContract): void {
    this.policies.set(policy.waveObservationPolicyId, policy);
    if (policy.policyState !== "superseded") {
      this.activePolicyRefs.set(
        waveKey(policy.releaseRef, policy.waveRef),
        policy.waveObservationPolicyId,
      );
    }
  }

  saveObservationWindow(window: WaveObservationWindow, releaseRef: string, waveRef: string): void {
    this.windows.set(window.observationWindowId, window);
    if (window.observationState !== "superseded") {
      this.activeObservationRefs.set(waveKey(releaseRef, waveRef), window.observationWindowId);
    }
  }

  saveEvaluation(result: ReleaseWatchEvaluationResult): void {
    this.evaluations.set(result.tuple.releaseWatchTupleId, result);
  }

  getTuple(tupleRef: string): ReleaseWatchTupleContract | undefined {
    return this.tuples.get(tupleRef);
  }

  getPolicy(policyRef: string): WaveObservationPolicyContract | undefined {
    return this.policies.get(policyRef);
  }

  getObservationWindow(observationWindowRef: string): WaveObservationWindow | undefined {
    return this.windows.get(observationWindowRef);
  }

  getActiveTuple(releaseRef: string, waveRef: string): ReleaseWatchTupleContract | undefined {
    const ref = this.activeTupleRefs.get(waveKey(releaseRef, waveRef));
    return ref ? this.tuples.get(ref) : undefined;
  }

  getActivePolicy(releaseRef: string, waveRef: string): WaveObservationPolicyContract | undefined {
    const ref = this.activePolicyRefs.get(waveKey(releaseRef, waveRef));
    return ref ? this.policies.get(ref) : undefined;
  }

  getActiveObservationWindow(
    releaseRef: string,
    waveRef: string,
  ): WaveObservationWindow | undefined {
    const ref = this.activeObservationRefs.get(waveKey(releaseRef, waveRef));
    return ref ? this.windows.get(ref) : undefined;
  }

  getEvaluation(tupleRef: string): ReleaseWatchEvaluationResult | undefined {
    return this.evaluations.get(tupleRef);
  }

  appendTimeline(
    input: Omit<ReleaseWatchTimelineEvent, "timelineEventId" | "payloadHash">,
  ): ReleaseWatchTimelineEvent {
    const event = createTimelineEvent({
      ...input,
      sequence: this.timeline.length + 1,
    });
    this.timeline.push(event);
    return event;
  }

  getTimeline(): readonly ReleaseWatchTimelineEvent[] {
    return this.timeline;
  }

  collectMetrics(): ReleaseWatchMetricsSnapshot {
    const tuples = Array.from(this.tuples.values());
    const policies = Array.from(this.policies.values());
    const evaluations = Array.from(this.evaluations.values());
    return {
      activeTupleCount: tuples.filter((tuple) => tuple.tupleState === "active").length,
      staleTupleCount: tuples.filter((tuple) => tuple.tupleState === "stale").length,
      blockedPolicyCount: policies.filter((policy) => policy.policyState === "blocked").length,
      supersededTupleCount: tuples.filter((tuple) => tuple.tupleState === "superseded").length,
      rollbackTriggerActivationCount: evaluations.reduce(
        (count, evaluation) =>
          count +
          evaluation.triggerEvaluations.filter((trigger) => trigger.triggerState === "triggered")
            .length,
        0,
      ),
      observationWindowCount: this.windows.size,
      timelineEventCount: this.timeline.length,
    };
  }
}

export class ReleaseWatchPipelineCoordinator {
  readonly store: ReleaseWatchPipelineStore;

  constructor(store = new ReleaseWatchPipelineStore()) {
    this.store = store;
  }

  publish(input: {
    tuple: Omit<
      ReleaseWatchTupleContract,
      | "watchTupleHash"
      | "tupleState"
      | "supersededByReleaseWatchTupleRef"
      | "staleReasonRefs"
      | "closedAt"
    >;
    policy: Omit<
      WaveObservationPolicyContract,
      "policyHash" | "policyState" | "supersededByWaveObservationPolicyRef"
    >;
    reasonRefs?: readonly string[];
  }): ReleaseWatchPublishResult {
    const reasonRefs = input.reasonRefs ?? [];
    const nextTuple = createReleaseWatchTuple({
      ...input.tuple,
      waveObservationPolicyRef: input.policy.waveObservationPolicyId,
      tupleState: "active",
    });
    const nextPolicy = createWaveObservationPolicy({
      ...input.policy,
      watchTupleHash: nextTuple.watchTupleHash,
      policyState: "armed",
    });

    const existingTuple = this.store.getActiveTuple(nextTuple.releaseRef, nextTuple.waveRef);
    const existingPolicy = this.store.getActivePolicy(nextTuple.releaseRef, nextTuple.waveRef);
    if (
      existingTuple &&
      existingPolicy &&
      existingTuple.watchTupleHash === nextTuple.watchTupleHash &&
      existingPolicy.policyHash === nextPolicy.policyHash
    ) {
      const existingWindow = this.store.getActiveObservationWindow(
        nextTuple.releaseRef,
        nextTuple.waveRef,
      );
      if (!existingWindow) {
        throw new Error("RELEASE_WATCH_OBSERVATION_WINDOW_MISSING");
      }
      return {
        acceptedState: "deduplicated",
        tuple: existingTuple,
        policy: existingPolicy,
        observationWindow: existingWindow,
      };
    }

    if (existingTuple) {
      const supersededTuple: ReleaseWatchTupleContract = {
        ...existingTuple,
        tupleState: "superseded",
        supersededByReleaseWatchTupleRef: nextTuple.releaseWatchTupleId,
      };
      this.store.saveTuple(supersededTuple);
      this.store.appendTimeline({
        releaseRef: supersededTuple.releaseRef,
        waveRef: supersededTuple.waveRef,
        releaseWatchTupleRef: supersededTuple.releaseWatchTupleId,
        waveObservationPolicyRef: existingPolicy?.waveObservationPolicyId ?? null,
        observationWindowRef:
          this.store.getActiveObservationWindow(supersededTuple.releaseRef, supersededTuple.waveRef)
            ?.observationWindowId ?? null,
        eventType: "tuple_superseded",
        reasonRefs,
        recordedAt: nextTuple.publishedAt,
        sourceRefs: ["release-watch-pipeline.ts"],
      });
    }
    if (existingPolicy) {
      const supersededPolicy: WaveObservationPolicyContract = {
        ...existingPolicy,
        policyState: "superseded",
        supersededByWaveObservationPolicyRef: nextPolicy.waveObservationPolicyId,
      };
      this.store.savePolicy(supersededPolicy);
      this.store.appendTimeline({
        releaseRef: supersededPolicy.releaseRef,
        waveRef: supersededPolicy.waveRef,
        releaseWatchTupleRef: existingTuple?.releaseWatchTupleId ?? null,
        waveObservationPolicyRef: supersededPolicy.waveObservationPolicyId,
        observationWindowRef:
          this.store.getActiveObservationWindow(
            supersededPolicy.releaseRef,
            supersededPolicy.waveRef,
          )?.observationWindowId ?? null,
        eventType: "policy_superseded",
        reasonRefs,
        recordedAt: nextPolicy.publishedAt,
        sourceRefs: ["release-watch-pipeline.ts"],
      });
    }

    const observationWindow: WaveObservationWindow = {
      observationWindowId: `wow::${nextTuple.releaseRef.toLowerCase()}::${nextTuple.waveRef.toLowerCase()}::${nextTuple.releaseWatchTupleId.toLowerCase()}`,
      releaseWatchTupleRef: nextTuple.releaseWatchTupleId,
      waveObservationPolicyRef: nextPolicy.waveObservationPolicyId,
      watchTupleHash: nextTuple.watchTupleHash,
      policyHash: nextPolicy.policyHash,
      startsAt: nextTuple.publishedAt,
      closesAt: addDuration(nextTuple.publishedAt, nextPolicy.minimumDwellDuration),
      requiredProbeRefs: nextPolicy.requiredProbeRefs,
      observedRuntimePublicationBundleRef: nextTuple.runtimePublicationBundleRef,
      observedPublicationParityRef: nextTuple.releasePublicationParityRef,
      observedContinuityEvidenceDigestRefs: nextPolicy.requiredContinuityEvidenceDigestRefs,
      observedRoutePostureState: "converged",
      observedProvenanceState: "verified",
      observedRollbackReadinessState: "constrained",
      observedProbeStates: Object.fromEntries(
        nextPolicy.requiredProbeRefs.map((probeRef) => [probeRef, "pending"]),
      ),
      observationState: "open",
      watchState: "accepted",
      triggerState: "armed",
      reasonRefs: [],
      operationalReadinessSnapshotRef: nextPolicy.operationalReadinessSnapshotRef,
      observedSamples: 0,
      evaluatedAt: nextTuple.publishedAt,
      closedAt: null,
    };

    this.store.saveTuple(nextTuple);
    this.store.savePolicy(nextPolicy);
    this.store.saveObservationWindow(observationWindow, nextTuple.releaseRef, nextTuple.waveRef);
    this.store.appendTimeline({
      releaseRef: nextTuple.releaseRef,
      waveRef: nextTuple.waveRef,
      releaseWatchTupleRef: nextTuple.releaseWatchTupleId,
      waveObservationPolicyRef: nextPolicy.waveObservationPolicyId,
      observationWindowRef: null,
      eventType: "tuple_published",
      reasonRefs,
      recordedAt: nextTuple.publishedAt,
      sourceRefs: nextTuple.sourceRefs,
    });
    this.store.appendTimeline({
      releaseRef: nextPolicy.releaseRef,
      waveRef: nextPolicy.waveRef,
      releaseWatchTupleRef: nextTuple.releaseWatchTupleId,
      waveObservationPolicyRef: nextPolicy.waveObservationPolicyId,
      observationWindowRef: null,
      eventType: "policy_published",
      reasonRefs,
      recordedAt: nextPolicy.publishedAt,
      sourceRefs: nextPolicy.sourceRefs,
    });
    this.store.appendTimeline({
      releaseRef: nextTuple.releaseRef,
      waveRef: nextTuple.waveRef,
      releaseWatchTupleRef: nextTuple.releaseWatchTupleId,
      waveObservationPolicyRef: nextPolicy.waveObservationPolicyId,
      observationWindowRef: observationWindow.observationWindowId,
      eventType: "observation_window_opened",
      reasonRefs,
      recordedAt: observationWindow.startsAt,
      sourceRefs: ["release-watch-pipeline.ts"],
    });
    return {
      acceptedState: "accepted",
      tuple: nextTuple,
      policy: nextPolicy,
      observationWindow,
    };
  }

  evaluate(
    input: Omit<ReleaseWatchEvaluationInput, "tuple" | "policy" | "observationWindow"> & {
      releaseRef: string;
      waveRef: string;
    },
  ): ReleaseWatchEvaluationResult {
    const tuple = this.store.getActiveTuple(input.releaseRef, input.waveRef);
    const policy = this.store.getActivePolicy(input.releaseRef, input.waveRef);
    const observationWindow = this.store.getActiveObservationWindow(
      input.releaseRef,
      input.waveRef,
    );
    if (!tuple || !policy || !observationWindow) {
      throw new Error(`RELEASE_WATCH_NOT_PUBLISHED:${input.releaseRef}:${input.waveRef}`);
    }
    const result = evaluateReleaseWatchPipeline({
      ...input,
      tuple,
      currentTuple: input.currentTuple,
      policy,
      currentPolicy: input.currentPolicy,
      observationWindow,
    });
    this.store.saveTuple(result.tuple);
    this.store.savePolicy(result.policy);
    this.store.saveObservationWindow(
      result.observationWindow,
      result.tuple.releaseRef,
      result.tuple.waveRef,
    );
    this.store.saveEvaluation(result);
    this.store.appendTimeline({
      releaseRef: result.tuple.releaseRef,
      waveRef: result.tuple.waveRef,
      releaseWatchTupleRef: result.tuple.releaseWatchTupleId,
      waveObservationPolicyRef: result.policy.waveObservationPolicyId,
      observationWindowRef: result.observationWindow.observationWindowId,
      eventType: "observation_evaluated",
      reasonRefs: result.observationWindow.reasonRefs,
      recordedAt: input.now,
      sourceRefs: ["release-watch-pipeline.ts"],
    });
    this.store.appendTimeline({
      releaseRef: result.tuple.releaseRef,
      waveRef: result.tuple.waveRef,
      releaseWatchTupleRef: result.tuple.releaseWatchTupleId,
      waveObservationPolicyRef: result.policy.waveObservationPolicyId,
      observationWindowRef: result.observationWindow.observationWindowId,
      eventType: "rollback_trigger_evaluated",
      reasonRefs: result.triggerEvaluations.flatMap((trigger) => trigger.reasonRefs),
      recordedAt: input.now,
      sourceRefs: ["release-watch-pipeline.ts"],
    });
    this.store.appendTimeline({
      releaseRef: result.tuple.releaseRef,
      waveRef: result.tuple.waveRef,
      releaseWatchTupleRef: result.tuple.releaseWatchTupleId,
      waveObservationPolicyRef: result.policy.waveObservationPolicyId,
      observationWindowRef: result.observationWindow.observationWindowId,
      eventType: "action_eligibility_refreshed",
      reasonRefs: result.actionEligibility.flatMap((row) => row.blockingReasonRefs),
      recordedAt: input.now,
      sourceRefs: ["release-watch-pipeline.ts"],
    });
    return result;
  }

  close(input: { releaseRef: string; waveRef: string; now: string }): ReleaseWatchTupleContract {
    const tuple = this.store.getActiveTuple(input.releaseRef, input.waveRef);
    const observationWindow = this.store.getActiveObservationWindow(
      input.releaseRef,
      input.waveRef,
    );
    if (!tuple || !observationWindow) {
      throw new Error(`RELEASE_WATCH_NOT_PUBLISHED:${input.releaseRef}:${input.waveRef}`);
    }
    const evaluation = this.store.getEvaluation(tuple.releaseWatchTupleId);
    const closeEligibility = evaluation?.actionEligibility.find(
      (row) => row.waveActionType === "close",
    );
    if (!closeEligibility?.allowed) {
      throw new Error(
        `RELEASE_WATCH_CLOSE_BLOCKED:${closeEligibility?.blockingReasonRefs.join(",") ?? "NOT_EVALUATED"}`,
      );
    }
    const closedTuple: ReleaseWatchTupleContract = {
      ...tuple,
      tupleState: "closed",
      closedAt: input.now,
    };
    const closedWindow: WaveObservationWindow = {
      ...observationWindow,
      observationState: "satisfied",
      closedAt: input.now,
    };
    this.store.saveTuple(closedTuple);
    this.store.saveObservationWindow(closedWindow, input.releaseRef, input.waveRef);
    this.store.appendTimeline({
      releaseRef: input.releaseRef,
      waveRef: input.waveRef,
      releaseWatchTupleRef: tuple.releaseWatchTupleId,
      waveObservationPolicyRef:
        this.store.getActivePolicy(input.releaseRef, input.waveRef)?.waveObservationPolicyId ??
        null,
      observationWindowRef: observationWindow.observationWindowId,
      eventType: "tuple_closed",
      reasonRefs: ["OBSERVATION_POLICY_SATISFIED"],
      recordedAt: input.now,
      sourceRefs: ["release-watch-pipeline.ts"],
    });
    return closedTuple;
  }

  inspect(releaseRef: string, waveRef: string) {
    const tuple = this.store.getActiveTuple(releaseRef, waveRef);
    const policy = this.store.getActivePolicy(releaseRef, waveRef);
    const observationWindow = this.store.getActiveObservationWindow(releaseRef, waveRef);
    return {
      tuple,
      policy,
      observationWindow,
      evaluation: tuple ? (this.store.getEvaluation(tuple.releaseWatchTupleId) ?? null) : null,
      metrics: this.store.collectMetrics(),
      timeline: this.store
        .getTimeline()
        .filter((row) => row.releaseRef === releaseRef && row.waveRef === waveRef),
    };
  }
}

export function createReleaseWatchPipelineSimulationHarness() {
  const publicationHarness = createRuntimePublicationSimulationHarness();
  const coordinator = new ReleaseWatchPipelineCoordinator();
  const published = coordinator.publish({
    tuple: {
      releaseWatchTupleId: "rwt::simulation",
      releaseRef: "rc::simulation",
      promotionIntentRef: "promotion-intent::simulation",
      approvalEvidenceBundleRef: "approval-evidence::simulation",
      baselineTupleHash: "baseline::simulation",
      approvalTupleHash: "approval::simulation",
      releaseApprovalFreezeRef: publicationHarness.bundle.releaseApprovalFreezeRef,
      runtimePublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
      releasePublicationParityRef: publicationHarness.parityRecord.publicationParityRecordId,
      waveRef: "wave::simulation",
      waveEligibilitySnapshotRef: "wave-eligibility::simulation",
      waveGuardrailSnapshotRef: "wave-guardrail::simulation",
      waveObservationPolicyRef: "wop::simulation",
      waveControlFenceRef: "wave-control-fence::simulation",
      tenantScopeMode: "platform",
      tenantScopeRef: "scope://simulation/platform",
      affectedTenantCount: 0,
      affectedOrganisationCount: 0,
      tenantScopeTupleHash: "tenant-scope::simulation",
      requiredAssuranceSliceRefs: ["asr::release-watch", "asr::runtime-publication"],
      releaseTrustFreezeVerdictRefs: ["rtfv::simulation::live"],
      requiredContinuityControlRefs: ["patient_nav", "workspace_task_completion"],
      continuityEvidenceDigestRefs: ["continuity::patient-nav", "continuity::workspace-task"],
      activeChannelFreezeRefs: ["channel-freeze::browser"],
      recoveryDispositionRefs: ["recovery-disposition::read-only"],
      publishedAt: "2026-04-13T12:00:00.000Z",
      sourceRefs: ["release-watch-pipeline.ts"],
    },
    policy: {
      waveObservationPolicyId: "wop::simulation",
      releaseRef: "rc::simulation",
      waveRef: "wave::simulation",
      promotionIntentRef: "promotion-intent::simulation",
      releaseApprovalFreezeRef: publicationHarness.bundle.releaseApprovalFreezeRef,
      waveEligibilitySnapshotRef: "wave-eligibility::simulation",
      watchTupleHash: "placeholder",
      minimumDwellDuration: "PT15M",
      minimumObservationSamples: 2,
      requiredProbeRefs: ["probe.simulation.parity", "probe.simulation.synthetic"],
      requiredContinuityControlRefs: ["patient_nav", "workspace_task_completion"],
      requiredContinuityEvidenceDigestRefs: [
        "continuity::patient-nav",
        "continuity::workspace-task",
      ],
      requiredPublicationParityState: "exact",
      requiredRoutePostureState: "converged",
      requiredProvenanceState: "verified",
      stabilizationCriteriaRef: "STAB_SIMULATION_EXACT",
      rollbackTriggerRefs: [
        "rollback.simulation.parity-drift",
        "rollback.simulation.synthetic-journey",
      ],
      gapResolutionRefs: [
        "GAP_RESOLUTION_WAVE_POLICY_MINIMUM_SAMPLE_COUNT",
        "GAP_RESOLUTION_WAVE_POLICY_PROBE_STALENESS_BUDGET",
      ],
      operationalReadinessSnapshotRef:
        "FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT",
      publishedAt: "2026-04-13T12:00:00.000Z",
      sourceRefs: ["release-watch-pipeline.ts"],
    },
  });

  const probeCatalog: WaveObservationProbeDefinition[] = [
    {
      probeRef: "probe.simulation.parity",
      probeClass: "publication_parity",
      label: "Publication parity exactness",
      description: "Checks that runtime publication and parity remain exact for the active tuple.",
      staleAfterMinutes: 20,
      requiredForSatisfaction: true,
      failureSeverity: "critical",
      sourceRefs: ["release-watch-pipeline.ts"],
    },
    {
      probeRef: "probe.simulation.synthetic",
      probeClass: "synthetic_user_journey",
      label: "Critical synthetic path",
      description: "Checks one critical user journey before widening or close-out.",
      staleAfterMinutes: 20,
      requiredForSatisfaction: true,
      failureSeverity: "critical",
      sourceRefs: ["release-watch-pipeline.ts"],
    },
  ];
  const probeReadings: WaveObservationProbeReading[] = [
    {
      probeRef: "probe.simulation.parity",
      state: "passed",
      observedAt: "2026-04-13T12:20:00.000Z",
      evidenceRefs: ["evidence::parity"],
      severity: "info",
      summary: "Runtime publication parity remained exact.",
    },
    {
      probeRef: "probe.simulation.synthetic",
      state: "passed",
      observedAt: "2026-04-13T12:22:00.000Z",
      evidenceRefs: ["evidence::synthetic"],
      severity: "info",
      summary: "Critical synthetic journey completed successfully.",
    },
  ];
  const evaluation = coordinator.evaluate({
    releaseRef: published.tuple.releaseRef,
    waveRef: published.tuple.waveRef,
    currentTuple: {
      releaseRef: published.tuple.releaseRef,
      promotionIntentRef: published.tuple.promotionIntentRef,
      approvalEvidenceBundleRef: published.tuple.approvalEvidenceBundleRef,
      baselineTupleHash: published.tuple.baselineTupleHash,
      approvalTupleHash: published.tuple.approvalTupleHash,
      releaseApprovalFreezeRef: published.tuple.releaseApprovalFreezeRef,
      runtimePublicationBundleRef: published.tuple.runtimePublicationBundleRef,
      releasePublicationParityRef: published.tuple.releasePublicationParityRef,
      waveRef: published.tuple.waveRef,
      waveEligibilitySnapshotRef: published.tuple.waveEligibilitySnapshotRef,
      waveGuardrailSnapshotRef: published.tuple.waveGuardrailSnapshotRef,
      waveObservationPolicyRef: published.tuple.waveObservationPolicyRef,
      waveControlFenceRef: published.tuple.waveControlFenceRef,
      tenantScopeMode: published.tuple.tenantScopeMode,
      tenantScopeRef: published.tuple.tenantScopeRef,
      affectedTenantCount: published.tuple.affectedTenantCount,
      affectedOrganisationCount: published.tuple.affectedOrganisationCount,
      tenantScopeTupleHash: published.tuple.tenantScopeTupleHash,
      requiredAssuranceSliceRefs: published.tuple.requiredAssuranceSliceRefs,
      releaseTrustFreezeVerdictRefs: published.tuple.releaseTrustFreezeVerdictRefs,
      requiredContinuityControlRefs: published.tuple.requiredContinuityControlRefs,
      continuityEvidenceDigestRefs: published.tuple.continuityEvidenceDigestRefs,
      activeChannelFreezeRefs: published.tuple.activeChannelFreezeRefs,
      recoveryDispositionRefs: published.tuple.recoveryDispositionRefs,
    },
    currentPolicy: {
      releaseRef: published.policy.releaseRef,
      waveRef: published.policy.waveRef,
      promotionIntentRef: published.policy.promotionIntentRef,
      releaseApprovalFreezeRef: published.policy.releaseApprovalFreezeRef,
      waveEligibilitySnapshotRef: published.policy.waveEligibilitySnapshotRef,
      watchTupleHash: published.tuple.watchTupleHash,
      minimumDwellDuration: published.policy.minimumDwellDuration,
      minimumObservationSamples: published.policy.minimumObservationSamples,
      requiredProbeRefs: published.policy.requiredProbeRefs,
      requiredContinuityControlRefs: published.policy.requiredContinuityControlRefs,
      requiredContinuityEvidenceDigestRefs: published.policy.requiredContinuityEvidenceDigestRefs,
      requiredPublicationParityState: published.policy.requiredPublicationParityState,
      requiredRoutePostureState: published.policy.requiredRoutePostureState,
      requiredProvenanceState: published.policy.requiredProvenanceState,
      stabilizationCriteriaRef: published.policy.stabilizationCriteriaRef,
      rollbackTriggerRefs: published.policy.rollbackTriggerRefs,
      gapResolutionRefs: published.policy.gapResolutionRefs,
      operationalReadinessSnapshotRef: published.policy.operationalReadinessSnapshotRef,
    },
    publicationVerdict: publicationHarness.verdict,
    probeCatalog,
    probeReadings,
    routePostureState: "converged",
    provenanceState: "verified",
    currentContinuityEvidenceDigestRefs: published.policy.requiredContinuityEvidenceDigestRefs,
    currentAssuranceSliceRefs: published.tuple.requiredAssuranceSliceRefs,
    trustFreezeLive: true,
    assuranceHardBlock: false,
    rollbackReadinessState: "ready",
    now: "2026-04-13T12:30:00.000Z",
    observedSamples: 2,
  });

  return {
    coordinator,
    store: coordinator.store,
    tuple: published.tuple,
    policy: published.policy,
    observationWindow: published.observationWindow,
    evaluation,
    probeCatalog,
    probeReadings,
    publicationHarness,
  };
}

export function runReleaseWatchSimulation() {
  return createReleaseWatchPipelineSimulationHarness();
}
