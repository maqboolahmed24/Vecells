import {
  OPS_OVERVIEW_BOARD_SCOPE_REF,
  OPS_OVERVIEW_SCOPE_POLICY_REF,
  OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
  OPS_OVERVIEW_TIME_HORIZON,
} from "./operations-overview-phase9.model";
import {
  OPS_ASSURANCE_SCHEMA_VERSION,
  PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  createOpsAssuranceProjection,
  normalizeOpsAssuranceScenarioState,
  type AssuranceFrameworkCode,
  type OpsAssuranceGraphVerdictState,
  type OpsAssuranceProjection,
  type OpsAssuranceScenarioState,
} from "./operations-assurance-phase9.model";

export const COMPLIANCE_LEDGER_TASK_ID = "par_459";
export const COMPLIANCE_LEDGER_SCHEMA_VERSION = "459.phase9.compliance-ledger-and-gap-queue.v1";
export const COMPLIANCE_LEDGER_VISUAL_MODE = "Compliance_Ledger_Calm_Accountability";
export const COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF =
  "PHASE9_BATCH_458_472_INTERFACE_GAP_459_COMPLIANCE_LEDGER_PROJECTION";

export type ComplianceLedgerScenarioState =
  | OpsAssuranceScenarioState
  | "exact"
  | "graph_drift"
  | "overdue_owner";
export type ComplianceLedgerStatus =
  | "satisfied"
  | "warning"
  | "missing"
  | "exception"
  | "expired"
  | "blocked";
export type ComplianceLedgerActionControlState =
  | "review_ready"
  | "diagnostic_only"
  | "blocked"
  | "metadata_only"
  | "owner_review_only";
export type GapQueueFilterKey =
  | "all"
  | "critical"
  | "blocked"
  | "overdue"
  | "owner_burden"
  | "stale"
  | "export_blocked";
export type GapQueueSortKey = "severity" | "due_date" | "owner" | "control";
export type GapResolutionActionKind =
  | "open_capa"
  | "incident_follow_up"
  | "standards_remediation"
  | "evidence_refresh"
  | "owner_review";

export interface StandardsVersionContextProjection {
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly label: string;
  readonly frameworkVersion: string;
  readonly standardsVersionMapRef: string;
  readonly sourcePolicyRef: string;
  readonly selected: boolean;
}

export interface ComplianceLedgerSafeHandoffLink {
  readonly handoffRef: string;
  readonly label: string;
  readonly targetSurface:
    | "assurance_pack_preview"
    | "incident_desk"
    | "capa_tracker"
    | "tenant_governance"
    | "records_lifecycle"
    | "resilience_evidence";
  readonly route: string;
  readonly payloadRef: string;
  readonly returnContextRef: string;
  readonly rawArtifactUrlSuppressed: true;
}

export interface ComplianceLedgerRowProjection {
  readonly controlStatusSnapshotId: string;
  readonly assuranceControlRecordRef: string;
  readonly controlRef: string;
  readonly controlFamily: string;
  readonly controlLabel: string;
  readonly status: ComplianceLedgerStatus;
  readonly ownerRef: string;
  readonly ownerLabel: string;
  readonly evidenceAge: string;
  readonly latestEvidenceRef: string;
  readonly latestValidatedAt: string;
  readonly coverageScore: number;
  readonly coverageLowerBound: number;
  readonly lineageScore: number;
  readonly reproducibilityScore: number;
  readonly evidenceCount: number;
  readonly missingEvidenceCount: number;
  readonly graphVerdictState: OpsAssuranceGraphVerdictState;
  readonly graphHash: string;
  readonly decisionHash: string;
  readonly evidenceSetHash: string;
  readonly gapReasonRefs: readonly string[];
  readonly incidentRefs: readonly string[];
  readonly capaActionRefs: readonly string[];
  readonly retentionLifecycleRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly exceptionRef: string | null;
  readonly nextReviewAt: string;
  readonly packInclusionState: "included" | "preview_only" | "blocked";
  readonly exportEligibilityState: "eligible" | "held_graph" | "held_artifact" | "held_scope";
  readonly selected: boolean;
}

export interface ControlEvidenceGapQueueItemProjection {
  readonly evidenceGapRecordRef: string;
  readonly gapRef: string;
  readonly controlRef: string;
  readonly ownerRef: string;
  readonly ownerLabel: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly queueStatus:
    | "open"
    | "overdue"
    | "blocked_graph"
    | "awaiting_capa"
    | "resolved"
    | "metadata_only";
  readonly gapType:
    | "missing_evidence"
    | "stale_evidence"
    | "orphan_node"
    | "missing_edge"
    | "supersession_mismatch"
    | "cross_scope_conflict";
  readonly reason: string;
  readonly dueAt: string;
  readonly graphEdgeRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly incidentRefs: readonly string[];
  readonly capaActionRefs: readonly string[];
  readonly nextSafeAction: GapResolutionActionKind;
  readonly selected: boolean;
}

export interface ControlEvidenceGapQueueProjection {
  readonly queueProjectionRef: string;
  readonly selectedGapRef: string;
  readonly activeFilter: GapQueueFilterKey;
  readonly activeSort: GapQueueSortKey;
  readonly queueState: "empty" | "triage" | "diagnostic_only" | "blocked" | "metadata_only";
  readonly graphVerdictState: OpsAssuranceGraphVerdictState;
  readonly openGapCount: number;
  readonly blockedGapCount: number;
  readonly overdueGapCount: number;
  readonly items: readonly ControlEvidenceGapQueueItemProjection[];
}

export interface ControlEvidenceGraphMiniMapNodeProjection {
  readonly nodeRef: string;
  readonly nodeKind:
    | "control"
    | "evidence"
    | "incident"
    | "capa"
    | "retention"
    | "resilience"
    | "pack"
    | "standards";
  readonly label: string;
  readonly state: "current" | "stale" | "missing" | "blocked" | "linked";
}

