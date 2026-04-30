import {
  OPS_OVERVIEW_BOARD_SCOPE_REF,
  OPS_OVERVIEW_SCOPE_POLICY_REF,
  OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
  OPS_OVERVIEW_TIME_HORIZON,
  normalizeOpsOverviewScenarioState,
  type OpsOverviewScenarioState,
} from "./operations-overview-phase9.model";

export const PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION =
  "439.phase9.investigation-timeline-service.v1";
export const PHASE9_ASSURANCE_PACK_FACTORY_VERSION = "440.phase9.assurance-pack-factory.v1";
export const PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION = "441.phase9.capa-attestation-workflow.v1";
export const PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION =
  "446.phase9.projection-rebuild-quarantine.v1";
export const PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION =
  "447.phase9.incident-reportability-workflow.v1";
export const OPS_INCIDENTS_TASK_ID = "par_456";
export const OPS_INCIDENTS_SCHEMA_VERSION = "456.phase9.ops-incidents-route.v1";

export type OpsIncidentsScenarioState = OpsOverviewScenarioState;
export type OpsIncidentQueueFilter = "all" | "incident" | "near_miss";
export type OpsIncidentBindingState = "live" | "diagnostic_only" | "recovery_only" | "blocked";
export type OpsIncidentActionControlState =
  | "live_control"
  | "diagnostic_only"
  | "governed_recovery"
  | "blocked";
export type OpsIncidentArtifactState =
  | "external_handoff_ready"
  | "governed_preview"
  | "summary_only"
  | "blocked";
export type OpsIncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4" | "near_miss";
export type OpsIncidentStatus =
  | "triage"
  | "containment"
  | "monitoring"
  | "review"
  | "closed"
  | "near_miss_review"
  | "permission_limited";
export type OpsIncidentReportabilityDecision =
  | "reported"
  | "acknowledged"
  | "reportable_pending_submission"
  | "insufficient_facts_blocked"
  | "superseded"
  | "not_reportable"
  | "not_applicable"
  | "needs_senior_review";
export type OpsContainmentActionState =
  | "pending"
  | "applied"
  | "failed"
  | "blocked"
  | "revalidation_required";
export type OpsPostIncidentReviewState =
  | "not_started"
  | "open"
  | "blocked"
  | "ready_for_closure"
  | "complete";

export interface OpsIncidentRuntimeBindingProjection {
  readonly incidentSurfaceRuntimeBindingRef: string;
  readonly audienceSurface: "operations";
  readonly routeFamilyRef: "/ops/incidents";
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly incidentWorkflowVersion: typeof PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION;
  readonly requiredTrustRefs: readonly string[];
  readonly bindingState: OpsIncidentBindingState;
  readonly actionControlState: OpsIncidentActionControlState;
  readonly artifactState: OpsIncidentArtifactState;
  readonly validatedAt: string;
}

export interface OpsIncidentCommandStripProjection {
  readonly commandStripRef: string;
  readonly openIncidentCount: number;
  readonly nearMissCount: number;
  readonly sev1Count: number;
  readonly reportablePendingCount: number;
  readonly closureBlockedCount: number;
  readonly freshnessState: "current" | "watch" | "stale" | "blocked";
  readonly trustState: "trusted" | "guarded" | "diagnostic_only" | "blocked";
  readonly deadlineRisk: "none" | "watch" | "breach_risk" | "unknown";
  readonly summary: string;
}

export interface OpsIncidentQueueRow {
  readonly incidentRef: string;
  readonly rowKind: "incident" | "near_miss";
  readonly marker: string;
  readonly title: string;
  readonly severity: OpsIncidentSeverity;
  readonly status: OpsIncidentStatus;
  readonly detectedAt: string;
  readonly reportedAt: string;
  readonly impactScope: string;
  readonly reportabilityDecision: OpsIncidentReportabilityDecision;
  readonly containmentState: OpsContainmentActionState;
  readonly ownerRef: string;
  readonly deadlineLabel: string;
  readonly closureBlocked: boolean;
  readonly selected: boolean;
  readonly summary: string;
  readonly blockerRefs: readonly string[];
}

export interface OpsNearMissIntakeProjection {
  readonly intakeRef: string;
  readonly defaultCategory: "access_attempt" | "misroute" | "evidence_gap" | "training_drill";
  readonly validationState: "ready" | "invalid_empty_summary" | "accepted_pending_settlement";
  readonly allowed: boolean;
  readonly disabledReason: string;
  readonly settlementCopy: string;
  readonly requiredFields: readonly string[];
}

export interface OpsSeverityBoardProjection {
  readonly selectedIncidentRef: string;
  readonly severity: OpsIncidentSeverity;
  readonly confidenceLabel: string;
  readonly factsCompleteness: "complete" | "partial" | "insufficient" | "metadata_only";
  readonly patientImpact: "none_visible" | "potential" | "confirmed" | "redacted";
  readonly dataImpact: "metadata_only" | "confidentiality_risk" | "confirmed_disclosure";
  readonly systemImpact: "contained" | "degraded" | "blocked";
  readonly escalationRoute: "dpo_review" | "security_owner" | "senior_owner" | "blocked";
  readonly evidencePreservationState: "preserved" | "pending" | "blocked";
  readonly rationale: string;
}

export interface OpsContainmentTimelineEvent {
  readonly containmentActionRef: string;
  readonly label: string;
  readonly ownerRef: string;
  readonly state: OpsContainmentActionState;
  readonly settlementRef: string;
  readonly occurredAt: string;
  readonly summary: string;
  readonly evidenceArtifactRef: string;
}

