import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ShellSlug } from "@vecells/api-contracts";
import { VecellLogoLockup } from "@vecells/design-system";
import {
  createContinuityCarryForwardPlan,
  createContinuityRestorePlan,
  getPersistentShellRouteClaim,
  getPersistentShellRuntimeBinding,
  getPersistentShellSpec,
  resolvePersistentShellProfile,
  resolveShellBoundaryDecision,
  type BreakpointClass,
  type PersistentShellRouteClaim,
  type RuntimeScenario,
  type ShellBoundaryDecision,
  type ShellSlotContent,
} from "./contracts";

interface PersistedShellState {
  routeFamilyRef: string;
  selectedAnchor: string;
  foldState: "folded" | "expanded";
  runtimeScenario: RuntimeScenario;
}

export interface PersistentShellAppProps {
  shellSlug: ShellSlug;
  className?: string;
  showInteractiveControls?: boolean;
  showContinuityFooter?: boolean;
  showRouteRail?: boolean;
}

interface TimelineEntry {
  id: string;
  label: string;
  detail: string;
}

function firstRoute(
  routes: readonly PersistentShellRouteClaim[],
): PersistentShellRouteClaim {
  const route = routes[0];
  if (!route) {
    throw new Error("PERSISTENT_SHELL_ROUTE_CLAIMS_EMPTY");
  }
  return route;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function readPersistedState(shellSlug: ShellSlug): PersistedShellState | null {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return null;
  }
  const payload = ownerWindow.localStorage.getItem(`persistent-shell::${shellSlug}`);
  if (!payload) {
    return null;
  }
  try {
    return JSON.parse(payload) as PersistedShellState;
  } catch {
    return null;
  }
}

function writePersistedState(shellSlug: ShellSlug, state: PersistedShellState): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return;
  }
  ownerWindow.localStorage.setItem(`persistent-shell::${shellSlug}`, JSON.stringify(state));
}

function resolveInitialState(shellSlug: ShellSlug): PersistedShellState {
  const shell = getPersistentShellSpec(shellSlug);
  const persisted = readPersistedState(shellSlug);
  const defaultRoute = firstRoute(shell.routeClaims);
  if (!persisted) {
    return {
      routeFamilyRef: defaultRoute.routeFamilyRef,
      selectedAnchor: defaultRoute.defaultAnchor,
      foldState: "expanded",
      runtimeScenario: "live",
    };
  }
  const route = shell.routeClaims.find(
    (candidate) => candidate.routeFamilyRef === persisted.routeFamilyRef,
  );
  if (!route) {
    return {
      routeFamilyRef: defaultRoute.routeFamilyRef,
      selectedAnchor: defaultRoute.defaultAnchor,
      foldState: "expanded",
      runtimeScenario: "live",
    };
  }
  return {
    routeFamilyRef: route.routeFamilyRef,
    selectedAnchor: route.anchors.includes(persisted.selectedAnchor)
      ? persisted.selectedAnchor
      : route.defaultAnchor,
    foldState: persisted.foldState,
    runtimeScenario: persisted.runtimeScenario,
  };
}

function breakpointClassFromWidth(width: number): BreakpointClass {
  if (width < 480) {
    return "compact";
  }
  if (width < 768) {
    return "narrow";
  }
  if (width < 1024) {
    return "medium";
  }
  if (width < 1440) {
    return "expanded";
  }
  return "wide";
}

function useBreakpointClass(): BreakpointClass {
  const ownerWindow = safeWindow();
  const [breakpointClass, setBreakpointClass] = useState<BreakpointClass>(
    ownerWindow ? breakpointClassFromWidth(ownerWindow.innerWidth) : "wide",
  );

  useEffect(() => {
    if (!ownerWindow) {
      return;
    }
    const update = () => setBreakpointClass(breakpointClassFromWidth(ownerWindow.innerWidth));
    update();
    ownerWindow.addEventListener("resize", update);
    return () => ownerWindow.removeEventListener("resize", update);
  }, [ownerWindow]);

  return breakpointClass;
}

function useReducedMotionPreference(): boolean {
  const ownerWindow = safeWindow();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    ownerWindow?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    if (!ownerWindow) {
      return;
    }
    const mediaQuery = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [ownerWindow]);

  return prefersReducedMotion;
}

function toneCopy(runtimeScenario: RuntimeScenario): string {
  switch (runtimeScenario) {
    case "live":
      return "Live status";
    case "stale_review":
      return "Stale review";
    case "read_only":
      return "Read-only preserve";
    case "recovery_only":
      return "Recovery only";
    case "blocked":
      return "Blocked";
  }
}