export interface ControlEvidenceGraphMiniMapEdgeProjection {
  readonly edgeRef: string;
  readonly fromNodeRef: string;
  readonly toNodeRef: string;
  readonly edgeKind:
    | "satisfies"
    | "depends_on"
    | "remediates"
    | "blocks"
    | "retained_by"
    | "included_in";
  readonly edgeState: "valid" | "stale" | "missing" | "blocked";
}

export interface ControlEvidenceGraphMiniMapProjection {
  readonly miniMapRef: string;
  readonly selectedControlRef: string;
  readonly evidenceGraphSnapshotRef: string;
  readonly graphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly graphVerdictState: OpsAssuranceGraphVerdictState;
  readonly requiredNodeCount: number;
  readonly missingNodeCount: number;
  readonly orphanNodeCount: number;
  readonly staleEdgeCount: number;
  readonly nodes: readonly ControlEvidenceGraphMiniMapNodeProjection[];
  readonly edges: readonly ControlEvidenceGraphMiniMapEdgeProjection[];
}

export interface ControlOwnerBurdenItemProjection {
  readonly ownerRef: string;
  readonly ownerLabel: string;
  readonly openGapCount: number;
  readonly overdueGapCount: number;
  readonly blockedGraphEdgeCount: number;
  readonly staleEvidenceCount: number;
  readonly incidentFollowUpCount: number;
  readonly burdenState: "balanced" | "watch" | "overdue" | "overloaded";
}

export interface ControlOwnerBurdenProjection {
  readonly burdenProjectionRef: string;
  readonly selectedOwnerRef: string;
  readonly aggregateOpenGapCount: number;
  readonly overloadedOwnerCount: number;
  readonly items: readonly ControlOwnerBurdenItemProjection[];
}

export interface GapQueueFilterOptionProjection {
  readonly filterKey: GapQueueFilterKey;
  readonly label: string;
  readonly count: number;
  readonly selected: boolean;
}

export interface GapQueueFilterSetProjection {
  readonly filterSetRef: string;
  readonly activeFilter: GapQueueFilterKey;
  readonly activeSort: GapQueueSortKey;
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly options: readonly GapQueueFilterOptionProjection[];
}

export interface GapResolutionActionPreviewProjection {
  readonly actionPreviewRef: string;
  readonly selectedGapRef: string;
  readonly actionKind: GapResolutionActionKind;
  readonly actionLabel: string;
  readonly actionAllowed: boolean;
  readonly actionControlState: ComplianceLedgerActionControlState;
  readonly targetRoute: string;
  readonly handoffTargetSurface: ComplianceLedgerSafeHandoffLink["targetSurface"];
  readonly handoffPayloadRef: string;
  readonly requiresArtifactPresentationContractRef: string;
  readonly requiresOutboundNavigationGrantRef: string;
  readonly disabledReason: string;
  readonly rawArtifactUrlSuppressed: true;
}

export interface GraphCompletenessBlockerProjection {
  readonly blockerCardRef: string;
  readonly verdictRef: string;
  readonly graphVerdictState: OpsAssuranceGraphVerdictState;
  readonly blockerRefs: readonly string[];
  readonly summary: string;
}

export interface ComplianceLedgerProjection {
  readonly taskId: typeof COMPLIANCE_LEDGER_TASK_ID;
  readonly schemaVersion: typeof COMPLIANCE_LEDGER_SCHEMA_VERSION;
  readonly route: "/ops/assurance";
  readonly visualMode: typeof COMPLIANCE_LEDGER_VISUAL_MODE;
  readonly scenarioState: ComplianceLedgerScenarioState;
  readonly boardScopeRef: string;
  readonly timeHorizon: string;
  readonly scopePolicyRef: string;
  readonly shellContinuityKey: string;
  readonly selectedFrameworkCode: AssuranceFrameworkCode;
  readonly selectedControlRef: string;
  readonly selectedGapRef: string;
  readonly ledgerProjectionRef: string;
  readonly evidenceGraphSnapshotRef: string;
  readonly graphCompletenessVerdictRef: string;
  readonly controlStatusSnapshotRef: string;
  readonly standardsVersionContexts: readonly StandardsVersionContextProjection[];
  readonly ledgerRows: readonly ComplianceLedgerRowProjection[];
  readonly gapQueue: ControlEvidenceGapQueueProjection;
  readonly evidenceGraphMiniMap: ControlEvidenceGraphMiniMapProjection;
  readonly ownerBurden: ControlOwnerBurdenProjection;
  readonly gapQueueFilterSet: GapQueueFilterSetProjection;
  readonly resolutionActionPreview: GapResolutionActionPreviewProjection;
  readonly graphBlocker: GraphCompletenessBlockerProjection;
  readonly safeHandoffLinks: readonly ComplianceLedgerSafeHandoffLink[];
  readonly actionControlState: ComplianceLedgerActionControlState;
  readonly projectionUpdateState: "settled";
  readonly noRawArtifactUrls: true;
  readonly interfaceGapArtifactRef: typeof COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: {
    readonly "432": string;
    readonly "433": string;
    readonly "440": string;
    readonly "441": string;
    readonly "446": string;
    readonly "454": string;
    readonly "459": string;
  };
  readonly automationAnchors: readonly string[];
}

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9A",
  "blueprint/phase-9-the-assurance-ledger.md#9D",
  "blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot",
  "blueprint/phase-9-the-assurance-ledger.md#ControlStatusSnapshot",
  "prompt/459.md",
] as const;

const upstreamSchemaVersions = {
  "432": "432.phase9.assurance-contracts.v1",
  "433": "433.phase9.operational-projection-contracts.v1",
  "440": PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  "441": PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  "446": PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  "454": OPS_ASSURANCE_SCHEMA_VERSION,
  "459": COMPLIANCE_LEDGER_SCHEMA_VERSION,
} as const;