export interface OpsReportabilityChecklistProjection {
  readonly reportabilityAssessmentRef: string;
  readonly frameworkCode: "DSPT" | "ICO" | "LOCAL_TENANT";
  readonly frameworkVersion: string;
  readonly decision: OpsIncidentReportabilityDecision;
  readonly decisionAuthority: "senior_owner" | "dpo" | "security_owner" | "not_applicable";
  readonly decisionSummary: string;
  readonly supportingFactRefs: readonly string[];
  readonly missingFactRefs: readonly string[];
  readonly externalHandoffRef: string;
  readonly handoffState: "not_required" | "pending" | "submitted" | "acknowledged" | "blocked";
  readonly deadlineLabel: string;
  readonly seniorReviewState: "not_required" | "required" | "complete" | "blocked";
  readonly blockerRefs: readonly string[];
}

export interface OpsExternalReportingHandoffProjection {
  readonly externalHandoffRef: string;
  readonly target: "DSPT" | "ICO" | "LOCAL_TENANT";
  readonly handoffState: "not_required" | "pending" | "submitted" | "acknowledged" | "blocked";
  readonly outboundNavigationGrantRef: string;
  readonly reportPayloadClass: "metadata_only" | "summary_redacted" | "blocked";
  readonly summary: string;
}

export interface OpsPostIncidentReviewProjection {
  readonly postIncidentReviewRef: string;
  readonly reviewState: OpsPostIncidentReviewState;
  readonly rootCauseSummary: string;
  readonly lessonSummary: string;
  readonly ownerRef: string;
  readonly dueAt: string;
  readonly capaState: "not_started" | "in_progress" | "blocked" | "complete";
  readonly drillState: "not_scheduled" | "scheduled" | "complete";
  readonly closureState: "blocked" | "ready" | "complete";
  readonly closureBlockerRefs: readonly string[];
}

export interface OpsIncidentCapaLink {
  readonly linkRef: string;
  readonly sourceRef: string;
  readonly label: string;
  readonly ownerRef: string;
  readonly status: "not_started" | "in_progress" | "blocked" | "complete" | "scheduled";
  readonly dueAt: string;
  readonly targetRoute: "/ops/assurance" | "/ops/resilience" | "/ops/incidents";
}

export interface OpsIncidentEvidenceLink {
  readonly evidenceLinkRef: string;
  readonly label: string;
  readonly targetSurface: "investigation_timeline" | "evidence_graph" | "audit_event_index";
  readonly timelineRef: string;
  readonly graphRef: string;
  readonly safeReturnTokenRef: string;
  readonly artifactPresentationContractRef: string;
  readonly payloadClass: "metadata_only" | "redacted_summary";
}

export interface OpsIncidentTelemetryRedactionProjection {
  readonly uiEventEnvelopeRef: string;
  readonly transitionSettlementRef: string;
  readonly disclosureFenceRef: string;
  readonly permittedPayloadClass: "metadata_only";
  readonly redactedFields: readonly [
    "incidentSummary",
    "patientIdentifier",
    "routeParams",
    "artifactFragment",
    "investigationKey",
  ];
  readonly telemetryCopy: string;
}

export interface OpsIncidentActionRailItem {
  readonly actionType: "assign_severity" | "record_containment" | "submit_report" | "close_review";
  readonly label: string;
  readonly allowed: boolean;
  readonly controlState: OpsIncidentActionControlState;
  readonly settlementResult:
    | "applied"
    | "accepted_pending_evidence"
    | "reportable_pending_submission"
    | "reported"
    | "blocked"
    | "superseded";
  readonly settlementRef: string;
  readonly disabledReason: string;
}

export interface OpsIncidentsProjection {
  readonly taskId: typeof OPS_INCIDENTS_TASK_ID;
  readonly schemaVersion: typeof OPS_INCIDENTS_SCHEMA_VERSION;
  readonly route: "/ops/incidents";
  readonly scenarioState: OpsIncidentsScenarioState;
  readonly boardScopeRef: typeof OPS_OVERVIEW_BOARD_SCOPE_REF;
  readonly timeHorizon: typeof OPS_OVERVIEW_TIME_HORIZON;
  readonly scopePolicyRef: typeof OPS_OVERVIEW_SCOPE_POLICY_REF;
  readonly shellContinuityKey: typeof OPS_OVERVIEW_SHELL_CONTINUITY_KEY;
  readonly selectedIncidentRef: string;
  readonly queueFilter: OpsIncidentQueueFilter;
  readonly incidentDeskTupleHash: string;
  readonly boardStateDigestRef: string;
  readonly boardTupleHash: string;
  readonly surfaceSummary: string;
  readonly runtimeBinding: OpsIncidentRuntimeBindingProjection;
  readonly commandStrip: OpsIncidentCommandStripProjection;
  readonly incidentQueue: readonly OpsIncidentQueueRow[];
  readonly nearMissIntake: OpsNearMissIntakeProjection;
  readonly severityBoard: OpsSeverityBoardProjection;
  readonly containmentTimeline: readonly OpsContainmentTimelineEvent[];
  readonly reportabilityChecklist: OpsReportabilityChecklistProjection;
  readonly externalReportingHandoff: OpsExternalReportingHandoffProjection;
  readonly pirPanel: OpsPostIncidentReviewProjection;
  readonly capaLinks: readonly OpsIncidentCapaLink[];
  readonly evidenceLinks: readonly OpsIncidentEvidenceLink[];
  readonly telemetryRedaction: OpsIncidentTelemetryRedactionProjection;
  readonly actionRail: readonly OpsIncidentActionRailItem[];
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Record<"439" | "440" | "441" | "446" | "447", string>;
  readonly automationAnchors: readonly string[];
}

