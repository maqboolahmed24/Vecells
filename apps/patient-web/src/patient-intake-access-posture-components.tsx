import { useEffect, useId, useRef, useState } from "react";
import type { PatientAccessSurfaceView } from "./patient-intake-access-postures";

function AccessPostureSummary({
  posture,
}: {
  posture: PatientAccessSurfaceView;
}) {
  if (posture.summaryVisibility === "hidden") {
    return (
      <div
        className="patient-intake-mission-frame__access-summary-card"
        data-testid="access-posture-hidden-summary"
      >
        <strong>Last-safe summary</strong>
        <p>{posture.maskedSummaryLabel}</p>
      </div>
    );
  }

  return (
    <div
      className="patient-intake-mission-frame__access-summary-card"
      data-testid="access-posture-summary-card"
    >
      <strong>Last-safe summary</strong>
      <dl className="patient-intake-mission-frame__access-summary-list">
        {posture.summaryChips.map((chip) => (
          <div key={`${chip.label}:${chip.value}`}>
            <dt>{chip.label}</dt>
            <dd>{chip.value}</dd>
          </div>
        ))}
      </dl>
      <p>{posture.maskedSummaryLabel}</p>
    </div>
  );
}

function accessPostureStripSupportCopy(posture: PatientAccessSurfaceView): string {
  if (posture.summaryVisibility === "hidden") {
    return "Some details stay hidden until this check is complete.";
  }

  return "Private details stay masked until this request is safe to show.";
}

