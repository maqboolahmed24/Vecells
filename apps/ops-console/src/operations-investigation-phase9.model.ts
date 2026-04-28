import {
  OPS_OVERVIEW_BOARD_SCOPE_REF,
  OPS_OVERVIEW_SCOPE_POLICY_REF,
  OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
  OPS_OVERVIEW_TIME_HORIZON,
  normalizeOpsOverviewScenarioState,
  type OpsOverviewScenarioState,
} from "./operations-overview-phase9.model";

export const OPS_INVESTIGATION_TASK_ID = "par_452";
export const OPS_INVESTIGATION_SCHEMA_VERSION = "452.phase9.ops-investigation-route.v1";

export type OpsInvestigationScenarioState = OpsOverviewScenarioState;
export type OpsInvestigationOriginLens = "overview" | "queues" | "capacity" | "audit" | "health";
export type OpsTimelineState = "exact" | "stale" | "blocked";
export type OpsGraphVerdictState = "complete" | "stale" | "blocked";
export type OpsCausalityState =
  | "complete"
  | "accepted_only"
  | "visibility_missing"
  | "audit_missing"
  | "blocked";
export type OpsRestoreEligibilityState =
  | "restore_live"
  | "awaiting_external_hold"
  | "stale_reacquire"
  | "read_only_recovery"
  | "escalation_required"
  | "blocked";
export type OpsInvestigationExportState =
  | "export_ready"
  | "summary_only"
  | "redaction_review"
  | "blocked";
export type OpsDrawerDeltaState = "aligned" | "drifted" | "superseded" | "blocked";