const sourceAlgorithmRefs = [
  "blueprint/operations-console-frontend-blueprint.md#/ops/incidents",
  "blueprint/operations-console-frontend-blueprint.md#shell-continuity-and-routes",
  "blueprint/phase-9-the-assurance-ledger.md#9G",
  "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
] as const;

const upstreamSchemaVersions = {
  "439": PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  "440": PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  "441": PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  "446": PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  "447": PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
} as const;

export const opsIncidentsAutomationAnchors = [
  "incident-desk",
  "incident-command-strip",
  "incident-queue",
  "near-miss-intake",
  "severity-board",
  "containment-timeline",
  "reportability-checklist",
  "pir-panel",
  "incident-capa-links",
  "incident-evidence-links",
] as const;

export const opsIncidentsScenarioStates = [
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
] as const satisfies readonly OpsIncidentsScenarioState[];

const baseIncidentRows: readonly OpsIncidentQueueRow[] = [
  {
    incidentRef: "si_447_bba5b7a4610a530c",
    rowKind: "incident",
    marker: "SEV1-OPS-447-A",
    title: "Confidentiality incident in outbound evidence lane",
    severity: "sev1",
    status: "monitoring",
    detectedAt: "2026-04-14T09:12Z",
    reportedAt: "2026-04-14T10:05Z",
    impactScope: "Metadata-only operator view",
    reportabilityDecision: "reported",
    containmentState: "applied",
    ownerRef: "security-incident-commander",
    deadlineLabel: "Submitted inside 72h window",
    closureBlocked: true,
    selected: true,
    summary:
      "Evidence lane access was contained; operator UI shows only redacted summary and metadata refs.",
    blockerRefs: ["pir:root-cause-open", "capa:training-drill-pending"],
  },
  {
    incidentRef: "si_447_5f9d3a81126d4eb9",
    rowKind: "incident",
    marker: "SEV3-OPS-447-B",
    title: "Audit projection rebuilt after stale route token",
    severity: "sev3",
    status: "review",
    detectedAt: "2026-04-14T08:34Z",
    reportedAt: "2026-04-14T09:01Z",
    impactScope: "Internal assurance slice only",
    reportabilityDecision: "not_reportable",
    containmentState: "applied",
    ownerRef: "assurance-duty-lead",
    deadlineLabel: "No external clock",
    closureBlocked: true,
    selected: false,
    summary:
      "Projection rebuild completed with no subject data exposure; closure waits for CAPA attestation.",
    blockerRefs: ["capa:attestation-open"],
  },
  {
    incidentRef: "nmr_447_training_near_miss",
    rowKind: "near_miss",
    marker: "NM-OPS-447-C",
    title: "Near miss: drill exposed a missing escalation note",
    severity: "near_miss",
    status: "near_miss_review",
    detectedAt: "2026-04-14T07:50Z",
    reportedAt: "2026-04-14T07:58Z",
    impactScope: "Training drill evidence only",
    reportabilityDecision: "not_applicable",
    containmentState: "pending",
    ownerRef: "training-coordinator",
    deadlineLabel: "Review today",
    closureBlocked: true,
    selected: false,
    summary:
      "Near-miss drill is first-class in the queue so training improvement is tracked before harm.",
    blockerRefs: ["drill:follow-up-open"],
  },
];

const permissionLimitedRow: OpsIncidentQueueRow = {
  incidentRef: "si_447_permission_limited",
  rowKind: "incident",
  marker: "SEV?-OPS-447-LIMITED",
  title: "Restricted incident metadata",
  severity: "sev2",
  status: "permission_limited",
  detectedAt: "redacted",
  reportedAt: "redacted",
  impactScope: "Metadata-only access granted",
  reportabilityDecision: "insufficient_facts_blocked",
  containmentState: "blocked",
  ownerRef: "restricted",
  deadlineLabel: "Hidden by role scope",
  closureBlocked: true,
  selected: true,
  summary:
    "Insufficient role scope; no incident summary, subject detail, or artifact fragment is shown.",
  blockerRefs: ["scope:permission-denied"],
};

export function normalizeOpsIncidentsScenarioState(
  value: OpsIncidentsScenarioState | string | null | undefined,
): OpsIncidentsScenarioState {
  return normalizeOpsOverviewScenarioState(value);
}

function defaultIncidentRefForState(state: OpsIncidentsScenarioState): string {
  if (state === "empty") {
    return "incident:none";
  }
  if (state === "permission_denied") {
    return permissionLimitedRow.incidentRef;
  }
  if (state === "degraded" || state === "settlement_pending") {
    return "nmr_447_training_near_miss";
  }
  return "si_447_bba5b7a4610a530c";
}

function bindingStateForScenario(state: OpsIncidentsScenarioState): OpsIncidentBindingState {
  switch (state) {
    case "normal":
    case "stable_service":
    case "empty":
      return "live";
    case "stale":
    case "degraded":
    case "settlement_pending":
      return "diagnostic_only";
    case "freeze":
      return "recovery_only";
    case "blocked":
    case "permission_denied":
    case "quarantined":
    default:
      return "blocked";
  }
}

function actionControlForScenario(state: OpsIncidentsScenarioState): OpsIncidentActionControlState {
  switch (state) {
    case "normal":
    case "stable_service":
    case "empty":
      return "live_control";
    case "freeze":
      return "governed_recovery";
    case "stale":
    case "degraded":
    case "settlement_pending":
      return "diagnostic_only";
    case "blocked":
    case "permission_denied":
    case "quarantined":
    default:
      return "blocked";
  }
}

