import {
  OPS_OVERVIEW_BOARD_SCOPE_REF,
  OPS_OVERVIEW_SCOPE_POLICY_REF,
  OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
  OPS_OVERVIEW_TIME_HORIZON,
  normalizeOpsOverviewScenarioState,
  type OpsOverviewScenarioState,
} from "./operations-overview-phase9.model";

export const OPS_RESILIENCE_TASK_ID = "par_453";
export const OPS_RESILIENCE_SCHEMA_VERSION = "453.phase9.ops-resilience-route.v1";

export type OpsResilienceScenarioState = OpsOverviewScenarioState;
export type OpsResilienceBindingState = "live" | "diagnostic_only" | "recovery_only" | "blocked";
export type OpsRecoveryControlState =
  | "live_control"
  | "diagnostic_only"
  | "governed_recovery"
  | "blocked";
export type OpsReadinessState = "ready" | "constrained" | "blocked";
export type OpsResilienceTimelineState = "exact" | "stale" | "blocked";
export type OpsBackupManifestState = "current" | "stale" | "missing";
export type OpsRunbookBindingState = "published" | "stale" | "rehearsal_required" | "withdrawn";
export type OpsEvidencePackState = "current" | "stale" | "blocked" | "superseded" | "missing";
export type OpsRecoveryEvidenceArtifactState =
  | "summary_only"
  | "governed_preview"
  | "external_handoff_ready"
  | "recovery_only";
export type OpsResilienceActionSettlementResult =
  | "accepted_pending_evidence"
  | "applied"
  | "blocked_publication"
  | "blocked_trust"
  | "blocked_readiness"
  | "blocked_guardrail"
  | "frozen"
  | "stale_scope"
  | "failed"
  | "superseded";
export type OpsResilienceActionType =
  | "restore_prepare"
  | "restore_start"
  | "restore_validate"
  | "failover_activate"
  | "failover_validate"
  | "failover_stand_down"
  | "chaos_schedule"
  | "chaos_start"
  | "chaos_abort"
  | "recovery_pack_attest";

export interface OpsEssentialFunctionReadiness {
  readonly functionCode: string;
  readonly label: string;
  readonly serviceRef: string;
  readonly restoreOrder: number;
  readonly recoveryTierRef: string;
  readonly rto: string;
  readonly rpo: string;
  readonly ownerRef: string;
  readonly functionState: "mapped" | "rehearsal_due" | "recovery_only" | "retired";
  readonly selected: boolean;
  readonly blockers: readonly string[];
}

export interface OpsDependencyRestoreBand {
  readonly dependencyRestoreBandId: string;
  readonly restoreBand: number;
  readonly functionCode: string;
  readonly label: string;
  readonly dependencyClass: string;
  readonly status: "ready" | "diagnostic_only" | "recovery_only" | "blocked" | "historical_only";
  readonly rto: string;
  readonly rpo: string;
  readonly blockerRefs: readonly string[];
  readonly currentAuthority: "current_tuple" | "historical_only";
}

export interface OpsOperationalReadinessSnapshotProjection {
  readonly operationalReadinessSnapshotRef: string;
  readonly readinessState: OpsReadinessState;
  readonly freshnessState: "fresh" | "stale" | "incomplete" | "blocked";
  readonly rehearsalFreshnessState: "fresh" | "stale" | "incomplete" | "blocked";
  readonly ownerCoverageState: "complete" | "partial";
  readonly verdictCoverageState: "exact" | "stale" | "blocked";
  readonly resilienceTupleHash: string;
  readonly capturedAt: string;
  readonly summary: string;
}

export interface OpsResilienceSurfaceRuntimeBindingProjection {
  readonly resilienceSurfaceRuntimeBindingRef: string;
  readonly routeFamilyRef: "/ops/resilience";
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly operationalReadinessSnapshotRef: string;
  readonly recoveryControlPostureRef: string;
  readonly latestRecoveryEvidencePackRef: string;
  readonly latestResilienceActionSettlementRefs: readonly string[];
  readonly bindingTupleHash: string;
  readonly bindingState: OpsResilienceBindingState;
}

export interface OpsRecoveryControlPostureProjection {
  readonly recoveryControlPostureRef: string;
  readonly publicationState: "current" | "stale" | "withdrawn" | "quarantined";
  readonly trustState: "trusted" | "degraded" | "blocked";
  readonly freezeState: "clear" | "active" | "blocked";
  readonly restoreValidationFreshnessState: "fresh" | "stale" | "expired" | "missing";
  readonly failoverValidationFreshnessState: "fresh" | "stale" | "expired" | "missing";
  readonly chaosValidationFreshnessState: "fresh" | "stale" | "expired" | "missing";
  readonly dependencyCoverageState: "complete" | "partial" | "blocked";
  readonly journeyRecoveryCoverageState: "exact" | "partial" | "missing";
  readonly backupManifestState: OpsBackupManifestState;
  readonly evidencePackAdmissibilityState: "exact" | "stale" | "blocked";
  readonly postureState: OpsRecoveryControlState;
  readonly allowedActionRefs: readonly OpsResilienceActionType[];
  readonly blockerRefs: readonly string[];
  readonly controlTupleHash: string;
  readonly lastComputedAt: string;
}

