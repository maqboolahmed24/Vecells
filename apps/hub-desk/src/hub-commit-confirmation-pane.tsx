import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AccessibleTimelineStatusAnnotations,
  ArtifactHandoffActionBar,
  ArtifactParityBanner,
  CrossOrgArtifactSurfaceFrame,
  CrossOrgContentLegend,
  CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE,
  GrantBoundPreviewState,
  GovernedPlaceholderSummary,
  NetworkConfirmationArtifactStage,
  PracticeNotificationArtifactSummary,
  ReturnAnchorReceipt,
  type CrossOrgArtifactAction,
  type CrossOrgArtifactGrantState,
  type CrossOrgArtifactStageMode,
  type CrossOrgContentLegendItem,
  type CrossOrgTimelineStatusAnnotation,
} from "@vecells/design-system";
import "@vecells/design-system/cross-org-artifact-handoff.css";
import type { HubShellSnapshot } from "./hub-desk-shell.model";
import "./hub-commit-confirmation-pane.css";
import {
  resolveCrossOrgCommitScenario,
  type CrossOrgCommitPosture,
} from "../../../packages/domain-kernel/src/phase5-cross-org-confirmation-preview";

function publicCommitText(value: string): string {
  return value
    .replace(/\btuple\b/gi, "details")
    .replace(/\btruth\b/gi, "confirmed information")
    .replace(/\bposture\b/gi, "status")
    .replace(/\bsame[- ]shell\b/gi, "same case")
    .replace(/\bshell\b/gi, "workspace")
    .replace(/\blineage\b/gi, "history")
    .replace(/\bcontract\b/gi, "agreement")
    .replace(/\bprovenance\b/gi, "history")
    .replace(/\bstub\b/gi, "summary")
    .replace(/\bmanual_pending_confirmation\b/g, "manual confirmation pending")
    .replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/g, (token) =>
      token
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    );
}

function publicCommitRows(
  rows: readonly { label: string; value: string }[],
): readonly { label: string; value: string }[] {
  return rows.map((row) => ({
    label: publicCommitText(row.label),
    value: publicCommitText(row.value),
  }));
}

export interface HubCommitUiState {
  readonly postureByCaseId: Readonly<Record<string, CrossOrgCommitPosture>>;
  readonly manualProofCaseId: string | null;
  readonly continuityDrawerCaseId: string | null;
}

export function createInitialHubCommitUiState(): HubCommitUiState {
  return {
    postureByCaseId: {
      "hub-case-104": "candidate_revalidation",
      "hub-case-087": "confirmation_pending",
      "hub-case-066": "booked_pending_practice_ack",
      "hub-case-041": "supplier_drift",
    },
    manualProofCaseId: null,
    continuityDrawerCaseId: null,
  };
}

export function beginHubNativeBooking(state: HubCommitUiState, caseId: string): HubCommitUiState {
  return {
    ...state,
    postureByCaseId: {
      ...state.postureByCaseId,
      [caseId]: "native_booking_pending",
    },
    manualProofCaseId: caseId,
  };
}

export function attachHubManualProof(state: HubCommitUiState, caseId: string): HubCommitUiState {
  return {
    ...state,
    postureByCaseId: {
      ...state.postureByCaseId,
      [caseId]: "confirmation_pending",
    },
    manualProofCaseId: null,
  };
}

export function cancelHubManualProof(state: HubCommitUiState): HubCommitUiState {
  return {
    ...state,
    manualProofCaseId: null,
  };
}

export function recordHubSupplierConfirmation(
  state: HubCommitUiState,
  caseId: string,
): HubCommitUiState {
  return {
    ...state,
    postureByCaseId: {
      ...state.postureByCaseId,
      [caseId]: "booked_pending_practice_ack",
    },
  };
}

export function acknowledgeHubPracticeVisibility(
  state: HubCommitUiState,
  caseId: string,
): HubCommitUiState {
  return {
    ...state,
    postureByCaseId: {
      ...state.postureByCaseId,
      [caseId]: "booked",
    },
  };
}

