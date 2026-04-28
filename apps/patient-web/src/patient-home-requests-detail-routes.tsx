import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import { tryResolvePhase3PatientWorkspaceConversationBundle } from "@vecells/domain-kernel";
import {
  PATIENT_HOME_REQUESTS_DETAIL_TASK_ID,
  PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE,
  isPatientHomeRequestsDetailPath,
  makePatientRequestReturnBundle215,
  resolvePatientHomeRequestsDetailEntry,
  type PatientCaseworkRouteKey,
  type PatientHomeCompactPanel,
  type PatientHomeProjection,
  type PatientHomeRequestsDetailEntryProjection,
  type PatientRequestBucket,
  type PatientRequestDetailProjection,
  type PatientRequestDownstreamProjection,
  type PatientRequestReturnBundle,
  type PatientRequestSummaryProjection,
  type PatientRequestsIndexProjection,
} from "./patient-home-requests-detail-routes.model";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";
import { PatientRequestDownstreamWorkRail } from "./patient-appointment-family-workspace";

export { isPatientHomeRequestsDetailPath };

const RETURN_BUNDLE_STORAGE_KEY = "patient-home-requests-detail-215::return-bundle";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function readReturnBundle(): PatientRequestReturnBundle | null {
  const raw = safeWindow()?.sessionStorage.getItem(RETURN_BUNDLE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PatientRequestReturnBundle;
    return parsed.projectionName === "PatientRequestReturnBundle" ? parsed : null;
  } catch {
    return null;
  }
}

function writeReturnBundle(bundle: PatientRequestReturnBundle): void {
  safeWindow()?.sessionStorage.setItem(RETURN_BUNDLE_STORAGE_KEY, JSON.stringify(bundle));
}

function Icon({ name }: { name: "home" | "requests" | "placeholder" | "return" | "action" }) {
  return <span className={`patient-casework__icon patient-casework__icon--${name}`} aria-hidden />;
}

function requestRows(): HTMLElement[] {
  return Array.from(
    safeDocument()?.querySelectorAll<HTMLElement>("[data-request-row='true']") ?? [],
  );
}

function focusByTestId(testId: string): void {
  const target = safeDocument()?.querySelector<HTMLElement>(`[data-testid='${testId}']`);
  target?.focus({ preventScroll: true });
}

