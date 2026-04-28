export const PHASE9_LIVE_PROJECTION_SCHEMA_VERSION = "464.phase9.live-projection-channel.v1";
export const PHASE9_LIVE_PROJECTION_VISUAL_MODE = "Phase9_Live_Projection_Gateway";
export const PHASE9_LIVE_PROJECTION_GAP_ARTIFACT_REF =
  "PHASE9_BATCH_458_472_INTERFACE_GAP_464_LIVE_EVENT_STREAM_CONTRACTS";

export type Phase9LiveGatewayScenarioState =
  | "normal"
  | "projection_version_mismatch"
  | "stale_projection"
  | "quarantined_incident_producer"
  | "graph_drift"
  | "action_settlement_failed"
  | "delta_gate_open"
  | "return_token_drift"
  | "telemetry_fence_violation"
  | "missing_runtime_binding"
  | "reconnecting"
  | "recovery_only";

export type Phase9LiveSurfaceCode =
  | "operations_overview"
  | "assurance_center"
  | "audit_explorer"
  | "resilience_board"
  | "incident_desk"
  | "records_governance"
  | "tenant_governance"
  | "access_studio"
  | "compliance_ledger"
  | "conformance_scorecard";

export type Phase9LiveProjectionRoute =
  | "/ops/overview"
  | "/ops/assurance"
  | "/ops/audit"
  | "/ops/resilience"
  | "/ops/incidents"
  | "/ops/governance/records"
  | "/ops/governance/tenants"
  | "/ops/access/roles"
  | "/ops/governance/compliance"
  | "/ops/conformance";

export type Phase9LiveProjectionState =
  | "current"
  | "stale"
  | "quarantined"
  | "blocked"
  | "diagnostic_only"
  | "recovery_only"
  | "reconnecting";

export type Phase9LiveActionSettlementState =
  | "none"
  | "pending"
  | "applied"
  | "blocked"
  | "failed"
  | "stale_reacquire"
  | "read_only_recovery";

export type Phase9LiveDeltaGateState =
  | "closed"
  | "queued"
  | "safe_apply"
  | "stale_reacquire"
  | "read_only_recovery";

export type Phase9LiveGraphVerdictState = "complete" | "stale" | "blocked";
export type Phase9LiveReturnTokenState =
  | "valid"
  | "partial_restore"
  | "read_only_recovery"
  | "expired";
export type Phase9LiveTelemetryFenceState = "redacted" | "blocked";

export type Phase9ProjectionPatchKind =
  | "projection_patch"
  | "action_settlement"
  | "graph_drift"
  | "producer_quarantine"
  | "delta_gate"
  | "return_token"
  | "reconnect"
  | "telemetry_block";

export interface Phase9LiveProjectionChannelContract {
  readonly schemaVersion: typeof PHASE9_LIVE_PROJECTION_SCHEMA_VERSION;
  readonly channelId: string;
  readonly surfaceCode: Phase9LiveSurfaceCode;
  readonly route: Phase9LiveProjectionRoute;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly routeFamilyRef: "rf_ops_shell" | "rf_governance_shell";
  readonly scopeTupleHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly projectionContractVersion: string;
  readonly expectedProjectionContractVersion: string;
  readonly surfaceBindingRef: string;
  readonly queryContractRef: string;
  readonly liveUpdateChannelRef: string;
  readonly cachePolicyRef: string;
  readonly telemetryDisclosureFenceRef: "UITelemetryDisclosureFence";
  readonly rawEventBrowserJoinAllowed: false;
  readonly rawDomainEventPayloadAllowed: false;
  readonly requiresRuntimeBinding: true;
  readonly failureMode:
    | "block_on_missing_projection_version"
    | "block_on_missing_runtime_binding"
    | "slice_bounded_quarantine";
  readonly reconnectPolicy: {
    readonly maxBufferedBatchCount: 4;
    readonly reconnectBackoffMs: readonly [250, 750, 1500];
    readonly staleAfterMs: 45000;
  };
  readonly cleanupRef: string;
  readonly subscriptionKey: string;
}

export interface AssuranceGraphLiveUpdateContract {
  readonly channelId: string;
  readonly graphSnapshotRef: string;
  readonly graphVerdictState: Phase9LiveGraphVerdictState;
  readonly graphHash: string;
  readonly requiredNodeRefs: readonly string[];
  readonly staleNodeRefs: readonly string[];
  readonly blockedExportRefs: readonly string[];
}

export interface OperationsProjectionLiveUpdateContract {
  readonly channelId: string;
  readonly boardTupleHash: string;
  readonly selectedSliceRef: string;
  readonly selectedEntityTupleHash: string;
  readonly deltaGateState: Phase9LiveDeltaGateState;
  readonly actionEligibilityState:
    | "live_commit"
    | "observe_only"
    | "stale_reacquire"
    | "read_only_recovery"
    | "blocked";
  readonly queuedDeltaBatchRefs: readonly string[];
}

export interface IncidentLiveUpdateContract {
  readonly channelId: string;
  readonly incidentQueueProjectionRef: string;
  readonly reportabilityState: "not_reportable" | "reportable" | "pending_review" | "blocked";
  readonly containmentSettlementRef: string;
  readonly producerTrustState: "trusted" | "degraded" | "quarantined";
}

