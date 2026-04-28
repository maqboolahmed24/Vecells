import { useId, useState } from "react";

export const PHARMACY_RECOVERY_CONTROL_VISUAL_MODE = "Pharmacy_Recovery_Control";

export type PharmacyRecoverySurfaceState =
  | "urgent_return"
  | "routine_reopen"
  | "loop_risk_escalated";

export type PharmacyRecoveryTone =
  | "watch"
  | "review"
  | "blocked"
  | "critical";

export interface PharmacyBounceBackQueueItemModel {
  itemId: string;
  label: string;
  state: "complete" | "current" | "blocked" | "pending";
  summary: string;
  detail: string;
}

export interface PharmacyBounceBackQueueModel {
  title: string;
  summary: string;
  items: readonly PharmacyBounceBackQueueItemModel[];
}

export interface PharmacyReopenedCaseBannerModel {
  tone: PharmacyRecoveryTone;
  title: string;
  summary: string;
  detail: string;
  statusPill: string;
  announcementRole: "status" | "alert";
}

export interface PharmacyUrgentReturnModeModel {
  tone: PharmacyRecoveryTone;
  title: string;
  summary: string;
  routeClassLabel: string;
  directRouteLabel: string;
  fallbackRouteLabel: string;
  monitoredSafetyNetLabel: string;
  calmCopyLabel: string;
}

export interface OpenOriginalRequestActionModel {
  title: string;
  summary: string;
  buttonLabel: string;
  hint: string;
  availabilityState: "available" | "duty_task_only";
}

export interface PharmacyReturnMessagePreviewModel {
  title: string;
  summary: string;
  headline: string;
  body: string;
  warning: string | null;
  notificationStateLabel: string;
  channelHintLabel: string;
  anchorLabel: string;
  contractLabel: string;
}

export interface PharmacyReopenDiffRowModel {
  diffId: string;
  label: string;
  previousValue: string;
  currentValue: string;
  implication: string;
}

export interface PharmacyReopenDiffStripModel {
  title: string;
  summary: string;
  rows: readonly PharmacyReopenDiffRowModel[];
}

export interface PharmacyLoopRiskEscalationCardModel {
  tone: PharmacyRecoveryTone;
  title: string;
  summary: string;
  loopRiskLabel: string;
  reopenPriorityLabel: string;
  supervisorStateLabel: string;
  autoBlockSummary: readonly string[];
  announcementRole: "status" | "alert";
}

export interface PharmacyRecoveryDecisionDockActionModel {
  actionId: string;
  label: string;
  detail: string;
  routeTarget: "validate" | "resolve" | "handoff" | "assurance";
  emphasis: "primary" | "secondary";
}

export interface PharmacyRecoveryDecisionDockModel {
  tone: PharmacyRecoveryTone;
  title: string;
  summary: string;
  currentOwnerLabel: string;
  consequenceTitle: string;
  consequenceSummary: string;
  closeBlockers: readonly string[];
  primaryAction: PharmacyRecoveryDecisionDockActionModel;
  secondaryActions: readonly PharmacyRecoveryDecisionDockActionModel[];
}

