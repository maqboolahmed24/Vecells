import { stableDigest, type BuildProvenanceState } from "./build-provenance";
import type {
  ObservationWindowState,
  ReleaseWatchRollbackReadinessState,
  ReleaseWatchState,
} from "./release-watch-pipeline";
import type {
  ReleasePublicationParityState,
  RouteExposureState,
  RuntimePublicationState,
} from "./runtime-publication";
import type { OperationalReadinessState } from "./resilience-baseline";

export type WaveActionType =
  | "canary_start"
  | "widen"
  | "pause"
  | "rollback"
  | "rollforward"
  | "kill_switch";

export type WaveGuardrailState =
  | "green"
  | "constrained"
  | "rollback_review_required"
  | "frozen";

export type WaveActionPreviewState = "preview" | "blocked" | "superseded";
export type WaveActionExecutionState = "accepted" | "deduplicated" | "blocked";
export type WaveActionObservationState =
  | "pending"
  | "observed"
  | "satisfied"
  | "constrained"
  | "rollback_required"
  | "superseded";
export type WaveActionSettlementState =
  | "accepted_pending_observation"
  | "satisfied"
  | "constrained"
  | "rollback_required"
  | "superseded"
  | "blocked";
export type CanaryCockpitState =
  | "preview"
  | "accepted"
  | "observed"
  | "satisfied"
  | "constrained"
  | "rollback_required"
  | "superseded";
export type WaveTrustState = "live" | "degraded" | "quarantined";
export type WaveContinuityState = "healthy" | "constrained" | "breached";
export type WaveTupleFreshnessState = "current" | "drifted" | "superseded";
export type WaveRecoveryDispositionState =
  | "normal"
  | "read_only"
  | "recovery_only"
  | "kill_switch_active";
export type WaveActionRecordState =
  | "previewed"
  | "accepted"
  | "deduplicated"
  | "blocked"
  | "settled"
  | "superseded";
export type WaveActionAuditKind =
  | "previewed"
  | "submitted"
  | "deduplicated"
  | "blocked"
  | "observed"
  | "settled"
  | "superseded";

export interface WaveBlastRadius {
  affectedTenantCount: number;
  affectedOrganisationCount: number;
  affectedRouteFamilyRefs: readonly string[];
  affectedAudienceSurfaceRefs: readonly string[];
  affectedGatewaySurfaceRefs: readonly string[];
  blastRadiusClass: "narrow" | "medium" | "broad";
}

export interface WaveActionContext {
  environmentRing: string;
  releaseRef: string;
  actionType: WaveActionType;
  requestedBy: string;
  idempotencyKey: string;
  runtimePublicationBundleRef: string;
  targetPublicationBundleRef: string;
  rollbackTargetPublicationBundleRef: string | null;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  waveControlFenceRef: string;
  operationalReadinessSnapshotRef: string;
  buildProvenanceRef: string;
  activeChannelFreezeRefs: readonly string[];
  recoveryDispositionRefs: readonly string[];
  rollbackRunbookBindingRefs: readonly string[];
  rollbackReadinessEvidenceRefs: readonly string[];
  affectedTenantCount: number;
  affectedOrganisationCount: number;
  affectedRouteFamilyRefs: readonly string[];
  affectedAudienceSurfaceRefs: readonly string[];
  affectedGatewaySurfaceRefs: readonly string[];
  watchState: ReleaseWatchState;
  observationState: ObservationWindowState;
  rollbackReadinessState: ReleaseWatchRollbackReadinessState;
  readinessState: OperationalReadinessState;
  publicationState: RuntimePublicationState;
  parityState: ReleasePublicationParityState;
  routeExposureState: RouteExposureState;
  buildProvenanceState: BuildProvenanceState;
  trustState: WaveTrustState;
  continuityState: WaveContinuityState;
  tupleFreshnessState: WaveTupleFreshnessState;
  recoveryDispositionState: WaveRecoveryDispositionState;
  currentTupleHash: string;
  targetTupleHash: string;
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  sourceRefs: readonly string[];
  now: string;
}

export interface WaveGuardrailSnapshot {
  waveGuardrailSnapshotId: string;
  releaseRef: string;
  environmentRing: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  waveControlFenceRef: string;
  operationalReadinessSnapshotRef: string;
  buildProvenanceRef: string;
  publicationState: RuntimePublicationState;
  parityState: ReleasePublicationParityState;
  routeExposureState: RouteExposureState;
  watchState: ReleaseWatchState;
  rollbackReadinessState: ReleaseWatchRollbackReadinessState;
  readinessState: OperationalReadinessState;
  buildProvenanceState: BuildProvenanceState;
  trustState: WaveTrustState;
  continuityState: WaveContinuityState;
  tupleFreshnessState: WaveTupleFreshnessState;
  recoveryDispositionState: WaveRecoveryDispositionState;
  guardrailState: WaveGuardrailState;
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  guardrailHash: string;
  generatedAt: string;
  sourceRefs: readonly string[];
}

export interface WaveActionImpactPreview {
  waveActionImpactPreviewId: string;
  releaseRef: string;
  environmentRing: string;
  actionType: WaveActionType;
  previewState: WaveActionPreviewState;
  expectedObservationState: WaveActionObservationState;
  expectedSettlementState: WaveActionSettlementState;
  expectedCockpitState: CanaryCockpitState;
  runtimePublicationBundleRef: string;
  targetPublicationBundleRef: string;
  rollbackTargetPublicationBundleRef: string | null;
  releasePublicationParityRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  waveControlFenceRef: string;
  operationalReadinessSnapshotRef: string;
  buildProvenanceRef: string;
  waveGuardrailSnapshotRef: string;
  rollbackRunbookBindingRefs: readonly string[];
  rollbackReadinessEvidenceRefs: readonly string[];
  blastRadius: WaveBlastRadius;
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  previewHash: string;
  generatedAt: string;
  sourceRefs: readonly string[];
}

export interface WaveActionRecord {
  waveActionRecordId: string;
  releaseRef: string;
  environmentRing: string;
  actionType: WaveActionType;
  impactPreviewRef: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  operationalReadinessSnapshotRef: string;
  runtimePublicationBundleRef: string;
  targetPublicationBundleRef: string;
  rollbackTargetPublicationBundleRef: string | null;
  requestedBy: string;
  idempotencyKey: string;
  actionHash: string;
  recordState: WaveActionRecordState;
  submittedAt: string;
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  sourceRefs: readonly string[];
}

export interface WaveActionExecutionReceipt {
  waveActionExecutionReceiptId: string;
  waveActionRecordRef: string;
  impactPreviewRef: string;
  releaseRef: string;
  environmentRing: string;
  actionType: WaveActionType;
  executionState: WaveActionExecutionState;
  runtimePublicationBundleRef: string;
  targetPublicationBundleRef: string;
  rollbackTargetPublicationBundleRef: string | null;
  issuedTupleHash: string;
  targetTupleHash: string;
  recoveryDispositionState: WaveRecoveryDispositionState;
  executionEvidenceRefs: readonly string[];
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  executedAt: string;
  sourceRefs: readonly string[];
}

