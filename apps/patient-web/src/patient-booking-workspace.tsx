import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import {
  PATIENT_BOOKING_WORKSPACE_TASK_ID,
  PATIENT_BOOKING_WORKSPACE_VISUAL_MODE,
  humanize,
  isPatientBookingWorkspacePath,
  resolvePatientBookingWorkspaceEntry,
  type BookingArtifactRouteMode,
  type BookingArtifactRouteSource,
  type BookingNotificationEntryProjection,
  type BookingWorkspaceActionScope,
  type BookingWorkspaceRestoreBundle293,
  type PatientAppointmentWorkspaceProjection293,
  type PatientBookingWorkspaceEntryProjection,
  type PatientBookingWorkspaceRouteKey,
} from "./patient-booking-workspace.model";
import { PatientAppointmentDetailView } from "./patient-appointment-manage";
import { PatientBookingArtifactFrame } from "./patient-booking-artifact";
import { BookingConfirmationStage } from "./patient-booking-confirmation";
import { OfferSelectionStage } from "./patient-booking-offer-selection";
import { BookingRecoveryShell } from "./patient-booking-recovery";
import {
  resolveWorkspaceBookingRecoveryEnvelope,
  type BookingRecoveryActionProjection,
} from "./patient-booking-recovery.model";
import { PatientWaitlistViews } from "./patient-waitlist-views";
import {
  BookingResponsiveProvider,
  BookingResponsiveStage,
  BookingStickyActionTray,
  EmbeddedBookingChromeAdapter,
  useBookingResponsive,
} from "./patient-booking-responsive";
import {
  PATIENT_BOOKING_RESPONSIVE_TASK_ID,
  PATIENT_BOOKING_RESPONSIVE_VISUAL_MODE,
} from "./patient-booking-responsive.model";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";

export { isPatientBookingWorkspacePath };

