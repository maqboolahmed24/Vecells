import { useRef, useState, type ChangeEvent } from "react";
import {
  createContinuousImprovement489Projection,
  isContinuousImprovement489Path,
  normalizeContinuousImprovement489Role,
  normalizeContinuousImprovement489State,
  readContinuousImprovement489Filters,
  type ContinuousImprovement489DecisionRow,
  type ContinuousImprovement489Filters,
  type ContinuousImprovement489Projection,
} from "./continuous-improvement-489.model";

export { isContinuousImprovement489Path };

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function TopStrip({ projection }: { readonly projection: ContinuousImprovement489Projection }) {
  return (
    <section
      className="ci-489__strip"
      data-testid="ci-489-top-strip"
      aria-label="Programme transition status"
    >
      <div>
        <span>Programme state</span>
        <strong>{titleCase(projection.programmeFinalState)}</strong>
      </div>
      <div>
        <span>Evidence vault seal</span>
        <strong>{projection.evidenceVaultSeal.slice(0, 16)}</strong>
      </div>
      <div>
        <span>Active wave</span>
        <strong>{titleCase(projection.activeWaveStatus)}</strong>
      </div>
      <div>
        <span>Transfers</span>
        <strong>{projection.unresolvedTransferCount}</strong>
      </div>
      <div>
        <span>Next review</span>
        <strong>{projection.nextReviewAt.slice(0, 10)}</strong>
      </div>
    </section>
  );
}