export interface WaveActionObservationWindow {
  waveActionObservationWindowId: string;
  waveActionRecordRef: string;
  waveActionExecutionReceiptRef: string;
  impactPreviewRef: string;
  releaseRef: string;
  environmentRing: string;
  actionType: WaveActionType;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  waveGuardrailSnapshotRef: string;
  operationalReadinessSnapshotRef: string;
  observationState: WaveActionObservationState;
  watchState: ReleaseWatchState;
  rollbackReadinessState: ReleaseWatchRollbackReadinessState;
  observedTrustState: WaveTrustState;
  observedContinuityState: WaveContinuityState;
  observedReadinessState: OperationalReadinessState;
  observedTupleFreshnessState: WaveTupleFreshnessState;
  reasonRefs: readonly string[];
  observedAt: string;
  sourceRefs: readonly string[];
}

export interface WaveActionSettlement {
  waveActionSettlementId: string;
  waveActionRecordRef: string;
  waveActionExecutionReceiptRef: string;
  waveActionObservationWindowRef: string;
  impactPreviewRef: string;
  releaseRef: string;
  environmentRing: string;
  actionType: WaveActionType;
  settlementState: WaveActionSettlementState;
  cockpitState: CanaryCockpitState;
  guardrailState: WaveGuardrailState;
  watchState: ReleaseWatchState;
  rollbackReadinessState: ReleaseWatchRollbackReadinessState;
  recoveryDispositionState: WaveRecoveryDispositionState;
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  settledAt: string;
  sourceRefs: readonly string[];
}

export interface ReleaseWatchEvidenceCockpit {
  releaseWatchEvidenceCockpitId: string;
  releaseRef: string;
  environmentRing: string;
  releaseWatchTupleRef: string;
  waveObservationPolicyRef: string;
  waveControlFenceRef: string;
  operationalReadinessSnapshotRef: string;
  waveGuardrailSnapshotRef: string;
  activeWaveActionImpactPreviewRef: string;
  activeWaveActionExecutionReceiptRef: string;
  activeWaveActionObservationWindowRef: string;
  activeWaveActionSettlementRef: string;
  rollbackTargetPublicationBundleRef: string | null;
  rollbackRunbookBindingRefs: readonly string[];
  rollbackReadinessEvidenceRefs: readonly string[];
  activeChannelFreezeRefs: readonly string[];
  recoveryDispositionRefs: readonly string[];
  cockpitState: CanaryCockpitState;
  cockpitHash: string;
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  generatedAt: string;
  sourceRefs: readonly string[];
}

export interface WaveActionAuditRecord {
  waveActionAuditRecordId: string;
  waveActionRecordRef: string | null;
  auditKind: WaveActionAuditKind;
  actionType: WaveActionType;
  cockpitState: CanaryCockpitState;
  recordedAt: string;
  reasonRefs: readonly string[];
}

export interface CanaryRollbackRehearsal {
  context: WaveActionContext;
  guardrailSnapshot: WaveGuardrailSnapshot;
  impactPreview: WaveActionImpactPreview;
  supersededImpactPreview: WaveActionImpactPreview | null;
  actionRecord: WaveActionRecord;
  executionReceipt: WaveActionExecutionReceipt;
  observationWindow: WaveActionObservationWindow;
  settlement: WaveActionSettlement;
  cockpit: ReleaseWatchEvidenceCockpit;
  auditTrail: readonly WaveActionAuditRecord[];
  history: readonly {
    phase: "preview" | "execute" | "observe" | "settle";
    state: CanaryCockpitState | WaveActionPreviewState;
    ref: string;
  }[];
}

export interface CanaryRollbackMetricsSnapshot {
  actionRecordCount: number;
  acceptedCount: number;
  deduplicatedCount: number;
  blockedCount: number;
  satisfiedCount: number;
  constrainedCount: number;
  rollbackRequiredCount: number;
  supersededCount: number;
  auditRecordCount: number;
}

export interface CanaryRollbackSimulationHarness {
  rehearsal: CanaryRollbackRehearsal;
  metrics: CanaryRollbackMetricsSnapshot;
}

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function classifyBlastRadius(input: {
  affectedTenantCount: number;
  affectedOrganisationCount: number;
  affectedRouteFamilyRefs: readonly string[];
  affectedAudienceSurfaceRefs: readonly string[];
}): "narrow" | "medium" | "broad" {
  const routeCount = uniqueSorted(input.affectedRouteFamilyRefs).length;
  const audienceCount = uniqueSorted(input.affectedAudienceSurfaceRefs).length;
  if (
    input.affectedTenantCount <= 1 &&
    input.affectedOrganisationCount <= 1 &&
    routeCount <= 2 &&
    audienceCount <= 2
  ) {
    return "narrow";
  }
  if (
    input.affectedTenantCount <= 5 &&
    input.affectedOrganisationCount <= 3 &&
    routeCount <= 5 &&
    audienceCount <= 4
  ) {
    return "medium";
  }
  return "broad";
}

function createBlastRadius(context: WaveActionContext): WaveBlastRadius {
  return {
    affectedTenantCount: context.affectedTenantCount,
    affectedOrganisationCount: context.affectedOrganisationCount,
    affectedRouteFamilyRefs: uniqueSorted(context.affectedRouteFamilyRefs),
    affectedAudienceSurfaceRefs: uniqueSorted(context.affectedAudienceSurfaceRefs),
    affectedGatewaySurfaceRefs: uniqueSorted(context.affectedGatewaySurfaceRefs),
    blastRadiusClass: classifyBlastRadius(context),
  };
}

function severePublicationFailure(context: WaveActionContext): boolean {
  return (
    context.publicationState !== "published" ||
    context.parityState !== "exact" ||
    context.routeExposureState === "withdrawn" ||
    context.routeExposureState === "frozen"
  );
}

function severeTrustFailure(context: WaveActionContext): boolean {
  return (
    context.trustState === "quarantined" ||
    context.recoveryDispositionState === "kill_switch_active" ||
    context.activeChannelFreezeRefs.some((ref) => ref.toLowerCase().includes("kill_switch"))
  );
}

function requiresFreshReadiness(context: WaveActionContext): boolean {
  return context.readinessState === "exact_and_ready";
}

function rollbackEvidenceBound(context: WaveActionContext): boolean {
  return (
    context.rollbackTargetPublicationBundleRef !== null &&
    context.rollbackRunbookBindingRefs.length > 0 &&
    context.rollbackReadinessEvidenceRefs.length > 0
  );
}

