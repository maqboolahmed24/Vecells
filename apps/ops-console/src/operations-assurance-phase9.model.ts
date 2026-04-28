import {
  OPS_OVERVIEW_BOARD_SCOPE_REF,
  OPS_OVERVIEW_SCOPE_POLICY_REF,
  OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
  OPS_OVERVIEW_TIME_HORIZON,
  normalizeOpsOverviewScenarioState,
  type OpsOverviewScenarioState,
} from "./operations-overview-phase9.model";

export const PHASE9_ASSURANCE_PACK_FACTORY_VERSION = "440.phase9.assurance-pack-factory.v1";
export const PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION = "441.phase9.capa-attestation-workflow.v1";
export const PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION =
  "446.phase9.projection-rebuild-quarantine.v1";
export const OPS_ASSURANCE_TASK_ID = "par_454";
export const OPS_ASSURANCE_SCHEMA_VERSION = "454.phase9.ops-assurance-route.v1";

export type AssuranceFrameworkCode =
  | "DSPT"
  | "DTAC"
  | "DCB0129"
  | "DCB0160"
  | "NHS_APP_CHANNEL"
  | "IM1_CHANGE"
  | "LOCAL_TENANT";
export type AssurancePackSettlementResult =
  | "pending_attestation"
  | "signed_off"
  | "published_internal"
  | "export_ready"
  | "blocked_graph"
  | "blocked_trust"
  | "stale_pack"
  | "denied_scope"
  | "failed";
export type OpsAssuranceScenarioState = OpsOverviewScenarioState;
export type OpsAssuranceBindingState = "live" | "diagnostic_only" | "recovery_only" | "blocked";
export type OpsAssuranceExportControlState =
  | "live_export"
  | "attestation_required"
  | "diagnostic_only"
  | "recovery_only"
  | "blocked";
export type OpsAssuranceFreshnessState = "current" | "stale" | "expired" | "missing";
export type OpsAssuranceTrustState = "trusted" | "degraded" | "quarantined" | "unknown";
export type OpsAssuranceCompletenessState = "complete" | "partial" | "blocked" | "empty";
export type OpsAssuranceGraphVerdictState = "complete" | "stale" | "blocked";
export type OpsAssuranceArtifactState =
  | "summary_only"
  | "governed_preview"
  | "external_handoff_ready"
  | "fallback_promoted";

export interface OpsAssuranceFrameworkOption {
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly label: string;
  readonly frameworkVersion: string;
  readonly packFamily: string;
  readonly packState: string;
  readonly selected: boolean;
}

export interface OpsAssuranceSurfaceRuntimeBindingProjection {
  readonly assuranceSurfaceRuntimeBindingRef: string;
  readonly audienceSurface: "operations";
  readonly routeFamilyRef: "/ops/assurance";
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly requiredTrustRefs: readonly string[];
  readonly requiredChannelFreezeRefs: readonly string[];
  readonly releaseTrustFreezeVerdictRef: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly bindingState: OpsAssuranceBindingState;
  readonly validatedAt: string;
}

export interface OpsAssuranceControlHeatMapCell {
  readonly controlRecordRef: string;
  readonly controlCode: string;
  readonly label: string;
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly freshnessState: OpsAssuranceFreshnessState;
  readonly trustState: OpsAssuranceTrustState;
  readonly completenessState: OpsAssuranceCompletenessState;
  readonly controlState: "satisfied" | "partial" | "missing" | "blocked";
  readonly evidenceCount: number;
  readonly missingEvidenceCount: number;
  readonly graphVerdictState: OpsAssuranceGraphVerdictState;
  readonly graphDecisionHash: string;
  readonly continuityEvidenceState: "present" | "not_required" | "missing" | "blocked";
  readonly selected: boolean;
  readonly blockerRefs: readonly string[];
}

export interface OpsAssuranceCompletenessSummaryProjection {
  readonly completenessSummaryRef: string;
  readonly satisfiedControlCount: number;
  readonly partialControlCount: number;
  readonly blockedControlCount: number;
  readonly missingEvidenceCount: number;
  readonly graphVerdictState: OpsAssuranceGraphVerdictState;
  readonly trustState: OpsAssuranceTrustState;
  readonly freshnessState: OpsAssuranceFreshnessState;
  readonly summary: string;
}

export interface OpsAssuranceEvidenceGapQueueItem {
  readonly gapRef: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly reason: string;
  readonly controlRef: string;
  readonly ownerRef: string;
  readonly dueAt: string;
  readonly graphState: string;
  readonly trustState: string;
  readonly capaState: string;
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
}

export interface OpsAssuranceCapaTrackerItem {
  readonly capaActionRef: string;
  readonly sourceRef: string;
  readonly ownerRef: string;
  readonly targetDate: string;
  readonly status: string;
  readonly graphHash: string;
  readonly evidenceGapRefs: readonly string[];
  readonly blockerRefs: readonly string[];
}

