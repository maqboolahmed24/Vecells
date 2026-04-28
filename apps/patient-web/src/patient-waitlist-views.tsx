import { startTransition, useEffect, useRef, useState } from "react";
import "./patient-waitlist-views.css";
import { BookingRecoveryShell } from "./patient-booking-recovery";
import {
  resolveWaitlistBookingRecoveryEnvelope,
  type BookingRecoveryActionProjection,
} from "./patient-booking-recovery.model";
import {
  PATIENT_WAITLIST_VIEWS_TASK_ID,
  PATIENT_WAITLIST_VIEWS_VISUAL_MODE,
  resolvePatientWaitlistViewProjection,
  resolvePatientWaitlistViewProjectionByScenarioId,
  type PatientWaitlistViewProjection,
  type WaitlistActionProjection,
} from "./patient-waitlist-views.model";
import {
  BookingResponsiveStage,
  BookingStickyActionTray,
  ResponsiveWaitlistCard,
  useBookingResponsive,
} from "./patient-booking-responsive";

const WAITLIST_RESTORE_STORAGE_KEY = "patient-waitlist-views-298::restore-bundle";

interface WaitlistRestoreBundle298 {
  readonly projectionName: "WaitlistRestoreBundle298";
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly scenarioId: string;
}

export interface PatientWaitlistViewsProps {
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly supportActionLabel: string;
  readonly onSupportAction: () => void;
  readonly onReturnToOrigin?: (() => void) | null;
  readonly onReturnToSelection?: (() => void) | null;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function readRestoreBundle(): WaitlistRestoreBundle298 | null {
  const raw = safeWindow()?.sessionStorage.getItem(WAITLIST_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as WaitlistRestoreBundle298;
    return parsed.projectionName === "WaitlistRestoreBundle298" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: WaitlistRestoreBundle298): void {
  safeWindow()?.sessionStorage.setItem(WAITLIST_RESTORE_STORAGE_KEY, JSON.stringify(bundle));
}

function resolveProjectionForScenario(
  bookingCaseId: string,
  scenarioId: string,
): PatientWaitlistViewProjection | null {
  const projection =
    resolvePatientWaitlistViewProjectionByScenarioId(scenarioId) ??
    resolvePatientWaitlistViewProjection(bookingCaseId);
  if (!projection) {
    return null;
  }
  return projection.bookingCaseId === bookingCaseId
    ? projection
    : {
        ...projection,
        bookingCaseId,
      };
}

function deriveInitialProjection(
  bookingCaseId: string,
  shellContinuityKey: string,
): {
  projection: PatientWaitlistViewProjection | null;
  restoreBundle: WaitlistRestoreBundle298 | null;
} {
  const restoreBundle = readRestoreBundle();
  const restoredProjection =
    restoreBundle?.bookingCaseId === bookingCaseId &&
    restoreBundle?.shellContinuityKey === shellContinuityKey
      ? resolveProjectionForScenario(bookingCaseId, restoreBundle.scenarioId)
      : null;
  const directProjection = resolvePatientWaitlistViewProjection(bookingCaseId);
  return {
    projection: restoredProjection ?? directProjection,
    restoreBundle:
      restoreBundle?.bookingCaseId === bookingCaseId &&
      restoreBundle?.shellContinuityKey === shellContinuityKey
        ? restoreBundle
        : null,
  };
}

function waitlistTone(
  projection: PatientWaitlistViewProjection,
): "safe" | "primary" | "warn" | "blocked" {
  if (projection.reachabilityState === "repair_required") {
    return "blocked";
  }
  if (projection.continuationTruth.windowRiskState === "fallback_due") {
    return "warn";
  }
  if (projection.continuationTruth.windowRiskState === "overdue") {
    return "blocked";
  }
  if (projection.offerExpiryMode === "expired" || projection.offerExpiryMode === "superseded") {
    return "warn";
  }
  if (projection.continuationTruth.patientVisibleState === "offer_available") {
    return "primary";
  }
  return "safe";
}

function reservationTone(
  projection: PatientWaitlistViewProjection,
): "exclusive" | "nonexclusive" | "checking" | "unavailable" | "neutral" {
  switch (projection.activeReservationTruth?.truthState) {
    case "exclusive_held":
      return "exclusive";
    case "truthful_nonexclusive":
      return "nonexclusive";
    case "pending_confirmation":
      return "checking";
    case "expired":
    case "released":
    case "unavailable":
    case "revalidation_required":
    case "disputed":
      return "unavailable";
    default:
      return "neutral";
  }
}

function reservationHeadline(projection: PatientWaitlistViewProjection): string {
  switch (projection.activeReservationTruth?.truthState) {
    case "exclusive_held":
      return "Held for you";
    case "truthful_nonexclusive":
      return "Not held yet";
    case "pending_confirmation":
      return "Accepted and checking";
    case "expired":
      return "Offer expired";
    case "released":
      return projection.offerExpiryMode === "superseded"
        ? "Superseded by a newer offer"
        : "No longer live";
    case "unavailable":
    case "revalidation_required":
    case "disputed":
      return "Unavailable";
    default:
      return "No live offer yet";
  }
}

function reservationBody(projection: PatientWaitlistViewProjection): string {
  const cue = projection.activeReservationTruth?.dominantCue;
  if (cue) {
    return cue;
  }
  if (projection.continuationTruth.patientVisibleState === "waiting_for_offer") {
    return "When a suitable local time is released, the current offer card region will show it here.";
  }
  return "The current preference summary stays visible while the waitlist continuation changes.";
}

function offerDeadlineLabel(projection: PatientWaitlistViewProjection): string | null {
  const deadline = projection.offerResponseDeadlineAt;
  if (!deadline) {
    return null;
  }
  if (
    projection.activeReservationTruth?.countdownMode === "hold_expiry" &&
    projection.activeReservationTruth.exclusiveUntilAt
  ) {
    const remainingMs =
      Date.parse(projection.activeReservationTruth.exclusiveUntilAt) -
      Date.parse(projection.referenceNowAt);
    const remainingMinutes = Math.max(0, Math.round(remainingMs / 60_000));
    return `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} remaining`;
  }
  const time = new Date(deadline).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `Reply by ${time}`;
}

function focusStageHeading(): void {
  safeDocument()
    ?.querySelector<HTMLElement>("[data-testid='patient-waitlist-heading']")
    ?.focus({ preventScroll: true });
}

function WaitlistActionButtons({
  actions,
  onAction,
}: {
  actions: readonly WaitlistActionProjection[];
  onAction: (action: WaitlistActionProjection) => void;
}) {
  if (actions.length === 0) {
    return null;
  }
  return (
    <div className="patient-booking__waitlist-actions">
      {actions.map((action) => (
        <button
          key={`${action.actionRef}-${action.label}`}
          type="button"
          className={
            action.tone === "primary"
              ? "patient-booking__primary-action"
              : "patient-booking__secondary-action"
          }
          data-action-ref={action.actionRef}
          onClick={() => onAction(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function WaitlistSummaryList({
  rows,
}: {
  rows: readonly { label: string; value: string }[];
}) {
  return (
    <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
      {rows.map((row) => (
        <div key={row.label} className="patient-booking__summary-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function WaitlistStateStrip({
  projection,
}: {
  projection: PatientWaitlistViewProjection;
}) {
  const currentStep =
    projection.viewKind === "join_sheet"
      ? "join"
      : projection.viewKind === "manage_status"
        ? "waiting"
        : projection.viewKind === "offer_actionable" || projection.viewKind === "accepted_pending"
          ? "offer"
          : "fallback";
  const steps = [
    { step: "join", label: "Join" },
    { step: "waiting", label: "Waiting" },
    { step: "offer", label: "Offer" },
    { step: "fallback", label: "Fallback" },
  ] as const;

  return (
    <div className="patient-booking__waitlist-strip" data-current-step={currentStep}>
      {steps.map((entry) => (
        <div
          key={entry.step}
          className="patient-booking__waitlist-step"
          data-step={entry.step}
          data-state={entry.step === currentStep ? "current" : "idle"}
        >
          <span>{entry.label}</span>
        </div>
      ))}
    </div>
  );
}

export function WaitlistPreferenceSummary({
  projection,
}: {
  projection: PatientWaitlistViewProjection;
}) {
  return (
    <ResponsiveWaitlistCard
      variant="preference"
      testId="waitlist-preference-summary"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">WaitlistPreferenceSummary</span>
        <h3>Current preference summary</h3>
      </div>
      <WaitlistSummaryList rows={projection.preferenceSummaryRows} />
      <details className="patient-booking__details">
        <summary>Show deeper preference detail</summary>
        <WaitlistSummaryList rows={projection.preferenceDisclosureRows} />
      </details>
    </ResponsiveWaitlistCard>
  );
}

export function ActiveWaitlistOfferCard({
  projection,
}: {
  projection: PatientWaitlistViewProjection;
}) {
  const offer = projection.activeOffer;
  const deadlineLabel = offerDeadlineLabel(projection);

  return (
    <ResponsiveWaitlistCard
      variant="offer"
      testId="active-waitlist-offer-card"
      data-reservation-truth={projection.activeReservationTruth?.truthState ?? "none"}
      data-offer-expiry-mode={projection.offerExpiryMode}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">ActiveWaitlistOfferCard</span>
        <h3>{offer ? "Current offer context" : "Current waitlist context"}</h3>
      </div>
      {offer ? (
        <>
          <div className="patient-booking__waitlist-offer-head">
            <div>
              <strong>
                {offer.dayShortLabel} at {offer.startTimeLabel}
              </strong>
              <p>{offer.siteLabel}</p>
            </div>
            <span className={`patient-booking__waitlist-chip patient-booking__waitlist-chip--${reservationTone(projection)}`}>
              {reservationHeadline(projection)}
            </span>
          </div>
          <p className="patient-booking__waitlist-copy">{reservationBody(projection)}</p>
          <WaitlistSummaryList
            rows={[
              { label: "Clinician", value: offer.clinicianLabel },
              { label: "Modality", value: offer.modalityLabel },
              { label: "Travel", value: offer.travelCue ?? "Standard travel posture" },
              { label: "Offer window", value: deadlineLabel ?? "No response window shown" },
            ]}
          />
        </>
      ) : (
        <div className="patient-booking__waitlist-empty-offer">
          <strong>No live offer yet</strong>
          <p>
            {projection.continuationTruth.patientVisibleState === "pre_join"
              ? "Joining the waitlist keeps the current preferences ready for the next released local slot."
              : "The current preference summary stays pinned here while the system waits for a suitable local release."}
          </p>
        </div>
      )}
    </ResponsiveWaitlistCard>
  );
}

export function ExpiryOrSupersessionProvenanceCard({
  projection,
}: {
  projection: PatientWaitlistViewProjection;
}) {
  const offer = projection.activeOffer;
  if (!offer) {
    return null;
  }

  return (
    <ResponsiveWaitlistCard
      variant="provenance"
      testId="expiry-or-supersession-provenance-card"
      data-offer-expiry-mode={projection.offerExpiryMode}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">ExpiryOrSupersessionProvenanceCard</span>
        <h3>Read-only offer provenance</h3>
      </div>
      <div className="patient-booking__waitlist-offer-head">
        <div>
          <strong>
            {offer.dayShortLabel} at {offer.startTimeLabel}
          </strong>
          <p>{offer.siteLabel}</p>
        </div>
        <span className="patient-booking__waitlist-chip patient-booking__waitlist-chip--warn">
          {projection.offerExpiryMode === "superseded" ? "Superseded" : "Expired"}
        </span>
      </div>
      <p className="patient-booking__waitlist-copy">{reservationBody(projection)}</p>
      <WaitlistSummaryList
        rows={[
          { label: "Clinician", value: offer.clinicianLabel },
          { label: "Modality", value: offer.modalityLabel },
          {
            label: projection.offerExpiryMode === "superseded" ? "Superseded at" : "Expired at",
            value: offerDeadlineLabel(projection) ?? "Window ended",
          },
        ]}
      />
    </ResponsiveWaitlistCard>
  );
}

export function WaitlistContinuationStatePanel({
  projection,
}: {
  projection: PatientWaitlistViewProjection;
}) {
  return (
    <ResponsiveWaitlistCard
      variant="continuation"
      testId="waitlist-continuation-state-panel"
      data-tone={waitlistTone(projection)}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">WaitlistContinuationStatePanel</span>
        <h3>Current continuation truth</h3>
      </div>
      <WaitlistStateStrip projection={projection} />
      <div className="patient-booking__waitlist-chip-row">
        <span className={`patient-booking__waitlist-chip patient-booking__waitlist-chip--${waitlistTone(projection)}`}>
          {projection.continuationTruth.patientVisibleState.replaceAll("_", " ")}
        </span>
        <span className="patient-booking__waitlist-chip patient-booking__waitlist-chip--neutral">
          {projection.continuationTruth.windowRiskState.replaceAll("_", " ")}
        </span>
      </div>
      <p className="patient-booking__waitlist-copy" role="status">
        {projection.stateBody}
      </p>
      <WaitlistSummaryList rows={projection.statusRows} />
    </ResponsiveWaitlistCard>
  );
}

export function JoinWaitlistSheet({
  projection,
  onAction,
}: {
  projection: PatientWaitlistViewProjection;
  onAction: (action: WaitlistActionProjection) => void;
}) {
  return (
    <section
      className="patient-booking__waitlist-card patient-booking__waitlist-card--sheet"
      data-testid="join-waitlist-sheet"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">JoinWaitlistSheet</span>
        <h3>Keep this request moving locally</h3>
      </div>
      <p className="patient-booking__waitlist-copy">{projection.stateBody}</p>
      <WaitlistSummaryList rows={projection.contactRows} />
      <p className="patient-booking__waitlist-note">{projection.supportingNote}</p>
      <WaitlistActionButtons
        actions={[
          ...(projection.primaryAction ? [projection.primaryAction] : []),
          ...projection.secondaryActions,
        ]}
        onAction={onAction}
      />
    </section>
  );
}

export function WaitlistManageView({
  projection,
  supportActionLabel,
  onAction,
}: {
  projection: PatientWaitlistViewProjection;
  supportActionLabel: string;
  onAction: (action: WaitlistActionProjection) => void;
}) {
  const supportAction =
    projection.secondaryActions.find((action) => action.actionRef === "open_support") ??
    ({
      actionRef: "open_support",
      label: supportActionLabel,
      detail: "Ask the practice team to help with this waitlist continuation.",
      transitionScenarioId: null,
      tone: "secondary",
    } as const);

  return (
    <section
      className="patient-booking__waitlist-card patient-booking__waitlist-card--manage"
      data-testid="waitlist-manage-view"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">WaitlistManageView</span>
        <h3>{projection.stateHeading}</h3>
      </div>
      <p className="patient-booking__waitlist-copy">{projection.stateBody}</p>
      <div className="patient-booking__waitlist-manage-grid">
        <WaitlistSummaryList rows={projection.statusRows} />
        <WaitlistSummaryList rows={projection.contactRows} />
      </div>
      <p className="patient-booking__waitlist-note">{projection.supportingNote}</p>
      <WaitlistActionButtons actions={[supportAction]} onAction={onAction} />
    </section>
  );
}

export function WaitlistOfferAcceptView({
  projection,
  onAction,
}: {
  projection: PatientWaitlistViewProjection;
  onAction: (action: WaitlistActionProjection) => void;
}) {
  const actions = [
    ...(projection.primaryAction ? [projection.primaryAction] : []),
    ...projection.secondaryActions,
  ];

  return (
    <section
      className="patient-booking__waitlist-card patient-booking__waitlist-card--offer"
      data-testid="waitlist-offer-accept-view"
      data-reservation-truth={projection.activeReservationTruth?.truthState ?? "none"}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">WaitlistOfferAcceptView</span>
        <h3>{projection.stateHeading}</h3>
      </div>
      <p className="patient-booking__waitlist-copy">{projection.stateBody}</p>
      <p className="patient-booking__waitlist-note">{projection.supportingNote}</p>
      <WaitlistActionButtons actions={actions} onAction={onAction} />
    </section>
  );
}

export function WaitlistExpiryOutcome({
  projection,
  onAction,
}: {
  projection: PatientWaitlistViewProjection;
  onAction: (action: WaitlistActionProjection) => void;
}) {
  return (
    <section
      className="patient-booking__waitlist-card patient-booking__waitlist-card--expiry"
      data-testid="waitlist-expiry-outcome"
      data-offer-expiry-mode={projection.offerExpiryMode}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">WaitlistExpiryOutcome</span>
        <h3>{projection.stateHeading}</h3>
      </div>
      <p className="patient-booking__waitlist-copy">{projection.stateBody}</p>
      <p className="patient-booking__waitlist-note">{projection.supportingNote}</p>
      <WaitlistActionButtons
        actions={[
          ...(projection.primaryAction ? [projection.primaryAction] : []),
          ...projection.secondaryActions,
        ]}
        onAction={onAction}
      />
    </section>
  );
}

export function WaitlistFallbackPanel({
  projection,
  onAction,
}: {
  projection: PatientWaitlistViewProjection;
  onAction: (action: WaitlistActionProjection) => void;
}) {
  return (
    <section
      className="patient-booking__waitlist-card patient-booking__waitlist-card--fallback"
      data-testid="waitlist-fallback-panel"
      data-fallback-route={projection.fallback.requiredFallbackRoute}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">WaitlistFallbackPanel</span>
        <h3>{projection.fallback.headline}</h3>
      </div>
      <p className="patient-booking__waitlist-copy">{projection.fallback.body}</p>
      <WaitlistSummaryList
        rows={[
          { label: "Current continuation", value: projection.continuationTruth.patientVisibleState.replaceAll("_", " ") },
          { label: "Window risk", value: projection.continuationTruth.windowRiskState.replaceAll("_", " ") },
          { label: "Transfer state", value: projection.fallback.transferState.replaceAll("_", " ") },
        ]}
      />
      <p className="patient-booking__waitlist-note">{projection.supportingNote}</p>
      <WaitlistActionButtons
        actions={[
          ...(projection.primaryAction ? [projection.primaryAction] : []),
          ...projection.secondaryActions,
        ]}
        onAction={onAction}
      />
    </section>
  );
}

export function WaitlistContactRepairMorph({
  projection,
  onAction,
}: {
  projection: PatientWaitlistViewProjection;
  onAction: (action: WaitlistActionProjection) => void;
}) {
  const repair = projection.contactRepair;
  if (!repair) {
    return null;
  }

  return (
    <section
      className="patient-booking__waitlist-card patient-booking__waitlist-card--repair"
      data-testid="waitlist-contact-repair-morph"
      data-repair-state={repair.repairState}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">WaitlistContactRepairMorph</span>
        <h3>{repair.repairEntryLabel}</h3>
      </div>
      <p className="patient-booking__waitlist-copy">{repair.repairBody}</p>
      <WaitlistSummaryList
        rows={[
          { label: "Blocked action", value: repair.blockedActionSummary },
          { label: "Current route", value: repair.maskedDestination },
          { label: "Channel", value: repair.channelLabel },
        ]}
      />
      <p className="patient-booking__waitlist-note">{projection.supportingNote}</p>
      <WaitlistActionButtons
        actions={[
          ...(projection.primaryAction ? [projection.primaryAction] : []),
          ...projection.secondaryActions,
        ]}
        onAction={onAction}
      />
    </section>
  );
}

function StickyWaitlistActionBar({
  projection,
  onAction,
}: {
  projection: PatientWaitlistViewProjection;
  onAction: (action: WaitlistActionProjection) => void;
}) {
  if (!projection.stickyActionVisible || !projection.primaryAction) {
    return null;
  }

  return (
    <BookingStickyActionTray
      testId="waitlist-sticky-action"
      primaryTestId="waitlist-sticky-primary-action"
      title={projection.primaryAction.label}
      detail={projection.primaryAction.detail}
      primaryActionLabel={projection.primaryAction.label}
      primaryActionRef={projection.primaryAction.actionRef}
      onPrimaryAction={() => onAction(projection.primaryAction!)}
    />
  );
}

function SecureLinkBanner({
  projection,
}: {
  projection: PatientWaitlistViewProjection;
}) {
  if (!projection.secureLinkNote) {
    return null;
  }

  return (
    <section
      className="patient-booking__waitlist-card patient-booking__waitlist-card--secure-link"
      data-testid="waitlist-secure-link-banner"
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">Secure link continuation</span>
        <h3>Same shell, same waitlist context</h3>
      </div>
      <p className="patient-booking__waitlist-copy">{projection.secureLinkNote}</p>
    </section>
  );
}

function renderPrimaryPanel(
  projection: PatientWaitlistViewProjection,
  supportActionLabel: string,
  onAction: (action: WaitlistActionProjection) => void,
) {
  if (projection.reachabilityState === "repair_required") {
    return <WaitlistContactRepairMorph projection={projection} onAction={onAction} />;
  }
  switch (projection.viewKind) {
    case "join_sheet":
      return <JoinWaitlistSheet projection={projection} onAction={onAction} />;
    case "manage_status":
      return (
        <WaitlistManageView
          projection={projection}
          supportActionLabel={supportActionLabel}
          onAction={onAction}
        />
      );
    case "offer_actionable":
    case "accepted_pending":
      return <WaitlistOfferAcceptView projection={projection} onAction={onAction} />;
    case "expired_outcome":
      return <WaitlistExpiryOutcome projection={projection} onAction={onAction} />;
    case "fallback_due":
      return <WaitlistFallbackPanel projection={projection} onAction={onAction} />;
    case "contact_repair":
    default:
      return <WaitlistContactRepairMorph projection={projection} onAction={onAction} />;
  }
}

export function PatientWaitlistViews({
  bookingCaseId,
  shellContinuityKey,
  supportActionLabel,
  onSupportAction,
  onReturnToOrigin,
  onReturnToSelection,
}: PatientWaitlistViewsProps) {
  const responsive = useBookingResponsive();
  const initial = deriveInitialProjection(bookingCaseId, shellContinuityKey);
  const [scenarioId, setScenarioId] = useState(initial.projection?.scenarioId ?? bookingCaseId);
  const [announcement, setAnnouncement] = useState(
    initial.projection?.liveAnnouncement ?? "Waitlist continuation loaded.",
  );
  const headingRef = useRef<HTMLHeadingElement>(null);

  const projection = resolveProjectionForScenario(bookingCaseId, scenarioId);
  const recoveryProjection = projection
    ? resolveWaitlistBookingRecoveryEnvelope(
        projection.scenarioId,
        projection.entryMode === "secure_link" ? "secure_link" : "authenticated",
        supportActionLabel,
      )
    : null;

  useEffect(() => {
    if (!projection) {
      return;
    }
    writeRestoreBundle({
      projectionName: "WaitlistRestoreBundle298",
      bookingCaseId,
      shellContinuityKey,
      scenarioId: projection.scenarioId,
    });
  }, [bookingCaseId, projection, scenarioId, shellContinuityKey]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [scenarioId]);

  if (!projection) {
    return (
      <section className="patient-booking__waitlist-stage" data-testid="patient-waitlist-stage">
        <p>Waitlist continuation is not available for this booking case.</p>
      </section>
    );
  }

  function transitionTo(nextScenarioId: string): void {
    const nextProjection = resolveProjectionForScenario(bookingCaseId, nextScenarioId);
    if (!nextProjection) {
      return;
    }
    startTransition(() => {
      setScenarioId(nextScenarioId);
      setAnnouncement(nextProjection.liveAnnouncement);
    });
    safeWindow()?.setTimeout(() => focusStageHeading(), 0);
  }

  function handleAction(action: WaitlistActionProjection): void {
    switch (action.actionRef) {
      case "open_support":
        onSupportAction();
        setAnnouncement(action.detail);
        return;
      case "return_to_selection":
        onReturnToSelection?.();
        return;
      default:
        if (action.transitionScenarioId) {
          transitionTo(action.transitionScenarioId);
        }
    }
  }

  function handleRecoveryAction(action: BookingRecoveryActionProjection): void {
    switch (action.actionRef) {
      case "keep_waitlist_active":
      case "open_newer_offer":
      case "open_contact_repair":
        if (action.transitionScenarioId) {
          transitionTo(action.transitionScenarioId);
          return;
        }
        setAnnouncement(action.detail);
        safeDocument()
          ?.querySelector<HTMLElement>("[data-testid='BookingContactRepairMorph']")
          ?.focus({ preventScroll: true });
        return;
      case "request_support":
        onSupportAction();
        setAnnouncement(action.detail);
        return;
      default:
        setAnnouncement(action.detail);
    }
  }

  return (
    <section
      className="patient-booking__waitlist-stage"
      data-testid="patient-waitlist-stage"
      data-stage-name="PatientWaitlistViews"
      data-task-id={PATIENT_WAITLIST_VIEWS_TASK_ID}
      data-visual-mode={PATIENT_WAITLIST_VIEWS_VISUAL_MODE}
      data-waitlist-state={projection.viewKind}
      data-continuation-truth={projection.continuationTruth.patientVisibleState}
      data-window-risk-state={projection.continuationTruth.windowRiskState}
      data-reservation-truth={projection.activeReservationTruth?.truthState ?? "none"}
      data-offer-expiry-mode={projection.offerExpiryMode}
      data-fallback-route={projection.fallback.requiredFallbackRoute}
      data-entry-mode={projection.entryMode}
      data-reachability-state={projection.reachabilityState}
    >
      {recoveryProjection ? (
        <BookingRecoveryShell
          projection={recoveryProjection}
          onAction={handleRecoveryAction}
          onReturn={onReturnToOrigin ?? onReturnToSelection ?? onSupportAction}
        />
      ) : (
        <>
          <SecureLinkBanner projection={projection} />
          <BookingResponsiveStage
            stageName="PatientWaitlistViews"
            testId="patient-waitlist-responsive-stage"
            foldedPinned={
              projection.offerExpiryMode === "expired" || projection.offerExpiryMode === "superseded" ? (
                <ExpiryOrSupersessionProvenanceCard projection={projection} />
              ) : (
                <ActiveWaitlistOfferCard projection={projection} />
              )
            }
            railToggleLabel="View waitlist details"
            railTitle="Waitlist preferences and active offer"
            rail={
              <aside className="patient-booking__waitlist-rail">
                <WaitlistPreferenceSummary projection={projection} />
                {projection.offerExpiryMode === "expired" || projection.offerExpiryMode === "superseded" ? (
                  <ExpiryOrSupersessionProvenanceCard projection={projection} />
                ) : (
                  <ActiveWaitlistOfferCard projection={projection} />
                )}
              </aside>
            }
            stickyTray={
              projection.stickyActionVisible && responsive.missionStackState === "folded" ? (
                <StickyWaitlistActionBar projection={projection} onAction={handleAction} />
              ) : undefined
            }
            main={
              <div className="patient-booking__waitlist-main">
                <div className="patient-booking__section-head patient-booking__waitlist-stage-head">
                  <span className="patient-booking__eyebrow">Waitlist continuation</span>
                  <h3 ref={headingRef} tabIndex={-1} data-testid="patient-waitlist-heading">
                    {projection.stateHeading}
                  </h3>
                </div>
                <WaitlistContinuationStatePanel projection={projection} />
                {renderPrimaryPanel(projection, supportActionLabel, handleAction)}
                {projection.viewKind !== "fallback_due" &&
                (projection.continuationTruth.windowRiskState === "fallback_due" ||
                  projection.continuationTruth.windowRiskState === "overdue") ? (
                  <WaitlistFallbackPanel projection={projection} onAction={handleAction} />
                ) : null}
              </div>
            }
          />
        </>
      )}
      <div
        className="patient-booking__waitlist-live"
        role="status"
        aria-live="polite"
        data-testid="waitlist-live-region"
      >
        {announcement}
      </div>
    </section>
  );
}