function createGuardrailBlockers(context: WaveActionContext): {
  guardrailState: WaveGuardrailState;
  blockerRefs: string[];
  warningRefs: string[];
} {
  const blockers = [...context.blockerRefs];
  const warnings = [...context.warningRefs];

  if (severePublicationFailure(context)) {
    blockers.push("GUARDRAIL_PUBLICATION_OR_PARITY_FAILURE");
  }
  if (severeTrustFailure(context)) {
    blockers.push("GUARDRAIL_TRUST_OR_KILL_SWITCH_FAILURE");
  }
  if (
    context.buildProvenanceState === "quarantined" ||
    context.buildProvenanceState === "revoked" ||
    context.buildProvenanceState === "drifted"
  ) {
    blockers.push(`GUARDRAIL_PROVENANCE_${context.buildProvenanceState.toUpperCase()}`);
  }
  if (
    context.readinessState === "blocked_restore_proof" ||
    context.readinessState === "missing_backup_manifest" ||
    context.readinessState === "assurance_or_freeze_blocked"
  ) {
    blockers.push(`GUARDRAIL_READINESS_${context.readinessState.toUpperCase()}`);
  }
  if (context.watchState === "rollback_required") {
    blockers.push("GUARDRAIL_WATCH_ROLLBACK_REQUIRED");
  }
  if (context.rollbackReadinessState === "blocked" || context.rollbackReadinessState === "stale") {
    blockers.push(`GUARDRAIL_ROLLBACK_${context.rollbackReadinessState.toUpperCase()}`);
  }
  if (context.continuityState === "breached") {
    blockers.push("GUARDRAIL_CONTINUITY_BREACHED");
  }
  if (context.tupleFreshnessState === "drifted") {
    warnings.push("GUARDRAIL_TUPLE_DRIFTED");
  }
  if (context.tupleFreshnessState === "superseded") {
    warnings.push("GUARDRAIL_TUPLE_SUPERSEDED");
  }
  if (context.readinessState === "stale_rehearsal_evidence") {
    warnings.push("GUARDRAIL_READINESS_STALE_REHEARSAL");
  }
  if (context.trustState === "degraded") {
    warnings.push("GUARDRAIL_TRUST_DEGRADED");
  }
  if (context.continuityState === "constrained") {
    warnings.push("GUARDRAIL_CONTINUITY_CONSTRAINED");
  }

  const guardrailState: WaveGuardrailState = blockers.some((code) =>
    code.startsWith("GUARDRAIL_PUBLICATION")
  ) ||
  blockers.some((code) => code.startsWith("GUARDRAIL_TRUST")) ||
  blockers.some((code) => code.startsWith("GUARDRAIL_PROVENANCE")) ||
  context.recoveryDispositionState === "kill_switch_active"
    ? "frozen"
    : blockers.length > 0
      ? "rollback_review_required"
      : warnings.length > 0 ||
          context.watchState === "stale" ||
          context.watchState === "blocked" ||
          context.rollbackReadinessState === "constrained"
        ? "constrained"
        : "green";

  return {
    guardrailState,
    blockerRefs: uniqueSorted(blockers),
    warningRefs: uniqueSorted(warnings),
  };
}

export function createWaveGuardrailSnapshot(context: WaveActionContext): WaveGuardrailSnapshot {
  const posture = createGuardrailBlockers(context);
  const guardrailHash = stableDigest({
    environmentRing: context.environmentRing,
    releaseWatchTupleRef: context.releaseWatchTupleRef,
    waveObservationPolicyRef: context.waveObservationPolicyRef,
    operationalReadinessSnapshotRef: context.operationalReadinessSnapshotRef,
    publicationState: context.publicationState,
    parityState: context.parityState,
    routeExposureState: context.routeExposureState,
    watchState: context.watchState,
    rollbackReadinessState: context.rollbackReadinessState,
    readinessState: context.readinessState,
    buildProvenanceState: context.buildProvenanceState,
    trustState: context.trustState,
    continuityState: context.continuityState,
    tupleFreshnessState: context.tupleFreshnessState,
    recoveryDispositionState: context.recoveryDispositionState,
    blockerRefs: posture.blockerRefs,
    warningRefs: posture.warningRefs,
  });
  return {
    waveGuardrailSnapshotId: `wgd::${guardrailHash.slice(0, 16)}`,
    releaseRef: context.releaseRef,
    environmentRing: context.environmentRing,
    runtimePublicationBundleRef: context.runtimePublicationBundleRef,
    releasePublicationParityRef: context.releasePublicationParityRef,
    releaseWatchTupleRef: context.releaseWatchTupleRef,
    waveObservationPolicyRef: context.waveObservationPolicyRef,
    waveControlFenceRef: context.waveControlFenceRef,
    operationalReadinessSnapshotRef: context.operationalReadinessSnapshotRef,
    buildProvenanceRef: context.buildProvenanceRef,
    publicationState: context.publicationState,
    parityState: context.parityState,
    routeExposureState: context.routeExposureState,
    watchState: context.watchState,
    rollbackReadinessState: context.rollbackReadinessState,
    readinessState: context.readinessState,
    buildProvenanceState: context.buildProvenanceState,
    trustState: context.trustState,
    continuityState: context.continuityState,
    tupleFreshnessState: context.tupleFreshnessState,
    recoveryDispositionState: context.recoveryDispositionState,
    guardrailState: posture.guardrailState,
    blockerRefs: posture.blockerRefs,
    warningRefs: posture.warningRefs,
    guardrailHash,
    generatedAt: context.now,
    sourceRefs: context.sourceRefs,
  };
}

