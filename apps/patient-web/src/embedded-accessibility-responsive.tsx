import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import {
  EMBEDDED_ACCESSIBILITY_CONTRACT_REF,
  EMBEDDED_ACCESSIBILITY_COVERAGE_PROFILE_REF,
  EMBEDDED_ACCESSIBILITY_STORAGE_KEY,
  EMBEDDED_ACCESSIBILITY_TASK_ID,
  EMBEDDED_ACCESSIBILITY_VISUAL_MODE,
  resolveEmbeddedA11yCoverageProfile,
  type EmbeddedAccessibilityRouteFamily,
  type EmbeddedA11yCoverageProfile,
} from "./embedded-accessibility-responsive.model";

type LayerRef = RefObject<HTMLDivElement | null>;

interface EmbeddedAccessibilityResponsiveLayerProps {
  readonly routeFamily: EmbeddedAccessibilityRouteFamily;
  readonly children: ReactNode;
}

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function safeDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

function selectorForElement(element: Element): string | null {
  const testId = element.getAttribute("data-testid");
  if (testId) return `[data-testid="${cssEscape(testId)}"]`;
  if (element.id) return `#${cssEscape(element.id)}`;
  const name = element.getAttribute("name");
  if (name) return `[name="${cssEscape(name)}"]`;
  return null;
}

function isElementFocusable(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") return false;
  if (element.tabIndex >= 0) return true;
  return Boolean(
    element.matches("a[href], button, input, select, textarea, summary, [role='button'], [contenteditable='true']"),
  );
}

function layerContains(layerRef: LayerRef, target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement && Boolean(layerRef.current?.contains(target));
}

function dispatchEmbeddedA11yAnnouncement(message: string): void {
  const ownerWindow = safeWindow();
  ownerWindow?.dispatchEvent(
    new CustomEvent("embedded-a11y-announce", {
      detail: { message },
    }),
  );
}

export function EmbeddedReducedMotionAdapter({
  layerRef,
}: {
  readonly layerRef: LayerRef;
}) {
  const [reducedMotion, setReducedMotion] = useState("unknown");

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    const query = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const mode = query.matches ? "reduce" : "no-preference";
      setReducedMotion(mode);
      if (layerRef.current) {
        layerRef.current.dataset.reducedMotion = mode;
        layerRef.current.style.setProperty(
          "--embedded-a11y-motion-duration",
          query.matches ? "0.01ms" : "180ms",
        );
      }
      ownerWindow.document.body.dataset.embeddedMotionPreference = mode;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [layerRef]);

  return (
    <span
      className="embedded-a11y__instrument"
      data-testid="EmbeddedReducedMotionAdapter"
      data-reduced-motion={reducedMotion}
    >
      Motion preference {reducedMotion}
    </span>
  );
}

export function EmbeddedSafeAreaObserver({
  layerRef,
}: {
  readonly layerRef: LayerRef;
}) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    let frame = 0;
    const sync = () => {
      ownerWindow.cancelAnimationFrame(frame);
      frame = ownerWindow.requestAnimationFrame(() => {
        const visualViewport = ownerWindow.visualViewport;
        const viewportHeight = visualViewport?.height ?? ownerWindow.innerHeight;
        const viewportWidth = visualViewport?.width ?? ownerWindow.innerWidth;
        const offset = Math.max(0, ownerWindow.innerHeight - viewportHeight - (visualViewport?.offsetTop ?? 0));
        setKeyboardOffset(Math.round(offset));
        layerRef.current?.style.setProperty("--embedded-a11y-viewport-height", `${Math.round(viewportHeight)}px`);
        layerRef.current?.style.setProperty("--embedded-a11y-viewport-width", `${Math.round(viewportWidth)}px`);
        layerRef.current?.style.setProperty("--embedded-a11y-keyboard-offset", `${Math.round(offset)}px`);
        if (layerRef.current) {
          layerRef.current.dataset.safeAreaObserver = "ready";
          layerRef.current.dataset.keyboardOffset = String(Math.round(offset));
        }
      });
    };
    sync();
    ownerWindow.addEventListener("resize", sync);
    ownerWindow.visualViewport?.addEventListener("resize", sync);
    ownerWindow.visualViewport?.addEventListener("scroll", sync);
    return () => {
      ownerWindow.cancelAnimationFrame(frame);
      ownerWindow.removeEventListener("resize", sync);
      ownerWindow.visualViewport?.removeEventListener("resize", sync);
      ownerWindow.visualViewport?.removeEventListener("scroll", sync);
    };
  }, [layerRef]);

  return (
    <span
      className="embedded-a11y__instrument"
      data-testid="EmbeddedSafeAreaObserver"
      data-keyboard-offset={keyboardOffset}
    >
      Safe area observed
    </span>
  );
}

