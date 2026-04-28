import { stableDigest } from "./build-provenance";
import {
  resolveBrowserRuntimeDecision,
  type BrowserActionabilityState,
  type BrowserEffectivePostureState,
  type BrowserRecoveryPostureContract,
} from "./browser-runtime-governor";
import type {
  ReleasePublicationParityState,
  RouteExposureState,
  RuntimePublicationState,
} from "./runtime-publication";
import {
  dependencyDegradationCatalog,
  type DependencyDegradationAudienceFallbackRow,
  type DependencyDegradationFailureModeRow,
  type DependencyDegradationProfileRow,
  type DependencyDegradationSimulationScenario,
} from "./dependency-degradation.catalog";

export type DependencyFailureModeClass =
  | "transport_loss"
  | "semantic_contract_mismatch"
  | "callback_ambiguity"
  | "accepted_pending_stall"
  | "trust_revocation";
export type DependencyHealthState = "healthy" | "degraded" | "recovering";
export type DependencyDecisionState = "clear" | "degraded" | "recovery_held";
export type DependencyOutcomeState = "bounded" | "blocked";
export type GatewayReadMode = "live" | "read_only" | "summary_only" | "placeholder";
export type BrowserMutationMode = "allow" | "recovery_only" | "refuse";
export type ProjectionPublicationMode = "live" | "carry_forward" | "projection_stale";
export type IntegrationDispatchMode = "dispatch" | "hold_current" | "queue_only" | "halt_dispatch";
export type AssurancePublicationState = "trusted" | "degraded" | "blocked";
export type DegradationTimelineEventKind =
  | "degradation_evaluated"
  | "degradation_entered"
  | "degradation_recovery_held"
  | "degradation_cleared";

export interface DependencyFailureObservationInput {
  dependencyCode: string;
  environmentRing: string;
  routeFamilyRef: string;
  observedFailureModeClass?: DependencyFailureModeClass;
  healthState?: DependencyHealthState;
  requestedWorkloadFamilyRefs?: readonly string[];
  runtimePublicationState?: RuntimePublicationState;
  parityState?: ReleasePublicationParityState;
  routeExposureState?: RouteExposureState;
  trustFreezeLive?: boolean;
  assuranceHardBlock?: boolean;
  observedAt?: string;
}

export interface DegradationAudienceFallbackDecision {
  audienceType: string;
  fallbackMode: string;
  postureState: string;
  displaySummary: string;
  nextSafeAction: string;
  sampleRouteFamilyRef: string;
  contentGapRef: string | null;
}

export interface DependencyRecoveryGate {
  readyToClear: boolean;
  blockerRefs: readonly string[];
}

export interface GatewayReadResolution {
  mode: GatewayReadMode;
  allowed: boolean;
  reasonRefs: readonly string[];
}

export interface BrowserMutationResolution {
  mode: BrowserMutationMode;
  allowed: boolean;
  actionabilityState: BrowserActionabilityState;
  readPosture: BrowserEffectivePostureState;
  browserContract: BrowserRecoveryPostureContract;
  reasonRefs: readonly string[];
}

export interface ProjectionPublicationResolution {
  mode: ProjectionPublicationMode;
  freshnessState: "fresh" | "stale_review";
  reasonRefs: readonly string[];
}

export interface IntegrationDispatchResolution {
  mode: IntegrationDispatchMode;
  reasonRefs: readonly string[];
}