const automationAnchors = [
  "compliance-ledger-panel",
  "control-evidence-gap-queue",
  "control-status-ledger-row",
  "evidence-graph-mini-map",
  "gap-owner-burden-rail",
  "standards-version-context-chip",
  "capa-and-incident-link-strip",
  "graph-completeness-blocker-card",
  "evidence-gap-resolution-drawer",
] as const;

const frameworkSourcePolicies: Record<AssuranceFrameworkCode, string> = {
  DSPT: "source-policy:nhs-dspt:2025-26",
  DTAC: "source-policy:nhs-dtac:2026-02",
  DCB0129: "source-policy:nhs-dcb0129:clinical-safety-review",
  DCB0160: "source-policy:nhs-dcb0160:deployment-safety-review",
  NHS_APP_CHANNEL: "source-policy:nhs-app-channel:2026-04",
  IM1_CHANGE: "source-policy:im1-change:2026-04",
  LOCAL_TENANT: "source-policy:tenant-governance:2026-04",
};

const ownerLabels: Record<string, string> = {
  "owner:clinical-safety": "Clinical safety owner",
  "owner:technical-security": "Technical security owner",
  "owner:records": "Records lifecycle owner",
  "owner:resilience": "Resilience owner",
  "owner:tenant-governance": "Tenant governance owner",
  clinical_safety_owner: "Clinical safety owner",
};

