import { startTransition, useEffect, useState } from "react";
import "./patient-booking-confirmation.css";
import { SelectedSlotPin } from "./patient-booking-offer-selection";
import { BookingRecoveryShell } from "./patient-booking-recovery";
import {
  PATIENT_BOOKING_CONFIRMATION_TASK_ID,
  PATIENT_BOOKING_CONFIRMATION_VISUAL_MODE,
  resolveBookingConfirmationProjection,
  resolveBookingConfirmationProjectionForScenarioId,
  resolveBookingConfirmationSlot,
  type BookingConfirmationProjection,
  type ConfirmationActionProjection,
  type ConfirmationSummaryRow,
} from "./patient-booking-confirmation.model";
import {
  resolveConfirmationBookingRecoveryEnvelope,
  type BookingRecoveryActionProjection,
} from "./patient-booking-recovery.model";
import {
  BookingResponsiveStage,
  BookingStickyActionTray,
  useBookingResponsive,
} from "./patient-booking-responsive";
import type { BookingArtifactRouteMode } from "./patient-booking-workspace.model";

const CONFIRMATION_RESTORE_STORAGE_KEY = "patient-booking-confirmation-296::restore-bundle";

interface BookingConfirmationRestoreBundle296 {
  readonly projectionName: "BookingConfirmationRestoreBundle296";
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly scenarioId: string;
}