export interface DependencyDegradationDecision {
  degradationDecisionId: string;
  dependencyCode: string;
  dependencyName: string;
  profileId: string;
  routeFamilyRef: string;
  environmentRing: string;
  decisionState: DependencyDecisionState;
  outcomeState: DependencyOutcomeState;
  observedFailureModeClass: DependencyFailureModeClass | null;
  healthState: DependencyHealthState;
  topologyFallbackMode: string;
  gatewayReadResolution: GatewayReadResolution;
  browserMutationResolution: BrowserMutationResolution;
  projectionPublicationResolution: ProjectionPublicationResolution;
  integrationDispatchResolution: IntegrationDispatchResolution;
  assurancePublicationState: AssurancePublicationState;
  assuranceTrustEffect: string;
  boundedWorkloadFamilyRefs: readonly string[];
  blockedEscalationFamilyRefs: readonly string[];
  maximumEscalationFamilyRefs: readonly string[];
  impactedWorkloadFamilyRefs: readonly string[];
  audienceFallbacks: readonly DegradationAudienceFallbackDecision[];
  primaryAudienceFallback: DegradationAudienceFallbackDecision;
  recoveryGate: DependencyRecoveryGate;
  reasonRefs: readonly string[];
  observedAt: string;
}

export interface DependencyDegradationTimelineEvent {
  eventId: string;
  eventKind: DegradationTimelineEventKind;
  dependencyCode: string;
  environmentRing: string;
  routeFamilyRef: string;
  decisionState: DependencyDecisionState;
  occurredAt: string;
  reasonRefs: readonly string[];
}

export interface DependencyDegradationMetricsSnapshot {
  degradedEntryCount: number;
  recoveryHeldCount: number;
  clearCount: number;
  boundedOutcomeCount: number;
  blockedOutcomeCount: number;
  fallbackModeFrequency: Readonly<Record<string, number>>;
}

export interface DependencyDegradationCompiler {
  readonly catalog: typeof dependencyDegradationCatalog;
  readonly profilesByDependencyCode: ReadonlyMap<string, DependencyDegradationProfileRow>;
  readonly failureModeRowsByDependencyCode: ReadonlyMap<string, DependencyDegradationFailureModeRow>;
}

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function postureRank(state: BrowserEffectivePostureState): number {
  switch (state) {
    case "live":
      return 0;
    case "read_only":
      return 1;
    case "recovery_only":
      return 2;
    case "blocked":
      return 3;
  }
}

function worsenPosture(
  current: BrowserEffectivePostureState,
  next: BrowserEffectivePostureState,
): BrowserEffectivePostureState {
  return postureRank(next) > postureRank(current) ? next : current;
}

function actionabilityForMutationMode(mode: BrowserMutationMode): BrowserActionabilityState {
  switch (mode) {
    case "allow":
      return "writable";
    case "recovery_only":
      return "recovery_only";
    case "refuse":
      return "blocked";
  }
}

function defaultObservedAt(value: string | undefined): string {
  return value ?? "2026-04-13T00:00:00Z";
}

function normalizeBrowserEnvironmentRing(environmentRing: string): string {
  return ["local", "ci-preview", "integration", "preprod", "production"].includes(environmentRing)
    ? environmentRing
    : "local";
}

function selectPrimaryAudienceFallback(
  routeFamilyRef: string,
  fallbackRows: readonly DegradationAudienceFallbackDecision[],
): DegradationAudienceFallbackDecision {
  const firstFallback = fallbackRows[0];
  if (!firstFallback) {
    throw new Error(`DEPENDENCY_AUDIENCE_FALLBACK_MISSING:${routeFamilyRef}`);
  }
  const exact = fallbackRows.find((row) => row.sampleRouteFamilyRef === routeFamilyRef);
  if (exact) {
    return exact;
  }
  if (routeFamilyRef.startsWith("rf_patient_")) {
    return fallbackRows.find((row) => row.audienceType === "patient") ?? firstFallback;
  }
  if (routeFamilyRef.startsWith("rf_staff_")) {
    return fallbackRows.find((row) => row.audienceType === "staff") ?? firstFallback;
  }
  if (routeFamilyRef.startsWith("rf_support_")) {
    return (
      fallbackRows.find((row) => row.audienceType === "support") ??
      fallbackRows.find((row) => row.audienceType === "staff") ??
      firstFallback
    );
  }
  if (routeFamilyRef.startsWith("rf_operations_")) {
    return fallbackRows.find((row) => row.audienceType === "operations") ?? firstFallback;
  }
  if (routeFamilyRef.startsWith("rf_governance_")) {
    return fallbackRows.find((row) => row.audienceType === "governance") ?? firstFallback;
  }
  if (routeFamilyRef.startsWith("rf_hub_")) {
    return fallbackRows.find((row) => row.audienceType === "hub") ?? firstFallback;
  }
  if (routeFamilyRef.startsWith("rf_pharmacy_")) {
    return fallbackRows.find((row) => row.audienceType === "pharmacy") ?? firstFallback;
  }
  return firstFallback;
}