function createActionPreviewAssessment(
  context: WaveActionContext,
  guardrail: WaveGuardrailSnapshot,
): {
  previewState: WaveActionPreviewState;
  blockerRefs: string[];
  warningRefs: string[];
  expectedObservationState: WaveActionObservationState;
  expectedSettlementState: WaveActionSettlementState;
  expectedCockpitState: CanaryCockpitState;
} {
  const blockers = [...guardrail.blockerRefs];
  const warnings = [...guardrail.warningRefs];

  const requirePublished = () => {
    if (context.publicationState !== "published" || context.parityState !== "exact") {
      blockers.push("ACTION_REQUIRES_PUBLISHED_EXACT_RUNTIME_TUPLE");
    }
  };
  const requireFreshReadiness = () => {
    if (!requiresFreshReadiness(context)) {
      blockers.push("ACTION_REQUIRES_FRESH_READINESS");
    }
  };
  const requireSatisfiedWatch = () => {
    if (context.watchState !== "satisfied" || context.observationState !== "satisfied") {
      blockers.push("ACTION_REQUIRES_SATISFIED_WATCH");
    }
  };
  if (
    context.tupleFreshnessState === "superseded" &&
    (context.actionType === "widen" || context.actionType === "rollforward")
  ) {
    return {
      previewState: "superseded",
      blockerRefs: uniqueSorted(["ACTION_REQUIRES_SUPERSEDING_TUPLE", ...blockers]),
      warningRefs: uniqueSorted(warnings),
      expectedObservationState: "superseded",
      expectedSettlementState: "superseded",
      expectedCockpitState: "superseded",
    };
  }

  switch (context.actionType) {
    case "canary_start":
      requirePublished();
      requireFreshReadiness();
      if (guardrail.guardrailState !== "green") {
        blockers.push("ACTION_REQUIRES_GREEN_GUARDRAIL");
      }
      if (!["accepted", "satisfied"].includes(context.watchState)) {
        blockers.push("ACTION_REQUIRES_ACTIVE_WATCH_TUPLE");
      }
      return {
        previewState: blockers.length > 0 ? "blocked" : "preview",
        blockerRefs: uniqueSorted(blockers),
        warningRefs: uniqueSorted(warnings),
        expectedObservationState: "pending",
        expectedSettlementState: blockers.length > 0 ? "blocked" : "accepted_pending_observation",
        expectedCockpitState: blockers.length > 0 ? "constrained" : "accepted",
      };
    case "widen":
      requirePublished();
      requireFreshReadiness();
      requireSatisfiedWatch();
      if (guardrail.guardrailState !== "green") {
        blockers.push("ACTION_REQUIRES_GREEN_GUARDRAIL");
      }
      return {
        previewState: blockers.length > 0 ? "blocked" : "preview",
        blockerRefs: uniqueSorted(blockers),
        warningRefs: uniqueSorted(warnings),
        expectedObservationState: blockers.length > 0 ? "constrained" : "satisfied",
        expectedSettlementState: blockers.length > 0 ? "blocked" : "satisfied",
        expectedCockpitState: blockers.length > 0 ? "constrained" : "satisfied",
      };
    case "pause":
      if (context.tupleFreshnessState === "superseded") {
        warnings.push("ACTION_PAUSE_ON_SUPERSEDED_TUPLE");
      }
      return {
        previewState: "preview",
        blockerRefs: uniqueSorted(blockers),
        warningRefs: uniqueSorted(warnings),
        expectedObservationState:
          guardrail.guardrailState === "green" ? "observed" : "constrained",
        expectedSettlementState:
          guardrail.guardrailState === "green" ? "accepted_pending_observation" : "constrained",
        expectedCockpitState:
          guardrail.guardrailState === "green" ? "observed" : "constrained",
      };
    case "rollback": {
      const rollbackBlockers: string[] = [];
      const rollbackWarnings = [...warnings, ...blockers];
      if (!rollbackEvidenceBound(context)) {
        rollbackBlockers.push("ACTION_REQUIRES_EXPLICIT_ROLLBACK_TARGET_AND_EVIDENCE");
      }
      if (
        context.watchState !== "rollback_required" &&
        guardrail.guardrailState !== "rollback_review_required" &&
        guardrail.guardrailState !== "frozen"
      ) {
        rollbackBlockers.push("ACTION_ROLLBACK_NOT_ARMED");
      }
      return {
        previewState: rollbackBlockers.length > 0 ? "blocked" : "preview",
        blockerRefs: uniqueSorted(rollbackBlockers),
        warningRefs: uniqueSorted(rollbackWarnings),
        expectedObservationState:
          rollbackBlockers.length > 0 ? "constrained" : "rollback_required",
        expectedSettlementState: rollbackBlockers.length > 0 ? "blocked" : "rollback_required",
        expectedCockpitState:
          rollbackBlockers.length > 0 ? "constrained" : "rollback_required",
      };
    }
    case "rollforward":
      requirePublished();
      requireFreshReadiness();
      requireSatisfiedWatch();
      if (context.tupleFreshnessState !== "current") {
        blockers.push("ACTION_REQUIRES_FRESH_SUPERSEDING_TUPLE");
      }
      return {
        previewState: blockers.length > 0 ? "blocked" : "preview",
        blockerRefs: uniqueSorted(blockers),
        warningRefs: uniqueSorted(warnings),
        expectedObservationState: blockers.length > 0 ? "constrained" : "satisfied",
        expectedSettlementState: blockers.length > 0 ? "blocked" : "satisfied",
        expectedCockpitState: blockers.length > 0 ? "constrained" : "satisfied",
      };
    case "kill_switch":
      if (!severePublicationFailure(context) && !severeTrustFailure(context)) {
        blockers.push("ACTION_KILL_SWITCH_REQUIRES_SEVERE_FAILURE");
        return {
          previewState: "blocked",
          blockerRefs: uniqueSorted(blockers),
          warningRefs: uniqueSorted(warnings),
          expectedObservationState: "constrained",
          expectedSettlementState: "blocked",
          expectedCockpitState: "constrained",
        };
      }
      return {
        previewState: "preview",
        blockerRefs: [],
        warningRefs: uniqueSorted([...warnings, ...blockers]),
        expectedObservationState: "observed",
        expectedSettlementState: "constrained",
        expectedCockpitState: "observed",
      };
  }
}

export function createWaveActionImpactPreview(input: {
  context: WaveActionContext;
  guardrailSnapshot?: WaveGuardrailSnapshot;
}): WaveActionImpactPreview {
  const guardrailSnapshot = input.guardrailSnapshot ?? createWaveGuardrailSnapshot(input.context);
  const assessment = createActionPreviewAssessment(input.context, guardrailSnapshot);
  const blastRadius = createBlastRadius(input.context);
  const previewHash = stableDigest({
    actionType: input.context.actionType,
    previewState: assessment.previewState,
    expectedObservationState: assessment.expectedObservationState,
    expectedSettlementState: assessment.expectedSettlementState,
    expectedCockpitState: assessment.expectedCockpitState,
    runtimePublicationBundleRef: input.context.runtimePublicationBundleRef,
    targetPublicationBundleRef: input.context.targetPublicationBundleRef,
    rollbackTargetPublicationBundleRef: input.context.rollbackTargetPublicationBundleRef,
    releaseWatchTupleRef: input.context.releaseWatchTupleRef,
    waveObservationPolicyRef: input.context.waveObservationPolicyRef,
    operationalReadinessSnapshotRef: input.context.operationalReadinessSnapshotRef,
    waveGuardrailSnapshotRef: guardrailSnapshot.waveGuardrailSnapshotId,
    rollbackRunbookBindingRefs: uniqueSorted(input.context.rollbackRunbookBindingRefs),
    rollbackReadinessEvidenceRefs: uniqueSorted(input.context.rollbackReadinessEvidenceRefs),
    blockerRefs: uniqueSorted(assessment.blockerRefs),
    warningRefs: uniqueSorted(assessment.warningRefs),
    blastRadius,
  });
  return {
    waveActionImpactPreviewId: `wap::${previewHash.slice(0, 16)}`,
    releaseRef: input.context.releaseRef,
    environmentRing: input.context.environmentRing,
    actionType: input.context.actionType,
    previewState: assessment.previewState,
    expectedObservationState: assessment.expectedObservationState,
    expectedSettlementState: assessment.expectedSettlementState,
    expectedCockpitState: assessment.expectedCockpitState,
    runtimePublicationBundleRef: input.context.runtimePublicationBundleRef,
    targetPublicationBundleRef: input.context.targetPublicationBundleRef,
    rollbackTargetPublicationBundleRef: input.context.rollbackTargetPublicationBundleRef,
    releasePublicationParityRef: input.context.releasePublicationParityRef,
    releaseWatchTupleRef: input.context.releaseWatchTupleRef,
    waveObservationPolicyRef: input.context.waveObservationPolicyRef,
    waveControlFenceRef: input.context.waveControlFenceRef,
    operationalReadinessSnapshotRef: input.context.operationalReadinessSnapshotRef,
    buildProvenanceRef: input.context.buildProvenanceRef,
    waveGuardrailSnapshotRef: guardrailSnapshot.waveGuardrailSnapshotId,
    rollbackRunbookBindingRefs: uniqueSorted(input.context.rollbackRunbookBindingRefs),
    rollbackReadinessEvidenceRefs: uniqueSorted(input.context.rollbackReadinessEvidenceRefs),
    blastRadius,
    blockerRefs: uniqueSorted(assessment.blockerRefs),
    warningRefs: uniqueSorted(assessment.warningRefs),
    previewHash,
    generatedAt: input.context.now,
    sourceRefs: input.context.sourceRefs,
  };
}