export function HostResizeResilienceLayer({
  layerRef,
  profile,
}: {
  readonly layerRef: LayerRef;
  readonly profile: EmbeddedA11yCoverageProfile;
}) {
  const [resizeState, setResizeState] = useState("settled");
  const [resizeCount, setResizeCount] = useState(0);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    let settleTimer = 0;
    const handleResize = () => {
      const selector =
        ownerWindow.document.activeElement instanceof HTMLElement
          ? selectorForElement(ownerWindow.document.activeElement)
          : null;
      if (selector) {
        ownerWindow.sessionStorage.setItem(
          `${EMBEDDED_ACCESSIBILITY_STORAGE_KEY}:${profile.routeFamily}:active-before-resize`,
          selector,
        );
      }
      setResizeState("resizing");
      setResizeCount((count) => count + 1);
      if (layerRef.current) layerRef.current.dataset.hostResizeState = "resizing";
      ownerWindow.clearTimeout(settleTimer);
      settleTimer = ownerWindow.setTimeout(() => {
        const active = ownerWindow.document.activeElement;
        if (active instanceof HTMLElement && layerRef.current?.contains(active)) {
          active.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
        setResizeState("settled");
        if (layerRef.current) layerRef.current.dataset.hostResizeState = "settled";
      }, 160);
    };
    ownerWindow.addEventListener("resize", handleResize);
    ownerWindow.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      ownerWindow.clearTimeout(settleTimer);
      ownerWindow.removeEventListener("resize", handleResize);
      ownerWindow.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [layerRef, profile.routeFamily]);

  return (
    <span
      className="embedded-a11y__instrument"
      data-testid="HostResizeResilienceLayer"
      data-host-resize-state={resizeState}
      data-resize-count={resizeCount}
    >
      Host resize {resizeState}
    </span>
  );
}

export function AssistiveAnnouncementDedupeBus({
  profile,
}: {
  readonly profile: EmbeddedA11yCoverageProfile;
}) {
  const [message, setMessage] = useState(`${profile.label} accessibility contract loaded.`);
  const [announcementCount, setAnnouncementCount] = useState(1);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const lastMessageRef = useRef(message);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    const handleAnnouncement = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      const nextMessage = detail?.message?.trim();
      if (!nextMessage) return;
      if (nextMessage === lastMessageRef.current) {
        setDuplicateCount((count) => count + 1);
        return;
      }
      lastMessageRef.current = nextMessage;
      setMessage(nextMessage);
      setAnnouncementCount((count) => count + 1);
    };
    ownerWindow.addEventListener("embedded-a11y-announce", handleAnnouncement);
    return () => ownerWindow.removeEventListener("embedded-a11y-announce", handleAnnouncement);
  }, []);

  useEffect(() => {
    const nextMessage = `${profile.label} accessibility contract loaded.`;
    lastMessageRef.current = nextMessage;
    setMessage(nextMessage);
    setAnnouncementCount(1);
    setDuplicateCount(0);
  }, [profile.label]);

  return (
    <div
      className="embedded-a11y__live"
      aria-live="polite"
      aria-atomic="true"
      data-testid="AssistiveAnnouncementDedupeBus"
      data-route-family={profile.routeFamily}
      data-announcement-count={announcementCount}
      data-duplicate-count={duplicateCount}
    >
      {message}
    </div>
  );
}

