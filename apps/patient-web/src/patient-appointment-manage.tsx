import { startTransition, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import "./patient-appointment-manage.css";
import { OfferSelectionStage } from "./patient-booking-offer-selection";
import { BookingRecoveryShell } from "./patient-booking-recovery";
import {
  PATIENT_APPOINTMENT_MANAGE_TASK_ID,
  PATIENT_APPOINTMENT_MANAGE_VISUAL_MODE,
  resolvePatientAppointmentManageProjection,
  resolvePatientAppointmentManageProjectionByScenarioId,
  type AppointmentDetailFormPreset,
  type AppointmentManageActionProjection,
  type AppointmentManageSummaryRow,
  type PatientAppointmentManageProjection,
} from "./patient-appointment-manage.model";
import {
  resolveManageBookingRecoveryEnvelope,
  type BookingRecoveryActionProjection,
} from "./patient-booking-recovery.model";
import {
  BookingResponsiveStage,
  BookingStickyActionTray,
  ManageCompactSummarySheet,
  useBookingResponsive,
} from "./patient-booking-responsive";
import type { BookingArtifactRouteMode } from "./patient-booking-workspace.model";

const APPOINTMENT_MANAGE_RESTORE_STORAGE_KEY = "patient-appointment-manage-297::restore-bundle";

interface AppointmentManageRestoreBundle297 {
  readonly projectionName: "AppointmentManageRestoreBundle297";
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly scenarioId: string;
}

export interface PatientAppointmentDetailViewProps {
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly supportActionLabel: string;
  readonly returnLabel: string;
  readonly onSupportAction: () => void;
  readonly onOpenArtifactHost?: ((mode: BookingArtifactRouteMode) => void) | null;
  readonly onReturn: () => void;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function readRestoreBundle(): AppointmentManageRestoreBundle297 | null {
  const raw = safeWindow()?.sessionStorage.getItem(APPOINTMENT_MANAGE_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AppointmentManageRestoreBundle297;
    return parsed.projectionName === "AppointmentManageRestoreBundle297" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: AppointmentManageRestoreBundle297): void {
  safeWindow()?.sessionStorage.setItem(APPOINTMENT_MANAGE_RESTORE_STORAGE_KEY, JSON.stringify(bundle));
}

function resolveInitialProjection(
  bookingCaseId: string,
  shellContinuityKey: string,
): PatientAppointmentManageProjection {
  const restoreBundle = readRestoreBundle();
  const restoredProjection =
    restoreBundle?.bookingCaseId === bookingCaseId &&
    restoreBundle?.shellContinuityKey === shellContinuityKey
      ? resolvePatientAppointmentManageProjectionByScenarioId(restoreBundle.scenarioId)
      : null;
  const directProjection = resolvePatientAppointmentManageProjection(bookingCaseId);
  return (
    restoredProjection ??
    directProjection ??
    resolvePatientAppointmentManageProjection("booking_case_297_ready")!
  );
}

function focusBySelector(selector: string): void {
  safeDocument()?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
}

function SummaryList({
  title,
  rows,
  compact = false,
  testId,
}: {
  title: string;
  rows: readonly AppointmentManageSummaryRow[];
  compact?: boolean;
  testId?: string;
}) {
  return (
    <section className="patient-booking__manage-list" data-testid={testId}>
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">{title}</span>
        <h4>{title}</h4>
      </div>
      <dl
        className={`patient-booking__summary-list${compact ? " patient-booking__summary-list--compact" : ""}`}
      >
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} className="patient-booking__summary-row">
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
  testId,
  tone = "secondary",
  disabled = false,
  onAction,
}: {
  action: AppointmentManageActionProjection;
  testId?: string;
  tone?: "primary" | "secondary";
  disabled?: boolean;
  onAction: (action: AppointmentManageActionProjection) => void;
}) {
  return (
    <button
      type="button"
      className={tone === "primary" ? "patient-booking__primary-action" : "patient-booking__secondary-action"}
      data-testid={testId}
      data-action-scope={action.actionRef}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={() => onAction(action)}
    >
      {action.label}
    </button>
  );
}

export function AppointmentSummaryCard({
  projection,
  artifactEnabled,
  onArtifactAction,
}: {
  projection: PatientAppointmentManageProjection;
  artifactEnabled: boolean;
  onArtifactAction: (action: AppointmentManageActionProjection) => void;
}) {
  return (
    <section
      className="patient-booking__manage-card patient-booking__manage-card--summary"
      data-testid="appointment-summary-card"
      data-appointment-id={projection.appointmentId}
      data-confirmation-truth={projection.confirmationTruthState}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">AppointmentSummaryCard</span>
        <h3>{projection.appointmentHeading}</h3>
      </div>
      <div className="patient-booking__manage-summary-grid">
        <SummaryList title="Booked summary" rows={projection.appointmentRows} />
        <SummaryList title="Booking truth" rows={projection.appointmentMetaRows} compact />
      </div>
      <div className="patient-booking__manage-artifacts" data-artifact-exposure={projection.artifactExposureState}>
        <div>
          <span className="patient-booking__eyebrow">Summary-first actions</span>
          <p>
            {artifactEnabled
              ? "Print and directions stay available from the current artifact and navigation grants."
              : "Print and directions stay summary-only until the current artifact exposure becomes handoff-ready."}
          </p>
        </div>
        <div className="patient-booking__manage-inline-actions">
          {projection.artifactActions.map((action, index) => (
            <ActionButton
              key={`${action.label}-${index}`}
              action={action}
              disabled={!artifactEnabled}
              testId={`manage-artifact-action-${index}`}
              onAction={onArtifactAction}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function AttendanceInstructionPanel({
  projection,
}: {
  projection: PatientAppointmentManageProjection;
}) {
  return (
    <section
      className="patient-booking__manage-card"
      data-testid="attendance-instruction-panel"
      data-attendance-mode={projection.attendanceMode}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">AttendanceInstructionPanel</span>
        <h3>How to attend</h3>
      </div>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        {projection.attendanceRows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ManageActionDeck({
  projection,
  cancelDisabled,
  onOpenCancel,
  onAction,
}: {
  projection: PatientAppointmentManageProjection;
  cancelDisabled: boolean;
  onOpenCancel: (trigger: HTMLElement) => void;
  onAction: (action: AppointmentManageActionProjection) => void;
}) {
  const cancelAvailable =
    projection.manageExposureState === "writable" &&
    projection.manageCapabilityRefs.includes("appointment_cancel");
  const deckActions = projection.actionDeck;

  return (
    <section
      className="patient-booking__manage-card"
      data-testid="manage-action-deck"
      data-manage-capability={
        projection.manageCapabilityRefs.length > 0
          ? projection.manageCapabilityRefs.join("|")
          : "summary_only"
      }
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">ManageActionDeck</span>
        <h3>Safe actions available now</h3>
      </div>
      <p className="patient-booking__manage-copy">{projection.stateBody}</p>
      <div className="patient-booking__manage-inline-actions">
        <button
          type="button"
          className="patient-booking__danger-action"
          data-testid="manage-open-cancel"
          disabled={!cancelAvailable || cancelDisabled}
          aria-disabled={!cancelAvailable || cancelDisabled}
          onClick={(event) => onOpenCancel(event.currentTarget)}
        >
          Cancel appointment
        </button>
        {deckActions.map((action, index) => (
          <ActionButton
            key={`${action.actionRef}-${index}`}
            action={action}
            tone={index === 0 && action.actionRef !== "request_support" ? "primary" : "secondary"}
            testId={`manage-action-${action.actionRef}`}
            onAction={onAction}
          />
        ))}
      </div>
      {projection.manageExposureState !== "writable" ? (
        <p className="patient-booking__manage-note">
          Ordinary manage actions are read-only right now. The appointment summary stays visible while the route settles or recovers.
        </p>
      ) : null}
    </section>
  );
}

export function ReminderPreferencePanel({
  projection,
  repairExpanded,
  onAction,
}: {
  projection: PatientAppointmentManageProjection;
  repairExpanded: boolean;
  onAction: (action: AppointmentManageActionProjection) => void;
}) {
  return (
    <section
      className="patient-booking__manage-card patient-booking__manage-card--reminder"
      data-testid="reminder-preference-panel"
      data-reminder-exposure={projection.reminderExposureState}
      data-reminder-route-state={projection.reminderPanel.contactRouteState}
      data-anchor-ref="reminder-preference-panel"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">{projection.reminderPanel.heading}</span>
        <h3>Reminder and contact route</h3>
      </div>
      <p className="patient-booking__manage-copy">{projection.reminderPanel.body}</p>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        {projection.reminderPanel.preferenceRows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {repairExpanded || projection.reminderPanel.contactRouteState === "repair_required" ? (
        <div className="patient-booking__manage-repair" data-testid="manage-contact-repair-panel">
          <h4>Repair this reminder route in place</h4>
          <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
            {projection.reminderPanel.repairRows.map((row) => (
              <div key={row.label} className="patient-booking__summary-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      <div className="patient-booking__manage-inline-actions">
        {projection.reminderPanel.primaryAction ? (
          <ActionButton
            action={projection.reminderPanel.primaryAction}
            testId="manage-reminder-primary-action"
            tone="primary"
            onAction={onAction}
          />
        ) : null}
        {projection.reminderPanel.secondaryAction ? (
          <ActionButton
            action={projection.reminderPanel.secondaryAction}
            testId="manage-reminder-secondary-action"
            onAction={onAction}
          />
        ) : null}
      </div>
    </section>
  );
}

export function ManagePendingOrRecoveryPanel({
  projection,
  onAction,
}: {
  projection: PatientAppointmentManageProjection;
  onAction: (action: AppointmentManageActionProjection) => void;
}) {
  return (
    <section
      className="patient-booking__manage-card patient-booking__manage-card--state"
      data-testid="manage-pending-or-recovery-panel"
      data-view-kind={projection.viewKind}
      data-state-tone={projection.stateTone}
      data-continuity-state={projection.continuityState}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">ManagePendingOrRecoveryPanel</span>
        <h3>{projection.stateHeading}</h3>
      </div>
      <p className="patient-booking__manage-copy">{projection.stateBody}</p>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        {projection.pendingRows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="patient-booking__manage-note">{projection.supportNote}</p>
      {projection.actionDeck.length > 0 ? (
        <div className="patient-booking__manage-inline-actions">
          {projection.actionDeck.map((action, index) => (
            <ActionButton
              key={`${action.actionRef}-${index}`}
              action={action}
              tone={index === 0 ? "primary" : "secondary"}
              testId={`manage-state-action-${action.actionRef}`}
              onAction={onAction}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function AssistedFallbackStub({
  projection,
  returnLabel,
  onSupportAction,
  onReturn,
}: {
  projection: PatientAppointmentManageProjection;
  returnLabel: string;
  onSupportAction: () => void;
  onReturn: () => void;
}) {
  return (
    <section
      className="patient-booking__manage-card patient-booking__manage-card--support"
      data-testid="assisted-fallback-stub"
      data-anchor-ref="manage-support-panel"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">AssistedFallbackStub</span>
        <h3>{projection.supportPath.label}</h3>
      </div>
      <p className="patient-booking__manage-copy">{projection.supportPath.copy}</p>
      <div className="patient-booking__manage-inline-actions">
        <button
          type="button"
          className="patient-booking__secondary-action"
          data-testid="manage-support-action"
          onClick={onSupportAction}
        >
          {projection.supportPath.actionLabel}
        </button>
        <button
          type="button"
          className="patient-booking__secondary-action"
          data-testid="manage-return-action"
          onClick={onReturn}
        >
          Return to {returnLabel}
        </button>
      </div>
    </section>
  );
}

export function CancelAppointmentFlow({
  open,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button, textarea, [href], input, select, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !focusable || focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = safeDocument()?.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    dialog?.addEventListener("keydown", handleKeyDown);
    return () => dialog?.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="patient-booking__manage-dialog-backdrop">
      <div
        ref={dialogRef}
        className="patient-booking__manage-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-appointment-title"
        aria-describedby="cancel-appointment-body"
        data-testid="cancel-appointment-flow"
      >
        <div className="patient-booking__section-head">
          <span className="patient-booking__eyebrow">CancelAppointmentFlow</span>
          <h3 id="cancel-appointment-title">Cancel this appointment?</h3>
        </div>
        <p id="cancel-appointment-body" className="patient-booking__manage-copy">
          Cancelling stays in this shell and does not show quiet success until supplier truth is authoritative.
        </p>
        <label className="patient-booking__manage-field" htmlFor="cancel-reason">
          <span>Optional short reason</span>
          <textarea
            id="cancel-reason"
            value={reason}
            maxLength={120}
            rows={3}
            onChange={(event) => onReasonChange(event.currentTarget.value)}
          />
        </label>
        <div className="patient-booking__manage-inline-actions">
          <button
            type="button"
            className="patient-booking__danger-action"
            data-testid="cancel-appointment-confirm"
            onClick={onConfirm}
          >
            Confirm cancellation
          </button>
          <button
            type="button"
            className="patient-booking__secondary-action"
            data-testid="cancel-appointment-close"
            onClick={onClose}
          >
            Keep appointment
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppointmentDetailUpdateForm({
  draft,
  onChangeDraft,
  onReturnToSummary,
  onSubmit,
}: {
  draft: AppointmentDetailFormPreset;
  onChangeDraft: (draft: AppointmentDetailFormPreset) => void;
  onReturnToSummary: () => void;
  onSubmit: () => void;
}) {
  function update<K extends keyof AppointmentDetailFormPreset>(
    key: K,
    value: AppointmentDetailFormPreset[K],
  ): void {
    onChangeDraft({
      ...draft,
      [key]: value,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="patient-booking__manage-card" data-testid="appointment-detail-update-form">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">AppointmentDetailUpdateForm</span>
        <h3>Administrative updates</h3>
      </div>
      <form className="patient-booking__manage-form" onSubmit={handleSubmit}>
        <label className="patient-booking__manage-field" htmlFor="arrival-note">
          <span>Arrival note</span>
          <input
            id="arrival-note"
            value={draft.arrivalNote}
            onChange={(event) => update("arrivalNote", event.currentTarget.value)}
          />
        </label>
        <label className="patient-booking__manage-field" htmlFor="interpreter">
          <span>Interpreter needed</span>
          <select
            id="interpreter"
            value={draft.interpreter}
            onChange={(event) => update("interpreter", event.currentTarget.value as "no" | "yes")}
          >
            <option value="no">No interpreter needed</option>
            <option value="yes">Interpreter needed</option>
          </select>
        </label>
        <label className="patient-booking__manage-field" htmlFor="access-support">
          <span>Access support</span>
          <select
            id="access-support"
            value={draft.accessSupport}
            onChange={(event) =>
              update(
                "accessSupport",
                event.currentTarget.value as "standard" | "mobility_help" | "quiet_space",
              )
            }
          >
            <option value="standard">Standard access</option>
            <option value="mobility_help">Mobility assistance</option>
            <option value="quiet_space">Quiet waiting space</option>
          </select>
        </label>
        <p className="patient-booking__manage-note">
          If your symptoms changed or got worse, use the governed clinical request path instead of this administrative form.
        </p>
        <div className="patient-booking__manage-inline-actions">
          <button type="submit" className="patient-booking__primary-action" data-testid="manage-detail-submit">
            Save update
          </button>
          <button
            type="button"
            className="patient-booking__secondary-action"
            data-testid="manage-detail-cancel"
            onClick={onReturnToSummary}
          >
            Back to summary
          </button>
        </div>
      </form>
    </section>
  );
}

export function RescheduleEntryStage({
  projection,
  supportActionLabel,
  onSupportAction,
  onReturnToSummary,
  onContinueToPending,
}: {
  projection: PatientAppointmentManageProjection;
  supportActionLabel: string;
  onSupportAction: () => void;
  onReturnToSummary: () => void;
  onContinueToPending: () => void;
}) {
  return (
    <section className="patient-booking__manage-card patient-booking__manage-card--reschedule" data-testid="reschedule-entry-stage">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">RescheduleEntryStage</span>
        <h3>Choose a replacement appointment</h3>
      </div>
      <p className="patient-booking__manage-copy">
        The original appointment summary remains pinned above. Replacement selection reuses the booking slot-selection surface instead of opening a separate reschedule product.
      </p>
      <div className="patient-booking__manage-inline-actions">
        <button
          type="button"
          className="patient-booking__secondary-action"
          data-testid="manage-reschedule-back"
          onClick={onReturnToSummary}
        >
          Back to summary
        </button>
      </div>
      <OfferSelectionStage
        bookingCaseId={projection.rescheduleSelectionScenarioId ?? "booking_case_295_nonexclusive"}
        shellContinuityKey={`reschedule_${projection.bookingCaseId}`}
        supportActionLabel={supportActionLabel}
        onSupportAction={onSupportAction}
        onReturnToOrigin={onReturnToSummary}
        onOpenConfirmationHost={onContinueToPending}
      />
    </section>
  );
}

function manageCapabilityMarker(projection: PatientAppointmentManageProjection): string {
  return projection.manageCapabilityRefs.length > 0
    ? projection.manageCapabilityRefs.join("|")
    : "summary_only";
}

export function PatientAppointmentDetailView({
  bookingCaseId,
  shellContinuityKey,
  supportActionLabel,
  returnLabel,
  onSupportAction,
  onOpenArtifactHost,
  onReturn,
}: PatientAppointmentDetailViewProps) {
  const responsive = useBookingResponsive();
  const initialProjection = resolveInitialProjection(bookingCaseId, shellContinuityKey);
  const [scenarioId, setScenarioId] = useState(initialProjection.scenarioId);
  const [announcement, setAnnouncement] = useState(initialProjection.liveAnnouncement);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [summarySheetOpen, setSummarySheetOpen] = useState(false);
  const [repairExpanded, setRepairExpanded] = useState(
    initialProjection.reminderPanel.contactRouteState === "repair_required",
  );
  const [detailDraft, setDetailDraft] = useState(initialProjection.detailFormPreset);
  const cancelTriggerRef = useRef<HTMLElement | null>(null);

  const projection =
    resolvePatientAppointmentManageProjectionByScenarioId(scenarioId) ??
    resolvePatientAppointmentManageProjection(bookingCaseId) ??
    initialProjection;
  const recoveryProjection = resolveManageBookingRecoveryEnvelope(
    projection.scenarioId,
    "authenticated",
    supportActionLabel,
  );

  useEffect(() => {
    writeRestoreBundle({
      projectionName: "AppointmentManageRestoreBundle297",
      bookingCaseId,
      shellContinuityKey,
      scenarioId,
    });
  }, [bookingCaseId, scenarioId, shellContinuityKey]);

  useEffect(() => {
    setAnnouncement(projection.liveAnnouncement);
    setRepairExpanded(projection.reminderPanel.contactRouteState === "repair_required");
    if (projection.viewKind === "detail_update") {
      setDetailDraft(projection.detailFormPreset);
    }
  }, [projection.detailFormPreset, projection.liveAnnouncement, projection.reminderPanel.contactRouteState, projection.viewKind]);

  useEffect(() => {
    if (!cancelDialogOpen && cancelTriggerRef.current) {
      cancelTriggerRef.current.focus({ preventScroll: true });
    }
  }, [cancelDialogOpen]);

  useEffect(() => {
    if (responsive.missionStackState !== "folded") {
      setSummarySheetOpen(false);
    }
  }, [responsive.missionStackState]);

  const activePendingState = cancelDialogOpen ? "cancel_confirm" : projection.pendingState;
  const artifactEnabled =
    projection.confirmationTruthState === "confirmed" &&
    projection.artifactExposureState === "handoff_ready";

  const rootData = useMemo(
    () => ({
      appointmentId: projection.appointmentId,
      manageCapability: manageCapabilityMarker(projection),
      managePendingState: activePendingState,
      reminderExposure: projection.reminderExposureState,
      attendanceMode: projection.attendanceMode,
    }),
    [activePendingState, projection],
  );
  const stickyManageAction =
    projection.actionDeck.find((action) => action.actionRef !== "request_support") ??
    projection.reminderPanel.primaryAction ??
    null;

  function transitionTo(nextScenarioId: string): void {
    startTransition(() => {
      setScenarioId(nextScenarioId);
    });
  }

  function focusReminderPanel(): void {
    focusBySelector("[data-anchor-ref='reminder-preference-panel']");
  }

  function focusSupportPanel(): void {
    focusBySelector("[data-anchor-ref='manage-support-panel']");
  }

  function handleAction(action: AppointmentManageActionProjection): void {
    switch (action.actionRef) {
      case "open_reschedule":
      case "open_detail_update":
      case "return_to_summary":
      case "refresh_manage_status":
      case "refresh_manage_route":
      case "change_reminder_to_email":
      case "change_reminder_to_sms":
        if (action.transitionScenarioId) {
          transitionTo(action.transitionScenarioId);
        }
        setAnnouncement(action.detail);
        return;
      case "repair_contact_route":
        setRepairExpanded(true);
        setAnnouncement(action.detail);
        focusReminderPanel();
        return;
      case "request_support":
      case "rebook":
        setAnnouncement(action.detail);
        onSupportAction();
        focusSupportPanel();
        return;
      default:
        setAnnouncement(action.detail);
    }
  }

  function openCancelDialog(trigger: HTMLElement): void {
    cancelTriggerRef.current = trigger;
    setCancelDialogOpen(true);
    setAnnouncement("Cancellation confirmation opened.");
  }

  function closeCancelDialog(): void {
    setCancelDialogOpen(false);
    setAnnouncement("Cancellation confirmation closed.");
  }

  function confirmCancellation(): void {
    setCancelDialogOpen(false);
    transitionTo("booking_case_297_cancel_pending");
    setAnnouncement(
      cancelReason.trim().length > 0
        ? `Cancellation submitted with reason: ${cancelReason.trim()}.`
        : "Cancellation submitted.",
    );
  }

  function submitDetailUpdate(): void {
    transitionTo("booking_case_297_detail_pending");
    setAnnouncement("Administrative detail update submitted.");
  }

  function handleArtifactAction(action: AppointmentManageActionProjection): void {
    setAnnouncement(action.detail);
    if (typeof onOpenArtifactHost === "function" && action.artifactMode) {
      onOpenArtifactHost(action.artifactMode);
      return;
    }
    focusBySelector("[data-testid='appointment-summary-card']");
  }

  function handleRecoveryAction(action: BookingRecoveryActionProjection): void {
    switch (action.actionRef) {
      case "refresh_manage":
        if (action.transitionScenarioId) {
          transitionTo(action.transitionScenarioId);
        }
        setAnnouncement(action.detail);
        return;
      case "open_contact_repair":
        setAnnouncement(action.detail);
        focusBySelector("[data-testid='BookingContactRepairMorph']");
        return;
      case "request_support":
      default:
        setAnnouncement(action.detail);
        onSupportAction();
    }
  }

  return (
    <section
      className="patient-booking__manage-stage"
      data-testid="patient-appointment-manage-view"
      data-anchor-ref="booking-manage-stage"
      tabIndex={-1}
      data-task-id={PATIENT_APPOINTMENT_MANAGE_TASK_ID}
      data-visual-mode={PATIENT_APPOINTMENT_MANAGE_VISUAL_MODE}
      data-appointment-id={rootData.appointmentId}
      data-manage-capability={rootData.manageCapability}
      data-manage-pending-state={rootData.managePendingState}
      data-reminder-exposure={rootData.reminderExposure}
      data-attendance-mode={rootData.attendanceMode}
      data-manage-exposure={projection.manageExposureState}
      data-confirmation-truth={projection.confirmationTruthState}
      data-continuity-state={projection.continuityState}
      data-view-kind={projection.viewKind}
    >
      <div className="patient-intake-mission-frame__visually-hidden" role="status" aria-atomic="true">
        {announcement}
      </div>
      {recoveryProjection ? (
        <BookingRecoveryShell
          projection={recoveryProjection}
          onAction={handleRecoveryAction}
          onReturn={onReturn}
        />
      ) : (
        <>
          <BookingResponsiveStage
            stageName="PatientAppointmentDetailView"
            testId="patient-appointment-manage-responsive-stage"
            foldedPinned={
              <div className="patient-booking__manage-mission-summary">
                <AppointmentSummaryCard
                  projection={projection}
                  artifactEnabled={artifactEnabled && responsive.embeddedMode === "browser"}
                  onArtifactAction={handleArtifactAction}
                />
                <button
                  type="button"
                  className="patient-booking__secondary-action"
                  data-testid="manage-open-summary-sheet"
                  onClick={() => {
                    setSummarySheetOpen(true);
                    setAnnouncement("Appointment summary sheet opened.");
                  }}
                >
                  View full appointment summary
                </button>
              </div>
            }
            railToggleLabel="View reminders and support"
            railTitle="Reminder and support"
            rail={
              <div className="patient-booking__manage-rail">
                <ReminderPreferencePanel
                  projection={projection}
                  repairExpanded={repairExpanded}
                  onAction={handleAction}
                />
                <AssistedFallbackStub
                  projection={projection}
                  returnLabel={returnLabel}
                  onSupportAction={onSupportAction}
                  onReturn={onReturn}
                />
              </div>
            }
            stickyTray={
              stickyManageAction && responsive.missionStackState === "folded" ? (
                <BookingStickyActionTray
                  testId="manage-sticky-action-tray"
                  primaryTestId="manage-sticky-primary"
                  title={stickyManageAction.label}
                  detail={stickyManageAction.detail}
                  primaryActionLabel={stickyManageAction.label}
                  primaryActionRef={stickyManageAction.actionRef}
                  onPrimaryAction={() => handleAction(stickyManageAction)}
                  secondaryActionLabel={supportActionLabel}
                  onSecondaryAction={onSupportAction}
                />
              ) : undefined
            }
            main={
              <div className="patient-booking__manage-main">
                {responsive.missionStackState !== "folded" ? (
                  <AppointmentSummaryCard
                    projection={projection}
                    artifactEnabled={artifactEnabled && responsive.embeddedMode === "browser"}
                    onArtifactAction={handleArtifactAction}
                  />
                ) : null}
                <AttendanceInstructionPanel projection={projection} />
                <ManageActionDeck
                  projection={projection}
                  cancelDisabled={cancelDialogOpen || projection.manageExposureState !== "writable"}
                  onOpenCancel={openCancelDialog}
                  onAction={handleAction}
                />
                <ManagePendingOrRecoveryPanel projection={projection} onAction={handleAction} />
                {projection.viewKind === "detail_update" ? (
                  <AppointmentDetailUpdateForm
                    draft={detailDraft}
                    onChangeDraft={setDetailDraft}
                    onReturnToSummary={() => transitionTo("booking_case_297_ready")}
                    onSubmit={submitDetailUpdate}
                  />
                ) : null}
                {projection.viewKind === "reschedule" ? (
                  <RescheduleEntryStage
                    projection={projection}
                    supportActionLabel={supportActionLabel}
                    onSupportAction={onSupportAction}
                    onReturnToSummary={() => transitionTo("booking_case_297_ready")}
                    onContinueToPending={() => transitionTo("booking_case_297_reschedule_pending")}
                  />
                ) : null}
              </div>
            }
          />
          <ManageCompactSummarySheet
            open={summarySheetOpen}
            onClose={() => {
              setSummarySheetOpen(false);
              setAnnouncement("Appointment summary sheet closed.");
            }}
          >
            <AppointmentSummaryCard
              projection={projection}
              artifactEnabled={artifactEnabled && responsive.embeddedMode === "browser"}
              onArtifactAction={handleArtifactAction}
            />
            <AttendanceInstructionPanel projection={projection} />
          </ManageCompactSummarySheet>
        </>
      )}
      <CancelAppointmentFlow
        open={cancelDialogOpen}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onClose={closeCancelDialog}
        onConfirm={confirmCancellation}
      />
    </section>
  );
}
