import { useEffect, useId, useState } from "react";
import type { UrgentOutcomeSurfaceView } from "./patient-intake-urgent-outcome";

function PathwaySplitMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="patient-intake-mission-frame__pathway-split-mark"
    >
      <path d="M10 16H32C44 16 54 26 54 38V48" />
      <path d="M10 48H20C28 48 34 42 34 34V16" />
      <circle cx="10" cy="16" r="4" />
      <circle cx="10" cy="48" r="4" />
      <circle cx="54" cy="48" r="4" />
    </svg>
  );
}

function OutcomeStatusPill({ outcome }: { outcome: UrgentOutcomeSurfaceView }) {
  return (
    <span
      className="patient-intake-mission-frame__urgent-status-pill"
      data-testid="urgent-status-pill"
      data-tone={outcome.statusTone}
      data-request-safety-state={outcome.requestSafetyState ?? ""}
      data-settlement-state={outcome.urgentDiversionSettlementState}
    >
      {outcome.statusLabel}
    </span>
  );
}

function SummaryContextCard({ outcome }: { outcome: UrgentOutcomeSurfaceView }) {
  return (
    <aside
      className="patient-intake-mission-frame__urgent-support-summary"
      data-testid="urgent-support-summary"
    >
      <strong>{outcome.summaryContextTitle}</strong>
      <ul>
        {outcome.summaryContextLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="patient-intake-mission-frame__urgent-support-note">
        <span>Continuity note</span>
        <p>{outcome.continuityNote}</p>
      </div>
    </aside>
  );
}

export function UrgentPathwayFrame({
  outcome,
  onIssueUrgentOutcome,
}: {
  outcome: UrgentOutcomeSurfaceView;
  onIssueUrgentOutcome: () => void;
}) {
  const disclosureId = useId();
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [handoffActive, setHandoffActive] = useState(false);

  useEffect(() => {
    setHandoffActive(false);
    setDisclosureOpen(false);
  }, [outcome.variant]);

  const onPrimaryAction = () => {
    setHandoffActive(true);
    if (outcome.variant === "urgent_required_pending") {
      onIssueUrgentOutcome();
    }
  };

  const onSecondaryAction = () => {
    setDisclosureOpen((current) => !current);
  };

  return (
    <div
      className="patient-intake-mission-frame__urgent-pathway-frame"
      data-testid="urgent-pathway-frame"
      data-outcome-variant={outcome.variant}
      data-copy-variant-ref={outcome.copyVariantRef}
      data-artifact-state={outcome.artifactState}
      data-visibility-tier={outcome.visibilityTier}
      data-navigation-policy={outcome.outboundNavigationGrantPolicyRef}
    >
      <div className="patient-intake-mission-frame__urgent-intro">
        <div className="patient-intake-mission-frame__urgent-intro-mark">
          <PathwaySplitMark />
        </div>
        <div className="patient-intake-mission-frame__urgent-intro-copy">
          <OutcomeStatusPill outcome={outcome} />
          <h3 data-testid="urgent-outcome-title">{outcome.title}</h3>
          <p>{outcome.summary}</p>
        </div>
      </div>

      <section
        className="patient-intake-mission-frame__urgent-primary-card"
        data-testid={
          outcome.variant === "urgent_required_pending"
            ? "urgent-required-pending-settlement-card"
            : "urgent-issued-guidance-card"
        }
        data-tone={outcome.statusTone}
      >
        <div className="patient-intake-mission-frame__urgent-card-copy">
          {outcome.urgencySentences.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </div>
        <div className="patient-intake-mission-frame__urgent-action-group">
          <button
            type="button"
            className="patient-intake-mission-frame__urgent-primary-button"
            data-testid={outcome.dominantAction.dataTestId}
            data-outcome-autofocus="true"
            data-navigation-grant-id={outcome.dominantAction.navigationGrant?.grantId ?? ""}
            data-navigation-destination-type={
              outcome.dominantAction.navigationGrant?.destinationType ?? ""
            }
            onClick={onPrimaryAction}
          >
            {outcome.dominantAction.label}
          </button>
        </div>
        <div
          className="patient-intake-mission-frame__urgent-handoff-note"
          data-testid="urgent-handoff-note"
          data-handoff-active={handoffActive ? "true" : "false"}
        >
          <span>Governed handoff</span>
          <p>{outcome.handoffNote}</p>
        </div>
      </section>

      <SummaryContextCard outcome={outcome} />

      <section
        className="patient-intake-mission-frame__urgent-rationale"
        data-testid="urgent-rationale-disclosure"
      >
        <button
          type="button"
          className="patient-intake-mission-frame__urgent-rationale-toggle"
          data-testid={outcome.secondaryAction?.dataTestId ?? "urgent-rationale-toggle"}
          aria-expanded={disclosureOpen}
          aria-controls={disclosureId}
          onClick={onSecondaryAction}
        >
          {outcome.rationaleDisclosureLabel}
        </button>
        <div
          id={disclosureId}
          hidden={!disclosureOpen}
          className="patient-intake-mission-frame__urgent-rationale-panel"
        >
          <strong>{outcome.rationaleHeading}</strong>
          <p>{outcome.rationaleBody}</p>
        </div>
      </section>

      <section className="patient-intake-mission-frame__urgent-support-band">
        <strong>{outcome.supportSummaryTitle}</strong>
        <ul>
          {outcome.supportSummaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <p className="patient-intake-mission-frame__visually-hidden" aria-live="polite">
        {outcome.liveRegionMessage}
      </p>
    </div>
  );
}

export function FailedSafeSafetyRecoveryCard({
  outcome,
  onReturnToReview,
}: {
  outcome: UrgentOutcomeSurfaceView;
  onReturnToReview: () => void;
}) {
  const disclosureId = useId();
  const [handoffActive, setHandoffActive] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);

  return (
    <div
      className="patient-intake-mission-frame__urgent-pathway-frame patient-intake-mission-frame__urgent-pathway-frame--failed-safe"
      data-testid="failed-safe-recovery-card"
      data-copy-variant-ref={outcome.copyVariantRef}
      data-artifact-state={outcome.artifactState}
      data-visibility-tier={outcome.visibilityTier}
    >
      <div className="patient-intake-mission-frame__urgent-intro">
        <div className="patient-intake-mission-frame__urgent-intro-mark">
          <PathwaySplitMark />
        </div>
        <div className="patient-intake-mission-frame__urgent-intro-copy">
          <OutcomeStatusPill outcome={outcome} />
          <h3 data-testid="failed-safe-title">{outcome.title}</h3>
          <p>{outcome.summary}</p>
        </div>
      </div>

      <section
        className="patient-intake-mission-frame__urgent-primary-card patient-intake-mission-frame__urgent-primary-card--failed-safe"
        data-tone="failed_safe"
      >
        <div className="patient-intake-mission-frame__urgent-card-copy">
          {outcome.urgencySentences.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </div>
        <div className="patient-intake-mission-frame__urgent-action-group">
          <button
            type="button"
            className="patient-intake-mission-frame__urgent-primary-button patient-intake-mission-frame__urgent-primary-button--failed-safe"
            data-testid={outcome.dominantAction.dataTestId}
            data-outcome-autofocus="true"
            data-navigation-grant-id={outcome.dominantAction.navigationGrant?.grantId ?? ""}
            data-navigation-destination-type={
              outcome.dominantAction.navigationGrant?.destinationType ?? ""
            }
            onClick={() => setHandoffActive(true)}
          >
            {outcome.dominantAction.label}
          </button>
          {outcome.secondaryAction ? (
            <button
              type="button"
              className="patient-intake-mission-frame__urgent-secondary-button"
              data-testid={outcome.secondaryAction.dataTestId}
              onClick={onReturnToReview}
            >
              {outcome.secondaryAction.label}
            </button>
          ) : null}
        </div>
        <div
          className="patient-intake-mission-frame__urgent-handoff-note"
          data-testid="failed-safe-handoff-note"
          data-handoff-active={handoffActive ? "true" : "false"}
        >
          <span>Governed handoff</span>
          <p>{outcome.handoffNote}</p>
        </div>
      </section>

      <SummaryContextCard outcome={outcome} />

      <section
        className="patient-intake-mission-frame__urgent-rationale"
        data-testid="failed-safe-rationale-disclosure"
      >
        <button
          type="button"
          className="patient-intake-mission-frame__urgent-rationale-toggle"
          aria-expanded={disclosureOpen}
          aria-controls={disclosureId}
          onClick={() => setDisclosureOpen((current) => !current)}
        >
          {outcome.rationaleDisclosureLabel}
        </button>
        <div
          id={disclosureId}
          hidden={!disclosureOpen}
          className="patient-intake-mission-frame__urgent-rationale-panel"
        >
          <strong>{outcome.rationaleHeading}</strong>
          <p>{outcome.rationaleBody}</p>
        </div>
      </section>

      <section className="patient-intake-mission-frame__urgent-support-band">
        <strong>{outcome.supportSummaryTitle}</strong>
        <ul>
          {outcome.supportSummaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <p className="patient-intake-mission-frame__visually-hidden" aria-live="polite">
        {outcome.liveRegionMessage}
      </p>
    </div>
  );
}