function usePatientCaseworkController() {
  const ownerWindow = safeWindow();
  const storedBundleRef = useRef<PatientRequestReturnBundle | null>(readReturnBundle());
  const [entry, setEntry] = useState<PatientHomeRequestsDetailEntryProjection>(() =>
    resolvePatientHomeRequestsDetailEntry({
      pathname: ownerWindow?.location.pathname ?? "/home",
      search: ownerWindow?.location.search,
      restoredBundle: storedBundleRef.current,
      restoredBy: storedBundleRef.current ? "refresh_replay" : "soft_navigation",
    }),
  );
  const [announcement, setAnnouncement] = useState("Patient casework route loaded.");
  const [selectedFilterRef, setSelectedFilterRef] = useState<PatientRequestBucket | "all">(
    storedBundleRef.current?.selectedFilterRef ?? "all",
  );
  const mainHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const activeBundle = entry.requestDetail?.returnBundle ?? entry.returnBundle;
    writeReturnBundle({ ...activeBundle, restoredBy: "refresh_replay" });
  }, [entry]);

  useEffect(() => {
    const onPopState = () => {
      const restoredBundle = readReturnBundle();
      startTransition(() => {
        const nextEntry = resolvePatientHomeRequestsDetailEntry({
          pathname: ownerWindow?.location.pathname ?? "/home",
          search: ownerWindow?.location.search,
          selectedFilterRef: restoredBundle?.selectedFilterRef ?? selectedFilterRef,
          restoredBundle,
          restoredBy: "browser_back",
        });
        setEntry(nextEntry);
        setSelectedFilterRef(nextEntry.returnBundle.selectedFilterRef);
        setAnnouncement(
          `${nextEntry.routeKey.replaceAll("_", " ")} restored for ${nextEntry.returnBundle.requestRef}.`,
        );
      });
    };
    ownerWindow?.addEventListener("popstate", onPopState);
    return () => ownerWindow?.removeEventListener("popstate", onPopState);
  }, [ownerWindow, selectedFilterRef]);

  useEffect(() => {
    if (entry.routeKey === "requests_index") {
      focusByTestId(entry.returnBundle.focusTestId);
      return;
    }
    mainHeadingRef.current?.focus({ preventScroll: true });
  }, [entry.pathname, entry.routeKey, entry.returnBundle.focusTestId]);

  function resolveForPath(
    pathname: string,
    bundle: PatientRequestReturnBundle | null,
    restoredBy: PatientRequestReturnBundle["restoredBy"],
    filterRef = selectedFilterRef,
  ): PatientHomeRequestsDetailEntryProjection {
    return resolvePatientHomeRequestsDetailEntry({
      pathname,
      search: ownerWindow?.location.search,
      selectedFilterRef: filterRef,
      restoredBundle: bundle,
      restoredBy,
    });
  }

  function navigate(pathname: string, bundle?: PatientRequestReturnBundle): void {
    if (pathname.startsWith("#")) {
      safeDocument()?.querySelector<HTMLElement>(pathname)?.focus({ preventScroll: false });
      setAnnouncement("Governed placeholder focused.");
      return;
    }
    if (!isPatientHomeRequestsDetailPath(pathname)) {
      ownerWindow?.location.assign(pathname);
      return;
    }
    const nextBundle = bundle ?? entry.returnBundle;
    writeReturnBundle(nextBundle);
    startTransition(() => {
      const nextEntry = resolveForPath(pathname, nextBundle, "soft_navigation");
      setEntry(nextEntry);
      setSelectedFilterRef(nextEntry.returnBundle.selectedFilterRef);
      ownerWindow?.history.pushState({}, "", pathname);
      setAnnouncement(
        `${nextEntry.routeKey.replaceAll("_", " ")} opened with ${nextEntry.returnBundle.requestRef}.`,
      );
    });
  }

  function openRequest(request: PatientRequestSummaryProjection): void {
    const bundle = makePatientRequestReturnBundle215(
      request.requestRef,
      selectedFilterRef === "all" ? request.bucket : selectedFilterRef,
      "soft_navigation",
    );
    navigate(`/requests/${request.requestRef}`, bundle);
  }

  function returnToRequests(): void {
    const bundle = entry.requestDetail?.returnBundle ?? entry.returnBundle;
    const restoredBundle = { ...bundle, restoredBy: "soft_navigation" as const };
    writeReturnBundle(restoredBundle);
    startTransition(() => {
      const nextEntry = resolveForPath("/requests", restoredBundle, "soft_navigation");
      setEntry(nextEntry);
      ownerWindow?.history.pushState({}, "", "/requests");
      setAnnouncement(`${bundle.requestRef} returned to the requests list.`);
    });
  }

  function updateFilter(filterRef: PatientRequestBucket | "all"): void {
    const nextBundle = makePatientRequestReturnBundle215(
      entry.returnBundle.requestRef,
      filterRef,
      "soft_navigation",
    );
    writeReturnBundle(nextBundle);
    startTransition(() => {
      const nextEntry = resolvePatientHomeRequestsDetailEntry({
        pathname: "/requests",
        selectedFilterRef: filterRef,
        restoredBundle: nextBundle,
      });
      setSelectedFilterRef(filterRef);
      setEntry(nextEntry);
      ownerWindow?.history.pushState({}, "", "/requests");
      setAnnouncement(`${filterRef.replaceAll("_", " ")} requests filter applied.`);
    });
  }

  function focusPlaceholder(child: PatientRequestDownstreamProjection): void {
    const target = safeDocument()?.querySelector<HTMLElement>(
      `[data-placeholder-ref='${child.downstreamProjectionRef}']`,
    );
    target?.focus({ preventScroll: false });
    setAnnouncement(`${child.label} placeholder focused.`);
  }

  return {
    entry,
    announcement,
    mainHeadingRef,
    selectedFilterRef,
    navigate,
    openRequest,
    returnToRequests,
    updateFilter,
    focusPlaceholder,
  };
}