function FilterBar({
  projection,
  filters,
  onChange,
}: {
  readonly projection: ContinuousImprovement489Projection;
  readonly filters: ContinuousImprovement489Filters;
  readonly onChange: (filters: ContinuousImprovement489Filters) => void;
}) {
  const decisions = [...new Set(projection.watchlistRows.map((row) => row.decision))].sort();
  const risks = [...new Set(projection.watchlistRows.map((row) => row.residualRisk))].sort();
  const owners = [...new Set(projection.watchlistRows.map((row) => row.owner))].sort();

  function updateFilter(key: keyof ContinuousImprovement489Filters) {
    return (event: ChangeEvent<HTMLSelectElement>) => onChange({ ...filters, [key]: event.target.value });
  }

  return (
    <section className="ci-489__filters" aria-label="Watchlist filters">
      <label>
        Decision
        <select data-testid="ci-489-filter-decision" value={filters.decision} onChange={updateFilter("decision")}>
          <option value="all">All decisions</option>
          {decisions.map((decision) => (
            <option key={decision} value={decision}>
              {titleCase(decision)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Risk
        <select data-testid="ci-489-filter-risk" value={filters.risk} onChange={updateFilter("risk")}>
          <option value="all">All risks</option>
          {risks.map((risk) => (
            <option key={risk} value={risk}>
              {titleCase(risk)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Owner
        <select data-testid="ci-489-filter-owner" value={filters.owner} onChange={updateFilter("owner")}>
          <option value="all">All owners</option>
          {owners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>
      </label>
      <label>
        Cadence
        <select data-testid="ci-489-filter-cadence" value={filters.cadence} onChange={updateFilter("cadence")}>
          <option value="all">All cadence states</option>
          <option value="has_review">Has review</option>
          <option value="no_review">No review</option>
        </select>
      </label>
    </section>
  );
}

function WatchlistTable({
  projection,
  onOpen,
}: {
  readonly projection: ContinuousImprovement489Projection;
  readonly onOpen: (row: ContinuousImprovement489DecisionRow, trigger: HTMLButtonElement) => void;
}) {
  return (
    <section
      className="ci-489__panel ci-489__watchlist"
      data-testid="ci-489-watchlist-table"
      aria-labelledby="ci-489-watchlist-title"
    >
      <header>
        <p className="governance-panel__eyebrow">Master watchlist</p>
        <h2 id="ci-489-watchlist-title">Closure decisions</h2>
      </header>
      <div className="ci-489__table-wrap">
        <table>
          <caption>Master dependency watchlist closure decisions and transfer ownership</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Decision</th>
              <th scope="col">Hash</th>
              <th scope="col">Risk</th>
              <th scope="col">Owner</th>
              <th scope="col">Review</th>
              <th scope="col">Lineage</th>
            </tr>
          </thead>
          <tbody>
            {projection.filteredRows.map((row) => (
              <tr key={row.rowId} data-risk={row.residualRisk} data-decision={row.decision}>
                <th scope="row">{row.title}</th>
                <td>{titleCase(row.decision)}</td>
                <td>
                  <code>{row.evidenceHash}</code>
                </td>
                <td>{titleCase(row.residualRisk)}</td>
                <td>{row.owner}</td>
                <td>{row.nextReviewDate}</td>
                <td>
                  <button
                    type="button"
                    data-testid={`ci-489-open-lineage-${row.itemCode}`}
                    onClick={(event) => onOpen(row, event.currentTarget)}
                  >
                    Source
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OutcomeTree({ projection }: { readonly projection: ContinuousImprovement489Projection }) {
  return (
    <section
      className="ci-489__panel ci-489__outcomes"
      data-testid="ci-489-outcome-tree"
      aria-labelledby="ci-489-outcome-title"
    >
      <header>
        <p className="governance-panel__eyebrow">Outcome tree</p>
        <h2 id="ci-489-outcome-title">Continuous improvement seed</h2>
      </header>
      <div className="ci-489__outcome-grid">
        {projection.outcomeGroups.map((group) => (
          <section key={group.area} className="ci-489__outcome-group" aria-label={`${group.area} outcomes`}>
            <h3>{titleCase(group.area)}</h3>
            <ol>
              {group.items.map((item) => (
                <li key={item.itemId}>
                  <strong>{item.title}</strong>
                  <span>{item.owner}</span>
                  <code>{item.metricRef}</code>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}

function CadenceRail({ projection }: { readonly projection: ContinuousImprovement489Projection }) {
  return (
    <aside className="ci-489__rail" data-testid="ci-489-cadence-calendar" aria-label="Cadence calendar">
      <section>
        <p className="governance-panel__eyebrow">Cadence calendar</p>
        <ol>
          {projection.cadenceRows.map((row) => (
            <li key={row.cadenceOwnerId}>
              <strong>{titleCase(row.domain)}</strong>
              <span>{row.owner}</span>
              <small>
                {titleCase(row.cadence)} / {row.nextReviewAt || "blocked"}
              </small>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <p className="governance-panel__eyebrow">Review triggers</p>
        <ol>
          {projection.reviewTriggers.slice(0, 5).map((trigger) => (
            <li key={trigger.reviewTriggerId}>
              <strong>{trigger.title}</strong>
              <span>{titleCase(trigger.state)}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <p className="governance-panel__eyebrow">Vault link</p>
        <a data-testid="ci-489-evidence-vault-link" href={projection.archiveHref}>
          {projection.archiveManifestRef}
        </a>
      </section>
    </aside>
  );
}

function TransferTable({ projection }: { readonly projection: ContinuousImprovement489Projection }) {
  return (
    <section className="ci-489__panel" data-testid="ci-489-transfer-register" aria-label="Transfer register">
      <header>
        <p className="governance-panel__eyebrow">Transfer register</p>
        <h2>Unresolved work ownership</h2>
      </header>
      <div className="ci-489__table-wrap">
        <table>
          <caption>Unresolved items transferred to BAU or continuous improvement</caption>
          <thead>
            <tr>
              <th scope="col">Target</th>
              <th scope="col">Owner</th>
              <th scope="col">Residual risk</th>
              <th scope="col">Metric</th>
            </tr>
          </thead>
          <tbody>
            {projection.transferRows.map((row) => (
              <tr key={row.transferId}>
                <th scope="row">{titleCase(row.target)}</th>
                <td>{row.owner}</td>
                <td>{titleCase(row.residualRisk)}</td>
                <td>
                  <code>{row.metricRef}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SourceLineageDrawer({
  row,
  onClose,
}: {
  readonly row: ContinuousImprovement489DecisionRow | null;
  readonly onClose: () => void;
}) {
  if (!row) return null;
  return (
    <section
      className="ci-489__drawer"
      data-testid="ci-489-source-lineage-drawer"
      aria-labelledby="ci-489-drawer-title"
    >
      <div>
        <p className="governance-panel__eyebrow">Source lineage</p>
        <h2 id="ci-489-drawer-title">{row.title}</h2>
      </div>
      <dl>
        <div>
          <dt>Evidence</dt>
          <dd>{row.sourceEvidenceRef}</dd>
        </div>
        <div>
          <dt>Decision authority</dt>
          <dd>{row.signoffAuthorityRef}</dd>
        </div>
        <div>
          <dt>Metric</dt>
          <dd>{row.metricRef}</dd>
        </div>
        <div>
          <dt>Next review</dt>
          <dd>{row.nextReviewDate}</dd>
        </div>
      </dl>
      {row.blockerRefs.length > 0 ? <p className="ci-489__blocker">{row.blockerRefs[0]}</p> : null}
      <button type="button" data-testid="ci-489-close-lineage-drawer" onClick={onClose}>
        Close
      </button>
    </section>
  );
}

export function ContinuousImprovement489Board() {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const boardState = normalizeContinuousImprovement489State(params.get("transitionState"));
  const role = normalizeContinuousImprovement489Role(params.get("transitionRole"));
  const [filters, setFilters] = useState<ContinuousImprovement489Filters>(() =>
    readContinuousImprovement489Filters(typeof window === "undefined" ? "" : window.location.search),
  );
  const [selectedRow, setSelectedRow] = useState<ContinuousImprovement489DecisionRow | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const projection = createContinuousImprovement489Projection(boardState, role, filters);

  function openLineage(row: ContinuousImprovement489DecisionRow, trigger: HTMLButtonElement): void {
    lastTriggerRef.current = trigger;
    setSelectedRow(row);
  }

  function closeLineage(): void {
    setSelectedRow(null);
    requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }

  return (
    <main
      className="ci-489 token-foundation"
      data-testid="continuous-improvement-489"
      data-board-state={projection.boardState}
      data-programme-final-state={projection.programmeFinalState}
      data-closure-state={projection.closureState}
      data-active-wave-status={projection.activeWaveStatus}
      data-closure-action-state={projection.closureActionState}
    >
      <div className="ci-489__shell">
        <header className="ci-489__masthead">
          <div>
            <p className="governance-panel__eyebrow">Continuous Improvement Transition Board</p>
            <h1>Programme closure with ongoing ownership</h1>
          </div>
          <a href={projection.archiveHref}>Evidence vault</a>
        </header>
        <TopStrip projection={projection} />
        <FilterBar projection={projection} filters={filters} onChange={setFilters} />
        <div className="ci-489__layout">
          <div className="ci-489__main">
            <WatchlistTable projection={projection} onOpen={openLineage} />
            <OutcomeTree projection={projection} />
            <TransferTable projection={projection} />
          </div>
          <CadenceRail projection={projection} />
        </div>
        <SourceLineageDrawer row={selectedRow} onClose={closeLineage} />
      </div>
    </main>
  );
}