export function EmbeddedFocusGuard({
  layerRef,
  boundaryId,
  profile,
}: {
  readonly layerRef: LayerRef;
  readonly boundaryId: string;
  readonly profile: EmbeddedA11yCoverageProfile;
}) {
  const focusBoundary = useCallback(() => {
    const ownerDocument = safeDocument();
    const boundary = ownerDocument?.getElementById(boundaryId);
    if (boundary instanceof HTMLElement) {
      boundary.focus({ preventScroll: true });
      boundary.scrollIntoView({ block: "start", inline: "nearest" });
      dispatchEmbeddedA11yAnnouncement(`${profile.label} content focused.`);
    }
  }, [boundaryId, profile.label]);

  useEffect(() => {
    const ownerDocument = safeDocument();
    if (!ownerDocument) return;
    const handleFocusIn = (event: FocusEvent) => {
      if (!layerContains(layerRef, event.target)) return;
      if (event.target instanceof HTMLElement) {
        event.target.dataset.embeddedA11yFocusVisible = "true";
      }
    };
    ownerDocument.addEventListener("focusin", handleFocusIn);
    return () => ownerDocument.removeEventListener("focusin", handleFocusIn);
  }, [layerRef]);

  return (
    <a
      className="embedded-a11y__skip"
      href={`#${boundaryId}`}
      data-testid="EmbeddedFocusGuard"
      onClick={(event) => {
        event.preventDefault();
        focusBoundary();
      }}
    >
      Skip to embedded content
    </a>
  );
}

export function EmbeddedFocusRestoreBoundary({
  layerRef,
  boundaryId,
  profile,
  children,
}: {
  readonly layerRef: LayerRef;
  readonly boundaryId: string;
  readonly profile: EmbeddedA11yCoverageProfile;
  readonly children: ReactNode;
}) {
  const boundaryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ownerWindow = safeWindow();
    const boundary = boundaryRef.current;
    if (!ownerWindow || !boundary) return;
    const storageKey = `${EMBEDDED_ACCESSIBILITY_STORAGE_KEY}:${profile.routeFamily}:last-focus`;
    const handleFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement) || !boundary.contains(event.target)) return;
      const selector = selectorForElement(event.target);
      if (selector) {
        ownerWindow.sessionStorage.setItem(storageKey, selector);
        boundary.dataset.lastFocusSelector = selector;
      }
    };
    boundary.addEventListener("focusin", handleFocusIn);
    const restoreTimer = ownerWindow.setTimeout(() => {
      const active = ownerWindow.document.activeElement;
      if (active && active !== ownerWindow.document.body) {
        boundary.dataset.focusRestore = "observing";
        return;
      }
      const selector =
        ownerWindow.sessionStorage.getItem(storageKey) ??
        profile.focusRestoreSelector;
      const target = layerRef.current?.querySelector(selector) ?? null;
      if (isElementFocusable(target)) {
        target.focus({ preventScroll: true });
        boundary.dataset.focusRestore = "restored";
        return;
      }
      boundary.dataset.focusRestore = "available";
    }, 80);
    return () => {
      ownerWindow.clearTimeout(restoreTimer);
      boundary.removeEventListener("focusin", handleFocusIn);
    };
  }, [layerRef, profile.focusRestoreSelector, profile.routeFamily]);

  return (
    <div
      id={boundaryId}
      ref={boundaryRef}
      className="embedded-a11y__focus-boundary"
      tabIndex={-1}
      data-testid="EmbeddedFocusRestoreBoundary"
      data-route-family={profile.routeFamily}
      data-focus-restore="pending"
    >
      {children}
    </div>
  );
}