export interface PharmacyBounceBackRecoveryPanelModel {
  visualMode: typeof PHARMACY_RECOVERY_CONTROL_VISUAL_MODE;
  surfaceState: PharmacyRecoverySurfaceState;
  banner: PharmacyReopenedCaseBannerModel;
  queue: PharmacyBounceBackQueueModel;
  urgentReturnMode: PharmacyUrgentReturnModeModel;
  openOriginalRequestAction: OpenOriginalRequestActionModel;
  returnMessagePreview: PharmacyReturnMessagePreviewModel;
  reopenDiffStrip: PharmacyReopenDiffStripModel;
  loopRiskEscalationCard: PharmacyLoopRiskEscalationCardModel;
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

export function PharmacyReopenedCaseBanner(props: {
  banner: PharmacyReopenedCaseBannerModel;
}) {
  return (
    <section
      className="pharmacy-recovery-card pharmacy-recovery-card--banner"
      data-testid="PharmacyReopenedCaseBanner"
      data-tone={props.banner.tone}
      role={props.banner.announcementRole}
      aria-live={props.banner.announcementRole === "alert" ? "assertive" : "polite"}
    >
      <header className="pharmacy-recovery-card__header">
        <div>
          <p className="pharmacy-recovery-kicker">Reopened case</p>
          <h3>{props.banner.title}</h3>
        </div>
        <span className="pharmacy-recovery-pill" data-tone={props.banner.tone}>
          {props.banner.statusPill}
        </span>
      </header>
      <p className="pharmacy-recovery-card__summary">{props.banner.summary}</p>
      <p className="pharmacy-recovery-card__detail">{props.banner.detail}</p>
    </section>
  );
}

export function PharmacyBounceBackQueue(props: {
  queue: PharmacyBounceBackQueueModel;
}) {
  return (
    <section
      className="pharmacy-recovery-card"
      data-testid="PharmacyBounceBackQueue"
      aria-label={props.queue.title}
    >
      <header className="pharmacy-recovery-card__header">
        <div>
          <p className="pharmacy-recovery-kicker">Recovery queue</p>
          <h3>{props.queue.title}</h3>
        </div>
      </header>
      <p className="pharmacy-recovery-card__summary">{props.queue.summary}</p>
      <ol className="pharmacy-recovery-queue">
        {props.queue.items.map((item) => (
          <li key={item.itemId} data-state={item.state}>
            <div className="pharmacy-recovery-queue__marker" aria-hidden="true" />
            <article className="pharmacy-recovery-queue__card">
              <header>
                <strong>{item.label}</strong>
                <span>{titleCase(item.state)}</span>
              </header>
              <p>{item.summary}</p>
              <small>{item.detail}</small>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PharmacyUrgentReturnMode(props: {
  mode: PharmacyUrgentReturnModeModel;
}) {
  return (
    <section
      className="pharmacy-recovery-card"
      data-testid="PharmacyUrgentReturnMode"
      data-tone={props.mode.tone}
      aria-label={props.mode.title}
    >
      <header className="pharmacy-recovery-card__header">
        <div>
          <p className="pharmacy-recovery-kicker">Route mode</p>
          <h3>{props.mode.title}</h3>
        </div>
        <span className="pharmacy-recovery-pill" data-tone={props.mode.tone}>
          {props.mode.routeClassLabel}
        </span>
      </header>
      <p className="pharmacy-recovery-card__summary">{props.mode.summary}</p>
      <dl className="pharmacy-recovery-definition-list">
        <div>
          <dt>Primary route</dt>
          <dd>{props.mode.directRouteLabel}</dd>
        </div>
        <div>
          <dt>Fallback route</dt>
          <dd>{props.mode.fallbackRouteLabel}</dd>
        </div>
        <div>
          <dt>Safety net</dt>
          <dd>{props.mode.monitoredSafetyNetLabel}</dd>
        </div>
        <div>
          <dt>Patient copy</dt>
          <dd>{props.mode.calmCopyLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function OpenOriginalRequestAction(props: {
  action: OpenOriginalRequestActionModel;
  onOpenOriginalRequest?: () => void;
}) {
  return (
    <section
      className="pharmacy-recovery-card"
      data-testid="OpenOriginalRequestAction"
      data-availability-state={props.action.availabilityState}
      aria-label={props.action.title}
    >
      <header className="pharmacy-recovery-card__header">
        <div>
          <p className="pharmacy-recovery-kicker">Original request</p>
          <h3>{props.action.title}</h3>
        </div>
        <span
          className="pharmacy-recovery-pill"
          data-tone={props.action.availabilityState === "available" ? "watch" : "blocked"}
        >
          {props.action.availabilityState === "available"
            ? "Same-shell return"
            : "Duty-task constrained"}
        </span>
      </header>
      <p className="pharmacy-recovery-card__summary">{props.action.summary}</p>
      <button
        type="button"
        className={joinClasses(
          "pharmacy-recovery-button",
          props.action.availabilityState === "duty_task_only" &&
            "pharmacy-recovery-button--ghost",
        )}
        data-testid="pharmacy-open-original-request"
        onClick={() => props.onOpenOriginalRequest?.()}
      >
        {props.action.buttonLabel}
      </button>
      <p className="pharmacy-recovery-card__detail">{props.action.hint}</p>
    </section>
  );
}

export function PharmacyReturnMessagePreview(props: {
  preview: PharmacyReturnMessagePreviewModel;
}) {
  const detailsId = useId();
  const [open, setOpen] = useState(true);

  return (
    <section
      className="pharmacy-recovery-card"
      data-testid="PharmacyReturnMessagePreview"
      aria-label={props.preview.title}
    >
      <header className="pharmacy-recovery-card__header">
        <div>
          <p className="pharmacy-recovery-kicker">Patient message</p>
          <h3>{props.preview.title}</h3>
        </div>
        <span className="pharmacy-recovery-pill" data-tone="watch">
          {props.preview.notificationStateLabel}
        </span>
      </header>
      <p className="pharmacy-recovery-card__summary">{props.preview.summary}</p>
      <button
        type="button"
        className="pharmacy-recovery-disclosure"
        data-testid="pharmacy-return-message-toggle"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Collapse message preview" : "Expand message preview"}
      </button>
      <div
        className="pharmacy-recovery-message-preview"
        id={detailsId}
        hidden={!open}
      >
        <strong>{props.preview.headline}</strong>
        <p>{props.preview.body}</p>
        {props.preview.warning ? (
          <p className="pharmacy-recovery-message-preview__warning">
            {props.preview.warning}
          </p>
        ) : null}
        <dl className="pharmacy-recovery-definition-list">
          <div>
            <dt>Channel</dt>
            <dd>{props.preview.channelHintLabel}</dd>
          </div>
          <div>
            <dt>Anchor</dt>
            <dd>{props.preview.anchorLabel}</dd>
          </div>
          <div>
            <dt>Return contract</dt>
            <dd>{props.preview.contractLabel}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function PharmacyReopenDiffStrip(props: {
  diffStrip: PharmacyReopenDiffStripModel;
}) {
  return (
    <section
      className="pharmacy-recovery-card"
      data-testid="PharmacyReopenDiffStrip"
      aria-label={props.diffStrip.title}
    >
      <header className="pharmacy-recovery-card__header">
        <div>
          <p className="pharmacy-recovery-kicker">Reopen diff</p>
          <h3>{props.diffStrip.title}</h3>
        </div>
      </header>
      <p className="pharmacy-recovery-card__summary">{props.diffStrip.summary}</p>
      <ul className="pharmacy-recovery-diff-list">
        {props.diffStrip.rows.map((row) => (
          <li key={row.diffId}>
            <div className="pharmacy-recovery-diff-list__header">
              <strong>{row.label}</strong>
            </div>
            <div className="pharmacy-recovery-diff-list__values">
              <div>
                <span>Before</span>
                <strong>{row.previousValue}</strong>
              </div>
              <div>
                <span>Now</span>
                <strong>{row.currentValue}</strong>
              </div>
            </div>
            <p>{row.implication}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PharmacyLoopRiskEscalationCard(props: {
  card: PharmacyLoopRiskEscalationCardModel;
}) {
  return (
    <section
      className="pharmacy-recovery-card"
      data-testid="PharmacyLoopRiskEscalationCard"
      data-tone={props.card.tone}
      role={props.card.announcementRole}
      aria-live={props.card.announcementRole === "alert" ? "assertive" : "polite"}
      aria-label={props.card.title}
    >
      <header className="pharmacy-recovery-card__header">
        <div>
          <p className="pharmacy-recovery-kicker">Loop risk</p>
          <h3>{props.card.title}</h3>
        </div>
        <span className="pharmacy-recovery-pill" data-tone={props.card.tone}>
          {props.card.loopRiskLabel}
        </span>
      </header>
      <p className="pharmacy-recovery-card__summary">{props.card.summary}</p>
      <dl className="pharmacy-recovery-definition-list">
        <div>
          <dt>Reopen priority</dt>
          <dd>{props.card.reopenPriorityLabel}</dd>
        </div>
        <div>
          <dt>Supervisor state</dt>
          <dd>{props.card.supervisorStateLabel}</dd>
        </div>
      </dl>
      <ul className="pharmacy-recovery-inline-list">
        {props.card.autoBlockSummary.map((summary) => (
          <li key={summary}>{summary}</li>
        ))}
      </ul>
    </section>
  );
}

export function PharmacyRecoveryDecisionDock(props: {
  dock: PharmacyRecoveryDecisionDockModel;
  onRouteAction?: (action: PharmacyRecoveryDecisionDockActionModel) => void;
}) {
  return (
    <section
      className="pharmacy-recovery-card pharmacy-recovery-card--decision"
      data-testid="PharmacyRecoveryDecisionDock"
      data-tone={props.dock.tone}
      aria-label="Recovery decision dock"
    >
      <header className="pharmacy-recovery-card__header">
        <div>
          <p className="pharmacy-recovery-kicker">DecisionDock</p>
          <h3>{props.dock.title}</h3>
        </div>
        <span className="pharmacy-recovery-pill" data-tone={props.dock.tone}>
          {props.dock.currentOwnerLabel}
        </span>
      </header>
      <p className="pharmacy-recovery-card__summary">{props.dock.summary}</p>
      <article className="pharmacy-recovery-consequence">
        <strong>{props.dock.consequenceTitle}</strong>
        <p>{props.dock.consequenceSummary}</p>
      </article>
      <ul className="pharmacy-recovery-inline-list">
        {props.dock.closeBlockers.map((blocker) => (
          <li key={blocker}>{blocker}</li>
        ))}
      </ul>
      <div className="pharmacy-recovery-action-grid">
        <button
          type="button"
          className="pharmacy-recovery-button"
          data-testid="pharmacy-recovery-decisiondock-primary"
          data-route-target={props.dock.primaryAction.routeTarget}
          onClick={() => props.onRouteAction?.(props.dock.primaryAction)}
        >
          {props.dock.primaryAction.label}
        </button>
        {props.dock.secondaryActions.map((action) => (
          <button
            key={action.actionId}
            type="button"
            className="pharmacy-recovery-button pharmacy-recovery-button--ghost"
            data-testid={`pharmacy-recovery-decisiondock-${action.actionId}`}
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

export function PharmacyRecoveryControlPanel(props: {
  preview: PharmacyBounceBackRecoveryPanelModel;
  onOpenOriginalRequest?: () => void;
}) {
  return (
    <section
      className="pharmacy-recovery-control"
      data-testid="PharmacyRecoveryControlPanel"
      data-visual-mode={props.preview.visualMode}
      data-surface-state={props.preview.surfaceState}
      aria-label="Bounce-back and reopen recovery workbench"
    >
      <PharmacyReopenedCaseBanner banner={props.preview.banner} />
      <div className="pharmacy-recovery-control__layout">
        <div className="pharmacy-recovery-control__main">
          <PharmacyBounceBackQueue queue={props.preview.queue} />
          <PharmacyReopenDiffStrip diffStrip={props.preview.reopenDiffStrip} />
          <OpenOriginalRequestAction
            action={props.preview.openOriginalRequestAction}
            onOpenOriginalRequest={props.onOpenOriginalRequest}
          />
        </div>
        <aside className="pharmacy-recovery-control__rail">
          <PharmacyUrgentReturnMode mode={props.preview.urgentReturnMode} />
          <PharmacyReturnMessagePreview preview={props.preview.returnMessagePreview} />
          <PharmacyLoopRiskEscalationCard card={props.preview.loopRiskEscalationCard} />
        </aside>
      </div>
    </section>
  );
}