export function PatientShellFrame({
  entry,
  announcement,
  mainHeadingRef,
  children,
  onNavigate,
}: {
  entry: PatientHomeRequestsDetailEntryProjection;
  announcement: string;
  mainHeadingRef: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
  onNavigate: (pathname: string) => void;
}) {
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: entry.pathname,
  });

  return (
    <div
      className="patient-casework"
      data-testid="Patient_Home_Requests_Detail_Route"
      data-task-id={PATIENT_HOME_REQUESTS_DETAIL_TASK_ID}
      data-visual-mode={PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE}
      data-route-key={entry.routeKey}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-cause-class={phase2Context.causeClass}
      data-recovery-class={phase2Context.recoveryClass}
      data-canonical-status-label={phase2Context.canonicalStatusLabel}
      data-supported-testids="home-spotlight-card quiet-home-panel home-compact-grid request-index-rail request-summary-row request-detail-hero request-lineage-strip case-pulse-panel decision-dock governed-placeholder-card"
      data-supported-testids-368="pharmacy-child-card request-row-pharmacy-chip"
    >
      <header className="patient-casework__top-band" data-testid="patient-shell-top-band">
        <a
          className="patient-casework__brand"
          href="/home"
          onClick={(event) => event.preventDefault()}
        >
          <span>
            <VecellLogoWordmark aria-hidden="true" className="patient-casework__brand-wordmark" />
            <small>{entry.home.maskedPatientRef}</small>
          </span>
        </a>
        <nav className="patient-casework__nav" aria-label="Patient casework">
          {entry.home.portalNavigation.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="patient-casework__nav-button"
              data-testid={`patient-shell-nav-${item.id}`}
              aria-current={item.ariaCurrent ? "page" : undefined}
              data-placeholder={String(item.placeholder)}
              onClick={() => onNavigate(item.path)}
            >
              <Icon
                name={
                  item.id === "home" ? "home" : item.id === "requests" ? "requests" : "placeholder"
                }
              />
              <span>{item.label}</span>
              {item.badgeLabel ? <em>{item.badgeLabel}</em> : null}
            </button>
          ))}
        </nav>
      </header>
      <PatientSupportPhase2Bridge context={phase2Context} />
      <main className="patient-casework__main" data-testid="patient-shell-main">
        <h1 ref={mainHeadingRef} className="patient-casework__route-title" tabIndex={-1}>
          {entry.routeKey === "request_detail"
            ? entry.requestDetail?.title
            : entry.routeKey === "requests_index"
              ? "Requests"
              : entry.home.spotlightDecision.headline}
        </h1>
        <div className="patient-casework__route" data-testid="patient-shell-route-region">
          {children}
        </div>
      </main>
      <div
        className="patient-casework__live-region"
        data-testid="patient-shell-live-region"
        aria-live="polite"
      >
        {announcement}
      </div>
    </div>
  );
}

export function HomeSpotlightCard({
  home,
  onNavigate,
}: {
  home: PatientHomeProjection;
  onNavigate: (pathname: string) => void;
}) {
  const decision = home.spotlightDecision;
  return (
    <section
      className="patient-casework__spotlight"
      data-testid="home-spotlight-card"
      data-projection-name={decision.projectionName}
      data-single-dominant-action={String(decision.singleDominantAction)}
      data-selected-candidate-ref={decision.selectedCandidateRef ?? "none"}
      aria-labelledby="home-spotlight-heading"
    >
      <div className="patient-casework__kicker">One thing to do</div>
      <h2 id="home-spotlight-heading">{decision.headline}</h2>
      <p>{decision.body}</p>
      <button
        type="button"
        className="patient-casework__primary-action"
        data-testid="home-spotlight-primary-action"
        onClick={() => onNavigate(decision.selectedActionRouteRef ?? "/requests")}
      >
        <Icon name="action" />
        <span>{decision.selectedActionLabel ?? "Review requests"}</span>
      </button>
      <dl className="patient-casework__projection-proof">
        <div>
          <dt>Source</dt>
          <dd>{decision.sourceProjectionRefs.join(", ")}</dd>
        </div>
        <div>
          <dt>Quiet decision</dt>
          <dd>{home.quietHomeDecision.reason.replaceAll("_", " ")}</dd>
        </div>
      </dl>
    </section>
  );
}