function artifactStateForScenario(state: OpsIncidentsScenarioState): OpsIncidentArtifactState {
  switch (state) {
    case "normal":
    case "stable_service":
      return "external_handoff_ready";
    case "stale":
    case "degraded":
    case "freeze":
    case "settlement_pending":
      return "governed_preview";
    case "empty":
    case "permission_denied":
      return "summary_only";
    case "blocked":
    case "quarantined":
    default:
      return "blocked";
  }
}

function queueRowsForScenario(
  scenarioState: OpsIncidentsScenarioState,
  selectedIncidentRef: string,
): readonly OpsIncidentQueueRow[] {
  if (scenarioState === "empty") {
    return [];
  }
  const rows =
    scenarioState === "permission_denied"
      ? [permissionLimitedRow]
      : scenarioState === "blocked" || scenarioState === "quarantined"
        ? baseIncidentRows.map((row, index) => ({
            ...row,
            status: index === 0 ? ("triage" as const) : row.status,
            reportabilityDecision:
              index === 0 ? ("insufficient_facts_blocked" as const) : row.reportabilityDecision,
            containmentState: index === 0 ? ("blocked" as const) : row.containmentState,
            closureBlocked: true,
            blockerRefs: ["facts:insufficient", "containment:blocked", ...row.blockerRefs],
          }))
        : scenarioState === "degraded"
          ? baseIncidentRows.map((row) => ({
              ...row,
              reportabilityDecision:
                row.rowKind === "near_miss"
                  ? ("needs_senior_review" as const)
                  : row.reportabilityDecision,
              containmentState:
                row.rowKind === "near_miss" ? ("pending" as const) : row.containmentState,
            }))
          : scenarioState === "stale"
            ? baseIncidentRows.map((row) => ({
                ...row,
                reportabilityDecision: row.selected
                  ? ("superseded" as const)
                  : row.reportabilityDecision,
                containmentState: row.selected
                  ? ("revalidation_required" as const)
                  : row.containmentState,
                closureBlocked: true,
                blockerRefs: ["freshness:revalidation-required", ...row.blockerRefs],
              }))
            : scenarioState === "settlement_pending" || scenarioState === "freeze"
              ? baseIncidentRows.map((row) => ({
                  ...row,
                  reportabilityDecision: row.selected
                    ? ("reportable_pending_submission" as const)
                    : row.reportabilityDecision,
                  containmentState: row.selected ? ("pending" as const) : row.containmentState,
                  closureBlocked: true,
                  blockerRefs: ["settlement:pending", ...row.blockerRefs],
                }))
              : baseIncidentRows;

  const fallbackRef = rows[0]?.incidentRef ?? "incident:none";
  const selectedRef = rows.some((row) => row.incidentRef === selectedIncidentRef)
    ? selectedIncidentRef
    : fallbackRef;
  return rows.map((row) => ({ ...row, selected: row.incidentRef === selectedRef }));
}

function selectedQueueRow(rows: readonly OpsIncidentQueueRow[], selectedIncidentRef: string) {
  return (
    rows.find((row) => row.incidentRef === selectedIncidentRef) ??
    rows.find((row) => row.selected) ??
    rows[0] ??
    null
  );
}

function commandStripForScenario(
  scenarioState: OpsIncidentsScenarioState,
  rows: readonly OpsIncidentQueueRow[],
): OpsIncidentCommandStripProjection {
  const openIncidentCount = rows.filter((row) => row.rowKind === "incident").length;
  const nearMissCount = rows.filter((row) => row.rowKind === "near_miss").length;
  const sev1Count = rows.filter((row) => row.severity === "sev1").length;
  const reportablePendingCount = rows.filter(
    (row) => row.reportabilityDecision === "reportable_pending_submission",
  ).length;
  const closureBlockedCount = rows.filter((row) => row.closureBlocked).length;
  const blocked =
    scenarioState === "blocked" ||
    scenarioState === "permission_denied" ||
    scenarioState === "quarantined";
  const stale = scenarioState === "stale" || scenarioState === "freeze";
  return {
    commandStripRef: `ICS_456_${scenarioState.toUpperCase()}`,
    openIncidentCount,
    nearMissCount,
    sev1Count,
    reportablePendingCount,
    closureBlockedCount,
    freshnessState: blocked
      ? "blocked"
      : stale
        ? "stale"
        : scenarioState === "degraded"
          ? "watch"
          : "current",
    trustState: blocked
      ? "blocked"
      : stale
        ? "diagnostic_only"
        : scenarioState === "normal" || scenarioState === "stable_service"
          ? "trusted"
          : "guarded",
    deadlineRisk:
      scenarioState === "blocked" || scenarioState === "permission_denied"
        ? "unknown"
        : reportablePendingCount > 0
          ? "breach_risk"
          : sev1Count > 0
            ? "watch"
            : "none",
    summary:
      rows.length === 0
        ? "No active incidents or near misses match the current tenant and period."
        : `${openIncidentCount} incident(s), ${nearMissCount} near miss(es), ${closureBlockedCount} closure gate(s) still open.`,
  };
}

