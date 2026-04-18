import { useEffect, useMemo, useState } from "react";
import {
  CLINICAL_BETA_VALIDATION_FEATURE_FLAG,
  CLINICAL_BETA_VALIDATION_VISUAL_MODE,
  WORKSPACE_SUPPORT_OBSERVABILITY_CHANGE_EVENT,
  buildClinicalValidationDeckModel,
  readWorkspaceSupportObservabilityStore,
  type ClinicalValidationDeckModel,
  type RuntimeValidationScenario,
  type ValidationActionFamily,
  type ValidationRouteFamilyRef,
} from "./workspace-support-observability";

type RouteFilter = ValidationRouteFamilyRef | "all";
type FamilyFilter = ValidationActionFamily | "all";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatMetricValue(value: number, unit: ClinicalValidationDeckModel["metricRows"][number]["unit"]) {
  if (unit === "percent") {
    return `${value}%`;
  }
  if (unit === "minutes") {
    return `${value}m`;
  }
  if (unit === "ratio") {
    return value.toFixed(2);
  }
  return String(value);
}

function Sparkline({ points }: { points: readonly number[] }) {
  const max = Math.max(...points, 1);
  return (
    <div className="validation-board__sparkline" aria-hidden="true">
      {points.map((point, index) => (
        <span
          key={`${point}:${index}`}
          className="validation-board__sparkline-bar"
          style={{ height: `${Math.max((point / max) * 100, 14)}%` }}
        />
      ))}
    </div>
  );
}