export interface OpsInvestigationScopeEnvelope {
  readonly investigationScopeEnvelopeId: string;
  readonly originAudienceSurface: string;
  readonly originRouteIntentRef: string;
  readonly originOpsReturnTokenRef: string;
  readonly purposeOfUse: string;
  readonly actingContextRef: string;
  readonly maskingPolicyRef: string;
  readonly disclosureCeilingRef: string;
  readonly visibilityCoverageRefs: readonly string[];
  readonly scopeEntityRefs: readonly string[];
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly investigationQuestionHash: string;
  readonly requiredBreakGlassReviewRef: string;
  readonly requiredSupportLineageBindingRef: string;
  readonly scopeHash: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

export interface OpsInvestigationTimelineReconstruction {
  readonly investigationTimelineReconstructionId: string;
  readonly investigationScopeEnvelopeRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly dataSubjectTraceRef: string;
  readonly baseLedgerWatermarkRef: string;
  readonly sourceEventRefs: readonly string[];
  readonly normalizationVersionRef: string;
  readonly reconstructionInputHash: string;
  readonly timelineHash: string;
  readonly graphHash: string;
  readonly timelineState: OpsTimelineState;
  readonly generatedAt: string;
}

export interface OpsAuditQuerySession {
  readonly auditQuerySessionId: string;
  readonly openedBy: string;
  readonly filtersRef: string;
  readonly investigationScopeEnvelopeRef: string;
  readonly purposeOfUse: string;
  readonly actingContextRef: string;
  readonly coverageState: OpsTimelineState;
  readonly requiredEdgeCorrelationId: string;
  readonly requiredContinuityFrameRefs: readonly string[];
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly investigationQuestionHash: string;
  readonly missingJoinRefs: readonly string[];
  readonly causalityState: OpsCausalityState;
  readonly artifactPresentationContractRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly artifactFallbackDispositionRef: string;
  readonly outboundNavigationGrantPolicyRef: string;
  readonly timelineHash: string;
  readonly graphHash: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface OpsTimelineEvent {
  readonly eventRef: string;
  readonly eventTime: string;
  readonly sourceSequenceRef: string;
  readonly assuranceLedgerEntryId: string;
  readonly eventType: string;
  readonly settlementState: string;
  readonly graphMarker: "linked" | "missing_edge" | "orphan" | "superseded" | "blocked";
  readonly continuityFrameRef: string;
  readonly edgeCorrelationId: string;
  readonly summary: string;
  readonly selected: boolean;
}

export interface OpsEvidenceGraphMiniMap {
  readonly graphSnapshotRef: string;
  readonly graphHash: string;
  readonly completenessVerdictRef: string;
  readonly verdictState: OpsGraphVerdictState;
  readonly selectedEvidenceNodeRef: string;
  readonly requiredNodeCount: number;
  readonly missingNodeCount: number;
  readonly orphanNodeCount: number;
  readonly supersededCount: number;
  readonly dependentPackRefs: readonly string[];
  readonly dependentRetentionRefs: readonly string[];
  readonly dependentIncidentRefs: readonly string[];
  readonly exportBlockedRefs: readonly string[];
  readonly graphRows: readonly {
    readonly nodeRef: string;
    readonly role: string;
    readonly state: string;
    readonly linkSummary: string;
  }[];
}

export interface OpsBreakGlassReviewProjection {
  readonly breakGlassReviewRef: string;
  readonly reviewState:
    | "not_required"
    | "pending_review"
    | "in_review"
    | "awaiting_follow_up"
    | "expired"
    | "closed";
  readonly reasonAdequacy: "sufficient" | "insufficient" | "contradicted" | "not_required";
  readonly visibilityWideningSummary: string;
  readonly expiryBoundary: string;
  readonly followUpBurdenState:
    | "none"
    | "attestation_required"
    | "peer_review_required"
    | "governance_review_required";
  readonly queueState: string;
  readonly reviewerBurden: string;
  readonly authorizedVisibility: boolean;
}

export interface OpsSupportReplayBoundary {
  readonly supportReplaySessionRef: string;
  readonly targetJourneyRef: string;
  readonly evidenceSetHash: string;
  readonly replayDeterminismState: "exact" | "accepted_only" | "visibility_missing" | "blocked";
  readonly restoreEligibilityState: OpsRestoreEligibilityState;
  readonly restoreSettlementRef: string;
  readonly latestSettlementRef: string;
  readonly replayCheckpointHash: string;
  readonly maskScopeRef: string;
  readonly heldDraftDisposition: string;
  readonly boundarySummary: string;
}

export interface OpsDataSubjectTraceFilter {
  readonly dataSubjectTraceRef: string;
  readonly subjectRef: string;
  readonly actorRef: string;
  readonly entityRef: string;
  readonly timeWindow: string;
  readonly purposeOfUse: string;
  readonly maskingPolicyRef: string;
  readonly traceHash: string;
  readonly gapState: "none" | "visibility_gap" | "audit_gap" | "blocked";
  readonly resultCount: number;
}

export interface OpsInvestigationBundleExport {
  readonly artifactPresentationContractRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly artifactFallbackDispositionRef: string;
  readonly outboundNavigationGrantRef: string;
  readonly exportState: OpsInvestigationExportState;
  readonly summaryFirstPreview: string;
  readonly manifestHash: string;
  readonly redactionTransformHash: string;
  readonly blockedReasonRefs: readonly string[];
}

export interface OpsInvestigationDrawerSession {
  readonly drawerSessionId: string;
  readonly openedFromSurface: string;
  readonly sourceSliceEnvelopeRef: string;
  readonly sourceSnapshotRef: string;
  readonly sourceBoardTupleHash: string;
  readonly selectedEntityRef: string;
  readonly selectedEntityTupleHash: string;
  readonly continuityQuestionHash: string;
  readonly baseContinuityControlHealthProjectionRef: string;
  readonly baseOpsContinuityEvidenceSliceRef: string;
  readonly baseAssuranceSliceTrustRefs: readonly string[];
  readonly baseContinuitySetHash: string;
  readonly baseLatestSettlementOrRestoreRef: string;
  readonly returnContextFrameRef: string;
  readonly diffBaseRef: string;
  readonly observeOnlyReasonRef: string;
  readonly deltaState: OpsDrawerDeltaState;
  readonly lastDeltaComputedAt: string;
}

export interface OpsDrillContextAnchor452 {
  readonly opsDrillContextAnchorId: string;
  readonly sourceSurfaceRef: string;
  readonly selectedEntityRef: string;
  readonly selectedEntityTupleHash: string;
  readonly sourceRankOrdinal: number;
  readonly sourceScrollAnchorRef: string;
  readonly drillQuestionRef: string;
  readonly continuityQuestionHash: string;
  readonly investigationDrawerSessionRef: string;
  readonly returnFocusTargetRef: string;
  readonly boardStateSnapshotRef: string;
  readonly boardTupleHash: string;
  readonly selectionLeaseRef: string;
  readonly routeIntentRef: string;
  readonly returnTokenRef: string;
  readonly createdAt: string;
}

export interface OpsRestoreReport452 {
  readonly restoreReportRef: string;
  readonly restoreState: "exact" | "nearest_valid" | "read_only_diagnostic";
  readonly restoredFocusTargetRef: string;
  readonly restoredScrollAnchorRef: string;
  readonly downgradeReasonRefs: readonly string[];
  readonly summary: string;
}

export interface OpsInvestigationProjection {
  readonly taskId: typeof OPS_INVESTIGATION_TASK_ID;
  readonly schemaVersion: typeof OPS_INVESTIGATION_SCHEMA_VERSION;
  readonly scenarioState: OpsInvestigationScenarioState;
  readonly originLens: OpsInvestigationOriginLens;
  readonly route: "/ops/audit" | "/ops/:lens/investigations/:opsRouteIntentId";
  readonly selectedAnomalyRef: string;
  readonly selectedHealthCellRef: string;
  readonly boardScopeRef: typeof OPS_OVERVIEW_BOARD_SCOPE_REF;
  readonly timeHorizon: typeof OPS_OVERVIEW_TIME_HORIZON;
  readonly scopePolicyRef: typeof OPS_OVERVIEW_SCOPE_POLICY_REF;
  readonly shellContinuityKey: typeof OPS_OVERVIEW_SHELL_CONTINUITY_KEY;
  readonly boardStateDigestRef: string;
  readonly boardTupleHash: string;
  readonly investigationQuestion: string;
  readonly investigationQuestionHash: string;
  readonly preservedProofBasis: string;
  readonly newerProofDiffSummary: string;
  readonly scopeEnvelope: OpsInvestigationScopeEnvelope;
  readonly auditQuerySession: OpsAuditQuerySession;
  readonly timelineReconstruction: OpsInvestigationTimelineReconstruction;
  readonly timelineEvents: readonly OpsTimelineEvent[];
  readonly evidenceGraph: OpsEvidenceGraphMiniMap;
  readonly breakGlassReview: OpsBreakGlassReviewProjection;
  readonly supportReplayBoundary: OpsSupportReplayBoundary;
  readonly dataSubjectTrace: OpsDataSubjectTraceFilter;
  readonly bundleExport: OpsInvestigationBundleExport;
  readonly drawerSession: OpsInvestigationDrawerSession;
  readonly drillContextAnchor: OpsDrillContextAnchor452;
  readonly restoreReport: OpsRestoreReport452;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Record<"439" | "443" | "450" | "451", string>;
}

export const opsInvestigationScenarioStates = [
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
] as const satisfies readonly OpsInvestigationScenarioState[];

export const opsInvestigationAutomationAnchors = [
  "investigation-drawer",
  "investigation-question",
  "proof-basis",
  "timeline-ladder",
  "audit-explorer",
  "break-glass-review",
  "support-replay-boundary",
  "evidence-graph-mini-map",
  "safe-return-anchor",
] as const;

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9A",
  "blueprint/phase-9-the-assurance-ledger.md#9C",
  "blueprint/operations-console-frontend-blueprint.md#4.7-InvestigationDrawer",
  "blueprint/operations-console-frontend-blueprint.md#OpsReturnToken",
] as const;

const upstreamSchemaVersions = {
  "439": "439.phase9.investigation-timeline-service.v1",
  "443": "443.phase9.disposition-execution-engine.v1",
  "450": "450.phase9.ops-overview-route.v1",
  "451": "451.phase9.ops-allocation-route.v1",
} as const;

const anomalyQuestions: Readonly<Record<string, string>> = {
  "ops-route-07":
    "Which referral-confirmation proof chain justifies moving reviewers without rebasing the selected queue question?",
  "ops-route-04":
    "Which supplier acknowledgement and visibility receipts explain the protected outbound path boundary?",
  "ops-route-12":
    "What changed after the preserved support replay proof basis, and which continuity hash is still authoritative?",
  "ops-route-15":
    "Which release-freeze proof blocks automated relief while preserving the manual fallback package?",
  "ops-route-21":
    "Why is the partner acknowledgement watchpoint context-only despite a high point estimate?",
  "ops-route-pharmacy-2103":
    "Which urgent-return lineage reopened the original request, and which recovery proof prevents calm closure?",
};

const anomalyProofBasis: Readonly<Record<string, string>> = {
  "ops-route-07":
    "Queue rank snapshot, UI visibility receipt, and assurance ledger entries agree on the selected priority lane.",
  "ops-route-04":
    "Supplier watch tuple, outbound cache lag, and protected-path intervention guardrails share one edge correlation.",
  "ops-route-12":
    "Preserved support replay checkpoint and continuity evidence slice disagree only on the newest checkpoint hash.",
  "ops-route-15":
    "Release watch tuple, channel freeze record, and manual fallback package bind one blocked automation boundary.",
  "ops-route-21":
    "Partner acknowledgement trace is current, but sample support remains below promotion threshold.",
  "ops-route-pharmacy-2103":
    "Bounce-back truth, request anchor preservation, and pharmacy recovery settlement share one reopened lineage.",
};

function sanitizeRef(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function normalizeOpsInvestigationScenarioState(
  value: string | null | undefined,
): OpsInvestigationScenarioState {
  return normalizeOpsOverviewScenarioState(value);
}

function timelineStateForScenario(scenarioState: OpsInvestigationScenarioState): OpsTimelineState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "stale":
    case "degraded":
    case "quarantined":
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

function graphVerdictForScenario(
  scenarioState: OpsInvestigationScenarioState,
): OpsGraphVerdictState {
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
      return "complete";
  }
}

function drawerDeltaStateForScenario(
  scenarioState: OpsInvestigationScenarioState,
): OpsDrawerDeltaState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "quarantined":
    case "freeze":
      return "superseded";
    case "stale":
    case "degraded":
    case "settlement_pending":
      return "drifted";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "aligned";
  }
}