function severityBoardForScenario(
  scenarioState: OpsIncidentsScenarioState,
  selected: OpsIncidentQueueRow | null,
): OpsSeverityBoardProjection {
  if (!selected) {
    return {
      selectedIncidentRef: "incident:none",
      severity: "near_miss",
      confidenceLabel: "no open incidents",
      factsCompleteness: "complete",
      patientImpact: "none_visible",
      dataImpact: "metadata_only",
      systemImpact: "contained",
      escalationRoute: "security_owner",
      evidencePreservationState: "preserved",
      rationale: "Empty state keeps the severity board visible with zero-impact proof.",
    };
  }
  if (scenarioState === "permission_denied") {
    return {
      selectedIncidentRef: selected.incidentRef,
      severity: selected.severity,
      confidenceLabel: "scope limited",
      factsCompleteness: "metadata_only",
      patientImpact: "redacted",
      dataImpact: "metadata_only",
      systemImpact: "blocked",
      escalationRoute: "blocked",
      evidencePreservationState: "blocked",
      rationale: "Role scope only permits metadata; details remain behind the disclosure fence.",
    };
  }
  const insufficient = scenarioState === "blocked" || scenarioState === "quarantined";
  const pending =
    scenarioState === "degraded" ||
    scenarioState === "settlement_pending" ||
    scenarioState === "freeze";
  return {
    selectedIncidentRef: selected.incidentRef,
    severity: selected.severity,
    confidenceLabel: insufficient
      ? "0.41 insufficient facts"
      : pending
        ? "0.68 review needed"
        : "0.86 evidence bound",
    factsCompleteness: insufficient ? "insufficient" : pending ? "partial" : "complete",
    patientImpact: insufficient
      ? "potential"
      : selected.severity === "near_miss"
        ? "none_visible"
        : "potential",
    dataImpact:
      selected.severity === "sev1" && !pending ? "confirmed_disclosure" : "confidentiality_risk",
    systemImpact: insufficient ? "blocked" : pending ? "degraded" : "contained",
    escalationRoute: insufficient ? "senior_owner" : pending ? "dpo_review" : "security_owner",
    evidencePreservationState: insufficient ? "pending" : "preserved",
    rationale:
      selected.severity === "near_miss"
        ? "Near-miss severity stays first-class so a training drill can close the weakness before harm."
        : "Severity combines data impact, containment state, fact completeness, and reportability posture from task 447.",
  };
}

function containmentTimelineForScenario(
  scenarioState: OpsIncidentsScenarioState,
): readonly OpsContainmentTimelineEvent[] {
  const blocked =
    scenarioState === "blocked" ||
    scenarioState === "permission_denied" ||
    scenarioState === "quarantined";
  const pending =
    scenarioState === "degraded" ||
    scenarioState === "settlement_pending" ||
    scenarioState === "freeze";
  const stale = scenarioState === "stale";
  return [
    {
      containmentActionRef: "ca_447_preserve_timeline",
      label: "Preserve incident timeline",
      ownerRef: "security-incident-commander",
      state: blocked ? "blocked" : stale ? "revalidation_required" : "applied",
      settlementRef: "settlement_447_timeline_preserved",
      occurredAt: "2026-04-14T09:16Z",
      summary: "Timeline and graph keys are preserved through the investigation service.",
      evidenceArtifactRef: "timeline_439_incident_447_a",
    },
    {
      containmentActionRef: "ca_447_revoke_token",
      label: "Revoke affected route token",
      ownerRef: "platform-duty-lead",
      state: blocked ? "failed" : pending ? "pending" : "applied",
      settlementRef: pending
        ? "settlement_447_revoke_pending"
        : blocked
          ? "settlement_447_revoke_failed"
          : "settlement_447_revoke_applied",
      occurredAt: "2026-04-14T09:23Z",
      summary:
        "Route token containment is settlement-bound and never treated as local button success.",
      evidenceArtifactRef: "containment_447_route_token",
    },
    {
      containmentActionRef: "ca_447_notify_owner",
      label: "Notify senior information owner",
      ownerRef: "dpo-delegate",
      state: blocked ? "blocked" : pending ? "pending" : "applied",
      settlementRef: pending
        ? "settlement_447_owner_pending"
        : blocked
          ? "settlement_447_owner_blocked"
          : "settlement_447_owner_ack",
      occurredAt: "2026-04-14T09:35Z",
      summary: "Senior owner review is attached to the reportability decision trail.",
      evidenceArtifactRef: "handoff_447_senior_owner",
    },
  ];
}

