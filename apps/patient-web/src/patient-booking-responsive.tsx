import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import "./patient-booking-responsive.css";
import {
  PATIENT_BOOKING_RESPONSIVE_TASK_ID,
  PATIENT_BOOKING_RESPONSIVE_VISUAL_MODE,
  resolveBookingBreakpointClass,
  resolveBookingMissionStackState,
  resolveBookingResponsiveHostContext,
  resolveBookingSafeAreaClass,
  resolveBookingStickyActionPosture,
  type BookingEmbeddedMode,
  type BookingMissionStackState,
  type BookingResponsiveBreakpointClass,
  type BookingResponsiveCoverageProfile,
  type BookingSafeAreaClass,
  type BookingStickyActionPosture,
} from "./patient-booking-responsive.model";

interface BookingResponsiveContextValue {
  readonly breakpointClass: BookingResponsiveBreakpointClass;
  readonly missionStackState: BookingMissionStackState;
  readonly safeAreaClass: BookingSafeAreaClass;
  readonly embeddedMode: BookingEmbeddedMode;
  readonly reducedMotion: boolean;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly stickyReservePx: number;
  readonly resolveProfile: (
    stickyVisible: boolean,
  ) => BookingResponsiveCoverageProfile;
}

const BookingResponsiveContext = createContext<BookingResponsiveContextValue | null>(null);

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function readViewport() {
  const ownerWindow = safeWindow();
  const width =
    ownerWindow?.visualViewport?.width ??
    ownerWindow?.innerWidth ??
    1440;
  const height =
    ownerWindow?.visualViewport?.height ??
    ownerWindow?.innerHeight ??
    900;
  return {
    width: Math.max(320, Math.round(width)),
    height: Math.max(480, Math.round(height)),
  };
}

function safeAreaInsetFor(
  safeAreaClass: BookingSafeAreaClass,
  edge: "top" | "bottom",
): number {
  if (safeAreaClass === "both") {
    return 18;
  }
  if (safeAreaClass === edge) {
    return 18;
  }
  return 0;
}

function buildBaseState() {
  const ownerWindow = safeWindow();
  const viewport = readViewport();
  const hostContext = resolveBookingResponsiveHostContext(ownerWindow?.location.search ?? "");
  const breakpointClass = resolveBookingBreakpointClass(viewport.width);
  const missionStackState = resolveBookingMissionStackState(breakpointClass);
  const reducedMotion = Boolean(
    ownerWindow?.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const safeAreaClass =
    hostContext.safeAreaOverride ??
    resolveBookingSafeAreaClass(
      0,
      hostContext.embeddedMode === "nhs_app" && missionStackState === "folded" ? 18 : 0,
    );
  const stickyReservePx =
    missionStackState === "folded"
      ? 116 + safeAreaInsetFor(safeAreaClass, "bottom")
      : 40;

  return {
    breakpointClass,
    missionStackState,
    safeAreaClass,
    embeddedMode: hostContext.embeddedMode,
    reducedMotion,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    stickyReservePx,
  };
}

export function BookingResponsiveProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState(buildBaseState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }

    const update = () => {
      setState(buildBaseState());
    };

    update();
    ownerWindow.addEventListener("resize", update);
    ownerWindow.visualViewport?.addEventListener("resize", update);
    ownerWindow.addEventListener("popstate", update);
    return () => {
      ownerWindow.removeEventListener("resize", update);
      ownerWindow.visualViewport?.removeEventListener("resize", update);
      ownerWindow.removeEventListener("popstate", update);
    };
  }, []);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const current = stateRef.current;
      if (current.missionStackState !== "folded") {
        return;
      }
      const topLimit = 8;
      const bottomLimit = current.viewportHeight - current.stickyReservePx + 12;
      const alignFocusedTarget = (remainingAttempts: number) => {
        const rect = target.getBoundingClientRect();
        if (rect.bottom <= bottomLimit && rect.top >= topLimit) {
          return;
        }
        const scrollDelta =
          rect.bottom > bottomLimit
            ? rect.bottom - bottomLimit + 20
            : rect.top < topLimit
              ? rect.top - topLimit - 20
              : 0;
        ownerWindow.scrollBy({
          top: scrollDelta,
          behavior: "auto",
        });
        if (remainingAttempts > 0) {
          ownerWindow.setTimeout(() => alignFocusedTarget(remainingAttempts - 1), 90);
        }
      };

      ownerWindow.setTimeout(() => alignFocusedTarget(3), 80);
    };

    ownerWindow.addEventListener("focusin", onFocusIn);
    return () => ownerWindow.removeEventListener("focusin", onFocusIn);
  }, []);

  const value = useMemo<BookingResponsiveContextValue>(
    () => ({
      ...state,
      resolveProfile(stickyVisible) {
        return {
          projectionName: "BookingResponsiveCoverageProfile",
          taskId: PATIENT_BOOKING_RESPONSIVE_TASK_ID,
          visualMode: PATIENT_BOOKING_RESPONSIVE_VISUAL_MODE,
          breakpointClass: state.breakpointClass,
          missionStackState: state.missionStackState,
          safeAreaClass: state.safeAreaClass,
          stickyActionPosture: resolveBookingStickyActionPosture({
            breakpointClass: state.breakpointClass,
            stickyVisible,
          }),
          embeddedMode: state.embeddedMode,
          reducedMotion: state.reducedMotion,
          viewportWidth: state.viewportWidth,
          viewportHeight: state.viewportHeight,
        };
      },
    }),
    [state],
  );

  return (
    <BookingResponsiveContext.Provider value={value}>
      {children}
    </BookingResponsiveContext.Provider>
  );
}

