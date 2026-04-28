import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArtifactSurfaceFrame,
  CasePulse,
  SharedStatusStrip,
  VecellLogoLockup,
} from "@vecells/design-system";
import {
  navigateWithinShell,
  resolvePersistentShellProfile,
  resolveInitialContinuitySnapshot,
  restoreSnapshotFromRefresh,
  selectAnchorInSnapshot,
  writePersistedContinuitySnapshot,
  type BreakpointClass,
  type ContinuitySnapshot,
} from "@vecells/persistent-shell";
import { SurfaceStateFrame } from "@vecells/surface-postures";
import {
  InMemoryTelemetrySink,
  controlPlaneField,
  createStructuredTelemetryLogger,
  maskedRouteField,
  mintEdgeCorrelation,
  phiReferenceField,
  publicDescriptor,
  type StructuredTelemetryLogger,
  type TelemetryEnvelope,
} from "@vecells/observability";
import {
  PATIENT_SHELL_TASK_ID,
  PATIENT_SHELL_VISUAL_MODE,
  defaultPatientShellViewMemory,
  formatPatientShellPath,
  isMutationAllowed,
  navPathForSection,
  parsePatientShellLocation,
  patientIdentitySummary,
  patientRecords,
  patientRequests,
  patientShellGalleryRequirements,
  patientShellProjectionExamples,
  patientThreads,
  resolveHomeSpotlightRequest,
  resolvePatientShellView,
  resolveQuietHomeNextRecord,
  resolveSelectedRecordForLocation,
  resolveSelectedRequestForLocation,
  resolveSelectedThreadForLocation,
  runtimeScenarioForLocation,
  selectedAnchorKeyForLocation,
  type PatientHomeMode,
  type PatientPrimarySection,
  type PatientRecordProjection,
  type PatientShellLocation,
  type PatientShellRouteView,
  type PatientShellViewMemory,
} from "./patient-shell-seed.model";
import { PatientAppointmentFamilyWorkspace } from "./patient-appointment-family-workspace";

const VIEW_MEMORY_STORAGE_KEY = "patient-shell-seed::view-memory";
const TELEMETRY_LIMIT = 10;

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function readPatientViewMemory(): PatientShellViewMemory {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return defaultPatientShellViewMemory();
  }
  const payload = ownerWindow.localStorage.getItem(VIEW_MEMORY_STORAGE_KEY);
  if (!payload) {
    return defaultPatientShellViewMemory();
  }
  try {
    return {
      ...defaultPatientShellViewMemory(),
      ...(JSON.parse(payload) as Partial<PatientShellViewMemory>),
    };
  } catch {
    return defaultPatientShellViewMemory();
  }
}

function writePatientViewMemory(memory: PatientShellViewMemory): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return;
  }
  ownerWindow.localStorage.setItem(VIEW_MEMORY_STORAGE_KEY, JSON.stringify(memory));
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

function initialLocation(pathname?: string): PatientShellLocation {
  return parsePatientShellLocation(pathname ?? safeWindow()?.location.pathname ?? "/home");
}

function synchronizeSnapshot(
  current: ContinuitySnapshot,
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): ContinuitySnapshot {
  const runtimeScenario = runtimeScenarioForLocation(location, memory);
  const anchorKey = selectedAnchorKeyForLocation(location, memory.homeMode);
  let nextSnapshot = current;

  if (nextSnapshot.activeRouteFamilyRef !== location.routeFamilyRef) {
    nextSnapshot = navigateWithinShell(nextSnapshot, location.routeFamilyRef, {
      runtimeScenario,
      timestamp: "2026-04-13T08:24:00Z",
    }).snapshot;
  }

  if (nextSnapshot.selectedAnchor.anchorKey !== anchorKey) {
    nextSnapshot = selectAnchorInSnapshot(
      nextSnapshot,
      anchorKey,
      "2026-04-13T08:25:00Z",
    );
  }

  return restoreSnapshotFromRefresh(nextSnapshot, {
    availableAnchorKeys: [anchorKey],
    runtimeScenario,
    timestamp: "2026-04-13T08:26:00Z",
  });
}

function createInitialSnapshot(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): ContinuitySnapshot {
  return synchronizeSnapshot(
    resolveInitialContinuitySnapshot("patient-web", location.routeFamilyRef),
    location,
    memory,
  );
}

function focusTargetForView(
  location: PatientShellLocation,
  memory: PatientShellViewMemory,
): string {
  switch (location.routeKey) {
    case "request_detail":
      return `request-row-${location.requestId ?? memory.selectedRequestId}`;
    case "record_follow_up":
      return `record-card-${location.recordId ?? memory.selectedRecordId}`;
    case "message_thread":
      return `thread-row-${location.threadId ?? memory.selectedThreadId}`;
    case "recovery":
      return "recovery-heading";
    case "embedded":
      return "embedded-heading";
    default:
      return "section-heading";
  }
}

function buttonTone(state: string): "neutral" | "review" | "danger" | "success" {
  switch (state) {
    case "reply_needed":
    case "confirmation_pending":
    case "awaiting_review":
      return "review";
    case "blocked_repair":
    case "blocked_contact":
    case "fallback_recovery":
      return "danger";
    case "closed":
    case "manage_eligible":
      return "success";
    default:
      return "neutral";
  }
}

function humanizeState(value: string): string {
  return value.replaceAll("_", " ");
}

interface PatientShellSeedAppProps {
  initialPathname?: string;
  initialMemory?: Partial<PatientShellViewMemory>;
}