function causalityStateForScenario(
  scenarioState: OpsInvestigationScenarioState,
): OpsCausalityState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
    case "quarantined":
      return "blocked";
    case "stale":
      return "visibility_missing";
    case "degraded":
      return "accepted_only";
    case "freeze":
      return "audit_missing";
    case "settlement_pending":
      return "accepted_only";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "complete";
  }
}

function restoreEligibilityForScenario(
  scenarioState: OpsInvestigationScenarioState,
): OpsRestoreEligibilityState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "quarantined":
      return "read_only_recovery";
    case "stale":
    case "degraded":
      return "stale_reacquire";
    case "freeze":
      return "escalation_required";
    case "settlement_pending":
      return "awaiting_external_hold";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "restore_live";
  }
}

function exportStateForScenario(
  scenarioState: OpsInvestigationScenarioState,
  graphVerdictState: OpsGraphVerdictState,
): OpsInvestigationExportState {
  if (graphVerdictState === "blocked") {
    return "blocked";
  }
  if (scenarioState === "permission_denied") {
    return "blocked";
  }
  if (scenarioState === "stale" || scenarioState === "quarantined" || scenarioState === "freeze") {
    return "summary_only";
  }
  if (scenarioState === "degraded" || scenarioState === "settlement_pending") {
    return "redaction_review";
  }
  return "export_ready";
}