export interface OpsAssuranceContinuitySectionProjection {
  readonly continuitySectionRef: string;
  readonly controlCode: string;
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly experienceContinuityEvidenceRefs: readonly string[];
  readonly validationState: "valid" | "missing" | "blocked";
  readonly blockingRefs: readonly string[];
}

export interface OpsAssurancePackPreviewProjection {
  readonly assurancePackRef: string;
  readonly packState: string;
  readonly packVersionHash: string;
  readonly evidenceSetHash: string;
  readonly continuitySetHash: string;
  readonly graphHash: string;
  readonly graphDecisionHash: string;
  readonly queryPlanHash: string;
  readonly renderTemplateHash: string;
  readonly redactionPolicyHash: string;
  readonly reproductionHash: string;
  readonly reproductionState: "exact" | "drifted" | "blocked";
  readonly requiredTrustRefs: readonly string[];
  readonly artifactPresentationContractRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly artifactFallbackDispositionRef: string;
  readonly outboundNavigationGrantRef: string;
  readonly summaryFirstPreview: string;
}

export interface OpsAssurancePackSettlementProjection {
  readonly assurancePackSettlementRef: string;
  readonly actionType: "attest" | "signoff" | "publish_internal" | "export_external";
  readonly result: AssurancePackSettlementResult;
  readonly graphHash: string;
  readonly exportManifestHash: string;
  readonly reproductionState: "exact" | "drifted" | "blocked";
  readonly announcement: string;
  readonly blockerRefs: readonly string[];
}

export interface OpsAssuranceActionRailItem {
  readonly actionType: "attest" | "signoff" | "publish_internal" | "export_external";
  readonly label: string;
  readonly allowed: boolean;
  readonly controlState: OpsAssuranceExportControlState;
  readonly settlementResult: AssurancePackSettlementResult;
  readonly settlementRef: string;
  readonly disabledReason: string;
}

export interface OpsAssuranceArtifactStageProjection {
  readonly artifactState: OpsAssuranceArtifactState;
  readonly artifactPresentationContractRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly outboundNavigationGrantRef: string;
  readonly exportManifestHash: string;
  readonly serializedArtifactHash: string;
  readonly summary: string;
}

export interface OpsAssuranceProjection {
  readonly taskId: typeof OPS_ASSURANCE_TASK_ID;
  readonly schemaVersion: typeof OPS_ASSURANCE_SCHEMA_VERSION;
  readonly route: "/ops/assurance";
  readonly scenarioState: OpsAssuranceScenarioState;
  readonly boardScopeRef: typeof OPS_OVERVIEW_BOARD_SCOPE_REF;
  readonly timeHorizon: typeof OPS_OVERVIEW_TIME_HORIZON;
  readonly scopePolicyRef: typeof OPS_OVERVIEW_SCOPE_POLICY_REF;
  readonly shellContinuityKey: typeof OPS_OVERVIEW_SHELL_CONTINUITY_KEY;
  readonly selectedFrameworkCode: AssuranceFrameworkCode;
  readonly selectedControlCode: string;
  readonly selectedControlLabel: string;
  readonly assuranceTupleHash: string;
  readonly boardStateDigestRef: string;
  readonly boardTupleHash: string;
  readonly surfaceSummary: string;
  readonly frameworkOptions: readonly OpsAssuranceFrameworkOption[];
  readonly runtimeBinding: OpsAssuranceSurfaceRuntimeBindingProjection;
  readonly completenessSummary: OpsAssuranceCompletenessSummaryProjection;
  readonly controlHeatMap: readonly OpsAssuranceControlHeatMapCell[];
  readonly evidenceGapQueue: readonly OpsAssuranceEvidenceGapQueueItem[];
  readonly capaTracker: readonly OpsAssuranceCapaTrackerItem[];
  readonly continuitySections: readonly OpsAssuranceContinuitySectionProjection[];
  readonly packPreview: OpsAssurancePackPreviewProjection;
  readonly latestSettlement: OpsAssurancePackSettlementProjection;
  readonly actionRail: readonly OpsAssuranceActionRailItem[];
  readonly artifactStage: OpsAssuranceArtifactStageProjection;
  readonly degradedSliceAttestation: {
    readonly gateRef: string;
    readonly gateState:
      | "not_required"
      | "attestation_required"
      | "attested_degraded_allowed"
      | "blocked_quarantined";
    readonly degradedTrustRecordRefs: readonly string[];
    readonly quarantinedTrustRecordRefs: readonly string[];
    readonly blockerRefs: readonly string[];
  };
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Record<"440" | "441" | "446", string>;
  readonly automationAnchors: readonly string[];
}

export const opsAssuranceScenarioStates = [
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
] as const satisfies readonly OpsAssuranceScenarioState[];

