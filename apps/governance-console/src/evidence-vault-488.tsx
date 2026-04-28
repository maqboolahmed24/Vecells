import { useRef, useState } from "react";
import {
  createEvidenceVault488Projection,
  isEvidenceVault488Path,
  type EvidenceVault488Card,
  type EvidenceVault488Projection,
} from "./evidence-vault-488.model";

export { isEvidenceVault488Path };

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function TopStrip({ projection }: { readonly projection: EvidenceVault488Projection }) {
  return (
    <section
      className="evidence-vault-488__strip"
      data-testid="evidence-vault-488-top-strip"
      aria-label="Archive status"
    >
      <div>
        <span>Archive verdict</span>
        <strong>{titleCase(projection.archiveVerdict)}</strong>
      </div>
      <div>
        <span>WORM seal digest</span>
        <strong>{projection.wormSealDigest.slice(0, 16)}</strong>
      </div>
      <div>
        <span>Retention policy</span>
        <strong>{projection.retentionPolicyVersion}</strong>
      </div>
      <div>
        <span>Legal holds</span>
        <strong>{projection.legalHoldCount}</strong>
      </div>
      <div>
        <span>Export posture</span>
        <strong>{titleCase(projection.exportPosture)}</strong>
      </div>
    </section>
  );
}

function EvidenceCard({
  card,
  onOpen,
}: {
  readonly card: EvidenceVault488Card;
  readonly onOpen: (card: EvidenceVault488Card, trigger: HTMLButtonElement) => void;
}) {
  return (
    <button
      className="evidence-vault-488__card"
      type="button"
      data-testid={`evidence-vault-488-card-${card.itemId}`}
      data-seal-state={card.sealState}
      data-export-eligibility={card.exportEligibility}
      onClick={(event) => onOpen(card, event.currentTarget)}
    >
      <span className="evidence-vault-488__seal" aria-hidden="true">
        {card.sealState === "sealed" ? "Seal" : titleCase(card.sealState)}
      </span>
      <strong>{card.title}</strong>
      <span>{card.sourceTuple}</span>
      <span className="evidence-vault-488__meta">
        <em>{titleCase(card.retentionClass)}</em>
        <em>{titleCase(card.confidentiality)}</em>
        <em>{titleCase(card.exportEligibility)}</em>
      </span>
      <code>{card.evidenceHashPrefix}</code>
      {card.blockerRefs.length > 0 ? <small>{card.blockerRefs[0]}</small> : null}
    </button>
  );
}

