import React, { useEffect, useMemo, useState } from "react";
import {
  NHS_APP_ENVIRONMENT_TUPLES,
  NHS_APP_MANIFEST_VERSION,
  NHS_APP_READINESS_VISUAL_MODE,
  NHS_APP_ROUTE_INVENTORY,
  buildNhsAppReadinessUrl,
  defaultNhsAppReadinessState,
  filterNhsAppRouteInventory,
  getNhsAppEnvironmentTuple,
  getNhsAppRouteFamilies,
  nhsAppDegradationModes,
  nhsAppFreezeModes,
  nhsAppPreviewModes,
  nhsAppReadinessVerdicts,
  nhsAppRouteAudiences,
  parseNhsAppReadinessUrl,
  resolveNhsAppPreviewConstraints,
  selectNhsAppRoute,
  summarizeNhsAppReadiness,
  updateNhsAppReadinessState,
  type NhsAppEnvironmentTuple,
  type NhsAppFreezeMode,
  type NhsAppPreviewMode,
  type NhsAppReadinessStatePatch,
  type NhsAppReadinessFilters,
  type NhsAppReadinessUrlState,
  type NhsAppReadinessVerdict,
  type NhsAppRouteAudience,
  type NhsAppRouteInventoryRow,
} from "./nhs-app-readiness-cockpit.model";

