import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import {
  AUTHENTICATED_HOME_STATUS_TRACKER_TASK_ID,
  isAuthenticatedHomeStatusTrackerPath,
  makePatientRequestReturnBundle,
  resolveAuthenticatedPortalEntry,
  type PatientAudienceCoverageProjection,
  type PatientHomeProjection,
  type PatientPortalEntryProjection,
  type PatientRequestDetailProjection,
  type PatientRequestReturnBundle,
  type PatientRequestSummaryProjection,
  type PatientRequestsIndexProjection,
} from "./authenticated-home-status-tracker.model";

const RETURN_BUNDLE_STORAGE_KEY = "authenticated-portal-196::return-bundle";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function readReturnBundle(): PatientRequestReturnBundle | null {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return null;
  }
  const raw = ownerWindow.sessionStorage.getItem(RETURN_BUNDLE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PatientRequestReturnBundle;
    if (parsed.projectionName === "PatientRequestReturnBundle") {
      return { ...parsed, restoredBy: "refresh_replay" };
    }
  } catch {
    return null;
  }
  return null;
}

function writeReturnBundle(bundle: PatientRequestReturnBundle): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return;
  }
  ownerWindow.sessionStorage.setItem(RETURN_BUNDLE_STORAGE_KEY, JSON.stringify(bundle));
}

function usePortalController() {
  const initialPathname = safeWindow()?.location.pathname ?? "/portal/home";
  const storedBundleRef = useRef<PatientRequestReturnBundle | null>(readReturnBundle());
  const [entry, setEntry] = useState<PatientPortalEntryProjection>(() =>
    resolveAuthenticatedPortalEntry(
      initialPathname,
      storedBundleRef.current ? "refresh_replay" : "soft_navigation",
    ),
  );
  const [restoredBundle, setRestoredBundle] = useState<PatientRequestReturnBundle | null>(
    storedBundleRef.current,
  );

  const resolvePath = useEffectEvent(
    (pathname: string, restoredBy: PatientRequestReturnBundle["restoredBy"]) => {
      const nextEntry = resolveAuthenticatedPortalEntry(pathname, restoredBy);
      setEntry(nextEntry);
      setRestoredBundle(restoredBy === "browser_back" ? readReturnBundle() : restoredBundle);
    },
  );

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const onPopState = () => {
      startTransition(() => resolvePath(ownerWindow.location.pathname, "browser_back"));
    };
    ownerWindow.addEventListener("popstate", onPopState);
    return () => ownerWindow.removeEventListener("popstate", onPopState);
  }, [resolvePath]);

  useEffect(() => {
    const targetTestId = restoredBundle?.focusTestId ?? entry.returnBundle.focusTestId;
    const target = document.querySelector<HTMLElement>(`[data-testid='${targetTestId}']`);
    if (target && entry.routeKey === "requests_index") {
      target.focus({ preventScroll: true });
    }
  }, [entry.routeKey, entry.returnBundle.focusTestId, restoredBundle?.focusTestId]);

  function navigate(pathname: string, bundle?: PatientRequestReturnBundle): void {
    const ownerWindow = safeWindow();
    const nextBundle = bundle ?? restoredBundle;
    if (nextBundle) {
      writeReturnBundle(nextBundle);
      setRestoredBundle(nextBundle);
    }
    startTransition(() => {
      const nextEntry = resolveAuthenticatedPortalEntry(pathname, "soft_navigation");
      setEntry(nextEntry);
      ownerWindow?.history.pushState({}, "", pathname);
    });
  }

  function openRequest(request: PatientRequestSummaryProjection): void {
    const bundle = makePatientRequestReturnBundle(
      request.requestId,
      request.group,
      "soft_navigation",
    );
    writeReturnBundle(bundle);
    setRestoredBundle(bundle);
    navigate(`/portal/requests/${request.requestId}`, bundle);
  }

  function returnToRequests(): void {
    const bundle = entry.requestDetail?.returnBundle ?? restoredBundle ?? entry.returnBundle;
    writeReturnBundle({ ...bundle, restoredBy: "soft_navigation" });
    navigate(bundle.originPathname, { ...bundle, restoredBy: "soft_navigation" });
  }

  return { entry, restoredBundle, navigate, openRequest, returnToRequests };
}

function StatusRibbon({
  label,
  tone,
  freshnessLabel,
}: {
  label: string;
  tone: PatientRequestSummaryProjection["statusTone"];
  freshnessLabel: string;
}) {
  return (
    <div
      className={`authenticated-portal__status-ribbon authenticated-portal__status-ribbon--${tone}`}
      data-testid="status-ribbon"
      role="status"
    >
      <strong>{label}</strong>
      <span>{freshnessLabel}</span>
    </div>
  );
}

