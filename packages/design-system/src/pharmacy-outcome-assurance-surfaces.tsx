import { useId, useState } from "react";

export const PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE =
  "Pharmacy_Assurance_Workbench";

export type PharmacyOutcomeAssuranceSurfaceState =
  | "matched_review"
  | "ambiguous_review"
  | "unmatched_review";

export type PharmacyOutcomeAssuranceTone =
  | "ready"
  | "watch"
  | "review"
  | "blocked";

export interface OutcomeAssuranceHeaderModel {
  tone: PharmacyOutcomeAssuranceTone;
  eyebrow: string;
  title: string;
  summary: string;
  statusPill: string;
  closePostureLabel: string;
}

export interface OutcomeEvidenceSourceCardModel {
  sourceLabel: string;
  sourceSummary: string;
  consultationModeLabel: string;
  medicinesSuppliedLabel: string;
  gpActionLabel: string;
  resolutionClassificationLabel: string;
  receivedAtLabel: string;
  trustLabel: string;
}

export interface OutcomeMatchSummaryModel {
  title: string;
  summary: string;
  matchedCaseLabel: string;
  runnerUpCaseLabel: string | null;
  matchStateLabel: string;
  patientVisibilityLabel: string;
}

export interface OutcomeConfidenceBreakdownModel {
  metricId: string;
  label: string;
  value: string;
  summary: string;
}

export interface OutcomeConfidenceMeterModel {
  confidenceBand: "high" | "medium" | "low";
  title: string;
  summary: string;
  confidenceValue: number;
  confidenceLabel: string;
  deltaToRunnerUpLabel: string;
  thresholdSummary: string;
  breakdown: readonly OutcomeConfidenceBreakdownModel[];
}

export interface OutcomeGateTimelineStepModel {
  stepId: string;
  label: string;
  state: "complete" | "current" | "blocked" | "pending";
  summary: string;
  detail: string;
}

export interface OutcomeGateTimelineModel {
  title: string;
  summary: string;
  steps: readonly OutcomeGateTimelineStepModel[];
}

export interface OutcomeManualReviewBannerModel {
  tone: PharmacyOutcomeAssuranceTone;
  title: string;
  summary: string;
  detail: string;
  announcementRole: "status" | "alert";
}

export interface OutcomeEvidenceDrawerRowModel {
  label: string;
  value: string;
  detail: string;
}

export interface OutcomeEvidenceDrawerGroupModel {
  groupId: string;
  label: string;
  rows: readonly OutcomeEvidenceDrawerRowModel[];
}

export interface OutcomeEvidenceDrawerModel {
  title: string;
  summary: string;
  toggleLabel: string;
  groups: readonly OutcomeEvidenceDrawerGroupModel[];
}

export interface OutcomeDecisionDockActionModel {
  actionId: string;
  label: string;
  detail: string;
  routeTarget: "validate" | "resolve" | "handoff" | "assurance";
  emphasis: "primary" | "secondary";
}

export interface OutcomeDecisionDockModel {
  tone: PharmacyOutcomeAssuranceTone;
  title: string;
  summary: string;
  currentOwnerLabel: string;
  nextReviewLabel: string;
  consequenceTitle: string;
  consequenceSummary: string;
  closeBlockers: readonly string[];
  primaryAction: OutcomeDecisionDockActionModel;
  secondaryActions: readonly OutcomeDecisionDockActionModel[];
}

export interface PharmacyOutcomeAssurancePanelModel {
  visualMode: typeof PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE;
  surfaceState: PharmacyOutcomeAssuranceSurfaceState;
  header: OutcomeAssuranceHeaderModel;
  sourceCard: OutcomeEvidenceSourceCardModel;
  matchSummary: OutcomeMatchSummaryModel;
  confidenceMeter: OutcomeConfidenceMeterModel;
  gateTimeline: OutcomeGateTimelineModel;
  manualReviewBanner: OutcomeManualReviewBannerModel;
  evidenceDrawer: OutcomeEvidenceDrawerModel;
}