export interface ResiliencePostureLiveUpdateContract {
  readonly channelId: string;
  readonly resilienceTupleHash: string;
  readonly recoveryControlPosture:
    | "live_control"
    | "diagnostic_only"
    | "governed_recovery"
    | "blocked";
  readonly latestResilienceActionSettlementRef: string;
  readonly evidencePackState: "current" | "stale" | "blocked";
}

export interface TenantGovernanceLiveUpdateContract {
  readonly channelId: string;
  readonly configCompilationHash: string;
  readonly standardsWatchlistState: "exact" | "stale" | "blocked";
  readonly migrationPostureState: "pass" | "watch" | "blocked" | "permission_denied";
  readonly projectionBackfillState: "pass" | "watch" | "blocked";
}

export interface ConformanceScorecardLiveUpdateContract {
  readonly channelId: string;
  readonly scorecardHash: string;
  readonly scorecardState: "exact" | "stale" | "blocked";
  readonly bauSignoffState: "ready" | "blocked" | "pending";
  readonly blockerRefs: readonly string[];
}

export interface Phase9LiveProjectionPatchFixture {
  readonly fixtureId: string;
  readonly patchKind: Phase9ProjectionPatchKind;
  readonly targetSurface: Phase9LiveSurfaceCode;
  readonly safeProjectionRef: string;
  readonly eventStreamMessageId: string;
  readonly rawDomainEventRef: null;
  readonly payloadClass: "safe_read_projection";
  readonly projectionPatchHash: string;
  readonly changedBecauseSummary: string;
  readonly visiblePatchDurationMs: 140;
  readonly reducedMotionEquivalent: string;
  readonly telemetryDisclosureFenceState: Phase9LiveTelemetryFenceState;
}

export interface Phase9LiveSurfaceProjection {
  readonly surfaceCode: Phase9LiveSurfaceCode;
  readonly route: Phase9LiveProjectionRoute;
  readonly label: string;
  readonly channelContract: Phase9LiveProjectionChannelContract;
  readonly projectionState: Phase9LiveProjectionState;
  readonly runtimeBindingState: "live" | "stale" | "missing" | "blocked" | "recovery_only";
  readonly patchState: "idle" | "highlighting" | "buffered" | "settled" | "blocked";
  readonly graphVerdictState: Phase9LiveGraphVerdictState;
  readonly actionSettlementState: Phase9LiveActionSettlementState;
  readonly deltaGateState: Phase9LiveDeltaGateState;
  readonly returnTokenState: Phase9LiveReturnTokenState;
  readonly telemetryDisclosureFenceState: Phase9LiveTelemetryFenceState;
  readonly focusProtectionState: "none" | "active" | "stale" | "released";
  readonly selectedAnchorRef: string;
  readonly selectedAnchorPreserved: boolean;
  readonly lastStableSnapshotRef: string;
  readonly latestSafeProjectionRef: string;
  readonly latestSettlementRef: string;
  readonly changedBecauseSummary: string;
  readonly nextSafeAction: string;
  readonly blockedProducerRefs: readonly string[];
  readonly affectedOnly: boolean;
}

export interface LivePhase9ProjectionGatewayProjection {
  readonly schemaVersion: typeof PHASE9_LIVE_PROJECTION_SCHEMA_VERSION;
  readonly visualMode: typeof PHASE9_LIVE_PROJECTION_VISUAL_MODE;
  readonly scenarioState: Phase9LiveGatewayScenarioState;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly selectedSurfaceCode: Phase9LiveSurfaceCode;
  readonly selectedSurface: Phase9LiveSurfaceProjection;
  readonly surfaces: readonly Phase9LiveSurfaceProjection[];
  readonly channelContracts: readonly Phase9LiveProjectionChannelContract[];
  readonly assuranceGraphUpdate: AssuranceGraphLiveUpdateContract;
  readonly operationsProjectionUpdate: OperationsProjectionLiveUpdateContract;
  readonly incidentUpdate: IncidentLiveUpdateContract;
  readonly resiliencePostureUpdate: ResiliencePostureLiveUpdateContract;
  readonly tenantGovernanceUpdate: TenantGovernanceLiveUpdateContract;
  readonly conformanceScorecardUpdate: ConformanceScorecardLiveUpdateContract;
  readonly testEventProducerFixtures: readonly Phase9LiveProjectionPatchFixture[];
  readonly liveGatewayHash: string;
  readonly currentCount: number;
  readonly staleCount: number;
  readonly quarantinedCount: number;
  readonly blockedCount: number;
  readonly recoveryOnlyCount: number;
  readonly rawEventBrowserJoinAllowed: false;
  readonly rawDomainEventPayloadAllowed: false;
  readonly telemetryFenceRedacted: boolean;
  readonly subscriptionCleanupProven: boolean;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly automationAnchors: readonly string[];
  readonly interfaceGapArtifactRef: typeof PHASE9_LIVE_PROJECTION_GAP_ARTIFACT_REF;
}