const BOOKING_RESTORE_STORAGE_KEY = "patient-booking-workspace-293::restore-bundle";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function readRestoreBundle(): BookingWorkspaceRestoreBundle293 | null {
  const raw = safeWindow()?.sessionStorage.getItem(BOOKING_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as BookingWorkspaceRestoreBundle293;
    return parsed.projectionName === "BookingWorkspaceRestoreBundle293" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: BookingWorkspaceRestoreBundle293): void {
  safeWindow()?.sessionStorage.setItem(BOOKING_RESTORE_STORAGE_KEY, JSON.stringify(bundle));
}

function buildSearch(
  currentSearch: string | undefined,
  bundle: BookingWorkspaceRestoreBundle293,
  artifactState?: {
    source: BookingArtifactRouteSource;
    mode: BookingArtifactRouteMode;
  } | null,
): string {
  const params = new URLSearchParams(currentSearch ?? "");
  params.set("origin", bundle.returnContract.originKey);
  params.set("returnRoute", bundle.returnContract.returnRouteRef);
  params.set("anchor", bundle.selectedAnchorRef);
  params.set("anchorLabel", bundle.selectedAnchorLabel);
  params.delete("artifactSource");
  params.delete("artifactMode");
  if (artifactState) {
    params.set("artifactSource", artifactState.source);
    params.set("artifactMode", artifactState.mode);
  }
  return `?${params.toString()}`;
}

function focusByAnchor(anchorRef: string): void {
  const target = safeDocument()?.querySelector<HTMLElement>(`[data-anchor-ref='${anchorRef}']`);
  target?.focus({ preventScroll: true });
}

function persistScroll(bundle: BookingWorkspaceRestoreBundle293): BookingWorkspaceRestoreBundle293 {
  const ownerWindow = safeWindow();
  return {
    ...bundle,
    scrollStateRef: ownerWindow ? `y:${Math.round(ownerWindow.scrollY)}` : null,
  };
}

function restoreScroll(scrollStateRef: string | null): void {
  if (!scrollStateRef?.startsWith("y:")) {
    return;
  }
  const scrollY = Number(scrollStateRef.slice(2));
  if (Number.isFinite(scrollY)) {
    safeWindow()?.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
  }
}

function usePatientBookingWorkspaceController() {
  const ownerWindow = safeWindow();
  const storedBundleRef = useRef<BookingWorkspaceRestoreBundle293 | null>(readRestoreBundle());
  const [entry, setEntry] = useState<PatientBookingWorkspaceEntryProjection>(() =>
    resolvePatientBookingWorkspaceEntry({
      pathname: ownerWindow?.location.pathname ?? "/bookings/booking_case_293_live",
      search: ownerWindow?.location.search,
      restoredBundle: storedBundleRef.current,
      restoredBy: storedBundleRef.current ? "refresh_replay" : "query",
    }),
  );
  const [announcement, setAnnouncement] = useState(
    "Appointment scheduling workspace loaded.",
  );
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    writeRestoreBundle(persistScroll(entry.restoreBundle));
  }, [entry]);

  useEffect(() => {
    const onPopState = () => {
      const restoredBundle = readRestoreBundle();
      startTransition(() => {
        const nextEntry = resolvePatientBookingWorkspaceEntry({
          pathname: ownerWindow?.location.pathname ?? entry.pathname,
          search: ownerWindow?.location.search,
          restoredBundle,
          restoredBy: "browser_back",
        });
        setEntry(nextEntry);
        setAnnouncement(
          `${humanize(nextEntry.routeKey)} restored for ${nextEntry.workspace.heading}.`,
        );
      });
    };
    ownerWindow?.addEventListener("popstate", onPopState);
    return () => ownerWindow?.removeEventListener("popstate", onPopState);
  }, [entry.pathname, entry.workspace.heading, ownerWindow]);

  useEffect(() => {
    const bundle = readRestoreBundle();
    if (bundle?.shellContinuityKey === entry.workspace.continuityEvidence.shellContinuityKey) {
      restoreScroll(bundle.scrollStateRef);
    }
    if (entry.routeKey === "workspace") {
      headingRef.current?.focus({ preventScroll: true });
      return;
    }
    focusByAnchor(entry.workspace.continuityEvidence.selectedAnchorRef);
  }, [
    entry.pathname,
    entry.routeKey,
    entry.workspace.continuityEvidence.selectedAnchorRef,
    entry.workspace.continuityEvidence.shellContinuityKey,
  ]);

  useEffect(() => {
    const beforeUnload = () => {
      writeRestoreBundle(persistScroll(entry.restoreBundle));
    };
    ownerWindow?.addEventListener("beforeunload", beforeUnload);
    return () => ownerWindow?.removeEventListener("beforeunload", beforeUnload);
  }, [entry.restoreBundle, ownerWindow]);

  function resolveAndNavigate(
    routeKey: PatientBookingWorkspaceRouteKey,
    anchorRef?: string,
    anchorLabel?: string,
    artifactState?: {
      source: BookingArtifactRouteSource;
      mode: BookingArtifactRouteMode;
    } | null,
  ): void {
    const path =
      routeKey === "workspace"
        ? `/bookings/${entry.workspace.bookingCaseId}`
        : `/bookings/${entry.workspace.bookingCaseId}/${routeKey}`;
    const nextBundle: BookingWorkspaceRestoreBundle293 = {
      ...entry.restoreBundle,
      routeKey,
      pathname: path,
      selectedAnchorRef: anchorRef ?? entry.restoreBundle.selectedAnchorRef,
      selectedAnchorLabel: anchorLabel ?? entry.restoreBundle.selectedAnchorLabel,
      restoredBy: "soft_navigation",
    };
    const nextSearch = buildSearch(ownerWindow?.location.search, nextBundle, artifactState ?? null);
    const nextEntry = resolvePatientBookingWorkspaceEntry({
      pathname: path,
      search: nextSearch,
      restoredBundle: nextBundle,
      restoredBy: "soft_navigation",
    });
    writeRestoreBundle(persistScroll(nextEntry.restoreBundle));
    setEntry(nextEntry);
    ownerWindow?.history.pushState({}, "", `${nextEntry.pathname}${nextSearch}`);
    setAnnouncement(`${humanize(routeKey)} opened for ${nextEntry.workspace.serviceLine}.`);
  }

  function returnToOrigin(): void {
    writeRestoreBundle(persistScroll(entry.restoreBundle));
    ownerWindow?.location.assign(entry.workspace.returnContract.returnRouteRef);
  }

  function focusHelpPanel(): void {
    focusByAnchor("booking-help-panel");
    setAnnouncement("Booking help path focused.");
  }

  function focusProvenance(): void {
    focusByAnchor("booking-provenance-card");
    setAnnouncement("Booking provenance focused.");
  }

  function runDominantAction(actionRef: BookingWorkspaceActionScope): void {
    switch (actionRef) {
      case "search_slots":
        resolveAndNavigate("select", "booking-content-stage", "Availability host");
        return;
      case "fallback_continue_read_only":
        focusProvenance();
        return;
      case "repair_gp_linkage":
      case "launch_local_component":
      case "request_staff_assist":
      case "fallback_contact_practice_support":
      case "refresh_booking_continuity":
      case "fallback_wait_for_confirmation":
      default:
        focusHelpPanel();
    }
  }

  function openConfirmationHost(): void {
    resolveAndNavigate("confirm", "booking-content-stage", "Confirmation host");
  }

  function openAvailabilityHost(): void {
    resolveAndNavigate("select", "booking-content-stage", "Availability host");
  }

  function openManageHost(): void {
    resolveAndNavigate("manage", "booking-manage-stage", "Manage appointment studio");
  }

  function openWaitlistHost(): void {
    resolveAndNavigate("waitlist", "booking-content-stage", "Waitlist continuation studio");
  }

  function openArtifactHost(
    source: BookingArtifactRouteSource,
    mode: BookingArtifactRouteMode,
  ): void {
    resolveAndNavigate("artifacts", "booking-artifact-stage", "Booking artifact frame", {
      source,
      mode,
    });
  }

  return {
    entry,
    announcement,
    headingRef,
    resolveAndNavigate,
    returnToOrigin,
    runDominantAction,
    openConfirmationHost,
    openAvailabilityHost,
    openManageHost,
    openWaitlistHost,
    openArtifactHost,
    focusHelpPanel,
  };
}

