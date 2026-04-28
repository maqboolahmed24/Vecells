import { useEffect, useId, useState } from "react";
import { PharmacyAccessibleStatusBadge } from "./pharmacy-accessibility-micro-interactions";

export type PharmacyOpeningStateChipTone = "open" | "closed" | "watch" | "complete";

export interface PharmacyOpeningStateChipModel {
  label: string;
  tone: PharmacyOpeningStateChipTone;
  detail: string;
}

export interface PharmacyContactCardModel {
  title: string;
  summary: string;
  providerLabel: string;
  openingState: PharmacyOpeningStateChipModel;
  consultationModes: readonly string[];
  contactEndpoints: readonly string[];
  reasonCues: readonly string[];
}

export interface PharmacyReferralReferenceCardModel {
  title: string;
  summary: string;
  displayMode: "available" | "pending" | "suppressed";
  referenceLabel: string | null;
  referenceHashLabel: string | null;
  keepNote: string | null;
}

export interface PharmacyStatusTrackerStepModel {
  stepId: string;
  label: string;
  state: "complete" | "current" | "pending" | "attention";
  summary: string;
  detail: string;
}

export interface PharmacyStatusTrackerModel {
  title: string;
  summary: string;
  steps: readonly PharmacyStatusTrackerStepModel[];
}

export interface ChosenPharmacyConfirmationPageModel {
  title: string;
  summary: string;
  panelText: string;
  nextLabel: string;
}

export interface PharmacyNextStepPageModel {
  title: string;
  summary: string;
  whoOrWhereText: string | null;
  whenExpectationText: string | null;
  symptomsWorsenText: string;
  warningText: string | null;
}

export interface PharmacyOutcomePageModel {
  title: string;
  summary: string;
  calmCompletionText: string | null;
  warningText: string | null;
}

export interface PharmacyReviewNextStepPageModel {
  title: string;
  summary: string;
  reviewText: string;
  warningText: string | null;
  tone: "review" | "urgent";
  announcementRole: "status" | "alert";
}

