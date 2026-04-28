import React, { startTransition, useEffect, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  resolveAutomationAnchorProfile,
} from "@vecells/persistent-shell";
import {
  createBackupRestoreChannelRegistryProjection,
  createLivePhase9ProjectionGatewayProjection,
  createOperationalDestinationRegistryProjection,
  createSecurityComplianceExportRegistryProjection,
  applyPhase9LiveProjectionFixture,
  normalizeBackupRestoreScenarioState,
  normalizePhase9LiveGatewayScenarioState,
  normalizeOperationalDestinationScenarioState,
  normalizeSecurityComplianceExportScenarioState,
  phase9LiveSurfaceCodeForPath,
  type BackupRestoreChannelRegistryProjection,
  type ExportDestinationClass,
  type LivePhase9ProjectionGatewayProjection,
  type OperationalDestinationRegistryProjection,
  type Phase9LiveGatewayScenarioState,
  type SecurityComplianceExportRegistryProjection,
} from "../../../packages/domains/operations/src/index";
import {
  OPS_DEFAULT_PATH,
  closeOpsGovernanceHandoff,
  createInitialOpsShellState,
  navigateOpsShell,
  openOpsGovernanceHandoff,
  opsAnomalyMatrixRows,
  opsLensOrder,
  resolveOpsBoardSnapshot,
  returnFromOpsChildRoute,
  rootPathForOpsLens,
  selectOpsAnomaly,
  selectOpsHealthCell,
  setOpsDeltaGateState,
  type OpsAnomaly,
  type OpsBoardFrameMode,
  type OpsBoardStateSnapshot,
  type OpsDeltaGateState,
  type OpsLens,
  type OpsShellState,
} from "./operations-shell-seed.model";
import { createOpsAssuranceProjection } from "./operations-assurance-phase9.model";
import {
  createComplianceLedgerProjection,
  normalizeComplianceLedgerScenarioState,
  type ComplianceLedgerProjection,
  type GapQueueFilterKey,
  type GapQueueSortKey,
} from "./compliance-ledger-phase9.model";
import {
  createCrossPhaseConformanceScorecardProjection,
  normalizeConformanceScorecardScenarioState,
  type ConformanceBlockerFilterKey,
  type ConformanceOwnerKey,
  type ConformanceScorecardScenarioState,
  type ConformanceStateFilterKey,
  type CrossPhaseConformanceScorecardProjection,
  type ProofDimensionKey,
} from "./conformance-scorecard-phase9.model";
import {
  createPhase9ExitGateStatusProjection,
  normalizePhase9ExitGateScenarioState,
  type Phase9ExitGateStatusProjection,
} from "./phase9-exit-gate-status.model";
import {
  createPhase7ChannelReconciliation473Projection,
  normalizePhase7ChannelScenarioState,
  type Phase7ChannelReconciliation473Projection,
  type Phase7ChannelScenarioState,
} from "./phase7-channel-reconciliation-473.model";
import {
  createMigrationCutover474Projection,
  normalizeMigrationCutover474ScenarioState,
  type MigrationCutover474Projection,
  type MigrationCutover474ScenarioState,
} from "./migration-cutover-474.model";
import {
  createTrainingRunbook475Projection,
  normalizeTrainingRunbook475RoleId,
  normalizeTrainingRunbook475ScenarioState,
  type TrainingRunbook475Projection,
  type TrainingRunbook475RoleId,
  type TrainingRunbook475ScenarioState,
} from "./training-runbook-centre-475.model";
import {
  createReleaseWave476Projection,
  normalizeReleaseWave476ScenarioState,
  normalizeReleaseWave476WaveId,
  type ReleaseWave476Projection,
  type ReleaseWave476ScenarioState,
} from "./release-wave-planner-476.model";
import {
  createDependencyReadiness478Projection,
  normalizeDependencyReadiness478DependencyId,
  normalizeDependencyReadiness478ScenarioState,
  type DependencyReadiness478DependencyCard,
  type DependencyReadiness478Projection,
  type DependencyReadiness478ScenarioState,
} from "./dependency-readiness-board-478.model";
import {
  createProgrammeConformance472Projection,
  normalizeProgrammeConformance472ScenarioState,
  type ProgrammeConformance472ScenarioState,
  type ProgrammeConformance472Projection,
} from "./programme-conformance-472.model";
import {
  createOpsIncidentsProjection,
  type OpsContainmentActionState,
  type OpsIncidentQueueFilter,
  type OpsIncidentReportabilityDecision,
  type OpsPostIncidentReviewState,
} from "./operations-incidents-phase9.model";
import { normalizeOpsOverviewScenarioState } from "./operations-overview-phase9.model";

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function lensLabel(lens: OpsLens): string {
  switch (lens) {
    case "overview":
      return "Overview";
    case "queues":
      return "Queues";
    case "capacity":
      return "Capacity";
    case "dependencies":
      return "Dependencies";
    case "audit":
      return "Audit";
    case "assurance":
      return "Assurance";
    case "conformance":
      return "Conformance";
    case "incidents":
      return "Incidents";
    case "resilience":
      return "Resilience";
  }
}

function deltaGateTone(deltaGateState: OpsDeltaGateState): string {
  switch (deltaGateState) {
    case "live":
      return "info";
    case "buffered":
      return "caution";
    case "stale":
      return "critical";
    case "table_only":
      return "neutral";
  }
}

function severityTone(severity: OpsAnomaly["severity"]): string {
  switch (severity) {
    case "critical":
      return "critical";
    case "caution":
      return "caution";
    case "watch":
      return "info";
  }
}

function workbenchTone(snapshot: OpsBoardStateSnapshot): string {
  switch (snapshot.workbenchState) {
    case "live":
      return "ready";
    case "buffered_hold":
      return "guarded";
    case "observe_only":
      return "observe";
    case "frozen":
      return "frozen";
  }
}

function healthTone(state: OpsBoardStateSnapshot["selectedHealthCell"]["state"]): string {
  switch (state) {
    case "healthy":
      return "healthy";
    case "degraded_but_operating":
      return "degraded";
    case "fallback_active":
      return "fallback";
    case "blocked":
      return "blocked";
    case "unknown_or_stale":
      return "stale";
  }
}

function eligibilityTone(
  state: OpsBoardStateSnapshot["allocationProjection"]["actionEligibilityFence"]["eligibilityState"],
): string {
  switch (state) {
    case "executable":
      return "ready";
    case "handoff_required":
      return "handoff";
    case "blocked":
      return "blocked";
    case "stale_reacquire":
      return "stale";
    case "read_only_recovery":
      return "recovery";
    case "observe_only":
    default:
      return "observe";
  }
}

function investigationTone(
  state:
    | OpsBoardStateSnapshot["investigationProjection"]["evidenceGraph"]["verdictState"]
    | OpsBoardStateSnapshot["investigationProjection"]["timelineReconstruction"]["timelineState"]
    | OpsBoardStateSnapshot["investigationProjection"]["bundleExport"]["exportState"]
    | OpsBoardStateSnapshot["investigationProjection"]["drawerSession"]["deltaState"],
): string {
  switch (state) {
    case "complete":
    case "exact":
    case "export_ready":
    case "aligned":
      return "ready";
    case "stale":
    case "summary_only":
    case "redaction_review":
    case "drifted":
    case "superseded":
      return "guarded";
    case "blocked":
    default:
      return "blocked";
  }
}

function resilienceTone(
  state:
    | OpsBoardStateSnapshot["resilienceProjection"]["runtimeBinding"]["bindingState"]
    | OpsBoardStateSnapshot["resilienceProjection"]["recoveryControlPosture"]["postureState"]
    | OpsBoardStateSnapshot["resilienceProjection"]["readinessSnapshot"]["readinessState"]
    | OpsBoardStateSnapshot["resilienceProjection"]["runTimeline"]["timelineState"]
    | OpsBoardStateSnapshot["resilienceProjection"]["artifactStage"]["artifactState"]
    | OpsBoardStateSnapshot["resilienceProjection"]["latestSettlement"]["result"],
): string {
  switch (state) {
    case "live":
    case "live_control":
    case "ready":
    case "exact":
    case "external_handoff_ready":
    case "applied":
      return "ready";
    case "diagnostic_only":
    case "recovery_only":
    case "governed_recovery":
    case "constrained":
    case "stale":
    case "governed_preview":
    case "accepted_pending_evidence":
    case "frozen":
    case "stale_scope":
      return "guarded";
    case "blocked":
    case "summary_only":
    case "blocked_publication":
    case "blocked_trust":
    case "blocked_readiness":
    case "blocked_guardrail":
    case "failed":
    case "superseded":
    default:
      return "blocked";
  }
}

function assuranceTone(state: string): string {
  switch (state) {
    case "live":
    case "live_export":
    case "trusted":
    case "complete":
    case "current":
    case "export_ready":
    case "external_handoff_ready":
    case "exact":
    case "approved":
    case "satisfied":
    case "exact_after_correction":
    case "corrected":
    case "permitted_explicit":
    case "ready_for_bau_handoff":
    case "ready_to_reconcile":
      return "ready";
    case "diagnostic_only":
    case "attestation_required":
    case "degraded":
    case "partial":
    case "stale":
    case "pending_attestation":
    case "governed_preview":
    case "drifted":
    case "deferred_scope":
    case "deferred":
    case "not_applicable":
    case "blocked_original_claim_visible":
      return "guarded";
    case "recovery_only":
      return "observe";
    default:
      return "blocked";
  }
}

function incidentTone(
  state:
    | OpsIncidentReportabilityDecision
    | OpsContainmentActionState
    | OpsPostIncidentReviewState
    | string,
): string {
  switch (state) {
    case "reported":
    case "acknowledged":
    case "applied":
    case "complete":
    case "ready_for_closure":
    case "external_handoff_ready":
    case "live":
    case "live_control":
      return "ready";
    case "reportable_pending_submission":
    case "needs_senior_review":
    case "pending":
    case "open":
    case "not_started":
    case "diagnostic_only":
    case "governed_preview":
    case "governed_recovery":
    case "revalidation_required":
    case "superseded":
      return "guarded";
    case "not_reportable":
    case "not_applicable":
      return "observe";
    case "insufficient_facts_blocked":
    case "failed":
    case "blocked":
    case "summary_only":
    default:
      return "blocked";
  }
}

function automationId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function scoreWidth(value: number): string {
  return `${Math.max(4, Math.min(100, value))}%`;
}

function Sparkline(props: { values: readonly number[]; label: string }) {
  const maxValue = Math.max(1, ...props.values);
  return (
    <span className="ops-sparkline" aria-label={props.label}>
      {props.values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="ops-sparkline__bar"
          style={{ height: `${Math.max(18, (value / maxValue) * 100)}%` }}
        />
      ))}
    </span>
  );
}

function artifactModeForSnapshot(snapshot: OpsBoardStateSnapshot): string {
  switch (snapshot.visualizationMode) {
    case "chart_plus_table":
      return "interactive_live";
    case "summary_only":
      return "summary_only";
    case "table_only":
      return "table_only";
  }
}

function visualizationAuthorityForSnapshot(
  snapshot: OpsBoardStateSnapshot,
): "visual_table_summary" | "table_only" | "summary_only" {
  switch (snapshot.visualizationMode) {
    case "chart_plus_table":
      return "visual_table_summary";
    case "summary_only":
      return "summary_only";
    case "table_only":
      return "table_only";
  }
}

function recoveryPostureForSnapshot(
  snapshot: OpsBoardStateSnapshot,
): "live" | "read_only" | "recovery_only" | "blocked" {
  if (snapshot.deltaGate.gateState === "stale") {
    return "recovery_only";
  }
  if (snapshot.deltaGate.blockedMutation) {
    return "read_only";
  }
  return "live";
}

function routeShellPostureForSnapshot(
  snapshot: OpsBoardStateSnapshot,
): "live" | "read_only" | "recovery_only" | "blocked" {
  if (snapshot.deltaGate.gateState === "stale") {
    return "recovery_only";
  }
  if (snapshot.deltaGate.blockedMutation) {
    return "read_only";
  }
  return "live";
}

function frameClass(frameMode: OpsBoardFrameMode): string {
  switch (frameMode) {
    case "two_plane":
      return "ops-shell ops-shell--two-plane";
    case "three_plane":
      return "ops-shell ops-shell--three-plane";
    case "mission_stack":
      return "ops-shell ops-shell--mission-stack";
  }
}

interface OpsSafeReturnFocusTarget {
  pathname: string;
  selectedAnomalyId: string;
  selectedHealthCellRef: string;
}

function focusOpsSafeReturnTarget(target: OpsSafeReturnFocusTarget) {
  if (typeof window === "undefined") {
    return;
  }
  let attempts = 0;
  const focusTarget = () => {
    const anomalyTarget = document.querySelector<HTMLElement>(
      `[data-surface="bottleneck-radar-row"][data-entity-ref="${target.selectedAnomalyId}"]`,
    );
    const healthTarget = document.querySelector<HTMLElement>(
      `[data-surface="ops-health-cell"][data-entity-ref="${target.selectedHealthCellRef}"]`,
    );
    const fallbackTarget = document.querySelector<HTMLElement>(
      "[data-testid='ops-focus-restore-marker']",
    );
    const focusTargetElement = anomalyTarget ?? healthTarget ?? fallbackTarget;
    if (focusTargetElement) {
      focusTargetElement.focus();
      return;
    }
    attempts += 1;
    if (attempts < 12) {
      window.requestAnimationFrame(focusTarget);
    }
  };
  window.requestAnimationFrame(focusTarget);
}

function VisualizationPanel(props: {
  title: string;
  summary: string;
  trustLabel: string;
  freshnessLabel: string;
  visualizationMode: OpsBoardStateSnapshot["visualizationMode"];
  dataTestId: string;
  dataSurface?: string;
  visual: React.ReactNode;
  table: React.ReactNode;
}) {
  return (
    <section
      className="ops-panel"
      data-testid={props.dataTestId}
      data-surface={props.dataSurface}
      data-parity-mode={props.visualizationMode}
      aria-label={props.title}
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">{props.title}</p>
          <h3>{props.title}</h3>
        </div>
        <div className="ops-panel__meta">
          <span>{props.trustLabel}</span>
          <span>{props.freshnessLabel}</span>
        </div>
      </header>
      <p className="ops-panel__summary">{props.summary}</p>
      {props.visualizationMode === "summary_only" ? (
        <div className="ops-panel__placeholder" data-testid={`${props.dataTestId}-summary-only`}>
          <strong>Summary-only posture</strong>
          <span>The shell keeps the explanation visible while richer visuals stay frozen.</span>
        </div>
      ) : props.visualizationMode === "table_only" ? null : (
        <div className="ops-panel__visual">{props.visual}</div>
      )}
      <div className="ops-panel__table">{props.table}</div>
    </section>
  );
}