export function StickyActionObscurationGuard({
  layerRef,
  profile,
}: {
  readonly layerRef: LayerRef;
  readonly profile: EmbeddedA11yCoverageProfile;
}) {
  const [reservePx, setReservePx] = useState(0);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    let frame = 0;
    let observer: ResizeObserver | null = null;
    const measure = () => {
      ownerWindow.cancelAnimationFrame(frame);
      frame = ownerWindow.requestAnimationFrame(() => {
        const layer = layerRef.current;
        if (!layer) return;
        const actionNodes = Array.from(layer.querySelectorAll<HTMLElement>(profile.stickyActionSelector));
        const reserve = Math.max(
          0,
          ...actionNodes.map((node) => Math.ceil(node.getBoundingClientRect().height)),
        );
        layer.style.setProperty("--embedded-a11y-sticky-reserve", `${reserve}px`);
        layer.style.setProperty("--embedded-a11y-scroll-clearance", `${reserve + 24}px`);
        layer.dataset.stickyReservePx = String(reserve);
        setReservePx(reserve);
      });
    };
    const revealFocusedElement = (event: FocusEvent) => {
      if (!layerContains(layerRef, event.target)) return;
      const target = event.target;
      ownerWindow.setTimeout(() => {
        const layer = layerRef.current;
        if (!layer || !(target instanceof HTMLElement)) return;
        const actionNode = layer.querySelector<HTMLElement>(profile.stickyActionSelector);
        const actionRect = actionNode?.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const viewportHeight = ownerWindow.visualViewport?.height ?? ownerWindow.innerHeight;
        const obscurationTop = actionRect ? Math.min(actionRect.top, viewportHeight) : viewportHeight - reservePx;
        if (targetRect.bottom > obscurationTop - 10 || targetRect.top < 0) {
          target.scrollIntoView({ block: "center", inline: "nearest" });
        }
      }, 0);
    };
    measure();
    const action = layerRef.current?.querySelector<HTMLElement>(profile.stickyActionSelector);
    if (typeof ResizeObserver !== "undefined" && action) {
      observer = new ResizeObserver(measure);
      observer.observe(action);
    }
    ownerWindow.addEventListener("resize", measure);
    ownerWindow.visualViewport?.addEventListener("resize", measure);
    ownerWindow.document.addEventListener("focusin", revealFocusedElement);
    return () => {
      ownerWindow.cancelAnimationFrame(frame);
      observer?.disconnect();
      ownerWindow.removeEventListener("resize", measure);
      ownerWindow.visualViewport?.removeEventListener("resize", measure);
      ownerWindow.document.removeEventListener("focusin", revealFocusedElement);
    };
  }, [layerRef, profile.stickyActionSelector, reservePx]);

  return (
    <span
      className="embedded-a11y__instrument"
      data-testid="StickyActionObscurationGuard"
      data-route-family={profile.routeFamily}
      data-sticky-reserve-px={reservePx}
    >
      Sticky action reserve {reservePx}px
    </span>
  );
}

export function EmbeddedKeyboardParityHooks({
  layerRef,
}: {
  readonly layerRef: LayerRef;
}) {
  const [modality, setModality] = useState("unknown");

  useEffect(() => {
    const ownerDocument = safeDocument();
    if (!ownerDocument) return;
    const setLayerModality = (nextModality: string) => {
      setModality(nextModality);
      if (layerRef.current) layerRef.current.dataset.inputModality = nextModality;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!layerContains(layerRef, event.target)) return;
      if (event.key === "Tab") setLayerModality("keyboard");
      if (event.key === "Escape") {
        layerRef.current?.removeAttribute("data-open-transient-layer");
        dispatchEmbeddedA11yAnnouncement("Transient embedded overlay dismissed.");
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.getAttribute("role") === "button" &&
        !target.matches("button") &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        target.click();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (layerContains(layerRef, event.target)) setLayerModality("pointer");
    };
    ownerDocument.addEventListener("keydown", handleKeyDown);
    ownerDocument.addEventListener("pointerdown", handlePointerDown);
    return () => {
      ownerDocument.removeEventListener("keydown", handleKeyDown);
      ownerDocument.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [layerRef]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Tab") setModality("keyboard");
  };

  return (
    <span
      className="embedded-a11y__instrument"
      data-testid="EmbeddedKeyboardParityHooks"
      data-input-modality={modality}
      onKeyDown={onKeyDown}
    >
      Input modality {modality}
    </span>
  );
}

export function EmbeddedTargetSizeUtilities({
  layerRef,
}: {
  readonly layerRef: LayerRef;
}) {
  const [smallTargetCount, setSmallTargetCount] = useState(0);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    let frame = 0;
    const measure = () => {
      ownerWindow.cancelAnimationFrame(frame);
      frame = ownerWindow.requestAnimationFrame(() => {
        const layer = layerRef.current;
        if (!layer) return;
        const targets = Array.from(
          layer.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [role='button']"),
        ).filter((target) => !target.closest(".embedded-a11y__instrument"));
        const smallTargets = targets.filter((target) => {
          if (target.matches("input[type='checkbox'], input[type='radio']")) return false;
          const rect = target.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 24 || rect.height < 24);
        });
        setSmallTargetCount(smallTargets.length);
        layer.dataset.smallTargetCount = String(smallTargets.length);
      });
    };
    measure();
    ownerWindow.addEventListener("resize", measure);
    return () => {
      ownerWindow.cancelAnimationFrame(frame);
      ownerWindow.removeEventListener("resize", measure);
    };
  }, [layerRef]);

  return (
    <span
      className="embedded-a11y__instrument"
      data-testid="EmbeddedTargetSizeUtilities"
      data-small-target-count={smallTargetCount}
    >
      Target size issues {smallTargetCount}
    </span>
  );
}