export const phase9LiveSurfaceDefinitions = [
  ["operations_overview", "/ops/overview", "Operations overview", "rf_ops_shell"],
  ["assurance_center", "/ops/assurance", "Assurance center", "rf_ops_shell"],
  ["audit_explorer", "/ops/audit", "Audit explorer", "rf_ops_shell"],
  ["resilience_board", "/ops/resilience", "Resilience board", "rf_ops_shell"],
  ["incident_desk", "/ops/incidents", "Incident desk", "rf_ops_shell"],
  ["records_governance", "/ops/governance/records", "Records governance", "rf_governance_shell"],
  ["tenant_governance", "/ops/governance/tenants", "Tenant governance", "rf_governance_shell"],
  ["access_studio", "/ops/access/roles", "Access studio", "rf_governance_shell"],
  ["compliance_ledger", "/ops/governance/compliance", "Compliance ledger", "rf_governance_shell"],
  ["conformance_scorecard", "/ops/conformance", "Conformance scorecard", "rf_ops_shell"],
] as const satisfies readonly (readonly [
  Phase9LiveSurfaceCode,
  Phase9LiveProjectionRoute,
  string,
  Phase9LiveProjectionChannelContract["routeFamilyRef"],
])[];

const SOURCE_ALGORITHM_REFS = [
  "blueprint/phase-9-the-assurance-ledger.md#9A-assurance-ledger-evidence-graph-and-operational-state-contracts",
  "blueprint/phase-9-the-assurance-ledger.md#9B-live-operational-projections-service-levels-and-breach-risk-engine",
  "blueprint/phase-9-the-assurance-ledger.md#9C-audit-explorer-break-glass-review-and-support-replay",
  "blueprint/phase-9-the-assurance-ledger.md#9D-assurance-pack-factory-and-standards-evidence-pipeline",
  "blueprint/phase-9-the-assurance-ledger.md#9F-resilience-architecture-restore-orchestration-and-chaos-programme",
  "blueprint/phase-9-the-assurance-ledger.md#9G-security-operations-incident-workflow-and-just-culture-reporting",
  "blueprint/phase-9-the-assurance-ledger.md#9H-tenant-governance-config-immutability-and-dependency-hygiene",
  "blueprint/phase-9-the-assurance-ledger.md#9I-full-program-exercises-bau-transfer-and-formal-exit-gate",
  "blueprint/operations-console-frontend-blueprint.md#3.1-live-cadence-and-stale-slice-posture",
  "blueprint/platform-runtime-and-release-blueprint.md#live-update-channel-contracts",
  "blueprint/phase-0-the-foundation-protocol.md#UIEventEnvelope",
  "blueprint/phase-0-the-foundation-protocol.md#UITelemetryDisclosureFence",
];

const AUTOMATION_ANCHORS = [
  "phase9-live-projection-gateway-strip",
  "phase9-live-gateway-status",
  "phase9-live-update-fixture-producer",
  "phase9-live-queued-delta-digest",
  "phase9-live-source-slice-table",
  "phase9-live-return-token-panel",
];

export const requiredPhase9LiveSurfaceCodes = phase9LiveSurfaceDefinitions.map(
  ([surfaceCode]) => surfaceCode,
);

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `sha256:${(hash >>> 0).toString(16).padStart(8, "0")}${value.length
    .toString(16)
    .padStart(8, "0")}`;
}

function slug(value: string): string {
  return value.replace(/_/g, "-").toLowerCase();
}

export function normalizePhase9LiveGatewayScenarioState(
  value: string | null | undefined,
): Phase9LiveGatewayScenarioState {
  const normalized = String(value ?? "normal")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (
    normalized === "projection_version_mismatch" ||
    normalized === "stale_projection" ||
    normalized === "quarantined_incident_producer" ||
    normalized === "graph_drift" ||
    normalized === "action_settlement_failed" ||
    normalized === "delta_gate_open" ||
    normalized === "return_token_drift" ||
    normalized === "telemetry_fence_violation" ||
    normalized === "missing_runtime_binding" ||
    normalized === "reconnecting" ||
    normalized === "recovery_only"
  ) {
    return normalized;
  }
  return "normal";
}

export function phase9LiveSurfaceCodeForPath(pathname: string): Phase9LiveSurfaceCode {
  if (pathname.includes("/ops/assurance")) return "assurance_center";
  if (pathname.includes("/ops/audit")) return "audit_explorer";
  if (pathname.includes("/ops/resilience")) return "resilience_board";
  if (pathname.includes("/ops/incidents")) return "incident_desk";
  if (pathname.includes("/ops/governance/records")) return "records_governance";
  if (pathname.includes("/ops/governance/tenants")) return "tenant_governance";
  if (pathname.includes("/ops/access")) return "access_studio";
  if (pathname.includes("/ops/governance/compliance")) return "compliance_ledger";
  if (pathname.includes("/ops/conformance")) return "conformance_scorecard";
  return "operations_overview";
}

