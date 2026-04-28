import { startTransition, useEffect, useRef, useState, type RefObject } from "react";
import {
  AccessibleTimelineStatusAnnotations,
  ArtifactHandoffActionBar,
  ArtifactParityBanner,
  CrossOrgArtifactSurfaceFrame,
  CrossOrgContentLegend,
  CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE,
  GrantBoundPreviewState,
  GovernedPlaceholderSummary,
  ReturnAnchorReceipt,
  VecellLogoWordmark,
  type CrossOrgArtifactAction,
  type CrossOrgArtifactGrantState,
  type CrossOrgArtifactStageMode,
  type CrossOrgContentLegendItem,
  type CrossOrgTimelineStatusAnnotation,
} from "@vecells/design-system";
import "@vecells/design-system/cross-org-artifact-handoff.css";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import "./patient-network-manage.css";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";
import {
  BookingResponsiveProvider,
  BookingResponsiveStage,
  BookingStickyActionTray,
  EmbeddedBookingChromeAdapter,
  useBookingResponsive,
} from "./patient-booking-responsive";
import {
  PATIENT_NETWORK_MANAGE_TASK_ID,
  PATIENT_NETWORK_MANAGE_VISUAL_MODE,
  isPatientNetworkManagePath,
  resolvePatientNetworkManagePath,
  resolvePatientNetworkManageProjectionByScenarioId,
  resolvePatientNetworkManageScenarioId,
  type ContactRouteRepairInlineJourneyProjection330,
  type HubManageSettlementPanelProjection330,
  type MessageTimelineClusterProjection330,
  type NetworkManageActionPanelProjection330,
  type NetworkManageActionProjection330,
  type NetworkManageCapabilityPanelProjection330,
  type NetworkManageReadOnlyStateProjection330,
  type NetworkManageScenarioId330,
  type PatientNetworkManageProjection330,
  type ReminderDeliveryStateCardProjection330,
  type ReminderTimelineNoticeProjection330,
} from "./patient-network-manage.model";

export { isPatientNetworkManagePath };

const NETWORK_MANAGE_RESTORE_STORAGE_KEY = "patient-network-manage-330::restore-bundle";