function BookingReturnContractBinder({
  restoreBundle,
}: {
  restoreBundle: BookingWorkspaceRestoreBundle293;
}) {
  return (
    <div
      className="patient-booking__restore-binder"
      hidden
      aria-hidden="true"
      data-testid="booking-return-contract-binder"
      data-restore-storage-key={BOOKING_RESTORE_STORAGE_KEY}
      data-return-route-ref={restoreBundle.returnContract.returnRouteRef}
      data-selected-anchor-ref={restoreBundle.selectedAnchorRef}
      data-shell-continuity-key={restoreBundle.shellContinuityKey}
    />
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "safe" | "warn" | "blocked" | "neutral";
}) {
  return (
    <span className={`patient-booking__chip patient-booking__chip--${tone}`}>{label}</span>
  );
}

function BookingCasePulseHeader({
  workspace,
  routeKey,
}: {
  workspace: PatientAppointmentWorkspaceProjection293;
  routeKey: PatientBookingWorkspaceRouteKey;
}) {
  const manageRoute = routeKey === "manage";
  return (
    <section
      className="patient-booking__pulse"
      data-testid="booking-case-pulse-header"
      data-anchor-ref="booking-case-pulse-header"
      tabIndex={-1}
    >
      <div className="patient-booking__pulse-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="presentation">
          <path
            d="M4 24h11l4-8 7 17 5-10h13"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <span className="patient-booking__eyebrow">BookingCasePulse</span>
        <h2>{workspace.heading}</h2>
        <p>{workspace.subheading}</p>
      </div>
      <div className="patient-booking__pulse-meta">
        <StatusChip label={humanize(workspace.caseStatus)} tone="primary" />
        {manageRoute ? (
          <StatusChip
            label={humanize(workspace.continuityEvidence.continuityState)}
            tone={
              workspace.continuityEvidence.continuityState === "preserved"
                ? "safe"
                : workspace.continuityEvidence.continuityState === "recovery_required"
                  ? "blocked"
                  : "neutral"
            }
          />
        ) : (
          <StatusChip
            label={humanize(workspace.capabilityProjection.surfaceState)}
            tone={
              workspace.capabilityProjection.surfaceState === "self_service_live"
                ? "safe"
                : workspace.capabilityProjection.surfaceState === "degraded_manual"
                  ? "warn"
                  : workspace.capabilityProjection.surfaceState === "blocked" ||
                      workspace.capabilityProjection.surfaceState === "recovery_required"
                    ? "blocked"
                    : "neutral"
            }
          />
        )}
        <span>{workspace.serviceLine}</span>
        <span>{workspace.patientLabel}</span>
      </div>
    </section>
  );
}

function NotificationEntryBanner({
  notification,
}: {
  notification: BookingNotificationEntryProjection;
}) {
  const tone =
    notification.state === "confirmed"
      ? "safe"
      : notification.state === "reopened"
        ? "blocked"
        : notification.state === "confirmation_pending"
          ? "warn"
          : "primary";
  return (
    <section
      className="patient-booking__panel patient-booking__panel--alt patient-booking__notification-entry"
      data-testid="booking-notification-entry-banner"
      data-anchor-ref="booking-notification-entry-banner"
      data-notification-state={notification.state}
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">NotificationEntryBanner</span>
        <h3>{notification.title}</h3>
      </div>
      <div className="patient-booking__capability-copy">
        <StatusChip label={humanize(notification.state)} tone={tone} />
        <strong>{notification.channelLabel}</strong>
        <p>{notification.body}</p>
      </div>
    </section>
  );
}