function createChannelContract(
  surfaceCode: Phase9LiveSurfaceCode,
  route: Phase9LiveProjectionRoute,
  routeFamilyRef: Phase9LiveProjectionChannelContract["routeFamilyRef"],
  tenantRef: string,
  environmentRef: string,
  selected: boolean,
  scenarioState: Phase9LiveGatewayScenarioState,
): Phase9LiveProjectionChannelContract {
  const expectedProjectionContractVersion = `projection-contract:phase9:${surfaceCode}:2026.04`;
  const projectionContractVersion =
    selected && scenarioState === "projection_version_mismatch"
      ? `projection-contract:phase9:${surfaceCode}:stale`
      : expectedProjectionContractVersion;
  const runtimeBinding =
    selected && scenarioState === "missing_runtime_binding"
      ? "missing"
      : `audience-surface-runtime-binding:phase9:${surfaceCode}:published`;
  const subscriptionKey = [
    tenantRef,
    environmentRef,
    routeFamilyRef,
    route,
    expectedProjectionContractVersion,
    runtimeBinding,
  ].join(":");
  return {
    schemaVersion: PHASE9_LIVE_PROJECTION_SCHEMA_VERSION,
    channelId: `live-channel-464-${slug(surfaceCode)}`,
    surfaceCode,
    route,
    tenantRef,
    environmentRef,
    routeFamilyRef,
    scopeTupleHash: stableHash(`${tenantRef}:${environmentRef}:${surfaceCode}:scope`),
    runtimePublicationBundleRef: `runtime-publication-bundle:phase9:${environmentRef}:2026.04.28`,
    projectionContractVersion,
    expectedProjectionContractVersion,
    surfaceBindingRef: runtimeBinding,
    queryContractRef: `projection-query-contract:phase9:${surfaceCode}`,
    liveUpdateChannelRef: `live-update-channel-contract:phase9:${surfaceCode}`,
    cachePolicyRef: `client-cache-policy:phase9:${surfaceCode}:last-stable`,
    telemetryDisclosureFenceRef: "UITelemetryDisclosureFence",
    rawEventBrowserJoinAllowed: false,
    rawDomainEventPayloadAllowed: false,
    requiresRuntimeBinding: true,
    failureMode:
      selected && scenarioState === "missing_runtime_binding"
        ? "block_on_missing_runtime_binding"
        : selected && scenarioState === "projection_version_mismatch"
          ? "block_on_missing_projection_version"
          : "slice_bounded_quarantine",
    reconnectPolicy: {
      maxBufferedBatchCount: 4,
      reconnectBackoffMs: [250, 750, 1500],
      staleAfterMs: 45000,
    },
    cleanupRef: `subscription-cleanup:phase9:${surfaceCode}`,
    subscriptionKey: stableHash(subscriptionKey),
  };
}

function affectedByScenario(
  surfaceCode: Phase9LiveSurfaceCode,
  selectedSurfaceCode: Phase9LiveSurfaceCode,
  scenarioState: Phase9LiveGatewayScenarioState,
): boolean {
  if (scenarioState === "quarantined_incident_producer") {
    return (
      surfaceCode === "incident_desk" ||
      surfaceCode === "assurance_center" ||
      surfaceCode === "operations_overview"
    );
  }
  return surfaceCode === selectedSurfaceCode;
}

function surfaceStateForScenario(
  scenarioState: Phase9LiveGatewayScenarioState,
  affected: boolean,
): Phase9LiveProjectionState {
  if (!affected) return "current";
  switch (scenarioState) {
    case "projection_version_mismatch":
    case "missing_runtime_binding":
    case "telemetry_fence_violation":
      return "blocked";
    case "stale_projection":
    case "graph_drift":
      return "stale";
    case "quarantined_incident_producer":
      return "quarantined";
    case "action_settlement_failed":
      return "diagnostic_only";
    case "delta_gate_open":
      return "current";
    case "return_token_drift":
    case "recovery_only":
      return "recovery_only";
    case "reconnecting":
      return "reconnecting";
    case "normal":
      return "current";
  }
}

function runtimeBindingStateForProjection(
  projectionState: Phase9LiveProjectionState,
  scenarioState: Phase9LiveGatewayScenarioState,
  affected: boolean,
): Phase9LiveSurfaceProjection["runtimeBindingState"] {
  if (affected && scenarioState === "missing_runtime_binding") return "missing";
  if (projectionState === "blocked" || projectionState === "quarantined") return "blocked";
  if (projectionState === "stale" || projectionState === "reconnecting") return "stale";
  if (projectionState === "recovery_only") return "recovery_only";
  return "live";
}

function graphVerdictForScenario(
  scenarioState: Phase9LiveGatewayScenarioState,
  affected: boolean,
): Phase9LiveGraphVerdictState {
  if (!affected) return "complete";
  if (scenarioState === "graph_drift") return "stale";
  if (
    scenarioState === "projection_version_mismatch" ||
    scenarioState === "missing_runtime_binding" ||
    scenarioState === "telemetry_fence_violation"
  ) {
    return "blocked";
  }
  return "complete";
}

function actionSettlementForScenario(
  scenarioState: Phase9LiveGatewayScenarioState,
  affected: boolean,
): Phase9LiveActionSettlementState {
  if (!affected) return "applied";
  switch (scenarioState) {
    case "action_settlement_failed":
      return "failed";
    case "projection_version_mismatch":
    case "missing_runtime_binding":
    case "telemetry_fence_violation":
      return "blocked";
    case "graph_drift":
    case "stale_projection":
      return "stale_reacquire";
    case "return_token_drift":
    case "recovery_only":
      return "read_only_recovery";
    case "delta_gate_open":
      return "pending";
    case "quarantined_incident_producer":
      return "blocked";
    case "reconnecting":
      return "pending";
    case "normal":
      return "applied";
  }
}

