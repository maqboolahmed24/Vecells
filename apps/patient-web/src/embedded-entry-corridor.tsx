import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  EMBEDDED_ENTRY_PROGRESS_STEPS,
  EMBEDDED_ENTRY_STORAGE_KEY,
  buildEmbeddedEntryUrl,
  getEmbeddedEntryStateDefinition,
  isEmbeddedEntryCorridorPath,
  resolveEmbeddedEntryCorridorContext,
  sanitizeEmbeddedEntrySearch,
  type EmbeddedEntryCorridorContext,
  type EmbeddedEntryParam,
} from "./embedded-entry-corridor.model";
import {
  EMBEDDED_PATIENT_ROUTE_TREE,
  buildEmbeddedShellUrl,
  type EmbeddedShellRouteNode,
} from "./embedded-shell-split.model";

export { isEmbeddedEntryCorridorPath };

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function storedRedactionObserved(ownerWindow: Window | null): boolean {
  if (!ownerWindow) return false;
  return ownerWindow.sessionStorage.getItem(EMBEDDED_ENTRY_STORAGE_KEY) === "true";
}

function resolveCurrentContext(redactionObserved = false): EmbeddedEntryCorridorContext {
  const ownerWindow = safeWindow();
  return resolveEmbeddedEntryCorridorContext({
    pathname: ownerWindow?.location.pathname ?? "/nhs-app/entry",
    search: ownerWindow?.location.search ?? "?entry=landing&route=request_status",
    userAgent: ownerWindow?.navigator.userAgent ?? "",
    redactionObserved: redactionObserved || storedRedactionObserved(ownerWindow),
  });
}

function canonicalEntryHref(context: EmbeddedEntryCorridorContext): string {
  return buildEmbeddedEntryUrl({
    route: context.routeNode,
    entry: context.entryState.param,
  });
}

function routeHome(): EmbeddedShellRouteNode {
  return (
    EMBEDDED_PATIENT_ROUTE_TREE.find((route) => route.routeFamilyRef === "patient_home") ??
    EMBEDDED_PATIENT_ROUTE_TREE[0]!
  );
}

function useEmbeddedEntryController(): {
  readonly context: EmbeddedEntryCorridorContext;
  readonly setEntryPosture: (entry: EmbeddedEntryParam) => void;
  readonly beginNhsLogin: () => void;
  readonly handoffToShell: () => void;
  readonly returnToHost: () => void;
} {
  const initial = useMemo(() => resolveCurrentContext(), []);
  const initiallyObserved = initial.sensitiveUrlRedacted || storedRedactionObserved(safeWindow());
  const [redactionObserved, setRedactionObserved] = useState(initiallyObserved);
  const [context, setContext] = useState<EmbeddedEntryCorridorContext>(() =>
    initiallyObserved === initial.sensitiveUrlRedacted ? initial : resolveCurrentContext(initiallyObserved),
  );

  const refreshContext = useCallback(
    (observed = redactionObserved) => {
      setContext(resolveCurrentContext(observed));
    },
    [redactionObserved],
  );

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.motion = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "reduced"
      : "full";
  }, []);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    const sanitized = sanitizeEmbeddedEntrySearch(ownerWindow.location.search);
    if (!sanitized.sensitiveUrlRedacted) return;
    ownerWindow.sessionStorage.setItem(EMBEDDED_ENTRY_STORAGE_KEY, "true");
    setRedactionObserved(true);
    ownerWindow.history.replaceState(
      {
        entry: context.entryState.param,
        route: context.routeNode.routeFamilyRef,
        redacted: true,
      },
      "",
      canonicalEntryHref(context),
    );
    setContext(resolveCurrentContext(true));
  }, [context]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    const handlePopState = () => refreshContext();
    ownerWindow.addEventListener("popstate", handlePopState);
    return () => ownerWindow.removeEventListener("popstate", handlePopState);
  }, [refreshContext]);

  const setEntryPosture = useCallback(
    (entry: EmbeddedEntryParam) => {
      const ownerWindow = safeWindow();
      if (!ownerWindow) return;
      const nextContext = resolveEmbeddedEntryCorridorContext({
        pathname: "/nhs-app/entry",
        search: `?entry=${entry}&route=${context.routeNode.routeFamilyRef}&channel=nhs_app`,
        userAgent: ownerWindow.navigator.userAgent,
        redactionObserved,
      });
      ownerWindow.history.pushState(
        { entry, route: context.routeNode.routeFamilyRef },
        "",
        buildEmbeddedEntryUrl({ route: context.routeNode, entry }),
      );
      setContext(nextContext);
    },
    [context.routeNode, redactionObserved],
  );

  const beginNhsLogin = useCallback(() => {
    setEntryPosture("opening");
    const ownerWindow = safeWindow();
    ownerWindow?.setTimeout(() => {
      setEntryPosture("confirming");
    }, 360);
  }, [setEntryPosture]);

  const handoffToShell = useCallback(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.sessionStorage.setItem(EMBEDDED_ENTRY_STORAGE_KEY, redactionObserved ? "true" : "false");
    ownerWindow.location.replace(
      buildEmbeddedShellUrl(context.routeNode, "embedded", {
        signedContext: true,
      }),
    );
  }, [context.routeNode, redactionObserved]);

  const returnToHost = useCallback(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.location.replace(
      buildEmbeddedShellUrl(routeHome(), "embedded", {
        signedContext: true,
      }),
    );
  }, []);

  return {
    context,
    setEntryPosture,
    beginNhsLogin,
    handoffToShell,
    returnToHost,
  };
}

