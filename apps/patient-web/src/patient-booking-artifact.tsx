import "./patient-booking-artifact.css";
import {
  BookingResponsiveStage,
  BookingStickyActionTray,
  useBookingResponsive,
} from "./patient-booking-responsive";
import {
  PATIENT_BOOKING_ARTIFACT_TASK_ID,
  PATIENT_BOOKING_ARTIFACT_VISUAL_MODE,
  resolvePatientBookingArtifactProjection,
  type BookingArtifactActionReadiness,
  type BookingArtifactRow,
} from "./patient-booking-artifact.model";
import type {
  BookingArtifactRouteMode,
  BookingArtifactRouteSource,
} from "./patient-booking-workspace.model";

function artifactRowTestId(prefix: string, label: string): string {
  return `${prefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function RowList({
  rows,
  prefix,
}: {
  rows: readonly BookingArtifactRow[];
  prefix: string;
}) {
  return (
    <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
      {rows.map((row) => (
        <div
          key={`${prefix}-${row.label}`}
          className="patient-booking__summary-row"
          data-testid={artifactRowTestId(prefix, row.label)}
        >
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function actionTone(readiness: BookingArtifactActionReadiness): "safe" | "warn" | "blocked" {
  switch (readiness) {
    case "ready":
      return "safe";
    case "summary_only":
      return "warn";
    case "blocked":
    default:
      return "blocked";
  }
}

function postureLabel(readiness: BookingArtifactActionReadiness): string {
  if (readiness === "ready") {
    return "Ready";
  }
  if (readiness === "summary_only") {
    return "Summary only";
  }
  return "Blocked";
}

export function AppointmentReceiptSummary({
  appointmentHeading,
  summaryLead,
  rows,
  reminderRows,
}: {
  appointmentHeading: string;
  summaryLead: string;
  rows: readonly BookingArtifactRow[];
  reminderRows: readonly BookingArtifactRow[];
}) {
  return (
    <section className="patient-booking__artifact-card" data-testid="appointment-receipt-summary">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">AppointmentReceiptSummary</span>
        <h3>{appointmentHeading}</h3>
      </div>
      <p className="patient-booking__artifact-copy">{summaryLead}</p>
      <RowList rows={rows} prefix="artifact-receipt" />
      <div className="patient-booking__artifact-subsection">
        <span className="patient-booking__eyebrow">Reminder status</span>
        <RowList rows={reminderRows} prefix="artifact-reminder" />
      </div>
    </section>
  );
}

export function AttendanceInstructionPanel({
  primaryInstruction,
  rows,
}: {
  primaryInstruction: string;
  rows: readonly BookingArtifactRow[];
}) {
  return (
    <section className="patient-booking__artifact-card" data-testid="artifact-attendance-panel">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">AttendanceInstructionPanel</span>
        <h3>How to attend</h3>
      </div>
      <p className="patient-booking__artifact-attendance-lead">{primaryInstruction}</p>
      <RowList rows={rows} prefix="artifact-attendance" />
    </section>
  );
}

export function CalendarExportSummarySheet({
  rows,
  grantState,
}: {
  rows: readonly BookingArtifactRow[];
  grantState: string;
}) {
  return (
    <section
      className="patient-booking__artifact-sheet patient-booking__artifact-sheet--calendar"
      data-testid="calendar-export-summary-sheet"
      data-grant-state={grantState}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">CalendarExportSummarySheet</span>
        <h3>Calendar summary</h3>
      </div>
      <p className="patient-booking__artifact-copy">
        Review the event meaning here before any export leaves the shell.
      </p>
      <RowList rows={rows} prefix="artifact-calendar" />
    </section>
  );
}

export function PrintableAppointmentView({
  rows,
  printPosture,
}: {
  rows: readonly BookingArtifactRow[];
  printPosture: string;
}) {
  return (
    <section
      className="patient-booking__artifact-sheet patient-booking__artifact-sheet--print"
      data-testid="printable-appointment-view"
      data-print-posture={printPosture}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">PrintableAppointmentView</span>
        <h3>Print-ready summary</h3>
      </div>
      <p className="patient-booking__artifact-copy">
        The printable meaning stays aligned with the on-screen receipt and attendance instructions.
      </p>
      <RowList rows={rows} prefix="artifact-print" />
    </section>
  );
}

export function DirectionsHandoffPanel({
  title,
  rows,
  handoffReadiness,
  testId,
}: {
  title: string;
  rows: readonly BookingArtifactRow[];
  handoffReadiness: string;
  testId: string;
}) {
  return (
    <section
      className="patient-booking__artifact-sheet patient-booking__artifact-sheet--handoff"
      data-testid={testId}
      data-handoff-readiness={handoffReadiness}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">DirectionsHandoffPanel</span>
        <h3>{title}</h3>
      </div>
      <p className="patient-booking__artifact-copy">
        Handoff posture stays bound to the same appointment anchor and return-safe route.
      </p>
      <RowList rows={rows} prefix={testId} />
    </section>
  );
}

export function BookingArtifactParityView({
  parityRows,
  metadataRows,
}: {
  parityRows: readonly BookingArtifactRow[];
  metadataRows: readonly BookingArtifactRow[];
}) {
  return (
    <aside className="patient-booking__artifact-rail" data-testid="booking-artifact-parity-view">
      <section className="patient-booking__artifact-card">
        <div className="patient-booking__section-head">
          <span className="patient-booking__eyebrow">BookingArtifactParityView</span>
          <h3>Parity evidence</h3>
        </div>
        <RowList rows={parityRows} prefix="artifact-parity" />
      </section>
      <section className="patient-booking__artifact-card">
        <div className="patient-booking__section-head">
          <span className="patient-booking__eyebrow">Artifact metadata</span>
          <h3>Rules and grant evidence</h3>
        </div>
        <RowList rows={metadataRows} prefix="artifact-metadata" />
      </section>
    </aside>
  );
}

export function BookingArtifactActionTray({
  actions,
  activeMode,
  onSelectMode,
}: {
  actions: ReturnType<typeof resolvePatientBookingArtifactProjection>["actionTray"];
  activeMode: BookingArtifactRouteMode;
  onSelectMode: (mode: BookingArtifactRouteMode) => void;
}) {
  return (
    <section className="patient-booking__artifact-card" data-testid="booking-artifact-action-tray">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingArtifactActionTray</span>
        <h3>Secondary artifact actions</h3>
      </div>
      <div className="patient-booking__artifact-action-grid">
        {actions.map((action) => (
          <button
            key={action.mode}
            type="button"
            className={
              action.mode === activeMode
                ? "patient-booking__primary-action"
                : "patient-booking__secondary-action"
            }
            data-testid={`artifact-mode-${action.mode}`}
            data-mode-ready={action.readiness}
            aria-pressed={action.mode === activeMode}
            onClick={() => onSelectMode(action.mode)}
          >
            <span>{action.label}</span>
            <small>{postureLabel(action.readiness)}</small>
          </button>
        ))}
      </div>
      <ul className="patient-booking__artifact-action-notes">
        {actions.map((action) => (
          <li key={`${action.mode}-note`} data-tone={actionTone(action.readiness)}>
            <strong>{action.label}</strong>
            <span>{action.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PatientBookingArtifactFrame({
  bookingCaseId,
  artifactSource,
  artifactMode,
  onSelectMode,
  onReturnToSource,
  onSupportAction,
  supportActionLabel,
}: {
  bookingCaseId: string;
  artifactSource: BookingArtifactRouteSource;
  artifactMode: BookingArtifactRouteMode;
  onSelectMode: (mode: BookingArtifactRouteMode) => void;
  onReturnToSource: () => void;
  onSupportAction: () => void;
  supportActionLabel: string;
}) {
  const responsive = useBookingResponsive();
  const projection = resolvePatientBookingArtifactProjection({
    bookingCaseId,
    source: artifactSource,
    mode: artifactMode,
  });
  const channelGrantState =
    responsive.embeddedMode === "nhs_app" && projection.grantState === "granted"
      ? "summary_only"
      : projection.grantState;
  const channelPrintPosture =
    responsive.embeddedMode === "nhs_app" && projection.printPosture === "ready"
      ? "summary_only"
      : projection.printPosture;
  const channelHandoffReadiness =
    responsive.embeddedMode === "nhs_app" && projection.handoffReadiness === "ready"
      ? "summary_only"
      : projection.handoffReadiness;

  const modePanel =
    artifactMode === "calendar" ? (
      <CalendarExportSummarySheet rows={projection.calendarRows} grantState={channelGrantState} />
    ) : artifactMode === "print" ? (
      <PrintableAppointmentView rows={projection.printRows} printPosture={channelPrintPosture} />
    ) : artifactMode === "directions" ? (
      <DirectionsHandoffPanel
        title="Directions handoff"
        rows={projection.directionsRows}
        handoffReadiness={channelHandoffReadiness}
        testId="directions-handoff-panel"
      />
    ) : artifactMode === "browser_handoff" ? (
      <DirectionsHandoffPanel
        title="Browser handoff"
        rows={projection.browserRows}
        handoffReadiness={channelHandoffReadiness}
        testId="browser-handoff-panel"
      />
    ) : (
      <section className="patient-booking__artifact-sheet" data-testid="artifact-receipt-sheet">
        <div className="patient-booking__section-head">
          <span className="patient-booking__eyebrow">Structured summary</span>
          <h3>Receipt-first appointment artifact</h3>
        </div>
        <p className="patient-booking__artifact-copy">
          The summary stays primary even when print, export, or handoff posture becomes ready.
        </p>
      </section>
    );

  return (
    <section
      className="patient-booking__artifact-stage"
      data-testid="patient-booking-artifact-frame"
      data-anchor-ref="booking-artifact-stage"
      tabIndex={-1}
      data-task-id={PATIENT_BOOKING_ARTIFACT_TASK_ID}
      data-visual-mode={PATIENT_BOOKING_ARTIFACT_VISUAL_MODE}
      data-artifact-mode={artifactMode}
      data-parity-posture={projection.parityPosture}
      data-grant-state={channelGrantState}
      data-print-posture={channelPrintPosture}
      data-handoff-readiness={channelHandoffReadiness}
      data-artifact-source={artifactSource}
      data-artifact-exposure={projection.artifactExposureState}
    >
      <BookingResponsiveStage
        stageName="PatientBookingArtifactFrame"
        testId="patient-booking-artifact-responsive-stage"
        railPlacement="end"
        foldedPinned={
          <section className="patient-booking__artifact-card patient-booking__artifact-card--compact">
            <span className="patient-booking__eyebrow">Pinned artifact summary</span>
            <strong>{projection.appointmentHeading}</strong>
            <p>{projection.primaryAttendanceInstruction}</p>
          </section>
        }
        railTitle="Parity and rules evidence"
        railToggleLabel="View artifact parity"
        rail={
          <BookingArtifactParityView
            parityRows={projection.parityRows}
            metadataRows={projection.metadataRows}
          />
        }
        supportTitle="Return and support"
        supportToggleLabel="View return actions"
        support={
          <section className="patient-booking__artifact-card" data-testid="artifact-return-panel">
            <div className="patient-booking__section-head">
              <span className="patient-booking__eyebrow">Return-safe actions</span>
              <h3>Return and continuity</h3>
            </div>
            <p className="patient-booking__artifact-copy">
              The same booking or manage shell remains the safe return target after any secondary artifact handoff.
            </p>
            <div className="patient-booking__artifact-inline-actions">
              <button
                type="button"
                className="patient-booking__secondary-action"
                data-testid="artifact-return-to-source"
                onClick={onReturnToSource}
              >
                {projection.returnLabel}
              </button>
              <button
                type="button"
                className="patient-booking__secondary-action"
                data-testid="artifact-support-action"
                onClick={onSupportAction}
              >
                {supportActionLabel}
              </button>
            </div>
          </section>
        }
        stickyTray={
          responsive.missionStackState === "folded" ? (
            <BookingStickyActionTray
              testId="artifact-sticky-action-tray"
              primaryTestId="artifact-sticky-primary"
              title={projection.returnLabel}
              detail="Artifact actions stay secondary to the summary and remain return-safe."
              primaryActionLabel={projection.returnLabel}
              primaryActionRef="return_to_source"
              onPrimaryAction={onReturnToSource}
              secondaryActionLabel={supportActionLabel}
              onSecondaryAction={onSupportAction}
            />
          ) : undefined
        }
        main={
          <div className="patient-booking__artifact-main">
            <section className="patient-booking__artifact-frame-banner">
              <div className="patient-booking__section-head">
                <span className="patient-booking__eyebrow">PatientBookingArtifactFrame</span>
                <h3>{projection.heading}</h3>
              </div>
              <p className="patient-booking__artifact-copy">{projection.summaryLead}</p>
              {responsive.embeddedMode === "nhs_app" ? (
                <div
                  className="patient-booking__artifact-embedded-note"
                  data-testid="artifact-embedded-note"
                >
                  Embedded delivery keeps export, print, and browser handoff in summary-safe posture unless the host can lawfully widen them.
                </div>
              ) : null}
            </section>
            <AppointmentReceiptSummary
              appointmentHeading={projection.appointmentHeading}
              summaryLead={projection.summaryLead}
              rows={projection.receiptRows}
              reminderRows={projection.reminderRows}
            />
            <AttendanceInstructionPanel
              primaryInstruction={projection.primaryAttendanceInstruction}
              rows={projection.attendanceRows}
            />
            <BookingArtifactActionTray
              actions={projection.actionTray}
              activeMode={artifactMode}
              onSelectMode={onSelectMode}
            />
            {modePanel}
          </div>
        }
      />
    </section>
  );
}