function joinClasses(...classes: Array<string | null | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function OutcomeEvidenceSourceCard(props: {
  card: OutcomeEvidenceSourceCardModel;
}) {
  return (
    <section
      className="pharmacy-outcome-assurance-card"
      data-testid="OutcomeEvidenceSourceCard"
      aria-label="Outcome evidence source"
    >
      <header className="pharmacy-outcome-assurance-card__header">
        <div>
          <p className="pharmacy-outcome-assurance-kicker">Incoming evidence</p>
          <h3>{props.card.sourceLabel}</h3>
        </div>
      </header>
      <p className="pharmacy-outcome-assurance-card__summary">
        {props.card.sourceSummary}
      </p>
      <dl className="pharmacy-outcome-assurance-definition-list">
        <div>
          <dt>Consultation mode</dt>
          <dd>{props.card.consultationModeLabel}</dd>
        </div>
        <div>
          <dt>Medicines supplied</dt>
          <dd>{props.card.medicinesSuppliedLabel}</dd>
        </div>
        <div>
          <dt>GP action</dt>
          <dd>{props.card.gpActionLabel}</dd>
        </div>
        <div>
          <dt>Classification</dt>
          <dd>{props.card.resolutionClassificationLabel}</dd>
        </div>
        <div>
          <dt>Received</dt>
          <dd>{props.card.receivedAtLabel}</dd>
        </div>
        <div>
          <dt>Trust</dt>
          <dd>{props.card.trustLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function OutcomeMatchSummary(props: {
  summary: OutcomeMatchSummaryModel;
}) {
  return (
    <section
      className="pharmacy-outcome-assurance-card"
      data-testid="OutcomeMatchSummary"
      aria-label={props.summary.title}
    >
      <header className="pharmacy-outcome-assurance-card__header">
        <div>
          <p className="pharmacy-outcome-assurance-kicker">Match summary</p>
          <h3>{props.summary.title}</h3>
        </div>
      </header>
      <p className="pharmacy-outcome-assurance-card__summary">
        {props.summary.summary}
      </p>
      <dl className="pharmacy-outcome-assurance-definition-list">
        <div>
          <dt>Best current match</dt>
          <dd>{props.summary.matchedCaseLabel}</dd>
        </div>
        <div>
          <dt>Runner-up</dt>
          <dd>{props.summary.runnerUpCaseLabel ?? "No viable runner-up"}</dd>
        </div>
        <div>
          <dt>Match posture</dt>
          <dd>{props.summary.matchStateLabel}</dd>
        </div>
        <div>
          <dt>Patient visibility</dt>
          <dd>{props.summary.patientVisibilityLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function OutcomeConfidenceMeter(props: {
  meter: OutcomeConfidenceMeterModel;
}) {
  const clamped = Math.max(0, Math.min(1, props.meter.confidenceValue));
  return (
    <section
      className="pharmacy-outcome-assurance-card"
      data-testid="OutcomeConfidenceMeter"
      data-confidence-band={props.meter.confidenceBand}
      aria-label={props.meter.title}
    >
      <header className="pharmacy-outcome-assurance-card__header">
        <div>
          <p className="pharmacy-outcome-assurance-kicker">Confidence</p>
          <h3>{props.meter.title}</h3>
        </div>
        <span
          className="pharmacy-outcome-assurance-pill"
          data-tone={props.meter.confidenceBand === "high" ? "ready" : props.meter.confidenceBand === "medium" ? "watch" : "review"}
        >
          {titleCase(props.meter.confidenceBand)}
        </span>
      </header>
      <p className="pharmacy-outcome-assurance-card__summary">
        {props.meter.summary}
      </p>
      <div className="pharmacy-outcome-confidence-meter">
        <div className="pharmacy-outcome-confidence-meter__labels">
          <strong>{props.meter.confidenceLabel}</strong>
          <span>{props.meter.deltaToRunnerUpLabel}</span>
        </div>
        <div className="pharmacy-outcome-confidence-meter__track" aria-hidden="true">
          <div
            className="pharmacy-outcome-confidence-meter__fill"
            style={{ width: `${Math.round(clamped * 100)}%` }}
          />
        </div>
        <p className="pharmacy-outcome-confidence-meter__summary">
          {props.meter.thresholdSummary}
        </p>
      </div>
      <ul className="pharmacy-outcome-confidence-breakdown">
        {props.meter.breakdown.map((entry) => (
          <li key={entry.metricId}>
            <strong>{entry.label}</strong>
            <span>{entry.value}</span>
            <p>{entry.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OutcomeGateTimeline(props: {
  timeline: OutcomeGateTimelineModel;
}) {
  return (
    <section
      className="pharmacy-outcome-assurance-card"
      data-testid="OutcomeGateTimeline"
      aria-label={props.timeline.title}
    >
      <header className="pharmacy-outcome-assurance-card__header">
        <div>
          <p className="pharmacy-outcome-assurance-kicker">Gate timeline</p>
          <h3>{props.timeline.title}</h3>
        </div>
      </header>
      <p className="pharmacy-outcome-assurance-card__summary">
        {props.timeline.summary}
      </p>
      <ol className="pharmacy-outcome-gate-timeline">
        {props.timeline.steps.map((step) => (
          <li
            key={step.stepId}
            className="pharmacy-outcome-gate-timeline__item"
            data-state={step.state}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <div className="pharmacy-outcome-gate-timeline__marker" aria-hidden="true" />
            <div className="pharmacy-outcome-gate-timeline__copy">
              <div className="pharmacy-outcome-gate-timeline__heading">
                <strong>{step.label}</strong>
                <span
                  className="pharmacy-outcome-assurance-pill"
                  data-tone={
                    step.state === "complete"
                      ? "ready"
                      : step.state === "current"
                        ? "review"
                        : step.state === "blocked"
                          ? "blocked"
                          : "watch"
                  }
                >
                  {titleCase(step.state)}
                </span>
              </div>
              <p>{step.summary}</p>
              <small>{step.detail}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function OutcomeManualReviewBanner(props: {
  banner: OutcomeManualReviewBannerModel;
}) {
  const RoleTag = props.banner.announcementRole === "alert" ? "div" : "div";
  return (
    <RoleTag
      className="pharmacy-outcome-manual-review-banner"
      data-testid="OutcomeManualReviewBanner"
      data-tone={props.banner.tone}
      role={props.banner.announcementRole}
      aria-live={props.banner.announcementRole === "status" ? "polite" : undefined}
      aria-atomic={props.banner.announcementRole === "status" ? "true" : undefined}
    >
      <div>
        <p className="pharmacy-outcome-assurance-kicker">Manual review</p>
        <h3>{props.banner.title}</h3>
      </div>
      <p>{props.banner.summary}</p>
      <small>{props.banner.detail}</small>
    </RoleTag>
  );
}

export function OutcomeEvidenceDrawer(props: {
  drawer: OutcomeEvidenceDrawerModel;
  defaultOpen?: boolean;
}) {
  const scopeId = useId();
  const [open, setOpen] = useState(Boolean(props.defaultOpen));
  const panelId = `${scopeId}-evidence-drawer`;

  return (
    <section
      className="pharmacy-outcome-assurance-card pharmacy-outcome-assurance-card--drawer"
      data-testid="OutcomeEvidenceDrawer"
      data-open={open}
      aria-label={props.drawer.title}
    >
      <header className="pharmacy-outcome-assurance-card__header">
        <div>
          <p className="pharmacy-outcome-assurance-kicker">Evidence drawer</p>
          <h3>{props.drawer.title}</h3>
        </div>
        <button
          type="button"
          className="pharmacy-outcome-assurance-disclosure"
          data-testid="outcome-evidence-drawer-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          {props.drawer.toggleLabel}
        </button>
      </header>
      <p className="pharmacy-outcome-assurance-card__summary">
        {props.drawer.summary}
      </p>
      <div id={panelId} hidden={!open}>
        <div className="pharmacy-outcome-evidence-groups">
          {props.drawer.groups.map((group) => (
            <section
              key={group.groupId}
              className="pharmacy-outcome-evidence-group"
              aria-label={group.label}
            >
              <h4>{group.label}</h4>
              <dl>
                {group.rows.map((row) => (
                  <div key={`${group.groupId}-${row.label}`}>
                    <dt>{row.label}</dt>
                    <dd>
                      <strong>{row.value}</strong>
                      <small>{row.detail}</small>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OutcomeDecisionDock(props: {
  dock: OutcomeDecisionDockModel;
  onRouteAction?: (
    action: OutcomeDecisionDockActionModel,
  ) => void;
}) {
  const handleAction = (action: OutcomeDecisionDockActionModel) => {
    props.onRouteAction?.(action);
  };

  return (
    <section
      className="pharmacy-outcome-decision-dock"
      data-testid="OutcomeDecisionDock"
      data-tone={props.dock.tone}
      aria-label="Outcome assurance decision dock"
    >
      <header className="pharmacy-outcome-assurance-card__header">
        <div>
          <p className="pharmacy-outcome-assurance-kicker">DecisionDock</p>
          <h3>{props.dock.title}</h3>
        </div>
        <span className="pharmacy-outcome-assurance-pill" data-tone={props.dock.tone}>
          {titleCase(props.dock.tone)}
        </span>
      </header>
      <p className="pharmacy-outcome-assurance-card__summary">
        {props.dock.summary}
      </p>
      <dl className="pharmacy-outcome-assurance-definition-list">
        <div>
          <dt>Current owner</dt>
          <dd>{props.dock.currentOwnerLabel}</dd>
        </div>
        <div>
          <dt>Next review</dt>
          <dd>{props.dock.nextReviewLabel}</dd>
        </div>
      </dl>
      <section className="pharmacy-outcome-decision-dock__consequence">
        <h4>{props.dock.consequenceTitle}</h4>
        <p>{props.dock.consequenceSummary}</p>
      </section>
      <ul className="pharmacy-outcome-decision-dock__blockers">
        {props.dock.closeBlockers.map((blocker) => (
          <li key={blocker}>{blocker}</li>
        ))}
      </ul>
      <button
        type="button"
        className="pharmacy-outcome-decision-dock__button"
        data-testid="outcome-decisiondock-primary"
        data-route-target={props.dock.primaryAction.routeTarget}
        onClick={() => handleAction(props.dock.primaryAction)}
      >
        <span>{props.dock.primaryAction.label}</span>
        <small>{props.dock.primaryAction.detail}</small>
      </button>
      <div className="pharmacy-outcome-decision-dock__actions">
        {props.dock.secondaryActions.map((action) => (
          <button
            key={action.actionId}
            type="button"
            className="pharmacy-outcome-decision-dock__button pharmacy-outcome-decision-dock__button--secondary"
            data-testid={`outcome-decisiondock-${action.actionId}`}
            data-route-target={action.routeTarget}
            onClick={() => handleAction(action)}
          >
            <span>{action.label}</span>
            <small>{action.detail}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

export function PharmacyOutcomeAssurancePanel(props: {
  preview: PharmacyOutcomeAssurancePanelModel;
}) {
  return (
    <section
      className="pharmacy-outcome-assurance"
      data-testid="PharmacyOutcomeAssurancePanel"
      data-visual-mode={props.preview.visualMode}
      data-surface-state={props.preview.surfaceState}
      aria-label="Outcome assurance workbench"
    >
      <header
        className="pharmacy-outcome-assurance__header"
        data-tone={props.preview.header.tone}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <p className="pharmacy-outcome-assurance-kicker">
            {props.preview.header.eyebrow}
          </p>
          <h3>{props.preview.header.title}</h3>
          <p>{props.preview.header.summary}</p>
        </div>
        <div className="pharmacy-outcome-assurance__header-meta">
          <span className="pharmacy-outcome-assurance-pill" data-tone={props.preview.header.tone}>
            {props.preview.header.statusPill}
          </span>
          <span className="pharmacy-outcome-assurance-header-note">
            {props.preview.header.closePostureLabel}
          </span>
        </div>
      </header>
      <div className="pharmacy-outcome-assurance__layout">
        <div className="pharmacy-outcome-assurance__main">
          <OutcomeMatchSummary summary={props.preview.matchSummary} />
          <OutcomeConfidenceMeter meter={props.preview.confidenceMeter} />
          <OutcomeGateTimeline timeline={props.preview.gateTimeline} />
          <OutcomeManualReviewBanner banner={props.preview.manualReviewBanner} />
        </div>
        <aside className="pharmacy-outcome-assurance__rail">
          <OutcomeEvidenceSourceCard card={props.preview.sourceCard} />
          <OutcomeEvidenceDrawer
            drawer={props.preview.evidenceDrawer}
            defaultOpen={props.preview.surfaceState === "unmatched_review"}
          />
        </aside>
      </div>
    </section>
  );
}