export interface OpsBackupFreshnessProjection {
  readonly backupSetManifestRef: string;
  readonly datasetScopeRef: string;
  readonly snapshotTime: string;
  readonly immutabilityState: "immutable" | "mutable" | "disputed";
  readonly restoreTestState: "current" | "stale" | "blocked" | "missing";
  readonly manifestState: OpsBackupManifestState;
  readonly checksumBundleRef: string;
  readonly restoreCompatibilityDigestRef: string;
  readonly summary: string;
}

export interface OpsRunbookBindingProjection {
  readonly runbookBindingRef: string;
  readonly runbookRef: string;
  readonly functionCode: string;
  readonly bindingState: OpsRunbookBindingState;
  readonly lastRehearsedAt: string;
  readonly lastRehearsalSettlementRef: string;
  readonly bindingHash: string;
  readonly summary: string;
}

export interface OpsRecoveryRunEvent {
  readonly runRef: string;
  readonly runType: "restore" | "failover" | "chaos";
  readonly resultState: string;
  readonly evidenceArtifactRef: string;
  readonly resilienceActionSettlementRef: string;
  readonly completedAt: string;
  readonly currentAuthority: "current_tuple" | "historical_only";
  readonly summary: string;
}

export interface OpsRecoveryRunTimelineProjection {
  readonly opsRecoveryRunTimelineId: string;
  readonly activeRunRef: string;
  readonly supersededRunRefs: readonly string[];
  readonly recoveryEvidencePackRefs: readonly string[];
  readonly resilienceActionSettlementRefs: readonly string[];
  readonly evidenceArtifactRefs: readonly string[];
  readonly timelineHash: string;
  readonly timelineState: OpsResilienceTimelineState;
  readonly generatedAt: string;
}

export interface OpsResilienceActionRailItem {
  readonly actionType: OpsResilienceActionType;
  readonly label: string;
  readonly allowed: boolean;
  readonly controlState: OpsRecoveryControlState;
  readonly settlementRef: string;
  readonly settlementResult: OpsResilienceActionSettlementResult;
  readonly disabledReason: string;
}

export interface OpsResilienceSettlementProjection {
  readonly resilienceActionSettlementRef: string;
  readonly actionType: OpsResilienceActionType;
  readonly result: OpsResilienceActionSettlementResult;
  readonly authoritativeRunRefs: readonly string[];
  readonly recordedPostureRef: string;
  readonly scopeTupleHash: string;
  readonly controlTupleHash: string;
  readonly settledAt: string;
  readonly announcement: string;
}

export interface OpsRecoveryEvidenceArtifactProjection {
  readonly recoveryEvidenceArtifactRef: string;
  readonly artifactType:
    | "restore_report"
    | "failover_report"
    | "chaos_report"
    | "recovery_pack_export"
    | "dependency_restore_explainer"
    | "journey_recovery_proof"
    | "backup_manifest_report"
    | "runbook_bundle"
    | "readiness_snapshot_summary";
  readonly artifactState: OpsRecoveryEvidenceArtifactState;
  readonly artifactPresentationContractRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly artifactFallbackDispositionRef: string;
  readonly outboundNavigationGrantRef: string;
  readonly graphHash: string;
  readonly resilienceTupleHash: string;
  readonly summaryFirstPreview: string;
}

export interface OpsRecoveryProofDebtProjection {
  readonly recoveryProofDebtRef: string;
  readonly functionCode: string;
  readonly missingProofRefs: readonly string[];
  readonly staleRunbookRefs: readonly string[];
  readonly staleBackupManifestRefs: readonly string[];
  readonly nextRehearsalDueAt: string;
  readonly blockerRefs: readonly string[];
}