function deltaGateForScenario(
  scenarioState: Phase9LiveGatewayScenarioState,
  affected: boolean,
): Phase9LiveDeltaGateState {
  if (!affected) return "closed";
  switch (scenarioState) {
    case "delta_gate_open":
      return "queued";
    case "stale_projection":
    case "graph_drift":
      return "stale_reacquire";
    case "return_token_drift":
    case "recovery_only":
      return "read_only_recovery";
    default:
      return "closed";
  }
}

function returnTokenForScenario(
  scenarioState: Phase9LiveGatewayScenarioState,
  affected: boolean,
): Phase9LiveReturnTokenState {
  if (!affected) return "valid";
  switch (scenarioState) {
    case "return_token_drift":
      return "partial_restore";
    case "recovery_only":
      return "read_only_recovery";
    case "projection_version_mismatch":
    case "missing_runtime_binding":
      return "expired";
    default:
      return "valid";
  }
}

function patchStateForScenario(
  scenarioState: Phase9LiveGatewayScenarioState,
  affected: boolean,
): Phase9LiveSurfaceProjection["patchState"] {
  if (!affected) return "settled";
  switch (scenarioState) {
    case "delta_gate_open":
      return "buffered";
    case "projection_version_mismatch":
    case "missing_runtime_binding":
    case "telemetry_fence_violation":
      return "blocked";
    case "normal":
      return "highlighting";
    default:
      return "settled";
  }
}

function changedBecauseSummary(
  scenarioState: Phase9LiveGatewayScenarioState,
  affected: boolean,
  label: string,
): string {
  if (!affected) {
    return `${label} remains on the last current projection contract.`;
  }
  switch (scenarioState) {
    case "projection_version_mismatch":
      return `${label} is blocked because the projection contract version no longer matches the published runtime binding.`;
    case "stale_projection":
      return `${label} moved to stale review because producer lag exceeded the declared channel window.`;
    case "quarantined_incident_producer":
      return `${label} is downgraded by a quarantined incident producer; unrelated slices stay current.`;
    case "graph_drift":
      return `${label} blocks export and signoff because graph completeness drifted.`;
    case "action_settlement_failed":
      return `${label} replaced local pending state with an authoritative failed settlement.`;
    case "delta_gate_open":
      return `${label} buffered a safe projection patch while the delta gate protects the selected row.`;
    case "return_token_drift":
      return `${label} restores the last stable context in read-only recovery after return-token drift.`;
    case "telemetry_fence_violation":
      return `${label} blocks the update because telemetry disclosure fence validation failed.`;
    case "missing_runtime_binding":
      return `${label} blocks live posture because the runtime surface binding is missing.`;
    case "reconnecting":
      return `${label} is reconnecting and keeps the last stable snapshot visible.`;
    case "recovery_only":
      return `${label} remains recovery-only until publication and trust posture revalidate.`;
    case "normal":
      return `${label} applied a safe read-projection patch and settled to neutral.`;
  }
}

function nextSafeAction(
  projectionState: Phase9LiveProjectionState,
  scenarioState: Phase9LiveGatewayScenarioState,
): string {
  if (scenarioState === "delta_gate_open") {
    return "Review queued deltas before releasing the delta gate.";
  }
  if (scenarioState === "return_token_drift") {
    return "Use the restore report to reacquire the nearest valid source context.";
  }
  if (projectionState === "blocked") {
    return "Keep controls blocked until the declared binding, graph, or telemetry fence revalidates.";
  }
  if (projectionState === "stale") {
    return "Keep the last stable content visible and reacquire the projection contract.";
  }
  if (projectionState === "quarantined") {
    return "Inspect the blocking producer namespace and keep dependent actions read-only.";
  }
  if (projectionState === "recovery_only") {
    return "Continue in recovery-only posture until runtime publication parity is exact.";
  }
  return "Patch in place and keep selected context stable.";
}