function reportabilityChecklistForScenario(
  scenarioState: OpsIncidentsScenarioState,
  selected: OpsIncidentQueueRow | null,
): OpsReportabilityChecklistProjection {
  if (!selected) {
    return {
      reportabilityAssessmentRef: "ra_447_empty",
      frameworkCode: "DSPT",
      frameworkVersion: "DSPT 2025 metadata incident reporting",
      decision: "not_applicable",
      decisionAuthority: "not_applicable",
      decisionSummary: "No incident is selected, so no reporting clock is open.",
      supportingFactRefs: [],
      missingFactRefs: [],
      externalHandoffRef: "handoff_447_not_required",
      handoffState: "not_required",
      deadlineLabel: "No deadline",
      seniorReviewState: "not_required",
      blockerRefs: [],
    };
  }
  if (scenarioState === "normal" || scenarioState === "stable_service") {
    return {
      reportabilityAssessmentRef: "ra_447_bba5b7a4610a530c",
      frameworkCode: "DSPT",
      frameworkVersion: "DSPT 2025 metadata incident reporting",
      decision: "reported",
      decisionAuthority: "dpo",
      decisionSummary: "Reportability is final and acknowledged; PIR and CAPA still block closure.",
      supportingFactRefs: ["fact:scope-contained", "fact:timeline-preserved", "fact:dpo-signed"],
      missingFactRefs: [],
      externalHandoffRef: "handoff_447_dspt_ack",
      handoffState: "acknowledged",
      deadlineLabel: "Submitted inside 72h window",
      seniorReviewState: "complete",
      blockerRefs: [],
    };
  }
  if (
    scenarioState === "settlement_pending" ||
    scenarioState === "freeze" ||
    scenarioState === "degraded"
  ) {
    return {
      reportabilityAssessmentRef: "ra_447_pending_submission",
      frameworkCode: "DSPT",
      frameworkVersion: "DSPT 2025 metadata incident reporting",
      decision: "reportable_pending_submission",
      decisionAuthority: "dpo",
      decisionSummary:
        "The assessment is reportable, but external submission is still pending settlement.",
      supportingFactRefs: ["fact:scope-contained", "fact:timeline-preserved"],
      missingFactRefs: ["fact:senior-owner-ack"],
      externalHandoffRef: "handoff_447_dspt_pending",
      handoffState: "pending",
      deadlineLabel: "72h clock visible",
      seniorReviewState: "required",
      blockerRefs: ["reportability:submission-pending"],
    };
  }
  if (scenarioState === "stale") {
    return {
      reportabilityAssessmentRef: "ra_447_stale_superseded",
      frameworkCode: "DSPT",
      frameworkVersion: "DSPT 2025 metadata incident reporting",
      decision: "superseded",
      decisionAuthority: "dpo",
      decisionSummary:
        "The previous assessment is preserved but stale; operators must reacquire current facts.",
      supportingFactRefs: ["fact:preserved-assessment"],
      missingFactRefs: ["fact:current-projection"],
      externalHandoffRef: "handoff_447_stale_hold",
      handoffState: "blocked",
      deadlineLabel: "Revalidation required",
      seniorReviewState: "blocked",
      blockerRefs: ["freshness:stale-assessment"],
    };
  }
  return {
    reportabilityAssessmentRef: "ra_447_insufficient_facts",
    frameworkCode: "DSPT",
    frameworkVersion: "DSPT 2025 metadata incident reporting",
    decision: "insufficient_facts_blocked",
    decisionAuthority: "senior_owner",
    decisionSummary: "Closure and reporting are blocked until missing facts are recovered.",
    supportingFactRefs: ["fact:metadata-bound"],
    missingFactRefs: ["fact:impact-scope", "fact:subject-count", "fact:containment-proof"],
    externalHandoffRef: "handoff_447_blocked",
    handoffState: "blocked",
    deadlineLabel: "Unknown until facts recovered",
    seniorReviewState: "blocked",
    blockerRefs: ["facts:insufficient", "scope:blocked"],
  };
}

function externalHandoffFromChecklist(
  checklist: OpsReportabilityChecklistProjection,
  scenarioState: OpsIncidentsScenarioState,
): OpsExternalReportingHandoffProjection {
  return {
    externalHandoffRef: checklist.externalHandoffRef,
    target: checklist.frameworkCode === "ICO" ? "ICO" : checklist.frameworkCode,
    handoffState: checklist.handoffState,
    outboundNavigationGrantRef: `ONG_456_${checklist.externalHandoffRef.toUpperCase()}`,
    reportPayloadClass:
      checklist.handoffState === "blocked"
        ? "blocked"
        : scenarioState === "normal" || scenarioState === "stable_service"
          ? "summary_redacted"
          : "metadata_only",
    summary:
      checklist.handoffState === "acknowledged"
        ? "External DSPT handoff has an acknowledgement bound to the incident reportability workflow."
        : checklist.handoffState === "pending"
          ? "External DSPT handoff is pending authoritative settlement."
          : checklist.handoffState === "not_required"
            ? "No external reporting handoff is required for the current selection."
            : "External reporting handoff is blocked until the missing facts are recovered.",
  };
}

function pirPanelForScenario(
  scenarioState: OpsIncidentsScenarioState,
): OpsPostIncidentReviewProjection {
  if (scenarioState === "empty") {
    return {
      postIncidentReviewRef: "pir_447_empty",
      reviewState: "complete",
      rootCauseSummary: "No active incident review is open.",
      lessonSummary: "No lessons are pending.",
      ownerRef: "none",
      dueAt: "not scheduled",
      capaState: "complete",
      drillState: "complete",
      closureState: "complete",
      closureBlockerRefs: [],
    };
  }
  if (scenarioState === "normal" || scenarioState === "stable_service") {
    return {
      postIncidentReviewRef: "pir_447_bba5b7a4610a530c",
      reviewState: "open",
      rootCauseSummary:
        "Route-token guardrail weakness is identified; full root-cause signoff is still open.",
      lessonSummary:
        "Operators need a drill that validates escalation note capture before closure.",
      ownerRef: "security-incident-commander",
      dueAt: "2026-04-18",
      capaState: "in_progress",
      drillState: "scheduled",
      closureState: "blocked",
      closureBlockerRefs: ["pir:root-cause-open", "capa:training-drill-pending"],
    };
  }
  if (
    scenarioState === "blocked" ||
    scenarioState === "permission_denied" ||
    scenarioState === "quarantined"
  ) {
    return {
      postIncidentReviewRef: "pir_447_blocked",
      reviewState: "blocked",
      rootCauseSummary:
        "Root cause cannot be finalized until missing facts and containment evidence recover.",
      lessonSummary: "CAPA and training links stay blocked so closure cannot be misrepresented.",
      ownerRef: "senior-information-owner",
      dueAt: "blocked",
      capaState: "blocked",
      drillState: "not_scheduled",
      closureState: "blocked",
      closureBlockerRefs: [
        "reportability:insufficient-facts",
        "containment:blocked",
        "capa:blocked",
      ],
    };
  }
  return {
    postIncidentReviewRef: "pir_447_pending",
    reviewState: "not_started",
    rootCauseSummary: "PIR waits for current reportability and containment settlement.",
    lessonSummary: "Training drill is reserved but not yet executable.",
    ownerRef: "dpo-delegate",
    dueAt: "2026-04-19",
    capaState: "not_started",
    drillState: "not_scheduled",
    closureState: "blocked",
    closureBlockerRefs: ["reportability:pending", "containment:pending", "pir:not-started"],
  };
}