export interface OpsResilienceProjection {
  readonly taskId: typeof OPS_RESILIENCE_TASK_ID;
  readonly schemaVersion: typeof OPS_RESILIENCE_SCHEMA_VERSION;
  readonly route: "/ops/resilience";
  readonly scenarioState: OpsResilienceScenarioState;
  readonly boardScopeRef: typeof OPS_OVERVIEW_BOARD_SCOPE_REF;
  readonly timeHorizon: typeof OPS_OVERVIEW_TIME_HORIZON;
  readonly scopePolicyRef: typeof OPS_OVERVIEW_SCOPE_POLICY_REF;
  readonly shellContinuityKey: typeof OPS_OVERVIEW_SHELL_CONTINUITY_KEY;
  readonly selectedHealthCellRef: string;
  readonly selectedFunctionCode: string;
  readonly selectedFunctionLabel: string;
  readonly resilienceTupleHash: string;
  readonly boardStateDigestRef: string;
  readonly boardTupleHash: string;
  readonly surfaceSummary: string;
  readonly essentialFunctions: readonly OpsEssentialFunctionReadiness[];
  readonly dependencyRestoreBands: readonly OpsDependencyRestoreBand[];
  readonly readinessSnapshot: OpsOperationalReadinessSnapshotProjection;
  readonly runtimeBinding: OpsResilienceSurfaceRuntimeBindingProjection;
  readonly recoveryControlPosture: OpsRecoveryControlPostureProjection;
  readonly backupFreshness: OpsBackupFreshnessProjection;
  readonly runbookBindings: readonly OpsRunbookBindingProjection[];
  readonly runTimeline: OpsRecoveryRunTimelineProjection;
  readonly recoveryRunEvents: readonly OpsRecoveryRunEvent[];
  readonly actionRail: readonly OpsResilienceActionRailItem[];
  readonly latestSettlement: OpsResilienceSettlementProjection;
  readonly artifactStage: OpsRecoveryEvidenceArtifactProjection;
  readonly proofDebt: readonly OpsRecoveryProofDebtProjection[];
  readonly nextExercise: {
    readonly exerciseRef: string;
    readonly exerciseType: "restore" | "failover" | "chaos";
    readonly scheduledAt: string;
    readonly scopeRef: string;
  };
  readonly historicalRunWarning: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Record<"443" | "444" | "445", string>;
  readonly automationAnchors: readonly string[];
}

export const opsResilienceScenarioStates = [
  "normal",
  "stable_service",
  "empty",
  "stale",
  "degraded",
  "quarantined",
  "blocked",
  "permission_denied",
  "freeze",
  "settlement_pending",
] as const satisfies readonly OpsResilienceScenarioState[];

export const opsResilienceAutomationAnchors = [
  "resilience-board",
  "essential-function-map",
  "dependency-restore-bands",
  "backup-freshness",
  "runbook-binding",
  "recovery-control-posture",
  "recovery-action-rail",
  "resilience-settlement",
  "recovery-artifact-stage",
] as const;

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9F",
  "blueprint/operations-console-frontend-blueprint.md#4.8A-Resilience-readiness-and-restore-control",
  "blueprint/platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
  "blueprint/platform-runtime-and-release-blueprint.md#RunbookBindingRecord",
] as const;

const upstreamSchemaVersions = {
  "443": "443.phase9.disposition-execution-engine.v1",
  "444": "444.phase9.operational-readiness-posture.v1",
  "445": "445.phase9.resilience-action-settlement.v1",
} as const;

const functionCatalog = [
  {
    functionCode: "digital_intake",
    label: "Digital intake",
    serviceRef: "svc_confirmation",
    tier: "Tier 1",
    rto: "45m",
    rpo: "5m",
    owner: "owner:ops:intake",
    restoreOrder: 1,
    dependencyClass: "entry",
  },
  {
    functionCode: "safety_gate",
    label: "Safety gate",
    serviceRef: "svc_continuity",
    tier: "Tier 1",
    rto: "30m",
    rpo: "0m",
    owner: "owner:clinical:safety",
    restoreOrder: 1,
    dependencyClass: "clinical safety",
  },
  {
    functionCode: "triage_queue",
    label: "Triage queue",
    serviceRef: "svc_recovery",
    tier: "Tier 1",
    rto: "60m",
    rpo: "5m",
    owner: "owner:ops:triage",
    restoreOrder: 2,
    dependencyClass: "staff work",
  },
  {
    functionCode: "patient_status_secure_links",
    label: "Patient status and secure links",
    serviceRef: "svc_notification",
    tier: "Tier 2",
    rto: "2h",
    rpo: "15m",
    owner: "owner:patient:comms",
    restoreOrder: 2,
    dependencyClass: "patient communication",
  },
  {
    functionCode: "local_booking",
    label: "Local booking",
    serviceRef: "svc_confirmation",
    tier: "Tier 2",
    rto: "4h",
    rpo: "30m",
    owner: "owner:booking",
    restoreOrder: 3,
    dependencyClass: "booking",
  },
  {
    functionCode: "hub_coordination",
    label: "Hub coordination",
    serviceRef: "svc_recovery",
    tier: "Tier 2",
    rto: "4h",
    rpo: "30m",
    owner: "owner:hub",
    restoreOrder: 3,
    dependencyClass: "cross-practice",
  },
  {
    functionCode: "pharmacy_referral_loop",
    label: "Pharmacy referral loop",
    serviceRef: "svc_pharmacy_loop",
    tier: "Tier 2",
    rto: "4h",
    rpo: "30m",
    owner: "owner:pharmacy",
    restoreOrder: 3,
    dependencyClass: "pharmacy",
  },
  {
    functionCode: "outbound_communications",
    label: "Outbound communications",
    serviceRef: "svc_notification",
    tier: "Tier 3",
    rto: "6h",
    rpo: "45m",
    owner: "owner:notifications",
    restoreOrder: 4,
    dependencyClass: "notification",
  },
  {
    functionCode: "audit_search",
    label: "Audit search",
    serviceRef: "svc_continuity",
    tier: "Tier 3",
    rto: "8h",
    rpo: "0m",
    owner: "owner:assurance",
    restoreOrder: 4,
    dependencyClass: "assurance",
  },
  {
    functionCode: "assistive_layer_downgrade",
    label: "Assistive layer downgrade path",
    serviceRef: "svc_equity_watch",
    tier: "Tier 3",
    rto: "8h",
    rpo: "60m",
    owner: "owner:assistive",
    restoreOrder: 5,
    dependencyClass: "assistive fallback",
  },
] as const;

