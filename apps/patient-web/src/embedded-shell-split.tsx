import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  EMBEDDED_PATIENT_ROUTE_TREE,
  EMBEDDED_SHELL_STORAGE_KEY,
  buildEmbeddedShellUrl,
  isEmbeddedShellSplitPath,
  readEmbeddedContinuityEnvelope,
  resolveEmbeddedShellContext,
  writeEmbeddedContinuityEnvelope,
  type EmbeddedRecoveryReason,
  type EmbeddedShellContext,
  type EmbeddedShellMode,
  type EmbeddedShellRouteNode,
} from "./embedded-shell-split.model";

export { isEmbeddedShellSplitPath };

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function resolveCurrentContext(): EmbeddedShellContext {
  const ownerWindow = safeWindow();
  return resolveEmbeddedShellContext({
    pathname: ownerWindow?.location.pathname ?? "/home",
    search: ownerWindow?.location.search ?? "?phase7=embedded_shell&shell=standalone",
    userAgent: ownerWindow?.navigator.userAgent ?? "",
    storedEnvelope: readEmbeddedContinuityEnvelope(ownerWindow?.sessionStorage ?? null),
  });
}

function useEmbeddedShellController(): {
  readonly context: EmbeddedShellContext;
  readonly navigateToRoute: (route: EmbeddedShellRouteNode, mode?: EmbeddedShellMode) => void;
  readonly navigateToScenario: (reason: EmbeddedRecoveryReason) => void;
  readonly returnFromSafeBrowserHandoff: () => void;
  readonly goBack: () => void;
} {
  const [context, setContext] = useState<EmbeddedShellContext>(() => resolveCurrentContext());

  const refreshContext = useCallback(() => {
    setContext(resolveCurrentContext());
  }, []);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.addEventListener("popstate", refreshContext);
    return () => ownerWindow.removeEventListener("popstate", refreshContext);
  }, [refreshContext]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.motion = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "reduced"
      : "full";
    writeEmbeddedContinuityEnvelope(ownerWindow.sessionStorage, context);
  }, [context]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    const target = ownerWindow?.document.querySelector<HTMLElement>(
      `[data-focus-target="${context.routeNode.selectedAnchorRef}"]`,
    );
    target?.focus({ preventScroll: true });
  }, [context.routeNode.selectedAnchorRef]);

  const navigateToRoute = useCallback(
    (route: EmbeddedShellRouteNode, mode: EmbeddedShellMode = context.shellMode) => {
      const ownerWindow = safeWindow();
      if (!ownerWindow) return;
      ownerWindow.history.pushState(
        { routeId: route.routeId, shellMode: mode },
        "",
        buildEmbeddedShellUrl(route, mode),
      );
      refreshContext();
    },
    [context.shellMode, refreshContext],
  );

  const navigateToScenario = useCallback(
    (reason: EmbeddedRecoveryReason) => {
      const ownerWindow = safeWindow();
      if (!ownerWindow) return;
      ownerWindow.history.pushState(
        { routeId: context.routeNode.routeId, shellMode: context.shellMode, scenario: reason },
        "",
        buildEmbeddedShellUrl(context.routeNode, context.shellMode, { scenario: reason }),
      );
      refreshContext();
    },
    [context.routeNode, context.shellMode, refreshContext],
  );

  const returnFromSafeBrowserHandoff = useCallback(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.history.pushState(
      { routeId: context.routeNode.routeId, handoffReturn: true },
      "",
      buildEmbeddedShellUrl(context.routeNode, "embedded", { handoffReturn: true }),
    );
    refreshContext();
  }, [context.routeNode, refreshContext]);

  const goBack = useCallback(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    if (ownerWindow.history.length > 1) {
      ownerWindow.history.back();
      return;
    }
    navigateToRoute(EMBEDDED_PATIENT_ROUTE_TREE[0]!, context.shellMode);
  }, [context.shellMode, navigateToRoute]);

  return {
    context,
    navigateToRoute,
    navigateToScenario,
    returnFromSafeBrowserHandoff,
    goBack,
  };
}