function deriveAssurancePublicationState(
  input: Required<
    Pick<
      DependencyFailureObservationInput,
      "trustFreezeLive" | "assuranceHardBlock"
    >
  >,
  decisionState: DependencyDecisionState,
): AssurancePublicationState {
  if (input.assuranceHardBlock) {
    return "blocked";
  }
  if (!input.trustFreezeLive || decisionState !== "clear") {
    return "degraded";
  }
  return "trusted";
}

function buildRecoveryGate(
  profile: DependencyDegradationProfileRow,
  input: Required<
    Pick<
      DependencyFailureObservationInput,
      | "runtimePublicationState"
      | "parityState"
      | "routeExposureState"
      | "trustFreezeLive"
      | "assuranceHardBlock"
    >
  >,
  blockedEscalationFamilyRefs: readonly string[],
): DependencyRecoveryGate {
  const blockers: string[] = [];
  if (input.runtimePublicationState !== profile.recoveryRequirements.requiredRuntimePublicationState) {
    blockers.push(`RUNTIME_PUBLICATION_${input.runtimePublicationState.toUpperCase()}`);
  }
  if (input.parityState !== profile.recoveryRequirements.requiredParityState) {
    blockers.push(`PUBLICATION_PARITY_${input.parityState.toUpperCase()}`);
  }
  if (
    !profile.recoveryRequirements.allowedRouteExposureStates.some(
      (routeExposureState) => routeExposureState === input.routeExposureState,
    )
  ) {
    blockers.push(`ROUTE_EXPOSURE_${input.routeExposureState.toUpperCase()}`);
  }
  if (profile.recoveryRequirements.requireTrustFreezeLive && !input.trustFreezeLive) {
    blockers.push("RELEASE_TRUST_FREEZE_NOT_LIVE");
  }
  if (profile.recoveryRequirements.requireAssuranceHardBlockClear && input.assuranceHardBlock) {
    blockers.push("ASSURANCE_HARD_BLOCK");
  }
  if (blockedEscalationFamilyRefs.length > 0) {
    blockers.push("ESCALATION_CEILING_EXCEEDED");
  }
  return {
    readyToClear: blockers.length === 0,
    blockerRefs: blockers,
  };
}

function buildReasonRefs(args: {
  decisionState: DependencyDecisionState;
  profile: DependencyDegradationProfileRow;
  observedFailureModeClass: DependencyFailureModeClass | null;
  blockedEscalationFamilyRefs: readonly string[];
  recoveryGate: DependencyRecoveryGate;
  assurancePublicationState: AssurancePublicationState;
  failureModeMismatch: boolean;
}): string[] {
  const reasons = [
    `TOPOLOGY_FALLBACK_${args.profile.topologyFallbackMode.toUpperCase()}`,
    `ASSURANCE_${args.assurancePublicationState.toUpperCase()}`,
  ];
  if (args.observedFailureModeClass) {
    reasons.push(`FAILURE_MODE_${args.observedFailureModeClass.toUpperCase()}`);
  }
  if (args.failureModeMismatch) {
    reasons.push("FAILURE_MODE_CLASS_MISMATCH");
  }
  if (args.blockedEscalationFamilyRefs.length > 0) {
    reasons.push(
      ...args.blockedEscalationFamilyRefs.map(
        (familyRef) => `ESCALATION_BLOCKED::${familyRef.toUpperCase()}`,
      ),
    );
  }
  if (args.decisionState === "recovery_held") {
    reasons.push(...args.recoveryGate.blockerRefs);
  }
  return uniqueSorted(reasons);
}