const healthCellToFunction: Readonly<Record<string, string>> = {
  svc_confirmation: "digital_intake",
  svc_notification: "outbound_communications",
  svc_pharmacy_loop: "pharmacy_referral_loop",
  svc_continuity: "audit_search",
  svc_recovery: "triage_queue",
  svc_equity_watch: "assistive_layer_downgrade",
};

function selectedFunctionForHealthCell(selectedHealthCellRef: string): string {
  return healthCellToFunction[selectedHealthCellRef] ?? "triage_queue";
}

function sanitizeRef(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function normalizeOpsResilienceScenarioState(
  value: string | null | undefined,
): OpsResilienceScenarioState {
  return normalizeOpsOverviewScenarioState(value);
}

function bindingStateForScenario(
  scenarioState: OpsResilienceScenarioState,
): OpsResilienceBindingState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "blocked";
    case "freeze":
    case "settlement_pending":
      return "recovery_only";
    case "stale":
    case "degraded":
      return "diagnostic_only";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "live";
  }
}

function controlStateForScenario(
  scenarioState: OpsResilienceScenarioState,
): OpsRecoveryControlState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "blocked";
    case "freeze":
    case "settlement_pending":
      return "governed_recovery";
    case "stale":
    case "degraded":
      return "diagnostic_only";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "live_control";
  }
}

function readinessStateForScenario(scenarioState: OpsResilienceScenarioState): OpsReadinessState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "blocked";
    case "stale":
    case "degraded":
    case "freeze":
    case "settlement_pending":
      return "constrained";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "ready";
  }
}

function timelineStateForScenario(
  scenarioState: OpsResilienceScenarioState,
): OpsResilienceTimelineState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "blocked";
    case "stale":
    case "degraded":
    case "freeze":
    case "settlement_pending":
      return "stale";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "exact";
  }
}

function backupManifestStateForScenario(
  scenarioState: OpsResilienceScenarioState,
): OpsBackupManifestState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "missing";
    case "stale":
      return "stale";
    case "normal":
    case "stable_service":
    case "empty":
    case "degraded":
    case "freeze":
    case "settlement_pending":
    default:
      return "current";
  }
}

function runbookStateForScenario(
  scenarioState: OpsResilienceScenarioState,
): OpsRunbookBindingState {
  switch (scenarioState) {
    case "permission_denied":
    case "quarantined":
      return "withdrawn";
    case "blocked":
      return "rehearsal_required";
    case "stale":
      return "stale";
    case "normal":
    case "stable_service":
    case "empty":
    case "degraded":
    case "freeze":
    case "settlement_pending":
    default:
      return "published";
  }
}

function evidencePackStateForScenario(
  scenarioState: OpsResilienceScenarioState,
): OpsEvidencePackState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "blocked";
    case "stale":
    case "freeze":
      return "stale";
    case "settlement_pending":
      return "current";
    case "normal":
    case "stable_service":
    case "empty":
    case "degraded":
    default:
      return "current";
  }
}

function artifactStateForScenario(
  scenarioState: OpsResilienceScenarioState,
): OpsRecoveryEvidenceArtifactState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "summary_only";
    case "freeze":
    case "settlement_pending":
      return "recovery_only";
    case "stale":
    case "degraded":
      return "governed_preview";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "external_handoff_ready";
  }
}

function settlementResultForScenario(
  scenarioState: OpsResilienceScenarioState,
): OpsResilienceActionSettlementResult {
  switch (scenarioState) {
    case "settlement_pending":
      return "accepted_pending_evidence";
    case "stale":
      return "stale_scope";
    case "degraded":
      return "blocked_trust";
    case "freeze":
      return "frozen";
    case "blocked":
      return "blocked_readiness";
    case "permission_denied":
      return "blocked_publication";
    case "quarantined":
      return "blocked_guardrail";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "applied";
  }
}