function TimelineLadder(props: { snapshot: OpsBoardStateSnapshot }) {
  const investigation = props.snapshot.investigationProjection;
  return (
    <section
      className="ops-investigation-surface"
      data-testid="timeline-ladder"
      data-surface="timeline-ladder"
      data-timeline-state={investigation.timelineReconstruction.timelineState}
      aria-label="Timeline ladder"
    >
      <header className="ops-investigation-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Timeline ladder</p>
          <h3>{titleCase(investigation.timelineReconstruction.timelineState)} reconstruction</h3>
        </div>
        <span data-tone={investigationTone(investigation.timelineReconstruction.timelineState)}>
          {investigation.timelineReconstruction.timelineHash}
        </span>
      </header>
      <ol className="ops-timeline-ladder">
        {investigation.timelineEvents.map((event) => (
          <li
            key={event.eventRef}
            data-selected={event.selected}
            data-graph-marker={event.graphMarker}
          >
            <time>{event.eventTime}</time>
            <strong>{titleCase(event.eventType)}</strong>
            <span>
              {event.settlementState} / {event.graphMarker}
            </span>
            <p>{event.summary}</p>
          </li>
        ))}
      </ol>
      <div className="ops-panel__table">
        <table className="ops-table">
          <caption>Timeline ladder fallback</caption>
          <thead>
            <tr>
              <th scope="col">Event time</th>
              <th scope="col">Event</th>
              <th scope="col">Settlement</th>
              <th scope="col">Graph marker</th>
              <th scope="col">Continuity frame</th>
              <th scope="col">Summary</th>
            </tr>
          </thead>
          <tbody>
            {investigation.timelineEvents.map((event) => (
              <tr key={event.eventRef} data-selected={event.selected}>
                <td>{event.eventTime}</td>
                <td>{titleCase(event.eventType)}</td>
                <td>{event.settlementState}</td>
                <td>{event.graphMarker}</td>
                <td>{event.continuityFrameRef}</td>
                <td>{event.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvestigationEvidenceGraphMiniMap(props: { snapshot: OpsBoardStateSnapshot }) {
  const graph = props.snapshot.investigationProjection.evidenceGraph;
  return (
    <section
      className="ops-investigation-surface"
      data-testid="evidence-graph-mini-map"
      data-surface="evidence-graph-mini-map"
      data-graph-verdict={graph.verdictState}
      aria-label="Evidence graph mini-map"
    >
      <header className="ops-investigation-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Evidence graph</p>
          <h3>{titleCase(graph.verdictState)} graph verdict</h3>
        </div>
        <span data-tone={investigationTone(graph.verdictState)}>
          {graph.completenessVerdictRef}
        </span>
      </header>
      <div className="ops-graph-minimap" aria-label="Graph completeness summary">
        <div>
          <strong>{graph.requiredNodeCount}</strong>
          <span>required</span>
        </div>
        <div>
          <strong>{graph.missingNodeCount}</strong>
          <span>missing</span>
        </div>
        <div>
          <strong>{graph.orphanNodeCount}</strong>
          <span>orphan</span>
        </div>
        <div>
          <strong>{graph.supersededCount}</strong>
          <span>superseded</span>
        </div>
      </div>
      <table className="ops-table ops-table--compact">
        <caption>Evidence graph mini-map fallback</caption>
        <thead>
          <tr>
            <th scope="col">Node</th>
            <th scope="col">Role</th>
            <th scope="col">State</th>
            <th scope="col">Link summary</th>
          </tr>
        </thead>
        <tbody>
          {graph.graphRows.map((row) => (
            <tr key={row.nodeRef}>
              <td>{row.nodeRef}</td>
              <td>{row.role}</td>
              <td>{titleCase(row.state)}</td>
              <td>{row.linkSummary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function InvestigationDrawerPanel(props: {
  snapshot: OpsBoardStateSnapshot;
  onReturn: () => void;
  onNavigate: (path: string) => void;
}) {
  const investigation = props.snapshot.investigationProjection;
  return (
    <section
      className="ops-child ops-investigation-drawer"
      data-testid="ops-investigation-route"
      data-surface="investigation-drawer"
      data-investigation-question-hash={investigation.investigationQuestionHash}
      data-scope-hash={investigation.scopeEnvelope.scopeHash}
      data-timeline-hash={investigation.timelineReconstruction.timelineHash}
      data-drawer-delta-state={investigation.drawerSession.deltaState}
      aria-label="Investigation drawer"
    >
      <header className="ops-child__header">
        <div>
          <p className="ops-panel__eyebrow">InvestigationDrawer</p>
          <h2 data-testid="investigation-question" data-surface="investigation-question">
            {investigation.investigationQuestion}
          </h2>
        </div>
        <button
          type="button"
          className="ops-link"
          onClick={props.onReturn}
          data-testid="ops-return-button"
          data-surface="safe-return-anchor"
        >
          Return via {props.snapshot.returnToken?.returnTokenId ?? "OpsReturnToken"}
        </button>
      </header>
      <div className="ops-investigation-ribbon">
        <span>{investigation.scopeEnvelope.purposeOfUse}</span>
        <span>{investigation.scopeEnvelope.maskingPolicyRef}</span>
        <span>{investigation.scopeEnvelope.investigationQuestionHash}</span>
        <span>{investigation.evidenceGraph.completenessVerdictRef}</span>
      </div>
      <section
        className="ops-investigation-surface"
        data-testid="proof-basis"
        data-surface="proof-basis"
        aria-label="Preserved proof basis"
      >
        <header className="ops-investigation-surface__header">
          <div>
            <p className="ops-panel__eyebrow">Proof basis</p>
            <h3>Preserved question base</h3>
          </div>
          <span data-tone={investigationTone(investigation.drawerSession.deltaState)}>
            {titleCase(investigation.drawerSession.deltaState)}
          </span>
        </header>
        <p>{investigation.preservedProofBasis}</p>
        <p>{investigation.newerProofDiffSummary}</p>
      </section>
      <div className="ops-investigation-grid">
        <TimelineLadder snapshot={props.snapshot} />
        <InvestigationEvidenceGraphMiniMap snapshot={props.snapshot} />
      </div>
      <div className="ops-investigation-footer">
        <button type="button" className="ops-button ops-button--ghost">
          Copy summary
        </button>
        <button
          type="button"
          className="ops-button ops-button--secondary"
          onClick={() => props.onNavigate("/ops/audit")}
        >
          Open full audit route
        </button>
        <button
          type="button"
          className="ops-button"
          data-export-state={investigation.bundleExport.exportState}
          disabled={investigation.bundleExport.exportState === "blocked"}
        >
          Export bundle: {titleCase(investigation.bundleExport.exportState)}
        </button>
      </div>
    </section>
  );
}

function AuditExplorerPanel(props: { snapshot: OpsBoardStateSnapshot }) {
  const investigation = props.snapshot.investigationProjection;
  return (
    <section
      className="ops-panel ops-audit-explorer"
      data-testid="ops-audit-explorer"
      data-surface="audit-explorer"
      data-investigation-question-hash={investigation.investigationQuestionHash}
      data-scope-hash={investigation.scopeEnvelope.scopeHash}
      data-timeline-hash={investigation.timelineReconstruction.timelineHash}
      data-graph-verdict={investigation.evidenceGraph.verdictState}
      data-export-state={investigation.bundleExport.exportState}
      aria-label="Audit Explorer"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Audit Explorer</p>
          <h2>Forensic workspace</h2>
        </div>
        <span className="ops-panel__headline">{investigation.investigationQuestion}</span>
      </header>
      <div className="ops-investigation-ribbon">
        <span>Purpose {investigation.scopeEnvelope.purposeOfUse}</span>
        <span>Mask {investigation.scopeEnvelope.maskingPolicyRef}</span>
        <span>Scope {investigation.scopeEnvelope.scopeHash}</span>
        <span>Question {investigation.investigationQuestionHash}</span>
      </div>
      <div className="ops-audit-layout">
        <aside className="ops-audit-filter-rail" aria-label="Audit filters">
          <h3>Scoped filters</h3>
          <label>
            <span>Actor</span>
            <input readOnly value={investigation.dataSubjectTrace.actorRef} />
          </label>
          <label>
            <span>Subject</span>
            <input readOnly value={investigation.dataSubjectTrace.subjectRef} />
          </label>
          <label>
            <span>Entity</span>
            <input readOnly value={investigation.dataSubjectTrace.entityRef} />
          </label>
          <p aria-live="polite">
            {investigation.dataSubjectTrace.resultCount} results / graph{" "}
            {titleCase(investigation.evidenceGraph.verdictState)}
          </p>
        </aside>
        <div className="ops-audit-main-pane">
          <TimelineLadder snapshot={props.snapshot} />
          <section className="ops-investigation-surface" aria-label="Event evidence table">
            <header className="ops-investigation-surface__header">
              <div>
                <p className="ops-panel__eyebrow">AccessEventIndex pivot</p>
                <h3>Bound timeline evidence</h3>
              </div>
              <span>{titleCase(investigation.auditQuerySession.causalityState)}</span>
            </header>
            <table className="ops-table">
              <caption>Audit evidence table</caption>
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Edge correlation</th>
                  <th scope="col">Ledger entry</th>
                  <th scope="col">Graph marker</th>
                </tr>
              </thead>
              <tbody>
                {investigation.timelineEvents.map((event) => (
                  <tr key={event.eventRef} data-selected={event.selected}>
                    <td>{event.eventRef}</td>
                    <td>{event.edgeCorrelationId}</td>
                    <td>{event.assuranceLedgerEntryId}</td>
                    <td>{event.graphMarker}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <aside className="ops-audit-detail-rail" aria-label="Audit detail rail">
          <InvestigationEvidenceGraphMiniMap snapshot={props.snapshot} />
          <section
            className="ops-investigation-surface"
            data-testid="break-glass-review"
            data-surface="break-glass-review"
            data-review-state={investigation.breakGlassReview.reviewState}
            data-authorized-visibility={investigation.breakGlassReview.authorizedVisibility}
            aria-label="Break-glass review"
          >
            <header className="ops-investigation-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Break-glass review</p>
                <h3>{titleCase(investigation.breakGlassReview.reviewState)}</h3>
              </div>
              <span>{titleCase(investigation.breakGlassReview.reasonAdequacy)}</span>
            </header>
            <p>{investigation.breakGlassReview.visibilityWideningSummary}</p>
            <ul className="ops-inline-list">
              <li>{investigation.breakGlassReview.expiryBoundary}</li>
              <li>{titleCase(investigation.breakGlassReview.followUpBurdenState)}</li>
              <li>{investigation.breakGlassReview.reviewerBurden}</li>
            </ul>
          </section>
          <section
            className="ops-investigation-surface"
            data-testid="support-replay-boundary"
            data-surface="support-replay-boundary"
            data-restore-eligibility-state={
              investigation.supportReplayBoundary.restoreEligibilityState
            }
            aria-label="Support replay boundary"
          >
            <header className="ops-investigation-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Support replay</p>
                <h3>{titleCase(investigation.supportReplayBoundary.restoreEligibilityState)}</h3>
              </div>
              <span>{titleCase(investigation.supportReplayBoundary.replayDeterminismState)}</span>
            </header>
            <p>{investigation.supportReplayBoundary.boundarySummary}</p>
            <small>{investigation.supportReplayBoundary.replayCheckpointHash}</small>
          </section>
          <section
            className="ops-investigation-surface"
            data-testid="investigation-bundle-export"
            data-surface="investigation-bundle-export"
            data-export-state={investigation.bundleExport.exportState}
            aria-label="Investigation bundle export"
          >
            <header className="ops-investigation-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Bundle preview</p>
                <h3>{titleCase(investigation.bundleExport.exportState)}</h3>
              </div>
              <span>{investigation.bundleExport.outboundNavigationGrantRef}</span>
            </header>
            <p>{investigation.bundleExport.summaryFirstPreview}</p>
            <small>{investigation.bundleExport.manifestHash}</small>
          </section>
        </aside>
      </div>
    </section>
  );
}

function DependencyRestoreBands(props: {
  snapshot: OpsBoardStateSnapshot;
  onSelectHealthCell?: (serviceRef: string) => void;
}) {
  const resilience = props.snapshot.resilienceProjection;
  const bands = [...new Set(resilience.dependencyRestoreBands.map((row) => row.restoreBand))];
  return (
    <section
      className="ops-resilience-surface"
      data-testid="dependency-restore-bands"
      data-surface="dependency-restore-bands"
      data-timeline-state={resilience.runTimeline.timelineState}
      aria-label="Dependency restore bands"
    >
      <header className="ops-resilience-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Dependency restore bands</p>
          <h3>Topological restore order</h3>
        </div>
        <span data-tone={resilienceTone(resilience.runTimeline.timelineState)}>
          {resilience.runTimeline.timelineHash}
        </span>
      </header>
      <div className="ops-restore-bands" role="list">
        {bands.map((band) => (
          <section key={band} className="ops-restore-band" aria-label={`Restore band ${band}`}>
            <h4>Band {band}</h4>
            <div className="ops-restore-band__nodes">
              {resilience.dependencyRestoreBands
                .filter((row) => row.restoreBand === band)
                .map((row) => {
                  const functionRow = resilience.essentialFunctions.find(
                    (item) => item.functionCode === row.functionCode,
                  );
                  return (
                    <button
                      key={row.dependencyRestoreBandId}
                      type="button"
                      className="ops-restore-node"
                      role="listitem"
                      data-testid={`resilience-node-${row.functionCode}`}
                      data-entity-ref={row.functionCode}
                      data-selected={row.functionCode === resilience.selectedFunctionCode}
                      data-status={row.status}
                      data-current-authority={row.currentAuthority}
                      onClick={() =>
                        functionRow ? props.onSelectHealthCell?.(functionRow.serviceRef) : undefined
                      }
                    >
                      <strong>{row.label}</strong>
                      <span>{titleCase(row.dependencyClass)}</span>
                      <small>
                        {row.rto} RTO / {row.rpo} RPO / {titleCase(row.status)}
                      </small>
                      <em>{row.blockerRefs[0] ?? row.currentAuthority}</em>
                    </button>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
      <div className="ops-panel__table">
        <table className="ops-table">
          <caption>Dependency restore order fallback</caption>
          <thead>
            <tr>
              <th scope="col">Band</th>
              <th scope="col">Function</th>
              <th scope="col">Class</th>
              <th scope="col">RTO</th>
              <th scope="col">RPO</th>
              <th scope="col">Authority</th>
              <th scope="col">Blocker</th>
            </tr>
          </thead>
          <tbody>
            {resilience.dependencyRestoreBands.map((row) => (
              <tr
                key={row.dependencyRestoreBandId}
                data-selected={row.functionCode === resilience.selectedFunctionCode}
              >
                <td>{row.restoreBand}</td>
                <td>{row.label}</td>
                <td>{row.dependencyClass}</td>
                <td>{row.rto}</td>
                <td>{row.rpo}</td>
                <td>{row.currentAuthority}</td>
                <td>{row.blockerRefs.join(", ") || "none"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecoveryRunTimeline(props: { snapshot: OpsBoardStateSnapshot }) {
  const resilience = props.snapshot.resilienceProjection;
  return (
    <section
      className="ops-resilience-surface"
      data-testid="recovery-run-timeline"
      data-surface="recovery-run-timeline"
      data-timeline-state={resilience.runTimeline.timelineState}
      aria-label="Recovery run timeline"
    >
      <header className="ops-resilience-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Restore / failover / chaos</p>
          <h3>{titleCase(resilience.runTimeline.timelineState)} recovery proof timeline</h3>
        </div>
        <span data-tone={resilienceTone(resilience.runTimeline.timelineState)}>
          {resilience.runTimeline.activeRunRef}
        </span>
      </header>
      <ol className="ops-recovery-timeline">
        {resilience.recoveryRunEvents.map((event) => (
          <li key={event.runRef} data-current-authority={event.currentAuthority}>
            <strong>{titleCase(event.runType)}</strong>
            <span>{titleCase(event.resultState)}</span>
            <p>{event.summary}</p>
            <small>
              {event.evidenceArtifactRef} / {event.resilienceActionSettlementRef}
            </small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ResilienceBoardPanel(props: {
  snapshot: OpsBoardStateSnapshot;
  onSelectHealthCell?: (serviceRef: string) => void;
}) {
  const resilience = props.snapshot.resilienceProjection;
  return (
    <section
      className="ops-panel ops-resilience-board"
      data-testid="ops-resilience-board"
      data-surface="resilience-board"
      data-resilience-state={resilience.recoveryControlPosture.postureState}
      data-binding-state={resilience.runtimeBinding.bindingState}
      data-readiness-state={resilience.readinessSnapshot.readinessState}
      data-runbook-state={resilience.runbookBindings[0]?.bindingState ?? "missing"}
      data-backup-state={resilience.backupFreshness.manifestState}
      data-settlement-result={resilience.latestSettlement.result}
      data-artifact-state={resilience.artifactStage.artifactState}
      data-timeline-state={resilience.runTimeline.timelineState}
      data-selected-function={resilience.selectedFunctionCode}
      aria-label="Resilience Board"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Resilience Board</p>
          <h2>Recovery proof wall</h2>
        </div>
        <span className="ops-panel__headline">{resilience.surfaceSummary}</span>
      </header>

      <section
        className="ops-resilience-selector"
        data-testid="essential-function-map"
        data-surface="essential-function-map"
        aria-label="Essential function map"
      >
        <div>
          <p className="ops-panel__eyebrow">Essential function</p>
          <h3>{resilience.selectedFunctionLabel}</h3>
        </div>
        <div className="ops-resilience-selector__buttons">
          {resilience.essentialFunctions.map((item) => (
            <button
              key={item.functionCode}
              type="button"
              className="ops-chip"
              data-testid={`resilience-function-${item.functionCode}`}
              data-function-code={item.functionCode}
              data-selected={item.selected}
              data-function-state={item.functionState}
              onClick={() => props.onSelectHealthCell?.(item.serviceRef)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="ops-resilience-summary-grid">
        <section
          className="ops-resilience-surface"
          data-testid="operational-readiness-snapshot"
          data-surface="operational-readiness-snapshot"
          data-readiness-state={resilience.readinessSnapshot.readinessState}
          aria-label="OperationalReadinessSnapshot"
        >
          <header className="ops-resilience-surface__header">
            <div>
              <p className="ops-panel__eyebrow">OperationalReadinessSnapshot</p>
              <h3>{titleCase(resilience.readinessSnapshot.readinessState)}</h3>
            </div>
            <span data-tone={resilienceTone(resilience.readinessSnapshot.readinessState)}>
              {resilience.readinessSnapshot.operationalReadinessSnapshotRef}
            </span>
          </header>
          <p>{resilience.readinessSnapshot.summary}</p>
          <dl className="ops-keyfacts">
            <div>
              <dt>Tuple</dt>
              <dd>{resilience.readinessSnapshot.resilienceTupleHash}</dd>
            </div>
            <div>
              <dt>Freshness</dt>
              <dd>
                {titleCase(resilience.readinessSnapshot.freshnessState)} / rehearsal{" "}
                {titleCase(resilience.readinessSnapshot.rehearsalFreshnessState)}
              </dd>
            </div>
          </dl>
        </section>

        <section
          className="ops-resilience-surface"
          data-testid="recovery-control-posture"
          data-surface="recovery-control-posture"
          data-control-state={resilience.recoveryControlPosture.postureState}
          aria-label="RecoveryControlPosture"
        >
          <header className="ops-resilience-surface__header">
            <div>
              <p className="ops-panel__eyebrow">RecoveryControlPosture</p>
              <h3>{titleCase(resilience.recoveryControlPosture.postureState)}</h3>
            </div>
            <span data-tone={resilienceTone(resilience.recoveryControlPosture.postureState)}>
              {resilience.recoveryControlPosture.recoveryControlPostureRef}
            </span>
          </header>
          <p>
            Publication {titleCase(resilience.recoveryControlPosture.publicationState)}, trust{" "}
            {titleCase(resilience.recoveryControlPosture.trustState)}, freeze{" "}
            {titleCase(resilience.recoveryControlPosture.freezeState)}.
          </p>
          <ul className="ops-inline-list">
            <li>Restore {resilience.recoveryControlPosture.restoreValidationFreshnessState}</li>
            <li>Failover {resilience.recoveryControlPosture.failoverValidationFreshnessState}</li>
            <li>Chaos {resilience.recoveryControlPosture.chaosValidationFreshnessState}</li>
          </ul>
        </section>

        <section className="ops-resilience-surface" aria-label="Open recovery risks">
          <header className="ops-resilience-surface__header">
            <div>
              <p className="ops-panel__eyebrow">Recovery proof debt</p>
              <h3>
                {resilience.proofDebt.length} open risk
                {resilience.proofDebt.length === 1 ? "" : "s"}
              </h3>
            </div>
            <span>{resilience.nextExercise.scheduledAt}</span>
          </header>
          <p>{resilience.historicalRunWarning}</p>
          <ul className="ops-inline-list">
            {(resilience.proofDebt[0]?.blockerRefs ?? ["none"]).map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ops-resilience-workspace">
        <DependencyRestoreBands
          snapshot={props.snapshot}
          onSelectHealthCell={props.onSelectHealthCell}
        />

        <div className="ops-resilience-proof-stack">
          <section
            className="ops-resilience-surface"
            data-testid="backup-freshness"
            data-surface="backup-freshness"
            data-backup-state={resilience.backupFreshness.manifestState}
            aria-label="Backup freshness"
          >
            <header className="ops-resilience-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Backup freshness</p>
                <h3>{titleCase(resilience.backupFreshness.manifestState)}</h3>
              </div>
              <span>{resilience.backupFreshness.backupSetManifestRef}</span>
            </header>
            <p>{resilience.backupFreshness.summary}</p>
            <small>{resilience.backupFreshness.checksumBundleRef}</small>
          </section>

          <section
            className="ops-resilience-surface"
            data-testid="runbook-binding"
            data-surface="runbook-binding"
            data-runbook-state={resilience.runbookBindings[0]?.bindingState ?? "missing"}
            aria-label="Runbook binding"
          >
            <header className="ops-resilience-surface__header">
              <div>
                <p className="ops-panel__eyebrow">RunbookBindingRecord</p>
                <h3>{titleCase(resilience.runbookBindings[0]?.bindingState ?? "missing")}</h3>
              </div>
              <span>{resilience.runbookBindings[0]?.runbookBindingRef ?? "missing"}</span>
            </header>
            <p>{resilience.runbookBindings[0]?.summary ?? "No runbook binding is available."}</p>
            <small>{resilience.runbookBindings[0]?.bindingHash ?? "binding hash missing"}</small>
          </section>

          <RecoveryRunTimeline snapshot={props.snapshot} />
        </div>

        <aside
          className="ops-recovery-action-rail"
          data-testid="recovery-action-rail"
          data-surface="recovery-action-rail"
          aria-label="Recovery action rail"
        >
          <header className="ops-resilience-surface__header">
            <div>
              <p className="ops-panel__eyebrow">Guarded controls</p>
              <h3>{titleCase(resilience.recoveryControlPosture.postureState)}</h3>
            </div>
          </header>
          <div className="ops-recovery-actions">
            {resilience.actionRail.map((action) => (
              <button
                key={action.actionType}
                type="button"
                className="ops-button"
                data-testid={`resilience-action-${action.actionType}`}
                data-action-type={action.actionType}
                data-action-allowed={action.allowed}
                data-settlement-result={action.settlementResult}
                disabled={!action.allowed}
              >
                <span>{action.label}</span>
                <small>{titleCase(action.settlementResult)}</small>
              </button>
            ))}
          </div>
          <section
            className="ops-resilience-settlement"
            data-testid="resilience-settlement"
            data-surface="resilience-settlement"
            data-settlement-result={resilience.latestSettlement.result}
            aria-live="polite"
          >
            <strong>{titleCase(resilience.latestSettlement.result)}</strong>
            <p>{resilience.latestSettlement.announcement}</p>
            <small>{resilience.latestSettlement.resilienceActionSettlementRef}</small>
          </section>
        </aside>
      </div>

      <section
        className="ops-resilience-surface ops-recovery-artifact-stage"
        data-testid="recovery-artifact-stage"
        data-surface="recovery-artifact-stage"
        data-artifact-state={resilience.artifactStage.artifactState}
        aria-label="Recovery evidence artifact stage"
      >
        <header className="ops-resilience-surface__header">
          <div>
            <p className="ops-panel__eyebrow">Recovery evidence artifact</p>
            <h3>{titleCase(resilience.artifactStage.artifactState)}</h3>
          </div>
          <span data-tone={resilienceTone(resilience.artifactStage.artifactState)}>
            {resilience.artifactStage.artifactPresentationContractRef}
          </span>
        </header>
        <p>{resilience.artifactStage.summaryFirstPreview}</p>
        <ul className="ops-inline-list">
          <li>{resilience.artifactStage.artifactTransferSettlementRef}</li>
          <li>{resilience.artifactStage.artifactFallbackDispositionRef}</li>
          <li>{resilience.artifactStage.outboundNavigationGrantRef}</li>
          <li>{resilience.artifactStage.graphHash}</li>
        </ul>
      </section>
    </section>
  );
}

function complianceScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeComplianceLedgerScenarioState(fallback);
  }
  const stateFromUrl = new URL(window.location.href).searchParams.get("state");
  return normalizeComplianceLedgerScenarioState(stateFromUrl ?? fallback);
}

function conformanceScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeConformanceScorecardScenarioState(fallback);
  }
  const stateFromUrl = new URL(window.location.href).searchParams.get("state");
  return normalizeConformanceScorecardScenarioState(stateFromUrl ?? fallback);
}

function exitGateScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizePhase9ExitGateScenarioState(fallback);
  }
  const stateFromUrl = new URL(window.location.href).searchParams.get("exitGate");
  return normalizePhase9ExitGateScenarioState(stateFromUrl ?? fallback);
}

function programmeConformance472ScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeProgrammeConformance472ScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizeProgrammeConformance472ScenarioState(
    parsed.searchParams.get("programmeState") ?? fallback,
  );
}

function programmeConformance472SelectedRowFromLocation() {
  if (typeof window === "undefined") {
    return null;
  }
  return new URL(window.location.href).searchParams.get("selectedProgrammeRow");
}

function phase7ChannelScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizePhase7ChannelScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizePhase7ChannelScenarioState(
    parsed.searchParams.get("phase7ChannelState") ?? fallback,
  );
}

function phase7ChannelRouteFamilyFromLocation() {
  if (typeof window === "undefined") {
    return null;
  }
  return new URL(window.location.href).searchParams.get("phase7RouteFamily");
}

function migrationCutover474ScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeMigrationCutover474ScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizeMigrationCutover474ScenarioState(
    parsed.searchParams.get("cutoverState") ?? fallback,
  );
}

function migrationCutover474SelectedProjectionFromLocation() {
  if (typeof window === "undefined") {
    return null;
  }
  return new URL(window.location.href).searchParams.get("cutoverProjection");
}

function trainingRunbook475ScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeTrainingRunbook475ScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizeTrainingRunbook475ScenarioState(
    parsed.searchParams.get("trainingState") ?? fallback,
  );
}

function trainingRunbook475RoleFromLocation() {
  if (typeof window === "undefined") {
    return normalizeTrainingRunbook475RoleId(null);
  }
  const parsed = new URL(window.location.href);
  return normalizeTrainingRunbook475RoleId(parsed.searchParams.get("trainingRole"));
}

function releaseWave476ScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeReleaseWave476ScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizeReleaseWave476ScenarioState(parsed.searchParams.get("waveState") ?? fallback);
}

function releaseWave476WaveFromLocation() {
  if (typeof window === "undefined") {
    return normalizeReleaseWave476WaveId(null);
  }
  const parsed = new URL(window.location.href);
  return normalizeReleaseWave476WaveId(parsed.searchParams.get("wave"));
}

function dependencyReadiness478ScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeDependencyReadiness478ScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizeDependencyReadiness478ScenarioState(
    parsed.searchParams.get("dependencyState") ?? parsed.searchParams.get("state") ?? fallback,
  );
}

function dependencyReadiness478DependencyFromLocation() {
  if (typeof window === "undefined") {
    return normalizeDependencyReadiness478DependencyId(null);
  }
  const parsed = new URL(window.location.href);
  return normalizeDependencyReadiness478DependencyId(parsed.searchParams.get("dependency"));
}

function destinationScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeOperationalDestinationScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizeOperationalDestinationScenarioState(
    parsed.searchParams.get("destinationState") ?? parsed.searchParams.get("state") ?? fallback,
  );
}

function backupRestoreScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeBackupRestoreScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizeBackupRestoreScenarioState(
    parsed.searchParams.get("backupState") ?? parsed.searchParams.get("state") ?? fallback,
  );
}

function securityComplianceExportScenarioFromLocation(fallback: string) {
  if (typeof window === "undefined") {
    return normalizeSecurityComplianceExportScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizeSecurityComplianceExportScenarioState(
    parsed.searchParams.get("exportState") ?? parsed.searchParams.get("state") ?? fallback,
  );
}

function phase9LiveScenarioFromLocation(fallback: string): Phase9LiveGatewayScenarioState {
  if (typeof window === "undefined") {
    return normalizePhase9LiveGatewayScenarioState(fallback);
  }
  const parsed = new URL(window.location.href);
  return normalizePhase9LiveGatewayScenarioState(
    parsed.searchParams.get("liveState") ?? parsed.searchParams.get("state") ?? fallback,
  );
}

function exportDestinationForOpsPath(pathname: string): ExportDestinationClass {
  if (pathname.includes("/incidents")) {
    return "reportable_data_security_incident_handoff";
  }
  if (pathname.includes("/audit")) {
    return "audit_investigation_bundle_export";
  }
  if (pathname.includes("/resilience")) {
    return "recovery_evidence_pack_export";
  }
  if (pathname.includes("/conformance")) {
    return "cross_phase_conformance_scorecard_export";
  }
  if (pathname.includes("/governance/records")) {
    return "archive_manifest_deletion_certificate_export";
  }
  return "dspt_operational_evidence_pack_export";
}

function DestinationReadinessSurfaceStrip(props: {
  projection: OperationalDestinationRegistryProjection;
  currentRoute: string;
}) {
  return (
    <section
      className="ops-destination-readiness"
      data-testid="ops-destination-readiness-strip"
      data-surface="ops-destination-readiness-strip"
      data-current-route={props.currentRoute}
      data-destination-ready-count={props.projection.readyCount}
      data-destination-blocked-count={props.projection.blockedCount}
      data-destination-registry-state={props.projection.scenarioState}
      data-registry-hash={props.projection.registryHash}
      aria-label="Operational destination readiness"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">OperationalDestinationBinding</p>
          <h2>Destination readiness</h2>
        </div>
        <span className="ops-panel__headline">{props.projection.registryHash}</span>
      </header>
      <div className="ops-destination-readiness__grid">
        {props.projection.downstreamReadiness.map((readiness) => (
          <article
            key={readiness.surface}
            data-testid={`ops-destination-readiness-${readiness.surface}`}
            data-route={readiness.route}
            data-readiness-state={readiness.readinessState}
            data-blocked-count={readiness.blockedDestinationRefs.length}
          >
            <strong>{titleCase(readiness.surface)}</strong>
            <span>{titleCase(readiness.readinessState)}</span>
            <small>{readiness.summary}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function BackupRestoreReadinessSurfaceStrip(props: {
  projection: BackupRestoreChannelRegistryProjection;
  currentRoute: string;
}) {
  const readiness = props.projection.readiness;
  return (
    <section
      className="ops-backup-restore-readiness"
      data-testid="ops-backup-restore-readiness-strip"
      data-surface="ops-backup-restore-readiness-strip"
      data-current-route={props.currentRoute}
      data-backup-restore-state={props.projection.scenarioState}
      data-backup-target-ready-count={readiness.targetReadyCount}
      data-backup-target-blocked-count={readiness.targetBlockedCount}
      data-restore-channel-ready-count={readiness.channelReadyCount}
      data-restore-channel-blocked-count={readiness.channelBlockedCount}
      data-recovery-control-state={readiness.recoveryControlState}
      data-readiness-state={readiness.readinessState}
      data-evidence-pack-state={readiness.evidencePackState}
      data-tuple-state={readiness.tupleState}
      data-registry-hash={props.projection.registryHash}
      aria-label="Backup restore readiness"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">BackupRestoreChannelBinding</p>
          <h2>Resilience backup readiness</h2>
        </div>
        <span className="ops-panel__headline">{props.projection.registryHash}</span>
      </header>
      <div className="ops-backup-restore-readiness__grid">
        {[
          [
            "targets",
            readiness.targetReadyCount,
            readiness.targetBlockedCount,
            readiness.readinessState,
          ],
          [
            "channels",
            readiness.channelReadyCount,
            readiness.channelBlockedCount,
            readiness.recoveryControlState,
          ],
          [
            "evidence",
            readiness.evidencePackState,
            readiness.blockedTargetRefs.length,
            readiness.evidencePackState,
          ],
          [
            "tuple",
            readiness.tupleState,
            readiness.blockedChannelRefs.length,
            readiness.tupleState,
          ],
        ].map(([label, ready, blocked, state]) => (
          <article
            key={String(label)}
            data-testid={`ops-backup-restore-readiness-${label}`}
            data-readiness-state={String(state)}
            data-ready-count={String(ready)}
            data-blocked-count={String(blocked)}
          >
            <strong>{titleCase(String(label))}</strong>
            <span>{titleCase(String(state))}</span>
            <small>{readiness.summary}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function aggregateSecurityComplianceExportReadiness(
  projection: SecurityComplianceExportRegistryProjection,
): string {
  if (projection.sourceReadiness.some((source) => source.readinessState === "permission_denied")) {
    return "permission_denied";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "blocked")) {
    return "blocked";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "stale")) {
    return "stale";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "pending")) {
    return "pending";
  }
  return "ready";
}

function SecurityComplianceExportReadinessSurfaceStrip(props: {
  projection: SecurityComplianceExportRegistryProjection;
  currentRoute: string;
}) {
  return (
    <section
      className="ops-security-compliance-export-readiness"
      data-testid="ops-security-compliance-export-readiness-strip"
      data-surface="ops-security-compliance-export-readiness-strip"
      data-current-route={props.currentRoute}
      data-security-compliance-export-state={props.projection.scenarioState}
      data-source-readiness-state={aggregateSecurityComplianceExportReadiness(props.projection)}
      data-selected-destination-class={props.projection.selectedDestinationClass}
      data-ready-count={props.projection.readyCount}
      data-blocked-count={props.projection.blockedCount}
      data-stale-count={props.projection.staleCount}
      data-failed-count={props.projection.failedCount}
      data-no-raw-export-urls={String(props.projection.noRawExportUrls)}
      data-registry-hash={props.projection.registryHash}
      aria-label="Security compliance export readiness"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">GovernedExportDestinationBinding</p>
          <h2>Security export readiness</h2>
        </div>
        <span className="ops-panel__headline">{props.projection.registryHash}</span>
      </header>
      <div className="ops-security-compliance-export-readiness__grid">
        {props.projection.sourceReadiness.map((readiness) => (
          <article
            key={readiness.surface}
            data-testid={`ops-security-compliance-export-readiness-${readiness.surface}`}
            data-route={readiness.route}
            data-readiness-state={readiness.readinessState}
            data-blocked-count={readiness.blockedDestinationRefs.length}
          >
            <strong>{titleCase(readiness.surface)}</strong>
            <span>{titleCase(readiness.readinessState)}</span>
            <small>{readiness.summary}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function Phase9LiveProjectionGatewayStrip(props: {
  projection: LivePhase9ProjectionGatewayProjection;
  currentRoute: string;
}) {
  const firstFixtureId = props.projection.testEventProducerFixtures[0]?.fixtureId ?? "";
  const [localProjection, setLocalProjection] = useState(props.projection);
  const [fixtureId, setFixtureId] = useState(firstFixtureId);

  useEffect(() => {
    setLocalProjection(props.projection);
    setFixtureId(firstFixtureId);
  }, [firstFixtureId, props.projection.liveGatewayHash, props.projection.selectedSurfaceCode]);

  const selectedSurface = localProjection.selectedSurface;
  const selectedFixture =
    localProjection.testEventProducerFixtures.find((fixture) => fixture.fixtureId === fixtureId) ??
    localProjection.testEventProducerFixtures[0];

  return (
    <section
      className="phase9-live-projection-gateway"
      data-testid="phase9-live-projection-gateway-strip"
      data-surface="phase9-live-projection-gateway-strip"
      data-current-route={props.currentRoute}
      data-visual-mode={localProjection.visualMode}
      data-live-gateway-state={localProjection.scenarioState}
      data-selected-surface-code={localProjection.selectedSurfaceCode}
      data-live-channel-state={selectedSurface.projectionState}
      data-runtime-binding-state={selectedSurface.runtimeBindingState}
      data-action-settlement-state={selectedSurface.actionSettlementState}
      data-graph-verdict-state={selectedSurface.graphVerdictState}
      data-delta-gate-state={selectedSurface.deltaGateState}
      data-return-token-state={selectedSurface.returnTokenState}
      data-telemetry-fence-state={selectedSurface.telemetryDisclosureFenceState}
      data-raw-event-browser-join-allowed={String(localProjection.rawEventBrowserJoinAllowed)}
      data-raw-domain-event-payload-allowed={String(localProjection.rawDomainEventPayloadAllowed)}
      data-subscription-cleanup-proven={String(localProjection.subscriptionCleanupProven)}
      data-live-gateway-hash={localProjection.liveGatewayHash}
      aria-label="Phase 9 live projection gateway"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">LivePhase9ProjectionGateway</p>
          <h2>Live projection gateway</h2>
        </div>
        <span
          className="ops-panel__headline"
          data-testid="phase9-live-gateway-status"
          role="status"
          aria-live="polite"
        >
          {titleCase(selectedSurface.projectionState)} / {selectedSurface.changedBecauseSummary}
        </span>
      </header>

      <div className="phase9-live-projection-gateway__summary">
        <dl>
          <div>
            <dt>Channel</dt>
            <dd>{selectedSurface.channelContract.liveUpdateChannelRef}</dd>
          </div>
          <div>
            <dt>Contract</dt>
            <dd>{selectedSurface.channelContract.projectionContractVersion}</dd>
          </div>
          <div>
            <dt>Runtime binding</dt>
            <dd>{selectedSurface.runtimeBindingState}</dd>
          </div>
          <div>
            <dt>Selected anchor</dt>
            <dd>{selectedSurface.selectedAnchorPreserved ? "preserved" : "released"}</dd>
          </div>
        </dl>
        <p data-testid="phase9-live-return-token-panel">
          Return token {titleCase(selectedSurface.returnTokenState)}.{" "}
          {selectedSurface.changedBecauseSummary} {selectedSurface.nextSafeAction}
        </p>
      </div>

      <div
        className="phase9-live-projection-gateway__producer"
        data-testid="phase9-live-update-fixture-producer"
      >
        <label>
          <span>Fixture</span>
          <select
            data-testid="phase9-live-fixture-select"
            value={fixtureId}
            onChange={(event) => setFixtureId(event.currentTarget.value)}
          >
            {localProjection.testEventProducerFixtures.map((fixture) => (
              <option key={fixture.fixtureId} value={fixture.fixtureId}>
                {titleCase(fixture.patchKind)} / {titleCase(fixture.targetSurface)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ops-button"
          data-testid="phase9-live-apply-fixture-action"
          onClick={() =>
            setLocalProjection(applyPhase9LiveProjectionFixture(localProjection, fixtureId))
          }
        >
          Apply live patch
        </button>
        <span data-testid="phase9-live-queued-delta-digest">
          {selectedFixture?.changedBecauseSummary ?? selectedSurface.changedBecauseSummary}
        </span>
      </div>

      <table className="ops-table ops-table--compact" data-testid="phase9-live-source-slice-table">
        <caption>Live projection source slice readiness</caption>
        <thead>
          <tr>
            <th scope="col">Surface</th>
            <th scope="col">Projection</th>
            <th scope="col">Patch</th>
            <th scope="col">Action</th>
            <th scope="col">Consequence</th>
          </tr>
        </thead>
        <tbody>
          {localProjection.surfaces.map((surface) => (
            <tr
              key={surface.surfaceCode}
              data-testid={`phase9-live-surface-row-${surface.surfaceCode}`}
              data-route={surface.route}
              data-projection-state={surface.projectionState}
              data-patch-state={surface.patchState}
              data-selected={surface.surfaceCode === localProjection.selectedSurfaceCode}
              data-affected-only={String(surface.affectedOnly)}
              data-selected-anchor-preserved={String(surface.selectedAnchorPreserved)}
            >
              <th scope="row">{surface.label}</th>
              <td>{titleCase(surface.projectionState)}</td>
              <td>{titleCase(surface.patchState)}</td>
              <td>{titleCase(surface.actionSettlementState)}</td>
              <td>{surface.changedBecauseSummary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StandardsVersionContextChip(props: {
  context: ComplianceLedgerProjection["standardsVersionContexts"][number];
  onSelect: (frameworkCode: ComplianceLedgerProjection["selectedFrameworkCode"]) => void;
}) {
  return (
    <button
      type="button"
      className="ops-chip ops-compliance-standard-chip"
      data-testid={`standards-version-context-chip-${automationId(props.context.frameworkCode)}`}
      data-surface="standards-version-context-chip"
      data-framework-code={props.context.frameworkCode}
      data-selected={props.context.selected}
      onClick={() => props.onSelect(props.context.frameworkCode)}
    >
      <span>{props.context.label}</span>
      <small>{props.context.frameworkVersion}</small>
    </button>
  );
}

function CAPAAndIncidentLinkStrip(props: {
  projection: ComplianceLedgerProjection;
  row: ComplianceLedgerProjection["ledgerRows"][number] | undefined;
}) {
  return (
    <section
      className="ops-compliance-link-strip"
      data-testid="capa-and-incident-link-strip"
      data-surface="capa-and-incident-link-strip"
      aria-label="CAPA and incident handoff links"
    >
      {props.projection.safeHandoffLinks.map((handoff) => (
        <button
          key={handoff.handoffRef}
          type="button"
          className="ops-chip"
          data-handoff-target={handoff.targetSurface}
          data-handoff-route={handoff.route}
          data-raw-artifact-url-suppressed={handoff.rawArtifactUrlSuppressed}
        >
          <span>{handoff.label}</span>
          <small>{props.row?.controlRef ?? props.projection.selectedControlRef}</small>
        </button>
      ))}
    </section>
  );
}

function GraphCompletenessBlockerCard(props: { projection: ComplianceLedgerProjection }) {
  const blocker = props.projection.graphBlocker;
  return (
    <section
      className="ops-compliance-blocker"
      data-testid="graph-completeness-blocker-card"
      data-surface="graph-completeness-blocker-card"
      data-graph-verdict={blocker.graphVerdictState}
      aria-live="polite"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Graph completeness</p>
          <h3>{titleCase(blocker.graphVerdictState)} verdict</h3>
        </div>
        <span data-tone={assuranceTone(blocker.graphVerdictState)}>{blocker.verdictRef}</span>
      </header>
      <p>{blocker.summary}</p>
      <ul className="ops-inline-list">
        {(blocker.blockerRefs.length > 0 ? blocker.blockerRefs : ["no graph blockers"]).map(
          (blockerRef) => (
            <li key={blockerRef}>{blockerRef}</li>
          ),
        )}
      </ul>
    </section>
  );
}

function ControlStatusLedgerRow(props: {
  row: ComplianceLedgerProjection["ledgerRows"][number];
  onSelect: (controlRef: string) => void;
}) {
  const selectRow = () => props.onSelect(props.row.controlRef);
  return (
    <tr
      data-testid={`control-status-ledger-row-${automationId(props.row.controlRef)}`}
      data-surface="control-status-ledger-row"
      data-control-ref={props.row.controlRef}
      data-status={props.row.status}
      data-selected={props.row.selected}
      data-export-eligibility-state={props.row.exportEligibilityState}
      tabIndex={0}
      aria-selected={props.row.selected}
      onClick={selectRow}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRow();
        }
      }}
    >
      <th scope="row">
        <button type="button" className="ops-link-button" onClick={selectRow}>
          {props.row.controlRef}
        </button>
        <span>{props.row.controlFamily}</span>
      </th>
      <td>
        <strong data-tone={assuranceTone(props.row.status)}>{titleCase(props.row.status)}</strong>
        <small>{props.row.controlLabel}</small>
      </td>
      <td>
        {props.row.ownerLabel}
        <small>{props.row.nextReviewAt}</small>
      </td>
      <td>
        {props.row.evidenceCount} evidence
        <small>{props.row.missingEvidenceCount} missing</small>
      </td>
      <td>
        {props.row.coverageScore}%<small>lower bound {props.row.coverageLowerBound}%</small>
      </td>
      <td>
        {titleCase(props.row.graphVerdictState)}
        <small>{props.row.decisionHash}</small>
      </td>
    </tr>
  );
}

function EvidenceGraphMiniMap(props: { projection: ComplianceLedgerProjection }) {
  const miniMap = props.projection.evidenceGraphMiniMap;
  return (
    <section
      className="ops-compliance-minimap"
      data-testid="evidence-graph-mini-map"
      data-surface="evidence-graph-mini-map"
      data-graph-verdict={miniMap.graphVerdictState}
      aria-label="Control evidence graph mini-map"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Evidence graph</p>
          <h3>{miniMap.selectedControlRef}</h3>
        </div>
        <span data-tone={assuranceTone(miniMap.graphVerdictState)}>
          {miniMap.graphCompletenessVerdictRef}
        </span>
      </header>
      <div className="ops-compliance-graph-nodes" aria-label="Graph node summary">
        {miniMap.nodes.map((node) => (
          <span key={node.nodeRef} data-node-kind={node.nodeKind} data-state={node.state}>
            <strong>{node.label}</strong>
            <small>{titleCase(node.state)}</small>
          </span>
        ))}
      </div>
      <table className="ops-table ops-table--compact">
        <caption>Control evidence graph edges</caption>
        <thead>
          <tr>
            <th scope="col">Edge</th>
            <th scope="col">Kind</th>
            <th scope="col">State</th>
            <th scope="col">From / to</th>
          </tr>
        </thead>
        <tbody>
          {miniMap.edges.map((edge) => (
            <tr key={edge.edgeRef}>
              <td>{edge.edgeRef}</td>
              <td>{edge.edgeKind}</td>
              <td>{titleCase(edge.edgeState)}</td>
              <td>
                {edge.fromNodeRef} / {edge.toNodeRef}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function GapOwnerBurdenRail(props: { projection: ComplianceLedgerProjection }) {
  return (
    <aside
      className="ops-compliance-owner-rail"
      data-testid="gap-owner-burden-rail"
      data-surface="gap-owner-burden-rail"
      data-overloaded-owner-count={props.projection.ownerBurden.overloadedOwnerCount}
      aria-label="Gap owner burden"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Owner burden</p>
          <h3>{props.projection.ownerBurden.aggregateOpenGapCount} open gaps</h3>
        </div>
        <span>{props.projection.ownerBurden.selectedOwnerRef}</span>
      </header>
      <ul className="ops-assurance-list">
        {props.projection.ownerBurden.items.map((owner) => (
          <li key={owner.ownerRef} data-state={owner.burdenState}>
            <strong>{owner.ownerLabel}</strong>
            <span>{titleCase(owner.burdenState)}</span>
            <small>
              {owner.openGapCount} open / {owner.overdueGapCount} overdue /{" "}
              {owner.blockedGraphEdgeCount} graph blockers
            </small>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function ControlEvidenceGapQueue(props: {
  projection: ComplianceLedgerProjection;
  onSelectGap: (gapRef: string) => void;
  onFilterChange: (filter: GapQueueFilterKey) => void;
  onSortChange: (sort: GapQueueSortKey) => void;
}) {
  const queue = props.projection.gapQueue;
  return (
    <section
      className="ops-compliance-gap-queue"
      data-testid="control-evidence-gap-queue"
      data-surface="control-evidence-gap-queue"
      data-queue-state={queue.queueState}
      data-graph-verdict={queue.graphVerdictState}
      aria-label="Control evidence gap queue"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Control Evidence Gap Queue</p>
          <h3>{queue.openGapCount} open queue item(s)</h3>
        </div>
        <span data-tone={assuranceTone(queue.graphVerdictState)}>
          {titleCase(queue.queueState)}
        </span>
      </header>
      <div className="ops-compliance-filterbar" aria-label="Gap queue filters">
        {props.projection.gapQueueFilterSet.options.map((option) => (
          <button
            key={option.filterKey}
            type="button"
            className="ops-chip"
            data-testid={`gap-filter-${automationId(option.filterKey)}`}
            data-selected={option.selected}
            onClick={() => props.onFilterChange(option.filterKey)}
          >
            <span>{option.label}</span>
            <small>{option.count}</small>
          </button>
        ))}
        <label>
          <span>Sort</span>
          <select
            value={props.projection.gapQueueFilterSet.activeSort}
            onChange={(event) => props.onSortChange(event.target.value as GapQueueSortKey)}
          >
            <option value="severity">Severity</option>
            <option value="due_date">Due date</option>
            <option value="owner">Owner</option>
            <option value="control">Control</option>
          </select>
        </label>
      </div>
      <ul className="ops-compliance-gap-list">
        {(queue.items.length > 0
          ? queue.items
          : [
              {
                gapRef: "gap:none",
                evidenceGapRecordRef: "EGR_459_NONE",
                controlRef: "none",
                ownerRef: "none",
                ownerLabel: "No owner",
                severity: "low" as const,
                queueStatus: "resolved" as const,
                gapType: "missing_evidence" as const,
                reason: "No evidence gaps match the selected filter.",
                dueAt: "not scheduled",
                graphEdgeRefs: [] as readonly string[],
                blockerRefs: [] as readonly string[],
                incidentRefs: [] as readonly string[],
                capaActionRefs: [] as readonly string[],
                nextSafeAction: "owner_review" as const,
                selected: false,
              },
            ]
        ).map((gap) => (
          <li key={gap.gapRef} data-severity={gap.severity} data-status={gap.queueStatus}>
            <button
              type="button"
              data-testid={`gap-queue-item-${automationId(gap.gapRef)}`}
              data-gap-ref={gap.gapRef}
              data-selected={gap.selected}
              onClick={() => props.onSelectGap(gap.gapRef)}
              disabled={gap.gapRef === "gap:none"}
            >
              <strong>{gap.reason}</strong>
              <span>
                {gap.controlRef} / {gap.ownerLabel}
              </span>
              <small>
                {titleCase(gap.severity)} / {titleCase(gap.queueStatus)} / {gap.dueAt}
              </small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EvidenceGapResolutionDrawer(props: { projection: ComplianceLedgerProjection }) {
  const preview = props.projection.resolutionActionPreview;
  return (
    <aside
      className="ops-compliance-drawer"
      data-testid="evidence-gap-resolution-drawer"
      data-surface="evidence-gap-resolution-drawer"
      data-action-control-state={preview.actionControlState}
      data-action-allowed={preview.actionAllowed}
      data-target-surface={preview.handoffTargetSurface}
      aria-label="Evidence gap resolution drawer"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Resolution preview</p>
          <h3>{preview.actionLabel}</h3>
        </div>
        <span data-tone={assuranceTone(preview.actionControlState)}>
          {titleCase(preview.actionControlState)}
        </span>
      </header>
      <dl className="ops-keyfacts">
        <div>
          <dt>Selected gap</dt>
          <dd>{preview.selectedGapRef}</dd>
        </div>
        <div>
          <dt>Target route</dt>
          <dd>{preview.targetRoute}</dd>
        </div>
        <div>
          <dt>Artifact contract</dt>
          <dd>{preview.requiresArtifactPresentationContractRef}</dd>
        </div>
        <div>
          <dt>Outbound grant</dt>
          <dd>{preview.requiresOutboundNavigationGrantRef}</dd>
        </div>
      </dl>
      <p>{preview.disabledReason}</p>
      <button
        type="button"
        className="ops-button"
        data-testid="gap-resolution-primary-action"
        data-action-kind={preview.actionKind}
        data-action-allowed={preview.actionAllowed}
        data-raw-artifact-url-suppressed={preview.rawArtifactUrlSuppressed}
        disabled={!preview.actionAllowed}
      >
        {preview.actionLabel}
      </button>
    </aside>
  );
}

function ComplianceLedgerPanel(props: {
  projection: ComplianceLedgerProjection;
  onSelectFramework: (frameworkCode: ComplianceLedgerProjection["selectedFrameworkCode"]) => void;
  onSelectControl: (controlRef: string) => void;
  onSelectGap: (gapRef: string) => void;
  onFilterChange: (filter: GapQueueFilterKey) => void;
  onSortChange: (sort: GapQueueSortKey) => void;
}) {
  const selectedRow =
    props.projection.ledgerRows.find((row) => row.selected) ?? props.projection.ledgerRows[0];
  return (
    <section
      className="ops-assurance-surface ops-compliance-ledger"
      data-testid="compliance-ledger-panel"
      data-surface="compliance-ledger-panel"
      data-visual-mode={props.projection.visualMode}
      data-scenario-state={props.projection.scenarioState}
      data-framework={props.projection.selectedFrameworkCode}
      data-graph-verdict={props.projection.graphBlocker.graphVerdictState}
      data-action-control-state={props.projection.actionControlState}
      data-projection-update-state={props.projection.projectionUpdateState}
      data-selected-control={props.projection.selectedControlRef}
      data-selected-gap={props.projection.selectedGapRef}
      data-no-raw-artifact-urls={props.projection.noRawArtifactUrls}
      aria-label="Compliance Ledger Panel"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Compliance Ledger Panel</p>
          <h2>Control evidence accountability</h2>
        </div>
        <span className="ops-panel__headline">{props.projection.graphBlocker.summary}</span>
      </header>

      <div className="ops-compliance-version-strip" aria-label="Standards version context">
        {props.projection.standardsVersionContexts.map((context) => (
          <StandardsVersionContextChip
            key={context.frameworkCode}
            context={context}
            onSelect={props.onSelectFramework}
          />
        ))}
      </div>

      <GraphCompletenessBlockerCard projection={props.projection} />

      <div className="ops-compliance-grid">
        <section className="ops-compliance-ledger-table" aria-label="Control status ledger">
          <header className="ops-assurance-surface__header">
            <div>
              <p className="ops-panel__eyebrow">Control ledger</p>
              <h3>{props.projection.ledgerRows.length} control rows</h3>
            </div>
            <span>{props.projection.controlStatusSnapshotRef}</span>
          </header>
          <div className="ops-panel__table">
            <table className="ops-table">
              <caption>Compliance ledger control status rows</caption>
              <thead>
                <tr>
                  <th scope="col">Control</th>
                  <th scope="col">Status</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Evidence</th>
                  <th scope="col">Coverage</th>
                  <th scope="col">Graph</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.ledgerRows.map((row) => (
                  <ControlStatusLedgerRow
                    key={row.controlRef}
                    row={row}
                    onSelect={props.onSelectControl}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="ops-compliance-side-stack">
          <EvidenceGraphMiniMap projection={props.projection} />
          <GapOwnerBurdenRail projection={props.projection} />
        </div>
      </div>

      <CAPAAndIncidentLinkStrip projection={props.projection} row={selectedRow} />

      <div className="ops-compliance-gap-grid">
        <ControlEvidenceGapQueue
          projection={props.projection}
          onSelectGap={props.onSelectGap}
          onFilterChange={props.onFilterChange}
          onSortChange={props.onSortChange}
        />
        <EvidenceGapResolutionDrawer projection={props.projection} />
      </div>
    </section>
  );
}

function ConformanceStatePill(props: { state: string; label?: string }) {
  return (
    <strong className="ops-conformance-pill" data-tone={assuranceTone(props.state)}>
      {props.label ?? titleCase(props.state)}
    </strong>
  );
}

function ScorecardHashCard(props: { projection: CrossPhaseConformanceScorecardProjection }) {
  const hash = props.projection.scorecardHash;
  return (
    <section
      className="ops-conformance-hash"
      data-testid="scorecard-hash-card"
      data-surface="scorecard-hash-card"
      data-scorecard-state={hash.scorecardState}
      data-graph-verdict={hash.graphVerdictState}
      aria-label="Scorecard hash card"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Scorecard hash</p>
          <h3>{hash.hashPrefix}</h3>
        </div>
        <span data-tone={assuranceTone(hash.scorecardState)}>{titleCase(hash.scorecardState)}</span>
      </header>
      <dl className="ops-assurance-hash-grid">
        <div>
          <dt>Release</dt>
          <dd>{props.projection.releaseRef}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>{props.projection.tenantScope}</dd>
        </div>
        <div>
          <dt>Generated</dt>
          <dd>{hash.generatedAt}</dd>
        </div>
        <div>
          <dt>Graph verdict</dt>
          <dd>{titleCase(hash.graphVerdictState)}</dd>
        </div>
      </dl>
      <p>{hash.signoffConsequence}</p>
    </section>
  );
}

function RuntimeTupleCoverageBand(props: { projection: CrossPhaseConformanceScorecardProjection }) {
  const coverage = props.projection.runtimeTupleCoverage;
  return (
    <section
      className="ops-conformance-band"
      data-testid="runtime-tuple-coverage-band"
      data-surface="runtime-tuple-coverage-band"
      data-coverage-state={coverage.coverageState}
      aria-label="Runtime tuple coverage"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Runtime tuple</p>
          <h3>{titleCase(coverage.coverageState)} coverage</h3>
        </div>
        <span data-tone={assuranceTone(coverage.coverageState)}>{coverage.tupleHashRef}</span>
      </header>
      <div className="ops-conformance-counts">
        <span>
          <strong>{coverage.runtimeBundleCount}</strong>
          <small>Runtime bundles</small>
        </span>
        <span>
          <strong>{coverage.verificationScenarioCount}</strong>
          <small>Verification scenarios</small>
        </span>
        <span>
          <strong>{coverage.recoveryDispositionCount}</strong>
          <small>Recovery dispositions</small>
        </span>
      </div>
      <p>{coverage.summary}</p>
    </section>
  );
}

function GovernanceOpsProofRail(props: { projection: CrossPhaseConformanceScorecardProjection }) {
  const rail = props.projection.governanceOpsProofRail;
  return (
    <aside
      className="ops-conformance-rail"
      data-testid="governance-ops-proof-rail"
      data-surface="governance-ops-proof-rail"
      data-governance-state={rail.governanceProofState}
      data-operations-state={rail.operationsProofState}
      aria-label="Governance and operations proof rail"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Gov / ops proof</p>
          <h3>{titleCase(rail.recoveryPostureState)} recovery posture</h3>
        </div>
        <span data-tone={assuranceTone(rail.operationsProofState)}>
          {titleCase(rail.operationsProofState)}
        </span>
      </header>
      <dl className="ops-keyfacts">
        <div>
          <dt>Governance bundles</dt>
          <dd>{rail.governanceBundleCount}</dd>
        </div>
        <div>
          <dt>Ops slices</dt>
          <dd>{rail.opsSliceCount}</dd>
        </div>
        <div>
          <dt>Recovery dispositions</dt>
          <dd>{rail.recoveryDispositionCount}</dd>
        </div>
      </dl>
      <ul className="ops-inline-list">
        {rail.proofRefs.slice(0, 5).map((ref) => (
          <li key={ref}>{ref}</li>
        ))}
      </ul>
    </aside>
  );
}

function BAUSignoffBlockerQueue(props: {
  projection: CrossPhaseConformanceScorecardProjection;
  onSelectRow: (rowRef: string) => void;
}) {
  const queue = props.projection.blockerQueue;
  const readiness = props.projection.bauSignoffReadiness;
  return (
    <section
      className="ops-conformance-blockers"
      data-testid="bau-signoff-blocker-queue"
      data-surface="bau-signoff-blocker-queue"
      data-queue-state={queue.queueState}
      data-action-state={readiness.actionState}
      aria-label="BAU signoff blocker queue"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">BAU signoff</p>
          <h3>{queue.blockerCount} blocker(s)</h3>
        </div>
        <span data-tone={assuranceTone(readiness.actionState)}>
          {titleCase(readiness.actionState)}
        </span>
      </header>
      <button
        type="button"
        className="ops-button"
        data-testid="bau-signoff-primary-action"
        data-action-allowed={readiness.actionAllowed}
        data-disabled-reason={readiness.disabledReason}
        aria-disabled={!readiness.actionAllowed}
        aria-describedby="bau-signoff-disabled-reason"
        disabled={!readiness.actionAllowed}
      >
        {readiness.actionAllowed ? "Record BAU signoff" : "BAU signoff blocked"}
      </button>
      <p id="bau-signoff-disabled-reason">{readiness.disabledReason}</p>
      <ul className="ops-compliance-gap-list">
        {(queue.items.length > 0
          ? queue.items
          : [
              {
                blockerRef: "blocker:none",
                sourceRowRef: props.projection.selectedRowRef,
                sourcePhaseCode: "no_blocker",
                ownerKey: "service_owner" as const,
                ownerLabel: "Service owner",
                severity: "watch" as const,
                dueAt: "not scheduled",
                failedPredicate: "no_open_blocker_for_selected_filters",
                consequence: "No blocker matches the active filters.",
                nextSafeAction: "Keep the current proof set pinned",
                selected: false,
              },
            ]
        ).map((item) => (
          <li
            key={item.blockerRef}
            data-testid={`conformance-blocker-${automationId(item.blockerRef)}`}
            data-severity={item.severity}
            data-status={queue.queueState}
          >
            <button
              type="button"
              data-selected={item.selected}
              data-blocker-ref={item.blockerRef}
              data-source-row-ref={item.sourceRowRef}
              onClick={() => props.onSelectRow(item.sourceRowRef)}
              disabled={item.blockerRef === "blocker:none"}
            >
              <strong>{item.failedPredicate}</strong>
              <span>
                {item.ownerLabel} / {item.dueAt}
              </span>
              <small>{item.consequence}</small>
              <small>{item.nextSafeAction}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PhaseRowProofTable(props: {
  projection: CrossPhaseConformanceScorecardProjection;
  onSelectRow: (rowRef: string) => void;
}) {
  const rows =
    props.projection.visibleRows.length > 0
      ? props.projection.visibleRows
      : props.projection.phaseRows.filter((row) => row.selected);
  return (
    <section
      className="ops-conformance-table"
      data-testid="phase-row-proof-table"
      data-surface="phase-row-proof-table"
      aria-label="Phase row proof table"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Phase row proof</p>
          <h3>{props.projection.visibleRows.length} visible row(s)</h3>
        </div>
        <span>{props.projection.interfaceGapArtifactRef}</span>
      </header>
      <div className="ops-panel__table">
        <table className="ops-table">
          <caption>Cross-phase conformance proof rows</caption>
          <thead>
            <tr>
              <th scope="col">Phase / family</th>
              <th scope="col">Summary</th>
              <th scope="col">Contract</th>
              <th scope="col">Verification</th>
              <th scope="col">Ops</th>
              <th scope="col">Governance</th>
              <th scope="col">Recovery</th>
              <th scope="col">End state</th>
              <th scope="col">Hash</th>
              <th scope="col">Blockers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.phaseConformanceRowId}
                data-testid={`phase-row-${automationId(row.phaseCode)}`}
                data-row-ref={row.phaseConformanceRowId}
                data-row-state={row.rowState}
                data-row-kind={row.rowKind}
                data-owner={row.ownerKey}
                data-selected={row.selected}
                tabIndex={0}
                aria-selected={row.selected}
                onClick={() => props.onSelectRow(row.phaseConformanceRowId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    props.onSelectRow(row.phaseConformanceRowId);
                  }
                }}
              >
                <th scope="row">
                  <button
                    type="button"
                    className="ops-link-button"
                    onClick={() => props.onSelectRow(row.phaseConformanceRowId)}
                  >
                    {row.phaseLabel}
                  </button>
                  <span>{row.ownerLabel}</span>
                </th>
                <td>
                  <ConformanceStatePill state={row.summaryAlignmentState} />
                  <small>{row.summarySourceRefs[0]}</small>
                </td>
                <td>
                  <ConformanceStatePill state={row.contractAdoptionState} />
                  <small>{row.canonicalBlueprintRefs[0]}</small>
                </td>
                <td>
                  <ConformanceStatePill state={row.verificationCoverageState} />
                  <small>{row.verificationScenarioRefs[0]}</small>
                </td>
                <td>
                  <ConformanceStatePill state={row.operationalProofState} />
                  <small>{row.opsProofRefs[0]}</small>
                </td>
                <td>
                  <ConformanceStatePill state={row.governanceProofState} />
                  <small>{row.governanceProofRefs[0]}</small>
                </td>
                <td>
                  <ConformanceStatePill state={row.recoveryPostureState} />
                  <small>{row.recoveryDispositionRefs[0]}</small>
                </td>
                <td>
                  <ConformanceStatePill state={row.endStateProofState} />
                  <small>{row.endStateProofRefs[0]}</small>
                </td>
                <td>
                  {row.rowHash.slice(0, 12)}
                  <small>{titleCase(row.rowHashParity)}</small>
                </td>
                <td>
                  {row.blockerRefs.length}
                  <small>{row.failedPredicate}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CrossPhaseControlFamilyMatrix(props: {
  projection: CrossPhaseConformanceScorecardProjection;
}) {
  const matrix = props.projection.controlFamilyMatrix;
  return (
    <section
      className="ops-conformance-matrix"
      data-testid="cross-phase-control-family-matrix"
      data-surface="cross-phase-control-family-matrix"
      data-matrix-state={matrix.state}
      aria-label="Cross-phase control family matrix"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Control family matrix</p>
          <h3>{titleCase(matrix.state)} shared controls</h3>
        </div>
        <span data-tone={assuranceTone(matrix.state)}>{matrix.matrixRef}</span>
      </header>
      <div className="ops-panel__table">
        <table className="ops-table ops-table--compact">
          <caption>Shared control families by proof dimension</caption>
          <thead>
            <tr>
              <th scope="col">Family</th>
              {matrix.dimensions.map((dimension) => (
                <th key={dimension} scope="col">
                  {titleCase(dimension)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.families.map((family) => (
              <tr key={family}>
                <th scope="row">{titleCase(family)}</th>
                {matrix.dimensions.map((dimension) => {
                  const cell = matrix.cells.find(
                    (candidate) =>
                      candidate.controlFamily === family && candidate.dimension === dimension,
                  );
                  return (
                    <td
                      key={`${family}-${dimension}`}
                      data-cell-state={cell?.state ?? "blocked"}
                      data-cell-ref={cell?.cellRef}
                    >
                      <ConformanceStatePill state={cell?.state ?? "blocked"} />
                      <small>{cell?.consequence}</small>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryAlignmentDiffPanel(props: {
  projection: CrossPhaseConformanceScorecardProjection;
}) {
  const diff = props.projection.rowDiff;
  return (
    <section
      className="ops-conformance-diff"
      data-testid="summary-alignment-diff-panel"
      data-surface="summary-alignment-diff-panel"
      data-diff-state={diff.diffState}
      aria-label="Summary alignment diff"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Summary diff</p>
          <h3>{titleCase(diff.diffState)}</h3>
        </div>
        <span data-tone={assuranceTone(diff.diffState)}>{diff.rowDiffRef}</span>
      </header>
      <dl className="ops-keyfacts">
        <div>
          <dt>Expected</dt>
          <dd>{diff.beforeSummary}</dd>
        </div>
        <div>
          <dt>Actual</dt>
          <dd>{diff.afterSummary}</dd>
        </div>
      </dl>
      <ul className="ops-inline-list">
        {(diff.changedRefs.length > 0 ? diff.changedRefs : ["no changed refs"]).map((ref) => (
          <li key={ref}>{ref}</li>
        ))}
      </ul>
    </section>
  );
}

function ConformanceSourceTraceDrawer(props: {
  projection: CrossPhaseConformanceScorecardProjection;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
}) {
  const trace = props.projection.sourceTrace;
  return (
    <aside
      className="ops-conformance-drawer"
      data-testid="conformance-source-trace-drawer"
      data-surface="conformance-source-trace-drawer"
      data-drawer-state={trace.drawerState}
      data-selected-row-ref={trace.selectedRowRef}
      aria-label="Conformance source trace drawer"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Source trace</p>
          <h3>{trace.selectedRowLabel}</h3>
        </div>
        <button
          type="button"
          className="ops-chip"
          data-testid="source-trace-drawer-toggle"
          data-drawer-state={trace.drawerState}
          onClick={props.onToggleDrawer}
          aria-expanded={props.drawerOpen}
        >
          {props.drawerOpen ? "Close" : "Open"}
        </button>
      </header>
      {props.drawerOpen ? (
        <>
          <ol className="ops-conformance-trace">
            {trace.steps.map((step) => (
              <li key={step.stepKey} data-state={step.state}>
                <strong>{step.label}</strong>
                <ConformanceStatePill state={step.state} />
                <small>{step.sourceRefs.join(" / ")}</small>
                <span>{step.consequence}</span>
              </li>
            ))}
          </ol>
          <dl className="ops-keyfacts">
            <div>
              <dt>Return token</dt>
              <dd>{trace.returnTokenRef}</dd>
            </div>
            <div>
              <dt>Selected row</dt>
              <dd>{trace.selectedRowRef}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </aside>
  );
}

function ConformanceHandoffStrip(props: { projection: CrossPhaseConformanceScorecardProjection }) {
  return (
    <section
      className="ops-compliance-link-strip"
      data-testid="conformance-handoff-strip"
      data-surface="conformance-handoff-strip"
      aria-label="Conformance same-shell handoffs"
    >
      {props.projection.safeHandoffLinks.map((handoff) => (
        <button
          key={handoff.handoffRef}
          type="button"
          className="ops-chip"
          data-handoff-target={handoff.targetSurface}
          data-handoff-route={handoff.route}
          data-return-token-ref={handoff.returnTokenRef}
          data-raw-artifact-url-suppressed={handoff.rawArtifactUrlSuppressed}
        >
          <span>{handoff.label}</span>
          <small>{handoff.selectedRowRef}</small>
        </button>
      ))}
    </section>
  );
}

function ConformanceFilterBar(props: {
  projection: CrossPhaseConformanceScorecardProjection;
  scenarioState: ConformanceScorecardScenarioState;
  onScenarioChange: (scenarioState: ConformanceScorecardScenarioState) => void;
  onPhaseChange: (phaseFilter: string) => void;
  onDimensionChange: (dimensionFilter: ProofDimensionKey) => void;
  onOwnerChange: (ownerFilter: ConformanceOwnerKey) => void;
  onBlockerChange: (blockerFilter: ConformanceBlockerFilterKey) => void;
  onStateChange: (stateFilter: ConformanceStateFilterKey) => void;
}) {
  const scenarioOptions = [
    "exact",
    "stale",
    "blocked",
    "summary_drift",
    "missing_verification",
    "stale_runtime_tuple",
    "missing_ops_proof",
    "deferred_channel",
    "no_blocker",
    "permission_denied",
  ] as const;
  const dimensionOptions = [
    "all",
    "summary_alignment",
    "contract_adoption",
    "verification_coverage",
    "operational_proof",
    "governance_proof",
    "recovery_posture",
    "end_state_proof",
  ] as const satisfies readonly ProofDimensionKey[];
  const ownerOptions = [
    "all",
    "service_owner",
    "governance",
    "operations",
    "release",
    "resilience",
  ] as const satisfies readonly ConformanceOwnerKey[];
  const blockerOptions = [
    "all",
    "has_blocker",
    "no_blocker",
  ] as const satisfies readonly ConformanceBlockerFilterKey[];
  const stateOptions = [
    "all",
    "exact",
    "stale",
    "blocked",
    "deferred",
  ] as const satisfies readonly ConformanceStateFilterKey[];

  return (
    <section
      className="ops-conformance-filters"
      data-testid="conformance-filter-bar"
      data-surface="conformance-filter-bar"
      aria-label="Conformance scorecard filters"
    >
      <label>
        <span>Scenario</span>
        <select
          data-testid="conformance-filter-scenario"
          value={props.scenarioState}
          onChange={(event) =>
            props.onScenarioChange(normalizeConformanceScorecardScenarioState(event.target.value))
          }
        >
          {scenarioOptions.map((option) => (
            <option key={option} value={option}>
              {titleCase(option)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Phase</span>
        <select
          data-testid="conformance-filter-phase"
          value={props.projection.filters.phaseFilter}
          onChange={(event) => props.onPhaseChange(event.target.value)}
        >
          {props.projection.filters.phaseOptions.map((option) => (
            <option key={option} value={option}>
              {titleCase(option)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Dimension</span>
        <select
          data-testid="conformance-filter-dimension"
          value={props.projection.filters.dimensionFilter}
          onChange={(event) => props.onDimensionChange(event.target.value as ProofDimensionKey)}
        >
          {dimensionOptions.map((option) => (
            <option key={option} value={option}>
              {titleCase(option)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Owner</span>
        <select
          data-testid="conformance-filter-owner"
          value={props.projection.filters.ownerFilter}
          onChange={(event) => props.onOwnerChange(event.target.value as ConformanceOwnerKey)}
        >
          {ownerOptions.map((option) => (
            <option key={option} value={option}>
              {titleCase(option)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Blocker</span>
        <select
          data-testid="conformance-filter-blocker"
          value={props.projection.filters.blockerFilter}
          onChange={(event) =>
            props.onBlockerChange(event.target.value as ConformanceBlockerFilterKey)
          }
        >
          {blockerOptions.map((option) => (
            <option key={option} value={option}>
              {titleCase(option)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>State</span>
        <select
          data-testid="conformance-filter-state"
          value={props.projection.filters.stateFilter}
          onChange={(event) => props.onStateChange(event.target.value as ConformanceStateFilterKey)}
        >
          {stateOptions.map((option) => (
            <option key={option} value={option}>
              {titleCase(option)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function Phase9ExitGateStatusSurface(props: { projection: Phase9ExitGateStatusProjection }) {
  const approvalEnabled = props.projection.approvalControlState === "enabled";
  return (
    <section
      className="ops-conformance-band"
      data-testid="phase9-exit-gate-status"
      data-surface="phase9-exit-gate-status"
      data-visual-mode={props.projection.visualMode}
      data-scenario-state={props.projection.scenarioState}
      data-decision-state={props.projection.decisionState}
      data-approval-control-state={props.projection.approvalControlState}
      data-release-to-bau-guard-state={props.projection.releaseToBAURecordGuardState}
      data-completion-evidence-bundle-hash={props.projection.completionEvidenceBundleHash}
      data-no-raw-artifact-urls={props.projection.noRawArtifactUrls}
      aria-label="Phase 9 exit gate status"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Phase 9 exit gate</p>
          <h3>{props.projection.statusHeadline}</h3>
        </div>
        <ConformanceStatePill state={props.projection.decisionState} />
      </header>
      <p>{props.projection.approvalDisabledReason}</p>
      <div className="ops-conformance-counts">
        <span>
          <strong>{props.projection.exactRowCount}</strong>
          <small>Exact rows</small>
        </span>
        <span>
          <strong>{props.projection.mandatoryRowCount}</strong>
          <small>Mandatory rows</small>
        </span>
        <span>
          <strong>{props.projection.blockerCount}</strong>
          <small>Blockers</small>
        </span>
      </div>
      <button
        type="button"
        className="ops-button"
        data-testid="phase9-exit-gate-approval-action"
        data-action-allowed={approvalEnabled}
        aria-disabled={!approvalEnabled}
        disabled={!approvalEnabled}
        aria-describedby="phase9-exit-gate-approval-reason"
      >
        {approvalEnabled ? "Approve Phase 9 exit gate" : "Exit gate approval blocked"}
      </button>
      <p id="phase9-exit-gate-approval-reason">{props.projection.approvalDisabledReason}</p>
      <div className="ops-panel__table">
        <table className="ops-table ops-table--compact">
          <caption>Phase 9 exit gate proof rows</caption>
          <thead>
            <tr>
              <th scope="col">Proof row</th>
              <th scope="col">Owner</th>
              <th scope="col">Mandatory</th>
              <th scope="col">State</th>
              <th scope="col">Hash</th>
              <th scope="col">Next action</th>
            </tr>
          </thead>
          <tbody>
            {props.projection.rows.map((row) => (
              <tr
                key={row.rowId}
                data-testid={`phase9-exit-gate-row-${automationId(row.rowId)}`}
                data-row-state={row.rowState}
                data-mandatory={row.mandatory}
                tabIndex={0}
              >
                <th scope="row">{row.title}</th>
                <td>{titleCase(row.owner)}</td>
                <td>{row.mandatory ? "Mandatory" : "Deferred scope"}</td>
                <td>
                  <ConformanceStatePill state={row.rowState} />
                </td>
                <td>{row.rowHash.slice(0, 12)}</td>
                <td>{row.nextSafeAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section
        className="ops-conformance-blockers"
        data-testid="phase9-exit-gate-blockers"
        data-blocker-count={props.projection.blockerCount}
        aria-label="Phase 9 exit gate blockers"
      >
        <h4>Blockers</h4>
        {props.projection.blockers.length > 0 ? (
          <ul className="ops-compliance-gap-list">
            {props.projection.blockers.map((blocker) => (
              <li
                key={blocker.blockerId}
                data-testid={`phase9-blocker-${automationId(blocker.blockerId)}`}
              >
                <strong>{blocker.machineReason}</strong>
                <span>{titleCase(blocker.owner)}</span>
                <small>{blocker.nextSafeAction}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No blockers remain for mandatory rows.</p>
        )}
      </section>
      <section
        className="ops-compliance-link-strip"
        data-testid="phase9-exit-gate-handoffs"
        aria-label="Phase 9 exit gate artifact handoffs"
      >
        {props.projection.artifactHandoffs.map((handoff) => (
          <button
            key={handoff.handoffRef}
            type="button"
            className="ops-chip"
            data-payload-class={handoff.payloadClass}
            data-artifact-presentation-contract={handoff.artifactPresentationContract}
            data-outbound-navigation-grant={handoff.outboundNavigationGrant}
            data-safe-return-token={handoff.safeReturnToken}
            data-raw-artifact-url-suppressed={handoff.rawArtifactUrlSuppressed}
          >
            <span>{handoff.label}</span>
            <small>{handoff.safeReturnToken}</small>
          </button>
        ))}
      </section>
    </section>
  );
}

function ProgrammeConformance472Surface(props: {
  projection: ProgrammeConformance472Projection;
  onScenarioChange: (scenarioState: ProgrammeConformance472ScenarioState) => void;
  onSelectRow: (rowRef: string) => void;
}) {
  const scenarioOptions: readonly ProgrammeConformance472ScenarioState[] = [
    "exact",
    "blocked",
    "deferred_scope",
    "summary_drift",
  ];
  return (
    <section
      className="ops-conformance-band"
      data-testid="programme-472-scorecard"
      data-surface="programme-472-scorecard"
      data-visual-mode={props.projection.visualMode}
      data-scenario-state={props.projection.scenarioState}
      data-scorecard-state={props.projection.scorecardState}
      data-authoritative-scorecard-state={props.projection.authoritativeScorecardState}
      data-summary-alignment-state={props.projection.summaryAlignmentState}
      data-summary-correction-state={props.projection.summaryCorrectionState}
      data-deferred-scope-state={props.projection.deferredScopeState}
      data-bau-handoff-state={props.projection.bauHandoffState}
      data-scorecard-hash={props.projection.scorecardHash}
      data-selected-row-ref={props.projection.selectedRowRef}
      data-no-raw-artifact-urls={props.projection.noRawArtifactUrls}
      aria-label="Programme 472 cross-phase conformance scorecard"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Programme merge 472</p>
          <h3>Cross-phase conformance scorecard</h3>
        </div>
        <ConformanceStatePill state={props.projection.scorecardState} />
      </header>
      <section className="ops-conformance-filters" aria-label="Programme 472 scenario controls">
        {scenarioOptions.map((scenarioState) => (
          <button
            key={scenarioState}
            type="button"
            className="ops-chip"
            data-testid={`programme-472-scenario-${scenarioState}`}
            data-active={props.projection.scenarioState === scenarioState}
            onClick={() => props.onScenarioChange(scenarioState)}
          >
            {titleCase(scenarioState)}
          </button>
        ))}
      </section>
      <section
        className="ops-conformance-hash"
        data-testid="programme-472-hash-card"
        data-scorecard-hash={props.projection.scorecardHash}
        data-scorecard-state={props.projection.scorecardState}
      >
        <span>
          <strong>{props.projection.scorecardHashPrefix}</strong>
          <small>Scorecard hash prefix</small>
        </span>
        <span>
          <strong>
            {props.projection.exactMandatoryRowCount}/{props.projection.mandatoryRowCount}
          </strong>
          <small>Mandatory rows exact</small>
        </span>
        <span>
          <strong>{props.projection.deferredRowCount}</strong>
          <small>Explicit deferred rows</small>
        </span>
        <span>
          <strong>{props.projection.blockerCount}</strong>
          <small>Visible blockers</small>
        </span>
      </section>

      <div className="ops-panel__table" data-testid="programme-472-row-table">
        <table className="ops-table ops-table--compact">
          <caption>Programme 472 phase and control-family rows</caption>
          <thead>
            <tr>
              <th scope="col">Row</th>
              <th scope="col">Kind</th>
              <th scope="col">Owner</th>
              <th scope="col">Mandatory</th>
              <th scope="col">State</th>
              <th scope="col">Hash</th>
              <th scope="col">Next action</th>
            </tr>
          </thead>
          <tbody>
            {props.projection.rows.map((row) => (
              <tr
                key={row.rowId}
                data-testid={`programme-472-row-${automationId(row.rowId)}`}
                data-row-state={row.rowState}
                data-row-kind={row.rowKind}
                data-row-code={row.rowCode}
                data-mandatory={row.mandatoryForCurrentCoreRelease}
                data-permitted-deferred-scope={row.permittedDeferredScope}
                data-selected={row.selected}
              >
                <th scope="row">
                  <button
                    type="button"
                    className="ops-link-button"
                    data-testid={`programme-472-select-row-${automationId(row.rowId)}`}
                    onClick={() => props.onSelectRow(row.rowId)}
                  >
                    {row.label}
                  </button>
                </th>
                <td>{titleCase(row.rowKind)}</td>
                <td>{titleCase(row.owner)}</td>
                <td>{row.mandatoryForCurrentCoreRelease ? "Mandatory" : "Deferred scope"}</td>
                <td>
                  <ConformanceStatePill state={row.rowState} />
                </td>
                <td>{row.rowHash.slice(0, 12)}</td>
                <td>{row.nextSafeAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section
        className="ops-conformance-band"
        data-testid="programme-472-deferred-scope"
        data-deferred-scope-state={props.projection.deferredScopeState}
        data-deferred-phase-row-id={props.projection.deferredScope.deferredPhaseRowId}
        aria-label="Programme 472 Phase 7 deferred scope"
      >
        <header className="ops-assurance-surface__header">
          <div>
            <p className="ops-panel__eyebrow">Phase 7 boundary</p>
            <h4>{titleCase(props.projection.deferredScope.phase7LiveNhsAppLaunchState)}</h4>
          </div>
          <ConformanceStatePill state={props.projection.deferredScopeState} />
        </header>
        <p>{props.projection.deferredScope.scorecardRule}</p>
        <ul className="ops-inline-list">
          {props.projection.deferredScope.activeDependencyRefs.map((dependencyRef) => (
            <li key={dependencyRef}>{dependencyRef}</li>
          ))}
        </ul>
      </section>

      <section
        className="ops-conformance-blockers"
        data-testid="programme-472-summary-corrections"
        data-summary-correction-state={props.projection.summaryCorrectionState}
        data-blocked-claim-count={props.projection.summaryCorrections.length}
        aria-label="Programme 472 summary alignment corrections"
      >
        <h4>Blocked original summary claims</h4>
        <ul className="ops-compliance-gap-list">
          {props.projection.summaryCorrections.map((correction) => (
            <li
              key={correction.correctionId}
              data-testid={`programme-472-correction-${automationId(correction.correctionId)}`}
              data-original-claim-state={correction.originalClaimState}
              data-correction-applied={correction.correctionApplied}
            >
              <strong>{correction.staleOrFlattenedClaim}</strong>
              <span>{correction.requiredCorrection}</span>
              <small>{correction.affectedRows.join(", ")}</small>
            </li>
          ))}
        </ul>
      </section>

      <details
        className="ops-conformance-drawer"
        data-testid="programme-472-source-trace-drawer"
        data-drawer-state="open"
        open
      >
        <summary>Source trace for {props.projection.selectedRow.label}</summary>
        <p data-testid="programme-472-selected-row-details">
          {props.projection.selectedRow.consequence}
        </p>
        <ol className="ops-conformance-trace">
          {props.projection.sourceTraceRefs.map((sourceRef) => (
            <li key={sourceRef}>{sourceRef}</li>
          ))}
          {props.projection.selectedRow.requiredProofRefs.map((proofRef) => (
            <li key={proofRef}>{proofRef}</li>
          ))}
        </ol>
      </details>

      <section
        className="ops-compliance-link-strip"
        data-testid="programme-472-handoffs"
        aria-label="Programme 472 same-shell handoffs"
      >
        {props.projection.handoffs.map((handoff) => (
          <button
            key={handoff.handoffRef}
            type="button"
            className="ops-chip"
            data-route={handoff.route}
            data-selected-row-ref={handoff.selectedRowRef}
            data-return-token-ref={handoff.returnTokenRef}
            data-safe-return-token={handoff.safeReturnToken}
            data-artifact-presentation-contract={handoff.artifactPresentationContract}
            data-outbound-navigation-grant={handoff.outboundNavigationGrant}
            data-raw-artifact-url-suppressed={handoff.rawArtifactUrlSuppressed}
          >
            <span>{handoff.label}</span>
            <small>{handoff.safeReturnToken}</small>
          </button>
        ))}
      </section>
    </section>
  );
}

function Phase7ChannelReconciliation473Surface(props: {
  projection: Phase7ChannelReconciliation473Projection;
  onScenarioChange: (scenarioState: Phase7ChannelScenarioState) => void;
  onRouteSelect: (routeFamily: string) => void;
}) {
  const scenarioOptions: readonly Phase7ChannelScenarioState[] = [
    "exact",
    "deferred",
    "blocked",
    "stale",
    "not_applicable",
  ];
  const reconcileEnabled = props.projection.reconcileActionState === "enabled";
  return (
    <section
      className="ops-conformance-band"
      data-testid="phase7-channel-reconciliation"
      data-surface="phase7-channel-reconciliation"
      data-visual-mode={props.projection.visualMode}
      data-scenario-state={props.projection.scenarioState}
      data-readiness-state={props.projection.readinessState}
      data-scorecard-state={props.projection.scorecardState}
      data-row-state={props.projection.rowState}
      data-reconcile-action-state={props.projection.reconcileActionState}
      data-channel-activation-permitted={props.projection.channelActivationPermitted}
      data-selected-route-family={props.projection.selectedRouteFamily}
      data-no-raw-artifact-urls={props.projection.noRawArtifactUrls}
      data-responsive-contract={props.projection.responsiveContract}
      aria-label="Phase 7 NHS App channel reconciliation"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Phase 7 channel reconciliation</p>
          <h3>NHS App deferred-channel bridge</h3>
        </div>
        <ConformanceStatePill state={props.projection.readinessState} />
      </header>
      <section className="ops-conformance-filters" aria-label="Phase 7 channel scenario controls">
        {scenarioOptions.map((scenarioState) => (
          <button
            key={scenarioState}
            type="button"
            className="ops-chip"
            data-testid={`phase7-channel-scenario-${scenarioState}`}
            data-active={props.projection.scenarioState === scenarioState}
            onClick={() => props.onScenarioChange(scenarioState)}
          >
            {titleCase(scenarioState)}
          </button>
        ))}
      </section>

      <div className="ops-conformance-layout">
        <div className="ops-conformance-main">
          <section
            className="ops-conformance-hash"
            data-testid="phase7-channel-scorecard-strip"
            data-row-hash={props.projection.rowHash}
            data-after-scorecard-hash={props.projection.afterScorecardHash}
          >
            <span>
              <strong>{props.projection.rowHashPrefix}</strong>
              <small>Phase 7 row hash</small>
            </span>
            <span>
              <strong>{props.projection.manifestVersionRef}</strong>
              <small>Manifest</small>
            </span>
            <span>
              <strong>{props.projection.reconcileActionState}</strong>
              <small>Reconcile action</small>
            </span>
          </section>

          <section
            className="ops-panel__table"
            data-testid="phase7-channel-matrix"
            aria-label="Phase 7 conformance control matrix"
          >
            <table className="ops-table ops-table--compact">
              <caption>Phase 7 conformance control matrix</caption>
              <thead>
                <tr>
                  <th scope="col">Dimension</th>
                  <th scope="col">State</th>
                  <th scope="col">Authority</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    dimension: "summaryAlignmentState",
                    state: props.projection.rowState,
                    authority: "472 deferred row",
                  },
                  {
                    dimension: "contractAdoptionState",
                    state: props.projection.readinessState,
                    authority: "Manifest/runtime tuple",
                  },
                  {
                    dimension: "verificationCoverageState",
                    state: props.projection.selectedRoute.coverageState,
                    authority: "Embedded route coverage",
                  },
                  {
                    dimension: "operationalProofState",
                    state: props.projection.reconcileActionState,
                    authority: "Release guardrail and future inputs",
                  },
                  {
                    dimension: "endStateProofState",
                    state: props.projection.scorecardState,
                    authority: "Master scorecard patch",
                  },
                ].map(({ dimension, state, authority }) => (
                  <tr key={dimension} data-testid={`phase7-channel-dimension-${dimension}`}>
                    <th scope="row">{dimension}</th>
                    <td>
                      <ConformanceStatePill state={state} />
                    </td>
                    <td>{authority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            className="ops-panel__table"
            data-testid="phase7-embedded-route-matrix"
            aria-label="Phase 7 embedded route matrix"
          >
            <table className="ops-table ops-table--compact">
              <caption>Embedded route coverage</caption>
              <thead>
                <tr>
                  <th scope="col">Route family</th>
                  <th scope="col">Coverage</th>
                  <th scope="col">Journey paths</th>
                  <th scope="col">Hash</th>
                  <th scope="col">Fallback</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.routeRows.map((row) => (
                  <tr
                    key={row.coverageRowId}
                    data-testid={`phase7-route-row-${automationId(row.routeFamily)}`}
                    data-route-family={row.routeFamily}
                    data-coverage-state={row.coverageState}
                    data-selected={row.selected}
                  >
                    <th scope="row">
                      <button
                        type="button"
                        className="ops-link-button"
                        onClick={() => props.onRouteSelect(row.routeFamily)}
                      >
                        {titleCase(row.routeFamily)}
                      </button>
                    </th>
                    <td>
                      <ConformanceStatePill state={row.coverageState} />
                    </td>
                    <td>{row.journeyPathRefs.join(", ")}</td>
                    <td>
                      <button
                        type="button"
                        className="ops-link-button"
                        data-testid={`phase7-copy-hash-${automationId(row.routeFamily)}`}
                        data-copy-hash={row.rowHash}
                        aria-label={`Copy ${titleCase(row.routeFamily)} row hash`}
                      >
                        {row.rowHash.slice(0, 12)}
                      </button>
                    </td>
                    <td>{row.fallbackRefs.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <aside
          className="ops-conformance-side"
          data-testid="phase7-channel-readiness-rail"
          aria-label="Phase 7 channel readiness rail"
        >
          <section className="ops-conformance-blockers" data-testid="phase7-channel-blockers">
            <h4>Channel blockers</h4>
            {props.projection.blockers.length > 0 ? (
              <ul className="ops-compliance-gap-list">
                {props.projection.blockers.map((blocker) => (
                  <li
                    key={blocker.blockerId}
                    data-testid={`phase7-channel-blocker-${automationId(blocker.reasonCode)}`}
                    data-blocker-state={blocker.blockerState}
                  >
                    <strong>{titleCase(blocker.reasonCode)}</strong>
                    <span>{blocker.nextSafeAction}</span>
                    <small>{blocker.sourceRefs.join(", ")}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No blockers for this scenario.</p>
            )}
          </section>

          <section className="ops-conformance-rail" aria-label="Manifest and release tuple">
            <h4>Manifest tuple</h4>
            <ul className="ops-inline-list">
              <li>{props.projection.releaseRef}</li>
              {props.projection.environmentProfileRefs.map((profileRef) => (
                <li key={profileRef}>{profileRef}</li>
              ))}
              <li>{props.projection.scalBundleRef ?? "SCAL held until activation authority"}</li>
            </ul>
          </section>

          <section className="ops-conformance-rail" aria-label="Future authority inputs">
            <h4>Future inputs</h4>
            <ul className="ops-compliance-gap-list">
              {props.projection.optionalFutureInputStates.map((input) => (
                <li
                  key={input.taskId}
                  data-testid={`phase7-future-input-${automationId(input.taskId)}`}
                  data-availability-state={input.availabilityState}
                >
                  <strong>{input.taskId}</strong>
                  <span>{input.expectedArtifactRef}</span>
                  <small>{titleCase(input.availabilityState)}</small>
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            className="ops-button"
            data-testid="phase7-reconcile-as-complete"
            data-action-state={props.projection.reconcileActionState}
            data-channel-activation-permitted={props.projection.channelActivationPermitted}
            aria-disabled={!reconcileEnabled}
            disabled={!reconcileEnabled}
          >
            {reconcileEnabled ? "Reconcile Phase 7 as complete" : "Reconcile blocked"}
          </button>
        </aside>
      </div>

      <details
        className="ops-conformance-drawer"
        data-testid="phase7-channel-source-trace-drawer"
        data-drawer-state="open"
        open
      >
        <summary>Source trace for {titleCase(props.projection.selectedRouteFamily)}</summary>
        <p data-testid="phase7-selected-route-summary">
          {titleCase(props.projection.selectedRoute.coverageState)} coverage for{" "}
          {props.projection.selectedRoute.journeyPathRefs.join(", ")}.
        </p>
        <ol className="ops-conformance-trace">
          {props.projection.sourceTraceRefs.map((sourceRef) => (
            <li key={sourceRef}>{sourceRef}</li>
          ))}
          {props.projection.selectedRoute.routeContractRefs.map((contractRef) => (
            <li key={contractRef}>{contractRef}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function MigrationCutover474Surface(props: {
  projection: MigrationCutover474Projection;
  onScenarioChange: (scenarioState: MigrationCutover474ScenarioState) => void;
  onProjectionSelect: (projectionFamily: string) => void;
}) {
  const scenarioOptions: readonly MigrationCutover474ScenarioState[] = [
    "dry_run",
    "ready_with_constraints",
    "blocked",
    "rollback_only",
    "poison_record",
  ];
  const dryRunEnabled = props.projection.dryRunActionState === "enabled";
  const executeEnabled = props.projection.destructiveActionState === "enabled";
  return (
    <section
      className="ops-conformance-band"
      data-testid="migration-474-cutover-board"
      data-surface="migration-474-cutover-board"
      data-visual-mode={props.projection.visualMode}
      data-scenario-state={props.projection.scenarioState}
      data-cutover-decision={props.projection.cutoverDecision}
      data-dry-run-action-state={props.projection.dryRunActionState}
      data-destructive-action-state={props.projection.destructiveActionState}
      data-dry-run-permitted={props.projection.dryRunPermitted}
      data-destructive-execution-permitted={props.projection.destructiveExecutionPermitted}
      data-selected-projection-family={props.projection.selectedProjectionFamily}
      data-no-raw-artifact-urls={props.projection.noRawArtifactUrls}
      data-responsive-contract={props.projection.responsiveContract}
      aria-label="Task 474 migration cutover readiness board"
    >
      <header className="ops-assurance-surface__header">
        <div>
          <p className="ops-panel__eyebrow">Migration cutover 474</p>
          <h3>Dry-run cutover contract</h3>
        </div>
        <ConformanceStatePill state={props.projection.cutoverDecision} />
      </header>

      <section className="ops-conformance-filters" aria-label="Task 474 cutover scenarios">
        {scenarioOptions.map((scenarioState) => (
          <button
            key={scenarioState}
            type="button"
            className="ops-chip"
            data-testid={`migration-474-scenario-${scenarioState}`}
            data-active={props.projection.scenarioState === scenarioState}
            onClick={() => props.onScenarioChange(scenarioState)}
          >
            {titleCase(scenarioState)}
          </button>
        ))}
      </section>

      <section
        className="ops-conformance-hash"
        data-testid="migration-474-top-strip"
        data-migration-tuple-hash={props.projection.migrationTupleHash}
        data-release-candidate-ref={props.projection.releaseCandidateRef}
        data-runtime-bundle-ref={props.projection.runtimePublicationBundleRef}
        data-rollback-mode={props.projection.rollbackMode}
        aria-label="Task 474 release and migration tuple"
      >
        <span>
          <strong>{props.projection.releaseCandidateRef}</strong>
          <small>Release candidate</small>
        </span>
        <span>
          <strong>{props.projection.runtimePublicationBundleRef}</strong>
          <small>Runtime bundle</small>
        </span>
        <span>
          <strong>{props.projection.migrationTupleHashPrefix}</strong>
          <small>Migration tuple</small>
        </span>
        <span>
          <strong>{titleCase(props.projection.rollbackMode)}</strong>
          <small>Rollback mode</small>
        </span>
      </section>

      <div className="ops-conformance-layout">
        <div className="ops-conformance-main">
          <section
            className="ops-panel__table"
            data-testid="migration-474-cutover-ladder"
            aria-label="Task 474 ordered cutover ladder"
          >
            <table className="ops-table ops-table--compact">
              <caption>Ordered cutover ladder</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Step</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Settlement</th>
                  <th scope="col">Rollback</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.steps.map((step) => (
                  <tr
                    key={step.stepId}
                    data-testid={`migration-474-step-${automationId(step.stepId)}`}
                    data-settlement-state={step.settlementState}
                    data-privileged-mutation={step.privilegedMutation}
                    data-selected={step.selected}
                  >
                    <td>{step.order}</td>
                    <th scope="row">{step.title}</th>
                    <td>{step.owner}</td>
                    <td>
                      <ConformanceStatePill state={step.settlementState} />
                    </td>
                    <td>{step.rollbackDecisionRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            className="ops-panel__table"
            data-testid="migration-474-heatstrip"
            aria-label="Task 474 projection convergence heatstrip table fallback"
          >
            <table className="ops-table ops-table--compact">
              <caption>Projection convergence</caption>
              <thead>
                <tr>
                  <th scope="col">Projection</th>
                  <th scope="col">Convergence</th>
                  <th scope="col">Verdict</th>
                  <th scope="col">Lag</th>
                  <th scope="col">Dry run</th>
                  <th scope="col">Cutover</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.heatstripRows.map((row) => (
                  <tr
                    key={row.projectionFamily}
                    data-testid={`migration-474-heatstrip-row-${automationId(row.projectionFamily)}`}
                    data-projection-family={row.projectionFamily}
                    data-convergence-state={row.convergenceState}
                    data-verdict-state={row.verdictState}
                    data-selected={row.selected}
                  >
                    <th scope="row">
                      <button
                        type="button"
                        className="ops-link-button"
                        onClick={() => props.onProjectionSelect(row.projectionFamily)}
                      >
                        {titleCase(row.projectionFamily)}
                      </button>
                    </th>
                    <td>
                      <ConformanceStatePill state={row.convergenceState} />
                    </td>
                    <td>
                      <ConformanceStatePill state={row.verdictState} />
                    </td>
                    <td>
                      {row.lagEvents}/{row.lagBudgetEvents}
                    </td>
                    <td>{row.allowDryRun ? "Allowed" : "Blocked"}</td>
                    <td>{row.allowDestructiveCutover ? "Allowed" : "Disabled"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            className="ops-panel__table"
            data-testid="migration-474-rollback-matrix"
            aria-label="Task 474 stop resume and rollback matrix"
          >
            <table className="ops-table ops-table--compact">
              <caption>Stop, resume, and rollback</caption>
              <thead>
                <tr>
                  <th scope="col">Target</th>
                  <th scope="col">Decision</th>
                  <th scope="col">Stop condition</th>
                  <th scope="col">Fallback</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.rollbackDecisions.map((decision) => (
                  <tr
                    key={decision.rollbackDecisionId}
                    data-testid={`migration-474-rollback-${automationId(decision.targetRef)}`}
                    data-decision-state={decision.decisionState}
                  >
                    <th scope="row">{titleCase(decision.targetRef)}</th>
                    <td>
                      <ConformanceStatePill state={decision.decisionState} />
                    </td>
                    <td>{decision.stopCondition}</td>
                    <td>{decision.manualFallbackBindingRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            className="ops-panel__table"
            data-testid="migration-474-reference-manifest"
            data-no-phi={props.projection.referenceManifest.noPhi}
            data-no-pii={props.projection.referenceManifest.noPii}
            aria-label="Task 474 reference dataset manifest"
          >
            <table className="ops-table ops-table--compact">
              <caption>Reference dataset manifest</caption>
              <thead>
                <tr>
                  <th scope="col">Record class</th>
                  <th scope="col">Masking</th>
                  <th scope="col">Retention</th>
                  <th scope="col">Usage</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.referenceManifest.recordClasses.map((record) => (
                  <tr
                    key={record.recordClassId}
                    data-testid={`migration-474-reference-${automationId(record.recordClassId)}`}
                    data-masking-state={record.maskingState}
                  >
                    <th scope="row">{record.datasetRef}</th>
                    <td>{titleCase(record.maskingState)}</td>
                    <td>{titleCase(record.retentionClass)}</td>
                    <td>{record.allowedUsageContexts.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <aside
          className="ops-conformance-side"
          data-testid="migration-474-right-rail"
          aria-label="Task 474 blockers and fallback rail"
        >
          <section className="ops-conformance-blockers" aria-label="Cutover blockers">
            <h4>Blockers</h4>
            <ul className="ops-compliance-gap-list">
              {props.projection.blockers.map((blockerRef) => (
                <li
                  key={blockerRef}
                  data-testid={`migration-474-blocker-${automationId(blockerRef)}`}
                >
                  <strong>{titleCase(blockerRef.replace("blocker:474:", ""))}</strong>
                  <span>{blockerRef}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="ops-conformance-rail" aria-label="Manual fallbacks">
            <h4>Manual fallbacks</h4>
            <ul className="ops-compliance-gap-list">
              {props.projection.manualFallbackBindings.map((binding) => (
                <li
                  key={binding.bindingId}
                  data-testid={`migration-474-fallback-${automationId(binding.routeFamily)}`}
                >
                  <strong>{titleCase(binding.routeFamily)}</strong>
                  <span>{titleCase(binding.fallbackMode)}</span>
                  <small>{binding.owner}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="ops-conformance-rail" aria-label="Poison record quarantine">
            <h4>Poison quarantine</h4>
            <ul className="ops-compliance-gap-list">
              {props.projection.poisonRecords.map((record) => (
                <li
                  key={record.poisonRecordId}
                  data-testid={`migration-474-poison-${automationId(record.poisonRecordId)}`}
                  data-tenant-wide-block={record.tenantWideBlock}
                  data-safe-to-continue={record.safeToContinue}
                >
                  <strong>{titleCase(record.projectionFamily)}</strong>
                  <span>{titleCase(record.poisonState)}</span>
                  <small>{record.reasonCode}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="ops-conformance-rail" aria-label="Read-path compatibility">
            <h4>Compatible read paths</h4>
            <ul className="ops-compliance-gap-list">
              {props.projection.readPathRows.map((row) => (
                <li
                  key={row.routeFamily}
                  data-testid={`migration-474-read-path-${automationId(row.routeFamily)}`}
                  data-compatibility-state={row.compatibilityState}
                >
                  <strong>{titleCase(row.routeFamily)}</strong>
                  <span>{row.requiredReleaseRecoveryDispositionRef}</span>
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            className="ops-button"
            data-testid="migration-474-approve-dry-run"
            data-action-state={props.projection.dryRunActionState}
            aria-disabled={!dryRunEnabled}
            disabled={!dryRunEnabled}
          >
            {dryRunEnabled ? "Approve dry run" : "Block cutover"}
          </button>
          <button
            type="button"
            className="ops-button ops-button--secondary"
            data-testid="migration-474-execute-cutover"
            data-action-state={props.projection.destructiveActionState}
            aria-disabled={!executeEnabled}
            disabled={!executeEnabled}
          >
            Execute production cutover
          </button>
        </aside>
      </div>

      <details
        className="ops-conformance-drawer"
        data-testid="migration-474-source-trace-drawer"
        data-drawer-state="open"
        open
      >
        <summary>Source trace for {titleCase(props.projection.selectedProjectionFamily)}</summary>
        <ol className="ops-conformance-trace">
          {props.projection.sourceTraceRefs.map((sourceRef) => (
            <li key={sourceRef}>{sourceRef}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function training475Tone(state: string): string {
  if (state === "complete" || state === "exact" || state === "enabled") return "ready";
  if (state === "complete_with_constraints" || state === "constrained") return "guarded";
  return "blocked";
}

function TrainingRunbookCentre475Surface(props: {
  projection: TrainingRunbook475Projection;
  onScenarioChange: (scenarioState: TrainingRunbook475ScenarioState) => void;
  onRoleSelect: (roleId: TrainingRunbook475RoleId) => void;
}) {
  const [moduleDetailsOpen, setModuleDetailsOpen] = useState(true);
  const scenarioOptions: readonly TrainingRunbook475ScenarioState[] = [
    "complete",
    "constrained",
    "blocked",
    "superseded_runbook",
  ];

  const openRoleDetails = (roleId: TrainingRunbook475RoleId) => {
    props.onRoleSelect(roleId);
    setModuleDetailsOpen(true);
  };

  const closeModuleDetails = () => {
    setModuleDetailsOpen(false);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(
            `[data-testid="training-475-role-card-${props.projection.selectedRoleId}"]`,
          )
          ?.focus();
      });
    }
  };

  return (
    <section
      className="ops-conformance-band training-475-centre"
      data-testid="training-475-centre"
      data-surface="training-475-centre"
      data-readiness-state={props.projection.readinessState}
      data-scenario-state={props.projection.scenarioState}
      data-selected-role-id={props.projection.selectedRoleId}
      data-mark-complete-action-state={props.projection.markCompleteActionState}
      data-no-raw-artifact-urls={props.projection.noRawArtifactUrls}
      data-responsive-contract={props.projection.responsiveContract}
      aria-label="Task 475 Training and Runbook Centre"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Training and runbook centre 475</p>
          <h3>Launch operating model readiness</h3>
        </div>
        <strong
          className="ops-conformance-pill"
          data-tone={training475Tone(props.projection.readinessState)}
        >
          {titleCase(props.projection.readinessState)}
        </strong>
      </header>

      <section className="ops-conformance-filters" aria-label="Task 475 training scenarios">
        {scenarioOptions.map((scenarioState) => (
          <button
            className="ops-button"
            data-testid={`training-475-scenario-${scenarioState}`}
            data-selected={props.projection.scenarioState === scenarioState}
            key={scenarioState}
            onClick={() => props.onScenarioChange(scenarioState)}
            type="button"
          >
            {titleCase(scenarioState)}
          </button>
        ))}
      </section>

      <section
        className="ops-conformance-hash training-475-readiness-strip"
        data-testid="training-475-readiness-strip"
        aria-label="Task 475 readiness strip"
      >
        <span>
          <small>Business as usual model hash</small>
          <strong>{props.projection.bauModelHashPrefix}</strong>
        </span>
        <span>
          <small>Training completion state</small>
          <strong>{titleCase(props.projection.trainingCompletionState)}</strong>
        </span>
        <span>
          <small>Runbook bundle version</small>
          <strong>{props.projection.runbookBundleVersionRef}</strong>
        </span>
        <span>
          <small>Next rehearsal</small>
          <strong>{props.projection.nextRehearsalAt}</strong>
        </span>
      </section>

      <div className="ops-conformance-layout training-475-layout">
        <div className="ops-conformance-main">
          <section
            className="training-475-role-grid"
            data-testid="training-475-role-grid"
            role="list"
            aria-label="Task 475 launch role cards"
          >
            {props.projection.roleCards.map((role) => (
              <button
                aria-pressed={role.selected}
                className="training-475-role-card"
                data-testid={`training-475-role-card-${role.roleId}`}
                data-competency-state={role.competencyState}
                data-selected={role.selected}
                key={role.roleId}
                onClick={() => openRoleDetails(role.roleId)}
                type="button"
              >
                <span className="training-475-role-card__header">
                  <strong>{role.roleLabel}</strong>
                  <span
                    className="training-475-completion-ring"
                    data-ring-state={role.completionRingState}
                    aria-label={`${role.completionPercent}% competency evidence`}
                  >
                    {role.completionPercent}%
                  </span>
                </span>
                <span
                  className="ops-conformance-pill"
                  data-tone={training475Tone(role.competencyState)}
                >
                  {role.competencyState === "exact" ? "Exact evidence" : "Evidence missing"}
                </span>
                <span>{role.responsibilityRibbon}</span>
                <small>Required modules: {role.requiredModules.join(", ")}</small>
                <small>Escalation path: {role.escalationPathLabel}</small>
                <small>
                  Unresolved blockers:{" "}
                  {role.unresolvedBlockers.length > 0 ? role.unresolvedBlockers.join(", ") : "None"}
                </small>
              </button>
            ))}
          </section>

          {moduleDetailsOpen ? (
            <section
              className="ops-conformance-drawer training-475-module-details"
              data-testid="training-475-module-details"
              aria-label={`Module details for ${props.projection.selectedRole.roleLabel}`}
            >
              <header className="ops-panel__header">
                <div>
                  <p className="ops-panel__eyebrow">Selected role</p>
                  <h4>{props.projection.selectedRole.roleLabel}</h4>
                </div>
                <button
                  className="ops-button"
                  data-testid="training-475-close-module-details"
                  onClick={closeModuleDetails}
                  type="button"
                >
                  Close module details
                </button>
              </header>
              <ul className="ops-conformance-trace">
                {props.projection.selectedRoleModules.map((module) => (
                  <li key={module.moduleId} data-state="complete">
                    <strong>{module.title}</strong>
                    <span>{module.evidenceRequirement}</span>
                    <small>{module.failureRetrainingPath}</small>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            className="ops-conformance-table"
            data-testid="training-475-evidence-ledger"
            aria-label="Task 475 competency evidence ledger table"
          >
            <h4>Competency evidence ledger</h4>
            <table className="ops-table">
              <caption>Selected role competency evidence</caption>
              <thead>
                <tr>
                  <th scope="col">Module</th>
                  <th scope="col">Evidence state</th>
                  <th scope="col">Release tuple</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.evidenceRows.map((row) => (
                  <tr key={row.evidenceEntryId} data-row-state={row.evidenceState}>
                    <td>{row.moduleTitle}</td>
                    <td>{titleCase(row.evidenceState)}</td>
                    <td>
                      {row.currentReleaseTuple ? "Current release tuple" : "Release tuple mismatch"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            className="ops-conformance-table"
            data-testid="training-475-cadence-calendar"
            aria-label="Task 475 governance cadence calendar"
          >
            <h4>Governance cadence calendar</h4>
            <table className="ops-table">
              <caption>Governance cadence events</caption>
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Cadence</th>
                  <th scope="col">Owner</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.cadenceEvents.map((event) => (
                  <tr key={event.cadenceEventId} data-row-state={event.state}>
                    <td>{event.title}</td>
                    <td>{event.cadence}</td>
                    <td>{titleCase(event.owner)}</td>
                    <td>{titleCase(event.state)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <aside
          className="ops-conformance-side"
          data-testid="training-475-support-rail"
          aria-label="Task 475 operational support rail"
        >
          <section className="ops-conformance-rail">
            <h4>Today&apos;s operational posture</h4>
            <p>{props.projection.supportRail.todaysOperationalPosture}</p>
            <p>{props.projection.assistiveResponsibilityMessage}</p>
            <p>
              National Health Service (NHS) App deferred-channel message:{" "}
              {props.projection.channelResponsibilityMessage}
            </p>
          </section>

          <section
            className="ops-conformance-drawer"
            data-testid="training-475-runbook-drawer"
            aria-label="Task 475 runbook drawer"
          >
            <h4>Runbook bundle</h4>
            <table className="ops-table">
              <caption>Runbook ownership and release tuple state</caption>
              <thead>
                <tr>
                  <th scope="col">Runbook</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Review</th>
                  <th scope="col">Tuple</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.runbookRows.map((runbook) => (
                  <tr key={runbook.runbookId} data-row-state={runbook.state}>
                    <td>{runbook.title}</td>
                    <td>{titleCase(runbook.owner)}</td>
                    <td>{runbook.reviewCadenceDays} days</td>
                    <td>{runbook.currentReleaseTuple ? "Current" : "Superseded"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            className="ops-conformance-blockers"
            data-queue-state={props.projection.readinessState}
          >
            <h4>Open runbook gaps</h4>
            <ul className="ops-conformance-trace">
              {(props.projection.supportRail.openRunbookGaps.length > 0
                ? props.projection.supportRail.openRunbookGaps
                : ["No owner, cadence, or release tuple gaps open for core-web launch readiness."]
              ).map((gap) => (
                <li key={gap} data-state={gap.includes("blocker") ? "blocked" : "deferred"}>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="ops-conformance-rail">
            <h4>Pending cadence events</h4>
            <ul className="ops-conformance-trace">
              {props.projection.supportRail.pendingCadenceEvents.map((event) => (
                <li key={event} data-state="deferred">
                  <span>{event}</span>
                </li>
              ))}
            </ul>
          </section>

          <button
            className="ops-button"
            data-testid="training-475-mark-complete"
            disabled={props.projection.markCompleteActionState !== "enabled"}
            type="button"
          >
            Mark training complete
          </button>
        </aside>
      </div>
    </section>
  );
}

function release476Tone(state: string): string {
  if (
    state === "approved" ||
    state === "eligible" ||
    state === "eligible_with_constraints" ||
    state === "green"
  ) {
    return "ready";
  }
  if (state === "active") return "info";
  if (state === "draft" || state === "observe_only" || state === "amber") return "guarded";
  if (state === "paused") return "caution";
  return "blocked";
}

function dependency478Tone(state: string): string {
  if (state === "ready" || state === "normal" || state === "verified") return "ready";
  if (
    state === "ready_with_constraints" ||
    state === "degraded" ||
    state === "manual" ||
    state === "observe_only" ||
    state === "not_applicable"
  ) {
    return "guarded";
  }
  return "blocked";
}

function ReleaseWavePlanner476Surface(props: {
  projection: ReleaseWave476Projection;
  onScenarioChange: (scenarioState: ReleaseWave476ScenarioState) => void;
  onWaveSelect: (waveId: string) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const scenarioOptions: readonly ReleaseWave476ScenarioState[] = [
    "draft",
    "approved",
    "active",
    "paused",
    "blocked",
    "superseded",
  ];
  const openCommandDisabled =
    props.projection.approvalActionState === "approval_disabled_stale_prerequisites" ||
    props.projection.approvalActionState === "approval_disabled_superseded_runtime";

  const selectWave = (waveId: string) => {
    props.onWaveSelect(waveId);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(
            `[data-testid="release-476-wave-card-${props.projection.selectedWaveId}"]`,
          )
          ?.focus();
      });
    }
  };

  return (
    <section
      className="ops-conformance-band release-476-planner"
      data-testid="release-476-planner"
      data-surface="release-476-planner"
      data-scenario-state={props.projection.scenarioState}
      data-readiness-verdict={props.projection.readinessVerdict}
      data-approval-action-state={props.projection.approvalActionState}
      data-selected-wave-id={props.projection.selectedWaveId}
      data-wave1-smallest-blast-radius={
        props.projection.smallestApprovedWaveProof.proofState === "exact"
      }
      data-activation-permitted={props.projection.activationPermitted}
      data-no-raw-artifact-urls={props.projection.noRawArtifactUrls}
      data-responsive-contract={props.projection.responsiveContract}
      aria-label="Task 476 Release Wave Planner"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Release Wave Planner 476</p>
          <h3>Tenant and cohort rollout control</h3>
        </div>
        <strong
          className="ops-conformance-pill"
          data-tone={release476Tone(props.projection.readinessVerdict)}
        >
          {titleCase(props.projection.readinessVerdict)}
        </strong>
      </header>

      <section className="ops-conformance-filters" aria-label="Task 476 wave scenarios">
        {scenarioOptions.map((scenarioState) => (
          <button
            className="ops-button"
            data-testid={`release-476-scenario-${scenarioState}`}
            data-selected={props.projection.scenarioState === scenarioState}
            key={scenarioState}
            onClick={() => props.onScenarioChange(scenarioState)}
            type="button"
          >
            {titleCase(scenarioState)}
          </button>
        ))}
      </section>

      <section
        className="ops-conformance-hash release-476-hero-row"
        data-testid="release-476-hero-row"
        aria-label="Task 476 release wave hero row"
      >
        <span>
          <small>Release candidate</small>
          <strong>{props.projection.releaseCandidateRef}</strong>
        </span>
        <span>
          <small>Runtime bundle</small>
          <strong>{props.projection.runtimePublicationBundleRef}</strong>
        </span>
        <span>
          <small>Wave manifest hash</small>
          <strong>{props.projection.waveManifestHashPrefix}</strong>
        </span>
        <span>
          <small>Next safe action</small>
          <strong>{props.projection.nextSafeAction}</strong>
        </span>
      </section>

      <section
        className="release-476-ladder"
        data-testid="release-476-wave-ladder"
        role="list"
        aria-label="Task 476 horizontal wave ladder"
      >
        {props.projection.waves.map((wave) => (
          <button
            aria-pressed={wave.selected}
            className="release-476-wave-card"
            data-testid={`release-476-wave-card-${wave.waveId}`}
            data-wave-state={wave.state}
            data-wave-verdict={wave.verdict}
            data-selected={wave.selected}
            key={wave.waveId}
            onClick={() => selectWave(wave.waveId)}
            type="button"
          >
            <span className="release-476-wave-card__topline">
              <strong>{wave.ladderLabel}</strong>
              <span className="ops-conformance-pill" data-tone={release476Tone(wave.state)}>
                {titleCase(wave.state)}
              </span>
            </span>
            <span>{wave.label}</span>
            <small>Verdict: {titleCase(wave.verdict)}</small>
            <small>Owner: {titleCase(wave.owner)}</small>
            <span className="release-476-mini-bars" aria-hidden="true">
              {wave.exposure.map((cell) => (
                <span className="release-476-mini-bar" key={cell.audience}>
                  <span>{cell.label}</span>
                  <i
                    style={{ width: `${Math.min(100, Math.max(2, cell.percentageOfProgramme))}%` }}
                  />
                </span>
              ))}
            </span>
            <small>
              Exposure score {wave.totalExposureScore}; NHS App{" "}
              {wave.nhsAppExposureAllowed ? "allowed" : "excluded"}; assistive visible{" "}
              {wave.assistiveVisibleExposureAllowed ? "limited" : "excluded"}
            </small>
          </button>
        ))}
      </section>

      <div className="ops-conformance-layout release-476-layout">
        <div className="ops-conformance-main">
          {detailsOpen ? (
            <section
              className="ops-conformance-drawer release-476-details-pane"
              data-testid="release-476-details-pane"
              aria-label={`Task 476 details for ${props.projection.selectedWave.ladderLabel}`}
            >
              <header className="ops-panel__header">
                <div>
                  <p className="ops-panel__eyebrow">Selected wave</p>
                  <h4>{props.projection.selectedWave.label}</h4>
                </div>
                <button
                  className="ops-button"
                  data-testid="release-476-close-details"
                  onClick={closeDetails}
                  type="button"
                >
                  Close details
                </button>
              </header>

              <section className="release-476-detail-grid" aria-label="Selected wave bindings">
                <span>
                  <small>Cohort selector</small>
                  <strong>{props.projection.selectedCohort?.cohortSelector}</strong>
                </span>
                <span>
                  <small>Channel scope</small>
                  <strong>
                    {props.projection.selectedChannelScope?.allowedChannels?.join(", ") ||
                      "None active"}
                  </strong>
                </span>
                <span>
                  <small>Assistive scope</small>
                  <strong>
                    {titleCase(props.projection.selectedAssistiveScope?.mode ?? "unknown")}
                  </strong>
                </span>
                <span>
                  <small>Observation window</small>
                  <strong>{props.projection.selectedObservationPolicy?.dwellWindow}</strong>
                </span>
              </section>

              <section
                className="ops-conformance-table release-476-guardrail-table"
                data-testid="release-476-guardrail-table"
                aria-label="Task 476 selected wave guardrail table"
              >
                <h4>Guardrail table</h4>
                <table className="ops-table">
                  <caption>
                    Interval, threshold, incident, latency, support, safety, and channel constraints
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Rule</th>
                      <th scope="col">Interval</th>
                      <th scope="col">Threshold</th>
                      <th scope="col">Metric</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(props.projection.selectedGuardrailSnapshot?.guardrailRules ?? []).map(
                      (rule: any) => (
                        <tr
                          key={rule.ruleId}
                          data-row-state={props.projection.selectedGuardrailSnapshot?.state}
                        >
                          <td>{titleCase(rule.ruleKind)}</td>
                          <td>{rule.interval}</td>
                          <td>
                            {rule.comparator} {rule.threshold} {rule.unit}
                          </td>
                          <td>{rule.metricRef}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </section>

              <section
                className="ops-conformance-table"
                aria-label="Task 476 selected wave observation policy"
              >
                <h4>Observation policy</h4>
                <table className="ops-table">
                  <caption>Exit and pause criteria</caption>
                  <thead>
                    <tr>
                      <th scope="col">Criterion</th>
                      <th scope="col">Metric</th>
                      <th scope="col">Rule</th>
                      <th scope="col">Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(props.projection.selectedObservationPolicy?.exitCriteria ?? []).map(
                      (criterion: any) => (
                        <tr key={criterion.criterionId} data-row-state="exit">
                          <td>Exit</td>
                          <td>{criterion.metricRef}</td>
                          <td>
                            {criterion.comparator} {criterion.threshold}
                          </td>
                          <td>{criterion.observationWindow}</td>
                        </tr>
                      ),
                    )}
                    {(props.projection.selectedObservationPolicy?.pauseCriteria ?? []).map(
                      (criterion: any) => (
                        <tr key={criterion.criterionId} data-row-state="pause">
                          <td>Pause</td>
                          <td>{criterion.metricRef}</td>
                          <td>
                            {criterion.comparator} {criterion.threshold}
                          </td>
                          <td>{criterion.observationWindow}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </section>
            </section>
          ) : null}

          <section
            className="ops-conformance-table release-476-blast-radius-matrix"
            data-testid="release-476-blast-radius-matrix"
            aria-label="Task 476 blast-radius matrix"
          >
            <h4>Blast-radius matrix</h4>
            <table className="ops-table">
              <caption>Table fallback for wave exposure bars</caption>
              <thead>
                <tr>
                  <th scope="col">Wave</th>
                  <th scope="col">Audience</th>
                  <th scope="col">Exposure</th>
                  <th scope="col">Scope proof</th>
                </tr>
              </thead>
              <tbody>
                {props.projection.blastRadiusTableRows.map((row) => (
                  <tr
                    key={`${row.waveLabel}-${row.audience}`}
                    data-row-state={row.permittedByScope ? "exact" : "blocked"}
                  >
                    <td>{row.waveLabel}</td>
                    <td>{row.audience}</td>
                    <td>{row.exposureCount}</td>
                    <td>{row.permittedByScope ? "Within scope" : "Denied by scope"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="ops-conformance-side" aria-label="Task 476 wave controls">
          <section
            className="ops-conformance-drawer release-476-rollback-drawer"
            data-testid="release-476-rollback-drawer"
            aria-label="Task 476 rollback binding drawer"
          >
            <h4>Rollback and manual fallback</h4>
            <p>
              Feature surface rollback:{" "}
              {props.projection.selectedRollbackBinding?.featureSurfaceRollbackRef ??
                "Not available"}
            </p>
            <p>
              Reference data rollback:{" "}
              {props.projection.selectedRollbackBinding?.referenceDataRollbackRef ??
                "Blocked until exact"}
            </p>
            <p>
              Manual fallback modes:{" "}
              {(props.projection.selectedManualFallbackBinding?.fallbackModes ?? []).join(", ")}
            </p>
          </section>

          <section className="ops-conformance-rail" aria-label="Task 476 communication plan">
            <h4>Communication plan</h4>
            <p>{props.projection.selectedCommunicationPlan?.noticeCadence}</p>
            <p>
              Audiences: {(props.projection.selectedCommunicationPlan?.audiences ?? []).join(", ")}
            </p>
          </section>

          <section
            className="ops-conformance-blockers"
            data-queue-state={props.projection.readinessVerdict}
          >
            <h4>Source blockers</h4>
            <ul className="ops-conformance-trace">
              {props.projection.sourceBlockers.map((blocker) => (
                <li key={blocker} data-state={blocker.includes("blocker") ? "blocked" : "deferred"}>
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
          </section>

          <button
            className="ops-button"
            data-testid="release-476-approve-wave"
            disabled={openCommandDisabled}
            onClick={() => setCommandDialogOpen(true)}
            type="button"
          >
            Review wave command
          </button>
        </aside>
      </div>

      {commandDialogOpen ? (
        <div
          className="release-476-command-dialog"
          data-testid="release-476-command-confirmation-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Task 476 command confirmation dialog"
        >
          <div className="release-476-command-dialog__panel">
            <header className="ops-panel__header">
              <div>
                <p className="ops-panel__eyebrow">Command confirmation</p>
                <h4>{props.projection.commandDialog.title}</h4>
              </div>
              <button
                className="ops-button"
                onClick={() => setCommandDialogOpen(false)}
                type="button"
              >
                Close command review
              </button>
            </header>
            <p>{props.projection.commandDialog.reason}</p>
            <ul className="ops-conformance-trace">
              {props.projection.commandDialog.requiredSettlementRefs.map((settlementRef) => (
                <li key={settlementRef} data-state="blocked">
                  <span>{settlementRef}</span>
                </li>
              ))}
            </ul>
            <button className="ops-button" disabled type="button">
              Confirm activation
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DependencyReadinessBoard478Shell() {
  const [scenarioState, setScenarioState] = useState(
    dependencyReadiness478ScenarioFromLocation("ready_with_constraints"),
  );
  const [selectedDependencyRef, setSelectedDependencyRef] = useState(
    dependencyReadiness478DependencyFromLocation(),
  );
  const projection = createDependencyReadiness478Projection(scenarioState, selectedDependencyRef);

  return (
    <DependencyReadinessBoard478Surface
      projection={projection}
      onScenarioChange={(nextScenarioState) => {
        setScenarioState(nextScenarioState);
        if (
          nextScenarioState === "stale_contact" &&
          selectedDependencyRef !== "dep_478_supplier_support_channel"
        ) {
          setSelectedDependencyRef("dep_478_supplier_support_channel");
        }
      }}
      onDependencySelect={setSelectedDependencyRef}
    />
  );
}

function DependencyReadinessBoard478Surface(props: {
  projection: DependencyReadiness478Projection;
  onScenarioChange: (scenarioState: DependencyReadiness478ScenarioState) => void;
  onDependencySelect: (dependencyRef: string) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const scenarioOptions: readonly DependencyReadiness478ScenarioState[] = [
    "ready",
    "ready_with_constraints",
    "degraded_manual",
    "blocked",
    "deferred_channel",
    "stale_contact",
  ];

  const selectDependency = (dependencyRef: string) => {
    props.onDependencySelect(dependencyRef);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(
            `[data-testid="dependency-478-card-${props.projection.selectedDependencyRef}"]`,
          )
          ?.focus();
      });
    }
  };

  const selectedRunbook = props.projection.selectedDependency.runbooks[0];

  return (
    <section
      className="dependency-478-board"
      data-testid="dependency-478-board"
      data-surface="dependency-readiness-board-478"
      data-visual-mode={props.projection.visualMode}
      data-scenario-state={props.projection.scenarioState}
      data-overall-readiness-state={props.projection.overallReadinessState}
      data-launch-critical-blocked-count={props.projection.launchCriticalBlockedCount}
      data-selected-dependency-ref={props.projection.selectedDependencyRef}
      data-fallback-activation-action-state={props.projection.fallbackActivationActionState}
      data-no-completion-claim-before-settlement={
        props.projection.noCompletionClaimBeforeSettlement
      }
      data-table-fallback-required={props.projection.tableFallbackRequired}
      data-no-raw-contact-details={props.projection.noRawContactDetails}
      aria-label="Dependency Readiness Board 478"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Dependency Readiness Board 478</p>
          <h2>External dependency and manual fallback readiness</h2>
        </div>
        <strong
          className="ops-conformance-pill"
          data-tone={dependency478Tone(props.projection.overallReadinessState)}
        >
          {titleCase(props.projection.overallReadinessState)}
        </strong>
      </header>

      <section className="ops-conformance-filters" aria-label="Task 478 dependency scenarios">
        {scenarioOptions.map((scenarioState) => (
          <button
            className="ops-button"
            data-testid={`dependency-478-scenario-${scenarioState}`}
            data-selected={props.projection.scenarioState === scenarioState}
            key={scenarioState}
            onClick={() => props.onScenarioChange(scenarioState)}
            type="button"
          >
            {titleCase(scenarioState)}
          </button>
        ))}
      </section>

      <section
        className="dependency-478-summary-strip"
        data-testid="dependency-478-summary-strip"
        aria-label="Task 478 release and matrix summary"
      >
        <span>
          <small>Release candidate</small>
          <strong>{props.projection.releaseCandidateRef}</strong>
        </span>
        <span>
          <small>Runtime bundle</small>
          <strong>{props.projection.runtimePublicationBundleRef}</strong>
        </span>
        <span>
          <small>Matrix hash</small>
          <strong>{props.projection.matrixHashPrefix}</strong>
        </span>
        <span>
          <small>Launch critical dependencies</small>
          <strong>
            {props.projection.launchCriticalReadyCount}/
            {props.projection.launchCriticalDependencyCount} ready
          </strong>
        </span>
      </section>

      <section
        className="dependency-478-constellation"
        data-testid="dependency-478-constellation"
        aria-label="Dependency constellation"
      >
        <div className="dependency-478-constellation__center" role="list">
          {props.projection.essentialFunctions.map((essentialFunction) => (
            <span
              key={essentialFunction.essentialFunctionRef}
              role="listitem"
              data-continuity-state={essentialFunction.continuityState}
            >
              <strong>{essentialFunction.label}</strong>
              <small>{titleCase(essentialFunction.continuityState)}</small>
            </span>
          ))}
        </div>
        <div className="dependency-478-constellation__orbit" role="list">
          {props.projection.dependencies.map((dependency) => (
            <button
              aria-pressed={dependency.selected}
              className="dependency-478-card"
              data-testid={`dependency-478-card-${dependency.dependencyRef}`}
              data-dependency-ref={dependency.dependencyRef}
              data-readiness-state={dependency.readinessState}
              data-launch-critical={dependency.launchCritical}
              data-selected={dependency.selected}
              key={dependency.dependencyRef}
              onClick={() => selectDependency(dependency.dependencyRef)}
              type="button"
            >
              <span className="dependency-478-card__topline">
                <strong>{dependency.label}</strong>
                <span
                  className="ops-conformance-pill"
                  data-tone={dependency478Tone(dependency.readinessState)}
                >
                  {titleCase(dependency.readinessState)}
                </span>
              </span>
              <span>{titleCase(dependency.dependencyClass)}</span>
              <small>
                {dependency.launchCritical ? "Launch critical" : "Deferred or observe-only"}
              </small>
              <small>Fallback: {dependency.fallbackModeLabels.join(", ")}</small>
            </button>
          ))}
        </div>
      </section>

      <section
        className="dependency-478-table-fallback"
        data-testid="dependency-478-constellation-table"
        aria-label="Dependency constellation table fallback"
      >
        <h3>Constellation table</h3>
        <table className="ops-table">
          <caption>
            Essential functions, dependencies, fallback modes, and readiness verdicts
          </caption>
          <thead>
            <tr>
              <th scope="col">Essential function</th>
              <th scope="col">Dependency</th>
              <th scope="col">Fallback mode</th>
              <th scope="col">Readiness</th>
              <th scope="col">Launch critical</th>
            </tr>
          </thead>
          <tbody>
            {props.projection.tableRows.map((row) => (
              <tr
                key={`${row.essentialFunction}-${row.dependency}`}
                data-row-state={row.readinessState}
              >
                <td>{row.essentialFunction}</td>
                <td>{row.dependency}</td>
                <td>{row.fallback}</td>
                <td>{titleCase(row.readinessState)}</td>
                <td>{row.launchCritical ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section
        className="dependency-478-continuity-strip"
        data-testid="dependency-478-continuity-strip"
        aria-label="Essential-function continuity strip"
      >
        {props.projection.essentialFunctions.map((essentialFunction) => (
          <span
            key={essentialFunction.essentialFunctionRef}
            data-continuity-state={essentialFunction.continuityState}
          >
            <small>{essentialFunction.label}</small>
            <strong>{titleCase(essentialFunction.continuityState)}</strong>
          </span>
        ))}
      </section>

      <div className="dependency-478-workspace">
        <div className="dependency-478-workspace__main">
          {drawerOpen ? (
            <section
              className="dependency-478-drawer"
              data-testid="dependency-478-runbook-drawer"
              aria-label={`Runbook drawer for ${props.projection.selectedDependency.label}`}
            >
              <header className="ops-panel__header">
                <div>
                  <p className="ops-panel__eyebrow">Selected dependency</p>
                  <h3>{props.projection.selectedDependency.label}</h3>
                </div>
                <button
                  className="ops-button"
                  data-testid="dependency-478-close-runbook-drawer"
                  onClick={closeDrawer}
                  type="button"
                >
                  Close drawer
                </button>
              </header>

              <section
                className="dependency-478-detail-grid"
                aria-label="Service-level assumptions"
              >
                <span>
                  <small>Support window</small>
                  <strong>
                    {props.projection.selectedDependency.serviceLevelBinding.supportWindow}
                  </strong>
                </span>
                <span>
                  <small>Business hours</small>
                  <strong>
                    {props.projection.selectedDependency.serviceLevelBinding.businessHours}
                  </strong>
                </span>
                <span>
                  <small>Out of hours</small>
                  <strong>
                    {props.projection.selectedDependency.serviceLevelBinding.outOfHours}
                  </strong>
                </span>
                <span>
                  <small>RTO/RPO</small>
                  <strong>
                    {props.projection.selectedDependency.serviceLevelBinding.rto}/
                    {props.projection.selectedDependency.serviceLevelBinding.rpo}
                  </strong>
                </span>
              </section>

              <section className="dependency-478-drawer__split">
                <div>
                  <h4>Affected route families</h4>
                  <ul className="ops-inline-list">
                    {props.projection.selectedDependency.routeFamilies.map((routeFamily) => (
                      <li key={routeFamily}>{routeFamily}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Fallback modes</h4>
                  <ul className="ops-conformance-trace">
                    {props.projection.selectedDependency.fallbackModeLabels.map((fallbackMode) => (
                      <li key={fallbackMode} data-state="deferred">
                        <span>{fallbackMode}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section
                className="dependency-478-contact-table"
                data-testid="dependency-478-selected-contact-table"
                aria-label="Selected dependency escalation contacts"
              >
                <h4>Escalation contacts</h4>
                <table className="ops-table">
                  <caption>Contact role and verification state</caption>
                  <thead>
                    <tr>
                      <th scope="col">Role</th>
                      <th scope="col">Tier</th>
                      <th scope="col">State</th>
                      <th scope="col">OOH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.projection.selectedDependency.contacts.map((contact) => (
                      <tr key={contact.contactId} data-row-state={contact.verificationState}>
                        <td>{contact.role}</td>
                        <td>{titleCase(contact.tier)}</td>
                        <td>{titleCase(contact.verificationState)}</td>
                        <td>{contact.outOfHoursCoverage ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section
                className="dependency-478-runbook-steps"
                aria-label="Selected manual fallback runbook"
              >
                <h4>{selectedRunbook?.title ?? "Manual fallback runbook"}</h4>
                <ol>
                  {(selectedRunbook?.steps ?? []).map((step: string) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p>
                  Exit criteria:{" "}
                  {(selectedRunbook?.exitCriterionRefs ?? []).join(", ") ||
                    "Current evidence required"}
                </p>
              </section>

              <section
                className="dependency-478-rehearsal-table"
                data-testid="dependency-478-rehearsal-table"
                aria-label="Selected rehearsal evidence"
              >
                <h4>Rehearsal evidence</h4>
                <table className="ops-table">
                  <caption>Fallback rehearsal state and open gaps</caption>
                  <thead>
                    <tr>
                      <th scope="col">Scenario</th>
                      <th scope="col">Result</th>
                      <th scope="col">Exercised</th>
                      <th scope="col">Open gaps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.projection.selectedDependency.rehearsals.map((rehearsal) => (
                      <tr key={rehearsal.rehearsalEvidenceId} data-row-state={rehearsal.result}>
                        <td>{rehearsal.scenario}</td>
                        <td>{titleCase(rehearsal.result)}</td>
                        <td>{rehearsal.exercisedAt ?? "Not exercised"}</td>
                        <td>{(rehearsal.openGapRefs ?? []).join(", ") || "None"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </section>
          ) : null}
        </div>

        <aside
          className="dependency-478-rail"
          data-testid="dependency-478-contact-ledger"
          aria-label="Dependency contact and rehearsal rail"
        >
          <section>
            <h3>Stale contacts</h3>
            <ul className="ops-conformance-trace">
              {(props.projection.rail.staleContacts.length > 0
                ? props.projection.rail.staleContacts
                : [{ contactId: "none", role: "No stale contacts", verificationState: "verified" }]
              ).map((contact) => (
                <li
                  key={contact.contactId}
                  data-state={
                    String(contact.verificationState).includes("expired") ? "blocked" : "complete"
                  }
                >
                  <strong>{contact.role}</strong>
                  <span>{titleCase(contact.verificationState)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Rehearsal gaps</h3>
            <ul className="ops-conformance-trace">
              {props.projection.rail.rehearsalGaps.slice(0, 6).map((gap) => (
                <li key={`${gap.rehearsalEvidenceId}-${gap.gapRef}`} data-state="deferred">
                  <strong>{gap.dependencyRef}</strong>
                  <span>{gap.gapRef}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Supplier comms</h3>
            <ul className="ops-conformance-trace">
              {props.projection.rail.supplierCommsPlans.map((plan) => (
                <li key={plan.commsPlanId} data-state="complete">
                  <strong>{plan.dependencyRef}</strong>
                  <span>{plan.templates?.length ?? 0} templates</span>
                </li>
              ))}
            </ul>
          </section>

          <button
            className="ops-button"
            data-testid="dependency-478-activation-action"
            disabled={props.projection.fallbackActivationReviewDisabled}
            onClick={() => setCommandDialogOpen(true)}
            type="button"
          >
            Review fallback activation
          </button>
        </aside>
      </div>

      {commandDialogOpen ? (
        <div
          className="dependency-478-command-dialog"
          data-testid="dependency-478-command-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Fallback activation command review"
        >
          <div className="dependency-478-command-dialog__panel">
            <header className="ops-panel__header">
              <div>
                <p className="ops-panel__eyebrow">Command review</p>
                <h3>{props.projection.commandDialog.title}</h3>
              </div>
              <button
                className="ops-button"
                onClick={() => setCommandDialogOpen(false)}
                type="button"
              >
                Close command review
              </button>
            </header>
            <p>{props.projection.commandDialog.reason}</p>
            <ul className="ops-conformance-trace">
              {props.projection.commandDialog.requiredSettlementRefs.map((settlementRef) => (
                <li key={settlementRef} data-state="blocked">
                  <span>{settlementRef}</span>
                </li>
              ))}
            </ul>
            <button
              className="ops-button"
              data-testid="dependency-478-command-confirm"
              disabled={props.projection.commandDialog.confirmButtonDisabled}
              type="button"
            >
              Confirm after settlement
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ConformanceScorecardShell(props: { snapshot: OpsBoardStateSnapshot }) {
  const baseConformance = props.snapshot.conformanceProjection;
  const [scenarioState, setScenarioState] = useState(
    conformanceScenarioFromLocation(baseConformance.scenarioState),
  );
  const [selectedRowRef, setSelectedRowRef] = useState<string | null>(
    baseConformance.selectedRowRef,
  );
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [dimensionFilter, setDimensionFilter] = useState<ProofDimensionKey>("all");
  const [ownerFilter, setOwnerFilter] = useState<ConformanceOwnerKey>("all");
  const [blockerFilter, setBlockerFilter] = useState<ConformanceBlockerFilterKey>("all");
  const [stateFilter, setStateFilter] = useState<ConformanceStateFilterKey>("all");
  const [exitGateScenarioState, setExitGateScenarioState] = useState(
    exitGateScenarioFromLocation("exact"),
  );
  const [programmeConformance472ScenarioState, setProgrammeConformance472ScenarioState] = useState(
    programmeConformance472ScenarioFromLocation("exact"),
  );
  const [selectedProgrammeConformance472RowRef, setSelectedProgrammeConformance472RowRef] =
    useState<string | null>(programmeConformance472SelectedRowFromLocation());
  const [phase7ChannelScenarioState, setPhase7ChannelScenarioState] = useState(
    phase7ChannelScenarioFromLocation("deferred"),
  );
  const [selectedPhase7ChannelRouteFamily, setSelectedPhase7ChannelRouteFamily] = useState<
    string | null
  >(phase7ChannelRouteFamilyFromLocation());
  const [migrationCutover474ScenarioState, setMigrationCutover474ScenarioState] = useState(
    migrationCutover474ScenarioFromLocation("ready_with_constraints"),
  );
  const [selectedMigrationCutover474Projection, setSelectedMigrationCutover474Projection] =
    useState<string | null>(migrationCutover474SelectedProjectionFromLocation());
  const [trainingRunbook475ScenarioState, setTrainingRunbook475ScenarioState] = useState(
    trainingRunbook475ScenarioFromLocation("constrained"),
  );
  const [selectedTrainingRunbook475Role, setSelectedTrainingRunbook475Role] =
    useState<TrainingRunbook475RoleId>(trainingRunbook475RoleFromLocation());
  const [releaseWave476ScenarioState, setReleaseWave476ScenarioState] = useState(
    releaseWave476ScenarioFromLocation("approved"),
  );
  const [selectedReleaseWave476Wave, setSelectedReleaseWave476Wave] = useState<string>(
    releaseWave476WaveFromLocation(),
  );

  useEffect(() => {
    setScenarioState(conformanceScenarioFromLocation(baseConformance.scenarioState));
    setSelectedRowRef(baseConformance.selectedRowRef);
    setDrawerOpen(true);
    setPhaseFilter("all");
    setDimensionFilter("all");
    setOwnerFilter("all");
    setBlockerFilter("all");
    setStateFilter("all");
    setExitGateScenarioState(exitGateScenarioFromLocation("exact"));
    setProgrammeConformance472ScenarioState(programmeConformance472ScenarioFromLocation("exact"));
    setSelectedProgrammeConformance472RowRef(programmeConformance472SelectedRowFromLocation());
    setPhase7ChannelScenarioState(phase7ChannelScenarioFromLocation("deferred"));
    setSelectedPhase7ChannelRouteFamily(phase7ChannelRouteFamilyFromLocation());
    setMigrationCutover474ScenarioState(
      migrationCutover474ScenarioFromLocation("ready_with_constraints"),
    );
    setSelectedMigrationCutover474Projection(migrationCutover474SelectedProjectionFromLocation());
    setTrainingRunbook475ScenarioState(trainingRunbook475ScenarioFromLocation("constrained"));
    setSelectedTrainingRunbook475Role(trainingRunbook475RoleFromLocation());
    setReleaseWave476ScenarioState(releaseWave476ScenarioFromLocation("approved"));
    setSelectedReleaseWave476Wave(releaseWave476WaveFromLocation());
  }, [baseConformance.scenarioState, baseConformance.selectedRowRef]);

  const conformance = createCrossPhaseConformanceScorecardProjection({
    scenarioState,
    selectedRowRef,
    drawerOpen,
    phaseFilter,
    dimensionFilter,
    ownerFilter,
    blockerFilter,
    stateFilter,
  });
  const selectedRow = conformance.phaseRows.find((row) => row.selected) ?? conformance.phaseRows[0];
  const exitGateStatus = createPhase9ExitGateStatusProjection(exitGateScenarioState);
  const programmeConformance472 = createProgrammeConformance472Projection(
    programmeConformance472ScenarioState,
    selectedProgrammeConformance472RowRef,
  );
  const phase7ChannelReconciliation473 = createPhase7ChannelReconciliation473Projection(
    phase7ChannelScenarioState,
    selectedPhase7ChannelRouteFamily,
  );
  const migrationCutover474 = createMigrationCutover474Projection(
    migrationCutover474ScenarioState,
    selectedMigrationCutover474Projection,
  );
  const trainingRunbook475 = createTrainingRunbook475Projection(
    trainingRunbook475ScenarioState,
    selectedTrainingRunbook475Role,
  );
  const releaseWave476 = createReleaseWave476Projection(
    releaseWave476ScenarioState,
    selectedReleaseWave476Wave,
  );

  const selectRow = (rowRef: string) => {
    setSelectedRowRef(rowRef);
  };

  return (
    <section
      className="ops-panel ops-conformance-scorecard"
      data-testid="conformance-scorecard-shell"
      data-surface="conformance-scorecard-shell"
      data-visual-mode={conformance.visualMode}
      data-scenario-state={conformance.scenarioState}
      data-scorecard-state={conformance.scorecardHash.scorecardState}
      data-bau-action-state={conformance.bauSignoffReadiness.actionState}
      data-selected-row-ref={conformance.selectedRowRef}
      data-drawer-state={conformance.sourceTrace.drawerState}
      data-no-raw-artifact-urls={conformance.noRawArtifactUrls}
      data-mission-stack-preserved={props.snapshot.frameMode === "mission_stack"}
      aria-label="Cross-Phase Conformance Scorecard"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Cross-Phase Conformance Scorecard</p>
          <h2>Service-owner proof ledger</h2>
        </div>
        <span className="ops-panel__headline">{conformance.scorecardHash.signoffConsequence}</span>
      </header>

      <ConformanceFilterBar
        projection={conformance}
        scenarioState={scenarioState}
        onScenarioChange={(nextScenario) => {
          setScenarioState(nextScenario);
          setSelectedRowRef(null);
        }}
        onPhaseChange={setPhaseFilter}
        onDimensionChange={setDimensionFilter}
        onOwnerChange={setOwnerFilter}
        onBlockerChange={setBlockerFilter}
        onStateChange={setStateFilter}
      />

      <Phase9ExitGateStatusSurface projection={exitGateStatus} />
      <ProgrammeConformance472Surface
        projection={programmeConformance472}
        onScenarioChange={(nextScenarioState) => {
          setProgrammeConformance472ScenarioState(nextScenarioState);
        }}
        onSelectRow={setSelectedProgrammeConformance472RowRef}
      />
      <Phase7ChannelReconciliation473Surface
        projection={phase7ChannelReconciliation473}
        onScenarioChange={(nextScenarioState) => {
          setPhase7ChannelScenarioState(nextScenarioState);
          setSelectedPhase7ChannelRouteFamily(null);
        }}
        onRouteSelect={setSelectedPhase7ChannelRouteFamily}
      />
      <MigrationCutover474Surface
        projection={migrationCutover474}
        onScenarioChange={(nextScenarioState) => {
          setMigrationCutover474ScenarioState(nextScenarioState);
          setSelectedMigrationCutover474Projection(null);
        }}
        onProjectionSelect={setSelectedMigrationCutover474Projection}
      />
      <TrainingRunbookCentre475Surface
        projection={trainingRunbook475}
        onScenarioChange={(nextScenarioState) => {
          setTrainingRunbook475ScenarioState(nextScenarioState);
          setSelectedTrainingRunbook475Role("clinician");
        }}
        onRoleSelect={setSelectedTrainingRunbook475Role}
      />
      <ReleaseWavePlanner476Surface
        projection={releaseWave476}
        onScenarioChange={(nextScenarioState) => {
          setReleaseWave476ScenarioState(nextScenarioState);
          setSelectedReleaseWave476Wave("wave_476_1_core_web_canary");
        }}
        onWaveSelect={setSelectedReleaseWave476Wave}
      />

      <div className="ops-conformance-layout">
        <div className="ops-conformance-main">
          <ScorecardHashCard projection={conformance} />
          <RuntimeTupleCoverageBand projection={conformance} />
          <PhaseRowProofTable projection={conformance} onSelectRow={selectRow} />
          <CrossPhaseControlFamilyMatrix projection={conformance} />
        </div>
        <div className="ops-conformance-side">
          <GovernanceOpsProofRail projection={conformance} />
          <BAUSignoffBlockerQueue projection={conformance} onSelectRow={selectRow} />
          <SummaryAlignmentDiffPanel projection={conformance} />
          <ConformanceSourceTraceDrawer
            projection={conformance}
            drawerOpen={drawerOpen}
            onToggleDrawer={() => setDrawerOpen((current) => !current)}
          />
        </div>
      </div>

      <ConformanceHandoffStrip projection={conformance} />

      {selectedRow ? (
        <p className="ops-panel__summary" data-testid="conformance-selected-row-summary">
          {selectedRow.phaseLabel} / {selectedRow.failedPredicate} / {selectedRow.nextSafeAction}
        </p>
      ) : null}
    </section>
  );
}

function AssuranceCenterPanel(props: { snapshot: OpsBoardStateSnapshot }) {
  const baseAssurance = props.snapshot.assuranceProjection;
  const baseComplianceLedger = props.snapshot.complianceLedgerProjection;
  const [selectedFrameworkCode, setSelectedFrameworkCode] = useState(
    baseAssurance.selectedFrameworkCode,
  );
  const [selectedControlCode, setSelectedControlCode] = useState<string | null>(
    baseAssurance.selectedControlCode,
  );
  const [selectedGapRef, setSelectedGapRef] = useState<string | null>(
    baseComplianceLedger.selectedGapRef,
  );
  const [gapFilter, setGapFilter] = useState<GapQueueFilterKey>("all");
  const [gapSort, setGapSort] = useState<GapQueueSortKey>("severity");
  const [complianceScenarioState, setComplianceScenarioState] = useState(
    complianceScenarioFromLocation(baseAssurance.scenarioState),
  );

  useEffect(() => {
    setSelectedFrameworkCode(baseAssurance.selectedFrameworkCode);
    setSelectedControlCode(baseAssurance.selectedControlCode);
    setSelectedGapRef(baseComplianceLedger.selectedGapRef);
    setGapFilter("all");
    setGapSort("severity");
    setComplianceScenarioState(complianceScenarioFromLocation(baseAssurance.scenarioState));
  }, [
    baseAssurance.scenarioState,
    baseAssurance.selectedFrameworkCode,
    baseAssurance.selectedControlCode,
    baseComplianceLedger.selectedGapRef,
  ]);

  const assurance = createOpsAssuranceProjection(
    props.snapshot.overviewState,
    selectedFrameworkCode,
    selectedControlCode,
  );
  const complianceLedger = createComplianceLedgerProjection({
    scenarioState: complianceScenarioState,
    selectedFrameworkCode,
    selectedControlRef: selectedControlCode,
    selectedGapRef,
    activeFilter: gapFilter,
    activeSort: gapSort,
  });
  const selectedControl = assurance.controlHeatMap.find((control) => control.selected);

  return (
    <section
      className="ops-panel ops-assurance-center"
      data-testid="ops-assurance-center"
      data-surface="assurance-center"
      data-framework={assurance.selectedFrameworkCode}
      data-pack-state={assurance.packPreview.packState}
      data-binding-state={assurance.runtimeBinding.bindingState}
      data-export-control-state={assurance.actionRail[0]?.controlState ?? "blocked"}
      data-settlement-result={assurance.latestSettlement.result}
      data-artifact-state={assurance.artifactStage.artifactState}
      data-selected-control={assurance.selectedControlCode}
      data-compliance-ledger-state={complianceLedger.scenarioState}
      data-compliance-graph-verdict={complianceLedger.graphBlocker.graphVerdictState}
      data-compliance-action-control-state={complianceLedger.actionControlState}
      data-compliance-selected-control={complianceLedger.selectedControlRef}
      aria-label="Assurance Center"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Assurance Center</p>
          <h2>{assurance.selectedFrameworkCode} export readiness</h2>
        </div>
        <span className="ops-panel__headline">{assurance.surfaceSummary}</span>
      </header>

      <div className="ops-assurance-layout">
        <aside
          className="ops-assurance-rail"
          data-testid="framework-selector"
          data-surface="framework-selector"
          aria-label="Framework selector"
        >
          <header className="ops-assurance-surface__header">
            <div>
              <p className="ops-panel__eyebrow">Framework</p>
              <h3>Pack family</h3>
            </div>
            <span data-tone={assuranceTone(assurance.runtimeBinding.bindingState)}>
              {assurance.runtimeBinding.bindingState}
            </span>
          </header>
          <div className="ops-assurance-frameworks" role="list">
            {assurance.frameworkOptions.map((framework) => (
              <button
                key={framework.frameworkCode}
                type="button"
                className="ops-chip"
                data-testid={`assurance-framework-${automationId(framework.frameworkCode)}`}
                data-framework-code={framework.frameworkCode}
                data-selected={framework.selected}
                data-pack-state={framework.packState}
                onClick={() => {
                  setSelectedFrameworkCode(framework.frameworkCode);
                  setSelectedControlCode(null);
                  setSelectedGapRef(null);
                }}
              >
                <span>{framework.label}</span>
                <small>{framework.frameworkVersion}</small>
              </button>
            ))}
          </div>
          <dl className="ops-keyfacts">
            <div>
              <dt>Period</dt>
              <dd>{assurance.timeHorizon}</dd>
            </div>
            <div>
              <dt>Tenant scope</dt>
              <dd>{assurance.boardScopeRef}</dd>
            </div>
            <div>
              <dt>Pack state</dt>
              <dd>{titleCase(assurance.packPreview.packState)}</dd>
            </div>
          </dl>
        </aside>

        <div className="ops-assurance-main">
          <section
            className="ops-assurance-status-strip"
            data-testid="assurance-status-strip"
            aria-label="Pack proof summary"
          >
            <div>
              <span>{assurance.packPreview.packVersionHash}</span>
              <small>Pack version hash</small>
            </div>
            <div>
              <span>{assurance.packPreview.graphHash}</span>
              <small>Graph hash</small>
            </div>
            <div data-tone={assuranceTone(assurance.completenessSummary.trustState)}>
              <span>{titleCase(assurance.completenessSummary.trustState)}</span>
              <small>Trust</small>
            </div>
            <div data-tone={assuranceTone(assurance.completenessSummary.graphVerdictState)}>
              <span>{titleCase(assurance.completenessSummary.graphVerdictState)}</span>
              <small>Graph verdict</small>
            </div>
            <div data-tone={assuranceTone(assurance.latestSettlement.result)}>
              <span>{titleCase(assurance.latestSettlement.result)}</span>
              <small>Settlement</small>
            </div>
          </section>

          <section
            className="ops-assurance-surface"
            data-testid="control-heat-map"
            data-surface="control-heat-map"
            data-graph-state={assurance.completenessSummary.graphVerdictState}
            aria-label="Control heat map"
          >
            <header className="ops-assurance-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Control heat map</p>
                <h3>Freshness / trust / completeness triad</h3>
              </div>
              <span data-tone={assuranceTone(assurance.completenessSummary.freshnessState)}>
                {titleCase(assurance.completenessSummary.freshnessState)}
              </span>
            </header>
            {assurance.controlHeatMap.length === 0 ? (
              <p>No controls match this framework, period, and tenant scope.</p>
            ) : (
              <div className="ops-assurance-heat-map" role="list">
                {assurance.controlHeatMap.map((control) => (
                  <button
                    key={control.controlCode}
                    type="button"
                    className="ops-assurance-cell"
                    data-testid={`assurance-control-${automationId(control.controlCode)}`}
                    data-entity-ref={control.controlCode}
                    data-selected={control.selected}
                    data-freshness-state={control.freshnessState}
                    data-trust-state={control.trustState}
                    data-completeness-state={control.completenessState}
                    data-graph-verdict={control.graphVerdictState}
                    onClick={() => {
                      setSelectedControlCode(control.controlCode);
                      setSelectedGapRef(null);
                    }}
                  >
                    <strong>{control.controlCode}</strong>
                    <span>{control.label}</span>
                    <div className="ops-assurance-triad" aria-label="Freshness trust completeness">
                      <em data-tone={assuranceTone(control.freshnessState)}>
                        {titleCase(control.freshnessState)}
                      </em>
                      <em data-tone={assuranceTone(control.trustState)}>
                        {titleCase(control.trustState)}
                      </em>
                      <em data-tone={assuranceTone(control.completenessState)}>
                        {titleCase(control.completenessState)}
                      </em>
                    </div>
                    <small>
                      {control.evidenceCount} evidence / {control.missingEvidenceCount} missing
                    </small>
                    <small>{control.continuityEvidenceState} continuity</small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section
            className="ops-assurance-surface"
            data-testid="control-heat-table"
            data-surface="control-heat-table"
            aria-label="Control heat table"
          >
            <header className="ops-assurance-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Table parity</p>
                <h3>Identical triad states</h3>
              </div>
              <span>{assurance.completenessSummary.completenessSummaryRef}</span>
            </header>
            <div className="ops-panel__table">
              <table className="ops-table">
                <caption>Assurance control triad fallback</caption>
                <thead>
                  <tr>
                    <th scope="col">Control</th>
                    <th scope="col">Freshness</th>
                    <th scope="col">Trust</th>
                    <th scope="col">Completeness</th>
                    <th scope="col">Evidence</th>
                    <th scope="col">Graph</th>
                    <th scope="col">Blockers</th>
                  </tr>
                </thead>
                <tbody>
                  {assurance.controlHeatMap.map((control) => (
                    <tr key={control.controlCode} data-selected={control.selected}>
                      <td>{control.controlCode}</td>
                      <td>{control.freshnessState}</td>
                      <td>{control.trustState}</td>
                      <td>{control.completenessState}</td>
                      <td>
                        {control.evidenceCount} / missing {control.missingEvidenceCount}
                      </td>
                      <td>{control.graphVerdictState}</td>
                      <td>{control.blockerRefs.join(", ") || "none"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="ops-assurance-work-grid">
            <section
              className="ops-assurance-surface"
              data-testid="evidence-gap-queue"
              data-surface="evidence-gap-queue"
              aria-label="Evidence gap queue"
            >
              <header className="ops-assurance-surface__header">
                <div>
                  <p className="ops-panel__eyebrow">Evidence gaps</p>
                  <h3>{assurance.evidenceGapQueue.length} queue item(s)</h3>
                </div>
                <span data-tone={assuranceTone(assurance.completenessSummary.graphVerdictState)}>
                  {titleCase(assurance.completenessSummary.graphVerdictState)}
                </span>
              </header>
              <ul className="ops-assurance-list">
                {(assurance.evidenceGapQueue.length > 0
                  ? assurance.evidenceGapQueue
                  : [
                      {
                        gapRef: "gap:none",
                        severity: "low" as const,
                        reason: "No open evidence gaps for this selection.",
                        controlRef: assurance.selectedControlCode,
                        ownerRef: "none",
                        dueAt: "not scheduled",
                        graphState: assurance.completenessSummary.graphVerdictState,
                        trustState: assurance.completenessSummary.trustState,
                        capaState: "none",
                        nextSafeAction: "review pack preview",
                        blockerRefs: [] as readonly string[],
                      },
                    ]
                ).map((gap) => (
                  <li key={gap.gapRef} data-severity={gap.severity}>
                    <strong>{gap.reason}</strong>
                    <span>
                      {gap.controlRef} / {gap.ownerRef}
                    </span>
                    <small>
                      {gap.capaState} / {gap.nextSafeAction} /{" "}
                      {gap.blockerRefs.join(", ") || "no blockers"}
                    </small>
                  </li>
                ))}
              </ul>
            </section>

            <section
              className="ops-assurance-surface"
              data-testid="capa-tracker"
              data-surface="capa-tracker"
              aria-label="CAPA tracker"
            >
              <header className="ops-assurance-surface__header">
                <div>
                  <p className="ops-panel__eyebrow">CAPA tracker</p>
                  <h3>{assurance.capaTracker.length} action(s)</h3>
                </div>
                <span>{assurance.degradedSliceAttestation.gateState}</span>
              </header>
              <ul className="ops-assurance-list">
                {(assurance.capaTracker.length > 0
                  ? assurance.capaTracker
                  : [
                      {
                        capaActionRef: "capa:none",
                        sourceRef: assurance.packPreview.assurancePackRef,
                        ownerRef: "none",
                        targetDate: "not scheduled",
                        status: "none",
                        graphHash: assurance.packPreview.graphHash,
                        evidenceGapRefs: [] as readonly string[],
                        blockerRefs: [] as readonly string[],
                      },
                    ]
                ).map((capa) => (
                  <li key={capa.capaActionRef}>
                    <strong>{titleCase(capa.status)}</strong>
                    <span>{capa.capaActionRef}</span>
                    <small>
                      {capa.ownerRef} / {capa.targetDate} /{" "}
                      {capa.blockerRefs.join(", ") || "no blockers"}
                    </small>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <aside className="ops-assurance-detail" aria-label="Selected assurance control">
          <section className="ops-assurance-surface" data-testid="selected-control-detail">
            <header className="ops-assurance-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Selected control</p>
                <h3>{selectedControl?.label ?? "No selected control"}</h3>
              </div>
              <span data-tone={assuranceTone(selectedControl?.completenessState ?? "empty")}>
                {selectedControl?.controlCode ?? "none"}
              </span>
            </header>
            <p>{assurance.completenessSummary.summary}</p>
            <ul className="ops-inline-list">
              {(selectedControl?.blockerRefs.length
                ? selectedControl.blockerRefs
                : ["no blockers"]
              ).map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </section>

          <section className="ops-assurance-surface" aria-label="Continuity evidence">
            <header className="ops-assurance-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Continuity evidence</p>
                <h3>{assurance.continuitySections.length} section(s)</h3>
              </div>
              <span>{assurance.packPreview.continuitySetHash}</span>
            </header>
            <ul className="ops-assurance-list">
              {(assurance.continuitySections.length > 0
                ? assurance.continuitySections
                : [
                    {
                      continuitySectionRef: "continuity:none",
                      controlCode: assurance.selectedControlCode,
                      affectedRouteFamilyRefs: ["none"],
                      experienceContinuityEvidenceRefs: ["none"],
                      validationState: "missing" as const,
                      blockingRefs: ["continuity:not-required-or-empty"],
                    },
                  ]
              ).map((section) => (
                <li key={section.continuitySectionRef} data-state={section.validationState}>
                  <strong>{section.controlCode}</strong>
                  <span>{section.affectedRouteFamilyRefs.join(", ")}</span>
                  <small>
                    {section.validationState} /{" "}
                    {section.experienceContinuityEvidenceRefs.join(", ")}
                  </small>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="ops-assurance-surface"
            data-testid="pack-settlement"
            data-surface="pack-settlement"
            data-settlement-result={assurance.latestSettlement.result}
            aria-live="polite"
          >
            <header className="ops-assurance-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Pack settlement</p>
                <h3>{titleCase(assurance.latestSettlement.result)}</h3>
              </div>
              <span data-tone={assuranceTone(assurance.latestSettlement.result)}>
                {assurance.latestSettlement.assurancePackSettlementRef}
              </span>
            </header>
            <p>{assurance.latestSettlement.announcement}</p>
          </section>

          <section className="ops-assurance-action-rail" aria-label="Assurance pack actions">
            {assurance.actionRail.map((action) => (
              <button
                key={action.actionType}
                type="button"
                className="ops-button"
                data-testid={`assurance-action-${action.actionType}`}
                data-action-type={action.actionType}
                data-action-allowed={action.allowed}
                data-settlement-result={action.settlementResult}
                disabled={!action.allowed}
              >
                <span>{action.label}</span>
                <small>{titleCase(action.settlementResult)}</small>
              </button>
            ))}
          </section>
        </aside>
      </div>

      <section
        className="ops-assurance-surface ops-assurance-pack-preview"
        data-testid="pack-preview"
        data-surface="pack-preview"
        data-reproduction-state={assurance.packPreview.reproductionState}
        aria-label="Pack preview"
      >
        <header className="ops-assurance-surface__header">
          <div>
            <p className="ops-panel__eyebrow">Pack preview</p>
            <h3>{titleCase(assurance.packPreview.packState)}</h3>
          </div>
          <span data-tone={assuranceTone(assurance.packPreview.reproductionState)}>
            {assurance.packPreview.artifactPresentationContractRef}
          </span>
        </header>
        <p>{assurance.packPreview.summaryFirstPreview}</p>
        <dl className="ops-assurance-hash-grid">
          <div>
            <dt>Evidence set</dt>
            <dd>{assurance.packPreview.evidenceSetHash}</dd>
          </div>
          <div>
            <dt>Continuity set</dt>
            <dd>{assurance.packPreview.continuitySetHash}</dd>
          </div>
          <div>
            <dt>Graph decision</dt>
            <dd>{assurance.packPreview.graphDecisionHash}</dd>
          </div>
          <div>
            <dt>Query plan</dt>
            <dd>{assurance.packPreview.queryPlanHash}</dd>
          </div>
          <div>
            <dt>Render template</dt>
            <dd>{assurance.packPreview.renderTemplateHash}</dd>
          </div>
          <div>
            <dt>Redaction policy</dt>
            <dd>{assurance.packPreview.redactionPolicyHash}</dd>
          </div>
          <div>
            <dt>Reproduction</dt>
            <dd>{assurance.packPreview.reproductionState}</dd>
          </div>
          <div>
            <dt>Required trust</dt>
            <dd>{assurance.packPreview.requiredTrustRefs.join(", ")}</dd>
          </div>
        </dl>
      </section>

      <ComplianceLedgerPanel
        projection={complianceLedger}
        onSelectFramework={(frameworkCode) => {
          setSelectedFrameworkCode(frameworkCode);
          setSelectedControlCode(null);
          setSelectedGapRef(null);
        }}
        onSelectControl={(controlRef) => {
          setSelectedControlCode(controlRef);
          setSelectedGapRef(null);
        }}
        onSelectGap={(gapRef) => setSelectedGapRef(gapRef)}
        onFilterChange={(filter) => setGapFilter(filter)}
        onSortChange={(sort) => setGapSort(sort)}
      />

      <section
        className="ops-assurance-surface ops-pack-export-state"
        data-testid="pack-export-state"
        data-surface="pack-export-state"
        data-artifact-state={assurance.artifactStage.artifactState}
        aria-label="Pack export state"
      >
        <header className="ops-assurance-surface__header">
          <div>
            <p className="ops-panel__eyebrow">Export manifest</p>
            <h3>{titleCase(assurance.artifactStage.artifactState)}</h3>
          </div>
          <span data-tone={assuranceTone(assurance.artifactStage.artifactState)}>
            {assurance.artifactStage.outboundNavigationGrantRef}
          </span>
        </header>
        <p>{assurance.artifactStage.summary}</p>
        <ul className="ops-inline-list">
          <li>{assurance.artifactStage.artifactTransferSettlementRef}</li>
          <li>{assurance.artifactStage.exportManifestHash}</li>
          <li>{assurance.artifactStage.serializedArtifactHash}</li>
        </ul>
      </section>
    </section>
  );
}

function IncidentDeskPanel(props: { snapshot: OpsBoardStateSnapshot }) {
  const baseIncidents = props.snapshot.incidentsProjection;
  const [selectedIncidentRef, setSelectedIncidentRef] = useState(baseIncidents.selectedIncidentRef);
  const [queueFilter, setQueueFilter] = useState<OpsIncidentQueueFilter>("all");
  const [nearMissSummary, setNearMissSummary] = useState("");
  const [nearMissSettlementState, setNearMissSettlementState] = useState<
    "idle" | "invalid_empty_summary" | "accepted_pending_settlement"
  >("idle");
  const [evidenceDrawerRef, setEvidenceDrawerRef] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIncidentRef(baseIncidents.selectedIncidentRef);
    setQueueFilter("all");
    setNearMissSummary("");
    setNearMissSettlementState("idle");
    setEvidenceDrawerRef(null);
  }, [baseIncidents.scenarioState, baseIncidents.selectedIncidentRef]);

  const incidents = createOpsIncidentsProjection({
    scenarioState: props.snapshot.overviewState,
    selectedIncidentRef,
    queueFilter,
  });
  const selectedIncident =
    incidents.incidentQueue.find((row) => row.selected) ?? incidents.incidentQueue[0] ?? null;
  const filteredRows = incidents.incidentQueue.filter((row) =>
    queueFilter === "all" ? true : row.rowKind === queueFilter,
  );
  const visibleRows =
    selectedIncident &&
    !filteredRows.some((row) => row.incidentRef === selectedIncident.incidentRef)
      ? [selectedIncident, ...filteredRows]
      : filteredRows;
  const activeEvidenceLink =
    incidents.evidenceLinks.find((link) => link.evidenceLinkRef === evidenceDrawerRef) ??
    incidents.evidenceLinks[0] ??
    null;
  const intakeState =
    nearMissSettlementState === "idle"
      ? incidents.nearMissIntake.validationState
      : nearMissSettlementState;

  return (
    <section
      className="ops-panel ops-incident-desk"
      data-testid="incident-desk"
      data-surface="incident-desk"
      data-binding-state={incidents.runtimeBinding.bindingState}
      data-action-control-state={incidents.runtimeBinding.actionControlState}
      data-artifact-state={incidents.runtimeBinding.artifactState}
      data-selected-incident-ref={incidents.selectedIncidentRef}
      data-reportability-decision={incidents.reportabilityChecklist.decision}
      data-closure-state={incidents.pirPanel.closureState}
      aria-label="Incident Desk"
    >
      <header className="ops-panel__header">
        <div>
          <p className="ops-panel__eyebrow">Incident Desk</p>
          <h2>Security incident command</h2>
        </div>
        <span className="ops-panel__headline">{incidents.surfaceSummary}</span>
      </header>

      <section
        className="ops-incident-command-strip"
        data-testid="incident-command-strip"
        data-surface="incident-command-strip"
        data-freshness-state={incidents.commandStrip.freshnessState}
        data-deadline-risk={incidents.commandStrip.deadlineRisk}
        aria-label="Incident command strip"
      >
        {[
          ["Open", incidents.commandStrip.openIncidentCount],
          ["Near miss", incidents.commandStrip.nearMissCount],
          ["SEV1", incidents.commandStrip.sev1Count],
          ["Pending report", incidents.commandStrip.reportablePendingCount],
          ["Closure blocked", incidents.commandStrip.closureBlockedCount],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
        <p>{incidents.commandStrip.summary}</p>
      </section>

      <div className="ops-incident-layout">
        <aside
          className="ops-incident-queue"
          data-testid="incident-queue"
          data-surface="incident-queue"
          data-filter={queueFilter}
          aria-label="Incident queue"
        >
          <header className="ops-incident-surface__header">
            <div>
              <p className="ops-panel__eyebrow">Incident queue</p>
              <h3>{visibleRows.length} visible record(s)</h3>
            </div>
            <span data-tone={incidentTone(incidents.runtimeBinding.bindingState)}>
              {titleCase(incidents.runtimeBinding.bindingState)}
            </span>
          </header>
          <div className="ops-incident-filter-bar" role="group" aria-label="Incident queue filter">
            {(["all", "incident", "near_miss"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className="ops-chip"
                data-testid={`incident-filter-${filter}`}
                data-active={queueFilter === filter}
                onClick={() => setQueueFilter(filter)}
              >
                {filter === "near_miss" ? "Near miss" : titleCase(filter)}
              </button>
            ))}
          </div>
          {visibleRows.length === 0 ? (
            <p className="ops-panel__summary" data-testid="incident-queue-empty">
              No incidents or near misses match this scope.
            </p>
          ) : (
            <div className="ops-incident-row-list" role="list">
              {visibleRows.map((row) => (
                <button
                  key={row.incidentRef}
                  type="button"
                  className="ops-incident-row"
                  role="listitem"
                  data-testid={`incident-row-${automationId(row.incidentRef)}`}
                  data-row-kind={row.rowKind}
                  data-severity={row.severity}
                  data-selected={row.incidentRef === incidents.selectedIncidentRef}
                  data-filter-preserved={
                    queueFilter !== "all" && row.incidentRef === selectedIncident?.incidentRef
                  }
                  data-reportability-decision={row.reportabilityDecision}
                  data-containment-state={row.containmentState}
                  onClick={() => {
                    setSelectedIncidentRef(row.incidentRef);
                    setEvidenceDrawerRef(null);
                  }}
                >
                  <span>{row.marker}</span>
                  <strong>{row.title}</strong>
                  <small>
                    {titleCase(row.severity)} / {titleCase(row.status)}
                  </small>
                  <small>
                    {titleCase(row.reportabilityDecision)} / {titleCase(row.containmentState)}
                  </small>
                  <em>{row.deadlineLabel}</em>
                </button>
              ))}
            </div>
          )}
          <div className="ops-panel__table">
            <table className="ops-table ops-table--compact">
              <caption>Incident queue table parity</caption>
              <thead>
                <tr>
                  <th scope="col">Marker</th>
                  <th scope="col">Type</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Reportability</th>
                  <th scope="col">Containment</th>
                  <th scope="col">Owner</th>
                </tr>
              </thead>
              <tbody>
                {incidents.incidentQueue.map((row) => (
                  <tr key={row.incidentRef} data-selected={row.selected}>
                    <td>{row.marker}</td>
                    <td>{row.rowKind}</td>
                    <td>{row.severity}</td>
                    <td>{row.reportabilityDecision}</td>
                    <td>{row.containmentState}</td>
                    <td>{row.ownerRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>

        <div className="ops-incident-main">
          <form
            className="ops-incident-surface ops-near-miss-intake"
            data-testid="near-miss-intake"
            data-surface="near-miss-intake"
            data-validation-state={intakeState}
            aria-label="Near-miss intake"
            onSubmit={(event) => {
              event.preventDefault();
              if (nearMissSummary.trim().length < 12) {
                setNearMissSettlementState("invalid_empty_summary");
                return;
              }
              setNearMissSettlementState("accepted_pending_settlement");
            }}
          >
            <header className="ops-incident-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Near-miss intake</p>
                <h3>First-class prevention report</h3>
              </div>
              <span data-tone={incidentTone(intakeState)}>{titleCase(intakeState)}</span>
            </header>
            <label>
              <span>Summary</span>
              <textarea
                value={nearMissSummary}
                onChange={(event) => {
                  setNearMissSummary(event.currentTarget.value);
                  if (nearMissSettlementState !== "idle") {
                    setNearMissSettlementState("idle");
                  }
                }}
                placeholder="Describe the observed control weakness"
                disabled={!incidents.nearMissIntake.allowed}
              />
            </label>
            {nearMissSettlementState === "invalid_empty_summary" ? (
              <p className="ops-form-error" role="alert" data-testid="near-miss-error">
                Summary is required before a near-miss report can settle.
              </p>
            ) : (
              <p aria-live="polite" data-testid="near-miss-settlement">
                {nearMissSettlementState === "accepted_pending_settlement"
                  ? "Near-miss report accepted locally; authoritative settlement is pending."
                  : incidents.nearMissIntake.settlementCopy}
              </p>
            )}
            <button
              type="submit"
              className="ops-button"
              data-testid="near-miss-submit"
              disabled={!incidents.nearMissIntake.allowed}
            >
              Submit near miss
            </button>
          </form>

          <section
            className="ops-incident-surface ops-severity-board"
            data-testid="severity-board"
            data-surface="severity-board"
            data-severity={incidents.severityBoard.severity}
            data-facts-completeness={incidents.severityBoard.factsCompleteness}
            aria-label="Severity board"
          >
            <header className="ops-incident-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Severity board</p>
                <h3>{titleCase(incidents.severityBoard.severity)}</h3>
              </div>
              <span data-tone={incidentTone(incidents.severityBoard.factsCompleteness)}>
                {incidents.severityBoard.confidenceLabel}
              </span>
            </header>
            <p>{incidents.severityBoard.rationale}</p>
            <dl className="ops-incident-facts">
              <div>
                <dt>Facts</dt>
                <dd>{titleCase(incidents.severityBoard.factsCompleteness)}</dd>
              </div>
              <div>
                <dt>Data impact</dt>
                <dd>{titleCase(incidents.severityBoard.dataImpact)}</dd>
              </div>
              <div>
                <dt>System impact</dt>
                <dd>{titleCase(incidents.severityBoard.systemImpact)}</dd>
              </div>
              <div>
                <dt>Escalation</dt>
                <dd>{titleCase(incidents.severityBoard.escalationRoute)}</dd>
              </div>
            </dl>
          </section>

          <section
            className="ops-incident-surface"
            data-testid="containment-timeline"
            data-surface="containment-timeline"
            aria-label="Containment timeline"
          >
            <header className="ops-incident-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Containment timeline</p>
                <h3>Pending / applied / failed settlement</h3>
              </div>
              <span>{incidents.containmentTimeline.length} actions</span>
            </header>
            <ol className="ops-incident-timeline">
              {incidents.containmentTimeline.map((event) => (
                <li
                  key={event.containmentActionRef}
                  data-testid={`containment-event-${event.state}`}
                  data-state={event.state}
                >
                  <time>{event.occurredAt}</time>
                  <strong>{event.label}</strong>
                  <span data-tone={incidentTone(event.state)}>{titleCase(event.state)}</span>
                  <p>{event.summary}</p>
                  <small>
                    {event.settlementRef} / {event.evidenceArtifactRef}
                  </small>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="ops-incident-detail" aria-label="Incident detail rail">
          <section
            className="ops-incident-surface"
            data-testid="reportability-checklist"
            data-surface="reportability-checklist"
            data-reportability-decision={incidents.reportabilityChecklist.decision}
            data-handoff-state={incidents.reportabilityChecklist.handoffState}
            aria-label="Reportability checklist"
          >
            <header className="ops-incident-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Reportability checklist</p>
                <h3>{titleCase(incidents.reportabilityChecklist.decision)}</h3>
              </div>
              <span data-tone={incidentTone(incidents.reportabilityChecklist.decision)}>
                {incidents.reportabilityChecklist.frameworkCode}
              </span>
            </header>
            <p>{incidents.reportabilityChecklist.decisionSummary}</p>
            <ul className="ops-inline-list">
              <li>{incidents.reportabilityChecklist.frameworkVersion}</li>
              <li>{incidents.reportabilityChecklist.deadlineLabel}</li>
              <li>Senior review {titleCase(incidents.reportabilityChecklist.seniorReviewState)}</li>
            </ul>
            <section
              className="ops-incident-handoff"
              data-testid="external-reporting-handoff"
              data-handoff-state={incidents.externalReportingHandoff.handoffState}
            >
              <strong>{incidents.externalReportingHandoff.target} handoff</strong>
              <span>{titleCase(incidents.externalReportingHandoff.handoffState)}</span>
              <p>{incidents.externalReportingHandoff.summary}</p>
              <small>{incidents.externalReportingHandoff.outboundNavigationGrantRef}</small>
            </section>
          </section>

          <section
            className="ops-incident-surface"
            data-testid="pir-panel"
            data-surface="pir-panel"
            data-review-state={incidents.pirPanel.reviewState}
            data-closure-state={incidents.pirPanel.closureState}
            aria-label="Post incident review"
          >
            <header className="ops-incident-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Post-incident review</p>
                <h3>{titleCase(incidents.pirPanel.reviewState)}</h3>
              </div>
              <span data-tone={incidentTone(incidents.pirPanel.closureState)}>
                Closure {titleCase(incidents.pirPanel.closureState)}
              </span>
            </header>
            <p>{incidents.pirPanel.rootCauseSummary}</p>
            <p>{incidents.pirPanel.lessonSummary}</p>
            <ul className="ops-inline-list">
              {(incidents.pirPanel.closureBlockerRefs.length
                ? incidents.pirPanel.closureBlockerRefs
                : ["no closure blockers"]
              ).map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </section>

          <section
            className="ops-incident-surface"
            data-testid="incident-capa-links"
            data-surface="incident-capa-links"
            aria-label="Incident CAPA and training links"
          >
            <header className="ops-incident-surface__header">
              <div>
                <p className="ops-panel__eyebrow">CAPA and drills</p>
                <h3>{incidents.capaLinks.length} linked action(s)</h3>
              </div>
            </header>
            <ul className="ops-incident-link-list">
              {incidents.capaLinks.map((link) => (
                <li key={link.linkRef} data-status={link.status}>
                  <strong>{link.label}</strong>
                  <span>{titleCase(link.status)}</span>
                  <small>
                    {link.ownerRef} / {link.dueAt} / {link.targetRoute}
                  </small>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="ops-incident-surface"
            data-testid="incident-evidence-links"
            data-surface="incident-evidence-links"
            aria-label="Incident evidence links"
          >
            <header className="ops-incident-surface__header">
              <div>
                <p className="ops-panel__eyebrow">Evidence links</p>
                <h3>Safe-return investigation anchors</h3>
              </div>
            </header>
            <div className="ops-incident-evidence-actions">
              {incidents.evidenceLinks.map((link) => (
                <button
                  key={link.evidenceLinkRef}
                  type="button"
                  className="ops-link"
                  data-testid={`incident-evidence-${automationId(link.targetSurface)}`}
                  data-safe-return-token={link.safeReturnTokenRef}
                  data-payload-class={link.payloadClass}
                  onClick={() => setEvidenceDrawerRef(link.evidenceLinkRef)}
                >
                  {link.label}
                </button>
              ))}
            </div>
            {evidenceDrawerRef && activeEvidenceLink ? (
              <section
                className="ops-incident-investigation-return"
                data-testid="incident-investigation-return"
                data-safe-return-token={activeEvidenceLink.safeReturnTokenRef}
                data-payload-class={activeEvidenceLink.payloadClass}
                aria-live="polite"
              >
                <strong>{activeEvidenceLink.label}</strong>
                <p>
                  Same-shell drawer preserves {activeEvidenceLink.safeReturnTokenRef} and returns to{" "}
                  {incidents.selectedIncidentRef}.
                </p>
                <small>
                  {activeEvidenceLink.timelineRef} / {activeEvidenceLink.graphRef} /{" "}
                  {activeEvidenceLink.artifactPresentationContractRef}
                </small>
              </section>
            ) : null}
          </section>

          <section
            className="ops-incident-surface"
            data-testid="incident-telemetry-redaction"
            data-surface="incident-telemetry-redaction"
            data-payload-class={incidents.telemetryRedaction.permittedPayloadClass}
            aria-label="Incident telemetry redaction"
          >
            <header className="ops-incident-surface__header">
              <div>
                <p className="ops-panel__eyebrow">UI telemetry</p>
                <h3>Redaction fence</h3>
              </div>
              <span>{incidents.telemetryRedaction.permittedPayloadClass}</span>
            </header>
            <p>{incidents.telemetryRedaction.telemetryCopy}</p>
            <ul className="ops-inline-list">
              <li>UIEventEnvelope {incidents.telemetryRedaction.uiEventEnvelopeRef}</li>
              <li>
                UITransitionSettlementRecord {incidents.telemetryRedaction.transitionSettlementRef}
              </li>
              <li>UITelemetryDisclosureFence {incidents.telemetryRedaction.disclosureFenceRef}</li>
            </ul>
            <ul className="ops-incident-redacted-fields">
              {incidents.telemetryRedaction.redactedFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </section>

          <section className="ops-incident-action-rail" aria-label="Incident action rail">
            {incidents.actionRail.map((action) => (
              <button
                key={action.actionType}
                type="button"
                className="ops-button"
                data-testid={`incident-action-${action.actionType}`}
                data-action-type={action.actionType}
                data-action-allowed={action.allowed}
                data-settlement-result={action.settlementResult}
                disabled={!action.allowed}
              >
                <span>{action.label}</span>
                <small>{titleCase(action.settlementResult)}</small>
              </button>
            ))}
          </section>
        </aside>
      </div>
    </section>
  );
}

function ChildRoutePanel(props: {
  snapshot: OpsBoardStateSnapshot;
  onReturn: () => void;
  onNavigate: (path: string) => void;
  onOpenGovernance: () => void;
}) {
  const { routeIntent, selectedAnomaly, location, returnToken } = props.snapshot;
  if (!routeIntent || !location.childRouteKind) {
    return null;
  }

  if (location.childRouteKind === "compare") {
    return (
      <section
        className="ops-child ops-child--compare"
        data-testid="ops-compare-route"
        data-surface="scenario-compare"
        aria-label="Compare view"
      >
        <header className="ops-child__header">
          <div>
            <p className="ops-panel__eyebrow">Compare posture</p>
            <h2>{selectedAnomaly.title}</h2>
          </div>
          <button
            type="button"
            className="ops-link"
            onClick={props.onReturn}
            data-testid="ops-return-button"
            data-surface="ops-return-token-target"
          >
            Return via {returnToken?.returnTokenId ?? "OpsReturnToken"}
          </button>
        </header>
        <div className="ops-compare-grid">
          <article className="ops-compare-card">
            <h3>Preserved proof basis</h3>
            <p>{selectedAnomaly.evidenceBasis}</p>
          </article>
          <article className="ops-compare-card">
            <h3>Current delta</h3>
            <p>{props.snapshot.allocationProjection.scenarioCompare.queuedDriftSummary}</p>
          </article>
          <article className="ops-compare-card ops-compare-card--sidecar">
            <h3>Guardrail</h3>
            <p>{props.snapshot.allocationProjection.scenarioCompare.frozenReason}</p>
            <button
              type="button"
              className="ops-button ops-button--ghost"
              onClick={props.onOpenGovernance}
            >
              Governance handoff stub
            </button>
          </article>
        </div>
      </section>
    );
  }

  if (location.childRouteKind === "health") {
    return (
      <section className="ops-child" data-testid="ops-health-route" aria-label="Health drill-down">
        <header className="ops-child__header">
          <div>
            <p className="ops-panel__eyebrow">Health drill</p>
            <h2>{selectedAnomaly.healthSummary}</h2>
          </div>
          <button
            type="button"
            className="ops-link"
            onClick={props.onReturn}
            data-testid="ops-return-button"
            data-surface="ops-return-token-target"
          >
            Return via {returnToken?.returnTokenId ?? "OpsReturnToken"}
          </button>
        </header>
        <table className="ops-table">
          <thead>
            <tr>
              <th scope="col">Function</th>
              <th scope="col">Owner</th>
              <th scope="col">Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Essential function</td>
              <td>{selectedAnomaly.ownerLabel}</td>
              <td>{selectedAnomaly.healthSummary}</td>
            </tr>
            <tr>
              <td>Time horizon</td>
              <td>{selectedAnomaly.timeHorizon}</td>
              <td>{selectedAnomaly.blockerSummary}</td>
            </tr>
          </tbody>
        </table>
      </section>
    );
  }

  if (location.childRouteKind === "interventions") {
    return (
      <section
        className="ops-child"
        data-testid="ops-intervention-route"
        aria-label="Intervention route"
      >
        <header className="ops-child__header">
          <div>
            <p className="ops-panel__eyebrow">Intervention route</p>
            <h2>{selectedAnomaly.recommendedAction}</h2>
          </div>
          <button
            type="button"
            className="ops-link"
            onClick={props.onReturn}
            data-testid="ops-return-button"
            data-surface="ops-return-token-target"
          >
            Return via {returnToken?.returnTokenId ?? "OpsReturnToken"}
          </button>
        </header>
        <div className="ops-investigation-card">
          <p className="ops-investigation-card__summary">{selectedAnomaly.blockerSummary}</p>
          <ul className="ops-inline-list">
            <li>{selectedAnomaly.confidenceLabel}</li>
            <li>{selectedAnomaly.cohortFocus}</li>
            <li>{selectedAnomaly.timeHorizon}</li>
          </ul>
          <button
            type="button"
            className="ops-button ops-button--ghost"
            onClick={props.onOpenGovernance}
          >
            {selectedAnomaly.governanceHandoffLabel}
          </button>
        </div>
      </section>
    );
  }

  if (location.childRouteKind === "investigations") {
    return (
      <InvestigationDrawerPanel
        snapshot={props.snapshot}
        onReturn={props.onReturn}
        onNavigate={props.onNavigate}
      />
    );
  }

  return null;
}

function OperationsShellSeedDocument(props: {
  state: OpsShellState;
  viewportWidth: number;
  onNavigate: (path: string) => void;
  onSelectAnomaly: (anomalyId: string) => void;
  onSelectHealthCell?: (serviceRef: string) => void;
  onSetDeltaGate: (deltaGateState: OpsDeltaGateState) => void;
  onReturn: () => void;
  onOpenGovernance: () => void;
  onCloseGovernance: () => void;
}) {
  const snapshot = resolveOpsBoardSnapshot(props.state, props.viewportWidth);
  const automationProfile = resolveAutomationAnchorProfile(props.state.location.routeFamilyRef);
  const selectedAnchorBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "selected_anchor",
  );
  const dominantActionBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "dominant_action",
  );
  const focusRestoreBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "focus_restore",
  );
  const rootAutomationAttributes = buildAutomationSurfaceAttributes(automationProfile, {
    selectedAnchorRef: props.state.continuitySnapshot.selectedAnchor.anchorId,
    focusRestoreRef: props.state.continuitySnapshot.focusRestoreTargetRef,
    dominantActionRef: dominantActionBinding?.markerRef ?? automationProfile.dominantActionRef,
    artifactModeState: artifactModeForSnapshot(snapshot),
    recoveryPosture: recoveryPostureForSnapshot(snapshot),
    visualizationAuthority: visualizationAuthorityForSnapshot(snapshot),
    routeShellPosture: routeShellPostureForSnapshot(snapshot),
  });
  const allocation = snapshot.allocationProjection;
  const assurance = snapshot.assuranceProjection;
  const complianceLedger = snapshot.complianceLedgerProjection;
  const conformanceScorecard = snapshot.conformanceProjection;
  const incidents = snapshot.incidentsProjection;
  const investigation = snapshot.investigationProjection;
  const resilience = snapshot.resilienceProjection;
  const destinationRegistry = createOperationalDestinationRegistryProjection({
    scenarioState: destinationScenarioFromLocation("normal"),
  });
  const backupRestoreRegistry = createBackupRestoreChannelRegistryProjection({
    scenarioState: backupRestoreScenarioFromLocation("normal"),
  });
  const securityComplianceExportRegistry = createSecurityComplianceExportRegistryProjection({
    scenarioState: securityComplianceExportScenarioFromLocation("normal"),
    destinationClass: exportDestinationForOpsPath(snapshot.location.pathname),
  });
  const phase9LiveGatewayProjection = createLivePhase9ProjectionGatewayProjection({
    scenarioState: phase9LiveScenarioFromLocation("normal"),
    selectedSurfaceCode: phase9LiveSurfaceCodeForPath(snapshot.location.pathname),
  });

  return (
    <div
      className={frameClass(snapshot.frameMode)}
      data-testid="ops-shell-root"
      data-surface="ops-overview"
      data-ops-lens={snapshot.location.lens}
      data-layout-mode={snapshot.frameMode}
      data-overview-state={snapshot.overviewState}
      data-allocation-route-state={allocation.scenarioState}
      data-allocation-digest-ref={allocation.boardStateDigestRef}
      data-assurance-framework={assurance.selectedFrameworkCode}
      data-assurance-binding-state={assurance.runtimeBinding.bindingState}
      data-assurance-pack-state={assurance.packPreview.packState}
      data-assurance-settlement-result={assurance.latestSettlement.result}
      data-assurance-export-control-state={assurance.actionRail[0]?.controlState ?? "blocked"}
      data-compliance-ledger-state={complianceLedger.scenarioState}
      data-compliance-graph-verdict={complianceLedger.graphBlocker.graphVerdictState}
      data-compliance-action-control-state={complianceLedger.actionControlState}
      data-compliance-visual-mode={complianceLedger.visualMode}
      data-compliance-no-raw-artifact-urls={complianceLedger.noRawArtifactUrls}
      data-conformance-scorecard-state={conformanceScorecard.scorecardHash.scorecardState}
      data-conformance-bau-action-state={conformanceScorecard.bauSignoffReadiness.actionState}
      data-conformance-visual-mode={conformanceScorecard.visualMode}
      data-conformance-no-raw-artifact-urls={conformanceScorecard.noRawArtifactUrls}
      data-incident-binding-state={incidents.runtimeBinding.bindingState}
      data-incident-action-control-state={incidents.runtimeBinding.actionControlState}
      data-incident-reportability-decision={incidents.reportabilityChecklist.decision}
      data-incident-containment-state={incidents.containmentTimeline[0]?.state ?? "none"}
      data-incident-closure-state={incidents.pirPanel.closureState}
      data-investigation-question-hash={investigation.investigationQuestionHash}
      data-investigation-scope-hash={investigation.scopeEnvelope.scopeHash}
      data-investigation-timeline-hash={investigation.timelineReconstruction.timelineHash}
      data-investigation-graph-verdict={investigation.evidenceGraph.verdictState}
      data-investigation-export-state={investigation.bundleExport.exportState}
      data-resilience-control-state={resilience.recoveryControlPosture.postureState}
      data-resilience-binding-state={resilience.runtimeBinding.bindingState}
      data-resilience-readiness-state={resilience.readinessSnapshot.readinessState}
      data-resilience-tuple-hash={resilience.resilienceTupleHash}
      data-resilience-settlement-result={resilience.latestSettlement.result}
      data-destination-registry-state={destinationRegistry.scenarioState}
      data-destination-ready-count={destinationRegistry.readyCount}
      data-destination-blocked-count={destinationRegistry.blockedCount}
      data-backup-restore-state={backupRestoreRegistry.scenarioState}
      data-backup-target-ready-count={backupRestoreRegistry.readiness.targetReadyCount}
      data-backup-target-blocked-count={backupRestoreRegistry.readiness.targetBlockedCount}
      data-restore-channel-ready-count={backupRestoreRegistry.readiness.channelReadyCount}
      data-restore-channel-blocked-count={backupRestoreRegistry.readiness.channelBlockedCount}
      data-backup-restore-readiness-state={backupRestoreRegistry.readiness.readinessState}
      data-backup-restore-recovery-control-state={
        backupRestoreRegistry.readiness.recoveryControlState
      }
      data-security-compliance-export-state={securityComplianceExportRegistry.scenarioState}
      data-security-compliance-export-ready-count={securityComplianceExportRegistry.readyCount}
      data-security-compliance-export-blocked-count={securityComplianceExportRegistry.blockedCount}
      data-security-compliance-export-stale-count={securityComplianceExportRegistry.staleCount}
      data-security-compliance-export-source-readiness-state={aggregateSecurityComplianceExportReadiness(
        securityComplianceExportRegistry,
      )}
      data-phase9-live-gateway-state={phase9LiveGatewayProjection.scenarioState}
      data-phase9-live-channel-state={phase9LiveGatewayProjection.selectedSurface.projectionState}
      data-phase9-live-action-settlement-state={
        phase9LiveGatewayProjection.selectedSurface.actionSettlementState
      }
      data-phase9-live-graph-verdict-state={
        phase9LiveGatewayProjection.selectedSurface.graphVerdictState
      }
      data-phase9-live-delta-gate-state={phase9LiveGatewayProjection.selectedSurface.deltaGateState}
      data-phase9-live-return-token-state={
        phase9LiveGatewayProjection.selectedSurface.returnTokenState
      }
      data-phase9-live-raw-event-browser-join-allowed={String(
        phase9LiveGatewayProjection.rawEventBrowserJoinAllowed,
      )}
      data-shell-continuity-key={snapshot.shellContinuityKey}
      data-board-state-digest-ref={snapshot.boardStateDigestRef}
      data-board-tuple-hash={snapshot.boardTupleHash}
      data-board-scope-ref={snapshot.boardScopeRef}
      data-time-horizon={snapshot.timeHorizon}
      data-selected-health-cell-ref={snapshot.selectedHealthCellRef}
      data-delta-gate={snapshot.deltaGate.gateState}
      data-workbench-state={snapshot.workbenchState}
      data-action-eligibility-state={allocation.actionEligibilityFence.eligibilityState}
      data-candidate-lease-state={allocation.candidateLease.eligibilityState}
      data-parity-mode={snapshot.visualizationMode}
      data-selected-anomaly-id={snapshot.selectedAnomaly.anomalyId}
      data-current-path={snapshot.location.pathname}
      data-reduced-motion="respect"
      {...rootAutomationAttributes}
    >
      <header className="ops-shell__masthead" role="banner">
        <div className="ops-shell__brand">
          <VecellLogoLockup
            aria-hidden="true"
            className="ops-insignia"
            style={{ width: 166, height: "auto" }}
          />
          <div>
            <p className="ops-shell__brand-kicker">Quiet operations mission control</p>
            <h1>Operations console</h1>
          </div>
        </div>
        <div className="ops-shell__controls" aria-label="Scope and live controls">
          <label>
            <span>Scope</span>
            <select value={snapshot.boardScopeRef} onChange={() => undefined}>
              <option value={snapshot.boardScopeRef}>Demo GP service owner board</option>
            </select>
          </label>
          <label>
            <span>Horizon</span>
            <select value={snapshot.timeHorizon} onChange={() => undefined}>
              <option value={snapshot.timeHorizon}>{snapshot.timeHorizon}</option>
            </select>
          </label>
          <button
            type="button"
            className="ops-chip"
            data-live-control={snapshot.freshnessStrip.liveControlState}
            onClick={() =>
              props.onSetDeltaGate(snapshot.deltaGate.gateState === "live" ? "buffered" : "live")
            }
          >
            {snapshot.freshnessStrip.liveControlState === "live" ? "Pause live" : "Resume live"}
          </button>
        </div>
        <nav className="ops-shell__nav" aria-label="Operations lenses">
          {opsLensOrder.map((lens) => (
            <button
              key={lens}
              type="button"
              className="ops-shell__nav-link"
              data-testid={`ops-lens-${lens}`}
              data-active={snapshot.location.lens === lens}
              onClick={() => props.onNavigate(rootPathForOpsLens(lens))}
            >
              {lensLabel(lens)}
            </button>
          ))}
        </nav>
      </header>

      <section
        className="ops-status-strip"
        aria-label="Operations status strip"
        data-testid="ops-freshness-strip"
        data-surface="ops-freshness-strip"
        data-freshness-state={snapshot.freshnessStrip.freshnessState}
        data-trust-state={snapshot.freshnessStrip.trustState}
        data-freeze-state={snapshot.freshnessStrip.freezeState}
        data-publication-state={snapshot.freshnessStrip.publicationState}
      >
        <div
          className="ops-status-strip__tone"
          data-tone={deltaGateTone(snapshot.deltaGate.gateState)}
        >
          <strong>{snapshot.freshnessStrip.label}</strong>
          <span>{snapshot.deltaGate.summary}</span>
        </div>
        <div className="ops-status-strip__facts" role="status" aria-live="polite">
          <span>Freshness {titleCase(snapshot.freshnessStrip.freshnessState)}</span>
          <span>Trust {titleCase(snapshot.freshnessStrip.trustState)}</span>
          <span>Freeze {titleCase(snapshot.freshnessStrip.freezeState)}</span>
          <span>{snapshot.freshnessStrip.restoreReport}</span>
        </div>
        <div className="ops-status-strip__toggles" data-testid="ops-delta-gate-controls">
          {(["live", "buffered", "stale", "table_only"] as const).map((gateState) => (
            <button
              key={gateState}
              type="button"
              className="ops-chip"
              data-testid={`ops-delta-${gateState}`}
              data-active={snapshot.deltaGate.gateState === gateState}
              onClick={() => props.onSetDeltaGate(gateState)}
            >
              {gateState === "table_only" ? "Parity downgrade" : titleCase(gateState)}
            </button>
          ))}
        </div>
      </section>

      <DestinationReadinessSurfaceStrip
        projection={destinationRegistry}
        currentRoute={snapshot.location.pathname}
      />
      <BackupRestoreReadinessSurfaceStrip
        projection={backupRestoreRegistry}
        currentRoute={snapshot.location.pathname}
      />
      <SecurityComplianceExportReadinessSurfaceStrip
        projection={securityComplianceExportRegistry}
        currentRoute={snapshot.location.pathname}
      />
      <Phase9LiveProjectionGatewayStrip
        projection={phase9LiveGatewayProjection}
        currentRoute={snapshot.location.pathname}
      />

      <div className="ops-shell__frame">
        <main className="ops-shell__main" role="main">
          <section
            className="ops-panel ops-panel--north-star"
            aria-label="North star band"
            data-testid="north-star-band"
            data-surface="north-star-band"
          >
            <header className="ops-panel__header">
              <div>
                <p className="ops-panel__eyebrow">NorthStarBand</p>
                <h2>Operational vitals</h2>
              </div>
              <span className="ops-panel__headline">{snapshot.summarySentence}</span>
            </header>
            <p className="ops-panel__summary">{snapshot.overviewProjection.surfaceSummary}</p>
            <div className="ops-north-star-grid">
              {snapshot.northStarBand.map((metric) => (
                <button
                  key={metric.metricId}
                  type="button"
                  className="ops-north-star-card"
                  onClick={() => props.onNavigate(metric.drillPath)}
                  data-state={metric.stateLabel}
                >
                  <span>{metric.label}</span>
                  <strong>
                    {metric.value} <small>{metric.unit}</small>
                  </strong>
                  <Sparkline values={metric.trend} label={`${metric.label} trend`} />
                  <p>{metric.changeLabel}</p>
                  <span className="ops-state-label">{titleCase(metric.stateLabel)}</span>
                  <small>{metric.interpretation}</small>
                  <em>
                    {metric.freshnessLabel} / {metric.confidenceLabel}
                  </em>
                </button>
              ))}
            </div>
            <table className="ops-table ops-table--compact" data-testid="north-star-band-fallback">
              <caption>North star band fallback</caption>
              <thead>
                <tr>
                  <th scope="col">Vital</th>
                  <th scope="col">Value</th>
                  <th scope="col">State</th>
                  <th scope="col">Freshness</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.northStarBand.map((metric) => (
                  <tr key={metric.metricId}>
                    <td>{metric.label}</td>
                    <td>
                      {metric.value} {metric.unit}
                    </td>
                    <td>{titleCase(metric.stateLabel)}</td>
                    <td>{metric.freshnessLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {snapshot.stableServiceDigest ? (
            <section
              className="ops-panel ops-stable-digest"
              aria-label="Stable service digest"
              data-testid="ops-stable-service-digest"
              data-surface="ops-stable-service-digest"
            >
              <header className="ops-panel__header">
                <div>
                  <p className="ops-panel__eyebrow">OpsStableServiceDigest</p>
                  <h2>No material anomaly</h2>
                </div>
                <span className="ops-panel__headline">
                  {snapshot.stableServiceDigest.freshnessSummary}
                </span>
              </header>
              <p className="ops-panel__summary">{snapshot.stableServiceDigest.trustBasis}</p>
              <div className="ops-digest-grid">
                <section>
                  <h3>Checked</h3>
                  <ul className="ops-inline-list">
                    {snapshot.stableServiceDigest.topHealthySignals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>Watch</h3>
                  <ul className="ops-inline-list">
                    {snapshot.stableServiceDigest.watchItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </section>
          ) : null}

          {snapshot.location.lens === "dependencies" && !snapshot.location.childRouteKind ? (
            <DependencyReadinessBoard478Shell />
          ) : null}

          {snapshot.location.lens === "audit" && !snapshot.location.childRouteKind ? (
            <AuditExplorerPanel snapshot={snapshot} />
          ) : null}

          {snapshot.location.lens === "assurance" && !snapshot.location.childRouteKind ? (
            <AssuranceCenterPanel snapshot={snapshot} />
          ) : null}

          {snapshot.location.lens === "conformance" && !snapshot.location.childRouteKind ? (
            <ConformanceScorecardShell snapshot={snapshot} />
          ) : null}

          {snapshot.location.lens === "incidents" && !snapshot.location.childRouteKind ? (
            <IncidentDeskPanel snapshot={snapshot} />
          ) : null}

          {snapshot.location.lens === "resilience" && !snapshot.location.childRouteKind ? (
            <ResilienceBoardPanel
              snapshot={snapshot}
              onSelectHealthCell={props.onSelectHealthCell}
            />
          ) : null}

          <VisualizationPanel
            title="ServiceHealthGrid"
            summary={snapshot.selectedHealthCell.summary}
            trustLabel={`Trust ${titleCase(snapshot.selectedHealthCell.requiredTrustState)}`}
            freshnessLabel={`Freshness ${snapshot.selectedHealthCell.freshnessAge}`}
            visualizationMode={snapshot.visualizationMode}
            dataTestId="ops-service-health-grid"
            dataSurface="service-health-grid"
            visual={
              <div
                className="ops-health-grid"
                role="list"
                aria-label="Essential function health cells"
              >
                {snapshot.serviceHealth.map((row) => (
                  <button
                    key={row.serviceRef}
                    type="button"
                    className="ops-health-grid__cell"
                    role="listitem"
                    data-testid="ops-health-cell"
                    data-surface="ops-health-cell"
                    data-entity-ref={row.serviceRef}
                    data-selected={snapshot.selectedHealthCellRef === row.serviceRef}
                    data-health-state={row.state}
                    data-health-tone={healthTone(row.state)}
                    data-health-overlay-state={row.overlayState}
                    onClick={() => props.onSelectHealthCell?.(row.serviceRef)}
                  >
                    <span className="ops-health-grid__accent" aria-hidden="true" />
                    <strong>{row.serviceLabel}</strong>
                    <span>{titleCase(row.state)}</span>
                    <small>
                      {titleCase(row.requiredTrustState)} / {row.freshnessAge}
                    </small>
                    <small>
                      {row.blockerCount} blocker{row.blockerCount === 1 ? "" : "s"}
                    </small>
                    <Sparkline values={row.trend} label={`${row.serviceLabel} trend`} />
                    <em>{row.latestMarker}</em>
                  </button>
                ))}
              </div>
            }
            table={
              <table className="ops-table" data-testid="service-health-grid-fallback">
                <caption>Service health fallback</caption>
                <thead>
                  <tr>
                    <th scope="col">Function</th>
                    <th scope="col">State</th>
                    <th scope="col">Trust</th>
                    <th scope="col">Freshness</th>
                    <th scope="col">Blockers</th>
                    <th scope="col">Latest marker</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.serviceHealth.map((row) => (
                    <tr
                      key={row.serviceRef}
                      data-selected={snapshot.selectedHealthCellRef === row.serviceRef}
                    >
                      <td>{row.serviceLabel}</td>
                      <td>{titleCase(row.state)}</td>
                      <td>{titleCase(row.requiredTrustState)}</td>
                      <td>{row.freshnessAge}</td>
                      <td>{row.blockerCount}</td>
                      <td>{row.latestMarker}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />

          <VisualizationPanel
            title="BottleneckRadar"
            summary={allocation.surfaceSummary}
            trustLabel={`Trust ${allocation.bottleneckLadder.find((row) => row.selected)?.freshnessTrust ?? snapshot.selectedAnomaly.trustSummary}`}
            freshnessLabel={`Lease ${allocation.candidateLease.eligibilityState}`}
            visualizationMode={snapshot.visualizationMode}
            dataTestId="ops-bottleneck-radar"
            dataSurface="bottleneck-radar"
            visual={
              <div
                className="ops-radar ops-ladder"
                role="list"
                aria-label="Ranked bottleneck ladder"
              >
                {allocation.bottleneckLadder.map((row) => {
                  const anomaly =
                    snapshot.anomalyRanking.find((item) => item.anomalyId === row.anomalyRef) ??
                    snapshot.selectedAnomaly;
                  return (
                    <button
                      key={row.anomalyRef}
                      type="button"
                      className="ops-radar__node ops-ladder__row"
                      role="listitem"
                      data-testid={`ops-anomaly-${row.anomalyRef}`}
                      data-surface="bottleneck-radar-row"
                      data-entity-ref={row.anomalyRef}
                      data-rank={row.rank}
                      data-selected={snapshot.selectedAnomaly.anomalyId === row.anomalyRef}
                      data-tone={severityTone(anomaly.severity)}
                      data-action-eligibility-state={row.actionEligibilityState}
                      onClick={() => props.onSelectAnomaly(row.anomalyRef)}
                      {...(selectedAnchorBinding
                        ? buildAutomationAnchorElementAttributes(selectedAnchorBinding, {
                            instanceKey: row.anomalyRef,
                          })
                        : {})}
                    >
                      <span className="ops-ladder__rank">#{row.rank}</span>
                      <span className="ops-ladder__body">
                        <strong>{row.anomalyName}</strong>
                        <span>{row.affectedScope}</span>
                        <small>{row.reason}</small>
                      </span>
                      <span
                        className="ops-ladder__metrics"
                        aria-label={`${row.anomalyName} ranking factors`}
                      >
                        <span>
                          Consequence <b>{row.consequenceScore}</b>
                        </span>
                        <span>
                          Leverage <b>{row.leverageScore}</b>
                        </span>
                        <span>
                          Guardrail drag <b>{row.guardrailDrag}</b>
                        </span>
                      </span>
                      <span className="ops-score-strip" aria-hidden="true">
                        <span style={{ width: scoreWidth(row.consequenceScore) }} />
                        <span style={{ width: scoreWidth(row.leverageScore) }} />
                        <span style={{ width: scoreWidth(100 - row.guardrailDrag) }} />
                      </span>
                      <Sparkline values={row.trend} label={`${row.anomalyName} trend`} />
                      <span className="ops-ladder__footer">
                        {row.persistence} / {row.freshnessTrust} /{" "}
                        {titleCase(row.actionEligibilityState)}
                      </span>
                    </button>
                  );
                })}
              </div>
            }
            table={
              <table className="ops-table">
                <caption>Promoted anomaly ranking fallback</caption>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Anomaly</th>
                    <th scope="col">Affected scope</th>
                    <th scope="col">Consequence</th>
                    <th scope="col">Leverage</th>
                    <th scope="col">Persistence</th>
                    <th scope="col">Freshness and trust</th>
                    <th scope="col">Guardrail drag</th>
                    <th scope="col">Eligibility</th>
                    <th scope="col">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation.bottleneckLadder.map((row) => (
                    <tr
                      key={row.anomalyRef}
                      data-selected={snapshot.selectedAnomaly.anomalyId === row.anomalyRef}
                    >
                      <td>{row.rank}</td>
                      <td>{row.anomalyName}</td>
                      <td>{row.affectedScope}</td>
                      <td>{row.consequenceScore}</td>
                      <td>{row.leverageScore}</td>
                      <td>{row.persistence}</td>
                      <td>{row.freshnessTrust}</td>
                      <td>{row.guardrailDrag}</td>
                      <td>{titleCase(row.actionEligibilityState)}</td>
                      <td>{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />

          <div className="ops-shell__secondary-grid">
            <VisualizationPanel
              title="CapacityAllocator"
              summary="Current capacity, proposed delta, breach impact, constraints, and calibration stay on the same metric basis."
              trustLabel={`Eligibility ${titleCase(allocation.actionEligibilityFence.eligibilityState)}`}
              freshnessLabel={`Compare ${allocation.scenarioCompare.deltaGateState}`}
              visualizationMode={snapshot.visualizationMode}
              dataTestId="ops-capacity-allocator"
              dataSurface="capacity-allocator"
              visual={
                <div className="ops-capacity-board" aria-label="Capacity allocation board">
                  {allocation.capacityRows.map((row) => (
                    <article
                      key={row.capacityRef}
                      className="ops-capacity-row"
                      data-proposal-state={row.proposalState}
                    >
                      <div className="ops-capacity-row__header">
                        <strong>{row.laneLabel}</strong>
                        <span>
                          {row.proposedDelta >= 0 ? "+" : ""}
                          {row.proposedDelta}
                        </span>
                      </div>
                      <div className="ops-capacity-bars" aria-hidden="true">
                        <span style={{ width: scoreWidth(row.currentCapacity * 4) }} />
                        <span style={{ width: scoreWidth(row.resultingCapacity * 4) }} />
                      </div>
                      <p>{row.breachRiskDelta}</p>
                      <small>{row.dependencyConstraint}</small>
                      <em>
                        {row.confidenceInterval} / {row.calibrationAge}
                      </em>
                    </article>
                  ))}
                </div>
              }
              table={
                <table className="ops-table">
                  <caption>Capacity allocator fallback</caption>
                  <thead>
                    <tr>
                      <th scope="col">Lane</th>
                      <th scope="col">Current</th>
                      <th scope="col">Proposed delta</th>
                      <th scope="col">Resulting</th>
                      <th scope="col">Breach impact</th>
                      <th scope="col">Constraint</th>
                      <th scope="col">Confidence</th>
                      <th scope="col">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocation.capacityRows.map((row) => (
                      <tr key={row.capacityRef}>
                        <td>{row.laneLabel}</td>
                        <td>{row.currentCapacity}</td>
                        <td>{row.proposedDelta}</td>
                        <td>{row.resultingCapacity}</td>
                        <td>{row.breachRiskDelta}</td>
                        <td>{row.dependencyConstraint}</td>
                        <td>
                          {row.confidenceInterval} / {row.calibrationAge}
                        </td>
                        <td>{row.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            />

            <VisualizationPanel
              title="CohortImpactMatrix"
              summary={`Current focus: ${snapshot.selectedAnomaly.cohortFocus}`}
              trustLabel="Sample-gated"
              freshnessLabel="Table parity exact"
              visualizationMode={snapshot.visualizationMode}
              dataTestId="ops-cohort-impact-matrix"
              dataSurface="cohort-impact-matrix"
              visual={
                <div
                  className="ops-cohort-grid ops-cohort-matrix"
                  aria-label="Cohort impact matrix"
                >
                  {allocation.cohortRows.map((row) => (
                    <article
                      key={row.cohortRef}
                      className="ops-cohort-grid__cell"
                      data-low-sample={row.lowSample}
                      data-promotion-state={row.promotionState}
                    >
                      <strong>{row.cohortLabel}</strong>
                      <span>{row.pressureIndex} pressure</span>
                      <dl className="ops-cohort-mini">
                        <div>
                          <dt>Variance</dt>
                          <dd>{row.variance}</dd>
                        </div>
                        <div>
                          <dt>n eff</dt>
                          <dd>{row.effectiveSampleSize}</dd>
                        </div>
                        <div>
                          <dt>Effect</dt>
                          <dd>{row.proposedEffect}</dd>
                        </div>
                      </dl>
                      <small>{row.safeSummary}</small>
                    </article>
                  ))}
                </div>
              }
              table={
                <table className="ops-table">
                  <caption>Cohort impact fallback</caption>
                  <thead>
                    <tr>
                      <th scope="col">Cohort</th>
                      <th scope="col">Pressure</th>
                      <th scope="col">Variance</th>
                      <th scope="col">Sample size</th>
                      <th scope="col">Confidence</th>
                      <th scope="col">Equity watch</th>
                      <th scope="col">Proposed effect</th>
                      <th scope="col">Promotion state</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocation.cohortRows.map((row) => (
                      <tr key={row.cohortRef}>
                        <td>{row.cohortLabel}</td>
                        <td>{row.pressureIndex}</td>
                        <td>{row.variance}</td>
                        <td>{row.effectiveSampleSize}</td>
                        <td>{row.confidenceInterval}</td>
                        <td>{row.equityWatch}</td>
                        <td>{row.proposedEffect}</td>
                        <td>{titleCase(row.promotionState)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            />
          </div>

          {snapshot.location.childRouteKind ? (
            <ChildRoutePanel
              snapshot={snapshot}
              onReturn={props.onReturn}
              onNavigate={props.onNavigate}
              onOpenGovernance={props.onOpenGovernance}
            />
          ) : null}

          {snapshot.governanceHandoff ? (
            <section
              className="ops-governance-stub"
              data-testid="ops-governance-handoff"
              data-surface="ops-governance-handoff"
              aria-label="Governance handoff"
            >
              <header className="ops-child__header">
                <div>
                  <p className="ops-panel__eyebrow">Governance stub</p>
                  <h2>{snapshot.governanceHandoff.title}</h2>
                </div>
                <button
                  type="button"
                  className="ops-link"
                  data-testid="ops-governance-return"
                  onClick={props.onCloseGovernance}
                >
                  Return safely
                </button>
              </header>
              <p>{snapshot.governanceHandoff.summary}</p>
              <ul className="ops-inline-list">
                <li>{snapshot.governanceHandoff.launchLabel}</li>
                <li>{snapshot.governanceHandoff.returnToken.returnTokenId}</li>
                <li>{snapshot.governanceHandoff.returnToken.originPath}</li>
              </ul>
            </section>
          ) : null}
        </main>

        <aside className="ops-shell__aside" aria-label="Intervention workbench">
          <section
            className="ops-workbench"
            data-testid="ops-intervention-workbench"
            data-surface="intervention-workbench"
            data-workbench-tone={workbenchTone(snapshot)}
            data-action-eligibility-state={allocation.actionEligibilityFence.eligibilityState}
            data-candidate-lease-ref={allocation.candidateLease.candidateLeaseId}
            data-settlement-status={allocation.candidateLease.settlementStatus}
            data-selected-health-cell-ref={snapshot.selectedHealthCellRef}
            {...(dominantActionBinding
              ? buildAutomationAnchorElementAttributes(dominantActionBinding, {
                  instanceKey: snapshot.selectedAnomaly.anomalyId,
                })
              : {})}
          >
            <header className="ops-workbench__header">
              <div>
                <p className="ops-panel__eyebrow">InterventionWorkbench</p>
                <h2>{snapshot.selectedAnomaly.title}</h2>
              </div>
              <span className="ops-workbench__state">
                {titleCase(allocation.actionEligibilityFence.eligibilityState)}
              </span>
            </header>
            <p className="ops-workbench__summary">{snapshot.selectedAnomaly.recommendedAction}</p>
            <ul className="ops-inline-list">
              <li>{allocation.selectedIntervention.expectedBenefit}</li>
              <li>Selection lease {snapshot.selectionLease.leaseState}</li>
              <li>Candidate lease {allocation.candidateLease.candidateLeaseId}</li>
              <li>Settlement {titleCase(allocation.candidateLease.settlementStatus)}</li>
            </ul>
            <section
              className="ops-eligibility-card"
              data-testid="action-eligibility-state"
              data-surface="action-eligibility-state"
              data-eligibility-state={allocation.actionEligibilityFence.eligibilityState}
              data-tone={eligibilityTone(allocation.actionEligibilityFence.eligibilityState)}
              aria-live="polite"
            >
              <strong>{allocation.actionEligibilityFence.announcedCopy}</strong>
              <p>{allocation.actionEligibilityFence.reason}</p>
              <small>{allocation.actionEligibilityFence.timeoutRecovery}</small>
            </section>
            <div className="ops-candidate-list" aria-label="Candidate interventions">
              {allocation.interventionCandidates.map((candidate) => (
                <article
                  key={candidate.candidateRef}
                  className="ops-candidate"
                  data-selected={candidate.selected}
                  data-readiness-state={candidate.readinessState}
                  data-eligibility-state={candidate.eligibilityState}
                >
                  <header>
                    <strong>{candidate.title}</strong>
                    <span>{titleCase(candidate.readinessState)}</span>
                  </header>
                  <p>{candidate.expectedBenefit}</p>
                  <dl className="ops-candidate__facts">
                    <div>
                      <dt>Uncertainty</dt>
                      <dd>{candidate.uncertainty}</dd>
                    </div>
                    <div>
                      <dt>Lag</dt>
                      <dd>{candidate.implementationLag}</dd>
                    </div>
                    <div>
                      <dt>Owner</dt>
                      <dd>{candidate.owner}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <dl className="ops-keyfacts">
              <div>
                <dt>Selected service</dt>
                <dd>{snapshot.selectedHealthCell.summary}</dd>
              </div>
              <div>
                <dt>Health posture</dt>
                <dd>
                  {titleCase(snapshot.selectedHealthCell.state)} /{" "}
                  {titleCase(snapshot.selectedHealthCell.mitigationAuthorityState)}
                </dd>
              </div>
              <div>
                <dt>Current blocker</dt>
                <dd>
                  {snapshot.selectedHealthCell.blockerCount} blocker
                  {snapshot.selectedHealthCell.blockerCount === 1 ? "" : "s"} /{" "}
                  {snapshot.selectedHealthCell.latestMarker}
                </dd>
              </div>
              <div>
                <dt>Blockers</dt>
                <dd>{snapshot.selectedAnomaly.blockerSummary}</dd>
              </div>
              <div>
                <dt>Preconditions</dt>
                <dd>{snapshot.selectedAnomaly.evidenceBasis}</dd>
              </div>
              <div>
                <dt>Action eligibility fence</dt>
                <dd>
                  {titleCase(allocation.actionEligibilityFence.eligibilityState)} /{" "}
                  {allocation.actionEligibilityFence.actionEligibilityFenceRef}
                </dd>
              </div>
              <div>
                <dt>Idempotency and settlement</dt>
                <dd>
                  {allocation.candidateLease.idempotencyKey} /{" "}
                  {titleCase(allocation.candidateLease.settlementStatus)}
                </dd>
              </div>
            </dl>
            <section
              className="ops-scenario-compare"
              data-testid="scenario-compare"
              data-surface="scenario-compare"
              data-rank-order-stable={allocation.scenarioCompare.rankOrderStable}
            >
              <strong>Scenario compare</strong>
              <p>{allocation.scenarioCompare.frozenReason}</p>
              <small>{allocation.scenarioCompare.queuedDriftSummary}</small>
              <button
                type="button"
                className="ops-link"
                data-testid="ops-scenario-compare-button"
                onClick={() =>
                  props.onNavigate(
                    `/ops/${snapshot.location.lens}/compare/${snapshot.selectedAnomaly.anomalyId}`,
                  )
                }
              >
                Open compare with frozen base
              </button>
            </section>
            <div className="ops-workbench__actions">
              {(["investigations", "interventions", "compare", "health"] as const).map(
                (childRouteKind) => (
                  <button
                    key={childRouteKind}
                    type="button"
                    className="ops-button"
                    data-testid={`ops-route-button-${childRouteKind}`}
                    onClick={() =>
                      props.onNavigate(
                        `/ops/${snapshot.location.lens}/${childRouteKind}/${snapshot.selectedAnomaly.anomalyId}`,
                      )
                    }
                  >
                    {titleCase(childRouteKind)}
                  </button>
                ),
              )}
              <button
                type="button"
                className="ops-button ops-button--secondary"
                data-testid="ops-return-token-target"
                data-surface="ops-return-token-target"
                onClick={() =>
                  props.onNavigate(
                    `/ops/${snapshot.location.lens}/health/${snapshot.selectedAnomaly.anomalyId}`,
                  )
                }
              >
                Drill with {snapshot.returnToken?.returnTokenId ?? "OpsReturnToken"}
              </button>
              <button
                type="button"
                className="ops-button ops-button--ghost"
                data-testid="ops-governance-button"
                onClick={props.onOpenGovernance}
              >
                Governance handoff
              </button>
            </div>
          </section>

          <section className="ops-panel" aria-label="Telemetry log">
            <header className="ops-panel__header">
              <div>
                <p className="ops-panel__eyebrow">DOM markers and telemetry</p>
                <h3>Recent board-state events</h3>
              </div>
              <span>{props.state.telemetry.length} envelopes</span>
            </header>
            <ol className="ops-telemetry-log" data-testid="ops-telemetry-log">
              {props.state.telemetry
                .slice(-5)
                .reverse()
                .map((envelope) => (
                  <li key={envelope.envelopeId}>
                    <strong>{envelope.eventName}</strong>
                    <span>
                      {String(
                        envelope.payload.stateSummary ??
                          envelope.payload.deltaGateState ??
                          envelope.eventCode,
                      )}
                    </span>
                  </li>
                ))}
            </ol>
            {focusRestoreBinding ? (
              <button
                type="button"
                className="ops-link"
                data-testid="ops-focus-restore-marker"
                data-surface="safe-return-focus-restore"
                data-entity-ref={snapshot.selectedAnomaly.anomalyId}
                {...buildAutomationAnchorElementAttributes(focusRestoreBinding, {
                  instanceKey: snapshot.selectedAnomaly.anomalyId,
                })}
              >
                {props.state.continuitySnapshot.focusRestoreTargetRef}
              </button>
            ) : null}
          </section>

          <section className="ops-panel" aria-label="Anomaly matrix">
            <header className="ops-panel__header">
              <div>
                <p className="ops-panel__eyebrow">Anomaly matrix</p>
                <h3>Intervention eligibility fences</h3>
              </div>
            </header>
            <table className="ops-table">
              <caption>Compact anomaly and intervention matrix</caption>
              <thead>
                <tr>
                  <th scope="col">Anomaly</th>
                  <th scope="col">Fence</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {opsAnomalyMatrixRows.map((row) => (
                  <tr
                    key={row.anomalyId}
                    data-selected={row.anomalyId === snapshot.selectedAnomaly.anomalyId}
                  >
                    <td>{row.anomalyId}</td>
                    <td>{titleCase(row.fenceState)}</td>
                    <td>{row.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function OperationsShellSeedApp() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [safeReturnFocusTarget, setSafeReturnFocusTarget] =
    useState<OpsSafeReturnFocusTarget | null>(null);
  const createStateFromWindow = () => {
    if (typeof window === "undefined") {
      return createInitialOpsShellState();
    }
    const parsed = new URL(window.location.href);
    return createInitialOpsShellState(parsed.pathname, {
      overviewState: normalizeOpsOverviewScenarioState(parsed.searchParams.get("state")),
      selectedHealthCellRef: parsed.searchParams.get("cell") ?? undefined,
    });
  };
  const [state, setState] = useState<OpsShellState>(() => createStateFromWindow());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const parsed = new URL(window.location.href);
    if (!parsed.pathname.startsWith("/ops/")) {
      window.history.replaceState({}, "", OPS_DEFAULT_PATH);
      setState(createInitialOpsShellState(OPS_DEFAULT_PATH));
    }

    const handlePopState = () => {
      startTransition(() => {
        const parsed = new URL(window.location.href);
        setState((current) => {
          const navigated = navigateOpsShell(current, parsed.pathname);
          return {
            ...navigated,
            overviewState: normalizeOpsOverviewScenarioState(parsed.searchParams.get("state")),
            selectedHealthCellRef:
              parsed.searchParams.get("cell") ?? navigated.selectedHealthCellRef,
          };
        });
      });
    };
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      Object.assign(window, {
        __opsShellState: {
          pathname: state.location.pathname,
          selectedAnomalyId: state.selectedAnomalyId,
          selectedHealthCellRef: state.selectedHealthCellRef,
          overviewState: state.overviewState,
          deltaGateState: state.deltaGateState,
          telemetryCount: state.telemetry.length,
        },
      });
    }
  }, [state]);

  useEffect(() => {
    if (
      safeReturnFocusTarget &&
      !state.location.childRouteKind &&
      state.location.pathname === safeReturnFocusTarget.pathname
    ) {
      focusOpsSafeReturnTarget(safeReturnFocusTarget);
      setSafeReturnFocusTarget(null);
    }
  }, [safeReturnFocusTarget, state.location.childRouteKind, state.location.pathname]);

  const updatePath = (nextPath: string, nextState: OpsShellState) => {
    if (typeof window !== "undefined" && window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setState(nextState);
  };

  return (
    <OperationsShellSeedDocument
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={(path) => {
        startTransition(() => {
          const nextState = navigateOpsShell(state, path);
          updatePath(path, nextState);
        });
      }}
      onSelectAnomaly={(anomalyId) => {
        startTransition(() => {
          setState((current) => selectOpsAnomaly(current, anomalyId));
        });
      }}
      onSelectHealthCell={(serviceRef) => {
        startTransition(() => {
          setState((current) => selectOpsHealthCell(current, serviceRef));
        });
      }}
      onSetDeltaGate={(deltaGateState) => {
        startTransition(() => {
          setState((current) => setOpsDeltaGateState(current, deltaGateState));
        });
      }}
      onReturn={() => {
        startTransition(() => {
          const nextState = returnFromOpsChildRoute(state);
          updatePath(nextState.location.pathname, nextState);
          setSafeReturnFocusTarget({
            pathname: nextState.location.pathname,
            selectedAnomalyId: nextState.selectedAnomalyId,
            selectedHealthCellRef: nextState.selectedHealthCellRef,
          });
        });
      }}
      onOpenGovernance={() => {
        startTransition(() => {
          setState((current) => openOpsGovernanceHandoff(current));
        });
      }}
      onCloseGovernance={() => {
        startTransition(() => {
          setState((current) => closeOpsGovernanceHandoff(current));
        });
      }}
    />
  );
}

export { OperationsShellSeedDocument };
