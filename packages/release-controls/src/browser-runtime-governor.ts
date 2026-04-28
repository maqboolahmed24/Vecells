import {
  ApiContractRegistryStore,
  apiContractRegistryPayload,
  type ApiContractRouteBundle,
} from "../../api-contracts/src/api-contract-registry";
import { stableDigest } from "./build-provenance";
import type {
  ReleasePublicationParityState,
  RouteExposureState,
  RuntimePublicationState,
} from "./runtime-publication";
import {
  browserRuntimeGovernorCatalog,
  type BrowserRecoveryPostureMatrixRow,
  type BrowserRuntimeGovernorCachePolicy,
  type BrowserRuntimeGovernorLiveChannelContract,
  type BrowserRuntimeGovernorPublicationRing,
} from "./browser-runtime-governor.catalog";

const registry = new ApiContractRegistryStore(apiContractRegistryPayload);

export type BrowserEffectivePostureState = "live" | "read_only" | "recovery_only" | "blocked";
export type BrowserTransportObservationState =
  | "healthy"
  | "disconnected"
  | "reconnecting"
  | "replay_gap"
  | "message_ambiguity";
export type BrowserProjectionFreshnessState =
  | "fresh"
  | "updating"
  | "stale_review"
  | "replay_gap"
  | "blocked";
export type BrowserManifestState = "current" | "drifted";
export type BrowserTrustState = "trusted" | "degraded" | "quarantined";
export type BrowserFreezeState = "normal" | "channel_frozen" | "release_frozen";
export type BrowserOfflineState = "online" | "offline";
export type BrowserActionabilityState = "writable" | "read_only" | "recovery_only" | "blocked";
export type BrowserReconnectDisposition =
  | "not_applicable"
  | "retry_background"
  | "retry_with_replay"
  | "suspend_and_recover"
  | "manual_recovery_only";
export type BrowserRuntimeTelemetryEventKind =
  | "reconnect_observed"
  | "stale_disclosure_shown"
  | "browser_downgrade_applied"
  | "cache_invalidated"
  | "channel_suspended"
  | "recovery_completed";

export interface BrowserRuntimeObservationInput {
  routeFamilyRef: string;
  environmentRing: string;
  transportState?: BrowserTransportObservationState;
  projectionFreshnessState?: BrowserProjectionFreshnessState;
  manifestState?: BrowserManifestState;
  trustState?: BrowserTrustState;
  freezeState?: BrowserFreezeState;
  offlineState?: BrowserOfflineState;
  observedAt?: string;
}

export interface ProjectionFreshnessEnvelopeContract {
  projectionFreshnessEnvelopeId: string;
  routeFamilyRef: string;
  audienceSurfaceRef: string;
  environmentRing: string;
  freshnessState: BrowserProjectionFreshnessState;
  actionabilityState: BrowserActionabilityState;
  transportState: BrowserTransportObservationState;
  runtimePublicationState: RuntimePublicationState;
  parityState: ReleasePublicationParityState;
  routeExposureState: RouteExposureState;
  recoveryDispositionRef: string;
  stalenessDisclosureMode: string;
  reasonRefs: readonly string[];
}

export interface BrowserRecoveryPostureContract {
  browserRecoveryPostureId: string;
  routeFamilyRef: string;
  audienceSurfaceRef: string;
  gatewaySurfaceRef: string;
  environmentRing: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRecordRef: string;
  cachePolicyRef: string;
  liveUpdateChannelContractRef: string | null;
  baselineBrowserPosture: BrowserEffectivePostureState;
  effectiveBrowserPosture: BrowserEffectivePostureState;
  actionabilityState: BrowserActionabilityState;
  reconnectDisposition: BrowserReconnectDisposition;
  offlineReuseDisposition: string;
  staleDisclosureMode: string;
  recoveryDispositionRef: string;
  reasonRefs: readonly string[];
  projectionFreshnessEnvelope: ProjectionFreshnessEnvelopeContract;
  observedAt: string;
}