export function QuietHomePanel({
  home,
  onNavigate,
}: {
  home: PatientHomeProjection;
  onNavigate: (pathname: string) => void;
}) {
  return (
    <section
      className="patient-casework__quiet-home"
      data-testid="quiet-home-panel"
      data-projection-name={home.quietHomeDecision.projectionName}
      data-eligible={String(home.quietHomeDecision.eligible)}
      aria-labelledby="quiet-home-heading"
    >
      <div className="patient-casework__kicker">Quiet home</div>
      <h2 id="quiet-home-heading">{home.spotlightDecision.headline}</h2>
      <p>{home.quietHomeDecision.explanation}</p>
      <button
        type="button"
        className="patient-casework__secondary-action"
        data-testid="quiet-home-review-requests"
        onClick={() => onNavigate("/requests")}
      >
        <Icon name="requests" />
        <span>Review request summaries</span>
      </button>
    </section>
  );
}

function CompactHomePanel({
  panel,
  onNavigate,
}: {
  panel: PatientHomeCompactPanel;
  onNavigate: (path: string) => void;
}) {
  return (
    <article
      className={`patient-casework__home-panel patient-casework__home-panel--${panel.tone}`}
      data-testid={`home-compact-panel-${panel.kind}`}
      data-placeholder-state={panel.governedPlaceholder ? "future_child_surface" : "live"}
    >
      <div>
        <span className="patient-casework__panel-state">{panel.stateLabel}</span>
        <h3>{panel.label}</h3>
      </div>
      <p>{panel.summary}</p>
      <button
        type="button"
        onClick={() => onNavigate(panel.path)}
        aria-label={`${panel.label}: ${panel.stateLabel}`}
      >
        <Icon name={panel.governedPlaceholder ? "placeholder" : "requests"} />
        <span>{panel.governedPlaceholder ? "Hold place" : "Open"}</span>
      </button>
    </article>
  );
}

function HomeRoute({
  home,
  routeKey,
  onNavigate,
}: {
  home: PatientHomeProjection;
  routeKey: PatientCaseworkRouteKey;
  onNavigate: (pathname: string) => void;
}) {
  return (
    <div className="patient-casework__home" data-testid="patient-home-route">
      {routeKey === "quiet_home" ? (
        <QuietHomePanel home={home} onNavigate={onNavigate} />
      ) : (
        <HomeSpotlightCard home={home} onNavigate={onNavigate} />
      )}
      <section
        className="patient-casework__compact-grid"
        data-testid="home-compact-grid"
        aria-label="Home panels"
      >
        {home.compactPanels.map((panel) => (
          <CompactHomePanel key={panel.panelRef} panel={panel} onNavigate={onNavigate} />
        ))}
      </section>
    </div>
  );
}

