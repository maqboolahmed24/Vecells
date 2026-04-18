import { startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import {
  PATIENT_RECORDS_COMMUNICATIONS_TASK_ID,
  PATIENT_RECORDS_COMMUNICATIONS_VISUAL_MODE,
  isRecordsCommunicationsPath,
  resolveRecordsCommunicationsEntry,
  type ConversationCallbackCardProjection,
  type ConversationSubthreadProjection,
  type PatientCommunicationsTimelineProjection,
  type PatientConversationCluster,
  type PatientReceiptEnvelope,
  type PatientRecordArtifactProjection,
  type PatientRecordSurfaceContext,
  type PatientResultInterpretationProjection,
  type RecordArtifactParityWitness,
  type RecordSummaryItem,
  type RecordsCommunicationsEntryProjection,
  type VisualizationParityProjection,
  type VisualizationTableContract,
} from "./patient-records-communications.model";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";

export { isRecordsCommunicationsPath };

type RecordGroup = RecordSummaryItem["groupRef"];
type ChartMode = "chart" | "table";

const recordGroupLabels: Record<RecordGroup, string> = {
  latest_updates: "Latest updates",
  test_results: "Test results",
  medicines_allergies: "Medicines and allergies",
  conditions_care_plans: "Conditions and care plans",
  letters_documents: "Letters and documents",
  action_needed: "Action needed",
};

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function Icon({
  name,
}: {
  name: "record" | "message" | "source" | "warning" | "table" | "return";
}) {
  return (
    <span
      className={`patient-correspondence__icon patient-correspondence__icon--${name}`}
      aria-hidden
    />
  );
}

function useRecordsCommunicationsController() {
  const ownerWindow = safeWindow();
  const [entry, setEntry] = useState<RecordsCommunicationsEntryProjection>(() =>
    resolveRecordsCommunicationsEntry(ownerWindow?.location.pathname ?? "/records"),
  );
  const [chartMode, setChartMode] = useState<ChartMode>("chart");
  const [announcement, setAnnouncement] = useState("Records and messages surface loaded.");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const onPopState = () => {
      startTransition(() => {
        const next = resolveRecordsCommunicationsEntry(
          ownerWindow?.location.pathname ?? "/records",
        );
        setEntry(next);
        setAnnouncement(`${next.routeKey.replaceAll("_", " ")} restored.`);
      });
    };
    ownerWindow?.addEventListener("popstate", onPopState);
    return () => ownerWindow?.removeEventListener("popstate", onPopState);
  }, [ownerWindow]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (entry.visualizationParity.parityState !== "visual_and_table") setChartMode("table");
  }, [entry.routeKey, entry.visualizationParity.parityState]);

  function navigate(pathname: string, replace = false): void {
    if (!isRecordsCommunicationsPath(pathname)) {
      if (replace) ownerWindow?.location.replace(pathname);
      else ownerWindow?.location.assign(pathname);
      return;
    }
    startTransition(() => {
      const next = resolveRecordsCommunicationsEntry(pathname);
      setEntry(next);
      if (replace) ownerWindow?.history.replaceState({}, "", pathname);
      else ownerWindow?.history.pushState({}, "", pathname);
      setAnnouncement(`${next.routeKey.replaceAll("_", " ")} opened.`);
    });
  }

  return { entry, chartMode, announcement, headingRef, navigate, setChartMode };
}