export interface BrowserRuntimeTelemetryEvent {
  eventId: string;
  eventKind: BrowserRuntimeTelemetryEventKind;
  routeFamilyRef: string;
  audienceSurfaceRef: string;
  environmentRing: string;
  effectiveBrowserPosture: BrowserEffectivePostureState;
  reasonRefs: readonly string[];
  occurredAt: string;
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

function actionabilityForPosture(state: BrowserEffectivePostureState): BrowserActionabilityState {
  switch (state) {
    case "live":
      return "writable";
    case "read_only":
      return "read_only";
    case "recovery_only":
      return "recovery_only";
    case "blocked":
      return "blocked";
  }
}

function nowIso(value: string | undefined): string {
  return value ?? "2026-04-13T00:00:00Z";
}

const publicationRingsByEnvironment = new Map<string, BrowserRuntimeGovernorPublicationRing>(
  browserRuntimeGovernorCatalog.publicationRings.map((row) => [row.environmentRing, row]),
);

const cachePoliciesByRef = new Map<string, BrowserRuntimeGovernorCachePolicy>(
  browserRuntimeGovernorCatalog.clientCachePolicies.map((row) => [row.clientCachePolicyId, row]),
);

const liveChannelsByRef = new Map<string, BrowserRuntimeGovernorLiveChannelContract>(
  browserRuntimeGovernorCatalog.liveUpdateChannelContracts.map((row) => [
    row.liveUpdateChannelContractId,
    row,
  ]),
);

const matrixRowsByKey = new Map<string, BrowserRecoveryPostureMatrixRow>(
  browserRuntimeGovernorCatalog.browserRecoveryPostureRows.map((row) => [
    `${row.environmentRing}:${row.routeFamilyRef}`,
    row,
  ]),
);

function hasRouteExposureDrift(
  state: BrowserRuntimeGovernorPublicationRing["routeExposureState"],
): boolean {
  return state === "frozen" || state === "withdrawn";
}

function reasonCodeFromState(
  input: BrowserRuntimeObservationInput,
  ring: BrowserRuntimeGovernorPublicationRing,
): string[] {
  const reasons: string[] = [];
  if (ring.runtimePublicationState !== "published") {
    reasons.push(`runtime_publication_${ring.runtimePublicationState}`);
  }
  if (ring.parityState !== "exact") {
    reasons.push(`publication_parity_${ring.parityState}`);
  }
  if (hasRouteExposureDrift(ring.routeExposureState)) {
    reasons.push(`route_exposure_${ring.routeExposureState}`);
  }
  if (input.transportState && input.transportState !== "healthy") {
    reasons.push(`transport_${input.transportState}`);
  }
  if (input.projectionFreshnessState && input.projectionFreshnessState !== "fresh") {
    reasons.push(`projection_${input.projectionFreshnessState}`);
  }
  if (input.manifestState === "drifted") {
    reasons.push("browser_manifest_drift");
  }
  if (input.trustState && input.trustState !== "trusted") {
    reasons.push(`trust_${input.trustState}`);
  }
  if (input.freezeState && input.freezeState !== "normal") {
    reasons.push(`freeze_${input.freezeState}`);
  }
  if (input.offlineState === "offline") {
    reasons.push("offline_reuse");
  }
  return reasons;
}

function resolveReconnectDisposition(
  liveChannel: BrowserRuntimeGovernorLiveChannelContract | null,
  transportState: BrowserTransportObservationState,
): BrowserReconnectDisposition {
  if (!liveChannel) {
    return "not_applicable";
  }
  if (transportState === "healthy") {
    return "retry_background";
  }
  if (transportState === "reconnecting") {
    return "retry_with_replay";
  }
  if (transportState === "replay_gap" || transportState === "message_ambiguity") {
    return "suspend_and_recover";
  }
  return liveChannel.offlineReconnectDisposition as BrowserReconnectDisposition;
}

function resolveMatrixRow(input: BrowserRuntimeObservationInput): BrowserRecoveryPostureMatrixRow {
  const row = matrixRowsByKey.get(`${input.environmentRing}:${input.routeFamilyRef}`);
  if (!row) {
    throw new Error(
      `BROWSER_RECOVERY_MATRIX_ROW_UNKNOWN:${input.environmentRing}:${input.routeFamilyRef}`,
    );
  }
  return row;
}

function resolvePublicationRing(
  input: BrowserRuntimeObservationInput,
): BrowserRuntimeGovernorPublicationRing {
  const ring = publicationRingsByEnvironment.get(input.environmentRing);
  if (!ring) {
    throw new Error(`BROWSER_RUNTIME_PUBLICATION_RING_UNKNOWN:${input.environmentRing}`);
  }
  return ring;
}

function resolveEffectivePosture(
  row: BrowserRecoveryPostureMatrixRow,
  input: BrowserRuntimeObservationInput,
  ring: BrowserRuntimeGovernorPublicationRing,
): BrowserEffectivePostureState {
  let posture = row.baselineBrowserPosture as BrowserEffectivePostureState;

  if (ring.runtimePublicationState !== "published" || ring.parityState !== "exact") {
    posture = worsenPosture(posture, row.publicationDriftPosture as BrowserEffectivePostureState);
  }
  if (hasRouteExposureDrift(ring.routeExposureState)) {
    posture = worsenPosture(
      posture,
      row.releaseOrChannelFreezePosture as BrowserEffectivePostureState,
    );
  }
  if (input.transportState === "disconnected" || input.transportState === "reconnecting") {
    posture = worsenPosture(
      posture,
      row.transientDisconnectPosture as BrowserEffectivePostureState,
    );
  }
  if (input.transportState === "replay_gap" || input.transportState === "message_ambiguity") {
    posture = worsenPosture(posture, row.replayGapPosture as BrowserEffectivePostureState);
  }
  if (
    input.projectionFreshnessState === "stale_review" ||
    input.projectionFreshnessState === "blocked" ||
    input.projectionFreshnessState === "updating"
  ) {
    posture = worsenPosture(posture, row.staleProjectionPosture as BrowserEffectivePostureState);
  }
  if (input.manifestState === "drifted") {
    posture = worsenPosture(posture, row.manifestDriftPosture as BrowserEffectivePostureState);
  }
  if (input.trustState === "degraded" || input.trustState === "quarantined") {
    posture = worsenPosture(
      posture,
      row.assuranceTrustDriftPosture as BrowserEffectivePostureState,
    );
  }
  if (input.freezeState === "channel_frozen" || input.freezeState === "release_frozen") {
    posture = worsenPosture(
      posture,
      row.releaseOrChannelFreezePosture as BrowserEffectivePostureState,
    );
  }
  if (input.offlineState === "offline") {
    posture = worsenPosture(posture, row.offlineReusePosture as BrowserEffectivePostureState);
  }
  return posture;
}

function resolveProjectionFreshnessState(
  input: BrowserRuntimeObservationInput,
  posture: BrowserEffectivePostureState,
): BrowserProjectionFreshnessState {
  if (input.transportState === "replay_gap" || input.transportState === "message_ambiguity") {
    return "replay_gap";
  }
  if (input.projectionFreshnessState) {
    return input.projectionFreshnessState;
  }
  if (posture === "blocked") {
    return "blocked";
  }
  return "fresh";
}

function resolveRecoveryDispositionRef(
  row: BrowserRecoveryPostureMatrixRow,
  posture: BrowserEffectivePostureState,
): string {
  if (posture === "blocked" && row.blockedRecoveryDispositionRef) {
    return row.blockedRecoveryDispositionRef;
  }
  if (posture === "recovery_only" && row.recoveryOnlyRecoveryDispositionRef) {
    return row.recoveryOnlyRecoveryDispositionRef;
  }
  if (posture === "read_only" && row.readOnlyRecoveryDispositionRef) {
    return row.readOnlyRecoveryDispositionRef;
  }
  return row.defaultRecoveryDispositionRef;
}

export function resolveBrowserRuntimeDecision(
  input: BrowserRuntimeObservationInput,
): BrowserRecoveryPostureContract {
  const normalizedInput: BrowserRuntimeObservationInput = {
    transportState: "healthy",
    projectionFreshnessState: "fresh",
    manifestState: "current",
    trustState: "trusted",
    freezeState: "normal",
    offlineState: "online",
    ...input,
  };
  const row = resolveMatrixRow(normalizedInput);
  const ring = resolvePublicationRing(normalizedInput);
  const routeBundle = registry.lookupByRouteFamilyRef(normalizedInput.routeFamilyRef);
  if (!routeBundle) {
    throw new Error(`BROWSER_RUNTIME_ROUTE_BUNDLE_UNKNOWN:${normalizedInput.routeFamilyRef}`);
  }
  const cachePolicy = cachePoliciesByRef.get(row.cachePolicyRef);
  if (!cachePolicy) {
    throw new Error(`BROWSER_RUNTIME_CACHE_POLICY_UNKNOWN:${row.cachePolicyRef}`);
  }
  const liveChannel =
    row.liveUpdateChannelContractRef !== null
      ? (liveChannelsByRef.get(row.liveUpdateChannelContractRef) ?? null)
      : null;

  const effectiveBrowserPosture = resolveEffectivePosture(row, normalizedInput, ring);
  const freshnessState = resolveProjectionFreshnessState(normalizedInput, effectiveBrowserPosture);
  const recoveryDispositionRef = resolveRecoveryDispositionRef(row, effectiveBrowserPosture);
  const reasonRefs = reasonCodeFromState(normalizedInput, ring);
  const actionabilityState = actionabilityForPosture(effectiveBrowserPosture);
  const observedAt = nowIso(normalizedInput.observedAt);

  const projectionFreshnessEnvelope: ProjectionFreshnessEnvelopeContract = {
    projectionFreshnessEnvelopeId: `pfe::${stableDigest({
      routeFamilyRef: normalizedInput.routeFamilyRef,
      environmentRing: normalizedInput.environmentRing,
      observedAt,
      effectiveBrowserPosture,
      freshnessState,
    })}`,
    routeFamilyRef: normalizedInput.routeFamilyRef,
    audienceSurfaceRef: row.audienceSurfaceRef,
    environmentRing: normalizedInput.environmentRing,
    freshnessState,
    actionabilityState,
    transportState: normalizedInput.transportState ?? "healthy",
    runtimePublicationState: ring.runtimePublicationState as RuntimePublicationState,
    parityState: ring.parityState as ReleasePublicationParityState,
    routeExposureState: ring.routeExposureState as RouteExposureState,
    recoveryDispositionRef,
    stalenessDisclosureMode: row.staleDisclosureMode,
    reasonRefs,
  };

  return {
    browserRecoveryPostureId: row.browserRecoveryPostureId,
    routeFamilyRef: normalizedInput.routeFamilyRef,
    audienceSurfaceRef: row.audienceSurfaceRef,
    gatewaySurfaceRef: row.gatewaySurfaceRef,
    environmentRing: normalizedInput.environmentRing,
    runtimePublicationBundleRef: ring.runtimePublicationBundleRef,
    releasePublicationParityRecordRef: ring.releasePublicationParityRecordRef,
    cachePolicyRef: row.cachePolicyRef,
    liveUpdateChannelContractRef: row.liveUpdateChannelContractRef,
    baselineBrowserPosture: row.baselineBrowserPosture as BrowserEffectivePostureState,
    effectiveBrowserPosture,
    actionabilityState,
    reconnectDisposition: resolveReconnectDisposition(
      liveChannel,
      normalizedInput.transportState ?? "healthy",
    ),
    offlineReuseDisposition: cachePolicy.offlineReuseDisposition,
    staleDisclosureMode: row.staleDisclosureMode,
    recoveryDispositionRef,
    reasonRefs,
    projectionFreshnessEnvelope,
    observedAt,
  };
}

export function createBrowserRuntimeTelemetryEvent(input: {
  eventKind: BrowserRuntimeTelemetryEventKind;
  decision: BrowserRecoveryPostureContract;
  occurredAt?: string;
}): BrowserRuntimeTelemetryEvent {
  return {
    eventId: `brtc::${stableDigest({
      eventKind: input.eventKind,
      routeFamilyRef: input.decision.routeFamilyRef,
      environmentRing: input.decision.environmentRing,
      occurredAt: input.occurredAt ?? input.decision.observedAt,
    })}`,
    eventKind: input.eventKind,
    routeFamilyRef: input.decision.routeFamilyRef,
    audienceSurfaceRef: input.decision.audienceSurfaceRef,
    environmentRing: input.decision.environmentRing,
    effectiveBrowserPosture: input.decision.effectiveBrowserPosture,
    reasonRefs: input.decision.reasonRefs,
    occurredAt: input.occurredAt ?? input.decision.observedAt,
  };
}

export function listBrowserRecoveryPostureRows(): readonly BrowserRecoveryPostureMatrixRow[] {
  return browserRuntimeGovernorCatalog.browserRecoveryPostureRows;
}

export function listBrowserRuntimePublicationRings(): readonly BrowserRuntimeGovernorPublicationRing[] {
  return browserRuntimeGovernorCatalog.publicationRings;
}

export function lookupRouteBundle(routeFamilyRef: string): ApiContractRouteBundle | undefined {
  return registry.lookupByRouteFamilyRef(routeFamilyRef);
}

export function createBrowserRuntimeSimulationHarness() {
  const scenarios = [
    resolveBrowserRuntimeDecision({
      routeFamilyRef: "rf_patient_home",
      environmentRing: "local",
    }),
    resolveBrowserRuntimeDecision({
      routeFamilyRef: "rf_operations_board",
      environmentRing: "local",
      transportState: "replay_gap",
      projectionFreshnessState: "replay_gap",
    }),
    resolveBrowserRuntimeDecision({
      routeFamilyRef: "rf_support_replay_observe",
      environmentRing: "preprod",
      trustState: "degraded",
    }),
    resolveBrowserRuntimeDecision({
      routeFamilyRef: "rf_governance_shell",
      environmentRing: "production",
      manifestState: "drifted",
      freezeState: "release_frozen",
    }),
    resolveBrowserRuntimeDecision({
      routeFamilyRef: "rf_intake_self_service",
      environmentRing: "ci-preview",
      offlineState: "offline",
    }),
  ];

  return {
    catalog: browserRuntimeGovernorCatalog,
    scenarios,
    telemetryEvents: scenarios.map((decision) =>
      createBrowserRuntimeTelemetryEvent({
        eventKind: "browser_downgrade_applied",
        decision,
      }),
    ),
  };
}