export function toggleHubImportedReviewState(
  state: HubCommitUiState,
  caseId: string,
): HubCommitUiState {
  return {
    ...state,
    postureByCaseId: {
      ...state.postureByCaseId,
      [caseId]: state.postureByCaseId[caseId] === "disputed" ? "confirmation_pending" : "disputed",
    },
  };
}

export function toggleHubContinuityDrawer(
  state: HubCommitUiState,
  caseId: string,
): HubCommitUiState {
  return {
    ...state,
    continuityDrawerCaseId: state.continuityDrawerCaseId === caseId ? null : caseId,
  };
}

function toneClass(tone: "pending" | "confirmed" | "acknowledgement" | "warning" | "disputed") {
  switch (tone) {
    case "confirmed":
      return "confirmed";
    case "acknowledgement":
      return "acknowledgement";
    case "warning":
      return "warning";
    case "disputed":
      return "disputed";
    default:
      return "pending";
  }
}

type HubArtifactActionId = "preview" | "print" | "download" | "export" | "external_handoff";

interface HubArtifactReceipt {
  readonly actionId: HubArtifactActionId;
  readonly title: string;
  readonly summary: string;
  readonly anchorLabel: string;
  readonly state: "safe" | "guarded" | "blocked";
}

function hubContentLegendItems(): readonly CrossOrgContentLegendItem[] {
  return [
    {
      term: "Appointment confirmed",
      meaning:
        "Patient reassurance is current for the live generation only. It must not be softened into practice acknowledgement.",
      tone: "verified",
    },
    {
      term: "Practice informed",
      meaning:
        "An operational notice was sent to the origin practice. Acknowledgement can still be outstanding or reopened.",
      tone: "preview",
    },
    {
      term: "Practice acknowledged",
      meaning:
        "The practice confirmed receipt of the current generation. This remains a separate operational record.",
      tone: "neutral",
    },
  ];
}

function commitTimelineAnnotations(
  rows: readonly {
    rowId: string;
    label: string;
    detail: string;
    state: string;
  }[],
): readonly CrossOrgTimelineStatusAnnotation[] {
  return rows.map((row) => ({
    annotationId: row.rowId,
    label: row.label,
    state: row.state,
    detail: row.detail,
  }));
}

function resolveHubArtifactState(input: {
  projection: NonNullable<ReturnType<typeof resolveCrossOrgCommitScenario>>;
  artifactModeState: HubShellSnapshot["artifactModeState"];
  activeActionId: HubArtifactActionId | null;
}): {
  actions: readonly CrossOrgArtifactAction[];
  grantState: CrossOrgArtifactGrantState;
  stageMode: CrossOrgArtifactStageMode;
  tone: "neutral" | "verified" | "preview" | "warning" | "blocked";
  parityLabel: string;
  authorityLabel: string;
  grantRows: readonly { label: string; value: string }[];
  placeholderRows: readonly { label: string; value: string }[];
} {
  const reviewPosture =
    input.projection.posture === "supplier_drift" || input.projection.posture === "disputed";
  const grantState: CrossOrgArtifactGrantState = reviewPosture
    ? "blocked"
    : input.artifactModeState === "interactive_live" &&
        (input.projection.posture === "booked" ||
          input.projection.posture === "booked_pending_practice_ack")
      ? "active"
      : "summary_only";
  const previewAllowed = grantState === "active";
  const printAllowed = grantState === "active";
  const downloadAllowed = grantState !== "blocked";
  const exportAllowed = grantState !== "blocked";
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
        ? "Preview remains inside the audit ledger and keeps the same queue anchor."
        : "Preview stays summary-first while this audit route is quiet, table-only, or under review.",
      disabled: !previewAllowed,
      tone: "primary",
    },
    {
      actionId: "print",
      label: "Print proof summary",
      detail: printAllowed
        ? "Print uses this same approved stage before any browser step."
        : "Print remains secondary until the current details can support it.",
      disabled: !printAllowed,
    },
    {
      actionId: "download",
      label: "Download proof bundle",
      detail: downloadAllowed
        ? "Download keeps the same evidence rows and return anchor."
        : "Download is blocked while review status is active.",
      disabled: !downloadAllowed,
    },
    {
      actionId: "export",
      label: "Export practice summary",
      detail: exportAllowed
        ? "Export keeps the practice-safe summary separate from patient reassurance."
        : "Export stays closed in the current status.",
      disabled: !exportAllowed,
    },
    {
      actionId: "external_handoff",
      label: "Open external handoff",
      detail: handoffAllowed
        ? "Handoff remains scoped, secondary, and return-safe."
        : "External handoff remains blocked while the current details cannot support it.",
      disabled: !handoffAllowed,
    },
  ];

  return {
    actions,
    grantState,
    stageMode,
    tone:
      grantState === "blocked"
        ? "blocked"
        : stageMode === "preview" || stageMode === "print"
          ? "preview"
          : grantState === "active"
            ? "verified"
            : "warning",
    parityLabel:
      grantState === "active"
        ? "Summary verified"
        : grantState === "blocked"
          ? "Recovery status"
          : input.artifactModeState === "table_only"
            ? "Table-backed summary-only"
            : "Summary-first only",
      authorityLabel:
        input.projection.posture === "booked" || input.projection.posture === "booked_pending_practice_ack"
        ? "Booked verified details and continuity bundle"
        : reviewPosture
          ? "Reviewing current details"
          : "Structured evidence only",
    grantRows: [
      { label: "Grant state", value: grantState.replaceAll("_", " ") },
      { label: "Artifact mode", value: input.artifactModeState.replaceAll("_", " ") },
      { label: "Return anchor", value: "Settlement receipt / current audit ledger" },
    ],
    placeholderRows: [
      { label: "Current status", value: input.projection.truthLabel },
      {
        label: "Why richer movement is held back",
        value: reviewPosture
          ? "Review status or drift blocks preview and external movement"
          : input.artifactModeState === "table_only"
            ? "This shell is table-backed, so the summary remains primary"
            : "The current details have not widened richer movement yet",
      },
      {
        label: "Practice-safe ceiling",
        value: "Practice-informed and practice-acknowledged wording stay separate from patient calmness",
      },
    ],
  };
}