export interface BookingConfirmationStageProps {
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly supportActionLabel: string;
  readonly onSupportAction: () => void;
  readonly onOpenManageHost?: (() => void) | null;
  readonly onOpenArtifactHost?: ((mode: BookingArtifactRouteMode) => void) | null;
  readonly onReturnToSelection: () => void;
  readonly onReturnToOrigin?: (() => void) | null;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function readRestoreBundle(): BookingConfirmationRestoreBundle296 | null {
  const raw = safeWindow()?.sessionStorage.getItem(CONFIRMATION_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as BookingConfirmationRestoreBundle296;
    return parsed.projectionName === "BookingConfirmationRestoreBundle296" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: BookingConfirmationRestoreBundle296): void {
  safeWindow()?.sessionStorage.setItem(CONFIRMATION_RESTORE_STORAGE_KEY, JSON.stringify(bundle));
}

function primaryToneClass(
  projection: BookingConfirmationProjection,
): "active" | "warn" | "blocked" | "safe" | "neutral" {
  switch (projection.stateTone) {
    case "active":
    case "warn":
    case "blocked":
    case "safe":
      return projection.stateTone;
    case "neutral":
    default:
      return "neutral";
  }
}

function actionDisabled(action: ConfirmationActionProjection | null): boolean {
  return action?.actionRef === "wait_for_confirmation";
}

function resolveInitialProjection(
  bookingCaseId: string,
  shellContinuityKey: string,
): BookingConfirmationProjection {
  const restoreBundle = readRestoreBundle();
  const restoredProjection =
    restoreBundle?.bookingCaseId === bookingCaseId &&
    restoreBundle?.shellContinuityKey === shellContinuityKey
      ? resolveBookingConfirmationProjectionForScenarioId(bookingCaseId, restoreBundle.scenarioId)
      : null;
  const directProjection = resolveBookingConfirmationProjection(bookingCaseId);
  return restoredProjection ?? directProjection ?? resolveBookingConfirmationProjection("booking_case_296_review")!;
}

function SummaryList({
  title,
  rows,
  testId,
}: {
  title: string;
  rows: readonly ConfirmationSummaryRow[];
  testId?: string;
}) {
  return (
    <section className="patient-booking__confirmation-summary" data-testid={testId}>
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">{title}</span>
        <h4>{title}</h4>
      </div>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
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
  supportActionLabel,
  tone = "primary",
  testId,
  onAction,
}: {
  action: ConfirmationActionProjection;
  supportActionLabel?: string;
  tone?: "primary" | "secondary";
  testId?: string;
  onAction: (action: ConfirmationActionProjection) => void;
}) {
  const disabled = actionDisabled(action);
  const className =
    tone === "primary" ? "patient-booking__primary-action" : "patient-booking__secondary-action";
  return (
    <button
      type="button"
      className={className}
      data-action-scope={action.actionRef}
      data-action-ready={disabled ? "false" : "true"}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={() => onAction(action)}
    >
      {action.actionRef === "request_support" && supportActionLabel ? supportActionLabel : action.label}
    </button>
  );
}

export function ConfirmationProgressStrip({
  projection,
}: {
  projection: BookingConfirmationProjection;
}) {
  return (
    <section
      className="patient-booking__confirmation-progress"
      aria-label="Booking confirmation progress"
      data-testid="confirmation-progress-strip"
      data-view-kind={projection.viewKind}
      data-route-freeze-state={projection.routeFreezeState}
    >
      <ol className="patient-booking__confirmation-progress-list">
        {projection.progressSteps.map((step) => (
          <li
            key={step.stepId}
            className="patient-booking__confirmation-progress-step"
            data-step-state={step.state}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <span className="patient-booking__confirmation-progress-dot" aria-hidden="true" />
            <strong>{step.label}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SelectedSlotProvenanceCard({
  projection,
}: {
  projection: BookingConfirmationProjection;
}) {
  const slot = resolveBookingConfirmationSlot(projection);
  return (
    <section className="patient-booking__confirmation-provenance" data-testid="selected-slot-provenance-card">
      <SelectedSlotPin
        slot={slot}
        truth={projection.selectedReservationTruth}
        referenceNowAt={projection.referenceNowAt}
        compareCount={0}
        canOpenCompare={false}
        onOpenCompare={() => undefined}
        compareActionMode="hidden"
        eyebrow="SelectedSlotProvenanceCard"
        title={projection.viewKind === "confirmed" ? "Confirmed slot summary" : "Selected slot provenance"}
      />
      <p className="patient-booking__confirmation-provenance-note">{projection.provenanceNote}</p>
    </section>
  );
}

export function BookingConfirmReviewStage({
  projection,
  supportActionLabel,
  onAction,
}: {
  projection: BookingConfirmationProjection;
  supportActionLabel: string;
  onAction: (action: ConfirmationActionProjection) => void;
}) {
  return (
    <div className="patient-booking__confirmation-content" data-testid="booking-confirm-review-stage">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingConfirmReviewStage</span>
        <h4>{projection.stateHeading}</h4>
      </div>
      <p className="patient-booking__confirmation-copy">{projection.stateBody}</p>
      <p className="patient-booking__confirmation-note">{projection.supportingNote}</p>
      <div className="patient-booking__confirmation-grid">
        <SummaryList title="Contact route" rows={projection.contactRows} />
        <SummaryList title="Reminder preferences" rows={projection.reminderRows} />
      </div>
      <SummaryList title="Confirm posture" rows={projection.stateRows} />
      <div className="patient-booking__confirmation-actions">
        {projection.primaryAction ? (
          <ActionButton
            action={projection.primaryAction}
            supportActionLabel={supportActionLabel}
            testId="booking-confirmation-primary-action"
            onAction={onAction}
          />
        ) : null}
        {projection.secondaryActions.map((action) => (
          <ActionButton
            key={action.actionRef}
            action={action}
            supportActionLabel={supportActionLabel}
            tone="secondary"
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

export function BookingInProgressState({
  projection,
  supportActionLabel,
  onAction,
}: {
  projection: BookingConfirmationProjection;
  supportActionLabel: string;
  onAction: (action: ConfirmationActionProjection) => void;
}) {
  return (
    <div className="patient-booking__confirmation-content" data-testid="booking-in-progress-state">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingInProgressState</span>
        <h4>{projection.stateHeading}</h4>
      </div>
      <div className="patient-booking__confirmation-inline-loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="patient-booking__confirmation-copy">{projection.stateBody}</p>
      <p className="patient-booking__confirmation-note">{projection.supportingNote}</p>
      <SummaryList title="Progress state" rows={projection.stateRows} />
      <div className="patient-booking__confirmation-actions">
        {projection.primaryAction ? (
          <ActionButton
            action={projection.primaryAction}
            supportActionLabel={supportActionLabel}
            testId="booking-confirmation-primary-action"
            onAction={onAction}
          />
        ) : null}
        {projection.secondaryActions.map((action) => (
          <ActionButton
            key={action.actionRef}
            action={action}
            supportActionLabel={supportActionLabel}
            tone="secondary"
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

export function ConfirmationPendingState({
  projection,
  supportActionLabel,
  onAction,
}: {
  projection: BookingConfirmationProjection;
  supportActionLabel: string;
  onAction: (action: ConfirmationActionProjection) => void;
}) {
  return (
    <div className="patient-booking__confirmation-content" data-testid="confirmation-pending-state">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">ConfirmationPendingState</span>
        <h4>{projection.stateHeading}</h4>
      </div>
      <p className="patient-booking__confirmation-copy">{projection.stateBody}</p>
      <p className="patient-booking__confirmation-note">{projection.supportingNote}</p>
      <SummaryList title="Provisional receipt" rows={projection.stateRows} />
      <div className="patient-booking__confirmation-actions">
        {projection.primaryAction ? (
          <ActionButton
            action={projection.primaryAction}
            supportActionLabel={supportActionLabel}
            testId="booking-confirmation-primary-action"
            onAction={onAction}
          />
        ) : null}
        {projection.secondaryActions.map((action) => (
          <ActionButton
            key={action.actionRef}
            action={action}
            supportActionLabel={supportActionLabel}
            tone="secondary"
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

export function ReconciliationRecoveryState({
  projection,
  supportActionLabel,
  onAction,
}: {
  projection: BookingConfirmationProjection;
  supportActionLabel: string;
  onAction: (action: ConfirmationActionProjection) => void;
}) {
  return (
    <div className="patient-booking__confirmation-content" data-testid="reconciliation-recovery-state">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">ReconciliationRecoveryState</span>
        <h4>{projection.stateHeading}</h4>
      </div>
      <p className="patient-booking__confirmation-copy">{projection.stateBody}</p>
      <p className="patient-booking__confirmation-note">{projection.supportingNote}</p>
      <SummaryList title="Recovery posture" rows={projection.stateRows} />
      <div className="patient-booking__confirmation-actions">
        {projection.primaryAction ? (
          <ActionButton
            action={projection.primaryAction}
            supportActionLabel={supportActionLabel}
            testId="booking-confirmation-primary-action"
            onAction={onAction}
          />
        ) : null}
        {projection.secondaryActions.map((action) => (
          <ActionButton
            key={action.actionRef}
            action={action}
            supportActionLabel={supportActionLabel}
            tone="secondary"
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

export function BookedSummaryChildState({
  projection,
  supportActionLabel,
  onAction,
}: {
  projection: BookingConfirmationProjection;
  supportActionLabel: string;
  onAction: (action: ConfirmationActionProjection) => void;
}) {
  return (
    <div className="patient-booking__confirmation-content" data-testid="booked-summary-child-state">
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookedSummaryChildState</span>
        <h4>{projection.stateHeading}</h4>
      </div>
      <p className="patient-booking__confirmation-copy">{projection.stateBody}</p>
      <p className="patient-booking__confirmation-note">{projection.supportingNote}</p>
      <SummaryList title="Confirmed booking" rows={projection.stateRows} />
      <div className="patient-booking__confirmation-actions">
        {projection.primaryAction ? (
          <ActionButton
            action={projection.primaryAction}
            supportActionLabel={supportActionLabel}
            testId="booking-confirmation-primary-action"
            onAction={onAction}
          />
        ) : null}
      </div>
    </div>
  );
}

export function BookedSummaryMiniList({
  projection,
}: {
  projection: BookingConfirmationProjection;
}) {
  return (
    <section
      className="patient-booking__confirmation-mini-list"
      data-testid="booked-summary-mini-list"
      data-confirmation-truth={projection.confirmationTruthState}
      data-empty={projection.bookedSummaryRows.length === 0 ? "true" : "false"}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookedSummaryMiniList</span>
        <h4>Booked summary</h4>
      </div>
      {projection.bookedSummaryRows.length > 0 ? (
        <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
          {projection.bookedSummaryRows.map((row) => (
            <div key={row.label} className="patient-booking__summary-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="patient-booking__confirmation-muted">
          Calm booked summary stays hidden until confirmation truth is actually confirmed.
        </p>
      )}
    </section>
  );
}

export function RecoveryActionPanel({
  projection,
  supportActionLabel,
  onAction,
}: {
  projection: BookingConfirmationProjection;
  supportActionLabel: string;
  onAction: (action: ConfirmationActionProjection) => void;
}) {
  const actions =
    projection.viewKind === "recovery"
      ? [projection.primaryAction, ...projection.secondaryActions].filter(
          (action): action is ConfirmationActionProjection => Boolean(action),
        )
      : projection.secondaryActions;

  return (
    <section
      className="patient-booking__confirmation-recovery"
      data-testid="recovery-action-panel"
      data-route-freeze-state={projection.routeFreezeState}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">RecoveryActionPanel</span>
        <h4>
          {projection.routeFreezeState === "live" ? "Next safe action" : "Same-shell recovery"}
        </h4>
      </div>
      <p className="patient-booking__confirmation-muted">
        {projection.routeFreezeState === "live"
          ? "This panel keeps the next safe action nearby when booking truth is still pending or disputed."
          : "Route freeze and release-recovery posture keep live controls suppressed while preserving safe context."}
      </p>
      {actions.length > 0 ? (
        <div className="patient-booking__confirmation-actions patient-booking__confirmation-actions--stacked">
          {actions.map((action, index) => (
            <ActionButton
              key={`${action.actionRef}-${index}`}
              action={action}
              supportActionLabel={supportActionLabel}
              tone={index === 0 ? "primary" : "secondary"}
              onAction={onAction}
            />
          ))}
        </div>
      ) : (
        <p className="patient-booking__confirmation-muted">
          Recovery actions stay hidden while this confirmed route remains fully live.
        </p>
      )}
    </section>
  );
}

export function ArtifactSummaryStub({
  projection,
  supportActionLabel,
  onAction,
}: {
  projection: BookingConfirmationProjection;
  supportActionLabel: string;
  onAction: (action: ConfirmationActionProjection) => void;
}) {
  const responsive = useBookingResponsive();
  const artifactActionsEnabled =
    responsive.embeddedMode === "browser" &&
    projection.artifactExposureState === "handoff_ready" &&
    projection.artifactActions.length > 0;

  return (
    <section
      className="patient-booking__confirmation-artifacts"
      data-testid="artifact-summary-stub"
      data-artifact-exposure={projection.artifactExposureState}
      data-embedded-mode={responsive.embeddedMode}
      data-anchor-ref="booking-confirmation-artifact-stub"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">ArtifactSummaryStub</span>
        <h4>Artifact and handoff summary</h4>
      </div>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        {projection.artifactRows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {artifactActionsEnabled ? (
        <div className="patient-booking__confirmation-actions patient-booking__confirmation-actions--wrap">
          {projection.artifactActions.map((action) => (
            <ActionButton
              key={action.actionRef}
              action={action}
              supportActionLabel={supportActionLabel}
              tone="secondary"
              onAction={onAction}
            />
          ))}
        </div>
      ) : (
        <p className="patient-booking__confirmation-muted">
          {responsive.embeddedMode === "nhs_app"
            ? "This embedded host keeps artifact actions summary-only. Browser handoff, print, and export stay visible as summary context only."
            : "Artifact controls stay summary-only until the current confirmation and route posture permit handoff."}
        </p>
      )}
    </section>
  );
}

export function BookingConfirmationStage({
  bookingCaseId,
  shellContinuityKey,
  supportActionLabel,
  onSupportAction,
  onOpenManageHost,
  onOpenArtifactHost,
  onReturnToSelection,
  onReturnToOrigin,
}: BookingConfirmationStageProps) {
  const responsive = useBookingResponsive();
  const initialProjection = resolveInitialProjection(bookingCaseId, shellContinuityKey);
  const [scenarioId, setScenarioId] = useState(initialProjection.scenarioId);
  const [announcement, setAnnouncement] = useState(initialProjection.liveAnnouncement);

  const projection =
    resolveBookingConfirmationProjectionForScenarioId(bookingCaseId, scenarioId) ??
    resolveBookingConfirmationProjection(bookingCaseId) ??
    initialProjection;
  const recoveryProjection = resolveConfirmationBookingRecoveryEnvelope(
    projection.scenarioId,
    "authenticated",
    supportActionLabel,
  );

  useEffect(() => {
    writeRestoreBundle({
      projectionName: "BookingConfirmationRestoreBundle296",
      bookingCaseId,
      shellContinuityKey,
      scenarioId,
    });
  }, [bookingCaseId, scenarioId, shellContinuityKey]);

  useEffect(() => {
    setAnnouncement(projection.liveAnnouncement);
  }, [projection.liveAnnouncement, projection.scenarioId]);

  useEffect(() => {
    if (!projection.autoTransitionScenarioId || !projection.autoTransitionDelayMs) {
      return;
    }
    const timer = safeWindow()?.setTimeout(() => {
      startTransition(() => {
        setScenarioId(projection.autoTransitionScenarioId!);
      });
    }, projection.autoTransitionDelayMs);
    return () => {
      if (typeof timer === "number") {
        safeWindow()?.clearTimeout(timer);
      }
    };
  }, [projection.autoTransitionDelayMs, projection.autoTransitionScenarioId, projection.scenarioId]);

  function focusArtifactStub(): void {
    safeDocument()
      ?.querySelector<HTMLElement>("[data-anchor-ref='booking-confirmation-artifact-stub']")
      ?.focus({ preventScroll: true });
  }

  function handleAction(action: ConfirmationActionProjection): void {
    switch (action.actionRef) {
      case "confirm_booking":
      case "refresh_confirmation_status":
      case "refresh_confirmation_route":
        if (action.transitionScenarioId) {
          const nextScenarioId = action.transitionScenarioId;
          startTransition(() => {
            setScenarioId(nextScenarioId);
          });
        }
        setAnnouncement(action.detail);
        return;
      case "return_to_selection":
        setAnnouncement(action.detail);
        onReturnToSelection();
        return;
      case "request_support":
        setAnnouncement(action.detail);
        onSupportAction();
        return;
      case "open_manage_stub":
        setAnnouncement(action.detail);
        if (typeof onOpenManageHost === "function") {
          onOpenManageHost();
        } else {
          focusArtifactStub();
        }
        return;
      case "open_calendar_export_stub":
      case "open_print_stub":
      case "open_directions_stub":
      case "open_browser_handoff_stub":
        setAnnouncement(action.detail);
        if (typeof onOpenArtifactHost === "function" && action.artifactMode) {
          onOpenArtifactHost(action.artifactMode);
        } else {
          focusArtifactStub();
        }
        return;
      case "wait_for_confirmation":
      default:
        setAnnouncement(action.detail);
    }
  }

  function handleRecoveryAction(action: BookingRecoveryActionProjection): void {
    switch (action.actionRef) {
      case "refresh_confirmation":
        if (action.transitionScenarioId) {
          startTransition(() => {
            setScenarioId(action.transitionScenarioId!);
          });
        }
        setAnnouncement(action.detail);
        return;
      case "return_to_selection":
        setAnnouncement(action.detail);
        onReturnToSelection();
        return;
      case "request_support":
      default:
        setAnnouncement(action.detail);
        onSupportAction();
    }
  }

  return (
    <section
      className="patient-booking__confirmation-stage"
      data-testid="booking-confirmation-stage"
      data-task-id={PATIENT_BOOKING_CONFIRMATION_TASK_ID}
      data-visual-mode={PATIENT_BOOKING_CONFIRMATION_VISUAL_MODE}
      data-confirmation-truth={projection.confirmationTruthState}
      data-patient-visibility={projection.patientVisibilityState}
      data-manage-exposure={projection.manageExposureState}
      data-artifact-exposure={projection.artifactExposureState}
      data-reminder-exposure={projection.reminderExposureState}
      data-route-freeze-state={projection.routeFreezeState}
      data-reservation-truth={projection.selectedReservationTruth.truthState}
      data-selected-slot={projection.selectedSlotId}
      data-view-kind={projection.viewKind}
    >
      <div className="patient-intake-mission-frame__visually-hidden" role="status" aria-atomic="true">
        {announcement}
      </div>
      {recoveryProjection ? (
        <BookingRecoveryShell
          projection={recoveryProjection}
          onAction={handleRecoveryAction}
          onReturn={onReturnToOrigin ?? onReturnToSelection}
        />
      ) : (
        <BookingResponsiveStage
          stageName="BookingConfirmationStage"
          testId="booking-confirmation-responsive-stage"
          railToggleLabel="View booking summary and artifact posture"
          railTitle="Booking summary and artifact posture"
          foldedPinned={
            <>
              <SelectedSlotProvenanceCard projection={projection} />
              <BookedSummaryMiniList projection={projection} />
            </>
          }
          rail={
            <aside className="patient-booking__confirmation-rail">
              <SelectedSlotProvenanceCard projection={projection} />
              <BookedSummaryMiniList projection={projection} />
              <RecoveryActionPanel
                projection={projection}
                supportActionLabel={supportActionLabel}
                onAction={handleAction}
              />
              <ArtifactSummaryStub
                projection={projection}
                supportActionLabel={supportActionLabel}
                onAction={handleAction}
              />
            </aside>
          }
          stickyTray={
            projection.primaryAction && responsive.missionStackState === "folded" ? (
              <BookingStickyActionTray
                testId="booking-confirmation-sticky-tray"
                primaryTestId="booking-confirmation-sticky-primary"
                title={projection.primaryAction.label}
                detail={projection.primaryAction.detail}
                primaryActionLabel={
                  projection.primaryAction.actionRef === "request_support"
                    ? supportActionLabel
                    : projection.primaryAction.label
                }
                primaryActionRef={projection.primaryAction.actionRef}
                primaryDisabled={actionDisabled(projection.primaryAction)}
                onPrimaryAction={() => handleAction(projection.primaryAction!)}
              />
            ) : undefined
          }
          main={
            <div className="patient-booking__confirmation-main">
              <ConfirmationProgressStrip projection={projection} />
              <section
                className="patient-booking__confirmation-panel"
                data-tone={primaryToneClass(projection)}
                data-testid="confirm-state-panel"
              >
                <header className="patient-booking__confirmation-panel-head">
                  <div className="patient-booking__section-head">
                    <span className="patient-booking__eyebrow">ConfirmStatePanel</span>
                    <h4>{projection.ribbonLabel}</h4>
                  </div>
                  <p className="patient-booking__confirmation-copy">{projection.ribbonDetail}</p>
                </header>
                {projection.viewKind === "review" ? (
                  <BookingConfirmReviewStage
                    projection={projection}
                    supportActionLabel={supportActionLabel}
                    onAction={handleAction}
                  />
                ) : null}
                {projection.viewKind === "in_progress" ? (
                  <BookingInProgressState
                    projection={projection}
                    supportActionLabel={supportActionLabel}
                    onAction={handleAction}
                  />
                ) : null}
                {projection.viewKind === "pending" ? (
                  <ConfirmationPendingState
                    projection={projection}
                    supportActionLabel={supportActionLabel}
                    onAction={handleAction}
                  />
                ) : null}
                {projection.viewKind === "recovery" ? (
                  <ReconciliationRecoveryState
                    projection={projection}
                    supportActionLabel={supportActionLabel}
                    onAction={handleAction}
                  />
                ) : null}
                {projection.viewKind === "confirmed" ? (
                  <BookedSummaryChildState
                    projection={projection}
                    supportActionLabel={supportActionLabel}
                    onAction={handleAction}
                  />
                ) : null}
              </section>
            </div>
          }
        />
      )}
    </section>
  );
}