function createSurfaceProjection(
  definition: (typeof phase9LiveSurfaceDefinitions)[number],
  options: {
    readonly tenantRef: string;
    readonly environmentRef: string;
    readonly selectedSurfaceCode: Phase9LiveSurfaceCode;
    readonly scenarioState: Phase9LiveGatewayScenarioState;
  },
): Phase9LiveSurfaceProjection {
  const [surfaceCode, route, label, routeFamilyRef] = definition;
  const affected = affectedByScenario(
    surfaceCode,
    options.selectedSurfaceCode,
    options.scenarioState,
  );
  const projectionState = surfaceStateForScenario(options.scenarioState, affected);
  const channelContract = createChannelContract(
    surfaceCode,
    route,
    routeFamilyRef,
    options.tenantRef,
    options.environmentRef,
    affected,
    options.scenarioState,
  );
  const graphVerdictState = graphVerdictForScenario(options.scenarioState, affected);
  const actionSettlementState = actionSettlementForScenario(options.scenarioState, affected);
  return {
    surfaceCode,
    route,
    label,
    channelContract,
    projectionState,
    runtimeBindingState: runtimeBindingStateForProjection(
      projectionState,
      options.scenarioState,
      affected,
    ),
    patchState: patchStateForScenario(options.scenarioState, affected),
    graphVerdictState,
    actionSettlementState,
    deltaGateState: deltaGateForScenario(options.scenarioState, affected),
    returnTokenState: returnTokenForScenario(options.scenarioState, affected),
    telemetryDisclosureFenceState:
      affected && options.scenarioState === "telemetry_fence_violation" ? "blocked" : "redacted",
    focusProtectionState:
      affected && options.scenarioState === "delta_gate_open" ? "active" : "none",
    selectedAnchorRef: `selected-anchor:phase9:${surfaceCode}:primary`,
    selectedAnchorPreserved: true,
    lastStableSnapshotRef: `last-stable-snapshot:phase9:${surfaceCode}:2026-04-28`,
    latestSafeProjectionRef: `safe-read-projection:phase9:${surfaceCode}:v1`,
    latestSettlementRef: `ui-transition-settlement:phase9:${surfaceCode}:${slug(
      actionSettlementState,
    )}`,
    changedBecauseSummary: changedBecauseSummary(options.scenarioState, affected, label),
    nextSafeAction: nextSafeAction(projectionState, options.scenarioState),
    blockedProducerRefs:
      projectionState === "quarantined"
        ? ["producer:phase9:incident-outcome-namespace"]
        : projectionState === "blocked"
          ? [`producer:phase9:${surfaceCode}:binding-or-fence`]
          : [],
    affectedOnly: affected,
  };
}

function createPatchFixture(
  targetSurface: Phase9LiveSurfaceCode,
  patchKind: Phase9ProjectionPatchKind,
  changedBecause: string,
): Phase9LiveProjectionPatchFixture {
  const fixtureId = `live-fixture-464-${slug(targetSurface)}-${slug(patchKind)}`;
  return {
    fixtureId,
    patchKind,
    targetSurface,
    safeProjectionRef: `safe-read-projection:phase9:${targetSurface}:fixture`,
    eventStreamMessageId: `event-stream-message:phase9:${targetSurface}:${patchKind}:001`,
    rawDomainEventRef: null,
    payloadClass: "safe_read_projection",
    projectionPatchHash: stableHash(`${fixtureId}:${changedBecause}`),
    changedBecauseSummary: changedBecause,
    visiblePatchDurationMs: 140,
    reducedMotionEquivalent: `${changedBecause} Patch highlight is replaced by immediate status text in reduced motion.`,
    telemetryDisclosureFenceState: "redacted",
  };
}

function createTestEventProducerFixtures(): readonly Phase9LiveProjectionPatchFixture[] {
  return [
    createPatchFixture(
      "operations_overview",
      "projection_patch",
      "Breach-risk summary changed through a safe operations projection batch.",
    ),
    createPatchFixture(
      "assurance_center",
      "graph_drift",
      "Graph completeness drift blocked assurance pack export controls.",
    ),
    createPatchFixture(
      "incident_desk",
      "producer_quarantine",
      "Incident outcome producer quarantine downgraded only incident-dependent slices.",
    ),
    createPatchFixture(
      "resilience_board",
      "action_settlement",
      "Restore action pending state was replaced by authoritative settlement.",
    ),
    createPatchFixture(
      "tenant_governance",
      "delta_gate",
      "Tenant watchlist projection buffered while focus protection is active.",
    ),
    createPatchFixture(
      "conformance_scorecard",
      "return_token",
      "Conformance return token detected tuple drift and restored read-only context.",
    ),
  ];
}

function createAssuranceGraphUpdate(
  surface: Phase9LiveSurfaceProjection,
): AssuranceGraphLiveUpdateContract {
  return {
    channelId: surface.channelContract.channelId,
    graphSnapshotRef: `assurance-graph-snapshot:phase9:${surface.surfaceCode}`,
    graphVerdictState: surface.graphVerdictState,
    graphHash: stableHash(`${surface.surfaceCode}:${surface.graphVerdictState}:graph`),
    requiredNodeRefs: [
      "control-status-snapshot:phase9:runtime-binding",
      "assurance-slice-trust:phase9:surface",
      "ui-transition-settlement:phase9:latest",
    ],
    staleNodeRefs: surface.graphVerdictState === "stale" ? ["assurance-pack-settlement:stale"] : [],
    blockedExportRefs: surface.graphVerdictState === "blocked" ? ["export-or-signoff:block"] : [],
  };
}

function createOperationsUpdate(
  surface: Phase9LiveSurfaceProjection,
): OperationsProjectionLiveUpdateContract {
  return {
    channelId: surface.channelContract.channelId,
    boardTupleHash: stableHash(`${surface.surfaceCode}:board-tuple`),
    selectedSliceRef: `ops-slice-envelope:phase9:${surface.surfaceCode}`,
    selectedEntityTupleHash: stableHash(`${surface.surfaceCode}:selected-entity`),
    deltaGateState: surface.deltaGateState,
    actionEligibilityState:
      surface.actionSettlementState === "applied"
        ? "live_commit"
        : surface.actionSettlementState === "stale_reacquire"
          ? "stale_reacquire"
          : surface.actionSettlementState === "read_only_recovery"
            ? "read_only_recovery"
            : surface.actionSettlementState === "blocked" ||
                surface.actionSettlementState === "failed"
              ? "blocked"
              : "observe_only",
    queuedDeltaBatchRefs:
      surface.deltaGateState === "queued"
        ? [`queued-delta-batch:phase9:${surface.surfaceCode}`]
        : [],
  };
}

