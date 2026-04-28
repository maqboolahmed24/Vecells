import type { ReactNode } from "react";

export const PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE =
  "Pharmacy_Operations_Workbench";

export type PharmacyWorkbenchTone = "ready" | "watch" | "review" | "blocked";

export interface PharmacyStockRiskChipModel {
  tone: PharmacyWorkbenchTone;
  label: string;
  summary: string;
}

export interface PharmacyWatchWindowBannerModel {
  tone: PharmacyWorkbenchTone;
  title: string;
  summary: string;
  windowLabel: string;
  recoveryOwnerLabel: string;
  blockerRefs: readonly string[];
}

export interface PharmacyOperationsMetricModel {
  metricId: string;
  label: string;
  count: number;
  summary: string;
  tone: PharmacyWorkbenchTone;
}

export interface PharmacyOperationsQueueRowModel {
  pharmacyCaseId: string;
  patientLabel: string;
  queueLaneLabel: string;
  providerLabel: string;
  pathwayLabel: string;
  dueLabel: string;
  summary: string;
  settlementLabel: string;
  watchLabel: string;
  rowTone: PharmacyWorkbenchTone;
  stockRisk: PharmacyStockRiskChipModel;
  indicatorLabels: readonly string[];
  blockingLabels: readonly string[];
}

export interface PharmacyOperationsQueueTableModel {
  title: string;
  summary: string;
  selectedCaseId: string;
  rows: readonly PharmacyOperationsQueueRowModel[];
}

export interface PharmacyOperationsPanelModel {
  visualMode: typeof PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE;
  title: string;
  summary: string;
  statusPill: string;
  metrics: readonly PharmacyOperationsMetricModel[];
  queueTable: PharmacyOperationsQueueTableModel;
}

export interface MedicationValidationSignalModel {
  signalId: string;
  label: string;
  value: string;
  detail: string;
  tone: PharmacyWorkbenchTone;
}

export interface MedicationLineCardModel {
  lineItemId: string;
  medicationLabel: string;
  instructionLabel: string;
  summary: string;
  requestedUnitsLabel: string;
  reservedUnitsLabel: string;
  availableUnitsLabel: string;
  postureLabel: string;
  stockRisk: PharmacyStockRiskChipModel;
  signals: readonly MedicationValidationSignalModel[];
  expanded: boolean;
}

export interface MedicationValidationBoardModel {
  title: string;
  summary: string;
  checkpointLabel: string;
  checkpointSummary: string;
  lineCards: readonly MedicationLineCardModel[];
}

export interface InventoryTruthRecordModel {
  recordId: string;
  productLabel: string;
  quantityLabel: string;
  freshnessLabel: string;
  trustLabel: string;
  expiryLabel: string;
  storageLabel: string;
  flags: readonly string[];
}

export interface InventoryTruthPanelModel {
  title: string;
  summary: string;
  freshnessStateLabel: string;
  trustStateLabel: string;
  hardStopLabel: string;
  records: readonly InventoryTruthRecordModel[];
}

export interface InventoryComparisonCandidateModel {
  candidateId: string;
  title: string;
  summary: string;
  coverageLabel: string;
  reservationLabel: string;
  approvalLabel: string;
  patientCommunicationLabel: string;
  handoffConsequenceLabel: string;
  tone: PharmacyWorkbenchTone;
  selected: boolean;
  commitReady: boolean;
  blockingLabels: readonly string[];
}

export interface InventoryComparisonWorkspaceModel {
  title: string;
  summary: string;
  compareStateLabel: string;
  activeFenceLabel: string;
  preservedFenceLabel: string;
  candidates: readonly InventoryComparisonCandidateModel[];
}

export interface HandoffProofLaneModel {
  laneId: string;
  label: string;
  value: string;
  detail: string;
  tone: PharmacyWorkbenchTone;
}

export interface HandoffReadinessBoardModel {
  title: string;
  summary: string;
  readinessLabel: string;
  settlementLabel: string;
  continuityLabel: string;
  patientCommunicationLabel: string;
  watchWindowLabel: string;
  proofLanes: readonly HandoffProofLaneModel[];
  blockingLabels: readonly string[];
}