export const opsAssuranceAutomationAnchors = [
  "assurance-center",
  "framework-selector",
  "control-heat-map",
  "control-heat-table",
  "evidence-gap-queue",
  "capa-tracker",
  "pack-preview",
  "pack-settlement",
  "pack-export-state",
] as const;

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9A",
  "blueprint/phase-9-the-assurance-ledger.md#9D",
  "blueprint/operations-console-frontend-blueprint.md#/ops/assurance",
] as const;

const upstreamSchemaVersions = {
  "440": PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  "441": PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  "446": PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
} as const;

const frameworkLabels: Record<AssuranceFrameworkCode, string> = {
  DSPT: "DSPT",
  DTAC: "DTAC",
  DCB0129: "DCB0129",
  DCB0160: "DCB0160",
  NHS_APP_CHANNEL: "NHS App monthly",
  IM1_CHANGE: "IM1 change",
  LOCAL_TENANT: "Local tenant",
};

const actionLabels: Record<OpsAssuranceActionRailItem["actionType"], string> = {
  attest: "Attest degraded evidence",
  signoff: "Sign off pack",
  publish_internal: "Publish internally",
  export_external: "Export external pack",
};

function sanitizeRef(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function normalizeOpsAssuranceScenarioState(
  value: string | null | undefined,
): OpsAssuranceScenarioState {
  return normalizeOpsOverviewScenarioState(value);
}

function syntheticHash(prefix: string): string {
  return `${prefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}454`.padEnd(64, "0").slice(0, 64);
}

const frameworkCatalog = [
  {
    frameworkCode: "DSPT",
    frameworkVersion: "DSPT-2025-26",
    packFamily: "dspt_operational_evidence_pack",
  },
  {
    frameworkCode: "DTAC",
    frameworkVersion: "DTAC-2026-03",
    packFamily: "dtac_evidence_refresh_pack",
  },
  {
    frameworkCode: "DCB0129",
    frameworkVersion: "DCB0129-2026-delta",
    packFamily: "manufacturer_safety_case_delta",
  },
  {
    frameworkCode: "DCB0160",
    frameworkVersion: "DCB0160-2026-handoff",
    packFamily: "deployment_handoff_pack",
  },
  {
    frameworkCode: "NHS_APP_CHANNEL",
    frameworkVersion: "NHSAPP-POSTLIVE-2026-04",
    packFamily: "nhs_app_post_live_monthly_pack",
  },
  {
    frameworkCode: "IM1_CHANGE",
    frameworkVersion: "IM1-CHANGE-2026-04",
    packFamily: "integrated_change_delta_pack",
  },
  {
    frameworkCode: "LOCAL_TENANT",
    frameworkVersion: "LOCAL-TENANT-2026-04",
    packFamily: "tenant_policy_pack",
  },
] as const satisfies readonly {
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly frameworkVersion: string;
  readonly packFamily: string;
}[];

const baselinePackHashes = {
  packVersionHash: syntheticHash("dtac-pack-version-baseline"),
  evidenceSetHash: "e".repeat(64),
  continuitySetHash: "c".repeat(64),
  graphHash: "440".padEnd(64, "0"),
  graphDecisionHash: "d".repeat(64),
  queryPlanHash: syntheticHash("dtac-query-plan"),
  renderTemplateHash: syntheticHash("dtac-render-template"),
  redactionPolicyHash: syntheticHash("assurance-pack-redaction-policy"),
  reproductionHash: syntheticHash("dtac-reproduction-exact"),
  serializedArtifactHash: syntheticHash("dtac-serialized-artifact"),
  exportManifestHash: syntheticHash("dtac-export-manifest"),
} as const;

const staticEvidenceGap = {
  gapRef: "egq_441_a64c60325b9fdde7",
  severity: "high",
  reason: "missing_evidence:dtac:control:technical-security",
  controlRef: "acr_441_missing_evidence",
  ownerRef: "clinical_safety_owner",
  dueAt: "2026-04-30T23:59:59.000Z",
  graphState: "complete",
  trustState: "trusted",
  capaState: "completed",
  nextSafeAction: "attest",
  blockerRefs: ["gap:open:egq_441_a64c60325b9fdde7"],
} as const satisfies OpsAssuranceEvidenceGapQueueItem;

const staticCapaActions = [
  {
    capaActionRef: "capa_441_completed",
    sourceRef: "pack-454-dtac-normal",
    ownerRef: "actor:capa-owner-441",
    targetDate: "2026-04-29T17:00:00.000Z",
    status: "completed",
    graphHash: baselinePackHashes.graphHash,
    evidenceGapRefs: [staticEvidenceGap.gapRef],
    blockerRefs: [],
  },
  {
    capaActionRef: "capa_441_in_progress",
    sourceRef: "pack-454-dtac-normal",
    ownerRef: "actor:capa-owner-441",
    targetDate: "2026-05-01T17:00:00.000Z",
    status: "in_progress",
    graphHash: baselinePackHashes.graphHash,
    evidenceGapRefs: [staticEvidenceGap.gapRef],
    blockerRefs: [],
  },
] as const satisfies readonly OpsAssuranceCapaTrackerItem[];

const staticContinuitySections = [
  {
    continuitySectionRef: "ceps_454_patient_navigation",
    controlCode: "dtac:continuity",
    affectedRouteFamilyRefs: ["rf_patient_home", "rf_ops_assurance"],
    experienceContinuityEvidenceRefs: ["continuity:440:patient-navigation"],
    validationState: "valid",
    blockingRefs: [],
  },
] as const satisfies readonly OpsAssuranceContinuitySectionProjection[];

const degradedTrustRecordRef = "astr_446_degraded_pack_factory";
const hardBlockedTrustRecordRef = "astr_446_hard_blocked_resilience";
const degradedSliceGateRef = "dsag_446_degraded_attestation_required";
const quarantineBlockers = [
  "blocking-namespace:resilience.recovery.evidence",
  "blocking-producer:producer:resilience",
  "hard-block",
  "trust-lower-bound:0",
] as const;

function bindingStateForScenario(state: OpsAssuranceScenarioState): OpsAssuranceBindingState {
  switch (state) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "blocked";
    case "freeze":
      return "recovery_only";
    case "stale":
    case "degraded":
    case "settlement_pending":
      return "diagnostic_only";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "live";
  }
}