export function RequestSummaryRow({
  request,
  selected,
  onOpen,
  onMoveFocus,
}: {
  request: PatientRequestSummaryProjection;
  selected: boolean;
  onOpen: (request: PatientRequestSummaryProjection) => void;
  onMoveFocus: (direction: 1 | -1) => void;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onMoveFocus(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      onMoveFocus(-1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(request);
    }
  }

  return (
    <button
      type="button"
      className={`patient-casework__request-row patient-casework__request-row--${request.statusTone}`}
      data-testid={`request-summary-row-${request.requestRef}`}
      data-request-row="true"
      data-request-ref={request.requestRef}
      data-selected={String(selected)}
      aria-pressed={selected}
      onClick={() => onOpen(request)}
      onKeyDown={onKeyDown}
    >
      <span className="patient-casework__row-main">
        <strong>{request.displayLabel}</strong>
        <span>{request.patientSummary}</span>
        {request.linkedPharmacyCaseId ? (
          <small
            className="patient-casework__row-pharmacy-chip"
            data-testid={`request-row-pharmacy-chip-${request.requestRef}`}
            data-pharmacy-case-id={request.linkedPharmacyCaseId}
          >
            {request.linkedPharmacyCaseId} · {request.linkedPharmacyStatusLabel}
          </small>
        ) : null}
      </span>
      <span className="patient-casework__row-meta">
        <em>{request.statusText}</em>
        {request.changedSinceSeenLabel ? (
          <small>{request.changedSinceSeenLabel}</small>
        ) : null}
        <small>{request.updatedLabel}</small>
      </span>
    </button>
  );
}

export function RequestIndexRail({
  index,
  selectedFilterRef,
  onFilter,
  onOpen,
}: {
  index: PatientRequestsIndexProjection;
  selectedFilterRef: PatientRequestBucket | "all";
  onFilter: (filter: PatientRequestBucket | "all") => void;
  onOpen: (request: PatientRequestSummaryProjection) => void;
}) {
  function moveFocus(direction: 1 | -1): void {
    const rows = requestRows();
    const activeIndex = rows.findIndex((row) => row === safeDocument()?.activeElement);
    const nextIndex = activeIndex < 0 ? 0 : (activeIndex + direction + rows.length) % rows.length;
    rows[nextIndex]?.focus({ preventScroll: true });
  }

  return (
    <aside
      className="patient-casework__request-rail"
      data-testid="request-index-rail"
      data-projection-name={index.projectionName}
      aria-labelledby="request-index-heading"
    >
      <div className="patient-casework__rail-header">
        <div>
          <div className="patient-casework__kicker">PatientRequestsIndexProjection</div>
          <h2 id="request-index-heading">Requests</h2>
        </div>
      </div>
      <div className="patient-casework__filter-bar" role="group" aria-label="Request filters">
        {(["all", "needs_attention", "in_progress", "complete"] as const).map((filter) => (
          <button
            type="button"
            key={filter}
            data-testid={`request-filter-${filter}`}
            data-active={String(selectedFilterRef === filter)}
            aria-pressed={selectedFilterRef === filter}
            onClick={() => onFilter(filter)}
          >
            {filter.replaceAll("_", " ")}
          </button>
        ))}
      </div>
      <div className="patient-casework__request-groups">
        {index.groups.map((group) => (
          <section
            key={group.bucket}
            data-testid={`request-bucket-${group.bucket}`}
            aria-labelledby={`request-bucket-${group.bucket}-heading`}
          >
            <div className="patient-casework__bucket-heading">
              <h3 id={`request-bucket-${group.bucket}-heading`}>{group.label}</h3>
              <span>{group.requests.length}</span>
            </div>
            <p>{group.description}</p>
            <div className="patient-casework__request-stack">
              {group.requests.map((request) => (
                <RequestSummaryRow
                  key={request.requestRef}
                  request={request}
                  selected={index.selectedAnchorRef === request.requestRef}
                  onOpen={onOpen}
                  onMoveFocus={moveFocus}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

function RequestsEmptyDetail({ index }: { index: PatientRequestsIndexProjection }) {
  return (
    <section
      className="patient-casework__empty-detail"
      data-testid="requests-empty-detail"
      aria-labelledby="requests-empty-detail-heading"
    >
      <div className="patient-casework__kicker">Same-shell continuity</div>
      <h2 id="requests-empty-detail-heading">
        {index.selectedAnchorRef ? "Selected request will open here" : "Select a request"}
      </h2>
      <p>
        The index carries a selected anchor, filter, and return bundle before a detail pane opens.
      </p>
      <dl className="patient-casework__projection-proof">
        <div>
          <dt>Filter</dt>
          <dd>{index.activeFilterSetRef.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Anchor</dt>
          <dd>{index.selectedAnchorRef ?? "none"}</dd>
        </div>
      </dl>
    </section>
  );
}

function RequestsRoute({
  index,
  selectedFilterRef,
  onFilter,
  onOpen,
}: {
  index: PatientRequestsIndexProjection;
  selectedFilterRef: PatientRequestBucket | "all";
  onFilter: (filter: PatientRequestBucket | "all") => void;
  onOpen: (request: PatientRequestSummaryProjection) => void;
}) {
  return (
    <div className="patient-casework__requests" data-testid="patient-requests-route">
      <RequestIndexRail
        index={index}
        selectedFilterRef={selectedFilterRef}
        onFilter={onFilter}
        onOpen={onOpen}
      />
      <RequestsEmptyDetail index={index} />
    </div>
  );
}

export function RequestLineageStrip({ detail }: { detail: PatientRequestDetailProjection }) {
  return (
    <section
      className="patient-casework__lineage"
      data-testid="request-lineage-strip"
      data-projection-name={detail.lineage.projectionName}
      aria-labelledby="request-lineage-heading"
    >
      <div>
        <div className="patient-casework__kicker">Lineage and freshness</div>
        <h2 id="request-lineage-heading">Same request context</h2>
      </div>
      <ol>
        <li>
          <strong>{detail.lineage.requestRef}</strong>
          <span>{detail.lineage.currentStageRef}</span>
        </li>
        <li>
          <strong>{detail.returnBundle.selectedAnchorTupleHash}</strong>
          <span>Selected anchor tuple</span>
        </li>
        <li>
          <strong>{detail.casePulse.freshnessLabel}</strong>
          <span>{detail.statusRibbon.canonicalTruthRef}</span>
        </li>
      </ol>
    </section>
  );
}

export function RequestDetailHero({
  detail,
  onReturn,
  onOpenConversation,
}: {
  detail: PatientRequestDetailProjection;
  onReturn: () => void;
  onOpenConversation?: (() => void) | null;
}) {
  return (
    <section
      className="patient-casework__detail-hero"
      data-testid="request-detail-hero"
      data-projection-name={detail.projectionName}
      data-request-ref={detail.requestRef}
      aria-labelledby="request-detail-heading"
    >
      <button type="button" className="patient-casework__back-button" onClick={onReturn}>
        <Icon name="return" />
        <span>Requests</span>
      </button>
      <div
        className={`patient-casework__status patient-casework__status--${detail.statusRibbon.tone}`}
        role="status"
      >
        <span>{detail.statusRibbon.label}</span>
        <small>{detail.statusRibbon.freshnessLabel}</small>
      </div>
      <h2 id="request-detail-heading">{detail.title}</h2>
      <p>{detail.patientSafeDetail}</p>
      {onOpenConversation ? (
        <div className="patient-casework__detail-hero-actions">
          <button
            type="button"
            className="patient-casework__secondary-action"
            data-testid="request-detail-open-conversation"
            onClick={onOpenConversation}
          >
            Open conversation
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function CasePulsePanel({ detail }: { detail: PatientRequestDetailProjection }) {
  return (
    <aside
      className="patient-casework__pulse"
      data-testid="case-pulse-panel"
      data-projection-name={detail.casePulse.projectionName}
      aria-labelledby="case-pulse-heading"
    >
      <div className="patient-casework__kicker">Case pulse</div>
      <h2 id="case-pulse-heading">Current trust</h2>
      <dl>
        <div>
          <dt>Freshness</dt>
          <dd>{detail.casePulse.freshnessLabel}</dd>
        </div>
        <div>
          <dt>Trust</dt>
          <dd>{detail.casePulse.trustLabel}</dd>
        </div>
        <div>
          <dt>Receipt</dt>
          <dd>{detail.casePulse.receiptLabel}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function DecisionDock({
  detail,
  onFocusPlaceholder,
}: {
  detail: PatientRequestDetailProjection;
  onFocusPlaceholder: (child: PatientRequestDownstreamProjection) => void;
}) {
  const primaryChild = detail.downstream.find(
    (child) => child.nextSafeActionRef === detail.summary.nextSafeActionRef,
  );
  return (
    <aside
      className="patient-casework__decision-dock"
      data-testid="decision-dock"
      data-projection-name={detail.nextAction.projectionName}
      aria-labelledby="decision-dock-heading"
    >
      <div className="patient-casework__kicker">Decision dock</div>
      <h2 id="decision-dock-heading">Next safe action</h2>
      <p>{detail.nextAction.actionLabel}</p>
      <button
        type="button"
        className="patient-casework__primary-action"
        data-testid="request-detail-primary-action"
        data-actionability={detail.nextAction.actionability}
        onClick={() => (primaryChild ? onFocusPlaceholder(primaryChild) : undefined)}
      >
        <Icon name="action" />
        <span>{detail.nextAction.actionLabel}</span>
      </button>
      <dl className="patient-casework__projection-proof">
        <div>
          <dt>Routing</dt>
          <dd>{detail.actionRouting.routeTargetRef}</dd>
        </div>
        <div>
          <dt>Return</dt>
          <dd>{detail.returnBundle.returnRouteRef}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function GovernedPlaceholderCard({
  child,
  onNavigate,
}: {
  child: PatientRequestDownstreamProjection;
  onNavigate?: ((pathname: string) => void) | null;
}) {
  const actionable = child.placeholderPosture === "none" && Boolean(onNavigate);
  return (
    <article
      className="patient-casework__placeholder-card"
      data-testid={`governed-placeholder-card-${child.childType}`}
      data-placeholder-ref={child.downstreamProjectionRef}
      data-placeholder-posture={child.placeholderPosture}
      tabIndex={-1}
      aria-labelledby={`${child.childRef}-title`}
    >
      <div className="patient-casework__placeholder-icon" aria-hidden>
        <Icon name="placeholder" />
      </div>
      <div>
        <span className="patient-casework__panel-state">
          {child.authoritativeState.replaceAll("_", " ")}
        </span>
        <h3 id={`${child.childRef}-title`}>{child.label}</h3>
        <p>{child.summary}</p>
        <small>{child.placeholderReasonRefs.join(" | ")}</small>
        {actionable ? (
          <div className="patient-casework__detail-hero-actions">
            <button
              type="button"
              className="patient-casework__secondary-action"
              data-testid={`governed-placeholder-open-${child.childType}`}
              onClick={() => onNavigate?.(child.routeRef)}
            >
              Open entry
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PharmacyContinuationCard({
  child,
  onNavigate,
}: {
  child: PatientRequestDownstreamProjection;
  onNavigate: (pathname: string) => void;
}) {
  const pharmacyChild = child.pharmacyChild;
  if (!pharmacyChild) {
    return null;
  }
  return (
    <article
      className="patient-casework__placeholder-card patient-casework__placeholder-card--pharmacy"
      data-testid={`pharmacy-child-card-${pharmacyChild.pharmacyCaseId}`}
      data-placeholder-ref={child.downstreamProjectionRef}
      data-pharmacy-case-id={pharmacyChild.pharmacyCaseId}
      data-merge-state={pharmacyChild.mergeState}
      tabIndex={-1}
      aria-labelledby={`${child.childRef}-title`}
    >
      <div className="patient-casework__placeholder-icon" aria-hidden>
        <Icon name="action" />
      </div>
      <div>
        <span className="patient-casework__panel-state">{child.authoritativeState}</span>
        <h3 id={`${child.childRef}-title`}>{child.label}</h3>
        <p>{child.summary}</p>
        <dl className="patient-casework__pharmacy-meta">
          <div>
            <dt>Case</dt>
            <dd>{pharmacyChild.pharmacyCaseId}</dd>
          </div>
          <div>
            <dt>Lineage</dt>
            <dd>{pharmacyChild.requestLineageLabel}</dd>
          </div>
          <div>
            <dt>Changed</dt>
            <dd>{pharmacyChild.changedSinceSeenLabel}</dd>
          </div>
          <div>
            <dt>Notification</dt>
            <dd>{pharmacyChild.notificationStateLabel}</dd>
          </div>
          <div>
            <dt>Support</dt>
            <dd>{pharmacyChild.supportReplaySummary}</dd>
          </div>
          <div>
            <dt>Audit</dt>
            <dd>{pharmacyChild.auditSummary}</dd>
          </div>
        </dl>
        <div className="patient-casework__detail-hero-actions">
          <button
            type="button"
            className="patient-casework__secondary-action"
            data-testid={`pharmacy-child-open-${pharmacyChild.pharmacyCaseId}`}
            onClick={() => onNavigate(child.routeRef)}
          >
            Open pharmacy route
          </button>
        </div>
      </div>
    </article>
  );
}

function TrustSummary({ detail }: { detail: PatientRequestDetailProjection }) {
  return (
    <section
      className="patient-casework__trust"
      data-testid="request-trust-summary"
      aria-labelledby="request-trust-heading"
    >
      <div className="patient-casework__kicker">Receipts and trust</div>
      <h2 id="request-trust-heading">What this route proves</h2>
      <ul>
        {detail.trustSummaries.map((summary) => (
          <li key={summary}>{summary}</li>
        ))}
      </ul>
    </section>
  );
}

function DetailRoute({
  detail,
  onReturn,
  onFocusPlaceholder,
  onOpenConversation,
  onNavigate,
}: {
  detail: PatientRequestDetailProjection;
  onReturn: () => void;
  onFocusPlaceholder: (child: PatientRequestDownstreamProjection) => void;
  onOpenConversation?: (() => void) | null;
  onNavigate: (pathname: string) => void;
}) {
  const visibleChildren = detail.downstream.filter((child) => child.childType !== "booking");

  return (
    <div className="patient-casework__detail" data-testid="patient-request-detail-route">
      <div className="patient-casework__detail-main">
        <RequestLineageStrip detail={detail} />
        <RequestDetailHero
          detail={detail}
          onReturn={onReturn}
          onOpenConversation={onOpenConversation}
        />
        <PatientRequestDownstreamWorkRail requestRef={detail.requestRef} onNavigate={onNavigate} />
        <section
          className="patient-casework__placeholder-grid"
          aria-label="Governed child surfaces"
        >
          {visibleChildren.map((child) =>
            child.childType === "pharmacy" ? (
              <PharmacyContinuationCard
                key={child.downstreamProjectionRef}
                child={child}
                onNavigate={onNavigate}
              />
            ) : (
              <GovernedPlaceholderCard
                key={child.downstreamProjectionRef}
                child={child}
                onNavigate={onNavigate}
              />
            ),
          )}
        </section>
        <TrustSummary detail={detail} />
      </div>
      <aside className="patient-casework__detail-side" aria-label="Request decision and pulse">
        <DecisionDock detail={detail} onFocusPlaceholder={onFocusPlaceholder} />
        <CasePulsePanel detail={detail} />
      </aside>
    </div>
  );
}

export default function PatientHomeRequestsDetailRoutesApp() {
  const {
    entry,
    announcement,
    mainHeadingRef,
    selectedFilterRef,
    navigate,
    openRequest,
    returnToRequests,
    updateFilter,
    focusPlaceholder,
  } = usePatientCaseworkController();

  return (
    <PatientShellFrame
      entry={entry}
      announcement={announcement}
      mainHeadingRef={mainHeadingRef}
      onNavigate={navigate}
    >
      {entry.routeKey === "home" || entry.routeKey === "quiet_home" ? (
        <HomeRoute home={entry.home} routeKey={entry.routeKey} onNavigate={navigate} />
      ) : entry.routeKey === "requests_index" ? (
        <RequestsRoute
          index={entry.requestsIndex}
          selectedFilterRef={selectedFilterRef}
          onFilter={updateFilter}
          onOpen={openRequest}
        />
      ) : entry.requestDetail ? (
        <DetailRoute
          detail={entry.requestDetail}
          onReturn={returnToRequests}
          onFocusPlaceholder={focusPlaceholder}
          onNavigate={navigate}
          onOpenConversation={(() => {
            const bundle = tryResolvePhase3PatientWorkspaceConversationBundle({
              requestRef: entry.requestDetail.requestRef,
              routeKey: "conversation_overview",
            });
            if (!bundle) {
              return null;
            }
            return () =>
              typeof window !== "undefined"
                ? window.location.assign(bundle.routeRefs.overview)
                : undefined;
          })()}
        />
      ) : (
        <RequestsRoute
          index={entry.requestsIndex}
          selectedFilterRef={selectedFilterRef}
          onFilter={updateFilter}
          onOpen={openRequest}
        />
      )}
    </PatientShellFrame>
  );
}