function blockerRefsForScenario(scenarioState: OpsResilienceScenarioState): readonly string[] {
  switch (scenarioState) {
    case "stale":
      return ["publication:stale", "tuple:drift", "runbook:stale"];
    case "degraded":
      return ["trust:degraded", "dependency:partial"];
    case "freeze":
      return ["freeze:active", "release-recovery-disposition:governed"];
    case "settlement_pending":
      return ["settlement:accepted_pending_evidence"];
    case "blocked":
      return ["backup:missing", "journey-proof:missing", "readiness:blocked"];
    case "permission_denied":
      return ["publication:blocked", "permission:denied"];
    case "quarantined":
      return ["trust:blocked", "slice:resilience-quarantined"];
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return [];
  }
}

function allowedActionsForControlState(
  controlState: OpsRecoveryControlState,
): readonly OpsResilienceActionType[] {
  switch (controlState) {
    case "live_control":
      return [
        "restore_prepare",
        "restore_start",
        "restore_validate",
        "failover_activate",
        "failover_validate",
        "failover_stand_down",
        "chaos_schedule",
        "chaos_start",
        "chaos_abort",
        "recovery_pack_attest",
      ];
    case "governed_recovery":
      return ["restore_prepare", "restore_validate", "failover_stand_down", "recovery_pack_attest"];
    case "diagnostic_only":
    case "blocked":
    default:
      return [];
  }
}

const actionLabels: Readonly<Record<OpsResilienceActionType, string>> = {
  restore_prepare: "Prepare restore",
  restore_start: "Start restore",
  restore_validate: "Validate restore",
  failover_activate: "Activate failover",
  failover_validate: "Validate failover",
  failover_stand_down: "Stand down failover",
  chaos_schedule: "Schedule chaos",
  chaos_start: "Start chaos",
  chaos_abort: "Abort chaos",
  recovery_pack_attest: "Attest recovery pack",
};

