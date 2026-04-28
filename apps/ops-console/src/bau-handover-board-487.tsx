import { useRef, useState } from "react";
import {
  BAU_HANDOVER_487_ACCEPTANCE_COUNT,
  createBAUHandover487Projection,
  isBAUHandover487Path,
  type BAUHandover487DomainCard,
  type BAUHandover487Projection,
} from "./bau-handover-board-487.model";

export { isBAUHandover487Path };

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusStrip({ projection }: { readonly projection: BAUHandover487Projection }) {
  return (
    <section className="bau-487__strip" data-testid="bau-487-status-strip" aria-label="BAU handover status">
      <div>
        <span>Handover verdict</span>
        <strong>{titleCase(projection.verdict)}</strong>
      </div>
      <div>
        <span>Release and wave</span>
        <strong>{projection.releaseState}</strong>
      </div>
      <div>
        <span>Rota coverage</span>
        <strong>{titleCase(projection.rotaCoverageState)}</strong>
      </div>
      <div>
        <span>Open blockers</span>
        <strong>{projection.blockerCount}</strong>
      </div>
      <div>
        <span>Next review</span>
        <strong>{projection.nextReviewAt.slice(0, 10)}</strong>
      </div>
    </section>
  );
}

function DomainCard({
  domain,
  onOpen,
}: {
  readonly domain: BAUHandover487DomainCard;
  readonly onOpen: (domain: BAUHandover487DomainCard, trigger: HTMLButtonElement) => void;
}) {
  return (
    <button
      className="bau-487__domain"
      type="button"
      data-testid={`bau-487-domain-card-${domain.domainId}`}
      data-coverage-state={domain.rotaCoverage}
      data-training-state={domain.trainingEvidence}
      onClick={(event) => onOpen(domain, event.currentTarget)}
    >
      <span className="bau-487__domain-title">{domain.title}</span>
      <span className="bau-487__domain-team">
        <span>
          Owner <strong>{domain.owner}</strong>
        </span>
        <span>
          Deputy <strong>{domain.deputy}</strong>
        </span>
      </span>
      <span className="bau-487__chips" aria-label={`${domain.title} coverage`}>
        <em data-state={domain.rotaCoverage}>OOH {titleCase(domain.rotaCoverage)}</em>
        <em data-state={domain.bankHolidayCoverage}>Bank {titleCase(domain.bankHolidayCoverage)}</em>
        <em data-state={domain.trainingEvidence}>Training {titleCase(domain.trainingEvidence)}</em>
      </span>
      {domain.blockerRefs.length > 0 ? (
        <span className="bau-487__blocker">{domain.blockerRefs[0]}</span>
      ) : null}
    </button>
  );
}