function createTimelineEvents(
  selectedAnomalyRef: string,
  scenarioState: OpsInvestigationScenarioState,
): readonly OpsTimelineEvent[] {
  const blocked = timelineStateForScenario(scenarioState) === "blocked";
  const stale = timelineStateForScenario(scenarioState) === "stale";
  const anomalyKey = sanitizeRef(selectedAnomalyRef);
  return [
    {
      eventRef: `ALE_452_${anomalyKey}_SOURCE`,
      eventTime: "2026-04-28T08:10:00Z",
      sourceSequenceRef: "seq-452-001",
      assuranceLedgerEntryId: `ledger-452-${selectedAnomalyRef}-001`,
      eventType: "source_event_accepted",
      settlementState: "accepted",
      graphMarker: "linked",
      continuityFrameRef: `OCF_452_${anomalyKey}`,
      edgeCorrelationId: `edge-452-${selectedAnomalyRef}`,
      summary:
        "Source event accepted into the WORM audit chain with the selected continuity frame.",
      selected: false,
    },
    {
      eventRef: `ALE_452_${anomalyKey}_VISIBILITY`,
      eventTime: "2026-04-28T08:12:00Z",
      sourceSequenceRef: "seq-452-002",
      assuranceLedgerEntryId: `ledger-452-${selectedAnomalyRef}-002`,
      eventType: "projection_visibility_receipt",
      settlementState: stale ? "visibility_review" : "visible",
      graphMarker: stale ? "missing_edge" : "linked",
      continuityFrameRef: `OCF_452_${anomalyKey}`,
      edgeCorrelationId: `edge-452-${selectedAnomalyRef}`,
      summary: stale
        ? "Visibility proof is preserved, but newer proof is shown as a diff against the base."
        : "The operator-visible projection receipt matches the preserved question.",
      selected: true,
    },
    {
      eventRef: `ALE_452_${anomalyKey}_AUDIT`,
      eventTime: "2026-04-28T08:17:00Z",
      sourceSequenceRef: "seq-452-003",
      assuranceLedgerEntryId: `ledger-452-${selectedAnomalyRef}-003`,
      eventType: "audit_record_joined",
      settlementState: blocked ? "blocked" : "joined",
      graphMarker: blocked ? "blocked" : "linked",
      continuityFrameRef: `OCF_452_${anomalyKey}`,
      edgeCorrelationId: `edge-452-${selectedAnomalyRef}`,
      summary: blocked
        ? "The audit join is blocked by scope or graph completeness; export stays unavailable."
        : "Audit record joins the same timeline hash used by replay and export.",
      selected: false,
    },
    {
      eventRef: `ALE_452_${anomalyKey}_SETTLEMENT`,
      eventTime: "2026-04-28T08:25:00Z",
      sourceSequenceRef: "seq-452-004",
      assuranceLedgerEntryId: `ledger-452-${selectedAnomalyRef}-004`,
      eventType: "command_or_restore_settlement",
      settlementState: scenarioState === "settlement_pending" ? "pending_effect" : "settled",
      graphMarker: scenarioState === "quarantined" ? "orphan" : "linked",
      continuityFrameRef: `OCF_452_${anomalyKey}`,
      edgeCorrelationId: `edge-452-${selectedAnomalyRef}`,
      summary:
        scenarioState === "settlement_pending"
          ? "Authoritative settlement is pending; the drawer preserves the base proof without claiming completion."
          : "Settlement evidence remains tied to the selected anchor and return token.",
      selected: false,
    },
  ];
}