function AudienceCoverageBadge({ coverage }: { coverage: PatientAudienceCoverageProjection }) {
  return (
    <span
      className="authenticated-portal__coverage-badge"
      data-testid="audience-coverage-badge"
      data-max-visible-detail={coverage.maxVisibleDetail}
    >
      {coverage.disclosurePosture.replaceAll("_", " ")}
    </span>
  );
}

function SessionExpiryBanner({
  sessionExpiry,
  onNavigate,
}: {
  sessionExpiry: PatientHomeProjection["sessionExpiry"];
  onNavigate: (pathname: string) => void;
}) {
  if (sessionExpiry.state === "stable") {
    return null;
  }
  return (
    <aside
      className={`authenticated-portal__session-banner authenticated-portal__session-banner--${sessionExpiry.state}`}
      data-testid="session-expiry-banner"
      role={sessionExpiry.state === "expired" ? "alert" : "status"}
    >
      <div>
        <strong>{sessionExpiry.warningLabel}</strong>
        <span>{sessionExpiry.recoveryLabel}</span>
      </div>
      <button
        type="button"
        data-testid="session-expiry-recovery-action"
        onClick={() =>
          onNavigate(sessionExpiry.state === "expired" ? "/portal/home" : "/portal/session-expired")
        }
      >
        {sessionExpiry.state === "expired" ? "Resume after sign in" : "Use bounded recovery"}
      </button>
    </aside>
  );
}

function RequestSpotlightPanel({
  home,
  onNavigate,
}: {
  home: PatientHomeProjection;
  onNavigate: (pathname: string) => void;
}) {
  const decision = home.spotlightDecision;
  return (
    <section
      className="authenticated-portal__spotlight"
      data-testid="request-spotlight-panel"
      data-reason={decision.reason}
      aria-labelledby="patient-home-spotlight-title"
    >
      <div className="authenticated-portal__eyebrow">One priority</div>
      <h1 id="patient-home-spotlight-title" data-testid="patient-home-spotlight">
        {decision.headline}
      </h1>
      <p>{decision.body}</p>
      <div className="authenticated-portal__spotlight-actions">
        <button
          type="button"
          data-testid="spotlight-primary-action"
          onClick={() => onNavigate(decision.primaryActionPath)}
        >
          {decision.primaryActionLabel}
        </button>
        <span data-testid="single-dominant-action-proof">
          single dominant action from {decision.sourceProjectionRefs[0]}
        </span>
      </div>
    </section>
  );
}

function QuietHomePanel({
  home,
  onNavigate,
}: {
  home: PatientHomeProjection;
  onNavigate: (pathname: string) => void;
}) {
  return (
    <section
      className="authenticated-portal__quiet-panel"
      data-testid="quiet-home-panel"
      aria-labelledby="quiet-home-title"
    >
      <div className="authenticated-portal__eyebrow">Quiet home</div>
      <h1 id="quiet-home-title">{home.spotlightDecision.headline}</h1>
      <p>{home.spotlightDecision.body}</p>
      <ul aria-label="Quiet-home decision inputs">
        <li>No request outranks the quiet threshold.</li>
        <li>No callback, repair, or account hold blocks the current path.</li>
        <li>Completed rows stay readable but are not promoted as work.</li>
      </ul>
      <button
        type="button"
        data-testid="quiet-home-primary-action"
        onClick={() => onNavigate("/portal/requests")}
      >
        {home.spotlightDecision.primaryActionLabel}
      </button>
    </section>
  );
}

function CompactRequestCard({
  card,
  onNavigate,
}: {
  card: PatientHomeProjection["compactCards"][number];
  onNavigate: (pathname: string) => void;
}) {
  return (
    <article
      className={`authenticated-portal__compact-card authenticated-portal__compact-card--${card.tone}`}
      data-testid={`compact-request-card-${card.id}`}
    >
      <div className="authenticated-portal__compact-card-header">
        <strong>{card.label}</strong>
        <span>{card.tone}</span>
      </div>
      <p>{card.body}</p>
      <button type="button" onClick={() => onNavigate(card.path)}>
        Review
      </button>
    </article>
  );
}

