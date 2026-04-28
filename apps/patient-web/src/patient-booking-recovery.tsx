import {
  PATIENT_BOOKING_RECOVERY_TASK_ID,
  PATIENT_BOOKING_RECOVERY_VISUAL_MODE,
  type BookingRecoveryActionProjection,
  type BookingRecoveryEnvelopeProjection,
} from "./patient-booking-recovery.model";
import "./patient-booking-recovery.css";

export function BookingRecoverySummaryCard({
  projection,
}: {
  projection: BookingRecoveryEnvelopeProjection;
}) {
  return (
    <section
      className="patient-booking__recovery-card patient-booking__recovery-card--summary"
      data-testid="BookingRecoverySummaryCard"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingRecoverySummaryCard</span>
        <h3>{projection.summaryCard.heading}</h3>
      </div>
      <p className="patient-booking__stage-copy">{projection.summaryCard.body}</p>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        {projection.summaryCard.rows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function BookingRecoveryReasonPanel({
  projection,
}: {
  projection: BookingRecoveryEnvelopeProjection;
}) {
  return (
    <section
      className="patient-booking__recovery-card patient-booking__recovery-card--reason"
      data-testid="BookingRecoveryReasonPanel"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingRecoveryReasonPanel</span>
        <h3>{projection.reasonPanel.heading}</h3>
      </div>
      <p className="patient-booking__stage-copy">{projection.reasonPanel.body}</p>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        {projection.reasonPanel.rows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ActionButton({
  action,
  onAction,
}: {
  action: BookingRecoveryActionProjection;
  onAction: (action: BookingRecoveryActionProjection) => void;
}) {
  return (
    <button
      type="button"
      className={
        action.tone === "primary"
          ? "patient-booking__primary-action"
          : "patient-booking__secondary-action"
      }
      data-testid={`booking-recovery-action-${action.actionRef}`}
      onClick={() => onAction(action)}
    >
      {action.label}
    </button>
  );
}

export function BookingRecoveryNextActionCard({
  projection,
  onAction,
}: {
  projection: BookingRecoveryEnvelopeProjection;
  onAction: (action: BookingRecoveryActionProjection) => void;
}) {
  return (
    <section
      className="patient-booking__recovery-card patient-booking__recovery-card--next"
      data-testid="BookingRecoveryNextActionCard"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingRecoveryNextActionCard</span>
        <h3>{projection.nextActionCard.heading}</h3>
      </div>
      <p className="patient-booking__stage-copy">{projection.nextActionCard.body}</p>
      <div className="patient-booking__capability-actions">
        <ActionButton action={projection.nextActionCard.primaryAction} onAction={onAction} />
        {projection.nextActionCard.secondaryActions.map((action) => (
          <ActionButton key={action.actionRef} action={action} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

export function BookingIdentityHoldPanel({
  projection,
}: {
  projection: BookingRecoveryEnvelopeProjection;
}) {
  if (!projection.identityHoldPanel) {
    return null;
  }
  return (
    <section
      className="patient-booking__recovery-card patient-booking__recovery-card--identity"
      data-testid="BookingIdentityHoldPanel"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingIdentityHoldPanel</span>
        <h3>{projection.identityHoldPanel.heading}</h3>
      </div>
      <p className="patient-booking__stage-copy">{projection.identityHoldPanel.body}</p>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        {projection.identityHoldPanel.rows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function BookingSecureLinkRecoveryFrame({
  projection,
}: {
  projection: BookingRecoveryEnvelopeProjection;
}) {
  if (!projection.secureLinkFrame) {
    return null;
  }
  return (
    <section
      className="patient-booking__recovery-card patient-booking__recovery-card--secure-link"
      data-testid="BookingSecureLinkRecoveryFrame"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingSecureLinkRecoveryFrame</span>
        <h3>{projection.secureLinkFrame.heading}</h3>
      </div>
      <p className="patient-booking__stage-copy">{projection.secureLinkFrame.body}</p>
    </section>
  );
}

export function BookingContactRepairMorph({
  projection,
}: {
  projection: BookingRecoveryEnvelopeProjection;
}) {
  if (!projection.contactRepairMorph) {
    return null;
  }
  return (
    <section
      className="patient-booking__recovery-card patient-booking__recovery-card--repair"
      data-testid="BookingContactRepairMorph"
      data-repair-path={projection.contactRepairMorph.repairPath}
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingContactRepairMorph</span>
        <h3>{projection.contactRepairMorph.heading}</h3>
      </div>
      <p className="patient-booking__stage-copy">{projection.contactRepairMorph.body}</p>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        {projection.contactRepairMorph.rows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function BookingRecoveryReturnStub({
  projection,
  onReturn,
}: {
  projection: BookingRecoveryEnvelopeProjection;
  onReturn: () => void;
}) {
  return (
    <section
      className="patient-booking__recovery-card patient-booking__recovery-card--return"
      data-testid="BookingRecoveryReturnStub"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingRecoveryReturnStub</span>
        <h3>{projection.returnStub.heading}</h3>
      </div>
      <p className="patient-booking__stage-copy">{projection.returnStub.body}</p>
      <button
        type="button"
        className="patient-booking__secondary-action"
        data-testid="booking-recovery-return-action"
        onClick={onReturn}
      >
        {projection.returnStub.actionLabel}
      </button>
    </section>
  );
}

export function BookingRecoveryShell({
  projection,
  onAction,
  onReturn,
}: {
  projection: BookingRecoveryEnvelopeProjection;
  onAction: (action: BookingRecoveryActionProjection) => void;
  onReturn: () => void;
}) {
  return (
    <section
      className="patient-booking__recovery-shell"
      data-testid="BookingRecoveryShell"
      data-task-id={PATIENT_BOOKING_RECOVERY_TASK_ID}
      data-visual-mode={PATIENT_BOOKING_RECOVERY_VISUAL_MODE}
      data-recovery-reason={projection.recoveryReason}
      data-summary-tier={projection.summaryTier}
      data-identity-hold-state={projection.identityHoldState}
      data-next-safe-action={projection.nextSafeActionRef}
      data-reentry-route-family={projection.reentryRouteFamily}
      data-channel-mode={projection.channelMode}
      data-recovery-tuple-hash={projection.recoveryTupleHash}
      data-selected-anchor-ref={projection.selectedAnchorRef}
      data-tone={projection.tone}
    >
      <div className="patient-booking__recovery-live" role="status" aria-live="polite">
        {projection.liveAnnouncement}
      </div>
      <BookingSecureLinkRecoveryFrame projection={projection} />
      <div className="patient-booking__recovery-layout">
        <aside className="patient-booking__recovery-rail">
          <BookingRecoverySummaryCard projection={projection} />
          <BookingIdentityHoldPanel projection={projection} />
        </aside>
        <div className="patient-booking__recovery-main">
          <BookingRecoveryReasonPanel projection={projection} />
          <BookingRecoveryNextActionCard projection={projection} onAction={onAction} />
          <BookingContactRepairMorph projection={projection} />
        </div>
        <aside className="patient-booking__recovery-side">
          <BookingRecoveryReturnStub projection={projection} onReturn={onReturn} />
        </aside>
      </div>
    </section>
  );
}
