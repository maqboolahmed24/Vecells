import { startTransition, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  ArtifactHandoffActionBar,
  ArtifactParityBanner,
  CrossOrgArtifactSurfaceFrame,
  CrossOrgContentLegend,
  CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE,
  GrantBoundPreviewState,
  GovernedPlaceholderSummary,
  NetworkConfirmationArtifactStage,
  ReturnAnchorReceipt,
  VecellLogoWordmark,
  type CrossOrgArtifactAction,
  type CrossOrgArtifactGrantState,
  type CrossOrgArtifactStageMode,
  type CrossOrgContentLegendItem,
} from "@vecells/design-system";
import "@vecells/design-system/cross-org-artifact-handoff.css";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import {
  resolveNetworkManageScenarioFromConfirmation330,
  resolvePatientNetworkManagePath330,
} from "../../../packages/domain-kernel/src/phase5-network-manage-preview";
import "./patient-network-confirmation.css";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";
import {
  BookingResponsiveProvider,
  BookingResponsiveStage,
  BookingStickyActionTray,
  EmbeddedBookingChromeAdapter,
  useBookingResponsive,
} from "./patient-booking-responsive";
import {
  PATIENT_NETWORK_CONFIRMATION_TASK_ID,
  PATIENT_NETWORK_CONFIRMATION_VISUAL_MODE,
  isPatientNetworkConfirmationPath,
  resolvePatientNetworkConfirmationProjectionByScenarioId,
  resolvePatientNetworkConfirmationScenarioId,
  type NetworkConfirmationScenarioId329,
} from "./patient-network-confirmation.model";

export { isPatientNetworkConfirmationPath };

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function resolveInitialScenario(): NetworkConfirmationScenarioId329 {
  const pathname =
    safeWindow()?.location.pathname ??
    "/bookings/network/confirmation/network_confirmation_329_pending";
  return (
    resolvePatientNetworkConfirmationScenarioId(pathname) ?? "network_confirmation_329_pending"
  );
}

function cueValueClass(value: string): "primary" | "secondary" | "blocked" {
  if (value.toLowerCase().includes("confirmed") || value.toLowerCase().includes("acknowledged")) {
    return "primary";
  }
  if (value.toLowerCase().includes("review") || value.toLowerCase().includes("pending")) {
    return "blocked";
  }
  return "secondary";
}

type ConfirmationArtifactActionId = "preview" | "print" | "download" | "external_handoff";

interface ConfirmationArtifactReceipt {
  readonly actionId: ConfirmationArtifactActionId;
  readonly title: string;
  readonly summary: string;
  readonly anchorLabel: string;
  readonly state: "safe" | "guarded" | "blocked";
}

function confirmationLegendItems(): readonly CrossOrgContentLegendItem[] {
  return [
    {
      term: "Appointment confirmed",
      meaning:
        "Patient reassurance is current for this appointment generation only. It does not imply the practice has acknowledged the same generation.",
      tone: "verified",
    },
    {
      term: "Practice informed",
      meaning:
        "The current operational notice was sent to the origin practice. It remains separate from patient reassurance.",
      tone: "preview",
    },
    {
      term: "Practice acknowledged",
      meaning:
        "The practice confirmed receipt of the current generation. This stays separate from calm patient wording.",
      tone: "neutral",
    },
  ];
}

function resolveConfirmationArtifactTone(
  state: "pending_copy" | "calm_confirmed" | "blocked",
  stageMode: CrossOrgArtifactStageMode,
): "neutral" | "verified" | "preview" | "warning" | "blocked" {
  if (state === "blocked") {
    return "blocked";
  }
  if (stageMode === "preview" || stageMode === "print") {
    return "preview";
  }
  if (state === "calm_confirmed") {
    return "verified";
  }
  return "warning";
}