export function createWaveActionRecord(input: {
  context: WaveActionContext;
  preview: WaveActionImpactPreview;
  recordState?: WaveActionRecordState;
}): WaveActionRecord {
  const actionHash = stableDigest({
    actionType: input.context.actionType,
    previewHash: input.preview.previewHash,
    idempotencyKey: input.context.idempotencyKey,
    currentTupleHash: input.context.currentTupleHash,
    targetTupleHash: input.context.targetTupleHash,
  });
  return {
    waveActionRecordId: `war::${actionHash.slice(0, 16)}`,
    releaseRef: input.context.releaseRef,
    environmentRing: input.context.environmentRing,
    actionType: input.context.actionType,
    impactPreviewRef: input.preview.waveActionImpactPreviewId,
    releaseWatchTupleRef: input.context.releaseWatchTupleRef,
    waveObservationPolicyRef: input.context.waveObservationPolicyRef,
    operationalReadinessSnapshotRef: input.context.operationalReadinessSnapshotRef,
    runtimePublicationBundleRef: input.context.runtimePublicationBundleRef,
    targetPublicationBundleRef: input.context.targetPublicationBundleRef,
    rollbackTargetPublicationBundleRef: input.context.rollbackTargetPublicationBundleRef,
    requestedBy: input.context.requestedBy,
    idempotencyKey: input.context.idempotencyKey,
    actionHash,
    recordState: input.recordState ?? "previewed",
    submittedAt: input.context.now,
    blockerRefs: input.preview.blockerRefs,
    warningRefs: input.preview.warningRefs,
    sourceRefs: input.context.sourceRefs,
  };
}

export function createWaveActionExecutionReceipt(input: {
  context: WaveActionContext;
  preview: WaveActionImpactPreview;
  record: WaveActionRecord;
  executionState?: WaveActionExecutionState;
}): WaveActionExecutionReceipt {
  const executionState =
    input.executionState ??
    (input.preview.previewState === "preview" ? "accepted" : "blocked");
  return {
    waveActionExecutionReceiptId: `wae::${stableDigest([
      input.record.waveActionRecordId,
      executionState,
      input.context.now,
    ]).slice(0, 16)}`,
    waveActionRecordRef: input.record.waveActionRecordId,
    impactPreviewRef: input.preview.waveActionImpactPreviewId,
    releaseRef: input.context.releaseRef,
    environmentRing: input.context.environmentRing,
    actionType: input.context.actionType,
    executionState,
    runtimePublicationBundleRef: input.context.runtimePublicationBundleRef,
    targetPublicationBundleRef: input.context.targetPublicationBundleRef,
    rollbackTargetPublicationBundleRef: input.context.rollbackTargetPublicationBundleRef,
    issuedTupleHash: input.context.currentTupleHash,
    targetTupleHash: input.context.targetTupleHash,
    recoveryDispositionState: input.context.recoveryDispositionState,
    executionEvidenceRefs: [
      input.context.releaseWatchTupleRef,
      input.context.operationalReadinessSnapshotRef,
      input.context.releasePublicationParityRef,
    ],
    blockerRefs:
      executionState === "blocked"
        ? uniqueSorted(input.preview.blockerRefs)
        : uniqueSorted(input.context.blockerRefs),
    warningRefs: uniqueSorted(input.preview.warningRefs),
    executedAt: input.context.now,
    sourceRefs: input.context.sourceRefs,
  };
}

function deriveObservationState(input: {
  context: WaveActionContext;
  preview: WaveActionImpactPreview;
  receipt: WaveActionExecutionReceipt;
}): WaveActionObservationState {
  if (input.preview.previewState === "superseded") {
    return "superseded";
  }
  if (input.receipt.executionState === "blocked") {
    return "constrained";
  }
  switch (input.context.actionType) {
    case "canary_start":
      return input.context.watchState === "satisfied" ? "satisfied" : "pending";
    case "widen":
      return input.context.watchState === "satisfied" &&
        input.context.observationState === "satisfied" &&
        requiresFreshReadiness(input.context)
        ? "satisfied"
        : "constrained";
    case "pause":
      return createGuardrailBlockers(input.context).guardrailState === "green"
        ? "observed"
        : "constrained";
    case "rollback":
      return rollbackEvidenceBound(input.context) &&
        (input.context.watchState === "rollback_required" ||
          createGuardrailBlockers(input.context).guardrailState !== "green")
        ? "rollback_required"
        : "constrained";
    case "rollforward":
      return requiresFreshReadiness(input.context) &&
        input.context.watchState === "satisfied" &&
        input.context.observationState === "satisfied"
        ? "satisfied"
        : "constrained";
    case "kill_switch":
      return severePublicationFailure(input.context) || severeTrustFailure(input.context)
        ? "observed"
        : "constrained";
  }
}

export function createWaveActionObservationWindow(input: {
  context: WaveActionContext;
  preview: WaveActionImpactPreview;
  receipt: WaveActionExecutionReceipt;
  guardrailSnapshot: WaveGuardrailSnapshot;
  record: WaveActionRecord;
}): WaveActionObservationWindow {
  const observationState = deriveObservationState(input);
  const reasonRefs =
    observationState === "satisfied"
      ? ["OBSERVATION_SATISFIED"]
      : observationState === "rollback_required"
        ? ["OBSERVATION_TRIGGERED_ROLLBACK"]
        : observationState === "superseded"
          ? ["OBSERVATION_SUPERSEDED_BY_NEW_TUPLE"]
          : observationState === "observed"
            ? ["OBSERVATION_CAPTURED"]
            : uniqueSorted([...input.preview.blockerRefs, ...input.guardrailSnapshot.blockerRefs]);
  return {
    waveActionObservationWindowId: `wao::${stableDigest([
      input.record.waveActionRecordId,
      observationState,
      input.context.now,
    ]).slice(0, 16)}`,
    waveActionRecordRef: input.record.waveActionRecordId,
    waveActionExecutionReceiptRef: input.receipt.waveActionExecutionReceiptId,
    impactPreviewRef: input.preview.waveActionImpactPreviewId,
    releaseRef: input.context.releaseRef,
    environmentRing: input.context.environmentRing,
    actionType: input.context.actionType,
    releaseWatchTupleRef: input.context.releaseWatchTupleRef,
    waveObservationPolicyRef: input.context.waveObservationPolicyRef,
    waveGuardrailSnapshotRef: input.guardrailSnapshot.waveGuardrailSnapshotId,
    operationalReadinessSnapshotRef: input.context.operationalReadinessSnapshotRef,
    observationState,
    watchState: input.context.watchState,
    rollbackReadinessState: input.context.rollbackReadinessState,
    observedTrustState: input.context.trustState,
    observedContinuityState: input.context.continuityState,
    observedReadinessState: input.context.readinessState,
    observedTupleFreshnessState: input.context.tupleFreshnessState,
    reasonRefs,
    observedAt: input.context.now,
    sourceRefs: input.context.sourceRefs,
  };
}