function exportControlStateForScenario(
  state: OpsAssuranceScenarioState,
): OpsAssuranceExportControlState {
  switch (state) {
    case "normal":
    case "stable_service":
      return "live_export";
    case "degraded":
    case "settlement_pending":
      return "attestation_required";
    case "freeze":
      return "recovery_only";
    case "stale":
      return "diagnostic_only";
    case "empty":
    case "blocked":
    case "permission_denied":
    case "quarantined":
    default:
      return "blocked";
  }
}

function graphStateForScenario(state: OpsAssuranceScenarioState): OpsAssuranceGraphVerdictState {
  switch (state) {
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
      return "complete";
  }
}

function trustStateForScenario(state: OpsAssuranceScenarioState): OpsAssuranceTrustState {
  switch (state) {
    case "degraded":
    case "settlement_pending":
    case "freeze":
      return "degraded";
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "quarantined";
    case "stale":
      return "unknown";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "trusted";
  }
}

function freshnessStateForScenario(state: OpsAssuranceScenarioState): OpsAssuranceFreshnessState {
  switch (state) {
    case "stale":
    case "freeze":
    case "settlement_pending":
      return "stale";
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "missing";
    case "degraded":
      return "current";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "current";
  }
}

function settlementResultForScenario(
  state: OpsAssuranceScenarioState,
): AssurancePackSettlementResult {
  switch (state) {
    case "normal":
    case "stable_service":
      return "export_ready";
    case "degraded":
    case "settlement_pending":
      return "pending_attestation";
    case "stale":
    case "freeze":
      return "stale_pack";
    case "blocked":
    case "quarantined":
      return "blocked_trust";
    case "permission_denied":
      return "denied_scope";
    case "empty":
    default:
      return "blocked_graph";
  }
}

function packStateForScenario(state: OpsAssuranceScenarioState): string {
  switch (state) {
    case "normal":
    case "stable_service":
      return "export_ready";
    case "degraded":
    case "settlement_pending":
      return "awaiting_attestation";
    case "stale":
    case "freeze":
      return "stale_pack";
    case "blocked":
    case "quarantined":
      return "blocked_trust";
    case "permission_denied":
      return "denied_scope";
    case "empty":
    default:
      return "collecting";
  }
}

function blockersForScenario(state: OpsAssuranceScenarioState): readonly string[] {
  switch (state) {
    case "stale":
      return ["pack:stale", "graph:stale", "redaction:requires-revalidation"];
    case "degraded":
      return ["slice:degraded", "attestation:required"];
    case "settlement_pending":
      return ["settlement:pending_attestation"];
    case "freeze":
      return ["release-freeze:active", "pack:revalidate-after-freeze"];
    case "blocked":
      return ["graph:blocked", "mandatory-evidence:missing"];
    case "permission_denied":
      return ["scope:denied", "purpose-of-use:insufficient"];
    case "quarantined":
      return ["slice:quarantined", "producer:blocked", "namespace:blocked"];
    case "empty":
      return ["pack:empty-scope"];
    case "normal":
    case "stable_service":
    default:
      return [];
  }
}

function artifactStateForScenario(state: OpsAssuranceScenarioState): OpsAssuranceArtifactState {
  switch (state) {
    case "normal":
    case "stable_service":
      return "external_handoff_ready";
    case "permission_denied":
    case "blocked":
    case "quarantined":
    case "empty":
      return "summary_only";
    case "stale":
    case "degraded":
    case "freeze":
    case "settlement_pending":
    default:
      return "governed_preview";
  }
}