function createIncidentUpdate(surface: Phase9LiveSurfaceProjection): IncidentLiveUpdateContract {
  return {
    channelId: surface.channelContract.channelId,
    incidentQueueProjectionRef: `incident-queue-projection:phase9:${surface.surfaceCode}`,
    reportabilityState:
      surface.projectionState === "blocked" || surface.projectionState === "quarantined"
        ? "blocked"
        : surface.projectionState === "stale"
          ? "pending_review"
          : "reportable",
    containmentSettlementRef: surface.latestSettlementRef,
    producerTrustState:
      surface.projectionState === "quarantined"
        ? "quarantined"
        : surface.projectionState === "stale"
          ? "degraded"
          : "trusted",
  };
}

function createResilienceUpdate(
  surface: Phase9LiveSurfaceProjection,
): ResiliencePostureLiveUpdateContract {
  return {
    channelId: surface.channelContract.channelId,
    resilienceTupleHash: stableHash(`${surface.surfaceCode}:resilience-tuple`),
    recoveryControlPosture:
      surface.projectionState === "current"
        ? "live_control"
        : surface.projectionState === "recovery_only"
          ? "governed_recovery"
          : surface.projectionState === "stale" || surface.projectionState === "reconnecting"
            ? "diagnostic_only"
            : "blocked",
    latestResilienceActionSettlementRef: surface.latestSettlementRef,
    evidencePackState:
      surface.graphVerdictState === "complete"
        ? "current"
        : surface.graphVerdictState === "stale"
          ? "stale"
          : "blocked",
  };
}

function createTenantUpdate(
  surface: Phase9LiveSurfaceProjection,
): TenantGovernanceLiveUpdateContract {
  return {
    channelId: surface.channelContract.channelId,
    configCompilationHash: stableHash(`${surface.surfaceCode}:config-compilation`),
    standardsWatchlistState:
      surface.projectionState === "current"
        ? "exact"
        : surface.projectionState === "stale" || surface.projectionState === "reconnecting"
          ? "stale"
          : "blocked",
    migrationPostureState:
      surface.projectionState === "current"
        ? "pass"
        : surface.projectionState === "blocked" || surface.projectionState === "quarantined"
          ? "blocked"
          : "watch",
    projectionBackfillState:
      surface.projectionState === "current"
        ? "pass"
        : surface.projectionState === "blocked"
          ? "blocked"
          : "watch",
  };
}

function createConformanceUpdate(
  surface: Phase9LiveSurfaceProjection,
): ConformanceScorecardLiveUpdateContract {
  return {
    channelId: surface.channelContract.channelId,
    scorecardHash: stableHash(`${surface.surfaceCode}:scorecard`),
    scorecardState:
      surface.projectionState === "current"
        ? "exact"
        : surface.projectionState === "stale" || surface.projectionState === "reconnecting"
          ? "stale"
          : "blocked",
    bauSignoffState:
      surface.projectionState === "current"
        ? "ready"
        : surface.projectionState === "blocked" || surface.projectionState === "quarantined"
          ? "blocked"
          : "pending",
    blockerRefs: surface.blockedProducerRefs,
  };
}