export function createOpsResilienceProjection(
  scenarioStateInput: OpsResilienceScenarioState | string | null | undefined = "normal",
  selectedHealthCellRef: string = "svc_recovery",
  selectedFunctionInput?: string | null,
): OpsResilienceProjection {
  const scenarioState = normalizeOpsResilienceScenarioState(scenarioStateInput);
  const selectedFunctionCode =
    selectedFunctionInput &&
    functionCatalog.some((item) => item.functionCode === selectedFunctionInput)
      ? selectedFunctionInput
      : selectedFunctionForHealthCell(selectedHealthCellRef);
  const selectedFunction =
    functionCatalog.find((item) => item.functionCode === selectedFunctionCode) ??
    functionCatalog[0]!;
  const key = sanitizeRef(`${scenarioState}_${selectedFunctionCode}`);
  const bindingState = bindingStateForScenario(scenarioState);
  const controlState = controlStateForScenario(scenarioState);
  const readinessState = readinessStateForScenario(scenarioState);
  const timelineState = timelineStateForScenario(scenarioState);
  const backupManifestState = backupManifestStateForScenario(scenarioState);
  const runbookState = runbookStateForScenario(scenarioState);
  const evidencePackState = evidencePackStateForScenario(scenarioState);
  const artifactState = artifactStateForScenario(scenarioState);
  const settlementResult = settlementResultForScenario(scenarioState);
  const blockerRefs = blockerRefsForScenario(scenarioState);
  const resilienceTupleHash = `resilience-tuple-453-${scenarioState}-${selectedFunctionCode}`;
  const controlTupleHash = `control-tuple-453-${scenarioState}-${selectedFunctionCode}`;
  const readinessSnapshotRef = `ORS_453_${key}`;
  const runtimeBindingRef = `RSRB_453_${key}`;
  const recoveryControlPostureRef = `RCP_453_${key}`;
  const evidencePackRef = `REP_453_${key}`;
  const latestSettlementRef = `RAS_453_${key}`;
  const boardStateDigestRef = `ORSD_453_${key}`;
  const boardTupleHash = `ops-resilience-board-tuple-453-${scenarioState}-${selectedFunctionCode}`;
  const allowedActionRefs = allowedActionsForControlState(controlState);
  const currentAuthority =
    timelineState === "exact" && controlState === "live_control"
      ? "current_tuple"
      : "historical_only";
  const essentialFunctions = functionCatalog.map((item) => ({
    functionCode: item.functionCode,
    label: item.label,
    serviceRef: item.serviceRef,
    restoreOrder: item.restoreOrder,
    recoveryTierRef: `rt_444_${item.functionCode}`,
    rto: item.rto,
    rpo: item.rpo,
    ownerRef: item.owner,
    functionState:
      scenarioState === "blocked" && item.functionCode === selectedFunctionCode
        ? "rehearsal_due"
        : controlState === "governed_recovery" && item.functionCode === selectedFunctionCode
          ? "recovery_only"
          : "mapped",
    selected: item.functionCode === selectedFunctionCode,
    blockers: item.functionCode === selectedFunctionCode ? blockerRefs : [],
  })) satisfies readonly OpsEssentialFunctionReadiness[];
  const dependencyRestoreBands = functionCatalog.map((item) => ({
    dependencyRestoreBandId: `DRB_453_${sanitizeRef(item.functionCode)}`,
    restoreBand: item.restoreOrder,
    functionCode: item.functionCode,
    label: item.label,
    dependencyClass: item.dependencyClass,
    status:
      item.functionCode !== selectedFunctionCode
        ? "ready"
        : controlState === "live_control"
          ? "ready"
          : controlState === "diagnostic_only"
            ? "diagnostic_only"
            : controlState === "governed_recovery"
              ? "recovery_only"
              : "blocked",
    rto: item.rto,
    rpo: item.rpo,
    blockerRefs: item.functionCode === selectedFunctionCode ? blockerRefs : [],
    currentAuthority:
      item.functionCode === selectedFunctionCode ? currentAuthority : "current_tuple",
  })) satisfies readonly OpsDependencyRestoreBand[];
  const selectedRunbookRef = `rbr_444_${selectedFunctionCode}`;
  const runbookBindings = [
    {
      runbookBindingRef: selectedRunbookRef,
      runbookRef: `runbook:resilience:${selectedFunctionCode}`,
      functionCode: selectedFunctionCode,
      bindingState: runbookState,
      lastRehearsedAt:
        runbookState === "published" ? "2026-04-27T13:30:00Z" : "2026-03-20T13:30:00Z",
      lastRehearsalSettlementRef: runbookState === "withdrawn" ? "none" : latestSettlementRef,
      bindingHash: `runbook-binding-hash-453-${scenarioState}-${selectedFunctionCode}`,
      summary:
        runbookState === "published"
          ? "Runbook binding is current for the selected function and current tuple."
          : `Runbook binding is ${runbookState}; controls cannot inherit live authority from this row.`,
    },
  ] satisfies readonly OpsRunbookBindingProjection[];
  const recoveryRunEvents = [
    {
      runRef: `RR_453_RESTORE_${key}`,
      runType: "restore",
      resultState:
        settlementResult === "accepted_pending_evidence"
          ? "journey_validation_pending"
          : timelineState === "blocked"
            ? "failed"
            : "succeeded",
      evidenceArtifactRef: `REA_453_RESTORE_${key}`,
      resilienceActionSettlementRef: latestSettlementRef,
      completedAt: "2026-04-27T14:35:00Z",
      currentAuthority,
      summary:
        currentAuthority === "current_tuple"
          ? "Clean-environment restore is current and settlement-applied."
          : "Restore run remains visible as history but cannot satisfy current posture after tuple drift.",
    },
    {
      runRef: `FR_453_FAILOVER_${key}`,
      runType: "failover",
      resultState: timelineState === "blocked" ? "failed" : "stood_down",
      evidenceArtifactRef: `REA_453_FAILOVER_${key}`,
      resilienceActionSettlementRef: latestSettlementRef,
      completedAt: "2026-04-27T15:05:00Z",
      currentAuthority,
      summary:
        currentAuthority === "current_tuple"
          ? "Failover stood down through authoritative settlement."
          : "Failover proof is retained as diagnostic history only.",
    },
    {
      runRef: `CR_453_CHAOS_${key}`,
      runType: "chaos",
      resultState: timelineState === "blocked" ? "halted" : "completed",
      evidenceArtifactRef: `REA_453_CHAOS_${key}`,
      resilienceActionSettlementRef: latestSettlementRef,
      completedAt: "2026-04-27T16:15:00Z",
      currentAuthority,
      summary:
        currentAuthority === "current_tuple"
          ? "Chaos guardrails completed within approved blast radius."
          : "Chaos result is visible but does not re-arm controls.",
    },
  ] satisfies readonly OpsRecoveryRunEvent[];
  const actionRail = (Object.keys(actionLabels) as OpsResilienceActionType[]).map((actionType) => {
    const allowed = allowedActionRefs.includes(actionType);
    return {
      actionType,
      label: actionLabels[actionType],
      allowed,
      controlState,
      settlementRef: allowed ? latestSettlementRef : `blocked-${actionType}-${scenarioState}`,
      settlementResult: allowed ? settlementResult : settlementResult,
      disabledReason: allowed
        ? "Await the authoritative resilience action settlement before changing posture."
        : (blockerRefs[0] ?? "RecoveryControlPosture does not allow this action."),
    };
  }) satisfies readonly OpsResilienceActionRailItem[];

  return {
    taskId: OPS_RESILIENCE_TASK_ID,
    schemaVersion: OPS_RESILIENCE_SCHEMA_VERSION,
    route: "/ops/resilience",
    scenarioState,
    boardScopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    scopePolicyRef: OPS_OVERVIEW_SCOPE_POLICY_REF,
    shellContinuityKey: OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
    selectedHealthCellRef,
    selectedFunctionCode,
    selectedFunctionLabel: selectedFunction.label,
    resilienceTupleHash,
    boardStateDigestRef,
    boardTupleHash,
    surfaceSummary:
      controlState === "live_control"
        ? `${selectedFunction.label} can use live recovery controls because readiness, runbook, backup, journey proof, and evidence pack agree on ${resilienceTupleHash}.`
        : `${selectedFunction.label} remains visible, but controls are ${controlState} because ${blockerRefs.join(", ")}.`,
    essentialFunctions,
    dependencyRestoreBands,
    readinessSnapshot: {
      operationalReadinessSnapshotRef: readinessSnapshotRef,
      readinessState,
      freshnessState:
        timelineState === "exact" ? "fresh" : timelineState === "stale" ? "stale" : "blocked",
      rehearsalFreshnessState: runbookState === "published" ? "fresh" : "stale",
      ownerCoverageState: scenarioState === "empty" ? "partial" : "complete",
      verdictCoverageState:
        timelineState === "exact" ? "exact" : timelineState === "stale" ? "stale" : "blocked",
      resilienceTupleHash,
      capturedAt: "2026-04-28T09:15:00Z",
      summary:
        readinessState === "ready"
          ? "OperationalReadinessSnapshot is exact for the active release tuple."
          : `OperationalReadinessSnapshot is ${readinessState}; weak tuple components are named in blockers.`,
    },
    runtimeBinding: {
      resilienceSurfaceRuntimeBindingRef: runtimeBindingRef,
      routeFamilyRef: "/ops/resilience",
      runtimePublicationBundleRef: "rpb_444_current",
      releasePublicationParityRef: scenarioState === "stale" ? "rpp_444_stale" : "rpp_444_exact",
      releaseWatchTupleRef: "rwt_444_current",
      watchTupleHash: `watch-tuple-hash-453-${scenarioState}`,
      operationalReadinessSnapshotRef: readinessSnapshotRef,
      recoveryControlPostureRef,
      latestRecoveryEvidencePackRef: evidencePackRef,
      latestResilienceActionSettlementRefs: [latestSettlementRef],
      bindingTupleHash: resilienceTupleHash,
      bindingState,
    },
    recoveryControlPosture: {
      recoveryControlPostureRef,
      publicationState:
        scenarioState === "stale"
          ? "stale"
          : scenarioState === "permission_denied"
            ? "withdrawn"
            : scenarioState === "quarantined"
              ? "quarantined"
              : "current",
      trustState:
        scenarioState === "degraded"
          ? "degraded"
          : scenarioState === "blocked" ||
              scenarioState === "permission_denied" ||
              scenarioState === "quarantined"
            ? "blocked"
            : "trusted",
      freezeState:
        scenarioState === "freeze"
          ? "active"
          : scenarioState === "quarantined"
            ? "blocked"
            : "clear",
      restoreValidationFreshnessState: timelineState === "exact" ? "fresh" : "stale",
      failoverValidationFreshnessState:
        scenarioState === "blocked" || scenarioState === "permission_denied" ? "missing" : "fresh",
      chaosValidationFreshnessState:
        scenarioState === "degraded" || scenarioState === "settlement_pending" ? "stale" : "fresh",
      dependencyCoverageState:
        scenarioState === "degraded" || scenarioState === "settlement_pending"
          ? "partial"
          : controlState === "blocked"
            ? "blocked"
            : "complete",
      journeyRecoveryCoverageState:
        scenarioState === "blocked" || scenarioState === "permission_denied"
          ? "missing"
          : scenarioState === "degraded"
            ? "partial"
            : "exact",
      backupManifestState,
      evidencePackAdmissibilityState:
        evidencePackState === "current"
          ? "exact"
          : evidencePackState === "stale"
            ? "stale"
            : "blocked",
      postureState: controlState,
      allowedActionRefs,
      blockerRefs,
      controlTupleHash,
      lastComputedAt: "2026-04-28T09:16:00Z",
    },
    backupFreshness: {
      backupSetManifestRef: `BSM_453_${sanitizeRef(selectedFunctionCode)}`,
      datasetScopeRef: "dataset:transactional-domain",
      snapshotTime:
        backupManifestState === "current" ? "2026-04-28T08:30:00Z" : "2026-04-26T08:30:00Z",
      immutabilityState: backupManifestState === "missing" ? "disputed" : "immutable",
      restoreTestState:
        backupManifestState === "current"
          ? "current"
          : backupManifestState === "stale"
            ? "stale"
            : "missing",
      manifestState: backupManifestState,
      checksumBundleRef: `checksum-bundle-453-${selectedFunctionCode}`,
      restoreCompatibilityDigestRef: `restore-digest-453-${selectedFunctionCode}-${scenarioState}`,
      summary:
        backupManifestState === "current"
          ? "Backup manifest checksum, immutability, and restore compatibility match the active tuple."
          : `Backup manifest is ${backupManifestState}; the board keeps evidence visible and blocks live restore authority.`,
    },
    runbookBindings,
    runTimeline: {
      opsRecoveryRunTimelineId: `ORRT_453_${key}`,
      activeRunRef: recoveryRunEvents[0]!.runRef,
      supersededRunRefs: timelineState === "exact" ? [] : [`RR_453_SUPERSEDED_${key}`],
      recoveryEvidencePackRefs: [evidencePackRef],
      resilienceActionSettlementRefs: [latestSettlementRef],
      evidenceArtifactRefs: recoveryRunEvents.map((event) => event.evidenceArtifactRef),
      timelineHash: `timelinehash-453-${scenarioState}-${selectedFunctionCode}`,
      timelineState,
      generatedAt: "2026-04-28T09:17:00Z",
    },
    recoveryRunEvents,
    actionRail,
    latestSettlement: {
      resilienceActionSettlementRef: latestSettlementRef,
      actionType: scenarioState === "settlement_pending" ? "restore_start" : "restore_validate",
      result: settlementResult,
      authoritativeRunRefs:
        settlementResult === "accepted_pending_evidence" ? [] : [recoveryRunEvents[0]!.runRef],
      recordedPostureRef: recoveryControlPostureRef,
      scopeTupleHash: `scope-tuple-453-${selectedFunctionCode}`,
      controlTupleHash,
      settledAt: "2026-04-28T09:18:00Z",
      announcement:
        settlementResult === "applied"
          ? "Settlement applied current recovery proof to the selected function."
          : `Settlement is ${settlementResult}; local button acknowledgement is not recovery authority.`,
    },
    artifactStage: {
      recoveryEvidenceArtifactRef: `REA_453_${key}`,
      artifactType: "recovery_pack_export",
      artifactState,
      artifactPresentationContractRef: `APC_453_${key}`,
      artifactTransferSettlementRef: `ATS_453_${key}`,
      artifactFallbackDispositionRef: `AFD_453_${key}`,
      outboundNavigationGrantRef: `ONG_453_${key}`,
      graphHash: `graphhash-453-${scenarioState}-${selectedFunctionCode}`,
      resilienceTupleHash,
      summaryFirstPreview:
        artifactState === "external_handoff_ready"
          ? "Recovery evidence artifact is summary-first, graph-bound, and ready for governed handoff."
          : "Recovery evidence artifact remains summary-first; transfer is held until tuple, graph, and settlement posture recover.",
    },
    proofDebt:
      blockerRefs.length === 0
        ? []
        : [
            {
              recoveryProofDebtRef: `RPD_453_${key}`,
              functionCode: selectedFunctionCode,
              missingProofRefs: blockerRefs.filter((ref) => ref.includes("missing")),
              staleRunbookRefs: runbookState === "published" ? [] : [selectedRunbookRef],
              staleBackupManifestRefs:
                backupManifestState === "current"
                  ? []
                  : [`BSM_453_${sanitizeRef(selectedFunctionCode)}`],
              nextRehearsalDueAt: "2026-04-29T09:00:00Z",
              blockerRefs,
            },
          ],
    nextExercise: {
      exerciseRef: `exercise-453-${selectedFunctionCode}`,
      exerciseType: scenarioState === "degraded" ? "failover" : "chaos",
      scheduledAt: "2026-04-29T10:00:00Z",
      scopeRef: `scope:tenant-demo-gp:${selectedFunctionCode}`,
    },
    historicalRunWarning:
      timelineState === "exact"
        ? "Historical runs agree with the active tuple."
        : "Historical runs remain visible but cannot satisfy current posture after tuple or graph drift.",
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: opsResilienceAutomationAnchors,
  };
}

export function createOpsResilienceFixture() {
  const scenarioProjections = Object.fromEntries(
    opsResilienceScenarioStates.map((scenarioState) => [
      scenarioState,
      createOpsResilienceProjection(scenarioState),
    ]),
  ) as Record<OpsResilienceScenarioState, OpsResilienceProjection>;

  return {
    taskId: OPS_RESILIENCE_TASK_ID,
    schemaVersion: OPS_RESILIENCE_SCHEMA_VERSION,
    routes: ["/ops/resilience"] as const,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: opsResilienceAutomationAnchors,
    scenarioProjections,
  };
}