function deriveSettlementState(input: {
  preview: WaveActionImpactPreview;
  observationWindow: WaveActionObservationWindow;
  receipt: WaveActionExecutionReceipt;
}): WaveActionSettlementState {
  if (input.preview.previewState === "superseded") {
    return "superseded";
  }
  if (input.receipt.executionState === "blocked") {
    return "blocked";
  }
  switch (input.observationWindow.observationState) {
    case "satisfied":
      return "satisfied";
    case "rollback_required":
      return "rollback_required";
    case "superseded":
      return "superseded";
    case "constrained":
      return "constrained";
    case "observed":
      return "constrained";
    case "pending":
      return "accepted_pending_observation";
  }
}

function deriveCockpitState(input: {
  preview: WaveActionImpactPreview;
  receipt: WaveActionExecutionReceipt;
  observationWindow: WaveActionObservationWindow;
  settlementState: WaveActionSettlementState;
}): CanaryCockpitState {
  if (input.settlementState === "superseded") {
    return "superseded";
  }
  if (input.settlementState === "rollback_required") {
    return "rollback_required";
  }
  if (input.settlementState === "constrained" || input.settlementState === "blocked") {
    return "constrained";
  }
  if (input.settlementState === "satisfied") {
    return "satisfied";
  }
  if (input.observationWindow.observationState === "observed") {
    return "observed";
  }
  if (
    input.receipt.executionState === "accepted" ||
    input.receipt.executionState === "deduplicated"
  ) {
    return "accepted";
  }
  return input.preview.previewState === "preview" ? "preview" : "superseded";
}

export function createWaveActionSettlement(input: {
  context: WaveActionContext;
  preview: WaveActionImpactPreview;
  receipt: WaveActionExecutionReceipt;
  observationWindow: WaveActionObservationWindow;
  guardrailSnapshot: WaveGuardrailSnapshot;
  record: WaveActionRecord;
}): WaveActionSettlement {
  const settlementState = deriveSettlementState(input);
  const cockpitState = deriveCockpitState({
    preview: input.preview,
    receipt: input.receipt,
    observationWindow: input.observationWindow,
    settlementState,
  });
  return {
    waveActionSettlementId: `was::${stableDigest([
      input.record.waveActionRecordId,
      settlementState,
      input.context.now,
    ]).slice(0, 16)}`,
    waveActionRecordRef: input.record.waveActionRecordId,
    waveActionExecutionReceiptRef: input.receipt.waveActionExecutionReceiptId,
    waveActionObservationWindowRef: input.observationWindow.waveActionObservationWindowId,
    impactPreviewRef: input.preview.waveActionImpactPreviewId,
    releaseRef: input.context.releaseRef,
    environmentRing: input.context.environmentRing,
    actionType: input.context.actionType,
    settlementState,
    cockpitState,
    guardrailState: input.guardrailSnapshot.guardrailState,
    watchState: input.context.watchState,
    rollbackReadinessState: input.context.rollbackReadinessState,
    recoveryDispositionState: input.context.recoveryDispositionState,
    blockerRefs:
      settlementState === "satisfied"
        ? []
        : uniqueSorted([
            ...input.preview.blockerRefs,
            ...input.guardrailSnapshot.blockerRefs,
            ...input.observationWindow.reasonRefs,
          ]),
    warningRefs: uniqueSorted([
      ...input.preview.warningRefs,
      ...input.guardrailSnapshot.warningRefs,
    ]),
    settledAt: input.context.now,
    sourceRefs: input.context.sourceRefs,
  };
}

export function createReleaseWatchEvidenceCockpit(input: {
  context: WaveActionContext;
  guardrailSnapshot: WaveGuardrailSnapshot;
  impactPreview: WaveActionImpactPreview;
  executionReceipt: WaveActionExecutionReceipt;
  observationWindow: WaveActionObservationWindow;
  settlement: WaveActionSettlement;
}): ReleaseWatchEvidenceCockpit {
  const cockpitHash = stableDigest({
    releaseWatchTupleRef: input.context.releaseWatchTupleRef,
    waveObservationPolicyRef: input.context.waveObservationPolicyRef,
    waveControlFenceRef: input.context.waveControlFenceRef,
    operationalReadinessSnapshotRef: input.context.operationalReadinessSnapshotRef,
    waveGuardrailSnapshotRef: input.guardrailSnapshot.waveGuardrailSnapshotId,
    impactPreviewRef: input.impactPreview.waveActionImpactPreviewId,
    executionReceiptRef: input.executionReceipt.waveActionExecutionReceiptId,
    observationWindowRef: input.observationWindow.waveActionObservationWindowId,
    settlementRef: input.settlement.waveActionSettlementId,
    rollbackTargetPublicationBundleRef: input.context.rollbackTargetPublicationBundleRef,
    rollbackRunbookBindingRefs: uniqueSorted(input.context.rollbackRunbookBindingRefs),
    rollbackReadinessEvidenceRefs: uniqueSorted(input.context.rollbackReadinessEvidenceRefs),
    activeChannelFreezeRefs: uniqueSorted(input.context.activeChannelFreezeRefs),
    recoveryDispositionRefs: uniqueSorted(input.context.recoveryDispositionRefs),
  });
  return {
    releaseWatchEvidenceCockpitId: `rwec::${cockpitHash.slice(0, 16)}`,
    releaseRef: input.context.releaseRef,
    environmentRing: input.context.environmentRing,
    releaseWatchTupleRef: input.context.releaseWatchTupleRef,
    waveObservationPolicyRef: input.context.waveObservationPolicyRef,
    waveControlFenceRef: input.context.waveControlFenceRef,
    operationalReadinessSnapshotRef: input.context.operationalReadinessSnapshotRef,
    waveGuardrailSnapshotRef: input.guardrailSnapshot.waveGuardrailSnapshotId,
    activeWaveActionImpactPreviewRef: input.impactPreview.waveActionImpactPreviewId,
    activeWaveActionExecutionReceiptRef: input.executionReceipt.waveActionExecutionReceiptId,
    activeWaveActionObservationWindowRef: input.observationWindow.waveActionObservationWindowId,
    activeWaveActionSettlementRef: input.settlement.waveActionSettlementId,
    rollbackTargetPublicationBundleRef: input.context.rollbackTargetPublicationBundleRef,
    rollbackRunbookBindingRefs: uniqueSorted(input.context.rollbackRunbookBindingRefs),
    rollbackReadinessEvidenceRefs: uniqueSorted(input.context.rollbackReadinessEvidenceRefs),
    activeChannelFreezeRefs: uniqueSorted(input.context.activeChannelFreezeRefs),
    recoveryDispositionRefs: uniqueSorted(input.context.recoveryDispositionRefs),
    cockpitState: input.settlement.cockpitState,
    cockpitHash,
    blockerRefs: input.settlement.blockerRefs,
    warningRefs: input.settlement.warningRefs,
    generatedAt: input.context.now,
    sourceRefs: input.context.sourceRefs,
  };
}