function Shelves({
  projection,
  onOpen,
}: {
  readonly projection: EvidenceVault488Projection;
  readonly onOpen: (card: EvidenceVault488Card, trigger: HTMLButtonElement) => void;
}) {
  return (
    <section
      className="evidence-vault-488__shelves"
      data-testid="evidence-vault-488-shelves"
      aria-labelledby="evidence-vault-488-shelves-title"
    >
      <header>
        <p className="governance-panel__eyebrow">Vault shelves</p>
        <h2 id="evidence-vault-488-shelves-title">Launch evidence families</h2>
      </header>
      <div className="evidence-vault-488__shelf-grid" data-testid="evidence-vault-488-cards">
        {projection.shelves.map((shelf) => (
          <section key={shelf.family} className="evidence-vault-488__shelf" aria-label={`${shelf.family} shelf`}>
            <h3>{shelf.family}</h3>
            <div>
              {shelf.cards.map((card) => (
                <EvidenceCard card={card} key={card.itemId} onOpen={onOpen} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function RetentionDrawer({
  card,
  projection,
  onClose,
}: {
  readonly card: EvidenceVault488Card | null;
  readonly projection: EvidenceVault488Projection;
  readonly onClose: () => void;
}) {
  if (!card) return null;
  const row =
    projection.retentionRows.find((candidate) => candidate.itemRef === card.itemId) ??
    projection.retentionRows[0] ?? {
      itemRef: card.itemId,
      retentionClass: card.retentionClass,
      legalHoldState: "unknown",
      deletionPermitted: false,
      protectionState: "protected",
    };
  return (
    <section
      className="evidence-vault-488__drawer"
      data-testid="evidence-vault-488-retention-drawer"
      aria-labelledby="evidence-vault-488-drawer-title"
    >
      <div>
        <p className="governance-panel__eyebrow">Retention and legal hold</p>
        <h2 id="evidence-vault-488-drawer-title">{card.title}</h2>
      </div>
      <dl>
        <div>
          <dt>Retention class</dt>
          <dd>{titleCase(row.retentionClass)}</dd>
        </div>
        <div>
          <dt>Legal hold</dt>
          <dd>{titleCase(row.legalHoldState)}</dd>
        </div>
        <div>
          <dt>Deletion permitted</dt>
          <dd>{row.deletionPermitted ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Protection</dt>
          <dd>{titleCase(row.protectionState)}</dd>
        </div>
      </dl>
      <button type="button" data-testid="evidence-vault-488-close-retention-drawer" onClick={onClose}>
        Close
      </button>
    </section>
  );
}

function CAPATable({ projection }: { readonly projection: EvidenceVault488Projection }) {
  return (
    <section
      className="evidence-vault-488__panel"
      data-testid="evidence-vault-488-capa-table"
      aria-labelledby="evidence-vault-488-capa-title"
    >
      <header>
        <p className="governance-panel__eyebrow">Lessons and CAPA</p>
        <h2 id="evidence-vault-488-capa-title">Actionable launch learning</h2>
      </header>
      <div className="evidence-vault-488__table-wrap">
        <table>
          <caption>CAPA actions seeded from launch lessons learned</caption>
          <thead>
            <tr>
              <th scope="col">CAPA</th>
              <th scope="col">Owner</th>
              <th scope="col">Due</th>
              <th scope="col">Severity</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {projection.capaRows.map((row) => (
              <tr key={row.capaActionId}>
                <th scope="row">{row.capaActionId}</th>
                <td>{row.owner}</td>
                <td>{row.dueDate}</td>
                <td>{titleCase(row.severity)}</td>
                <td>{titleCase(row.state)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RightRail({ projection }: { readonly projection: EvidenceVault488Projection }) {
  return (
    <aside
      className="evidence-vault-488__rail"
      data-testid="evidence-vault-488-right-rail"
      aria-label="Archive review rail"
    >
      <section>
        <p className="governance-panel__eyebrow">Lessons learned</p>
        <ol>
          {projection.rightRail.lessons.map((lesson) => (
            <li key={lesson}>{lesson}</li>
          ))}
        </ol>
      </section>
      <section>
        <p className="governance-panel__eyebrow">Legal holds</p>
        <strong>{projection.rightRail.legalHolds.length}</strong>
      </section>
      <section>
        <p className="governance-panel__eyebrow">Quarantine</p>
        <strong>{projection.rightRail.quarantinedArtifacts.length}</strong>
      </section>
      <section>
        <p className="governance-panel__eyebrow">Access grant</p>
        <strong>{titleCase(projection.rightRail.accessGrantState)}</strong>
      </section>
    </aside>
  );
}

function ExportDialog({
  projection,
  open,
  onClose,
}: {
  readonly projection: EvidenceVault488Projection;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  if (!open) return null;
  return (
    <section
      className="evidence-vault-488__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-vault-488-export-title"
      data-testid="evidence-vault-488-export-dialog"
    >
      <h2 id="evidence-vault-488-export-title">Prepare archive export</h2>
      <p>
        Export remains summary-first and redacted. Final availability follows the archive transfer
        settlement, not the local button press.
      </p>
      <dl>
        <div>
          <dt>Role</dt>
          <dd>{titleCase(projection.role)}</dd>
        </div>
        <div>
          <dt>Posture</dt>
          <dd>{titleCase(projection.exportPosture)}</dd>
        </div>
        <div>
          <dt>Digest</dt>
          <dd>{projection.wormSealDigest.slice(0, 16)}</dd>
        </div>
      </dl>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </section>
  );
}

export function EvidenceVault488() {
  const projection = createEvidenceVault488Projection();
  const [selectedCard, setSelectedCard] = useState<EvidenceVault488Card | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  function openCard(card: EvidenceVault488Card, trigger: HTMLButtonElement): void {
    lastTriggerRef.current = trigger;
    setSelectedCard(card);
  }

  function closeDrawer(): void {
    setSelectedCard(null);
    requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }

  return (
    <main
      className="evidence-vault-488 token-foundation"
      data-testid="evidence-vault-488"
      data-archive-verdict={projection.archiveVerdict}
      data-export-posture={projection.exportPosture}
      data-export-action-state={projection.exportActionState}
      data-scenario-state={projection.scenarioState}
    >
      <div className="evidence-vault-488__shell">
        <header className="evidence-vault-488__masthead">
          <div>
            <p className="governance-panel__eyebrow">Evidence Vault</p>
            <h1>Launch archive and lessons</h1>
          </div>
          <button
            type="button"
            data-testid="evidence-vault-488-export-action"
            disabled={projection.exportActionState !== "enabled"}
            onClick={() => setDialogOpen(true)}
          >
            Export archive
          </button>
        </header>
        <TopStrip projection={projection} />
        <div className="evidence-vault-488__layout">
          <div className="evidence-vault-488__main">
            <Shelves projection={projection} onOpen={openCard} />
            <CAPATable projection={projection} />
          </div>
          <RightRail projection={projection} />
        </div>
        <RetentionDrawer card={selectedCard} projection={projection} onClose={closeDrawer} />
        <ExportDialog projection={projection} open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </div>
    </main>
  );
}