function capaLinksForScenario(
  scenarioState: OpsIncidentsScenarioState,
  selected: OpsIncidentQueueRow | null,
): readonly OpsIncidentCapaLink[] {
  const blocked =
    scenarioState === "blocked" ||
    scenarioState === "permission_denied" ||
    scenarioState === "quarantined";
  const complete = scenarioState === "empty";
  return [
    {
      linkRef: "capa_441_incident_route_token",
      sourceRef: selected?.incidentRef ?? "incident:none",
      label: "CAPA: strengthen route-token guardrail",
      ownerRef: "platform-duty-lead",
      status: complete ? "complete" : blocked ? "blocked" : "in_progress",
      dueAt: complete ? "complete" : "2026-04-20",
      targetRoute: "/ops/assurance",
    },
    {
      linkRef: "drill_441_near_miss_escalation",
      sourceRef: "nmr_447_training_near_miss",
      label: "Training drill: near-miss escalation note",
      ownerRef: "training-coordinator",
      status: complete ? "complete" : blocked ? "blocked" : "scheduled",
      dueAt: complete ? "complete" : "2026-04-22",
      targetRoute: "/ops/incidents",
    },
  ];
}

function evidenceLinksForScenario(
  scenarioState: OpsIncidentsScenarioState,
  selected: OpsIncidentQueueRow | null,
): readonly OpsIncidentEvidenceLink[] {
  const selectedRef = selected?.incidentRef ?? "incident:none";
  const payloadClass =
    scenarioState === "normal" || scenarioState === "stable_service"
      ? "redacted_summary"
      : "metadata_only";
  return [
    {
      evidenceLinkRef: "evidence_439_timeline_incident",
      label: "Timeline reconstruction",
      targetSurface: "investigation_timeline",
      timelineRef: `timeline_439_${selectedRef}`,
      graphRef: "graph_436_incident_root",
      safeReturnTokenRef: `ORT_INCIDENT_${selectedRef.toUpperCase()}`,
      artifactPresentationContractRef: "APC_456_TIMELINE_REDACTED",
      payloadClass,
    },
    {
      evidenceLinkRef: "evidence_436_graph_incident",
      label: "Evidence graph",
      targetSurface: "evidence_graph",
      timelineRef: `timeline_439_${selectedRef}`,
      graphRef: `graph_436_${selectedRef}`,
      safeReturnTokenRef: `ORT_INCIDENT_${selectedRef.toUpperCase()}`,
      artifactPresentationContractRef: "APC_456_GRAPH_REDACTED",
      payloadClass,
    },
  ];
}

function actionRailForScenario(
  scenarioState: OpsIncidentsScenarioState,
  checklist: OpsReportabilityChecklistProjection,
  pirPanel: OpsPostIncidentReviewProjection,
): readonly OpsIncidentActionRailItem[] {
  const controlState = actionControlForScenario(scenarioState);
  const live = controlState === "live_control";
  const reportAllowed =
    live &&
    checklist.decision === "reportable_pending_submission" &&
    checklist.handoffState === "pending";
  const canClose =
    live &&
    checklist.decision === "reported" &&
    pirPanel.reviewState === "complete" &&
    pirPanel.capaState === "complete" &&
    pirPanel.closureState === "ready";
  const blockedReason =
    controlState === "blocked"
      ? "Control plane is blocked."
      : controlState === "diagnostic_only"
        ? "Diagnostic-only projection requires authoritative settlement."
        : controlState === "governed_recovery"
          ? "Governed recovery requires governance handoff."
          : "";
  return [
    {
      actionType: "assign_severity",
      label: "Assign severity",
      allowed: live && scenarioState !== "empty",
      controlState,
      settlementResult: live ? "applied" : "blocked",
      settlementRef: "settlement_447_assign_severity",
      disabledReason: live ? "" : blockedReason,
    },
    {
      actionType: "record_containment",
      label: "Record containment",
      allowed: live && scenarioState !== "empty",
      controlState,
      settlementResult: live ? "applied" : "blocked",
      settlementRef: "settlement_447_record_containment",
      disabledReason: live ? "" : blockedReason,
    },
    {
      actionType: "submit_report",
      label: "Submit report",
      allowed: reportAllowed,
      controlState,
      settlementResult:
        checklist.decision === "reported"
          ? "reported"
          : checklist.decision === "reportable_pending_submission"
            ? "reportable_pending_submission"
            : "blocked",
      settlementRef: checklist.externalHandoffRef,
      disabledReason: reportAllowed
        ? ""
        : checklist.decision === "reported"
          ? "Reportability is already acknowledged."
          : checklist.decision === "insufficient_facts_blocked"
            ? "Insufficient facts block report submission."
            : blockedReason || "Report submission waits for reportable decision.",
    },
    {
      actionType: "close_review",
      label: "Close review",
      allowed: canClose,
      controlState,
      settlementResult: canClose ? "applied" : "blocked",
      settlementRef: pirPanel.postIncidentReviewRef,
      disabledReason: canClose
        ? ""
        : "Closure blocked until PIR, CAPA, training drill, and reportability are complete.",
    },
  ];
}