function usePatientShellController(props: PatientShellSeedAppProps = {}) {
  const initialLocationRef = useRef<PatientShellLocation>(initialLocation(props.initialPathname));
  const initialMemoryRef = useRef<PatientShellViewMemory>({
    ...readPatientViewMemory(),
    ...(props.initialMemory ?? {}),
  });

  const [location, setLocation] = useState(initialLocationRef.current);
  const [memory, setMemory] = useState(initialMemoryRef.current);
  const [snapshot, setSnapshot] = useState(() =>
    createInitialSnapshot(initialLocationRef.current, initialMemoryRef.current),
  );
  const [telemetryEntries, setTelemetryEntries] = useState<readonly TelemetryEnvelope[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const sinkRef = useRef<InMemoryTelemetrySink | null>(null);
  if (!sinkRef.current) {
    sinkRef.current = new InMemoryTelemetrySink();
  }

  const loggerRef = useRef<StructuredTelemetryLogger | null>(null);
  if (!loggerRef.current) {
    loggerRef.current = createStructuredTelemetryLogger({
      serviceRef: "patient-shell-seed",
      environment: "local",
      sink: sinkRef.current,
    });
  }

  const routeView = useMemo(
    () =>
      resolvePatientShellView({
        location,
        memory,
        continuitySnapshot: snapshot,
      }),
    [location, memory, snapshot],
  );
  const deferredTelemetryEntries = useDeferredValue(telemetryEntries);
  const lastRouteEventKeyRef = useRef<string>("");
  const lastAnchorEventKeyRef = useRef<string>("");

  const updateSnapshotFor = useEffectEvent(
    (nextLocation: PatientShellLocation, nextMemory: PatientShellViewMemory) => {
      setSnapshot((current) => synchronizeSnapshot(current, nextLocation, nextMemory));
    },
  );

  const commitLocation = useEffectEvent(
    (
      nextLocation: PatientShellLocation,
      nextMemory: PatientShellViewMemory,
      historyMode: "push" | "replace" = "push",
    ) => {
      const ownerWindow = safeWindow();
      if (ownerWindow) {
        const nextPath = formatPatientShellPath(nextLocation);
        if (historyMode === "replace") {
          ownerWindow.history.replaceState({}, "", nextPath);
        } else if (ownerWindow.location.pathname !== nextPath) {
          ownerWindow.history.pushState({}, "", nextPath);
        }
      }
      startTransition(() => {
        setLocation(nextLocation);
        setMemory(nextMemory);
        updateSnapshotFor(nextLocation, nextMemory);
      });
    },
  );

  const emitTelemetry = useEffectEvent(
    (eventName: string, currentView: PatientShellRouteView, currentSnapshot: ContinuitySnapshot) => {
      if (!loggerRef.current || !sinkRef.current) {
        return;
      }
      const correlation = mintEdgeCorrelation({
        environment: "local",
        serviceRef: "patient-shell-seed",
        audienceSurfaceRef: currentView.guardDecision.requestedAudienceSurface,
        routeFamilyRef: currentView.location.routeFamilyRef,
        requestMethod: "GET",
        requestPath: currentView.location.pathname,
        issuedAt: "2026-04-13T08:27:00Z",
      });
      loggerRef.current.info(eventName, {
        correlation,
        fields: {
          routeFamilyRef: controlPlaneField(currentView.location.routeFamilyRef),
          selectedAnchorRef: controlPlaneField(currentSnapshot.selectedAnchor.anchorId),
          continuityFrameRef: controlPlaneField(
            currentSnapshot.selectedAnchor.continuityFrameRef,
          ),
          browserPosture: controlPlaneField(currentView.guardDecision.effectivePosture),
          manifestState: controlPlaneField(currentView.manifestVerdict.validationState),
          routePath: maskedRouteField(currentView.location.pathname),
          dominantAction: publicDescriptor(currentView.statusInput.dominantActionLabel),
          subjectRef: phiReferenceField(patientIdentitySummary.maskedNhsNumber),
        },
      });
      setTelemetryEntries(sinkRef.current.list().slice(-TELEMETRY_LIMIT).reverse());
    },
  );

  const navigateToSection = useEffectEvent((section: PatientPrimarySection) => {
    commitLocation(parsePatientShellLocation(navPathForSection(section)), memory);
  });

  const openRequest = useEffectEvent((requestId: string) => {
    const nextMemory = { ...memory, selectedRequestId: requestId };
    commitLocation(parsePatientShellLocation(`/requests/${requestId}`), nextMemory);
  });

  const openRecordFollowUp = useEffectEvent((recordId: string) => {
    const nextMemory = { ...memory, selectedRecordId: recordId };
    commitLocation(parsePatientShellLocation(`/records/${recordId}/follow-up`), nextMemory);
  });

  const openMessagesThread = useEffectEvent((threadId: string) => {
    const nextMemory = { ...memory, selectedThreadId: threadId };
    commitLocation(parsePatientShellLocation(`/messages/thread/${threadId}`), nextMemory);
  });

  const returnToCurrentSection = useEffectEvent(() => {
    commitLocation(parsePatientShellLocation(navPathForSection(location.section)), memory);
  });

  const openRecoveryRoute = useEffectEvent(() => {
    commitLocation(parsePatientShellLocation("/recovery/secure-link"), memory);
  });

  const openEmbeddedRoute = useEffectEvent(() => {
    commitLocation(parsePatientShellLocation("/home/embedded"), memory);
  });

  const toggleHomeMode = useEffectEvent((homeMode: PatientHomeMode) => {
    const nextMemory = { ...memory, homeMode };
    startTransition(() => {
      setMemory(nextMemory);
      updateSnapshotFor(location, nextMemory);
    });
  });

  const selectAnchor = useEffectEvent((anchorKey: string) => {
    startTransition(() => {
      setSnapshot((current) =>
        selectAnchorInSnapshot(current, anchorKey, "2026-04-13T08:28:00Z"),
      );
    });
  });

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    if (ownerWindow.location.pathname === "/") {
      ownerWindow.history.replaceState({}, "", "/home");
    }
  }, []);

  const handlePopState = useEffectEvent(() => {
    const nextLocation = parsePatientShellLocation(safeWindow()?.location.pathname ?? "/home");
    startTransition(() => {
      setLocation(nextLocation);
      updateSnapshotFor(nextLocation, memory);
    });
  });

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    ownerWindow.addEventListener("popstate", handlePopState);
    return () => ownerWindow.removeEventListener("popstate", handlePopState);
  }, [handlePopState]);

  useEffect(() => {
    writePatientViewMemory(memory);
  }, [memory]);

  useEffect(() => {
    writePersistedContinuitySnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const routeKey = `${location.pathname}::${routeView.guardDecision.effectivePosture}`;
    if (lastRouteEventKeyRef.current !== routeKey) {
      lastRouteEventKeyRef.current = routeKey;
      emitTelemetry("ui.surface.enter", routeView, snapshot);
    }

    const anchorKey = `${location.pathname}::${snapshot.selectedAnchor.anchorId}`;
    if (lastAnchorEventKeyRef.current !== anchorKey) {
      lastAnchorEventKeyRef.current = anchorKey;
      emitTelemetry("ui.selected_anchor.changed", routeView, snapshot);
    }
  }, [emitTelemetry, location.pathname, routeView, snapshot]);

  return {
    location,
    memory,
    snapshot,
    routeView,
    telemetryEntries: deferredTelemetryEntries,
    showDiagnostics,
    setShowDiagnostics,
    navigateToSection,
    openRequest,
    openRecordFollowUp,
    openMessagesThread,
    openRecoveryRoute,
    openEmbeddedRoute,
    returnToCurrentSection,
    toggleHomeMode,
    selectAnchor,
  };
}