function RequestTrackerRow({
  request,
  selected,
  onOpen,
}: {
  request: PatientRequestSummaryProjection;
  selected: boolean;
  onOpen: (request: PatientRequestSummaryProjection) => void;
}) {
  return (
    <article
      className="authenticated-portal__tracker-row"
      data-testid={`request-tracker-row-${request.requestId}`}
      data-selected={String(selected)}
      data-audience-max-detail={request.audienceCoverage.maxVisibleDetail}
      id={request.anchorId}
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(request);
        }
      }}
    >
      <div className="authenticated-portal__tracker-main">
        <StatusRibbon
          label={request.statusLabel}
          tone={request.statusTone}
          freshnessLabel={request.updatedLabel}
        />
        <h3>{request.title}</h3>
        <p>{request.patientSummary}</p>
      </div>
      <div className="authenticated-portal__tracker-aside">
        <AudienceCoverageBadge coverage={request.audienceCoverage} />
        <button
          type="button"
          onClick={() => onOpen(request)}
          data-testid={`open-request-${request.requestId}`}
        >
          {request.nextActionLabel}
        </button>
      </div>
    </article>
  );
}

function RequestsIndex({
  index,
  restoredBundle,
  onOpenRequest,
}: {
  index: PatientRequestsIndexProjection;
  restoredBundle: PatientRequestReturnBundle | null;
  onOpenRequest: (request: PatientRequestSummaryProjection) => void;
}) {
  const selectedAnchor = restoredBundle?.selectedAnchorId ?? index.selectedAnchorId;
  return (
    <section
      className="authenticated-portal__requests-index"
      data-testid="authenticated-requests-index"
      data-selected-anchor={selectedAnchor}
      aria-labelledby="requests-index-title"
    >
      <div className="authenticated-portal__section-heading">
        <span className="authenticated-portal__eyebrow">Status tracker</span>
        <h1 id="requests-index-title">Your requests</h1>
        <p>Rows are grouped by canonical request truth, not local route state.</p>
      </div>
      {index.groups.map((group) => (
        <section
          key={group.group}
          className="authenticated-portal__request-group"
          data-testid={`request-group-${group.group}`}
          aria-labelledby={`request-group-${group.group}-title`}
        >
          <div className="authenticated-portal__request-group-heading">
            <h2 id={`request-group-${group.group}-title`}>{group.label}</h2>
            <p>{group.description}</p>
          </div>
          <div className="authenticated-portal__tracker-stack">
            {group.requests.map((request) => (
              <RequestTrackerRow
                key={request.requestId}
                request={request}
                selected={request.anchorId === selectedAnchor}
                onOpen={onOpenRequest}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function RequestDetail({
  detail,
  onReturn,
}: {
  detail: PatientRequestDetailProjection;
  onReturn: () => void;
}) {
  return (
    <section
      className="authenticated-portal__detail"
      data-testid="authenticated-request-detail"
      data-request-id={detail.requestId}
      data-coverage={detail.audienceCoverage.maxVisibleDetail}
      aria-labelledby="request-detail-title"
    >
      <button
        type="button"
        className="authenticated-portal__back-button"
        onClick={onReturn}
        data-testid="return-to-request-tracker"
      >
        Back to requests
      </button>
      <div className="authenticated-portal__detail-hero">
        <div>
          <span className="authenticated-portal__eyebrow">{detail.identityStrip.label}</span>
          <h1 id="request-detail-title">{detail.title}</h1>
          <p>
            {detail.identityStrip.maskedPatientRef} - {detail.identityStrip.posture}
          </p>
        </div>
        <StatusRibbon
          label={detail.statusRibbon.label}
          tone={detail.statusRibbon.tone}
          freshnessLabel={detail.statusRibbon.freshnessLabel}
        />
      </div>
      <div className="authenticated-portal__detail-grid">
        <section
          className="authenticated-portal__detail-card"
          data-testid="casepulse-identity-strip"
        >
          <h2>CasePulse identity strip</h2>
          <p>{detail.identityHold.patientSafeReason}</p>
          <AudienceCoverageBadge coverage={detail.audienceCoverage} />
        </section>
        <section className="authenticated-portal__detail-card" data-testid="statebraid-timeline">
          <h2>StateBraid timeline</h2>
          <ol>
            {detail.stateBraid.map((event) => (
              <li key={`${event.label}-${event.timestampLabel}`}>
                <strong>{event.label}</strong>
                <span>{event.state}</span>
                <small>{event.timestampLabel}</small>
              </li>
            ))}
          </ol>
        </section>
        <section className="authenticated-portal__detail-card" data-testid="decision-dock">
          <h2>DecisionDock</h2>
          <div className="authenticated-portal__decision-actions">
            {detail.decisionDock.map((action) => (
              <button key={action.label} type="button" data-actionability={action.actionability}>
                {action.label}
              </button>
            ))}
          </div>
        </section>
        <section className="authenticated-portal__detail-card" data-testid="ambient-state-ribbon">
          <h2>AmbientStateRibbon</h2>
          <p>{detail.ambientStateRibbon}</p>
          <p>{detail.patientSafeDetail}</p>
        </section>
      </div>
    </section>
  );
}

function PortalShell({
  entry,
  restoredBundle,
  onNavigate,
  onOpenRequest,
  onReturn,
}: {
  entry: PatientPortalEntryProjection;
  restoredBundle: PatientRequestReturnBundle | null;
  onNavigate: (pathname: string) => void;
  onOpenRequest: (request: PatientRequestSummaryProjection) => void;
  onReturn: () => void;
}) {
  const home = entry.home;
  let mainContent: ReactNode;

  if (entry.requestDetail) {
    mainContent = <RequestDetail detail={entry.requestDetail} onReturn={onReturn} />;
  } else if (entry.routeKey === "requests_index") {
    mainContent = (
      <RequestsIndex
        index={entry.requestsIndex}
        restoredBundle={restoredBundle}
        onOpenRequest={onOpenRequest}
      />
    );
  } else {
    mainContent = (
      <div className="authenticated-portal__home-grid" data-testid="authenticated-patient-home">
        {home.homeMode === "quiet" ? (
          <QuietHomePanel home={home} onNavigate={onNavigate} />
        ) : (
          <RequestSpotlightPanel home={home} onNavigate={onNavigate} />
        )}
        <div className="authenticated-portal__compact-stack">
          {home.compactCards.map((card) => (
            <CompactRequestCard key={card.id} card={card} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="authenticated-portal__home-tracker">
          <RequestsIndex
            index={entry.requestsIndex}
            restoredBundle={restoredBundle}
            onOpenRequest={onOpenRequest}
          />
        </div>
        <section
          className="authenticated-portal__quiet-disclosure"
          data-testid="quiet-disclosure-panel"
        >
          <h2>Why the home is quiet when nothing outranks attention</h2>
          <p>
            Contact preferences, account details, and closed request summaries stay secondary unless
            they block the current path.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div
      className="authenticated-portal"
      data-testid="Authenticated_Patient_Home_Status_Tracker_Route"
      data-task-id={AUTHENTICATED_HOME_STATUS_TRACKER_TASK_ID}
      data-route-key={entry.routeKey}
      data-visual-mode={entry.visualMode}
    >
      <header className="authenticated-portal__top-band" data-testid="portal-top-band">
        <div>
          <VecellLogoWordmark aria-hidden="true" className="authenticated-portal__wordmark" />
          <span>
            {home.patientLabel} - {home.maskedPatientRef}
          </span>
        </div>
        <AudienceCoverageBadge coverage={home.audienceCoverage} />
      </header>
      <div className="authenticated-portal__layout">
        <nav
          className="authenticated-portal__nav"
          data-testid="portal-left-nav"
          aria-label="Patient portal"
        >
          {home.navigation.items.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`portal-nav-${item.id}`}
              aria-current={item.ariaCurrent ? "page" : undefined}
              onClick={() => onNavigate(item.path)}
            >
              <span>{item.label}</span>
              {item.badgeLabel ? <span>{item.badgeLabel}</span> : null}
            </button>
          ))}
        </nav>
        <main className="authenticated-portal__main" data-testid="portal-main" tabIndex={-1}>
          <SessionExpiryBanner sessionExpiry={home.sessionExpiry} onNavigate={onNavigate} />
          {home.identityHold.blocksCurrentAction ? (
            <aside
              className="authenticated-portal__blocker"
              data-testid="reachability-blocker-promoted"
              role="alert"
            >
              <strong>{home.identityHold.allowedRecoveryAction}</strong>
              <span>{home.identityHold.patientSafeReason}</span>
            </aside>
          ) : null}
          {mainContent}
        </main>
      </div>
      <div
        className="authenticated-portal__live-region"
        data-testid="portal-live-region"
        role="status"
        aria-live="polite"
      >
        {entry.returnBundle.selectedRequestId} anchor preserved through{" "}
        {entry.returnBundle.restoredBy}.
      </div>
    </div>
  );
}

export { isAuthenticatedHomeStatusTrackerPath };

export default function AuthenticatedHomeStatusTrackerApp() {
  const { entry, restoredBundle, navigate, openRequest, returnToRequests } = usePortalController();
  return (
    <PortalShell
      entry={entry}
      restoredBundle={restoredBundle}
      onNavigate={navigate}
      onOpenRequest={openRequest}
      onReturn={returnToRequests}
    />
  );
}