function createAuditRecord(input: {
  waveActionRecordRef: string | null;
  auditKind: WaveActionAuditKind;
  actionType: WaveActionType;
  cockpitState: CanaryCockpitState;
  recordedAt: string;
  reasonRefs: readonly string[];
}): WaveActionAuditRecord {
  return {
    waveActionAuditRecordId: `waa::${stableDigest([
      input.waveActionRecordRef,
      input.auditKind,
      input.recordedAt,
      ...input.reasonRefs,
    ]).slice(0, 16)}`,
    waveActionRecordRef: input.waveActionRecordRef,
    auditKind: input.auditKind,
    actionType: input.actionType,
    cockpitState: input.cockpitState,
    recordedAt: input.recordedAt,
    reasonRefs: input.reasonRefs,
  };
}

export class CanaryRollbackHarnessStore {
  private records = new Map<string, WaveActionRecord>();
  private receipts = new Map<string, WaveActionExecutionReceipt>();
  private observations = new Map<string, WaveActionObservationWindow>();
  private settlements = new Map<string, WaveActionSettlement>();
  private cockpits = new Map<string, ReleaseWatchEvidenceCockpit>();
  private idempotencyIndex = new Map<string, WaveActionRecord>();
  private audits: WaveActionAuditRecord[] = [];

  findByIdempotencyKey(idempotencyKey: string): WaveActionRecord | undefined {
    return this.idempotencyIndex.get(idempotencyKey);
  }

  saveRecord(record: WaveActionRecord): void {
    this.records.set(record.waveActionRecordId, record);
    this.idempotencyIndex.set(record.idempotencyKey, record);
  }

  saveReceipt(receipt: WaveActionExecutionReceipt): void {
    this.receipts.set(receipt.waveActionExecutionReceiptId, receipt);
  }

  saveObservation(window: WaveActionObservationWindow): void {
    this.observations.set(window.waveActionObservationWindowId, window);
  }

  saveSettlement(settlement: WaveActionSettlement): void {
    this.settlements.set(settlement.waveActionSettlementId, settlement);
  }

  saveCockpit(cockpit: ReleaseWatchEvidenceCockpit): void {
    this.cockpits.set(cockpit.releaseWatchEvidenceCockpitId, cockpit);
  }

  appendAudit(record: WaveActionAuditRecord): void {
    this.audits.push(record);
  }

  getAudits(): readonly WaveActionAuditRecord[] {
    return this.audits;
  }

  collectMetrics(): CanaryRollbackMetricsSnapshot {
    const receipts = Array.from(this.receipts.values());
    const settlements = Array.from(this.settlements.values());
    return {
      actionRecordCount: this.records.size,
      acceptedCount: receipts.filter((row) => row.executionState === "accepted").length,
      deduplicatedCount: receipts.filter((row) => row.executionState === "deduplicated").length,
      blockedCount: receipts.filter((row) => row.executionState === "blocked").length,
      satisfiedCount: settlements.filter((row) => row.settlementState === "satisfied").length,
      constrainedCount: settlements.filter((row) => row.settlementState === "constrained").length,
      rollbackRequiredCount: settlements.filter(
        (row) => row.settlementState === "rollback_required",
      ).length,
      supersededCount: settlements.filter((row) => row.settlementState === "superseded").length,
      auditRecordCount: this.audits.length,
    };
  }
}

export class CanaryRollbackHarnessCoordinator {
  constructor(private readonly store = new CanaryRollbackHarnessStore()) {}

  getStore(): CanaryRollbackHarnessStore {
    return this.store;
  }