function buildAudienceFallbacks(
  profile: DependencyDegradationProfileRow,
): DegradationAudienceFallbackDecision[] {
  return profile.audienceFallbacks.map((row) => ({
    audienceType: row.audienceType,
    fallbackMode: row.fallbackMode,
    postureState: row.postureState,
    displaySummary: row.displaySummary,
    nextSafeAction: row.nextSafeAction,
    sampleRouteFamilyRef: row.sampleRouteFamilyRef,
    contentGapRef: row.contentGapRef,
  }));
}

function buildBrowserContract(
  profile: DependencyDegradationProfileRow,
  input: Required<
    Pick<
      DependencyFailureObservationInput,
      | "routeFamilyRef"
      | "environmentRing"
      | "trustFreezeLive"
      | "assuranceHardBlock"
    >
  >,
  gatewayReadMode: GatewayReadMode,
  projectionPublicationMode: ProjectionPublicationMode,
  decisionState: DependencyDecisionState,
): BrowserRecoveryPostureContract {
  const trustState =
    input.assuranceHardBlock || !input.trustFreezeLive
      ? "quarantined"
      : decisionState === "clear"
        ? "trusted"
        : "degraded";
  const projectionFreshnessState =
    projectionPublicationMode === "projection_stale" && decisionState !== "clear"
      ? "stale_review"
      : "fresh";
  const freezeState =
    decisionState === "clear" || gatewayReadMode === "live" ? "normal" : "channel_frozen";

  return resolveBrowserRuntimeDecision({
    routeFamilyRef: input.routeFamilyRef,
    environmentRing: normalizeBrowserEnvironmentRing(input.environmentRing),
    trustState,
    projectionFreshnessState,
    freezeState,
  });
}

export function compileDependencyDegradationCatalog(): DependencyDegradationCompiler {
  return {
    catalog: dependencyDegradationCatalog,
    profilesByDependencyCode: new Map(
      dependencyDegradationCatalog.profiles.map((row) => [row.dependencyCode, row]),
    ),
    failureModeRowsByDependencyCode: new Map(
      dependencyDegradationCatalog.failureModeRows.map((row) => [row.dependencyCode, row]),
    ),
  };
}

export class DependencyDegradationExecutionEngine {
  readonly compiler: DependencyDegradationCompiler;
  private readonly timeline: DependencyDegradationTimelineEvent[] = [];

  constructor(compiler: DependencyDegradationCompiler = compileDependencyDegradationCatalog()) {
    this.compiler = compiler;
  }