function runtimeScenarioLabel(runtimeScenario: RuntimeScenario): string {
  switch (runtimeScenario) {
    case "live":
      return "Live";
    case "stale_review":
      return "Stale review";
    case "read_only":
      return "Read-only";
    case "recovery_only":
      return "Recovery only";
    case "blocked":
      return "Blocked";
  }
}

function renderSlot(slot: ShellSlotContent, testId: string) {
  return (
    <article className="persistent-shell__slot" data-testid={testId}>
      <span className="persistent-shell__eyebrow">{slot.title}</span>
      <h3>{slot.summary}</h3>
      <p>{slot.detail}</p>
    </article>
  );
}

function formatBoundaryLabel(boundaryDecision: ShellBoundaryDecision): string {
  switch (boundaryDecision.boundaryState) {
    case "reuse_shell":
      return "Reuse shell";
    case "morph_child_surface":
      return "Same-shell morph";
    case "preserve_shell_read_only":
      return "Preserve read-only";
    case "recover_in_place":
      return "Recover in place";
    case "replace_shell":
      return "Replace shell";
  }
}

function familyMark(shellFamily: string): string {
  switch (shellFamily) {
    case "patient":
      return "Patient";
    case "staff":
      return "Workspace";
    case "support":
      return "Support";
    case "operations":
      return "Operations";
    case "hub":
      return "Hub";
    case "governance":
      return "Governance";
    case "pharmacy":
      return "Pharmacy";
    default:
      return "Shell";
  }
}

function RouteRail({
  shellSlug,
  routes,
  activeRouteFamilyRef,
  onSelect,
}: {
  shellSlug: ShellSlug;
  routes: readonly PersistentShellRouteClaim[];
  activeRouteFamilyRef: string;
  onSelect: (routeFamilyRef: string) => void;
}) {
  return (
    <nav
      aria-label="Route families"
      className="persistent-shell__route-rail"
      data-testid={`${shellSlug}-route-rail`}
    >
      {routes.map((route) => (
        <button
          type="button"
          className="persistent-shell__route-button"
          data-active={route.routeFamilyRef === activeRouteFamilyRef}
          data-testid={`${shellSlug}-route-${route.routeFamilyRef}`}
          key={route.routeFamilyRef}
          onClick={() => onSelect(route.routeFamilyRef)}
        >
          <span>{route.title}</span>
          <small>{route.residency.replaceAll("_", " ")}</small>
        </button>
      ))}
    </nav>
  );
}

function SectionBand({
  shellSlug,
  routes,
  activeRouteFamilyRef,
  onSelect,
}: {
  shellSlug: ShellSlug;
  routes: readonly PersistentShellRouteClaim[];
  activeRouteFamilyRef: string;
  onSelect: (routeFamilyRef: string) => void;
}) {
  const rootRoutes = routes.filter((route) => route.residency === "resident_root");
  return (
    <nav
      aria-label="Primary sections"
      className="persistent-shell__section-band"
      data-testid={`${shellSlug}-section-band`}
    >
      {rootRoutes.map((route) => (
        <button
          type="button"
          className="persistent-shell__section-button"
          data-active={route.routeFamilyRef === activeRouteFamilyRef}
          data-testid={`${shellSlug}-section-${route.section.replaceAll(" ", "-").toLowerCase()}`}
          key={route.routeFamilyRef}
          onClick={() => onSelect(route.routeFamilyRef)}
        >
          {route.section}
        </button>
      ))}
    </nav>
  );
}