function RootButton({
  active,
  children,
  onClick,
  testId,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className="patient-shell-seed__chip-button"
      data-active={active ? "true" : "false"}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "review" | "danger" | "success";
}) {
  return (
    <span className={`patient-shell-seed__status-pill patient-shell-seed__status-pill--${tone}`}>
      {label}
    </span>
  );
}

function PatientUtilityBar({
  view,
  showDiagnostics,
  setShowDiagnostics,
  openEmbeddedRoute,
  openRecoveryRoute,
}: {
  view: PatientShellRouteView;
  showDiagnostics: boolean;
  setShowDiagnostics: (value: boolean) => void;
  openEmbeddedRoute: () => void;
  openRecoveryRoute: () => void;
}) {
  return (
    <section className="patient-shell-seed__utility" data-testid="patient-utility-bar">
      <div className="patient-shell-seed__utility-identity">
        <span className="patient-shell-seed__eyebrow">Authenticated patient</span>
        <strong>{patientIdentitySummary.fullName}</strong>
        <span>{patientIdentitySummary.maskedNhsNumber}</span>
        <span>{patientIdentitySummary.contactRoute}</span>
      </div>
      <div className="patient-shell-seed__utility-actions">
        <RootButton onClick={openEmbeddedRoute} testId="utility-open-embedded">
          Embedded posture
        </RootButton>
        <RootButton onClick={openRecoveryRoute} testId="utility-open-recovery">
          Recovery route
        </RootButton>
        <RootButton
          active={showDiagnostics}
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          testId="utility-toggle-diagnostics"
        >
          Diagnostics
        </RootButton>
        <StatusPill label={view.guardDecision.effectivePosture.replaceAll("_", " ")} />
      </div>
    </section>
  );
}

function PatientPrimaryNav({
  activeSection,
  onNavigate,
}: {
  activeSection: PatientPrimarySection;
  onNavigate: (section: PatientPrimarySection) => void;
}) {
  return (
    <nav className="patient-shell-seed__nav" aria-label="Patient sections" data-testid="patient-primary-nav">
      {(["home", "requests", "appointments", "records", "messages"] as const).map((section) => (
        <button
          key={section}
          type="button"
          className="patient-shell-seed__nav-button"
          data-active={activeSection === section ? "true" : "false"}
          data-testid={`nav-${section}`}
          onClick={() => onNavigate(section)}
        >
          {section === "records" ? "Health record" : section.charAt(0).toUpperCase() + section.slice(1)}
        </button>
      ))}
    </nav>
  );
}