function controlsForFramework(
  frameworkCode: AssuranceFrameworkCode,
  scenarioState: OpsAssuranceScenarioState,
  selectedControlCodeInput?: string | null,
): readonly OpsAssuranceControlHeatMapCell[] {
  if (scenarioState === "empty") {
    return [];
  }
  const graphVerdictState = graphStateForScenario(scenarioState);
  const defaultFreshness = freshnessStateForScenario(scenarioState);
  const defaultTrust = trustStateForScenario(scenarioState);
  const scenarioBlockers = blockersForScenario(scenarioState);
  const frameworkPrefix = frameworkCode.toLowerCase().replace(/_/g, "-");
  const baseControls = [
    {
      suffix: "core",
      label: "Core service evidence",
      evidenceCount: 8,
      missingEvidenceCount: 0,
      continuityEvidenceState: "not_required",
    },
    {
      suffix: "continuity",
      label: "Continuity evidence",
      evidenceCount: 6,
      missingEvidenceCount: 0,
      continuityEvidenceState: "present",
    },
    {
      suffix: "technical-security",
      label: "Technical security evidence",
      evidenceCount: 5,
      missingEvidenceCount: scenarioState === "blocked" ? 3 : scenarioState === "degraded" ? 1 : 0,
      continuityEvidenceState: "not_required",
    },
    {
      suffix: "redaction",
      label: "Redaction and export policy",
      evidenceCount: 4,
      missingEvidenceCount: scenarioState === "stale" ? 1 : 0,
      continuityEvidenceState: "not_required",
    },
    {
      suffix: "capa",
      label: "CAPA closure chain",
      evidenceCount: 3,
      missingEvidenceCount: scenarioState === "settlement_pending" ? 1 : 0,
      continuityEvidenceState: "not_required",
    },
    {
      suffix: "projection-integrity",
      label: "Projection integrity",
      evidenceCount: 5,
      missingEvidenceCount: scenarioState === "quarantined" ? 5 : 0,
      continuityEvidenceState: scenarioState === "quarantined" ? "blocked" : "present",
    },
  ] as const;
  const selectedControlCode =
    selectedControlCodeInput &&
    baseControls.some(
      (control) => `${frameworkPrefix}:${control.suffix}` === selectedControlCodeInput,
    )
      ? selectedControlCodeInput
      : `${frameworkPrefix}:core`;

  return baseControls.map((control) => {
    const controlCode = `${frameworkPrefix}:${control.suffix}`;
    const blocked =
      scenarioState === "blocked" ||
      scenarioState === "permission_denied" ||
      scenarioState === "quarantined" ||
      control.missingEvidenceCount >= 3;
    const partial =
      scenarioState === "degraded" ||
      scenarioState === "stale" ||
      scenarioState === "freeze" ||
      scenarioState === "settlement_pending" ||
      control.missingEvidenceCount > 0;
    const freshnessState =
      scenarioState === "stale" && (control.suffix === "core" || control.suffix === "redaction")
        ? "stale"
        : defaultFreshness;
    const trustState =
      scenarioState === "quarantined" && control.suffix === "projection-integrity"
        ? "quarantined"
        : defaultTrust;
    return {
      controlRecordRef: `ACR_454_${sanitizeRef(frameworkCode)}_${sanitizeRef(control.suffix)}`,
      controlCode,
      label: control.label,
      frameworkCode,
      freshnessState,
      trustState,
      completenessState: blocked ? "blocked" : partial ? "partial" : "complete",
      controlState: blocked ? "blocked" : partial ? "partial" : "satisfied",
      evidenceCount: control.evidenceCount,
      missingEvidenceCount: control.missingEvidenceCount,
      graphVerdictState,
      graphDecisionHash: syntheticHash(
        `decision-${frameworkCode}-${control.suffix}-${scenarioState}`,
      ),
      continuityEvidenceState:
        control.continuityEvidenceState as OpsAssuranceControlHeatMapCell["continuityEvidenceState"],
      selected: controlCode === selectedControlCode,
      blockerRefs:
        controlCode === selectedControlCode || blocked || partial
          ? [
              ...scenarioBlockers,
              ...(control.missingEvidenceCount > 0
                ? [`evidence:missing:${control.missingEvidenceCount}`]
                : []),
            ]
          : [],
    };
  });
}

function labelForFramework(frameworkCode: AssuranceFrameworkCode): string {
  return frameworkLabels[frameworkCode] ?? frameworkCode;
}