function resolveConfirmationArtifactState(input: {
  projection: ReturnType<typeof resolvePatientNetworkConfirmationProjectionByScenarioId>;
  embeddedMode: "browser" | "nhs_app";
  activeActionId: ConfirmationArtifactActionId | null;
}) {
  const confirmed = input.projection.state === "calm_confirmed";
  const blocked = input.projection.state === "blocked";
  const embedded = input.embeddedMode === "nhs_app";
  const grantState: CrossOrgArtifactGrantState = blocked
    ? "blocked"
    : confirmed && !embedded
      ? "active"
      : "summary_only";
  const previewAllowed = confirmed && !embedded;
  const printAllowed = previewAllowed;
  const downloadAllowed = confirmed && !embedded;
  const handoffAllowed = confirmed && !embedded;

  let stageMode: CrossOrgArtifactStageMode = "summary_first";
  if (input.activeActionId === "preview" && previewAllowed) {
    stageMode = "preview";
  } else if (input.activeActionId === "print" && printAllowed) {
    stageMode = "print";
  } else if (input.activeActionId === "download" && downloadAllowed) {
    stageMode = "download";
  } else if (input.activeActionId === "external_handoff" && handoffAllowed) {
    stageMode = "external_handoff";
  } else if (grantState !== "active" && input.activeActionId) {
    stageMode = "summary_only";
  }

  const actions: readonly CrossOrgArtifactAction[] = [
    {
      actionId: "preview",
      label: "Open preview",
      detail: previewAllowed
        ? "Preview stays inside the same confirmation stage."
        : "Preview is held until host posture and confirmation truth both permit it.",
      disabled: !previewAllowed,
      tone: "primary",
    },
    {
      actionId: "print",
      label: "Print summary",
      detail: printAllowed
        ? "Print uses this same summary-first stage before any browser step."
        : "Print remains secondary until the current route can arm it lawfully.",
      disabled: !printAllowed,
    },
    {
      actionId: "download",
      label: "Download summary",
      detail: downloadAllowed
        ? "Download keeps the same return anchor and wording."
        : "Download is not widened from this confirmation posture.",
      disabled: !downloadAllowed,
    },
    {
      actionId: "external_handoff",
      label: "Open external handoff",
      detail: handoffAllowed
        ? "Handoff remains grant-bound and return-safe."
        : "External handoff is blocked while the route is summary-only or under review.",
      disabled: !handoffAllowed,
    },
  ];

  return {
    actions,
    grantState,
    stageMode,
    tone: resolveConfirmationArtifactTone(input.projection.state, stageMode),
    parityLabel:
      grantState === "active"
        ? "Summary verified"
        : blocked
          ? "Review posture"
          : embedded
            ? "Embedded summary-only"
            : "Summary-first only",
    authorityLabel:
      blocked
        ? "Reviewing latest confirmation"
        : confirmed
          ? "Current patient-facing wording"
          : "Pending authoritative confirmation",
    placeholderRows: [
      { label: "Current host", value: embedded ? "NHS App embedded shell" : "Standard browser" },
      {
        label: "Preview ceiling",
        value:
          grantState === "active"
            ? "Inline preview allowed on the current generation"
            : blocked
              ? "Preview blocked while review posture is active"
              : "Summary-first until confirmation settles",
      },
      {
        label: "Why detail is reduced",
        value: blocked
          ? "A later contradiction reopened review"
          : embedded
            ? "Detached preview and handoff stay closed in the embedded host"
            : "Authoritative confirmation has not widened richer modes yet",
      },
    ],
    grantRows: [
      { label: "Grant state", value: grantState.replaceAll("_", " ") },
      {
        label: "Return anchor",
        value: "Appointment summary / current confirmation route",
      },
      {
        label: "Preview rule",
        value:
          grantState === "active"
            ? "Preview, print, and handoff remain secondary and in-place"
            : "Summary remains primary while richer modes are held back",
      },
    ],
  };
}

function PatientConfirmationHero(props: {
  heading: string;
  body: string;
  state: "pending_copy" | "calm_confirmed" | "blocked";
}) {
  return (
    <section
      className="patient-network-confirmation__hero"
      data-testid="patient-confirmation-hero"
      data-state={props.state}
      tabIndex={-1}
    >
      <div className="patient-network-confirmation__hero-copy">
        <span className="patient-booking__eyebrow">PatientNetworkConfirmationView</span>
        <h2>{props.heading}</h2>
        <p>{props.body}</p>
      </div>
      <div className="patient-network-confirmation__hero-badge">
        <strong>
          {props.state === "calm_confirmed"
            ? "Authoritative confirmation"
            : props.state === "blocked"
              ? "Review posture"
              : "Pending confirmation"}
        </strong>
        <span>
          {props.state === "calm_confirmed"
            ? "Primary reassurance is lawful."
            : props.state === "blocked"
              ? "Calm booked copy is frozen."
              : "We are keeping this route provisional."}
        </span>
      </div>
    </section>
  );
}