function statusToneLabel(context: EmbeddedShellContext): string {
  if (context.shellState === "blocked") return "Blocked";
  if (context.shellState === "recovery_only") return "Recovery only";
  if (context.shellState === "revalidate_only") return "Revalidate";
  return context.routeNode.statusLabel;
}

function ShellRouteNavigation({
  context,
  navigateToRoute,
}: {
  readonly context: EmbeddedShellContext;
  readonly navigateToRoute: (route: EmbeddedShellRouteNode, mode?: EmbeddedShellMode) => void;
}) {
  return (
    <nav
      className="embedded-shell__route-nav"
      aria-label="Patient shell journey list"
      data-testid="EmbeddedShellRouteTreeNav"
      data-route-tree-version={context.routeTreeVersion}
    >
      {EMBEDDED_PATIENT_ROUTE_TREE.map((route) => (
        <button
          key={route.routeId}
          type="button"
          className="embedded-shell__route-tab"
          data-active={route.routeId === context.routeNode.routeId ? "true" : "false"}
          data-route-id={route.routeId}
          onClick={() => navigateToRoute(route)}
        >
          <span>{route.routeTitle}</span>
          <small>{route.routeFamilyRef.replaceAll("_", " ")}</small>
        </button>
      ))}
    </nav>
  );
}

function ModeSwitch({
  context,
  navigateToRoute,
}: {
  readonly context: EmbeddedShellContext;
  readonly navigateToRoute: (route: EmbeddedShellRouteNode, mode?: EmbeddedShellMode) => void;
}) {
  return (
    <div className="embedded-shell__mode-switch" aria-label="Shell render mode">
      <button
        type="button"
        data-active={context.shellMode === "standalone" ? "true" : "false"}
        onClick={() => navigateToRoute(context.routeNode, "standalone")}
      >
        Standalone
      </button>
      <button
        type="button"
        data-active={context.shellMode === "embedded" ? "true" : "false"}
        onClick={() => navigateToRoute(context.routeNode, "embedded")}
      >
        Embedded
      </button>
    </div>
  );
}

export function EmbeddedShellHeaderFrame({
  context,
  goBack,
}: {
  readonly context: EmbeddedShellContext;
  readonly goBack: () => void;
}) {
  return (
    <div
      className="embedded-shell__header-frame"
      role="banner"
      data-testid="EmbeddedShellHeaderFrame"
      data-return-anchor={context.returnContractRef}
      data-shell-state={context.shellState}
    >
      <button
        type="button"
        className="embedded-shell__icon-button"
        aria-label="Back to previous NHS App step"
        data-testid="EmbeddedBackOverride"
        data-return-anchor={context.returnContractRef}
        onClick={goBack}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <div>
        <span className="embedded-shell__eyebrow">NHS App embedded patient shell</span>
        <h1 id="embedded-route-title">{context.routeNode.routeTitle}</h1>
        <p>{context.routeNode.entityLabel}</p>
      </div>
      <span className="embedded-shell__compact-state" data-state={context.shellState}>
        {statusToneLabel(context)}
      </span>
    </div>
  );
}

export function EmbeddedShellStateRibbon({ context }: { readonly context: EmbeddedShellContext }) {
  return (
    <section
      className="embedded-shell__state-ribbon"
      role="status"
      aria-live={context.recovery.ariaLive}
      aria-labelledby="embedded-shell-state-title"
      data-testid="EmbeddedShellStateRibbon"
      data-shell-state={context.shellState}
      data-channel-profile={context.channelProfile}
      data-trust-tier={context.trustTier}
      data-eligibility-state={context.navEligibility.eligibilityState}
    >
      <div>
        <span className="embedded-shell__eyebrow">Shell state</span>
        <h2 id="embedded-shell-state-title">{statusToneLabel(context)}</h2>
      </div>
      <p>{context.consistencyProjection.patientEmbeddedNavEligibilityRef}</p>
      <strong>{context.trustTier.replaceAll("_", " ")}</strong>
    </section>
  );
}