interface NetworkManageRestoreBundle330 {
  readonly projectionName: "NetworkManageRestoreBundle330";
  readonly pathname: string;
  readonly search: string;
  readonly scenarioId: NetworkManageScenarioId330;
  readonly selectedTimelineRowId: string;
  readonly shellContinuityKey: string;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function resolveInitialScenario(): NetworkManageScenarioId330 {
  const pathname = safeWindow()?.location.pathname ?? "/bookings/network/manage/network_manage_330_live";
  return resolvePatientNetworkManageScenarioId(pathname) ?? "network_manage_330_live";
}

function readRestoreBundle(): NetworkManageRestoreBundle330 | null {
  const ownerWindow = safeWindow();
  const historyState = ownerWindow?.history.state as
    | { networkManage?: NetworkManageRestoreBundle330 }
    | undefined;
  if (historyState?.networkManage?.projectionName === "NetworkManageRestoreBundle330") {
    return historyState.networkManage;
  }

  const raw = ownerWindow?.sessionStorage.getItem(NETWORK_MANAGE_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as NetworkManageRestoreBundle330;
    return parsed.projectionName === "NetworkManageRestoreBundle330" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: NetworkManageRestoreBundle330, replace = true): void {
  const ownerWindow = safeWindow();
  ownerWindow?.sessionStorage.setItem(
    NETWORK_MANAGE_RESTORE_STORAGE_KEY,
    JSON.stringify(bundle),
  );
  const nextState = {
    ...(ownerWindow?.history.state ?? {}),
    networkManage: bundle,
  };
  if (replace) {
    ownerWindow?.history.replaceState(nextState, "", `${bundle.pathname}${bundle.search}`);
    return;
  }
  ownerWindow?.history.pushState(nextState, "", `${bundle.pathname}${bundle.search}`);
}

function buildShellContinuityKey(projection: PatientNetworkManageProjection330): string {
  return [
    "patient-network-manage",
    projection.caseId,
    projection.appointmentRef,
    projection.selectedAnchorRef,
  ].join("::");
}

function flattenTimelineRows(
  projection: PatientNetworkManageProjection330,
): readonly ReminderTimelineNoticeProjection330[] {
  return projection.timelineClusters.flatMap((cluster) => cluster.rows);
}

function coerceTimelineSelection(
  projection: PatientNetworkManageProjection330,
  selectedTimelineRowId: string | null,
): string {
  return (
    flattenTimelineRows(projection).find((row) => row.rowId === selectedTimelineRowId)?.rowId ??
    projection.focusedTimelineRowId
  );
}

function findTimelineRow(
  projection: PatientNetworkManageProjection330,
  selectedTimelineRowId: string,
): ReminderTimelineNoticeProjection330 | null {
  return (
    flattenTimelineRows(projection).find((row) => row.rowId === selectedTimelineRowId) ?? null
  );
}

function actionButtonClass(tone: NetworkManageActionProjection330["tone"]): string {
  if (tone === "primary") {
    return "patient-booking__primary-action";
  }
  if (tone === "warn") {
    return "patient-booking__danger-action";
  }
  return "patient-booking__secondary-action";
}

type ManageArtifactActionId =
  | "preview"
  | "print"
  | "download"
  | "export"
  | "external_handoff";

interface ManageArtifactReceipt {
  readonly actionId: ManageArtifactActionId;
  readonly title: string;
  readonly summary: string;
  readonly anchorLabel: string;
  readonly state: "safe" | "guarded" | "blocked";
}

function manageContentLegendItems(): readonly CrossOrgContentLegendItem[] {
  return [
    {
      term: "Manage live",
      meaning:
        "The current capability tuple allows changes from this route. This does not change the booked confirmation wording by itself.",
      tone: "verified",
    },
    {
      term: "Provider pending",
      meaning:
        "The requested change is visible here, but the provider has not yet settled it authoritatively.",
      tone: "preview",
    },
    {
      term: "Callback fallback",
      meaning:
        "Fallback remains a separate bounded route inside the same timeline. It does not replace confirmed appointment truth unless the route says so.",
      tone: "warning",
    },
  ];
}

function manageTimelineAnnotations(
  projection: PatientNetworkManageProjection330,
): readonly CrossOrgTimelineStatusAnnotation[] {
  return flattenTimelineRows(projection).map((row) => ({
    annotationId: row.rowId,
    label: row.anchorLabel,
    state: row.stateLabel,
    detail: row.detail,
  }));
}

function resolveManageArtifactState(input: {
  projection: PatientNetworkManageProjection330;
  embeddedMode: "browser" | "nhs_app";
  activeActionId: ManageArtifactActionId | null;
}) {
  const blocked =
    input.projection.capabilityPanel.capabilityState === "blocked" ||
    input.projection.capabilityPanel.capabilityState === "expired";
  const summaryOnly =
    blocked ||
    input.embeddedMode === "nhs_app" ||
    input.projection.capabilityPanel.readOnlyMode === "read_only";
  const grantState: CrossOrgArtifactGrantState = blocked
    ? "blocked"
    : summaryOnly
      ? "summary_only"
      : "active";
  const previewAllowed = grantState === "active";
  const printAllowed = grantState === "active";
  const downloadAllowed = grantState !== "blocked" && input.embeddedMode !== "nhs_app";
  const exportAllowed = downloadAllowed;
  const handoffAllowed = grantState === "active";

  let stageMode: CrossOrgArtifactStageMode = "summary_first";
  if (input.activeActionId === "preview" && previewAllowed) {
    stageMode = "preview";
  } else if (input.activeActionId === "print" && printAllowed) {
    stageMode = "print";
  } else if (input.activeActionId === "download" && downloadAllowed) {
    stageMode = "download";
  } else if (input.activeActionId === "export" && exportAllowed) {
    stageMode = "export";
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
        ? "Preview remains inside this manage route and keeps the current anchor."
        : "Preview is held while this route stays summary-first or read-only.",
      disabled: !previewAllowed,
      tone: "primary",
    },
    {
      actionId: "print",
      label: "Print timeline summary",
      detail: printAllowed
        ? "Print keeps the same message context and return anchor."
        : "Print remains secondary until the current route can arm it lawfully.",
      disabled: !printAllowed,
    },
    {
      actionId: "download",
      label: "Download summary",
      detail: downloadAllowed
        ? "Download stays tied to the same manage lineage."
        : "Download is closed in the current host or review posture.",
      disabled: !downloadAllowed,
    },
    {
      actionId: "export",
      label: "Export timeline summary",
      detail: exportAllowed
        ? "Export preserves the selected timeline row and current appointment anchor."
        : "Export is not widened from this posture.",
      disabled: !exportAllowed,
    },
    {
      actionId: "external_handoff",
      label: "Open external handoff",
      detail: handoffAllowed
        ? "Handoff stays grant-bound and return-safe."
        : "External handoff stays blocked while this route is read-only or under review.",
      disabled: !handoffAllowed,
    },
  ];

  return {
    actions,
    grantState,
    stageMode,
    parityLabel:
      grantState === "active"
        ? "Manage summary verified"
        : grantState === "blocked"
          ? "Recovery posture"
          : input.embeddedMode === "nhs_app"
            ? "Embedded summary-only"
            : "Read-only summary",
    authorityLabel:
      input.projection.capabilityPanel.readOnlyMode === "interactive"
        ? "Current capability tuple"
        : "Current read-only settlement",
    placeholderRows: [
      {
        label: "Current posture",
        value:
          input.projection.capabilityPanel.readOnlyMode === "interactive"
            ? "Interactive manage route"
            : "Read-only manage route",
      },
      {
        label: "Reason richer movement is held back",
        value: blocked
          ? "A current dependency or recovery posture blocks richer artifact movement"
          : input.embeddedMode === "nhs_app"
            ? "Embedded host keeps the route summary-first"
            : "This route preserves summary-first continuity while mutation is paused",
      },
      {
        label: "Preserved anchor",
        value: input.projection.selectedAnchorRef,
      },
    ],
    grantRows: [
      { label: "Grant state", value: grantState.replaceAll("_", " ") },
      { label: "Current message context", value: input.projection.messageContextLabel },
      { label: "Return anchor", value: "Manage summary / selected timeline row" },
    ],
  };
}

function ManageSummaryCard(props: {
  projection: PatientNetworkManageProjection330;
  selectedRow: ReminderTimelineNoticeProjection330 | null;
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={props.sectionRef}
      className="patient-network-manage__card patient-network-manage__card--summary"
      data-testid="network-manage-summary-card"
      tabIndex={-1}
    >
      <div className="patient-network-manage__section-head">
        <span className="patient-booking__eyebrow">NetworkAppointmentManageView</span>
        <h2>{props.projection.appointmentHeading}</h2>
        <p>{props.projection.body}</p>
      </div>
      <div className="patient-network-manage__summary-grid">
        <dl className="patient-network-manage__fact-list">
          {props.projection.appointmentRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <dl className="patient-network-manage__fact-list patient-network-manage__fact-list--compact">
          {props.projection.statusRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {props.selectedRow ? (
        <div className="patient-network-manage__context-strip" data-testid="network-manage-context-strip">
          <span>Current message context</span>
          <strong>{props.selectedRow.anchorLabel}</strong>
          <small>{props.selectedRow.timeLabel}</small>
        </div>
      ) : null}
    </section>
  );
}

function NetworkManageCapabilityPanel(props: {
  projection: NetworkManageCapabilityPanelProjection330;
}) {
  const capabilityNames =
    props.projection.capabilityRefs.length > 0
      ? props.projection.capabilityRefs.join("|")
      : "none";

  return (
    <section
      className="patient-network-manage__card"
      data-testid="NetworkManageCapabilityPanel"
      data-manage-capability={props.projection.capabilityState}
      data-capability-refs={capabilityNames}
    >
      <div className="patient-network-manage__section-head">
        <span className="patient-booking__eyebrow">NetworkManageCapabilityPanel</span>
        <h3>{props.projection.heading}</h3>
        <p>{props.projection.body}</p>
      </div>
      <div className="patient-network-manage__summary-grid">
        <dl className="patient-network-manage__fact-list patient-network-manage__fact-list--compact">
          {props.projection.statusRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <dl className="patient-network-manage__fact-list patient-network-manage__fact-list--compact">
          {props.projection.blockerRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ReminderDeliveryStateCard(props: {
  projection: ReminderDeliveryStateCardProjection330;
}) {
  return (
    <section
      className="patient-network-manage__card patient-network-manage__card--delivery"
      data-testid="ReminderDeliveryStateCard"
      data-delivery-state={props.projection.deliveryState}
    >
      <div className="patient-network-manage__section-head">
        <span className="patient-booking__eyebrow">ReminderDeliveryStateCard</span>
        <h3>{props.projection.heading}</h3>
        <p>{props.projection.body}</p>
      </div>
      <dl className="patient-network-manage__fact-list patient-network-manage__fact-list--compact">
        {props.projection.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ReminderTimelineNotice(props: {
  projection: ReminderTimelineNoticeProjection330;
  selected: boolean;
  onSelect: (rowId: string) => void;
}) {
  return (
    <li
      className="patient-network-manage__timeline-row"
      data-testid={`timeline-row-${props.projection.rowId}`}
      data-row-kind={props.projection.rowKind}
      data-row-tone={props.projection.tone}
      data-selected={props.selected}
      data-reminder-row={
        props.projection.subthreadType === "reminder" ? props.projection.rowKind : undefined
      }
      data-callback-fallback={
        props.projection.rowKind === "callback_fallback" ? "true" : undefined
      }
    >
      <button
        type="button"
        className="patient-network-manage__timeline-button"
        aria-expanded={props.selected}
        aria-current={props.selected ? "step" : undefined}
        onClick={() => props.onSelect(props.projection.rowId)}
      >
        <div className="patient-network-manage__timeline-copy">
          <span className="patient-network-manage__timeline-state">
            {props.projection.stateLabel}
          </span>
          <strong>{props.projection.title}</strong>
          <p>{props.projection.detail}</p>
        </div>
        <span className="patient-network-manage__timeline-time">{props.projection.timeLabel}</span>
      </button>
    </li>
  );
}

function ConversationReminderSubthread(props: {
  projection: MessageTimelineClusterProjection330;
  selectedTimelineRowId: string;
  onSelect: (rowId: string) => void;
}) {
  return (
    <section
      className="patient-network-manage__subthread"
      data-testid={`subthread-${props.projection.clusterId}`}
      data-subthread-type={props.projection.subthreadType}
    >
      <div className="patient-network-manage__subthread-head">
        <h4>{props.projection.heading}</h4>
        <p>{props.projection.summary}</p>
      </div>
      <ol className="patient-network-manage__timeline-list">
        {props.projection.rows.map((row) => (
          <ReminderTimelineNotice
            key={row.rowId}
            projection={row}
            selected={props.selectedTimelineRowId === row.rowId}
            onSelect={props.onSelect}
          />
        ))}
      </ol>
    </section>
  );
}

function MessageTimelineClusterView(props: {
  projection: PatientNetworkManageProjection330;
  selectedTimelineRowId: string;
  onSelect: (rowId: string) => void;
  describedBy?: string;
}) {
  return (
    <section
      className="patient-network-manage__card patient-network-manage__card--timeline"
      data-testid="MessageTimelineClusterView"
      data-message-timeline={props.projection.threadId}
      aria-describedby={props.describedBy}
      tabIndex={-1}
    >
      <div className="patient-network-manage__section-head">
        <span className="patient-booking__eyebrow">MessageTimelineClusterView</span>
        <h3>Message timeline</h3>
        <p>
          Reminder notices, delivery failures, callback fallback, and manage settlements stay in
          one current conversation grammar.
        </p>
      </div>
      <div className="patient-network-manage__timeline-clusters">
        {props.projection.timelineClusters.map((cluster) => (
          <ConversationReminderSubthread
            key={cluster.clusterId}
            projection={cluster}
            selectedTimelineRowId={props.selectedTimelineRowId}
            onSelect={props.onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function HubManageSettlementPanel(props: {
  projection: HubManageSettlementPanelProjection330;
  onAction: (action: NetworkManageActionProjection330) => void;
}) {
  return (
    <section
      className="patient-network-manage__card patient-network-manage__card--settlement"
      data-testid="HubManageSettlementPanel"
      data-manage-settlement={props.projection.settlementResult}
    >
      <div className="patient-network-manage__section-head">
        <span className="patient-booking__eyebrow">HubManageSettlementPanel</span>
        <h3>{props.projection.heading}</h3>
        <p>{props.projection.body}</p>
      </div>
      <dl className="patient-network-manage__fact-list patient-network-manage__fact-list--compact">
        {props.projection.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {props.projection.action ? (
        <div className="patient-network-manage__inline-actions">
          <button
            type="button"
            className={actionButtonClass(props.projection.action.tone)}
            onClick={() => props.onAction(props.projection.action!)}
          >
            {props.projection.action.label}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ContactRouteRepairInlineJourney(props: {
  projection: ContactRouteRepairInlineJourneyProjection330;
  onAction: (action: NetworkManageActionProjection330) => void;
}) {
  return (
    <section
      className="patient-network-manage__card patient-network-manage__card--repair"
      data-testid="ContactRouteRepairInlineJourney"
      data-contact-repair={props.projection.repairState}
    >
      <div className="patient-network-manage__section-head">
        <span className="patient-booking__eyebrow">ContactRouteRepairInlineJourney</span>
        <h3>{props.projection.heading}</h3>
        <p>{props.projection.body}</p>
      </div>
      <dl className="patient-network-manage__fact-list patient-network-manage__fact-list--compact">
        {props.projection.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="patient-network-manage__inline-actions">
        {props.projection.primaryAction ? (
          <button
            type="button"
            className={actionButtonClass(props.projection.primaryAction.tone)}
            onClick={() => props.onAction(props.projection.primaryAction!)}
          >
            {props.projection.primaryAction.label}
          </button>
        ) : null}
        {props.projection.secondaryAction ? (
          <button
            type="button"
            className={actionButtonClass(props.projection.secondaryAction.tone)}
            onClick={() => props.onAction(props.projection.secondaryAction!)}
          >
            {props.projection.secondaryAction.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function NetworkManageReadOnlyState(props: {
  projection: NetworkManageReadOnlyStateProjection330;
}) {
  return (
    <section
      className="patient-network-manage__card patient-network-manage__card--readonly"
      data-testid="NetworkManageReadOnlyState"
      data-read-only-reason={props.projection.reason}
    >
      <div className="patient-network-manage__section-head">
        <span className="patient-booking__eyebrow">NetworkManageReadOnlyState</span>
        <h3>{props.projection.heading}</h3>
        <p>{props.projection.body}</p>
      </div>
      <dl className="patient-network-manage__fact-list patient-network-manage__fact-list--compact">
        {props.projection.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function NetworkManageActionPanel(props: {
  projection: NetworkManageActionPanelProjection330;
  onAction: (action: NetworkManageActionProjection330) => void;
}) {
  return (
    <section className="patient-network-manage__card" data-testid="NetworkManageActionPanel">
      <div className="patient-network-manage__section-head">
        <span className="patient-booking__eyebrow">NetworkManageActionPanel</span>
        <h3>{props.projection.heading}</h3>
        <p>{props.projection.body}</p>
      </div>
      <div className="patient-network-manage__action-grid">
        <div className="patient-network-manage__action-column">
          <span className="patient-network-manage__action-label">Primary</span>
          {props.projection.primaryActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={actionButtonClass(action.tone)}
              data-action-ref={action.actionRef}
              onClick={() => props.onAction(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
        <div className="patient-network-manage__action-column">
          <span className="patient-network-manage__action-label">Secondary</span>
          {props.projection.secondaryActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={actionButtonClass(action.tone)}
              data-action-ref={action.actionRef}
              onClick={() => props.onAction(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      <p className="patient-network-manage__footer-note">{props.projection.footerNote}</p>
    </section>
  );
}

function useNetworkManageController() {
  const ownerWindow = safeWindow();
  const initialScenarioId = resolveInitialScenario();
  const initialProjection = resolvePatientNetworkManageProjectionByScenarioId(initialScenarioId);
  const initialRestore = readRestoreBundle();
  const initialShellContinuityKey = buildShellContinuityKey(initialProjection);
  const [projection, setProjection] = useState(initialProjection);
  const [selectedTimelineRowId, setSelectedTimelineRowId] = useState(
    coerceTimelineSelection(
      initialProjection,
      initialRestore?.shellContinuityKey === initialShellContinuityKey &&
        initialRestore.scenarioId === initialScenarioId
        ? initialRestore.selectedTimelineRowId
        : initialProjection.focusedTimelineRowId,
    ),
  );
  const [announcement, setAnnouncement] = useState(initialProjection.liveAnnouncement);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const bundle: NetworkManageRestoreBundle330 = {
      projectionName: "NetworkManageRestoreBundle330",
      pathname: ownerWindow?.location.pathname ?? resolvePatientNetworkManagePath(projection.scenarioId),
      search: ownerWindow?.location.search ?? "",
      scenarioId: projection.scenarioId,
      selectedTimelineRowId,
      shellContinuityKey: buildShellContinuityKey(projection),
    };
    writeRestoreBundle(bundle);
  }, [ownerWindow, projection, selectedTimelineRowId]);

  useEffect(() => {
    const onPopState = () => {
      const pathname = ownerWindow?.location.pathname ?? resolvePatientNetworkManagePath(projection.scenarioId);
      const scenarioId = resolvePatientNetworkManageScenarioId(pathname) ?? projection.scenarioId;
      const nextProjection = resolvePatientNetworkManageProjectionByScenarioId(scenarioId);
      const restore = readRestoreBundle();
      const nextShellContinuityKey = buildShellContinuityKey(nextProjection);
      startTransition(() => {
        setProjection(nextProjection);
        setSelectedTimelineRowId(
          coerceTimelineSelection(
            nextProjection,
            restore?.shellContinuityKey === nextShellContinuityKey &&
              restore.scenarioId === scenarioId
              ? restore.selectedTimelineRowId
              : nextProjection.focusedTimelineRowId,
          ),
        );
        setAnnouncement(`${nextProjection.heading} restored.`);
      });
    };

    ownerWindow?.addEventListener("popstate", onPopState);
    return () => ownerWindow?.removeEventListener("popstate", onPopState);
  }, [ownerWindow, projection.scenarioId, projection.heading]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [projection.scenarioId]);

  function navigateScenario(
    scenarioId: NetworkManageScenarioId330,
    message: string,
    selectedRowOverride?: string,
  ): void {
    const nextProjection = resolvePatientNetworkManageProjectionByScenarioId(scenarioId);
    const nextSelectedRowId = coerceTimelineSelection(
      nextProjection,
      selectedRowOverride ?? selectedTimelineRowId,
    );
    const bundle: NetworkManageRestoreBundle330 = {
      projectionName: "NetworkManageRestoreBundle330",
      pathname: resolvePatientNetworkManagePath(scenarioId),
      search: ownerWindow?.location.search ?? "",
      scenarioId,
      selectedTimelineRowId: nextSelectedRowId,
      shellContinuityKey: buildShellContinuityKey(nextProjection),
    };
    startTransition(() => {
      setProjection(nextProjection);
      setSelectedTimelineRowId(nextSelectedRowId);
      setAnnouncement(message);
    });
    writeRestoreBundle(bundle, false);
  }

  function onSelectTimelineRow(rowId: string): void {
    const currentRow = findTimelineRow(projection, rowId);
    if (!currentRow) {
      return;
    }
    setSelectedTimelineRowId(rowId);
    setAnnouncement(`${currentRow.anchorLabel} selected.`);
  }

  function onAction(actionProjection: NetworkManageActionProjection330): void {
    if (actionProjection.transitionScenarioId) {
      navigateScenario(actionProjection.transitionScenarioId, actionProjection.announcement);
      return;
    }
    setAnnouncement(actionProjection.announcement);
  }

  return {
    projection,
    selectedTimelineRowId,
    selectedRow: findTimelineRow(projection, selectedTimelineRowId),
    announcement,
    headingRef,
    onAction,
    onSelectTimelineRow,
  };
}

function PatientNetworkManageViewInner() {
  const controller = useNetworkManageController();
  const [activeArtifactActionId, setActiveArtifactActionId] =
    useState<ManageArtifactActionId | null>(null);
  const [artifactReceipt, setArtifactReceipt] = useState<ManageArtifactReceipt | null>(null);
  const [artifactAnnouncement, setArtifactAnnouncement] = useState("");
  const summaryRef = useRef<HTMLElement>(null);
  const timelineAnnotationsId = "network-manage-timeline-annotations";
  const responsive = useBookingResponsive();
  const stickyVisible = responsive.missionStackState === "folded";
  const profile = responsive.resolveProfile(stickyVisible);
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: safeWindow()?.location.pathname ?? controller.projection.pathname,
    search: safeWindow()?.location.search,
  });
  const artifactState = resolveManageArtifactState({
    projection: controller.projection,
    embeddedMode: profile.embeddedMode,
    activeActionId: activeArtifactActionId,
  });

  const primaryStickyAction =
    controller.projection.actionPanel.primaryActions[0] ??
    controller.projection.settlementPanel?.action ??
    controller.projection.contactRepairJourney?.primaryAction ??
    null;

  function focusTimeline(): void {
    safeDocument()
      ?.querySelector<HTMLElement>("[data-testid='MessageTimelineClusterView']")
      ?.focus({ preventScroll: true });
    startTransition(() => {
      controller.onSelectTimelineRow(controller.selectedTimelineRowId);
    });
  }

  function returnToManageAnchor(): void {
    summaryRef.current?.focus({ preventScroll: true });
    summaryRef.current?.scrollIntoView({ block: "start", inline: "nearest" });
    setArtifactAnnouncement("Returned to the network manage summary.");
    startTransition(() => {
      controller.onSelectTimelineRow(controller.selectedTimelineRowId);
    });
  }

  function onArtifactAction(actionId: string): void {
    const action = artifactState.actions.find((candidate) => candidate.actionId === actionId);
    if (!action) {
      return;
    }

    const normalizedActionId = action.actionId as ManageArtifactActionId;
    setActiveArtifactActionId(normalizedActionId);
    if (action.disabled) {
      setArtifactReceipt({
        actionId: normalizedActionId,
        title: `${action.label} stayed inside the summary-first stage`,
        summary: action.detail,
        anchorLabel: "Network manage summary",
        state: artifactState.grantState === "blocked" ? "blocked" : "guarded",
      });
      setArtifactAnnouncement(`${action.label} is not available. The summary remains primary.`);
      return;
    }

    const message =
      normalizedActionId === "preview"
        ? "Preview opened in the current manage stage."
        : normalizedActionId === "print"
          ? "Print posture armed from the current manage stage."
          : normalizedActionId === "download"
            ? "Download summary prepared from the current manage route."
            : normalizedActionId === "export"
              ? "Timeline summary export prepared without losing the current anchor."
              : "External handoff prepared with the same return anchor.";
    setArtifactReceipt({
      actionId: normalizedActionId,
      title: action.label,
      summary: message,
      anchorLabel: "Network manage summary",
      state: "safe",
    });
    setArtifactAnnouncement(message);
  }

  return (
    <div
      className="patient-booking patient-network-manage"
      data-testid="Patient_Network_Manage_Route"
      data-task-id={PATIENT_NETWORK_MANAGE_TASK_ID}
      data-visual-mode={PATIENT_NETWORK_MANAGE_VISUAL_MODE}
      data-network-manage="true"
      data-manage-scenario={controller.projection.scenarioId}
      data-manage-capability-state={controller.projection.capabilityPanel.capabilityState}
      data-manage-read-only-mode={controller.projection.capabilityPanel.readOnlyMode}
      data-selected-timeline-row={controller.selectedTimelineRowId}
      data-message-context={controller.selectedRow?.anchorLabel ?? controller.projection.messageContextLabel}
      data-manage-settlement={
        controller.projection.settlementPanel?.settlementResult ?? "none"
      }
      data-contact-repair={
        controller.projection.contactRepairJourney?.repairState ?? "hidden"
      }
      data-breakpoint-class={profile.breakpointClass}
      data-mission-stack-state={profile.missionStackState}
      data-safe-area-class={profile.safeAreaClass}
      data-sticky-action-posture={profile.stickyActionPosture}
      data-embedded-mode={profile.embeddedMode}
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
            ref={controller.headingRef}
            tabIndex={-1}
            className="patient-booking__route-title"
            data-testid="patient-network-manage-heading"
          >
            Network appointment manage
          </h1>
          <BookingResponsiveStage
            stageName="Network appointment manage"
            testId="patient-network-manage-stage"
            railToggleLabel="Open timeline detail"
            railTitle="Reminder and delivery detail"
            stickyTray={
              stickyVisible && primaryStickyAction ? (
                <BookingStickyActionTray
                  testId="network-manage-sticky-tray"
                  title={controller.projection.heading}
                  detail={controller.projection.patientFacingReference}
                  primaryActionLabel={primaryStickyAction.label}
                  primaryActionRef={primaryStickyAction.actionRef}
                  primaryTestId="network-manage-sticky-primary"
                  onPrimaryAction={() => controller.onAction(primaryStickyAction)}
                  secondaryActionLabel="Review timeline"
                  onSecondaryAction={focusTimeline}
                />
              ) : undefined
            }
            rail={
              <div className="patient-network-manage__rail">
                <ReminderDeliveryStateCard projection={controller.projection.deliveryStateCard} />
                <section className="patient-network-manage__card" data-testid="network-manage-support-card">
                  <div className="patient-network-manage__section-head">
                    <span className="patient-booking__eyebrow">Current shell context</span>
                    <h3>Why this route can stay calm or bounded</h3>
                  </div>
                  <dl className="patient-network-manage__fact-list patient-network-manage__fact-list--compact">
                    {controller.projection.supportRows.map((row) => (
                      <div key={row.label}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <CrossOrgContentLegend
                  title="Cross-organisation wording legend"
                  summary="Reminder, manage, and fallback surfaces keep one restrained phrase set across patient and hub views."
                  items={manageContentLegendItems()}
                />
              </div>
            }
            main={
              <div className="patient-network-manage__main-column">
                <ManageSummaryCard
                  projection={controller.projection}
                  selectedRow={controller.selectedRow}
                  sectionRef={summaryRef}
                />
                <CrossOrgArtifactSurfaceFrame
                  testId="network-manage-artifact-frame"
                  contextId="network_manage"
                  visualMode={CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE}
                  tone={artifactState.grantState === "blocked" ? "blocked" : artifactState.grantState === "active" ? "verified" : "warning"}
                  eyebrow="Governed artifact stage"
                  title="Manage summary and handoff stage"
                  summary="Reminder delivery, current settlement, and secondary artifact actions stay inside one summary-first manage stage."
                  metadata={
                    <>
                      <span className="cross-org-artifact-chip">{artifactState.parityLabel}</span>
                      <span className="cross-org-artifact-chip">{artifactState.authorityLabel}</span>
                    </>
                  }
                >
                  <ArtifactParityBanner
                    title="Current manage artifact parity"
                    summary={
                      artifactState.grantState === "active"
                        ? "The current manage route can keep preview, print, export, and handoff secondary and return-safe."
                        : "This route keeps the summary and current message context primary while richer movement stays bounded."
                    }
                    tone={
                      artifactState.grantState === "blocked"
                        ? "blocked"
                        : artifactState.grantState === "active"
                          ? "verified"
                          : "warning"
                    }
                    parityLabel={artifactState.parityLabel}
                    authorityLabel={artifactState.authorityLabel}
                    stageMode={artifactState.stageMode}
                  />
                  <GrantBoundPreviewState
                    title="Preview and export scope"
                    summary={
                      artifactState.grantState === "active"
                        ? "Preview, print, export, and handoff remain secondary to the current manage summary and selected timeline row."
                        : artifactState.grantState === "blocked"
                          ? "Recovery posture blocks richer movement and keeps the route on the last safe summary."
                          : "The route remains summary-first while capability or host posture stays restricted."
                    }
                    grantState={artifactState.grantState}
                    rows={artifactState.grantRows}
                  />
                  {artifactState.grantState !== "active" ? (
                    <GovernedPlaceholderSummary
                      title="Why richer artifact detail is held back"
                      summary="When preview or handoff is not lawful, the route keeps the same summary and explains the ceiling instead of silently dropping detail."
                      rows={artifactState.placeholderRows}
                      reasonLabel={
                        artifactState.grantState === "blocked"
                          ? "recovery posture"
                          : profile.embeddedMode === "nhs_app"
                            ? "embedded summary-only"
                            : "read-only summary"
                      }
                    />
                  ) : null}
                  <ArtifactHandoffActionBar
                    toolbarLabel="Manage artifact actions"
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
                      onReturn={returnToManageAnchor}
                    />
                  ) : null}
                </CrossOrgArtifactSurfaceFrame>
                <NetworkManageCapabilityPanel
                  projection={controller.projection.capabilityPanel}
                />
                {controller.projection.readOnlyState ? (
                  <NetworkManageReadOnlyState
                    projection={controller.projection.readOnlyState}
                  />
                ) : null}
                <div id={timelineAnnotationsId}>
                  <AccessibleTimelineStatusAnnotations
                    title="Timeline status annotations"
                    summary="The current reminder, callback, and manage rows expose compact status language before you move through the timeline."
                    annotations={manageTimelineAnnotations(controller.projection)}
                  />
                </div>
                <MessageTimelineClusterView
                  projection={controller.projection}
                  selectedTimelineRowId={controller.selectedTimelineRowId}
                  onSelect={controller.onSelectTimelineRow}
                  describedBy={timelineAnnotationsId}
                />
                {controller.projection.settlementPanel ? (
                  <HubManageSettlementPanel
                    projection={controller.projection.settlementPanel}
                    onAction={controller.onAction}
                  />
                ) : null}
                {controller.projection.contactRepairJourney ? (
                  <ContactRouteRepairInlineJourney
                    projection={controller.projection.contactRepairJourney}
                    onAction={controller.onAction}
                  />
                ) : null}
                <NetworkManageActionPanel
                  projection={controller.projection.actionPanel}
                  onAction={controller.onAction}
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
          data-testid="patient-network-manage-live-region"
        >
          {artifactAnnouncement || controller.announcement}
        </div>
      </EmbeddedBookingChromeAdapter>
    </div>
  );
}

export default function PatientNetworkManageView() {
  return (
    <BookingResponsiveProvider>
      <PatientNetworkManageViewInner />
    </BookingResponsiveProvider>
  );
}
