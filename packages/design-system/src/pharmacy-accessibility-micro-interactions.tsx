import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

export const PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE =
  "Pharmacy_Accessible_Quiet_Polish";

export type PharmacyAccessibleTone =
  | "ready"
  | "guarded"
  | "review"
  | "blocked"
  | "neutral"
  | "current"
  | "read_only"
  | "stale"
  | "open"
  | "closed"
  | "watch"
  | "complete"
  | "attention"
  | "pending"
  | "reopen";

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(","),
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
}

function trapFocus(event: KeyboardEvent<HTMLElement>, container: HTMLElement | null): void {
  if (event.key !== "Tab" || !container) {
    return;
  }

  const elements = focusableElements(container);
  if (elements.length === 0) {
    event.preventDefault();
    return;
  }

  const first = elements[0]!;
  const last = elements[elements.length - 1]!;
  const activeElement = document.activeElement as HTMLElement | null;

  if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  }
}

function useReducedMotionPreference(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function PharmacyAccessibleStatusBadge(props: {
  label: string;
  tone: PharmacyAccessibleTone;
  contextLabel?: string;
  compact?: boolean;
  className?: string;
  testId?: string;
  title?: string;
}) {
  const contextPrefix = props.contextLabel ? `${props.contextLabel}: ` : "";
  return (
    <span
      className={joinClasses(
        "pharmacy-a11y-status-badge",
        props.compact && "pharmacy-a11y-status-badge--compact",
        props.className,
      )}
      data-testid={props.testId ?? "PharmacyAccessibleStatusBadge"}
      data-tone={props.tone}
      aria-label={`${contextPrefix}${props.label}`}
      title={props.title}
    >
      {props.contextLabel ? (
        <span className="pharmacy-a11y-sr-only">{contextPrefix}</span>
      ) : null}
      {props.label}
    </span>
  );
}

export function PharmacyA11yAnnouncementHub(props: {
  scopeLabel: string;
  politeAnnouncement: string | null;
  assertiveAnnouncement?: string | null;
  testId?: string;
}) {
  return (
    <section
      className="pharmacy-a11y-announcement-hub"
      data-testid={props.testId ?? "PharmacyA11yAnnouncementHub"}
      data-visual-mode={PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE}
      data-scope-label={props.scopeLabel}
      aria-label={`${props.scopeLabel} announcement hub`}
    >
      <div
        className="pharmacy-a11y-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {props.politeAnnouncement ?? ""}
      </div>
      <div
        className="pharmacy-a11y-sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {props.assertiveAnnouncement ?? ""}
      </div>
    </section>
  );
}

export function PharmacyFocusRouteMap(props: {
  title: string;
  routeFamilyLabel: string;
  currentRouteLabel: string;
  selectedAnchorLabel: string;
  focusReturnLabel: string;
  supportRegionLabel: string;
  compact?: boolean;
  testId?: string;
}) {
  const headingId = useId();
  return (
    <section
      className={joinClasses(
        "pharmacy-a11y-focus-map",
        props.compact && "pharmacy-a11y-focus-map--compact",
      )}
      data-testid={props.testId ?? "PharmacyFocusRouteMap"}
      data-visual-mode={PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE}
      aria-labelledby={headingId}
    >
      <div className="pharmacy-a11y-focus-map__copy">
        <p className="pharmacy-a11y-focus-map__eyebrow">Focus and route map</p>
        <h2 id={headingId}>{props.title}</h2>
      </div>
      <dl className="pharmacy-a11y-focus-map__grid">
        <div>
          <dt>Journey group</dt>
          <dd>{props.routeFamilyLabel}</dd>
        </div>
        <div>
          <dt>Current route</dt>
          <dd>{props.currentRouteLabel}</dd>
        </div>
        <div>
          <dt>Selected anchor</dt>
          <dd>{props.selectedAnchorLabel}</dd>
        </div>
        <div>
          <dt>Focus returns to</dt>
          <dd>{props.focusReturnLabel}</dd>
        </div>
        <div>
          <dt>Promoted support</dt>
          <dd>{props.supportRegionLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function PharmacyTargetSizeGuard(props: {
  children: ReactNode;
  minSizePx?: number;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      className={joinClasses("pharmacy-a11y-target-size-guard", props.className)}
      data-testid={props.testId ?? "PharmacyTargetSizeGuard"}
      style={
        {
          "--pharmacy-target-size-minimum": `${props.minSizePx ?? 44}px`,
        } as CSSProperties
      }
    >
      {props.children}
    </div>
  );
}

export function PharmacyInlineAck(props: {
  title: string;
  summary: string;
  checkboxLabel: string;
  actionLabel: string;
  checked: boolean;
  acknowledged: boolean;
  onCheckedChange: (checked: boolean) => void;
  onAcknowledge: () => void;
  statusLabel?: string;
  noteLabel?: string | null;
  tone?: PharmacyAccessibleTone;
  testId?: string;
  checkboxTestId?: string;
  actionTestId?: string;
}) {
  const summaryId = useId();
  const statusLabel =
    props.statusLabel ??
    (props.acknowledged
      ? "Acknowledgement recorded."
      : "Acknowledgement still required before this route can continue.");

  return (
    <section
      className="pharmacy-a11y-inline-ack"
      data-testid={props.testId ?? "PharmacyInlineAck"}
      data-tone={props.tone ?? "guarded"}
      data-acknowledged={props.acknowledged}
    >
      <div className="pharmacy-a11y-inline-ack__copy">
        <h4>{props.title}</h4>
        <p id={summaryId}>{props.summary}</p>
      </div>
      <label className="pharmacy-a11y-inline-ack__checkbox">
        <input
          type="checkbox"
          data-testid={props.checkboxTestId}
          checked={props.checked}
          onChange={(event) => props.onCheckedChange(event.currentTarget.checked)}
          aria-describedby={summaryId}
        />
        <span>{props.checkboxLabel}</span>
      </label>
      <div className="pharmacy-a11y-inline-ack__actions">
        <PharmacyTargetSizeGuard minSizePx={44}>
          <button
            type="button"
            className="pharmacy-a11y-inline-ack__button"
            data-testid={props.actionTestId}
            disabled={!props.checked || props.acknowledged}
            onClick={props.onAcknowledge}
          >
            {props.acknowledged ? "Acknowledged" : props.actionLabel}
          </button>
        </PharmacyTargetSizeGuard>
        <span
          className="pharmacy-a11y-inline-ack__status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {statusLabel}
        </span>
      </div>
      {props.noteLabel ? (
        <p className="pharmacy-a11y-inline-ack__note">{props.noteLabel}</p>
      ) : null}
    </section>
  );
}

export function PharmacyReducedMotionBridge(props: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  const reducedMotion = useReducedMotionPreference();

  return (
    <div
      className={joinClasses("pharmacy-a11y-motion-bridge", props.className)}
      data-testid={props.testId ?? "PharmacyReducedMotionBridge"}
      data-visual-mode={PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={
        {
          "--pharmacy-motion-duration": reducedMotion ? "0.01ms" : "160ms",
        } as CSSProperties
      }
    >
      {props.children}
    </div>
  );
}

export function PharmacyDialogAndDrawerSemantics(props: {
  open: boolean;
  kind: "dialog" | "drawer";
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  panelRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  panelClassName?: string;
  backdropClassName?: string;
  panelTestId?: string;
  backdropTestId?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}) {
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!props.open) {
      return undefined;
    }

    lastActiveElementRef.current =
      props.returnFocusRef?.current ??
      (typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null));
    const focusTarget = props.initialFocusRef?.current ?? props.panelRef.current;
    const animationFrame = window.requestAnimationFrame(() => {
      focusTarget?.focus?.();
    });
    return () => {
      window.cancelAnimationFrame(animationFrame);
      const target = props.returnFocusRef?.current ?? lastActiveElementRef.current;
      target?.focus?.();
    };
  }, [props.open, props.initialFocusRef, props.panelRef, props.returnFocusRef]);

  if (!props.open) {
    return null;
  }

  return (
    <div
      className="pharmacy-a11y-dialog-root"
      data-testid={
        props.panelTestId
          ? `${props.panelTestId}Root`
          : "PharmacyDialogAndDrawerSemanticsRoot"
      }
      data-kind={props.kind}
      data-open={props.open ? "true" : "false"}
      data-visual-mode={PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE}
    >
      <button
        type="button"
        className={joinClasses("pharmacy-a11y-dialog-backdrop", props.backdropClassName)}
        data-testid={props.backdropTestId ?? "PharmacyDialogAndDrawerBackdrop"}
        aria-label={props.closeLabel}
        tabIndex={-1}
        onClick={props.onClose}
      />
      <section
        ref={(node) => {
          (
            props.panelRef as {
              current: HTMLElement | null;
            }
          ).current = node;
        }}
        className={joinClasses("pharmacy-a11y-dialog-panel", props.panelClassName)}
        data-testid={props.panelTestId ?? "PharmacyDialogAndDrawerSemantics"}
        data-kind={props.kind}
        data-open={props.open ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-label={props.ariaLabelledby ? undefined : props.title}
        aria-labelledby={props.ariaLabelledby}
        aria-describedby={props.ariaDescribedby}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
            return;
          }
          trapFocus(event, props.panelRef.current);
        }}
      >
        {props.children}
      </section>
    </div>
  );
}