export interface PharmacyContactRouteRepairStateModel {
  title: string;
  summary: string;
  detail: string;
  actionLabel: string;
  announcementRole: "alert";
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

function defaultTrackerStepId(steps: readonly PharmacyStatusTrackerStepModel[]): string | null {
  return (
    steps.find((step) => step.state === "attention" || step.state === "current")?.stepId ??
    steps[steps.length - 1]?.stepId ??
    null
  );
}

export function PharmacyOpeningStateChip(props: {
  chip: PharmacyOpeningStateChipModel;
  compact?: boolean;
}) {
  return (
    <PharmacyAccessibleStatusBadge
      label={props.chip.label}
      tone={props.chip.tone}
      contextLabel="Opening state"
      compact={props.compact}
      className={joinClasses(
        "pharmacy-patient-status-chip",
        props.compact && "pharmacy-patient-status-chip--compact",
      )}
      testId="PharmacyOpeningStateChip"
      title={props.chip.detail}
    />
  );
}

export function PharmacyContactCard(props: {
  card: PharmacyContactCardModel;
}) {
  return (
    <section
      className="pharmacy-patient-card"
      data-testid="PharmacyContactCard"
      aria-label={props.card.title}
    >
      <header className="pharmacy-patient-card__header">
        <div>
          <p className="pharmacy-patient-kicker">Chosen pharmacy</p>
          <h3>{props.card.title}</h3>
        </div>
        <PharmacyOpeningStateChip chip={props.card.openingState} compact />
      </header>
      <p className="pharmacy-patient-card__summary">{props.card.summary}</p>
      <div className="pharmacy-patient-card__body">
        <div className="pharmacy-patient-card__block">
          <strong>{props.card.providerLabel}</strong>
          <ul>
            {props.card.contactEndpoints.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
        <div className="pharmacy-patient-card__block">
          <strong>How the pharmacist may contact you</strong>
          <ul>
            {props.card.consultationModes.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
        {props.card.reasonCues.length > 0 ? (
          <div className="pharmacy-patient-card__block">
            <strong>Keep in mind</strong>
            <ul>
              {props.card.reasonCues.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PharmacyReferralReferenceCard(props: {
  card: PharmacyReferralReferenceCardModel;
}) {
  return (
    <section
      className="pharmacy-patient-card pharmacy-patient-card--reference"
      data-testid="PharmacyReferralReferenceCard"
      data-display-mode={props.card.displayMode}
      aria-label={props.card.title}
    >
      <header className="pharmacy-patient-card__header">
        <div>
          <p className="pharmacy-patient-kicker">Reference</p>
          <h3>{props.card.title}</h3>
        </div>
        <span className="pharmacy-patient-status-pill" data-tone={props.card.displayMode}>
          {titleCase(props.card.displayMode)}
        </span>
      </header>
      <p className="pharmacy-patient-card__summary">{props.card.summary}</p>
      <dl className="pharmacy-patient-inline-meta">
        <div>
          <dt>Referral reference</dt>
          <dd>{props.card.referenceLabel ?? "Still being prepared"}</dd>
        </div>
        <div>
          <dt>Reference set</dt>
          <dd>{props.card.referenceHashLabel ?? "Not available yet"}</dd>
        </div>
      </dl>
      {props.card.keepNote ? (
        <p className="pharmacy-patient-card__footnote">{props.card.keepNote}</p>
      ) : null}
    </section>
  );
}

export function PharmacyStatusTracker(props: {
  tracker: PharmacyStatusTrackerModel;
}) {
  const scopeId = useId();
  const [expandedStepId, setExpandedStepId] = useState<string | null>(() =>
    defaultTrackerStepId(props.tracker.steps),
  );

  useEffect(() => {
    setExpandedStepId(defaultTrackerStepId(props.tracker.steps));
  }, [props.tracker.steps]);

  return (
    <section
      className="pharmacy-patient-card"
      data-testid="PharmacyStatusTracker"
      aria-label={props.tracker.title}
    >
      <header className="pharmacy-patient-card__header">
        <div>
          <p className="pharmacy-patient-kicker">Status tracker</p>
          <h3>{props.tracker.title}</h3>
        </div>
      </header>
      <p className="pharmacy-patient-card__summary">{props.tracker.summary}</p>
      <ol className="pharmacy-patient-status-tracker__list">
        {props.tracker.steps.map((step) => {
          const panelId = `${scopeId}-${step.stepId}`;
          const expanded = expandedStepId === step.stepId;
          return (
            <li
              key={step.stepId}
              className="pharmacy-patient-status-tracker__item"
              data-state={step.state}
            >
              <button
                type="button"
                className="pharmacy-patient-status-tracker__button"
                data-testid={`pharmacy-status-step-${step.stepId}`}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() =>
                  setExpandedStepId((current) => (current === step.stepId ? null : step.stepId))
                }
              >
                <span className="pharmacy-patient-status-tracker__copy">
                  <strong>{step.label}</strong>
                  <span>{step.summary}</span>
                </span>
                <span className="pharmacy-patient-status-pill" data-tone={step.state}>
                  {titleCase(step.state)}
                </span>
              </button>
              <div
                className="pharmacy-patient-status-tracker__detail"
                id={panelId}
                hidden={!expanded}
              >
                <p>{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ChosenPharmacyConfirmationPage(props: {
  page: ChosenPharmacyConfirmationPageModel;
}) {
  return (
    <section
      className="pharmacy-patient-hero pharmacy-patient-hero--confirmation"
      data-testid="ChosenPharmacyConfirmationPage"
      aria-label={props.page.title}
    >
      <div className="pharmacy-patient-hero__panel">
        <p className="pharmacy-patient-kicker">Referral sent</p>
        <h3>{props.page.title}</h3>
        <p>{props.page.summary}</p>
      </div>
      <dl className="pharmacy-patient-hero__meta">
        <div>
          <dt>Reference</dt>
          <dd>{props.page.panelText}</dd>
        </div>
        <div>
          <dt>Next</dt>
          <dd>{props.page.nextLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function PharmacyNextStepPage(props: {
  page: PharmacyNextStepPageModel;
}) {
  return (
    <section
      className="pharmacy-patient-card pharmacy-patient-card--flow"
      data-testid="PharmacyNextStepPage"
      aria-label={props.page.title}
    >
      <header className="pharmacy-patient-card__header">
        <div>
          <p className="pharmacy-patient-kicker">Next step</p>
          <h3>{props.page.title}</h3>
        </div>
      </header>
      <p className="pharmacy-patient-card__summary">{props.page.summary}</p>
      <div className="pharmacy-patient-flow-grid">
        {props.page.whoOrWhereText ? (
          <article className="pharmacy-patient-flow-card">
            <strong>Who or where</strong>
            <p>{props.page.whoOrWhereText}</p>
          </article>
        ) : null}
        {props.page.whenExpectationText ? (
          <article className="pharmacy-patient-flow-card">
            <strong>When to expect an update</strong>
            <p>{props.page.whenExpectationText}</p>
          </article>
        ) : null}
        <article className="pharmacy-patient-flow-card">
          <strong>If symptoms get worse</strong>
          <p>{props.page.symptomsWorsenText}</p>
        </article>
        {props.page.warningText ? (
          <article className="pharmacy-patient-flow-card pharmacy-patient-flow-card--warning">
            <strong>Important</strong>
            <p>{props.page.warningText}</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}

export function PharmacyOutcomePage(props: {
  page: PharmacyOutcomePageModel;
}) {
  return (
    <section
      className="pharmacy-patient-hero pharmacy-patient-hero--outcome"
      data-testid="PharmacyOutcomePage"
      aria-label={props.page.title}
    >
      <div className="pharmacy-patient-hero__panel">
        <p className="pharmacy-patient-kicker">Outcome</p>
        <h3>{props.page.title}</h3>
        <p>{props.page.summary}</p>
      </div>
      <div className="pharmacy-patient-hero__stack">
        {props.page.calmCompletionText ? (
          <p className="pharmacy-patient-hero__support">{props.page.calmCompletionText}</p>
        ) : null}
        {props.page.warningText ? (
          <p className="pharmacy-patient-hero__support pharmacy-patient-hero__support--warning">
            {props.page.warningText}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function PharmacyReviewNextStepPage(props: {
  page: PharmacyReviewNextStepPageModel;
}) {
  return (
    <section
      className="pharmacy-patient-hero pharmacy-patient-hero--review"
      data-testid="PharmacyReviewNextStepPage"
      data-tone={props.page.tone}
      role={props.page.announcementRole}
      aria-live={props.page.announcementRole === "status" ? "polite" : "assertive"}
      aria-atomic="true"
      aria-label={props.page.title}
    >
      <div className="pharmacy-patient-hero__panel">
        <p className="pharmacy-patient-kicker">
          {props.page.tone === "urgent" ? "Urgent" : "Review"}
        </p>
        <h3>{props.page.title}</h3>
        <p>{props.page.summary}</p>
      </div>
      <div className="pharmacy-patient-hero__stack">
        <p className="pharmacy-patient-hero__support">{props.page.reviewText}</p>
        {props.page.warningText ? (
          <p className="pharmacy-patient-hero__support pharmacy-patient-hero__support--warning">
            {props.page.warningText}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function PharmacyContactRouteRepairState(props: {
  state: PharmacyContactRouteRepairStateModel;
}) {
  return (
    <section
      className="pharmacy-patient-hero pharmacy-patient-hero--repair"
      data-testid="PharmacyContactRouteRepairState"
      role={props.state.announcementRole}
      aria-live="assertive"
      aria-atomic="true"
      aria-label={props.state.title}
    >
      <div className="pharmacy-patient-hero__panel">
        <p className="pharmacy-patient-kicker">Contact route repair</p>
        <h3>{props.state.title}</h3>
        <p>{props.state.summary}</p>
      </div>
      <div className="pharmacy-patient-hero__stack">
        <p className="pharmacy-patient-hero__support">{props.state.detail}</p>
        <span className="pharmacy-patient-status-pill" data-tone="attention">
          {props.state.actionLabel}
        </span>
      </div>
    </section>
  );
}