function AccessPostureCard({
  posture,
  onPrimaryAction,
  onSecondaryAction,
}: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  return (
    <section
      className="patient-intake-mission-frame__access-posture-card"
      data-tone={posture.tone}
      data-posture-kind={posture.postureKind}
      data-testid="patient-intake-access-posture-card"
      tabIndex={-1}
      style={{ maxWidth: `${posture.maxWidthPx}px` }}
    >
      <div className="patient-intake-mission-frame__access-posture-head">
        <span>Safe recovery</span>
        <h3
          data-testid="access-posture-title"
          tabIndex={posture.focusTarget === "title" ? -1 : undefined}
          data-access-posture-autofocus={posture.focusTarget === "title" ? "true" : "false"}
        >
          {posture.title}
        </h3>
        <p>{posture.explanation}</p>
      </div>
      <div className="patient-intake-mission-frame__access-posture-grid">
        <div className="patient-intake-mission-frame__access-posture-kept-card">
          <strong>What we kept</strong>
          <ul>
            {posture.keptItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <AccessPostureSummary posture={posture} />
      </div>
      <div className="patient-intake-mission-frame__access-posture-actions">
        <button
          type="button"
          className="patient-intake-mission-frame__primary-button"
          onClick={onPrimaryAction}
          data-testid="access-posture-dominant-action"
          data-access-posture-autofocus={posture.focusTarget === "primary_action" ? "true" : "false"}
        >
          {posture.primaryAction.label}
        </button>
        {posture.secondaryAction && onSecondaryAction ? (
          <button
            type="button"
            className="patient-intake-mission-frame__ghost-button"
            onClick={onSecondaryAction}
            data-testid="access-posture-secondary-action"
          >
            {posture.secondaryAction.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function AccessPostureStrip({
  posture,
  onAction,
}: {
  posture: PatientAccessSurfaceView;
  onAction: () => void;
}) {
  const liveRegionId = useId();
  const [announcement, setAnnouncement] = useState(posture.stripAnnouncement);
  const lastAnnouncementRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAnnouncementRef.current === posture.liveAnnouncement) {
      return;
    }
    lastAnnouncementRef.current = posture.liveAnnouncement;
    setAnnouncement(posture.stripAnnouncement);
  }, [posture.liveAnnouncement, posture.stripAnnouncement]);

  return (
    <section
      className="patient-intake-mission-frame__status-strip patient-intake-mission-frame__status-strip--access"
      data-testid="access-posture-strip"
      data-tone={posture.tone}
      data-posture-kind={posture.postureKind}
      aria-describedby={liveRegionId}
    >
      <div className="patient-intake-mission-frame__status-cluster patient-intake-mission-frame__status-cluster--left">
        <span
          className="patient-intake-mission-frame__state-mark"
          data-tone={posture.tone === "blocked" ? "review" : "continuity"}
          aria-hidden="true"
        >
          <span data-glyph={posture.tone === "blocked" ? "hold" : "bridge"} />
        </span>
        <div className="patient-intake-mission-frame__status-stack">
          <span className="patient-intake-mission-frame__status-kicker">Access status</span>
          <strong>{posture.stripLabel}</strong>
        </div>
      </div>
      <div className="patient-intake-mission-frame__status-cluster patient-intake-mission-frame__status-cluster--center">
        <p>{posture.stripDetail}</p>
        <span
          id={liveRegionId}
          className="patient-intake-mission-frame__sr-status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </span>
        <small>{accessPostureStripSupportCopy(posture)}</small>
      </div>
      <div className="patient-intake-mission-frame__status-cluster patient-intake-mission-frame__status-cluster--right">
        <button
          type="button"
          className="patient-intake-mission-frame__status-action"
          data-tone={posture.tone === "blocked" ? "review" : "continuity"}
          onClick={onAction}
          data-testid="access-posture-strip-action"
        >
          {posture.stripActionLabel}
        </button>
      </div>
    </section>
  );
}

export function AccessUpliftPendingPanel(props: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  return (
    <div data-testid="access-uplift-pending-panel">
      <AccessPostureCard {...props} />
    </div>
  );
}

export function ReadOnlyReturnFrame(props: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  return (
    <div data-testid="read-only-return-frame">
      <AccessPostureCard {...props} />
    </div>
  );
}

export function ClaimPendingFrame(props: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  return (
    <div data-testid="claim-pending-frame">
      <AccessPostureCard {...props} />
    </div>
  );
}

export function IdentityHoldBridge(props: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  return (
    <div data-testid="identity-hold-bridge">
      <AccessPostureCard {...props} />
    </div>
  );
}

export function RebindRequiredBridge(props: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  return (
    <div data-testid="rebind-required-bridge">
      <AccessPostureCard {...props} />
    </div>
  );
}

export function StaleDraftMappedToRequestNotice(props: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  return (
    <div data-testid="stale-draft-notice">
      <AccessPostureCard {...props} />
    </div>
  );
}

export function EmbeddedDriftRecoveryFrame(props: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  return (
    <div data-testid="embedded-drift-recovery-frame">
      <AccessPostureCard {...props} />
    </div>
  );
}

export function AccessPostureCanvas({
  posture,
  onPrimaryAction,
  onSecondaryAction,
}: {
  posture: PatientAccessSurfaceView;
  onPrimaryAction: () => void;
  onSecondaryAction: (() => void) | null;
}) {
  switch (posture.postureKind) {
    case "uplift_pending":
      return (
        <AccessUpliftPendingPanel
          posture={posture}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
        />
      );
    case "read_only_return":
      return (
        <ReadOnlyReturnFrame
          posture={posture}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
        />
      );
    case "claim_pending":
      return (
        <ClaimPendingFrame
          posture={posture}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
        />
      );
    case "identity_hold":
      return (
        <IdentityHoldBridge
          posture={posture}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
        />
      );
    case "rebind_required":
      return (
        <RebindRequiredBridge
          posture={posture}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
        />
      );
    case "embedded_drift":
      return (
        <EmbeddedDriftRecoveryFrame
          posture={posture}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
        />
      );
    case "stale_draft_mapped_to_request":
      return (
        <StaleDraftMappedToRequestNotice
          posture={posture}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
        />
      );
    default:
      return null;
  }
}