function MetricStatusChip({
  status,
}: {
  status: ClinicalValidationDeckModel["metricRows"][number]["status"];
}) {
  return (
    <span className="validation-board__status-chip" data-status={status}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function routeLabel(routeFamilyRef: ValidationRouteFamilyRef) {
  switch (routeFamilyRef) {
    case "rf_staff_workspace":
      return "Workspace shell";
    case "rf_staff_workspace_child":
      return "Workspace child routes";
    case "rf_support_ticket_workspace":
      return "Support routes";
  }
}

export function WorkspaceValidationRoute({
  runtimeScenario,
}: {
  runtimeScenario: RuntimeValidationScenario;
}) {
  const [snapshot, setSnapshot] = useState(readWorkspaceSupportObservabilityStore);
  const [searchValue, setSearchValue] = useState("");
  const [routeFilter, setRouteFilter] = useState<RouteFilter>("all");
  const [familyFilter, setFamilyFilter] = useState<FamilyFilter>("all");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleChange = () => setSnapshot(readWorkspaceSupportObservabilityStore());
    window.addEventListener(WORKSPACE_SUPPORT_OBSERVABILITY_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(WORKSPACE_SUPPORT_OBSERVABILITY_CHANGE_EVENT, handleChange);
  }, []);

  const model = useMemo(
    () => buildClinicalValidationDeckModel({ snapshot, runtimeScenario }),
    [runtimeScenario, snapshot],
  );

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredEventChains = model.eventChains.filter((row) => {
    if (routeFilter !== "all" && row.routeFamilyRef !== routeFilter) {
      return false;
    }
    if (familyFilter !== "all" && row.actionFamily !== familyFilter) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }
    return [
      row.chainId,
      row.routeFamilyRef,
      row.actionFamily,
      row.eventName,
      row.evidenceLinkPath,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const filteredDefects = model.defects.filter((defect) => {
    if (routeFilter !== "all" && defect.routeFamilyRef !== routeFilter) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }
    return [
      defect.defectId,
      defect.title,
      defect.className,
      defect.summary,
      defect.routeFamilyRef,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const filteredSupportEvents = filteredEventChains.filter(
    (row) => row.routeFamilyRef === "rf_support_ticket_workspace",
  );
  const blockedFences =
    snapshot.disclosureFences.filter((fence) => fence.fenceState !== "enforced").length;

  return (
    <section
      className="validation-board"
      data-testid="ClinicalBetaValidationBoard"
      data-visual-mode={CLINICAL_BETA_VALIDATION_VISUAL_MODE}
      data-feature-flag={CLINICAL_BETA_VALIDATION_FEATURE_FLAG}
      data-runtime-scenario={runtimeScenario}
    >
      <header className="validation-board__north-star" data-testid="ValidationNorthStarBand" id="validation-north-star-band">
        <div>
          <p className="staff-shell__eyebrow">Clinical beta validation</p>
          <h2>One governed view of route law, settlement truth, and redaction posture</h2>
          <p>
            The board keeps local acknowledgement, authoritative settlement, recovery posture, and
            disclosure fencing separate so release decisions stay auditable.
          </p>
        </div>
        <div className="validation-board__north-star-grid">
          <article>
            <span>Total events</span>
            <strong>{model.totalEvents}</strong>
            <small>{snapshot.releaseTupleRef}</small>
          </article>
          <article>
            <span>Settlement join rate</span>
            <strong>{model.settlementJoinRate}%</strong>
            <small>Expected 100% for calm release</small>
          </article>
          <article>
            <span>Redaction pass rate</span>
            <strong>{model.redactionPassRate}%</strong>
            <small>{blockedFences === 0 ? "No blocked fences observed" : `${blockedFences} fences require repair`}</small>
          </article>
          <article>
            <span>Support integrity joins</span>
            <strong>{model.supportIntegrityCount}</strong>
            <small>Replay, history, knowledge, and repair families</small>
          </article>
        </div>
      </header>

      <div className="validation-board__layout">
        <aside className="validation-board__filters" aria-label="Validation filters">
          <div className="validation-board__panel">
            <p className="staff-shell__eyebrow">Scenario and search</p>
            <label className="validation-board__field">
              <span>Search event family, route family, defect, or release tuple</span>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.currentTarget.value)}
                placeholder="search events, defects, release tuple"
              />
            </label>
            <label className="validation-board__field">
              <span>Route family</span>
              <select
                data-testid="ValidationRouteFamilySelect"
                value={routeFilter}
                onChange={(event) => setRouteFilter(event.currentTarget.value as RouteFilter)}
              >
                <option value="all">All route families</option>
                <option value="rf_staff_workspace">Workspace shell</option>
                <option value="rf_staff_workspace_child">Workspace child routes</option>
                <option value="rf_support_ticket_workspace">Support routes</option>
              </select>
            </label>
            <label className="validation-board__field">
              <span>Action family</span>
              <select
                data-testid="ValidationActionFamilySelect"
                value={familyFilter}
                onChange={(event) => setFamilyFilter(event.currentTarget.value as FamilyFilter)}
              >
                <option value="all">All action families</option>
                {model.actionFamilyCounts.map((family) => (
                  <option key={family.actionFamily} value={family.actionFamily}>
                    {family.actionFamily.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="validation-board__panel">
            <p className="staff-shell__eyebrow">Route-family counts</p>
            <ul className="validation-board__count-list">
              {model.routeFamilyCounts.map((row) => (
                <li key={row.routeFamilyRef}>
                  <span>{routeLabel(row.routeFamilyRef)}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="validation-board__center">
          <section className="validation-board__panel" data-testid="MetricGuardrailMatrix">
            <div className="validation-board__section-head">
              <div>
                <p className="staff-shell__eyebrow">Metric guardrail matrix</p>
                <h3>Only release-relevant metrics survive</h3>
              </div>
              <small>{model.metricRows.length} governed metrics</small>
            </div>
            <div className="validation-board__metric-grid">
              {model.metricRows.map((row) => (
                <article key={row.metricId} className="validation-board__metric-card" data-status={row.status}>
                  <div className="validation-board__metric-head">
                    <div>
                      <strong>{row.label}</strong>
                      <p>{row.operatorUse}</p>
                    </div>
                    <MetricStatusChip status={row.status} />
                  </div>
                  <div className="validation-board__metric-value-row">
                    <span className="validation-board__metric-value">
                      {formatMetricValue(row.currentValue, row.unit)}
                    </span>
                    <small>{row.guardrail}</small>
                  </div>
                  <Sparkline points={row.sparkline} />
                </article>
              ))}
            </div>
          </section>

          <section className="validation-board__panel" data-testid="EventChainInspector">
            <div className="validation-board__section-head">
              <div>
                <p className="staff-shell__eyebrow">Event chain inspector</p>
                <h3>Browser acknowledgement stays separate from authoritative truth</h3>
              </div>
              <small>{filteredEventChains.length} visible chains</small>
            </div>
            <div className="validation-board__chain-list">
              {filteredEventChains.map((row) => (
                <article key={`${row.chainId}:${row.eventName}:${row.occurredAt}`} className="validation-board__chain-row">
                  <div>
                    <strong>{row.eventName}</strong>
                    <p>
                      {routeLabel(row.routeFamilyRef)} / {row.actionFamily.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="validation-board__chain-state">
                    <span>{row.eventState}</span>
                    <span>{row.settlementState}</span>
                    <span>{row.redactionPosture}</span>
                  </div>
                  <small>{row.anchorHash}</small>
                </article>
              ))}
              {filteredEventChains.length === 0 ? (
                <p className="validation-board__empty">No event chains match the current filter.</p>
              ) : null}
            </div>
          </section>

          <section className="validation-board__panel" data-testid="RedactionFenceVerifier">
            <div className="validation-board__section-head">
              <div>
                <p className="staff-shell__eyebrow">Redaction fence verifier</p>
                <h3>Selectors, route scopes, and identifiers remain hashed or masked</h3>
              </div>
              <small>{snapshot.disclosureFences.length} fences inspected</small>
            </div>
            <div className="validation-board__redaction-grid">
              <article>
                <span>Enforced fences</span>
                <strong>{snapshot.disclosureFences.filter((item) => item.fenceState === "enforced").length}</strong>
              </article>
              <article>
                <span>Masked fields</span>
                <strong>
                  {snapshot.disclosureFences.reduce((sum, item) => sum + item.maskedFieldCount, 0)}
                </strong>
              </article>
              <article>
                <span>Blocked fields</span>
                <strong>
                  {snapshot.disclosureFences.reduce((sum, item) => sum + item.blockedFieldCount, 0)}
                </strong>
              </article>
              <article>
                <span>Safe route scope hashes</span>
                <strong>{new Set(snapshot.disclosureFences.map((item) => item.safeRouteScopeHash)).size}</strong>
              </article>
            </div>
          </section>
        </div>

        <aside className="validation-board__integrity">
          <section className="validation-board__panel" data-testid="RouteContractDriftPanel">
            <div className="validation-board__section-head">
              <div>
                <p className="staff-shell__eyebrow">Route contract drift</p>
                <h3>Automation anchors, semantics, and event names stay locked</h3>
              </div>
              <strong>{model.routeDriftCount}</strong>
            </div>
            <ul className="validation-board__compact-list">
              {filteredDefects
                .filter((item) => item.className === "stale_route_contract_mismatch")
                .slice(0, 5)
                .map((item) => (
                  <li key={item.defectId}>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </li>
                ))}
              {filteredDefects.filter((item) => item.className === "stale_route_contract_mismatch").length === 0 ? (
                <li>
                  <strong>No route drift under the current filter</strong>
                  <p>The published contract and the emitted route-family events still agree.</p>
                </li>
              ) : null}
            </ul>
          </section>

          <section className="validation-board__panel" data-testid="SupportFlowIntegrityBoard">
            <div className="validation-board__section-head">
              <div>
                <p className="staff-shell__eyebrow">Support flow integrity</p>
                <h3>Replay, restore, history, knowledge, and repair stay on one spine</h3>
              </div>
              <strong>{filteredSupportEvents.length}</strong>
            </div>
            <ul className="validation-board__compact-list">
              {filteredSupportEvents.slice(0, 6).map((row) => (
                <li key={`${row.chainId}:${row.eventName}`}>
                  <strong>{row.actionFamily.replaceAll("_", " ")}</strong>
                  <p>
                    {row.settlementState} / {row.redactionPosture}
                  </p>
                </li>
              ))}
              {filteredSupportEvents.length === 0 ? (
                <li>
                  <strong>No support integrity events</strong>
                  <p>Replay and repair events will appear here once the support routes emit.</p>
                </li>
              ) : null}
            </ul>
          </section>

          <section className="validation-board__panel" data-testid="DefectAndRemediationLedger">
            <div className="validation-board__section-head">
              <div>
                <p className="staff-shell__eyebrow">Defect and remediation ledger</p>
                <h3>Missing joins, duplicates, order failures, and fence breaches stay visible</h3>
              </div>
              <strong>{filteredDefects.length}</strong>
            </div>
            <div className="validation-board__defect-list">
              {filteredDefects.map((item) => (
                <article key={item.defectId} className="validation-board__defect-row" data-severity={item.severity}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </div>
                  <small>{item.remediation}</small>
                </article>
              ))}
              {filteredDefects.length === 0 ? (
                <p className="validation-board__empty">No defects match the current filter.</p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      <footer className="validation-board__evidence-strip">
        {model.evidenceLinks.map((link) => (
          <a key={link.evidenceId} href={link.path} className="validation-board__evidence-link">
            <strong>{link.label}</strong>
            <span>{link.failureClass.replaceAll("_", " ")}</span>
          </a>
        ))}
      </footer>
    </section>
  );
}