  evaluate(input: DependencyFailureObservationInput): DependencyDegradationDecision {
    const profile = this.compiler.profilesByDependencyCode.get(input.dependencyCode);
    if (!profile) {
      throw new Error(`DEPENDENCY_DEGRADATION_PROFILE_UNKNOWN:${input.dependencyCode}`);
    }

    const normalizedInput = {
      dependencyCode: input.dependencyCode,
      environmentRing: input.environmentRing,
      routeFamilyRef: input.routeFamilyRef,
      healthState: input.healthState ?? ("degraded" as DependencyHealthState),
      runtimePublicationState:
        input.runtimePublicationState ?? ("published" as RuntimePublicationState),
      parityState: input.parityState ?? ("exact" as ReleasePublicationParityState),
      routeExposureState: input.routeExposureState ?? ("publishable" as RouteExposureState),
      trustFreezeLive: input.trustFreezeLive ?? true,
      assuranceHardBlock: input.assuranceHardBlock ?? false,
      observedFailureModeClass:
        input.observedFailureModeClass ?? (null as DependencyFailureModeClass | null),
      requestedWorkloadFamilyRefs:
        input.requestedWorkloadFamilyRefs ?? profile.impactedWorkloadFamilyRefs,
      observedAt: defaultObservedAt(input.observedAt),
    };

    const requestedFamilies = uniqueSorted(normalizedInput.requestedWorkloadFamilyRefs);
    const allowedExecutionFamilies = uniqueSorted([
      ...profile.impactedWorkloadFamilyRefs,
      ...profile.maximumEscalationFamilyRefs,
    ]);
    const boundedWorkloadFamilyRefs = requestedFamilies.filter((familyRef) =>
      allowedExecutionFamilies.includes(familyRef),
    );
    const blockedEscalationFamilyRefs = requestedFamilies.filter(
      (familyRef) => !allowedExecutionFamilies.includes(familyRef),
    );
    const recoveryGate = buildRecoveryGate(profile, normalizedInput, blockedEscalationFamilyRefs);
    const failureModeMismatch =
      normalizedInput.healthState !== "healthy" &&
      normalizedInput.observedFailureModeClass !== null &&
      normalizedInput.observedFailureModeClass !== profile.failureModeClass;

    let decisionState: DependencyDecisionState;
    if (normalizedInput.healthState === "healthy") {
      decisionState = "clear";
    } else if (normalizedInput.healthState === "recovering") {
      decisionState = recoveryGate.readyToClear ? "clear" : "recovery_held";
    } else {
      decisionState = "degraded";
    }

    const gatewayReadMode =
      decisionState === "clear"
        ? ("live" satisfies GatewayReadMode)
        : (profile.engineBinding.gatewayReadMode as GatewayReadMode);
    const browserMutationMode =
      decisionState === "clear"
        ? ("allow" satisfies BrowserMutationMode)
        : (profile.engineBinding.browserMutationMode as BrowserMutationMode);
    const projectionPublicationMode =
      decisionState === "clear"
        ? ("live" satisfies ProjectionPublicationMode)
        : (profile.engineBinding.projectionPublicationMode as ProjectionPublicationMode);
    const integrationDispatchMode =
      decisionState === "clear"
        ? ("dispatch" satisfies IntegrationDispatchMode)
        : (profile.engineBinding.integrationDispatchMode as IntegrationDispatchMode);

    const browserContract = buildBrowserContract(
      profile,
      normalizedInput,
      gatewayReadMode,
      projectionPublicationMode,
      decisionState,
    );
    const readPosture =
      decisionState === "clear"
        ? browserContract.effectiveBrowserPosture
        : worsenPosture(
            browserContract.effectiveBrowserPosture,
            profile.engineBinding.browserReadPosture as BrowserEffectivePostureState,
          );
    const assurancePublicationState = deriveAssurancePublicationState(
      normalizedInput,
      decisionState,
    );
    const reasonRefs = buildReasonRefs({
      decisionState,
      profile,
      observedFailureModeClass: normalizedInput.observedFailureModeClass,
      blockedEscalationFamilyRefs,
      recoveryGate,
      assurancePublicationState,
      failureModeMismatch,
    });
    const audienceFallbacks = buildAudienceFallbacks(profile);
    const primaryAudienceFallback = selectPrimaryAudienceFallback(
      normalizedInput.routeFamilyRef,
      audienceFallbacks,
    );

    const decision: DependencyDegradationDecision = {
      degradationDecisionId: `dddec::${stableDigest({
        dependencyCode: profile.dependencyCode,
        routeFamilyRef: normalizedInput.routeFamilyRef,
        environmentRing: normalizedInput.environmentRing,
        healthState: normalizedInput.healthState,
        observedFailureModeClass: normalizedInput.observedFailureModeClass,
        observedAt: normalizedInput.observedAt,
      })}`,
      dependencyCode: profile.dependencyCode,
      dependencyName: profile.dependencyName,
      profileId: profile.profileId,
      routeFamilyRef: normalizedInput.routeFamilyRef,
      environmentRing: normalizedInput.environmentRing,
      decisionState,
      outcomeState:
        blockedEscalationFamilyRefs.length === 0
          ? ("bounded" satisfies DependencyOutcomeState)
          : ("blocked" satisfies DependencyOutcomeState),
      observedFailureModeClass: normalizedInput.observedFailureModeClass,
      healthState: normalizedInput.healthState,
      topologyFallbackMode: profile.topologyFallbackMode,
      gatewayReadResolution: {
        mode: gatewayReadMode,
        allowed: gatewayReadMode !== "placeholder" || decisionState === "clear",
        reasonRefs,
      },
      browserMutationResolution: {
        mode: browserMutationMode,
        allowed: browserMutationMode === "allow",
        actionabilityState:
          decisionState === "clear"
            ? browserContract.actionabilityState
            : actionabilityForMutationMode(browserMutationMode),
        readPosture,
        browserContract,
        reasonRefs,
      },
      projectionPublicationResolution: {
        mode: projectionPublicationMode,
        freshnessState:
          projectionPublicationMode === "projection_stale" ? "stale_review" : "fresh",
        reasonRefs,
      },
      integrationDispatchResolution: {
        mode: integrationDispatchMode,
        reasonRefs,
      },
      assurancePublicationState,
      assuranceTrustEffect: profile.assuranceTrustEffect,
      boundedWorkloadFamilyRefs,
      blockedEscalationFamilyRefs,
      maximumEscalationFamilyRefs: profile.maximumEscalationFamilyRefs,
      impactedWorkloadFamilyRefs: profile.impactedWorkloadFamilyRefs,
      audienceFallbacks,
      primaryAudienceFallback,
      recoveryGate,
      reasonRefs,
      observedAt: normalizedInput.observedAt,
    };

    this.appendTimeline(decision);
    return decision;
  }