export function EmbeddedEntryHeaderFrame({ context }: { readonly context: EmbeddedEntryCorridorContext }) {
  return (
    <header
      className="embedded-entry__header-frame"
      role="banner"
      data-testid="EmbeddedEntryHeaderFrame"
      data-route-family={context.routeNode.routeFamilyRef}
    >
      <div>
        <span className="embedded-entry__eyebrow">NHS App</span>
        <p>{context.routeNode.routeTitle}</p>
      </div>
      <span className="embedded-entry__secure-chip" data-tone={context.entryState.tone}>
        Secure check
      </span>
    </header>
  );
}

export function EmbeddedEntryProgressRail({ context }: { readonly context: EmbeddedEntryCorridorContext }) {
  return (
    <nav
      className="embedded-entry__progress-rail"
      aria-label="Sign-in progress"
      data-testid="EmbeddedEntryProgressRail"
      data-current-step={String(context.entryState.progressIndex + 1)}
    >
      <ol>
        {EMBEDDED_ENTRY_PROGRESS_STEPS.map((step, index) => {
          const complete = index < context.entryState.progressIndex;
          const current = index === context.entryState.progressIndex;
          return (
            <li
              key={step}
              data-step-posture={complete ? "complete" : current ? "current" : "next"}
              aria-current={current ? "step" : undefined}
            >
              <span aria-hidden="true">{index + 1}</span>
              <strong>{step}</strong>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function EmbeddedEntryStateCard({
  context,
  titleRef,
  supportText,
}: {
  readonly context: EmbeddedEntryCorridorContext;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  readonly supportText?: string;
}) {
  const titleId = `embedded-entry-${context.entryState.id}-title`;
  const detailId = `embedded-entry-${context.entryState.id}-detail`;
  const roleProps =
    context.entryState.role === "alert"
      ? { role: "alert" as const, "aria-live": context.entryState.ariaLive }
      : { role: "status" as const, "aria-live": context.entryState.ariaLive };
  return (
    <section
      className="embedded-entry__state-card"
      aria-labelledby={titleId}
      aria-describedby={detailId}
      data-testid="EmbeddedEntryStatusCard"
      data-posture={context.entryState.id}
      data-tone={context.entryState.tone}
      {...roleProps}
    >
      <div className="embedded-entry__status-mark" aria-hidden="true" />
      <div className="embedded-entry__state-copy">
        <span className="embedded-entry__eyebrow">Sign-in check</span>
        <h1 id={titleId} ref={titleRef} tabIndex={-1}>
          {context.entryState.title}
        </h1>
        <p id={detailId}>{context.entryState.detail}</p>
        <p className="embedded-entry__return-intent">{supportText ?? context.returnIntent.visibleSummary}</p>
      </div>
      <dl className="embedded-entry__intent-strip" aria-label="Current journey">
        <div>
          <dt>Journey</dt>
          <dd>{context.routeNode.routeTitle}</dd>
        </div>
        <div>
          <dt>Place kept</dt>
          <dd>{context.routeNode.statusLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function EmbeddedConsentDeniedView({
  context,
  titleRef,
}: {
  readonly context: EmbeddedEntryCorridorContext;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <EmbeddedEntryStateCard
      context={context}
      titleRef={titleRef}
      supportText="No patient details have been opened."
    />
  );
}

export function EmbeddedExpiredSessionView({
  context,
  titleRef,
}: {
  readonly context: EmbeddedEntryCorridorContext;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <EmbeddedEntryStateCard
      context={context}
      titleRef={titleRef}
      supportText="The previous place is held only as a route label."
    />
  );
}

export function EmbeddedSafeReentryView({
  context,
  titleRef,
}: {
  readonly context: EmbeddedEntryCorridorContext;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <EmbeddedEntryStateCard
      context={context}
      titleRef={titleRef}
      supportText="Open this journey again from the NHS App."
    />
  );
}

export function EmbeddedWrongContextRecoveryView({
  context,
  titleRef,
}: {
  readonly context: EmbeddedEntryCorridorContext;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <EmbeddedEntryStateCard
      context={context}
      titleRef={titleRef}
      supportText="This screen stayed closed before showing patient details."
    />
  );
}

export function EmbeddedIdentityResolverView({
  context,
  titleRef,
}: {
  readonly context: EmbeddedEntryCorridorContext;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  switch (context.entryState.id) {
    case "consent_denied":
      return <EmbeddedConsentDeniedView context={context} titleRef={titleRef} />;
    case "expired_session":
      return <EmbeddedExpiredSessionView context={context} titleRef={titleRef} />;
    case "safe_reentry":
      return <EmbeddedSafeReentryView context={context} titleRef={titleRef} />;
    case "wrong_context_recovery":
    case "silent_failure":
      return <EmbeddedWrongContextRecoveryView context={context} titleRef={titleRef} />;
    case "secure_entry_landing":
    case "opening_nhs_login":
    case "confirming_details":
    case "silent_reauth_success":
      return <EmbeddedEntryStateCard context={context} titleRef={titleRef} />;
  }
}

export function EmbeddedEntryActionCluster({
  context,
  beginNhsLogin,
  handoffToShell,
  returnToHost,
}: {
  readonly context: EmbeddedEntryCorridorContext;
  readonly beginNhsLogin: () => void;
  readonly handoffToShell: () => void;
  readonly returnToHost: () => void;
}) {
  const runPrimaryAction = useCallback(() => {
    switch (context.entryState.actionKind) {
      case "begin_login":
      case "restart":
        beginNhsLogin();
        return;
      case "handoff_shell":
        handoffToShell();
        return;
      case "return_host":
      case "safe_retry":
        returnToHost();
        return;
      case "wait":
        return;
    }
  }, [beginNhsLogin, context.entryState.actionKind, handoffToShell, returnToHost]);

  const secondaryAction = useCallback(() => {
    const definition = getEmbeddedEntryStateDefinition(context.entryState.param);
    if (definition.secondaryActionLabel?.startsWith("Try")) {
      beginNhsLogin();
      return;
    }
    returnToHost();
  }, [beginNhsLogin, context.entryState.param, returnToHost]);

  const isWaiting = context.entryState.actionKind === "wait";

  return (
    <aside
      className="embedded-entry__action-cluster"
      aria-label="Entry actions"
      data-testid="EmbeddedEntryActionCluster"
      data-action-kind={context.entryState.actionKind}
      data-return-disposition={context.ssoReturnDisposition.disposition}
    >
      <button
        type="button"
        className="embedded-entry__primary-action"
        onClick={runPrimaryAction}
        disabled={isWaiting}
      >
        {context.entryState.primaryActionLabel}
      </button>
      {context.entryState.secondaryActionLabel ? (
        <button type="button" className="embedded-entry__secondary-action" onClick={secondaryAction}>
          {context.entryState.secondaryActionLabel}
        </button>
      ) : null}
    </aside>
  );
}

export function EmbeddedEntryLanding({
  context,
  beginNhsLogin,
  handoffToShell,
  returnToHost,
}: {
  readonly context: EmbeddedEntryCorridorContext;
  readonly beginNhsLogin: () => void;
  readonly handoffToShell: () => void;
  readonly returnToHost: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [context.entryState.id]);

  return (
    <main
      className="token-foundation embedded-entry"
      data-testid="EmbeddedEntryCorridorRoot"
      data-task-id={context.taskId}
      data-visual-mode={context.visualMode}
      data-posture={context.entryState.id}
      data-route-family={context.routeNode.routeFamilyRef}
      data-return-disposition={context.ssoReturnDisposition.disposition}
      data-sensitive-url-redacted={context.sensitiveUrlRedacted ? "true" : "false"}
      data-shell-continuity-key={context.shellContinuityKey}
      data-selected-anchor={context.selectedAnchorRef}
    >
      <div className="embedded-entry__surface">
        <EmbeddedEntryHeaderFrame context={context} />
        <EmbeddedEntryProgressRail context={context} />
        <EmbeddedIdentityResolverView context={context} titleRef={titleRef} />
      </div>
      <EmbeddedEntryActionCluster
        context={context}
        beginNhsLogin={beginNhsLogin}
        handoffToShell={handoffToShell}
        returnToHost={returnToHost}
      />
    </main>
  );
}

export function EmbeddedEntryStateMachineAdapter() {
  const controller = useEmbeddedEntryController();
  return (
    <EmbeddedEntryLanding
      context={controller.context}
      beginNhsLogin={controller.beginNhsLogin}
      handoffToShell={controller.handoffToShell}
      returnToHost={controller.returnToHost}
    />
  );
}

export default EmbeddedEntryStateMachineAdapter;
