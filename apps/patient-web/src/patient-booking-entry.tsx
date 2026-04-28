import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";
import {
  PATIENT_BOOKING_ENTRY_TASK_ID,
  PATIENT_BOOKING_ENTRY_VISUAL_MODE,
  isPatientBookingEntryPath,
  resolvePatientBookingEntryProjection,
  type BookingEntryAction,
  type BookingEntryFactRow,
  type PatientBookingEntryProjection,
  type PatientBookingEntryRestoreBundle300,
} from "./patient-booking-entry.model";

export { isPatientBookingEntryPath };

const BOOKING_ENTRY_RESTORE_STORAGE_KEY = "patient-booking-entry-300::restore-bundle";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function readRestoreBundle(): PatientBookingEntryRestoreBundle300 | null {
  const raw = safeWindow()?.sessionStorage.getItem(BOOKING_ENTRY_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PatientBookingEntryRestoreBundle300;
    return parsed.projectionName === "PatientBookingEntryRestoreBundle300" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: PatientBookingEntryRestoreBundle300): void {
  safeWindow()?.sessionStorage.setItem(BOOKING_ENTRY_RESTORE_STORAGE_KEY, JSON.stringify(bundle));
}

function actionLabel(action: BookingEntryAction): string {
  return action.label;
}

function SummaryList({
  rows,
  compact = false,
}: {
  rows: readonly BookingEntryFactRow[];
  compact?: boolean;
}) {
  return (
    <dl
      className={`patient-booking-entry__summary-list${
        compact ? " patient-booking-entry__summary-list--compact" : ""
      }`}
    >
      {rows.map((row) => (
        <div key={`${row.label}:${row.value}`} className="patient-booking-entry__summary-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BookingEntryReturnBinder({
  restoreBundle,
  projection,
}: {
  restoreBundle: PatientBookingEntryRestoreBundle300;
  projection: PatientBookingEntryProjection;
}) {
  return (
    <div
      hidden
      aria-hidden="true"
      data-testid="booking-entry-return-binder"
      data-restore-storage-key={BOOKING_ENTRY_RESTORE_STORAGE_KEY}
      data-return-route-ref={restoreBundle.returnRouteRef}
      data-selected-anchor-ref={restoreBundle.selectedAnchorRef}
      data-selected-anchor-label={restoreBundle.selectedAnchorLabel}
      data-continuity-tuple-hash={restoreBundle.continuityTupleHash}
      data-nav-return-contract-ref={projection.adapter.navReturnContractRef ?? "not_applicable"}
      data-request-return-bundle-ref={projection.adapter.requestReturnBundleRef ?? "not_applicable"}
      data-record-origin-continuation-ref={projection.adapter.recordOriginContinuationRef ?? "not_applicable"}
      data-recovery-continuation-token-ref={projection.adapter.recoveryContinuationTokenRef ?? "not_applicable"}
    />
  );
}

function BookingEntryContextRibbon({
  projection,
  ribbonRef,
}: {
  projection: PatientBookingEntryProjection;
  ribbonRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={ribbonRef}
      tabIndex={-1}
      className="patient-booking-entry__context-ribbon"
      data-testid="BookingEntryContextRibbon"
      aria-labelledby="booking-entry-context-heading"
    >
      <div className="patient-booking-entry__section-head">
        <div>
          <span className="patient-booking-entry__eyebrow">{projection.contextRibbon.eyebrow}</span>
          <h2 id="booking-entry-context-heading">{projection.contextRibbon.heading}</h2>
          <p>{projection.contextRibbon.body}</p>
        </div>
        <div className="patient-booking-entry__signal-cluster">
          <span data-tone={projection.contextRibbon.statusTone}>
            {projection.contextRibbon.statusLabel}
          </span>
          <span>{projection.originLabel}</span>
        </div>
      </div>
      <SummaryList rows={projection.contextRibbon.summaryRows} compact />
    </section>
  );
}

function BookingSourceBadge({
  projection,
}: {
  projection: PatientBookingEntryProjection;
}) {
  return (
    <section
      className="patient-booking-entry__card patient-booking-entry__card--badge"
      data-testid="BookingSourceBadge"
      data-origin-type={projection.sourceBadge.originType}
    >
      <span
        className="patient-booking-entry__source-chip"
        data-origin-tone={projection.sourceBadge.tone}
      >
        {projection.sourceBadge.label}
      </span>
      <strong>{projection.originLabel}</strong>
      <p>
        Source object ref: <span>{projection.sourceBadge.objectRef}</span>
      </p>
    </section>
  );
}

function BookingLaunchSummaryCard({
  projection,
}: {
  projection: PatientBookingEntryProjection;
}) {
  return (
    <section
      className="patient-booking-entry__card patient-booking-entry__card--summary"
      data-testid="BookingLaunchSummaryCard"
      aria-labelledby="booking-launch-summary-heading"
    >
      <div className="patient-booking-entry__section-head">
        <div>
          <span className="patient-booking-entry__eyebrow">{projection.summaryCard.heading}</span>
          <h3 id="booking-launch-summary-heading">What this launch preserves</h3>
        </div>
      </div>
      <p className="patient-booking-entry__copy">{projection.summaryCard.body}</p>
      <SummaryList rows={projection.summaryCard.factRows} />
    </section>
  );
}

function RecordFollowUpBookingCard({
  card,
}: {
  card: NonNullable<PatientBookingEntryProjection["recordFollowUpCard"]>;
}) {
  return (
    <section
      className="patient-booking-entry__card patient-booking-entry__card--record"
      data-testid="RecordFollowUpBookingCard"
      aria-labelledby="record-follow-up-booking-heading"
    >
      <div className="patient-booking-entry__section-head">
        <div>
          <span className="patient-booking-entry__eyebrow">{card.heading}</span>
          <h3 id="record-follow-up-booking-heading">Record-origin continuation</h3>
        </div>
      </div>
      <p className="patient-booking-entry__copy">{card.body}</p>
      <p className="patient-booking-entry__note">{card.bookingOfferReason}</p>
      <SummaryList rows={card.factRows} compact />
    </section>
  );
}

function BookingEntryNextActionPanel({
  projection,
  onAction,
}: {
  projection: PatientBookingEntryProjection;
  onAction: (action: BookingEntryAction) => void;
}) {
  return (
    <section
      className="patient-booking-entry__card patient-booking-entry__card--next"
      data-testid="BookingEntryNextActionPanel"
      data-entry-writable={projection.entryWritability}
      aria-labelledby="booking-entry-next-action-heading"
    >
      <div className="patient-booking-entry__section-head">
        <div>
          <span className="patient-booking-entry__eyebrow">BookingEntryNextActionPanel</span>
          <h3 id="booking-entry-next-action-heading">{projection.nextActionPanel.heading}</h3>
        </div>
      </div>
      <p className="patient-booking-entry__copy">{projection.nextActionPanel.body}</p>
      <p className="patient-booking-entry__note">{projection.nextActionPanel.note}</p>
      <div className="patient-booking-entry__action-row">
        <button
          type="button"
          className="patient-booking-entry__primary-action"
          data-testid="booking-entry-primary-action"
          onClick={() => onAction(projection.nextActionPanel.primaryAction)}
        >
          {actionLabel(projection.nextActionPanel.primaryAction)}
        </button>
        {projection.nextActionPanel.secondaryActions.map((action) => (
          <button
            key={action.actionRef}
            type="button"
            className="patient-booking-entry__secondary-action"
            data-testid={`booking-entry-action-${action.actionRef}`}
            onClick={() => onAction(action)}
          >
            {actionLabel(action)}
          </button>
        ))}
      </div>
    </section>
  );
}

function BookingQuietReturnStub({
  projection,
  onAction,
}: {
  projection: PatientBookingEntryProjection;
  onAction: (action: BookingEntryAction) => void;
}) {
  return (
    <section
      className="patient-booking-entry__card patient-booking-entry__card--return"
      data-testid="BookingQuietReturnStub"
      aria-labelledby="booking-entry-return-heading"
    >
      <div className="patient-booking-entry__section-head">
        <div>
          <span className="patient-booking-entry__eyebrow">BookingQuietReturnStub</span>
          <h3 id="booking-entry-return-heading">{projection.quietReturnStub.heading}</h3>
        </div>
      </div>
      <p className="patient-booking-entry__copy">{projection.quietReturnStub.body}</p>
      <button
        type="button"
        className="patient-booking-entry__secondary-action"
        data-testid="booking-entry-return-action"
        onClick={() => onAction(projection.quietReturnStub.action)}
      >
        {projection.quietReturnStub.action.label}
      </button>
    </section>
  );
}

function RecordOriginBookingEntrySurface({
  projection,
  ribbonRef,
  onAction,
}: {
  projection: PatientBookingEntryProjection;
  ribbonRef: React.RefObject<HTMLElement | null>;
  onAction: (action: BookingEntryAction) => void;
}) {
  const recoveryVisible =
    projection.entryWritability !== "writable" || projection.recordFollowUpCard !== null;

  return (
    <section
      className="patient-booking-entry__surface"
      data-testid="RecordOriginBookingEntrySurface"
      data-origin-type={projection.originType}
      data-origin-object={projection.originObjectRef}
      data-record-continuation-state={projection.recordContinuationState}
      data-return-posture={projection.returnPosture}
      data-entry-writable={projection.entryWritability}
    >
      <BookingEntryContextRibbon projection={projection} ribbonRef={ribbonRef} />
      <div className="patient-booking-entry__layout">
        <aside className="patient-booking-entry__rail patient-booking-entry__rail--source">
          <BookingSourceBadge projection={projection} />
          {projection.recordFollowUpCard ? (
            <RecordFollowUpBookingCard card={projection.recordFollowUpCard} />
          ) : null}
        </aside>
        <div className="patient-booking-entry__main-column">
          <BookingLaunchSummaryCard projection={projection} />
          <BookingEntryNextActionPanel projection={projection} onAction={onAction} />
        </div>
        {recoveryVisible ? (
          <aside className="patient-booking-entry__rail patient-booking-entry__rail--return">
            <BookingQuietReturnStub projection={projection} onAction={onAction} />
          </aside>
        ) : null}
      </div>
      <div className="patient-booking-entry__sticky-tray" data-testid="booking-entry-sticky-tray">
        <div className="patient-booking-entry__sticky-copy">
          <span>{projection.contextRibbon.statusLabel}</span>
          <strong>{projection.nextActionPanel.primaryAction.label}</strong>
        </div>
        <button
          type="button"
          className="patient-booking-entry__primary-action"
          data-testid="booking-entry-sticky-primary"
          onClick={() => onAction(projection.nextActionPanel.primaryAction)}
        >
          {projection.nextActionPanel.primaryAction.label}
        </button>
      </div>
    </section>
  );
}

function usePatientBookingEntryController() {
  const ownerWindow = safeWindow();
  const restoredBundleRef = useRef<PatientBookingEntryRestoreBundle300 | null>(readRestoreBundle());
  const [entry, setEntry] = useState<PatientBookingEntryProjection>(() =>
    resolvePatientBookingEntryProjection({
      pathname: ownerWindow?.location.pathname ?? "/bookings/entry/booking_entry_300_home_ready",
      restoredBundle: restoredBundleRef.current,
      restoredBy: restoredBundleRef.current ? "refresh_replay" : "query",
    }),
  );
  const [announcement, setAnnouncement] = useState(
    "Booking entry route loaded.",
  );
  const ribbonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    writeRestoreBundle({
      ...entry.restoreBundle,
      restoredBy: "refresh_replay",
    });
  }, [entry]);

  useEffect(() => {
    const onPopState = () => {
      const restoredBundle = readRestoreBundle();
      startTransition(() => {
        const nextEntry = resolvePatientBookingEntryProjection({
          pathname: ownerWindow?.location.pathname ?? entry.pathname,
          restoredBundle,
          restoredBy: "browser_back",
        });
        setEntry(nextEntry);
        setAnnouncement(`${nextEntry.originLabel} booking entry restored.`);
      });
    };
    ownerWindow?.addEventListener("popstate", onPopState);
    return () => ownerWindow?.removeEventListener("popstate", onPopState);
  }, [entry.pathname, entry.originLabel, ownerWindow]);

  useEffect(() => {
    ribbonRef.current?.focus({ preventScroll: true });
  }, [entry.pathname, entry.continuityPosture]);

  useEffect(() => {
    const beforeUnload = () => {
      writeRestoreBundle({
        ...entry.restoreBundle,
        restoredBy: "refresh_replay",
      });
    };
    ownerWindow?.addEventListener("beforeunload", beforeUnload);
    return () => ownerWindow?.removeEventListener("beforeunload", beforeUnload);
  }, [entry.restoreBundle, ownerWindow]);

  function navigateToTarget(url: string): void {
    writeRestoreBundle({
      ...entry.restoreBundle,
      restoredBy: "soft_navigation",
    });
    ownerWindow?.location.assign(url);
  }

  function runAction(action: BookingEntryAction): void {
    switch (action.actionRef) {
      case "continue_booking":
      case "continue_to_selection":
        navigateToTarget(entry.targetWorkspacePath);
        return;
      case "return_to_origin":
      case "review_origin_read_only":
      case "recover_record_continuation":
        navigateToTarget(entry.restoreBundle.returnRouteRef);
        return;
      case "contact_support":
        setAnnouncement("Support guidance focused from booking entry.");
        ribbonRef.current?.focus({ preventScroll: true });
        return;
      case "recheck_entry_continuity":
        startTransition(() => {
          const nextEntry = resolvePatientBookingEntryProjection({
            pathname: entry.pathname,
            restoredBundle: readRestoreBundle(),
            restoredBy: "soft_navigation",
          });
          setEntry(nextEntry);
          setAnnouncement(
            `${nextEntry.contextRibbon.statusLabel} after continuity recheck.`,
          );
        });
        return;
    }
  }

  return {
    entry,
    announcement,
    ribbonRef,
    runAction,
  };
}

export default function PatientBookingEntryApp() {
  const controller = usePatientBookingEntryController();
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: controller.entry.pathname,
  });
  const projection = controller.entry;

  return (
    <div
      className="patient-booking-entry"
      data-testid="Patient_Record_Origin_Booking_Entry_Route"
      data-task-id={PATIENT_BOOKING_ENTRY_TASK_ID}
      data-visual-mode={PATIENT_BOOKING_ENTRY_VISUAL_MODE}
      data-shell="patient-booking-entry"
      data-origin-type={projection.originType}
      data-origin-object={projection.originObjectRef}
      data-record-continuation-state={projection.recordContinuationState}
      data-return-posture={projection.returnPosture}
      data-entry-writable={projection.entryWritability}
      data-continuity-posture={projection.continuityPosture}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-cause-class={phase2Context.causeClass}
      data-recovery-class={phase2Context.recoveryClass}
      data-canonical-status-label={phase2Context.canonicalStatusLabel}
    >
      <header className="patient-booking-entry__top-band" data-testid="patient-booking-entry-top-band">
        <a className="patient-booking-entry__brand" href="/home">
          <span>
            <VecellLogoWordmark aria-hidden="true" className="patient-booking-entry__brand-wordmark" />
            <small>Signed-in patient shell</small>
          </span>
        </a>
        <nav aria-label="Patient booking entry navigation" className="patient-booking-entry__nav">
          <a href="/home">Home</a>
          <a href="/requests">Requests</a>
          <a href="/appointments">Appointments</a>
          <a href="/records">Records</a>
        </nav>
      </header>
      <PatientSupportPhase2Bridge context={phase2Context} />
      <BookingEntryReturnBinder restoreBundle={projection.restoreBundle} projection={projection} />
      <main className="patient-booking-entry__main">
        <h1 className="patient-booking-entry__route-title">
          Booking entry
        </h1>
        <RecordOriginBookingEntrySurface
          projection={projection}
          ribbonRef={controller.ribbonRef}
          onAction={controller.runAction}
        />
      </main>
      <div
        className="patient-booking-entry__live"
        aria-live="polite"
        data-testid="booking-entry-live-region"
      >
        {controller.announcement}
      </div>
    </div>
  );
}