  getTimeline(): readonly DependencyDegradationTimelineEvent[] {
    return this.timeline;
  }

  private appendTimeline(decision: DependencyDegradationDecision): void {
    const eventKind: DegradationTimelineEventKind =
      decision.decisionState === "clear"
        ? "degradation_cleared"
        : decision.decisionState === "recovery_held"
          ? "degradation_recovery_held"
          : "degradation_entered";
    this.timeline.push({
      eventId: `ddevent::${stableDigest({
        dependencyCode: decision.dependencyCode,
        routeFamilyRef: decision.routeFamilyRef,
        eventKind,
        observedAt: decision.observedAt,
      })}`,
      eventKind,
      dependencyCode: decision.dependencyCode,
      environmentRing: decision.environmentRing,
      routeFamilyRef: decision.routeFamilyRef,
      decisionState: decision.decisionState,
      occurredAt: decision.observedAt,
      reasonRefs: decision.reasonRefs,
    });
  }
}

export function listDependencyDegradationProfiles(): readonly DependencyDegradationProfileRow[] {
  return dependencyDegradationCatalog.profiles;
}

export function listDependencyFailureModeRows(): readonly DependencyDegradationFailureModeRow[] {
  return dependencyDegradationCatalog.failureModeRows;
}

export function listDependencyAudienceFallbackRows(): readonly DependencyDegradationAudienceFallbackRow[] {
  return dependencyDegradationCatalog.audienceFallbackRows;
}

export function listDependencyDegradationScenarios(): readonly DependencyDegradationSimulationScenario[] {
  return dependencyDegradationCatalog.simulationScenarios;
}

export function resolveDependencyDegradationDecision(
  input: DependencyFailureObservationInput,
): DependencyDegradationDecision {
  return new DependencyDegradationExecutionEngine().evaluate(input);
}

export function resolveGatewayRouteDegradation(
  input: DependencyFailureObservationInput,
): DependencyDegradationDecision {
  return resolveDependencyDegradationDecision(input);
}