export function HubCommitSettlementReceipt(props: {
  snapshot: HubShellSnapshot;
  receiptRows: readonly { label: string; value: string }[];
  truthLabel: string;
  tone: "pending" | "confirmed" | "acknowledgement" | "warning" | "disputed";
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={props.sectionRef}
      className="hub-commit-ledger__receipt"
      data-testid="HubCommitSettlementReceipt"
      data-tone={toneClass(props.tone)}
      tabIndex={-1}
    >
      <div className="hub-commit-ledger__section-head">
        <div>
          <p className="hub-eyebrow">Settlement receipt</p>
          <h3>{publicCommitText(props.truthLabel)}</h3>
        </div>
        <span className="hub-commit-ledger__case-ref">{props.snapshot.currentCase.caseId}</span>
      </div>
      <dl className="hub-commit-ledger__receipt-list">
        {props.receiptRows.map((row) => (
          <div key={row.label}>
            <dt>{publicCommitText(row.label)}</dt>
            <dd>{publicCommitText(row.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function HubCommitAttemptTimeline(props: {
  rows: readonly {
    rowId: string;
    lane: string;
    label: string;
    detail: string;
    state: string;
    evidenceRef: string;
    timeLabel: string;
  }[];
  describedBy?: string;
}) {
  return (
    <section
      className="hub-commit-ledger__timeline"
      data-testid="HubCommitAttemptTimeline"
      data-commit-timeline="true"
      aria-describedby={props.describedBy}
    >
      <div className="hub-commit-ledger__section-head">
        <div>
          <p className="hub-eyebrow">Booking timeline</p>
          <h3>Commit attempt timeline</h3>
        </div>
        <span>Evidence and visibility stay on one ledger.</span>
      </div>
      <ol className="hub-commit-ledger__timeline-list">
        {props.rows.map((row) => (
          <li
            key={row.rowId}
            className="hub-commit-ledger__timeline-row"
            data-step-state={row.state}
            data-lane={row.lane}
          >
            <div className="hub-commit-ledger__timeline-marker" aria-hidden="true" />
            <div className="hub-commit-ledger__timeline-copy">
              <strong>{publicCommitText(row.label)}</strong>
              <p>{publicCommitText(row.detail)}</p>
              <small>
                {publicCommitText(row.timeLabel)} / {publicCommitText(row.evidenceRef)}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PracticeAcknowledgementIndicator(props: {
  acknowledgementState:
    | "not_started"
    | "transport_pending"
    | "ack_pending"
    | "acknowledged"
    | "reopened_by_drift";
  acknowledgementLabel: string;
}) {
  return (
    <div
      className="hub-commit-ledger__ack-indicator"
      data-testid="PracticeAcknowledgementIndicator"
      data-acknowledgement-state={props.acknowledgementState}
    >
      <span className="hub-eyebrow">Practice acknowledgement</span>
      <strong>{publicCommitText(props.acknowledgementLabel)}</strong>
    </div>
  );
}

export function PracticeVisibilityPanel(props: {
  summary: string;
  minimumNecessaryRows: readonly { label: string; value: string }[];
  patientFacingRows: readonly { label: string; value: string }[];
  acknowledgementState:
    | "not_started"
    | "transport_pending"
    | "ack_pending"
    | "acknowledged"
    | "reopened_by_drift";
  acknowledgementLabel: string;
}) {
  return (
    <section
      className="hub-commit-ledger__practice"
      data-testid="PracticeVisibilityPanel"
      data-practice-visibility="true"
    >
      <div className="hub-commit-ledger__section-head">
        <div>
          <p className="hub-eyebrow">Practice visibility</p>
          <h3>Origin practice visibility</h3>
        </div>
        <PracticeAcknowledgementIndicator
          acknowledgementState={props.acknowledgementState}
          acknowledgementLabel={props.acknowledgementLabel}
        />
      </div>
      <p className="hub-commit-ledger__section-summary">{publicCommitText(props.summary)}</p>
      <div className="hub-commit-ledger__practice-grid">
        <div>
          <h4>Minimum-necessary operational verified details</h4>
          <dl className="hub-commit-ledger__fact-list">
            {props.minimumNecessaryRows.map((row) => (
              <div key={row.label}>
                <dt>{publicCommitText(row.label)}</dt>
                <dd>{publicCommitText(row.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h4>Patient wording shown secondarily</h4>
          <dl className="hub-commit-ledger__fact-list">
            {props.patientFacingRows.map((row) => (
              <div key={row.label}>
                <dt>{publicCommitText(row.label)}</dt>
                <dd>{publicCommitText(row.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function ContinuityDeliveryEvidenceDrawer(props: {
  isOpen: boolean;
  heading: string;
  summary: string;
  evidenceRows: readonly { label: string; value: string }[];
  notificationPreview: {
    title: string;
    body: string;
    rows: readonly { label: string; value: string }[];
  };
  onToggle: () => void;
}) {
  const contentId = "hub-continuity-drawer";
  return (
    <section
      className="hub-commit-ledger__continuity"
      data-testid="ContinuityDeliveryEvidenceDrawer"
      data-open={props.isOpen ? "true" : "false"}
    >
      <div className="hub-commit-ledger__section-head">
        <div>
          <p className="hub-eyebrow">Delivery evidence</p>
          <h3>{publicCommitText(props.heading)}</h3>
        </div>
        <button
          type="button"
          className="hub-link-button"
          aria-expanded={props.isOpen}
          aria-controls={contentId}
          onClick={props.onToggle}
        >
          {props.isOpen ? "Hide evidence" : "Show evidence"}
        </button>
      </div>
      <p className="hub-commit-ledger__section-summary">{publicCommitText(props.summary)}</p>
      <div id={contentId} hidden={!props.isOpen}>
        <div className="hub-commit-ledger__continuity-grid">
          <dl className="hub-commit-ledger__fact-list">
            {props.evidenceRows.map((row) => (
              <div key={row.label}>
                <dt>{publicCommitText(row.label)}</dt>
                <dd>{publicCommitText(row.value)}</dd>
              </div>
            ))}
          </dl>
          <PracticeNotificationArtifactSummary
            title={publicCommitText(props.notificationPreview.title)}
            summary="Practice-facing preview remains summary-first and minimum-necessary."
            previewTitle="Notification wording"
            previewBody={publicCommitText(props.notificationPreview.body)}
            rows={publicCommitRows(props.notificationPreview.rows)}
          />
        </div>
      </div>
    </section>
  );
}

export function ImportedConfirmationReviewPanel(props: {
  heading: string;
  summary: string;
  contradictionRows: readonly { label: string; value: string }[];
  resolutionActions: readonly string[];
}) {
  return (
    <section
      className="hub-commit-ledger__review-panel"
      data-testid="ImportedConfirmationReviewPanel"
      data-imported-review-state="disputed"
    >
      <div className="hub-commit-ledger__section-head">
        <div>
          <p className="hub-eyebrow">Imported confirmation review</p>
          <h3>{publicCommitText(props.heading)}</h3>
        </div>
        <span className="hub-commit-ledger__warning-chip">Booked calmness blocked</span>
      </div>
      <p className="hub-commit-ledger__section-summary">{publicCommitText(props.summary)}</p>
      <dl className="hub-commit-ledger__fact-list">
        {props.contradictionRows.map((row) => (
          <div key={row.label}>
            <dt>{publicCommitText(row.label)}</dt>
            <dd>{publicCommitText(row.value)}</dd>
          </div>
        ))}
      </dl>
      <ul className="hub-highlight-list">
        {props.resolutionActions.map((item) => (
          <li key={item}>{publicCommitText(item)}</li>
        ))}
      </ul>
    </section>
  );
}

export function HubSupplierDriftBanner(props: {
  heading: string;
  summary: string;
  blockedActions: readonly string[];
}) {
  return (
    <section
      className="hub-commit-ledger__drift-banner"
      data-testid="HubSupplierDriftBanner"
      data-supplier-drift="true"
    >
      <div>
        <p className="hub-eyebrow">Supplier review</p>
        <h3>{publicCommitText(props.heading)}</h3>
        <p>{publicCommitText(props.summary)}</p>
      </div>
      <ul>
        {props.blockedActions.map((item) => (
          <li key={item}>{publicCommitText(item)}</li>
        ))}
      </ul>
    </section>
  );
}

export function ManualNativeBookingProofModal(props: {
  isOpen: boolean;
  heading: string;
  summary: string;
  checklist: readonly string[];
  rows: readonly { label: string; value: string }[];
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [props.isOpen]);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  if (!props.isOpen) {
    return null;
  }

  return (
    <div className="hub-commit-ledger__modal-scrim">
      <section
        className="hub-commit-ledger__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-manual-proof-heading"
        data-testid="ManualNativeBookingProofModal"
      >
        <header className="hub-commit-ledger__section-head">
          <div>
            <p className="hub-eyebrow">Manual booking proof</p>
            <h3 id="hub-manual-proof-heading" ref={headingRef} tabIndex={-1}>
              {publicCommitText(props.heading)}
            </h3>
          </div>
          <button type="button" className="hub-link-button" onClick={props.onClose}>
            Close
          </button>
        </header>
        <p className="hub-commit-ledger__section-summary">{publicCommitText(props.summary)}</p>
        <ul className="hub-highlight-list">
          {props.checklist.map((item) => (
            <li key={item}>{publicCommitText(item)}</li>
          ))}
        </ul>
        <dl className="hub-commit-ledger__fact-list">
          {props.rows.map((row) => (
            <div key={row.label}>
              <dt>{publicCommitText(row.label)}</dt>
              <dd>{publicCommitText(row.value)}</dd>
            </div>
          ))}
        </dl>
        <div className="hub-commit-ledger__modal-actions">
          <button type="button" className="hub-secondary-button" onClick={props.onClose}>
            Keep as review only
          </button>
          <button type="button" className="hub-primary-button" onClick={props.onSubmit}>
            {publicCommitText(props.submitLabel)}
          </button>
        </div>
      </section>
    </div>
  );
}

export function HubCommitConfirmationPane(props: {
  snapshot: HubShellSnapshot;
  uiState: HubCommitUiState;
  onBeginNativeBooking: (caseId: string) => void;
  onAttachManualProof: (caseId: string) => void;
  onCancelManualProof: () => void;
  onRecordSupplierConfirmation: (caseId: string) => void;
  onAcknowledgePractice: (caseId: string) => void;
  onToggleImportedReview: (caseId: string) => void;
  onToggleContinuityDrawer: (caseId: string) => void;
}) {
  const [activeArtifactActionId, setActiveArtifactActionId] =
    useState<HubArtifactActionId | null>(null);
  const [artifactReceipt, setArtifactReceipt] = useState<HubArtifactReceipt | null>(null);
  const receiptRef = useRef<HTMLElement>(null);
  const timelineAnnotationsId = `hub-commit-timeline-annotations-${props.snapshot.currentCase.caseId}`;
  const projection = useMemo(
    () =>
      resolveCrossOrgCommitScenario(
        props.snapshot.currentCase.caseId,
        props.uiState.postureByCaseId[props.snapshot.currentCase.caseId],
      ),
    [props.snapshot.currentCase.caseId, props.uiState.postureByCaseId],
  );

  if (!projection) {
    return null;
  }

  const showManualProof = props.uiState.manualProofCaseId === props.snapshot.currentCase.caseId;
  const continuityOpen = props.uiState.continuityDrawerCaseId === props.snapshot.currentCase.caseId;
  const artifactState = resolveHubArtifactState({
    projection,
    artifactModeState: props.snapshot.artifactModeState,
    activeActionId: activeArtifactActionId,
  });

  function returnToReceiptAnchor(): void {
    receiptRef.current?.focus({ preventScroll: true });
    receiptRef.current?.scrollIntoView({ block: "start", inline: "nearest" });
  }

  function onArtifactAction(actionId: string): void {
    const action = artifactState.actions.find((candidate) => candidate.actionId === actionId);
    if (!action) {
      return;
    }

    const normalizedActionId = action.actionId as HubArtifactActionId;
    setActiveArtifactActionId(normalizedActionId);
    if (action.disabled) {
      setArtifactReceipt({
        actionId: normalizedActionId,
        title: `${action.label} stayed on the approved summary`,
        summary: action.detail,
        anchorLabel: "Settlement receipt",
        state: artifactState.grantState === "blocked" ? "blocked" : "guarded",
      });
      return;
    }

    const summary =
      normalizedActionId === "preview"
        ? "Preview opened inside the same audit ledger."
        : normalizedActionId === "print"
          ? "Print status armed from the same audit ledger."
        : normalizedActionId === "download"
            ? "Proof bundle prepared without dropping the current receipt anchor."
            : normalizedActionId === "export"
              ? "Practice summary export prepared with patient and practice wording still separated."
              : "External handoff prepared with the same return anchor.";
    setArtifactReceipt({
      actionId: normalizedActionId,
      title: action.label,
      summary,
      anchorLabel: "Settlement receipt",
      state: "safe",
    });
  }

  return (
    <>
      <section
        className="hub-commit-ledger"
        data-testid="HubCommitConfirmationPane"
        data-hub-commit-posture={projection.posture}
        data-manage-posture={projection.managePosture}
        data-artifact-stage-mode={artifactState.stageMode}
        data-artifact-grant-state={artifactState.grantState}
        data-return-anchor-state={artifactReceipt?.state ?? "safe"}
        data-artifact-visual-mode={CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE}
      >
        <div className="hub-commit-ledger__masthead" data-tone={toneClass(projection.tone)}>
          <div>
            <p className="hub-eyebrow">Cross-organisation confirmation</p>
            <h2>{publicCommitText(projection.truthLabel)}</h2>
            <p>{publicCommitText(projection.summary)}</p>
          </div>
          <span className="hub-commit-ledger__evidence-chip">
            {publicCommitText(projection.evidenceStrengthLabel)}
          </span>
        </div>

        {projection.supplierDriftBanner ? (
          <HubSupplierDriftBanner
            heading={projection.supplierDriftBanner.heading}
            summary={projection.supplierDriftBanner.summary}
            blockedActions={projection.supplierDriftBanner.blockedActions}
          />
        ) : null}

          <HubCommitSettlementReceipt
            snapshot={props.snapshot}
            receiptRows={publicCommitRows(projection.settlementReceiptRows)}
            truthLabel={publicCommitText(projection.truthLabel)}
            tone={projection.tone}
            sectionRef={receiptRef}
          />

        <CrossOrgArtifactSurfaceFrame
          testId="hub-commit-artifact-frame"
          contextId="hub_commit"
          visualMode={CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE}
          tone={artifactState.tone}
          eyebrow="Approved artifact stage"
          title="Cross-organisation proof and handoff stage"
          summary="Audit proof, patient wording, practice wording, and secondary handoff actions stay inside one approved stage."
          metadata={
            <>
              <span className="cross-org-artifact-chip">{artifactState.parityLabel}</span>
              <span className="cross-org-artifact-chip">{artifactState.authorityLabel}</span>
            </>
          }
        >
          <ArtifactParityBanner
            title="Current audit artifact parity"
            summary={
              artifactState.grantState === "active"
                ? "The current audit route can keep preview, print, export, and handoff secondary and return-safe."
                : "This audit route stays summary-first while the details are quiet, table-backed, or under review."
            }
            tone={artifactState.tone}
            parityLabel={artifactState.parityLabel}
            authorityLabel={artifactState.authorityLabel}
            stageMode={artifactState.stageMode}
          />
          <NetworkConfirmationArtifactStage
            title="Booked summary and disclosure verified details"
            summary="The receipt remains primary while patient reassurance, practice informed, and practice acknowledged remain visibly distinct."
            stageMode={artifactState.stageMode}
            identityRows={publicCommitRows(projection.settlementReceiptRows)}
            truthRows={[
              {
                label: "Patient wording",
                value: publicCommitText(projection.patientView.patientFacingReference),
              },
              {
                label: "Practice informed",
                value: publicCommitText(
                  projection.practiceView.patientFacingRows[1]?.value ?? "Not yet widened",
                ),
              },
              {
                label: "Acknowledgement label",
                value: publicCommitText(projection.practiceView.acknowledgementLabel),
              },
            ]}
            previewTitle="Current audit framing"
            previewSummary={publicCommitText(projection.summary)}
          />
          <GrantBoundPreviewState
            title="Preview and handoff scope"
            summary={
              artifactState.grantState === "active"
                ? "Preview, print, download, export, and handoff remain secondary to the receipt and current queue anchor."
                : artifactState.grantState === "blocked"
                  ? "Recovery status blocks richer movement and keeps the current audit receipt primary."
                  : "The workspace remains summary-first while the details stay quiet or table-backed."
            }
            grantState={artifactState.grantState}
            rows={publicCommitRows(artifactState.grantRows)}
          />
          {artifactState.grantState !== "active" ? (
            <GovernedPlaceholderSummary
              title="Why richer artifact detail is held back"
              summary="Hidden or detached detail does not disappear silently. The audit ledger explains the ceiling and keeps the same receipt anchor."
              rows={publicCommitRows(artifactState.placeholderRows)}
              reasonLabel={
                artifactState.grantState === "blocked"
                  ? "recovery status"
                  : props.snapshot.artifactModeState === "table_only"
                    ? "table-backed summary-only"
                    : "awaiting wider verified details"
              }
            />
          ) : null}
          <CrossOrgContentLegend
            title="Cross-organisation wording legend"
            summary="Equivalent confirmed details keep equivalent phrases across patient, hub, and practice surfaces."
            items={hubContentLegendItems()}
          />
          <ArtifactHandoffActionBar
            toolbarLabel="Hub audit artifact actions"
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
              onReturn={returnToReceiptAnchor}
            />
          ) : null}
        </CrossOrgArtifactSurfaceFrame>

        <div className="hub-commit-ledger__grid">
          <div className="hub-commit-ledger__main">
            <div id={timelineAnnotationsId}>
              <AccessibleTimelineStatusAnnotations
                title="Commit timeline annotations"
                summary="Each step exposes compact status language before you move through the evidence ledger."
                annotations={commitTimelineAnnotations(projection.timelineRows)}
              />
            </div>
            <HubCommitAttemptTimeline
              rows={projection.timelineRows}
              describedBy={timelineAnnotationsId}
            />
            <section className="hub-commit-ledger__evidence">
              <div className="hub-commit-ledger__section-head">
                <div>
                  <p className="hub-eyebrow">Structured evidence</p>
                  <h3>Evidence rows</h3>
                </div>
              </div>
              <dl className="hub-commit-ledger__fact-list">
                {projection.evidenceRows.map((row) => (
                  <div key={row.label}>
                    <dt>{publicCommitText(row.label)}</dt>
                    <dd>{publicCommitText(row.value)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {projection.importedReview ? (
              <ImportedConfirmationReviewPanel
                heading={projection.importedReview.heading}
                summary={projection.importedReview.summary}
                contradictionRows={projection.importedReview.contradictionRows}
                resolutionActions={projection.importedReview.resolutionActions}
              />
            ) : null}
          </div>

          <div className="hub-commit-ledger__side">
            <PracticeVisibilityPanel
              summary={publicCommitText(projection.practiceView.summary)}
              minimumNecessaryRows={publicCommitRows(projection.practiceView.minimumNecessaryRows)}
              patientFacingRows={publicCommitRows(projection.practiceView.patientFacingRows)}
              acknowledgementState={projection.practiceView.acknowledgementState}
              acknowledgementLabel={publicCommitText(projection.practiceView.acknowledgementLabel)}
            />
            <ContinuityDeliveryEvidenceDrawer
              isOpen={continuityOpen}
              heading={publicCommitText(projection.continuityDrawer.heading)}
              summary={publicCommitText(projection.continuityDrawer.summary)}
              evidenceRows={publicCommitRows(projection.continuityDrawer.evidenceRows)}
              notificationPreview={{
                title: publicCommitText(projection.continuityDrawer.notificationPreview.title),
                body: publicCommitText(projection.continuityDrawer.notificationPreview.body),
                rows: publicCommitRows(projection.continuityDrawer.notificationPreview.rows),
              }}
              onToggle={() => props.onToggleContinuityDrawer(props.snapshot.currentCase.caseId)}
            />
          </div>
        </div>

        <div className="hub-commit-ledger__actions">
          {projection.posture === "candidate_revalidation" ? (
            <button
              type="button"
              className="hub-primary-button"
              data-testid="hub-begin-native-booking"
              onClick={() => props.onBeginNativeBooking(props.snapshot.currentCase.caseId)}
            >
              Begin native booking
            </button>
          ) : null}
          {projection.posture === "confirmation_pending" &&
          props.snapshot.currentCase.caseId === "hub-case-104" ? (
            <button
              type="button"
              className="hub-primary-button"
              data-testid="hub-record-supplier-confirmation"
              onClick={() => props.onRecordSupplierConfirmation(props.snapshot.currentCase.caseId)}
            >
              Record supplier confirmation
            </button>
          ) : null}
          {projection.posture === "booked_pending_practice_ack" ? (
            <button
              type="button"
              className="hub-primary-button"
              data-testid="hub-mark-practice-acknowledged"
              onClick={() => props.onAcknowledgePractice(props.snapshot.currentCase.caseId)}
            >
              Mark practice acknowledged
            </button>
          ) : null}
          {props.snapshot.currentCase.caseId === "hub-case-087" ? (
            <button
              type="button"
              className="hub-secondary-button"
              data-testid="hub-toggle-imported-review"
              onClick={() => props.onToggleImportedReview(props.snapshot.currentCase.caseId)}
            >
              {projection.posture === "disputed"
                ? "Return to provisional confirmation"
                : "Review imported confirmation"}
            </button>
          ) : null}
        </div>
      </section>

      {projection.manualProof ? (
        <ManualNativeBookingProofModal
          isOpen={showManualProof}
          heading={projection.manualProof.reviewHeading}
          summary={projection.manualProof.reviewSummary}
          checklist={projection.manualProof.checklist}
          rows={projection.manualProof.reviewRows}
          submitLabel={projection.manualProof.submitLabel}
          onClose={props.onCancelManualProof}
          onSubmit={() => props.onAttachManualProof(props.snapshot.currentCase.caseId)}
        />
      ) : null}
    </>
  );
}