function titleCase(value: string): string {
  return value
    .split(/[_:.-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function verdictLabel(verdict: NhsAppReadinessVerdict): string {
  switch (verdict) {
    case "ready":
      return "Ready";
    case "conditionally_ready":
      return "Conditional";
    case "placeholder_only":
      return "Placeholder";
    case "blocked":
      return "Blocked";
    case "evidence_missing":
      return "Evidence missing";
  }
}

function envLabel(tuple: NhsAppEnvironmentTuple): string {
  return tuple.label;
}

function initialState(): NhsAppReadinessUrlState {
  if (typeof window === "undefined") {
    return defaultNhsAppReadinessState;
  }
  return parseNhsAppReadinessUrl(window.location.pathname, window.location.search);
}

function routeTone(row: NhsAppRouteInventoryRow): string {
  switch (row.readinessVerdict) {
    case "ready":
      return "ready";
    case "conditionally_ready":
      return "warning";
    case "placeholder_only":
      return "frozen";
    case "blocked":
      return "blocked";
    case "evidence_missing":
      return "missing";
  }
}

function freezeLabel(value: string): string {
  return titleCase(value).replace("Read Only", "Read-only");
}

function filterStateValue<K extends keyof NhsAppReadinessFilters>(
  filters: NhsAppReadinessFilters,
  key: K,
): NhsAppReadinessFilters[K] {
  return filters[key];
}

function SelectControl(props: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly { value: string; label: string }[];
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="nhs-app-filter" htmlFor={props.id}>
      <span>{props.label}</span>
      <select
        id={props.id}
        value={props.value}
        onChange={(event) => props.onChange(event.currentTarget.value)}
      >
        {props.options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadinessMetric(props: { readonly label: string; readonly value: number; readonly tone: string }) {
  return (
    <div className="nhs-app-metric" data-tone={props.tone}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function NHSAppFilterRail(props: {
  readonly state: NhsAppReadinessUrlState;
  readonly routeFamilies: readonly string[];
  readonly onUpdateFilters: (filters: Partial<NhsAppReadinessFilters>) => void;
  readonly onOpenEvidence: () => void;
}) {
  const { filters } = props.state;
  const freezeOptions = [
    { value: "all", label: "All freeze states" },
    ...nhsAppFreezeModes.map((mode) => ({ value: mode, label: freezeLabel(mode) })),
    ...nhsAppDegradationModes.map((mode) => ({ value: mode, label: freezeLabel(mode) })),
  ];

  return (
    <aside
      className="nhs-app-rail"
      aria-label="NHS App readiness filters"
      data-testid="NHSAppReadinessFilterRail"
    >
      <div className="nhs-app-rail__heading">
        <span>Route filters</span>
        <button type="button" onClick={props.onOpenEvidence} data-testid="OpenEvidenceDrawerButton">
          Evidence
        </button>
      </div>
      <SelectControl
        id="nhs-app-env-filter"
        label="Environment"
        value={filterStateValue(filters, "environment")}
        options={NHS_APP_ENVIRONMENT_TUPLES.map((tuple) => ({
          value: tuple.environment,
          label: envLabel(tuple),
        }))}
        onChange={(value) =>
          props.onUpdateFilters({ environment: value as NhsAppReadinessFilters["environment"] })
        }
      />
      <SelectControl
        id="nhs-app-readiness-filter"
        label="Readiness"
        value={filterStateValue(filters, "readiness")}
        options={[
          { value: "all", label: "All readiness" },
          ...nhsAppReadinessVerdicts.map((verdict) => ({
            value: verdict,
            label: verdictLabel(verdict),
          })),
        ]}
        onChange={(value) =>
          props.onUpdateFilters({ readiness: value as NhsAppReadinessFilters["readiness"] })
        }
      />
      <SelectControl
        id="nhs-app-audience-filter"
        label="Audience"
        value={filterStateValue(filters, "audience")}
        options={[
          { value: "all", label: "All audiences" },
          ...nhsAppRouteAudiences.map((audience) => ({
            value: audience,
            label: titleCase(audience),
          })),
        ]}
        onChange={(value) =>
          props.onUpdateFilters({ audience: value as NhsAppReadinessFilters["audience"] })
        }
      />
      <SelectControl
        id="nhs-app-family-filter"
        label="Route family"
        value={filterStateValue(filters, "routeFamily")}
        options={[
          { value: "all", label: "All families" },
          ...props.routeFamilies.map((family) => ({ value: family, label: titleCase(family) })),
        ]}
        onChange={(value) =>
          props.onUpdateFilters({ routeFamily: value as NhsAppReadinessFilters["routeFamily"] })
        }
      />
      <SelectControl
        id="nhs-app-freeze-filter"
        label="Freeze or degradation"
        value={filterStateValue(filters, "freeze")}
        options={freezeOptions}
        onChange={(value) =>
          props.onUpdateFilters({ freeze: value as NhsAppReadinessFilters["freeze"] })
        }
      />
    </aside>
  );
}

export function NHSAppEnvironmentTupleRibbon(props: {
  readonly tuple: NhsAppEnvironmentTuple;
  readonly summary: {
    readonly visibleRoutes: number;
    readonly readyRoutes: number;
    readonly blockedRoutes: number;
    readonly evidenceMissingRoutes: number;
  };
}) {
  const { tuple } = props;
  return (
    <section
      className="nhs-app-ribbon"
      aria-label="Environment tuple"
      data-testid="NHSAppEnvironmentTupleRibbon"
      data-environment={tuple.environment}
      data-manifest-version={tuple.manifestVersionRef}
      data-release-freeze={tuple.releaseApprovalFreezeRef}
      data-current-environment-tuple={`${tuple.environment}:${tuple.cohortRef}`}
    >
      <div className="nhs-app-ribbon__tile">
        <span>Environment</span>
        <strong>{tuple.label}</strong>
        <small>{tuple.stageLabel}</small>
      </div>
      <div className="nhs-app-ribbon__tile">
        <span>Manifest</span>
        <strong>{tuple.manifestVersionRef}</strong>
        <small>{tuple.releaseApprovalFreezeRef}</small>
      </div>
      <div className="nhs-app-ribbon__tile">
        <span>Cohort</span>
        <strong>{titleCase(tuple.cohortState)}</strong>
        <small>{tuple.cohortRef}</small>
      </div>
      <div className="nhs-app-ribbon__tile">
        <span>Visible routes</span>
        <strong>{props.summary.visibleRoutes}</strong>
        <small>
          {props.summary.readyRoutes} ready / {props.summary.blockedRoutes} blocked /{" "}
          {props.summary.evidenceMissingRoutes} missing
        </small>
      </div>
    </section>
  );
}

export function NHSAppTopologyStrip(props: { readonly selectedRoute: NhsAppRouteInventoryRow }) {
  return (
    <section className="nhs-app-topology" aria-label="Route topology" data-testid="NHSAppTopologyStrip">
      <span>Topology</span>
      <ol>
        <li>NHS App placement</li>
        {props.selectedRoute.topologyLinks.map((link) => (
          <li key={link}>{link}</li>
        ))}
        <li>{props.selectedRoute.journeyPathId}</li>
      </ol>
    </section>
  );
}

export function NHSAppRouteFreezeBadgeGroup(props: { readonly route: NhsAppRouteInventoryRow }) {
  return (
    <div
      className="nhs-app-freeze"
      data-testid="NHSAppRouteFreezeBadgeGroup"
      data-freeze-mode={props.route.freezeMode}
      data-degradation-mode={props.route.degradationMode}
    >
      <span data-tone={props.route.freezeMode}>{freezeLabel(props.route.freezeMode)}</span>
      <span data-tone={props.route.degradationMode}>{freezeLabel(props.route.degradationMode)}</span>
      <span data-tone={props.route.liveFreezePosture}>{titleCase(props.route.liveFreezePosture)}</span>
    </div>
  );
}

export function NHSAppRouteInventoryTable(props: {
  readonly rows: readonly NhsAppRouteInventoryRow[];
  readonly selectedJourneyPathId: string;
  readonly environment: NhsAppReadinessFilters["environment"];
  readonly onSelectRoute: (journeyPathId: string) => void;
}) {
  return (
    <section
      className="nhs-app-table-panel"
      aria-label="NHS App route inventory"
      data-testid="NHSAppRouteInventoryTable"
    >
      <div className="nhs-app-table-panel__header">
        <h2>Route inventory</h2>
        <span>{props.rows.length} routes in current filter</span>
      </div>
      <div className="nhs-app-table-scroll" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th scope="col">Route</th>
              <th scope="col">Family</th>
              <th scope="col">Readiness</th>
              <th scope="col">Environment</th>
              <th scope="col">Evidence</th>
              <th scope="col">Freeze</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) => {
              const selected = row.journeyPathId === props.selectedJourneyPathId;
              return (
                <tr
                  key={row.journeyPathId}
                  data-selected={selected ? "true" : "false"}
                  data-readiness-verdict={row.readinessVerdict}
                  data-freeze-mode={row.freezeMode}
                >
                  <th scope="row">
                    <button
                      type="button"
                      onClick={() => props.onSelectRoute(row.journeyPathId)}
                      aria-current={selected ? "true" : undefined}
                      data-testid={`RouteRow-${row.journeyPathId}`}
                      data-route-id={row.journeyPathId}
                      data-readiness-verdict={row.readinessVerdict}
                      data-freeze-mode={row.freezeMode}
                    >
                      <span>{row.journeyPathId}</span>
                      <small>{row.routePattern}</small>
                    </button>
                  </th>
                  <td>{titleCase(row.routeFamilyRef)}</td>
                  <td>
                    <span className="nhs-app-status" data-tone={routeTone(row)}>
                      {verdictLabel(row.readinessVerdict)}
                    </span>
                  </td>
                  <td>{titleCase(row.environmentParity[props.environment])}</td>
                  <td>{titleCase(row.evidenceCompleteness)}</td>
                  <td>
                    <NHSAppRouteFreezeBadgeGroup route={row} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InspectorTabButton(props: {
  readonly value: "evidence" | "compatibility" | "continuity";
  readonly active: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.active}
      className="nhs-app-tab"
      onClick={props.onSelect}
      data-testid={`InspectorTab-${props.value}`}
    >
      {titleCase(props.value)}
    </button>
  );
}

export function NHSAppRouteInspector(props: {
  readonly route: NhsAppRouteInventoryRow;
  readonly tab: "evidence" | "compatibility" | "continuity";
  readonly onSelectTab: (tab: "evidence" | "compatibility" | "continuity") => void;
  readonly onOpenEvidence: () => void;
}) {
  const { route } = props;
  return (
    <section
      className="nhs-app-inspector"
      aria-label="Selected route inspector"
      data-testid="NHSAppRouteInspector"
      data-selected-route={route.journeyPathId}
      data-readiness-verdict={route.readinessVerdict}
      data-current-readiness-verdict={route.readinessVerdict}
    >
      <header>
        <span>Inspector</span>
        <h2>{titleCase(route.routeFamilyRef)}</h2>
        <p>{route.placeholderBehavior}</p>
      </header>
      <div role="tablist" aria-label="Route inspector sections" className="nhs-app-tabs">
        {(["evidence", "compatibility", "continuity"] as const).map((tab) => (
          <InspectorTabButton
            key={tab}
            value={tab}
            active={props.tab === tab}
            onSelect={() => props.onSelectTab(tab)}
          />
        ))}
      </div>
      {props.tab === "evidence" ? (
        <div role="tabpanel" className="nhs-app-inspector__body" data-testid="InspectorEvidencePanel">
          <dl>
            <div>
              <dt>Evidence completeness</dt>
              <dd>{titleCase(route.evidenceCompleteness)}</dd>
            </div>
            <div>
              <dt>Failure reasons</dt>
              <dd>{route.failureReasons.length ? route.failureReasons.join(", ") : "None"}</dd>
            </div>
          </dl>
          <button type="button" onClick={props.onOpenEvidence} data-testid="InspectorOpenEvidenceButton">
            Open evidence drawer
          </button>
        </div>
      ) : null}
      {props.tab === "compatibility" ? (
        <div role="tabpanel" className="nhs-app-inspector__body" data-testid="InspectorCompatibilityPanel">
          <dl>
            <div>
              <dt>Compatibility truth</dt>
              <dd>{titleCase(route.compatibilityTruth)}</dd>
            </div>
            <div>
              <dt>Bridge floor</dt>
              <dd>{route.bridgeCapabilityFloor}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>{route.bridgeActions.length ? route.bridgeActions.join(", ") : "No bridge actions"}</dd>
            </div>
          </dl>
        </div>
      ) : null}
      {props.tab === "continuity" ? (
        <div role="tabpanel" className="nhs-app-inspector__body" data-testid="InspectorContinuityPanel">
          <dl>
            <div>
              <dt>Continuity posture</dt>
              <dd>{titleCase(route.continuityPosture)}</dd>
            </div>
            <div>
              <dt>Safe route</dt>
              <dd>{route.safeRouteRef ?? "No safe route handoff"}</dd>
            </div>
            <div>
              <dt>Support recovery</dt>
              <dd>{route.supportRecoveryRef}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}

export function NHSAppPreviewCapabilityPanel(props: {
  readonly route: NhsAppRouteInventoryRow;
  readonly previewMode: NhsAppPreviewMode;
}) {
  const constraints = resolveNhsAppPreviewConstraints(props.route, props.previewMode);
  return (
    <section
      className="nhs-app-capability"
      aria-label="Embedded preview capability"
      data-testid="NHSAppPreviewCapabilityPanel"
      data-preview-mode={constraints.previewMode}
      data-bridge-available={constraints.bridgeAvailable ? "true" : "false"}
    >
      <h3>Capability floor</h3>
      <dl>
        <div>
          <dt>Supplier chrome</dt>
          <dd>{constraints.hiddenSupplierChrome ? "Hidden" : "Visible"}</dd>
        </div>
        <div>
          <dt>Safe area</dt>
          <dd>
            {constraints.safeAreaInsetTop}px / {constraints.safeAreaInsetBottom}px
          </dd>
        </div>
        <div>
          <dt>Bridge</dt>
          <dd>{constraints.bridgeAvailable ? "Available" : "Unavailable"}</dd>
        </div>
      </dl>
    </section>
  );
}

export function NHSAppEmbeddedPreviewPanel(props: {
  readonly route: NhsAppRouteInventoryRow;
  readonly previewMode: NhsAppPreviewMode;
  readonly onPreviewModeChange: (previewMode: NhsAppPreviewMode) => void;
}) {
  const constraints = resolveNhsAppPreviewConstraints(props.route, props.previewMode);
  return (
    <section
      className="nhs-app-preview"
      aria-label="Embedded NHS App preview"
      data-testid="NHSAppEmbeddedPreviewPanel"
      data-preview-mode={constraints.previewMode}
      data-freeze-mode={constraints.freezeMode}
      data-current-preview-mode={constraints.previewMode}
      data-hidden-supplier-chrome={constraints.hiddenSupplierChrome ? "true" : "false"}
    >
      <header>
        <div>
          <span>Embedded preview</span>
          <h2>{titleCase(props.route.routeFamilyRef)}</h2>
        </div>
        <select
          aria-label="Preview mode"
          value={props.previewMode}
          onChange={(event) => props.onPreviewModeChange(event.currentTarget.value as NhsAppPreviewMode)}
          data-testid="PreviewModeSelect"
        >
          {nhsAppPreviewModes.map((mode) => (
            <option value={mode} key={mode}>
              {titleCase(mode)}
            </option>
          ))}
        </select>
      </header>
      <div
        className="nhs-app-device"
        style={
          {
            "--nhs-app-device-width": `${constraints.deviceWidth}px`,
            "--nhs-app-device-height": `${constraints.deviceHeight}px`,
            "--nhs-app-safe-top": `${constraints.safeAreaInsetTop}px`,
            "--nhs-app-safe-bottom": `${constraints.safeAreaInsetBottom}px`,
          } as React.CSSProperties
        }
        data-preview-status={constraints.previewStatus}
      >
        <div className="nhs-app-device__chrome" aria-hidden="true">
          NHS App
        </div>
        <div className="nhs-app-device__safe">
          <span className="nhs-app-status" data-tone={routeTone(props.route)}>
            {verdictLabel(props.route.readinessVerdict)}
          </span>
          <h3>{props.route.routePattern}</h3>
          <p>{props.route.placeholderBehavior}</p>
          <div className="nhs-app-device__state">
            <span>{freezeLabel(props.route.freezeMode)}</span>
            <span>{freezeLabel(props.route.degradationMode)}</span>
            <span>{constraints.reducedMotion ? "Reduced motion" : "Standard motion"}</span>
          </div>
          {constraints.previewStatus === "redirect" ? (
            <p className="nhs-app-device__notice">Safe route: {props.route.safeRouteRef}</p>
          ) : null}
          {constraints.previewStatus === "blocked" ? (
            <p className="nhs-app-device__notice">Blocked by {props.route.failureReasons.join(", ")}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function NHSAppEvidenceDrawer(props: {
  readonly route: NhsAppRouteInventoryRow;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  return (
    <aside
      className="nhs-app-evidence"
      aria-label="Evidence drawer"
      aria-hidden={props.open ? "false" : "true"}
      data-testid="NHSAppEvidenceDrawer"
      data-drawer-state={props.open ? "open" : "closed"}
      data-current-evidence-drawer-state={props.open ? "open" : "closed"}
    >
      <header>
        <div>
          <span>Evidence drawer</span>
          <h2>{props.route.journeyPathId}</h2>
        </div>
        <button type="button" onClick={props.onClose} data-testid="CloseEvidenceDrawerButton">
          Close
        </button>
      </header>
      <div className="nhs-app-evidence__list">
        {props.route.evidenceRefs.map((ref) => (
          <div className="nhs-app-evidence__row" key={ref}>
            <span>{ref}</span>
            <small>{props.route.releaseTuple.releaseApprovalFreezeRef}</small>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function NHSAppReadinessCockpit() {
  const [state, setState] = useState<NhsAppReadinessUrlState>(() => initialState());

  useEffect(() => {
    const onPopState = () => {
      setState(parseNhsAppReadinessUrl(window.location.pathname, window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const routeFamilies = useMemo(() => getNhsAppRouteFamilies(), []);
  const visibleRows = useMemo(
    () => filterNhsAppRouteInventory(NHS_APP_ROUTE_INVENTORY, state.filters),
    [state.filters],
  );
  const selectedRoute = selectNhsAppRoute(NHS_APP_ROUTE_INVENTORY, state.selectedJourneyPathId);
  const environmentTuple = getNhsAppEnvironmentTuple(state.filters.environment);
  const summary = summarizeNhsAppReadiness(
    NHS_APP_ROUTE_INVENTORY,
    visibleRows,
    state.filters.environment,
  );

  const commit = (patch: NhsAppReadinessStatePatch) => {
    const next = updateNhsAppReadinessState(state, patch);
    setState(next);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", buildNhsAppReadinessUrl(next));
    }
  };

  return (
    <div
      className="nhs-app-cockpit"
      data-testid="NHSAppReadinessCockpit"
      data-visual-mode={NHS_APP_READINESS_VISUAL_MODE}
      data-selected-route={selectedRoute.journeyPathId}
      data-current-preview-mode={state.previewMode}
      data-current-environment-tuple={`${environmentTuple.environment}:${environmentTuple.cohortRef}`}
      data-current-readiness-verdict={selectedRoute.readinessVerdict}
      data-current-evidence-drawer-state={state.evidenceDrawerOpen ? "open" : "closed"}
    >
      <a className="nhs-app-skip" href="#nhs-app-main">
        Skip to route inventory
      </a>
      <header className="nhs-app-cockpit__masthead">
        <div>
          <span>Release control</span>
          <h1>NHS App readiness cockpit</h1>
          <p>{NHS_APP_MANIFEST_VERSION}</p>
        </div>
        <div className="nhs-app-cockpit__metrics" aria-label="Readiness summary">
          <ReadinessMetric label="Ready" value={summary.readyRoutes} tone="ready" />
          <ReadinessMetric label="Blocked" value={summary.blockedRoutes} tone="blocked" />
          <ReadinessMetric label="Missing" value={summary.evidenceMissingRoutes} tone="missing" />
        </div>
      </header>
      <div className="nhs-app-layout">
        <NHSAppFilterRail
          state={state}
          routeFamilies={routeFamilies}
          onUpdateFilters={(filters) => commit({ filters, routeView: "routes" })}
          onOpenEvidence={() => commit({ evidenceDrawerOpen: true })}
        />
        <main id="nhs-app-main" className="nhs-app-main" tabIndex={-1}>
          <NHSAppEnvironmentTupleRibbon tuple={environmentTuple} summary={summary} />
          <NHSAppTopologyStrip selectedRoute={selectedRoute} />
          <NHSAppRouteInventoryTable
            rows={visibleRows}
            selectedJourneyPathId={selectedRoute.journeyPathId}
            environment={state.filters.environment}
            onSelectRoute={(journeyPathId) =>
              commit({
                selectedJourneyPathId: journeyPathId,
                routeView: "route_detail",
                evidenceDrawerOpen: false,
              })
            }
          />
        </main>
        <aside className="nhs-app-side" aria-label="Route readiness detail">
          <NHSAppRouteInspector
            route={selectedRoute}
            tab={state.inspectorTab}
            onSelectTab={(inspectorTab) => commit({ inspectorTab })}
            onOpenEvidence={() => commit({ evidenceDrawerOpen: true })}
          />
          <NHSAppEmbeddedPreviewPanel
            route={selectedRoute}
            previewMode={state.previewMode}
            onPreviewModeChange={(previewMode) => commit({ previewMode, routeView: "preview" })}
          />
          <NHSAppPreviewCapabilityPanel route={selectedRoute} previewMode={state.previewMode} />
        </aside>
      </div>
      <NHSAppEvidenceDrawer
        route={selectedRoute}
        open={state.evidenceDrawerOpen}
        onClose={() => commit({ evidenceDrawerOpen: false })}
      />
    </div>
  );
}