export interface PharmacyCaseWorkbenchModel {
  visualMode: typeof PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE;
  title: string;
  summary: string;
  queueLaneLabel: string;
  providerLabel: string;
  pathwayLabel: string;
  dueLabel: string;
  postureLabel: string;
  postureTone: PharmacyWorkbenchTone;
  supportRegionLabel: string;
  watchWindow: PharmacyWatchWindowBannerModel | null;
  validationBoard: MedicationValidationBoardModel;
}

export interface PharmacyWorkbenchDecisionDockActionModel {
  actionId: string;
  label: string;
  detail: string;
  routeTarget:
    | "validate"
    | "inventory"
    | "resolve"
    | "handoff"
    | "assurance";
  emphasis: "primary" | "secondary";
}

export interface PharmacyWorkbenchDecisionDockModel {
  tone: PharmacyWorkbenchTone;
  title: string;
  summary: string;
  currentLineLabel: string;
  currentOwnerLabel: string;
  settlementLabel: string;
  continuityLabel: string;
  consequenceTitle: string;
  consequenceSummary: string;
  closeBlockers: readonly string[];
  primaryAction: PharmacyWorkbenchDecisionDockActionModel;
  secondaryActions: readonly PharmacyWorkbenchDecisionDockActionModel[];
}

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function PharmacyStockRiskChip(props: {
  chip: PharmacyStockRiskChipModel;
}) {
  return (
    <span
      className="pharmacy-workbench-chip"
      data-testid="PharmacyStockRiskChip"
      data-tone={props.chip.tone}
      title={props.chip.summary}
    >
      {props.chip.label}
    </span>
  );
}

export function PharmacyWatchWindowBanner(props: {
  banner: PharmacyWatchWindowBannerModel;
}) {
  return (
    <section
      className="pharmacy-watch-banner"
      data-testid="PharmacyWatchWindowBanner"
      data-tone={props.banner.tone}
      role={props.banner.tone === "blocked" ? "alert" : "status"}
      aria-live={props.banner.tone === "blocked" ? "assertive" : "polite"}
    >
      <div className="pharmacy-watch-banner__copy">
        <p className="pharmacy-workbench-kicker">Watch window</p>
        <h3>{props.banner.title}</h3>
        <p>{props.banner.summary}</p>
      </div>
      <dl className="pharmacy-watch-banner__facts">
        <div>
          <dt>Window</dt>
          <dd>{props.banner.windowLabel}</dd>
        </div>
        <div>
          <dt>Recovery owner</dt>
          <dd>{props.banner.recoveryOwnerLabel}</dd>
        </div>
        <div>
          <dt>Blockers</dt>
          <dd>{props.banner.blockerRefs.length ? props.banner.blockerRefs.join(", ") : "No open blockers"}</dd>
        </div>
      </dl>
    </section>
  );
}