  rehearse(
    context: WaveActionContext,
    options?: { supersededContext?: WaveActionContext },
  ): CanaryRollbackRehearsal {
    const supersededImpactPreview =
      options?.supersededContext !== undefined
        ? createWaveActionImpactPreview({
            context: options.supersededContext,
          })
        : null;
    if (supersededImpactPreview) {
      this.store.appendAudit(
        createAuditRecord({
          waveActionRecordRef: null,
          auditKind: "superseded",
          actionType: options!.supersededContext!.actionType,
          cockpitState: "superseded",
          recordedAt: options!.supersededContext!.now,
          reasonRefs: supersededImpactPreview.blockerRefs,
        }),
      );
    }

    const guardrailSnapshot = createWaveGuardrailSnapshot(context);
    const impactPreview = createWaveActionImpactPreview({ context, guardrailSnapshot });
    this.store.appendAudit(
      createAuditRecord({
        waveActionRecordRef: null,
        auditKind: "previewed",
        actionType: context.actionType,
        cockpitState: impactPreview.expectedCockpitState,
        recordedAt: context.now,
        reasonRefs: impactPreview.blockerRefs,
      }),
    );

    const prior = this.store.findByIdempotencyKey(context.idempotencyKey);
    const record = createWaveActionRecord({
      context,
      preview: impactPreview,
      recordState:
        impactPreview.previewState === "superseded"
          ? "superseded"
          : prior
            ? "deduplicated"
            : impactPreview.previewState === "preview"
              ? "accepted"
              : "blocked",
    });
    this.store.saveRecord(record);

    const executionReceipt = createWaveActionExecutionReceipt({
      context,
      preview: impactPreview,
      record,
      executionState:
        prior && prior.actionHash === record.actionHash
          ? "deduplicated"
          : impactPreview.previewState === "preview"
            ? "accepted"
            : "blocked",
    });
    this.store.saveReceipt(executionReceipt);
    this.store.appendAudit(
      createAuditRecord({
        waveActionRecordRef: record.waveActionRecordId,
        auditKind:
          executionReceipt.executionState === "accepted"
            ? "submitted"
            : executionReceipt.executionState === "deduplicated"
              ? "deduplicated"
              : "blocked",
        actionType: context.actionType,
        cockpitState:
          executionReceipt.executionState === "accepted"
            ? "accepted"
            : executionReceipt.executionState === "deduplicated"
              ? "accepted"
              : impactPreview.previewState === "superseded"
                ? "superseded"
                : "constrained",
        recordedAt: context.now,
        reasonRefs:
          executionReceipt.executionState === "blocked"
            ? executionReceipt.blockerRefs
            : executionReceipt.warningRefs,
      }),
    );

    const observationWindow = createWaveActionObservationWindow({
      context,
      preview: impactPreview,
      receipt: executionReceipt,
      guardrailSnapshot,
      record,
    });
    this.store.saveObservation(observationWindow);
    this.store.appendAudit(
      createAuditRecord({
        waveActionRecordRef: record.waveActionRecordId,
        auditKind: "observed",
        actionType: context.actionType,
        cockpitState:
          observationWindow.observationState === "observed"
            ? "observed"
            : observationWindow.observationState === "rollback_required"
              ? "rollback_required"
              : observationWindow.observationState === "satisfied"
                ? "satisfied"
                : observationWindow.observationState === "superseded"
                  ? "superseded"
                  : executionReceipt.executionState === "accepted"
                    ? "accepted"
                    : "constrained",
        recordedAt: context.now,
        reasonRefs: observationWindow.reasonRefs,
      }),
    );

    const settlement = createWaveActionSettlement({
      context,
      preview: impactPreview,
      receipt: executionReceipt,
      observationWindow,
      guardrailSnapshot,
      record,
    });
    this.store.saveSettlement(settlement);

    const cockpit = createReleaseWatchEvidenceCockpit({
      context,
      guardrailSnapshot,
      impactPreview,
      executionReceipt,
      observationWindow,
      settlement,
    });
    this.store.saveCockpit(cockpit);
    this.store.appendAudit(
      createAuditRecord({
        waveActionRecordRef: record.waveActionRecordId,
        auditKind:
          settlement.settlementState === "superseded" ? "superseded" : "settled",
        actionType: context.actionType,
        cockpitState: settlement.cockpitState,
        recordedAt: context.now,
        reasonRefs: settlement.blockerRefs,
      }),
    );

    const history = [
      ...(supersededImpactPreview
        ? [
            {
              phase: "preview" as const,
              state: supersededImpactPreview.previewState,
              ref: supersededImpactPreview.waveActionImpactPreviewId,
            },
          ]
        : []),
      {
        phase: "preview" as const,
        state: impactPreview.previewState,
        ref: impactPreview.waveActionImpactPreviewId,
      },
      {
        phase: "execute" as const,
        state:
          executionReceipt.executionState === "blocked"
            ? settlement.cockpitState
            : ("accepted" as CanaryCockpitState),
        ref: executionReceipt.waveActionExecutionReceiptId,
      },
      {
        phase: "observe" as const,
        state:
          observationWindow.observationState === "observed"
            ? "observed"
            : observationWindow.observationState === "satisfied"
              ? "satisfied"
              : observationWindow.observationState === "rollback_required"
                ? "rollback_required"
                : observationWindow.observationState === "superseded"
                  ? "superseded"
                  : settlement.cockpitState,
        ref: observationWindow.waveActionObservationWindowId,
      },
      {
        phase: "settle" as const,
        state: settlement.cockpitState,
        ref: settlement.waveActionSettlementId,
      },
    ];

    return {
      context,
      guardrailSnapshot,
      impactPreview,
      supersededImpactPreview,
      actionRecord: record,
      executionReceipt,
      observationWindow,
      settlement,
      cockpit,
      auditTrail: this.store.getAudits(),
      history,
    };
  }
}

export function createWaveActionContext(input: WaveActionContext): WaveActionContext {
  return {
    ...input,
    activeChannelFreezeRefs: uniqueSorted(input.activeChannelFreezeRefs),
    recoveryDispositionRefs: uniqueSorted(input.recoveryDispositionRefs),
    rollbackRunbookBindingRefs: uniqueSorted(input.rollbackRunbookBindingRefs),
    rollbackReadinessEvidenceRefs: uniqueSorted(input.rollbackReadinessEvidenceRefs),
    affectedRouteFamilyRefs: uniqueSorted(input.affectedRouteFamilyRefs),
    affectedAudienceSurfaceRefs: uniqueSorted(input.affectedAudienceSurfaceRefs),
    affectedGatewaySurfaceRefs: uniqueSorted(input.affectedGatewaySurfaceRefs),
    blockerRefs: uniqueSorted(input.blockerRefs),
    warningRefs: uniqueSorted(input.warningRefs),
    sourceRefs: uniqueSorted(input.sourceRefs),
  };
}

export function createCanaryRollbackSimulationHarness(): CanaryRollbackSimulationHarness {
  const context = createWaveActionContext({
    environmentRing: "local",
    releaseRef: "rc::foundation::local",
    actionType: "canary_start",
    requestedBy: "ops://runtime-control",
    idempotencyKey: "canary-local-001",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    targetPublicationBundleRef: "rpb::local::authoritative",
    rollbackTargetPublicationBundleRef: "rpb::local::authoritative",
    releasePublicationParityRef: "rpp::local::authoritative",
    releaseWatchTupleRef: "RWT_LOCAL_V1::local_accepted",
    waveObservationPolicyRef: "WOP_LOCAL_V1::local_accepted",
    waveControlFenceRef: "wave-control-fence::local",
    operationalReadinessSnapshotRef: "ORS_101_LOCAL_EXACT_AND_READY",
    buildProvenanceRef: "bpr::run_release_controls_local_verified",
    activeChannelFreezeRefs: [],
    recoveryDispositionRefs: ["RRD_PATIENT_HOME_READ_ONLY", "RRD_OPERATIONS_DIAGNOSTIC_ONLY"],
    rollbackRunbookBindingRefs: ["RBR_101_EF_RELEASE_GOVERNANCE"],
    rollbackReadinessEvidenceRefs: ["REP_101_EF_RELEASE_GOVERNANCE"],
    affectedTenantCount: 1,
    affectedOrganisationCount: 1,
    affectedRouteFamilyRefs: ["rf_patient_requests", "rf_operations_console"],
    affectedAudienceSurfaceRefs: ["surf_patient_home", "surf_operations_board"],
    affectedGatewaySurfaceRefs: ["gws_patient_portal", "gws_operations_board"],
    watchState: "accepted",
    observationState: "open",
    rollbackReadinessState: "ready",
    readinessState: "exact_and_ready",
    publicationState: "published",
    parityState: "exact",
    routeExposureState: "publishable",
    buildProvenanceState: "verified",
    trustState: "live",
    continuityState: "healthy",
    tupleFreshnessState: "current",
    recoveryDispositionState: "normal",
    currentTupleHash: "tuple::local::accepted",
    targetTupleHash: "tuple::local::accepted",
    blockerRefs: [],
    warningRefs: [],
    sourceRefs: ["canary-rollback-harness.ts"],
    now: "2026-04-13T12:00:00.000Z",
  });
  const coordinator = new CanaryRollbackHarnessCoordinator();
  const rehearsal = coordinator.rehearse(context);
  return {
    rehearsal,
    metrics: coordinator.getStore().collectMetrics(),
  };
}

export function runCanaryRollbackSimulation(): CanaryRollbackSimulationHarness {
  return createCanaryRollbackSimulationHarness();
}