export function useBookingResponsive() {
  const context = useContext(BookingResponsiveContext);
  if (!context) {
    throw new Error("useBookingResponsive must be used inside BookingResponsiveProvider");
  }
  return context;
}

export function EmbeddedBookingChromeAdapter({
  topBand,
  children,
}: {
  topBand: ReactNode;
  children: ReactNode;
}) {
  const responsive = useBookingResponsive();

  return (
    <div
      className="patient-booking__embedded-adapter"
      data-testid="embedded-booking-chrome-adapter"
      data-embedded-mode={responsive.embeddedMode}
      data-safe-area-class={responsive.safeAreaClass}
      style={
        {
          "--booking-safe-area-top": `${safeAreaInsetFor(responsive.safeAreaClass, "top")}px`,
          "--booking-safe-area-bottom": `${safeAreaInsetFor(
            responsive.safeAreaClass,
            "bottom",
          )}px`,
          "--booking-sticky-reserve": `${responsive.stickyReservePx}px`,
        } as CSSProperties
      }
    >
      {responsive.embeddedMode === "browser" ? topBand : null}
      {responsive.embeddedMode === "nhs_app" ? (
        <div
          className="patient-booking__embedded-ribbon"
          data-testid="embedded-booking-host-ribbon"
        >
          <strong>NHS App embedded host</strong>
          <span>Header chrome is suppressed here, but the same booking route remains active.</span>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function ResponsivePreferenceDrawer({
  open,
  title,
  testId,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  testId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const ownerWindow = safeWindow();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    ownerWindow?.addEventListener("keydown", onKeyDown);
    return () => ownerWindow?.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="patient-booking__responsive-drawer-backdrop" onClick={onClose} />
      <aside
        className="patient-booking__responsive-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        data-testid={testId}
        data-drawer-open="true"
      >
        <div className="patient-booking__responsive-drawer-head">
          <div className="patient-booking__section-head">
            <span className="patient-booking__eyebrow">ResponsivePreferenceDrawer</span>
            <h3 id={`${testId}-title`} ref={headingRef} tabIndex={-1}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="patient-booking__secondary-action"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="patient-booking__responsive-drawer-body">{children}</div>
      </aside>
    </>
  );
}

export function ManageCompactSummarySheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <ResponsivePreferenceDrawer
      open={open}
      onClose={onClose}
      title="Appointment summary"
      testId="manage-compact-summary-sheet"
    >
      <div
        className="patient-booking__manage-compact-sheet"
        data-testid="manage-compact-summary-sheet-body"
      >
        {children}
      </div>
    </ResponsivePreferenceDrawer>
  );
}

export function BookingStickyActionTray({
  title,
  detail,
  primaryActionLabel,
  primaryDisabled,
  primaryTestId,
  primaryActionRef,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  testId,
}: {
  title: string;
  detail: string;
  primaryActionLabel: string;
  primaryDisabled?: boolean;
  primaryTestId?: string;
  primaryActionRef?: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  testId: string;
}) {
  const responsive = useBookingResponsive();
  const posture: BookingStickyActionPosture = resolveBookingStickyActionPosture({
    breakpointClass: responsive.breakpointClass,
    stickyVisible: true,
  });

  return (
    <section
      className="patient-booking__sticky-tray"
      data-testid={testId}
      data-sticky-action-posture={posture}
      data-action-ref={primaryActionRef ?? "none"}
    >
      <div className="patient-booking__sticky-tray-copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <div className="patient-booking__sticky-tray-actions">
        {secondaryActionLabel && onSecondaryAction ? (
          <button
            type="button"
            className="patient-booking__secondary-action"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        ) : null}
        <button
          type="button"
          className="patient-booking__primary-action"
          data-testid={primaryTestId}
          data-action-ref={primaryActionRef ?? "none"}
          disabled={primaryDisabled}
          aria-disabled={primaryDisabled}
          onClick={onPrimaryAction}
        >
          {primaryActionLabel}
        </button>
      </div>
    </section>
  );
}

export function BookingMissionStackFrame({
  heading,
  pinnedSummary,
  railToggleLabel,
  railTitle,
  railContent,
  supportToggleLabel,
  supportTitle,
  supportContent,
  main,
  stickyTray,
}: {
  heading: string;
  pinnedSummary?: ReactNode;
  railToggleLabel?: string;
  railTitle?: string;
  railContent?: ReactNode;
  supportToggleLabel?: string;
  supportTitle?: string;
  supportContent?: ReactNode;
  main: ReactNode;
  stickyTray?: ReactNode;
}) {
  const [railOpen, setRailOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <section
      className="patient-booking__mission-stack-frame"
      data-testid="booking-mission-stack-frame"
      data-heading={heading}
      data-sticky-visible={stickyTray ? "true" : "false"}
    >
      {pinnedSummary ? (
        <div className="patient-booking__mission-stack-pinned">{pinnedSummary}</div>
      ) : null}
      {railContent || supportContent ? (
        <div className="patient-booking__mission-stack-controls">
          {railContent ? (
            <button
              type="button"
              className="patient-booking__mission-stack-toggle"
              data-testid="booking-mission-stack-rail-toggle"
              onClick={() => setRailOpen(true)}
            >
              {railToggleLabel ?? "Open summary"}
            </button>
          ) : null}
          {supportContent ? (
            <button
              type="button"
              className="patient-booking__mission-stack-toggle"
              data-testid="booking-mission-stack-support-toggle"
              onClick={() => setSupportOpen(true)}
            >
              {supportToggleLabel ?? "Open return and support"}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="patient-booking__mission-stack-main">{main}</div>
      {stickyTray ? (
        <div className="patient-booking__mission-stack-sticky">{stickyTray}</div>
      ) : null}
      {railContent && railTitle ? (
        <ResponsivePreferenceDrawer
          open={railOpen}
          onClose={() => setRailOpen(false)}
          title={railTitle}
          testId="booking-mission-stack-rail-drawer"
        >
          {railContent}
        </ResponsivePreferenceDrawer>
      ) : null}
      {supportContent && supportTitle ? (
        <ResponsivePreferenceDrawer
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          title={supportTitle}
          testId="booking-mission-stack-support-drawer"
        >
          {supportContent}
        </ResponsivePreferenceDrawer>
      ) : null}
    </section>
  );
}

export function BookingResponsiveStage({
  stageName,
  foldedPinned,
  main,
  rail,
  support,
  stickyTray,
  railToggleLabel,
  railTitle,
  supportToggleLabel,
  supportTitle,
  railPlacement = "end",
  testId,
}: {
  stageName: string;
  foldedPinned?: ReactNode;
  main: ReactNode;
  rail?: ReactNode;
  support?: ReactNode;
  stickyTray?: ReactNode;
  railToggleLabel?: string;
  railTitle?: string;
  supportToggleLabel?: string;
  supportTitle?: string;
  railPlacement?: "start" | "end";
  testId: string;
}) {
  const responsive = useBookingResponsive();
  const folded = responsive.missionStackState === "folded";
  const hasRail = Boolean(rail);
  const hasSupport = Boolean(support);
  const gridKind = hasRail && hasSupport ? "three" : hasRail || hasSupport ? "two" : "one";

  if (folded) {
    return (
      <div
        className="patient-booking__responsive-stage"
        data-testid={testId}
        data-stage-name={stageName}
        data-breakpoint-class={responsive.breakpointClass}
        data-mission-stack-state={responsive.missionStackState}
      >
        <BookingMissionStackFrame
          heading={stageName}
          pinnedSummary={foldedPinned}
          railToggleLabel={railToggleLabel}
          railTitle={railTitle}
          railContent={rail}
          supportToggleLabel={supportToggleLabel}
          supportTitle={supportTitle}
          supportContent={support}
          main={main}
          stickyTray={stickyTray}
        />
      </div>
    );
  }

  const startColumn = railPlacement === "start" ? rail : main;
  const centerColumn = railPlacement === "start" ? main : rail;

  return (
    <div
      className="patient-booking__responsive-stage"
      data-testid={testId}
      data-stage-name={stageName}
      data-breakpoint-class={responsive.breakpointClass}
      data-mission-stack-state={responsive.missionStackState}
    >
      <div
        className="patient-booking__responsive-stage-grid"
        data-grid-kind={gridKind}
        data-rail-placement={railPlacement}
      >
        {startColumn ? (
          <div className="patient-booking__responsive-stage-column patient-booking__responsive-stage-column--rail">
            {startColumn}
          </div>
        ) : null}
        {centerColumn ? (
          <div className="patient-booking__responsive-stage-column patient-booking__responsive-stage-column--main">
            {centerColumn}
          </div>
        ) : null}
        {support ? (
          <div className="patient-booking__responsive-stage-column patient-booking__responsive-stage-column--support">
            {support}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type WaitlistCardDataAttrs = Record<`data-${string}`, string | undefined>;

export function ResponsiveWaitlistCard({
  variant,
  testId,
  children,
  ...dataAttrs
}: {
  variant: string;
  testId: string;
  children: ReactNode;
} & WaitlistCardDataAttrs) {
  const responsive = useBookingResponsive();

  return (
    <section
      className={`patient-booking__waitlist-card patient-booking__waitlist-card--${variant} patient-booking__waitlist-card--responsive`}
      data-testid={testId}
      data-breakpoint-class={responsive.breakpointClass}
      data-mission-stack-state={responsive.missionStackState}
      {...dataAttrs}
    >
      {children}
    </section>
  );
}
