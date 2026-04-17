import React, { startTransition, useEffect, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  resolveAutomationAnchorProfile,
} from "@vecells/persistent-shell";
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
  setOpsDeltaGateState,
  type OpsAnomaly,
  type OpsBoardFrameMode,
  type OpsBoardStateSnapshot,
  type OpsDeltaGateState,
  type OpsLens,
  type OpsShellState,
} from "./operations-shell-seed.model";

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

function VisualizationPanel(props: {
  title: string;
  summary: string;
  trustLabel: string;
  freshnessLabel: string;
  visualizationMode: OpsBoardStateSnapshot["visualizationMode"];
  dataTestId: string;
  visual: React.ReactNode;
  table: React.ReactNode;
}) {
  return (
    <section
      className="ops-panel"
      data-testid={props.dataTestId}
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

function ChildRoutePanel(props: {
  snapshot: OpsBoardStateSnapshot;
  onReturn: () => void;
  onOpenGovernance: () => void;
}) {
  const { routeIntent, selectedAnomaly, location, returnToken } = props.snapshot;
  if (!routeIntent || !location.childRouteKind) {
    return null;
  }

  if (location.childRouteKind === "compare") {
    return (
      <section className="ops-child ops-child--compare" data-testid="ops-compare-route" aria-label="Compare view">
        <header className="ops-child__header">
          <div>
            <p className="ops-panel__eyebrow">Compare posture</p>
            <h2>{selectedAnomaly.title}</h2>
          </div>
          <button type="button" className="ops-link" onClick={props.onReturn} data-testid="ops-return-button">
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
            <p>{selectedAnomaly.compareSummary}</p>
          </article>
          <article className="ops-compare-card ops-compare-card--sidecar">
            <h3>Guardrail</h3>
            <p>{selectedAnomaly.blockerSummary}</p>
            <button type="button" className="ops-button ops-button--ghost" onClick={props.onOpenGovernance}>
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
          <button type="button" className="ops-link" onClick={props.onReturn} data-testid="ops-return-button">
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
      <section className="ops-child" data-testid="ops-intervention-route" aria-label="Intervention route">
        <header className="ops-child__header">
          <div>
            <p className="ops-panel__eyebrow">Intervention route</p>
            <h2>{selectedAnomaly.recommendedAction}</h2>
          </div>
          <button type="button" className="ops-link" onClick={props.onReturn} data-testid="ops-return-button">
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
          <button type="button" className="ops-button ops-button--ghost" onClick={props.onOpenGovernance}>
            {selectedAnomaly.governanceHandoffLabel}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="ops-child" data-testid="ops-investigation-route" aria-label="Investigation route">
      <header className="ops-child__header">
        <div>
          <p className="ops-panel__eyebrow">Investigation drawer</p>
          <h2>{routeIntent.title}</h2>
        </div>
        <button type="button" className="ops-link" onClick={props.onReturn} data-testid="ops-return-button">
          Return via {returnToken?.returnTokenId ?? "OpsReturnToken"}
        </button>
      </header>
      <div className="ops-investigation-card">
        <dl className="ops-keyfacts">
          <div>
            <dt>Question</dt>
            <dd>{routeIntent.question}</dd>
          </div>
          <div>
            <dt>Evidence basis</dt>
            <dd>{routeIntent.evidenceBasis}</dd>
          </div>
          <div>
            <dt>Time horizon</dt>
            <dd>{selectedAnomaly.timeHorizon}</dd>
          </div>
        </dl>
        <p className="ops-investigation-card__summary">{selectedAnomaly.compareSummary}</p>
      </div>
    </section>
  );
}

function OperationsShellSeedDocument(props: {
  state: OpsShellState;
  viewportWidth: number;
  onNavigate: (path: string) => void;
  onSelectAnomaly: (anomalyId: string) => void;
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

  return (
    <div
      className={frameClass(snapshot.frameMode)}
      data-testid="ops-shell-root"
      data-layout-mode={snapshot.frameMode}
      data-delta-gate={snapshot.deltaGate.gateState}
      data-workbench-state={snapshot.workbenchState}
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

      <section className="ops-status-strip" aria-label="Operations status strip">
        <div className="ops-status-strip__tone" data-tone={deltaGateTone(snapshot.deltaGate.gateState)}>
          <strong>{titleCase(snapshot.deltaGate.gateState)}</strong>
          <span>{snapshot.deltaGate.summary}</span>
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

      <div className="ops-shell__frame">
        <main className="ops-shell__main" role="main">
          <section className="ops-panel ops-panel--north-star" aria-label="North star band">
            <header className="ops-panel__header">
              <div>
                <p className="ops-panel__eyebrow">NorthStarBand</p>
                <h2>Current control question</h2>
              </div>
              <span className="ops-panel__headline">{snapshot.summarySentence}</span>
            </header>
            <div className="ops-north-star-grid">
              {snapshot.northStarBand.map((metric) => (
                <article key={metric.metricId} className="ops-north-star-card">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.changeLabel}</p>
                  <small>{metric.interpretation}</small>
                </article>
              ))}
            </div>
          </section>

          <VisualizationPanel
            title="BottleneckRadar"
            summary={snapshot.selectedAnomaly.summary}
            trustLabel={snapshot.selectedAnomaly.trustSummary}
            freshnessLabel={`Lease ${snapshot.selectionLease.leaseState}`}
            visualizationMode={snapshot.visualizationMode}
            dataTestId="ops-bottleneck-radar"
            visual={
              <div className="ops-radar">
                {snapshot.anomalyRanking.slice(0, 5).map((anomaly) => (
                  <button
                    key={anomaly.anomalyId}
                    type="button"
                    className="ops-radar__node"
                    data-testid={`ops-anomaly-${anomaly.anomalyId}`}
                    data-selected={snapshot.selectedAnomaly.anomalyId === anomaly.anomalyId}
                    data-tone={severityTone(anomaly.severity)}
                    onClick={() => props.onSelectAnomaly(anomaly.anomalyId)}
                    {...(selectedAnchorBinding
                      ? buildAutomationAnchorElementAttributes(selectedAnchorBinding, {
                          instanceKey: anomaly.anomalyId,
                        })
                      : {})}
                  >
                    <strong>{anomaly.title}</strong>
                    <span>{anomaly.summary}</span>
                  </button>
                ))}
              </div>
            }
            table={
              <table className="ops-table">
                <caption>Promoted anomaly ranking fallback</caption>
                <thead>
                  <tr>
                    <th scope="col">Anomaly</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Fence</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.anomalyRanking.slice(0, 5).map((anomaly) => (
                    <tr key={anomaly.anomalyId} data-selected={snapshot.selectedAnomaly.anomalyId === anomaly.anomalyId}>
                      <td>{anomaly.title}</td>
                      <td>{titleCase(anomaly.severity)}</td>
                      <td>{titleCase(anomaly.eligibilityFenceState)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />

          <div className="ops-shell__secondary-grid">
            <VisualizationPanel
              title="CapacityAllocator"
              summary="Only one summary surface expands beyond compact posture at once; capacity remains compact unless explicitly promoted."
              trustLabel={snapshot.selectedAnomaly.confidenceLabel}
              freshnessLabel={`Horizon ${snapshot.selectedAnomaly.timeHorizon}`}
              visualizationMode={snapshot.visualizationMode}
              dataTestId="ops-capacity-allocator"
              visual={
                <div className="ops-meter">
                  <div className="ops-meter__fill" style={{ width: `${snapshot.selectedAnomaly.capacityGap * 4}%` }} />
                  <span>{snapshot.selectedAnomaly.capacityGap} staff-hours of relief needed</span>
                </div>
              }
              table={
                <table className="ops-table">
                  <caption>Capacity allocator fallback</caption>
                  <tbody>
                    <tr>
                      <th scope="row">Required relief</th>
                      <td>{snapshot.selectedAnomaly.capacityGap} staff-hours</td>
                    </tr>
                    <tr>
                      <th scope="row">Owner</th>
                      <td>{snapshot.selectedAnomaly.ownerLabel}</td>
                    </tr>
                    <tr>
                      <th scope="row">Constraint</th>
                      <td>{snapshot.selectedAnomaly.blockerSummary}</td>
                    </tr>
                  </tbody>
                </table>
              }
            />

            <VisualizationPanel
              title="ServiceHealthGrid"
              summary={snapshot.selectedAnomaly.healthSummary}
              trustLabel={`Trust ${snapshot.deltaGate.trustState}`}
              freshnessLabel={`Freshness ${snapshot.deltaGate.freshnessState}`}
              visualizationMode={snapshot.visualizationMode}
              dataTestId="ops-service-health-grid"
              visual={
                <div className="ops-health-grid">
                  {snapshot.serviceHealth.map((row) => (
                    <article
                      key={row.serviceRef}
                      className="ops-health-grid__cell"
                      data-health-state={row.state}
                      data-health-overlay-state={row.trustState}
                    >
                      <strong>{row.serviceLabel}</strong>
                      <span>{titleCase(row.state)}</span>
                      <small>{row.summary}</small>
                    </article>
                  ))}
                </div>
              }
              table={
                <table className="ops-table">
                  <caption>Service health fallback</caption>
                  <thead>
                    <tr>
                      <th scope="col">Service</th>
                      <th scope="col">State</th>
                      <th scope="col">Trust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.serviceHealth.map((row) => (
                      <tr key={row.serviceRef}>
                        <td>{row.serviceLabel}</td>
                        <td>{titleCase(row.state)}</td>
                        <td>{titleCase(row.trustState)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            />

            <VisualizationPanel
              title="CohortImpactMatrix"
              summary={`Current focus: ${snapshot.selectedAnomaly.cohortFocus}`}
              trustLabel="Grayscale safe"
              freshnessLabel="Table fallback present"
              visualizationMode={snapshot.visualizationMode}
              dataTestId="ops-cohort-impact-matrix"
              visual={
                <div className="ops-cohort-grid">
                  {snapshot.cohortImpact.map((row) => (
                    <article key={row.cohortRef} className="ops-cohort-grid__cell" data-direction={row.direction}>
                      <strong>{row.cohortLabel}</strong>
                      <span>{row.variance}</span>
                      <small>{row.summary}</small>
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
                      <th scope="col">Variance</th>
                      <th scope="col">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.cohortImpact.map((row) => (
                      <tr key={row.cohortRef}>
                        <td>{row.cohortLabel}</td>
                        <td>{row.variance}</td>
                        <td>{row.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            />
          </div>

          {snapshot.location.childRouteKind ? (
            <ChildRoutePanel snapshot={snapshot} onReturn={props.onReturn} onOpenGovernance={props.onOpenGovernance} />
          ) : null}

          {snapshot.governanceHandoff ? (
            <section className="ops-governance-stub" data-testid="ops-governance-handoff" aria-label="Governance handoff">
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
            data-workbench-tone={workbenchTone(snapshot)}
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
              <span className="ops-workbench__state">{titleCase(snapshot.workbenchState)}</span>
            </header>
            <p className="ops-workbench__summary">{snapshot.selectedAnomaly.recommendedAction}</p>
            <ul className="ops-inline-list">
              <li>{snapshot.selectedAnomaly.confidenceLabel}</li>
              <li>{snapshot.selectionLease.leaseState}</li>
              <li>{snapshot.deltaGate.trustState}</li>
            </ul>
            <dl className="ops-keyfacts">
              <div>
                <dt>Blockers</dt>
                <dd>{snapshot.selectedAnomaly.blockerSummary}</dd>
              </div>
              <div>
                <dt>Preconditions</dt>
                <dd>{snapshot.selectedAnomaly.evidenceBasis}</dd>
              </div>
              <div>
                <dt>Fence state</dt>
                <dd>{titleCase(snapshot.selectedAnomaly.eligibilityFenceState)}</dd>
              </div>
            </dl>
            <div className="ops-workbench__actions">
              {(["investigations", "interventions", "compare", "health"] as const).map((childRouteKind) => (
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
              ))}
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
              {props.state.telemetry.slice(-5).reverse().map((envelope) => (
                <li key={envelope.envelopeId}>
                  <strong>{envelope.eventName}</strong>
                  <span>{String(envelope.payload.stateSummary ?? envelope.payload.deltaGateState ?? envelope.eventCode)}</span>
                </li>
              ))}
            </ol>
            {focusRestoreBinding ? (
              <button
                type="button"
                className="ops-link"
                data-testid="ops-focus-restore-marker"
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
                  <tr key={row.anomalyId} data-selected={row.anomalyId === snapshot.selectedAnomaly.anomalyId}>
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
  const [state, setState] = useState<OpsShellState>(() =>
    typeof window === "undefined"
      ? createInitialOpsShellState()
      : createInitialOpsShellState(window.location.pathname),
  );

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
        setState((current) => navigateOpsShell(current, window.location.pathname));
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
          deltaGateState: state.deltaGateState,
          telemetryCount: state.telemetry.length,
        },
      });
    }
  }, [state]);

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
      onSetDeltaGate={(deltaGateState) => {
        startTransition(() => {
          setState((current) => setOpsDeltaGateState(current, deltaGateState));
        });
      }}
      onReturn={() => {
        startTransition(() => {
          const nextState = returnFromOpsChildRoute(state);
          updatePath(nextState.location.pathname, nextState);
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