function SectionHeader({
  view,
  memory,
  onSelectAnchor,
}: {
  view: PatientShellRouteView;
  memory: PatientShellViewMemory;
  onSelectAnchor: (anchorKey: string) => void;
}) {
  return (
    <section className="patient-shell-seed__section-header-frame" data-testid="patient-section-header">
      <div>
        <span className="patient-shell-seed__eyebrow">
          {view.routeClaim.section}
        </span>
        <h2 id="patient-section-title" data-focus-target="section-heading" tabIndex={-1}>
          {view.routeClaim.title}
        </h2>
        <p>{view.routeClaim.routeSummary}</p>
      </div>
      <div className="patient-shell-seed__section-header-meta">
        <StatusPill label={view.attentionLabel} tone={memory.homeMode === "quiet" ? "success" : "review"} />
        <StatusPill
          label={view.manifestVerdict.validationState}
          tone={view.manifestVerdict.validationState === "valid" ? "success" : "review"}
        />
      </div>
      <div className="patient-shell-seed__anchor-rail" data-testid="patient-anchor-rail">
        {view.routeClaim.anchors.map((anchor) => (
          <RootButton
            key={anchor}
            active={view.selectedAnchorKey === anchor}
            onClick={() => onSelectAnchor(anchor)}
            testId={`anchor-${anchor}`}
          >
            {anchor.replaceAll("-", " ")}
          </RootButton>
        ))}
      </div>
    </section>
  );
}

function SummaryCard({
  kicker,
  title,
  body,
  footer,
  testId,
}: {
  kicker: string;
  title: string;
  body: string;
  footer?: string;
  testId?: string;
}) {
  return (
    <article className="patient-shell-seed__summary-card" data-testid={testId}>
      <span className="patient-shell-seed__eyebrow">{kicker}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      {footer ? <small>{footer}</small> : null}
    </article>
  );
}

function HomeRoute({
  memory,
  openRequest,
  openRecordFollowUp,
  toggleHomeMode,
}: {
  memory: PatientShellViewMemory;
  openRequest: (requestId: string) => void;
  openRecordFollowUp: (recordId: string) => void;
  toggleHomeMode: (homeMode: PatientHomeMode) => void;
}) {
  const spotlightRequest = resolveHomeSpotlightRequest();
  const quietRecord = resolveQuietHomeNextRecord();

  return (
    <div className="patient-shell-seed__home" data-testid="patient-home-route">
      <div className="patient-shell-seed__home-mode-toggle" data-testid="patient-home-mode-toggle">
        <RootButton
          active={memory.homeMode === "attention"}
          onClick={() => toggleHomeMode("attention")}
          testId="home-mode-attention"
        >
          Attention needed
        </RootButton>
        <RootButton
          active={memory.homeMode === "quiet"}
          onClick={() => toggleHomeMode("quiet")}
          testId="home-mode-quiet"
        >
          Quiet home
        </RootButton>
      </div>

      {memory.homeMode === "quiet" ? (
        <section className="patient-shell-seed__quiet-home" data-testid="patient-home-quiet">
          <SummaryCard
            kicker="Quiet home"
            title="Nothing urgent is waiting for you right now"
            body="Your current requests, messages, and records remain reachable from the same shell. One gentle next step is ready if you want it."
            footer="Calm home states stay distinct from blocked, stale, or filter-empty states."
          />
          <div className="patient-shell-seed__quiet-home-actions">
            <button
              type="button"
              className="patient-shell-seed__primary-button"
              onClick={() => openRecordFollowUp(quietRecord.id)}
              data-testid="quiet-home-next-step"
            >
              Open the latest record summary
            </button>
          </div>
        </section>
      ) : (
        <section className="patient-shell-seed__home-spotlight" data-testid="patient-home-spotlight">
          <div className="patient-shell-seed__spotlight-body">
            <span className="patient-shell-seed__eyebrow">Dominant task</span>
            <h3>{spotlightRequest.title}</h3>
            <p>{spotlightRequest.summary}</p>
            <div className="patient-shell-seed__list-meta">
              <StatusPill label="Reply needed" tone="review" />
              <span>{spotlightRequest.nextStep}</span>
            </div>
          </div>
          <button
            type="button"
            className="patient-shell-seed__primary-button"
            onClick={() => openRequest(spotlightRequest.id)}
            data-testid="home-spotlight-action"
          >
            Continue this request
          </button>
        </section>
      )}

      <div className="patient-shell-seed__home-grid">
        <SummaryCard
          kicker="Requests"
          title="Four current request threads"
          body="One needs a reply, one is under review, one is progressing, and one is fenced behind recovery."
        />
        <SummaryCard
          kicker="Appointments"
          title="Two live summaries, one waitlist, one recovery-safe hold"
          body="Appointment truth stays specific and never overstates booking confirmation."
        />
        <SummaryCard
          kicker="Health record"
          title="Three recent updates"
          body="The record route keeps trend, result, and letter summaries readable before any richer artifact action."
        />
        <SummaryCard
          kicker="Messages"
          title="Two active threads and one blocked contact route"
          body="Conversation continuity stays in the shell and blocked reply posture is explicit."
        />
      </div>
    </div>
  );
}