export function createLivePhase9ProjectionGatewayProjection(
  options: {
    readonly scenarioState?: Phase9LiveGatewayScenarioState | string | null;
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly selectedSurfaceCode?: Phase9LiveSurfaceCode;
  } = {},
): LivePhase9ProjectionGatewayProjection {
  const scenarioState = normalizePhase9LiveGatewayScenarioState(options.scenarioState);
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const selectedSurfaceCode = options.selectedSurfaceCode ?? "operations_overview";
  const surfaces = phase9LiveSurfaceDefinitions.map((definition) =>
    createSurfaceProjection(definition, {
      tenantRef,
      environmentRef,
      selectedSurfaceCode,
      scenarioState,
    }),
  );
  const selectedSurface =
    surfaces.find((surface) => surface.surfaceCode === selectedSurfaceCode) ?? surfaces[0]!;
  const currentCount = surfaces.filter((surface) => surface.projectionState === "current").length;
  const staleCount = surfaces.filter((surface) => surface.projectionState === "stale").length;
  const quarantinedCount = surfaces.filter(
    (surface) => surface.projectionState === "quarantined",
  ).length;
  const blockedCount = surfaces.filter((surface) => surface.projectionState === "blocked").length;
  const recoveryOnlyCount = surfaces.filter(
    (surface) => surface.projectionState === "recovery_only",
  ).length;
  const testEventProducerFixtures = createTestEventProducerFixtures();
  return {
    schemaVersion: PHASE9_LIVE_PROJECTION_SCHEMA_VERSION,
    visualMode: PHASE9_LIVE_PROJECTION_VISUAL_MODE,
    scenarioState,
    tenantRef,
    environmentRef,
    selectedSurfaceCode,
    selectedSurface,
    surfaces,
    channelContracts: surfaces.map((surface) => surface.channelContract),
    assuranceGraphUpdate: createAssuranceGraphUpdate(selectedSurface),
    operationsProjectionUpdate: createOperationsUpdate(selectedSurface),
    incidentUpdate: createIncidentUpdate(selectedSurface),
    resiliencePostureUpdate: createResilienceUpdate(selectedSurface),
    tenantGovernanceUpdate: createTenantUpdate(selectedSurface),
    conformanceScorecardUpdate: createConformanceUpdate(selectedSurface),
    testEventProducerFixtures,
    liveGatewayHash: stableHash(
      JSON.stringify(
        surfaces.map((surface) => [
          surface.surfaceCode,
          surface.projectionState,
          surface.runtimeBindingState,
          surface.graphVerdictState,
          surface.actionSettlementState,
          surface.deltaGateState,
          surface.returnTokenState,
        ]),
      ),
    ),
    currentCount,
    staleCount,
    quarantinedCount,
    blockedCount,
    recoveryOnlyCount,
    rawEventBrowserJoinAllowed: false,
    rawDomainEventPayloadAllowed: false,
    telemetryFenceRedacted: surfaces.every(
      (surface) => surface.telemetryDisclosureFenceState === "redacted",
    ),
    subscriptionCleanupProven: surfaces.every((surface) =>
      surface.channelContract.cleanupRef.startsWith("subscription-cleanup:phase9:"),
    ),
    sourceAlgorithmRefs: SOURCE_ALGORITHM_REFS,
    automationAnchors: AUTOMATION_ANCHORS,
    interfaceGapArtifactRef: PHASE9_LIVE_PROJECTION_GAP_ARTIFACT_REF,
  };
}

export function applyPhase9LiveProjectionFixture(
  projection: LivePhase9ProjectionGatewayProjection,
  fixtureId: string,
): LivePhase9ProjectionGatewayProjection {
  const fixture =
    projection.testEventProducerFixtures.find((candidate) => candidate.fixtureId === fixtureId) ??
    projection.testEventProducerFixtures[0]!;
  const scenarioState =
    fixture.patchKind === "graph_drift"
      ? "graph_drift"
      : fixture.patchKind === "producer_quarantine"
        ? "quarantined_incident_producer"
        : fixture.patchKind === "action_settlement"
          ? "action_settlement_failed"
          : fixture.patchKind === "delta_gate"
            ? "delta_gate_open"
            : fixture.patchKind === "return_token"
              ? "return_token_drift"
              : "normal";
  return createLivePhase9ProjectionGatewayProjection({
    tenantRef: projection.tenantRef,
    environmentRef: projection.environmentRef,
    selectedSurfaceCode: fixture.targetSurface,
    scenarioState,
  });
}

export class LivePhase9ProjectionGateway {
  readonly projection: LivePhase9ProjectionGatewayProjection;

  constructor(options: Parameters<typeof createLivePhase9ProjectionGatewayProjection>[0] = {}) {
    this.projection = createLivePhase9ProjectionGatewayProjection(options);
  }

  subscribe(surfaceCode: Phase9LiveSurfaceCode): Phase9LiveProjectionChannelContract {
    const contract = this.projection.channelContracts.find(
      (candidate) => candidate.surfaceCode === surfaceCode,
    );
    if (!contract) {
      throw new Error(`Missing Phase 9 live channel contract for ${surfaceCode}`);
    }
    if (
      contract.projectionContractVersion !== contract.expectedProjectionContractVersion ||
      contract.surfaceBindingRef === "missing"
    ) {
      throw new Error(`Phase 9 live channel ${surfaceCode} failed closed before subscription`);
    }
    return contract;
  }

  applyFixture(fixtureId: string): LivePhase9ProjectionGatewayProjection {
    return applyPhase9LiveProjectionFixture(this.projection, fixtureId);
  }
}

export function createPhase9LiveProjectionGatewayFixture() {
  const scenarios = [
    "normal",
    "projection_version_mismatch",
    "stale_projection",
    "quarantined_incident_producer",
    "graph_drift",
    "action_settlement_failed",
    "delta_gate_open",
    "return_token_drift",
    "telemetry_fence_violation",
    "missing_runtime_binding",
    "reconnecting",
    "recovery_only",
  ] as const satisfies readonly Phase9LiveGatewayScenarioState[];
  return {
    schemaVersion: PHASE9_LIVE_PROJECTION_SCHEMA_VERSION,
    visualMode: PHASE9_LIVE_PROJECTION_VISUAL_MODE,
    requiredPhase9LiveSurfaceCodes,
    sourceAlgorithmRefs: SOURCE_ALGORITHM_REFS,
    automationAnchors: AUTOMATION_ANCHORS,
    scenarioProjections: Object.fromEntries(
      scenarios.map((scenarioState) => [
        scenarioState,
        createLivePhase9ProjectionGatewayProjection({ scenarioState }),
      ]),
    ) as Record<Phase9LiveGatewayScenarioState, LivePhase9ProjectionGatewayProjection>,
  };
}