function NeedWindowRibbon({
  workspace,
}: {
  workspace: PatientAppointmentWorkspaceProjection293;
}) {
  return (
    <section
      className="patient-booking__window"
      aria-labelledby="need-window-title"
      data-testid="need-window-ribbon"
      data-anchor-ref="need-window-ribbon"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">NeedWindowRibbon</span>
        <h3 id="need-window-title">Target window</h3>
      </div>
      <div className="patient-booking__window-track">
        {workspace.needWindow.map((node) => (
          <article key={node.label} className="patient-booking__window-node" data-tone={node.tone}>
            <small>{node.label}</small>
            <strong>{node.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function BookingNeedSummary({
  workspace,
}: {
  workspace: PatientAppointmentWorkspaceProjection293;
}) {
  return (
    <section
      className="patient-booking__panel"
      aria-labelledby="booking-need-summary-title"
      data-testid="booking-need-summary"
      data-anchor-ref="booking-need-summary"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingNeedSummary</span>
        <h3 id="booking-need-summary-title">Appointment need</h3>
      </div>
      <dl className="patient-booking__summary-list">
        {workspace.needRows.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function BookingPreferenceSummaryCard({
  workspace,
}: {
  workspace: PatientAppointmentWorkspaceProjection293;
}) {
  return (
    <section
      className="patient-booking__panel patient-booking__panel--alt"
      aria-labelledby="booking-preference-summary-title"
      data-testid="booking-preference-summary-card"
      data-anchor-ref="booking-preference-summary-card"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingPreferenceSummaryCard</span>
        <h3 id="booking-preference-summary-title">Preference summary</h3>
      </div>
      <dl className="patient-booking__summary-list">
        {workspace.preferenceSummary.map((row) => (
          <div key={row.label} className="patient-booking__summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <details className="patient-booking__details">
        <summary>Show deeper preference detail</summary>
        <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
          {workspace.preferenceDisclosure.map((row) => (
            <div key={row.label} className="patient-booking__summary-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}

function BookingCapabilityPosturePanel({
  workspace,
  onPrimaryAction,
  onSupportAction,
}: {
  workspace: PatientAppointmentWorkspaceProjection293;
  onPrimaryAction: (actionRef: BookingWorkspaceActionScope) => void;
  onSupportAction: () => void;
}) {
  const dominantAction = workspace.capabilityProjection.dominantAction;
  const capabilityTone =
    workspace.capabilityProjection.surfaceState === "self_service_live"
      ? "safe"
      : workspace.capabilityProjection.surfaceState === "degraded_manual"
        ? "warn"
        : workspace.capabilityProjection.surfaceState === "blocked" ||
            workspace.capabilityProjection.surfaceState === "recovery_required"
          ? "blocked"
          : "primary";

  return (
    <section
      className="patient-booking__panel patient-booking__panel--capability"
      aria-labelledby="booking-capability-posture-title"
      data-testid="booking-capability-posture-panel"
      data-anchor-ref="booking-capability-posture-panel"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingCapabilityPosturePanel</span>
        <h3 id="booking-capability-posture-title">Current next step</h3>
      </div>
      <div className="patient-booking__capability-copy">
        <StatusChip label={humanize(workspace.capabilityProjection.surfaceState)} tone={capabilityTone} />
        <strong>{dominantAction.label}</strong>
        <p>{dominantAction.body}</p>
      </div>
      <div className="patient-booking__capability-actions">
        <button
          type="button"
          className="patient-booking__primary-action"
          data-testid="booking-primary-action"
          onClick={() => onPrimaryAction(dominantAction.actionRef)}
        >
          {dominantAction.label}
        </button>
        <button
          type="button"
          className="patient-booking__secondary-action"
          data-testid="booking-support-action"
          onClick={onSupportAction}
        >
          {workspace.supportPath.actionLabel}
        </button>
      </div>
      <div
        className="patient-booking__help-callout"
        id="booking-help-panel"
        data-anchor-ref="booking-help-panel"
        tabIndex={-1}
      >
        <small>{workspace.supportPath.label}</small>
        <p>{workspace.supportPath.copy}</p>
      </div>
    </section>
  );
}

function StageCard({
  kicker,
  title,
  copy,
  children,
}: {
  kicker: string;
  title: string;
  copy: string;
  children?: ReactNode;
}) {
  return (
    <article className="patient-booking__stage-card">
      <span className="patient-booking__eyebrow">{kicker}</span>
      <h4>{title}</h4>
      <p>{copy}</p>
      {children}
    </article>
  );
}

function BookingContentStage({
  entry,
  onSupportAction,
  onOpenConfirmationHost,
  onOpenManageHost,
  onOpenWaitlistHost,
  onOpenArtifactHost,
  onReturnToSelection,
  onReturnToOrigin,
}: {
  entry: PatientBookingWorkspaceEntryProjection;
  onSupportAction: () => void;
  onOpenConfirmationHost: () => void;
  onOpenManageHost: () => void;
  onOpenWaitlistHost: () => void;
  onOpenArtifactHost: (source: BookingArtifactRouteSource, mode: BookingArtifactRouteMode) => void;
  onReturnToSelection: () => void;
  onReturnToOrigin: () => void;
}) {
  const { workspace } = entry;
  const channelMode =
    workspace.returnContract.originKey === "secure_link" ? "secure_link" : "authenticated";
  const recoveryProjection =
    entry.routeKey === "workspace"
      ? resolveWorkspaceBookingRecoveryEnvelope(entry, channelMode)
      : null;

  function handleRecoveryAction(action: BookingRecoveryActionProjection): void {
    switch (action.actionRef) {
      case "request_support":
      default:
        onSupportAction();
    }
  }

  return (
    <section
      className="patient-booking__panel patient-booking__stage"
      aria-labelledby="booking-content-stage-title"
      data-testid="booking-content-stage"
      data-route-key={entry.routeKey}
      data-shell-state={workspace.shellState}
      data-anchor-ref="booking-content-stage"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingContentStage</span>
        <h3 id="booking-content-stage-title">{entry.stageHeading}</h3>
      </div>
      <p className="patient-booking__stage-copy">{entry.stageCopy}</p>
      <div className="patient-booking__stage-meta">
        <StatusChip label={entry.stageStateLabel} tone="neutral" />
        <StatusChip label={humanize(workspace.shellState)} tone="neutral" />
      </div>
      {workspace.provenanceCard ? (
        <section
          className="patient-booking__provenance"
          data-testid="booking-provenance-card"
          data-anchor-ref="booking-provenance-card"
          tabIndex={-1}
        >
          <small>Preserved provenance</small>
          <strong>{workspace.provenanceCard.title}</strong>
          <p>{workspace.provenanceCard.summary}</p>
          <span>{workspace.provenanceCard.meta}</span>
        </section>
      ) : null}
      {recoveryProjection ? (
        <BookingRecoveryShell
          projection={recoveryProjection}
          onAction={handleRecoveryAction}
          onReturn={onReturnToOrigin}
        />
      ) : entry.routeKey === "select" ? (
        <OfferSelectionStage
          bookingCaseId={workspace.bookingCaseId}
          shellContinuityKey={workspace.continuityEvidence.shellContinuityKey}
          supportActionLabel={workspace.supportPath.actionLabel}
          onSupportAction={onSupportAction}
          onReturnToOrigin={onReturnToOrigin}
          onOpenWaitlistHost={onOpenWaitlistHost}
          onOpenConfirmationHost={
            workspace.capabilityProjection.surfaceState === "self_service_live" &&
            workspace.capabilityProjection.controlState === "writable"
              ? onOpenConfirmationHost
              : null
          }
        />
      ) : entry.routeKey === "confirm" ? (
        <BookingConfirmationStage
          bookingCaseId={workspace.bookingCaseId}
          shellContinuityKey={workspace.continuityEvidence.shellContinuityKey}
          supportActionLabel={workspace.supportPath.actionLabel}
          onSupportAction={onSupportAction}
          onOpenManageHost={onOpenManageHost}
          onOpenArtifactHost={(mode) => onOpenArtifactHost("confirm", mode)}
          onReturnToSelection={onReturnToSelection}
          onReturnToOrigin={onReturnToOrigin}
        />
      ) : entry.routeKey === "waitlist" ? (
        <PatientWaitlistViews
          bookingCaseId={workspace.bookingCaseId}
          shellContinuityKey={workspace.continuityEvidence.shellContinuityKey}
          supportActionLabel={workspace.supportPath.actionLabel}
          onSupportAction={onSupportAction}
          onReturnToOrigin={onReturnToOrigin}
          onReturnToSelection={onReturnToSelection}
        />
      ) : (
        <div className="patient-booking__stage-grid">
          <StageCard
            kicker="slot_results_host"
            title="Results child surface"
            copy="Task 294 mounts snapshot-backed availability here without taking over the surrounding shell."
          />
          <StageCard
            kicker="truthful_selection_host"
            title="Selection and hold posture"
            copy="Task 295 mounts truthful selection, compare, and reservation posture here while reusing the same summary and support rails."
          />
          <StageCard
            kicker="confirmation_host"
            title="Confirmation, pending, and recovery"
            copy="Task 296 mounts confirmation review, pending proof, and disputed recovery here while the shell remains stable."
          />
          <StageCard
            kicker="manage_host"
            title="Appointment detail and manage"
            copy="Task 297 mounts the booked summary, reminder posture, cancel, reschedule, and same-shell recovery here."
          />
          <StageCard
            kicker="waitlist_host"
            title="Waitlist continuation"
            copy="Task 298 mounts join-waitlist, waitlist management, live offer acceptance, expiry, fallback, and contact-route repair here."
          />
          <StageCard
            kicker="artifact_host"
            title="Booking artifact frame"
            copy="Task 303 mounts the summary-first receipt, print, calendar, and governed handoff surfaces here."
          />
        </div>
      )}
    </section>
  );
}

function BookingQuietReturnStub({
  workspace,
  onReturn,
}: {
  workspace: PatientAppointmentWorkspaceProjection293;
  onReturn: () => void;
}) {
  return (
    <aside
      className="patient-booking__panel patient-booking__panel--return"
      aria-labelledby="booking-return-title"
      data-testid="booking-quiet-return-stub"
      data-anchor-ref="booking-quiet-return-stub"
      tabIndex={-1}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">BookingQuietReturnStub</span>
        <h3 id="booking-return-title">Return and continuity</h3>
      </div>
      <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
        <div className="patient-booking__summary-row">
          <dt>Return to</dt>
          <dd>{workspace.returnContract.originLabel}</dd>
        </div>
        <div className="patient-booking__summary-row">
          <dt>Selected anchor</dt>
          <dd>{workspace.continuityEvidence.selectedAnchorLabel}</dd>
        </div>
        <div className="patient-booking__summary-row">
          <dt>Continuity</dt>
          <dd>{humanize(workspace.continuityEvidence.continuityState)}</dd>
        </div>
        <div className="patient-booking__summary-row">
          <dt>Publication</dt>
          <dd>{humanize(workspace.continuityEvidence.routePublicationState)}</dd>
        </div>
      </dl>
      {workspace.continuityEvidence.publicationReason ? (
        <p className="patient-booking__return-note">{workspace.continuityEvidence.publicationReason}</p>
      ) : (
        <p className="patient-booking__return-note">
          Return memory stays attached to the same booking shell, even when the route becomes read-only.
        </p>
      )}
      <button
        type="button"
        className="patient-booking__secondary-action"
        data-testid="booking-return-button"
        onClick={onReturn}
      >
        Return to {workspace.returnContract.originLabel}
      </button>
    </aside>
  );
}

function PatientBookingWorkspaceShell({
  entry,
  onPrimaryAction,
  onSupportAction,
  onOpenConfirmationHost,
  onOpenManageHost,
  onOpenWaitlistHost,
  onOpenArtifactHost,
  onReturnToSelection,
  onReturn,
}: {
  entry: PatientBookingWorkspaceEntryProjection;
  onPrimaryAction: (actionRef: BookingWorkspaceActionScope) => void;
  onSupportAction: () => void;
  onOpenConfirmationHost: () => void;
  onOpenManageHost: () => void;
  onOpenWaitlistHost: () => void;
  onOpenArtifactHost: (source: BookingArtifactRouteSource, mode: BookingArtifactRouteMode) => void;
  onReturnToSelection: () => void;
  onReturn: () => void;
}) {
  const responsive = useBookingResponsive();
  const { workspace } = entry;
  const manageRoute = entry.routeKey === "manage";
  const artifactRoute = entry.routeKey === "artifacts";
  const waitlistRoute = entry.routeKey === "waitlist";
  const stickyTrayVisible =
    !manageRoute &&
    !artifactRoute &&
    !waitlistRoute &&
    responsive.missionStackState === "folded";

  return (
    <div className="patient-booking__shell" data-testid="patient-booking-workspace-shell">
      <div className="patient-booking__hero">
        <BookingCasePulseHeader workspace={workspace} routeKey={entry.routeKey} />
        {workspace.notificationEntry ? (
          <NotificationEntryBanner notification={workspace.notificationEntry} />
        ) : null}
        {!manageRoute && !artifactRoute ? <NeedWindowRibbon workspace={workspace} /> : null}
      </div>
      {manageRoute ? (
        <PatientAppointmentDetailView
          bookingCaseId={workspace.bookingCaseId}
          shellContinuityKey={workspace.continuityEvidence.shellContinuityKey}
          supportActionLabel={workspace.supportPath.actionLabel}
          returnLabel={workspace.returnContract.originLabel}
          onSupportAction={onSupportAction}
          onOpenArtifactHost={(mode) => onOpenArtifactHost("manage", mode)}
          onReturn={onReturn}
        />
      ) : artifactRoute ? (
        <PatientBookingArtifactFrame
          bookingCaseId={workspace.bookingCaseId}
          artifactSource={entry.artifactSource ?? "confirm"}
          artifactMode={entry.artifactMode ?? "receipt"}
          onSelectMode={(mode) => onOpenArtifactHost(entry.artifactSource ?? "confirm", mode)}
          onReturnToSource={() =>
            (entry.artifactSource ?? "confirm") === "manage"
              ? onOpenManageHost()
              : onOpenConfirmationHost()
          }
          onSupportAction={onSupportAction}
          supportActionLabel={workspace.supportPath.actionLabel}
        />
      ) : (
        <BookingResponsiveStage
          stageName="PatientBookingWorkspaceShell"
          testId="patient-booking-responsive-stage"
          railPlacement="start"
          foldedPinned={
            !waitlistRoute ? (
              <section className="patient-booking__panel patient-booking__panel--alt">
                <div className="patient-booking__section-head">
                  <span className="patient-booking__eyebrow">Mission stack summary</span>
                  <h3>Appointment need and current posture</h3>
                </div>
                <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
                  <div className="patient-booking__summary-row">
                    <dt>Need window</dt>
                    <dd>{workspace.needWindow.map((node) => node.value).join(" · ")}</dd>
                  </div>
                  <div className="patient-booking__summary-row">
                    <dt>Current next step</dt>
                    <dd>{workspace.capabilityProjection.dominantAction.label}</dd>
                  </div>
                  <div className="patient-booking__summary-row">
                    <dt>Selected anchor</dt>
                    <dd>{workspace.continuityEvidence.selectedAnchorLabel}</dd>
                  </div>
                </dl>
              </section>
            ) : (
              <section className="patient-booking__panel patient-booking__panel--alt">
                <div className="patient-booking__section-head">
                  <span className="patient-booking__eyebrow">Mission stack summary</span>
                  <h3>Waitlist continuity</h3>
                </div>
                <dl className="patient-booking__summary-list patient-booking__summary-list--compact">
                  <div className="patient-booking__summary-row">
                    <dt>Current route</dt>
                    <dd>{entry.stageHeading}</dd>
                  </div>
                  <div className="patient-booking__summary-row">
                    <dt>Selected anchor</dt>
                    <dd>{workspace.continuityEvidence.selectedAnchorLabel}</dd>
                  </div>
                </dl>
              </section>
            )
          }
          railToggleLabel="View need and preferences"
          railTitle="Need and preference summary"
          rail={
            <>
              <BookingNeedSummary workspace={workspace} />
              <BookingPreferenceSummaryCard workspace={workspace} />
            </>
          }
          supportToggleLabel="View return and continuity"
          supportTitle="Return and continuity"
          support={<BookingQuietReturnStub workspace={workspace} onReturn={onReturn} />}
          stickyTray={
            stickyTrayVisible ? (
              <BookingStickyActionTray
                testId="booking-action-tray"
                primaryTestId="booking-action-tray-primary"
                title={workspace.capabilityProjection.dominantAction.label}
                detail={workspace.capabilityProjection.dominantAction.body}
                primaryActionLabel={workspace.capabilityProjection.dominantAction.label}
                primaryActionRef={workspace.capabilityProjection.dominantAction.actionRef}
                onPrimaryAction={() =>
                  onPrimaryAction(workspace.capabilityProjection.dominantAction.actionRef)
                }
                secondaryActionLabel={workspace.supportPath.actionLabel}
                onSecondaryAction={onSupportAction}
              />
            ) : undefined
          }
          main={
            <div className="patient-booking__content-column">
              {!waitlistRoute ? (
                <BookingCapabilityPosturePanel
                  workspace={workspace}
                  onPrimaryAction={onPrimaryAction}
                  onSupportAction={onSupportAction}
                />
              ) : null}
              <BookingContentStage
                entry={entry}
                onSupportAction={onSupportAction}
                onOpenConfirmationHost={onOpenConfirmationHost}
                onOpenManageHost={onOpenManageHost}
                onOpenWaitlistHost={onOpenWaitlistHost}
                onOpenArtifactHost={onOpenArtifactHost}
                onReturnToSelection={onReturnToSelection}
                onReturnToOrigin={onReturn}
              />
            </div>
          }
        />
      )}
    </div>
  );
}

function PatientBookingWorkspaceAppInner() {
  const controller = usePatientBookingWorkspaceController();
  const { entry } = controller;
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: entry.pathname,
  });
  const responsive = useBookingResponsive();
  const stickyTrayVisible =
    entry.routeKey !== "manage" &&
    entry.routeKey !== "artifacts" &&
    entry.routeKey !== "waitlist" &&
    responsive.missionStackState === "folded";
  const responsiveProfile = responsive.resolveProfile(stickyTrayVisible);

  return (
    <div
      className="patient-booking"
      data-testid="Patient_Booking_Workspace_Route"
      data-task-id={PATIENT_BOOKING_WORKSPACE_TASK_ID}
      data-visual-mode={PATIENT_BOOKING_WORKSPACE_VISUAL_MODE}
      data-shell="patient-booking"
      data-shell-frame="signed-in-patient"
      data-booking-case={entry.workspace.bookingCaseId}
      data-capability-posture={entry.workspace.capabilityProjection.surfaceState}
      data-continuity-state={entry.workspace.continuityEvidence.continuityState}
      data-dominant-action={entry.workspace.capabilityProjection.dominantAction.actionRef}
      data-origin-key={entry.workspace.returnContract.originKey}
      data-notification-state={entry.notificationState}
      data-selected-anchor-ref={entry.workspace.continuityEvidence.selectedAnchorRef}
      data-restore-storage-key={BOOKING_RESTORE_STORAGE_KEY}
      data-motion-profile={
        safeWindow()?.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "default"
      }
      data-route-key={entry.routeKey}
      data-shell-state={entry.workspace.shellState}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-cause-class={phase2Context.causeClass}
      data-recovery-class={phase2Context.recoveryClass}
      data-canonical-status-label={phase2Context.canonicalStatusLabel}
      data-responsive-task-id={PATIENT_BOOKING_RESPONSIVE_TASK_ID}
      data-responsive-visual-mode={PATIENT_BOOKING_RESPONSIVE_VISUAL_MODE}
      data-breakpoint-class={responsiveProfile.breakpointClass}
      data-mission-stack-state={responsiveProfile.missionStackState}
      data-safe-area-class={responsiveProfile.safeAreaClass}
      data-sticky-action-posture={responsiveProfile.stickyActionPosture}
      data-embedded-mode={responsiveProfile.embeddedMode}
    >
      <EmbeddedBookingChromeAdapter
        topBand={
          <header className="patient-booking__top-band" data-testid="patient-booking-top-band">
            <a className="patient-booking__brand" href="/home">
              <span>
                <VecellLogoWordmark aria-hidden="true" className="patient-booking__brand-wordmark" />
                <small>Signed-in patient shell</small>
              </span>
            </a>
            <nav aria-label="Patient booking navigation" className="patient-booking__nav">
              <a href="/home">Home</a>
              <a href="/requests">Requests</a>
              <a href="/appointments">Appointments</a>
              <a href="/messages">Messages</a>
            </nav>
          </header>
        }
      >
        <PatientSupportPhase2Bridge context={phase2Context} />
        <BookingReturnContractBinder restoreBundle={entry.restoreBundle} />
        <main className="patient-booking__main">
          <h1 ref={controller.headingRef} tabIndex={-1} className="patient-booking__route-title">
            {entry.routeKey === "manage"
              ? "Manage appointment"
              : entry.routeKey === "artifacts"
                ? "Appointment artifact"
              : entry.routeKey === "waitlist"
                ? "Waitlist continuation"
                : "Appointment scheduling"}
          </h1>
          <PatientBookingWorkspaceShell
            entry={entry}
            onPrimaryAction={controller.runDominantAction}
            onSupportAction={controller.focusHelpPanel}
            onOpenConfirmationHost={controller.openConfirmationHost}
            onOpenManageHost={controller.openManageHost}
            onOpenWaitlistHost={controller.openWaitlistHost}
            onOpenArtifactHost={controller.openArtifactHost}
            onReturnToSelection={controller.openAvailabilityHost}
            onReturn={controller.returnToOrigin}
          />
        </main>
        <div
          className="patient-booking__live"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="booking-live-region"
        >
          {controller.announcement}
        </div>
      </EmbeddedBookingChromeAdapter>
    </div>
  );
}

export default function PatientBookingWorkspaceApp() {
  return (
    <BookingResponsiveProvider>
      <PatientBookingWorkspaceAppInner />
    </BookingResponsiveProvider>
  );
}