export function PharmacyOperationsQueueTable(props: {
  table: PharmacyOperationsQueueTableModel;
  onOpenCase?: (pharmacyCaseId: string) => void;
}) {
  return (
    <section
      className="pharmacy-ops-table-shell"
      data-testid="PharmacyOperationsQueueTable"
      aria-label={props.table.title}
    >
      <header className="pharmacy-workbench-card__header">
        <div>
          <p className="pharmacy-workbench-kicker">Queue table</p>
          <h3>{props.table.title}</h3>
        </div>
      </header>
      <p className="pharmacy-workbench-card__summary">{props.table.summary}</p>
      <div className="pharmacy-ops-table-scroll">
        <table className="pharmacy-ops-table">
          <caption>{props.table.summary}</caption>
          <thead>
            <tr>
              <th scope="col">Case</th>
              <th scope="col">Waiting state</th>
              <th scope="col">Provider</th>
              <th scope="col">Due</th>
              <th scope="col">Risk</th>
            </tr>
          </thead>
          <tbody>
            {props.table.rows.map((row) => (
              <tr
                key={row.pharmacyCaseId}
                data-selected={row.pharmacyCaseId === props.table.selectedCaseId}
                data-tone={row.rowTone}
              >
                <td>
                  <button
                    type="button"
                    className="pharmacy-ops-table__row-button"
                    data-testid={`pharmacy-case-${row.pharmacyCaseId}`}
                    data-row-testid={`pharmacy-worklist-row-${row.pharmacyCaseId}`}
                    onClick={() => props.onOpenCase?.(row.pharmacyCaseId)}
                  >
                    <strong>{row.patientLabel}</strong>
                    <span>{row.pharmacyCaseId}</span>
                    <small>{row.summary}</small>
                  </button>
                </td>
                <td>
                  <div className="pharmacy-ops-table__stack">
                    <strong>{row.queueLaneLabel}</strong>
                    <span>{row.settlementLabel}</span>
                    <small>{row.watchLabel}</small>
                  </div>
                </td>
                <td>
                  <div className="pharmacy-ops-table__stack">
                    <strong>{row.providerLabel}</strong>
                    <span>{row.pathwayLabel}</span>
                  </div>
                </td>
                <td>
                  <div className="pharmacy-ops-table__stack">
                    <strong>{row.dueLabel}</strong>
                    <small>{row.blockingLabels.join(" · ") || "No active blockers"}</small>
                  </div>
                </td>
                <td>
                  <div className="pharmacy-ops-table__risk-cell">
                    <PharmacyStockRiskChip chip={row.stockRisk} />
                    <div className="pharmacy-ops-table__chip-cluster">
                      {row.indicatorLabels.map((label) => (
                        <span key={label} className="pharmacy-ops-table__indicator">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PharmacyOperationsPanel(props: {
  panel: PharmacyOperationsPanelModel;
  onOpenCase?: (pharmacyCaseId: string) => void;
}) {
  return (
    <section
      className="pharmacy-workbench-card pharmacy-operations-panel"
      data-testid="PharmacyOperationsPanel"
      data-visual-mode={props.panel.visualMode}
      aria-label={props.panel.title}
    >
      <header className="pharmacy-workbench-card__header">
        <div>
          <p className="pharmacy-workbench-kicker">Practice visibility</p>
          <h2>{props.panel.title}</h2>
        </div>
        <span className="pharmacy-workbench-pill" data-tone="review">
          {props.panel.statusPill}
        </span>
      </header>
      <p className="pharmacy-workbench-card__summary">{props.panel.summary}</p>
      <div className="pharmacy-operations-panel__metrics">
        {props.panel.metrics.map((metric) => (
          <article
            key={metric.metricId}
            className="pharmacy-operations-metric"
            data-tone={metric.tone}
          >
            <span>{metric.label}</span>
            <strong>{metric.count}</strong>
            <small>{metric.summary}</small>
          </article>
        ))}
      </div>
      <PharmacyOperationsQueueTable
        table={props.panel.queueTable}
        onOpenCase={props.onOpenCase}
      />
    </section>
  );
}

function MedicationLineCard(props: {
  card: MedicationLineCardModel;
  onSelectLineItem?: (lineItemId: string) => void;
}) {
  return (
    <article
      className={joinClasses(
        "pharmacy-line-card-v2",
        props.card.expanded && "pharmacy-line-card-v2--expanded",
      )}
      data-testid={`pharmacy-workbench-line-${props.card.lineItemId}`}
      data-expanded={props.card.expanded}
      data-tone={props.card.stockRisk.tone}
    >
      <button
        type="button"
        className="pharmacy-line-card-v2__button"
        data-testid={`pharmacy-line-item-${props.card.lineItemId}`}
        onClick={() => props.onSelectLineItem?.(props.card.lineItemId)}
      >
        <div className="pharmacy-line-card-v2__header">
          <div>
            <p className="pharmacy-workbench-kicker">
              {props.card.expanded ? "Expanded line" : "Line item"}
            </p>
            <h4>{props.card.medicationLabel}</h4>
            <p>{props.card.instructionLabel}</p>
          </div>
          <div className="pharmacy-line-card-v2__header-meta">
            <PharmacyStockRiskChip chip={props.card.stockRisk} />
            <span className="pharmacy-workbench-pill" data-tone={props.card.stockRisk.tone}>
              {props.card.postureLabel}
            </span>
          </div>
        </div>
        <p className="pharmacy-line-card-v2__summary">{props.card.summary}</p>
        <dl className="pharmacy-line-card-v2__metrics">
          <div>
            <dt>Requested</dt>
            <dd>{props.card.requestedUnitsLabel}</dd>
          </div>
          <div>
            <dt>Reserved</dt>
            <dd>{props.card.reservedUnitsLabel}</dd>
          </div>
          <div>
            <dt>Available</dt>
            <dd>{props.card.availableUnitsLabel}</dd>
          </div>
        </dl>
        <div className="pharmacy-line-card-v2__signals">
          {props.card.signals.map((signal) => (
            <article key={signal.signalId} data-tone={signal.tone}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
              <small>{signal.detail}</small>
            </article>
          ))}
        </div>
      </button>
    </article>
  );
}

export function MedicationValidationBoard(props: {
  board: MedicationValidationBoardModel;
  onSelectLineItem?: (lineItemId: string) => void;
}) {
  return (
    <section
      className="pharmacy-workbench-card pharmacy-validation-board"
      data-testid="MedicationValidationBoard"
      aria-label={props.board.title}
    >
      <header className="pharmacy-workbench-card__header">
        <div>
          <p className="pharmacy-workbench-kicker">Validation board</p>
          <h3>{props.board.title}</h3>
        </div>
        <span className="pharmacy-workbench-pill" data-tone="watch">
          {props.board.checkpointLabel}
        </span>
      </header>
      <p className="pharmacy-workbench-card__summary">{props.board.summary}</p>
      <div className="pharmacy-validation-board__checkpoint">
        <strong>{props.board.checkpointLabel}</strong>
        <span>{props.board.checkpointSummary}</span>
      </div>
      <div className="pharmacy-validation-board__lines">
        {props.board.lineCards.map((lineCard) => (
          <MedicationLineCard
            key={lineCard.lineItemId}
            card={lineCard}
            onSelectLineItem={props.onSelectLineItem}
          />
        ))}
      </div>
    </section>
  );
}

export function InventoryTruthPanel(props: {
  panel: InventoryTruthPanelModel;
}) {
  return (
    <section
      className="pharmacy-workbench-card pharmacy-support-panel"
      data-testid="InventoryTruthPanel"
      aria-label={props.panel.title}
    >
      <header className="pharmacy-workbench-card__header">
        <div>
          <p className="pharmacy-workbench-kicker">Inventory truth</p>
          <h3>{props.panel.title}</h3>
        </div>
        <div className="pharmacy-workbench-pill-cluster">
          <span className="pharmacy-workbench-pill" data-tone="watch">
            {props.panel.freshnessStateLabel}
          </span>
          <span className="pharmacy-workbench-pill" data-tone="review">
            {props.panel.trustStateLabel}
          </span>
        </div>
      </header>
      <p className="pharmacy-workbench-card__summary">{props.panel.summary}</p>
      <p className="pharmacy-support-panel__hard-stop">{props.panel.hardStopLabel}</p>
      <div className="pharmacy-support-panel__records">
        {props.panel.records.map((record) => (
          <article key={record.recordId} className="pharmacy-support-panel__record">
            <header>
              <strong>{record.productLabel}</strong>
              <span>{record.quantityLabel}</span>
            </header>
            <dl>
              <div>
                <dt>Freshness</dt>
                <dd>{record.freshnessLabel}</dd>
              </div>
              <div>
                <dt>Trust</dt>
                <dd>{record.trustLabel}</dd>
              </div>
              <div>
                <dt>Expiry</dt>
                <dd>{record.expiryLabel}</dd>
              </div>
              <div>
                <dt>Storage</dt>
                <dd>{record.storageLabel}</dd>
              </div>
            </dl>
            <div className="pharmacy-support-panel__flags">
              {record.flags.map((flag) => (
                <span key={flag}>{flag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function InventoryComparisonWorkspace(props: {
  workspace: InventoryComparisonWorkspaceModel;
}) {
  return (
    <section
      className="pharmacy-workbench-card pharmacy-support-panel"
      data-testid="InventoryComparisonWorkspace"
      aria-label={props.workspace.title}
    >
      <header className="pharmacy-workbench-card__header">
        <div>
          <p className="pharmacy-workbench-kicker">Inventory comparison</p>
          <h3>{props.workspace.title}</h3>
        </div>
        <span className="pharmacy-workbench-pill" data-tone="watch">
          {props.workspace.compareStateLabel}
        </span>
      </header>
      <p className="pharmacy-workbench-card__summary">{props.workspace.summary}</p>
      <dl className="pharmacy-support-panel__fence">
        <div>
          <dt>Active fence</dt>
          <dd>{props.workspace.activeFenceLabel}</dd>
        </div>
        <div>
          <dt>Preserved read-only fence</dt>
          <dd>{props.workspace.preservedFenceLabel}</dd>
        </div>
      </dl>
      <div className="pharmacy-support-panel__candidate-list">
        {props.workspace.candidates.map((candidate) => (
          <article
            key={candidate.candidateId}
            className="pharmacy-support-panel__candidate"
            data-selected={candidate.selected}
            data-tone={candidate.tone}
          >
            <header>
              <div>
                <strong>{candidate.title}</strong>
                <p>{candidate.summary}</p>
              </div>
              <span className="pharmacy-workbench-pill" data-tone={candidate.tone}>
                {candidate.commitReady ? "Commit ready" : "Review required"}
              </span>
            </header>
            <dl>
              <div>
                <dt>Coverage</dt>
                <dd>{candidate.coverageLabel}</dd>
              </div>
              <div>
                <dt>Reservation</dt>
                <dd>{candidate.reservationLabel}</dd>
              </div>
              <div>
                <dt>Approval</dt>
                <dd>{candidate.approvalLabel}</dd>
              </div>
              <div>
                <dt>Patient communication</dt>
                <dd>{candidate.patientCommunicationLabel}</dd>
              </div>
              <div>
                <dt>Handoff consequence</dt>
                <dd>{candidate.handoffConsequenceLabel}</dd>
              </div>
            </dl>
            {candidate.blockingLabels.length ? (
              <ul>
                {candidate.blockingLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function HandoffReadinessBoard(props: {
  board: HandoffReadinessBoardModel;
}) {
  return (
    <section
      className="pharmacy-workbench-card pharmacy-support-panel"
      data-testid="HandoffReadinessBoard"
      aria-label={props.board.title}
    >
      <header className="pharmacy-workbench-card__header">
        <div>
          <p className="pharmacy-workbench-kicker">Handoff readiness</p>
          <h3>{props.board.title}</h3>
        </div>
        <span className="pharmacy-workbench-pill" data-tone="watch">
          {props.board.readinessLabel}
        </span>
      </header>
      <p className="pharmacy-workbench-card__summary">{props.board.summary}</p>
      <dl className="pharmacy-support-panel__fence">
        <div>
          <dt>Settlement</dt>
          <dd>{props.board.settlementLabel}</dd>
        </div>
        <div>
          <dt>Continuity</dt>
          <dd>{props.board.continuityLabel}</dd>
        </div>
        <div>
          <dt>Patient communication</dt>
          <dd>{props.board.patientCommunicationLabel}</dd>
        </div>
        <div>
          <dt>Watch window</dt>
          <dd>{props.board.watchWindowLabel}</dd>
        </div>
      </dl>
      <div className="pharmacy-handoff-board__lanes">
        {props.board.proofLanes.map((lane) => (
          <article key={lane.laneId} data-tone={lane.tone}>
            <span>{lane.label}</span>
            <strong>{lane.value}</strong>
            <small>{lane.detail}</small>
          </article>
        ))}
      </div>
      {props.board.blockingLabels.length ? (
        <ul className="pharmacy-support-panel__blockers">
          {props.board.blockingLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function PharmacyCaseWorkbench(props: {
  workbench: PharmacyCaseWorkbenchModel;
  supportRegion?: ReactNode;
  onSelectLineItem?: (lineItemId: string) => void;
}) {
  return (
    <section
      className="pharmacy-workbench"
      data-testid="PharmacyCaseWorkbench"
      data-visual-mode={props.workbench.visualMode}
      aria-label={props.workbench.title}
    >
      <header className="pharmacy-workbench-card pharmacy-workbench__hero">
        <div className="pharmacy-workbench__hero-copy">
          <p className="pharmacy-workbench-kicker">Case workbench</p>
          <h2>{props.workbench.title}</h2>
          <p>{props.workbench.summary}</p>
        </div>
        <div className="pharmacy-workbench__hero-meta">
          <span className="pharmacy-workbench-pill" data-tone={props.workbench.postureTone}>
            {props.workbench.postureLabel}
          </span>
          <span className="pharmacy-workbench-pill" data-tone="review">
            {props.workbench.queueLaneLabel}
          </span>
          <span className="pharmacy-workbench-pill" data-tone="watch">
            {props.workbench.supportRegionLabel}
          </span>
        </div>
        <div className="pharmacy-workbench__hero-facts">
          <span>{props.workbench.providerLabel}</span>
          <span>{props.workbench.pathwayLabel}</span>
          <span>{props.workbench.dueLabel}</span>
        </div>
      </header>
      {props.workbench.watchWindow ? (
        <PharmacyWatchWindowBanner banner={props.workbench.watchWindow} />
      ) : null}
      <div className="pharmacy-workbench__body">
        <MedicationValidationBoard
          board={props.workbench.validationBoard}
          onSelectLineItem={props.onSelectLineItem}
        />
        <div className="pharmacy-workbench__support-region">{props.supportRegion}</div>
      </div>
    </section>
  );
}

export function PharmacyWorkbenchDecisionDock(props: {
  dock: PharmacyWorkbenchDecisionDockModel;
  onRouteAction?: (
    action: PharmacyWorkbenchDecisionDockActionModel,
  ) => void;
}) {
  return (
    <section
      className="pharmacy-workbench-dock"
      data-testid="PharmacyWorkbenchDecisionDock"
      data-tone={props.dock.tone}
      aria-label={props.dock.title}
    >
      <header className="pharmacy-workbench-card__header">
        <div>
          <p className="pharmacy-workbench-kicker">Decision dock</p>
          <h3>{props.dock.title}</h3>
        </div>
        <span className="pharmacy-workbench-pill" data-tone={props.dock.tone}>
          {props.dock.settlementLabel}
        </span>
      </header>
      <p className="pharmacy-workbench-card__summary">{props.dock.summary}</p>
      <dl className="pharmacy-workbench-dock__facts">
        <div>
          <dt>Current line</dt>
          <dd>{props.dock.currentLineLabel}</dd>
        </div>
        <div>
          <dt>Current owner</dt>
          <dd>{props.dock.currentOwnerLabel}</dd>
        </div>
        <div>
          <dt>Continuity</dt>
          <dd>{props.dock.continuityLabel}</dd>
        </div>
      </dl>
      <div className="pharmacy-workbench-dock__consequence">
        <strong>{props.dock.consequenceTitle}</strong>
        <p>{props.dock.consequenceSummary}</p>
      </div>
      {props.dock.closeBlockers.length ? (
        <ul className="pharmacy-workbench-dock__blockers">
          {props.dock.closeBlockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        className="pharmacy-workbench-button"
        data-testid="pharmacy-primary-route-button"
        data-route-target={props.dock.primaryAction.routeTarget}
        onClick={() => props.onRouteAction?.(props.dock.primaryAction)}
      >
        {props.dock.primaryAction.label}
      </button>
      <div className="pharmacy-workbench-dock__actions">
        {props.dock.secondaryActions.map((action) => (
          <button
            key={action.actionId}
            type="button"
            className="pharmacy-workbench-button pharmacy-workbench-button--ghost"
            data-testid={`pharmacy-dock-button-${action.routeTarget}`}
            data-route-target={action.routeTarget}
            onClick={() => props.onRouteAction?.(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