export function EmbeddedA11yCoverageReporter({
  profile,
}: {
  readonly profile: EmbeddedA11yCoverageProfile;
}) {
  const contractList = profile.contracts.join(" ");
  return (
    <section
      className="embedded-a11y__coverage"
      aria-label={`${profile.label} accessibility coverage`}
      data-testid="EmbeddedA11yCoverageReporter"
      data-coverage-profile={EMBEDDED_ACCESSIBILITY_COVERAGE_PROFILE_REF}
      data-contract-ref={EMBEDDED_ACCESSIBILITY_CONTRACT_REF}
      data-route-family={profile.routeFamily}
      data-root-testid={profile.rootTestId}
      data-action-testid={profile.actionTestId}
      data-live-region-testid={profile.liveRegionTestId ?? "AssistiveAnnouncementDedupeBus"}
      data-covered-contracts={contractList}
    >
      <h2>{profile.label} accessibility coverage</h2>
      <p>{contractList}</p>
    </section>
  );
}

export function EmbeddedRouteSemanticBoundary({
  profile,
  children,
}: {
  readonly profile: EmbeddedA11yCoverageProfile;
  readonly children: ReactNode;
}) {
  return (
    <section
      className="embedded-a11y__route-boundary"
      role="region"
      aria-label={`${profile.label} embedded route accessibility boundary`}
      data-testid="EmbeddedRouteSemanticBoundary"
      data-route-family={profile.routeFamily}
      data-primary-landmark={profile.primaryLandmark}
      data-root-testid={profile.rootTestId}
      data-action-testid={profile.actionTestId}
    >
      {children}
    </section>
  );
}

export function EmbeddedAccessibilityResponsiveLayer({
  routeFamily,
  children,
}: EmbeddedAccessibilityResponsiveLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const profile = useMemo(() => resolveEmbeddedA11yCoverageProfile(routeFamily), [routeFamily]);
  const boundaryId = `embedded-a11y-boundary-${profile.routeFamily}`;

  return (
    <div
      ref={layerRef}
      className="embedded-a11y"
      data-testid="EmbeddedAccessibilityResponsiveLayer"
      data-task-id={EMBEDDED_ACCESSIBILITY_TASK_ID}
      data-visual-mode={EMBEDDED_ACCESSIBILITY_VISUAL_MODE}
      data-contract-ref={EMBEDDED_ACCESSIBILITY_CONTRACT_REF}
      data-coverage-profile={EMBEDDED_ACCESSIBILITY_COVERAGE_PROFILE_REF}
      data-route-family={profile.routeFamily}
      data-root-testid={profile.rootTestId}
      data-action-testid={profile.actionTestId}
      data-live-region-testid={profile.liveRegionTestId ?? "AssistiveAnnouncementDedupeBus"}
      data-host-resize-state="settled"
      data-input-modality="unknown"
    >
      <EmbeddedReducedMotionAdapter layerRef={layerRef} />
      <EmbeddedSafeAreaObserver layerRef={layerRef} />
      <HostResizeResilienceLayer layerRef={layerRef} profile={profile} />
      <AssistiveAnnouncementDedupeBus profile={profile} />
      <EmbeddedFocusGuard layerRef={layerRef} boundaryId={boundaryId} profile={profile} />
      <StickyActionObscurationGuard layerRef={layerRef} profile={profile} />
      <EmbeddedKeyboardParityHooks layerRef={layerRef} />
      <EmbeddedTargetSizeUtilities layerRef={layerRef} />
      <EmbeddedA11yCoverageReporter profile={profile} />
      <EmbeddedRouteSemanticBoundary profile={profile}>
        <EmbeddedFocusRestoreBoundary
          layerRef={layerRef}
          boundaryId={boundaryId}
          profile={profile}
        >
          {children}
        </EmbeddedFocusRestoreBoundary>
      </EmbeddedRouteSemanticBoundary>
    </div>
  );
}

export default EmbeddedAccessibilityResponsiveLayer;