function CorrespondenceShell({
  entry,
  headingRef,
  announcement,
  children,
  onNavigate,
}: {
  entry: RecordsCommunicationsEntryProjection;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  announcement: string;
  children: ReactNode;
  onNavigate: (pathname: string) => void;
}) {
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: entry.pathname,
  });

  return (
    <div
      className="patient-correspondence"
      data-testid="Health_Record_Communications_Route"
      data-task-id={PATIENT_RECORDS_COMMUNICATIONS_TASK_ID}
      data-visual-mode={PATIENT_RECORDS_COMMUNICATIONS_VISUAL_MODE}
      data-route-key={entry.routeKey}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-cause-class={phase2Context.causeClass}
      data-recovery-class={phase2Context.recoveryClass}
      data-canonical-status-label={phase2Context.canonicalStatusLabel}
      data-supported-testids="record-overview-section result-interpretation-hero trend-parity-switcher record-artifact-panel record-visibility-placeholder conversation-cluster-list conversation-braid message-preview-card receipt-state-chip delivery-dispute-notice"
    >
      <header className="patient-correspondence__top-band" data-testid="records-messages-top-band">
        <button
          type="button"
          className="patient-correspondence__brand"
          onClick={() => onNavigate("/home")}
        >
          <span>
            <VecellLogoWordmark
              aria-hidden="true"
              className="patient-correspondence__brand-wordmark"
            />
            <small>{entry.maskedPatientRef}</small>
          </span>
        </button>
        <nav aria-label="Records and messages navigation" className="patient-correspondence__nav">
          <button
            type="button"
            data-current={entry.activeSection === "records"}
            onClick={() => onNavigate("/records")}
          >
            <Icon name="record" />
            <span>Records</span>
          </button>
          <button
            type="button"
            data-current={entry.activeSection === "messages"}
            onClick={() => onNavigate("/messages")}
          >
            <Icon name="message" />
            <span>Messages</span>
          </button>
          <button type="button" onClick={() => onNavigate("/requests/request_211_a")}>
            <Icon name="return" />
            <span>Request</span>
          </button>
        </nav>
      </header>
      <PatientSupportPhase2Bridge context={phase2Context} />
      <main className="patient-correspondence__main">
        <h1 ref={headingRef} tabIndex={-1} className="patient-correspondence__route-title">
          {entry.activeSection === "records" ? "Health record" : "Messages"}
        </h1>
        {children}
      </main>
      <div
        className="patient-correspondence__live"
        aria-live="polite"
        data-testid="records-messages-live-region"
      >
        {announcement}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  copy,
  projection,
}: {
  title: string;
  copy: string;
  projection: string;
}) {
  return (
    <section
      className="patient-correspondence__section-header"
      data-testid="record-message-section-header"
    >
      <span>{projection}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}

export function RecordOverviewSection({
  entry,
  onNavigate,
}: {
  entry: RecordsCommunicationsEntryProjection;
  onNavigate: (pathname: string) => void;
}) {
  const groups = useMemo(() => {
    return Object.entries(recordGroupLabels).map(([groupRef, label]) => ({
      groupRef: groupRef as RecordGroup,
      label,
      items: entry.recordSummaryItems.filter((item) => item.groupRef === groupRef),
    }));
  }, [entry.recordSummaryItems]);

  return (
    <div className="patient-correspondence__records" data-testid="record-overview-section">
      <SectionHeader
        title="Health record"
        copy="Summary-first record groups keep source, release, and parity labels visible before any detailed result opens."
        projection={entry.recordSurfaceContext.projectionName}
      />
      <div className="patient-correspondence__record-groups">
        {groups.map((group) => (
          <section
            key={group.groupRef}
            className="patient-correspondence__record-group"
            aria-labelledby={`${group.groupRef}-title`}
          >
            <h3 id={`${group.groupRef}-title`}>{group.label}</h3>
            <div className="patient-correspondence__rows">
              {group.items.map((item) => (
                <button
                  key={item.itemRef}
                  type="button"
                  className="patient-correspondence__record-row"
                  data-testid={`record-overview-row-${item.itemRef}`}
                  onClick={() => onNavigate(item.routeRef)}
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.summary}</small>
                  </span>
                  <span
                    className={`patient-correspondence__chip patient-correspondence__chip--${item.releaseState}`}
                  >
                    {item.placeholderVisible
                      ? "Placeholder visible"
                      : item.sourceAuthorityState.replaceAll("_", " ")}
                  </span>
                  <em>{item.updatedLabel}</em>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ResultInterpretationHero({
  result,
  context,
  witness,
}: {
  result: PatientResultInterpretationProjection;
  context: PatientRecordSurfaceContext;
  witness: RecordArtifactParityWitness;
}) {
  return (
    <section
      className="patient-correspondence__result-hero"
      data-testid="result-interpretation-hero"
      data-projection-name={result.projectionName}
      aria-labelledby="result-interpretation-title"
    >
      <span className="patient-correspondence__kicker">PatientResultInterpretationProjection</span>
      <h2 id="result-interpretation-title">{result.displayName}</h2>
      <p>{result.interpretationSummary}</p>
      <dl className="patient-correspondence__summary-list">
        <div>
          <dt>Latest value</dt>
          <dd>
            {result.displayValue} {result.displayUnit}
          </dd>
        </div>
        <div>
          <dt>Comparison</dt>
          <dd>{result.comparisonState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{result.sourceOrganisationRef}</dd>
        </div>
        <div>
          <dt>Parity witness</dt>
          <dd>{witness.sourceAuthorityState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      <small>{context.experienceContinuityEvidenceRef}</small>
    </section>
  );
}

function ResultDetailPage({
  entry,
  chartMode,
  setChartMode,
}: {
  entry: RecordsCommunicationsEntryProjection;
  chartMode: ChartMode;
  setChartMode: (mode: ChartMode) => void;
}) {
  if (entry.recordSurfaceContext.surfaceState === "gated_placeholder") {
    return (
      <div className="patient-correspondence__layout">
        <RecordVisibilityPlaceholder entry={entry} />
        <RecordContextRail entry={entry} />
      </div>
    );
  }
  return (
    <div className="patient-correspondence__layout">
      <div className="patient-correspondence__primary-column">
        <ResultInterpretationHero
          result={entry.resultInterpretation}
          context={entry.recordSurfaceContext}
          witness={entry.parityWitness}
        />
        <section
          className="patient-correspondence__result-order"
          data-testid="result-detail-fixed-order"
        >
          {entry.resultInterpretation.detailBlocks.map((block, index) => (
            <article key={block.blockId} data-block-id={block.blockId}>
              <span>{index + 1}</span>
              <div>
                <h3>{block.heading}</h3>
                <p>{block.body}</p>
              </div>
            </article>
          ))}
        </section>
        <TrendParitySwitcher
          parity={entry.visualizationParity}
          table={entry.visualizationTable}
          mode={chartMode}
          onModeChange={setChartMode}
        />
      </div>
      <RecordContextRail entry={entry} />
    </div>
  );
}

export function TrendParitySwitcher({
  parity,
  table,
  mode,
  onModeChange,
}: {
  parity: VisualizationParityProjection;
  table: VisualizationTableContract;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
}) {
  const chartAllowed = parity.parityState === "visual_and_table";
  const effectiveMode = chartAllowed ? mode : "table";
  return (
    <section
      className="patient-correspondence__trend"
      data-testid="trend-parity-switcher"
      data-projection-name={parity.projectionName}
      aria-labelledby="trend-title"
    >
      <div className="patient-correspondence__split-title">
        <div>
          <span className="patient-correspondence__kicker">VisualizationParityProjection</span>
          <h3 id="trend-title">Trend evidence</h3>
        </div>
        <div className="patient-correspondence__segmented" role="group" aria-label="Trend display">
          <button
            type="button"
            disabled={!chartAllowed}
            data-current={effectiveMode === "chart"}
            onClick={() => onModeChange("chart")}
          >
            Chart
          </button>
          <button
            type="button"
            data-current={effectiveMode === "table"}
            onClick={() => onModeChange("table")}
          >
            Table
          </button>
        </div>
      </div>
      {!chartAllowed ? (
        <p className="patient-correspondence__notice" data-testid="chart-demotion-notice">
          Chart view is not available because parity is {parity.parityState.replaceAll("_", " ")}.
          The table keeps the same units and selection context.
        </p>
      ) : null}
      {effectiveMode === "chart" ? (
        <div className="patient-correspondence__chart" aria-label={`Chart using ${table.units}`}>
          {table.rows.map((row, index) => (
            <span key={row.collectedAt} style={{ height: `${index === 0 ? 82 : 64}%` }}>
              <strong>{row.value}</strong>
              <small>{row.collectedAt}</small>
            </span>
          ))}
        </div>
      ) : null}
      <table data-testid="record-result-table">
        <caption>Table-first result values, units, reference range, and source</caption>
        <thead>
          <tr>
            <th scope="col">Collected</th>
            <th scope="col">Value</th>
            <th scope="col">Range</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.collectedAt}>
              <td>{row.collectedAt}</td>
              <td>
                {row.value} {row.unit}
              </td>
              <td>{row.referenceRange}</td>
              <td>{row.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function RecordArtifactPanel({
  artifact,
  witness,
}: {
  artifact: PatientRecordArtifactProjection;
  witness: RecordArtifactParityWitness;
}) {
  return (
    <section
      className="patient-correspondence__artifact"
      data-testid="record-artifact-panel"
      data-projection-name={artifact.projectionName}
      aria-labelledby="record-artifact-title"
    >
      <span className="patient-correspondence__kicker">PatientRecordArtifactProjection</span>
      <h2 id="record-artifact-title">
        {artifact.presentationMode === "governed_download"
          ? "Source document summary"
          : "Structured document summary"}
      </h2>
      <p>
        {artifact.sourceAuthorityState === "source_only"
          ? "The source artifact is available, but the structured summary is labelled provisional."
          : "The structured summary matches the current source artifact and parity witness."}
      </p>
      <dl className="patient-correspondence__summary-list">
        <div>
          <dt>Source authority</dt>
          <dd>{artifact.sourceAuthorityState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Summary parity</dt>
          <dd>{artifact.summaryParityState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Presentation</dt>
          <dd>{artifact.presentationMode.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Witness</dt>
          <dd>{witness.recordArtifactParityWitnessRef}</dd>
        </div>
      </dl>
      <button type="button" className="patient-correspondence__secondary-action">
        <Icon name="source" />
        Source file handoff
      </button>
    </section>
  );
}

function DocumentDetailPage({ entry }: { entry: RecordsCommunicationsEntryProjection }) {
  if (entry.recordSurfaceContext.surfaceState === "gated_placeholder") {
    return (
      <div className="patient-correspondence__layout">
        <RecordVisibilityPlaceholder entry={entry} />
        <RecordContextRail entry={entry} />
      </div>
    );
  }
  return (
    <div className="patient-correspondence__layout">
      <div className="patient-correspondence__primary-column">
        <RecordArtifactPanel artifact={entry.recordArtifact} witness={entry.parityWitness} />
      </div>
      <RecordContextRail entry={entry} />
    </div>
  );
}

export function RecordVisibilityPlaceholder({
  entry,
}: {
  entry: RecordsCommunicationsEntryProjection;
}) {
  return (
    <section
      className="patient-correspondence__placeholder"
      data-testid="record-visibility-placeholder"
      data-projection-name="PatientRecordContinuityState"
      aria-labelledby="record-placeholder-title"
      role="status"
    >
      <Icon name="warning" />
      <span className="patient-correspondence__kicker">
        {entry.parityWitness.recordGateState.replaceAll("_", " ")}
      </span>
      <h2 id="record-placeholder-title">This record is visible as a governed placeholder</h2>
      <p>
        The item exists and the selected anchor is preserved. Detail, chart, preview, and download
        controls stay limited until the release, step-up, or visibility posture permits them.
      </p>
      <dl className="patient-correspondence__summary-list">
        <div>
          <dt>Anchor</dt>
          <dd>{entry.recordContinuity.selectedAnchorRef}</dd>
        </div>
        <div>
          <dt>Continuation</dt>
          <dd>{entry.recordContinuity.continuationState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Next safe step</dt>
          <dd>{entry.followUpEligibility.eligibilityState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
    </section>
  );
}

function RecordContextRail({ entry }: { entry: RecordsCommunicationsEntryProjection }) {
  return (
    <aside className="patient-correspondence__context" data-testid="record-context-rail">
      <h2>Record context</h2>
      <dl>
        <div>
          <dt>Surface tuple</dt>
          <dd>{entry.recordSurfaceContext.surfaceTupleHash}</dd>
        </div>
        <div>
          <dt>Return bundle</dt>
          <dd>{entry.recordReturnBundle.requestReturnBundleRef}</dd>
        </div>
        <div>
          <dt>Follow-up</dt>
          <dd>{entry.followUpEligibility.eligibilityState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Insight alias</dt>
          <dd>{entry.resultInsightAlias.aliasStrategy}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function ConversationClusterList({
  timeline,
  onNavigate,
}: {
  timeline: PatientCommunicationsTimelineProjection;
  onNavigate: (pathname: string) => void;
}) {
  return (
    <div className="patient-correspondence__messages" data-testid="conversation-cluster-list">
      <SectionHeader
        title="Messages"
        copy="Conversation clusters are grouped by request or care episode, with placeholders and delivery truth kept in the row."
        projection={timeline.projectionName}
      />
      <div className="patient-correspondence__cluster-list">
        {timeline.clusters.map((cluster) => (
          <MessagePreviewCard
            key={cluster.clusterRef}
            cluster={cluster}
            onOpen={() => onNavigate(cluster.clusterRouteRef)}
          />
        ))}
      </div>
    </div>
  );
}

export function MessagePreviewCard({
  cluster,
  onOpen,
}: {
  cluster: PatientConversationCluster;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="patient-correspondence__message-row"
      data-testid="message-preview-card"
      data-cluster-ref={cluster.clusterRef}
      onClick={onOpen}
    >
      <span>
        <strong>{cluster.previewDigest.title}</strong>
        <small>
          {cluster.visibility.placeholderContractRef
            ? `Preview limited: ${cluster.visibility.previewMode.replaceAll("_", " ")}`
            : cluster.previewDigest.preview}
        </small>
      </span>
      <span
        className={`patient-correspondence__chip patient-correspondence__chip--${cluster.previewDigest.state}`}
      >
        {cluster.previewDigest.state.replaceAll("_", " ")}
      </span>
      <em>{cluster.previewDigest.updatedLabel}</em>
    </button>
  );
}

function ClusterShellPage({
  entry,
  onNavigate,
}: {
  entry: RecordsCommunicationsEntryProjection;
  onNavigate: (pathname: string) => void;
}) {
  return (
    <div className="patient-correspondence__layout">
      <div className="patient-correspondence__primary-column">
        <ConversationBraid entry={entry} onNavigate={onNavigate} />
      </div>
      <aside className="patient-correspondence__context" data-testid="message-context-rail">
        <h2>Conversation context</h2>
        <dl>
          <div>
            <dt>Cluster</dt>
            <dd>{entry.activeCluster.clusterRef}</dd>
          </div>
          <div>
            <dt>Thread tuple</dt>
            <dd>{entry.conversationThread.threadTupleHash}</dd>
          </div>
          <div>
            <dt>Visibility</dt>
            <dd>{entry.activeCluster.visibility.previewMode.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt>Composer</dt>
            <dd>{entry.composerLease.leaseState.replaceAll("_", " ")}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

export function ConversationBraid({
  entry,
  onNavigate,
}: {
  entry: RecordsCommunicationsEntryProjection;
  onNavigate: (pathname: string) => void;
}) {
  const cluster = entry.activeCluster;
  const repairRequired = entry.composerLease.leaseState === "blocked";
  const requestConversationPath =
    cluster.governingObjectRef.startsWith("request_")
      ? `/requests/${cluster.governingObjectRef}/conversation/messages?origin=messages`
      : null;
  return (
    <section
      className="patient-correspondence__braid"
      data-testid="conversation-braid"
      data-projection-name={entry.conversationThread.projectionName}
      aria-labelledby="conversation-braid-title"
    >
      <span className="patient-correspondence__kicker">ConversationThreadProjection</span>
      <h2 id="conversation-braid-title">{cluster.previewDigest.title}</h2>
      <div className="patient-correspondence__next-action" data-testid="conversation-next-action">
        <strong>
          {repairRequired
            ? "Repair needed before reply or callback can continue"
            : "Next action is kept in this conversation"}
        </strong>
        <p>
          {repairRequired
            ? "The blocked action remains visible. Live reply and callback reassurance are suppressed until the dependency rebounds."
            : "Local acknowledgement is visible, but settlement waits for the authoritative receipt chain."}
        </p>
        {repairRequired ? (
          <button
            type="button"
            onClick={() => onNavigate(`/messages/${cluster.clusterRef}/repair`)}
          >
            Repair contact route
          </button>
        ) : (
          <div className="patient-correspondence__button-row">
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  `/messages/${cluster.clusterRef}/thread/${entry.conversationThread.threadId}`,
                )
              }
            >
              Open thread
            </button>
            {requestConversationPath ? (
              <button
                type="button"
                className="patient-correspondence__secondary-action"
                data-testid="message-open-request-conversation"
                onClick={() => onNavigate(requestConversationPath)}
              >
                Open request conversation
              </button>
            ) : null}
          </div>
        )}
      </div>
      <ConversationCallbackCard
        card={entry.callbackCard}
        status={entry.callbackStatus}
        onOpen={() => onNavigate(`/messages/${cluster.clusterRef}/callback/callback_217`)}
      />
      <ol className="patient-correspondence__timeline">
        {entry.subthreads.map((subthread) => (
          <ConversationEvent
            key={subthread.subthreadRef}
            subthread={subthread}
            receipt={entry.receiptEnvelope}
          />
        ))}
      </ol>
      {entry.receiptEnvelope.deliveryRiskState === "failed" ||
      entry.receiptEnvelope.deliveryRiskState === "disputed" ? (
        <DeliveryDisputeNotice receipt={entry.receiptEnvelope} />
      ) : null}
    </section>
  );
}

function ConversationCallbackCard({
  card,
  status,
  onOpen,
}: {
  card: ConversationCallbackCardProjection;
  status: {
    projectionName: "PatientCallbackStatusProjection";
    dominantActionRef: string;
    windowRiskState: string;
  };
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="patient-correspondence__callback-card"
      data-testid="conversation-callback-card"
      data-projection-name={card.projectionName}
      onClick={onOpen}
    >
      <span>
        <strong>Callback status</strong>
        <small>
          {card.sourceProjection} keeps the callback card compatible with{" "}
          {card.callbackExpectationEnvelopeRef}.
        </small>
      </span>
      <ReceiptStateChip label={status.windowRiskState.replaceAll("_", " ")} />
    </button>
  );
}

function ConversationEvent({
  subthread,
  receipt,
}: {
  subthread: ConversationSubthreadProjection;
  receipt: PatientReceiptEnvelope;
}) {
  return (
    <li className="patient-correspondence__event">
      <time>{subthread.timestampLabel}</time>
      <div>
        <h3>{subthread.title}</h3>
        <p>{subthread.body}</p>
        <ReceiptStateChip label={receipt.receiptLabel} />
      </div>
    </li>
  );
}

export function ReceiptStateChip({ label }: { label: string }) {
  return (
    <span className="patient-correspondence__receipt" data-testid="receipt-state-chip">
      {label}
    </span>
  );
}

export function DeliveryDisputeNotice({ receipt }: { receipt: PatientReceiptEnvelope }) {
  return (
    <section
      className="patient-correspondence__dispute"
      data-testid="delivery-dispute-notice"
      data-projection-name={receipt.projectionName}
      role="status"
    >
      <Icon name="warning" />
      <div>
        <h3>{receipt.receiptLabel}</h3>
        <p>
          Delivery failure and provider-channel dispute remain visible in the same chronology until
          repaired.
        </p>
      </div>
    </section>
  );
}

export default function PatientRecordsCommunicationsApp() {
  const { entry, chartMode, announcement, headingRef, navigate, setChartMode } =
    useRecordsCommunicationsController();

  return (
    <CorrespondenceShell
      entry={entry}
      headingRef={headingRef}
      announcement={announcement}
      onNavigate={navigate}
    >
      {entry.routeKey === "records_overview" ? (
        <RecordOverviewSection entry={entry} onNavigate={navigate} />
      ) : entry.routeKey === "result_detail" ? (
        <ResultDetailPage entry={entry} chartMode={chartMode} setChartMode={setChartMode} />
      ) : entry.routeKey === "document_detail" ? (
        <DocumentDetailPage entry={entry} />
      ) : entry.routeKey === "messages_index" ? (
        <ConversationClusterList timeline={entry.communicationsTimeline} onNavigate={navigate} />
      ) : (
        <ClusterShellPage entry={entry} onNavigate={navigate} />
      )}
    </CorrespondenceShell>
  );
}