function AppointmentSummaryBlock(props: {
  rows: readonly { label: string; value: string }[];
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={props.sectionRef}
      className="patient-network-confirmation__summary"
      data-testid="patient-confirmation-summary"
      tabIndex={-1}
    >
      <div className="patient-network-confirmation__section-head">
        <span className="patient-booking__eyebrow">Appointment summary</span>
        <h3>Your appointment details</h3>
      </div>
      <dl className="patient-network-confirmation__fact-list">
        {props.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function WhatNextBlock(props: { items: readonly string[] }) {
  return (
    <section
      className="patient-network-confirmation__next"
      data-testid="patient-confirmation-next-steps"
    >
      <div className="patient-network-confirmation__section-head">
        <span className="patient-booking__eyebrow">What happens next</span>
        <h3>Next steps</h3>
      </div>
      <ol className="patient-network-confirmation__next-list">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}

function ConfirmationDisclosureStrip(props: {
  rows: readonly {
    label: string;
    value: string;
    emphasis: "primary" | "secondary";
  }[];
}) {
  return (
    <section
      className="patient-network-confirmation__disclosure-strip"
      aria-label="Confirmation and practice visibility"
      data-testid="patient-confirmation-disclosure-strip"
    >
      {props.rows.map((row) => (
        <article
          key={row.label}
          className="patient-network-confirmation__cue"
          data-confirmation-cue={row.label.toLowerCase().replaceAll(" ", "_")}
          data-emphasis={row.emphasis}
          data-state={cueValueClass(row.value)}
        >
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </article>
      ))}
    </section>
  );
}

function ManageStub(props: { label: string; summary: string; onAction: () => void }) {
  return (
    <section
      className="patient-network-confirmation__manage-stub"
      data-testid="patient-confirmation-manage-stub"
    >
      <div className="patient-network-confirmation__section-head">
        <span className="patient-booking__eyebrow">Manage follow-on</span>
        <h3>{props.label}</h3>
      </div>
      <p>{props.summary}</p>
      <button type="button" className="patient-booking__secondary-action" onClick={props.onAction}>
        Open managed follow-on
      </button>
    </section>
  );
}

function HelpCard(props: { onAction: () => void }) {
  return (
    <aside
      className="patient-network-confirmation__help"
      data-testid="patient-network-confirmation-help"
      tabIndex={-1}
    >
      <span className="patient-booking__eyebrow">Need help?</span>
      <h3>Contact the service if this time no longer works</h3>
      <p>
        This route keeps the last safe appointment summary visible. Support stays bounded here
        instead of sending you to a detached confirmation page.
      </p>
      <button type="button" className="patient-booking__secondary-action" onClick={props.onAction}>
        Focus support options
      </button>
    </aside>
  );
}

function PatientNetworkConfirmationViewInner() {
  const [scenarioId] = useState(resolveInitialScenario);
  const [announcement, setAnnouncement] = useState("Network confirmation loaded.");
  const [activeArtifactActionId, setActiveArtifactActionId] =
    useState<ConfirmationArtifactActionId | null>(null);
  const [artifactReceipt, setArtifactReceipt] = useState<ConfirmationArtifactReceipt | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const artifactRef = useRef<HTMLDivElement>(null);
  const responsive = useBookingResponsive();
  const projection = useMemo(
    () => resolvePatientNetworkConfirmationProjectionByScenarioId(scenarioId),
    [scenarioId],
  );
  const stickyVisible = responsive.missionStackState === "folded";
  const responsiveProfile = responsive.resolveProfile(stickyVisible);
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: safeWindow()?.location.pathname ?? projection.pathname,
    search: safeWindow()?.location.search,
  });
  const artifactState = useMemo(
    () =>
      resolveConfirmationArtifactState({
        projection,
        embeddedMode: responsiveProfile.embeddedMode,
        activeActionId: activeArtifactActionId,
      }),
    [activeArtifactActionId, projection, responsiveProfile.embeddedMode],
  );

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [scenarioId]);

  function announce(message: string): void {
    startTransition(() => {
      setAnnouncement(message);
    });
  }

  function focusHelp(): void {
    safeDocument()
      ?.querySelector<HTMLElement>("[data-testid='patient-network-confirmation-help']")
      ?.focus({ preventScroll: true });
    announce("Support options focused.");
  }

  function openManagedFollowOn(): void {
    const ownerWindow = safeWindow();
    const nextScenario = resolveNetworkManageScenarioFromConfirmation330(scenarioId);
    ownerWindow?.location.assign(
      `${resolvePatientNetworkManagePath330(nextScenario)}${ownerWindow.location.search}`,
    );
  }

  function returnToSummaryAnchor(): void {
    summaryRef.current?.focus({ preventScroll: true });
    summaryRef.current?.scrollIntoView({ block: "start", inline: "nearest" });
    announce("Returned to appointment summary.");
  }

  function onArtifactAction(actionId: string): void {
    const action = artifactState.actions.find((candidate) => candidate.actionId === actionId);
    if (!action) {
      return;
    }

    const normalizedActionId = action.actionId as ConfirmationArtifactActionId;
    setActiveArtifactActionId(normalizedActionId);
    if (action.disabled) {
      setArtifactReceipt({
        actionId: normalizedActionId,
        title: `${action.label} stayed on the governed summary`,
        summary: action.detail,
        anchorLabel: "Appointment summary",
        state: artifactState.grantState === "blocked" ? "blocked" : "guarded",
      });
      announce(`${action.label} is not available. The summary remains primary.`);
      artifactRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
      return;
    }

    const stageLabel =
      normalizedActionId === "preview"
        ? "Preview opened in the same confirmation stage."
        : normalizedActionId === "print"
          ? "Print posture armed from the same confirmation stage."
          : normalizedActionId === "download"
            ? "Download summary prepared without leaving this confirmation route."
            : "External handoff prepared with the same return anchor.";

    setArtifactReceipt({
      actionId: normalizedActionId,
      title: action.label,
      summary: stageLabel,
      anchorLabel: "Appointment summary",
      state: "safe",
    });
    announce(stageLabel);
  }

  return (
    <div
      className="patient-booking patient-network-confirmation"
      data-testid="PatientNetworkConfirmationView"
      data-task-id={PATIENT_NETWORK_CONFIRMATION_TASK_ID}
      data-visual-mode={PATIENT_NETWORK_CONFIRMATION_VISUAL_MODE}
      data-patient-confirmation="true"
      data-confirmation-scenario={scenarioId}
      data-confirmation-truth={projection.state}
      data-patient-confirmation-state={projection.state}
      data-practice-informed={projection.disclosureRows[1]?.value ?? ""}
      data-practice-acknowledged={projection.disclosureRows[2]?.value ?? ""}
      data-breakpoint-class={responsiveProfile.breakpointClass}
      data-mission-stack-state={responsiveProfile.missionStackState}
      data-safe-area-class={responsiveProfile.safeAreaClass}
      data-sticky-action-posture={responsiveProfile.stickyActionPosture}
      data-embedded-mode={responsiveProfile.embeddedMode}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-artifact-stage-mode={artifactState.stageMode}
      data-artifact-grant-state={artifactState.grantState}
      data-return-anchor-state={artifactReceipt?.state ?? "safe"}
      data-artifact-visual-mode={CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE}
    >
      <EmbeddedBookingChromeAdapter
        topBand={
          <header className="patient-booking__top-band" data-testid="patient-booking-top-band">
            <a className="patient-booking__brand" href="/home">
              <span>
                <VecellLogoWordmark
                  aria-hidden="true"
                  className="patient-booking__brand-wordmark"
                />
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
        <main className="patient-booking__main">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="patient-booking__route-title"
            data-testid="patient-network-confirmation-heading"
          >
            Network appointment confirmation
          </h1>
          <BookingResponsiveStage
            stageName="Network appointment confirmation"
            testId="patient-network-confirmation-stage"
            stickyTray={
              stickyVisible ? (
                <BookingStickyActionTray
                  testId="patient-network-confirmation-sticky-tray"
                  primaryTestId="patient-network-confirmation-sticky-primary"
                  title={projection.heading}
                  detail={projection.patientFacingReference}
                  primaryActionLabel="Open managed follow-on"
                  primaryActionRef="open_network_manage_stub"
                  onPrimaryAction={openManagedFollowOn}
                  secondaryActionLabel="Need help"
                  onSecondaryAction={focusHelp}
                />
              ) : undefined
            }
            rail={
              <div className="patient-network-confirmation__rail">
                <ConfirmationDisclosureStrip rows={projection.disclosureRows} />
                <CrossOrgContentLegend
                  title="Cross-organisation wording legend"
                  summary="Equivalent truths keep equivalent phrases across patient, hub, and practice surfaces."
                  items={confirmationLegendItems()}
                />
                <HelpCard onAction={focusHelp} />
              </div>
            }
            railTitle="Confirmation detail"
            railToggleLabel="Open confirmation detail"
            main={
              <div className="patient-network-confirmation__main-column">
                <PatientConfirmationHero
                  heading={projection.heading}
                  body={projection.body}
                  state={projection.state}
                />
                <AppointmentSummaryBlock rows={projection.appointmentRows} sectionRef={summaryRef} />
                <CrossOrgArtifactSurfaceFrame
                  testId="patient-confirmation-artifact-frame"
                  contextId="patient_confirmation"
                  visualMode={CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE}
                  tone={artifactState.tone}
                  eyebrow="Governed artifact stage"
                  title="Summary-first confirmation artifact"
                  summary="Confirmation, practice visibility, preview posture, and secondary handoff actions stay inside one governed stage."
                  metadata={
                    <>
                      <span className="cross-org-artifact-chip">{artifactState.parityLabel}</span>
                      <span className="cross-org-artifact-chip">{artifactState.authorityLabel}</span>
                    </>
                  }
                >
                  <div ref={artifactRef}>
                    <ArtifactParityBanner
                      title="Current artifact parity"
                      summary={
                        artifactState.grantState === "active"
                          ? "The current confirmation route can keep richer artifact modes secondary, scoped, and return-safe."
                          : "This route stays summary-first until host posture and confirmation truth permit richer movement."
                      }
                      tone={artifactState.tone}
                      parityLabel={artifactState.parityLabel}
                      authorityLabel={artifactState.authorityLabel}
                      stageMode={artifactState.stageMode}
                    />
                  </div>
                  <NetworkConfirmationArtifactStage
                    title="Appointment summary and disclosure truth"
                    summary="The patient summary stays primary while appointment confirmation, practice informed, and practice acknowledged remain visibly separate."
                    stageMode={artifactState.stageMode}
                    identityRows={projection.appointmentRows}
                    truthRows={projection.disclosureRows.map((row) => ({
                      label: row.label,
                      value: row.value,
                    }))}
                    previewTitle="Current confirmation framing"
                    previewSummary={projection.patientFacingReference}
                  />
                  <GrantBoundPreviewState
                    title="Preview and handoff scope"
                    summary={
                      artifactState.grantState === "active"
                        ? "Preview, print, and external handoff remain secondary to the summary and are bound to the current return anchor."
                        : artifactState.grantState === "blocked"
                          ? "Review posture blocks richer artifact movement and keeps the route on the last safe summary."
                          : "The summary remains the legal surface while preview and handoff stay closed in this posture."
                    }
                    grantState={artifactState.grantState}
                    rows={artifactState.grantRows}
                  />
                  {artifactState.grantState !== "active" ? (
                    <GovernedPlaceholderSummary
                      title="Why richer artifact detail is held back"
                      summary="Hidden or detached detail does not disappear silently. The route explains why the summary remains primary."
                      rows={artifactState.placeholderRows}
                      reasonLabel={
                        artifactState.grantState === "blocked"
                          ? "review posture"
                          : responsiveProfile.embeddedMode === "nhs_app"
                            ? "embedded summary-only"
                            : "awaiting confirmation"
                      }
                    />
                  ) : null}
                  <ArtifactHandoffActionBar
                    toolbarLabel="Confirmation artifact actions"
                    actions={artifactState.actions}
                    activeActionId={activeArtifactActionId}
                    onAction={onArtifactAction}
                  />
                  {artifactReceipt ? (
                    <ReturnAnchorReceipt
                      title={artifactReceipt.title}
                      summary={artifactReceipt.summary}
                      anchorLabel={artifactReceipt.anchorLabel}
                      state={artifactReceipt.state}
                      onReturn={returnToSummaryAnchor}
                    />
                  ) : null}
                </CrossOrgArtifactSurfaceFrame>
                {responsive.missionStackState === "folded" ? (
                  <ConfirmationDisclosureStrip rows={projection.disclosureRows} />
                ) : null}
                <WhatNextBlock items={projection.nextSteps} />
                <ManageStub
                  label={projection.manageStubLabel}
                  summary={projection.manageStubSummary}
                  onAction={openManagedFollowOn}
                />
              </div>
            }
          />
        </main>
        <div
          className="patient-booking__live"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="patient-network-confirmation-live-region"
        >
          {announcement}
        </div>
      </EmbeddedBookingChromeAdapter>
    </div>
  );
}

export default function PatientNetworkConfirmationView() {
  return (
    <BookingResponsiveProvider>
      <PatientNetworkConfirmationViewInner />
    </BookingResponsiveProvider>
  );
}