export function EmbeddedContinuityBanner({ context }: { readonly context: EmbeddedShellContext }) {
  return (
    <section
      className="embedded-shell__continuity-banner"
      aria-labelledby="embedded-continuity-title"
      data-testid="EmbeddedContinuityBanner"
      data-continuity-key={context.patientShellContinuityKey}
      data-entity-continuity-key={context.entityContinuityKey}
      data-anchor-id={context.selectedAnchorRef}
      data-continuity-restored={context.continuityRestored ? "true" : "false"}
    >
      <div>
        <span className="embedded-shell__eyebrow">Continuity</span>
        <h2 id="embedded-continuity-title">Same shell, same anchor</h2>
        <p>{context.selectedAnchorRef}</p>
      </div>
      <dl>
        <div>
          <dt>Return</dt>
          <dd>{context.returnContractRef}</dd>
        </div>
        <div>
          <dt>Entity</dt>
          <dd>{context.routeNode.entityId}</dd>
        </div>
      </dl>
    </section>
  );
}

export function EmbeddedRecoveryFrame({ context }: { readonly context: EmbeddedShellContext }) {
  return (
    <section
      className="embedded-shell__recovery-frame"
      role={context.recovery.ariaLive === "assertive" ? "alert" : "status"}
      aria-live={context.recovery.ariaLive}
      aria-labelledby="embedded-recovery-title"
      data-testid="EmbeddedRecoveryFrame"
      data-recovery-posture={context.recovery.reason}
      data-shell-state={context.shellState}
      data-mutation-state={context.recovery.mutationState}
    >
      <div>
        <span className="embedded-shell__eyebrow">Recovery frame</span>
        <h2 id="embedded-recovery-title">{context.recovery.title}</h2>
        <p>{context.recovery.detail}</p>
      </div>
      <strong>{context.recovery.nextStep}</strong>
    </section>
  );
}

function SharedRouteContent({ context }: { readonly context: EmbeddedShellContext }) {
  const route = context.routeNode;
  const facts = useMemo(() => route.routeFacts.slice(0, 4), [route.routeFacts]);
  return (
    <article
      className="embedded-shell__route-content"
      aria-labelledby="embedded-route-content-title"
      data-testid="EmbeddedRouteContent"
      data-route-id={route.routeId}
      data-route-family={route.routeFamilyRef}
      data-focus-target={route.selectedAnchorRef}
      tabIndex={-1}
    >
      <div className="embedded-shell__content-heading">
        <span className="embedded-shell__eyebrow">Route content</span>
        <h2 id="embedded-route-content-title">{route.entityLabel}</h2>
        <p>{route.summary}</p>
      </div>
      <section className="embedded-shell__semantic-strip" aria-label="Route title status and consent">
        <div>
          <span>Title</span>
          <strong>{route.routeTitle}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{route.statusLabel}</strong>
        </div>
        <div>
          <span>Consent</span>
          <strong>{route.consentSummary}</strong>
        </div>
      </section>
      {route.errorSummary ? (
        <section className="embedded-shell__error-summary" role="status" aria-label="Route error semantics">
          <strong>Access check</strong>
          <p>{route.errorSummary}</p>
        </section>
      ) : null}
      <ol className="embedded-shell__fact-list" aria-label="Current route facts">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ol>
    </article>
  );
}