function ResponsibilityLanes({
  projection,
  onOpen,
}: {
  readonly projection: BAUHandover487Projection;
  readonly onOpen: (domain: BAUHandover487DomainCard, trigger: HTMLButtonElement) => void;
}) {
  return (
    <section
      className="bau-487__lanes"
      data-testid="bau-487-responsibility-lanes"
      aria-labelledby="bau-487-lanes-title"
    >
      <header>
        <p className="ops-panel__eyebrow">Responsibility map</p>
        <h2 id="bau-487-lanes-title">BAU ownership lanes</h2>
      </header>
      <div className="bau-487__lane-grid">
        {projection.lanes.map((lane) => (
          <section className="bau-487__lane" key={lane.lane} aria-label={`${lane.lane} lane`}>
            <h3>{lane.lane}</h3>
            <div className="bau-487__domain-list">
              {lane.domains.map((domain) => (
                <DomainCard domain={domain} key={domain.domainId} onOpen={onOpen} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function RotaTable({ projection }: { readonly projection: BAUHandover487Projection }) {
  return (
    <section className="bau-487__panel" aria-labelledby="bau-487-rota-title">
      <header>
        <p className="ops-panel__eyebrow">Rota coverage</p>
        <h2 id="bau-487-rota-title">Launch-critical and BAU windows</h2>
      </header>
      <div className="bau-487__table-wrap">
        <table data-testid="bau-487-rota-table">
          <caption>Support rota matrix with owner, deputy, out-of-hours and bank-holiday coverage</caption>
          <thead>
            <tr>
              <th scope="col">Domain</th>
              <th scope="col">Owner</th>
              <th scope="col">Deputy</th>
              <th scope="col">Out of hours</th>
              <th scope="col">Bank holiday</th>
              <th scope="col">Runbook</th>
              <th scope="col">Training</th>
            </tr>
          </thead>
          <tbody>
            {projection.rotaRows.map((row) => (
              <tr key={row.domainId}>
                <th scope="row">{row.title}</th>
                <td>{row.owner}</td>
                <td>{row.deputy}</td>
                <td>{titleCase(row.rotaCoverage)}</td>
                <td>{titleCase(row.bankHolidayCoverage)}</td>
                <td>{row.runbookRef}</td>
                <td>{titleCase(row.trainingEvidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OpenActions({ projection }: { readonly projection: BAUHandover487Projection }) {
  return (
    <section
      className="bau-487__panel"
      data-testid="bau-487-open-actions"
      aria-labelledby="bau-487-actions-title"
    >
      <header>
        <p className="ops-panel__eyebrow">Open action governance</p>
        <h2 id="bau-487-actions-title">Blocking and BAU follow-up classification</h2>
      </header>
      <div className="bau-487__table-wrap">
        <table>
          <caption>Open BAU handover actions</caption>
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Owner</th>
              <th scope="col">Due</th>
              <th scope="col">Severity</th>
              <th scope="col">Class</th>
              <th scope="col">Release blocking</th>
            </tr>
          </thead>
          <tbody>
            {projection.openActions.map((action) => (
              <tr key={action.openActionId} data-release-blocking={action.releaseBlocking}>
                <th scope="row">{action.title}</th>
                <td>{action.owner}</td>
                <td>{action.dueDate}</td>
                <td>{titleCase(action.severity)}</td>
                <td>{titleCase(action.actionClass)}</td>
                <td>{action.releaseBlocking ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RightRail({ projection }: { readonly projection: BAUHandover487Projection }) {
  return (
    <aside className="bau-487__rail" data-testid="bau-487-right-rail" aria-label="Current BAU support rota">
      <section>
        <p className="ops-panel__eyebrow">Current on-call</p>
        <strong>{projection.rightRail.currentOnCall}</strong>
      </section>
      <section>
        <p className="ops-panel__eyebrow">Incident commander</p>
        <strong>{projection.rightRail.incidentCommander}</strong>
      </section>
      <section>
        <p className="ops-panel__eyebrow">Supplier escalation</p>
        <strong>{projection.rightRail.supplierEscalation}</strong>
      </section>
      <section>
        <p className="ops-panel__eyebrow">Governance events</p>
        <ol>
          {projection.rightRail.upcomingGovernanceEvents.map((event) => (
            <li key={event.eventId} data-state={event.state}>
              <span>{event.nextOccurrence.slice(0, 10)}</span>
              <strong>{event.title}</strong>
              <small>{event.owner}</small>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}

function SourceDrawer({
  domain,
  onClose,
}: {
  readonly domain: BAUHandover487DomainCard | null;
  readonly onClose: () => void;
}) {
  if (!domain) return null;
  return (
    <section
      className="bau-487__drawer"
      data-testid="bau-487-source-drawer"
      aria-labelledby="bau-487-drawer-title"
    >
      <div>
        <p className="ops-panel__eyebrow">Source drawer</p>
        <h2 id="bau-487-drawer-title">{domain.title}</h2>
      </div>
      <dl>
        <div>
          <dt>Runbook</dt>
          <dd>{domain.runbookRef}</dd>
        </div>
        <div>
          <dt>Training evidence</dt>
          <dd>{titleCase(domain.trainingEvidence)}</dd>
        </div>
        <div>
          <dt>Blockers</dt>
          <dd>{domain.blockerRefs.length === 0 ? "None" : domain.blockerRefs.join(", ")}</dd>
        </div>
      </dl>
      <button type="button" data-testid="bau-487-close-source-drawer" onClick={onClose}>
        Close
      </button>
    </section>
  );
}

function AcceptanceDialog({
  projection,
  open,
  onClose,
}: {
  readonly projection: BAUHandover487Projection;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  if (!open) return null;
  return (
    <section
      className="bau-487__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bau-487-dialog-title"
      data-testid="bau-487-acceptance-dialog"
    >
      <h2 id="bau-487-dialog-title">Accept BAU handover</h2>
      <p>
        The acceptance will settle against {projection.releaseWatchTupleRef} and keep blockers visible
        until the WORM-bound settlement is current.
      </p>
      <dl>
        <div>
          <dt>Verdict</dt>
          <dd>{titleCase(projection.verdict)}</dd>
        </div>
        <div>
          <dt>Service owner acceptances</dt>
          <dd>{BAU_HANDOVER_487_ACCEPTANCE_COUNT}</dd>
        </div>
        <div>
          <dt>Watch tuple hash</dt>
          <dd>{projection.watchTupleHashPrefix}</dd>
        </div>
      </dl>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </section>
  );
}

export function BAUHandoverBoard487() {
  const projection = createBAUHandover487Projection();
  const [selectedDomain, setSelectedDomain] = useState<BAUHandover487DomainCard | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  function openDomain(domain: BAUHandover487DomainCard, trigger: HTMLButtonElement): void {
    lastTriggerRef.current = trigger;
    setSelectedDomain(domain);
  }

  function closeDomain(): void {
    setSelectedDomain(null);
    requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }

  return (
    <main
      className="bau-487 token-foundation"
      data-testid="bau-487-board"
      data-handover-verdict={projection.verdict}
      data-rota-coverage-state={projection.rotaCoverageState}
      data-acceptance-action-state={projection.acceptanceActionState}
      data-rota-modify-action-state={projection.rotaModifyActionState}
      data-scenario-state={projection.scenarioState}
    >
      <div className="bau-487__shell">
        <header className="bau-487__masthead">
          <div>
            <p className="ops-panel__eyebrow">BAU handover</p>
            <h1>Support rotas and service ownership</h1>
          </div>
          <div className="bau-487__actions" aria-label="Handover actions">
            <button
              type="button"
              data-testid="bau-487-accept-handover"
              disabled={projection.acceptanceActionState !== "enabled"}
              onClick={() => setDialogOpen(true)}
            >
              Accept handover
            </button>
            <button
              type="button"
              data-testid="bau-487-modify-rotas"
              disabled={projection.rotaModifyActionState !== "enabled"}
            >
              Modify rotas
            </button>
          </div>
        </header>

        <StatusStrip projection={projection} />

        <div className="bau-487__layout">
          <div className="bau-487__main">
            <ResponsibilityLanes projection={projection} onOpen={openDomain} />
            <RotaTable projection={projection} />
            <OpenActions projection={projection} />
          </div>
          <RightRail projection={projection} />
        </div>
        <SourceDrawer domain={selectedDomain} onClose={closeDomain} />
        <AcceptanceDialog
          projection={projection}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </div>
    </main>
  );
}