function RequestsRoute({
  location,
  memory,
  selectedAnchor,
  openRequest,
  openRecoveryRoute,
}: {
  location: PatientShellLocation;
  memory: PatientShellViewMemory;
  selectedAnchor: string;
  openRequest: (requestId: string) => void;
  openRecoveryRoute: () => void;
}) {
  const currentRequest = resolveSelectedRequestForLocation(location, memory);
  const filteredRequests =
    selectedAnchor === "request-history"
      ? patientRequests.filter((request) => request.state !== "reply_needed")
      : selectedAnchor === "request-lineage"
        ? patientRequests
        : patientRequests.filter(
            (request) => request.state === "reply_needed" || request.state === "blocked_repair",
          );

  return (
    <div className="patient-shell-seed__requests" data-testid="patient-requests-route">
      <div className="patient-shell-seed__bucket-row">
        <StatusPill label="Needs attention" tone="review" />
        <StatusPill label="Lineage view" />
        <StatusPill label="History" />
      </div>
      <div className="patient-shell-seed__split">
        <section className="patient-shell-seed__list-surface" data-testid="patient-request-list">
          {filteredRequests.map((request) => (
            <button
              key={request.id}
              type="button"
              className="patient-shell-seed__list-row"
              data-active={currentRequest.id === request.id ? "true" : "false"}
              data-testid={`request-row-${request.id}`}
              data-focus-target={`request-row-${request.id}`}
              onClick={() => openRequest(request.id)}
            >
              <span className="patient-shell-seed__signal-rail" data-tone={buttonTone(request.state)} />
              <div className="patient-shell-seed__list-copy">
                <strong>{request.title}</strong>
                <p>{request.summary}</p>
                <small>{request.updatedAt.slice(11, 16)} · {humanizeState(request.state)}</small>
              </div>
              <StatusPill label={humanizeState(request.state)} tone={buttonTone(request.state)} />
            </button>
          ))}
        </section>
        <section className="patient-shell-seed__detail-surface" data-testid="patient-request-detail">
          <SummaryCard
            kicker={currentRequest.id}
            title={currentRequest.title}
            body={currentRequest.summary}
            footer={currentRequest.trustCue}
          />
          <div className="patient-shell-seed__lineage-card">
            <span className="patient-shell-seed__eyebrow">Lineage</span>
            <ol>
              {currentRequest.lineage.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ol>
          </div>
          <div className="patient-shell-seed__detail-actions">
            <button type="button" className="patient-shell-seed__primary-button">
              {currentRequest.nextStep}
            </button>
            {currentRequest.recoveryNote ? (
              <button type="button" className="patient-shell-seed__secondary-button" onClick={openRecoveryRoute}>
                Open same-shell recovery
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function AppointmentsRoute({
  view,
  memory,
  location,
}: {
  view: PatientShellRouteView;
  memory: PatientShellViewMemory;
  location: PatientShellLocation;
}) {
  return (
    <div className="patient-shell-seed__appointments" data-testid="patient-appointments-route">
      <RouteGuardCard
        view={view}
        selectedAnchor={selectedAnchorKeyForLocation(location, memory.homeMode)}
      />
      <div data-testid="patient-appointment-itinerary">
        <PatientAppointmentFamilyWorkspace />
      </div>
    </div>
  );
}

function TrendBars({ record }: { record: PatientRecordProjection }) {
  const maxValue = Math.max(...record.trendPoints.map((point) => point.value), 1);
  return (
    <figure className="patient-shell-seed__trend-card" data-testid="patient-record-trend">
      <figcaption>
        <span className="patient-shell-seed__eyebrow">Trend</span>
        <strong>{record.title}</strong>
        <p>{record.summary}</p>
      </figcaption>
      <div className="patient-shell-seed__trend-bars" aria-hidden="true">
        {record.trendPoints.map((point) => (
          <div key={point.label} className="patient-shell-seed__trend-bar-row">
            <span>{point.label}</span>
            <div className="patient-shell-seed__trend-track">
              <div
                className="patient-shell-seed__trend-bar"
                style={{ width: `${(point.value / maxValue) * 100}%` }}
              />
            </div>
            <strong>{point.value}</strong>
          </div>
        ))}
      </div>
      <table className="patient-shell-seed__table" data-testid="patient-record-table">
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Value</th>
            <th scope="col">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {record.trendPoints.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{point.value}</td>
              <td>{point.interpretation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function RecordsRoute({
  view,
  location,
  memory,
  openRecordFollowUp,
  returnToSection,
}: {
  view: PatientShellRouteView;
  location: PatientShellLocation;
  memory: PatientShellViewMemory;
  openRecordFollowUp: (recordId: string) => void;
  returnToSection: () => void;
}) {
  const record = resolveSelectedRecordForLocation(location, memory);

  return (
    <div className="patient-shell-seed__records" data-testid="patient-records-route">
      <div className="patient-shell-seed__split">
        <section className="patient-shell-seed__list-surface" data-testid="patient-record-list">
          {patientRecords.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="patient-shell-seed__record-card"
              data-active={entry.id === record.id ? "true" : "false"}
              data-testid={`record-card-${entry.id}`}
              data-focus-target={`record-card-${entry.id}`}
              onClick={() => openRecordFollowUp(entry.id)}
            >
              <span className="patient-shell-seed__eyebrow">{entry.kind}</span>
              <strong>{entry.title}</strong>
              <p>{entry.summary}</p>
              <small>{entry.updatedAt.slice(0, 10)}</small>
            </button>
          ))}
        </section>
        <section className="patient-shell-seed__detail-surface">
          {view.artifactSpecimen ? (
            <div data-testid="patient-record-follow-up">
              <ArtifactSurfaceFrame specimen={view.artifactSpecimen} />
              <div className="patient-shell-seed__detail-actions">
                <button
                  type="button"
                  className="patient-shell-seed__secondary-button"
                  onClick={returnToSection}
                  data-testid="record-follow-up-return"
                >
                  Return to the record summary
                </button>
              </div>
            </div>
          ) : (
            <>
              <SummaryCard
                kicker={record.kind}
                title={record.title}
                body={record.detailSummary}
                footer={record.trustCue}
              />
              <TrendBars record={record} />
              <div className="patient-shell-seed__detail-actions">
                <button
                  type="button"
                  className="patient-shell-seed__primary-button"
                  onClick={() => openRecordFollowUp(record.id)}
                  data-testid={`record-follow-up-${record.id}`}
                >
                  {record.followUpLabel}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function MessagesRoute({
  view,
  location,
  memory,
  openMessagesThread,
}: {
  view: PatientShellRouteView;
  location: PatientShellLocation;
  memory: PatientShellViewMemory;
  openMessagesThread: (threadId: string) => void;
}) {
  const thread = resolveSelectedThreadForLocation(location, memory);

  return (
    <div className="patient-shell-seed__messages" data-testid="patient-messages-route">
      <div className="patient-shell-seed__split">
        <section className="patient-shell-seed__list-surface" data-testid="patient-message-inbox">
          {patientThreads.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="patient-shell-seed__list-row"
              data-active={entry.id === thread.id ? "true" : "false"}
              data-testid={`thread-row-${entry.id}`}
              data-focus-target={`thread-row-${entry.id}`}
              onClick={() => openMessagesThread(entry.id)}
            >
              <span className="patient-shell-seed__signal-rail" data-tone={buttonTone(entry.state)} />
              <div className="patient-shell-seed__list-copy">
                <strong>{entry.subject}</strong>
                <p>{entry.preview}</p>
                <small>{entry.sender} · {entry.updatedAt.slice(11, 16)}</small>
              </div>
              <StatusPill label={humanizeState(entry.state)} tone={buttonTone(entry.state)} />
            </button>
          ))}
        </section>
        <section className="patient-shell-seed__detail-surface" data-testid="patient-message-thread">
          {view.messagePosture ? (
            <SurfaceStateFrame contract={view.messagePosture} />
          ) : (
            <>
              <SummaryCard
                kicker={thread.sender}
                title={thread.subject}
                body={thread.preview}
                footer={thread.trustCue}
              />
              <div className="patient-shell-seed__thread-card">
                {thread.threadLines.map((line) => (
                  <article key={`${line.time}-${line.body}`} className="patient-shell-seed__thread-line">
                    <strong>{line.speaker}</strong>
                    <p>{line.body}</p>
                    <small>{line.time} · {line.authoritative ? "authoritative summary" : "local draft context"}</small>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function RouteGuardCard({
  view,
  selectedAnchor,
}: {
  view: PatientShellRouteView;
  selectedAnchor: string;
}) {
  if (view.guardDecision.effectivePosture === "live") {
    return null;
  }
  return (
    <div className="patient-shell-seed__guard-card">
      <ArtifactFreeGuardSurface view={view} selectedAnchor={selectedAnchor} />
    </div>
  );
}

function ArtifactFreeGuardSurface({
  view,
  selectedAnchor,
}: {
  view: PatientShellRouteView;
  selectedAnchor: string;
}) {
  return (
    <section
      className="patient-shell-seed__guard-inline"
      data-testid="patient-inline-guard"
      data-guard-posture={view.guardDecision.effectivePosture}
    >
      <div>
        <span className="patient-shell-seed__eyebrow">Guarded route</span>
        <strong>{view.routeClaim.title}</strong>
        <p>{view.guardDecision.lastSafeSummary}</p>
      </div>
      <div className="patient-shell-seed__guard-inline-meta">
        <StatusPill label={view.guardDecision.effectivePosture} tone="review" />
        <span>Anchor: {selectedAnchor}</span>
        {view.guardDecision.dominantRecoveryAction ? (
          <strong>{view.guardDecision.dominantRecoveryAction.label}</strong>
        ) : null}
      </div>
    </section>
  );
}

function RecoveryRoute({ view }: { view: PatientShellRouteView }) {
  return (
    <section className="patient-shell-seed__recovery" data-testid="patient-recovery-stage">
      <ArtifactFreeGuardSurface view={view} selectedAnchor={view.selectedAnchorKey} />
      <article className="patient-shell-seed__summary-card">
        <span className="patient-shell-seed__eyebrow">Recovery</span>
        <h3 data-focus-target="recovery-heading" tabIndex={-1}>
          Repair the secure link and resume from the last safe patient summary
        </h3>
        <p>
          This bounded route keeps the patient shell, selected anchor, and return-safe summary
          visible while the repair path remains dominant.
        </p>
        <small>Recovery does not eject the user into a detached error page.</small>
      </article>
    </section>
  );
}

function EmbeddedRoute({ view }: { view: PatientShellRouteView }) {
  return (
    <section className="patient-shell-seed__embedded" data-testid="patient-embedded-stage">
      <ArtifactFreeGuardSurface view={view} selectedAnchor={view.selectedAnchorKey} />
      <div className="patient-shell-seed__capability-card" data-testid="patient-embedded-capabilities">
        <span className="patient-shell-seed__eyebrow">Embedded host floor</span>
        <h3 data-focus-target="embedded-heading" tabIndex={-1}>
          Required capabilities
        </h3>
        <ul>
          <li>Signed identity bridge</li>
          <li>Host return</li>
          <li>Secure storage</li>
        </ul>
        <p>The seed route keeps summary-first continuity while the missing host bridge fails closed in place.</p>
      </div>
    </section>
  );
}

function DecisionDock({
  view,
  location,
  memory,
  openRequest,
  openRecordFollowUp,
  openMessagesThread,
  openRecoveryRoute,
}: {
  view: PatientShellRouteView;
  location: PatientShellLocation;
  memory: PatientShellViewMemory;
  openRequest: (requestId: string) => void;
  openRecordFollowUp: (recordId: string) => void;
  openMessagesThread: (threadId: string) => void;
  openRecoveryRoute: () => void;
}) {
  let actionLabel = view.statusInput.dominantActionLabel;
  let onAction: () => void = () => {};

  if (location.routeKey === "home") {
    if (memory.homeMode === "quiet") {
      const nextRecord = resolveQuietHomeNextRecord();
      actionLabel = "Open the latest record summary";
      onAction = () => {
        openRecordFollowUp(nextRecord.id);
      };
    } else {
      const nextRequest = resolveHomeSpotlightRequest();
      actionLabel = "Continue the reply-needed request";
      onAction = () => {
        openRequest(nextRequest.id);
      };
    }
  } else if (location.routeKey === "records") {
    const currentRecord = resolveSelectedRecordForLocation(location, memory);
    actionLabel = currentRecord.followUpLabel;
    onAction = () => {
      openRecordFollowUp(currentRecord.id);
    };
  } else if (location.routeKey === "messages") {
    const nextThread = resolveSelectedThreadForLocation(location, memory);
    actionLabel =
      nextThread.state === "blocked_contact" ? "Open the recovery route" : "Continue this thread";
    onAction =
      nextThread.state === "blocked_contact"
        ? openRecoveryRoute
        : () => {
            openMessagesThread(nextThread.id);
          };
  } else if (location.routeKey === "request_detail") {
    const currentRequest = resolveSelectedRequestForLocation(location, memory);
    actionLabel =
      currentRequest.state === "blocked_repair"
        ? "Resume the secure-link repair"
        : currentRequest.nextStep;
    onAction =
      currentRequest.state === "blocked_repair"
        ? openRecoveryRoute
        : () => {};
  }

  return (
    <aside
      className="patient-shell-seed__decision-dock"
      data-testid="patient-decision-dock"
      data-dominant-action={actionLabel}
    >
      <span className="patient-shell-seed__eyebrow">DecisionDock</span>
      <strong>{actionLabel}</strong>
      <p>{view.routeClaim.decisionDock.detail}</p>
      <button
        type="button"
        className="patient-shell-seed__primary-button"
        data-disabled={!isMutationAllowed(view) && location.routeKey === "appointments" ? "true" : "false"}
        disabled={!isMutationAllowed(view) && location.routeKey === "appointments"}
        onClick={onAction}
      >
        {view.guardDecision.dominantRecoveryAction?.label ?? actionLabel}
      </button>
    </aside>
  );
}

function SupportRail({
  view,
  snapshot,
  telemetryEntries,
  showDiagnostics,
}: {
  view: PatientShellRouteView;
  snapshot: ContinuitySnapshot;
  telemetryEntries: readonly TelemetryEnvelope[];
  showDiagnostics: boolean;
}) {
  return (
    <aside className="patient-shell-seed__support-rail" data-testid="patient-support-rail">
      <section className="patient-shell-seed__rail-card" data-testid="patient-trust-panel">
        <span className="patient-shell-seed__eyebrow">Trust cues</span>
        <ul>
          {view.trustCues.slice(0, 3).map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </section>
      <section className="patient-shell-seed__rail-card" data-testid="patient-continuity-panel">
        <span className="patient-shell-seed__eyebrow">Continuity</span>
        <strong>{snapshot.selectedAnchor.lastKnownLabel}</strong>
        <p>{snapshot.selectedAnchor.continuityFrameRef}</p>
        <small>{snapshot.timeline.at(-1)?.detail ?? "Same-shell continuity remains active."}</small>
      </section>
      {showDiagnostics ? (
        <section className="patient-shell-seed__rail-card" data-testid="patient-telemetry-panel">
          <span className="patient-shell-seed__eyebrow">Telemetry</span>
          <ol>
            {telemetryEntries.map((entry) => (
              <li key={entry.envelopeRef} className="patient-shell-seed__telemetry-row">
                <strong>{entry.eventName}</strong>
                <span>{entry.fields.browserPosture?.emittedValue}</span>
                <small>{String(entry.fields.routeFamilyRef?.emittedValue ?? "")}</small>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </aside>
  );
}

function MainStage({
  view,
  location,
  memory,
  openRequest,
  openRecordFollowUp,
  openMessagesThread,
  openRecoveryRoute,
  returnToCurrentSection,
  toggleHomeMode,
}: {
  view: PatientShellRouteView;
  location: PatientShellLocation;
  memory: PatientShellViewMemory;
  openRequest: (requestId: string) => void;
  openRecordFollowUp: (recordId: string) => void;
  openMessagesThread: (threadId: string) => void;
  openRecoveryRoute: () => void;
  returnToCurrentSection: () => void;
  toggleHomeMode: (homeMode: PatientHomeMode) => void;
}) {
  switch (location.routeKey) {
    case "home":
      return (
        <HomeRoute
          memory={memory}
          openRequest={openRequest}
          openRecordFollowUp={openRecordFollowUp}
          toggleHomeMode={toggleHomeMode}
        />
      );
    case "embedded":
      return <EmbeddedRoute view={view} />;
    case "requests":
    case "request_detail":
      return (
        <RequestsRoute
          location={location}
          memory={memory}
          selectedAnchor={view.selectedAnchorKey}
          openRequest={openRequest}
          openRecoveryRoute={openRecoveryRoute}
        />
      );
    case "appointments":
      return <AppointmentsRoute view={view} memory={memory} location={location} />;
    case "records":
    case "record_follow_up":
      return (
        <RecordsRoute
          view={view}
          location={location}
          memory={memory}
          openRecordFollowUp={openRecordFollowUp}
          returnToSection={returnToCurrentSection}
        />
      );
    case "messages":
    case "message_thread":
      return (
        <MessagesRoute
          view={view}
          location={location}
          memory={memory}
          openMessagesThread={openMessagesThread}
        />
      );
    case "recovery":
      return <RecoveryRoute view={view} />;
  }
}

export function PatientShellSeedApp(props: PatientShellSeedAppProps = {}) {
  const breakpointClass = useBreakpointClass();
  const prefersReducedMotion = useReducedMotionPreference();
  const controller = usePatientShellController(props);
  const profile = resolvePersistentShellProfile("patient-web", {
    breakpointClass,
    routeFamilyRef: controller.location.routeFamilyRef,
  });

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.contrast = "standard";
    ownerWindow.document.body.dataset.density = "relaxed";
    ownerWindow.document.body.dataset.motion = prefersReducedMotion ? "reduced" : "full";
    ownerWindow.document.body.dataset.reducedMotion = prefersReducedMotion ? "true" : "false";
  }, [prefersReducedMotion]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const focusTarget = focusTargetForView(controller.location, controller.memory);
    const element = ownerWindow.document.querySelector<HTMLElement>(
      `[data-focus-target="${focusTarget}"]`,
    );
    element?.focus();
  }, [controller.location, controller.memory]);

  return (
    <main
      className="token-foundation patient-shell-seed"
      data-testid="patient-shell-root"
      data-task-id={PATIENT_SHELL_TASK_ID}
      data-visual-mode={PATIENT_SHELL_VISUAL_MODE}
      data-route-key={controller.location.routeKey}
      data-route-family={controller.location.routeFamilyRef}
      data-browser-posture={controller.routeView.guardDecision.effectivePosture}
      data-manifest-validation-state={controller.routeView.manifestVerdict.validationState}
      data-manifest-drift-state={controller.routeView.manifestVerdict.driftState}
      data-selected-anchor={controller.snapshot.selectedAnchor.anchorId}
      data-shell-continuity-key={controller.snapshot.selectedAnchor.continuityFrameRef}
      data-layout-topology={profile.topology}
      data-breakpoint-class={breakpointClass}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
    >
      <header className="patient-shell-seed__masthead" data-testid="patient-shell-masthead">
        <div className="patient-shell-seed__brand">
          <VecellLogoLockup
            aria-hidden="true"
            className="patient-shell-seed__brand-lockup"
            style={{ width: 176, height: "auto" }}
          />
          <div>
            <span className="patient-shell-seed__eyebrow">vecell patient shell seed</span>
            <h1>{patientIdentitySummary.givenName}&rsquo;s care continuity</h1>
            <p>
              Phase 0 patient shell proving calm navigation, seeded route families, same-shell
              continuity, guarded runtime posture, and truthful recovery.
            </p>
          </div>
        </div>
        <div className="patient-shell-seed__masthead-meta">
          <StatusPill label={profile.topology.replaceAll("_", " ")} />
          <StatusPill label={breakpointClass} />
          <StatusPill label={controller.routeView.manifestVerdict.effectiveBrowserPosture} tone="review" />
        </div>
      </header>

      <PatientUtilityBar
        view={controller.routeView}
        showDiagnostics={controller.showDiagnostics}
        setShowDiagnostics={controller.setShowDiagnostics}
        openEmbeddedRoute={controller.openEmbeddedRoute}
        openRecoveryRoute={controller.openRecoveryRoute}
      />

      <PatientPrimaryNav
        activeSection={controller.location.section}
        onNavigate={controller.navigateToSection}
      />

      <SectionHeader
        view={controller.routeView}
        memory={controller.memory}
        onSelectAnchor={controller.selectAnchor}
      />

      <SharedStatusStrip input={controller.routeView.statusInput} />
      <CasePulse pulse={controller.routeView.casePulse} />

      <section className="patient-shell-seed__layout" data-testid="patient-shell-layout">
        <div className="patient-shell-seed__primary">
          <MainStage
            view={controller.routeView}
            location={controller.location}
            memory={controller.memory}
            openRequest={controller.openRequest}
            openRecordFollowUp={controller.openRecordFollowUp}
            openMessagesThread={controller.openMessagesThread}
            openRecoveryRoute={controller.openRecoveryRoute}
            returnToCurrentSection={controller.returnToCurrentSection}
            toggleHomeMode={controller.toggleHomeMode}
          />
          <DecisionDock
            view={controller.routeView}
            location={controller.location}
            memory={controller.memory}
            openRequest={controller.openRequest}
            openRecordFollowUp={controller.openRecordFollowUp}
            openMessagesThread={controller.openMessagesThread}
            openRecoveryRoute={controller.openRecoveryRoute}
          />
        </div>
        <SupportRail
          view={controller.routeView}
          snapshot={controller.snapshot}
          telemetryEntries={controller.telemetryEntries}
          showDiagnostics={controller.showDiagnostics}
        />
      </section>

      <footer className="patient-shell-seed__footer" data-testid="patient-shell-footer">
        <div>
          <span className="patient-shell-seed__eyebrow">Examples</span>
          <p>{patientShellProjectionExamples.length} seeded route specimens</p>
        </div>
        <div>
          <span className="patient-shell-seed__eyebrow">Coverage</span>
          <p>{patientShellGalleryRequirements.join(" / ")}</p>
        </div>
      </footer>
    </main>
  );
}

export default PatientShellSeedApp;