export function EmbeddedRouteContextBoundary({ context }: { readonly context: EmbeddedShellContext }) {
  return (
    <section
      className="embedded-shell__route-boundary"
      aria-labelledby="embedded-route-title"
      data-testid="EmbeddedRouteContextBoundary"
      data-shell-type="persistent_patient_shell"
      data-channel-profile={context.channelProfile}
      data-route-family={context.routeNode.routeFamilyRef}
      data-design-contract-digest="design-digest:387-embedded-shell-split"
      data-design-contract-state="published"
      data-design-contract-lint-state="pass"
      data-layout-topology={context.shellMode === "embedded" ? "embedded_strip" : "focus_frame"}
      data-breakpoint-class="container_measured"
      data-density-profile={context.shellMode === "embedded" ? "compact_patient" : "standard_patient"}
      data-surface-state={context.shellState}
      data-state-owner="EmbeddedShellConsistencyProjection"
      data-state-reason={context.recovery.reason}
      data-writable-state={context.recovery.mutationState === "enabled" ? "writable" : "frozen"}
      data-dominant-action={context.recovery.dominantActionLabel}
      data-anchor-id={context.selectedAnchorRef}
      data-anchor-state={context.continuityRestored ? "restored" : "current"}
      data-artifact-stage="summary"
      data-artifact-mode={context.shellMode === "embedded" ? "summary_then_handoff" : "portal"}
      data-transfer-state="not_started"
      data-continuity-key={context.patientShellContinuityKey}
      data-return-anchor={context.returnContractRef}
    >
      <SharedRouteContent context={context} />
      <EmbeddedRecoveryFrame context={context} />
    </section>
  );
}

export function EmbeddedActionReserve({
  context,
  returnFromSafeBrowserHandoff,
}: {
  readonly context: EmbeddedShellContext;
  readonly returnFromSafeBrowserHandoff: () => void;
}) {
  const frozen = context.recovery.mutationState === "frozen";
  return (
    <aside
      className="embedded-shell__action-reserve"
      aria-label="Dominant action reserve"
      data-testid="EmbeddedActionReserve"
      data-dominant-action={context.recovery.dominantActionLabel}
      data-writable-state={frozen ? "frozen" : "writable"}
      data-return-anchor={context.returnContractRef}
    >
      <div>
        <span className="embedded-shell__eyebrow">Next safe action</span>
        <strong>{context.recovery.dominantActionLabel}</strong>
      </div>
      <button type="button" disabled={frozen} data-testid="EmbeddedDominantActionButton">
        {context.recovery.dominantActionLabel}
      </button>
      <button
        type="button"
        className="embedded-shell__secondary-action"
        data-testid="EmbeddedSafeBrowserReturnButton"
        onClick={returnFromSafeBrowserHandoff}
      >
        Test handoff return
      </button>
    </aside>
  );
}

export function EmbeddedSafeAreaContainer({
  children,
  context,
}: {
  readonly children: ReactNode;
  readonly context: EmbeddedShellContext;
}) {
  return (
    <div
      className="embedded-shell__safe-area"
      data-testid="EmbeddedSafeAreaContainer"
      data-safe-area-mode={context.shellPolicy.safeAreaInsetsMode}
      data-channel-profile={context.channelProfile}
    >
      {children}
    </div>
  );
}

export function StandaloneShell({
  context,
  navigateToRoute,
  returnFromSafeBrowserHandoff,
}: {
  readonly context: EmbeddedShellContext;
  readonly navigateToRoute: (route: EmbeddedShellRouteNode, mode?: EmbeddedShellMode) => void;
  readonly returnFromSafeBrowserHandoff: () => void;
}) {
  return (
    <main
      className="token-foundation embedded-shell embedded-shell--standalone"
      data-testid="EmbeddedPatientShellRoot"
      data-task-id={context.taskId}
      data-visual-mode={context.visualMode}
      data-shell-mode="standalone"
      data-shell-type="persistent_patient_shell"
      data-channel-profile={context.channelProfile}
      data-route-family={context.routeNode.routeFamilyRef}
      data-shell-state={context.shellState}
      data-continuity-key={context.patientShellContinuityKey}
      data-anchor-id={context.selectedAnchorRef}
      data-return-anchor={context.returnContractRef}
    >
      <header className="embedded-shell__standalone-header" data-testid="standalone-shell-header">
        <div>
          <span className="embedded-shell__eyebrow">Patient portal</span>
          <h1>{context.routeNode.routeTitle}</h1>
          <p>Standalone portal chrome over the Current programme patient journey list.</p>
        </div>
        <ModeSwitch context={context} navigateToRoute={navigateToRoute} />
      </header>
      <ShellRouteNavigation context={context} navigateToRoute={navigateToRoute} />
      <div className="embedded-shell__standalone-layout" data-testid="StandaloneShell">
        <EmbeddedRouteContextBoundary context={context} />
        <EmbeddedActionReserve
          context={context}
          returnFromSafeBrowserHandoff={returnFromSafeBrowserHandoff}
        />
      </div>
      <footer className="embedded-shell__standalone-footer" data-testid="standalone-shell-footer">
        <span>Same journey list</span>
        <strong>{EMBEDDED_PATIENT_ROUTE_TREE.length} NHS App entry routes</strong>
      </footer>
    </main>
  );
}