const severityRank: Record<ControlEvidenceGapQueueItemProjection["severity"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function sanitizeRef(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function syntheticHash(prefix: string): string {
  return `${prefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}459`.padEnd(64, "0").slice(0, 64);
}

function controlFamilyForControl(controlRef: string): string {
  const suffix = controlRef.split(":").at(-1) ?? "core";
  switch (suffix) {
    case "technical-security":
      return "Technical security";
    case "redaction":
      return "Redaction and export";
    case "continuity":
      return "Continuity";
    case "capa":
      return "CAPA";
    case "projection-integrity":
      return "Projection integrity";
    default:
      return "Core service evidence";
  }
}

function ownerForControl(controlRef: string): string {
  const suffix = controlRef.split(":").at(-1) ?? "core";
  switch (suffix) {
    case "technical-security":
      return "owner:technical-security";
    case "redaction":
      return "owner:tenant-governance";
    case "continuity":
      return "owner:resilience";
    case "capa":
      return "owner:clinical-safety";
    case "projection-integrity":
      return "owner:records";
    default:
      return "owner:clinical-safety";
  }
}

function statusForControl(
  controlState: string,
  freshnessState: string,
  graphVerdictState: OpsAssuranceGraphVerdictState,
): ComplianceLedgerStatus {
  if (graphVerdictState === "blocked" || controlState === "blocked") return "blocked";
  if (controlState === "missing") return "missing";
  if (freshnessState === "expired") return "expired";
  if (freshnessState === "stale" || graphVerdictState === "stale") return "warning";
  if (controlState === "partial") return "exception";
  return "satisfied";
}

function graphScenarioForLedgerScenario(
  state: ComplianceLedgerScenarioState,
): OpsAssuranceScenarioState {
  if (state === "exact") return "normal";
  if (state === "graph_drift") return "stale";
  if (state === "overdue_owner") return "degraded";
  return normalizeOpsAssuranceScenarioState(state);
}

function graphVerdictForScenario(
  state: ComplianceLedgerScenarioState,
  assurance: OpsAssuranceProjection,
): OpsAssuranceGraphVerdictState {
  if (state === "graph_drift") return "blocked";
  if (state === "overdue_owner") return "stale";
  return assurance.completenessSummary.graphVerdictState;
}

function actionControlStateForScenario(
  state: ComplianceLedgerScenarioState,
  graphVerdictState: OpsAssuranceGraphVerdictState,
): ComplianceLedgerActionControlState {
  if (state === "permission_denied") return "metadata_only";
  if (state === "overdue_owner") return "owner_review_only";
  if (graphVerdictState === "complete") return "review_ready";
  if (graphVerdictState === "stale") return "diagnostic_only";
  return "blocked";
}

function normalizeFilter(value: string | null | undefined): GapQueueFilterKey {
  const normalized = String(value ?? "all").replace(/-/g, "_");
  if (
    normalized === "critical" ||
    normalized === "blocked" ||
    normalized === "overdue" ||
    normalized === "owner_burden" ||
    normalized === "stale" ||
    normalized === "export_blocked"
  ) {
    return normalized;
  }
  return "all";
}

function normalizeSort(value: string | null | undefined): GapQueueSortKey {
  const normalized = String(value ?? "severity").replace(/-/g, "_");
  if (
    normalized === "due_date" ||
    normalized === "owner" ||
    normalized === "control" ||
    normalized === "severity"
  ) {
    return normalized;
  }
  return "severity";
}

export function normalizeComplianceLedgerScenarioState(
  value: string | null | undefined,
): ComplianceLedgerScenarioState {
  const normalized = String(value ?? "normal")
    .toLowerCase()
    .replace(/-/g, "_");
  if (normalized === "exact") return "exact";
  if (normalized === "graph_drift") return "graph_drift";
  if (normalized === "overdue_owner" || normalized === "overdue") return "overdue_owner";
  return normalizeOpsAssuranceScenarioState(normalized);
}

function createStandardsContexts(
  assurance: OpsAssuranceProjection,
): readonly StandardsVersionContextProjection[] {
  return assurance.frameworkOptions.map((framework) => ({
    frameworkCode: framework.frameworkCode,
    label: framework.label,
    frameworkVersion: framework.frameworkVersion,
    standardsVersionMapRef: `SVM_459_${sanitizeRef(framework.frameworkCode)}_${sanitizeRef(
      framework.frameworkVersion,
    )}`,
    sourcePolicyRef: frameworkSourcePolicies[framework.frameworkCode],
    selected: framework.selected,
  }));
}

function createLedgerRows(
  assurance: OpsAssuranceProjection,
  scenarioState: ComplianceLedgerScenarioState,
  graphVerdictState: OpsAssuranceGraphVerdictState,
  selectedControlRefInput?: string | null,
): readonly ComplianceLedgerRowProjection[] {
  const selectedControlRef =
    selectedControlRefInput &&
    assurance.controlHeatMap.some((control) => control.controlCode === selectedControlRefInput)
      ? selectedControlRefInput
      : assurance.selectedControlCode;
  return assurance.controlHeatMap.map((control, index) => {
    const ownerRef = ownerForControl(control.controlCode);
    const missingCount =
      scenarioState === "overdue_owner" && index % 2 === 0
        ? Math.max(1, control.missingEvidenceCount)
        : control.missingEvidenceCount;
    const status = statusForControl(
      control.controlState,
      control.freshnessState,
      graphVerdictState,
    );
    const gapReasonRefs =
      missingCount > 0 || status !== "satisfied"
        ? [
            `gap-reason:459:${control.controlCode}:coverage`,
            ...(graphVerdictState !== "complete"
              ? [`gap-reason:459:${control.controlCode}:graph-${graphVerdictState}`]
              : []),
          ]
        : [];
    const coverageScore = Math.max(0, 100 - missingCount * 16 - (status === "warning" ? 8 : 0));
    return {
      controlStatusSnapshotId: `CSS_459_${sanitizeRef(control.controlCode)}_${sanitizeRef(
        scenarioState,
      )}`,
      assuranceControlRecordRef: control.controlRecordRef,
      controlRef: control.controlCode,
      controlFamily: controlFamilyForControl(control.controlCode),
      controlLabel: control.label,
      status,
      ownerRef,
      ownerLabel: ownerLabels[ownerRef] ?? ownerRef,
      evidenceAge:
        graphVerdictState === "complete"
          ? `${index + 1}d`
          : graphVerdictState === "stale"
            ? "32d"
            : "unknown",
      latestEvidenceRef: `EvidenceArtifactRef:459:${sanitizeRef(control.controlCode)}:latest`,
      latestValidatedAt:
        graphVerdictState === "complete" ? "2026-04-28T10:10:00.000Z" : "2026-03-27T16:40:00.000Z",
      coverageScore,
      coverageLowerBound: Math.max(0, coverageScore - 12),
      lineageScore:
        graphVerdictState === "blocked" ? 0.38 : graphVerdictState === "stale" ? 0.72 : 0.96,
      reproducibilityScore:
        graphVerdictState === "complete" && assurance.packPreview.reproductionState === "exact"
          ? 0.99
          : graphVerdictState === "stale"
            ? 0.66
            : 0.31,
      evidenceCount: control.evidenceCount,
      missingEvidenceCount: missingCount,
      graphVerdictState,
      graphHash: assurance.packPreview.graphHash,
      decisionHash: control.graphDecisionHash,
      evidenceSetHash: assurance.packPreview.evidenceSetHash,
      gapReasonRefs,
      incidentRefs:
        status === "blocked" || control.controlCode.endsWith("technical-security")
          ? [`incident:459:${sanitizeRef(control.controlCode)}:follow-up`]
          : [],
      capaActionRefs:
        status === "satisfied"
          ? []
          : assurance.capaTracker.map((capa) => capa.capaActionRef).slice(0, 2),
      retentionLifecycleRefs: [`retention:459:${sanitizeRef(control.controlCode)}:active`],
      artifactRefs: [
        `artifact-presentation:459:${sanitizeRef(control.controlCode)}:summary`,
        assurance.packPreview.artifactPresentationContractRef,
      ],
      exceptionRef:
        status === "exception" || status === "warning"
          ? `exception:459:${sanitizeRef(control.controlCode)}`
          : null,
      nextReviewAt:
        scenarioState === "overdue_owner" && index % 2 === 0
          ? "2026-04-25T09:00:00.000Z"
          : "2026-05-03T09:00:00.000Z",
      packInclusionState:
        graphVerdictState === "complete"
          ? "included"
          : graphVerdictState === "stale"
            ? "preview_only"
            : "blocked",
      exportEligibilityState:
        graphVerdictState === "complete"
          ? "eligible"
          : graphVerdictState === "stale"
            ? "held_graph"
            : scenarioState === "permission_denied"
              ? "held_scope"
              : "held_artifact",
      selected: control.controlCode === selectedControlRef,
    };
  });
}

function createGaps(
  rows: readonly ComplianceLedgerRowProjection[],
  assurance: OpsAssuranceProjection,
  scenarioState: ComplianceLedgerScenarioState,
  selectedGapRefInput?: string | null,
): readonly ControlEvidenceGapQueueItemProjection[] {
  if (scenarioState === "empty") return [];
  const sourceRows =
    rows.filter((row) => row.status !== "satisfied" || row.missingEvidenceCount > 0).length > 0
      ? rows.filter((row) => row.status !== "satisfied" || row.missingEvidenceCount > 0)
      : rows.filter((_, index) => index === 2 || index === 4);
  const graphVerdictState =
    rows[0]?.graphVerdictState ?? assurance.completenessSummary.graphVerdictState;
  const baseItems: ControlEvidenceGapQueueItemProjection[] = sourceRows.map((row, index) => {
    const isOverdue = scenarioState === "overdue_owner" || row.nextReviewAt < "2026-04-28";
    const blocked = graphVerdictState === "blocked";
    const severity: ControlEvidenceGapQueueItemProjection["severity"] = blocked
      ? "critical"
      : isOverdue
        ? "high"
        : row.status === "warning"
          ? "medium"
          : "low";
    const gapType: ControlEvidenceGapQueueItemProjection["gapType"] =
      blocked && index % 2 === 0
        ? "missing_edge"
        : row.status === "warning"
          ? "stale_evidence"
          : row.missingEvidenceCount > 0
            ? "missing_evidence"
            : "supersession_mismatch";
    const actionKind: GapResolutionActionKind =
      row.incidentRefs.length > 0
        ? "incident_follow_up"
        : row.capaActionRefs.length > 0
          ? "open_capa"
          : gapType === "stale_evidence"
            ? "evidence_refresh"
            : "owner_review";
    const queueStatus: ControlEvidenceGapQueueItemProjection["queueStatus"] =
      scenarioState === "permission_denied"
        ? "metadata_only"
        : blocked
          ? "blocked_graph"
          : isOverdue
            ? "overdue"
            : row.capaActionRefs.length > 0
              ? "awaiting_capa"
              : row.status === "satisfied"
                ? "resolved"
                : "open";
    return {
      evidenceGapRecordRef: `EGR_459_${sanitizeRef(row.controlRef)}_${index + 1}`,
      gapRef: `gap:459:${row.controlRef}:${index + 1}`,
      controlRef: row.controlRef,
      ownerRef: row.ownerRef,
      ownerLabel: row.ownerLabel,
      severity,
      queueStatus,
      gapType,
      reason: blocked
        ? "Graph completeness verdict blocks pack and control claims."
        : isOverdue
          ? "Owner review is overdue for evidence completeness."
          : `Evidence gap remains for ${row.controlFamily.toLowerCase()}.`,
      dueAt: isOverdue ? "2026-04-25T09:00:00.000Z" : row.nextReviewAt,
      graphEdgeRefs: [
        `edge:459:${sanitizeRef(row.controlRef)}:evidence`,
        `edge:459:${sanitizeRef(row.controlRef)}:pack`,
      ],
      blockerRefs: [...row.gapReasonRefs, ...assurance.latestSettlement.blockerRefs],
      incidentRefs: row.incidentRefs,
      capaActionRefs: row.capaActionRefs,
      nextSafeAction: actionKind,
      selected: false,
    };
  });
  const selectedGapRef =
    selectedGapRefInput && baseItems.some((item) => item.gapRef === selectedGapRefInput)
      ? selectedGapRefInput
      : baseItems[0]?.gapRef;
  return baseItems.map((item) => ({
    ...item,
    selected: item.gapRef === selectedGapRef,
  }));
}

function filterGaps(
  gaps: readonly ControlEvidenceGapQueueItemProjection[],
  filter: GapQueueFilterKey,
  sort: GapQueueSortKey,
): readonly ControlEvidenceGapQueueItemProjection[] {
  const filtered = gaps.filter((gap) => {
    switch (filter) {
      case "critical":
        return gap.severity === "critical";
      case "blocked":
        return gap.queueStatus === "blocked_graph";
      case "overdue":
        return gap.queueStatus === "overdue";
      case "owner_burden":
        return gap.queueStatus === "overdue" || gap.severity === "critical";
      case "stale":
        return gap.gapType === "stale_evidence";
      case "export_blocked":
        return gap.blockerRefs.length > 0;
      case "all":
      default:
        return true;
    }
  });
  return [...filtered].sort((left, right) => {
    switch (sort) {
      case "due_date":
        return left.dueAt.localeCompare(right.dueAt);
      case "owner":
        return left.ownerLabel.localeCompare(right.ownerLabel);
      case "control":
        return left.controlRef.localeCompare(right.controlRef);
      case "severity":
      default:
        return severityRank[right.severity] - severityRank[left.severity];
    }
  });
}

function createGapQueueProjection(
  allGaps: readonly ControlEvidenceGapQueueItemProjection[],
  graphVerdictState: OpsAssuranceGraphVerdictState,
  activeFilter: GapQueueFilterKey,
  activeSort: GapQueueSortKey,
  selectedGapRef: string,
): ControlEvidenceGapQueueProjection {
  const items = filterGaps(allGaps, activeFilter, activeSort);
  return {
    queueProjectionRef: `CEGQ_459_${sanitizeRef(graphVerdictState)}_${sanitizeRef(activeFilter)}`,
    selectedGapRef,
    activeFilter,
    activeSort,
    queueState:
      allGaps.length === 0
        ? "empty"
        : graphVerdictState === "blocked"
          ? "blocked"
          : graphVerdictState === "stale"
            ? "diagnostic_only"
            : "triage",
    graphVerdictState,
    openGapCount: allGaps.filter((gap) => gap.queueStatus !== "resolved").length,
    blockedGapCount: allGaps.filter((gap) => gap.queueStatus === "blocked_graph").length,
    overdueGapCount: allGaps.filter((gap) => gap.queueStatus === "overdue").length,
    items,
  };
}

function createMiniMap(
  selectedRow: ComplianceLedgerRowProjection | undefined,
  assurance: OpsAssuranceProjection,
  graphVerdictState: OpsAssuranceGraphVerdictState,
): ControlEvidenceGraphMiniMapProjection {
  const row = selectedRow ?? {
    controlRef: "control:none",
    controlLabel: "No selected control",
    latestEvidenceRef: "evidence:none",
    incidentRefs: [] as readonly string[],
    capaActionRefs: [] as readonly string[],
    retentionLifecycleRefs: [] as readonly string[],
  };
  const selectedControlRef = row.controlRef;
  const nodes: readonly ControlEvidenceGraphMiniMapNodeProjection[] = [
    {
      nodeRef: selectedControlRef,
      nodeKind: "control",
      label: row.controlLabel,
      state: graphVerdictState === "blocked" ? "blocked" : "current",
    },
    {
      nodeRef: row.latestEvidenceRef,
      nodeKind: "evidence",
      label: "Latest evidence",
      state:
        graphVerdictState === "stale"
          ? "stale"
          : graphVerdictState === "blocked"
            ? "missing"
            : "linked",
    },
    {
      nodeRef: assurance.packPreview.assurancePackRef,
      nodeKind: "pack",
      label: "Assurance pack preview",
      state: graphVerdictState === "complete" ? "linked" : "blocked",
    },
    {
      nodeRef: row.capaActionRefs[0] ?? "capa:none",
      nodeKind: "capa",
      label: "CAPA chain",
      state: row.capaActionRefs.length > 0 ? "linked" : "missing",
    },
    {
      nodeRef: row.incidentRefs[0] ?? "incident:none",
      nodeKind: "incident",
      label: "Incident follow-up",
      state: row.incidentRefs.length > 0 ? "linked" : "current",
    },
    {
      nodeRef: row.retentionLifecycleRefs[0] ?? "retention:none",
      nodeKind: "retention",
      label: "Retention lifecycle",
      state: "linked",
    },
    {
      nodeRef: `standards:${assurance.selectedFrameworkCode}`,
      nodeKind: "standards",
      label: `${assurance.selectedFrameworkCode} version map`,
      state: "linked",
    },
  ];
  const edges: readonly ControlEvidenceGraphMiniMapEdgeProjection[] = [
    {
      edgeRef: `edge:459:${sanitizeRef(selectedControlRef)}:evidence`,
      fromNodeRef: selectedControlRef,
      toNodeRef: row.latestEvidenceRef,
      edgeKind: "satisfies",
      edgeState:
        graphVerdictState === "blocked"
          ? "missing"
          : graphVerdictState === "stale"
            ? "stale"
            : "valid",
    },
    {
      edgeRef: `edge:459:${sanitizeRef(selectedControlRef)}:pack`,
      fromNodeRef: selectedControlRef,
      toNodeRef: assurance.packPreview.assurancePackRef,
      edgeKind: "included_in",
      edgeState: graphVerdictState === "complete" ? "valid" : "blocked",
    },
    {
      edgeRef: `edge:459:${sanitizeRef(selectedControlRef)}:standards`,
      fromNodeRef: selectedControlRef,
      toNodeRef: `standards:${assurance.selectedFrameworkCode}`,
      edgeKind: "depends_on",
      edgeState: "valid",
    },
  ];
  return {
    miniMapRef: `CEGMM_459_${sanitizeRef(selectedControlRef)}`,
    selectedControlRef,
    evidenceGraphSnapshotRef: `AEGS_459_${sanitizeRef(assurance.selectedFrameworkCode)}`,
    graphCompletenessVerdictRef: `AGCV_459_${sanitizeRef(assurance.selectedFrameworkCode)}_${sanitizeRef(
      graphVerdictState,
    )}`,
    graphHash: assurance.packPreview.graphHash,
    graphVerdictState,
    requiredNodeCount: nodes.length,
    missingNodeCount: nodes.filter((node) => node.state === "missing").length,
    orphanNodeCount: graphVerdictState === "blocked" ? 2 : 0,
    staleEdgeCount: edges.filter((edge) => edge.edgeState === "stale").length,
    nodes,
    edges,
  };
}

function createOwnerBurden(
  gaps: readonly ControlEvidenceGapQueueItemProjection[],
  rows: readonly ComplianceLedgerRowProjection[],
): ControlOwnerBurdenProjection {
  const ownerRefs = [...new Set(rows.map((row) => row.ownerRef))];
  const items: ControlOwnerBurdenItemProjection[] = ownerRefs.map((ownerRef) => {
    const ownerGaps = gaps.filter((gap) => gap.ownerRef === ownerRef);
    const overdueGapCount = ownerGaps.filter((gap) => gap.queueStatus === "overdue").length;
    const blockedGraphEdgeCount = ownerGaps.filter(
      (gap) => gap.queueStatus === "blocked_graph",
    ).length;
    const staleEvidenceCount = ownerGaps.filter((gap) => gap.gapType === "stale_evidence").length;
    const incidentFollowUpCount = ownerGaps.reduce((sum, gap) => sum + gap.incidentRefs.length, 0);
    const burdenState: ControlOwnerBurdenItemProjection["burdenState"] =
      overdueGapCount + blockedGraphEdgeCount >= 2
        ? "overloaded"
        : overdueGapCount > 0
          ? "overdue"
          : ownerGaps.length > 0 || staleEvidenceCount > 0
            ? "watch"
            : "balanced";
    return {
      ownerRef,
      ownerLabel: ownerLabels[ownerRef] ?? ownerRef,
      openGapCount: ownerGaps.filter((gap) => gap.queueStatus !== "resolved").length,
      overdueGapCount,
      blockedGraphEdgeCount,
      staleEvidenceCount,
      incidentFollowUpCount,
      burdenState,
    };
  });
  const selected =
    items.find((item) => item.burdenState === "overloaded") ??
    items.find((item) => item.openGapCount > 0) ??
    items[0];
  return {
    burdenProjectionRef: "COB_459_OWNER_BURDEN",
    selectedOwnerRef: selected?.ownerRef ?? "none",
    aggregateOpenGapCount: items.reduce((sum, item) => sum + item.openGapCount, 0),
    overloadedOwnerCount: items.filter((item) => item.burdenState === "overloaded").length,
    items,
  };
}

function createFilterSet(
  gaps: readonly ControlEvidenceGapQueueItemProjection[],
  activeFilter: GapQueueFilterKey,
  activeSort: GapQueueSortKey,
  frameworkCode: AssuranceFrameworkCode,
): GapQueueFilterSetProjection {
  const countFor = (filterKey: GapQueueFilterKey) => filterGaps(gaps, filterKey, activeSort).length;
  const options = (
    [
      ["all", "All"],
      ["critical", "Critical"],
      ["blocked", "Blocked graph"],
      ["overdue", "Overdue"],
      ["owner_burden", "Owner burden"],
      ["stale", "Stale evidence"],
      ["export_blocked", "Export held"],
    ] as const
  ).map(([filterKey, label]) => ({
    filterKey,
    label,
    count: countFor(filterKey),
    selected: filterKey === activeFilter,
  }));
  return {
    filterSetRef: `GQFS_459_${sanitizeRef(frameworkCode)}`,
    activeFilter,
    activeSort,
    frameworkCode,
    options,
  };
}

function createSafeHandoffs(
  assurance: OpsAssuranceProjection,
  selectedRow: ComplianceLedgerRowProjection | undefined,
): readonly ComplianceLedgerSafeHandoffLink[] {
  const controlRef = selectedRow?.controlRef ?? assurance.selectedControlCode;
  const payloadRef = `handoff-payload:459:${controlRef}`;
  const returnContextRef = `return-context:459:/ops/assurance:${controlRef}`;
  return [
    {
      handoffRef: "handoff:459:assurance-pack-preview",
      label: "Assurance pack preview",
      targetSurface: "assurance_pack_preview",
      route: "/ops/assurance#pack-preview",
      payloadRef,
      returnContextRef,
      rawArtifactUrlSuppressed: true,
    },
    {
      handoffRef: "handoff:459:incident-desk",
      label: "Incident desk",
      targetSurface: "incident_desk",
      route: "/ops/incidents",
      payloadRef,
      returnContextRef,
      rawArtifactUrlSuppressed: true,
    },
    {
      handoffRef: "handoff:459:capa-tracker",
      label: "CAPA tracker",
      targetSurface: "capa_tracker",
      route: "/ops/assurance#capa-tracker",
      payloadRef,
      returnContextRef,
      rawArtifactUrlSuppressed: true,
    },
    {
      handoffRef: "handoff:459:tenant-governance",
      label: "Tenant governance",
      targetSurface: "tenant_governance",
      route: "/ops/governance",
      payloadRef,
      returnContextRef,
      rawArtifactUrlSuppressed: true,
    },
    {
      handoffRef: "handoff:459:records-lifecycle",
      label: "Records lifecycle",
      targetSurface: "records_lifecycle",
      route: "/ops/records",
      payloadRef,
      returnContextRef,
      rawArtifactUrlSuppressed: true,
    },
    {
      handoffRef: "handoff:459:resilience-evidence",
      label: "Resilience evidence",
      targetSurface: "resilience_evidence",
      route: "/ops/resilience",
      payloadRef,
      returnContextRef,
      rawArtifactUrlSuppressed: true,
    },
  ];
}

function createResolutionPreview(
  selectedGap: ControlEvidenceGapQueueItemProjection | undefined,
  safeHandoffs: readonly ComplianceLedgerSafeHandoffLink[],
  actionControlState: ComplianceLedgerActionControlState,
  assurance: OpsAssuranceProjection,
  graphVerdictState: OpsAssuranceGraphVerdictState,
): GapResolutionActionPreviewProjection {
  const gap = selectedGap;
  const actionKind = gap?.nextSafeAction ?? "owner_review";
  const target =
    actionKind === "incident_follow_up"
      ? safeHandoffs.find((handoff) => handoff.targetSurface === "incident_desk")
      : actionKind === "open_capa"
        ? safeHandoffs.find((handoff) => handoff.targetSurface === "capa_tracker")
        : actionKind === "evidence_refresh"
          ? safeHandoffs.find((handoff) => handoff.targetSurface === "assurance_pack_preview")
          : safeHandoffs.find((handoff) => handoff.targetSurface === "tenant_governance");
  const actionAllowed =
    actionControlState === "review_ready" || actionControlState === "owner_review_only";
  return {
    actionPreviewRef: `GRAP_459_${sanitizeRef(gap?.gapRef ?? "none")}`,
    selectedGapRef: gap?.gapRef ?? "none",
    actionKind,
    actionLabel:
      actionKind === "incident_follow_up"
        ? "Open incident follow-up"
        : actionKind === "open_capa"
          ? "Open CAPA action"
          : actionKind === "standards_remediation"
            ? "Review standards map"
            : actionKind === "evidence_refresh"
              ? "Refresh evidence"
              : "Assign owner review",
    actionAllowed,
    actionControlState,
    targetRoute: target?.route ?? "/ops/assurance",
    handoffTargetSurface: target?.targetSurface ?? "assurance_pack_preview",
    handoffPayloadRef: target?.payloadRef ?? "handoff-payload:459:none",
    requiresArtifactPresentationContractRef: assurance.packPreview.artifactPresentationContractRef,
    requiresOutboundNavigationGrantRef: assurance.packPreview.outboundNavigationGrantRef,
    disabledReason: actionAllowed
      ? "Action preview is graph-bound and requires authoritative settlement before mutation."
      : graphVerdictState === "stale"
        ? "Graph is stale; action remains diagnostic until the completeness verdict is current."
        : graphVerdictState === "blocked"
          ? "Graph is blocked; complete the missing evidence edge before handoff."
          : "Scope metadata is visible, but action handoff is not authorized.",
    rawArtifactUrlSuppressed: true,
  };
}

export function createComplianceLedgerProjection(
  options: {
    readonly scenarioState?: ComplianceLedgerScenarioState | string | null;
    readonly selectedFrameworkCode?: AssuranceFrameworkCode | string | null;
    readonly selectedControlRef?: string | null;
    readonly selectedGapRef?: string | null;
    readonly activeFilter?: GapQueueFilterKey | string | null;
    readonly activeSort?: GapQueueSortKey | string | null;
  } = {},
): ComplianceLedgerProjection {
  const scenarioState = normalizeComplianceLedgerScenarioState(options.scenarioState);
  const assuranceScenario = graphScenarioForLedgerScenario(scenarioState);
  const assurance = createOpsAssuranceProjection(
    assuranceScenario,
    options.selectedFrameworkCode,
    options.selectedControlRef,
  );
  const graphVerdictState = graphVerdictForScenario(scenarioState, assurance);
  const actionControlState = actionControlStateForScenario(scenarioState, graphVerdictState);
  const ledgerRows = createLedgerRows(
    assurance,
    scenarioState,
    graphVerdictState,
    options.selectedControlRef,
  );
  const selectedRow = ledgerRows.find((row) => row.selected) ?? ledgerRows[0];
  const allGaps = createGaps(ledgerRows, assurance, scenarioState, options.selectedGapRef);
  const selectedGapRef =
    options.selectedGapRef && allGaps.some((gap) => gap.gapRef === options.selectedGapRef)
      ? options.selectedGapRef
      : (allGaps[0]?.gapRef ?? "none");
  const allGapsWithSelection = allGaps.map((gap) => ({
    ...gap,
    selected: gap.gapRef === selectedGapRef,
  }));
  const activeFilter = normalizeFilter(options.activeFilter);
  const activeSort = normalizeSort(options.activeSort);
  const gapQueue = createGapQueueProjection(
    allGapsWithSelection,
    graphVerdictState,
    activeFilter,
    activeSort,
    selectedGapRef,
  );
  const safeHandoffLinks = createSafeHandoffs(assurance, selectedRow);
  const selectedGap =
    allGapsWithSelection.find((gap) => gap.gapRef === selectedGapRef) ?? gapQueue.items[0];
  const graphCompletenessVerdictRef = `AGCV_459_${sanitizeRef(
    assurance.selectedFrameworkCode,
  )}_${sanitizeRef(graphVerdictState)}`;

  return {
    taskId: COMPLIANCE_LEDGER_TASK_ID,
    schemaVersion: COMPLIANCE_LEDGER_SCHEMA_VERSION,
    route: "/ops/assurance",
    visualMode: COMPLIANCE_LEDGER_VISUAL_MODE,
    scenarioState,
    boardScopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    scopePolicyRef: OPS_OVERVIEW_SCOPE_POLICY_REF,
    shellContinuityKey: OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
    selectedFrameworkCode: assurance.selectedFrameworkCode,
    selectedControlRef: selectedRow?.controlRef ?? "none",
    selectedGapRef,
    ledgerProjectionRef: `CLP_459_${sanitizeRef(scenarioState)}_${sanitizeRef(
      assurance.selectedFrameworkCode,
    )}`,
    evidenceGraphSnapshotRef: `AEGS_459_${sanitizeRef(assurance.selectedFrameworkCode)}`,
    graphCompletenessVerdictRef,
    controlStatusSnapshotRef: selectedRow?.controlStatusSnapshotId ?? "CSS_459_NONE",
    standardsVersionContexts: createStandardsContexts(assurance),
    ledgerRows,
    gapQueue,
    evidenceGraphMiniMap: createMiniMap(selectedRow, assurance, graphVerdictState),
    ownerBurden: createOwnerBurden(allGapsWithSelection, ledgerRows),
    gapQueueFilterSet: createFilterSet(
      allGapsWithSelection,
      activeFilter,
      activeSort,
      assurance.selectedFrameworkCode,
    ),
    resolutionActionPreview: createResolutionPreview(
      selectedGap,
      safeHandoffLinks,
      actionControlState,
      assurance,
      graphVerdictState,
    ),
    graphBlocker: {
      blockerCardRef: `GCB_459_${sanitizeRef(graphVerdictState)}`,
      verdictRef: graphCompletenessVerdictRef,
      graphVerdictState,
      blockerRefs:
        graphVerdictState === "complete"
          ? []
          : [
              ...assurance.latestSettlement.blockerRefs,
              `graph-verdict:${graphVerdictState}`,
              COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
            ],
      summary:
        graphVerdictState === "complete"
          ? "The ledger is graph-complete and can support review-ready control inspection."
          : graphVerdictState === "stale"
            ? "The ledger is diagnostic-only until the assurance evidence graph is rebuilt."
            : "The ledger is blocked because the graph completeness verdict has unresolved missing or cross-scope edges.",
    },
    safeHandoffLinks,
    actionControlState,
    projectionUpdateState: "settled",
    noRawArtifactUrls: true,
    interfaceGapArtifactRef: COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors,
  };
}

export function createComplianceLedgerFixture() {
  const scenarios = [
    "exact",
    "normal",
    "stale",
    "blocked",
    "empty",
    "permission_denied",
    "overdue_owner",
    "graph_drift",
  ] as const;
  const scenarioProjections = Object.fromEntries(
    scenarios.map((scenarioState) => [
      scenarioState,
      createComplianceLedgerProjection({ scenarioState }),
    ]),
  ) as Record<(typeof scenarios)[number], ComplianceLedgerProjection>;
  const frameworkProjections = Object.fromEntries(
    scenarioProjections.normal.standardsVersionContexts.map((context) => [
      context.frameworkCode,
      createComplianceLedgerProjection({
        scenarioState: "normal",
        selectedFrameworkCode: context.frameworkCode,
      }),
    ]),
  ) as Record<AssuranceFrameworkCode, ComplianceLedgerProjection>;

  return {
    taskId: COMPLIANCE_LEDGER_TASK_ID,
    schemaVersion: COMPLIANCE_LEDGER_SCHEMA_VERSION,
    route: "/ops/assurance" as const,
    visualMode: COMPLIANCE_LEDGER_VISUAL_MODE,
    interfaceGapArtifactRef: COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors,
    scenarioProjections,
    frameworkProjections,
  };
}