export function resolveCommandMutationDegradation(
  input: Omit<DependencyFailureObservationInput, "requestedWorkloadFamilyRefs">,
): DependencyDegradationDecision {
  return resolveDependencyDegradationDecision({
    ...input,
    requestedWorkloadFamilyRefs: ["wf_command_orchestration"],
  });
}

export function resolveProjectionPublicationDegradation(
  input: Omit<DependencyFailureObservationInput, "requestedWorkloadFamilyRefs">,
): DependencyDegradationDecision {
  return resolveDependencyDegradationDecision({
    ...input,
    requestedWorkloadFamilyRefs: ["wf_projection_read_models"],
  });
}

export function resolveIntegrationDispatchDegradation(
  input: Omit<DependencyFailureObservationInput, "requestedWorkloadFamilyRefs">,
): DependencyDegradationDecision {
  return resolveDependencyDegradationDecision({
    ...input,
    requestedWorkloadFamilyRefs: ["wf_integration_dispatch"],
  });
}

export function summarizeDependencyDegradationMetrics(
  decisions: readonly DependencyDegradationDecision[],
): DependencyDegradationMetricsSnapshot {
  const fallbackModeFrequency: Record<string, number> = {};
  let degradedEntryCount = 0;
  let recoveryHeldCount = 0;
  let clearCount = 0;
  let boundedOutcomeCount = 0;
  let blockedOutcomeCount = 0;

  for (const decision of decisions) {
    fallbackModeFrequency[decision.topologyFallbackMode] =
      (fallbackModeFrequency[decision.topologyFallbackMode] ?? 0) + 1;
    if (decision.decisionState === "clear") {
      clearCount += 1;
    } else if (decision.decisionState === "recovery_held") {
      recoveryHeldCount += 1;
    } else {
      degradedEntryCount += 1;
    }
    if (decision.outcomeState === "bounded") {
      boundedOutcomeCount += 1;
    } else {
      blockedOutcomeCount += 1;
    }
  }

  return {
    degradedEntryCount,
    recoveryHeldCount,
    clearCount,
    boundedOutcomeCount,
    blockedOutcomeCount,
    fallbackModeFrequency,
  };
}

export function createDependencyDegradationSimulationHarness() {
  const engine = new DependencyDegradationExecutionEngine();
  const decisions = dependencyDegradationCatalog.simulationScenarios.map((scenario) =>
    engine.evaluate({
      dependencyCode: scenario.dependencyCode,
      environmentRing: scenario.environmentRing,
      routeFamilyRef: scenario.routeFamilyRef,
      observedFailureModeClass: scenario.observedFailureModeClass,
      healthState: scenario.healthState,
      requestedWorkloadFamilyRefs: scenario.requestedWorkloadFamilyRefs,
      runtimePublicationState:
        ("runtimePublicationState" in scenario
          ? (scenario.runtimePublicationState as RuntimePublicationState | undefined)
          : undefined) ?? "published",
      parityState:
        ("parityState" in scenario
          ? (scenario.parityState as ReleasePublicationParityState | undefined)
          : undefined) ?? "exact",
      routeExposureState:
        ("routeExposureState" in scenario
          ? (scenario.routeExposureState as RouteExposureState | undefined)
          : undefined) ?? "publishable",
      trustFreezeLive:
        ("trustFreezeLive" in scenario ? scenario.trustFreezeLive : undefined) ?? true,
      assuranceHardBlock:
        ("assuranceHardBlock" in scenario ? scenario.assuranceHardBlock : undefined) ?? false,
      observedAt: "2026-04-13T12:00:00.000Z",
    }),
  );

  return {
    catalog: dependencyDegradationCatalog,
    decisions,
    metrics: summarizeDependencyDegradationMetrics(decisions),
    timeline: engine.getTimeline(),
  };
}

export function runDependencyDegradationSimulation() {
  return createDependencyDegradationSimulationHarness();
}