export function EmbeddedShell({
  context,
  navigateToRoute,
  navigateToScenario,
  returnFromSafeBrowserHandoff,
  goBack,
}: {
  readonly context: EmbeddedShellContext;
  readonly navigateToRoute: (route: EmbeddedShellRouteNode, mode?: EmbeddedShellMode) => void;
  readonly navigateToScenario: (reason: EmbeddedRecoveryReason) => void;
  readonly returnFromSafeBrowserHandoff: () => void;
  readonly goBack: () => void;
}) {
  return (
    <main
      className="token-foundation embedded-shell embedded-shell--embedded"
      data-testid="EmbeddedPatientShellRoot"
      data-task-id={context.taskId}
      data-visual-mode={context.visualMode}
      data-shell-mode="embedded"
      data-shell-type="persistent_patient_shell"
      data-channel-profile={context.channelProfile}
      data-route-family={context.routeNode.routeFamilyRef}
      data-shell-state={context.shellState}
      data-continuity-key={context.patientShellContinuityKey}
      data-anchor-id={context.selectedAnchorRef}
      data-return-anchor={context.returnContractRef}
      data-recovery-posture={context.recovery.reason}
      data-return-handoff-ref={context.returnHandoffRef ?? "none"}
    >
      <EmbeddedSafeAreaContainer context={context}>
        <EmbeddedShellHeaderFrame context={context} goBack={goBack} />
        <EmbeddedShellStateRibbon context={context} />
        <EmbeddedContinuityBanner context={context} />
        <ShellRouteNavigation context={context} navigateToRoute={navigateToRoute} />
        <EmbeddedRouteContextBoundary context={context} />
        <section className="embedded-shell__scenario-tools" aria-label="Recovery scenario preview">
          <button type="button" onClick={() => navigateToScenario("stale_continuity")}>
            Stale
          </button>
          <button type="button" onClick={() => navigateToScenario("route_freeze")}>
            Freeze
          </button>
          <button type="button" onClick={() => navigateToScenario("wrong_patient")}>
            Block
          </button>
        </section>
      </EmbeddedSafeAreaContainer>
      <EmbeddedActionReserve
        context={context}
        returnFromSafeBrowserHandoff={returnFromSafeBrowserHandoff}
      />
    </main>
  );
}

export function EmbeddedPatientShellApp() {
  const controller = useEmbeddedShellController();
  if (controller.context.shellMode === "embedded") {
    return (
      <EmbeddedShell
        context={controller.context}
        navigateToRoute={controller.navigateToRoute}
        navigateToScenario={controller.navigateToScenario}
        returnFromSafeBrowserHandoff={controller.returnFromSafeBrowserHandoff}
        goBack={controller.goBack}
      />
    );
  }
  return (
    <StandaloneShell
      context={controller.context}
      navigateToRoute={controller.navigateToRoute}
      returnFromSafeBrowserHandoff={controller.returnFromSafeBrowserHandoff}
    />
  );
}

export default EmbeddedPatientShellApp;