export function createOpsInvestigationProjection(
  originLens: OpsInvestigationOriginLens,
  scenarioStateInput: OpsInvestigationScenarioState | string | null | undefined = "normal",
  selectedAnomalyRef: string = "ops-route-07",
  selectedHealthCellRef: string = "svc_confirmation",
): OpsInvestigationProjection {
  const scenarioState = normalizeOpsInvestigationScenarioState(scenarioStateInput);
  const timelineState = timelineStateForScenario(scenarioState);
  const graphVerdictState = graphVerdictForScenario(scenarioState);
  const drawerDeltaState = drawerDeltaStateForScenario(scenarioState);
  const causalityState = causalityStateForScenario(scenarioState);
  const restoreEligibilityState = restoreEligibilityForScenario(scenarioState);
  const exportState = exportStateForScenario(scenarioState, graphVerdictState);
  const key = sanitizeRef(`${originLens}_${scenarioState}_${selectedAnomalyRef}`);
  const question =
    anomalyQuestions[selectedAnomalyRef] ??
    "Which proof basis explains the selected operational question without widening scope?";
  const preservedProofBasis =
    anomalyProofBasis[selectedAnomalyRef] ??
    "Selected anchor, audit query, timeline reconstruction, and graph verdict share one scope hash.";
  const investigationQuestionHash = `iqh-452-${originLens}-${selectedAnomalyRef}`;
  const scopeHash = `scopehash-452-${originLens}-${selectedAnomalyRef}-${scenarioState}`;
  const timelineHash = `timelinehash-452-${originLens}-${selectedAnomalyRef}-${scenarioState}`;
  const graphHash = `graphhash-452-${originLens}-${selectedAnomalyRef}-${scenarioState}`;
  const boardStateDigestRef = `OISD_452_${key}`;
  const boardTupleHash = `ops-investigation-tuple-452-${originLens}-${scenarioState}-${selectedAnomalyRef}`;
  const selectedAnchorTupleHashRef = `selected-anchor-tuple-452-${selectedAnomalyRef}-${selectedHealthCellRef}`;
  const originRouteIntentRef = `ORI_452_${sanitizeRef(originLens)}_${sanitizeRef(selectedAnomalyRef)}`;
  const originOpsReturnTokenRef = `ORT_${sanitizeRef(selectedAnomalyRef)}`;
  const scopeEnvelopeRef = `ISE_452_${key}`;
  const timelineRef = `ITR_452_${key}`;
  const graphVerdictRef = `AGCV_452_${key}`;
  const breakGlassReviewRef = `BGR_452_${key}`;
  const auditQuerySessionRef = `AQS_452_${key}`;
  const dataSubjectTraceRef = `DST_452_${key}`;
  const sourceSliceEnvelopeRef = `OSE_452_${sanitizeRef(selectedAnomalyRef)}`;
  const drawerSessionRef = `IDS_452_${key}`;
  const timelineEvents = createTimelineEvents(selectedAnomalyRef, scenarioState);
  const missingNodeCount =
    graphVerdictState === "complete" ? 0 : graphVerdictState === "stale" ? 1 : 3;
  const orphanNodeCount =
    scenarioState === "quarantined" ? 2 : graphVerdictState === "blocked" ? 1 : 0;
  const supersededCount =
    drawerDeltaState === "superseded" ? 2 : drawerDeltaState === "drifted" ? 1 : 0;
  const blockedReasonRefs =
    exportState === "export_ready"
      ? []
      : [
          graphVerdictState === "blocked" ? "graph:blocked" : "graph:stale",
          causalityState === "complete" ? "redaction:review" : `causality:${causalityState}`,
        ];

  return {
    taskId: OPS_INVESTIGATION_TASK_ID,
    schemaVersion: OPS_INVESTIGATION_SCHEMA_VERSION,
    scenarioState,
    originLens,
    route: originLens === "audit" ? "/ops/audit" : "/ops/:lens/investigations/:opsRouteIntentId",
    selectedAnomalyRef,
    selectedHealthCellRef,
    boardScopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    scopePolicyRef: OPS_OVERVIEW_SCOPE_POLICY_REF,
    shellContinuityKey: OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
    boardStateDigestRef,
    boardTupleHash,
    investigationQuestion: question,
    investigationQuestionHash,
    preservedProofBasis,
    newerProofDiffSummary:
      drawerDeltaState === "aligned"
        ? "No newer proof changes the preserved continuity question."
        : `Newer proof is ${drawerDeltaState}; the drawer keeps ${investigationQuestionHash} as the base and shows drift separately.`,
    scopeEnvelope: {
      investigationScopeEnvelopeId: scopeEnvelopeRef,
      originAudienceSurface: "operations-console",
      originRouteIntentRef,
      originOpsReturnTokenRef,
      purposeOfUse: "operations_investigation",
      actingContextRef:
        scenarioState === "permission_denied"
          ? "acting-context:insufficient"
          : "acting-context:ops-duty",
      maskingPolicyRef: "masking-policy:min-necessary-investigation",
      disclosureCeilingRef:
        scenarioState === "permission_denied" ? "disclosure:none" : "disclosure:operations",
      visibilityCoverageRefs: ["visibility:ops-summary", "visibility:audit-hash-only"],
      scopeEntityRefs: [selectedAnomalyRef, selectedHealthCellRef],
      selectedAnchorRef: selectedAnomalyRef,
      selectedAnchorTupleHashRef,
      investigationQuestionHash,
      requiredBreakGlassReviewRef: breakGlassReviewRef,
      requiredSupportLineageBindingRef: `SLB_452_${key}`,
      scopeHash,
      issuedAt: "2026-04-28T09:00:00Z",
      expiresAt: "2026-04-28T10:00:00Z",
    },
    auditQuerySession: {
      auditQuerySessionId: auditQuerySessionRef,
      openedBy: "ops-duty-lead",
      filtersRef: `filters-452-${originLens}-${selectedAnomalyRef}`,
      investigationScopeEnvelopeRef: scopeEnvelopeRef,
      purposeOfUse: "operations_investigation",
      actingContextRef:
        scenarioState === "permission_denied"
          ? "acting-context:insufficient"
          : "acting-context:ops-duty",
      coverageState: timelineState,
      requiredEdgeCorrelationId: `edge-452-${selectedAnomalyRef}`,
      requiredContinuityFrameRefs: [`OCF_452_${sanitizeRef(selectedAnomalyRef)}`],
      selectedAnchorRef: selectedAnomalyRef,
      selectedAnchorTupleHashRef,
      investigationQuestionHash,
      missingJoinRefs:
        causalityState === "complete"
          ? []
          : [`missing-join:${causalityState}:${selectedAnomalyRef}`],
      causalityState,
      artifactPresentationContractRef: `APC_452_${key}`,
      artifactTransferSettlementRef: `ATS_452_${key}`,
      artifactFallbackDispositionRef: `AFD_452_${key}`,
      outboundNavigationGrantPolicyRef: `ONG_452_${key}`,
      timelineHash,
      graphHash,
      createdAt: "2026-04-28T09:01:00Z",
      expiresAt: "2026-04-28T10:01:00Z",
    },
    timelineReconstruction: {
      investigationTimelineReconstructionId: timelineRef,
      investigationScopeEnvelopeRef: scopeEnvelopeRef,
      assuranceEvidenceGraphSnapshotRef: `AEGS_452_${key}`,
      assuranceGraphCompletenessVerdictRef: graphVerdictRef,
      dataSubjectTraceRef,
      baseLedgerWatermarkRef: `ledger-watermark-452-${originLens}`,
      sourceEventRefs: timelineEvents.map((event) => event.eventRef),
      normalizationVersionRef: "normalization:phase9-audit-v1",
      reconstructionInputHash: `inputhash-452-${originLens}-${selectedAnomalyRef}`,
      timelineHash,
      graphHash,
      timelineState,
      generatedAt: "2026-04-28T09:02:00Z",
    },
    timelineEvents,
    evidenceGraph: {
      graphSnapshotRef: `AEGS_452_${key}`,
      graphHash,
      completenessVerdictRef: graphVerdictRef,
      verdictState: graphVerdictState,
      selectedEvidenceNodeRef:
        timelineEvents.find((event) => event.selected)?.eventRef ?? timelineEvents[0]!.eventRef,
      requiredNodeCount: 8,
      missingNodeCount,
      orphanNodeCount,
      supersededCount,
      dependentPackRefs: ["assurance-pack:monthly-ops", "audit-bundle:investigation-summary"],
      dependentRetentionRefs: ["retention:worm-ledger", "retention:investigation-bundle"],
      dependentIncidentRefs:
        selectedAnomalyRef === "ops-route-15" ? ["incident:release-freeze"] : [],
      exportBlockedRefs: blockedReasonRefs,
      graphRows: [
        {
          nodeRef: `AEGS_452_${key}`,
          role: "Graph snapshot",
          state: graphVerdictState,
          linkSummary: "Single admissibility graph for drawer, replay, audit, and export.",
        },
        {
          nodeRef: graphVerdictRef,
          role: "Completeness verdict",
          state: graphVerdictState,
          linkSummary: `${missingNodeCount} missing, ${orphanNodeCount} orphan, ${supersededCount} superseded.`,
        },
        {
          nodeRef: timelineRef,
          role: "Timeline reconstruction",
          state: timelineState,
          linkSummary:
            "Timeline hash is shared by audit, support replay, diff, and bundle preview.",
        },
      ],
    },
    breakGlassReview: {
      breakGlassReviewRef,
      reviewState:
        scenarioState === "permission_denied"
          ? "expired"
          : scenarioState === "blocked" || scenarioState === "quarantined"
            ? "pending_review"
            : selectedAnomalyRef === "ops-route-pharmacy-2103"
              ? "in_review"
              : "not_required",
      reasonAdequacy:
        scenarioState === "permission_denied"
          ? "insufficient"
          : scenarioState === "blocked"
            ? "contradicted"
            : selectedAnomalyRef === "ops-route-pharmacy-2103"
              ? "sufficient"
              : "not_required",
      visibilityWideningSummary:
        scenarioState === "permission_denied"
          ? "No widened visibility is available to this operator."
          : "Visibility remains minimum-necessary; break-glass rows show hashes and expiry only.",
      expiryBoundary: scenarioState === "permission_denied" ? "expired" : "2026-04-28T10:00:00Z",
      followUpBurdenState:
        scenarioState === "blocked" || selectedAnomalyRef === "ops-route-pharmacy-2103"
          ? "peer_review_required"
          : "none",
      queueState:
        scenarioState === "permission_denied"
          ? "expired"
          : scenarioState === "blocked"
            ? "pending_review"
            : "closed",
      reviewerBurden:
        scenarioState === "blocked"
          ? "Reviewer must reconcile visibility widening before export or replay exit."
          : "No extra reviewer burden beyond the current scope envelope.",
      authorizedVisibility: scenarioState !== "permission_denied",
    },
    supportReplayBoundary: {
      supportReplaySessionRef: `SRS_452_${key}`,
      targetJourneyRef: `journey:${selectedAnomalyRef}`,
      evidenceSetHash: `evidence-set-452-${originLens}-${selectedAnomalyRef}`,
      replayDeterminismState:
        causalityState === "complete"
          ? "exact"
          : causalityState === "blocked"
            ? "blocked"
            : causalityState === "accepted_only"
              ? "accepted_only"
              : "visibility_missing",
      restoreEligibilityState,
      restoreSettlementRef: `SRS_SETTLEMENT_452_${key}`,
      latestSettlementRef:
        scenarioState === "settlement_pending"
          ? "settlement:pending-effect"
          : "settlement:latest-authoritative",
      replayCheckpointHash: `replay-checkpoint-452-${originLens}-${selectedAnomalyRef}`,
      maskScopeRef: "mask-scope:min-necessary",
      heldDraftDisposition:
        restoreEligibilityState === "restore_live" ? "none" : "held until proof revalidates",
      boundarySummary:
        restoreEligibilityState === "restore_live"
          ? "Replay can return to live support only through the bound settlement and checkpoint hash."
          : `Replay exit is ${restoreEligibilityState.replace(/_/g, " ")} until continuity and graph proof recover.`,
    },
    dataSubjectTrace: {
      dataSubjectTraceRef,
      subjectRef: "subject:hash-demo",
      actorRef: "actor:ops-duty-lead",
      entityRef: selectedAnomalyRef,
      timeWindow: "2026-04-28T08:00:00Z/PT2H",
      purposeOfUse: "operations_investigation",
      maskingPolicyRef: "masking-policy:min-necessary-investigation",
      traceHash: `tracehash-452-${originLens}-${selectedAnomalyRef}`,
      gapState:
        causalityState === "complete"
          ? "none"
          : causalityState === "blocked"
            ? "blocked"
            : causalityState === "audit_missing"
              ? "audit_gap"
              : "visibility_gap",
      resultCount: timelineEvents.length,
    },
    bundleExport: {
      artifactPresentationContractRef: `APC_452_${key}`,
      artifactTransferSettlementRef: `ATS_452_${key}`,
      artifactFallbackDispositionRef: `AFD_452_${key}`,
      outboundNavigationGrantRef: `ONG_452_${key}`,
      exportState,
      summaryFirstPreview:
        exportState === "export_ready"
          ? "Investigation bundle preview is summary-first, hash-bound, redacted, and ready for governed export."
          : "Investigation bundle preview remains visible, but transfer is held until graph, redaction, and scope posture recover.",
      manifestHash: `manifesthash-452-${originLens}-${selectedAnomalyRef}-${scenarioState}`,
      redactionTransformHash: `redactionhash-452-${originLens}-${scenarioState}`,
      blockedReasonRefs,
    },
    drawerSession: {
      drawerSessionId: drawerSessionRef,
      openedFromSurface: originLens === "audit" ? "audit-explorer" : "operations-board",
      sourceSliceEnvelopeRef,
      sourceSnapshotRef: `OBS_452_${key}`,
      sourceBoardTupleHash: boardTupleHash,
      selectedEntityRef: selectedAnomalyRef,
      selectedEntityTupleHash: selectedAnchorTupleHashRef,
      continuityQuestionHash: investigationQuestionHash,
      baseContinuityControlHealthProjectionRef: `CCHP_452_${sanitizeRef(selectedAnomalyRef)}`,
      baseOpsContinuityEvidenceSliceRef: `OCES_452_${sanitizeRef(selectedAnomalyRef)}`,
      baseAssuranceSliceTrustRefs: ["ASTR_452_AUDIT", "ASTR_452_VISIBILITY"],
      baseContinuitySetHash: `continuity-set-452-${selectedAnomalyRef}`,
      baseLatestSettlementOrRestoreRef: `settlement-base-452-${selectedAnomalyRef}`,
      returnContextFrameRef: `OCF_RETURN_452_${key}`,
      diffBaseRef: timelineHash,
      observeOnlyReasonRef:
        drawerDeltaState === "aligned" ? "none" : `observe-only:${drawerDeltaState}`,
      deltaState: drawerDeltaState,
      lastDeltaComputedAt: "2026-04-28T09:05:00Z",
    },
    drillContextAnchor: {
      opsDrillContextAnchorId: `ODCA_452_${key}`,
      sourceSurfaceRef: originLens === "audit" ? "audit-explorer" : "bottleneck-radar",
      selectedEntityRef: selectedAnomalyRef,
      selectedEntityTupleHash: selectedAnchorTupleHashRef,
      sourceRankOrdinal: selectedAnomalyRef === "ops-route-21" ? 5 : 1,
      sourceScrollAnchorRef: originLens === "audit" ? "audit-explorer" : "bottleneck-radar",
      drillQuestionRef: investigationQuestionHash,
      continuityQuestionHash: investigationQuestionHash,
      investigationDrawerSessionRef: drawerSessionRef,
      returnFocusTargetRef:
        originLens === "audit" ? "ops-focus-restore-marker" : selectedAnomalyRef,
      boardStateSnapshotRef: `OBS_452_${key}`,
      boardTupleHash,
      selectionLeaseRef: `OSL_${sanitizeRef(selectedAnomalyRef)}`,
      routeIntentRef: originRouteIntentRef,
      returnTokenRef: originOpsReturnTokenRef,
      createdAt: "2026-04-28T09:00:00Z",
    },
    restoreReport: {
      restoreReportRef: `ORR_452_${key}`,
      restoreState:
        drawerDeltaState === "aligned"
          ? "exact"
          : drawerDeltaState === "blocked"
            ? "read_only_diagnostic"
            : "nearest_valid",
      restoredFocusTargetRef:
        originLens === "audit" ? "ops-focus-restore-marker" : selectedAnomalyRef,
      restoredScrollAnchorRef: originLens === "audit" ? "audit-explorer" : "bottleneck-radar",
      downgradeReasonRefs:
        drawerDeltaState === "aligned" ? [] : [`drawer-delta:${drawerDeltaState}`],
      summary:
        drawerDeltaState === "aligned"
          ? "Safe return restores the same selected anchor, scope, timeline hash, and graph verdict."
          : "Safe return preserves the original question and restores the nearest valid read-only board posture.",
    },
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
  };
}

export function createOpsInvestigationFixture() {
  const origins = ["overview", "queues", "audit"] as const;
  const scenarioProjections = Object.fromEntries(
    origins.map((originLens) => [
      originLens,
      Object.fromEntries(
        opsInvestigationScenarioStates.map((scenarioState) => [
          scenarioState,
          createOpsInvestigationProjection(originLens, scenarioState),
        ]),
      ),
    ]),
  ) as Record<
    (typeof origins)[number],
    Record<OpsInvestigationScenarioState, OpsInvestigationProjection>
  >;

  return {
    taskId: OPS_INVESTIGATION_TASK_ID,
    schemaVersion: OPS_INVESTIGATION_SCHEMA_VERSION,
    routes: [
      "/ops/overview/investigations/:opsRouteIntentId",
      "/ops/queues/investigations/:opsRouteIntentId",
      "/ops/audit",
    ] as const,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: opsInvestigationAutomationAnchors,
    scenarioProjections,
  };
}