function Pane({
  title,
  subtitle,
  children,
  testId,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  testId: string;
}) {
  return (
    <section className="persistent-shell__pane" data-testid={testId}>
      <header className="persistent-shell__pane-header">
        <span className="persistent-shell__eyebrow">{title}</span>
        <p>{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

export function PersistentShellApp({
  shellSlug,
  className,
  showInteractiveControls = true,
  showContinuityFooter = true,
  showRouteRail = true,
}: PersistentShellAppProps) {
  const shell = getPersistentShellSpec(shellSlug);
  const initialStateRef = useRef(resolveInitialState(shellSlug));
  const [activeRouteFamilyRef, setActiveRouteFamilyRef] = useState(
    initialStateRef.current.routeFamilyRef,
  );
  const [selectedAnchor, setSelectedAnchor] = useState(
    initialStateRef.current.selectedAnchor,
  );
  const [runtimeScenario, setRuntimeScenario] = useState<RuntimeScenario>(
    initialStateRef.current.runtimeScenario,
  );
  const [missionStackFolded, setMissionStackFolded] = useState(
    initialStateRef.current.foldState === "folded",
  );
  const [lastBoundaryDecision, setLastBoundaryDecision] = useState(() =>
    resolveShellBoundaryDecision({
      currentRouteFamilyRef: activeRouteFamilyRef,
      candidateRouteFamilyRef: activeRouteFamilyRef,
      runtimeScenario,
    }),
  );
  const [timeline, setTimeline] = useState<readonly TimelineEntry[]>([
    {
      id: `initial-${activeRouteFamilyRef}`,
      label: "Shell ready",
      detail: "Initial shell epoch resolved from persisted continuity memory.",
    },
  ]);
  const breakpointClass = useBreakpointClass();
  const prefersReducedMotion = useReducedMotionPreference();
  const activeRoute = getPersistentShellRouteClaim(activeRouteFamilyRef);
  const profile = resolvePersistentShellProfile(shellSlug, {
    breakpointClass,
    missionStackFolded,
    routeFamilyRef: activeRoute.routeFamilyRef,
  });
  const runtimeBinding = getPersistentShellRuntimeBinding(
    shellSlug,
    activeRoute.routeFamilyRef,
    runtimeScenario,
  );
  const carryForwardPlan = createContinuityCarryForwardPlan(lastBoundaryDecision);
  const restorePlan = createContinuityRestorePlan({
    shellSlug,
    routeFamilyRef: activeRoute.routeFamilyRef,
    selectedAnchor,
    foldState: missionStackFolded ? "folded" : "expanded",
    runtimeScenario,
  });

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.contrast = "standard";
    ownerWindow.document.body.dataset.density = shell.defaultDensityMode;
    ownerWindow.document.body.dataset.motion = prefersReducedMotion ? "essential_only" : shell.defaultMotionMode;
    ownerWindow.document.body.dataset.reducedMotion = prefersReducedMotion ? "true" : "false";
  }, [prefersReducedMotion, shell.defaultDensityMode, shell.defaultMotionMode]);

  useEffect(() => {
    writePersistedState(shellSlug, {
      routeFamilyRef: activeRouteFamilyRef,
      selectedAnchor,
      foldState: missionStackFolded ? "folded" : "expanded",
      runtimeScenario,
    });
  }, [activeRouteFamilyRef, missionStackFolded, runtimeScenario, selectedAnchor, shellSlug]);

  const handleRouteSelect = (candidateRouteFamilyRef: string) => {
    const candidateRoute = getPersistentShellRouteClaim(candidateRouteFamilyRef);
    startTransition(() => {
      const nextDecision = resolveShellBoundaryDecision({
        currentRouteFamilyRef: activeRoute.routeFamilyRef,
        candidateRouteFamilyRef,
        runtimeScenario,
      });
      const nextPlan = createContinuityCarryForwardPlan(nextDecision);
      const nextAnchor =
        nextPlan.preserveSelectedAnchor && candidateRoute.anchors.includes(selectedAnchor)
          ? selectedAnchor
          : candidateRoute.defaultAnchor;
      setActiveRouteFamilyRef(candidateRouteFamilyRef);
      setSelectedAnchor(nextAnchor);
      setLastBoundaryDecision(nextDecision);
      setTimeline((currentTimeline) => [
        ...currentTimeline.slice(-4),
        {
          id: `${candidateRouteFamilyRef}-${currentTimeline.length}`,
          label: formatBoundaryLabel(nextDecision),
          detail: `${activeRoute.title} -> ${candidateRoute.title}`,
        },
      ]);
    });
  };

  const handleRuntimeScenarioChange = (candidateScenario: RuntimeScenario) => {
    startTransition(() => {
      setRuntimeScenario(candidateScenario);
      setLastBoundaryDecision(
        resolveShellBoundaryDecision({
          currentRouteFamilyRef: activeRoute.routeFamilyRef,
          candidateRouteFamilyRef: activeRoute.routeFamilyRef,
          runtimeScenario: candidateScenario,
        }),
      );
    });
  };

  const handleFoldToggle = () => {
    setMissionStackFolded((current) => !current);
    setTimeline((currentTimeline) => [
      ...currentTimeline.slice(-4),
      {
        id: `fold-${currentTimeline.length}`,
        label: missionStackFolded ? "Unfold shell" : "Fold shell",
        detail: "Mission stack preserves the selected anchor and dominant action.",
      },
    ]);
  };

  return (
    <main
      aria-label={`${shell.displayName} persistent shell`}
      className={[
        "token-foundation",
        "persistent-shell",
        `persistent-shell--${shell.shellFamily}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-active-route-family={activeRoute.routeFamilyRef}
      data-breakpoint-class={profile.breakpointClass}
      data-boundary-state={lastBoundaryDecision.boundaryState}
      data-fold-state={missionStackFolded ? "folded" : "expanded"}
      data-layout-topology={profile.topology}
      data-runtime-posture={runtimeBinding.runtimeDecision.effectiveBrowserPosture}
      data-selected-anchor={selectedAnchor}
      data-shell-continuity-key={shell.ownership.continuityKey}
      data-shell-family={shell.shellFamily}
      data-testid={`${shellSlug}-shell-root`}
    >
      <header className="persistent-shell__masthead">
        <div className="persistent-shell__brand-block">
          <VecellLogoLockup
            aria-hidden="true"
            className="persistent-shell__brand-mark"
            style={{ width: 168, height: "auto" }}
          />
          <div>
            <span className="persistent-shell__eyebrow">{shell.shellEyebrow}</span>
            <h1>{shell.shellTitle}</h1>
            <p>
              {shell.shellSummary} {familyMark(shell.shellFamily)} shell.
            </p>
          </div>
        </div>
        <div className="persistent-shell__masthead-meta">
          <span className="persistent-shell__meta-pill">{profile.topology.replaceAll("_", " ")}</span>
          <span className="persistent-shell__meta-pill">{profile.breakpointClass}</span>
          <span className="persistent-shell__meta-pill">{toneCopy(runtimeScenario)}</span>
        </div>
      </header>

      <div className="persistent-shell__trace-ribbon" data-testid={`${shellSlug}-trace-ribbon`}>
        <span>{shell.ownership.ownershipContractId}</span>
        <span>{restorePlan.restoreStorageKey}</span>
        <span>{profile.profileSelectionResolutionId}</span>
        <span>{runtimeBinding.releasePosture.ring} / {runtimeBinding.releasePosture.publication}</span>
      </div>

      <section
        className="persistent-shell__status-strip"
        data-testid={`${shellSlug}-status-strip`}
      >
        <div>
          <span className="persistent-shell__eyebrow">Status strip</span>
          <strong>{runtimeBinding.runtimeDecision.effectiveBrowserPosture.replaceAll("_", " ")}</strong>
          <p>{activeRoute.trustCue}</p>
        </div>
        <div>
          <span className="persistent-shell__eyebrow">Freshness</span>
          <strong>{runtimeBinding.runtimeDecision.projectionFreshnessEnvelope.freshnessState}</strong>
          <p>{runtimeBinding.runtimeDecision.recoveryDispositionRef}</p>
        </div>
        <div>
          <span className="persistent-shell__eyebrow">Boundary</span>
          <strong data-testid={`${shellSlug}-boundary-state`}>
            {formatBoundaryLabel(lastBoundaryDecision)}
          </strong>
          <p>{lastBoundaryDecision.reason}</p>
        </div>
      </section>

      {shell.shellFamily === "patient" ? (
        <SectionBand
          activeRouteFamilyRef={activeRoute.routeFamilyRef}
          onSelect={handleRouteSelect}
          routes={shell.routeClaims}
          shellSlug={shellSlug}
        />
      ) : null}

      <div className="persistent-shell__utility-strip">
        <div className="persistent-shell__utility-copy">
          <span className="persistent-shell__eyebrow">{shell.northStarLabel}</span>
          <strong>{activeRoute.routeSummary}</strong>
        </div>
        {showInteractiveControls ? (
          <div className="persistent-shell__controls">
            <label className="persistent-shell__control">
              <span>Runtime</span>
              <select
                aria-label="Runtime status"
                data-testid={`${shellSlug}-runtime-scenario`}
                onChange={(event) =>
                  handleRuntimeScenarioChange(event.currentTarget.value as RuntimeScenario)
                }
                value={runtimeScenario}
              >
                {(
                  [
                    "live",
                    "stale_review",
                    "read_only",
                    "recovery_only",
                    "blocked",
                  ] as const
                ).map((scenario) => (
                  <option key={scenario} value={scenario}>
                    {runtimeScenarioLabel(scenario)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="persistent-shell__fold-toggle"
              data-testid={`${shellSlug}-fold-toggle`}
              onClick={handleFoldToggle}
            >
              {missionStackFolded ? "Unfold shell" : "Fold to mission stack"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="persistent-shell__layout" data-testid={`${shellSlug}-layout`}>
        {shell.shellFamily !== "patient" && showRouteRail ? (
          <Pane
            subtitle={shell.leftPaneLabel}
            testId={`${shellSlug}-left-pane`}
            title={shell.leftPaneLabel}
          >
            <RouteRail
              activeRouteFamilyRef={activeRoute.routeFamilyRef}
              onSelect={handleRouteSelect}
              routes={shell.routeClaims}
              shellSlug={shellSlug}
            />
            <div className="persistent-shell__left-summary">
              <strong>{activeRoute.section}</strong>
              <p>{activeRoute.routeSummary}</p>
            </div>
          </Pane>
        ) : null}

        <section
          className="persistent-shell__primary"
          data-testid={`${shellSlug}-primary-region`}
        >
          <header className="persistent-shell__section-header">
            <div>
              <span className="persistent-shell__eyebrow">{activeRoute.section}</span>
              <h2>{activeRoute.title}</h2>
              <p>{activeRoute.trustCue}</p>
            </div>
            <button
              type="button"
              className="persistent-shell__dominant-action"
              data-testid={`${shellSlug}-dominant-action`}
            >
              {activeRoute.dominantActionLabel}
            </button>
          </header>

          <div className="persistent-shell__anchor-strip">
            {activeRoute.anchors.map((anchor) => (
              <button
                key={anchor}
                type="button"
                className="persistent-shell__anchor-chip"
                data-active={anchor === selectedAnchor}
                data-testid={`${shellSlug}-anchor-${anchor}`}
                onClick={() => setSelectedAnchor(anchor)}
              >
                {anchor.replaceAll("-", " ")}
              </button>
            ))}
          </div>

          <div className="persistent-shell__primary-grid">
            {renderSlot(activeRoute.casePulse, `${shellSlug}-case-pulse`)}
            <article className="persistent-shell__hero-card" data-testid={`${shellSlug}-hero`}>
              <span className="persistent-shell__eyebrow">Primary region</span>
              <h3>{activeRoute.primaryRegion.summary}</h3>
              <p>{activeRoute.primaryRegion.detail}</p>
              <dl className="persistent-shell__metadata">
                <div>
                  <dt>Selected anchor</dt>
                  <dd data-testid={`${shellSlug}-selected-anchor`}>{selectedAnchor}</dd>
                </div>
                <div>
                  <dt>Carry forward</dt>
                  <dd>{carryForwardPlan.selectedAnchorDisposition.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>Actionability</dt>
                  <dd>{runtimeBinding.runtimeDecision.actionabilityState.replaceAll("_", " ")}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>

        <aside className="persistent-shell__aside" data-testid={`${shellSlug}-aside`}>
          {renderSlot(activeRoute.decisionDock, `${shellSlug}-decision-dock`)}
          {activeRoute.supportSlot
            ? renderSlot(activeRoute.supportSlot, `${shellSlug}-support-region`)
            : null}
          <article className="persistent-shell__inspector-card" data-testid={`${shellSlug}-runtime-card`}>
            <span className="persistent-shell__eyebrow">Runtime authority</span>
            <strong>{runtimeBinding.runtimeDecision.effectiveBrowserPosture.replaceAll("_", " ")}</strong>
            <p>{runtimeBinding.runtimeDecision.reasonRefs.join(", ") || "No active blockers."}</p>
          </article>
        </aside>
      </div>

      {showContinuityFooter ? (
        <footer className="persistent-shell__continuity-footer" data-testid={`${shellSlug}-continuity-footer`}>
          <div className="persistent-shell__timeline">
            <span className="persistent-shell__eyebrow">Continuity timeline</span>
            <ol>
              {timeline.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.label}</strong>
                  <span>{entry.detail}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="persistent-shell__continuity-summary">
            <span className="persistent-shell__eyebrow">Restore plan</span>
            <p>
              Return to <strong>{restorePlan.returnRouteFamilyRef}</strong> at{" "}
              <strong>{restorePlan.selectedAnchor}</strong>.
            </p>
            <p>
              Fold state <strong>{restorePlan.foldState}</strong>. Focus disposition{" "}
              <strong>{carryForwardPlan.focusDisposition.replaceAll("_", " ")}</strong>.
            </p>
          </div>
        </footer>
      ) : null}
    </main>
  );
}