export function createOpsIncidentsProjection(
  options: {
    scenarioState?: OpsIncidentsScenarioState | string | null;
    selectedIncidentRef?: string | null;
    queueFilter?: OpsIncidentQueueFilter | string | null;
  } = {},
): OpsIncidentsProjection {
  const scenarioState = normalizeOpsIncidentsScenarioState(options.scenarioState);
  const requestedSelectedIncidentRef =
    options.selectedIncidentRef ?? defaultIncidentRefForState(scenarioState);
  const rows = queueRowsForScenario(scenarioState, requestedSelectedIncidentRef);
  const selected = selectedQueueRow(rows, requestedSelectedIncidentRef);
  const selectedIncidentRef = selected?.incidentRef ?? "incident:none";
  const queueFilter =
    options.queueFilter === "incident" || options.queueFilter === "near_miss"
      ? options.queueFilter
      : "all";
  const commandStrip = commandStripForScenario(scenarioState, rows);
  const severityBoard = severityBoardForScenario(scenarioState, selected);
  const reportabilityChecklist = reportabilityChecklistForScenario(scenarioState, selected);
  const pirPanel = pirPanelForScenario(scenarioState);
  const actionRail = actionRailForScenario(scenarioState, reportabilityChecklist, pirPanel);
  const runtimeBinding: OpsIncidentRuntimeBindingProjection = {
    incidentSurfaceRuntimeBindingRef: `OSRB_456_INCIDENTS_${scenarioState.toUpperCase()}`,
    audienceSurface: "operations",
    routeFamilyRef: "/ops/incidents",
    surfaceRouteContractRef: "surface-route-contract:/ops/incidents:456",
    surfacePublicationRef: "surface-publication:ops-incidents:phase9",
    runtimePublicationBundleRef: "runtime-publication:ops-console:phase9",
    incidentWorkflowVersion: PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
    requiredTrustRefs: [
      "trust:investigation-timeline",
      "trust:capa-attestation",
      "trust:reportability-workflow",
    ],
    bindingState: bindingStateForScenario(scenarioState),
    actionControlState: actionControlForScenario(scenarioState),
    artifactState: artifactStateForScenario(scenarioState),
    validatedAt: "2026-04-14T11:15:00Z",
  };

  return {
    taskId: OPS_INCIDENTS_TASK_ID,
    schemaVersion: OPS_INCIDENTS_SCHEMA_VERSION,
    route: "/ops/incidents",
    scenarioState,
    boardScopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    scopePolicyRef: OPS_OVERVIEW_SCOPE_POLICY_REF,
    shellContinuityKey: OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
    selectedIncidentRef,
    queueFilter,
    incidentDeskTupleHash: `ops-incidents-desk-tuple-456-${scenarioState}-${selectedIncidentRef}`,
    boardStateDigestRef: `ops-incidents-board-digest-456-${scenarioState}`,
    boardTupleHash: `ops-incidents-board-tuple-456-${scenarioState}`,
    surfaceSummary:
      rows.length === 0
        ? "Incident desk is empty for the current tenant scope and period."
        : `${selected?.marker ?? "Incident"} is selected with ${reportabilityChecklist.decision} reportability and ${pirPanel.closureState} closure posture.`,
    runtimeBinding,
    commandStrip,
    incidentQueue: rows,
    nearMissIntake: {
      intakeRef: "near_miss_intake_456",
      defaultCategory: "training_drill",
      validationState:
        scenarioState === "settlement_pending" ? "accepted_pending_settlement" : "ready",
      allowed: runtimeBinding.actionControlState === "live_control" || scenarioState === "degraded",
      disabledReason:
        runtimeBinding.actionControlState === "blocked"
          ? "Near-miss intake is blocked by route scope."
          : runtimeBinding.actionControlState === "diagnostic_only"
            ? "Near-miss entry can be drafted, but settlement remains pending."
            : "",
      settlementCopy:
        scenarioState === "settlement_pending"
          ? "Near-miss draft accepted locally; authoritative settlement is pending."
          : "Near-miss reports are tracked as first-class incident prevention records.",
      requiredFields: ["summary", "category", "observed control weakness"],
    },
    severityBoard,
    containmentTimeline: containmentTimelineForScenario(scenarioState),
    reportabilityChecklist,
    externalReportingHandoff: externalHandoffFromChecklist(reportabilityChecklist, scenarioState),
    pirPanel,
    capaLinks: capaLinksForScenario(scenarioState, selected),
    evidenceLinks: evidenceLinksForScenario(scenarioState, selected),
    telemetryRedaction: {
      uiEventEnvelopeRef: "UIEventEnvelope_456_incident_desk",
      transitionSettlementRef: "UITransitionSettlementRecord_456_incident_route",
      disclosureFenceRef: "UITelemetryDisclosureFence_447_f9f8ae7c1b5acce9",
      permittedPayloadClass: "metadata_only",
      redactedFields: [
        "incidentSummary",
        "patientIdentifier",
        "routeParams",
        "artifactFragment",
        "investigationKey",
      ],
      telemetryCopy:
        "Activity data keeps only safe metadata; summaries, identifiers, route details, and investigation keys are redacted.",
    },
    actionRail,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: opsIncidentsAutomationAnchors,
  };
}

export function createOpsIncidentsFixture() {
  const scenarioProjections = Object.fromEntries(
    opsIncidentsScenarioStates.map((scenarioState) => [
      scenarioState,
      createOpsIncidentsProjection({ scenarioState }),
    ]),
  ) as Record<OpsIncidentsScenarioState, OpsIncidentsProjection>;
  const selectedIncidentProjections = Object.fromEntries(
    baseIncidentRows.map((row) => [
      row.incidentRef,
      createOpsIncidentsProjection({
        scenarioState: "normal",
        selectedIncidentRef: row.incidentRef,
      }),
    ]),
  ) as Record<string, OpsIncidentsProjection>;

  return {
    taskId: OPS_INCIDENTS_TASK_ID,
    schemaVersion: OPS_INCIDENTS_SCHEMA_VERSION,
    routes: ["/ops/incidents"] as const,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: opsIncidentsAutomationAnchors,
    scenarioProjections,
    selectedIncidentProjections,
  };
}