export function createOpsAssuranceProjection(
  scenarioStateInput: OpsAssuranceScenarioState | string | null | undefined = "normal",
  selectedFrameworkInput: AssuranceFrameworkCode | string | null | undefined = "DTAC",
  selectedControlCodeInput?: string | null,
): OpsAssuranceProjection {
  const scenarioState = normalizeOpsAssuranceScenarioState(scenarioStateInput);
  const frameworkCodes = frameworkCatalog.map((map) => map.frameworkCode);
  const selectedFrameworkCode = frameworkCodes.includes(
    selectedFrameworkInput as AssuranceFrameworkCode,
  )
    ? (selectedFrameworkInput as AssuranceFrameworkCode)
    : "DTAC";
  const key = sanitizeRef(`${scenarioState}_${selectedFrameworkCode}`);
  const bindingState = bindingStateForScenario(scenarioState);
  const exportControlState = exportControlStateForScenario(scenarioState);
  const settlementResult = settlementResultForScenario(scenarioState);
  const graphVerdictState = graphStateForScenario(scenarioState);
  const trustState = trustStateForScenario(scenarioState);
  const freshnessState = freshnessStateForScenario(scenarioState);
  const blockerRefs = blockersForScenario(scenarioState);
  const controlHeatMap = controlsForFramework(
    selectedFrameworkCode,
    scenarioState,
    selectedControlCodeInput,
  );
  const selectedControl = controlHeatMap.find((control) => control.selected);
  const selectedControlCode = selectedControl?.controlCode ?? "none";
  const selectedControlLabel = selectedControl?.label ?? "No control selected";
  const assuranceTupleHash = `assurance-tuple-454-${scenarioState}-${selectedFrameworkCode}-${selectedControlCode}`;
  const boardTupleHash = `ops-assurance-board-tuple-454-${scenarioState}-${selectedFrameworkCode}-${selectedControlCode}`;
  const pack = baselinePackHashes;
  const packState = packStateForScenario(scenarioState);
  const artifactState = artifactStateForScenario(scenarioState);
  const satisfiedControlCount = controlHeatMap.filter(
    (control) => control.controlState === "satisfied",
  ).length;
  const partialControlCount = controlHeatMap.filter(
    (control) => control.controlState === "partial",
  ).length;
  const blockedControlCount = controlHeatMap.filter(
    (control) => control.controlState === "blocked",
  ).length;
  const missingEvidenceCount = controlHeatMap.reduce(
    (sum, control) => sum + control.missingEvidenceCount,
    0,
  );
  const settlementRef = `APS_454_${key}`;
  const actionTypes = ["attest", "signoff", "publish_internal", "export_external"] as const;
  const allowedActionTypes: readonly OpsAssuranceActionRailItem["actionType"][] =
    exportControlState === "live_export"
      ? actionTypes
      : exportControlState === "attestation_required"
        ? ["attest"]
        : [];
  const frameworkOptions = frameworkCatalog.map((map) => ({
    frameworkCode: map.frameworkCode,
    label: labelForFramework(map.frameworkCode),
    frameworkVersion: map.frameworkVersion,
    packFamily: map.packFamily,
    packState: map.frameworkCode === selectedFrameworkCode ? packState : "available",
    selected: map.frameworkCode === selectedFrameworkCode,
  })) satisfies readonly OpsAssuranceFrameworkOption[];
  const evidenceGapQueue =
    scenarioState === "empty"
      ? []
      : ([staticEvidenceGap].map((gap) => ({
          gapRef: gap.gapRef,
          severity: gap.severity,
          reason:
            scenarioState === "normal" || scenarioState === "stable_service"
              ? "completed_capa_follow_up"
              : gap.reason,
          controlRef: gap.controlRef,
          ownerRef: gap.ownerRef,
          dueAt: gap.dueAt,
          graphState: graphVerdictState,
          trustState,
          capaState:
            scenarioState === "normal" || scenarioState === "stable_service"
              ? "completed"
              : gap.capaState,
          nextSafeAction:
            exportControlState === "attestation_required"
              ? "attest"
              : exportControlState === "live_export"
                ? "export_external"
                : "revalidate",
          blockerRefs:
            exportControlState === "live_export" ? [] : [...blockerRefs, ...gap.blockerRefs],
        })) satisfies readonly OpsAssuranceEvidenceGapQueueItem[]);
  const capaTracker =
    scenarioState === "empty"
      ? []
      : (staticCapaActions.map((capa, index) => ({
          capaActionRef: capa.capaActionRef,
          sourceRef: capa.sourceRef,
          ownerRef: capa.ownerRef,
          targetDate: capa.targetDate,
          status:
            index === 0 && (scenarioState === "normal" || scenarioState === "stable_service")
              ? "completed"
              : scenarioState === "blocked" || scenarioState === "quarantined"
                ? "awaiting_evidence"
                : capa.status,
          graphHash: capa.graphHash,
          evidenceGapRefs: capa.evidenceGapRefs,
          blockerRefs:
            scenarioState === "normal" || scenarioState === "stable_service" ? [] : blockerRefs,
        })) satisfies readonly OpsAssuranceCapaTrackerItem[]);
  const continuitySections =
    scenarioState === "empty"
      ? []
      : (staticContinuitySections.map((section) => ({
          continuitySectionRef: section.continuitySectionRef,
          controlCode: section.controlCode,
          affectedRouteFamilyRefs: section.affectedRouteFamilyRefs,
          experienceContinuityEvidenceRefs: section.experienceContinuityEvidenceRefs,
          validationState:
            scenarioState === "blocked" || scenarioState === "quarantined"
              ? "blocked"
              : scenarioState === "stale"
                ? "missing"
                : section.validationState,
          blockingRefs:
            scenarioState === "normal" || scenarioState === "stable_service"
              ? section.blockingRefs
              : [...section.blockingRefs, ...blockerRefs],
        })) satisfies readonly OpsAssuranceContinuitySectionProjection[]);

  return {
    taskId: OPS_ASSURANCE_TASK_ID,
    schemaVersion: OPS_ASSURANCE_SCHEMA_VERSION,
    route: "/ops/assurance",
    scenarioState,
    boardScopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    scopePolicyRef: OPS_OVERVIEW_SCOPE_POLICY_REF,
    shellContinuityKey: OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
    selectedFrameworkCode,
    selectedControlCode,
    selectedControlLabel,
    assuranceTupleHash,
    boardStateDigestRef: `OASD_454_${key}`,
    boardTupleHash,
    surfaceSummary:
      exportControlState === "live_export"
        ? `${labelForFramework(selectedFrameworkCode)} pack preview is graph-complete, hash-reproduced, and export settlement-ready for ${assuranceTupleHash}.`
        : `${labelForFramework(selectedFrameworkCode)} remains visible, but pack controls are ${exportControlState} because ${blockerRefs.join(", ")}.`,
    frameworkOptions,
    runtimeBinding: {
      assuranceSurfaceRuntimeBindingRef: `ASRB_454_${key}`,
      audienceSurface: "operations",
      routeFamilyRef: "/ops/assurance",
      surfaceRouteContractRef: "route-contract:ops-assurance:454",
      surfacePublicationRef:
        scenarioState === "permission_denied"
          ? "surface-publication:blocked"
          : "surface-publication:ops-assurance",
      runtimePublicationBundleRef: "runtime-publication-bundle:ops-assurance:phase9",
      releasePublicationParityRef:
        scenarioState === "stale"
          ? "release-parity:ops-assurance:stale"
          : "release-parity:ops-assurance:exact",
      requiredTrustRefs:
        scenarioState === "quarantined" ? [hardBlockedTrustRecordRef] : [degradedTrustRecordRef],
      requiredChannelFreezeRefs:
        scenarioState === "freeze" ? ["channel-freeze:assurance:active"] : [],
      releaseTrustFreezeVerdictRef:
        scenarioState === "freeze"
          ? "release-trust-freeze:assurance:active"
          : "release-trust-freeze:assurance:live",
      releaseRecoveryDispositionRef: `release-recovery-disposition:ops-assurance:${bindingState}`,
      bindingState,
      validatedAt: "2026-04-28T10:05:00.000Z",
    },
    completenessSummary: {
      completenessSummaryRef: `ACS_454_${key}`,
      satisfiedControlCount,
      partialControlCount,
      blockedControlCount,
      missingEvidenceCount,
      graphVerdictState,
      trustState,
      freshnessState,
      summary:
        controlHeatMap.length === 0
          ? "No controls match the current assurance framework and period."
          : `${satisfiedControlCount} controls satisfied, ${partialControlCount} partial, ${blockedControlCount} blocked, and ${missingEvidenceCount} required evidence items missing.`,
    },
    controlHeatMap,
    evidenceGapQueue,
    capaTracker,
    continuitySections,
    packPreview: {
      assurancePackRef: `pack-454-${selectedFrameworkCode.toLowerCase()}-${scenarioState}`,
      packState,
      packVersionHash:
        selectedFrameworkCode === "DTAC"
          ? pack.packVersionHash
          : syntheticHash(`pack-version-${selectedFrameworkCode}-${scenarioState}`),
      evidenceSetHash:
        selectedFrameworkCode === "DTAC"
          ? pack.evidenceSetHash
          : syntheticHash(`evidence-set-${selectedFrameworkCode}`),
      continuitySetHash:
        selectedFrameworkCode === "DTAC"
          ? pack.continuitySetHash
          : syntheticHash(`continuity-set-${selectedFrameworkCode}`),
      graphHash:
        graphVerdictState === "complete" ? pack.graphHash : syntheticHash(`graph-${scenarioState}`),
      graphDecisionHash:
        graphVerdictState === "complete"
          ? pack.graphDecisionHash
          : syntheticHash(`graph-decision-${scenarioState}`),
      queryPlanHash:
        selectedFrameworkCode === "DTAC"
          ? pack.queryPlanHash
          : syntheticHash(`query-${selectedFrameworkCode}`),
      renderTemplateHash:
        selectedFrameworkCode === "DTAC"
          ? pack.renderTemplateHash
          : syntheticHash(`template-${selectedFrameworkCode}`),
      redactionPolicyHash:
        scenarioState === "stale"
          ? syntheticHash("redaction-stale")
          : selectedFrameworkCode === "DTAC"
            ? pack.redactionPolicyHash
            : syntheticHash(`redaction-${selectedFrameworkCode}`),
      reproductionHash:
        settlementResult === "export_ready"
          ? pack.reproductionHash
          : syntheticHash(`reproduction-${scenarioState}`),
      reproductionState:
        scenarioState === "normal" || scenarioState === "stable_service"
          ? "exact"
          : scenarioState === "blocked" ||
              scenarioState === "quarantined" ||
              scenarioState === "permission_denied"
            ? "blocked"
            : "drifted",
      requiredTrustRefs:
        scenarioState === "quarantined"
          ? [hardBlockedTrustRecordRef]
          : [degradedTrustRecordRef, "policy:assurance:artifact-transfer"],
      artifactPresentationContractRef: `APC_454_${key}`,
      artifactTransferSettlementRef: `ATS_454_${key}`,
      artifactFallbackDispositionRef: `AFD_454_${key}`,
      outboundNavigationGrantRef: `ONG_454_${key}`,
      summaryFirstPreview:
        settlementResult === "export_ready"
          ? "Pack preview is summary-first, graph-bound, redaction-current, and ready for governed export."
          : "Pack preview remains summary-first; export is held until graph, trust, redaction, and settlement posture recover.",
    },
    latestSettlement: {
      assurancePackSettlementRef: settlementRef,
      actionType: settlementResult === "pending_attestation" ? "attest" : "export_external",
      result: settlementResult,
      graphHash:
        graphVerdictState === "complete" ? pack.graphHash : syntheticHash(`graph-${scenarioState}`),
      exportManifestHash:
        settlementResult === "export_ready"
          ? pack.exportManifestHash
          : syntheticHash(`export-${scenarioState}`),
      reproductionState:
        settlementResult === "export_ready"
          ? "exact"
          : scenarioState === "blocked" ||
              scenarioState === "permission_denied" ||
              scenarioState === "quarantined"
            ? "blocked"
            : "drifted",
      announcement:
        settlementResult === "export_ready"
          ? "AssurancePackSettlement confirms this pack can be exported from the current hashes."
          : `AssurancePackSettlement is ${settlementResult}; local acknowledgement is not export authority.`,
      blockerRefs,
    },
    actionRail: actionTypes.map((actionType) => {
      const allowed = allowedActionTypes.includes(actionType);
      return {
        actionType,
        label: actionLabels[actionType],
        allowed,
        controlState: exportControlState,
        settlementResult,
        settlementRef: allowed ? settlementRef : `blocked-${actionType}-${scenarioState}`,
        disabledReason: allowed
          ? "Await the authoritative AssurancePackSettlement before changing pack state."
          : (blockerRefs[0] ??
            "Pack hash, graph verdict, trust posture, redaction policy, or runtime binding blocks this action."),
      };
    }),
    artifactStage: {
      artifactState,
      artifactPresentationContractRef: `APC_454_${key}`,
      artifactTransferSettlementRef: `ATS_454_${key}`,
      outboundNavigationGrantRef: `ONG_454_${key}`,
      exportManifestHash:
        settlementResult === "export_ready"
          ? pack.exportManifestHash
          : syntheticHash(`export-${scenarioState}`),
      serializedArtifactHash:
        settlementResult === "export_ready"
          ? pack.serializedArtifactHash
          : syntheticHash(`serialized-${scenarioState}`),
      summary:
        artifactState === "external_handoff_ready"
          ? "Artifact transfer is ready through the scoped outbound grant."
          : "Artifact transfer is held in the shell and rendered as summary-first preview.",
    },
    degradedSliceAttestation: {
      gateRef: degradedSliceGateRef,
      gateState:
        scenarioState === "quarantined"
          ? "blocked_quarantined"
          : scenarioState === "degraded" || scenarioState === "settlement_pending"
            ? "attestation_required"
            : "not_required",
      degradedTrustRecordRefs:
        scenarioState === "degraded" || scenarioState === "settlement_pending"
          ? [degradedTrustRecordRef]
          : [],
      quarantinedTrustRecordRefs:
        scenarioState === "quarantined" ? [hardBlockedTrustRecordRef] : [],
      blockerRefs: scenarioState === "quarantined" ? quarantineBlockers : blockerRefs,
    },
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: opsAssuranceAutomationAnchors,
  };
}

export function createOpsAssuranceFixture() {
  const scenarioProjections = Object.fromEntries(
    opsAssuranceScenarioStates.map((scenarioState) => [
      scenarioState,
      createOpsAssuranceProjection(scenarioState),
    ]),
  ) as Record<OpsAssuranceScenarioState, OpsAssuranceProjection>;
  const frameworkProjections = Object.fromEntries(
    frameworkCatalog.map((map) => [
      map.frameworkCode,
      createOpsAssuranceProjection("normal", map.frameworkCode),
    ]),
  ) as Record<AssuranceFrameworkCode, OpsAssuranceProjection>;

  return {
    taskId: OPS_ASSURANCE_TASK_ID,
    schemaVersion: OPS_ASSURANCE_SCHEMA_VERSION,
    routes: ["/ops/assurance"] as const,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: opsAssuranceAutomationAnchors,
    scenarioProjections,
    frameworkProjections,
  };
}
